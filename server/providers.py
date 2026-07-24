"""Pluggable identity providers. The core model (identity.py) never sees provider
vocabulary; providers translate external tokens/webhooks into ProviderIdentity and
entitlement keys, which map to Labs plans via provider_plan_map.

Spec: FatTail-Labs-Identity-Access-Spec-v1.0 §4.2.

SSO source of truth (WP mint + claim shapes): MarketSwarm-Canonical
  - WP plugin: fotw-sso on fattail.ai / 0-dte.com (`/fotw-sso`)
  - Verify port: MarketSwarm-Canonical/src/auth/sso.py
  - App callback pattern: GET /api/auth/sso?sso=<jwt>&next=...
  - Login entry: MarketSwarm-Canonical/UI/src/components/LoginPage.tsx
  - WP ops ref: MarketSwarm-Canonical/org/reference/softwares/flyonthewall_wordpress.md §SSO
"""

from __future__ import annotations

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


def _normalize_list(raw) -> list[str]:
    """Roles / plans may be list or comma-separated string (MSC + WP variance)."""
    if raw is None:
        return []
    if isinstance(raw, str):
        return [r.strip() for r in raw.split(",") if r.strip()]
    return [str(r).strip() for r in raw if str(r).strip()]


# JWT iss values accepted per Labs provider key.
# MSC / fotw-sso use iss="fotw" for the FatTail (ex-FOTW) site; Labs path is
# wordpress:fattail. Accept both "fotw" and "fattail".
_PROVIDER_ISSUERS: dict[str, frozenset[str]] = {
    "wordpress:fattail": frozenset({"fattail", "fotw"}),
    "wordpress:0-dte": frozenset({"0-dte"}),
}


class WordPressProvider:
    """One instance per WP site. Verifies the site's HS256 SSO JWT.

    Claim shape is compatible with MarketSwarm-Canonical / fotw-sso:
      iss, sub|id|wp_id|wp_user_id, email, name|display_name,
      roles, membership_plans|plans, subscription_tier
    """

    def __init__(self, name: str, secret: str, *, allowed_issuers: frozenset[str]):
        self.name = name  # e.g. "wordpress:fattail"
        self.secret = secret
        self.allowed_issuers = allowed_issuers

    def verify(self, token: str) -> ProviderIdentity:
        if not token or not str(token).strip():
            raise ProviderError(f"{self.name}: no token provided")
        token = str(token).strip()

        # Issuer-first selection matches MSC src/auth/sso.py
        try:
            unverified = jwt.decode(token, options={"verify_signature": False})
        except Exception as exc:
            raise ProviderError(f"{self.name}: JWT parse failed: {exc}") from exc

        iss = (unverified.get("iss") or "").strip()
        if iss not in self.allowed_issuers:
            raise ProviderError(
                f"{self.name}: issuer {iss!r} not allowed "
                f"(expected one of {sorted(self.allowed_issuers)})"
            )

        try:
            claims = jwt.decode(
                token,
                self.secret,
                algorithms=["HS256"],
                leeway=10,
            )
        except jwt.InvalidTokenError as exc:
            raise ProviderError(
                f"{self.name}: token verification failed: {exc}"
            ) from exc

        # WP user id — MSC uses sub|id; fotw-sso docs also mention wp_id;
        # Labs historical tests use wp_user_id.
        wp_user_id = (
            claims.get("wp_user_id")
            or claims.get("sub")
            or claims.get("id")
            or claims.get("wp_id")
        )
        email = (claims.get("email") or "").strip()
        if not wp_user_id or not email:
            raise ProviderError(
                f"{self.name}: token missing user id/email "
                f"(need sub|id|wp_id|wp_user_id + email)"
            )

        roles = _normalize_list(claims.get("roles"))
        # Entitlements: MSC/WP membership plan slugs
        plans = _normalize_list(claims.get("membership_plans"))
        if not plans:
            plans = _normalize_list(claims.get("plans"))
        # Some tokens carry a single subscription_tier slug
        tier = (claims.get("subscription_tier") or "").strip()
        if tier and tier not in plans:
            plans.append(tier)

        display = (
            (claims.get("display_name") or claims.get("name") or "").strip()
        )
        is_admin = "administrator" in [r.lower() for r in roles] or "admin" in [
            r.lower() for r in roles
        ]

        return ProviderIdentity(
            provider=self.name,
            external_id=str(wp_user_id),
            email=email,
            display_name=display,
            is_admin=is_admin,
            entitlement_keys=plans,
        )


def registry() -> dict[str, WordPressProvider]:
    cfg = get_config()
    return {
        "wordpress:fattail": WordPressProvider(
            "wordpress:fattail",
            cfg.sso_secrets["fattail"],
            allowed_issuers=_PROVIDER_ISSUERS["wordpress:fattail"],
        ),
        "wordpress:0-dte": WordPressProvider(
            "wordpress:0-dte",
            cfg.sso_secrets["0-dte"],
            allowed_issuers=_PROVIDER_ISSUERS["wordpress:0-dte"],
        ),
    }


def login_urls() -> dict[str, str]:
    """Configured SSO login pages for the login screen. Unset -> button not shown.

    Recommended (matches MSC LoginPage):
      LABS_SSO_LOGIN_URL_FATTAIL=
        https://fattail.ai/fotw-sso?redirect=<encoded Labs callback>
      LABS_SSO_LOGIN_URL_0DTE=
        https://0-dte.com/fotw-sso?redirect=<encoded Labs callback>
    """
    urls = {
        "wordpress:fattail": os.environ.get("LABS_SSO_LOGIN_URL_FATTAIL", "").strip(),
        "wordpress:0-dte": os.environ.get("LABS_SSO_LOGIN_URL_0DTE", "").strip(),
    }
    return {k: v for k, v in urls.items() if v}
