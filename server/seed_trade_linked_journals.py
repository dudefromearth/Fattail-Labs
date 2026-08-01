#!/usr/bin/env python3
"""Seed short trade-linked journal conversations for an identity's 0DTE book.

For each calendar day with an open or close fill on the target account:
  - create (or reuse) one Journal session for that date
  - write a short member ↔ agent conversation referencing the day's structures
  - include a factual week book-context note (process framing; not profit theater)

Usage:
  cd server && set -a && source ../.env && set +a
  .venv/bin/python seed_trade_linked_journals.py --email ernie@dudefromearth.com
  .venv/bin/python seed_trade_linked_journals.py --email ernie@dudefromearth.com --dry-run
  .venv/bin/python seed_trade_linked_journals.py --email ernie@dudefromearth.com --limit 20

Idempotent: skips dates that already have member messages unless --force.
"""

from __future__ import annotations

import argparse
import hashlib
import os
import sys
from collections import defaultdict
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Any

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
import identity as identity_mod  # noqa: E402
import journal_session_domain as jsd  # noqa: E402
from routes.trade_log.common import _load_member_book  # noqa: E402
from trade_log_domain.matching import match_open_close  # noqa: E402
from trade_log_domain.structure import ymd_from_exec  # noqa: E402


def _ymd(s: Any) -> str | None:
    if s is None:
        return None
    if isinstance(s, date) and not isinstance(s, datetime):
        return s.isoformat()
    return ymd_from_exec(str(s))


def _iso_week(d: date) -> tuple[int, int]:
    y, w, _ = d.isocalendar()
    return int(y), int(w)


def _pick(day: str, options: list[str]) -> str:
    h = int(hashlib.sha256(day.encode()).hexdigest()[:8], 16)
    return options[h % len(options)]


def _fmt_money(n: float) -> str:
    sign = "+" if n > 0 else ""
    return f"{sign}${n:,.0f}"


def _structure_blurb(m: dict[str, Any]) -> str:
    o = m["open"]
    c = m.get("close")
    legs = o.get("legs") or []
    strikes = sorted(
        {
            float(l["strike"])
            for l in legs
            if l.get("strike") is not None
        }
    )
    wing = None
    if len(strikes) >= 3:
        wing = min(strikes[i] - strikes[i - 1] for i in range(1, len(strikes)))
    elif len(strikes) == 2:
        wing = strikes[1] - strikes[0]
    width_s = f"{wing:.0f}-wide " if wing and wing > 0 else ""
    under = next(
        (str(l.get("underlier") or l.get("symbol") or "") for l in legs if l.get("underlier") or l.get("symbol")),
        "SPX",
    ) or "SPX"
    open_net = o.get("net_price")
    side = (o.get("net_side") or "").upper()
    entry = f"entry {side} {open_net}" if open_net is not None else "opened"
    if c is None:
        return f"{width_s}{under} fly ({entry}, still open)"
    pnl = c.get("pnl_amount")
    pnl_s = f", book {_fmt_money(float(pnl))}" if pnl is not None else ""
    return f"{width_s}{under} fly ({entry}{pnl_s})"


MARKET_REASONS = [
    "Range looked compressed into the open — sold the middle of a defined-risk fly for a mean-reversion hold into the afternoon.",
    "Morning push looked stretched relative to the prior day's value area; I defined risk with a butterfly around my target.",
    "Wanted a structured way to express 'we stay inside this shelf' without naked short premium.",
    "Vol felt sticky but not expanding hard — fly geometry kept the thesis simple: pin toward the body.",
    "Tape was two-sided after the first hour; fly let me participate without chasing direction.",
    "Key level from pre-market was nearby; butterfly is my default when I want a reaction zone, not a trend bet.",
    "Didn't want binary exposure into lunch. Structure is symmetric; thesis is occupancy, not breakout.",
    "Prior day left unfinished business around the body strike — re-expressed with size I can hold to the close.",
]


