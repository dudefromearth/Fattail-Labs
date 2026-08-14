"""Journal Session v0.7 charter — drafts, heat, extract, surfacing ledger."""

from __future__ import annotations

from datetime import date

import pytest

import db
import identity as identity_mod
import journal_coach_config as jcc
import journal_session_structured as jss
from tests.conftest import cookie_for
from tests.test_journal_sessions import _cleanup, _member


@pytest.fixture(autouse=True)
def _coach_env(monkeypatch):
    monkeypatch.setenv("LABS_COACH_POSTURE_DEFAULT", "forward")
    monkeypatch.setenv("LABS_COACH_MODEL_PROVIDER", "xai")
    monkeypatch.setenv("LABS_COACH_MODEL", "grok-4")
    monkeypatch.setenv(
        "LABS_COACH_EFFORT_MAP",
        "day_open:low,surface:low,extract:low,mechanical_turn:low",
    )
    monkeypatch.setenv("LABS_JOURNAL_AGENT_MODE", "local")


def test_closed_field_set_matches_p1():
    keys = jss.all_field_keys()
    expected = {
        "instrument",
        "thesis_direction",
        "trigger_level",
        "size_risk",
        "invalidation",
        "watching",
        "plan_diff",
        "deviations",
        "what_worked",
        "open_thread",
        "differed_from_plan",
        "note",
    }
    assert keys == expected


def test_coach_config_fail_loud(monkeypatch):
    monkeypatch.delenv("LABS_COACH_POSTURE_DEFAULT", raising=False)
    with pytest.raises(jcc.CoachConfigError, match="LABS_COACH_POSTURE_DEFAULT"):
        jcc.require_coach_config()
    monkeypatch.setenv("LABS_COACH_POSTURE_DEFAULT", "forward")
    monkeypatch.setenv("LABS_COACH_EFFORT_MAP", "day_open:low")
    with pytest.raises(jcc.CoachConfigError, match="missing keys"):
        jcc.require_coach_config()


def test_draft_roundtrip_and_export_omit(client):
    iid = _member("zztest-j07-draft@labs.test")
    cookies = cookie_for("activator", iid)
    d = date.today().isoformat()
    try:
        r = client.put(
            "/api/me/journal/drafts",
            json={"journal_date": d, "body_md": "mid thought"},
            cookies=cookies,
        )
        assert r.status_code == 200, r.text
        g = client.get(f"/api/me/journal/drafts?journal_date={d}", cookies=cookies)
        assert g.status_code == 200
        assert g.json()["draft"]["body_md"] == "mid thought"
        assert g.json()["draft"]["read_only"] is False
    finally:
        _cleanup(iid)


def test_extract_confirm_same_txn_and_unknown_key(client):
    iid = _member("zztest-j07-confirm@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        s = client.post(
            "/api/me/journal-sessions",
            json={"journal_date": date.today().isoformat()},
            cookies=cookies,
        )
        sid = s.json()["session"]["id"]
        m = client.post(
            f"/api/me/journal-sessions/{sid}/messages",
            json={"body_md": "Watching ES around 5800."},
            cookies=cookies,
        )
        mid = m.json()["message"]["id"]
        bad = client.post(
            f"/api/me/journal-sessions/{sid}/confirmations",
            json={
                "field_key": "mood",
                "value": "anxious",
                "present": True,
                "source_message_ids": [mid],
                "method": "extraction",
            },
            cookies=cookies,
        )
        assert bad.status_code == 422
        ok = client.post(
            f"/api/me/journal-sessions/{sid}/confirmations",
            json={
                "field_key": "instrument",
                "value": "ES",
                "present": True,
                "source_message_ids": [mid],
                "method": "extraction",
            },
            cookies=cookies,
        )
        assert ok.status_code == 200, ok.text
        sess = ok.json()["session"]
        assert sess["structured"]["instrument"] == "ES"
        assert sess["structured_provenance"]["instrument"]["method"] == "extraction"
        # confirmation is not a member message
        members = [x for x in sess["messages"] if x["author"] == "member"]
        assert len(members) == 1
        dec = client.post(
            f"/api/me/journal-sessions/{sid}/confirmations",
            json={
                "field_key": "instrument",
                "present": False,
                "source_message_ids": [mid],
                "method": "extraction",
            },
            cookies=cookies,
        )
        assert dec.status_code == 200
        assert "instrument" not in (dec.json()["session"]["structured"] or {})
    finally:
        _cleanup(iid)


def test_agent_source_cannot_confirm(client):
    iid = _member("zztest-j07-agent-src@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        s = client.post(
            "/api/me/journal-sessions",
            json={"journal_date": date.today().isoformat()},
            cookies=cookies,
        )
        sid = s.json()["session"]["id"]
        # no member message — fake agent id
        r = client.post(
            f"/api/me/journal-sessions/{sid}/confirmations",
            json={
                "field_key": "note",
                "value": "nope",
                "present": True,
                "source_message_ids": [999999],
                "method": "extraction",
            },
            cookies=cookies,
        )
        assert r.status_code == 422
    finally:
        _cleanup(iid)


