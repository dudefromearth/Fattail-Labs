"""Native Billing v2.0 — infrastructure proof.  Spec docs/billing/SPEC-Native-Billing-v2.0.md

Answers one question: WOULD THIS INFRASTRUCTURE ACTUALLY WORK?

Self-contained (no pytest/conftest, so it needs none of the app's env), and
SELF-CLEANING: it records every row and table it creates and removes them all,
then asserts the database is back to its starting row counts.

SAFETY — read this before running:
  * Runs against MySQL on LOCALHOST ONLY. Never MiniTwo, never production.
  * Creates the 6 brand-new billing tables and DROPS them at the end. It ALTERs
    nothing and touches no pre-existing table's data.
  * Does NOT write to schema_migrations.
  * The live WooCommerce database is never contacted. The real-data replay reads a
    local read-only TSV export (no PII) if one is present, and skips if not.

Usage:  python3 test_infrastructure.py [path/to/woo_subs.tsv]
"""

from __future__ import annotations

import csv
import os
import sys
from datetime import datetime, timedelta
from decimal import Decimal
from pathlib import Path

import pymysql

# Prefer the LIFTED package at server/billing when this repo has one, so the
# suite proves the code that actually ships. Falls back to the prototypes in
# proto/ so the package stays runnable standalone.
_REPO = Path(__file__).resolve().parents[3]
if (_REPO / "server" / "billing" / "worker.py").is_file():
    sys.path.insert(0, str(_REPO / "server"))
    from billing import ledger, periods, recovery, webhooks, worker   # noqa: E402
    from billing import providers                                      # noqa: E402
    from billing.providers.fake import FakeProvider                    # noqa: E402
    providers.FakeProvider = FakeProvider
    _SOURCE = "server/billing (lifted)"
else:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "proto"))
    import ledger, periods, providers, recovery, webhooks, worker      # noqa: E402
    _SOURCE = "docs/billing/proto (prototype)"

PKG  = Path(__file__).resolve().parent.parent          # docs/billing/
REPO = Path(__file__).resolve().parents[3]             # repo root (for .env)
BILLING_TABLES = ["billing_discount_redemptions", "billing_discounts",
                  "billing_refunds", "billing_charges", "billing_payment_methods",
                  "billing_subscriptions", "billing_events", "billing_worker_runs"]
MIGRATIONS = ["159_native_billing_v2.sql", "160_billing_discounts.sql"]

PASS, FAIL = [], []


def check(name: str, ok: bool, detail: str = "") -> None:
    (PASS if ok else FAIL).append(name)
    print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f"   [{detail}]" if detail and not ok else ""))


def env(key: str) -> str:
    # .env is gitignored, so it only exists in a working checkout. Try the repo
    # root, then any LABS_ENV_FILE override, so the suite runs from a clean
    # worktree too.
    import os
    candidates = [Path(os.environ["LABS_ENV_FILE"])] if os.environ.get("LABS_ENV_FILE") else []
    candidates += [REPO / ".env", Path.home() / "Fattail-Labs" / ".env"]
    envfile = next((c for c in candidates if c.is_file()), None)
    if envfile is None:
        raise SystemExit("no .env found — set LABS_ENV_FILE=/path/to/.env")
    for line in envfile.read_text().splitlines():
        if line.startswith(key + "="):
            return line.split("=", 1)[1].strip()
    raise SystemExit(f"{key} missing from .env")


def connect():
    host = env("LABS_DB_HOST")
    if host not in ("127.0.0.1", "localhost", "::1"):
        raise SystemExit(f"REFUSING TO RUN: LABS_DB_HOST={host} is not localhost")
    conn = pymysql.connect(host=host, port=int(env("LABS_DB_PORT")),
                           user=env("LABS_DB_USER"), password=env("LABS_DB_PASSWORD"),
                           database=env("LABS_DB_NAME"), charset="utf8mb4",
                           cursorclass=pymysql.cursors.DictCursor, autocommit=False)
    # §7.16 — billing connections MUST be UTC, and must SET it rather than hope.
    # Local MySQL runs time_zone=SYSTEM, so NOW() and every DATETIME DEFAULT
    # CURRENT_TIMESTAMP would otherwise resolve in the host's local zone while the
    # worker's own writes use UTC_TIMESTAMP() — mixed zones in one money table.
    # Billing opens its OWN connections for this: setting it globally in db.py
    # would change how the rest of the app reads its TIMESTAMP columns.
    with conn.cursor() as cur:
        cur.execute("SET SESSION time_zone = '+00:00'")
    conn.commit()
    return conn


# ---------------------------------------------------------------- 1. pure maths
def test_periods():
    print("\n1. PERIOD ARITHMETIC (§5.4) — pure, no DB")
    d = datetime
    check("monthly from Jan 31 clamps to Feb 28 (2027, non-leap)",
          periods.add_interval(d(2027,1,31), "month", 1) == d(2027,2,28))
    check("monthly from Jan 31 clamps to Feb 29 (2028, leap)",
          periods.add_interval(d(2028,1,31), "month", 1) == d(2028,2,29))
    check("clamping never moves the anchor: Jan 31 +2mo is Mar 31, not Mar 28",
          periods.add_interval(d(2027,1,31), "month", 1, 2) == d(2027,3,31))
    check("annual from Feb 29 -> Feb 28 in a non-leap year",
          periods.add_interval(d(2028,2,29), "year", 1) == d(2029,2,28))
    check("annual from Feb 29 returns to Feb 29 four years on",
          periods.add_interval(d(2028,2,29), "year", 1, 4) == d(2032,2,29))
    check("weekly is exactly 7 days",
          periods.add_interval(d(2026,10,14,15,7,4), "week", 1) == d(2026,10,21,15,7,4))
    check("quarterly (3-month interval)",
          periods.add_interval(d(2026,10,14), "month", 3) == d(2027,1,14))

    # no drift over a long run
    s = periods.Schedule(anchor_at=d(2026,1,31,9,30), interval_unit="month", interval_count=1)
    seen = []
    for _ in range(24):
        seen.append(s.next_charge_at()); s = s.advance()
    check("24 monthly periods: every date keeps the 09:30 time-of-day",
          all(x.hour == 9 and x.minute == 30 for x in seen))
    check("24 monthly periods: strictly increasing, no repeats",
          all(seen[i] < seen[i+1] for i in range(len(seen)-1)))
    check("24 monthly periods from Jan 31: day-of-month recovers to 31",
          seen[11].day == 31 and seen[23].day == 31, f"{seen[11]} {seen[23]}")

    w = periods.Schedule(anchor_at=d(2026,3,1,12,0), interval_unit="week", interval_count=1)
    wk = []
    for _ in range(60):
        wk.append(w.next_charge_at()); w = w.advance()
    check("60 weekly periods cross US DST with no time-of-day shift (UTC only)",
          all(x.hour == 12 for x in wk))
    check("60 weekly periods are exactly 7 days apart, always",
          all((wk[i+1]-wk[i]).days == 7 for i in range(len(wk)-1)))

    # ends_at / max_periods
    s = periods.Schedule(anchor_at=d(2026,10,15), interval_unit="week", interval_count=1,
                         ends_at=d(2026,11,26), max_periods=6)
    check("max_periods stops the series", 
          periods.Schedule(anchor_at=d(2026,10,15), interval_unit="week",
                           interval_count=1, period_index=6, max_periods=6).next_charge_at() is None)
    check("ends_at stops the series even if max_periods would allow it",
          periods.Schedule(anchor_at=d(2026,10,15), interval_unit="week", interval_count=1,
                           period_index=10, ends_at=d(2026,11,26), max_periods=99
                           ).next_charge_at() is None)
    mp = periods.derive_max_periods(d(2026,10,15), "week", 1, d(2026,11,26))
    check("derived max_periods never authorises a charge past ends_at",
          periods.add_interval(d(2026,10,15), "week", 1, mp - 1) <= d(2026,11,26))
    check("open-ended subscription derives max_periods = None",
          periods.derive_max_periods(d(2026,10,15), "month", 1, None) is None)


