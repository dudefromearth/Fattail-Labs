"""Symbology & Registry Service HTTP — spec v0.2.1 §4.

Member session on universe / resolve / telemetry / roll-catalog.
Admin session on eligibility-report.
After SYM-SWAP, Labs hops to the StudioOne computing-class sidecar
(LABS_SYMBOLOGY_API_BASE). Member cookie never forwarded.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse

import auth
from config import get_config
from guards import require_admin, require_session
from symbology import catalog, reasons, service

router = APIRouter(tags=["symbology"])

_PIN_HOSTS = {"studioone.local": "192.168.1.111"}
_INPROCESS = frozenset({"", "inprocess", "mock", "mock://"})


def _http_exc(status: int, code: str, message: str, **extra: object) -> HTTPException:
    return HTTPException(
        status_code=status,
        detail={"code": code, "message": message, **extra},
    )


def _pin_url(url: str) -> str:
    from urllib.parse import urlsplit, urlunsplit

    u = urlsplit(url)
    host = (u.hostname or "").lower()
    if host not in _PIN_HOSTS:
        return url
    netloc = _PIN_HOSTS[host]
    if u.port:
        netloc = f"{netloc}:{u.port}"
    return urlunsplit((u.scheme, netloc, u.path, u.query, u.fragment))


def _dotenv_base() -> str:
    env_path = Path(__file__).resolve().parents[2] / ".env"
    if not env_path.is_file():
        return ""
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        if k.strip() == "LABS_SYMBOLOGY_API_BASE":
            return v.strip().strip('"').strip("'")
    return ""


def _upstream_base() -> str:
    env = (os.environ.get("LABS_SYMBOLOGY_API_BASE") or "").strip()
    if env.lower() in _INPROCESS and env != "":
        return ""
    if env:
        return _pin_url(env.rstrip("/"))
    raw = (_dotenv_base() or "").strip()
    if raw.lower() in _INPROCESS:
        return ""
    return _pin_url(raw.rstrip("/")) if raw else ""


def _computing_headers() -> dict[str, str]:
    token = auth.issue_computing_session()
    name = get_config().session_cookie
    return {
        "Cookie": f"{name}={token}",
        "Accept": "application/json",
    }


def _maybe_hop(
    method: str,
    path: str,
    params: dict[str, str] | None = None,
    body: dict | None = None,
) -> JSONResponse | None:
    base = _upstream_base()
    if not base:
        return None
    qs = urllib.parse.urlencode({k: v for k, v in (params or {}).items() if v})
    url = f"{base}{path}" + (f"?{qs}" if qs else "")
    headers = _computing_headers()
    data = None
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            raw = resp.read()
            parsed = json.loads(raw.decode("utf-8")) if raw else {}
            return JSONResponse(content=parsed, status_code=resp.status)
    except urllib.error.HTTPError as exc:
        raw = exc.read()
        try:
            parsed = json.loads(raw.decode("utf-8")) if raw else {"error": "upstream"}
        except json.JSONDecodeError:
            parsed = {"error": "upstream_non_json", "status": exc.code}
        return JSONResponse(content=parsed, status_code=exc.code)
    except urllib.error.URLError as exc:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "symbology_upstream_unavailable",
                "message": f"StudioOne registry unreachable: {exc}",
            },
        ) from exc


@router.get("/symbology/v1/universe")
@router.get("/api/symbology/v1/universe")
def get_universe(
    request: Request,
    roles: str | None = Query(default=None),
):
    require_session(request)
    hopped = _maybe_hop(
        "GET",
        "/symbology/v1/universe",
        {"roles": roles} if roles else None,
    )
    if hopped is not None:
        return hopped
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
):
    require_session(request)
    params = {"q": q}
    if roles:
        params["roles"] = roles
    if preset:
        params["preset"] = preset
    hopped = _maybe_hop("GET", "/symbology/v1/resolve", params)
    if hopped is not None:
        return hopped
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
async def post_telemetry(request: Request):
    require_session(request)
    try:
        body = await request.json()
    except Exception as exc:  # noqa: BLE001 — fail-loud on empty/invalid JSON
        raise _http_exc(422, "invalid_body", "JSON body required") from exc
    if not isinstance(body, dict):
        raise _http_exc(422, "invalid_body", "JSON object required")
    hopped = _maybe_hop("POST", "/symbology/v1/telemetry", body=body)
    if hopped is not None:
        return hopped
    q = str(body.get("q") or "")
    reason_code = str(body.get("reason_code") or body.get("reason") or "")
    try:
        return service.record_telemetry(q=q, reason_code=reason_code)
    except ValueError as exc:
        raise _http_exc(422, "invalid_telemetry", str(exc)) from exc


@router.get("/symbology/v1/eligibility-report")
@router.get("/api/symbology/v1/eligibility-report")
def get_eligibility_report(request: Request):
    require_admin(request)
    hopped = _maybe_hop("GET", "/symbology/v1/eligibility-report")
    if hopped is not None:
        return hopped
    return service.eligibility_report()


@router.get("/symbology/v1/roll-catalog")
@router.get("/api/symbology/v1/roll-catalog")
def get_roll_catalog(request: Request):
    require_session(request)
    hopped = _maybe_hop("GET", "/symbology/v1/roll-catalog")
    if hopped is not None:
        return hopped
    return catalog.catalog_public()


@router.get("/symbology/v1/spec/{symbol}")
@router.get("/api/symbology/v1/spec/{symbol}")
def get_spec(request: Request, symbol: str, as_of: str | None = Query(default=None)):
    """REQ-009 — member hop. Reads the registry. Never scrapes CME (SPEC-14)."""
    require_session(request)
    params = {"as_of": as_of} if as_of else None
    hopped = _maybe_hop("GET", f"/symbology/v1/spec/{symbol}", params)
    if hopped is not None:
        return hopped
    from symbology.spec import BadAsOf, lookup_for_http

    try:
        body = lookup_for_http(symbol, as_of=as_of, member_surface=True)
    except BadAsOf as exc:
        raise _http_exc(422, "invalid_as_of", str(exc)) from exc
    if body is None:
        raise _http_exc(404, "not_found", "spec not found")
    return body
