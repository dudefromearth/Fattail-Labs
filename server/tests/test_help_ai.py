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


def test_search_heatmap_width_fit():
    """Width Fit member guide is searchable in the help reference."""
    help_ai._sections.cache_clear()
    heads = {s["heading"] for s in help_ai._sections()}
    for h in (
        "Width Fit",
        "How to open Width Fit",
        "Color tiles",
        "Hover and click",
        "Footer",
        "Weights",
        "Surface states",
        "What Width Fit is not",
    ):
        assert h in heads, h
    found = help_ai._search(["width fit heatmap"]).lower()
    assert "width fit" in found
    assert "template" in found
    color = help_ai._search(["heatmap teal amber tiles"]).lower()
    assert "teal" in color and "amber" in color
    assert "weaker" in color or "stronger" in color
    hover = help_ai._search(["width fit hover click color meaning"]).lower()
    assert "hover" in hover and "click" in hover
    footer = help_ai._search(["width fit footer median n"]).lower()
    assert "median" in footer and "n" in footer
    weights = help_ai._search(["width fit debit efficiency weights"]).lower()
    assert "debit efficiency" in weights or "1/7" in weights or "slider" in weights
    forbidden = ("optimizer", "bos", "butterfly opportunity", "preferred width")
    blob = " ".join(s["body"] for s in help_ai._sections() if s["doc"] == "options-lab-heatmap-width-fit").lower()
    for word in forbidden:
        assert word not in blob, word


def test_search_heatmap_tab_session():
    """Heatmap inspector tab-session guide is searchable in the help reference."""
    help_ai._sections.cache_clear()
    heads = {s["heading"] for s in help_ai._sections()}
    for h in (
        "This tab session",
        "What stays",
        "What does not stay",
        "How to use it",
        "Expiration",
        "New tab",
        "What this is not",
    ):
        assert h in heads, h
    found = help_ai._search(["heatmap sticky tab session come back"]).lower()
    assert "this browser tab" in found or "this tab" in found
    assert "new tab" in found
    stays = help_ai._search(["heatmap inspector choices stay symbol expiration"]).lower()
    assert "expiration" in stays and ("template" in stays or "width fit" in stays)
    gone = help_ai._search(["heatmap hover pin average snapshots reload"]).lower()
    assert "hover" in gone
    assert "reload" in gone or "memory" in gone
    exp = help_ai._search(["heatmap expiration listed 0dte after close"]).lower()
    assert "listed" in exp
    forbidden = ("optimizer", "bos", "butterfly opportunity", "preferred width")
    blob = " ".join(
        s["body"]
        for s in help_ai._sections()
        if s["doc"] == "options-lab-heatmap-session"
    ).lower()
    for word in forbidden:
        assert word not in blob, word


def test_search_heatmap_value_modes():
    """Heatmap Value formulas live in the help reference (concierge)."""
    help_ai._sections.cache_clear()
    heads = {s["heading"] for s in help_ai._sections()}
    for h in (
        "Heatmap",
        "Long/Debit",
        "Short/Credit",
        "% Change (debit)",
        "Risk to Reward",
        "Delta",
        "Gamma",
        "Theta",
    ):
        assert h in heads, h
    found = help_ai._search(["heatmap delta gamma theta"]).lower()
    assert "delta" in found and "gamma" in found and "theta" in found
    pct = help_ai._search(["percent change debit heatmap"]).lower()
    assert "starting" in pct or "inner" in pct or "debit" in pct
    assert "100" in pct or "percent" in pct or "%" in pct
    names = help_ai._search(["delta debit r:r credit heatmap"]).lower()
    assert "delta" in names and "risk to reward" in names


def test_search_find_and_badge_and_autofilter():
    """Removed Campaigns UI copy lives in the help reference (concierge)."""
    help_ai._sections.cache_clear()
    heads = {s["heading"] for s in help_ai._sections()}
    assert "Find and Badge" in heads and "Campaigns" in heads
    found = help_ai._search(["find and badge"]).lower()
    assert "find and badge" in found
    assert "campaign" in found and "badge" in found
    assert "book" in found
    auto = help_ai._search(["autofilter campaign"]).lower()
    assert "autofilter" in auto
    assert "assign" in auto or "badge" in auto


def test_search_trade_log_autofilter():
    """TLAF3 — Trade Log Autofilter topic is in the library and searchable."""
    help_ai._sections.cache_clear()
    heads = {s["heading"] for s in help_ai._sections()}
    for h in (
        "Trade Log Autofilter",
        "How to open it",
        "The columns",
        "Filter on",
        "Campaign badge and deep link",
        "What Autofilter replaced",
        "Conflicts and nothing matched",
        "Journey locate",
        "What Autofilter is not",
    ):
        assert h in heads, h
    found = help_ai._search(["trade log autofilter"]).lower()
    assert "autofilter" in found
    assert "trade history" in found or "title" in found
    cols = help_ai._search(["autofilter exec time campaign strategy symbol status"]).lower()
    assert "exec time" in cols and "campaign" in cols
    assert "strategy" in cols
    assert "symbol" in cols and "status" in cols
    strat = help_ai._search(["strategy autofilter trade log"]).lower()
    assert "strategy" in strat
    assert "butterfly" in strat or "stored" in strat or "code" in strat
    on = help_ai._search(["filter on shown total blotter"]).lower()
    assert "filter on" in on
    badge = help_ai._search(["campaign badge autofilter trade log"]).lower()
    assert "badge" in badge and "campaign" in badge
    blob = " ".join(
        s["body"]
        for s in help_ai._sections()
        if s["doc"] == "trade-log-autofilter"
    ).lower()
    for word in (
        "winning",
        "show me the edge",
        "journal autofilter",
        "records autofilter",
    ):
        assert word not in blob, word
    areas = " ".join(
        s["body"]
        for s in help_ai._sections()
        if s["doc"] == "app-areas" and s["heading"] in ("Trade Log", "Find and Badge")
    ).lower()
    assert "trade log autofilter" in areas
    assert "autofilter" in areas


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
