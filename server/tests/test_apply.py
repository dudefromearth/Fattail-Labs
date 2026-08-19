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
    "ELEVEN_AM_ET": "2026-08-25T11:00",
    "TRIED": "solo youtube",
    "PARTNER_SUPPORT": "spouse is in",
}


def _answers(**overrides):
    out = dict(SEVEN)
    out.update(overrides)
    return out


def _seed_questions():
    rows = [
        {
            "id": 1,
            "slug": "intro",
            "ask": "Intro",
            "hint": "",
            "qtype": "continue",
            "options": [],
            "ac_key": None,
            "ac_field_id": None,
            "is_email": False,
            "sort_order": 10,
        },
        {
            "id": 2,
            "slug": "email",
            "ask": "Email",
            "hint": "",
            "qtype": "free_text",
            "options": [],
            "ac_key": None,
            "ac_field_id": None,
            "is_email": True,
            "sort_order": 20,
        },
    ]
    for i, (key, fid) in enumerate(
        [
            ("HEAVEN", "4"),
            ("HELL", "3"),
            ("MONEY_TIMING", "5"),
            ("COACHING_SKU", "6"),
            ("ELEVEN_AM_ET", "7"),
            ("TRIED", "8"),
            ("PARTNER_SUPPORT", "9"),
        ],
        start=3,
    ):
        rows.append(
            {
                "id": i,
                "slug": key,
                "ask": key,
                "hint": "",
                "qtype": "calendar" if key == "ELEVEN_AM_ET" else "free_text",
                "options": [],
                "ac_key": key,
                "ac_field_id": fid,
                "is_email": False,
                "sort_order": i * 10,
            }
        )
    return rows


def _form_ok(monkeypatch):
    monkeypatch.setattr("routes.apply.list_all", _seed_questions)
    monkeypatch.setattr(
        "routes.apply.list_live",
        lambda: [
            {"id": 1, "starts_et": SEVEN["ELEVEN_AM_ET"], "live": True}
        ],
    )
    monkeypatch.setattr("routes.apply.store_submission", lambda *_a, **_k: 1)
    monkeypatch.setattr(
        "routes.apply.is_live_when",
        lambda when, host=None: (when or "").strip() == SEVEN["ELEVEN_AM_ET"],
    )


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


def test_form_public_returns_questions_and_slots(monkeypatch):
    _form_ok(monkeypatch)
    r = _apply_client().get("/api/apply/form")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True
    slugs = [q["slug"] for q in body["questions"]]
    assert slugs[0] == "intro"
    assert "email" in slugs
    assert "ELEVEN_AM_ET" in slugs
    assert "ac_field_id" not in body["questions"][0]
    assert "ac_key" not in body["questions"][0]
    assert body["slots"] == [
        {"id": 1, "starts_et": SEVEN["ELEVEN_AM_ET"], "host": "coach"}
    ]
    assert body["score"]["endings_live"] is False
    assert body["score"]["trial_url"] == "https://fattail.ai/try"


def test_api_apply_success(monkeypatch):
    _form_ok(monkeypatch)
    monkeypatch.setattr(
        "routes.apply.write_application",
        lambda email, answers, mapped_keys=None: {
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

    _form_ok(monkeypatch)
    monkeypatch.setattr("routes.apply.write_application", boom)
    r = _apply_client().post("/api/apply", json={"email": "", **SEVEN})
    assert r.status_code == 422
    assert called["n"] == 0


def test_api_apply_partner_required(monkeypatch):
    _form_ok(monkeypatch)
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


def test_api_apply_rejects_yesno_eleven(monkeypatch):
    _form_ok(monkeypatch)
    monkeypatch.setattr(
        "routes.apply.write_application",
        lambda *_a, **_k: (_ for _ in ()).throw(AssertionError("no write")),
    )
    payload = dict(SEVEN)
    payload["ELEVEN_AM_ET"] = "yes"
    r = _apply_client().post(
        "/api/apply", json={"email": "zztest-apply@labs.test", **payload}
    )
    assert r.status_code == 422
    detail = r.json()["detail"].lower()
    assert "date-time" in detail or "listed" in detail


def test_api_apply_missing_cole_field_is_422(monkeypatch):
    _form_ok(monkeypatch)
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
    def miss(email, answers, mapped_keys=None):
        raise ac.ACError("apply tag 18 Application Filled miss after write")

    _form_ok(monkeypatch)
    monkeypatch.setattr("routes.apply.write_application", miss)
    r = _apply_client().post("/api/apply", json={"email": "zztest-apply@labs.test", **SEVEN})
    assert r.status_code == 503
    assert r.json().get("ok") is not True
    assert "tag 18" in r.json()["detail"]


def test_api_apply_unconfigured_is_not_success(monkeypatch):
    _form_ok(monkeypatch)
    monkeypatch.delenv("LABS_AC_API_URL", raising=False)
    monkeypatch.delenv("LABS_AC_API_TOKEN", raising=False)
    monkeypatch.delenv("LABS_AC_REQUIRED", raising=False)
    r = _apply_client().post("/api/apply", json={"email": "zztest-apply@labs.test", **SEVEN})
    assert r.status_code == 503
    assert "not configured" in r.json()["detail"]
