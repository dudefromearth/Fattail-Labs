"""xAI Grok — OpenAI-compatible chat completions (primary)."""

from __future__ import annotations

import json
from collections.abc import Iterator
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

    def stream(
        self,
        messages: list[Message],
        *,
        model: str,
        temperature: float,
        max_tokens: int,
    ) -> Iterator[str | CompletionResult]:
        """Yield text delta strings, then a final CompletionResult.

        OpenAI-compatible SSE from xAI chat/completions with stream=true.
        """
        url = f"{self._cfg.xai_base_url}/chat/completions"
        payload = {
            "model": model,
            "messages": [m.as_dict() for m in messages],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }
        headers = {
            "Authorization": f"Bearer {self._cfg.xai_api_key}",
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
        }
        # Streaming can run long; separate connect vs read timeouts
        timeout = httpx.Timeout(
            self._cfg.timeout_seconds,
            connect=min(30.0, float(self._cfg.timeout_seconds)),
        )
        parts: list[str] = []
        usage: dict[str, int] = {}
        try:
            with httpx.Client(timeout=timeout) as client:
                with client.stream(
                    "POST", url, json=payload, headers=headers
                ) as resp:
                    if resp.status_code >= 400:
                        body = resp.read().decode("utf-8", errors="replace")
                        raise AiProviderError(
                            f"xAI HTTP {resp.status_code}: "
                            f"{(body or '')[:500] or '(empty body)'}"
                        )
                    for line in resp.iter_lines():
                        if not line:
                            continue
                        if line.startswith(":"):
                            continue
                        if not line.startswith("data:"):
                            continue
                        data_str = line[5:].strip()
                        if not data_str or data_str == "[DONE]":
                            continue
                        try:
                            chunk = json.loads(data_str)
                        except json.JSONDecodeError:
                            continue
                        if chunk.get("usage"):
                            usage = _usage_openai_shape(chunk["usage"])
                        choices = chunk.get("choices") or []
                        if not choices:
                            continue
                        delta = choices[0].get("delta") or {}
                        content = delta.get("content")
                        if isinstance(content, str) and content:
                            parts.append(content)
                            yield content
        except httpx.HTTPError as exc:
            raise AiProviderError(f"xAI stream transport error: {exc}") from exc

        text = "".join(parts).strip()
        if not text:
            raise AiProviderError("xAI stream produced empty assistant text")
        yield CompletionResult(
            text=text,
            provider="xai",
            model=model,
            usage=usage,
            raw=None,
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
