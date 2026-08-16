"""Encrypt / decrypt broker tokens at rest (Fernet / AES-128-CBC + HMAC).

Fail-closed: if `cryptography` isn't installed or LABS_TOKEN_ENC_KEY is unset, this
module reports unavailable and refuses to encrypt (callers gate on is_available()).
Tokens are NEVER written in plaintext — a missing key disables the whole Tradier
feature via config.is_enabled(), so encrypt() should never be reached unconfigured.

Generate a key once (never in git — goes in the API launchd env):
    python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
"""

from __future__ import annotations

from integrations.tradier.config import get_tradier_config


class TokenCryptoUnavailable(RuntimeError):
    pass


def _fernet():
    try:
        from cryptography.fernet import Fernet
    except ModuleNotFoundError as exc:  # pragma: no cover - env-dependent
        raise TokenCryptoUnavailable(
            "cryptography is not installed (pip install cryptography)"
        ) from exc
    key = get_tradier_config().token_enc_key
    if not key:
        raise TokenCryptoUnavailable("LABS_TOKEN_ENC_KEY is not configured")
    try:
        return Fernet(key.encode() if isinstance(key, str) else key)
    except (ValueError, TypeError) as exc:
        raise TokenCryptoUnavailable(
            "LABS_TOKEN_ENC_KEY is not a valid Fernet key "
            "(urlsafe base64, 32 bytes) — regenerate with Fernet.generate_key()"
        ) from exc


def is_available() -> bool:
    """True when a token can actually be encrypted/decrypted right now."""
    try:
        _fernet()
        return True
    except TokenCryptoUnavailable:
        return False


def encrypt(plaintext: str | None) -> str | None:
    if plaintext is None:
        return None
    token = _fernet().encrypt(plaintext.encode("utf-8"))
    return token.decode("ascii")


def decrypt(ciphertext: str | None) -> str | None:
    if ciphertext is None:
        return None
    raw = _fernet().decrypt(ciphertext.encode("ascii"))
    return raw.decode("utf-8")
