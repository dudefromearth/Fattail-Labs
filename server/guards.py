"""Shared route guards — human sessions and agent API keys (Phase A).

Identity Access + Agent Identity Spec v1.0.
"""

from __future__ import annotations

from fastapi import HTTPException, Request

import agent_auth
import auth
from agent_auth import Actor
from config import get_config


def _bearer_token(request: Request) -> str | None:
    header = request.headers.get("authorization") or request.headers.get("Authorization")
    if not header:
        return None
    parts = header.split(None, 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    return parts[1].strip() or None


def resolve_actor(request: Request) -> Actor | None:
    """Agent bearer wins if present; else human session cookie."""
    bearer = _bearer_token(request)
    if bearer and bearer.startswith("ftl_ag_"):
        try:
            return agent_auth.verify_agent_bearer(bearer)
        except agent_auth.AgentAuthError as exc:
            raise HTTPException(status_code=401, detail=str(exc)) from exc

    token = request.cookies.get(get_config().session_cookie)
    if not token:
        return None
    try:
        claims = auth.verify_session(token)
    except auth.AuthError:
        return None

    label = f"identity:{claims['identity_id']}"
    if claims["identity_id"] != 0:
        import db

        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT email, display_name FROM identities WHERE identity_id = %s",
                    (claims["identity_id"],),
                )
                row = cur.fetchone()
                if row and row.get("email"):
                    label = row["email"]
                elif row and row.get("display_name"):
                    label = row["display_name"]

    return Actor(
        kind="human",
        id=int(claims["identity_id"]),
        label=label,
        role=str(claims["role"]),
        scopes=frozenset(),
    )


def claims_or_none(request: Request) -> dict | None:
    """Session claims for humans only, or None — never raises.

    Agent bearer requests return None here (use resolve_actor for dual auth).
    """
    if _bearer_token(request) and (_bearer_token(request) or "").startswith("ftl_ag_"):
        return None
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
    """Human administrator session only (not agent keys)."""
    return require_role(request, "administrator")


def require_human_admin_actor(request: Request) -> Actor:
    claims = require_admin(request)
    actor = resolve_actor(request)
    if actor is None or actor.kind != "human":
        # resolve_actor might prefer bearer; force human path
        label = f"identity:{claims['identity_id']}"
        actor = Actor(
            kind="human",
            id=int(claims["identity_id"]),
            label=label,
            role=str(claims["role"]),
        )
    return actor


def require_actor(
    request: Request,
    *,
    scopes: list[str] | None = None,
    human_admin: bool = False,
) -> Actor:
    """Require a human admin and/or an agent with scopes.

    - human_admin=True, scopes=None → human administrator only
    - scopes=["ai:run"] → human admin OR agent with those scopes
    """
    if human_admin and not scopes:
        return require_human_admin_actor(request)

    actor = resolve_actor(request)
    if actor is None:
        raise HTTPException(status_code=401, detail="Sign in required")

    if actor.kind == "human":
        if actor.role != "administrator":
            raise HTTPException(status_code=403, detail="Administrator role required")
        return actor

    # agent
    need = scopes or []
    if not actor.has_scopes(need):
        raise HTTPException(
            status_code=403,
            detail=f"Agent missing required scopes: {sorted(set(need) - set(actor.scopes))}",
        )
    return actor
