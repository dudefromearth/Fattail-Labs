"""Characterization — Member AI Ethos Spec v1.1 · DL-209/210."""

from __future__ import annotations

import journal_session_agent as jsa
import journal_session_validator as jsv
import labs_member_ai_ethos as ethos
import retrospective_agent as ra


def test_ethos_constant_shipped_v1_1():
    assert ethos.ETHOS_ID == "LABS_MEMBER_AI_ETHOS_V1_1"
    body = ethos.LABS_MEMBER_AI_ETHOS_V1_1
    assert "enlightened" in body.lower()
    assert "fat-tailed" in body.lower()
    assert "stop the bleeding" in body.lower()
    assert "OVERRIDE" in body
    assert "proselytize" in body.lower()
    assert "distress" in body.lower() or "crisis" in body.lower()
    # Spec §8: no bare percent bands in LLM ethos body
    assert "48.5" not in body
    assert "12.5" not in body
    assert "45–55" not in body and "45-55" not in body


def test_world_model_priors_sourced_and_dated():
    assert len(ethos.WORLD_MODEL_PRIORS) >= 3
    for p in ethos.WORLD_MODEL_PRIORS:
        assert p.get("source")
        assert p.get("as_of")
        assert p.get("review_by")
        assert p.get("approx")


def test_compose_prepends_ethos_and_keeps_surface(monkeypatch):
    monkeypatch.setenv("LABS_MEMBER_AI_ETHOS_MODE", "on")
    role = "You are an interviewer and a recorder. Never state a profit or loss figure."
    composed = ethos.compose_member_system_prompt(role)
    assert composed.index("Member AI Ethos") < composed.index("Surface role")
    assert "interviewer and a recorder" in composed
    assert "Never state a profit or loss figure" in composed


def test_compose_mode_off_is_surface_only(monkeypatch):
    monkeypatch.setenv("LABS_MEMBER_AI_ETHOS_MODE", "off")
    role = "Surface only role text."
    composed = ethos.compose_member_system_prompt(role)
    assert composed == role
    assert "enlightened as practice" not in composed
    stamp = ethos.ethos_stamp()
    assert stamp["ethos_id"] == "off"
    assert stamp["ethos_mode"] == "off"


def test_ethos_stamp_on():
    s = ethos.ethos_stamp()
    if s["ethos_mode"] == "on":
        assert s["ethos_id"] == "LABS_MEMBER_AI_ETHOS_V1_1"
    assert "v1.1" in s["ethos_spec"] or "V1.1" in s["ethos_spec"] or "1.1" in s["ethos_spec"]


def test_journal_role_bans_survive_composition(monkeypatch):
    monkeypatch.setenv("LABS_MEMBER_AI_ETHOS_MODE", "on")
    composed = ethos.compose_member_system_prompt(jsa.JOURNAL_SESSION_SYSTEM_PROMPT_V1)
    assert "interviewer and a recorder" in composed
    assert "Never name a motive" in composed
    assert "Never give advice" in composed
    assert "Never state a profit or loss figure" in composed
    assert "Distress" in composed or "distress" in composed


def test_behavioral_validator_still_rejects_after_ethos_exists():
    """Composed ethos must not imply validator is obsolete — bans still fire."""
    bad_samples = [
        "You should size down tomorrow.",
        "You were anxious on that trade.",
        "Good trade — nice work!",
        "Your P&L was -$400 on that one.",
        "Your process integrity grade is slipping.",
    ]
    for sample in bad_samples:
        result = jsv.validate_agent_turn(sample)
        assert result["ok"] is False, sample
        assert result["violations"], sample


def test_distress_ack_passes_validator():
    result = jsv.validate_agent_turn(ethos.DISTRESS_ACK_BODY)
    assert result["ok"] is True, result.get("violations")


def test_distress_heuristics():
    assert ethos.member_text_indicates_distress("I want to kill myself") is True
    assert ethos.member_text_indicates_distress("normal size on the ES fly") is False
    assert ethos.member_text_indicates_distress("") is False


def test_retrospective_sequence_carries_ethos_stamp():
    report = {
        "what_worked": [],
        "deviations": [],
        "clustering": {"statements": []},
        "book_performance": {"trade_count": 0},
    }
    guide = ra.build_sequence_guide(
        report,
        prompt_version_id=ra.DEFAULT_PROMPT_VERSION_ID,
        focused_step=1,
    )
    assert guide.get("ethos_id") in ("LABS_MEMBER_AI_ETHOS_V1_1", "off")
    assert guide["role"] == "sequence_keeper"
    assert "stance" in guide
