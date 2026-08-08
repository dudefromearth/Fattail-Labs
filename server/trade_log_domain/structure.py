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


def option_strikes(trade: dict[str, Any]) -> list[float]:
    """Unique option strikes ascending (equity/stock legs ignored)."""
    out: list[float] = []
    for leg in trade.get("legs") or []:
        ac = (leg.get("asset_class") or trade.get("asset_class") or "").lower()
        if ac in ("equity", "stock", "crypto", "future") and not leg.get("expiry"):
            continue
        s = leg.get("strike")
        if s is None:
            continue
        try:
            f = float(s)
        except (TypeError, ValueError):
            continue
        if f not in out:
            out.append(f)
    out.sort()
    return out


def structure_wing_width(trade: dict[str, Any]) -> float | None:
    """Defined-risk wing width in points from strikes.

    Vertical / fly / iron: minimum adjacent strike gap (body width for a fly).
    Condor / IC: short-wing width = min gap. None if <2 strikes.
    """
    strikes = option_strikes(trade)
    if len(strikes) < 2:
        return None
    gaps = [strikes[i + 1] - strikes[i] for i in range(len(strikes) - 1)]
    width = min(g for g in gaps if g > 0) if any(g > 0 for g in gaps) else None
    return width


def entry_r2r(trade: dict[str, Any]) -> float | None:
    """Entry-time R2R — not from how the trade ended.

    Coach definition:
      R2R = potential_profit / risk
    where risk = maximum you must put up (debit paid, or width−credit on
    a credit structure), and potential_profit = max theoretical profit at
    open (wing_width − debit on debit structures; credit on credit structures).

    Example debit fly: width 10, debit 0.91 → potential 9.09 → R2R ≈ 10.0.

    Close fills return None. Undefined without net price or strike width.
    """
    if trade_is_close_fill(trade):
        return None
    cash = net_cash_points(trade)
    if cash is None:
        return None
    width = structure_wing_width(trade)
    if width is None or width <= 0:
        return None

    # Debit: risk = debit; potential = width − debit
    if cash < 0:
        risk = abs(cash)
        if risk <= 1e-12:
            return None
        potential = width - risk
        if potential <= 1e-12:
            return None
        return potential / risk

    # Credit: risk = width − credit; potential = credit
    if cash > 0:
        credit = cash
        risk = width - credit
        if risk <= 1e-12 or credit <= 1e-12:
            return None
        return credit / risk

    return None


def average_entry_r2r(trades: list[dict[str, Any]]) -> tuple[float | None, int]:
    """Mean entry R2R over open fills that have a defined structure R2R."""
    vals: list[float] = []
    for t in trades:
        r = entry_r2r(t)
        if r is not None and r > 0 and r == r:  # finite
            vals.append(r)
    if not vals:
        return None, 0
    return sum(vals) / len(vals), len(vals)
