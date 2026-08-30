"""Labs re-serve of StudioOne live_capture. Browser never calls StudioOne."""

from __future__ import annotations

import gzip
import json
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from fastapi import APIRouter, Body, HTTPException, Query, Request
from fastapi.responses import Response

from config import validate_ssr_archive_env
from guards import require_admin, require_session
from market_data.ssr_archive_cache import get_cached, put_cached
from market_data.ssr_archive_read import API_VERSION, hole_http_status
from tm_hold_resident import record_hold_resident, summarize_holds

router = APIRouter(tags=["ssr-archive"])

UNREACHABLE = {
    "unreachable": True,
    "days": [],
    "error": "STUDIOONE UNREACHABLE",
    "api_version": API_VERSION,
}

NOT_CONFIGURED = {
    "error": "ARCHIVE NOT CONFIGURED",
    "api_version": API_VERSION,
}


def _settings() -> dict:
    return validate_ssr_archive_env()


def archive_base_url() -> str | None:
    return _settings()["url"]


def _not_configured() -> Response:
    return Response(
        content=json.dumps(NOT_CONFIGURED, separators=(",", ":")).encode("utf-8"),
        status_code=501,
        media_type="application/json; charset=utf-8",
        headers={"Cache-Control": "max-age=0, must-revalidate"},
    )


def _studioone_get(path: str, timeout: float) -> tuple[int, dict[str, Any]]:
    settings = _settings()
    base = settings["url"]
    if not base:
        raise ConnectionError("LABS_SSR_ARCHIVE_URL missing")
    url = f"{base}{path}"
    headers = {"Accept": "application/json", "Accept-Encoding": "gzip"}
    token = settings["token"]
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            enc = (resp.headers.get("Content-Encoding") or "").lower()
            if enc == "gzip":
                raw = gzip.decompress(raw)
            doc = json.loads(raw.decode("utf-8"))
            if not isinstance(doc, dict):
                raise ConnectionError("StudioOne returned a non-object")
            return int(resp.status), doc
    except urllib.error.HTTPError as exc:
        body = exc.read() or b"{}"
        try:
            if (exc.headers.get("Content-Encoding") or "").lower() == "gzip":
                body = gzip.decompress(body)
            doc = json.loads(body.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeError, OSError):
            doc = {"error": str(exc.reason)}
        if not isinstance(doc, dict):
            doc = {"error": str(exc.reason)}
        return int(exc.code), doc


def _version_ok(doc: dict[str, Any]) -> bool:
    ver = doc.get("api_version")
    if ver is None:
        return True
    try:
        return int(ver) == API_VERSION
    except (TypeError, ValueError):
        return False


def _gzip_json(
    request: Request,
    code: int,
    doc: dict[str, Any],
    *,
    etag: str | None = None,
    revalidate: bool = False,
    cache_state: str | None = None,
) -> Response:
    raw = json.dumps(doc, default=str, separators=(",", ":")).encode("utf-8")
    cache = "max-age=0, must-revalidate" if revalidate else "private, max-age=0, must-revalidate"
    headers = {"Cache-Control": cache}
    if cache_state:
        headers["X-Labs-Archive-Cache"] = cache_state
    accept = (request.headers.get("accept-encoding") or "").lower()
    if "gzip" in accept:
        raw = gzip.compress(raw, compresslevel=4)
        headers["Content-Encoding"] = "gzip"
    if etag:
        headers["ETag"] = f'"{etag}"'
        inm = (request.headers.get("if-none-match") or "").strip().strip('"')
        if inm and inm == etag and code == 200:
            return Response(status_code=304, headers=headers)
    return Response(
        content=raw,
        status_code=code,
        media_type="application/json; charset=utf-8",
        headers=headers,
    )


@router.get("/api/me/options-lab/archive/coverage")
def archive_coverage(
    request: Request,
    symbols: str = Query(default=""),
    days: str = Query(default=""),
    from_: str = Query(default="", alias="from"),
    to: str = Query(default=""),
) -> Response:
    require_session(request)
    if not archive_base_url():
        return _not_configured()
    qs = []
    if symbols:
        qs.append(f"symbols={urllib.parse.quote(symbols)}")
    if days:
        qs.append(f"days={urllib.parse.quote(days)}")
    if from_:
        qs.append(f"from={urllib.parse.quote(from_)}")
    if to:
        qs.append(f"to={urllib.parse.quote(to)}")
    path = "/api/coverage"
    if qs:
        path += "?" + "&".join(qs)
    try:
        code, doc = _studioone_get(path, timeout=8.0)
    except (ConnectionError, TimeoutError, urllib.error.URLError, OSError):
        return _gzip_json(request, 200, UNREACHABLE, revalidate=True)
    if code == 401:
        return _gzip_json(
            request, 401, {"error": "ARCHIVE AUTH", "api_version": API_VERSION}, revalidate=True
        )
    if code >= 500:
        return _gzip_json(request, 200, UNREACHABLE, revalidate=True)
    if not _version_ok(doc):
        return _gzip_json(
            request,
            502,
            {"error": "VERSION MISMATCH", "api_version": doc.get("api_version")},
            revalidate=True,
        )
    etag = str(doc.get("hash") or "") or None
    return _gzip_json(request, 200, doc, etag=etag, revalidate=True)


