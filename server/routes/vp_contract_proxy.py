"""MiniTwo/Labs hop for VP Contract v1.1. Forwards A14.6 cache headers.

Computing-class only (F6). Members 403. Upstream is DEV-API.md canonical base.
Transport only — no envelope rewrite.
"""

from __future__ import annotations

from fastapi import APIRouter, Query, Request
from fastapi.responses import JSONResponse, Response, StreamingResponse

import auth
from config import get_config
from guards import require_session
from market_data.vp_http_cache import passthrough_headers
from sa_dev.stream import iter_live_sse
from sa_dev.vp_client import ContractMismatch, fetch_v1

router = APIRouter(tags=["vp-contract-proxy"])


def _computing(request: Request) -> JSONResponse | dict:
    try:
        claims = require_session(request)
    except Exception:
        return JSONResponse(status_code=401, content={"error": "unauthenticated"})
    role = str(claims.get("role") or "observer")
    if not auth.role_at_least(role, "administrator"):
        return JSONResponse(
            status_code=403, content={"error": "computing_consumers_only"}
        )
    return claims


def _forward(request: Request) -> dict[str, str]:
    name = get_config().session_cookie
    val = request.cookies.get(name)
    hdrs: dict[str, str] = {}
    if val:
        hdrs["Cookie"] = f"{name}={val}"
    inm = request.headers.get("if-none-match")
    if inm:
        hdrs["If-None-Match"] = inm
    return hdrs


def _upstream_response(status: int, body: dict, headers: dict[str, str]) -> Response:
    extra = passthrough_headers(headers)
    if status == 304:
        return Response(status_code=304, headers=extra)
    return JSONResponse(status_code=status, content=body, headers=extra)


@router.get("/api/vp/v1/health")
def proxy_health(request: Request) -> Response:
    gate = _computing(request)
    if isinstance(gate, JSONResponse):
        return gate
    try:
        status, body, headers = fetch_v1("/v1/health", headers=_forward(request))
    except ContractMismatch as exc:
        return JSONResponse(status_code=502, content={"error": str(exc)})
    return _upstream_response(status, body, headers)


@router.get("/api/vp/v1/profile/{target_symbol}/range")
def proxy_range(
    request: Request,
    target_symbol: str,
    from_: str | None = Query(default=None, alias="from"),
    to: str | None = Query(default=None),
    price_lo: float | None = Query(default=None),
    price_hi: float | None = Query(default=None),
    row: float | None = Query(default=None),
    source: str | None = Query(default=None),
    allow_partial: bool = Query(default=False),
) -> Response:
    gate = _computing(request)
    if isinstance(gate, JSONResponse):
        return gate
    q: dict[str, str] = {}
    if from_:
        q["from"] = from_
    if to:
        q["to"] = to
    if price_lo is not None:
        q["price_lo"] = str(price_lo)
    if price_hi is not None:
        q["price_hi"] = str(price_hi)
    if row is not None:
        q["row"] = str(row)
    if source:
        q["source"] = source
    if allow_partial:
        q["allow_partial"] = "true"
    path = f"/v1/profile/{target_symbol}/range"
    try:
        status, body, headers = fetch_v1(path, query=q, headers=_forward(request))
    except ContractMismatch as exc:
        return JSONResponse(status_code=502, content={"error": str(exc)})
    return _upstream_response(status, body, headers)


@router.get("/api/vp/v1/profile/{target_symbol}/{kind}")
def proxy_profile(
    request: Request,
    target_symbol: str,
    kind: str,
    session_date: str | None = Query(default=None),
    as_of: str | None = Query(default=None),
    row: float | None = Query(default=None),
    source: str | None = Query(default=None),
) -> Response:
    gate = _computing(request)
    if isinstance(gate, JSONResponse):
        return gate
    q: dict[str, str] = {}
    if session_date:
        q["session_date"] = session_date
    if as_of:
        q["as_of"] = as_of
    if row is not None:
        q["row"] = str(row)
    if source:
        q["source"] = source
    path = f"/v1/profile/{target_symbol}/{kind}"
    try:
        status, body, headers = fetch_v1(path, query=q, headers=_forward(request))
    except ContractMismatch as exc:
        return JSONResponse(status_code=502, content={"error": str(exc)})
    return _upstream_response(status, body, headers)


@router.get("/api/vp/v1/stream")
def proxy_stream(
    request: Request,
    source: str = Query(default="ES"),
    timeframe: str = Query(default="5m"),
):
    gate = _computing(request)
    if isinstance(gate, JSONResponse):
        return gate
    return StreamingResponse(
        iter_live_sse(source, timeframe, headers=_forward(request)),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )



