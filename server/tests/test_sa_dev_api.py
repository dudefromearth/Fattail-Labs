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


def test_include_bins_opt_in_for_display(client, admin_cookies):
    r = client.get(
        "/api/dev/sa/v1/structure/XSP",
        params={
            "source": "SPY",
            "session_date": "2026-09-16",
            "include_bins": "true",
        },
        cookies=admin_cookies,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["bins"]
    assert len(body["bins"]) == body["bin_count"]


def test_sessionless_structure_opt_in_variants(client, admin_cookies):
    off = client.get(
        "/api/dev/sa/v1/structure/XSP",
        params={"source": "SPY", "harness": "fixture"},
        cookies=admin_cookies,
    )
    assert off.status_code == 200, off.text
    body = off.json()
    assert "bins" not in body
    assert body["session_date"] == "2026-09-16"
    on = client.get(
        "/api/dev/sa/v1/structure/XSP",
        params={"source": "SPY", "harness": "fixture", "include_bins": "true"},
        cookies=admin_cookies,
    )
    assert on.status_code == 200, on.text
    assert on.json()["bins"]
    assert on.json()["session_date"] == "2026-09-16"


def test_bins_leaked_is_422_not_500(client, admin_cookies, monkeypatch):
    from routes import sa_dev as route

    def leak(*_a, **_k):
        return {"bins": [{"price": 1, "volume": 1}], "session_date": "x"}

    monkeypatch.setattr(route, "structure_for", leak)
    r = client.get(
        "/api/dev/sa/v1/structure/XSP",
        params={"source": "SPY", "harness": "fixture"},
        cookies=admin_cookies,
    )
    assert r.status_code == 422, r.text
    assert r.json()["error"] == "BINS_LEAKED"
    assert r.status_code != 500


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


def test_health_flattens_mock_coverage(client, admin_cookies):
    r = client.get("/api/dev/sa/v1/health", cookies=admin_cookies)
    assert r.status_code == 200, r.text
    cov = r.json()["coverage"]
    assert cov["SPY"]["floor_session"] == "2026-09-15"
    assert cov["SPY"]["ceiling_session"] == "2026-09-17"


def test_range_fixture_full_history(client, admin_cookies):
    r = client.get(
        "/api/dev/sa/v1/range/XSP",
        params={
            "from": "2026-09-15",
            "to": "2026-09-16",
            "source": "SPY",
            "harness": "fixture",
            "price_lo": 640.0,
            "price_hi": 640.3,
            "row": 0.1,
        },
        cookies=admin_cookies,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["kind"] == "range"
    assert body["bins"]
    assert body["bin_count"] == len(body["bins"])
    by = {b["price"]: b["volume"] for b in body["bins"]}
    assert by[640.0] == 10
    assert by[640.1] == 14


def test_range_member_denied(client):
    member = cookie_for("activator", identity_id=0)
    r = client.get(
        "/api/dev/sa/v1/range/XSP",
        params={"from": "2026-09-15", "to": "2026-09-16"},
        cookies=member,
    )
    assert r.status_code == 403


def test_bars_from_prints_are_source_space():
    from sa_dev.service import bar_invariant, bars_from_prints

    rows = [
        {"p": 7700.0, "t": 1_789_647_000_000, "s": 2, "contract": "ESZ6"},
        {"p": 7701.5, "t": 1_789_647_010_000, "s": 1, "contract": "ESZ6"},
        {"p": 7699.25, "t": 1_789_647_200_000, "s": 3, "contract": "ESZ6"},
    ]
    bars, gaps, contract, rule = bars_from_prints(rows, tf="5m")
    assert contract == "ESZ6"
    assert rule == "volume_only"
    assert bars
    assert not gaps
    assert bars[0]["o"] == 7700.0
    assert bars[0]["h"] == 7701.5
    assert bars[0]["l"] == 7699.25
    assert bars[-1]["c"] in (7701.5, 7699.25)
    assert all(bar_invariant(b) for b in bars)


def test_ohlc_does_not_mix_front_and_next_month():
    """Golden: ESU6 lows must not become ESZ6 wicks (Coach common-floor defect)."""
    from sa_dev.service import bars_from_prints

    t0 = 1_789_727_400_000
    rows = [
        {"p": 7719.25, "t": t0, "s": 10, "contract": "ESZ6"},
        {"p": 7652.25, "t": t0 + 400, "s": 2, "contract": "ESU6"},
        {"p": 7720.0, "t": t0 + 2000, "s": 8, "contract": "ESZ6"},
        {"p": 7653.0, "t": t0 + 3000, "s": 1, "contract": "ESU6"},
        {"p": 7721.0, "t": t0 + 4000, "s": 12, "contract": "ESZ6"},
    ]
    bars, gaps, contract, rule = bars_from_prints(rows, tf="5m")
    assert contract == "ESZ6"
    assert rule == "volume_only"
    assert not gaps
    assert len(bars) == 1
    b = bars[0]
    assert b["o"] == 7719.25
    assert b["c"] == 7721.0
    assert b["h"] == 7721.0
    assert b["l"] == 7719.25
    assert b["l"] > 7700


def test_structure_etag_304(client, admin_cookies):
    r = client.get(
        "/api/dev/sa/v1/structure/XSP",
        params={"source": "SPY", "session_date": "2026-09-16", "harness": "fixture"},
        cookies=admin_cookies,
    )
    assert r.status_code == 200, r.text
    etag = r.headers.get("etag")
    assert etag
    hit = client.get(
        "/api/dev/sa/v1/structure/XSP",
        params={"source": "SPY", "session_date": "2026-09-16", "harness": "fixture"},
        cookies=admin_cookies,
        headers={"If-None-Match": etag},
    )
    assert hit.status_code == 304
    assert hit.headers.get("etag") == etag


def test_source_ohlc_member_denied(client):
    member = cookie_for("activator", identity_id=0)
    r = client.get("/api/dev/sa/v1/ohlc/ES", cookies=member)
    assert r.status_code == 403
