#!/usr/bin/env python3
"""Backfill synthetic pnl_amount on closes missing it.

Uses trade_log_domain (single source — PH1-4). Safe to re-run: only fills
NULL pnl_amount on closes that domain can estimate from open→close cash.

  cd server && .venv/bin/python seed_reports_demo_pnl.py
  cd server && .venv/bin/python seed_reports_demo_pnl.py --identity 1
  cd server && .venv/bin/python seed_reports_demo_pnl.py --dry-run
"""

from __future__ import annotations

import argparse
import sys
from collections import defaultdict
from decimal import Decimal
from pathlib import Path

# Allow `python seed_reports_demo_pnl.py` from server/
sys.path.insert(0, str(Path(__file__).resolve().parent))

import db
from trade_log_domain import enrich_trades_with_synthetic_pnl


def _leg_dict(row: dict) -> dict:
    exp = row.get("expiry")
    if exp is not None and hasattr(exp, "isoformat"):
        exp = exp.isoformat()
    return {
        "id": row.get("id"),
        "leg_index": row.get("leg_index"),
        "side": row.get("side"),
        "quantity": int(row["quantity"]) if row.get("quantity") is not None else 0,
        "pos_effect": row.get("pos_effect"),
        "asset_class": row.get("asset_class") or "equity_option",
        "underlier": row.get("underlier"),
        "symbol": row.get("symbol"),
        "expiry": str(exp)[:10] if exp else None,
        "strike": float(row["strike"]) if row.get("strike") is not None else None,
        "right": row.get("option_right"),
        "fill_price": float(row["fill_price"]) if row.get("fill_price") is not None else 0,
        "fees": float(row["fees"]) if row.get("fees") is not None else None,
    }


def _trade_dict(row: dict, legs: list[dict]) -> dict:
    exec_at = row.get("exec_at")
    if exec_at is not None and hasattr(exec_at, "isoformat"):
        exec_at = exec_at.isoformat(sep="T")
    return {
        "id": int(row["id"]),
        "account_id": int(row["account_id"]),
        "exec_at": exec_at,
        "asset_class": row.get("asset_class") or "equity_option",
        "strategy": row["strategy"],
        "order_type": row.get("order_type") or "LMT",
        "net_price": float(row["net_price"]) if row.get("net_price") is not None else None,
        "net_side": row.get("net_side"),
        "pnl_amount": float(row["pnl_amount"]) if row.get("pnl_amount") is not None else None,
        "legs": legs,
        "setup_md": row.get("setup_md") or "",
        "plan_md": row.get("plan_md") or "",
        "rules_md": row.get("rules_md") or "",
        "adherence": row.get("adherence") or "",
        "deviation_md": row.get("deviation_md") or "",
        "lesson_md": row.get("lesson_md") or "",
    }


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Backfill NULL close pnl_amount via trade_log_domain"
    )
    ap.add_argument("--identity", type=int, default=None)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    updated = 0
    with db.transaction() as conn:
        with conn.cursor() as cur:
            if args.identity is not None:
                cur.execute(
                    """SELECT * FROM member_trade_log_trades
                       WHERE identity_id=%s ORDER BY exec_at, id""",
                    (args.identity,),
                )
            else:
                cur.execute(
                    """SELECT * FROM member_trade_log_trades
                       ORDER BY identity_id, exec_at, id"""
                )
            rows = list(cur.fetchall())
            legs_by_trade: dict[int, list] = defaultdict(list)
            if rows:
                ids = [int(t["id"]) for t in rows]
                for i in range(0, len(ids), 200):
                    chunk = ids[i : i + 200]
                    fmt = ",".join(["%s"] * len(chunk))
                    cur.execute(
                        f"""SELECT * FROM member_trade_log_legs
                           WHERE trade_id IN ({fmt})
                           ORDER BY trade_id, leg_index""",
                        chunk,
                    )
                    for L in cur.fetchall():
                        legs_by_trade[int(L["trade_id"])].append(L)

            # Domain match is global by structure key (includes account_id);
            # process per identity so we never cross books.
            by_iid: dict[int, list[dict]] = defaultdict(list)
            meta: dict[int, dict] = {}
            for t in rows:
                tid = int(t["id"])
                legs = [_leg_dict(L) for L in legs_by_trade.get(tid, [])]
                td = _trade_dict(t, legs)
                by_iid[int(t["identity_id"])].append(td)
                meta[tid] = t

            for iid, trades in by_iid.items():
                before = {int(t["id"]): t.get("pnl_amount") for t in trades}
                enriched = enrich_trades_with_synthetic_pnl(trades)
                for t in enriched:
                    tid = int(t["id"])
                    if before.get(tid) is not None:
                        continue
                    new_pnl = t.get("pnl_amount")
                    if new_pnl is None:
                        continue
                    print(
                        f"identity {iid} trade {tid}: estimated pnl {new_pnl}"
                    )
                    if not args.dry_run:
                        cur.execute(
                            """UPDATE member_trade_log_trades
                               SET pnl_amount=%s
                               WHERE id=%s AND identity_id=%s AND pnl_amount IS NULL""",
                            (Decimal(str(new_pnl)), tid, iid),
                        )
                        updated += cur.rowcount
                    else:
                        updated += 1

    print(f"{'would update' if args.dry_run else 'updated'} {updated} closes")


if __name__ == "__main__":
    main()
