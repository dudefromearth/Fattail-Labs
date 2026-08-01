#!/usr/bin/env python3
"""Make seeded Practice history drive Journey Process Integrity as if lived in real time.

Problems with pure historical seed (relative to wall-clock *now*):
  - Routine / persistence windows only look at the last ~30–90 days
  - Adherence needs Trade Log ``followed|partial|broke`` (not ``unknown``)
  - Retro cadence uses days since last completed_at — a May complete looks "late" in July
  - Identity created_at can be days-old while the book starts in 2022 → tenure clamps grades

This script (for a demo identity):
  1. Shifts all practice timestamps so the last trade day lands on *yesterday* (ET)
  2. Sets identity.created_at to the earliest trade (full grade ramp open)
  3. Tags open/close fills with process adherence from book outcomes + light noise

Usage:
  cd server && set -a && source ../.env && set +a
  .venv/bin/python activate_demo_integrity.py --email ernie@dudefromearth.com
  .venv/bin/python activate_demo_integrity.py --email ernie@dudefromearth.com --dry-run
"""

from __future__ import annotations

import argparse
import hashlib
import os
import random
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

_SERVER = Path(__file__).resolve().parent
_ROOT = _SERVER.parent
if str(_SERVER) not in sys.path:
    sys.path.insert(0, str(_SERVER))


def _load_env() -> None:
    env_file = _ROOT / ".env"
    if not env_file.is_file():
        return
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_env()

import db  # noqa: E402
import journey_scores as js  # noqa: E402
from routes.trade_log.common import _load_member_book  # noqa: E402
from trade_log_domain.matching import match_open_close  # noqa: E402

ET = ZoneInfo("America/New_York")


def _pick(seed: str, options: list[str], rng: random.Random) -> str:
    h = int(hashlib.sha256(seed.encode()).hexdigest()[:8], 16)
    rng.seed(h)
    return rng.choice(options)


