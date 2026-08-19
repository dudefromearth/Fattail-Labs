"""Characterization tests — native apply write (seven AC fields + tag 18).

Spec: FatTail-Native-Apply-Form-Spec-v0.1.md

Does not inherit waitlist sync_lead(). No live AC calls — primitives mocked.
"""

from __future__ import annotations

import sys
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parents[1]
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

import apply_ac
import activecampaign as ac


SEVEN = {
    "HELL": "bleeding on weeklies",
    "HEAVEN": "keep the book",
    "MONEY_TIMING": "ready this month",
    "COACHING_SKU": "navigator",
    "ELEVEN_AM_ET": "yes",
    "TRIED": "solo youtube",
    "PARTNER_SUPPORT": "spouse is in",
}


def _answers(**overrides):
    out = dict(SEVEN)
    out.update(overrides)
    return out


# --- config gating (apply never skips) ---------------------------------------


def test_apply_unconfigured_fails_loud(monkeypatch):
    monkeypatch.delenv("LABS_AC_API_URL", raising=False)
    monkeypatch.delenv("LABS_AC_API_TOKEN", raising=False)
    monkeypatch.delenv("LABS_AC_REQUIRED", raising=False)
    try:
        apply_ac.write_application("zztest-apply@labs.test", _answers())
        raise AssertionError("expected ACError")
    except ac.ACError as exc:
        assert "not configured" in str(exc)


def test_apply_half_config_fails_loud(monkeypatch):
    monkeypatch.setenv("LABS_AC_API_URL", "https://0dte.api-us1.com")
    monkeypatch.delenv("LABS_AC_API_TOKEN", raising=False)
    try:
        apply_ac.write_application("zztest-apply@labs.test", _answers())
        raise AssertionError("expected ACError")
    except ac.ACError as exc:
        assert "half-configured" in str(exc)


def test_apply_empty_email_fails():
    try:
        apply_ac.write_application("  ", _answers())
        raise AssertionError("expected ACError")
    except ac.ACError as exc:
        assert "empty email" in str(exc)


def test_apply_missing_field_fails_before_write(monkeypatch):
    monkeypatch.setenv("LABS_AC_API_URL", "https://0dte.api-us1.com")
    monkeypatch.setenv("LABS_AC_API_TOKEN", "tok-123")
    called = {"sync": False}

    def boom(*_a, **_k):
        called["sync"] = True
        raise AssertionError("must not touch AC when a Cole field is empty")

    monkeypatch.setattr(apply_ac, "_sync_contact", boom)
    incomplete = _answers()
    del incomplete["TRIED"]
    try:
        apply_ac.write_application("zztest-apply@labs.test", incomplete)
        raise AssertionError("expected ACError")
    except ac.ACError as exc:
        assert "TRIED" in str(exc)
    assert called["sync"] is False


def test_apply_does_not_call_sync_lead(monkeypatch):
    monkeypatch.setenv("LABS_AC_API_URL", "https://0dte.api-us1.com")
    monkeypatch.setenv("LABS_AC_API_TOKEN", "tok-123")
    monkeypatch.setattr(ac, "sync_lead", lambda *a, **k: (_ for _ in ()).throw(
        AssertionError("apply must not inherit sync_lead()")
    ))

    store = {"fields": {}, "tags": []}

    def fake_sync(_cfg, email):
        return "99"

    def fake_request(_cfg, method, path, **kwargs):
        if method == "GET" and path.endswith("/fieldValues"):
            return {
                "fieldValues": [
                    {"id": fid, "field": fid, "value": store["fields"].get(fid, "")}
                    for fid in apply_ac.APPLY_FIELD_IDS.values()
                    if fid in store["fields"]
                ]
            }
        if method == "POST" and path == "/fieldValues":
            fv = (kwargs.get("json") or {})["fieldValue"]
            store["fields"][str(fv["field"])] = fv["value"]
            return {"fieldValue": {"id": fv["field"], **fv}}
        if method == "PUT" and path.startswith("/fieldValues/"):
            fv = (kwargs.get("json") or {})["fieldValue"]
            store["fields"][str(fv["field"])] = fv["value"]
            return {"fieldValue": fv}
        if method == "GET" and path.endswith("/contactTags"):
            return {
                "contactTags": [
                    {"tag": tid, "contact": "99"} for tid in store["tags"]
                ]
            }
        raise AssertionError(f"unexpected AC call {method} {path}")

    def fake_add_tag(_cfg, cid, tid):
        store["tags"].append(str(tid))

    monkeypatch.setattr(apply_ac, "_sync_contact", fake_sync)
    monkeypatch.setattr(apply_ac, "_request", fake_request)
    monkeypatch.setattr(apply_ac, "_add_contact_tag", fake_add_tag)

    out = apply_ac.write_application("ZZTest-Apply@Labs.test", _answers())
    assert out["ok"] is True
    assert out["contact_id"] == "99"
    assert out["tag_id"] == "18"
    assert store["fields"] == {
        "3": SEVEN["HELL"],
        "4": SEVEN["HEAVEN"],
        "5": SEVEN["MONEY_TIMING"],
        "6": SEVEN["COACHING_SKU"],
        "7": SEVEN["ELEVEN_AM_ET"],
        "8": SEVEN["TRIED"],
        "9": SEVEN["PARTNER_SUPPORT"],
    }
    assert store["tags"] == ["18"]


