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


def _live_authorization_role(claims: dict) -> str:
    """Role for authorization — live DB for admin; feature_role for member tiers.

    H1: JWT ``role`` alone must not grant administrator after demotion.
    identity_id 0 is dev-internal only.
    """
    import identity as identity_mod

    iid = int(claims.get("identity_id") or 0)
    session_role = str(claims.get("role") or "observer")
    cfg = get_config()

    if iid == 0:
        if cfg.env != "dev":
            raise HTTPException(
                status_code=401,
                detail="Invalid session identity",
            )
        # Dev internal admin session only when JWT says so
        return session_role if session_role in auth.ROLE_ORDER else "observer"

    import db

    with db.transaction() as conn:
        with conn.cursor() as cur:
            # Administrator: derive_role only (role_override / plans) — never
            # trust session snapshot for privilege.
            try:
                derived = identity_mod.derive_role(cur, iid)
            except identity_mod.IdentityError as exc:
                raise HTTPException(
                    status_code=401, detail="Identity not found — re-login"
                ) from exc
            return derived


def _live_feature_role(claims: dict) -> str:
    """Member feature gates: live membership elevation (Observer trial, etc.)."""
    import identity as identity_mod
    import db

    iid = int(claims.get("identity_id") or 0)
    session_role = str(claims.get("role") or "observer")
    if iid == 0:
        return _live_authorization_role(claims)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return identity_mod.feature_role(cur, iid, session_role)


def require_role(request: Request, minimum: str) -> dict:
    claims = require_session(request)
    if minimum == "administrator":
        live = _live_authorization_role(claims)
    else:
        # Member ladder: allow observer-trial elevation via feature_role
        live = _live_feature_role(claims)
    if not auth.role_at_least(live, minimum):
        raise HTTPException(
            status_code=403, detail=f"{minimum.capitalize()} role required"
        )
    # Callers see live role (not stale JWT snapshot)
    out = dict(claims)
    out["role"] = live
    out["access_role"] = live
    return out


def require_admin(request: Request) -> dict:
    """Human administrator session only (not agent keys). Uses live derive_role (H1)."""
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
        # Live admin check (H1) — do not trust Actor.role snapshot alone
        claims = require_admin(request)
        return Actor(
            kind="human",
            id=int(claims["identity_id"]),
            label=actor.label,
            role=str(claims["role"]),
            scopes=frozenset(),
        )

    # agent
    need = scopes or []
    if not actor.has_scopes(need):
        raise HTTPException(
            status_code=403,
            detail=f"Agent missing required scopes: {sorted(set(need) - set(actor.scopes))}",
        )
    return actor
