"""A14.6 transport: ETag = generation id. No contract schema change."""

from __future__ import annotations

from typing import Any

from starlette.requests import Request
from starlette.responses import JSONResponse, Response

IMMUTABLE = "private, max-age=31536000, immutable"
REVALIDATE = "private, max-age=0, must-revalidate"
HEALTH = "private, no-cache"


def format_etag(generation_id: str) -> str:
    gid = str(generation_id).strip()
    if gid.startswith('"') and gid.endswith('"'):
        return gid
    return f'"{gid}"'


def etag_match(if_none_match: str | None, etag: str) -> bool:
    if not if_none_match or not etag:
        return False
    want = etag.strip()
    for raw in if_none_match.split(","):
        token = raw.strip()
        if token.startswith("W/"):
            token = token[2:].strip()
        if token == "*" or token == want:
            return True
    return False


def cache_control_for(kind: str | None, *, live: bool = False) -> str:
    if live or (kind or "") == "developing":
        return REVALIDATE
    return IMMUTABLE


def generation_id_of(body: dict[str, Any]) -> str | None:
    raw = body.get("profile_generation_id") or body.get("parameter_set_hash")
    if raw is None:
        return None
    text = str(raw).strip()
    return text or None


def payload_response(
    request: Request,
    body: dict[str, Any] | JSONResponse,
    *,
    kind: str | None,
    live: bool = False,
) -> Response:
    """Attach ETag + Cache-Control. 304 when If-None-Match hits."""
    if isinstance(body, JSONResponse):
        return body
    headers = {"Cache-Control": cache_control_for(kind, live=live)}
    gid = generation_id_of(body)
    if gid:
        etag = format_etag(gid)
        headers["ETag"] = etag
        if etag_match(request.headers.get("if-none-match"), etag):
            return Response(status_code=304, headers=headers)
    return JSONResponse(content=body, headers=headers)


def passthrough_headers(upstream: dict[str, str]) -> dict[str, str]:
    out: dict[str, str] = {}
    lowered = {k.lower(): v for k, v in upstream.items()}
    if lowered.get("etag"):
        out["ETag"] = lowered["etag"]
    if lowered.get("cache-control"):
        out["Cache-Control"] = lowered["cache-control"]
    return out
