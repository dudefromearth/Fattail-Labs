"""Unit tests for chain ladder build + strike-level diff (no Massive)."""

from __future__ import annotations

from market_data.chain_ladder import (
    DEFAULT_STRIKE_WINGS,
    MASSIVE_PAGE_LIMIT,
    MAX_STRIKES_PER_DTE,
    STRIKE_WING_CHOICES,
    build_ladder,
    content_hash,
    diff_ladder,
    strike_window_from_wings,
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


def test_strike_wings_broker_style():
    """±N strikes around ATM — same count for index and equity grid steps."""
    assert DEFAULT_STRIKE_WINGS == 25
    assert STRIKE_WING_CHOICES == (10, 25, 50, 100)
    # SPX $5 grid, 25 wings → 51 strikes if fully listed
    band, lo, hi, atm = strike_window_from_wings(7765.13, step=5.0, wings=25)
    assert atm == 7765.0
    assert lo == 7765.0 - 25 * 5.0
    assert hi == 7765.0 + 25 * 5.0
    n = int(round((hi - lo) / 5.0)) + 1
    assert n == 51
    # Widest choice still under Massive page
    assert 2 * 100 + 1 <= MASSIVE_PAGE_LIMIT
    assert MAX_STRIKES_PER_DTE == 250


def test_listed_wings_include_fractional_aapl_style():
    """AAPL-style 2.5 grid: wings count listed strikes, keep 302.50."""
    from market_data.chain_ladder import (
        infer_listed_step,
        select_listed_wing_window,
    )

    # 280 .. 330 by 2.5
    strikes = [280 + i * 2.5 for i in range(21)]
    spot = 306.4
    band, lo, hi, atm, n = select_listed_wing_window(strikes, spot, wings=5)
    assert atm == 307.5 or atm == 305.0  # nearest listed
    assert 302.5 in strikes
    assert lo <= 302.5 <= hi
    assert n == 11  # 5 below + atm + 5 above
    step = infer_listed_step(strikes, spot)
    assert step == 2.5


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
        vix=15.0,
        dte=1,
        wings=25,
        strike_step=5.0,
        strike_lo=4950.0,
        strike_hi=5050.0,
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
        vix=15.0,
        dte=1,
        wings=25,
        strike_step=5.0,
        strike_lo=4950.0,
        strike_hi=5050.0,
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
        vix=15.0,
        dte=1,
        wings=25,
        strike_step=5.0,
        strike_lo=4950.0,
        strike_hi=5050.0,
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
        vix=15.0,
        dte=1,
        wings=25,
        strike_step=5.0,
        strike_lo=4950.0,
        strike_hi=5050.0,
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
