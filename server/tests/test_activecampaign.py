"""Characterization tests — ActiveCampaign waitlist lead sync.

Spec: FatTail-Labs-ActiveCampaign-Lead-Sync-Spec-v1.0.

No live AC calls: the AC v3 primitives (_sync_contact / _get_or_create_tag /
_add_contact_tag) or sync_lead itself are monkeypatched. Endpoint tests create
their own gate + email rows and delete them afterwards.
"""

from __future__ import annotations

import activecampaign as ac
import db


# --- config gating -----------------------------------------------------------


def test_disabled_when_unconfigured(monkeypatch):
    monkeypatch.delenv("LABS_AC_API_URL", raising=False)
    monkeypatch.delenv("LABS_AC_API_TOKEN", raising=False)
    monkeypatch.delenv("LABS_AC_REQUIRED", raising=False)
    assert ac._ac_config() is None
    assert ac.sync_lead("zztest-lead@labs.test")["status"] == "skipped"


def test_half_config_fails_loud(monkeypatch):
    monkeypatch.setenv("LABS_AC_API_URL", "https://0dte.api-us1.com")
    monkeypatch.delenv("LABS_AC_API_TOKEN", raising=False)
    monkeypatch.delenv("LABS_AC_REQUIRED", raising=False)
    # sync_lead swallows the ACError into a failed status (never raises).
    out = ac.sync_lead("zztest-lead@labs.test")
    assert out["status"] == "failed"
    assert "half-configured" in out["error"]


def test_required_but_unconfigured_fails(monkeypatch):
    monkeypatch.delenv("LABS_AC_API_URL", raising=False)
    monkeypatch.delenv("LABS_AC_API_TOKEN", raising=False)
    monkeypatch.setenv("LABS_AC_REQUIRED", "1")
    out = ac.sync_lead("zztest-lead@labs.test")
    assert out["status"] == "failed"
    assert "LABS_AC_REQUIRED" in out["error"]


def test_config_shape_when_set(monkeypatch):
    monkeypatch.setenv("LABS_AC_API_URL", "https://0dte.api-us1.com/")
    monkeypatch.setenv("LABS_AC_API_TOKEN", "tok-123")
    monkeypatch.delenv("LABS_AC_LEAD_TAG", raising=False)
    cfg = ac._ac_config()
    assert cfg is not None
    assert cfg["base"] == "https://0dte.api-us1.com/api/3"  # trailing slash trimmed
    assert cfg["lead_tag"] == "Labs Lead"  # default
    assert cfg["timeout"] == ac.DEFAULT_TIMEOUT_SECONDS


# --- happy path (primitives mocked) ------------------------------------------


def test_sync_lead_synced(monkeypatch):
    monkeypatch.setenv("LABS_AC_API_URL", "https://0dte.api-us1.com")
    monkeypatch.setenv("LABS_AC_API_TOKEN", "tok-123")
    calls: dict = {}

    def fake_sync_contact(cfg, email):
        calls["email"] = email
        return "42"

    def fake_get_tag(cfg, name):
        calls["tag"] = name
        return "7"

    def fake_add_tag(cfg, cid, tid):
        calls["pair"] = (cid, tid)

    monkeypatch.setattr(ac, "_sync_contact", fake_sync_contact)
    monkeypatch.setattr(ac, "_get_or_create_tag", fake_get_tag)
    monkeypatch.setattr(ac, "_add_contact_tag", fake_add_tag)

    out = ac.sync_lead("ZZTest-Lead@Labs.test", source="gate", surface_key="home")
    assert out == {"status": "synced", "contact_id": "42", "tag_id": "7"}
    assert calls["email"] == "zztest-lead@labs.test"  # normalized lower
    assert calls["tag"] == "Labs Lead"
    assert calls["pair"] == ("42", "7")


def test_sync_lead_api_error_is_failed(monkeypatch):
    monkeypatch.setenv("LABS_AC_API_URL", "https://0dte.api-us1.com")
    monkeypatch.setenv("LABS_AC_API_TOKEN", "tok-123")

    def boom(cfg, email):
        raise ac.ACError("AC HTTP 500 on POST /contact/sync: upstream")

    monkeypatch.setattr(ac, "_sync_contact", boom)
    out = ac.sync_lead("zztest-lead@labs.test")
    assert out["status"] == "failed"
    assert "500" in out["error"]


