"""Tradier brokerage integration (read-only sync into the Trade Log).

Spec: Specs/FatTail-Labs-Tradier-Integration-Spec-v0.1.md

Modules:
  config      — env-driven settings + is_enabled() (fail-closed).
  token_crypto — Fernet encrypt/decrypt for tokens at rest.
  client      — Tradier OAuth + REST client (authorize URL, token exchange, data pull).
  transform   — Tradier history + gainloss  →  canonical Trade Log trades.

Nothing here activates until TRADIER_CLIENT_ID / TRADIER_CLIENT_SECRET /
TRADIER_REDIRECT_URI / LABS_TOKEN_ENC_KEY are configured (see config.is_enabled()).
"""