def adherence_for_pair(
    open_id: int,
    pnl: float | None,
    rng: random.Random,
) -> str:
    """Process tag — not a P&L grade. Slight bias from outcome for realism only."""
    r = random.Random(open_id * 9973)
    x = r.random()
    if pnl is None:
        return r.choice(["followed", "followed", "partial", "unknown"])
    if pnl >= 0:
        # Winners still sometimes broke rules
        if x < 0.62:
            return "followed"
        if x < 0.88:
            return "partial"
        return "broke"
    # Losers often still followed
    if x < 0.45:
        return "followed"
    if x < 0.75:
        return "partial"
    return "broke"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--email", default="ernie@dudefromearth.com")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument(
        "--no-shift",
        action="store_true",
        help="Only tag adherence; do not re-anchor timeline to now",
    )
    args = ap.parse_args()
    rng = random.Random(7)

    today_et = datetime.now(ET).date()
    target_last_trade = today_et - timedelta(days=1)  # yesterday ET

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT identity_id, email, created_at FROM identities WHERE email=%s",
                (args.email,),
            )
            ident = cur.fetchone()
            if not ident:
                raise SystemExit(f"identity not found: {args.email}")
            iid = int(ident["identity_id"])

            cur.execute(
                """SELECT MIN(DATE(exec_at)) AS d0, MAX(DATE(exec_at)) AS d1,
                          COUNT(*) AS n
                   FROM member_trade_log_trades WHERE identity_id=%s""",
                (iid,),
            )
            tr = cur.fetchone()
            print(f"identity={iid} email={args.email}")
            print(f"trades span {tr['d0']} → {tr['d1']} (n={tr['n']})")

            d1 = tr["d1"]
            if isinstance(d1, datetime):
                d1 = d1.date()
            if d1 is None:
                raise SystemExit("no trades to anchor")

            delta_days = (target_last_trade - d1).days
            print(
                f"anchor: last trade {d1} → {target_last_trade} "
                f"(shift {delta_days:+d} days)"
            )

            if args.dry_run:
                trades, _ = _load_member_book(cur, iid, None)
                matched = match_open_close(trades)
                sample = []
                for m in matched[:5]:
                    c = m.get("close")
                    pnl = float(c["pnl_amount"]) if c and c.get("pnl_amount") is not None else None
                    sample.append(
                        (
                            m["open"]["id"],
                            adherence_for_pair(int(m["open"]["id"]), pnl, rng),
                            pnl,
                        )
                    )
                print("sample adherence plan:", sample)
                p = js.process_meters(cur, iid, role="administrator")
                print("current integrity", p.get("overall_percent"), p.get("grade"))
                return

            if not args.no_shift and delta_days != 0:
                # Two-phase shift avoids unique-key collisions on journal_date
                # (MySQL checks uniqueness row-by-row during a single UPDATE).
                buf = 10000

                cur.execute(
                    """UPDATE member_trade_log_trades
                       SET exec_at = DATE_ADD(exec_at, INTERVAL %s DAY),
                           updated_at = COALESCE(updated_at, created_at)
                       WHERE identity_id = %s AND exec_at IS NOT NULL""",
                    (delta_days, iid),
                )
                print("shifted trades:", cur.rowcount)

                cur.execute(
                    """UPDATE member_trade_log_legs l
                       INNER JOIN member_trade_log_trades t ON t.id = l.trade_id
                       SET l.expiry = DATE_ADD(l.expiry, INTERVAL %s DAY)
                       WHERE t.identity_id = %s AND l.expiry IS NOT NULL""",
                    (delta_days, iid),
                )
                print("shifted leg expiries:", cur.rowcount)

                # journal_date UNIQUE(identity_id, journal_date) — buffered shift
                cur.execute(
                    """UPDATE member_journal_sessions
                       SET journal_date = DATE_ADD(journal_date, INTERVAL %s DAY)
                       WHERE identity_id = %s""",
                    (buf + delta_days, iid),
                )
                cur.execute(
                    """UPDATE member_journal_sessions
                       SET journal_date = DATE_ADD(journal_date, INTERVAL %s DAY),
                           session_started_at = DATE_ADD(session_started_at, INTERVAL %s DAY),
                           created_at = DATE_ADD(created_at, INTERVAL %s DAY),
                           updated_at = DATE_ADD(COALESCE(updated_at, created_at), INTERVAL %s DAY),
                           closed_at = IF(closed_at IS NULL, NULL,
                               DATE_ADD(closed_at, INTERVAL %s DAY))
                       WHERE identity_id = %s""",
                    (
                        -buf,
                        delta_days,
                        delta_days,
                        delta_days,
                        delta_days,
                        iid,
                    ),
                )
                print("shifted journal sessions:", cur.rowcount)

                cur.execute(
                    """UPDATE member_journal_messages
                       SET created_at = DATE_ADD(created_at, INTERVAL %s DAY)
                       WHERE identity_id = %s""",
                    (delta_days, iid),
                )
                print("shifted journal messages:", cur.rowcount)

                cur.execute(
                    """UPDATE member_journal_date_closures
                       SET journal_date = DATE_ADD(journal_date, INTERVAL %s DAY)
                       WHERE identity_id = %s""",
                    (buf + delta_days, iid),
                )
                cur.execute(
                    """UPDATE member_journal_date_closures
                       SET journal_date = DATE_ADD(journal_date, INTERVAL %s DAY),
                           closed_at = DATE_ADD(closed_at, INTERVAL %s DAY)
                       WHERE identity_id = %s""",
                    (-buf, delta_days, iid),
                )
                print("shifted closures:", cur.rowcount)

                cur.execute(
                    """UPDATE member_retrospectives
                       SET scope_start = DATE_ADD(scope_start, INTERVAL %s DAY),
                           scope_end = DATE_ADD(scope_end, INTERVAL %s DAY),
                           completed_at = IF(completed_at IS NULL, NULL,
                               DATE_ADD(completed_at, INTERVAL %s DAY)),
                           created_at = DATE_ADD(created_at, INTERVAL %s DAY),
                           updated_at = DATE_ADD(updated_at, INTERVAL %s DAY)
                       WHERE identity_id = %s""",
                    (
                        delta_days,
                        delta_days,
                        delta_days,
                        delta_days,
                        delta_days,
                        iid,
                    ),
                )
                print("shifted retrospectives:", cur.rowcount)

            # Tenure: identity appears as old as the practice book
            cur.execute(
                """SELECT MIN(exec_at) AS t FROM member_trade_log_trades
                   WHERE identity_id = %s""",
                (iid,),
            )
            epoch = cur.fetchone()["t"]
            if epoch is not None:
                cur.execute(
                    """UPDATE identities SET created_at = %s
                       WHERE identity_id = %s""",
                    (epoch, iid),
                )
                print("identity.created_at →", epoch)

            # --- adherence tags from matched open/close pairs ---
            trades, _ = _load_member_book(cur, iid, None)
            matched = match_open_close(trades)
            tagged = 0
            for m in matched:
                o = m["open"]
                c = m.get("close")
                oid = int(o["id"])
                pnl = None
                if c and c.get("pnl_amount") is not None:
                    pnl = float(c["pnl_amount"])
                adh = adherence_for_pair(oid, pnl, rng)
                ids = [oid]
                if c:
                    ids.append(int(c["id"]))
                cur.execute(
                    f"""UPDATE member_trade_log_trades
                        SET adherence = %s
                        WHERE identity_id = %s AND id IN ({",".join(["%s"] * len(ids))})""",
                    (adh, iid, *ids),
                )
                tagged += cur.rowcount
            print(f"adherence tagged on {tagged} fill rows ({len(matched)} structures)")

            # Ensure last retro completed_at is within cadence horizon (if shift left a gap)
            cur.execute(
                """SELECT id, completed_at FROM member_retrospectives
                   WHERE identity_id = %s AND status = 'complete'
                   ORDER BY completed_at DESC LIMIT 1""",
                (iid,),
            )
            last = cur.fetchone()
            if last and last.get("completed_at"):
                last_c = last["completed_at"]
                if getattr(last_c, "tzinfo", None) is None:
                    last_c_cmp = last_c.replace(tzinfo=timezone.utc)
                else:
                    last_c_cmp = last_c
                now = datetime.now(timezone.utc)
                age = (now - last_c_cmp).days
                if age > 14:
                    # Pull latest complete to this past Saturday 10:00 ET for cadence
                    today_et = datetime.now(ET).date()
                    sat = today_et - timedelta(days=(today_et.weekday() - 5) % 7)
                    hold = datetime(
                        sat.year, sat.month, sat.day, 10, 15, tzinfo=ET
                    ).astimezone(timezone.utc).replace(tzinfo=None)
                    cur.execute(
                        """UPDATE member_retrospectives
                           SET completed_at = %s, updated_at = %s
                           WHERE id = %s AND identity_id = %s""",
                        (hold, hold, int(last["id"]), iid),
                    )
                    print(
                        f"nudged latest retro id={last['id']} completed_at → {hold} "
                        f"(was {age}d ago)"
                    )

    # Report integrity after commit
    with db.transaction() as conn:
        with conn.cursor() as cur:
            p = js.process_meters(cur, iid, role="administrator")
            print("\n=== Process Integrity AFTER ===")
            print("overall", p.get("overall_percent"), p.get("grade"))
            for m in p.get("meters") or []:
                print(
                    f"  {m.get('id')}: {m.get('percent')}% · {m.get('detail')} "
                    f"[{(m.get('grade') or {}).get('label')}]"
                )
            cur.execute(
                """SELECT adherence, COUNT(*) n FROM member_trade_log_trades
                   WHERE identity_id=%s GROUP BY adherence ORDER BY n DESC""",
                (iid,),
            )
            print("adherence dist:", cur.fetchall())
            cur.execute(
                """SELECT MIN(DATE(exec_at)) d0, MAX(DATE(exec_at)) d1
                   FROM member_trade_log_trades WHERE identity_id=%s""",
                (iid,),
            )
            print("trade span now:", cur.fetchone())
            cur.execute(
                """SELECT MAX(completed_at) c FROM member_retrospectives
                   WHERE identity_id=%s AND status='complete'""",
                (iid,),
            )
            print("last retro complete:", cur.fetchone())


if __name__ == "__main__":
    main()
