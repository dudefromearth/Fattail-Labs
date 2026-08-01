#!/usr/bin/env python3
"""Seed learning + live (+ light routine densify) so all Process Integrity drivers fire.

Call after trade/journal/retro seeds and activate_demo_integrity.py.

Usage:
  cd server && set -a && source ../.env && set +a
  .venv/bin/python seed_demo_meter_signals.py --email ernie@dudefromearth.com
"""

from __future__ import annotations

import argparse
import os
import random
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
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
import journal_session_domain as jsd  # noqa: E402

ET = ZoneInfo("America/New_York")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--email", default="ernie@dudefromearth.com")
    ap.add_argument("--live-weeks", type=int, default=10, help="Consecutive live weeks (cap 12)")
    ap.add_argument("--lesson-days", type=int, default=6, help="Distinct lesson-complete days in last 14d")
    ap.add_argument("--seed", type=int, default=11)
    args = ap.parse_args()
    rng = random.Random(args.seed)

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT identity_id FROM identities WHERE email=%s",
                (args.email,),
            )
            row = cur.fetchone()
            if not row:
                raise SystemExit(f"identity not found: {args.email}")
            iid = int(row["identity_id"])

            now_et = datetime.now(ET)
            today = now_et.date()

            # --- Live presence: consecutive ISO weeks with a check-in ---
            # session_key unique per identity; invent demo session keys
            cur.execute(
                "DELETE FROM live_session_checkins WHERE identity_id=%s AND session_key LIKE 'demo-live-%%'",
                (iid,),
            )
            live_weeks = max(1, min(12, args.live_weeks))
            # Start from current week, walk back
            cursor = today
            # Align to Monday of current week then place check-in mid-week
            for w in range(live_weeks):
                mon = cursor - timedelta(days=cursor.weekday())  # Monday
                # Wednesday 15:05 ET live (typical market hours show)
                starts_local = datetime(
                    mon.year, mon.month, mon.day, 15, 0, tzinfo=ET
                ) + timedelta(days=2)
                if starts_local.date() > today:
                    starts_local = datetime(
                        mon.year, mon.month, mon.day, 15, 0, tzinfo=ET
                    )
                check_local = starts_local + timedelta(minutes=12)
                starts_utc = starts_local.astimezone(timezone.utc).replace(tzinfo=None)
                check_utc = check_local.astimezone(timezone.utc).replace(tzinfo=None)
                key = f"demo-live-{mon.isocalendar()[0]}-W{mon.isocalendar()[1]:02d}"
                cur.execute(
                    """INSERT INTO live_session_checkins
                         (identity_id, session_key, starts_at, checked_in_at)
                       VALUES (%s, %s, %s, %s)
                       ON DUPLICATE KEY UPDATE
                         starts_at = VALUES(starts_at),
                         checked_in_at = VALUES(checked_in_at)""",
                    (iid, key, starts_utc, check_utc),
                )
                cursor = mon - timedelta(days=1)  # previous week
            print(f"live check-ins: {live_weeks} consecutive weeks")

            # --- Learning: lesson completes on distinct days ---
            cur.execute("SELECT id FROM lessons ORDER BY id LIMIT 20")
            lesson_ids = [int(r["id"]) for r in cur.fetchall()]
            if not lesson_ids:
                print("WARN: no lessons — skip learning seed")
            else:
                # enroll in first course if needed
                cur.execute(
                    """SELECT c.id FROM courses c
                       JOIN modules m ON m.course_id = c.id
                       JOIN lessons l ON l.module_id = m.id
                       WHERE l.id = %s LIMIT 1""",
                    (lesson_ids[0],),
                )
                cr = cur.fetchone()
                if cr:
                    cur.execute(
                        """INSERT IGNORE INTO enrollments (identity_id, course_id, enrolled_at)
                           VALUES (%s, %s, %s)""",
                        (
                            iid,
                            int(cr["id"]),
                            datetime.now(timezone.utc).replace(tzinfo=None)
                            - timedelta(days=120),
                        ),
                    )

                # clear prior demo lesson progress for clean re-run? only touch our completes in window
                n_days = max(1, min(args.lesson_days, 12))
                # spread over last 14 days, weekdays preferred
                candidates: list[date] = []
                d = today
                while len(candidates) < 20 and (today - d).days < 20:
                    if d.weekday() < 5:
                        candidates.append(d)
                    d -= timedelta(days=1)
                days = candidates[:n_days]
                if len(days) < n_days:
                    days = [today - timedelta(days=i) for i in range(n_days)]

                # remove old progress for these lessons for this identity (re-seed)
                cur.execute(
                    f"""DELETE FROM lesson_progress
                        WHERE identity_id=%s AND lesson_id IN ({",".join(["%s"]*len(lesson_ids))})""",
                    (iid, *lesson_ids),
                )
                for i, day in enumerate(days):
                    lid = lesson_ids[i % len(lesson_ids)]
                    completed = datetime(
                        day.year, day.month, day.day, 20, 15 + (i % 30), tzinfo=ET
                    ).astimezone(timezone.utc).replace(tzinfo=None)
                    cur.execute(
                        """INSERT INTO lesson_progress
                             (identity_id, lesson_id, watch_seconds, last_position, completed_at, updated_at)
                           VALUES (%s, %s, %s, %s, %s, %s)
                           ON DUPLICATE KEY UPDATE
                             completed_at = VALUES(completed_at),
                             updated_at = VALUES(updated_at),
                             watch_seconds = VALUES(watch_seconds)""",
                        (iid, lid, 600 + i * 30, 600 + i * 30, completed, completed),
                    )
                print(f"lesson completes: {len(days)} days → lessons {days}")

            # --- Persistence densify: ensure practice activity in last 10 of 12 weeks ---
            # Prefer adding a short journal message on a mid-week day if that week is empty.
            # Uses list_member_message_ny_dates path (message created_at).
            for weeks_ago in range(0, 11):
                # Wednesday of that week
                mon = today - timedelta(days=today.weekday() + 7 * weeks_ago)
                wed = mon + timedelta(days=2)
                if wed > today:
                    wed = today
                # Check if any message already on that NY day
                since = datetime(wed.year, wed.month, wed.day, tzinfo=ET).astimezone(
                    timezone.utc
                ).replace(tzinfo=None)
                until = since + timedelta(days=1)
                cur.execute(
                    """SELECT COUNT(*) n FROM member_journal_messages
                       WHERE identity_id=%s AND author='member'
                         AND created_at >= %s AND created_at < %s""",
                    (iid, since, until),
                )
                if int(cur.fetchone()["n"] or 0) > 0:
                    continue
                # Ensure a session exists for that journal_date (or create reflection)
                try:
                    jsd.assert_date_open(cur, iid, wed)
                except jsd.JournalSessionError:
                    continue
                sess = jsd.create_session(
                    cur,
                    iid,
                    journal_date=wed,
                    tag="reflection",
                    now=datetime.combine(wed, datetime.min.time()) + timedelta(hours=14),
                )
                sid = int(sess["id"])
                # Only add if no member messages yet
                cur.execute(
                    """SELECT COUNT(*) n FROM member_journal_messages
                       WHERE session_id=%s AND author='member'""",
                    (sid,),
                )
                if int(cur.fetchone()["n"] or 0) > 0:
                    continue
                body = (
                    f"{wed.isoformat()}: brief process note — reviewing plan "
                    f"adherence and tomorrow's levels. (demo densify for persistence)"
                )
                when = datetime(
                    wed.year, wed.month, wed.day, 14, 30, tzinfo=ET
                ).astimezone(timezone.utc).replace(tzinfo=None)
                # store as naive UTC matching rest of seed
                jsd.append_member_message(
                    cur,
                    iid,
                    sid,
                    body_md=body,
                    now=when,
                )
            print("persistence densify: short notes on sparse recent weeks")

            # --- Routine densify last 7 days: a few more journal beats if thin ---
            for days_ago in (0, 1, 2, 3, 5):
                d = today - timedelta(days=days_ago)
                if d.weekday() >= 5:
                    continue
                since = datetime(d.year, d.month, d.day, tzinfo=ET).astimezone(
                    timezone.utc
                ).replace(tzinfo=None)
                until = since + timedelta(days=1)
                cur.execute(
                    """SELECT COUNT(*) n FROM member_journal_messages
                       WHERE identity_id=%s AND author='member'
                         AND created_at >= %s AND created_at < %s""",
                    (iid, since, until),
                )
                if int(cur.fetchone()["n"] or 0) > 0:
                    continue
                try:
                    jsd.assert_date_open(cur, iid, d)
                except jsd.JournalSessionError:
                    continue
                sess = jsd.create_session(
                    cur,
                    iid,
                    journal_date=d,
                    tag="reflection",
                    now=datetime.combine(d, datetime.min.time()) + timedelta(hours=9),
                )
                sid = int(sess["id"])
                cur.execute(
                    """SELECT COUNT(*) n FROM member_journal_messages
                       WHERE session_id=%s AND author='member'""",
                    (sid,),
                )
                if int(cur.fetchone()["n"] or 0) > 0:
                    continue
                when = datetime(d.year, d.month, d.day, 9, 40, tzinfo=ET).astimezone(
                    timezone.utc
                ).replace(tzinfo=None)
                jsd.append_member_message(
                    cur,
                    iid,
                    sid,
                    body_md=(
                        f"{d.isoformat()}: morning process — markets and plan. "
                        f"(demo routine densify)"
                    ),
                    now=when,
                )
            print("routine densify: recent weekday process notes")

    with db.transaction() as conn:
        with conn.cursor() as cur:
            p = js.process_meters(cur, iid, role="administrator")
            print("\n=== Process Integrity AFTER meter seed ===")
            print("overall", p.get("overall_percent"), p.get("grade"))
            for m in p.get("meters") or []:
                print(
                    f"  {m.get('id')}: {m.get('percent')}% · {m.get('detail')} "
                    f"[{(m.get('grade') or {}).get('label')}]"
                )


if __name__ == "__main__":
    main()
