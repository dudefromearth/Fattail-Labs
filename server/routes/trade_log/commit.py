"""Shared commit: canonical trades → an import batch (dedup + legs + reconcile).

Extracted so non-file sources (Tradier sync, future brokers) land trades through the
exact same batch/dedup/leg path the file import uses, per the Trade Log import model
(batches DL-307/308). Callers pass an OPEN cursor inside a db.transaction() and the
already-resolved identity + account. Idempotent on (identity, account, adapter,
external_order_id).

The file-upload route (routes/trade_log/io.py import_commit) still carries its own
inline copy of this loop; unifying it onto this helper is a safe follow-up.
"""

from __future__ import annotations

from typing import Any

import trade_log_catalog as cat
from routes.trade_log.common import (
    _dec,
    _insert_legs,
    _parse_exec_at,
)


def commit_trades(
    cur: Any,
    identity_id: int,
    account_id: int,
    adapter_id: str,
    trades: list[dict[str, Any]],
    *,
    camp_id: int | None = None,
    source_filename: str | None = None,
    label: str | None = None,
) -> dict[str, Any]:
    """Insert `trades` as one import batch. Returns {import_id, created, skipped}."""
    from trade_log_domain.strategy_infer import refine_strategy_from_legs

    adapter_id = str(adapter_id or "import")[:32]
    if source_filename:
        source_filename = str(source_filename)[:255]
    if label:
        label = str(label)[:120]

    cur.execute(
        """INSERT INTO member_trade_log_imports
             (identity_id, account_id, adapter, source_filename,
              practice_campaign_id, trade_count, skipped_count, label)
           VALUES (%s, %s, %s, %s, %s, 0, 0, %s)""",
        (identity_id, account_id, adapter_id, source_filename, camp_id, label),
    )
    import_id: int | None = int(cur.lastrowid)

    created = 0
    skipped = 0
    for t in trades:
        ext = t.get("external_order_id") or None
        if ext:
            cur.execute(
                """SELECT id FROM member_trade_log_trades
                   WHERE identity_id = %s AND account_id = %s
                     AND external_adapter = %s AND external_order_id = %s""",
                (identity_id, account_id, adapter_id, ext),
            )
            if cur.fetchone():
                skipped += 1
                continue

        adherence = t.get("adherence")
        proc = {
            "setup_md": t.get("setup_md") or "",
            "plan_md": t.get("plan_md") or "",
            "rules_md": t.get("rules_md") or "",
            "adherence": adherence if adherence in cat.ADHERENCE else "unknown",
            "deviation_md": t.get("deviation_md") or "",
            "lesson_md": t.get("lesson_md") or "",
            "pnl_amount": t.get("pnl_amount"),
        }
        exec_at = _parse_exec_at(t.get("exec_at"))
        legs_list = t.get("legs") if isinstance(t.get("legs"), list) else []
        strategy = refine_strategy_from_legs(str(t.get("strategy") or "CUSTOM"), legs_list)
        if strategy not in cat.STRATEGY_CODES:
            strategy = "CUSTOM"
        net_price = _dec(t.get("net_price"))
        net_side = t.get("net_side")
        if net_side and net_side not in cat.NET_SIDES:
            net_side = None

        cur.execute(
            """INSERT INTO member_trade_log_trades
                 (identity_id, account_id, exec_at, asset_class, strategy,
                  order_type, net_price, net_side, setup_md, plan_md, rules_md,
                  adherence, deviation_md, lesson_md, pnl_amount,
                  external_adapter, external_order_id, entry_source,
                  import_id, practice_campaign_id)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (
                identity_id,
                account_id,
                exec_at,
                (t.get("asset_class") or "equity_option").lower(),
                strategy,
                (t.get("order_type") or "LMT")[:32],
                net_price,
                net_side,
                proc["setup_md"],
                proc["plan_md"],
                proc["rules_md"],
                proc["adherence"],
                proc["deviation_md"],
                proc["lesson_md"],
                proc["pnl_amount"],
                adapter_id,
                ext,
                t.get("entry_source") or "import",
                import_id,
                camp_id,
            ),
        )
        tid = int(cur.lastrowid)
        _insert_legs(cur, tid, identity_id, account_id, legs_list)
        created += 1

    if created == 0:
        cur.execute(
            "DELETE FROM member_trade_log_imports WHERE id = %s AND identity_id = %s",
            (import_id, identity_id),
        )
        import_id = None
    else:
        cur.execute(
            """UPDATE member_trade_log_imports
                  SET trade_count = %s, skipped_count = %s
                WHERE id = %s AND identity_id = %s""",
            (created, skipped, import_id, identity_id),
        )
    return {"import_id": import_id, "created": created, "skipped": skipped}
