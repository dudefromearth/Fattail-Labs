"""Auto-close answered help tickets after N days of member silence (default 7).

A ticket sits in 'answered' only when the team sent the last message — a member
reply flips it back to 'open' (see routes/help.add_my_message). So 'answered'
plus an answered_at older than the window means: we replied and the member never
came back. Close it and send a courteous "closed after no reply" email.

Run manually:
    python -m help_autoclose --dry-run       # list what would close, send nothing
    python -m help_autoclose                 # close + email
    python -m help_autoclose --days 7 --silent   # close, no emails (backlog sweep)

Scheduled daily via ~/Library/LaunchAgents/ai.fattail.labs.help-autoclose.plist,
which runs help_autoclose_run.sh (loads the API's env, then this module).
"""

from __future__ import annotations

import argparse
import logging

import db
import help as help_domain

log = logging.getLogger("help_autoclose")

WINDOW_DAYS = 7
CLOSE_REASON = "auto_no_response_7d"


def find_stale(cur, days: int) -> list[dict]:
    """Answered tickets whose last public message is ours and older than `days`."""
    cur.execute(
        """SELECT q.id, q.email, q.subject
             FROM help_questions q
            WHERE q.status = 'answered'
              AND q.answered_at IS NOT NULL
              AND q.answered_at <= (NOW() - INTERVAL %s DAY)
              AND (SELECT m.author_role FROM help_messages m
                     WHERE m.question_id = q.id AND m.visibility = 'public'
                     ORDER BY m.id DESC LIMIT 1) = 'admin'
            ORDER BY q.id""",
        (days,),
    )
    return cur.fetchall()


def run(*, dry_run: bool = False, silent: bool = False, days: int = WINDOW_DAYS) -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            rows = find_stale(cur, days)
    print(f"[help_autoclose] {len(rows)} ticket(s) answered >= {days}d ago with no member reply")
    if dry_run:
        for r in rows:
            print(f"  would close #{int(r['id'])} <{r['email']}> — {r['subject']!r}")
        return 0

    closed = 0
    for r in rows:
        qid = int(r["id"])
        email = r["email"]
        subject = r["subject"] or ""
        # Close in its own txn, re-checking status so a member reply mid-run wins.
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE help_questions SET status = 'closed', closed_reason = %s "
                    "WHERE id = %s AND status = 'answered'",
                    (CLOSE_REASON, qid),
                )
                if cur.rowcount == 0:
                    print(f"  skip #{qid} — no longer 'answered' (member replied / already closed)")
                    continue
        if silent:
            print(f"  closed #{qid} <{email}> (no email — silent)")
        else:
            status = help_domain.email_member_ticket_autoclosed(
                member_email=email, question_id=qid, subject=subject, days=days,
            )
            print(f"  closed #{qid} <{email}> — email {status}")
        closed += 1
    print(f"[help_autoclose] done — {closed} closed")
    return closed


def main(argv=None) -> None:
    ap = argparse.ArgumentParser(description="Auto-close stale answered help tickets.")
    ap.add_argument("--dry-run", action="store_true", help="list only; change nothing")
    ap.add_argument("--silent", action="store_true", help="close without emailing (backlog sweep)")
    ap.add_argument("--days", type=int, default=WINDOW_DAYS, help="silence window in days")
    args = ap.parse_args(argv)
    logging.basicConfig(level=logging.INFO)
    run(dry_run=args.dry_run, silent=args.silent, days=args.days)


if __name__ == "__main__":
    main()
