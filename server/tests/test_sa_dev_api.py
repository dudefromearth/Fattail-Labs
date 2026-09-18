"""SA-DEV structure over the VP contract mock. No bins on the canvas path."""

from __future__ import annotations

import os

os.environ["LABS_SA_DEV_VP_API_BASE"] = "mock://"

from tests.conftest import cookie_for


def test_structure_from_f1_mock_no_bins(client, admin_cookies):
    r = client.get(
        "/api/dev/sa/v1/structure/XSP",
        params={"source": "SPY", "session_date": "2026-09-16"},
        cookies=admin_cookies,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert "bins" not in body
    assert body["caption"].startswith("Structure computed from traded volume")
    assert "Not a forecast." in body["caption"]
    assert body["status"] == "GAPPED"
    assert body["flags"]["mapping"] == "OK"
    assert body["vp_api_base"] == "mock://"
    for key in (
        "replay",
        "footprint",
        "market_delta",
        "gex_overlay",
        "characterization",
        "exploration",
    ):
        assert body[key] == "UNSERVED"


def test_structure_stale_mapping_passthrough(client, admin_cookies):
    r = client.get(
        "/api/dev/sa/v1/structure/SPX",
        params={"source": "ES", "session_date": "2026-09-14"},
        cookies=admin_cookies,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert "bins" not in body
    assert body["flags"]["mapping"] == "STALE"


def test_member_denied_structure_even_in_dev(client):
    member = cookie_for("activator", identity_id=0)
    s = client.get("/api/dev/sa/v1/structure/XSP", cookies=member)
    assert s.status_code == 403


def test_health_points_at_mock(client, admin_cookies):
    r = client.get("/api/dev/sa/v1/health", cookies=admin_cookies)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["vp_api_base"] == "mock://"
    assert body["dev_only"] is True
    assert body["collector_store"] == "READ-ONLY"


def test_live_harness_waits_when_base_is_mock(client, admin_cookies):
    r = client.get(
        "/api/dev/sa/v1/structure/SPX",
        params={"source": "ES", "harness": "live"},
        cookies=admin_cookies,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["named_state"] == "WAITING FOR LIVE COVERAGE"
    assert "bins" not in body


def test_coverage_response_is_named_not_invented():
    from sa_dev import service as svc

    def cov(*_a, **_k):
        return {"error": "coverage", "coverage": {"from": "2017-04-01", "have": "2026-09-17"}}

    orig = svc.get_profile
    svc.get_profile = cov  # type: ignore[method-assign]
    try:
        out = svc.structure_for("SPX", source="ES", harness="fixture")
    finally:
        svc.get_profile = orig  # type: ignore[method-assign]
    assert out["named_state"] == "COVERAGE"
    assert "bins" not in out
    assert out["coverage"]["from"] == "2017-04-01"


def test_health_live_coverage_false_on_mock(client, admin_cookies):
    r = client.get("/api/dev/sa/v1/health", cookies=admin_cookies)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["live_coverage"] is False
    assert body.get("mock") is True


def test_store_read_never_writable():
    from sa_dev.store_read import ingest_writable

    assert ingest_writable() is False
