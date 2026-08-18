"""Gold chain cadence is 2–5s. Friday 2026-08-14 stays 5-min."""

from __future__ import annotations

from datetime import date

import pytest


def test_chain_every_s_default_is_two(monkeypatch):
    monkeypatch.delenv("LABS_SSR_CHAIN_EVERY_S", raising=False)
    from market_data.ssr_live_capture import chain_every_s

    assert chain_every_s() == 2.0


@pytest.mark.parametrize("raw", ["2", "2.0", "3", "4", "5", "5.0"])
def test_chain_every_s_accepts_band(monkeypatch, raw):
    monkeypatch.setenv("LABS_SSR_CHAIN_EVERY_S", raw)
    from market_data.ssr_live_capture import chain_every_s

    assert chain_every_s() == float(raw)


@pytest.mark.parametrize("raw", ["1.9", "5.1", "300", "0", "-1"])
def test_chain_every_s_rejects_outside_band(monkeypatch, raw):
    monkeypatch.setenv("LABS_SSR_CHAIN_EVERY_S", raw)
    from market_data.ssr_live_capture import chain_every_s

    with pytest.raises(RuntimeError, match="2, 5|forbidden"):
        chain_every_s()


def test_friday_5min_day_is_not_rewritten():
    from market_data.ssr_live_capture import FRIDAY_5MIN_DAY

    assert FRIDAY_5MIN_DAY.isoformat() == "2026-08-14"


def test_front_expiration_picks_next_listed():
    from market_data.ssr_live_capture import front_expiration

    row = {"symbol": "AAPL", "next_expirations_json": ["2026-08-10", "2026-08-18", "2026-08-21"]}
    assert front_expiration(row, date(2026, 8, 17)) == "2026-08-18"


def test_ladder_topics_include_feed_and_product():
    from market_data.ssr_live_capture import ladder_topics

    keys = ladder_topics(
        {"symbol": "SPX", "feed_symbol": "I:SPX"},
        "2026-08-18",
        25,
    )
    assert "mb:ladder:SPX:2026-08-18:w25:dual" in keys
    assert "mb:ladder:I:SPX:2026-08-18:w25:dual" in keys


def test_phase_at_max_published_window():
    """Massive 4:00 AM–8:00 PM + Cboe overnight GTH weeknights. Friday night sleeps."""
    from datetime import datetime
    from zoneinfo import ZoneInfo

    from market_data.ssr_live_capture import phase_at

    ny = ZoneInfo("America/New_York")

    def ts(day: int, hour: int, minute: int) -> datetime:
        return datetime(2026, 8, day, hour, minute, tzinfo=ny)

    # Monday 17
    assert phase_at(ts(17, 3, 0)) == "gth"
    assert phase_at(ts(17, 4, 0)) == "pre"
    assert phase_at(ts(17, 9, 29)) == "pre"
    assert phase_at(ts(17, 9, 30)) == "rth"
    assert phase_at(ts(17, 15, 59)) == "rth"
    assert phase_at(ts(17, 16, 0)) == "extended"
    assert phase_at(ts(17, 19, 59)) == "extended"
    assert phase_at(ts(17, 20, 15)) == "gth"
    # Friday 21 night is the only weekday close
    assert phase_at(ts(21, 20, 15)) == "closed"
    assert phase_at(ts(16, 12, 0)) == "weekend"
    assert phase_at(ts(16, 20, 14)) == "weekend"
    assert phase_at(ts(16, 20, 15)) == "gth"


def test_chain_rows_skip_reference_marks():
    from market_data.ssr_live_capture import chain_rows

    rows = [
        {"symbol": "SPY", "role": "tradeable"},
        {"symbol": "VIX", "role": "reference"},
        {"symbol": "VIX1D", "role": "reference"},
        {"symbol": "AAPL"},
    ]
    assert [r["symbol"] for r in chain_rows(rows)] == ["SPY", "AAPL"]


def test_next_wake_friday_night_is_sunday_gth():
    from datetime import datetime
    from zoneinfo import ZoneInfo

    from market_data.ssr_live_capture import next_wake

    ny = ZoneInfo("America/New_York")
    wake = next_wake(datetime(2026, 8, 21, 21, 0, tzinfo=ny))
    assert wake.isoformat() == "2026-08-23T20:15:00-04:00"


def test_next_wake_weeknight_stays_in_session():
    from datetime import datetime
    from zoneinfo import ZoneInfo

    from market_data.ssr_live_capture import next_wake

    ny = ZoneInfo("America/New_York")
    ts = datetime(2026, 8, 17, 23, 22, tzinfo=ny)
    assert next_wake(ts) == ts
