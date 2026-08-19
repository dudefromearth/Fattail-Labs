"""Characterization tests — native apply write (Cole's seven AC fields).

Spec: FatTail-Native-Apply-Form-Spec-v0.2.md · DL-450.

No live AC calls. No Labs DB boot — the apply router is mounted on a
minimal FastAPI app so these tests stay isolated from waitlist/MySQL.

Isolated run (no Labs .env / MySQL):
  python3 -m pytest tests/test_apply.py -q --noconftest
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
from starlette.datastructures import Headers

SERVER_DIR = Path(__file__).resolve().parents[1]
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

import activecampaign as ac  # noqa: E402
from csrf import should_check_csrf  # noqa: E402
from routes.apply import ApplyCorsMiddleware, router as apply_router  # noqa: E402

VALID = {
    "email": "ZZApply@Labs.test",
    "hell": "Stuck repeating the same drawdown.",
    "heaven": "A process I can keep.",
    "money_timing": "Ready this month.",
    "coaching_sku": "Navigator $267/mo",
    "eleven_am_et": "yes",
    "tried": "Courses and a private Discord.",
    "partner_support": "yes",
}


def _answers_from_valid() -> dict[str, str]:
    return {
        "hell": VALID["hell"],
        "heaven": VALID["heaven"],
        "money_timing": VALID["money_timing"],
        "coaching_sku": VALID["coaching_sku"],
        "eleven_am_et": "Yes",
        "tried": VALID["tried"],
        "partner_support": "Yes",
    }


@pytest.fixture
def apply_client():
    app = FastAPI()
    app.add_middleware(ApplyCorsMiddleware)
    app.include_router(apply_router)
    with TestClient(app) as c:
        yield c


def _fake_request(path: str = "/api/apply", method: str = "POST") -> Request:
    return Request(
        {
            "type": "http",
            "asgi": {"version": "3.0"},
            "http_version": "1.1",
            "method": method,
            "scheme": "http",
            "path": path,
            "raw_path": path.encode(),
            "query_string": b"",
            "headers": Headers({}).raw,
            "client": ("testclient", 50000),
            "server": ("testserver", 80),
        }
    )


# --- sync_apply (primitives mocked) ------------------------------------------


def test_sync_apply_writes_seven_fields_and_tag_18(monkeypatch):
    monkeypatch.setenv("LABS_AC_API_URL", "https://ac.example.test")
    monkeypatch.setenv("LABS_AC_API_TOKEN", "tok-apply")
    calls: dict = {}

    def fake_sync(cfg, email, answers):
        calls["email"] = email
        calls["answers"] = dict(answers)
        calls["field_payload"] = [
            {"field": ac.APPLY_FIELD_IDS[k], "value": answers[k]}
            for k in ac.APPLY_FIELD_KEYS
        ]
        return "99"

    def fake_held(cfg, contact_id):
        calls["readback_id"] = contact_id
        return {fid: "held" for fid in ac.APPLY_FIELD_IDS.values()}

    def fake_tag(cfg, cid, tid):
        calls["tag"] = (cid, tid)

    monkeypatch.setattr(ac, "_sync_contact_with_fields", fake_sync)
    monkeypatch.setattr(ac, "_contact_field_values", fake_held)
    monkeypatch.setattr(ac, "_add_contact_tag", fake_tag)

    out = ac.sync_apply("  ZZApply@Labs.test ", _answers_from_valid())
    assert out == {"status": "synced", "contact_id": "99", "tag_id": "18"}
    assert calls["email"] == "zzapply@labs.test"
    assert calls["tag"] == ("99", "18")
    ids = {row["field"] for row in calls["field_payload"]}
    assert ids == {"3", "4", "5", "6", "7", "8", "9"}
    assert calls["answers"]["coaching_sku"] == "Navigator $267/mo"
    assert calls["answers"]["eleven_am_et"] == "Yes"
    assert calls["answers"]["partner_support"] == "Yes"


def test_sync_apply_unconfigured_raises(monkeypatch):
    monkeypatch.delenv("LABS_AC_API_URL", raising=False)
    monkeypatch.delenv("LABS_AC_API_TOKEN", raising=False)
    monkeypatch.delenv("LABS_AC_REQUIRED", raising=False)
    with pytest.raises(ac.ACError, match="not configured"):
        ac.sync_apply("zzapply@labs.test", _answers_from_valid())


def test_sync_apply_half_config_raises(monkeypatch):
    monkeypatch.setenv("LABS_AC_API_URL", "https://ac.example.test")
    monkeypatch.delenv("LABS_AC_API_TOKEN", raising=False)
    with pytest.raises(ac.ACError, match="half-configured"):
        ac.sync_apply("zzapply@labs.test", _answers_from_valid())


def test_sync_apply_empty_field_raises(monkeypatch):
    monkeypatch.setenv("LABS_AC_API_URL", "https://ac.example.test")
    monkeypatch.setenv("LABS_AC_API_TOKEN", "tok-apply")
    answers = _answers_from_valid()
    answers["hell"] = "   "
    with pytest.raises(ac.ACError, match="hell"):
        ac.sync_apply("zzapply@labs.test", answers)


def test_sync_apply_readback_miss_raises(monkeypatch):
    monkeypatch.setenv("LABS_AC_API_URL", "https://ac.example.test")
    monkeypatch.setenv("LABS_AC_API_TOKEN", "tok-apply")
    monkeypatch.setattr(ac, "_sync_contact_with_fields", lambda *a, **k: "99")
    monkeypatch.setattr(
        ac,
        "_contact_field_values",
        lambda *a, **k: {
            fid: "held" for fid in ac.APPLY_FIELD_IDS.values() if fid != "3"
        },
    )
    tagged = {"n": 0}
    monkeypatch.setattr(ac, "_add_contact_tag", lambda *a, **k: tagged.__setitem__("n", tagged["n"] + 1))
    with pytest.raises(ac.ACError, match="3:hell"):
        ac.sync_apply("zzapply@labs.test", _answers_from_valid())
    assert tagged["n"] == 0


def test_sync_apply_api_error_raises(monkeypatch):
    monkeypatch.setenv("LABS_AC_API_URL", "https://ac.example.test")
    monkeypatch.setenv("LABS_AC_API_TOKEN", "tok-apply")

    def boom(cfg, email, answers):
        raise ac.ACError("AC HTTP 500 on POST /contact/sync: upstream")

    monkeypatch.setattr(ac, "_sync_contact_with_fields", boom)
    with pytest.raises(ac.ACError, match="500"):
        ac.sync_apply("zzapply@labs.test", _answers_from_valid())


def test_sync_lead_still_skips_when_unconfigured(monkeypatch):
    """Apply fail-loud must not change waitlist best-effort."""
    monkeypatch.delenv("LABS_AC_API_URL", raising=False)
    monkeypatch.delenv("LABS_AC_API_TOKEN", raising=False)
    monkeypatch.delenv("LABS_AC_REQUIRED", raising=False)
    assert ac.sync_lead("zztest-lead@labs.test")["status"] == "skipped"


# --- endpoint ---------------------------------------------------------------


def test_apply_endpoint_synced(apply_client, monkeypatch):
    seen: dict = {}

    def fake(email, answers):
        seen["email"] = email
        seen["answers"] = answers
        return {"status": "synced", "contact_id": "42", "tag_id": "18"}

    monkeypatch.setattr(ac, "sync_apply", fake)
    r = apply_client.post("/api/apply", json=VALID)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True
    assert body["contact_id"] == "42"
    assert body["tag_id"] == "18"
    assert seen["email"] == "zzapply@labs.test"
    assert seen["answers"]["coaching_sku"] == "Navigator $267/mo"
    assert seen["answers"]["eleven_am_et"] == "Yes"
    assert seen["answers"]["partner_support"] == "Yes"
    assert set(seen["answers"]) == set(ac.APPLY_FIELD_KEYS)


def test_apply_endpoint_ac_failure_is_not_success(apply_client, monkeypatch):
    def explode(*a, **k):
        raise ac.ACError("down")

    monkeypatch.setattr(ac, "sync_apply", explode)
    r = apply_client.post("/api/apply", json=VALID)
    assert r.status_code == 503, r.text
    detail = r.json()["detail"]
    assert detail["error"] == "ac_write_failed"
    assert "could not" in detail["message"].lower()
    assert "thank" not in detail["message"].lower()


def test_apply_endpoint_unconfigured_is_not_success(apply_client, monkeypatch):
    monkeypatch.delenv("LABS_AC_API_URL", raising=False)
    monkeypatch.delenv("LABS_AC_API_TOKEN", raising=False)
    monkeypatch.delenv("LABS_AC_REQUIRED", raising=False)
    r = apply_client.post("/api/apply", json=VALID)
    assert r.status_code == 503, r.text
    assert r.json()["detail"]["error"] == "ac_write_failed"


def test_apply_missing_email_400_no_ac_call(apply_client, monkeypatch):
    called = {"n": 0}

    def fake(*a, **k):
        called["n"] += 1
        return {"status": "synced", "contact_id": "1", "tag_id": "18"}

    monkeypatch.setattr(ac, "sync_apply", fake)
    payload = dict(VALID)
    payload["email"] = ""
    r = apply_client.post("/api/apply", json=payload)
    assert r.status_code == 400, r.text
    assert called["n"] == 0
    assert "email" in r.json()["detail"]["fields"]


def test_apply_missing_field_400(apply_client, monkeypatch):
    monkeypatch.setattr(
        ac,
        "sync_apply",
        lambda *a, **k: {"status": "synced", "contact_id": "1", "tag_id": "18"},
    )
    payload = dict(VALID)
    del payload["tried"]
    r = apply_client.post("/api/apply", json=payload)
    assert r.status_code == 400, r.text
    assert "tried" in r.json()["detail"]["fields"]


def test_apply_sku_rejects_unknown(apply_client, monkeypatch):
    monkeypatch.setattr(
        ac,
        "sync_apply",
        lambda *a, **k: {"status": "synced", "contact_id": "1", "tag_id": "18"},
    )
    payload = dict(VALID)
    payload["coaching_sku"] = "navigator-coaching"
    r = apply_client.post("/api/apply", json=payload)
    assert r.status_code == 400, r.text
    assert "coaching_sku" in r.json()["detail"]["fields"]


def test_apply_partner_rejects_free_text(apply_client, monkeypatch):
    monkeypatch.setattr(
        ac,
        "sync_apply",
        lambda *a, **k: {"status": "synced", "contact_id": "1", "tag_id": "18"},
    )
    payload = dict(VALID)
    payload["partner_support"] = "Spouse is on board."
    r = apply_client.post("/api/apply", json=payload)
    assert r.status_code == 400, r.text
    assert "partner_support" in r.json()["detail"]["fields"]


def test_apply_dropdown_strings_locked():
    assert ac.APPLY_SKU_VALUES == (
        "Observer $17/wk × 6",
        "Activator $97/mo",
        "Navigator $267/mo",
        "Annual $1,997",
    )
    assert ac.APPLY_YES_NO == ("Yes", "No")


def test_sync_apply_rejects_unknown_sku(monkeypatch):
    monkeypatch.setenv("LABS_AC_API_URL", "https://ac.example.test")
    monkeypatch.setenv("LABS_AC_API_TOKEN", "tok-apply")
    answers = _answers_from_valid()
    answers["coaching_sku"] = "navigator-coaching"
    with pytest.raises(ac.ACError, match="coaching_sku"):
        ac.sync_apply("zzapply@labs.test", answers)


def test_apply_eleven_am_rejects_maybe(apply_client, monkeypatch):
    monkeypatch.setattr(
        ac,
        "sync_apply",
        lambda *a, **k: {"status": "synced", "contact_id": "1", "tag_id": "18"},
    )
    payload = dict(VALID)
    payload["eleven_am_et"] = "maybe"
    r = apply_client.post("/api/apply", json=payload)
    assert r.status_code == 400, r.text
    assert "eleven_am_et" in r.json()["detail"]["fields"]


def test_apply_cors_fattail_ai(apply_client, monkeypatch):
    monkeypatch.setattr(
        ac,
        "sync_apply",
        lambda *a, **k: {"status": "synced", "contact_id": "1", "tag_id": "18"},
    )
    r = apply_client.post(
        "/api/apply",
        json=VALID,
        headers={"Origin": "https://fattail.ai"},
    )
    assert r.status_code == 200, r.text
    assert r.headers.get("access-control-allow-origin") == "https://fattail.ai"
    assert "POST" in (r.headers.get("access-control-allow-methods") or "")


def test_apply_cors_rejects_other_origin_header(apply_client, monkeypatch):
    monkeypatch.setattr(
        ac,
        "sync_apply",
        lambda *a, **k: {"status": "synced", "contact_id": "1", "tag_id": "18"},
    )
    r = apply_client.post(
        "/api/apply",
        json=VALID,
        headers={"Origin": "https://evil.example"},
    )
    assert r.status_code == 200, r.text
    assert r.headers.get("access-control-allow-origin") is None


def test_apply_options_preflight_fattail(apply_client):
    r = apply_client.options(
        "/api/apply",
        headers={
            "Origin": "https://fattail.ai",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert r.status_code == 204
    assert r.headers.get("access-control-allow-origin") == "https://fattail.ai"


def test_apply_skips_csrf():
    assert should_check_csrf(_fake_request()) is False


def test_apply_field_ids_locked():
    assert ac.APPLY_FIELD_IDS == {
        "hell": "3",
        "heaven": "4",
        "money_timing": "5",
        "coaching_sku": "6",
        "eleven_am_et": "7",
        "tried": "8",
        "partner_support": "9",
    }
    assert ac.APPLY_TAG_ID == "18"
    assert ac.APPLY_TAG_NAME == "Application Filled"
    assert set(ac.APPLY_FIELD_IDS.values()) == {"3", "4", "5", "6", "7", "8", "9"}
