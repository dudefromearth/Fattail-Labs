"""Anthropic Claude — Messages API (secondary)."""

from __future__ import annotations

from typing import Any

import httpx

from ai.config import AIConfig
from ai.types import AiConfigError, AiProviderError, CompletionResult, Message


class AnthropicProvider:
    id = "anthropic"

    def __init__(self, cfg: AIConfig) -> None:
        if not cfg.anthropic_api_key:
            raise AiConfigError(
                "ANTHROPIC_API_KEY is required for secondary (Claude) completions"
            )
        self._cfg = cfg

    def complete(
        self,
        messages: list[Message],
        *,
        model: str,
        temperature: float,
        max_tokens: int,
    ) -> CompletionResult:
        system_parts = [m.content for m in messages if m.role == "system"]
        chat = [m for m in messages if m.role != "system"]
        if not chat:
            raise AiProviderError(
                "Anthropic requires at least one non-system message"
            )

        url = f"{self._cfg.anthropic_base_url}/v1/messages"
        payload: dict[str, Any] = {
            "model": model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": [
                {"role": m.role, "content": m.content} for m in chat
            ],
        }
        if system_parts:
            payload["system"] = "\n\n".join(system_parts)

        headers = {
            "x-api-key": self._cfg.anthropic_api_key,
            "anthropic-version": self._cfg.anthropic_version,
            "Content-Type": "application/json",
        }
        try:
            with httpx.Client(timeout=self._cfg.timeout_seconds) as client:
                resp = client.post(url, json=payload, headers=headers)
        except httpx.HTTPError as exc:
            raise AiProviderError(f"Anthropic transport error: {exc}") from exc

        if resp.status_code >= 400:
            raise AiProviderError(
                f"Anthropic HTTP {resp.status_code}: {_safe_body(resp)}"
            )

        try:
            data = resp.json()
        except ValueError as exc:
            raise AiProviderError("Anthropic returned non-JSON body") from exc

        text = _extract_text(data)
        if not text:
            raise AiProviderError("Anthropic response missing assistant text")

        usage_raw = data.get("usage") or {}
        usage = {
            "input_tokens": int(usage_raw.get("input_tokens") or 0),
            "output_tokens": int(usage_raw.get("output_tokens") or 0),
        }
        return CompletionResult(
            text=text,
            provider="anthropic",
            model=model,
            usage=usage,
            raw=data,
        )


def _extract_text(data: dict[str, Any]) -> str:
    blocks = data.get("content") or []
    parts: list[str] = []
    for block in blocks:
        if isinstance(block, dict) and block.get("type") == "text":
            t = block.get("text")
            if isinstance(t, str) and t.strip():
                parts.append(t)
    return "\n".join(parts).strip()


def _safe_body(resp: httpx.Response) -> str:
    text = (resp.text or "").strip()
    if len(text) > 500:
        return text[:500] + "…"
    return text or "(empty body)"