def _member_book(
    request: Request,
    *,
    studio_path: str,
    timeout: float,
    day: str,
    symbol: str,
    expiration: str,
    kind: str,
    cache_digest: str,
) -> Response:
    require_session(request)
    if not archive_base_url():
        return _not_configured()
    settings = _settings()
    cached = get_cached(
        settings["cache_root"],
        day=day,
        symbol=symbol,
        expiration=expiration or "held",
        digest=cache_digest,
        kind=kind,
    )
    if cached is not None:
        code = hole_http_status(cached.get("hole"), error=cached.get("error"))
        etag = str(cached.get("hash") or "") or None
        return _gzip_json(request, code, cached, etag=etag, cache_state="hit")
    try:
        code, doc = _studioone_get(studio_path, timeout=timeout)
    except (ConnectionError, TimeoutError, urllib.error.URLError, OSError) as exc:
        raise HTTPException(status_code=503, detail="STUDIOONE UNREACHABLE") from exc
    if code == 401:
        return _gzip_json(request, 401, {"error": "ARCHIVE AUTH", "api_version": API_VERSION})
    if not _version_ok(doc):
        return _gzip_json(
            request, 502, {"error": "VERSION MISMATCH", "api_version": doc.get("api_version")}
        )
    if doc.get("error") == "day_changed":
        code = 409
    mapped = hole_http_status(doc.get("hole"), error=doc.get("error"))
    if code in (200, 304, 404, 409, 422):
        out_code = mapped if code == 200 else code
    elif code == 404:
        out_code = 404
    else:
        out_code = 502 if code >= 500 else code
    digest = str(doc.get("hash") or cache_digest or "")
    if out_code == 200 and digest:
        put_cached(
            settings["cache_root"],
            day=day,
            symbol=symbol,
            expiration=expiration or "held",
            digest=digest,
            kind=kind,
            doc=doc,
        )
    etag = digest or None
    return _gzip_json(request, out_code, doc, etag=etag, cache_state="miss")


@router.get("/api/me/options-lab/archive/marks")
def archive_marks(
    request: Request,
    day: str = Query(...),
    t: str = Query(...),
    symbols: str = Query(default=""),
    symbol: str = Query(default=""),
) -> Response:
    """Batch nearest-in-time marks. Generic tapes. Provenance is a field, not MID."""
    require_session(request)
    if not archive_base_url():
        return _not_configured()
    names = symbols or symbol
    qs = [
        f"day={urllib.parse.quote(day)}",
        f"t={urllib.parse.quote(t)}",
    ]
    if names:
        qs.append(f"symbols={urllib.parse.quote(names)}")
    path = "/api/marks?" + "&".join(qs)
    try:
        code, doc = _studioone_get(path, timeout=30.0)
    except (ConnectionError, TimeoutError, urllib.error.URLError, OSError):
        return _gzip_json(request, 200, UNREACHABLE, revalidate=True)
    if code == 401:
        return _gzip_json(
            request, 401, {"error": "ARCHIVE AUTH", "api_version": API_VERSION}, revalidate=True
        )
    if code >= 500:
        return _gzip_json(request, 200, UNREACHABLE, revalidate=True)
    if not _version_ok(doc):
        return _gzip_json(
            request,
            502,
            {"error": "VERSION MISMATCH", "api_version": doc.get("api_version")},
            revalidate=True,
        )
    hole = doc.get("hole")
    out_code = hole_http_status(hole) if hole else code
    return _gzip_json(request, out_code, doc, revalidate=True)


@router.get("/api/me/options-lab/archive/index")
def archive_index(
    request: Request,
    day: str = Query(...),
    symbol: str = Query(...),
    expiration: str = Query(default=""),
    day_hash: str = Query(default=""),
) -> Response:
    path = f"/api/index?day={urllib.parse.quote(day)}&symbol={urllib.parse.quote(symbol)}"
    if expiration:
        path += f"&expiration={urllib.parse.quote(expiration)}"
    return _member_book(
        request,
        studio_path=path,
        timeout=60.0,
        day=day,
        symbol=symbol,
        expiration=expiration,
        kind="index",
        cache_digest=day_hash,
    )


