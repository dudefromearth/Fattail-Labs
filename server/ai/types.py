"""Shared types and errors for the agent model interface."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal

ProviderId = Literal["xai", "anthropic"]
Prefer = Literal["primary", "secondary", "auto"]
MessageRole = Literal["system", "user", "assistant"]


class AiError(RuntimeError):
    """Base error for the agent model interface (fail loud)."""


class AiConfigError(AiError):
    """Missing or invalid AI configuration."""


class AiProviderError(AiError):
    """Provider transport or response failure."""


@dataclass(frozen=True)
class Message:
    role: MessageRole
    content: str

    def as_dict(self) -> dict[str, str]:
        return {"role": self.role, "content": self.content}


@dataclass(frozen=True)
class ModelRef:
    provider: ProviderId
    model: str


@dataclass(frozen=True)
class CompletionResult:
    text: str
    provider: ProviderId
    model: str
    usage: dict[str, int] = field(default_factory=dict)
    raw: dict[str, Any] | None = None


def coerce_messages(messages: list[dict[str, str] | Message]) -> list[Message]:
    if not messages:
        raise AiError("messages must be a non-empty list")
    out: list[Message] = []
    for i, m in enumerate(messages):
        if isinstance(m, Message):
            if not m.content or not str(m.content).strip():
                raise AiError(f"messages[{i}].content must be non-empty")
            out.append(m)
            continue
        if not isinstance(m, dict):
            raise AiError(f"messages[{i}] must be a dict or Message")
        role = m.get("role")
        content = m.get("content")
        if role not in ("system", "user", "assistant"):
            raise AiError(
                f"messages[{i}].role must be system|user|assistant, got {role!r}"
            )
        if not isinstance(content, str) or not content.strip():
            raise AiError(f"messages[{i}].content must be a non-empty string")
        out.append(Message(role=role, content=content))
    return out