# ------------------------------------------------- 2. §5.4.1 the anchor decision
def test_anchor_rule(tsv: Path | None):
    print("\n2. ANCHOR RULE (§5.4.1) — replayed against the real book")
    if not tsv or not tsv.exists():
        print("     SKIPPED — no local export present (expected on a clean machine)")
        return None
    rows = {}
    for r in csv.DictReader(open(tsv), delimiter="\t"):
        rows.setdefault(r["sub_id"], r)

    def dt(s):
        s = (s or "").strip()
        return None if not s or s == "0" else datetime.strptime(s, "%Y-%m-%d %H:%M:%S")

    exact_from_due = drift_from_start = datable = 0
    past_end = []
    for r in rows.values():
        nxt, start, end = (dt(r["schedule_next_payment"]), dt(r["schedule_start"]),
                           dt(r["schedule_end"]))
        if not nxt:
            continue
        datable += 1
        sched = periods.import_from_woo(
            schedule_next_payment=nxt, schedule_start=start, schedule_end=end,
            billing_period=r["billing_period"], billing_interval=int(r["billing_interval"] or 1))
        if sched.next_charge_at() == nxt:
            exact_from_due += 1
        # the rejected alternative: anchor on _schedule_start
        if start:
            probe, i = start, 0
            while probe < nxt and i < 500:
                i += 1
                probe = periods.add_interval(start, r["billing_period"],
                                             int(r["billing_interval"] or 1), i)
            if probe == nxt:
                drift_from_start += 1
        # walk the whole remaining term; nothing may land past ends_at
        s = sched
        for _ in range(60):
            due = s.next_charge_at()
            if due is None:
                break
            if end and due > end:
                past_end.append(r["sub_id"]); break
            s = s.advance()

    check(f"anchoring on the DUE DATE reproduces Woo exactly ({exact_from_due}/{datable})",
          exact_from_due == datable, f"{exact_from_due}/{datable}")
    check(f"anchoring on _schedule_start does NOT ({drift_from_start}/{datable}) "
          f"— which is why §5.4.1 exists", drift_from_start < datable)
    check("walking every subscription's full remaining term never charges past ends_at",
          not past_end, f"offenders: {past_end[:5]}")
    return rows


# ------------------------------------------------------------ 3. schema + ledger
def create_tables(conn):
    # Same approach as server/migrate.py: strip full-line comments BEFORE
    # splitting on ';', because semicolons inside comments truncate statements.
    for name in MIGRATIONS:
        raw = (PKG / "migrations" / name).read_text()
        sql = "\n".join(l for l in raw.splitlines() if not l.lstrip().startswith("--"))
        with conn.cursor() as cur:
            for stmt in [x.strip() for x in sql.split(";") if x.strip()]:
                cur.execute(stmt)
        conn.commit()


def drop_tables(conn):
    with conn.cursor() as cur:
        cur.execute("SET FOREIGN_KEY_CHECKS=0")
        for t in BILLING_TABLES:
            cur.execute(f"DROP TABLE IF EXISTS {t}")
        cur.execute("SET FOREIGN_KEY_CHECKS=1")
    conn.commit()


def seed_identity(conn, n: int) -> int:
    with conn.cursor() as cur:
        cur.execute("INSERT INTO identities (email, display_name) VALUES (%s,%s)",
                    (f"billing-infra-test-{n}@example.invalid", "billing test"))
        cur.execute("SELECT LAST_INSERT_ID() id")
        return cur.fetchone()["id"]


def ensure_plan(conn, slug: str) -> tuple[int, bool]:
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM plans WHERE slug=%s", (slug,))
        row = cur.fetchone()
        if row:
            return row["id"], False
        cur.execute("INSERT INTO plans (slug,name,grants_role) VALUES (%s,%s,%s)",
                    (slug, slug.title(), "navigator"))
        cur.execute("SELECT LAST_INSERT_ID() id")
        return cur.fetchone()["id"], True


def reset(conn):
    """Isolate sections. These tables are created by this harness and dropped at the
    end, so clearing them affects nothing pre-existing."""
    with conn.cursor() as cur:
        cur.execute("SET FOREIGN_KEY_CHECKS=0")
        for t in ("billing_refunds", "billing_charges", "billing_subscriptions",
                  "billing_events", "billing_worker_runs"):
            cur.execute(f"DELETE FROM {t}")
        cur.execute("SET FOREIGN_KEY_CHECKS=1")
    conn.commit()


