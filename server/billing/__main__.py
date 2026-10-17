"""Billing worker entry point.  Spec §5.5.

    python -m billing.worker        (via this module)
    python -m billing               (same thing)

A STANDALONE PROCESS, not a task inside the API. Two reasons: an API deploy or
`launchctl kickstart` must never interrupt a charge cycle, and the worker must
be independently stoppable without taking the site down.

⚠️ Install as a LaunchDaemon, NOT a GUI LaunchAgent. MiniTwo's GUI agents die on
console logout — already bitten on that box. A billing worker that silently
stops when someone logs out is the worst possible version of this.

MODES (LABS_BILLING_MODE):
    off     refuses to start. The default, so a deploy cannot start charging.
    shadow  full due-detection, period maths and ledger writes, ZERO provider
            calls. Structurally incapable of moving money.
    live    real charges.
"""

from __future__ import annotations

import logging
import signal
import sys
import time

import db
from config import get_config

from billing import providers, recovery, worker

log = logging.getLogger("labs.billing.worker")
_stop = False


def _handle_signal(signum, _frame):
    global _stop
    log.info("signal %s received — finishing the current cycle then stopping", signum)
    _stop = True


def _assert_utc(conn) -> None:
    """§7.16 — the worker refuses to start on a non-UTC session.

    DATETIME DEFAULT CURRENT_TIMESTAMP resolves in the SESSION timezone. On a
    host running time_zone=SYSTEM that silently writes local time into a table
    whose other columns are UTC, and the recovery sweeper is then wrong by the
    host's offset. Set it explicitly, then verify.
    """
    with conn.cursor() as cur:
        cur.execute("SET SESSION time_zone = '+00:00'")
        cur.execute("SELECT NOW() = UTC_TIMESTAMP() AS ok")
        if not cur.fetchone()["ok"]:
            raise SystemExit("REFUSING TO START: database session is not UTC (§7.16)")


def run_once() -> int:
    cfg = get_config()
    mode = cfg.billing_mode
    if mode == "off":
        log.warning("LABS_BILLING_MODE=off — nothing to do")
        return 0

    limits = worker.Limits(
        daily_cap_minor=cfg.billing_daily_cap_minor,
        lease_seconds=cfg.billing_lease_sec,
    )
    conn = db.connect()
    try:
        _assert_utc(conn)
        # Resolve open charges BEFORE taking new ones: an unresolved charge from
        # the last cycle must not sit behind a queue of fresh ones (§7.2).
        acted = recovery.recover_open_charges(conn, provider_for=providers.for_name)
        for a in acted:
            log.warning("recovery: %s", a)

        rep = worker.run_cycle(conn, provider_for=providers.for_name, mode=mode,
                               worker_id=f"w-{int(time.time())}", limits=limits)
        log.info("cycle: mode=%s due=%s ok=%s failed=%s skipped=%s amount=%s%s",
                 rep.mode, rep.due_found, rep.charged_ok, rep.charged_failed,
                 rep.skipped, rep.amount_minor,
                 f" HALTED: {rep.halted_reason}" if rep.halted_reason else "")
        for n in rep.notes:
            log.info("  %s", n)
        if rep.halted_reason:
            # A halt is loud and manual to clear — over-caution here costs hours
            # of delayed renewals; under-caution costs the business (§7.10).
            log.error("CYCLE HALTED — %s", rep.halted_reason)
            return 2
        return 0
    finally:
        try:
            db.get_pool().put(conn)
        except Exception:
            pass


def main() -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    cfg = get_config()
    if cfg.billing_mode == "off":
        log.error("LABS_BILLING_MODE=off — the worker will not start. "
                  "Set it to shadow or live deliberately.")
        return 1

    signal.signal(signal.SIGTERM, _handle_signal)
    signal.signal(signal.SIGINT, _handle_signal)

    once = "--once" in sys.argv
    interval = cfg.billing_worker_interval_sec
    log.info("billing worker starting: mode=%s interval=%ss providers=%s%s",
             cfg.billing_mode, interval, providers.available(),
             " (single cycle)" if once else "")

    while not _stop:
        try:
            rc = run_once()
        except Exception:
            # Never die on one bad cycle. The due query has no lower bound, so
            # the next cycle re-picks up everything this one missed (§5.1).
            log.exception("cycle raised — continuing")
            rc = 3
        if once:
            return rc
        for _ in range(interval):
            if _stop:
                break
            time.sleep(1)
    log.info("billing worker stopped cleanly")
    return 0


if __name__ == "__main__":
    sys.exit(main())
