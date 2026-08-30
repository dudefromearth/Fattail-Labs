"""Effective realized PnL + synthetic enrichment. Port of reportsBook."""

from __future__ import annotations

from typing import Any

from trade_log_domain.matching import (
    SYNTHETIC_EXPIRED_WORTHLESS,
    match_open_close,
)
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
    Fill missing close pnl_amount from open→close cash × mult × consumed units.
    Returns shallow-copied trades (legs lists copied); does not mutate inputs.

    Expired-worthless remainder (matching synthetic close) is appended to the
    result so reports / day-net realize on the expiry date. Those rows are not
    persisted; they carry ``synthetic = expired_worthless``.
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
        open_t = m["open"]
        open_pts = net_cash_points(open_t)
        slices = m.get("closes") or []
        if not slices and m.get("close"):
            slices = [
                {
                    "close": m["close"],
                    "units": int(m.get("closed_units") or unit_qty(m["close"]) or 1),
                }
            ]
        for sl in slices:
            close = sl.get("close")
            if not close:
                continue
            consumed = int(sl.get("units") or 0)
            if consumed <= 0:
                continue
            close_pts = net_cash_points(close)
            if close_pts is None and close.get("synthetic") == SYNTHETIC_EXPIRED_WORTHLESS:
                close_pts = 0.0
            if open_pts is None or close_pts is None:
                continue
            scale_src = open_t if close.get("synthetic") else close
            synth = (open_pts + close_pts) * multiplier(scale_src) * consumed
            synth = round(synth * 100) / 100
            cid = close.get("id")
            if close.get("synthetic") == SYNTHETIC_EXPIRED_WORTHLESS:
                prev = close.get("pnl_amount")
                close["pnl_amount"] = (
                    synth if prev is None else round((float(prev) + synth) * 100) / 100
                )
                if cid is not None and int(cid) not in by_id:
                    by_id[int(cid)] = close
                continue
            if cid is None:
                continue
            c = by_id.get(int(cid))
            if not c:
                continue
            if realized_pnl(c) is not None and not c.get("_pnl_accum"):
                # Broker-supplied realized P&L — do not overwrite.
                continue
            prev = c.get("pnl_amount")
            c["pnl_amount"] = (
                synth if prev is None else round((float(prev) + synth) * 100) / 100
            )
            c["_pnl_accum"] = True

    for t in by_id.values():
        if realized_pnl(t) is not None:
            continue
        if not trade_is_close_fill(t):
            continue
        pts = net_cash_points(t)
        if pts is None:
            continue
        t["pnl_amount"] = round(pts * multiplier(t) * unit_qty(t) * 100) / 100

    out = list(by_id.values())
    for t in out:
        t.pop("_pnl_accum", None)
    return out
