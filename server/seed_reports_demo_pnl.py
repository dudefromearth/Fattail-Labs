#!/usr/bin/env python3
"""Backfill synthetic pnl_amount on closes missing it (open→close cash × mult × units).

Uses the same geometry normalization as web/lib/journalDayBook (GCD unit size).
Safe to re-run: only fills NULL pnl_amount on TO_CLOSE-majority trades.

  cd server && .venv/bin/python seed_reports_demo_pnl.py
  cd server && .venv/bin/python seed_reports_demo_pnl.py --identity 1
"""

from __future__ import annotations

import argparse
import math
from collections import defaultdict
from decimal import Decimal

import db


def gcd(a: int, b: int) -> int:
    a, b = abs(a), abs(b)
    while b:
        a, b = b, a % b
    return a or 1


def unit_qty(legs: list[dict]) -> int:
    qs = [abs(int(l["quantity"] or 0)) for l in legs if l.get("quantity")]
    if not qs:
        return 1
    g = qs[0]
    for q in qs[1:]:
        g = gcd(g, q)
    return g


def structure_key(account_id: int, strategy: str, legs: list[dict]) -> str:
    under = next((l.get("underlier") or l.get("symbol") for l in legs if l.get("underlier") or l.get("symbol")), strategy)
    exps = [l["expiry"] for l in legs if l.get("expiry")]
    exp = min(exps).isoformat() if exps else ""
    g = unit_qty(legs)
    parts = []
    for l in legs:
        q = abs(int(l["quantity"] or 0)) / g
        strike = l["strike"] if l.get("strike") is not None else ""
        right = l.get("option_right") or ""
        parts.append(f"{q}@{strike}{right}")
    parts.sort()
    return f"{account_id}|{strategy}|{under}|{exp}|{'|'.join(parts)}"


def is_close(legs: list[dict]) -> bool:
    effects = [l.get("pos_effect") for l in legs if l.get("pos_effect")]
    if not effects:
        return False
    return sum(1 for e in effects if e == "TO_CLOSE") > sum(
        1 for e in effects if e == "TO_OPEN"
    )


def cash_points(net_price, net_side) -> float | None:
    """Cash to trader in price points: CREDIT received (+), DEBIT paid (−)."""
    if net_price is None:
        return None
    p = abs(float(net_price))
    if net_side == "CREDIT":
        return p
    if net_side == "DEBIT":
        return -p
    # Unknown side: keep signed net as-is
    return float(net_price)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--identity", type=int, default=None)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    updated = 0
    with db.transaction() as conn:
        with conn.cursor() as cur:
            if args.identity is not None:
                cur.execute(
                    "SELECT * FROM member_trade_log_trades WHERE identity_id=%s ORDER BY exec_at, id",
                    (args.identity,),
                )
            else:
                cur.execute(
                    "SELECT * FROM member_trade_log_trades ORDER BY identity_id, exec_at, id"
                )
            trades = list(cur.fetchall())
            legs_by_trade: dict[int, list] = defaultdict(list)
            if trades:
                ids = [t["id"] for t in trades]
                # chunk
                for i in range(0, len(ids), 200):
                    chunk = ids[i : i + 200]
                    fmt = ",".join(["%s"] * len(chunk))
                    cur.execute(
                        f"SELECT * FROM member_trade_log_legs WHERE trade_id IN ({fmt}) ORDER BY trade_id, leg_index",
                        chunk,
                    )
                    for L in cur.fetchall():
                        legs_by_trade[int(L["trade_id"])].append(L)

            queues: dict[str, list] = defaultdict(list)
            for t in trades:
                legs = legs_by_trade.get(int(t["id"]), [])
                key = structure_key(int(t["account_id"]), t["strategy"], legs)
                if not is_close(legs):
                    queues[key].append(t)
                    continue
                # close
                if t.get("pnl_amount") is not None:
                    # still consume an open if present
                    if queues[key]:
                        queues[key].pop(0)
                    continue
                if not queues[key]:
                    continue
                open_t = queues[key].pop(0)
                open_legs = legs_by_trade.get(int(open_t["id"]), [])
                op = cash_points(open_t.get("net_price"), open_t.get("net_side"))
                cp = cash_points(t.get("net_price"), t.get("net_side"))
                if op is None or cp is None:
                    continue
                scale = max(unit_qty(open_legs), unit_qty(legs), 1)
                synth = (op + cp) * 100.0 * scale
                synth = round(synth, 2)
                print(
                    f"trade {t['id']}: open {open_t['id']} → pnl {synth} "
                    f"(open {open_t.get('net_side')} {open_t.get('net_price')} "
                    f"close {t.get('net_side')} {t.get('net_price')} ×{scale})"
                )
                if not args.dry_run:
                    cur.execute(
                        "UPDATE member_trade_log_trades SET pnl_amount=%s WHERE id=%s AND pnl_amount IS NULL",
                        (Decimal(str(synth)), t["id"]),
                    )
                    updated += cur.rowcount

    print(f"{'would update' if args.dry_run else 'updated'} {updated} closes")


if __name__ == "__main__":
    main()
