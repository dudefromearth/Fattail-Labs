"""Dual-issuer WordPress SSO verification + session JWT.

Same architecture as the FatTail App (flyonthewall.io): HS256 with issuer-specific
secrets, (issuer, wp_user_id) compound identity, cumulative roles derived per-request
from the session JWT. Reimplemented here on purpose — this repo shares no code with
MarketSwarm-Canonical.
"""

import time

import jwt

from config import get_config

ROLE_ORDER = ("observer", "activator", "navigator", "administrator")
VALID_ISSUERS = frozenset({"fattail", "0-dte"})


class AuthError(Exception):
    pass


def verify_sso_jwt(token: str) -> dict:
    """Verify an incoming WordPress SSO JWT. Returns its claims.

    The issuer claim selects the secret; unknown issuers are rejected before
    any cryptographic check.
    """
    try:
        unverified = jwt.decode(token, options={"verify_signature": False})
    except jwt.InvalidTokenError as exc:
        raise AuthError(f"Malformed SSO token: {exc}") from exc

    issuer = unverified.get("iss")
    if issuer not in VALID_ISSUERS:
        raise AuthError(f"Unknown issuer: {issuer!r}")

    secret = get_config().sso_secrets[issuer]
    try:
        claims = jwt.decode(token, secret, algorithms=["HS256"], issuer=issuer)
    except jwt.InvalidTokenError as exc:
        raise AuthError(f"SSO token verification failed: {exc}") from exc

    for field in ("wp_user_id", "email"):
        if not claims.get(field):
            raise AuthError(f"SSO token missing claim: {field}")
    return claims


def normalize_wp_roles(raw) -> list[str]:
    """WordPress may send roles as list OR comma-separated string. Normalize to list.

    (Iterating a bare string yields single characters and never matches a role —
    the same bug class the FatTail App guards against.)
    """
    if raw is None:
        return []
    if isinstance(raw, str):
        return [r.strip() for r in raw.split(",") if r.strip()]
    if isinstance(raw, (list, tuple)):
        return [str(r).strip() for r in raw if str(r).strip()]
    raise AuthError(f"Unrecognized roles payload: {type(raw).__name__}")


def derive_role(issuer: str, wp_roles: list[str], plan_slugs: list[str]) -> str:
    """Map WP admin status + WooCommerce plan slugs to the highest Labs role.

    Admin bypass on either issuer. Otherwise the entitlement map (config) decides;
    no membership -> observer.
    """
    if "administrator" in wp_roles:
        return "administrator"
    entitlements = get_config().entitlement_map
    granted = [entitlements[(issuer, slug)] for slug in plan_slugs if (issuer, slug) in entitlements]
    if not granted:
        return "observer"
    return max(granted, key=ROLE_ORDER.index)


def issue_session(identity_id: int, issuer: str, role: str) -> str:
    cfg = get_config()
    now = int(time.time())
    return jwt.encode(
        {
            "identity_id": identity_id,
            "iss": "labs.fattail.ai",
            "sso_issuer": issuer,
            "role": role,
            "iat": now,
            "exp": now + cfg.session_ttl_seconds,
        },
        cfg.session_secret,
        algorithm="HS256",
    )


def verify_session(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            get_config().session_secret,
            algorithms=["HS256"],
            issuer="labs.fattail.ai",
        )
    except jwt.InvalidTokenError as exc:
        raise AuthError(f"Session invalid: {exc}") from exc


def role_at_least(role: str, minimum: str) -> bool:
    try:
        return ROLE_ORDER.index(role) >= ROLE_ORDER.index(minimum)
    except ValueError as exc:
        raise AuthError(f"Unknown role in comparison: {role!r} vs {minimum!r}") from exc
