"""Characterization — in-house apply ICS invite (no Calendly)."""

from __future__ import annotations

import sys
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parents[1]
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

import apply_invite
from apply_invite import ApplyInviteError


WHEN = "2026-08-25T11:00"
EMAIL = "zztest-apply@labs.test"


def test_ics_is_method_request_et_thirty_minutes():
    when = apply_invite.parse_when_et(WHEN)
    ics = apply_invite.build_ics(email=EMAIL, when=when, sequence=1)
    assert "METHOD:REQUEST" in ics
    assert "SUMMARY:FatTail conversation" in ics
    assert "DTSTART;TZID=America/New_York:20260825T110000" in ics
    assert "DTEND;TZID=America/New_York:20260825T113000" in ics
    assert "ORGANIZER;CN=Cole Merritt:mailto:cole@fattail.ai" in ics
    assert "LOCATION:We'll send the link." in ics
    assert "zoom.us" not in ics.lower()
    assert f"UID:{apply_invite.conversation_uid(EMAIL)}" in ics


def test_uid_is_stable_per_email():
    a = apply_invite.conversation_uid("A@Labs.Test")
    b = apply_invite.conversation_uid("a@labs.test")
    c = apply_invite.conversation_uid("other@labs.test")
    assert a == b
    assert a != c


def test_send_unconfigured_fails_loud(monkeypatch):
    monkeypatch.delenv("LABS_SMTP_HOST", raising=False)
    try:
        apply_invite.send_conversation_invite(EMAIL, WHEN)
        raise AssertionError("expected ApplyInviteError")
    except ApplyInviteError as exc:
        assert "LABS_SMTP_HOST" in str(exc)


def test_send_calls_smtp_with_ics(monkeypatch):
    monkeypatch.setenv("LABS_SMTP_HOST", "smtp.test.local")
    monkeypatch.setenv("LABS_SMTP_FROM", "labs@test.local")
    captured = {}

    def fake_send(msg):
        captured["msg"] = msg

    monkeypatch.setattr(apply_invite, "_send_message", fake_send)
    out = apply_invite.send_conversation_invite(EMAIL, WHEN)
    assert out["ok"] is True
    assert out["sent"] is True
    assert out["uid"] == apply_invite.conversation_uid(EMAIL)
    msg = captured["msg"]
    assert msg["To"] == EMAIL
    assert msg["Cc"] == "cole@fattail.ai"
    raw = msg.as_string()
    assert "invite.ics" in raw
    assert "FatTail conversation" in raw
    ics = ""
    for part in msg.walk():
        if part.get_content_subtype() == "calendar":
            payload = part.get_payload(decode=True)
            ics = payload.decode("utf-8") if isinstance(payload, bytes) else str(payload)
            break
    assert "METHOD:REQUEST" in ics
    assert apply_invite.conversation_uid(EMAIL) in ics


def test_api_invite_unconfigured_is_503(monkeypatch):
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from routes.apply import router

    monkeypatch.setattr("routes.apply.is_live_when", lambda when: when == WHEN)
    monkeypatch.delenv("LABS_SMTP_HOST", raising=False)
    app = FastAPI()
    app.include_router(router)
    r = TestClient(app).post(
        "/api/apply/invite",
        json={"email": EMAIL, "when": WHEN},
    )
    assert r.status_code == 503
    assert r.json().get("ok") is not True
    assert "LABS_SMTP_HOST" in r.json()["detail"]


def test_api_invite_rejects_yesno():
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from routes.apply import router

    app = FastAPI()
    app.include_router(router)
    r = TestClient(app).post(
        "/api/apply/invite",
        json={"email": EMAIL, "when": "yes"},
    )
    assert r.status_code == 422
    assert "date" in r.json()["detail"].lower() or "time" in r.json()["detail"].lower()
