"""Agent model interface — Grok primary, Claude secondary.

Usage:
    from ai import complete, get_model_for, describe_ai_status

    result = complete(
        [{"role": "user", "content": "Outline a lesson on defined risk."}],
        agent="bravo",
    )
    print(result.text, result.provider, result.model)

See Specs/FatTail-Labs-Agent-Model-Interface-Spec-v1.0.md
"""

from ai.agents import (
    AGENT_TASKS,
    STUDIO_AGENTS,
    list_seated_agents,
    list_tasks,
    load_charter,
    run_agent_task,
)
from ai.client import complete
from ai.config import get_ai_config, reset_ai_config
from ai.registry import describe_registry, get_model_for
from ai.types import (
    AiConfigError,
    AiError,
    AiProviderError,
    CompletionResult,
    Message,
    ModelRef,
)


def describe_ai_status() -> dict:
    """Whether providers are configured (booleans only — never keys)."""
    return describe_registry()


__all__ = [
    "AGENT_TASKS",
    "AiConfigError",
    "AiError",
    "AiProviderError",
    "CompletionResult",
    "Message",
    "ModelRef",
    "STUDIO_AGENTS",
    "complete",
    "describe_ai_status",
    "get_ai_config",
    "get_model_for",
    "list_seated_agents",
    "list_tasks",
    "load_charter",
    "reset_ai_config",
    "run_agent_task",
]
