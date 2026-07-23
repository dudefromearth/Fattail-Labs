"""Model registry — Grok primary, Claude secondary, optional agent prefers."""

from __future__ import annotations

from ai.config import AIConfig, get_ai_config
from ai.types import AiError, ModelRef, Prefer

# Studio + guardians that may call the model interface (v1 defaults → primary).
DEFAULT_PRIMARY_AGENTS = frozenset(
    {
        "quebec",
        "bravo",
        "november",
        "romeo",
        "papa",
        "hotel",
        "victor",
        "whiskey",
        "yankee",
        "tango",
        "sierra",
        "juliet",
        "delta",
        "lima",
        "india",
        "coach",
    }
)


def resolve_prefer(
    *,
    agent: str | None = None,
    prefer: Prefer | str | None = None,
    cfg: AIConfig | None = None,
) -> Prefer:
    cfg = cfg or get_ai_config()
    if prefer is not None:
        p = str(prefer).lower().strip()
        if p not in ("primary", "secondary", "auto"):
            raise AiError(
                f"prefer must be primary|secondary|auto, got {prefer!r}"
            )
        return p  # type: ignore[return-value]

    if agent:
        override = cfg.agent_prefer_override(agent)
        if override in ("primary", "secondary"):
            return override  # type: ignore[return-value]

    return "primary"


def get_model_for(
    *,
    agent: str | None = None,
    prefer: Prefer | str | None = None,
    model: str | None = None,
    cfg: AIConfig | None = None,
) -> ModelRef:
    """Resolve provider + model id without calling the network."""
    cfg = cfg or get_ai_config()
    pref = resolve_prefer(agent=agent, prefer=prefer, cfg=cfg)

    if model is not None:
        mid = model.strip()
        if not mid:
            raise AiError("model must be non-empty when provided")
        if mid == cfg.primary_model:
            return ModelRef(provider="xai", model=mid)
        if mid == cfg.secondary_model:
            return ModelRef(provider="anthropic", model=mid)
        raise AiError(
            f"model {mid!r} is not registered; allowed: "
            f"primary={cfg.primary_model!r}, secondary={cfg.secondary_model!r}"
        )

    if pref == "secondary":
        return ModelRef(provider="anthropic", model=cfg.secondary_model)
    # primary and auto both *start* on primary
    return ModelRef(provider="xai", model=cfg.primary_model)


def describe_registry(cfg: AIConfig | None = None) -> dict:
    cfg = cfg or get_ai_config()
    return {
        "primary": {
            "provider": "xai",
            "model": cfg.primary_model,
            "configured": cfg.primary_configured,
        },
        "secondary": {
            "provider": "anthropic",
            "model": cfg.secondary_model,
            "configured": cfg.secondary_configured,
        },
        "default_agent_prefer": "primary",
        "known_agents": sorted(DEFAULT_PRIMARY_AGENTS),
    }
