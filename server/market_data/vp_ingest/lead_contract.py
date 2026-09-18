"""Derived lead-contract rule for futures OHLC / published series.

Never a hardcoded ticker. Active set and last_trade_date come from vendor
Contracts metadata when provided; volume leadership from the print window.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Any

from market_data.vp_ingest.futures_contracts import ROLL_DAYS, product_of_ticker


def volume_by_contract(prints: list[dict[str, Any]]) -> dict[str, float]:
    vol: dict[str, float] = {}
    for rec in prints:
        key = str(rec.get("contract") or "").strip().upper()
        if not key:
            continue
        try:
            v = float(rec.get("s") if rec.get("s") is not None else rec.get("size") or 0)
        except (TypeError, ValueError):
            v = 0.0
        vol[key] = vol.get(key, 0.0) + v
    return vol


def volume_leader(prints: list[dict[str, Any]]) -> str | None:
    vol = volume_by_contract(prints)
    if not vol:
        return None
    return max(vol, key=vol.get)


def front_and_next(
    contracts: list[dict[str, Any]],
    *,
    product: str,
    as_of: date,
) -> tuple[str | None, str | None, dict[str, date]]:
    """Front = nearest last_trade_date still listed as of as_of. Next = the following."""
    product = product.upper()
    dated: list[tuple[date, str]] = []
    ltd_map: dict[str, date] = {}
    for c in contracts:
        ticker = str(c.get("ticker") or "").strip().upper()
        if not ticker:
            continue
        prod = str(c.get("product_code") or product_of_ticker(ticker) or "").upper()
        if prod != product:
            continue
        raw = str(c.get("last_trade_date") or "")[:10]
        if not raw:
            continue
        try:
            ltd = date.fromisoformat(raw)
        except ValueError:
            continue
        dated.append((ltd, ticker))
        ltd_map[ticker] = ltd
    dated.sort()
    live = [(ltd, t) for ltd, t in dated if ltd >= as_of]
    if not live:
        if dated:
            return dated[-1][1], None, ltd_map
        return None, None, ltd_map
    front = live[0][1]
    nxt = live[1][1] if len(live) > 1 else None
    return front, nxt, ltd_map


def select_lead_contract(
    prints: list[dict[str, Any]],
    *,
    product: str | None = None,
    contracts: list[dict[str, Any]] | None = None,
    as_of: date | None = None,
) -> tuple[str | None, str]:
    """Return (ticker, rule).

    Rules (in order):
    - ``front_expired_next`` — calendar front's last_trade_date < as_of
    - ``volume_in_roll_window`` — as_of within ROLL_DAYS of front last_trade; volume leader
    - ``front_calendar`` — outside roll window; front if it printed
    - ``volume_only`` — no Contracts metadata; volume leader among print contracts
    """
    day = as_of or datetime.now().date()
    vol = volume_by_contract(prints)
    if not vol:
        return None, "volume_only"
    prod = (product or "").upper() or None
    if prod is None:
        for ticker in vol:
            prod = product_of_ticker(ticker)
            if prod:
                break
    if not contracts or not prod:
        return max(vol, key=vol.get), "volume_only"

    front, nxt, ltd_map = front_and_next(contracts, product=prod, as_of=day)
    if front and ltd_map.get(front) is not None and ltd_map[front] < day:
        if nxt and nxt in vol:
            return nxt, "front_expired_next"
        if front in vol:
            return front, "front_expired_next"

    in_roll = False
    if front and front in ltd_map:
        delta = (ltd_map[front] - day).days
        in_roll = 0 <= delta <= ROLL_DAYS

    if in_roll:
        candidates = [t for t in (front, nxt) if t and t in vol] or list(vol)
        return max(candidates, key=lambda t: vol.get(t, 0.0)), "volume_in_roll_window"

    if front and front in vol:
        return front, "front_calendar"
    if nxt and nxt in vol:
        return nxt, "front_calendar"
    return max(vol, key=vol.get), "volume_only"
