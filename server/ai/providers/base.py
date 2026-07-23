"""Provider protocol."""

from __future__ import annotations

from typing import Protocol

from ai.types import CompletionResult, Message


class Provider(Protocol):
    id: str

    def complete(
        self,
        messages: list[Message],
        *,
        model: str,
        temperature: float,
        max_tokens: int,
    ) -> CompletionResult: ...
