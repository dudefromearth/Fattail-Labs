"""Member display path — Data-Delivery D4/D5."""

import pytest

from tests.conftest import cookie_for


@pytest.fixture(autouse=True)
def _history_inprocess(monkeypatch):
    monkeypatch.setenv("LABS_HISTORY_API_BASE", "inprocess")


def test_vp_display_unauth(client):
    r = client.get("/api/app/vp/v1/health")
    assert r.status_code == 401


def test_member_ohlc_hops_not_print_path(client, probe_identity, monkeypatch):
    """Live member OHLC uses StudioOne history, never ohlc_for_source."""
    from starlette.responses import JSONResponse

    from routes import vp_display as route

    called = {"print": 0}

    def hop(*_a, **_k):
        return JSONResponse(
            content={
                "ok": True,
                "price_source": "massive_futures_aggs",
                "bars": [],
                "bars_served": 0,
            }
        )

    def prints(*_a, **_k):
        called["print"] += 1
        return {"price_source": "vp_prints", "bars": []}

    monkeypatch.setattr(route, "_history_hop", hop)
    monkeypatch.setattr(route, "ohlc_for_source", prints)
    cookies = cookie_for("activator", probe_identity)
    r = client.get(
        "/api/app/vp/v1/ohlc/ES",
        params={"tf": "5m", "contract": "ESZ2026"},
        cookies=cookies,
    )
    assert r.status_code == 200, r.text
    assert r.json()["price_source"] == "massive_futures_aggs"
    assert "req001_min_days" not in r.json()
    assert called["print"] == 0


def test_vp_display_member_health_and_ohlc(client, probe_identity):
    cookies = cookie_for("activator", probe_identity)
    h = client.get("/api/app/vp/v1/health", cookies=cookies)
    assert h.status_code == 200, h.text
    o = client.get(
        "/api/app/vp/v1/ohlc/ES",
        params={"tf": "5m", "lookback_days": 0},
        cookies=cookies,
    )
    assert o.status_code == 200, o.text
    body = o.json()
    assert body.get("kind") == "ohlc" or "bars" in body


def test_member_structure_opt_in_variants(client, probe_identity):
    cookies = cookie_for("activator", probe_identity)
    dated_off = client.get(
        "/api/app/vp/v1/structure/XSP",
        params={
            "source": "SPY",
            "session_date": "2026-09-16",
            "harness": "fixture",
        },
        cookies=cookies,
    )
    assert dated_off.status_code == 200, dated_off.text
    assert "bins" not in dated_off.json()
    assert dated_off.json()["session_date"] == "2026-09-16"
    dated_on = client.get(
        "/api/app/vp/v1/structure/XSP",
        params={
            "source": "SPY",
            "session_date": "2026-09-16",
            "harness": "fixture",
            "include_bins": "true",
        },
        cookies=cookies,
    )
    assert dated_on.status_code == 200, dated_on.text
    assert dated_on.json()["bins"]
    sessionless_off = client.get(
        "/api/app/vp/v1/structure/XSP",
        params={"source": "SPY", "harness": "fixture"},
        cookies=cookies,
    )
    assert sessionless_off.status_code == 200, sessionless_off.text
    assert "bins" not in sessionless_off.json()
    sessionless_on = client.get(
        "/api/app/vp/v1/structure/XSP",
        params={"source": "SPY", "harness": "fixture", "include_bins": "true"},
        cookies=cookies,
    )
    assert sessionless_on.status_code == 200, sessionless_on.text
    assert sessionless_on.json()["bins"]


def test_member_bins_leaked_is_422_not_500(client, probe_identity, monkeypatch):
    from routes import vp_display as route

    def leak(*_a, **_k):
        return {"bins": [{"price": 1, "volume": 1}], "session_date": "x"}

    monkeypatch.setattr(route, "structure_for", leak)
    cookies = cookie_for("activator", probe_identity)
    r = client.get(
        "/api/app/vp/v1/structure/XSP",
        params={"source": "SPY", "harness": "fixture"},
        cookies=cookies,
    )
    assert r.status_code == 422, r.text
    assert r.json()["error"] == "BINS_LEAKED"
    assert r.status_code != 500


def test_vp_display_member_stream_fixture(client, probe_identity):
    cookies = cookie_for("activator", probe_identity)
    r = client.get(
        "/api/app/vp/v1/stream",
        params={
            "source": "SPY",
            "timeframe": "5m",
            "harness": "fixture",
            "once": "true",
        },
        cookies=cookies,
    )
    assert r.status_code == 200, r.text
    assert "event: heartbeat" in r.text
    assert "last_print_age_ms" in r.text
