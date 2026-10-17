"""Native Billing v2.0 — the charge ledger.  Spec §4.3 / §5.3.

THE ONLY MODULE THAT WRITES billing_charges. Nothing else may insert or update it.

The ledger row is committed BEFORE the provider is called. That ordering is the
whole design: if the process dies between the commit and the response, the next
cycle finds an open intent row and asks the provider what actually happened
(recovery.py) instead of guessing or blindly retrying.

Rows are append-mostly. status advances along a one-way path; amount_minor,
period_* and idempotency_key are immutable after insert. Application code issues
no DELETE against this table — a mistake is corrected with a compensating refund,
never an edit.
"""

from __future__ import annotations

import pymysql
from datetime import datetime

INTENT = "intent"
PROCESSING = "processing"
SUCCEEDED = "succeeded"
FAILED = "failed"
REQUIRES_ACTION = "requires_action"
ABANDONED = "abandoned"
SHADOW = "shadow"

# One-way transitions. Anything not listed is a bug, and raises.
ALLOWED = {
    INTENT: {PROCESSING, SUCCEEDED, FAILED, REQUIRES_ACTION, ABANDONED},
    PROCESSING: {SUCCEEDED, FAILED, REQUIRES_ACTION, ABANDONED},
    REQUIRES_ACTION: {SUCCEEDED, FAILED, ABANDONED},
    SHADOW: set(),
    SUCCEEDED: {"partially_refunded", "refunded", "disputed"},
    "partially_refunded": {"refunded", "disputed"},
    FAILED: set(),
    ABANDONED: set(),
}


class DuplicateCharge(Exception):
    """The (subscription, period, attempt) row already exists, or the idempotency
    key has been used. Either way: already handled. Release the lease, make NO
    provider call, move on. This is the normal, healthy path under concurrency —
    not an error condition to alarm on."""


class LedgerError(Exception):
    pass


def idempotency_key(subscription_id: int, period_index: int, attempt: int) -> str:
    """Stable, derivable, and unique per attempt. Derivable matters: recovery can
    reconstruct the key for an open row without having stored it anywhere else."""
    return f"sub:{subscription_id}:p{period_index}:a{attempt}"


