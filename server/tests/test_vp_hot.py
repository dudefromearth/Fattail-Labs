"""VP hot Redis layer. Disabled unless LABS_VP_HOT=1."""

import os

from market_data.vp_hot import Hot


def test_hot_disabled_without_flag(monkeypatch):
    monkeypatch.setenv("LABS_VP_HOT", "0")
    h = Hot()
    assert h.enabled is False
    assert h.get("nope") is None


def test_hot_refuses_db0(monkeypatch):
    monkeypatch.setenv("LABS_VP_HOT", "1")
    monkeypatch.setenv("LABS_VP_HOT_REDIS_URL", "redis://127.0.0.1:6379/0")
    monkeypatch.setenv("LABS_VP_HOT_MAX_BYTES", "1000")
    try:
        Hot()
        raise AssertionError("must refuse db 0")
    except RuntimeError as exc:
        assert "DB index other than 0" in str(exc)


def test_pin_rewrites_mdns_host():
    from sa_dev.vp_client import _pin_url

    assert _pin_url("http://studioone.local:4010") == "http://192.168.1.111:4010"
    assert _pin_url("http://192.168.1.111:4010") == "http://192.168.1.111:4010"