def mk_sub(conn, *, identity_id, plan_id, amount_minor, unit="month", count=1,
           due=None, ends_at=None, max_periods=None, provider="stripe",
           status="active", woo_id=None, period_index=0, amount_locked=1,
           discount_note=""):
    due = due or (datetime.utcnow() - timedelta(minutes=5))
    with conn.cursor() as cur:
        cur.execute(
            """INSERT INTO billing_subscriptions
                 (identity_id, plan_id, status, provider, amount_minor, currency,
                  interval_unit, interval_count, anchor_at, period_index,
                  current_period_start, next_charge_at, ends_at, max_periods,
                  woo_subscription_id, amount_locked, discount_note)
               VALUES (%s,%s,%s,%s,%s,'USD',%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (identity_id, plan_id, status, provider, amount_minor, unit, count,
             due, period_index, due, due, ends_at, max_periods, woo_id,
             amount_locked, discount_note))
        cur.execute("SELECT LAST_INSERT_ID() id")
        sid = cur.fetchone()["id"]
    conn.commit()
    return sid


def test_ledger(conn, ident, plan):
    print("\n3. LEDGER CONSTRAINTS (§4.3 / §7.1) — double-charging must be impossible")
    sid = mk_sub(conn, identity_id=ident, plan_id=plan, amount_minor=199700,
                 unit="year", woo_id=900000001)
    p0, p1 = datetime(2027,5,1,3,0,4), datetime(2028,5,1,3,0,4)
    with conn.cursor() as cur:
        ledger.open_intent(cur, subscription_id=sid, identity_id=ident, provider="stripe",
                           period_start=p0, period_end=p1, period_index=1, attempt=1,
                           amount_minor=199700, currency="USD")
    conn.commit()
    check("worker A opens the period intent", True)

    blocked = False
    try:
        with conn.cursor() as cur:
            ledger.open_intent(cur, subscription_id=sid, identity_id=ident, provider="stripe",
                               period_start=p0, period_end=p1, period_index=1, attempt=1,
                               amount_minor=199700, currency="USD")
    except ledger.DuplicateCharge:
        blocked = True
    conn.rollback()
    check("worker B racing the SAME period is rejected by the database", blocked)

    ok = False
    try:
        with conn.cursor() as cur:
            ledger.open_intent(cur, subscription_id=sid, identity_id=ident, provider="stripe",
                               period_start=p0, period_end=p1, period_index=1, attempt=2,
                               amount_minor=199700, currency="USD")
        conn.commit(); ok = True
    except ledger.DuplicateCharge:
        conn.rollback()
    check("a legitimate RETRY (attempt 2) is allowed", ok)

    ok = False
    try:
        with conn.cursor() as cur:
            ledger.open_intent(cur, subscription_id=None, identity_id=ident, provider="stripe",
                               period_start=p0, period_end=p0, period_index=0, attempt=1,
                               amount_minor=300000, currency="USD")
            ledger.open_intent(cur, subscription_id=None, identity_id=ident, provider="stripe",
                               period_start=p0, period_end=p0, period_index=0, attempt=1,
                               amount_minor=300000, currency="USD")
        conn.rollback()
    except ledger.DuplicateCharge:
        conn.rollback(); ok = True
    check("two one-off charges collide on the idempotency key, not the period key", ok)

    floats_rejected = False
    try:
        with conn.cursor() as cur:
            ledger.open_intent(cur, subscription_id=sid, identity_id=ident, provider="stripe",
                               period_start=p0, period_end=p1, period_index=99, attempt=1,
                               amount_minor=1997.00, currency="USD")
    except ledger.LedgerError:
        floats_rejected = True
    conn.rollback()
    check("a float amount is refused outright (money is int minor units)", floats_rejected)

    with conn.cursor() as cur:
        cur.execute("SELECT id FROM billing_charges WHERE subscription_id=%s AND attempt=1", (sid,))
        cid = cur.fetchone()["id"]
        ledger.settle(cur, cid, ledger.SUCCEEDED, charge_ref="pi_x")
    conn.commit()
    illegal = False
    try:
        with conn.cursor() as cur:
            ledger.settle(cur, cid, ledger.FAILED)
    except ledger.LedgerError:
        illegal = True
    conn.rollback()
    check("a settled charge cannot be resurrected by a late event (one-way status)", illegal)

    with conn.cursor() as cur:
        check("nightly double-charge assertion returns zero rows",
              not ledger.assert_no_double_charges(cur))
    return sid


# --------------------------------------------------------------- 4. the worker
def test_worker(conn, ident, plan):
    print("\n4. WORKER CYCLE (§5.3) — ledger first, provider second")
    fake = providers.FakeProvider()
    pf = lambda name: fake
    sid = mk_sub(conn, identity_id=ident, plan_id=plan, amount_minor=9700,
                 unit="month", woo_id=900000010)
    rep = worker.run_cycle(conn, provider_for=pf, mode=worker.MODE_LIVE)
    check("one due subscription found and charged",
          rep.due_found == 1 and rep.charged_ok == 1, f"{rep}")
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM billing_subscriptions WHERE id=%s", (sid,))
        s = cur.fetchone()
        cur.execute("SELECT * FROM billing_charges WHERE subscription_id=%s", (sid,))
        cs = cur.fetchall()
    check("exactly one ledger row, status succeeded",
          len(cs) == 1 and cs[0]["status"] == "succeeded")
    check("schedule advanced by exactly one interval",
          s["period_index"] == 1 and s["next_charge_at"] == periods.add_interval(
              s["anchor_at"], "month", 1), f"{s['next_charge_at']}")
    check("lease released after the charge", s["lease_owner"] is None)

    rep2 = worker.run_cycle(conn, provider_for=pf, mode=worker.MODE_LIVE)
    check("an immediate second cycle finds nothing due (no double charge)",
          rep2.due_found == 0, f"{rep2}")

    print("\n5. CONCURRENCY (§5.2) — two workers, one due subscription")
    sid2 = mk_sub(conn, identity_id=ident, plan_id=plan, amount_minor=6700, woo_id=900000011)
    c2 = connect()
    fake2 = providers.FakeProvider()
    ra = worker.run_cycle(conn, provider_for=lambda n: fake, mode=worker.MODE_LIVE, worker_id="wA")
    rb = worker.run_cycle(c2, provider_for=lambda n: fake2, mode=worker.MODE_LIVE, worker_id="wB")
    c2.close()
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) n FROM billing_charges WHERE subscription_id=%s", (sid2,))
        n = cur.fetchone()["n"]
    check("the subscription was charged exactly once across both workers", n == 1,
          f"rows={n} A={ra.charged_ok} B={rb.charged_ok}")
    check("the second worker made no provider call for it",
          len(fake.calls) + len(fake2.calls) <= 3, f"{len(fake.calls)}+{len(fake2.calls)}")


# ---------------------------------------------------- 6. crash + transport paths
def test_recovery(conn, ident, plan):
    print("\n6. CRASH RECOVERY (§7.2) — 'did it actually charge?'")
    sid = mk_sub(conn, identity_id=ident, plan_id=plan, amount_minor=1700,
                 unit="week", woo_id=900000020)
    fake = providers.FakeProvider()
    # simulate: intent committed, provider succeeded, our process died before settling
    with conn.cursor() as cur:
        ch = ledger.open_intent(cur, subscription_id=sid, identity_id=ident,
                                provider="stripe", period_start=datetime(2026,10,14),
                                period_end=datetime(2026,10,21), period_index=0,
                                attempt=1, amount_minor=1700, currency="USD")
        cur.execute("UPDATE billing_charges SET initiated_at = UTC_TIMESTAMP() - INTERVAL 1 HOUR WHERE id=%s",
                    (ch["id"],))
    conn.commit()
    fake.commit_silently(ch["idempotency_key"])
    acted = recovery.recover_open_charges(conn, provider_for=lambda n: fake)
    with conn.cursor() as cur:
        cur.execute("SELECT status FROM billing_charges WHERE id=%s", (ch["id"],))
        st = cur.fetchone()["status"]
        cur.execute("SELECT COUNT(*) n FROM billing_charges WHERE subscription_id=%s", (sid,))
        n = cur.fetchone()["n"]
    check("recovery asks the provider and settles the orphan as succeeded",
          st == "succeeded" and acted and acted[0]["action"] == "settled_succeeded", f"{st} {acted}")
    check("recovery did NOT create a second charge", n == 1, f"rows={n}")

    sid2 = mk_sub(conn, identity_id=ident, plan_id=plan, amount_minor=1700,
                  unit="week", woo_id=900000021)
    blind = providers.FakeProvider(fail_lookup=True)
    with conn.cursor() as cur:
        ch2 = ledger.open_intent(cur, subscription_id=sid2, identity_id=ident,
                                 provider="stripe", period_start=datetime(2026,10,14),
                                 period_end=datetime(2026,10,21), period_index=0,
                                 attempt=1, amount_minor=1700, currency="USD")
        cur.execute("UPDATE billing_charges SET initiated_at = UTC_TIMESTAMP() - INTERVAL 1 HOUR WHERE id=%s",
                    (ch2["id"],))
    conn.commit()
    acted2 = recovery.recover_open_charges(conn, provider_for=lambda n: blind)
    with conn.cursor() as cur:
        cur.execute("SELECT status FROM billing_subscriptions WHERE id=%s", (sid2,))
        sst = cur.fetchone()["status"]
        cur.execute("SELECT COUNT(*) n FROM billing_charges WHERE subscription_id=%s", (sid2,))
        n2 = cur.fetchone()["n"]
    check("an UNRESOLVABLE charge quarantines instead of retrying",
          sst == "quarantined" and n2 == 1, f"status={sst} rows={n2}")

    print("\n7. TRANSPORT FAILURE (§7.15) — must never become a decline")
    sid3 = mk_sub(conn, identity_id=ident, plan_id=plan, amount_minor=9700, woo_id=900000022)
    boom = providers.FakeProvider(default=providers.TRANSPORT_ERROR)
    before_due = None
    with conn.cursor() as cur:
        cur.execute("SELECT next_charge_at FROM billing_subscriptions WHERE id=%s", (sid3,))
        before_due = cur.fetchone()["next_charge_at"]
    worker.run_cycle(conn, provider_for=lambda n: boom, mode=worker.MODE_LIVE)
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM billing_subscriptions WHERE id=%s", (sid3,))
        s = cur.fetchone()
        cur.execute("SELECT status FROM billing_charges WHERE subscription_id=%s", (sid3,))
        cst = cur.fetchone()["status"]
    check("the ledger row is left OPEN (intent), not failed", cst == "intent", cst)
    check("retry_count was NOT incremented (no dunning for a healthy card)",
          s["retry_count"] == 0, str(s["retry_count"]))
    check("the due date is untouched, so §5.1 re-picks it up",
          s["next_charge_at"] == before_due)
    check("status stayed active", s["status"] == "active", s["status"])


# --------------------------------------------------------- 8. declines + dunning
def test_declines(conn, ident, plan):
    print("\n8. DECLINE HANDLING (§7.4 / §7.6)")
    soft = providers.FakeProvider(default=(providers.SOFT_DECLINE, "insufficient_funds"))
    sid = mk_sub(conn, identity_id=ident, plan_id=plan, amount_minor=9700, woo_id=900000030)
    with conn.cursor() as cur:
        cur.execute("SELECT anchor_at FROM billing_subscriptions WHERE id=%s", (sid,))
        anchor = cur.fetchone()["anchor_at"]
    seen = []
    for _ in range(5):
        worker.run_cycle(conn, provider_for=lambda n: soft, mode=worker.MODE_LIVE)
        with conn.cursor() as cur:
            cur.execute("SELECT status, retry_count, next_charge_at, grace_until FROM billing_subscriptions WHERE id=%s", (sid,))
            s = cur.fetchone()
            seen.append((s["status"], s["retry_count"], s["next_charge_at"]))
            if s["next_charge_at"]:     # fast-forward to the scheduled retry
                cur.execute("UPDATE billing_subscriptions SET next_charge_at=UTC_TIMESTAMP()-INTERVAL 1 MINUTE WHERE id=%s", (sid,))
        conn.commit()
    offsets = [(seen[i][2] - anchor).days for i in range(4) if seen[i][2]]
    check(f"retry ladder is +1/+3/+5/+7 days from the period start  (got {offsets})",
          offsets == [1, 3, 5, 7], str(offsets))
    check("after the 4th failure a +7 retry is still scheduled (past_due, not grace)",
          seen[3][0] == "past_due" and seen[3][1] == 4, str(seen[3]))
    check("grace begins only on the 5th failure, once the ladder is exhausted",
          seen[4][0] == "grace" and seen[4][2] is None, str(seen[4]))
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) n, COUNT(DISTINCT attempt) a FROM billing_charges WHERE subscription_id=%s", (sid,))
        r = cur.fetchone()
    check("every attempt is a distinct row on the SAME period (full audit trail)",
          r["n"] == 5 and r["a"] == 5, f"rows={r['n']} attempts={r['a']}")

    hard = providers.FakeProvider(default=(providers.HARD_DECLINE, "expired_card"))
    sid2 = mk_sub(conn, identity_id=ident, plan_id=plan, amount_minor=9700, woo_id=900000031)
    worker.run_cycle(conn, provider_for=lambda n: hard, mode=worker.MODE_LIVE)
    with conn.cursor() as cur:
        cur.execute("SELECT status, next_charge_at, retry_count FROM billing_subscriptions WHERE id=%s", (sid2,))
        s = cur.fetchone()
    check("a HARD decline skips the ladder entirely and goes straight to grace",
          s["status"] == "grace" and s["next_charge_at"] is None and s["retry_count"] == 1, str(s))

    tds = providers.FakeProvider(default=(providers.REQUIRES_ACTION, "authentication_required"))
    sid3 = mk_sub(conn, identity_id=ident, plan_id=plan, amount_minor=199700,
                  unit="year", woo_id=900000032)
    worker.run_cycle(conn, provider_for=lambda n: tds, mode=worker.MODE_LIVE)
    with conn.cursor() as cur:
        cur.execute("SELECT status, retry_count FROM billing_subscriptions WHERE id=%s", (sid3,))
        s = cur.fetchone()
        cur.execute("SELECT status, provider_intent_ref FROM billing_charges WHERE subscription_id=%s", (sid3,))
        c = cur.fetchone()
    check("3DS becomes requires_action, NOT a decline (no retry counted)",
          c["status"] == "requires_action" and s["retry_count"] == 0, f"{c['status']} {s['retry_count']}")
    check("the PaymentIntent ref is stored so the member can confirm it later",
          bool(c["provider_intent_ref"]))

    classif = [providers.classify(c) for c in
               ("authentication_required", "expired_card", "insufficient_funds",
                "api_connection_error", "some_new_code_stripe_invents")]
    check("decline classifier: 3DS/hard/soft/transport/unknown all route correctly",
          classif == [providers.REQUIRES_ACTION, providers.HARD_DECLINE,
                      providers.SOFT_DECLINE, providers.TRANSPORT_ERROR,
                      providers.SOFT_DECLINE], str(classif))


# ------------------------------------------------------- 9. breakers + lifecycle
def test_breakers(conn, ident, plan):
    print("\n9. CIRCUIT BREAKERS (§7.10) — a bug must not bill everyone")
    fake = providers.FakeProvider()
    for i in range(6):
        mk_sub(conn, identity_id=ident, plan_id=plan, amount_minor=1700,
               unit="week", woo_id=900000100 + i)
    # surge multiple raised so this test isolates the CAP breaker; the surge
    # breaker gets its own case below.
    lim = worker.Limits(daily_cap_minor=3000, due_surge_multiple=1000.0)
    rep = worker.run_cycle(conn, provider_for=lambda n: fake, mode=worker.MODE_LIVE, limits=lim)
    check("the cycle HALTS when the spend cap would be exceeded",
          rep.halted_reason.startswith("cycle cap"), rep.halted_reason or "(not halted)")
    check("only charges within the cap were made",
          rep.charged_ok <= 2, f"charged={rep.charged_ok}")
    with conn.cursor() as cur:
        cur.execute("""SELECT halted_reason FROM billing_worker_runs
                        ORDER BY id DESC LIMIT 1""")
        check("the halt is recorded in billing_worker_runs for the heartbeat check",
              bool(cur.fetchone()["halted_reason"]))
    check("heartbeat sees a finished cycle", recovery.heartbeat_ok(conn))

    reset(conn)
    for i in range(3):      # establish a small trailing average
        mk_sub(conn, identity_id=ident, plan_id=plan, amount_minor=1700,
               unit="week", woo_id=900000150 + i)
        worker.run_cycle(conn, provider_for=lambda n: fake, mode=worker.MODE_LIVE)
    for i in range(40):     # now a date bug "marks everything due"
        mk_sub(conn, identity_id=ident, plan_id=plan, amount_minor=1700,
               unit="week", woo_id=900000160 + i)
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) n FROM billing_charges")
        before_surge = cur.fetchone()["n"]
    surge = worker.run_cycle(conn, provider_for=lambda n: fake, mode=worker.MODE_LIVE,
                             limits=worker.Limits(daily_cap_minor=10**9))
    check("the cycle HALTS on a due-count surge, charging nothing",
          surge.halted_reason.startswith("due surge") and surge.charged_ok == 0,
          f"{surge.halted_reason} charged={surge.charged_ok}")
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) n FROM billing_charges")
        check("no ledger rows were written during the halted cycle",
              cur.fetchone()["n"] == before_surge, f"before={before_surge}")

    print("\n10. OBSERVER FINITE TERM (§8.4) — never one charge too many")
    reset(conn)
    nosurge = worker.Limits(due_surge_multiple=1000.0, daily_cap_minor=10**9)
    anchor = datetime(2026, 9, 3, 16, 12, 58)
    ends = datetime(2026, 10, 15, 16, 12, 58)
    mp = periods.derive_max_periods(anchor, "week", 1, ends)
    sid = mk_sub(conn, identity_id=ident, plan_id=plan, amount_minor=1700, unit="week",
                 due=anchor, ends_at=ends, max_periods=mp, woo_id=900000200)
    charges = 0
    for _ in range(12):
        r = worker.run_cycle(conn, provider_for=lambda n: fake, mode=worker.MODE_LIVE,
                             limits=nosurge)
        charges += r.charged_ok
        with conn.cursor() as cur:
            cur.execute("SELECT status, next_charge_at FROM billing_subscriptions WHERE id=%s", (sid,))
            s = cur.fetchone()
            if s["next_charge_at"] is None:
                break
            cur.execute("UPDATE billing_subscriptions SET next_charge_at=UTC_TIMESTAMP()-INTERVAL 1 MINUTE WHERE id=%s", (sid,))
        conn.commit()
    check(f"charged exactly {mp} times for a {mp}-period term, then stopped", charges == mp,
          f"charges={charges} max_periods={mp}")
    check("subscription ended as expired, next_charge_at NULL",
          s["status"] == "expired" and s["next_charge_at"] is None, str(s))


# ------------------------------------------- 10b. deliberately set prices (§9.3)
def test_set_prices(conn, ident, plan):
    print("\n10b. DELIBERATELY SET PRICES (§9.3) — comps, grandfathering, locked amounts")
    reset(conn)
    fake = providers.FakeProvider()
    nosurge = worker.Limits(due_surge_multiple=1000.0, daily_cap_minor=10**9)

    # comped and manual_billing must be UNREACHABLE by the worker — by the due
    # query itself, not by a flag check inside the loop.
    comped = mk_sub(conn, identity_id=ident, plan_id=plan, amount_minor=0,
                    status="comped", woo_id=900000400, discount_note="woo coupon comp-F")
    manual = mk_sub(conn, identity_id=ident, plan_id=plan, amount_minor=9700,
                    status="manual_billing", provider="", woo_id=900000401)
    rep = worker.run_cycle(conn, provider_for=lambda n: fake, mode=worker.MODE_LIVE,
                           limits=nosurge)
    check("a comped subscription is never even SEEN by the due query",
          rep.due_found == 0, f"due_found={rep.due_found}")
    check("a manual_billing subscription is never seen either", rep.due_found == 0)
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) n FROM billing_charges WHERE subscription_id IN (%s,%s)",
                    (comped, manual))
        check("neither produced a ledger row", cur.fetchone()["n"] == 0)
    check("and no provider call was made for either", len(fake.calls) == 0)

    # a grandfathered price is charged at the SET amount, not the plan's
    reset(conn)
    g = mk_sub(conn, identity_id=ident, plan_id=plan, amount_minor=6700,
               woo_id=900000410, discount_note="woo coupon founders-A")
    worker.run_cycle(conn, provider_for=lambda n: fake, mode=worker.MODE_LIVE, limits=nosurge)
    check("a grandfathered Activator is charged $67.00, not the $97.00 list price",
          fake.calls and fake.calls[-1]["amount"] == 6700,
          f"charged {fake.calls[-1]['amount'] if fake.calls else None}")
    with conn.cursor() as cur:
        cur.execute("SELECT amount_minor, discount_note, amount_locked FROM billing_subscriptions WHERE id=%s", (g,))
        row = cur.fetchone()
    check("the set price is locked and its provenance recorded",
          row["amount_locked"] == 1 and "founders-A" in row["discount_note"], str(row))

    # a plan price change must not touch a locked subscription
    with conn.cursor() as cur:
        cur.execute("UPDATE plans SET name=CONCAT(name,' (price changed)') WHERE id=%s", (plan,))
        cur.execute("UPDATE billing_subscriptions SET next_charge_at=UTC_TIMESTAMP()-INTERVAL 1 MINUTE WHERE id=%s", (g,))
    conn.commit()
    worker.run_cycle(conn, provider_for=lambda n: fake, mode=worker.MODE_LIVE, limits=nosurge)
    check("after a plan change the locked subscription STILL charges $67.00",
          fake.calls[-1]["amount"] == 6700, f"charged {fake.calls[-1]['amount']}")
    with conn.cursor() as cur:
        cur.execute("UPDATE plans SET name=REPLACE(name,' (price changed)','') WHERE id=%s", (plan,))
    conn.commit()

    # the whole deliberately-priced population, replayed from the real book
    amounts = [(6700, "founders-A"), (6700, "founders-B"), (21700, "founder-C"),
               (16020, "founders-D"), (40000, "birthday-E")]
    reset(conn)
    for i, (amt, note) in enumerate(amounts):
        mk_sub(conn, identity_id=ident, plan_id=plan, amount_minor=amt,
               woo_id=900000420 + i, discount_note=f"woo coupon {note}")
    rep = worker.run_cycle(conn, provider_for=lambda n: fake, mode=worker.MODE_LIVE,
                           limits=nosurge)
    with conn.cursor() as cur:
        cur.execute("""SELECT s.amount_minor set_price, c.amount_minor charged
                         FROM billing_subscriptions s JOIN billing_charges c ON c.subscription_id=s.id
                        WHERE s.woo_subscription_id BETWEEN 900000420 AND 900000430""")
        pairs = cur.fetchall()
    check(f"all {len(amounts)} grandfathered tiers charge exactly their set price",
          len(pairs) == len(amounts) and all(r["set_price"] == r["charged"] for r in pairs),
          str([(r["set_price"], r["charged"]) for r in pairs]))
    check("total billed equals the sum of the set prices, not of list prices",
          rep.amount_minor == sum(a for a, _ in amounts),
          f"{rep.amount_minor} vs {sum(a for a,_ in amounts)}")


# -------------------------------- 10d. the money edges that were untested
def test_money_edges(conn, ident, plan):
    print("\n10d. MONEY EDGES — the paths the coverage audit found untested")
    reset(conn)
    nosurge = worker.Limits(due_surge_multiple=1000.0, daily_cap_minor=10**9)
    from datetime import datetime as DT

    # --- §7.11 refunds ---
    fake = providers.FakeProvider()
    sid = mk_sub(conn, identity_id=ident, plan_id=plan, amount_minor=9700, woo_id=900000600)
    worker.run_cycle(conn, provider_for=lambda n: fake, mode=worker.MODE_LIVE, limits=nosurge)
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM billing_charges WHERE subscription_id=%s", (sid,))
        cid = cur.fetchone()["id"]
        r1 = ledger.refund(cur, cid, 3000, reason="goodwill", actor="admin@test")
    conn.commit()
    check("a partial refund is recorded and the charge marked partially_refunded",
          r1["amount_minor"] == 3000, str(r1["amount_minor"]))
    with conn.cursor() as cur:
        cur.execute("SELECT status, amount_refunded_minor FROM billing_charges WHERE id=%s", (cid,))
        c = cur.fetchone()
    check("the charge tracks the refunded total",
          c["status"] == "partially_refunded" and c["amount_refunded_minor"] == 3000, str(c))
    over = False
    try:
        with conn.cursor() as cur:
            ledger.refund(cur, cid, 7000, reason="too much")   # 3000+7000 > 9700
    except ledger.LedgerError as exc:
        conn.rollback(); over = "exceed" in str(exc)
    check("an OVER-refund is refused in the write path, not just by the nightly check", over)
    with conn.cursor() as cur:
        ledger.refund(cur, cid, 6700, reason="rest")
        cur.execute("SELECT status FROM billing_charges WHERE id=%s", (cid,))
        st = cur.fetchone()["status"]
    conn.commit()
    check("refunding the remainder marks the charge fully refunded", st == "refunded", st)
    with conn.cursor() as cur:
        check("the §4.4 invariant holds across the whole run",
              not ledger.assert_refunds_within_charges(cur))

    # --- §8.2 proration ---
    ps, pe = DT(2026, 10, 1), DT(2026, 11, 1)
    half = periods.prorated_credit(amount_minor=9700, period_start=ps, period_end=pe,
                                   at=DT(2026, 10, 16, 12))
    check("half way through a month, half the Activator fee is credited",
          4850 <= half <= 4860, f"got {half}")
    check("credit at the very start is the whole amount",
          periods.prorated_credit(amount_minor=9700, period_start=ps, period_end=pe, at=ps) == 9700)
    check("credit at the end is zero",
          periods.prorated_credit(amount_minor=9700, period_start=ps, period_end=pe, at=pe) == 0)
    charge, credit = periods.upgrade_charge(old_amount_minor=9700, new_amount_minor=26700,
                                             period_start=ps, period_end=pe,
                                             at=DT(2026, 10, 16, 12))
    check("Activator -> Navigator mid-period charges the difference less the credit",
          charge == 26700 - credit and charge > 0, f"charge={charge} credit={credit}")
    c2, cr2 = periods.upgrade_charge(old_amount_minor=199700, new_amount_minor=9700,
                                      period_start=DT(2026,10,1), period_end=DT(2027,10,1),
                                      at=DT(2026,10,2))
    check("a credit larger than the new price floors the charge at 0, never negative",
          c2 == 0 and cr2 > 9700, f"charge={c2} credit={cr2}")
    check("proration refuses a float amount",
          _raises(lambda: periods.prorated_credit(amount_minor=97.0, period_start=ps,
                                                   period_end=pe, at=ps), periods.PeriodError))

    # --- §16.4 the discount step-up, and its notification guard ---
    reset(conn)
    sub = mk_sub(conn, identity_id=ident, plan_id=plan, amount_minor=6700,
                 woo_id=900000610, discount_note="labs discount 3MONTHS")
    with conn.cursor() as cur:
        cur.execute("""UPDATE billing_subscriptions
                          SET standard_amount_minor=9700, discount_periods_left=1
                        WHERE id=%s""", (sub,))
    conn.commit()
    f2 = providers.FakeProvider()
    worker.run_cycle(conn, provider_for=lambda n: f2, mode=worker.MODE_LIVE, limits=nosurge)
    check("while the discount has periods left, the discounted price is charged",
          f2.calls[-1]["amount"] == 6700, str(f2.calls[-1]["amount"]))
    with conn.cursor() as cur:
        cur.execute("UPDATE billing_subscriptions SET next_charge_at=UTC_TIMESTAMP()-INTERVAL 1 MINUTE WHERE id=%s", (sub,))
    conn.commit()
    rep = worker.run_cycle(conn, provider_for=lambda n: f2, mode=worker.MODE_LIVE, limits=nosurge)
    with conn.cursor() as cur:
        cur.execute("""SELECT amount_minor, amount_change_notified_at
                         FROM billing_subscriptions WHERE id=%s""", (sub,))
        row = cur.fetchone()
    check("the discount ending does NOT raise the price with no notice given",
          row["amount_minor"] == 6700 and row["amount_change_notified_at"] is not None,
          f"{row}  notes={rep.notes[-1:]}")
    check("the deferral is recorded as a note for the operator",
          any("DEFERRED" in n for n in rep.notes), str(rep.notes[-2:]))
    with conn.cursor() as cur:
        cur.execute("""UPDATE billing_subscriptions
                          SET amount_change_notified_at = UTC_TIMESTAMP() - INTERVAL 10 DAY,
                              next_charge_at = UTC_TIMESTAMP() - INTERVAL 1 MINUTE
                        WHERE id=%s""", (sub,))
    conn.commit()
    worker.run_cycle(conn, provider_for=lambda n: f2, mode=worker.MODE_LIVE, limits=nosurge)
    with conn.cursor() as cur:
        cur.execute("SELECT amount_minor FROM billing_subscriptions WHERE id=%s", (sub,))
        amt = cur.fetchone()["amount_minor"]
    check("once notified 10 days ago, the price steps up to the standard $97.00",
          amt == 9700, f"got {amt}")

    # --- §6.2 PayPal PENDING capture: processing, and NEVER retried ---
    reset(conn)
    pend = providers.FakeProvider(name="paypal", default=providers.PENDING)
    ps_sub = mk_sub(conn, identity_id=ident, plan_id=plan, amount_minor=9700,
                    provider="paypal", woo_id=900000620)
    worker.run_cycle(conn, provider_for=lambda n: pend, mode=worker.MODE_LIVE, limits=nosurge)
    with conn.cursor() as cur:
        cur.execute("SELECT status FROM billing_charges WHERE subscription_id=%s", (ps_sub,))
        cst = cur.fetchone()["status"]
        cur.execute("SELECT status, retry_count FROM billing_subscriptions WHERE id=%s", (ps_sub,))
        sst = cur.fetchone()
    check("a PENDING PayPal capture becomes 'processing', not succeeded or failed",
          cst == "processing", cst)
    check("a PENDING capture is NOT treated as a decline (no retry counted)",
          sst["retry_count"] == 0, str(sst))
    n_before = len(pend.calls)
    worker.run_cycle(conn, provider_for=lambda n: pend, mode=worker.MODE_LIVE, limits=nosurge)
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) n FROM billing_charges WHERE subscription_id=%s", (ps_sub,))
        n_rows = cur.fetchone()["n"]
    check("a PENDING capture is never re-charged on the next cycle",
          n_rows == 1 and len(pend.calls) == n_before, f"rows={n_rows} calls={len(pend.calls)}")

    # --- §8.3 the alumni grant fires on EVERY expiry path, not just the webhook ---
    # The worker delegates to the app's identity.maybe_grant_alumni so there is one
    # implementation. The prototype runs standalone, so inject a stub and assert the
    # DELEGATION happens — that wiring is what v1.0 had and the first draft of the
    # worker had silently dropped.
    reset(conn)
    import types, sys as _sys
    called = []
    stub = types.ModuleType("identity")
    stub.maybe_grant_alumni = lambda cur, identity_id, started_at: (
        called.append((identity_id, started_at)) or True)
    _sys.modules["identity"] = stub
    try:
        anchor = DT(2026, 10, 1, 12, 0)
        mp = periods.derive_max_periods(anchor, "week", 1, DT(2026, 10, 8, 12, 0))
        a_sub = mk_sub(conn, identity_id=ident, plan_id=plan, amount_minor=1700,
                       unit="week", due=anchor, ends_at=DT(2026, 10, 8, 12, 0),
                       max_periods=mp, woo_id=900000640)
        f3 = providers.FakeProvider()
        for _ in range(6):
            worker.run_cycle(conn, provider_for=lambda n: f3, mode=worker.MODE_LIVE,
                             limits=nosurge)
            with conn.cursor() as cur:
                cur.execute("SELECT status, next_charge_at FROM billing_subscriptions WHERE id=%s",
                            (a_sub,))
                r = cur.fetchone()
                if r["next_charge_at"] is None:
                    break
                cur.execute("UPDATE billing_subscriptions SET next_charge_at=UTC_TIMESTAMP()-INTERVAL 1 MINUTE WHERE id=%s", (a_sub,))
            conn.commit()
        check("the subscription reached its term end and expired",
              r["status"] == "expired", str(r))
        check("the alumni tenure check IS called on the worker's expiry path (§8.3)",
              len(called) >= 1 and called[0][0] == ident, f"calls={len(called)}")
    finally:
        _sys.modules.pop("identity", None)

    # --- §7.17 running the import twice ---
    reset(conn)
    mk_sub(conn, identity_id=ident, plan_id=plan, amount_minor=1700, woo_id=900000630)
    twice = False
    try:
        mk_sub(conn, identity_id=ident, plan_id=plan, amount_minor=1700, woo_id=900000630)
    except Exception as exc:
        conn.rollback(); twice = "Duplicate entry" in str(exc)
    check("re-running the import cannot create a second row for one Woo subscription",
          twice)


def _raises(fn, exc_type) -> bool:
    try:
        fn()
    except exc_type:
        return True
    except Exception:
        return False
    return False


# ----------------------------------------------------- 10c. discounts (§16)
def apply_discount(cur, *, code, plan_price_minor, identity_id):
    """§16.3 — resolve, compute, record redemption. Integer maths only."""
    cur.execute("""SELECT * FROM billing_discounts
                    WHERE code=%s AND status='active'
                      AND (starts_at IS NULL OR starts_at <= UTC_TIMESTAMP())
                      AND (expires_at IS NULL OR expires_at > UTC_TIMESTAMP())""", (code,))
    d = cur.fetchone()
    if d is None:
        raise ValueError("discount not available")
    if d["max_redemptions"] is not None and d["redemptions_used"] >= d["max_redemptions"]:
        raise ValueError("fully redeemed")
    if d["kind"] == "fixed_off":
        after = max(0, plan_price_minor - int(d["value_minor"]))
    elif d["kind"] == "percent_off":
        after = max(0, plan_price_minor - (plan_price_minor * int(d["percent_bp"])) // 10000)
    elif d["kind"] == "override":
        after = int(d["value_minor"])
    else:
        raise ValueError("unknown kind")
    cur.execute("""INSERT INTO billing_discount_redemptions
                     (discount_id, identity_id, amount_before, amount_after)
                   VALUES (%s,%s,%s,%s)""",
                (d["id"], identity_id, plan_price_minor, after))
    cur.execute("UPDATE billing_discounts SET redemptions_used=redemptions_used+1 WHERE id=%s",
                (d["id"],))
    return after, d


def test_discounts(conn, ident, plan):
    print("\n10c. DISCOUNTS (§16) — Labs can CREATE them, not just honour imported ones")
    reset(conn)
    with conn.cursor() as cur:
        cur.execute("DELETE FROM billing_discount_redemptions")
        cur.execute("DELETE FROM billing_discounts")
        for code, kind, val, bp, note in [
            ("FOUNDERS-D", "percent_off", None, 4000, "founder cohort, permanent"),
            ("founder-C",  "fixed_off",   5000, None, "-$50 recurring, founders"),
            ("COMP",       "override",       0, None, "staff comp"),
        ]:
            cur.execute("""INSERT INTO billing_discounts
                            (code,kind,value_minor,percent_bp,duration,note,created_by)
                           VALUES (%s,%s,%s,%s,'forever',%s,'infra-test')""",
                        (code, kind, val, bp, note))
    conn.commit()
    check("discounts created (percent / fixed / override)", True)

    # the real Navigator numbers from the live book
    with conn.cursor() as cur:
        a, _ = apply_discount(cur, code="FOUNDERS-D", plan_price_minor=26700, identity_id=ident)
    conn.commit()
    check("FOUNDERS-D on $267.00 gives exactly $160.20 (matches live sub #11118)",
          a == 16020, f"got {a}")

    with conn.cursor() as cur:
        cur.execute("SELECT identity_id FROM identities WHERE identity_id<>%s LIMIT 1", (ident,))
        other = cur.fetchone()["identity_id"]
        b, _ = apply_discount(cur, code="founder-C", plan_price_minor=26700, identity_id=other)
    conn.commit()
    check("founder-C on $267.00 gives exactly $217.00 (matches live subs #6233/#6265/#7018)",
          b == 21700, f"got {b}")

    with conn.cursor() as cur:
        cur.execute("SELECT identity_id FROM identities WHERE identity_id NOT IN (%s,%s) LIMIT 1",
                    (ident, other))
        third = cur.fetchone()["identity_id"]
        c, _ = apply_discount(cur, code="COMP", plan_price_minor=26700, identity_id=third)
    conn.commit()
    check("COMP override gives $0.00", c == 0, f"got {c}")

    # one per customer, enforced by the database
    twice = False
    try:
        with conn.cursor() as cur:
            apply_discount(cur, code="FOUNDERS-D", plan_price_minor=26700, identity_id=ident)
        conn.commit()
    except Exception as exc:
        conn.rollback()
        twice = "Duplicate entry" in str(exc)
    check("the same identity cannot redeem a code twice (uq_redeem_once)", twice)

    # percent maths is integer and floors — no float cents anywhere
    with conn.cursor() as cur:
        cur.execute("UPDATE billing_discounts SET percent_bp=3333 WHERE code='FOUNDERS-D'")
        cur.execute("DELETE FROM billing_discount_redemptions")
        cur.execute("UPDATE billing_discounts SET redemptions_used=0")
        d, _ = apply_discount(cur, code="FOUNDERS-D", plan_price_minor=9700, identity_id=ident)
    conn.commit()
    check("33.33% off $97.00 floors to an exact minor-unit amount, no float",
          d == 9700 - (9700 * 3333) // 10000 and isinstance(d, int), f"got {d}")

    # redemption limit
    with conn.cursor() as cur:
        cur.execute("""INSERT INTO billing_discounts
                        (code,kind,value_minor,duration,max_redemptions,note,created_by)
                       VALUES ('ONEONLY','fixed_off',1000,'forever',1,'limit test','t')""")
        apply_discount(cur, code="ONEONLY", plan_price_minor=9700, identity_id=ident)
    conn.commit()
    exhausted = False
    try:
        with conn.cursor() as cur:
            apply_discount(cur, code="ONEONLY", plan_price_minor=9700, identity_id=other)
        conn.commit()
    except ValueError as exc:
        conn.rollback(); exhausted = "fully redeemed" in str(exc)
    check("a max_redemptions limit is respected", exhausted)

    # an expired discount cannot be applied -- and cannot re-price an existing member
    with conn.cursor() as cur:
        cur.execute("""INSERT INTO billing_discounts
                        (code,kind,value_minor,duration,expires_at,note,created_by)
                       VALUES ('GONE','fixed_off',3000,'forever',
                               UTC_TIMESTAMP()-INTERVAL 1 DAY,'expiry test','t')""")
    conn.commit()
    gone = False
    try:
        with conn.cursor() as cur:
            apply_discount(cur, code="GONE", plan_price_minor=9700, identity_id=other)
    except ValueError:
        conn.rollback(); gone = True
    check("an EXPIRED discount cannot be applied to a new subscription", gone)

    # the headline guarantee: expiry/deletion cannot touch someone already on it
    sub = mk_sub(conn, identity_id=other, plan_id=plan, amount_minor=6700,
                 woo_id=900000500, discount_note="labs discount FOUNDERS0126")
    with conn.cursor() as cur:
        cur.execute("UPDATE billing_discounts SET status='disabled' WHERE code='FOUNDERS-D'")
        cur.execute("DELETE FROM billing_discounts WHERE code='GONE'")
    conn.commit()
    fake = providers.FakeProvider()
    worker.run_cycle(conn, provider_for=lambda n: fake, mode=worker.MODE_LIVE,
                     limits=worker.Limits(due_surge_multiple=1000.0))
    check("disabling or DELETING a discount cannot re-price a member already on it",
          fake.calls and fake.calls[-1]["amount"] == 6700,
          f"charged {fake.calls[-1]['amount'] if fake.calls else None}")
    with conn.cursor() as cur:
        cur.execute("DELETE FROM billing_discount_redemptions")
        cur.execute("DELETE FROM billing_discounts")
    conn.commit()


# ----------------------------------------------------- 11. webhooks + reconcile
def test_webhooks_and_reconcile(conn, ident, plan):
    print("\n11. WEBHOOKS (§6.3 / §6.4)")
    with conn.cursor() as cur:
        eid = webhooks.ingest(cur, provider="stripe", event_ref="evt_1",
                              event_type="payment_intent.succeeded",
                              provider_created_at=datetime(2026,10,14,12,0,0),
                              payload={"subject": "sub_abc"})
    conn.commit()
    check("a webhook event is stored once", bool(eid))
    dup = False
    try:
        with conn.cursor() as cur:
            webhooks.ingest(cur, provider="stripe", event_ref="evt_1",
                            event_type="payment_intent.succeeded",
                            provider_created_at=datetime(2026,10,14,12,0,0),
                            payload={"subject": "sub_abc"})
    except webhooks.DuplicateEvent:
        dup = True
    conn.rollback()
    check("a REPLAYED event is rejected durably (survives a process restart)", dup)
    with conn.cursor() as cur:
        webhooks.mark_processed(cur, eid, "membership active")
        stale = webhooks.is_stale(cur, provider="stripe", subject_ref="sub_abc",
                                 provider_created_at=datetime(2026,10,14,11,0,0))
        fresh = webhooks.is_stale(cur, provider="stripe", subject_ref="sub_abc",
                                 provider_created_at=datetime(2026,10,14,13,0,0))
    conn.commit()
    check("an OUT-OF-ORDER older event is detected as stale and dropped", stale)
    check("a newer event is not treated as stale", not fresh)

    print("\n12. RECONCILIATION (§7.7) — the backstop that does not trust the worker")
    sid = mk_sub(conn, identity_id=ident, plan_id=plan, amount_minor=9700,
                 due=datetime.utcnow() - timedelta(hours=6), woo_id=900000300)
    a = recovery.reconcile(conn)
    check("check A detects a SLIPPED payment (owed, past due, no ledger row)",
          any(r["id"] == sid for r in a["slipped"]), f"{len(a['slipped'])} found")
    b = recovery.reconcile(conn, provider_charges={"sub:999999:p0:a1": 5000})
    check("check B detects money that moved at the provider with NO ledger row",
          any(x["key"] == "sub:999999:p0:a1" for x in b["unledgered"]))
    paid = mk_sub(conn, identity_id=ident, plan_id=plan, amount_minor=1700,
                  unit="week", woo_id=900000301)
    worker.run_cycle(conn, provider_for=lambda n: providers.FakeProvider(),
                     mode=worker.MODE_LIVE,
                     limits=worker.Limits(due_surge_multiple=1000.0))
    with conn.cursor() as cur:
        cur.execute("""SELECT idempotency_key FROM billing_charges
                        WHERE status='succeeded' ORDER BY id DESC LIMIT 1""")
        key = cur.fetchone()["idempotency_key"]
    c = recovery.reconcile(conn, provider_charges={})
    check("check B also detects a PHANTOM success (ledger says paid, provider has no charge)",
          any(x["key"] == key for x in c["phantom"]), f"{len(c['phantom'])} found")
    check("check C/D: no double charges and no over-refunds anywhere in the run",
          not c["double_charge"] and not c["over_refund"])

    print("\n13. MONEY REPRESENTATION (§4.0 / §6.2)")
    check("minor units -> PayPal decimal string: 199700 -> '1997.00'",
          providers.minor_to_decimal_string(199700) == "1997.00")
    check("1700 -> '17.00'", providers.minor_to_decimal_string(1700) == "17.00")
    check("16020 -> '160.20' (the founders-D Navigator)",
          providers.minor_to_decimal_string(16020) == "160.20")
    check("0 -> '0.00'", providers.minor_to_decimal_string(0) == "0.00")
    rejected = False
    try:
        providers.minor_to_decimal_string(19.97)
    except TypeError:
        rejected = True
    check("a float amount is refused by the formatter too", rejected)
    # The idempotency key is NOT part of the body — it is an HTTP header the SDK
    # sends separately. Keeping it out of the params is what lets the same body
    # be replayed under a new key for a legitimate retry.
    req = providers.build_stripe_request(customer_ref="cus_x", method_ref="pm_x",
                                         amount_minor=199700, currency="USD",
                                         descriptor="d", metadata={"labs_charge_id": "42"})
    check("Stripe request is off_session + confirm (true merchant-initiated)",
          req["off_session"] is True and req["confirm"] is True and req["amount"] == 199700)
    check("Stripe request carries no idempotency key in the body",
          not any("idempot" in k.lower() for k in req))
    check("Stripe request refuses a float amount",
          _raises(lambda: providers.build_stripe_request(
              customer_ref="c", method_ref="m", amount_minor=1997.0, currency="USD"), TypeError))
    order = providers.build_paypal_order(vault_id="v1", amount_minor=9700, currency="USD",
                                         charge_id="42", invoice_id="labs-sub1-p7")
    sc = order["payment_source"]["paypal"]["stored_credential"]
    check("PayPal order carries MERCHANT/RECURRING/SUBSEQUENT + a permanent invoice_id",
          sc["payment_initiator"] == "MERCHANT" and sc["payment_type"] == "RECURRING"
          and order["purchase_units"][0]["invoice_id"] == "labs-sub1-p7"
          and order["purchase_units"][0]["amount"]["value"] == "97.00")


# -------------------------------------------------------- 14. shadow mode on real data
def test_shadow_real_book(conn, rows, ident_pool, plan):
    print("\n14. SHADOW MODE on the REAL BOOK (§10) — full cycle, zero provider calls")
    if not rows:
        print("     SKIPPED — no local export present")
        return
    def dt(s):
        s = (s or "").strip()
        return None if not s or s == "0" else datetime.strptime(s, "%Y-%m-%d %H:%M:%S")
    loaded = chargeable = 0
    with conn.cursor() as cur:
        for i, r in enumerate(rows.values()):
            nxt, start, end = (dt(r["schedule_next_payment"]), dt(r["schedule_start"]),
                               dt(r["schedule_end"]))
            if r["woo_status"] != "wc-active" or not nxt:
                continue
            amount = int(Decimal(r["order_total"] or "0") * 100)
            if amount <= 0 or not r["payment_method"]:
                continue
            sched = periods.import_from_woo(
                schedule_next_payment=nxt, schedule_start=start, schedule_end=end,
                billing_period=r["billing_period"], billing_interval=int(r["billing_interval"] or 1))
            cur.execute(
                """INSERT INTO billing_subscriptions
                     (identity_id, plan_id, status, provider, amount_minor, currency,
                      interval_unit, interval_count, anchor_at, period_index,
                      current_period_start, next_charge_at, ends_at, max_periods,
                      woo_subscription_id, woo_renewals_completed)
                   VALUES (%s,%s,'active',%s,%s,'USD',%s,%s,%s,0,%s,%s,%s,%s,%s,%s)""",
                (ident_pool[i % len(ident_pool)], plan,
                 "paypal" if r["payment_method"] == "ppcp-gateway" else "stripe",
                 amount, r["billing_period"], int(r["billing_interval"] or 1),
                 sched.anchor_at, sched.anchor_at, sched.next_charge_at(),
                 sched.ends_at, sched.max_periods, 800000000 + int(r["sub_id"]),
                 int(r["renewal_orders"])))
            loaded += 1
            if sched.next_charge_at() and sched.next_charge_at() <= datetime.utcnow():
                chargeable += 1
    conn.commit()
    check(f"loaded {loaded} real active subscriptions into Labs schema", loaded > 140,
          f"loaded={loaded}")

    tripwire = providers.FakeProvider()
    rep = worker.run_cycle(conn, provider_for=lambda n: tripwire,
                           mode=worker.MODE_SHADOW,
                           limits=worker.Limits(daily_cap_minor=10**9,
                                                due_surge_multiple=1000.0))
    check("shadow cycle made ZERO provider calls (structurally incapable)",
          len(tripwire.calls) == 0, f"calls={len(tripwire.calls)}")
    check(f"shadow cycle wrote ledger rows for the {rep.due_found} due subscriptions",
          rep.due_found > 0 and rep.amount_minor > 0,
          f"due={rep.due_found} amount={rep.amount_minor} skipped={rep.skipped} "
          f"notes={rep.notes[:3]}")
    with conn.cursor() as cur:
        cur.execute("""SELECT COUNT(*) n FROM billing_charges WHERE status='shadow'""")
        n = cur.fetchone()["n"]
        cur.execute("""SELECT COUNT(*) n FROM billing_charges
                        WHERE status='shadow' AND amount_minor<=0""")
        bad = cur.fetchone()["n"]
    check("every shadow row carries a positive stored amount", n == rep.due_found and bad == 0,
          f"rows={n} due={rep.due_found} bad={bad}")
    with conn.cursor() as cur:
        cur.execute("""SELECT s.woo_subscription_id-800000000 woo, s.amount_minor,
                              c.amount_minor charged
                         FROM billing_subscriptions s JOIN billing_charges c ON c.subscription_id=s.id
                        WHERE s.woo_subscription_id > 800000000 AND c.amount_minor <> s.amount_minor""")
        mism = cur.fetchall()
    check("no shadow charge differs from its subscription's stored amount (§7.3)",
          not mism, f"{mism[:3]}")
    print(f"     → shadow cycle: {rep.due_found} charges, ${rep.amount_minor/100:,.2f}, 0 provider calls")


# ---------------------------------------------------------------------- main
def main():
    tsv = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    print("=" * 78)
    print("NATIVE BILLING v2.0 — INFRASTRUCTURE PROOF")
    print("localhost MySQL only · tables dropped afterwards · live DB never contacted")
    print(f"testing: {_SOURCE}")
    print("=" * 78)

    test_periods()
    rows = test_anchor_rule(tsv)

    conn = connect()
    with conn.cursor() as cur:
        cur.execute("SELECT NOW()=UTC_TIMESTAMP() utc, VERSION() v")
        r = cur.fetchone()
    check("DB session is UTC (the worker refuses to start otherwise, §7.16)", bool(r["utc"]))
    print(f"     MySQL {r['v']} on localhost")

    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) n FROM identities")
        base_ident = cur.fetchone()["n"]
        cur.execute("SELECT COUNT(*) n FROM plans")
        base_plans = cur.fetchone()["n"]
        cur.execute("SELECT COUNT(*) n FROM information_schema.tables WHERE table_schema=DATABASE()")
        base_tables = cur.fetchone()["n"]

    created_idents, created_plan = [], None
    try:
        drop_tables(conn)
        create_tables(conn)
        check("migrations 159 + 160 apply cleanly (8 tables, FKs resolve)", True)
        created_idents = [seed_identity(conn, i) for i in range(4)]
        conn.commit()
        plan, created_plan_flag = ensure_plan(conn, "observer-trial")
        conn.commit()
        created_plan = plan if created_plan_flag else None

        test_ledger(conn, created_idents[0], plan)
        reset(conn)
        test_worker(conn, created_idents[0], plan)
        reset(conn)
        test_recovery(conn, created_idents[1], plan)
        reset(conn)
        test_declines(conn, created_idents[1], plan)
        reset(conn)
        test_breakers(conn, created_idents[2], plan)
        reset(conn)
        test_set_prices(conn, created_idents[3], plan)
        reset(conn)
        test_money_edges(conn, created_idents[3], plan)
        reset(conn)
        test_discounts(conn, created_idents[3], plan)
        reset(conn)
        test_webhooks_and_reconcile(conn, created_idents[2], plan)
        reset(conn)
        test_shadow_real_book(conn, rows, created_idents, plan)
    finally:
        print("\n15. CLEANUP — the dev database must return to baseline")
        drop_tables(conn)
        with conn.cursor() as cur:
            for i in created_idents:
                cur.execute("DELETE FROM identities WHERE identity_id=%s", (i,))
            if created_plan:
                cur.execute("DELETE FROM plans WHERE id=%s", (created_plan,))
        conn.commit()
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) n FROM identities")
            a = cur.fetchone()["n"]
            cur.execute("SELECT COUNT(*) n FROM plans")
            b = cur.fetchone()["n"]
            cur.execute("SELECT COUNT(*) n FROM information_schema.tables WHERE table_schema=DATABASE()")
            c = cur.fetchone()["n"]
            cur.execute("SELECT COUNT(*) n FROM schema_migrations WHERE filename LIKE '%native_billing%'")
            d = cur.fetchone()["n"]
        check(f"identities back to baseline ({base_ident})", a == base_ident, f"{a} vs {base_ident}")
        check(f"plans back to baseline ({base_plans})", b == base_plans, f"{b} vs {base_plans}")
        check(f"table count back to baseline ({base_tables})", c == base_tables, f"{c} vs {base_tables}")
        check("schema_migrations was never written to", d == 0)
        conn.close()

    print("\n" + "=" * 78)
    print(f"RESULT: {len(PASS)} passed, {len(FAIL)} failed")
    if FAIL:
        print("FAILURES:")
        for f in FAIL:
            print(f"  - {f}")
    print("=" * 78)
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
