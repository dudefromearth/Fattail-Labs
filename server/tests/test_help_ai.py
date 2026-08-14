"""Characterization tests — AI help concierge (guardrails, retrieval, escalation).

The model is never called for real here; the xAI provider is monkeypatched. These lock
the safety-critical behaviour: guardrails are present, the reference library loads and is
searchable, output parsing is defensive, the search→answer loop works, and every failure
path escalates to a human (never raises).
Spec: FatTail-Labs-Help-Concierge-Spec-v1.2.
"""

from __future__ import annotations

import help_ai


def test_help_ai_enabled_fail_loud(monkeypatch):
    """Missing or mistyped flag must not silently enable the concierge model."""
    import pytest
    from config import ConfigError, get_config, reset_config_for_tests

    monkeypatch.delenv("LABS_HELP_AI_ENABLED", raising=False)
    reset_config_for_tests()
    with pytest.raises(ConfigError, match="LABS_HELP_AI_ENABLED"):
        get_config()
    with pytest.raises(ConfigError, match="LABS_HELP_AI_ENABLED"):
        help_ai.help_ai_flag_on()

    monkeypatch.setenv("LABS_HELP_AI_ENABLED", "maybe")
    reset_config_for_tests()
    with pytest.raises(ConfigError, match="LABS_HELP_AI_ENABLED"):
        get_config()
    with pytest.raises(ConfigError, match="LABS_HELP_AI_ENABLED"):
        help_ai.help_ai_flag_on()

    monkeypatch.setenv("LABS_HELP_AI_ENABLED", "0")
    reset_config_for_tests()
    assert get_config().help_ai_enabled is False
    assert help_ai.help_ai_flag_on() is False
    assert help_ai.is_enabled() is False

    monkeypatch.setenv("LABS_HELP_AI_ENABLED", "1")
    reset_config_for_tests()
    assert get_config().help_ai_enabled is True
    assert help_ai.help_ai_flag_on() is True


# --- reference library + system prompt (guardrails) --------------------------


def test_reference_sections_load():
    help_ai._sections.cache_clear()
    secs = help_ai._sections()
    assert secs, "reference library should not be empty"
    heads = {s["heading"] for s in secs}
    assert "Resources" in heads and "Courses" in heads
    # the courses doc distilled the real published courses
    bodies = " ".join(s["body"] for s in secs)
    assert "0-DTE Foundations" in bodies


def test_index_lists_docs_and_sections():
    help_ai._sections.cache_clear()
    idx = help_ai._index().lower()
    assert "courses" in idx and "resources" in idx and "membership" in idx


def test_system_prompt_has_hard_guardrails_and_index():
    p = help_ai._system_prompt().lower()
    for needle in ("never", "read-only", "api key", "infrastructure", "json", "search"):
        assert needle in p
    # the section index is embedded so the model knows what it can search
    assert "resources" in p and "courses" in p


# --- retrieval ---------------------------------------------------------------


def test_search_matches_relevant_sections():
    help_ai._sections.cache_clear()
    out = help_ai._search(["resources downloadable"])
    assert "Resources" in out
    out2 = help_ai._search(["what do I learn from each course"]).lower()
    assert "course" in out2
    # empty / no-signal queries return nothing (never a full dump)
    assert help_ai._search([]) == ""


# --- output parsing ----------------------------------------------------------


def test_extract_json_good():
    assert help_ai._extract_json('{"reply":"hi","resolved":true}') == {"reply": "hi", "resolved": True}
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
    """Returns the same text for every complete() call."""
    def __init__(self, text):
        self._text = text
    def __call__(self, cfg):  # provider factory: XaiProvider(cfg)
        return self
    def complete(self, messages, *, model, temperature, max_tokens):
        return _FakeResult(self._text)


class _SeqProvider:
    """Returns a queued text per complete() call (last one repeats)."""
    def __init__(self, texts):
        self._texts = list(texts)
        self.calls = 0
    def __call__(self, cfg):
        return self
    def complete(self, messages, *, model, temperature, max_tokens):
        t = self._texts[min(self.calls, len(self._texts) - 1)]
        self.calls += 1
        return _FakeResult(t)


def _patch_provider(monkeypatch, text):
    monkeypatch.setattr(help_ai, "is_enabled", lambda: True)
    import ai.providers.xai as xai
    monkeypatch.setattr(xai, "XaiProvider", _FakeProvider(text))


def test_answer_direct_answer(monkeypatch):
    # Model answers on the first pass (no search needed).
    _patch_provider(monkeypatch, '{"action":"answer","reply":"Go to the Courses page.","resolved":true,"topic":"struggling"}')
    out = help_ai.answer("struggling", [{"author_role": "member", "body": "where are courses"}])
    assert out["resolved"] is True and "Courses" in out["reply"] and out["topic"] == "struggling"


def test_answer_search_then_answer(monkeypatch):
    # Model searches first, then answers from the returned reference.
    monkeypatch.setattr(help_ai, "is_enabled", lambda: True)
    import ai.providers.xai as xai
    seq = _SeqProvider([
        '{"action":"search","queries":["resources"]}',
        '{"action":"answer","reply":"Resources are in the main navigation.","resolved":true,"topic":"general"}',
    ])
    monkeypatch.setattr(xai, "XaiProvider", seq)
    out = help_ai.answer("", [{"author_role": "member", "body": "where are the resources"}])
    assert out["resolved"] is True and "Resources" in out["reply"]
    assert seq.calls == 2  # it actually did the two-step loop


def test_answer_resolved_false_escalates(monkeypatch):
    _patch_provider(monkeypatch, '{"action":"answer","reply":"Let me get a human.","resolved":false,"topic":"general"}')
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


def test_answer_nonjson_escalates(monkeypatch):
    # Unstructured output is no longer shown raw — we escalate rather than risk a guess.
    _patch_provider(monkeypatch, "Just plain text, no JSON.")
    out = help_ai.answer("general", [{"author_role": "member", "body": "hi"}])
    assert out["resolved"] is False and out["reply"] == help_ai.ESCALATION_REPLY
