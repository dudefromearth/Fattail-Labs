"""Labs administrator allowlist (auth hardening H3).

WordPress SSO may claim is_admin; only emails in LABS_ADMIN_EMAILS may receive
role_override=administrator from that path. Existing overrides are not stripped
here — use create_user.py / admin tools for manual grants.
"""

from __future__ import annotations

from config import get_config


def is_allowlisted_admin_email(email: str | None) -> bool:
    """True if email is on LABS_ADMIN_EMAILS (case-insensitive)."""
    if not email or not str(email).strip():
        return False
    return str(email).strip().lower() in get_config().admin_emails


def may_sso_grant_administrator(*, email: str | None, wp_claims_admin: bool) -> bool:
    """WP is_admin alone is insufficient — must also be allowlisted."""
    if not wp_claims_admin:
        return False
    return is_allowlisted_admin_email(email)