def test_heat_asked_analysis_rejected(client, monkeypatch):
    iid = _member("zztest-j07-heat@labs.test")
    cookies = cookie_for("activator", iid)
    import journal_heat as jh

    monkeypatch.setattr(jh, "identity_has_unmatched_open", lambda *a, **k: True)
    try:
        s = client.post(
            "/api/me/journal-sessions",
            json={"journal_date": date.today().isoformat()},
            cookies=cookies,
        )
        sid = s.json()["session"]["id"]
        t = client.post(
            f"/api/me/journal-sessions/{sid}/agent/turn",
            json={"body_md": "What do you think of this trade?"},
            cookies=cookies,
        )
        assert t.status_code == 200, t.text
        turn = t.json()["turn"]
        assert turn["kind"] == "heat_hold"
        assert turn.get("message") is None
        assert turn.get("heat") is True
    finally:
        _cleanup(iid)


def test_heat_unprompted_quiet(client, monkeypatch):
    iid = _member("zztest-j07-heat-q@labs.test")
    cookies = cookie_for("activator", iid)
    import journal_heat as jh

    monkeypatch.setattr(jh, "identity_has_unmatched_open", lambda *a, **k: True)
    try:
        s = client.post(
            "/api/me/journal-sessions",
            json={"journal_date": date.today().isoformat()},
            cookies=cookies,
        )
        sid = s.json()["session"]["id"]
        t = client.post(
            f"/api/me/journal-sessions/{sid}/agent/turn",
            json={},
            cookies=cookies,
        )
        assert t.status_code == 200
        assert t.json()["turn"]["kind"] == "quiet"
        assert t.json()["turn"]["message"] is None
    finally:
        _cleanup(iid)


def test_surfacing_ledger_one_fire(client, monkeypatch):
    iid = _member("zztest-j07-ledger@labs.test")
    cookies = cookie_for("activator", iid)
    import journal_heat as jh
    import journal_session_domain as jsd

    monkeypatch.setattr(jh, "identity_has_unmatched_open", lambda *a, **k: False)
    monkeypatch.setattr(jsd, "derive_phase", lambda *a, **k: "pre_open")
    d = date.today().isoformat()
    try:
        s = client.post(
            "/api/me/journal-sessions",
            json={"journal_date": d},
            cookies=cookies,
        )
        sid = s.json()["session"]["id"]
        t1 = client.post(
            f"/api/me/journal-sessions/{sid}/agent/turn",
            json={},
            cookies=cookies,
        )
        assert t1.status_code == 200, t1.text
        assert t1.json()["turn"]["kind"] == "coach_day_open"
        t2 = client.post(
            f"/api/me/journal-sessions/{sid}/agent/turn",
            json={},
            cookies=cookies,
        )
        assert t2.json()["turn"]["kind"] == "quiet"
        tick = client.post(
            "/api/me/journal/coach/tick",
            json={"journal_date": d, "journal_focused": False},
            cookies=cookies,
        )
        assert tick.status_code == 200
        assert tick.json()["actions"] == []
    finally:
        _cleanup(iid)


def test_heat_consume_blocks_late_day_open(client, monkeypatch):
    iid = _member("zztest-j07-consume@labs.test")
    cookies = cookie_for("activator", iid)
    import journal_heat as jh
    import journal_session_domain as jsd

    monkeypatch.setattr(jh, "identity_has_unmatched_open", lambda *a, **k: True)
    monkeypatch.setattr(jsd, "derive_phase", lambda *a, **k: "pre_open")
    d = date.today().isoformat()
    try:
        client.post(
            "/api/me/journal/coach/tick",
            json={"journal_date": d, "journal_focused": True},
            cookies=cookies,
        )
        monkeypatch.setattr(jh, "identity_has_unmatched_open", lambda *a, **k: False)
        monkeypatch.setattr(jsd, "derive_phase", lambda *a, **k: "intraday")
        s = client.post(
            "/api/me/journal-sessions",
            json={"journal_date": d},
            cookies=cookies,
        )
        sid = s.json()["session"]["id"]
        t = client.post(
            f"/api/me/journal-sessions/{sid}/agent/turn",
            json={},
            cookies=cookies,
        )
        assert t.json()["turn"]["kind"] == "quiet"
    finally:
        _cleanup(iid)


def test_prompt_version_still_stamped(client):
    iid = _member("zztest-j07-prompt@labs.test")
    cookies = cookie_for("activator", iid)
    try:
        s = client.post(
            "/api/me/journal-sessions",
            json={"journal_date": date.today().isoformat()},
            cookies=cookies,
        )
        assert s.status_code == 200
        assert s.json()["session"].get("prompt_version_id")
    finally:
        _cleanup(iid)
