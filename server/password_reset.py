"""Native password reset (forgot-password).

Spec: FatTail-Labs-Password-Reset-Spec-v1.0.md

Security:
- Tokens stored as SHA-256 hex only
- Generic API responses (no account enumeration)
- Single-use, short TTL
- Prior unused tokens for an identity are invalidated on new request
"""

from __future__ import annotations

import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import db
import identity
import notify
from config import get_config

DEFAULT_TTL_SECONDS = 3600  # 1 hour
GENERIC_OK = (
    "If an account with that email has a password on Labs, "
    "we sent reset instructions. Check your inbox (and spam)."
)


class PasswordResetError(Exception):
    pass


def _ttl_seconds() -> int:
    raw = os.environ.get("LABS_PASSWORD_RESET_TTL_SECONDS", "").strip()
    if not raw:
        return DEFAULT_TTL_SECONDS
    try:
        v = int(raw)
    except ValueError as exc:
        raise PasswordResetError(
            f"LABS_PASSWORD_RESET_TTL_SECONDS must be an integer, got {raw!r}"
        ) from exc
    if v < 300 or v > 86400:
        raise PasswordResetError(
            "LABS_PASSWORD_RESET_TTL_SECONDS must be between 300 and 86400"
        )
    return v


def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _site_origin() -> str:
    # Prefer live env (tests / late config) over boot-time Config cache.
    origin = (
        os.environ.get("LABS_WEB_ORIGIN", "").strip()
        or os.environ.get("NEXT_PUBLIC_SITE_URL", "").strip()
        or (get_config().web_origin or "")
    ).rstrip("/")
    if not origin:
        raise PasswordResetError(
            "LABS_WEB_ORIGIN (or NEXT_PUBLIC_SITE_URL) is required for password reset links"
        )
    return origin


def _smtp_ready() -> bool:
    return notify._smtp_config() is not None


def request_reset(email: str, *, request_ip: str | None = None) -> dict[str, Any]:
    """Start reset for email if a native credential exists.

    Always returns the same public message when SMTP is configured.
    If SMTP is not configured, fails loud with 503-shaped error (no enumeration).
    """
    email = (email or "").strip().lower()
    if not email or "@" not in email:
        raise PasswordResetError("Valid email required")

    if not _smtp_ready():
        raise PasswordResetError(
            "Password reset email is not configured (set LABS_SMTP_HOST and related env)"
        )

    # Resolve candidate with native password only
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT i.identity_id, i.email, i.display_name
                   FROM identities i
                   INNER JOIN credentials c ON c.identity_id = i.identity_id
                   WHERE i.email = %s""",
                (email,),
            )
            row = cur.fetchone()

    if row is None:
        # Enumeration-safe: pretend success
        return {"ok": True, "detail": GENERIC_OK, "sent": False}

    raw = secrets.token_urlsafe(32)
    token_hash = _hash_token(raw)
    ttl = _ttl_seconds()
    expires = datetime.now(timezone.utc) + timedelta(seconds=ttl)

    with db.transaction() as conn:
        with conn.cursor() as cur:
            # Invalidate outstanding tokens for this identity
            cur.execute(
                """UPDATE password_reset_tokens
                   SET used_at = UTC_TIMESTAMP()
                   WHERE identity_id = %s AND used_at IS NULL""",
                (row["identity_id"],),
            )
            cur.execute(
                """INSERT INTO password_reset_tokens
                   (identity_id, token_hash, expires_at, request_ip)
                   VALUES (%s, %s, %s, %s)""",
                (
                    row["identity_id"],
                    token_hash,
                    expires.replace(tzinfo=None),  # MySQL DATETIME UTC naive
                    (request_ip or "")[:64] or None,
                ),
            )

    origin = _site_origin()
    link = f"{origin}/reset-password?token={raw}"
    name = (row.get("display_name") or "").strip() or "there"
    subject = "Reset your FatTail Labs password"
    body = (
        f"Hi {name},\n\n"
        f"We received a request to reset the password for {row['email']} "
        f"on FatTail Labs.\n\n"
        f"Open this link to choose a new password (expires in {ttl // 60} minutes):\n\n"
        f"{link}\n\n"
        f"If you did not request this, you can ignore this email. "
        f"Your password will not change.\n\n"
        f"— FatTail Labs\n"
    )
    try:
        notify._send_email(row["email"], subject, body)
    except notify.NotifyError as exc:
        raise PasswordResetError(f"Failed to send reset email: {exc}") from exc

    return {"ok": True, "detail": GENERIC_OK, "sent": True}


def reset_with_token(raw_token: str, new_password: str) -> dict[str, Any]:
    """Consume a valid token and set a new password. Issues no session (user signs in)."""
    raw_token = (raw_token or "").strip()
    if not raw_token or len(raw_token) < 20:
        raise PasswordResetError("Invalid or expired reset link")

    try:
        password_hash = identity.hash_password(new_password)
    except identity.IdentityError as exc:
        raise PasswordResetError(str(exc)) from exc

    token_hash = _hash_token(raw_token)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, identity_id, expires_at, used_at
                   FROM password_reset_tokens
                   WHERE token_hash = %s
                   FOR UPDATE""",
                (token_hash,),
            )
            row = cur.fetchone()
            if row is None:
                raise PasswordResetError("Invalid or expired reset link")
            if row.get("used_at") is not None:
                raise PasswordResetError("This reset link was already used")
            expires = row["expires_at"]
            # MySQL may return naive datetime — treat as UTC
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            if expires is None or expires < now:
                raise PasswordResetError("Invalid or expired reset link")

            identity_id = int(row["identity_id"])
            # Ensure credentials row exists (should for token creation path)
            cur.execute(
                "SELECT identity_id FROM credentials WHERE identity_id = %s",
                (identity_id,),
            )
            if cur.fetchone() is None:
                cur.execute(
                    "INSERT INTO credentials (identity_id, password_hash) VALUES (%s, %s)",
                    (identity_id, password_hash),
                )
            else:
                cur.execute(
                    "UPDATE credentials SET password_hash = %s WHERE identity_id = %s",
                    (password_hash, identity_id),
                )
            cur.execute(
                """UPDATE password_reset_tokens
                   SET used_at = UTC_TIMESTAMP()
                   WHERE id = %s""",
                (row["id"],),
            )
            # Burn any other outstanding tokens
            cur.execute(
                """UPDATE password_reset_tokens
                   SET used_at = UTC_TIMESTAMP()
                   WHERE identity_id = %s AND used_at IS NULL AND id != %s""",
                (identity_id, row["id"]),
            )

    return {
        "ok": True,
        "detail": "Password updated. You can sign in with your new password.",
    }
