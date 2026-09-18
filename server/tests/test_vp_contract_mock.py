"""VP API Contract v1.1 mock fidelity: F1, F2, F5, F8, GAPPED, STALE, 403, coverage."""

from __future__ import annotations

import os

os.environ["LABS_SA_DEV_VP_API_BASE"] = "mock://"

from sa_dev.vp_client import ContractMismatch, get_profile, get_range
from sa_dev.vp_contract_mock import ENVELOPE_KEYS, F1_BINS, F2_BINS, F5_BINS
from tests.conftest import cookie_for


def test_f1_gapped_bins_exact(client, admin_cookies):
    r = client.get(
        "/v1/profile/XSP/session",
        params={"source": "SPY", "session_date": "2026-09-16"},
        cookies=admin_cookies,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    for k in ENVELOPE_KEYS:
        assert k in body
    assert body["status"] == "GAPPED"
    assert body["flags"]["mapping"] == "OK"
    assert body["bins"] == F1_BINS
    assert body["gaps"]
    assert body["gaps"][0]["cause"] == "DISCONNECT"
    assert body["coverage"]["floor_session"] == "2026-09-16"
    assert body["coverage"]["ceiling_session"] == "2026-09-16"


def test_f2_zero_row_kept(client, admin_cookies):
    r = client.get(
        "/v1/profile/XSP/session",
        params={"source": "SPY", "session_date": "2026-09-15"},
        cookies=admin_cookies,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "COMPLETE"
    assert body["bins"] == F2_BINS
    by = {b["price"]: b["volume"] for b in body["bins"]}
    assert 640.20 in by and by[640.20] == 0


def test_f5_gapped(client, admin_cookies):
    r = client.get(
        "/v1/profile/XSP/session",
        params={"source": "SPY", "session_date": "2026-09-17"},
        cookies=admin_cookies,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "GAPPED"
    assert body["bins"] == F5_BINS
    assert body["gaps"][0]["to_ns"] - body["gaps"][0]["from_ns"] == 6 * 60 * 1_000_000_000


def test_mapping_stale_bins_still_served(client, admin_cookies):
    r = client.get(
        "/v1/profile/SPX/session",
        params={"source": "ES", "session_date": "2026-09-14"},
        cookies=admin_cookies,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["flags"]["mapping"] == "STALE"
    assert body["bins"]
    assert body["mapping"]["offset_published"] == 2.48


def test_member_403_computing_consumers_only(client):
    member = cookie_for("activator", identity_id=0)
    r = client.get("/v1/profile/XSP/session", cookies=member)
    assert r.status_code == 403
    assert r.json() == {"error": "computing_consumers_only"}


def test_unauthenticated_401(client):
    r = client.get("/v1/profile/XSP/session")
    assert r.status_code == 401
    assert r.json() == {"error": "unauthenticated"}


def test_f8_range_sums_two_sessions(client, admin_cookies):
    r = client.get(
        "/v1/profile/XSP/range",
        params={"from": "2026-09-15", "to": "2026-09-16"},
        cookies=admin_cookies,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["kind"] == "range"
    by = {b["price"]: b["volume"] for b in body["bins"]}
    assert by[640.00] == 10
    assert by[640.10] == 14
    assert by[640.20] == 7
    assert by[640.30] == 8
    assert body["gaps"]
    assert "coverage" in body


def test_range_below_coverage_is_422(client, admin_cookies):
    r = client.get(
        "/v1/profile/XSP/range",
        params={"from": "2017-04-01", "to": "2026-09-16"},
        cookies=admin_cookies,
    )
    assert r.status_code == 422
    assert r.json() == {
        "error": "range_below_coverage",
        "coverage_floor": "2026-09-15",
    }


def test_range_allow_partial_truncated(client, admin_cookies):
    r = client.get(
        "/v1/profile/XSP/range",
        params={
            "from": "2017-04-01",
            "to": "2026-09-16",
            "allow_partial": "true",
        },
        cookies=admin_cookies,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["coverage"]["truncated"] is True
    assert body["coverage"]["served_from"] == "2026-09-15"


def test_client_mock_base_validates_envelope():
    body = get_profile("XSP", "session", source="SPY", session_date="2026-09-16")
    assert body["bins"] == F1_BINS
    rng = get_range("XSP", from_date="2026-09-15", to_date="2026-09-16")
    assert rng["kind"] == "range"


def test_client_mismatch_on_missing_bins(monkeypatch):
    from sa_dev import vp_client as vc

    def bad(*_a, **_k):
        return {"target_symbol": "XSP"}

    monkeypatch.setattr(vc, "resolve_profile", bad)
    try:
        get_profile("XSP", "session", source="SPY")
        raise AssertionError("expected ContractMismatch")
    except ContractMismatch as exc:
        assert "missing keys" in str(exc)
