"""DEV-ONLY SA structure API. Consumes the VP contract via vp_client."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Request
from starlette.responses import JSONResponse, StreamingResponse

from config import get_config
from guards import require_admin
from market_data.vp_http_cache import HEALTH, payload_response
from sa_dev.service import health, ohlc_for_source, range_for, structure_for
from sa_dev.stream import iter_live_sse, iter_mock_sse

router = APIRouter(tags=["sa-dev"])


def _forward_cookie(request: Request) -> dict[str, str]:
    name = get_config().session_cookie
    val = request.cookies.get(name)
    if not val:
        return {}
    return {"Cookie": f"{name}={val}"}


def _require_dev_admin(request: Request) -> dict:
    cfg = get_config()
    if cfg.env != "dev":
        raise HTTPException(status_code=404, detail="Not found")
    try:
        return require_admin(request)
    except HTTPException as exc:
        if exc.status_code in (401, 403):
            raise HTTPException(
                status_code=403,
                detail="SA-DEV is administrator-only even in dev",
            ) from exc
        raise


@router.get("/api/dev/sa/v1/health")
def get_health(request: Request):
    _require_dev_admin(request)
    body = health(headers=_forward_cookie(request))
    return JSONResponse(content=body, headers={"Cache-Control": HEALTH})


@router.get("/api/dev/sa/v1/structure/{target_symbol}")
def get_structure(
    request: Request,
    target_symbol: str,
    source: str | None = Query(default=None),
    session_date: str | None = Query(default=None),
    kind: str = Query(default="session"),
    harness: str = Query(default="auto"),
    include_bins: bool = Query(default=False),
):
    _require_dev_admin(request)
    payload = structure_for(
        target_symbol,
        source=source,
        session_date=session_date,
        kind=kind,
        harness=harness,
        headers=_forward_cookie(request),
        include_bins=include_bins,
    )
    if "bins" in payload and not include_bins:
        return JSONResponse(status_code=422, content={"error": "BINS_LEAKED"})
    live = harness == "live" and kind == "developing"
    return payload_response(request, payload, kind=kind, live=live)


@router.get("/api/dev/sa/v1/range/{target_symbol}")
def get_range_profile(
    request: Request,
    target_symbol: str,
    source: str | None = Query(default=None),
    from_date: str = Query(alias="from"),
    to_date: str = Query(alias="to"),
    price_lo: float | None = Query(default=None),
    price_hi: float | None = Query(default=None),
    row: float | None = Query(default=None),
    harness: str = Query(default="auto"),
):
    """A12 full-history profile. Computing-class / admin-dev only."""
    _require_dev_admin(request)
    payload = range_for(
        target_symbol,
        source=source,
        from_date=from_date,
        to_date=to_date,
        price_lo=price_lo,
        price_hi=price_hi,
        row=row,
        harness=harness,
        headers=_forward_cookie(request),
    )
    return payload_response(request, payload, kind="range", live=harness == "live")


@router.get("/api/dev/sa/v1/ohlc/{source}")
def get_source_ohlc(
    request: Request,
    source: str,
    tf: str = Query(default="5m"),
    lookback_days: int = Query(default=5),
):
    """SOURCE-space candles from the same prints as the profile (A12.4)."""
    _require_dev_admin(request)
    if tf not in ("1m", "5m", "15m", "1h", "1d"):
        raise HTTPException(status_code=422, detail="tf must be 1m|5m|15m|1h|1d")
    payload = ohlc_for_source(source, tf=tf, lookback_days=lookback_days)
    return payload_response(request, payload, kind="ohlc", live=True)


@router.get("/api/dev/sa/v1/stream")
def get_stream(
    request: Request,
    source: str = Query(default="ES"),
    timeframe: str = Query(default="5m"),
    harness: str = Query(default="live"),
    once: bool = Query(default=False),
):
    """SSE relay for contract v1.3. Computing-class / admin-dev only."""
    _require_dev_admin(request)
    if harness == "fixture":
        gen = iter_mock_sse(source, timeframe, once=True if once else False)
    else:
        gen = iter_live_sse(source, timeframe, headers=_forward_cookie(request))
    return StreamingResponse(
        gen,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
