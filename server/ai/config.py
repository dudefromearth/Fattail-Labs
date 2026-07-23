"""AI subsystem config — optional at platform boot; fail loud when used."""

from __future__ import annotations

import os

from ai.types import AiConfigError


def _optional(name: str) -> str | None:
    value = os.environ.get(name, "").strip()
    return value or None


def _int_env(name: str, default: int) -> int:
    raw = os.environ.get(name, "").strip()
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError as exc:
        raise AiConfigError(f"{name} must be an integer, got {raw!r}") from exc


class AIConfig:
    """Loaded on first AI use (or via get_ai_config())."""

    def __init__(self) -> None:
        self.xai_api_key = _optional("XAI_API_KEY")
        self.xai_base_url = (
            _optional("LABS_AI_XAI_BASE_URL") or "https://api.x.ai/v1"
        ).rstrip("/")
        self.primary_model = _optional("LABS_AI_PRIMARY_MODEL") or "grok-4.5"

        self.anthropic_api_key = _optional("ANTHROPIC_API_KEY")
        self.anthropic_base_url = (
            _optional("LABS_AI_ANTHROPIC_BASE_URL") or "https://api.anthropic.com"
        ).rstrip("/")
        self.anthropic_version = (
            _optional("LABS_AI_ANTHROPIC_VERSION") or "2023-06-01"
        )
        self.secondary_model = (
            _optional("LABS_AI_SECONDARY_MODEL") or "claude-sonnet-4-5"
        )

        self.timeout_seconds = _int_env("LABS_AI_TIMEOUT_SECONDS", 120)
        if self.timeout_seconds <= 0:
            raise AiConfigError("LABS_AI_TIMEOUT_SECONDS must be positive")

    @property
    def primary_configured(self) -> bool:
        return bool(self.xai_api_key)

    @property
    def secondary_configured(self) -> bool:
        return bool(self.anthropic_api_key)

    def agent_prefer_override(self, callsign: str) -> str | None:
        """LABS_AI_AGENT_<CALLSIGN>_PREFER → primary|secondary if set."""
        key = f"LABS_AI_AGENT_{callsign.strip().upper()}_PREFER"
        raw = _optional(key)
        if raw is None:
            return None
        value = raw.lower()
        if value not in ("primary", "secondary"):
            raise AiConfigError(
                f"{key} must be primary|secondary, got {raw!r}"
            )
        return value


_ai_config: AIConfig | None = None


def get_ai_config(*, reload: bool = False) -> AIConfig:
    global _ai_config
    if reload or _ai_config is None:
        _ai_config = AIConfig()
    return _ai_config


def reset_ai_config() -> None:
    """Test helper — clear cached AI config."""
    global _ai_config
    _ai_config = None
