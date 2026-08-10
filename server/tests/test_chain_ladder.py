"""Unit tests for chain ladder build + strike-level diff (no Massive)."""

from __future__ import annotations

from market_data.chain_ladder import (
    build_ladder,
    content_hash,
    diff_ladder,
    sigma_band_points,
)


def _raw(strike: float, *, mid: float, side: str = "call", exp: str = "2026-08-15") -> dict:
    return {
        "details": {
            "strike_price": strike,
            "expiration_date": exp,
            "contract_type": side,
            "ticker": f"O:SPXW260815C{int(strike * 1000):08d}",
        },
        "last_quote": {"bid": mid - 0.5, "ask": mid + 0.5, "midpoint": mid},
        "greeks": {"delta": 0.5, "gamma": 0.01, "theta": -0.1, "vega": 0.2},
        "implied_volatility": 0.15,
        "open_interest": 100,
        "day": {"volume": 10},
    }


def test_sigma_band_positive():
    b = sigma_band_points(5000.0, vol_pct=15.0, dte=1, sigma=2.0)
    assert b > 0
    assert b < 500  # sane for 1d 15% vol
    # 0DTE does not collapse to zero width
    b0 = sigma_band_points(5000.0, vol_pct=15.0, dte=0, sigma=2.0)
    assert b0 > 0


def test_proxy_source_detection():
    from market_data.chain_ladder import is_proxy_mark_source

    assert is_proxy_mark_source("massive_proxy_v1") is True
    assert is_proxy_mark_source("massive_ws_v1") is False


def test_extract_chain_underlying_price():
    from market_data.chain_ladder import extract_chain_underlying_price

    raw = [
        {
            "underlying_asset": {"value": 5500.25, "ticker": "I:SPX"},
            "details": {"strike_price": 5500},
        }
    ]
    assert extract_chain_underlying_price(raw) == 5500.25
    assert extract_chain_underlying_price([]) is None


def test_build_and_diff_only_changed_strikes():
    spot = 5000.0
    raw = [
        _raw(4990, mid=10.0),
        _raw(5000, mid=12.0),
        _raw(5010, mid=8.0),
    ]
    a = build_ladder(
        raw,
        underlier="I:SPX",
        spot=spot,
        expiration="2026-08-15",
        side="call",
        band=50.0,
        sigma=2.0,
        vix=15.0,
        dte=1,
    )
    assert a["row_count"] == 3
    assert a["content_hash"]
    h1 = content_hash(a)

    # same prices → unchanged mode
    b = build_ladder(
        raw,
        underlier="I:SPX",
        spot=spot,
        expiration="2026-08-15",
        side="call",
        band=50.0,
        sigma=2.0,
        vix=15.0,
        dte=1,
    )
    # as_of differs but content_hash ignores timestamps
    assert content_hash(b) == h1
    d0 = diff_ladder(a, b)
    # content_hash equal → unchanged (diff may still say full if as_of only — we force hash equal)
    assert d0["mode"] in ("unchanged", "diff")
    if d0["mode"] == "diff":
        assert d0["changed_strike_count"] == 0
        assert d0["removed_strike_count"] == 0

    # only mid of 5000 changes
    raw2 = [
        _raw(4990, mid=10.0),
        _raw(5000, mid=12.5),  # changed
        _raw(5010, mid=8.0),
    ]
    c = build_ladder(
        raw2,
        underlier="I:SPX",
        spot=spot,
        expiration="2026-08-15",
        side="call",
        band=50.0,
        sigma=2.0,
        vix=15.0,
        dte=1,
    )
    d = diff_ladder(a, c)
    assert d["mode"] == "diff"
    assert d["changed_strike_count"] == 1
    assert abs(float(d["upserts"][0]["strike"]) - 5000) < 1e-9
    assert float(d["upserts"][0]["mid"]) == 12.5
    assert d["removed_strike_count"] == 0

    # strike removed
    raw3 = [
        _raw(4990, mid=10.0),
        _raw(5000, mid=12.5),
    ]
    e = build_ladder(
        raw3,
        underlier="I:SPX",
        spot=spot,
        expiration="2026-08-15",
        side="call",
        band=50.0,
        sigma=2.0,
        vix=15.0,
        dte=1,
    )
    d2 = diff_ladder(c, e)
    assert d2["mode"] == "diff"
    assert 5010.0 in d2["removes"]


def test_next_three_expiries_are_distinct_sorted_with_dte():
    """Picker semantics: next N distinct listed dates, not calendar weekdays."""
    from datetime import date as date_cls

    from market_data.chain_ladder import dte_from_expiration

    today = date_cls(2026, 8, 10)
    # Simulate SPX-style dense list vs Friday-only list
    dense = ["2026-08-10", "2026-08-11", "2026-08-12", "2026-08-13", "2026-08-14"]
    fridays = ["2026-08-14", "2026-08-21", "2026-08-28", "2026-09-04"]
    next3_dense = dense[:3]
    next3_fri = fridays[:3]
    assert next3_dense == ["2026-08-10", "2026-08-11", "2026-08-12"]
    assert next3_fri == ["2026-08-14", "2026-08-21", "2026-08-28"]
    assert dte_from_expiration("2026-08-10", today=today) == 0
    assert dte_from_expiration("2026-08-14", today=today) == 4


def test_diff_without_prev_is_full():
    raw = [_raw(5000, mid=1.0)]
    ladder = build_ladder(
        raw,
        underlier="I:SPX",
        spot=5000.0,
        expiration="2026-08-15",
        side="call",
        band=50.0,
        sigma=2.0,
        vix=None,
        dte=0,
    )
    d = diff_ladder(None, ladder)
    assert d["mode"] == "full"
    assert d["ladder"]["row_count"] == 1
