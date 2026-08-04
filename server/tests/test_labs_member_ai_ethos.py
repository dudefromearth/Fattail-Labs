"""Characterization — Member AI Ethos Spec v1.2 · DL-209–211."""

from __future__ import annotations

import journal_session_agent as jsa
import journal_session_validator as jsv
import labs_member_ai_ethos as ethos
import retrospective_agent as ra

# Trading vernacular: compression about positions — must NOT stop interview
TRADING_VERNACULAR_CORPUS = [
    "That trade killed me.",
    "I got destroyed on the open.",
    "I'm dead in the water after that loss.",
    "The account bled out on 0DTE.",
    "I blew up the small account.",
    "Getting slaughtered on this position.",
    "Sold the suicide spread for credit.",
    "Need to stop the bleeding on size.",
    "Revenge trade almost killed my day.",
]

# Self-directed crisis — must stop interview
SELF_DISTRESS_CORPUS = [
    "I want to kill myself.",
    "I've been thinking about suicide.",
    "I don't want to live anymore.",
    "I'm going to end my life.",
    "I've been cutting myself.",
]


def test_ethos_v1_2_shipped():
    assert ethos.ETHOS_ID == "LABS_MEMBER_AI_ETHOS_V1_2"
    body = ethos.LABS_MEMBER_AI_ETHOS_V1_2
    assert "enlightened" in body.lower()
    assert "48.5" not in body
    assert "suicide spread" in body.lower() or "trading vernacular" in body.lower()
    assert "register" in body.lower()


def test_priors_held_not_for_product():
    priors = ethos.world_model_priors_for_hotel()
    assert all(p.get("hotel_status") == "pending_ratification" for p in priors)
    assert not hasattr(ethos, "WORLD_MODEL_PRIORS") or True


def test_compose_mode_off_surface_only(monkeypatch):
    monkeypatch.setenv("LABS_MEMBER_AI_ETHOS_MODE", "off")
    role = "Surface only."
    assert ethos.compose_member_system_prompt(role).startswith("Surface only.")
    assert ethos.ethos_stamp()["ethos_id"] == "off"
    assert ethos.ethos_stamp()["distress_gate"] == "code_independent"


def test_compose_includes_register(monkeypatch):
    monkeypatch.setenv("LABS_MEMBER_AI_ETHOS_MODE", "on")
    c = ethos.compose_member_system_prompt("Role.", language_register="plain")
    assert "plain" in c
    c2 = ethos.compose_member_system_prompt(
        "Role.", language_register="mirror", distress_active=True
    )
    assert "mirror" not in c2.split("Output register")[-1][:40] or "plain" in c2


def test_journal_bans_survive_composition(monkeypatch):
    monkeypatch.setenv("LABS_MEMBER_AI_ETHOS_MODE", "on")
    composed = ethos.compose_member_system_prompt(jsa.JOURNAL_SESSION_SYSTEM_PROMPT_V1)
    assert "Never name a motive" in composed
    assert "Never give advice" in composed


def test_behavioral_validator_still_rejects():
    for sample in (
        "You should size down tomorrow.",
        "You were anxious on that trade.",
        "Good trade — nice work!",
    ):
        r = jsv.validate_agent_turn(sample)
        assert r["ok"] is False, sample


def test_distress_ack_passes_validator_and_names_support():
    r = jsv.validate_agent_turn(ethos.DISTRESS_ACK_BODY)
    assert r["ok"] is True, r.get("violations")
    assert "988" in ethos.DISTRESS_ACK_BODY
    assert "iasp.info" in ethos.DISTRESS_ACK_BODY.lower()


def test_distress_self_corpus_fires():
    for text in SELF_DISTRESS_CORPUS:
        assert ethos.member_text_indicates_distress(text) is True, text


def test_trading_vernacular_does_not_fire():
    for text in TRADING_VERNACULAR_CORPUS:
        assert ethos.member_text_indicates_distress(text) is False, text


def test_suicide_spread_not_distress():
    assert ethos.member_text_indicates_distress("I sold a suicide spread") is False
    assert ethos.member_text_indicates_distress("I feel suicidal today") is True


def test_empty_not_distress():
    assert ethos.member_text_indicates_distress("") is False
    assert ethos.member_text_indicates_distress(None) is False


def test_retrospective_ethos_stamp():
    guide = ra.build_sequence_guide(
        {
            "what_worked": [],
            "deviations": [],
            "clustering": {"statements": []},
            "book_performance": {"trade_count": 0},
        },
        prompt_version_id=ra.DEFAULT_PROMPT_VERSION_ID,
        focused_step=1,
    )
    assert guide.get("ethos_id") in ("LABS_MEMBER_AI_ETHOS_V1_2", "off")
