"""xAI Grok — OpenAI-compatible chat completions (primary)."""

from __future__ import annotations

from typing import Any

import httpx

from ai.config import AIConfig
from ai.types import AiConfigError, AiProviderError, CompletionResult, Message


class XaiProvider:
    id = "xai"

    def __init__(self, cfg: AIConfig) -> None:
        if not cfg.xai_api_key:
            raise AiConfigError(
                "XAI_API_KEY is required for primary (Grok) completions"
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
        url = f"{self._cfg.xai_base_url}/chat/completions"
        payload = {
            "model": model,
            "messages": [m.as_dict() for m in messages],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        headers = {
            "Authorization": f"Bearer {self._cfg.xai_api_key}",
            "Content-Type": "application/json",
        }
        try:
            with httpx.Client(timeout=self._cfg.timeout_seconds) as client:
                resp = client.post(url, json=payload, headers=headers)
        except httpx.HTTPError as exc:
            raise AiProviderError(f"xAI transport error: {exc}") from exc

        if resp.status_code >= 400:
            raise AiProviderError(
                f"xAI HTTP {resp.status_code}: {_safe_body(resp)}"
            )

        try:
            data = resp.json()
        except ValueError as exc:
            raise AiProviderError("xAI returned non-JSON body") from exc

        text = _extract_chat_text(data)
        if not text:
            raise AiProviderError("xAI response missing assistant text")

        usage = _usage_openai_shape(data.get("usage") or {})
        return CompletionResult(
            text=text,
            provider="xai",
            model=model,
            usage=usage,
            raw=data,
        )


def _extract_chat_text(data: dict[str, Any]) -> str:
    choices = data.get("choices") or []
    if not choices:
        return ""
    msg = choices[0].get("message") or {}
    content = msg.get("content")
    if isinstance(content, str):
        return content.strip()
    return ""


def _usage_openai_shape(usage: dict[str, Any]) -> dict[str, int]:
    return {
        "input_tokens": int(usage.get("prompt_tokens") or usage.get("input_tokens") or 0),
        "output_tokens": int(
            usage.get("completion_tokens") or usage.get("output_tokens") or 0
        ),
    }


def _safe_body(resp: httpx.Response) -> str:
    text = (resp.text or "").strip()
    if len(text) > 500:
        return text[:500] + "…"
    return text or "(empty body)"
