#!/usr/bin/env python3
"""Seed completed weekly retrospectives with an irregular human cadence.

Schedule (as requested):
  1. First ~6 weeks: hold each Saturday morning 9–12 America/New_York
  2. Skip one week
  3. Hold the following week
  4. Hold ~10 weeks in a row (weekly)
  5. Randomly miss a week
  6. Thereafter: mostly weekly, with a random skip every 5–10 weeks;
     some holds land Sunday ~18:00 ET instead of Saturday morning

Until the last activity week is covered.

Usage:
  cd server && set -a && source ../.env && set +a
  .venv/bin/python seed_weekly_retrospectives.py --email ernie@dudefromearth.com --dry-run
  .venv/bin/python seed_weekly_retrospectives.py --email ernie@dudefromearth.com --reset
"""

from __future__ import annotations

import argparse
import json
import os
import random
import sys
from collections import defaultdict
from datetime import date, datetime, time, timedelta
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
import journal_session_domain as jsd  # noqa: E402
import retrospective_agent as ra  # noqa: E402
import retrospective_domain as rd  # noqa: E402
from routes.trade_log.common import (  # noqa: E402
    _get_account,
    _load_member_book,
)
from trade_log_domain.matching import match_open_close  # noqa: E402

ET = ZoneInfo("America/New_York")


def _iso_week(d: date) -> tuple[int, int]:
    y, w, _ = d.isocalendar()
    return int(y), int(w)


def _week_monday(yw: tuple[int, int]) -> date:
    return date.fromisocalendar(yw[0], yw[1], 1)


def _week_label(yw: tuple[int, int]) -> str:
    mon = _week_monday(yw)
    sun = mon + timedelta(days=6)
    return f"{mon.isoformat()} → {sun.isoformat()} (ISO {yw[0]}-W{yw[1]:02d})"


def activity_weeks(cur, iid: int) -> list[tuple[int, int]]:
    """ISO weeks with trade activity (open or close fills) — not journal-only days."""
    weeks: set[tuple[int, int]] = set()
    cur.execute(
        """SELECT DISTINCT DATE(exec_at) AS d FROM member_trade_log_trades
           WHERE identity_id = %s AND exec_at IS NOT NULL""",
        (iid,),
    )
    for r in cur.fetchall():
        d = r["d"]
        if d is None:
            continue
        if isinstance(d, datetime):
            d = d.date()
        weeks.add(_iso_week(d))
    return sorted(weeks)


def closed_structures_by_week(
    matched: list[dict[str, Any]],
) -> dict[tuple[int, int], int]:
    """Count closed structures (not fills) by ISO week of the close."""
    out: dict[tuple[int, int], int] = defaultdict(int)
    for m in matched:
        c = m.get("close")
        if not c:
            continue
        cd = m.get("close_day")
        if not cd:
            continue
        d = date.fromisoformat(str(cd)[:10])
        out[_iso_week(d)] += 1
    return out


def _hold_datetime(yw: tuple[int, int], rng: random.Random) -> tuple[datetime, str]:
    mon = _week_monday(yw)
    use_sunday = rng.random() < 0.22
    if use_sunday:
        day = mon + timedelta(days=6)
        hour = rng.choice([17, 18, 18, 19])
        minute = rng.choice([0, 10, 20, 30, 45])
        note = "Sunday evening ET"
    else:
        day = mon + timedelta(days=5)
        hour = rng.randint(9, 11)
        minute = rng.choice([0, 5, 15, 20, 30, 40, 45, 55])
        note = "Saturday morning ET"
    local = datetime.combine(day, time(hour, minute), tzinfo=ET)
    hold_utc = local.astimezone(ZoneInfo("UTC")).replace(tzinfo=None)
    return hold_utc, note