def test_apply_tag_miss_is_not_success(monkeypatch):
    monkeypatch.setenv("LABS_AC_API_URL", "https://0dte.api-us1.com")
    monkeypatch.setenv("LABS_AC_API_TOKEN", "tok-123")
    store = {"fields": {fid: SEVEN[k] for k, fid in apply_ac.APPLY_FIELD_IDS.items()}}

    monkeypatch.setattr(apply_ac, "_sync_contact", lambda *_: "99")
    monkeypatch.setattr(apply_ac, "_add_contact_tag", lambda *_: None)

    def fake_request(_cfg, method, path, **kwargs):
        if method == "GET" and path.endswith("/fieldValues"):
            return {
                "fieldValues": [
                    {"field": fid, "value": val} for fid, val in store["fields"].items()
                ]
            }
        if method in ("POST", "PUT"):
            return {}
        if method == "GET" and path.endswith("/contactTags"):
            return {"contactTags": []}
        raise AssertionError(f"unexpected {method} {path}")

    monkeypatch.setattr(apply_ac, "_request", fake_request)
    try:
        apply_ac.write_application("zztest-apply@labs.test", _answers())
        raise AssertionError("expected ACError")
    except ac.ACError as exc:
        assert "tag 18" in str(exc)


def test_apply_field_miss_is_not_success(monkeypatch):
    monkeypatch.setenv("LABS_AC_API_URL", "https://0dte.api-us1.com")
    monkeypatch.setenv("LABS_AC_API_TOKEN", "tok-123")
    store = {fid: SEVEN[k] for k, fid in apply_ac.APPLY_FIELD_IDS.items()}
    store["8"] = ""  # TRIED empty on read-back

    monkeypatch.setattr(apply_ac, "_sync_contact", lambda *_: "99")
    monkeypatch.setattr(apply_ac, "_add_contact_tag", lambda *_: None)

    def fake_request(_cfg, method, path, **kwargs):
        if method == "GET" and path.endswith("/fieldValues"):
            return {
                "fieldValues": [
                    {"field": fid, "value": val} for fid, val in store.items()
                ]
            }
        if method in ("POST", "PUT"):
            return {}
        if method == "GET" and path.endswith("/contactTags"):
            return {"contactTags": [{"tag": "18"}]}
        raise AssertionError(f"unexpected {method} {path}")

    monkeypatch.setattr(apply_ac, "_request", fake_request)
    try:
        apply_ac.write_application("zztest-apply@labs.test", _answers())
        raise AssertionError("expected ACError")
    except ac.ACError as exc:
        assert "TRIED" in str(exc)


# --- HTTP surface (standalone app — does not boot Labs DB / waitlist) --------


def _apply_client():
    """Tiny app so apply characterization does not inherit waitlist fixtures."""
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from routes.apply import router

    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


def test_api_apply_success(monkeypatch):
    monkeypatch.setattr(
        "routes.apply.write_application",
        lambda email, answers: {
            "ok": True,
            "contact_id": "99",
            "tag_id": "18",
            "fields": apply_ac.APPLY_FIELD_IDS,
        },
    )
    r = _apply_client().post("/api/apply", json={"email": "zztest-apply@labs.test", **SEVEN})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True
    assert body["contact_id"] == "99"
    assert body["tag_id"] == "18"


def test_api_apply_empty_email_is_422_and_does_not_write(monkeypatch):
    called = {"n": 0}

    def boom(*_a, **_k):
        called["n"] += 1
        raise AssertionError("no AC write without email")

    monkeypatch.setattr("routes.apply.write_application", boom)
    r = _apply_client().post("/api/apply", json={"email": "", **SEVEN})
    assert r.status_code == 422
    assert called["n"] == 0


