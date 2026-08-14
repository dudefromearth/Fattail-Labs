"""RB-07 — §10b journal *path* tripwire (not helper-only)."""

from __future__ import annotations

import inspect
from datetime import date

import journal_session_agent as jsa
import labs_member_ai_ethos as ethos
from tests.conftest import cookie_for
from tests.test_journal_sessions import _cleanup, _member
from tests.test_labs_member_ai_ethos import (
    SELF_DISTRESS_CORPUS,
    TRADING_VERNACULAR_CORPUS,
)


def test_run_agent_turn_source_keeps_ethos_compose_and_distress_gate():
    src = inspect.getsource(jsa.run_agent_turn)
    mod = inspect.getsource(jsa)
    assert "member_text_indicates_distress" in src
    assert "distress_hold" in src
    assert "compose_member_system_prompt" in mod
    assert "JOURNAL_SESSION_SYSTEM_PROMPT_V1" in mod


def test_compose_path_includes_ethos_v1_2_when_mode_on(monkeypatch):
    monkeypatch.setenv("LABS_MEMBER_AI_ETHOS_MODE", "on")
    composed = ethos.compose_member_system_prompt(jsa.JOURNAL_SESSION_SYSTEM_PROMPT_V1)
    assert ethos.ETHOS_ID == "LABS_MEMBER_AI_ETHOS_V1_2"
    assert "LABS_MEMBER_AI_ETHOS_V1_2" == ethos.ETHOS_ID
    assert "enlightened" in composed.lower()
    assert "Never give advice" in composed


def test_journal_path_distress_hold_even_when_ethos_mode_off(client, monkeypatch):
    monkeypatch.setenv("LABS_MEMBER_AI_ETHOS_MODE", "off")
    monkeypatch.setenv("LABS_JOURNAL_AGENT_MODE", "local")
    import journal_heat as jh

    monkeypatch.setattr(jh, "identity_has_unmatched_open", lambda *a, **k: False)
    iid = _member("zztest-j07-ethos-distress@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        s = client.post(
            "/api/me/journal-sessions",
            json={"journal_date": date.today().isoformat()},
            cookies=cookies,
        )
        sid = s.json()["session"]["id"]
        for text in SELF_DISTRESS_CORPUS:
            t = client.post(
                f"/api/me/journal-sessions/{sid}/agent/turn",
                json={"body_md": text},
                cookies=cookies,
            )
            assert t.status_code == 200, t.text
            turn = t.json()["turn"]
            assert turn["kind"] == "distress_hold", (text, turn.get("kind"))
            assert turn["kind"] != "absence"
            assert "absence" not in str(turn.get("kind") or "")
    finally:
        _cleanup(iid)


def test_journal_path_trading_vernacular_does_not_hold(client, monkeypatch):
    monkeypatch.setenv("LABS_MEMBER_AI_ETHOS_MODE", "on")
    monkeypatch.setenv("LABS_JOURNAL_AGENT_MODE", "local")
    import journal_heat as jh

    monkeypatch.setattr(jh, "identity_has_unmatched_open", lambda *a, **k: False)
    iid = _member("zztest-j07-ethos-vernacular@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        s = client.post(
            "/api/me/journal-sessions",
            json={"journal_date": date.today().isoformat()},
            cookies=cookies,
        )
        sid = s.json()["session"]["id"]
        t = client.post(
            f"/api/me/journal-sessions/{sid}/agent/turn",
            json={"body_md": TRADING_VERNACULAR_CORPUS[0]},
            cookies=cookies,
        )
        assert t.status_code == 200, t.text
        kind = t.json()["turn"]["kind"]
        assert kind != "distress_hold", kind
    finally:
        _cleanup(iid)
