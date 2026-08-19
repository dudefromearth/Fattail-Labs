"""Cookie-session CSRF defense via Origin/Referer (auth hardening M6).

Browser POSTs that carry ``ft_session`` must present an Origin (or Referer)
matching an allowlisted site origin. SameSite=Lax already reduces many cases;
this blocks cross-site state changes that still send cookies in edge cases.

Skipped when:
  - safe methods (GET/HEAD/OPTIONS)
  - no session cookie (login/register/webhooks/public)
  - Authorization: Bearer agent key (non-browser agents)
"""

from __future__ import annotations

import os
from urllib.parse import urlparse

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from config import get_config

_SAFE = frozenset({"GET", "HEAD", "OPTIONS", "TRACE"})


def allowed_origins() -> frozenset[str]:
    """Canonical origins (scheme://host[:port], no trailing slash)."""
    cfg = get_config()
    out: set[str] = set()
    if cfg.web_origin:
        out.add(cfg.web_origin.rstrip("/"))
    extra = os.environ.get("LABS_CSRF_ORIGINS", "").strip()
    for part in extra.split(","):
        p = part.strip().rstrip("/")
        if p:
            out.add(p)
    if cfg.env == "dev":
        out.update(
            {
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:4000",
                "http://127.0.0.1:4000",
                "http://testserver",
            }
        )
    return frozenset(out)


def _normalize_origin(value: str) -> str | None:
    value = (value or "").strip()
    if not value:
        return None
    # Origin header is scheme://host[:port]
    if value == "null":
        return None
    parsed = urlparse(value)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        return None
    return f"{parsed.scheme}://{parsed.netloc}"


def _origin_from_referer(referer: str) -> str | None:
    return _normalize_origin(referer)  # urlparse works on full URLs


def request_origin_allowed(request: Request) -> bool:
    """True if Origin or Referer matches allowlist or same host as request."""
    allowed = set(allowed_origins())
    # Same host as this API request (works behind rewrites / direct hit)
    try:
        req_origin = f"{request.url.scheme}://{request.url.netloc}"
        if request.url.netloc:
            allowed.add(req_origin)
    except Exception:
        pass

    origin = _normalize_origin(request.headers.get("origin") or "")
    if origin and origin in allowed:
        return True
    ref = _origin_from_referer(request.headers.get("referer") or "")
    if ref and ref in allowed:
        return True
    return False


def should_check_csrf(request: Request) -> bool:
    if request.method.upper() in _SAFE:
        return False
    # Public apply writes AC only — no Labs session mutation.
    # fattail.ai may POST with a shared .fattail.ai cookie; do not CSRF-block.
    path = request.url.path.rstrip("/") or "/"
    if path == "/api/apply":
        return False
    cfg = get_config()
    if not request.cookies.get(cfg.session_cookie):
        return False
    # Agent bearer: not a browser cookie CSRF vector
    authz = request.headers.get("authorization") or request.headers.get("Authorization") or ""
    if authz.lower().startswith("bearer "):
        return False
    return True


class CsrfOriginMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if should_check_csrf(request) and not request_origin_allowed(request):
            return JSONResponse(
                status_code=403,
                content={
                    "detail": "CSRF blocked: Origin/Referer not allowed for session requests"
                },
            )
        return await call_next(request)
