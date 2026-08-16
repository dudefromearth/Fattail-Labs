"""Tradier history + gainloss  →  canonical Trade Log trades.

Produces the SAME trade/leg dicts that trade_log_io's adapters emit, so the output
feeds the existing import_commit path unchanged (dedup, batches, FIFO matching).

Tradier's response shapes (from docs.tradier.com, verified field names):
  history.event[]         : {date, type:'trade'|'option', symbol, quantity, price,
                             amount, description:'Bought 10 AAPL @ 124.00', commission}
  gainloss.closed_position[]: {open_date, close_date, cost, proceeds, gain_loss,
                             gain_loss_percent, quantity, symbol, term}

Two documented limitations we design around (spec §5):
  * History omits broker order numbers → dedup on a content hash (external_order_id).
  * History omits open/close effect and minute-level time → infer open vs close by
    reconciling each fill against gainloss closed positions (best-effort, day-level).

NOTE FOR PHASE 1: the OCC parsing + content-hash dedup below are exact and unit-tested.
The history↔gainloss reconciliation and any multi-leg (spread) grouping should be
validated against a REAL Tradier account (personal access token) before enabling —
Tradier lists each option leg as its own event with no order id to group by, so v0.1
imports one single-leg trade per fill and lets FIFO structure-matching pair them.
"""

from __future__ import annotations

import hashlib
import re
from typing import Any

ADAPTER_ID = "tradier"

# OCC / OSI-21 option symbol, with or without the padding space:
#   "SPY210319C00150000"  or  "AAPL 210319C00150000"
#   root (1-6) + YYMMDD + C/P + strike*1000 (8 digits)
_OCC_RE = re.compile(r"^([A-Z]{1,6})\s?(\d{2})(\d{2})(\d{2})([CP])(\d{8})$")


def parse_occ_symbol(symbol: str | None) -> dict[str, str] | None:
    """Parse an OCC option symbol → {underlier, expiry, strike, right}, else None."""
    if not symbol:
        return None
    m = _OCC_RE.match(symbol.strip().upper())
    if not m:
        return None
    root, yy, mm, dd, cp, strike8 = m.groups()
    strike = int(strike8) / 1000.0
    strike_str = f"{strike:g}"  # 150.0 -> "150", 152.5 -> "152.5"
    return {
        "underlier": root,
        "expiry": f"20{yy}-{mm}-{dd}",
        "strike": strike_str,
        "right": "CALL" if cp == "C" else "PUT",
    }


def _day(iso: str | None) -> str:
    """YYYY-MM-DD prefix of a Tradier ISO timestamp (empty if absent)."""
    return (iso or "")[:10]


def _side_from(description: str | None, quantity: Any, amount: Any) -> str:
    """BUY / SELL. Prefer the description verb; fall back to signed quantity/amount."""
    d = (description or "").strip().lower()
    if d.startswith("bought") or d.startswith("buy"):
        return "BUY"
    if d.startswith("sold") or d.startswith("sell"):
        return "SELL"
    try:
        q = float(quantity)
        if q < 0:
            return "SELL"
        if q > 0:
            return "BUY"
    except (TypeError, ValueError):
        pass
    try:
        # Tradier `amount`: cash flow — outflow (buy) negative, inflow (sell) positive.
        return "SELL" if float(amount) > 0 else "BUY"
    except (TypeError, ValueError):
        return "BUY"


def content_hash(account_id: str, ev: dict[str, Any]) -> str:
    """Stable dedup id for a fill (history has no broker order number) — spec §5."""
    parts = [
        str(account_id or ""),
        str(ev.get("date") or ""),
        str(ev.get("symbol") or ""),
        str(ev.get("quantity") or ""),
        str(ev.get("price") or ""),
        str(ev.get("amount") or ""),
    ]
    digest = hashlib.sha256("|".join(parts).encode("utf-8")).hexdigest()
    return f"tradier:{digest[:32]}"