def build_hold_schedule(
    weeks: list[tuple[int, int]],
    *,
    closes_by_week: dict[tuple[int, int], int],
    rng: random.Random,
    lag_calendar_days: int = 21,
    min_trades_after_lag: tuple[int, int] = (5, 6),
) -> list[tuple[tuple[int, int], datetime, str]]:
    """Return [(iso_week, hold_utc_naive, note), ...] for weeks that get a retro.

    Cadence (skips, Sat AM / Sun evening) as before, plus:
    **Trading lags** — when calendar gap since last hold exceeds
    ``lag_calendar_days``, wait until at least 5–6 closed structures have
    accumulated since the last retro, then hold (covers sparse years).
    """
    if not weeks:
        return []

    n = len(weeks)
    # Intent: which week indices want a hold vs intentional skip
    intent_hold: set[int] = set()
    i = 0

    def take_run(count: int) -> None:
        nonlocal i
        c = 0
        while i < n and c < count:
            intent_hold.add(i)
            i += 1
            c += 1

    def skip(count: int = 1) -> None:
        nonlocal i
        i = min(n, i + count)

    take_run(rng.randint(5, 6))
    skip(1)
    take_run(1)
    take_run(rng.randint(9, 11))
    skip(1)
    while i < n:
        take_run(rng.randint(5, 10))
        if i < n:
            skip(1)
    intent_hold.add(n - 1)  # last trade week always covered

    min_after_lag = rng.randint(min_trades_after_lag[0], min_trades_after_lag[1])
    schedule: list[tuple[tuple[int, int], datetime, str]] = []
    last_hold_week_end: date | None = None
    cum_closes = 0
    pending = False  # deferred hold while lag + not enough trades

    for idx, yw in enumerate(weeks):
        cum_closes += int(closes_by_week.get(yw, 0))
        mon = _week_monday(yw)
        week_end = mon + timedelta(days=6)
        is_last = idx == n - 1
        want = idx in intent_hold or pending or is_last
        if not want:
            continue

        lag = False
        if last_hold_week_end is not None:
            gap = (mon - last_hold_week_end).days
            lag = gap > lag_calendar_days

        if lag and not is_last and cum_closes < min_after_lag:
            # Wait for more closed structures before reviewing
            pending = True
            continue

        hold_utc, note = _hold_datetime(yw, rng)
        if lag and cum_closes >= min_after_lag:
            note = f"{note}; after lag ({cum_closes} closes since prior)"
        schedule.append((yw, hold_utc, note))
        last_hold_week_end = week_end
        cum_closes = 0
        pending = False

    return schedule


def reset_retros(cur, iid: int) -> None:
    cur.execute(
        "DELETE FROM member_journal_date_closures WHERE identity_id = %s",
        (iid,),
    )
    cur.execute(
        "DELETE FROM member_habit_plans WHERE identity_id = %s",
        (iid,),
    )
    cur.execute(
        "DELETE FROM member_retrospectives WHERE identity_id = %s",
        (iid,),
    )


