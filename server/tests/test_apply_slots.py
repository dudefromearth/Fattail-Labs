"""Characterization — server-owned apply conversation slots (no Calendly)."""

from __future__ import annotations

import sys
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parents[1]
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

import apply_slots
from apply_slots import public_payload, slot_is_live


LIVE = [
    {
        "id": 1,
        "starts_et": "2026-08-25T11:00",
        "sort_order": 10,
        "live": True,
    },
    {
        "id": 2,
        "starts_et": "2026-08-26T14:00",
        "sort_order": 20,
        "live": True,
    },
]
HIDDEN = {
    "id": 3,
    "starts_et": "",
    "sort_order": 30,
    "live": False,
}


def _client():
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from routes.apply import router

    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


def test_empty_starts_is_not_live():
    assert slot_is_live("") is False
    assert slot_is_live("yes") is False
    assert slot_is_live("2026-08-25T11:00") is True


def test_public_payload_hides_empty():
    out = public_payload(LIVE + [HIDDEN])
    assert [s["id"] for s in out] == [1, 2]
    assert all("live" not in s for s in out)


def test_is_live_when_requires_listed(monkeypatch):
    monkeypatch.setattr(apply_slots, "list_live", lambda: list(LIVE))
    assert apply_slots.is_live_when("2026-08-25T11:00") is True
    assert apply_slots.is_live_when("2026-08-25T15:00") is False
    assert apply_slots.is_live_when("yes") is False


def test_public_slots_empty_is_truthful(monkeypatch):
    monkeypatch.setattr("routes.apply.list_live", lambda: [])
    r = _client().get("/api/apply/slots")
    assert r.status_code == 200
    body = r.json()
    assert body["ok"] is True
    assert body["slots"] == []


def test_public_slots_omits_hidden(monkeypatch):
    monkeypatch.setattr("routes.apply.list_live", lambda: list(LIVE))
    monkeypatch.setattr("routes.apply.public_payload", public_payload)
    r = _client().get("/api/apply/slots")
    assert r.status_code == 200
    assert [s["starts_et"] for s in r.json()["slots"]] == [
        "2026-08-25T11:00",
        "2026-08-26T14:00",
    ]


def test_public_slots_store_miss_is_503(monkeypatch):
    def boom():
        raise RuntimeError("db down")

    monkeypatch.setattr("routes.apply.list_live", boom)
    r = _client().get("/api/apply/slots")
    assert r.status_code == 503
    assert r.json().get("ok") is not True


def test_invite_rejects_unlisted_time(monkeypatch):
    monkeypatch.setattr("routes.apply.is_live_when", lambda _w: False)
    r = _client().post(
        "/api/apply/invite",
        json={"email": "zztest-apply@labs.test", "when": "2026-08-25T15:00"},
    )
    assert r.status_code == 422
    assert "live" in r.json()["detail"].lower() or "slot" in r.json()["detail"].lower()


def test_apply_rejects_unlisted_time(monkeypatch):
    def questions():
        return [
            {
                "id": 1,
                "slug": "email",
                "ask": "Email",
                "hint": "",
                "qtype": "free_text",
                "options": [],
                "ac_key": None,
                "ac_field_id": None,
                "is_email": True,
                "sort_order": 10,
            },
            {
                "id": 2,
                "slug": "ELEVEN_AM_ET",
                "ask": "When",
                "hint": "",
                "qtype": "calendar",
                "options": [],
                "ac_key": "ELEVEN_AM_ET",
                "ac_field_id": "7",
                "is_email": False,
                "sort_order": 20,
            },
        ]

    monkeypatch.setattr("routes.apply.list_all", questions)
    monkeypatch.setattr(
        "routes.apply.list_live",
        lambda: [{"starts_et": "2026-08-25T11:00", "live": True}],
    )
    monkeypatch.setattr("routes.apply.store_submission", lambda *_a, **_k: 1)
    monkeypatch.setattr("routes.apply.is_live_when", lambda _w: False)
    monkeypatch.setattr(
        "routes.apply.write_application",
        lambda *_a, **_k: (_ for _ in ()).throw(AssertionError("no write")),
    )
    r = _client().post(
        "/api/apply",
        json={
            "email": "zztest-apply@labs.test",
            "HELL": "h",
            "HEAVEN": "v",
            "MONEY_TIMING": "m",
            "COACHING_SKU": "s",
            "ELEVEN_AM_ET": "2026-08-25T15:00",
            "TRIED": "t",
            "PARTNER_SUPPORT": "p",
        },
    )
    assert r.status_code == 422
    assert r.json().get("ok") is not True


def test_admin_slots_require_admin(monkeypatch):
    from fastapi import HTTPException

    def deny(_request):
        raise HTTPException(status_code=403, detail="administrator required")

    monkeypatch.setattr("routes.apply._require_admin", deny)
    r = _client().get("/api/admin/apply/slots")
    assert r.status_code == 403
    assert r.json().get("ok") is not True