def history_event_to_trade(ev: dict[str, Any], account_id: str) -> dict[str, Any] | None:
    """One Tradier history event → one canonical single-leg trade (or None to skip)."""
    if not isinstance(ev, dict):
        return None
    # Only trade/option fills carry positions; ignore dividends, ach, journals, etc.
    ev_type = str(ev.get("type") or "").lower()
    if ev_type not in ("trade", "option"):
        return None

    symbol = str(ev.get("symbol") or "").strip()
    if not symbol:
        return None
    occ = parse_occ_symbol(symbol)
    side = _side_from(ev.get("description"), ev.get("quantity"), ev.get("amount"))

    try:
        qty = abs(float(ev.get("quantity")))
    except (TypeError, ValueError):
        qty = 1.0
    qty_str = str(int(qty)) if qty.is_integer() else str(qty)

    price = ev.get("price")
    commission = ev.get("commission")

    leg = {
        "side": side,
        "quantity": qty_str,
        "pos_effect": None,  # inferred later from gainloss (best-effort)
        "underlier": occ["underlier"] if occ else symbol,
        "symbol": symbol,
        "expiry": occ["expiry"] if occ else "",
        "strike": occ["strike"] if occ else "",
        "right": occ["right"] if occ else None,
        "fill_price": str(price) if price is not None else "0",
        "fees": str(commission) if commission not in (None, "") else "",
        "asset_class": "equity_option" if occ else "equity",
    }

    return {
        "exec_at": ev.get("date"),
        "strategy": "CUSTOM",  # single-leg; refine_strategy_from_legs finalizes on commit
        "asset_class": leg["asset_class"],
        "order_type": "LMT",
        "net_price": str(price) if price is not None else None,
        "net_side": None,  # single-leg direction lives on the leg; keep net_side unset
        "pnl_amount": None,  # stamped from gainloss for closing fills
        "legs": [leg],
        "external_order_id": content_hash(account_id, ev),
        "entry_source": "import",
        # transient reconciliation hints (stripped before commit)
        "_day": _day(ev.get("date")),
        "_symbol": symbol,
        "_side": side,
    }


def stamp_gainloss(
    trades: list[dict[str, Any]], closed_positions: list[dict[str, Any]]
) -> list[str]:
    """Best-effort: mark open/close pos_effect + stamp realized P&L from gainloss.

    Matches a closed position's close leg to the trade at (symbol, close_date) and its
    open leg to the trade at (symbol, open_date). Day-level because Tradier history
    carries no minute time. Returns a list of human-readable warnings for unmatched rows.
    """
    warnings: list[str] = []
    # Index fills by (symbol, day). Multiple fills per bucket → consume FIFO by side.
    buckets: dict[tuple[str, str], list[dict[str, Any]]] = {}
    for t in trades:
        buckets.setdefault((t["_symbol"], t["_day"]), []).append(t)

    def _take(symbol: str, day: str, want_side: str) -> dict[str, Any] | None:
        pool = buckets.get((symbol, day)) or []
        for t in pool:
            if t.get("_used"):
                continue
            if t["_side"] == want_side:
                t["_used"] = True
                return t
        # side unknown/mismatch — take any unused fill in the bucket
        for t in pool:
            if not t.get("_used"):
                t["_used"] = True
                return t
        return None

    for pos in closed_positions:
        if not isinstance(pos, dict):
            continue
        symbol = str(pos.get("symbol") or "").strip()
        open_day = _day(pos.get("open_date"))
        close_day = _day(pos.get("close_date"))
        gain = pos.get("gain_loss")

        open_t = _take(symbol, open_day, "BUY")
        if open_t is not None:
            open_t["legs"][0]["pos_effect"] = "TO_OPEN"
        else:
            warnings.append(f"gainloss open unmatched: {symbol} @ {open_day}")

        close_t = _take(symbol, close_day, "SELL")
        if close_t is not None:
            close_t["legs"][0]["pos_effect"] = "TO_CLOSE"
            if gain is not None:
                close_t["pnl_amount"] = str(gain)
        else:
            warnings.append(f"gainloss close unmatched: {symbol} @ {close_day}")

    return warnings


def transform(
    *,
    account_id: str,
    trade_events: list[dict[str, Any]],
    option_events: list[dict[str, Any]],
    closed_positions: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Full transform → {adapter, trades, warnings} ready for import_commit.

    `trades` are canonical trade dicts (transient _day/_symbol/_side hints removed).
    """
    raw: list[dict[str, Any]] = []
    for ev in list(trade_events or []) + list(option_events or []):
        t = history_event_to_trade(ev, account_id)
        if t is not None:
            raw.append(t)

    warnings = stamp_gainloss(raw, closed_positions or [])

    # Strip reconciliation-only keys so the output matches the pure canonical shape.
    for t in raw:
        for k in ("_day", "_symbol", "_side", "_used"):
            t.pop(k, None)

    return {"adapter": ADAPTER_ID, "trades": raw, "warnings": warnings}
