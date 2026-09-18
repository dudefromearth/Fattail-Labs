"""DEV-ONLY HTTP surface of VP API Contract v1.1. Exact paths. No aliases."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse

from config import get_config
from guards import require_session
import auth
from sa_dev.vp_contract_mock import (
    MOCK_SPY_FLOOR,
    f8_range,
    health,
    range_below_coverage,
    resolve_profile,
)

router = APIRouter(tags=["vp-contract-mock"])


def _dev_only() -> JSONResponse | None:
    if get_config().env != "dev":
        return JSONResponse(status_code=404, content={"error": "Not found"})
    return None


def _computing_consumer(request: Request) -> JSONResponse | dict:
    closed = _dev_only()
    if closed is not None:
        return closed
    try:
        claims = require_session(request)
    except HTTPException:
        return JSONResponse(status_code=401, content={"error": "unauthenticated"})
    role = str(claims.get("role") or "observer")
    if not auth.role_at_least(role, "administrator"):
        return JSONResponse(
            status_code=403, content={"error": "computing_consumers_only"}
        )
    return claims


@router.get("/v1/health")
def get_health(request: Request):
    gate = _computing_consumer(request)
    if isinstance(gate, JSONResponse):
        return gate
    return health()


@router.get("/v1/profile/{target_symbol}/range")
def get_range(
    request: Request,
    target_symbol: str,
    from_: str | None = Query(default=None, alias="from"),
    to: str | None = Query(default=None),
    price_lo: float | None = Query(default=None),
    price_hi: float | None = Query(default=None),
    row: float | None = Query(default=None),
    source: str | None = Query(default=None),
    allow_partial: bool = Query(default=False),
):
    gate = _computing_consumer(request)
    if isinstance(gate, JSONResponse):
        return gate
    if not from_ or not to:
        return JSONResponse(status_code=422, content={"error": "from_and_to_required"})
    if target_symbol.upper() not in ("SPX", "XSP"):
        return JSONResponse(status_code=404, content={"error": "unknown_target"})
    if from_ < MOCK_SPY_FLOOR and not allow_partial:
        status, err = range_below_coverage(from_)
        return JSONResponse(status_code=status, content=err)
    body = f8_range(price_lo, price_hi)
    if from_ < MOCK_SPY_FLOOR and allow_partial:
        body["coverage"] = {
            "requested_from": from_,
            "served_from": MOCK_SPY_FLOOR,
            "served_to": to,
            "truncated": True,
        }
    return body


@router.get("/v1/profile/{target_symbol}/{kind}")
def get_profile(
    request: Request,
    target_symbol: str,
    kind: str,
    session_date: str | None = Query(default=None),
    as_of: str | None = Query(default=None),
    row: float | None = Query(default=None),
    source: str | None = Query(default=None),
):
    gate = _computing_consumer(request)
    if isinstance(gate, JSONResponse):
        return gate
    resolved = resolve_profile(
        target_symbol, kind, source=source, session_date=session_date
    )
    if isinstance(resolved, tuple):
        status, err = resolved
        return JSONResponse(status_code=status, content=err)
    return resolved
