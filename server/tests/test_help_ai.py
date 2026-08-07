"""Characterization tests — AI help concierge (guardrails, parsing, escalation).

The model is never called for real here; the xAI provider is monkeypatched. These
lock the safety-critical behaviour: guardrails are present, output parsing is
defensive, and every failure path escalates to a human (never raises).
Spec: FatTail-Labs-Help-Concierge-Spec-v1.0.
"""

from __future__ import annotations

import help_ai


# --- knowledge base + system prompt (guardrails) -----------------------------


def test_kb_loads_nonempty():
    help_ai._kb.cache_clear()
    assert "FatTail Labs" in help_ai._kb()


def test_system_prompt_has_hard_guardrails():
    p = help_ai._system_prompt().lower()
    # never leak internals / infra / secrets
    for needle in ("never", "read-only", "api key", "infrastructure", "json"):
        assert needle in p
    # the KB is embedded
    assert "knowledge base" in p


# --- output parsing ----------------------------------------------------------


def test_extract_json_good():
    assert help_ai._extract_json('{"reply":"hi","resolved":true}') == {"reply": "hi", "resolved": True}
    # tolerate prose around the object
    assert help_ai._extract_json('sure: {"reply":"x","resolved":false} ok') == {"reply": "x", "resolved": False}


def test_extract_json_bad():
    assert help_ai._extract_json("not json at all") is None
    assert help_ai._extract_json("") is None


# --- answer(): escalation is the safe default --------------------------------


def test_answer_escalates_when_disabled(monkeypatch):
    monkeypatch.setattr(help_ai, "is_enabled", lambda: False)
    out = help_ai.answer("general", [{"author_role": "member", "body": "hi"}])
    assert out["resolved"] is False and out["reply"] == help_ai.ESCALATION_REPLY


class _FakeResult:
    def __init__(self, text):
        self.text = text


class _FakeProvider:
    def __init__(self, text):
        self._text = text
    def __call__(self, cfg):  # provider factory: XaiProvider(cfg)
        return self
    def complete(self, messages, *, model, temperature, max_tokens):
        return _FakeResult(self._text)


def _patch_provider(monkeypatch, text):
    monkeypatch.setattr(help_ai, "is_enabled", lambda: True)
    import ai.providers.xai as xai
    monkeypatch.setattr(xai, "XaiProvider", _FakeProvider(text))


def test_answer_resolved_true(monkeypatch):
    _patch_provider(monkeypatch, '{"reply":"Go to the Courses page.","resolved":true}')
    out = help_ai.answer("struggling", [{"author_role": "member", "body": "where are courses"}])
    assert out["resolved"] is True and "Courses" in out["reply"]


def test_answer_resolved_false_escalates(monkeypatch):
    _patch_provider(monkeypatch, '{"reply":"Let me get a human.","resolved":false}')
    out = help_ai.answer("general", [{"author_role": "member", "body": "refund my card now"}])
    assert out["resolved"] is False


def test_answer_escalates_on_provider_error(monkeypatch):
    monkeypatch.setattr(help_ai, "is_enabled", lambda: True)
    class _Boom:
        def __call__(self, cfg): return self
        def complete(self, *a, **k): raise RuntimeError("xAI down")
    import ai.providers.xai as xai
    monkeypatch.setattr(xai, "XaiProvider", _Boom())
    out = help_ai.answer("general", [{"author_role": "member", "body": "hi"}])
    assert out["resolved"] is False and out["reply"] == help_ai.ESCALATION_REPLY


def test_answer_nonjson_text_is_shown(monkeypatch):
    _patch_provider(monkeypatch, "Just plain helpful text, no JSON.")
    out = help_ai.answer("general", [{"author_role": "member", "body": "hi"}])
    assert out["resolved"] is True and "plain helpful" in out["reply"]
