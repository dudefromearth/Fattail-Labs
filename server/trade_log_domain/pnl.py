"""Effective realized PnL + synthetic enrichment. Port of reportsBook."""

from __future__ import annotations

from typing import Any

from trade_log_domain.matching import match_open_close
from trade_log_domain.structure import (
    multiplier,
    net_cash_points,
    trade_is_close_fill,
    unit_qty,
)


def realized_pnl(trade: dict[str, Any]) -> float | None:
    """Stored pnl_amount when set; does not synthesize."""
    v = trade.get("pnl_amount")
    if v is None:
        return None
    try:
        n = float(v)
    except (TypeError, ValueError):
        return None
    if n != n:
        return None
    return n


def enrich_trades_with_synthetic_pnl(
    trades: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Fill missing close pnl_amount from open→close cash × mult × unit scale.
    Returns shallow-copied trades (legs lists copied); does not mutate inputs.
    """
    by_id: dict[int, dict[str, Any]] = {}
    for t in trades:
        tid = int(t["id"])
        copy = dict(t)
        if t.get("legs") is not None:
            copy["legs"] = [dict(l) for l in t["legs"]]
        by_id[tid] = copy

    matched = match_open_close(trades)

    for m in matched:
        close = m.get("close")
        if not close:
            continue
        c = by_id.get(int(close["id"]))
        if not c:
            continue
        if realized_pnl(c) is not None:
            continue
        open_t = m["open"]
        open_pts = net_cash_points(open_t)
        close_pts = net_cash_points(close)
        if open_pts is None or close_pts is None:
            continue
        scale = max(unit_qty(open_t), unit_qty(close), 1)
        synth = (open_pts + close_pts) * multiplier(close) * scale
        c["pnl_amount"] = round(synth * 100) / 100

    for t in by_id.values():
        if realized_pnl(t) is not None:
            continue
        if not trade_is_close_fill(t):
            continue
        pts = net_cash_points(t)
        if pts is None:
            continue
        t["pnl_amount"] = round(pts * multiplier(t) * unit_qty(t) * 100) / 100

    return list(by_id.values())
