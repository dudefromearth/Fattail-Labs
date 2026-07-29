#!/usr/bin/env python3
"""Clone Trade Log fills from one identity into another (demo / reports).

  cd server && .venv/bin/python seed_clone_trade_log.py \\
      --from-email ernie@fattail.ai --to-email dev-admin@labs.local

Skips if target already has trades unless --force.
"""

from __future__ import annotations

import argparse

import db


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--from-email", required=True)
    ap.add_argument("--to-email", required=True)
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT identity_id, email FROM identities WHERE email=%s",
                (args.from_email,),
            )
            src = cur.fetchone()
            cur.execute(
                "SELECT identity_id, email FROM identities WHERE email=%s",
                (args.to_email,),
            )
            dst = cur.fetchone()
            if not src or not dst:
                raise SystemExit(f"identity not found: src={src} dst={dst}")
            sid, did = int(src["identity_id"]), int(dst["identity_id"])
            if sid == did:
                raise SystemExit("from and to are the same identity")

            cur.execute(
                "SELECT COUNT(*) AS n FROM member_trade_log_trades WHERE identity_id=%s",
                (did,),
            )
            existing = int(cur.fetchone()["n"])
            if existing and not args.force:
                print(f"target already has {existing} trades; pass --force to wipe+clone")
                return
            if existing and args.force:
                cur.execute(
                    "DELETE FROM member_trade_log_trades WHERE identity_id=%s", (did,)
                )
                cur.execute(
                    "DELETE FROM member_trade_log_accounts WHERE identity_id=%s",
                    (did,),
                )
                print(f"wiped {existing} trades on {args.to_email}")

            # Clone accounts
            cur.execute(
                "SELECT * FROM member_trade_log_accounts WHERE identity_id=%s",
                (sid,),
            )
            acct_map: dict[int, int] = {}
            for a in cur.fetchall():
                old_id = int(a["id"])
                cur.execute(
                    """INSERT INTO member_trade_log_accounts
                       (identity_id, label, broker, broker_label, currency, status,
                        badge_color, sort_order, notes_md)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                    (
                        did,
                        a["label"],
                        a["broker"],
                        a.get("broker_label"),
                        a.get("currency") or "USD",
                        a["status"],
                        a.get("badge_color"),
                        a.get("sort_order") or 0,
                        a.get("notes_md"),
                    ),
                )
                acct_map[old_id] = int(cur.lastrowid)

            cur.execute(
                "SELECT * FROM member_trade_log_trades WHERE identity_id=%s ORDER BY id",
                (sid,),
            )
            trades = list(cur.fetchall())
            n_legs = 0
            for t in trades:
                old_tid = int(t["id"])
                new_acct = acct_map.get(int(t["account_id"]))
                if new_acct is None:
                    continue
                cur.execute(
                    """INSERT INTO member_trade_log_trades
                       (identity_id, account_id, exec_at, asset_class, strategy, order_type,
                        net_price, net_side, setup_md, plan_md, rules_md, adherence,
                        deviation_md, lesson_md, pnl_amount, external_adapter, external_order_id)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                    (
                        did,
                        new_acct,
                        t["exec_at"],
                        t.get("asset_class") or "equity_option",
                        t["strategy"],
                        t.get("order_type") or "LMT",
                        t.get("net_price"),
                        t.get("net_side"),
                        t.get("setup_md") or "",
                        t.get("plan_md") or "",
                        t.get("rules_md") or "",
                        t.get("adherence") or "unknown",
                        t.get("deviation_md") or "",
                        t.get("lesson_md") or "",
                        t.get("pnl_amount"),
                        t.get("external_adapter"),
                        t.get("external_order_id"),
                    ),
                )
                new_tid = int(cur.lastrowid)
                cur.execute(
                    "SELECT * FROM member_trade_log_legs WHERE trade_id=%s ORDER BY leg_index",
                    (old_tid,),
                )
                for L in cur.fetchall():
                    cur.execute(
                        """INSERT INTO member_trade_log_legs
                           (trade_id, identity_id, account_id, leg_index, side, quantity,
                            pos_effect, asset_class, underlier, symbol, expiry, strike,
                            option_right, multiplier, fill_price, fees)
                           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                        (
                            new_tid,
                            did,
                            new_acct,
                            L.get("leg_index") or 0,
                            L["side"],
                            L["quantity"],
                            L.get("pos_effect"),
                            L.get("asset_class") or "equity_option",
                            L.get("underlier"),
                            L.get("symbol"),
                            L.get("expiry"),
                            L.get("strike"),
                            L.get("option_right"),
                            L.get("multiplier"),
                            L.get("fill_price") or 0,
                            L.get("fees"),
                        ),
                    )
                    n_legs += 1

            print(
                f"cloned {len(trades)} trades / {n_legs} legs "
                f"from {args.from_email} → {args.to_email}"
            )


if __name__ == "__main__":
    main()