@router.get("/api/me/options-lab/archive/fetch")
def archive_fetch(
    request: Request,
    day: str = Query(...),
    symbol: str = Query(...),
    level: int = Query(default=0, ge=0, le=16),
    from_: str = Query(default="", alias="from"),
    to: str = Query(default=""),
    day_hash: str = Query(default=""),
    expiration: str = Query(default=""),
    from_index: int | None = Query(default=None),
) -> Response:
    parts = [
        f"day={urllib.parse.quote(day)}",
        f"symbol={urllib.parse.quote(symbol)}",
        f"level={level}",
    ]
    if from_:
        parts.append(f"from={urllib.parse.quote(from_)}")
    if to:
        parts.append(f"to={urllib.parse.quote(to)}")
    if day_hash:
        parts.append(f"day_hash={urllib.parse.quote(day_hash)}")
    if expiration:
        parts.append(f"expiration={urllib.parse.quote(expiration)}")
    if from_index is not None:
        parts.append(f"from_index={int(from_index)}")
    import hashlib

    kind = hashlib.sha256(
        f"fetch|{level}|{from_index}|{from_}|{to}".encode()
    ).hexdigest()[:24]
    return _member_book(
        request,
        studio_path="/api/fetch?" + "&".join(parts),
        timeout=120.0,
        day=day,
        symbol=symbol,
        expiration=expiration,
        kind=kind,
        cache_digest=day_hash,
    )


@router.post("/api/me/options-lab/archive/hold-resident")
def archive_hold_resident(
    request: Request, payload: dict[str, Any] = Body(default_factory=dict)
) -> Response:
    """Session. One completed hold. Best-effort write. Never blocks replay."""
    claims = require_session(request)
    raw = payload if isinstance(payload, dict) else {}
    iid = int(claims.get("identity_id") or 0)
    heap = raw.get("heap_bytes")
    try:
        heap_i = int(heap) if heap is not None else None
    except (TypeError, ValueError):
        heap_i = None
    try:
        n = int(raw.get("gen_count") or 0)
    except (TypeError, ValueError):
        n = 0
    try:
        fid = float(raw["fidelity"]) if raw.get("fidelity") is not None else None
    except (TypeError, ValueError):
        fid = None
    record_hold_resident(
        iid,
        day=str(raw.get("day") or ""),
        symbol=str(raw.get("symbol") or ""),
        gen_count=n,
        heap_bytes=heap_i,
        fidelity=fid,
    )
    return Response(status_code=204)


@router.get("/api/admin/options-lab/archive/hold-resident")
def archive_hold_resident_admin(request: Request) -> Response:
    require_admin(request)
    return _gzip_json(request, 200, summarize_holds(), revalidate=True)


@router.get("/api/admin/options-lab/archive/stats")
def archive_stats(request: Request) -> Response:
    require_admin(request)
    if not archive_base_url():
        return _not_configured()
    try:
        code, doc = _studioone_get("/api/stats", timeout=30.0)
    except (ConnectionError, TimeoutError, urllib.error.URLError, OSError) as exc:
        raise HTTPException(status_code=503, detail="STUDIOONE UNREACHABLE") from exc
    if code == 401:
        return _gzip_json(request, 401, {"error": "ARCHIVE AUTH", "api_version": API_VERSION})
    return _gzip_json(request, code if code in (200, 404, 409) else 502, doc)


@router.get("/api/admin/options-lab/archive/cadence")
def archive_cadence(
    request: Request,
    symbols: str = Query(default=""),
    days: str = Query(default=""),
    from_: str = Query(default="", alias="from"),
    to: str = Query(default=""),
) -> Response:
    require_admin(request)
    if not archive_base_url():
        return _not_configured()
    qs = []
    if symbols:
        qs.append(f"symbols={urllib.parse.quote(symbols)}")
    if days:
        qs.append(f"days={urllib.parse.quote(days)}")
    if from_:
        qs.append(f"from={urllib.parse.quote(from_)}")
    if to:
        qs.append(f"to={urllib.parse.quote(to)}")
    path = "/api/cadence"
    if qs:
        path += "?" + "&".join(qs)
    try:
        code, doc = _studioone_get(path, timeout=30.0)
    except (ConnectionError, TimeoutError, urllib.error.URLError, OSError) as exc:
        raise HTTPException(status_code=503, detail="STUDIOONE UNREACHABLE") from exc
    if code == 401:
        return _gzip_json(request, 401, {"error": "ARCHIVE AUTH", "api_version": API_VERSION})
    return _gzip_json(request, code if code in (200, 404, 409) else 502, doc)
