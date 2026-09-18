from sa_dev.stream import mock_stream_events, sse
from tests.conftest import cookie_for


def test_mock_stream_has_tick_bar_gen_heartbeat():
    evs = mock_stream_events("SPY", "5m")
    kinds = [k for k, _ in evs]
    assert kinds.count("heartbeat") >= 1
    assert "tick" in kinds
    assert "bar" in kinds
    assert "gen" in kinds
    tick = dict(evs)["tick"] if False else next(d for k, d in evs if k == "tick")
    assert tick["p"] == 640.30
    bar = next(d for k, d in evs if k == "bar")
    assert bar["c"] == 640.30
    assert bar["l"] <= min(bar["o"], bar["c"]) <= max(bar["o"], bar["c"]) <= bar["h"]
    gen = next(d for k, d in evs if k == "gen")
    assert gen["profile_generation_id"]


def test_sse_frame_shape():
    raw = sse("tick", {"p": 1}).decode()
    assert raw.startswith("event: tick\n")
    assert "data: {\"p\":1}" in raw
    assert raw.endswith("\n\n")


def test_stream_fixture_once(client, admin_cookies):
    r = client.get(
        "/api/dev/sa/v1/stream",
        params={"source": "SPY", "timeframe": "5m", "harness": "fixture", "once": "true"},
        cookies=admin_cookies,
    )
    assert r.status_code == 200, r.text
    assert "text/event-stream" in r.headers.get("content-type", "")
    body = r.text
    assert "event: tick" in body
    assert "event: bar" in body
    assert "event: gen" in body
    assert "event: heartbeat" in body


def test_stream_member_denied(client):
    member = cookie_for("activator", identity_id=0)
    r = client.get(
        "/api/dev/sa/v1/stream",
        params={"source": "ES", "once": "true", "harness": "fixture"},
        cookies=member,
    )
    assert r.status_code == 403
