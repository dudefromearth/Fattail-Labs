"""Agent model interface (Agent Model Interface Spec v1.0).

No live API keys required — fake providers are injected.
"""

from __future__ import annotations

import os

import pytest

import ai
from ai.config import get_ai_config, reset_ai_config
from ai.types import AiConfigError, AiError, AiProviderError, CompletionResult, Message


@pytest.fixture(autouse=True)
def _clean_ai_env(monkeypatch):
    """Isolate AI env for each test."""
    for key in list(os.environ):
        if key.startswith("LABS_AI_") or key in (
            "XAI_API_KEY",
            "ANTHROPIC_API_KEY",
        ):
            monkeypatch.delenv(key, raising=False)
    reset_ai_config()
    yield
    reset_ai_config()


def test_status_unconfigured():
    status = ai.describe_ai_status()
    assert status["primary"]["provider"] == "xai"
    assert status["primary"]["model"] == "grok-4.5"
    assert status["primary"]["configured"] is False
    assert status["secondary"]["provider"] == "anthropic"
    assert status["secondary"]["model"] == "claude-sonnet-4-5"
    assert status["secondary"]["configured"] is False
    assert status["default_agent_prefer"] == "primary"


def test_status_configured_flags(monkeypatch):
    monkeypatch.setenv("XAI_API_KEY", "x" * 40)
    monkeypatch.setenv("ANTHROPIC_API_KEY", "a" * 40)
    monkeypatch.setenv("LABS_AI_PRIMARY_MODEL", "grok-4.5")
    monkeypatch.setenv("LABS_AI_SECONDARY_MODEL", "claude-sonnet-4-5")
    reset_ai_config()
    status = ai.describe_ai_status()
    assert status["primary"]["configured"] is True
    assert status["secondary"]["configured"] is True
    # never leak keys
    blob = str(status)
    assert "xxxx" not in blob
    assert "XAI" not in blob or "xai" in blob.lower()


def test_get_model_for_defaults_to_grok():
    ref = ai.get_model_for()
    assert ref.provider == "xai"
    assert ref.model == "grok-4.5"


def test_get_model_for_secondary():
    ref = ai.get_model_for(prefer="secondary")
    assert ref.provider == "anthropic"
    assert ref.model == "claude-sonnet-4-5"


def test_get_model_for_agent_env_override(monkeypatch):
    monkeypatch.setenv("LABS_AI_AGENT_BRAVO_PREFER", "secondary")
    reset_ai_config()
    ref = ai.get_model_for(agent="bravo")
    assert ref.provider == "anthropic"


def test_get_model_for_explicit_model_must_be_registered():
    with pytest.raises(AiError, match="not registered"):
        ai.get_model_for(model="gpt-4o")


def test_complete_empty_messages():
    with pytest.raises(AiError, match="non-empty"):
        ai.complete([])


def test_complete_bad_role():
    with pytest.raises(AiError, match="role"):
        ai.complete([{"role": "tool", "content": "x"}])


def test_complete_primary_missing_key():
    with pytest.raises(AiConfigError, match="XAI_API_KEY"):
        ai.complete([{"role": "user", "content": "hi"}], prefer="primary")


def test_complete_with_fake_primary():
    class FakeXai:
        def __init__(self, cfg):
            self.cfg = cfg

        def complete(self, messages, *, model, temperature, max_tokens):
            assert model == "grok-4.5"
            assert messages[0].role == "user"
            return CompletionResult(
                text="defined risk first",
                provider="xai",
                model=model,
                usage={"input_tokens": 3, "output_tokens": 4},
            )

    result = ai.complete(
        [{"role": "user", "content": "teach risk"}],
        agent="romeo",
        providers={"xai": FakeXai, "anthropic": lambda c: None},
    )
    assert result.text == "defined risk first"
    assert result.provider == "xai"
    assert result.model == "grok-4.5"
    assert result.usage["output_tokens"] == 4


def test_complete_secondary_with_fake():
    class FakeClaude:
        def __init__(self, cfg):
            pass

        def complete(self, messages, *, model, temperature, max_tokens):
            return CompletionResult(
                text="via negativa",
                provider="anthropic",
                model=model,
                usage={"input_tokens": 1, "output_tokens": 2},
            )

    result = ai.complete(
        [Message(role="user", content="philosophy")],
        prefer="secondary",
        providers={"xai": lambda c: None, "anthropic": FakeClaude},
    )
    assert result.provider == "anthropic"
    assert result.text == "via negativa"


def test_auto_falls_back_to_secondary(monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "a" * 40)
    reset_ai_config()

    class BoomXai:
        def __init__(self, cfg):
            pass

        def complete(self, *a, **k):
            raise AiProviderError("primary down")

    class OkClaude:
        def __init__(self, cfg):
            pass

        def complete(self, messages, *, model, temperature, max_tokens):
            return CompletionResult(
                text="fallback ok",
                provider="anthropic",
                model=model,
            )

    result = ai.complete(
        [{"role": "user", "content": "hi"}],
        prefer="auto",
        providers={"xai": BoomXai, "anthropic": OkClaude},
    )
    assert result.text == "fallback ok"
    assert result.provider == "anthropic"


def test_auto_does_not_fallback_on_validation_error():
    """Empty messages fail before provider; no secondary attempt needed."""
    calls = {"xai": 0, "anthropic": 0}

    class TrackXai:
        def __init__(self, cfg):
            pass

        def complete(self, *a, **k):
            calls["xai"] += 1
            raise AssertionError("should not run")

    class TrackClaude:
        def __init__(self, cfg):
            pass

        def complete(self, *a, **k):
            calls["anthropic"] += 1
            raise AssertionError("should not run")

    with pytest.raises(AiError, match="non-empty"):
        ai.complete(
            [],
            prefer="auto",
            providers={"xai": TrackXai, "anthropic": TrackClaude},
        )
    assert calls["xai"] == 0
    assert calls["anthropic"] == 0


def test_timeout_env_must_be_int(monkeypatch):
    monkeypatch.setenv("LABS_AI_TIMEOUT_SECONDS", "nope")
    reset_ai_config()
    with pytest.raises(AiConfigError, match="integer"):
        get_ai_config()
