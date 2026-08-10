"""Member OHLC for Options Lab charts — Massive aggs, universe-resolved."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Request

from guards import require_session
from market_data.ohlc_service import (
    OHLC_LOOKBACK_DAYS,
    fetch_product_ohlc,
    normalize_lookback_days,
    normalize_ohlc_tf,
)
from market_data.massive_client import MassiveClientError
from routes.chain_ladder import _resolve_universe_symbol
from routes.trade_log.common import _require_tool_member

router = APIRouter(tags=["market-ohlc"])


@router.get("/api/me/market/ohlc")
def get_market_ohlc(
    request: Request,
    symbol: str = Query(..., description="Admin universe product symbol"),
    tf: str = Query(
        default="1d",
        description="1d | 4h | 1h | 30m | 10m | 5m",
    ),
    lookback_days: int | None = Query(
        default=None,
        description=(
            f"Calendar days of history (1..{OHLC_LOOKBACK_DAYS}). "
            "Omit for full ≥3y window. Use a short window for fast first paint."
        ),
    ),
) -> dict:
    claims = require_session(request)
    _require_tool_member(claims, capability="read")

    try:
        tf_n = normalize_ohlc_tf(tf)
        days = normalize_lookback_days(lookback_days)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    resolved = _resolve_universe_symbol(symbol)
    feed = resolved.get("chain_underlier")
    product = resolved["product"]
    try:
        return fetch_product_ohlc(
            product=product,
            feed_symbol=str(feed) if feed else None,
            proxy_symbol=resolved.get("proxy_symbol"),
            tf=tf_n,
            lookback_days=days,
        )
    except MassiveClientError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
