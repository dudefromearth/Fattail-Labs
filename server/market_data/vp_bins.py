"""Measured volume-by-price bins (VP Spec v0.4 · vp_bins_v3).

Trades-first: volumes[i] += size at exact print price.
Production writes wait on P2-3 condition filter freeze; this module implements
geometry + optional condition include set once frozen.
"""

from __future__ import annotations

import math
from typing import Any, Iterable, Sequence


ALGO_VERSION = "vp_bins_v3"


def half_away_from_zero(x: float) -> int:
    """Round half away from zero: floor(|x|+0.5)*sign(x)."""
    if x >= 0:
        return int(math.floor(x + 0.5))
    return int(-math.floor(-x + 0.5))


def bin_index(price: float, tick_size: float, price_origin: float = 0.0) -> int:
    if tick_size <= 0:
        raise ValueError("tick_size must be > 0")
    scaled = (float(price) - float(price_origin)) / float(tick_size)
    return half_away_from_zero(scaled)


def price_of_index(i: int, tick_size: float, price_origin: float = 0.0) -> float:
    return float(price_origin) + int(i) * float(tick_size)


def trade_included(conditions: Sequence[int] | None, allow: set[int] | None) -> bool:
    """If allow is None, include all non-empty trades (pre-freeze). If set, all codes must be in allow OR empty conditions."""
    if allow is None:
        return True
    if not conditions:
        return True
    return all(int(c) in allow for c in conditions)


def accumulate_trades(
    trades: Iterable[dict[str, Any]],
    *,
    tick_size: float = 0.01,
    price_origin: float = 0.0,
    condition_allow: set[int] | None = None,
    price_key: str = "price",
    size_key: str = "size",
) -> dict[int, float]:
    bins: dict[int, float] = {}
    for t in trades:
        price = t.get(price_key)
        size = t.get(size_key)
        if price is None or size is None:
            continue
        try:
            p = float(price)
            s = float(size)
        except (TypeError, ValueError):
            continue
        if not (p > 0) or not (s > 0):
            continue
        conds = t.get("conditions")
        if isinstance(conds, str):
            try:
                import json

                conds = json.loads(conds)
            except Exception:
                conds = None
        if not trade_included(conds if isinstance(conds, list) else None, condition_allow):
            continue
        i = bin_index(p, tick_size, price_origin)
        bins[i] = bins.get(i, 0.0) + s
    return bins


def dense_volumes(
    sparse: dict[int, float],
    *,
    max_n_bins: int = 500_000,
) -> tuple[int, list[float], float]:
    """Return (min_index, dense list, total_volume). Raises if span > max_n_bins."""
    if not sparse:
        return 0, [], 0.0
    lo = min(sparse)
    hi = max(sparse)
    n = hi - lo + 1
    if n > max_n_bins:
        raise ValueError(f"skipped_bins_exceeded: n_bins={n} > max_n_bins={max_n_bins}")
    out = [0.0] * n
    total = 0.0
    for i, v in sparse.items():
        out[i - lo] = float(v)
        total += float(v)
    return lo, out, total


def build_day_artifact(
    trades: Iterable[dict[str, Any]],
    *,
    symbol: str,
    series_ticker: str,
    session_date: str,
    tick_size: float = 0.01,
    condition_allow: set[int] | None = None,
    proxy_of: str | None = None,
    price_space: str = "series",
) -> dict[str, Any]:
    sparse = accumulate_trades(
        trades,
        tick_size=tick_size,
        condition_allow=condition_allow,
    )
    min_i, volumes, total = dense_volumes(sparse)
    return {
        "symbol": symbol,
        "series_ticker": series_ticker,
        "proxy_of": proxy_of,
        "price_space": price_space,
        "algo_version": ALGO_VERSION,
        "source": "trades",
        "method": "per_trade",
        "session_date": session_date,
        "tick_size": tick_size,
        "min_index": min_i,
        "min_price": price_of_index(min_i, tick_size) if volumes else None,
        "n_bins": len(volumes),
        "volumes": volumes,
        "total_volume": total,
        "trade_filter": "all" if condition_allow is None else f"allow:{sorted(condition_allow)}",
    }
