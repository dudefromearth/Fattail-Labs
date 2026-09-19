"""Symbology Registry sidecar — spec v0.2.1 §4.

Computing-class only (same gate as vp_api). StudioOne D1 home :4011.
Does not replace Labs :4000. No Massive on the hot path (SYM-13).
"""

from __future__ import annotations

import os

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import JSONResponse

import auth
from guards import require_session
from symbology import catalog, reasons, service

app = FastAPI(title="Symbology Registry", docs_url=None, redoc_url=None)


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


def _http_exc(status: int, code: str, message: str, **extra: object) -> HTTPException:
    return HTTPException(
        status_code=status,
        detail={"code": code, "message": message, **extra},
    )


def _gate(request: Request):
    gate = _computing(request)
    if isinstance(gate, JSONResponse):
        return gate
    return None


@app.get("/symbology/v1/health")
@app.get("/api/symbology/v1/health")
def get_health(request: Request):
    blocked = _gate(request)
    if blocked is not None:
        return blocked
    return {
        "ok": True,
        "service": "symbology",
        "strip_generation_id": service.INITIAL_GENERATION_ID,
        "house_preset_id": catalog.HOUSE_PRESET_ID,
    }


@app.get("/symbology/v1/universe")
@app.get("/api/symbology/v1/universe")
def get_universe(request: Request, roles: str | None = Query(default=None)):
    blocked = _gate(request)
    if blocked is not None:
        return blocked
    try:
        return service.universe(roles)
    except ValueError as exc:
        raise _http_exc(422, "invalid_roles", str(exc)) from exc


@app.get("/symbology/v1/resolve")
@app.get("/api/symbology/v1/resolve")
def get_resolve(
    request: Request,
    q: str = Query(default=""),
    roles: str | None = Query(default=None),
    preset: str | None = Query(default=None),
):
    blocked = _gate(request)
    if blocked is not None:
        return blocked
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


@app.post("/symbology/v1/telemetry")
@app.post("/api/symbology/v1/telemetry")
async def post_telemetry(request: Request):
    blocked = _gate(request)
    if blocked is not None:
        return blocked
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


@app.get("/symbology/v1/eligibility-report")
@app.get("/api/symbology/v1/eligibility-report")
def get_eligibility_report(request: Request):
    blocked = _gate(request)
    if blocked is not None:
        return blocked
    return service.eligibility_report()


@app.get("/symbology/v1/roll-catalog")
@app.get("/api/symbology/v1/roll-catalog")
def get_roll_catalog(request: Request):
    blocked = _gate(request)
    if blocked is not None:
        return blocked
    return catalog.catalog_public()


def main() -> int:
    host = (os.environ.get("LABS_SYMBOLOGY_API_HOST") or "").strip()
    port_raw = (os.environ.get("LABS_SYMBOLOGY_API_PORT") or "").strip()
    if not host or not port_raw:
        raise SystemExit(
            "LABS_SYMBOLOGY_API_HOST and LABS_SYMBOLOGY_API_PORT are required"
        )
    port = int(port_raw)
    import uvicorn

    uvicorn.run(
        "symbology_app:app",
        host=host,
        port=port,
        reload=False,
        timeout_keep_alive=75,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