def test_custom_tag_name(monkeypatch):
    monkeypatch.setenv("LABS_AC_API_URL", "https://0dte.api-us1.com")
    monkeypatch.setenv("LABS_AC_API_TOKEN", "tok-123")
    monkeypatch.setenv("LABS_AC_LEAD_TAG", "Labs Beta Lead")
    seen: dict = {}

    def fake_get_tag(cfg, name):
        seen["tag"] = name
        return "9"

    monkeypatch.setattr(ac, "_sync_contact", lambda cfg, email: "42")
    monkeypatch.setattr(ac, "_get_or_create_tag", fake_get_tag)
    monkeypatch.setattr(ac, "_add_contact_tag", lambda cfg, cid, tid: None)
    ac.sync_lead("zztest-lead@labs.test")
    assert seen["tag"] == "Labs Beta Lead"


# --- endpoint integration (waitlist push + status persistence) ---------------

WL_SURFACE = "course"  # KNOWN_SURFACE not prominently seeded; test owns this gate
WL_EMAIL = "zztest-waitlist@labs.test"


def _make_gate(client, admin_cookies):
    """Create/enable a collect_email gate on WL_SURFACE with a far-future open."""
    r = client.put(
        f"/api/admin/feature-gates/{WL_SURFACE}",
        cookies=admin_cookies,
        json={
            "enabled": True,
            "collect_email": True,
            "opens_at": "2099-01-01T00:00:00Z",
            "headline": "zztest gate",
        },
    )
    assert r.status_code == 200, r.text


def _cleanup_gate(client, admin_cookies):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM feature_gate_emails WHERE surface_key = %s AND email = %s",
                (WL_SURFACE, WL_EMAIL),
            )
    client.put(
        f"/api/admin/feature-gates/{WL_SURFACE}",
        cookies=admin_cookies,
        json={"enabled": False, "collect_email": False},
    )


def _ac_row_status():
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT ac_status, ac_error, ac_synced_at
                   FROM feature_gate_emails
                   WHERE surface_key = %s AND email = %s""",
                (WL_SURFACE, WL_EMAIL),
            )
            return cur.fetchone()


def test_waitlist_records_synced_status(client, admin_cookies, monkeypatch):
    monkeypatch.setattr(
        "activecampaign.sync_lead",
        lambda email, **kw: {"status": "synced", "contact_id": "1", "tag_id": "1"},
    )
    _make_gate(client, admin_cookies)
    try:
        r = client.post(
            f"/api/feature-gates/{WL_SURFACE}/waitlist",
            json={"email": WL_EMAIL, "source": "gate"},
        )
        assert r.status_code == 200, r.text
        assert r.json()["ok"] is True
        row = _ac_row_status()
        assert row["ac_status"] == "synced"
        assert row["ac_synced_at"] is not None
    finally:
        _cleanup_gate(client, admin_cookies)


def test_waitlist_survives_ac_failure(client, admin_cookies, monkeypatch):
    # AC push blows up hard — the waitlist submit must still succeed (200) and
    # the email must still be captured, recorded as failed.
    def explode(email, **kw):
        raise RuntimeError("AC totally down")

    monkeypatch.setattr("activecampaign.sync_lead", explode)
    _make_gate(client, admin_cookies)
    try:
        r = client.post(
            f"/api/feature-gates/{WL_SURFACE}/waitlist",
            json={"email": WL_EMAIL, "source": "gate"},
        )
        assert r.status_code == 200, r.text
        row = _ac_row_status()
        assert row is not None  # email captured despite AC failure
        assert row["ac_status"] == "failed"
    finally:
        _cleanup_gate(client, admin_cookies)


def test_waitlist_skipped_when_ac_disabled(client, admin_cookies, monkeypatch):
    monkeypatch.delenv("LABS_AC_API_URL", raising=False)
    monkeypatch.delenv("LABS_AC_API_TOKEN", raising=False)
    monkeypatch.delenv("LABS_AC_REQUIRED", raising=False)
    _make_gate(client, admin_cookies)
    try:
        r = client.post(
            f"/api/feature-gates/{WL_SURFACE}/waitlist",
            json={"email": WL_EMAIL, "source": "gate"},
        )
        assert r.status_code == 200, r.text
        row = _ac_row_status()
        assert row["ac_status"] == "skipped"
    finally:
        _cleanup_gate(client, admin_cookies)
