"""Primitive Algo day replay — price/time path (DL-486)."""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, HTTPException, Query, Request

from guards import require_session
from market_data.algo_replay_path import (
    list_days,
    load_primitive_path,
    samples_from_ohlc_bars,
)
from routes.chain_ladder import _resolve_universe_symbol
from routes.trade_log.common import _require_tool_member

router = APIRouter(tags=["algo-replay"])


@router.get("/api/me/options-lab/algo-replay/days")
def algo_replay_days(
    request: Request,
    symbol: str = Query(default="SPX"),
) -> dict:
    claims = require_session(request)
    _require_tool_member(claims, capability="read")
    days = list_days(symbol)
    return {"symbol": (symbol or "SPX").upper(), "days": days, "vol": False}


@router.get("/api/me/options-lab/algo-replay/path")
def algo_replay_path(
    request: Request,
    day: str = Query(..., description="YYYY-MM-DD America/New_York"),
    symbol: str = Query(default="SPX"),
) -> dict:
    claims = require_session(request)
    _require_tool_member(claims, capability="read")
    try:
        date.fromisoformat(day[:10])
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="day must be YYYY-MM-DD") from exc
    product = (symbol or "SPX").strip().upper()
    payload = load_primitive_path(product, day[:10])
    if payload.get("samples"):
        return payload
    try:
        from market_data.massive_client import MassiveClient, MassiveClientError
        from market_data.ohlc_service import _candidates

        resolved = _resolve_universe_symbol(product)
        md = MassiveClient()
        last_err: str | None = None
        for ticker, _proxy_label, _src in _candidates(
            resolved["product"],
            resolved.get("chain_underlier"),
            resolved.get("proxy_symbol"),
        ):
            try:
                bars = md.fetch_aggs(
                    ticker,
                    multiplier=1,
                    timespan="minute",
                    start=day[:10],
                    end=day[:10],
                    limit=50000,
                )
            except MassiveClientError as exc:
                last_err = str(exc)
                continue
            samples = samples_from_ohlc_bars(list(bars or []), day[:10])
            if samples:
                return {
                    "day": day[:10],
                    "symbol": product,
                    "source": "ohlc_1m",
                    "series_ticker": ticker,
                    "vol": False,
                    "samples": samples,
                    "sample_count": len(samples),
                    "hole": None,
                }
        return {
            "day": day[:10],
            "symbol": product,
            "source": None,
            "vol": False,
            "samples": [],
            "sample_count": 0,
            "hole": "NO PATH",
            "detail": last_err,
        }
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)[:300]) from exc