def create_complete_retro(
    cur,
    iid: int,
    *,
    hold_at: datetime,
    account_id: int | None,
    role: str = "administrator",
    body_md: str = "",
) -> dict[str, Any]:
    """Create → gather → complete one retrospective as of hold_at."""
    claims = {"role": role, "identity_id": iid}
    open_r = rd.open_retrospective(cur, iid)
    if open_r:
        raise RuntimeError(f"open retro still present: {open_r}")

    scope = rd.resolve_scope(cur, iid, now=hold_at)
    is_maiden = bool(scope["is_maiden"])
    scope_start = scope["scope_start"]
    scope_end = hold_at

    period_index = rd.next_period_index(cur, iid)
    cadence_days = rd.effective_cadence_days(cur, iid, claims)
    interrupted = rd.period_was_interrupted(
        cur, iid, scope_start, scope_end, cadence_days
    )
    # Maiden is never interrupted in product
    if is_maiden:
        interrupted = False

    title = (
        "Maiden journey"
        if is_maiden
        else f"Weekly review · {scope_end.date().isoformat()}"
    )
    prompt_vid = ra.active_prompt_version_id(cur)

    cur.execute(
        """INSERT INTO member_retrospectives
             (identity_id, status, is_maiden, scope_start, scope_end,
              title, body_md, prompt_version_id, cadence_days_at_period,
              period_index, interrupted, created_at, updated_at)
           VALUES (%s, 'draft', %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        (
            iid,
            1 if is_maiden else 0,
            scope_start,
            scope_end,
            title,
            body_md,
            prompt_vid,
            cadence_days,
            period_index,
            1 if interrupted else 0,
            hold_at,
            hold_at,
        ),
    )
    rid = int(cur.lastrowid)

    # Book scope
    book_account_id = int(account_id) if account_id is not None else None
    account_scope: dict[str, Any] = {"account_id": None, "label": "All accounts"}
    if book_account_id is not None:
        acct = _get_account(cur, iid, book_account_id)
        account_scope = {
            "account_id": int(acct["id"]),
            "label": str(acct.get("label") or f"Account {book_account_id}"),
            "broker": acct.get("broker"),
        }
    trades, _accounts = _load_member_book(cur, iid, book_account_id)
    prior = rd.last_complete_retrospective(cur, iid)
    prior_id = int(prior["id"]) if prior else None

    report, comparison = rd.gather_report(
        cur,
        iid,
        scope_start,
        scope_end,
        is_maiden=is_maiden,
        prior_id=None if is_maiden else prior_id,
        role=role,
        trades=trades,
    )
    report["account_scope"] = account_scope
    notice = rd.build_interruption_notice(
        interrupted=interrupted,
        scope_start=scope_start,
        scope_end=scope_end,
        cadence_days=cadence_days,
        is_maiden=is_maiden,
        prior_completed_at=scope_start if not is_maiden else None,
    )
    report["interruption"] = notice

    cur.execute(
        """UPDATE member_retrospectives
           SET status = 'ready',
               scope_end = %s,
               report_json = %s,
               comparison_json = %s,
               updated_at = %s
           WHERE id = %s AND identity_id = %s""",
        (
            scope_end,
            json.dumps(report, default=str),
            json.dumps(comparison, default=str),
            hold_at,
            rid,
            iid,
        ),
    )

    # Complete with historical completed_at
    cur.execute(
        """UPDATE member_retrospectives
           SET status = 'complete', completed_at = %s, updated_at = %s
           WHERE id = %s AND identity_id = %s""",
        (hold_at, hold_at, rid, iid),
    )
    closed = jsd.apply_closures_on_retro_complete(
        cur,
        iid,
        retrospective_id=rid,
        scope_start=scope_start,
        scope_end=scope_end,
    )
    return {
        "id": rid,
        "is_maiden": is_maiden,
        "interrupted": interrupted,
        "scope_start": scope_start.isoformat(),
        "scope_end": scope_end.isoformat(),
        "completed_at": hold_at.isoformat(),
        "closed_dates": len(closed or []),
        "title": title,
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--email", default="ernie@dudefromearth.com")
    ap.add_argument("--account-label", default="0DTE Book")
    ap.add_argument("--seed", type=int, default=42, help="RNG seed for schedule")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument(
        "--reset",
        action="store_true",
        help="Delete existing retros + closures for this identity first",
    )
    ap.add_argument("--limit", type=int, default=0, help="Max retros to create (0=all)")
    args = ap.parse_args()
    rng = random.Random(args.seed)

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT identity_id, email FROM identities WHERE email=%s",
                (args.email,),
            )
            ident = cur.fetchone()
            if not ident:
                raise SystemExit(f"identity not found: {args.email}")
            iid = int(ident["identity_id"])

            # Cadence weekly
            cur.execute(
                "UPDATE identities SET retro_cadence_days = 7 WHERE identity_id = %s",
                (iid,),
            )

            cur.execute(
                """SELECT id FROM member_trade_log_accounts
                   WHERE identity_id=%s AND label=%s LIMIT 1""",
                (iid, args.account_label),
            )
            acct = cur.fetchone()
            account_id = int(acct["id"]) if acct else None

            weeks = activity_weeks(cur, iid)
            trades, _ = _load_member_book(cur, iid, account_id)
            matched = match_open_close(trades)
            closes_by_week = closed_structures_by_week(matched)
            schedule = build_hold_schedule(
                weeks, closes_by_week=closes_by_week, rng=rng
            )
            if args.limit and args.limit > 0:
                schedule = schedule[: args.limit]

            print(
                f"identity={iid} email={args.email} trade_weeks={len(weeks)} "
                f"scheduled_holds={len(schedule)} dry_run={args.dry_run}"
            )
            if args.dry_run:
                for i, (yw, hold, note) in enumerate(schedule[:20], 1):
                    ncl = closes_by_week.get(yw, 0)
                    print(
                        f"  {i:3d}. {_week_label(yw)}  closes_in_week={ncl}  "
                        f"hold={hold.isoformat()}Z  ({note})"
                    )
                if len(schedule) > 20:
                    print(f"  ... +{len(schedule)-20} more")
                held_set = {yw for yw, _, _ in schedule}
                skipped = [w for w in weeks if w not in held_set]
                print(f"skipped_or_deferred_weeks={len(skipped)} (first 12): {skipped[:12]}")
                return

            if args.reset:
                reset_retros(cur, iid)
                print("reset: deleted prior retros/closures/habit plans")
            else:
                open_r = rd.open_retrospective(cur, iid)
                if open_r:
                    cur.execute(
                        """UPDATE member_retrospectives SET status='abandoned'
                           WHERE id=%s AND identity_id=%s""",
                        (int(open_r["id"]), iid),
                    )
                    print(f"abandoned open retro id={open_r['id']}")

    # Create each retro in its own transaction so progress survives
    created = 0
    for i, (yw, hold_at, note) in enumerate(schedule, 1):
        body = (
            f"Weekly retrospective for {_week_label(yw)}.\n\n"
            f"Held {note} (seeded historical schedule).\n"
            f"Process review of journals and the 0DTE book in this window."
        )
        try:
            with db.transaction() as conn:
                with conn.cursor() as cur:
                    info = create_complete_retro(
                        cur,
                        iid,
                        hold_at=hold_at,
                        account_id=account_id,
                        body_md=body,
                    )
            created += 1
            print(
                f"{i:3d}/{len(schedule)} id={info['id']} "
                f"maiden={info['is_maiden']} interrupted={info['interrupted']} "
                f"scope={info['scope_start'][:10]}→{info['scope_end'][:10]} "
                f"closed_dates={info['closed_dates']} ({note})"
            )
        except Exception as e:
            print(f"ERROR at {yw} hold={hold_at}: {e}")
            raise

    print(f"done: created={created} complete retrospectives")


if __name__ == "__main__":
    main()
