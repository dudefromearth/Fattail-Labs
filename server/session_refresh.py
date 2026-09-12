"""Rolling session refresh.

Re-issue the ``ft_session`` cookie on activity so an ACTIVE member never gets
logged out: as long as they use Labs within LABS_SESSION_TTL_SECONDS (7 days),
their cookie keeps rolling forward. Someone idle beyond the full window still
expires. Refresh happens at most once per LABS_SESSION_REFRESH_SECONDS (default
1 day) per member, and never fights endpoints that set/clear the cookie
themselves (login / logout / SSO callbacks).

Spec: FatTail-Labs-Identity-Access-Spec-v1.0 §4.4 (rolling refresh).
Best-effort: any failure here must never break the request.
"""

from __future__ import annotations

import logging
import os
import time
from datetime import datetime, timedelta, timezone

import auth
from config import get_config

log = logging.getLogger("labs.session_refresh")

_DEFAULT_REFRESH_AFTER = 86400  # 1 day


def _refresh_after_seconds() -> int:
    try:
        v = int(os.environ.get("LABS_SESSION_REFRESH_SECONDS", str(_DEFAULT_REFRESH_AFTER)))
        return v if v > 0 else _DEFAULT_REFRESH_AFTER
    except ValueError:
        return _DEFAULT_REFRESH_AFTER


def _needs_refresh(iat: int, now: int, refresh_after: int) -> bool:
    """True when a valid token is old enough to roll forward. Pure + testable."""
    return iat > 0 and (now - iat) >= refresh_after


def _already_sets_session_cookie(response, cookie_name: str) -> bool:
    """The endpoint already manages the session cookie (login/logout/SSO) — leave it."""
    prefix = (cookie_name + "=").encode("latin-1")
    for key, val in response.raw_headers:
        if key.lower() == b"set-cookie" and val.startswith(prefix):
            return True
    return False


async def rolling_session_middleware(request, call_next):
    response = await call_next(request)
    try:
        cfg = get_config()
        name = cfg.session_cookie
        token = request.cookies.get(name)
        if not token or _already_sets_session_cookie(response, name):
            return response
        claims = auth.verify_session(token)  # AuthError if invalid/expired
        now = int(time.time())
        if not _needs_refresh(int(claims.get("iat") or 0), now, _refresh_after_seconds()):
            return response
        from routes.auth_routes import _session_cookie_kwargs
        new_token = auth.issue_session(
            identity_id=int(claims["identity_id"]),
            issuer=claims.get("sso_issuer") or claims.get("iss") or "labs",
            role=claims.get("role") or "observer",
        )
        ttl = int(cfg.session_ttl_seconds)
        expires = datetime.now(timezone.utc) + timedelta(seconds=ttl)
        response.set_cookie(name, new_token, max_age=ttl, expires=expires, **_session_cookie_kwargs())
    except auth.AuthError:
        pass  # invalid/expired session — let normal auth return 401
    except Exception as exc:  # noqa: BLE001 — never break a request over a refresh
        log.warning("rolling session refresh skipped: %s", exc)
    return response
