"""Phase 2 trade chart domain — pure unit tests (no Massive / no DB)."""

from datetime import datetime, timezone

import pytest

from trade_log_domain.trade_chart import (
    bars_look_complete,
    build_markers,
    chart_window,
    normalize_tf,
    product_underlier,
    resolve_series_candidates,
    resolve_series_ticker,
    structure_strike_band,
    tf_agg_params,
)


def _leg(
    *,
    under: str = "SPX",
    strike: float | None = 5900,
    effect: str = "TO_OPEN",
    qty: int = 1,
    right: str = "PUT",
) -> dict:
    return {
        "side": "BUY",
        "quantity": qty,
        "pos_effect": effect,
        "underlier": under,
        "expiry": "2026-04-21",
        "strike": strike,
        "right": right,
        "fill_price": 1.0,
        "asset_class": "equity_option",
    }


def _trade(tid: int, exec_at: str, legs: list, *, strategy: str = "BUTTERFLY") -> dict:
    return {
        "id": tid,
        "account_id": 1,
        "exec_at": exec_at,
        "strategy": strategy,
        "asset_class": "equity_option",
        "legs": legs,
    }


def test_normalize_tf():
    assert normalize_tf("5m") == "5m"
    assert normalize_tf("15M") == "15m"
    assert normalize_tf("1d") == "1d"
    assert normalize_tf(None) == "15m"
    with pytest.raises(ValueError):
        normalize_tf("1h")


def test_product_underlier_from_legs():
    t = _trade(1, "2026-04-01T10:00:00", [_leg(under="SPX"), _leg(under="SPX", strike=5850)])
    assert product_underlier(t) == "SPX"


def test_product_underlier_equity_symbol():
    t = {
        "id": 2,
        "exec_at": "2026-04-01T10:00:00",
        "asset_class": "equity",
        "legs": [
            {
                "side": "BUY",
                "quantity": 100,
                "pos_effect": "TO_OPEN",
                "asset_class": "equity",
                "symbol": "AAPL",
                "underlier": None,
                "fill_price": 180.0,
            }
        ],
    }
    assert product_underlier(t) == "AAPL"


def test_structure_strike_band():
    t = _trade(
        1,
        "2026-04-01T10:00:00",
        [
            _leg(strike=5900),
            _leg(strike=5850, qty=2),
            _leg(strike=5800),
        ],
    )
    band = structure_strike_band(t)
    assert band == {"low": 5800.0, "high": 5900.0}


def test_resolve_series_native_first_proxy_fallback():
    """SPX prefers I:SPX; SPY is a labeled fallback candidate, not primary."""
    ticker, label, source = resolve_series_ticker("SPX")
    assert ticker == "I:SPX"
    assert label is None
    assert source == "massive_v1"

    cands = resolve_series_candidates("SPX")
    assert cands[0][0] == "I:SPX"
    assert cands[0][1] is None
    # Product symbol then proxy (order may include SPX before SPY)
    tickers = [c[0] for c in cands]
    assert "SPY" in tickers
    spy = next(c for c in cands if c[0] == "SPY")
    assert spy[1] is not None and "SPY" in spy[1] and "SPX" in spy[1]
    assert spy[2] == "massive_proxy_v1"
    assert tickers.index("I:SPX") < tickers.index("SPY")

    ticker2, label2, source2 = resolve_series_ticker(
        "SPX",
        universe=[
            {
                "symbol": "SPX",
                "feed_symbol": "I:SPX",
                "proxy_symbol": "SPY",
            }
        ],
    )
    assert ticker2 == "I:SPX"
    assert label2 is None
    assert source2 == "massive_v1"

    cands2 = resolve_series_candidates(
        "SPX",
        universe=[
            {
                "symbol": "SPX",
                "feed_symbol": "I:SPX",
                "proxy_symbol": "SPY",
            }
        ],
    )
    assert [c[0] for c in cands2][0] == "I:SPX"
    assert any(c[0] == "SPY" and c[2] == "massive_proxy_v1" for c in cands2)

    ticker3, label3, source3 = resolve_series_ticker("AAPL")
    assert ticker3 == "AAPL"
    assert label3 is None
    assert source3 == "massive_v1"
    assert resolve_series_candidates("AAPL") == [("AAPL", None, "massive_v1")]


def test_chart_window_and_markers_paired():
    open_t = _trade(
        10,
        "2026-04-01T14:30:00",
        [_leg(effect="TO_OPEN")],
    )
    close_t = _trade(
        11,
        "2026-04-01T15:45:00",
        [_leg(effect="TO_CLOSE")],
    )
    win = chart_window(close_t, "15m", paired_open=open_t, paired_close=close_t)
    assert win is not None
    start, end = win
    assert start < end
    markers = build_markers(close_t, paired_open=open_t, paired_close=close_t)
    kinds = {m["kind"] for m in markers}
    assert kinds == {"entry", "exit"}
    assert markers[0]["t_ms"] < markers[1]["t_ms"]


def test_markers_open_only():
    open_t = _trade(10, "2026-04-01T14:30:00", [_leg(effect="TO_OPEN")])
    markers = build_markers(open_t)
    assert len(markers) == 1
    assert markers[0]["kind"] == "entry"


def test_bars_look_complete_fail_loud():
    start = datetime(2026, 4, 1, 14, 0, tzinfo=timezone.utc)
    end = datetime(2026, 4, 1, 18, 0, tzinfo=timezone.utc)
    ok, reason = bars_look_complete([], window_start=start, window_end=end, tf="15m")
    assert ok is False
    assert reason == "missing_bars"

    one = [{"t": int(start.timestamp() * 1000), "c": 1.0}]
    ok2, reason2 = bars_look_complete(one, window_start=start, window_end=end, tf="15m")
    assert ok2 is False

    two = [
        {"t": int(start.timestamp() * 1000), "c": 1.0},
        {"t": int(end.timestamp() * 1000), "c": 2.0},
    ]
    ok3, reason3 = bars_look_complete(two, window_start=start, window_end=end, tf="15m")
    assert ok3 is True
    assert reason3 is None


def test_tf_agg_params():
    assert tf_agg_params("5m") == (5, "minute")
    assert tf_agg_params("15m") == (15, "minute")
    assert tf_agg_params("1d") == (1, "day")
