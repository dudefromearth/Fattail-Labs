"""Unified underlier OHLC/aggs facade (Universal Adoption Phase E / U9).

Volume Profile and Trade Log charts share this module so Massive is not
called from parallel ad-hoc clients in product code. Caching stays in
``ohlc_service`` / ``trade_chart_service`` implementations.
"""

from __future__ import annotations

from typing import Any


def fetch_product_ohlc(**kwargs: Any) -> dict[str, Any]:
    """Options Lab Volume Profile / shared underlier OHLC."""
    from market_data.ohlc_service import fetch_product_ohlc as _fetch

    return _fetch(**kwargs)


def build_trade_chart(cur, trade: dict[str, Any], **kwargs: Any) -> dict[str, Any]:
    """Practice Trade Log chart assembly (Massive/Yahoo behind one service)."""
    from market_data.trade_chart_service import build_trade_chart as _build

    return _build(cur, trade, **kwargs)
