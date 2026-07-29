"""Structure key, open/close fill detection, cash points, multipliers.

Port of web/lib/journalDayBook.ts (+ reportsBook multiplier).
"""

from __future__ import annotations

from typing import Any


def ymd_from_exec(exec_at: str | None) -> str | None:
    if not exec_at:
        return None
    if len(exec_at) >= 10 and exec_at[4] == "-" and exec_at[7] == "-":
        return exec_at[:10]
    return None


def trade_is_close_fill(trade: dict[str, Any]) -> bool:
    """Majority leg pos_effect → close vs open fill."""
    effects = [
        l.get("pos_effect")
        for l in (trade.get("legs") or [])
        if l.get("pos_effect")
    ]
    if not effects:
        return False
    closes = sum(1 for e in effects if e == "TO_CLOSE")
    opens = sum(1 for e in effects if e == "TO_OPEN")
    return closes > opens


def trade_expiry(trade: dict[str, Any]) -> str | None:
    exp = [l.get("expiry") for l in (trade.get("legs") or []) if l.get("expiry")]
    if not exp:
        return None
    # Normalize date-like to YYYY-MM-DD string
    norm: list[str] = []
    for e in exp:
        s = str(e)
        if len(s) >= 10 and s[4] == "-":
            norm.append(s[:10])
        else:
            norm.append(s)
    return sorted(norm)[0] if norm else None


def _gcd(a: int, b: int) -> int:
    x, y = abs(a), abs(b)
    while y:
        x, y = y, x % y
    return x or 1


def unit_qty(trade: dict[str, Any]) -> int:
    """GCD of positive leg quantities (unit size for 1-2-1 vs 3-6-3)."""
    qs = [
        abs(int(l.get("quantity") or 0))
        for l in (trade.get("legs") or [])
        if l.get("quantity") is not None and abs(int(l.get("quantity") or 0)) > 0
    ]
    if not qs:
        return 1
    g = qs[0]
    for q in qs[1:]:
        g = _gcd(g, q)
    return g


def structure_key(trade: dict[str, Any]) -> str:
    """Match open fills to close fills; sides/pos_effect ignored; qty/GCD normalized."""
    legs = trade.get("legs") or []
    under = None
    for l in legs:
        if l.get("underlier"):
            under = l["underlier"]
            break
    if under is None:
        for l in legs:
            if l.get("symbol"):
                under = l["symbol"]
                break
    if under is None:
        under = trade.get("strategy")
    exp = trade_expiry(trade) or ""
    g = unit_qty(trade)
    parts: list[str] = []
    for l in legs:
        q = abs(int(l.get("quantity") or 0)) / g
        # Keep float string stable for whole numbers (1.0 → 1 style via TS number)
        if q == int(q):
            q_s = str(int(q))
        else:
            q_s = str(q)
        strike = "" if l.get("strike") is None else str(l["strike"])
        right = l.get("right") or ""
        ac = l.get("asset_class") or ""
        parts.append(f"{q_s}@{strike}{right}:{ac}")
    parts.sort()
    struct = "|".join(parts)
    return f"{trade.get('account_id')}|{trade.get('strategy')}|{under}|{exp}|{struct}"


def net_cash_points(trade: dict[str, Any]) -> float | None:
    """Cash to trader in price points: CREDIT +, DEBIT −."""
    np = trade.get("net_price")
    if np is None:
        return None
    try:
        raw = float(np)
    except (TypeError, ValueError):
        return None
    if raw != raw:  # NaN
        return None
    p = abs(raw)
    side = trade.get("net_side")
    if side == "CREDIT":
        return p
    if side == "DEBIT":
        return -p
    return raw


def multiplier(trade: dict[str, Any]) -> int:
    ac = trade.get("asset_class") or ""
    if not ac:
        legs = trade.get("legs") or []
        if legs:
            ac = legs[0].get("asset_class") or ""
    if ac in ("equity", "stock"):
        return 1
    return 100
