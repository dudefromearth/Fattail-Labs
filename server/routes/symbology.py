"""Symbology & Registry Service HTTP — spec v0.2.1 §4.

Member session on universe / resolve / telemetry / roll-catalog.
Admin session on eligibility-report.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Request

from guards import require_admin, require_session
from symbology import catalog, reasons, service

router = APIRouter(tags=["symbology"])


def _http_exc(status: int, code: str, message: str, **extra: object) -> HTTPException:
    return HTTPException(
        status_code=status,
        detail={"code": code, "message": message, **extra},
    )


@router.get("/symbology/v1/universe")
@router.get("/api/symbology/v1/universe")
def get_universe(
    request: Request,
    roles: str | None = Query(default=None),
) -> dict:
    require_session(request)
    try:
        return service.universe(roles)
    except ValueError as exc:
        raise _http_exc(422, "invalid_roles", str(exc)) from exc


@router.get("/symbology/v1/resolve")
@router.get("/api/symbology/v1/resolve")
def get_resolve(
    request: Request,
    q: str = Query(default=""),
    roles: str | None = Query(default=None),
    preset: str | None = Query(default=None),
) -> dict:
    require_session(request)
    try:
        return service.resolve(q, roles_raw=roles, preset=preset)
    except ValueError as exc:
        raise _http_exc(422, "invalid_query", str(exc)) from exc
    except service.UnknownPreset as exc:
        raise _http_exc(
            422, "unknown_preset", f"unknown roll preset: {exc}", preset=str(exc)
        ) from exc
    except service.NamedNotBuiltPreset as exc:
        pid = str(exc)
        reason = reasons.payload("needs-the-daily-volume-path")
        raise _http_exc(
            422,
            "named-not-built",
            "picker cannot apply a named-not-built roll preset",
            preset=pid,
            reason=reason,
        ) from exc


@router.post("/symbology/v1/telemetry")
@router.post("/api/symbology/v1/telemetry")
async def post_telemetry(request: Request) -> dict:
    require_session(request)
    try:
        body = await request.json()
    except Exception as exc:  # noqa: BLE001 — fail-loud on empty/invalid JSON
        raise _http_exc(422, "invalid_body", "JSON body required") from exc
    if not isinstance(body, dict):
        raise _http_exc(422, "invalid_body", "JSON object required")
    q = str(body.get("q") or "")
    reason_code = str(body.get("reason_code") or body.get("reason") or "")
    try:
        return service.record_telemetry(q=q, reason_code=reason_code)
    except ValueError as exc:
        raise _http_exc(422, "invalid_telemetry", str(exc)) from exc


@router.get("/symbology/v1/eligibility-report")
@router.get("/api/symbology/v1/eligibility-report")
def get_eligibility_report(request: Request) -> dict:
    require_admin(request)
    return service.eligibility_report()


@router.get("/symbology/v1/roll-catalog")
@router.get("/api/symbology/v1/roll-catalog")
def get_roll_catalog(request: Request) -> dict:
    require_session(request)
    return catalog.catalog_public()