def test_api_apply_partner_optional_when_eleven_no(monkeypatch):
    captured = {}

    def capture(email, answers):
        captured["email"] = email
        captured["answers"] = answers
        return {
            "ok": True,
            "contact_id": "99",
            "tag_id": "18",
            "fields": apply_ac.APPLY_FIELD_IDS,
        }

    monkeypatch.setattr("routes.apply.write_application", capture)
    payload = dict(SEVEN)
    payload["ELEVEN_AM_ET"] = "no"
    payload["PARTNER_SUPPORT"] = ""
    r = _apply_client().post(
        "/api/apply", json={"email": "zztest-apply@labs.test", **payload}
    )
    assert r.status_code == 200, r.text
    assert captured["answers"]["ELEVEN_AM_ET"] == "no"
    assert captured["answers"]["PARTNER_SUPPORT"] == ""


def test_api_apply_partner_required_when_eleven_yes(monkeypatch):
    monkeypatch.setattr(
        "routes.apply.write_application",
        lambda *_a, **_k: (_ for _ in ()).throw(AssertionError("no write")),
    )
    payload = dict(SEVEN)
    payload["PARTNER_SUPPORT"] = ""
    r = _apply_client().post(
        "/api/apply", json={"email": "zztest-apply@labs.test", **payload}
    )
    assert r.status_code == 422
    assert "PARTNER_SUPPORT" in r.json()["detail"]


def test_write_drops_partner_when_eleven_no(monkeypatch):
    monkeypatch.setenv("LABS_AC_API_URL", "https://0dte.api-us1.com")
    monkeypatch.setenv("LABS_AC_API_TOKEN", "tok-123")
    store = {"fields": {}, "tags": []}

    def fake_request(_cfg, method, path, **kwargs):
        if method == "GET" and path.endswith("/fieldValues"):
            return {
                "fieldValues": [
                    {"id": fid, "field": fid, "value": store["fields"].get(fid, "")}
                    for fid in apply_ac.APPLY_FIELD_IDS.values()
                    if fid in store["fields"]
                ]
            }
        if method == "POST" and path == "/fieldValues":
            fv = (kwargs.get("json") or {})["fieldValue"]
            store["fields"][str(fv["field"])] = fv["value"]
            return {"fieldValue": {"id": fv["field"], **fv}}
        if method == "PUT" and path.startswith("/fieldValues/"):
            fv = (kwargs.get("json") or {})["fieldValue"]
            store["fields"][str(fv["field"])] = fv["value"]
            return {"fieldValue": fv}
        if method == "GET" and path.endswith("/contactTags"):
            return {
                "contactTags": [
                    {"tag": tid, "contact": "99"} for tid in store["tags"]
                ]
            }
        raise AssertionError(f"unexpected AC call {method} {path}")

    monkeypatch.setattr(apply_ac, "_sync_contact", lambda *_: "99")
    monkeypatch.setattr(apply_ac, "_request", fake_request)
    monkeypatch.setattr(apply_ac, "_add_contact_tag", lambda *_c, **_k: store["tags"].append("18"))

    out = apply_ac.write_application(
        "zztest-apply@labs.test",
        _answers(ELEVEN_AM_ET="no", PARTNER_SUPPORT="stale spouse"),
    )
    assert out["ok"] is True
    assert store["fields"]["7"] == "no"
    assert store["fields"]["9"] == ""


def test_api_apply_missing_cole_field_is_422(monkeypatch):
    monkeypatch.setattr(
        "routes.apply.write_application",
        lambda *_a, **_k: (_ for _ in ()).throw(AssertionError("no write")),
    )
    payload = dict(SEVEN)
    del payload["HEAVEN"]
    r = _apply_client().post(
        "/api/apply", json={"email": "zztest-apply@labs.test", **payload}
    )
    assert r.status_code == 422
    assert "HEAVEN" in r.json()["detail"]


def test_api_apply_ac_miss_is_not_success(monkeypatch):
    def miss(email, answers):
        raise ac.ACError("apply tag 18 Application Filled miss after write")

    monkeypatch.setattr("routes.apply.write_application", miss)
    r = _apply_client().post("/api/apply", json={"email": "zztest-apply@labs.test", **SEVEN})
    assert r.status_code == 503
    assert r.json().get("ok") is not True
    assert "tag 18" in r.json()["detail"]


def test_api_apply_unconfigured_is_not_success(monkeypatch):
    monkeypatch.delenv("LABS_AC_API_URL", raising=False)
    monkeypatch.delenv("LABS_AC_API_TOKEN", raising=False)
    monkeypatch.delenv("LABS_AC_REQUIRED", raising=False)
    r = _apply_client().post("/api/apply", json={"email": "zztest-apply@labs.test", **SEVEN})
    assert r.status_code == 503
    assert "not configured" in r.json()["detail"]
