"""Member display path for VP/SA (A2.6 · Data-Delivery D4/D5).

Authenticated members receive health / OHLC / range / stream via Labs.
Computing-class VP API stays off the browser.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Request
from starlette.responses import JSONResponse, StreamingResponse

import auth
from config import get_config
from guards import require_session
from market_data.vp_http_cache import HEALTH, payload_response
from sa_dev.service import health, ohlc_for_source, range_for, structure_for
from sa_dev.stream import iter_live_sse, iter_mock_sse

router = APIRouter(tags=["vp-display"])


def _computing_headers() -> dict[str, str]:
    """Labs is the computing consumer (A2.6). Never forward the member cookie."""
    token = auth.issue_session(
        identity_id=0, issuer="internal", role="administrator"
    )
    name = get_config().session_cookie
    return {"Cookie": f"{name}={token}"}


def _require_member(request: Request) -> dict:
    return require_session(request)


@router.get("/api/app/vp/v1/health")
def get_health(request: Request):
    _require_member(request)
    body = health(headers=_computing_headers())
    return JSONResponse(content=body, headers={"Cache-Control": HEALTH})


@router.get("/api/app/vp/v1/structure/{target_symbol}")
def get_structure(
    request: Request,
    target_symbol: str,
    source: str | None = Query(default=None),
    session_date: str | None = Query(default=None),
    kind: str = Query(default="session"),
    harness: str = Query(default="live"),
    include_bins: bool = Query(default=False),
):
    _require_member(request)
    payload = structure_for(
        target_symbol,
        source=source,
        session_date=session_date,
        kind=kind,
        harness=harness,
        headers=_computing_headers(),
        include_bins=include_bins,
    )
    if "bins" in payload and not include_bins:
        raise HTTPException(status_code=500, detail="bins leaked into structure")
    live = harness == "live" and kind == "developing"
    return payload_response(request, payload, kind=kind, live=live)


@router.get("/api/app/vp/v1/range/{target_symbol}")
def get_range_profile(
    request: Request,
    target_symbol: str,
    source: str | None = Query(default=None),
    from_date: str = Query(alias="from"),
    to_date: str = Query(alias="to"),
    price_lo: float | None = Query(default=None),
    price_hi: float | None = Query(default=None),
    row: float | None = Query(default=None),
    harness: str = Query(default="live"),
):
    _require_member(request)
    payload = range_for(
        target_symbol,
        source=source,
        from_date=from_date,
        to_date=to_date,
        price_lo=price_lo,
        price_hi=price_hi,
        row=row,
        harness=harness,
        headers=_computing_headers(),
    )
    return payload_response(request, payload, kind="range", live=harness == "live")


@router.get("/api/app/vp/v1/ohlc/{source}")
def get_source_ohlc(
    request: Request,
    source: str,
    tf: str = Query(default="5m"),
    lookback_days: int = Query(default=0),
):
    """Hydration depth: lookback_days=0 means all served sessions (D1)."""
    _require_member(request)
    if tf not in ("1m", "5m", "15m", "1h", "1d"):
        raise HTTPException(status_code=422, detail="tf must be 1m|5m|15m|1h|1d")
    payload = ohlc_for_source(source, tf=tf, lookback_days=lookback_days)
    return payload_response(request, payload, kind="ohlc", live=True)


@router.get("/api/app/vp/v1/stream")
def get_stream(
    request: Request,
    source: str = Query(default="ES"),
    timeframe: str = Query(default="5m"),
    harness: str = Query(default="live"),
    once: bool = Query(default=False),
):
    _require_member(request)
    if harness == "fixture":
        gen = iter_mock_sse(source, timeframe, once=True if once else False)
    else:
        gen = iter_live_sse(source, timeframe, headers=_computing_headers())
    return StreamingResponse(
        gen,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
