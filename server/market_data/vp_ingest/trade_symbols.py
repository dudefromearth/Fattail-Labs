"""Stocks-cluster VP trade tickers from market_symbol_universe.

Same SoR chain_feed / sym_feed resolve. Never a hardcoded house list.
Indexes (I:*) are not stocks T prints. Futures stay on the futures socket.
"""

from __future__ import annotations

import os
from typing import Any, Iterable


_EQUITY_KINDS = frozenset({"equity", "etf"})


def _norm(raw: Any) -> str:
    return str(raw or "").strip().upper()


def stocks_trade_tickers_from_rows(rows: Iterable[dict[str, Any]]) -> frozenset[str]:
    """Enabled equity/etf product symbols. Skip indexes and I: feeds."""
    out: set[str] = set()
    for row in rows:
        if not row.get("enabled", True):
            continue
        kind = _norm(row.get("kind") or "equity").lower()
        if kind not in _EQUITY_KINDS:
            continue
        product = _norm(row.get("symbol"))
        if not product:
            continue
        feed = _norm(row.get("feed_symbol") or product)
        if feed.startswith("I:"):
            continue
        out.add(product)
    return frozenset(out)


def trade_capture_symbols() -> frozenset[str]:
    """Live capture set. Env override is ops/tests only, never the house list."""
    env = (os.environ.get("LABS_VP_TRADE_SYMBOLS") or "").strip()
    if env:
        return frozenset(_norm(s) for s in env.split(",") if _norm(s))
    import db
    from market_data import universe_admin as ua

    with db.transaction() as conn:
        with conn.cursor() as cur:
            rows = ua.list_all(cur, enabled_only=True)
    tickers = stocks_trade_tickers_from_rows(rows)
    if not tickers:
        raise RuntimeError(
            "market_symbol_universe has no enabled equity/etf for VP trades capture"
        )
    return tickers


def stocks_subscribe_params(symbols: Iterable[str] | None = None) -> str:
    """Massive stocks WS subscribe params. One socket, multiplex T.*."""
    tickers = sorted(symbols if symbols is not None else trade_capture_symbols())
    if not tickers:
        raise RuntimeError("VP stocks subscribe list is empty")
    return ",".join(f"T.{s}" for s in tickers)
