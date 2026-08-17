"""OD-6: gold chain cadence is 3–5s. Friday 2026-08-14 stays 5-min."""

from __future__ import annotations

import os

import pytest


def test_chain_every_s_default_is_in_band(monkeypatch):
    monkeypatch.delenv("LABS_SSR_CHAIN_EVERY_S", raising=False)
    from market_data.ssr_live_capture import chain_every_s

    v = chain_every_s()
    assert 3.0 <= v <= 5.0
    assert v == 4.0


@pytest.mark.parametrize("raw", ["3", "3.0", "4", "5", "5.0"])
def test_chain_every_s_accepts_band(monkeypatch, raw):
    monkeypatch.setenv("LABS_SSR_CHAIN_EVERY_S", raw)
    from market_data.ssr_live_capture import chain_every_s

    v = chain_every_s()
    assert 3.0 <= v <= 5.0
    assert v == float(raw)


@pytest.mark.parametrize("raw", ["2.9", "5.1", "300", "0", "-1"])
def test_chain_every_s_rejects_outside_band(monkeypatch, raw):
    monkeypatch.setenv("LABS_SSR_CHAIN_EVERY_S", raw)
    from market_data.ssr_live_capture import chain_every_s

    with pytest.raises(RuntimeError, match="OD-6"):
        chain_every_s()


def test_chain_every_s_rejects_garbage(monkeypatch):
    monkeypatch.setenv("LABS_SSR_CHAIN_EVERY_S", "five-min")
    from market_data.ssr_live_capture import chain_every_s

    with pytest.raises(RuntimeError, match="OD-6"):
        chain_every_s()


def test_friday_5min_day_is_not_rewritten():
    from market_data.ssr_live_capture import FRIDAY_5MIN_DAY

    assert FRIDAY_5MIN_DAY.isoformat() == "2026-08-14"