def open_intent(cur, *, subscription_id: int | None, identity_id: int, provider: str,
                period_start: datetime, period_end: datetime, period_index: int,
                attempt: int, amount_minor: int, currency: str,
                shadow: bool = False) -> dict:
    """§5.3 step 4 — the durable intent to charge. MUST be committed before any
    provider call.

    Raises DuplicateCharge when this period+attempt already exists. That rejection
    is the structural guarantee against double-charging: it happens in the database,
    before money could move, so defeating it would mean defeating InnoDB."""
    if not isinstance(amount_minor, int):
        raise LedgerError("amount_minor must be int minor units — never float/Decimal")
    if amount_minor < 0:
        raise LedgerError("negative amount")
    key = idempotency_key(subscription_id or 0, period_index, attempt)
    try:
        cur.execute(
            """INSERT INTO billing_charges
                 (subscription_id, identity_id, provider, period_start, period_end,
                  period_index, attempt, amount_minor, currency, status, idempotency_key)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (subscription_id, identity_id, provider, period_start, period_end,
             period_index, attempt, amount_minor, currency,
             SHADOW if shadow else INTENT, key),
        )
    except pymysql.err.IntegrityError as exc:
        raise DuplicateCharge(str(exc)) from exc
    cur.execute("SELECT * FROM billing_charges WHERE id = LAST_INSERT_ID()")
    return cur.fetchone()


def settle(cur, charge_id: int, status: str, *, charge_ref: str = "",
           intent_ref: str = "", decline_code: str = "", message: str = "") -> None:
    """§5.3 step 7. Enforces the one-way status path so a late webhook cannot
    resurrect a settled charge."""
    cur.execute("SELECT status FROM billing_charges WHERE id = %s FOR UPDATE", (charge_id,))
    row = cur.fetchone()
    if row is None:
        raise LedgerError(f"charge {charge_id} does not exist")
    current = row["status"]
    if status == current:
        return                                   # idempotent re-settle
    if status not in ALLOWED.get(current, set()):
        raise LedgerError(f"illegal ledger transition {current} -> {status}")
    cur.execute(
        """UPDATE billing_charges
              SET status=%s,
                  provider_charge_ref = IF(%s<>'', %s, provider_charge_ref),
                  provider_intent_ref = IF(%s<>'', %s, provider_intent_ref),
                  decline_code=%s, failure_message=LEFT(%s,512),
                  settled_at = IF(%s IN ('succeeded','failed','abandoned'),
                                  UTC_TIMESTAMP(), settled_at)
            WHERE id=%s""",
        (status, charge_ref, charge_ref, intent_ref, intent_ref,
         decline_code, message, status, charge_id),
    )


def refund(cur, charge_id: int, amount_minor: int, *, reason: str = "",
           actor: str = "system", provider_ref: str = "") -> dict:
    """§7.11 — issue a refund against a succeeded charge.

    Enforces the §4.4 invariant IN THE WRITE PATH, not only in the nightly assertion:
    total refunds may never exceed the charge. A nightly check that finds an
    over-refund has already let it happen."""
    if not isinstance(amount_minor, int) or amount_minor <= 0:
        raise LedgerError("refund amount must be a positive int of minor units")
    cur.execute("SELECT amount_minor, status FROM billing_charges WHERE id=%s FOR UPDATE",
                (charge_id,))
    chg = cur.fetchone()
    if chg is None:
        raise LedgerError(f"charge {charge_id} does not exist")
    if chg["status"] not in (SUCCEEDED, "partially_refunded", "refunded"):
        raise LedgerError(f"cannot refund a charge in status {chg['status']}")
    cur.execute("""SELECT COALESCE(SUM(amount_minor),0) already FROM billing_refunds
                    WHERE charge_id=%s AND status<>'failed'""", (charge_id,))
    already = int(cur.fetchone()["already"])
    if already + amount_minor > int(chg["amount_minor"]):
        raise LedgerError(
            f"refund would exceed the charge: {already}+{amount_minor} > {chg['amount_minor']}")
    key = f"rfnd:{charge_id}:{already + amount_minor}"
    try:
        cur.execute("""INSERT INTO billing_refunds
                         (charge_id, amount_minor, reason, provider_ref, idempotency_key,
                          actor, status)
                       VALUES (%s,%s,%s,%s,%s,%s,'pending')""",
                    (charge_id, amount_minor, reason, provider_ref, key, actor))
    except pymysql.err.IntegrityError as exc:
        raise DuplicateCharge(f"refund already issued: {key}") from exc
    total = already + amount_minor
    cur.execute("""UPDATE billing_charges
                      SET amount_refunded_minor=%s,
                          status = IF(%s >= amount_minor, 'refunded', 'partially_refunded')
                    WHERE id=%s""", (total, total, charge_id))
    cur.execute("SELECT * FROM billing_refunds WHERE id = LAST_INSERT_ID()")
    return cur.fetchone()


def open_rows_older_than(cur, seconds: int) -> list[dict]:
    """§7.2 — charges stuck in intent/processing past the lease. Each one is a
    'did it actually go through?' question for recovery, never a retry candidate."""
    cur.execute(
        """SELECT * FROM billing_charges
            WHERE status IN (%s,%s)
              AND initiated_at < UTC_TIMESTAMP() - INTERVAL %s SECOND
            ORDER BY id""",
        (INTENT, PROCESSING, seconds),
    )
    return cur.fetchall()


def assert_no_double_charges(cur) -> list[dict]:
    """§7.1 nightly assertion. MUST return zero rows, forever."""
    cur.execute(
        """SELECT subscription_id, period_index, COUNT(*) n
             FROM billing_charges
            WHERE status=%s AND subscription_id IS NOT NULL
            GROUP BY subscription_id, period_index
           HAVING COUNT(*) > 1""",
        (SUCCEEDED,),
    )
    return list(cur.fetchall())        # pymysql returns a tuple; callers compare to []


def assert_refunds_within_charges(cur) -> list[dict]:
    """§4.4 invariant: a charge can never be refunded for more than it took."""
    cur.execute(
        """SELECT c.id, c.amount_minor, SUM(r.amount_minor) refunded
             FROM billing_charges c JOIN billing_refunds r ON r.charge_id=c.id
            GROUP BY c.id, c.amount_minor
           HAVING SUM(r.amount_minor) > c.amount_minor"""
    )
    return list(cur.fetchall())
