"""Member display path — Data-Delivery D4/D5."""

import pytest

from tests.conftest import cookie_for


@pytest.fixture(autouse=True)
def _history_inprocess(monkeypatch):
    monkeypatch.setenv("LABS_HISTORY_API_BASE", "inprocess")


def test_vp_display_unauth(client):
    r = client.get("/api/app/vp/v1/health")
    assert r.status_code == 401


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
