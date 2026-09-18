"""DEV-ONLY SA structure API. Consumes the VP contract via vp_client."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Request

from config import get_config
from guards import require_admin
from sa_dev.service import health, structure_for

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
def get_health(request: Request) -> dict:
    _require_dev_admin(request)
    return health(headers=_forward_cookie(request))


@router.get("/api/dev/sa/v1/structure/{target_symbol}")
def get_structure(
    request: Request,
    target_symbol: str,
    source: str | None = Query(default=None),
    session_date: str | None = Query(default=None),
    kind: str = Query(default="session"),
    harness: str = Query(default="auto"),
) -> dict:
    _require_dev_admin(request)
    payload = structure_for(
        target_symbol,
        source=source,
        session_date=session_date,
        kind=kind,
        harness=harness,
        headers=_forward_cookie(request),
    )
    if "bins" in payload:
        raise HTTPException(status_code=500, detail="bins leaked into structure")
    return payload
