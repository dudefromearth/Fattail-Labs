"""Tradier integration config — optional at boot; fail-closed when unconfigured.

Same shape as ai/config.py: read env lazily, expose is_enabled() so the router and
UI stay hidden until the partner app credentials + token encryption key are present.
No value here is required for the platform to boot — absence just disables the feature.
"""

from __future__ import annotations

import os

DEFAULT_API_BASE = "https://api.tradier.com"
# Tradier documents OAuth only on the production host (no separate OAuth sandbox).
DEFAULT_AUTHORIZE_PATH = "/v1/oauth/authorize"
DEFAULT_TOKEN_PATH = "/v1/oauth/accesstoken"


def _opt(name: str) -> str | None:
    value = os.environ.get(name, "").strip()
    return value or None


class TradierConfig:
    """Loaded on first use (or via get_tradier_config())."""

    def __init__(self) -> None:
        self.client_id = _opt("TRADIER_CLIENT_ID")
        self.client_secret = _opt("TRADIER_CLIENT_SECRET")
        self.redirect_uri = _opt("TRADIER_REDIRECT_URI")
        self.api_base = (_opt("TRADIER_API_BASE") or DEFAULT_API_BASE).rstrip("/")
        # Token encryption key (Fernet, urlsafe base64, 32 bytes). Shared platform key;
        # required before any token is persisted. See token_crypto.
        self.token_enc_key = _opt("LABS_TOKEN_ENC_KEY")
        self.timeout_seconds = 30

    @property
    def oauth_configured(self) -> bool:
        """True when the partner app creds + redirect URI are all present."""
        return bool(self.client_id and self.client_secret and self.redirect_uri)

    @property
    def is_enabled(self) -> bool:
        """Fail-closed master switch: OAuth creds AND a token encryption key.

        The router, status endpoint, and UI button all gate on this. When False the
        feature is completely inert (no endpoints act, no button shows).
        """
        return self.oauth_configured and bool(self.token_enc_key)

    def missing(self) -> list[str]:
        """Which env vars are still needed to enable the feature (for diagnostics)."""
        out = []
        if not self.client_id:
            out.append("TRADIER_CLIENT_ID")
        if not self.client_secret:
            out.append("TRADIER_CLIENT_SECRET")
        if not self.redirect_uri:
            out.append("TRADIER_REDIRECT_URI")
        if not self.token_enc_key:
            out.append("LABS_TOKEN_ENC_KEY")
        return out


_config: TradierConfig | None = None


def get_tradier_config() -> TradierConfig:
    global _config
    if _config is None:
        _config = TradierConfig()
    return _config


def reset_tradier_config_for_tests() -> None:
    global _config
    _config = None
