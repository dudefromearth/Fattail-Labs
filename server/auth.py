"""Session JWTs and role ordering.

Identity resolution, passwords, and role derivation live in identity.py; provider
token verification lives in providers.py. This module owns only the Labs session.
Spec: FatTail-Labs-Identity-Access-Spec-v1.0 §4.4.
"""

import time

import jwt

from config import get_config

ROLE_ORDER = ("observer", "alumni", "activator", "navigator", "administrator")


class AuthError(Exception):
    pass


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
