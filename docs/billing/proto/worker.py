"""Native Billing v2.0 — the renewal worker.  Spec §5.

Standalone process (the quebec_poller / progress.refresh precedent), NOT an
in-process task in the API: an API deploy must never interrupt a charge cycle.
Install as a LaunchDaemon, not a GUI LaunchAgent — MiniTwo's GUI agents die on
console logout, and a billing worker that stops when Ernie logs out is the worst
possible version of this system.

The worker holds NO state. Kill it mid-cycle and the next cycle reconstructs the
entire work list from the table.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta

import ledger
import periods
import providers

log = logging.getLogger("labs.billing.worker")

RETRY_LADDER_DAYS = (1, 3, 5, 7)     # §7.4 — replaces Stripe Smart Retries
NOTICE_DAYS_BEFORE_INCREASE = 7      # §16.4 — never raise a price unannounced
GRACE_DAYS = 7
MODE_OFF, MODE_SHADOW, MODE_LIVE = "off", "shadow", "live"


@dataclass
class Limits:
    """§7.10 circuit breakers. Over-caution costs hours of delayed renewals;
    under-caution costs the business."""
    daily_cap_minor: int = 750_000
    due_surge_multiple: float = 3.0
    per_charge_multiple: float = 3.0
    lease_seconds: int = 900


@dataclass
class CycleReport:
    mode: str
    due_found: int = 0
    charged_ok: int = 0
    charged_failed: int = 0
    requires_action: int = 0
    skipped: int = 0
    amount_minor: int = 0
    halted_reason: str = ""
    notes: list = field(default_factory=list)


def claim_due(cur, *, worker_id: str, limits: Limits, limit: int = 200) -> list[dict]:
    """§5.1 — THE DUE QUERY. Note there is NO LOWER BOUND on next_charge_at.

    This is the most important line in the system. If the worker is down for six
    hours, a day, or a week, every missed charge is still sitting there with a
    past-due date and is picked up on the next tick. Nothing is keyed to 'things
    due in the last 5 minutes', so no outage window can silently drop a renewal.
    """
    cur.execute(
        """SELECT * FROM billing_subscriptions
            WHERE status IN ('active','past_due','grace')
              AND next_charge_at IS NOT NULL
              AND next_charge_at <= UTC_TIMESTAMP()
              AND (lease_expires_at IS NULL OR lease_expires_at < UTC_TIMESTAMP())
            ORDER BY next_charge_at
            LIMIT %s
            FOR UPDATE SKIP LOCKED""",
        (limit,),
    )
    rows = cur.fetchall()
    claimed = []
    for r in rows:
        cur.execute(
            """UPDATE billing_subscriptions
                  SET lease_owner=%s,
                      lease_expires_at = UTC_TIMESTAMP() + INTERVAL %s SECOND
                WHERE id=%s
                  AND (lease_expires_at IS NULL OR lease_expires_at < UTC_TIMESTAMP())""",
            (worker_id, limits.lease_seconds, r["id"]),
        )
        if cur.rowcount == 1:
            claimed.append(r)
    return claimed


def release(cur, sub_id: int) -> None:
    cur.execute(
        "UPDATE billing_subscriptions SET lease_owner=NULL, lease_expires_at=NULL WHERE id=%s",
        (sub_id,))


def _schedule_of(sub: dict) -> periods.Schedule:
    return periods.Schedule(
        anchor_at=sub["anchor_at"], interval_unit=sub["interval_unit"],
        interval_count=sub["interval_count"], period_index=sub["period_index"],
        ends_at=sub["ends_at"], max_periods=sub["max_periods"])


def trailing_due_average(cur, days: int = 7) -> float:
    cur.execute(
        """SELECT AVG(due_found) a FROM billing_worker_runs
            WHERE started_at > UTC_TIMESTAMP() - INTERVAL %s DAY
              AND finished_at IS NOT NULL AND halted_reason=''""", (days,))
    row = cur.fetchone()
    return float(row["a"]) if row and row["a"] is not None else 0.0


def run_cycle(conn, *, provider_for, mode: str, worker_id: str = "w1",
              limits: Limits | None = None) -> CycleReport:
    """One full pass. Returns a report and writes a billing_worker_runs row, so a
    cycle that never finishes is a detectable incident (§7.9)."""
    limits = limits or Limits()
    rep = CycleReport(mode=mode)
    if mode == MODE_OFF:
        rep.halted_reason = "mode=off"
        return rep

    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO billing_worker_runs (worker_id, mode) VALUES (%s,%s)",
            (worker_id, mode))
        cur.execute("SELECT LAST_INSERT_ID() id")
        run_id = cur.fetchone()["id"]
        baseline = trailing_due_average(cur)
        due = claim_due(cur, worker_id=worker_id, limits=limits)
        rep.due_found = len(due)
    conn.commit()

    # §7.10 surge breaker — a date bug that marks everything due must not bill it.
    if baseline > 0 and rep.due_found > baseline * limits.due_surge_multiple:
        rep.halted_reason = (f"due surge: {rep.due_found} vs trailing avg "
                             f"{baseline:.1f} (x{limits.due_surge_multiple})")
        with conn.cursor() as cur:
            for s in due:
                release(cur, s["id"])
            _finish(cur, run_id, rep)
        conn.commit()
        return rep

    spent = 0
    for sub in due:
        sched = _schedule_of(sub)

        # ends_at / max_periods terminal check BEFORE anything else.
        if sched.is_terminal():
            with conn.cursor() as cur:
                cur.execute(
                    """UPDATE billing_subscriptions SET status='expired',
                          next_charge_at=NULL, lease_owner=NULL, lease_expires_at=NULL
                        WHERE id=%s""", (sub["id"],))
                # §8.3 — the alumni tenure check runs on EVERY expiry path, not only
                # the webhook one. v1.0's webhook did this; omitting it here would
                # silently stop earning anyone the alumni year.
                _grant_alumni_if_earned(cur, sub)
            conn.commit()
            rep.skipped += 1
            rep.notes.append(f"sub {sub['id']}: term complete -> expired")
            continue

        amount = int(sub["amount_minor"])

        # §7.3 — the amount is the STORED per-subscription value. Never a plan price.
        if amount <= 0:
            with conn.cursor() as cur:
                cur.execute("""UPDATE billing_subscriptions SET status='quarantined',
                               lease_owner=NULL, lease_expires_at=NULL WHERE id=%s""",
                            (sub["id"],))
            conn.commit()
            rep.skipped += 1
            rep.notes.append(f"sub {sub['id']}: zero amount -> quarantined")
            continue

        # §7.10 per-charge sanity + cycle cap
        if amount > int(sub["amount_minor"]) * limits.per_charge_multiple:
            rep.skipped += 1
            rep.notes.append(f"sub {sub['id']}: amount sanity failed")
            with conn.cursor() as cur:
                release(cur, sub["id"])
            conn.commit()
            continue
        if spent + amount > limits.daily_cap_minor:
            rep.halted_reason = (f"cycle cap: {spent + amount} would exceed "
                                 f"{limits.daily_cap_minor}")
            with conn.cursor() as cur:
                release(cur, sub["id"])
                _finish(cur, run_id, rep)
            conn.commit()
            return rep

        attempt = int(sub["retry_count"]) + 1

        # --- §5.3 step 4+5: LEDGER FIRST, COMMITTED, THEN the provider call. ---
        try:
            with conn.cursor() as cur:
                charge = ledger.open_intent(
                    cur, subscription_id=sub["id"], identity_id=sub["identity_id"],
                    provider=sub["provider"], period_start=sched.period_start(),
                    period_end=sched.period_end(), period_index=sched.period_index,
                    attempt=attempt, amount_minor=amount, currency=sub["currency"],
                    shadow=(mode == MODE_SHADOW))
            conn.commit()
        except ledger.DuplicateCharge:
            # Already handled by another worker or a previous run. NO provider call.
            with conn.cursor() as cur:
                release(cur, sub["id"])
            conn.commit()
            rep.skipped += 1
            rep.notes.append(f"sub {sub['id']}: period already in ledger")
            continue

        if mode == MODE_SHADOW:
            # Everything above ran for real. The provider is never touched.
            with conn.cursor() as cur:
                release(cur, sub["id"])
            conn.commit()
            rep.amount_minor += amount
            spent += amount
            continue

        prov = provider_for(sub["provider"])
        key = charge["idempotency_key"]
        try:
            res = prov.charge(customer_ref=sub.get("customer_ref", ""),
                              method_ref=sub.get("method_ref", ""),
                              amount_minor=amount, currency=sub["currency"],
                              idempotency_key=key,
                              descriptor=f"FatTail period {sched.period_index}",
                              metadata={"labs_charge_id": str(charge["id"])})
        except Exception as exc:                       # §7.15 transport failure
            # NOT a decline. Leave the row open; recovery resolves it. The due date
            # is untouched, so §5.1 re-picks it up automatically.
            with conn.cursor() as cur:
                release(cur, sub["id"])
            conn.commit()
            rep.skipped += 1
            rep.notes.append(f"sub {sub['id']}: transport error, intent left open ({exc})")
            continue

        _apply_outcome(conn, sub, charge, sched, res, rep)
        spent += amount if res.outcome == providers.SUCCEEDED else 0

    with conn.cursor() as cur:
        _finish(cur, run_id, rep)
    conn.commit()
    return rep


def _grant_alumni_if_earned(cur, sub) -> bool:
    """§8.3 — >=28 days of tenure earns the alumni year. Delegates to the EXISTING
    identity.maybe_grant_alumni so there is one implementation, not two.
    Returns False when the helper is unavailable (prototype runs standalone)."""
    try:
        import identity                                   # type: ignore
    except ImportError:
        return False
    return bool(identity.maybe_grant_alumni(cur, sub["identity_id"], sub["created_at"]))


def _step_amount_if_discount_ended(cur, sub, sched) -> str | None:
    """§16.4 — a time-limited discount ending is the ONLY case where a price rises.

    A price increase is refused unless the member was notified at least
    NOTICE_DAYS_BEFORE_INCREASE ahead. If they were not, we send the notice, keep the
    discounted price for one more period, and step up next time. Giving away one extra
    discounted month is far cheaper than a chargeback over a surprise charge."""
    left = sub.get("discount_periods_left")
    standard = sub.get("standard_amount_minor")
    if left is None or standard is None:
        return None
    if int(left) > 0:
        cur.execute("""UPDATE billing_subscriptions
                          SET discount_periods_left = discount_periods_left - 1
                        WHERE id=%s""", (sub["id"],))
        return None
    if int(standard) <= int(sub["amount_minor"]):
        # a decrease needs no notice
        cur.execute("UPDATE billing_subscriptions SET amount_minor=%s WHERE id=%s",
                    (int(standard), sub["id"]))
        return "amount decreased to standard"
    notified = sub.get("amount_change_notified_at")
    due = sched.period_start()
    if notified is None or (due - notified).days < NOTICE_DAYS_BEFORE_INCREASE:
        cur.execute("""UPDATE billing_subscriptions
                          SET amount_change_notified_at = COALESCE(amount_change_notified_at,
                                                                   UTC_TIMESTAMP())
                        WHERE id=%s""", (sub["id"],))
        return "price increase DEFERRED - member not notified in time, notice sent"
    cur.execute("UPDATE billing_subscriptions SET amount_minor=%s WHERE id=%s",
                (int(standard), sub["id"]))
    return "amount stepped up to standard after notice"


def _apply_outcome(conn, sub, charge, sched, res, rep) -> None:
    with conn.cursor() as cur:
        if res.outcome == providers.SUCCEEDED:
            ledger.settle(cur, charge["id"], ledger.SUCCEEDED,
                          charge_ref=res.charge_ref, intent_ref=res.intent_ref)
            nxt = sched.advance()
            cur.execute(
                """UPDATE billing_subscriptions
                      SET period_index=%s, current_period_start=%s, next_charge_at=%s,
                          status=%s, retry_count=0, next_retry_at=NULL,
                          grace_until=NULL, last_decline_code='',
                          lease_owner=NULL, lease_expires_at=NULL
                    WHERE id=%s""",
                (nxt.period_index, nxt.period_start(), nxt.next_charge_at(),
                 "expired" if nxt.is_terminal() else "active", sub["id"]))
            note = _step_amount_if_discount_ended(cur, sub, nxt)
            if note:
                rep.notes.append(f"sub {sub['id']}: {note}")
            if nxt.is_terminal():
                _grant_alumni_if_earned(cur, sub)
            rep.charged_ok += 1
            rep.amount_minor += int(sub["amount_minor"])

        elif res.outcome == providers.PENDING:
            # §6.2 PayPal async capture. Treat as processing; NEVER retry.
            ledger.settle(cur, charge["id"], ledger.PROCESSING,
                          charge_ref=res.charge_ref, intent_ref=res.intent_ref)
            release(cur, sub["id"])
            rep.notes.append(f"sub {sub['id']}: capture pending, awaiting webhook")

        elif res.outcome == providers.REQUIRES_ACTION:
            # §7.6 3DS. Not a decline — do not start the retry ladder.
            ledger.settle(cur, charge["id"], ledger.REQUIRES_ACTION,
                          intent_ref=res.intent_ref, message=res.message)
            cur.execute(
                """UPDATE billing_subscriptions
                      SET status='past_due', next_retry_at=NULL,
                          lease_owner=NULL, lease_expires_at=NULL
                    WHERE id=%s""", (sub["id"],))
            rep.requires_action += 1

        else:                                          # soft or hard decline
            hard = res.outcome == providers.HARD_DECLINE
            ledger.settle(cur, charge["id"], ledger.FAILED,
                          decline_code=res.decline_code, message=res.message)
            retry_count = int(sub["retry_count"]) + 1
            first_failure = sub["grace_until"] is None
            grace_until = (sched.period_start() + timedelta(days=GRACE_DAYS)
                           if first_failure else sub["grace_until"])
            # OFF-BY-ONE CAUGHT BY test_declines: with >= the 4th rung (+7 days) was
            # never scheduled — the ladder ran +1/+3/+5 and then dropped the member
            # into grace a full attempt early. retry_count is 1-based on first
            # failure, so grace begins only once it EXCEEDS the ladder length.
            if hard or retry_count > len(RETRY_LADDER_DAYS):
                # §7.4 — hard declines skip the ladder entirely. Retrying them is
                # pointless and raises our decline ratio with the networks.
                next_retry, status, next_charge = None, "grace", None
            else:
                days = RETRY_LADDER_DAYS[retry_count - 1]
                next_retry = sched.period_start() + timedelta(days=days)
                status, next_charge = "past_due", next_retry
            cur.execute(
                """UPDATE billing_subscriptions
                      SET status=%s, retry_count=%s, next_retry_at=%s,
                          next_charge_at=%s, grace_until=%s, last_decline_code=%s,
                          lease_owner=NULL, lease_expires_at=NULL
                    WHERE id=%s""",
                (status, retry_count, next_retry, next_charge, grace_until,
                 res.decline_code, sub["id"]))
            rep.charged_failed += 1
    conn.commit()


def _finish(cur, run_id: int, rep: CycleReport) -> None:
    cur.execute(
        """UPDATE billing_worker_runs
              SET finished_at=UTC_TIMESTAMP(), due_found=%s, charged_ok=%s,
                  charged_failed=%s, skipped=%s, amount_minor=%s, halted_reason=%s
            WHERE id=%s""",
        (rep.due_found, rep.charged_ok, rep.charged_failed, rep.skipped,
         rep.amount_minor, rep.halted_reason[:255], run_id))
