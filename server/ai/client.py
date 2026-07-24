"""Orchestration: resolve model, call provider, optional auto-fallback."""

from __future__ import annotations

from typing import Callable

from ai.config import AIConfig, get_ai_config
from ai.providers.anthropic import AnthropicProvider
from ai.providers.xai import XaiProvider
from ai.registry import get_model_for, resolve_prefer
from ai.types import (
    AiConfigError,
    AiError,
    AiProviderError,
    CompletionResult,
    Message,
    ModelRef,
    Prefer,
    coerce_messages,
)

ProviderFactory = Callable[[AIConfig], object]


def _default_factories() -> dict[str, ProviderFactory]:
    return {
        "xai": XaiProvider,
        "anthropic": AnthropicProvider,
    }


def complete(
    messages: list[dict[str, str] | Message],
    *,
    agent: str | None = None,
    prefer: Prefer | str | None = None,
    model: str | None = None,
    temperature: float = 0.2,
    max_tokens: int = 4096,
    cfg: AIConfig | None = None,
    providers: dict[str, ProviderFactory] | None = None,
) -> CompletionResult:
    """Run a chat completion through the agent model interface.

    Primary is Grok (xAI). Secondary is Claude (Anthropic).
    """
    if temperature < 0 or temperature > 2:
        raise AiError("temperature must be between 0 and 2")
    if max_tokens < 1:
        raise AiError("max_tokens must be >= 1")

    cfg = cfg or get_ai_config()
    coerced = coerce_messages(messages)
    pref = resolve_prefer(agent=agent, prefer=prefer, cfg=cfg)
    factories = providers or _default_factories()

    if model is not None:
        ref = get_model_for(model=model, cfg=cfg)
        return _call(factories, cfg, ref, coerced, temperature, max_tokens)

    if pref == "auto":
        primary = ModelRef(provider="xai", model=cfg.primary_model)
        try:
            return _call(factories, cfg, primary, coerced, temperature, max_tokens)
        except (AiConfigError, AiProviderError) as primary_exc:
            if not cfg.secondary_configured:
                raise
            secondary = ModelRef(provider="anthropic", model=cfg.secondary_model)
            try:
                return _call(
                    factories, cfg, secondary, coerced, temperature, max_tokens
                )
            except (AiConfigError, AiProviderError) as secondary_exc:
                raise AiProviderError(
                    f"auto fallback failed: primary={primary_exc}; "
                    f"secondary={secondary_exc}"
                ) from secondary_exc

    ref = get_model_for(agent=agent, prefer=pref, cfg=cfg)
    return _call(factories, cfg, ref, coerced, temperature, max_tokens)


def _call(
    factories: dict[str, ProviderFactory],
    cfg: AIConfig,
    ref: ModelRef,
    messages: list[Message],
    temperature: float,
    max_tokens: int,
) -> CompletionResult:
    factory = factories.get(ref.provider)
    if factory is None:
        raise AiError(f"no provider registered for {ref.provider!r}")
    provider = factory(cfg)
    return provider.complete(
        messages,
        model=ref.model,
        temperature=temperature,
        max_tokens=max_tokens,
    )


def complete_stream(
    messages: list[dict[str, str] | Message],
    *,
    agent: str | None = None,
    prefer: Prefer | str | None = None,
    model: str | None = None,
    temperature: float = 0.2,
    max_tokens: int = 4096,
    cfg: AIConfig | None = None,
    providers: dict[str, ProviderFactory] | None = None,
):
    """Stream completion deltas (str) then final CompletionResult.

    v1: primary Grok (xAI) only. Fail loud if secondary-only requested without stream.
    """
    from collections.abc import Iterator

    if temperature < 0 or temperature > 2:
        raise AiError("temperature must be between 0 and 2")
    if max_tokens < 1:
        raise AiError("max_tokens must be >= 1")

    cfg = cfg or get_ai_config()
    coerced = coerce_messages(messages)
    pref = resolve_prefer(agent=agent, prefer=prefer, cfg=cfg)
    factories = providers or _default_factories()

    if model is not None:
        ref = get_model_for(model=model, cfg=cfg)
    elif pref == "secondary":
        ref = get_model_for(agent=agent, prefer="secondary", cfg=cfg)
    else:
        # Stream prefers primary Grok; auto also uses primary first
        ref = ModelRef(provider="xai", model=cfg.primary_model)

    factory = factories.get(ref.provider)
    if factory is None:
        raise AiError(f"no provider registered for {ref.provider!r}")
    provider = factory(cfg)
    stream_fn = getattr(provider, "stream", None)
    if stream_fn is None:
        raise AiError(f"provider {ref.provider!r} does not support streaming")

    def gen() -> Iterator[str | CompletionResult]:
        yield from stream_fn(
            coerced,
            model=ref.model,
            temperature=temperature,
            max_tokens=max_tokens,
        )

    return gen()
