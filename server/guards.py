"""Shared route guards (refactor step 2/4, decision log 2026-07-21).

One implementation of the cookie -> verify -> role-gate dance; previously
reimplemented seven times across five route modules. Semantics preserved:
- missing cookie      -> 401 "Sign in required"
- invalid/expired jwt -> 401 with the verifier's reason
- insufficient role   -> 403 "<Role> role required"
"""

from fastapi import HTTPException, Request

import auth
from config import get_config


def claims_or_none(request: Request) -> dict | None:
    """Session claims, or None for anonymous/invalid — never raises."""
    token = request.cookies.get(get_config().session_cookie)
    if not token:
        return None
    try:
        return auth.verify_session(token)
    except auth.AuthError:
        return None


def require_session(request: Request) -> dict:
    token = request.cookies.get(get_config().session_cookie)
    if not token:
        raise HTTPException(status_code=401, detail="Sign in required")
    try:
        return auth.verify_session(token)
    except auth.AuthError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc


def require_role(request: Request, minimum: str) -> dict:
    claims = require_session(request)
    if not auth.role_at_least(claims["role"], minimum):
        raise HTTPException(
            status_code=403, detail=f"{minimum.capitalize()} role required"
        )
    return claims


def require_admin(request: Request) -> dict:
    return require_role(request, "administrator")
