"""Pluggable identity providers. The core model (identity.py) never sees provider
vocabulary; providers translate external tokens/webhooks into ProviderIdentity and
entitlement keys, which map to Labs plans via provider_plan_map.

Spec: FatTail-Labs-Identity-Access-Spec-v1.0 §4.2.
"""

import os
from dataclasses import dataclass, field

import jwt

from config import get_config


class ProviderError(Exception):
    pass


@dataclass(frozen=True)
class ProviderIdentity:
    provider: str
    external_id: str
    email: str
    display_name: str = ""
    is_admin: bool = False
    entitlement_keys: list[str] = field(default_factory=list)


def _normalize_roles(raw) -> list[str]:
    if raw is None:
        return []
    if isinstance(raw, str):
        return [r.strip() for r in raw.split(",") if r.strip()]
    return [str(r).strip() for r in raw if str(r).strip()]


class WordPressProvider:
    """One instance per WP site. Verifies the site's HS256 SSO JWT and reads
    entitlement keys (WooCommerce plan/membership slugs) from its claims."""

    def __init__(self, name: str, secret: str):
        self.name = name          # e.g. "wordpress:fattail"
        self.issuer = name.split(":", 1)[1]
        self.secret = secret

    def verify(self, token: str) -> ProviderIdentity:
        try:
            claims = jwt.decode(
                token, self.secret, algorithms=["HS256"], issuer=self.issuer
            )
        except jwt.InvalidTokenError as exc:
            raise ProviderError(f"{self.name}: token verification failed: {exc}") from exc
        wp_user_id = claims.get("wp_user_id")
        email = claims.get("email")
        if not wp_user_id or not email:
            raise ProviderError(f"{self.name}: token missing wp_user_id/email")
        roles = _normalize_roles(claims.get("roles"))
        plans = _normalize_roles(claims.get("plans"))  # same normalization: list or csv
        return ProviderIdentity(
            provider=self.name,
            external_id=str(wp_user_id),
            email=email,
            display_name=claims.get("display_name", ""),
            is_admin="administrator" in roles,
            entitlement_keys=plans,
        )


def registry() -> dict[str, WordPressProvider]:
    cfg = get_config()
    return {
        "wordpress:fattail": WordPressProvider("wordpress:fattail", cfg.sso_secrets["fattail"]),
        "wordpress:0-dte": WordPressProvider("wordpress:0-dte", cfg.sso_secrets["0-dte"]),
    }


def login_urls() -> dict[str, str]:
    """Configured SSO login pages for the login screen. Unset -> button not shown."""
    urls = {
        "wordpress:fattail": os.environ.get("LABS_SSO_LOGIN_URL_FATTAIL", "").strip(),
        "wordpress:0-dte": os.environ.get("LABS_SSO_LOGIN_URL_0DTE", "").strip(),
    }
    return {k: v for k, v in urls.items() if v}