def _week_comment(week_net: float | None, week_n: int) -> str:
    if week_net is None or week_n <= 0:
        return (
            "Week book context: not enough closed outcomes yet this ISO week "
            "to call it — treating today as process practice only."
        )
    # Factual book frame (user asked for good/poor week from P&L).
    # Keep it dry — no profit theater.
    if week_net >= 1500:
        grade = "particularly strong week on the book"
    elif week_net >= 400:
        grade = "solid positive week on the book"
    elif week_net >= -200:
        grade = "roughly flat week on the book"
    elif week_net >= -1500:
        grade = "soft / poor week on the book"
    else:
        grade = "particularly rough week on the book"
    return (
        f"Week book context ({week_n} closed structure(s) this ISO week): "
        f"net {_fmt_money(week_net)} — {grade}. "
        f"Separating that from process: did I still follow the plan when the book was ugly?"
    )


def build_day_conversation(
    day: str,
    day_pairs: list[dict[str, Any]],
    week_net: float | None,
    week_n: int,
) -> list[tuple[str, str, time]]:
    """Return list of (author, body, local_time) for member/agent turns."""
    opens = [m for m in day_pairs if m["open_day"] == day]
    closes = [m for m in day_pairs if m.get("close_day") == day]
    blurbs = []
    for m in day_pairs[:4]:
        blurbs.append(_structure_blurb(m))
    more = len(day_pairs) - len(blurbs)
    trade_list = "; ".join(blurbs)
    if more > 0:
        trade_list += f"; +{more} more"

    reason = _pick(day, MARKET_REASONS)
    n_open = len(opens)
    n_close = len(closes)

    if n_open and n_close:
        member_am = (
            f"{day}: {n_open} open(s), {n_close} close(s) on the 0DTE book — "
            f"{trade_list}. {reason}"
        )
    elif n_open:
        member_am = (
            f"{day}: opening {n_open} structure(s) — {trade_list}. {reason}"
        )
    else:
        member_am = (
            f"{day}: managing / closing {n_close} structure(s) — {trade_list}. "
            f"Thesis was already on; today is about exit discipline and not renegotiating the plan mid-hold."
        )

    agent_mid = (
        "Noted. Process check: what is the invalidation for this structure, "
        "and what would make you abandon the plan early? Keep it about rules, not the outcome."
    )

    week = _week_comment(week_net, week_n)
    if n_close:
        member_pm = (
            f"Close of day: filled/closed what I needed. Structures: {trade_list}. "
            f"{week} "
            f"I'll mark whether I sized and timed to the plan — win or lose on the book."
        )
    else:
        member_pm = (
            f"Still carrying open risk overnight/into the next session: {trade_list}. "
            f"{week} "
            f"Plan for tomorrow: only manage to the original levels — no revenge adds."
        )

    return [
        ("member", member_am, time(9, 45)),
        ("agent", agent_mid, time(10, 5)),
        ("member", member_pm, time(16, 10)),
    ]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--email", default="ernie@dudefromearth.com")
    ap.add_argument("--account-label", default="0DTE Book")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--force", action="store_true", help="Skip only if date closed")
    ap.add_argument("--limit", type=int, default=0, help="Max days to write (0=all)")
    ap.add_argument("--from-day", default="", help="YYYY-MM-DD inclusive")
    ap.add_argument("--to-day", default="", help="YYYY-MM-DD inclusive")
    args = ap.parse_args()

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
            cur.execute(
                """SELECT id, label FROM member_trade_log_accounts
                   WHERE identity_id=%s AND label=%s LIMIT 1""",
                (iid, args.account_label),
            )
            acct = cur.fetchone()
            if not acct:
                raise SystemExit(f"account {args.account_label!r} not found for {args.email}")
            aid = int(acct["id"])
            trades, _ = _load_member_book(cur, iid, aid)

    matched = match_open_close(trades)

    # Index pairs by open_day / close_day
    by_day: dict[str, list[dict[str, Any]]] = defaultdict(list)
    seen_pair: set[int] = set()
    for m in matched:
        oid = int(m["open"]["id"])
        if oid in seen_pair:
            continue
        seen_pair.add(oid)
        od = m.get("open_day")
        cd = m.get("close_day")
        if od:
            by_day[od].append(m)
        if cd and cd != od:
            by_day[cd].append(m)

    # Week realized PnL (by close day)
    week_pnl: dict[tuple[int, int], float] = defaultdict(float)
    week_n: dict[tuple[int, int], int] = defaultdict(int)
    for m in matched:
        c = m.get("close")
        if not c:
            continue
        cd = m.get("close_day") or _ymd(c.get("exec_at"))
        if not cd:
            continue
        pnl = c.get("pnl_amount")
        if pnl is None:
            continue
        d = date.fromisoformat(cd)
        key = _iso_week(d)
        week_pnl[key] += float(pnl)
        week_n[key] += 1

    days = sorted(by_day.keys())
    if args.from_day:
        days = [d for d in days if d >= args.from_day[:10]]
    if args.to_day:
        days = [d for d in days if d <= args.to_day[:10]]
    if args.limit and args.limit > 0:
        days = days[: args.limit]

    print(
        f"identity={iid} email={args.email} account={args.account_label}({aid}) "
        f"activity_days={len(days)} dry_run={args.dry_run}"
    )

    created = 0
    skipped = 0
    errors = 0

    for day in days:
        pairs = by_day[day]
        d = date.fromisoformat(day)
        key = _iso_week(d)
        wn = week_n.get(key, 0)
        wnet = week_pnl.get(key) if wn else None
        turns = build_day_conversation(day, pairs, wnet, wn)

        if args.dry_run:
            print(f"\n=== {day} ({len(pairs)} structure ref(s)) ===")
            for author, body, t in turns:
                print(f"  [{author} {t}] {body[:140]}...")
            created += 1
            continue

        try:
            with db.transaction() as conn:
                with conn.cursor() as cur:
                    # Skip closed dates
                    try:
                        jsd.assert_date_open(cur, iid, d)
                    except jsd.JournalSessionError:
                        skipped += 1
                        continue

                    session = jsd.create_session(
                        cur,
                        iid,
                        journal_date=d,
                        tag="reflection",
                        now=datetime.combine(d, time(9, 30)),
                    )
                    sid = int(session["id"])
                    msgs = session.get("messages") or []
                    has_member = any(
                        (m.get("author") if isinstance(m, dict) else None) == "member"
                        or (isinstance(m, dict) and m.get("author") == "member")
                        for m in msgs
                    )
                    # serialize may use different shape
                    if not has_member and msgs:
                        # re-check via SQL
                        cur.execute(
                            """SELECT COUNT(*) AS n FROM member_journal_messages
                               WHERE session_id=%s AND author='member'""",
                            (sid,),
                        )
                        has_member = int(cur.fetchone()["n"] or 0) > 0
                    if has_member and not args.force:
                        skipped += 1
                        continue
                    if has_member and args.force:
                        cur.execute(
                            """DELETE FROM member_journal_messages
                               WHERE session_id=%s AND identity_id=%s""",
                            (sid, iid),
                        )

                    for author, body, tloc in turns:
                        when = datetime.combine(d, tloc)
                        if author == "member":
                            jsd.append_member_message(
                                cur, iid, sid, body_md=body, now=when
                            )
                        else:
                            jsd.append_agent_message(
                                cur, iid, sid, body_md=body, now=when
                            )
                    created += 1
                    if created % 50 == 0:
                        print(f"  … wrote {created} days")
        except Exception as e:
            errors += 1
            print(f"ERROR {day}: {e}")

    print(
        f"done: wrote={created} skipped={skipped} errors={errors} "
        f"(days considered={len(days)})"
    )


if __name__ == "__main__":
    main()
