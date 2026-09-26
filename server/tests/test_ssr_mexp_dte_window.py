"""SSR-MEXP extra books: listed 1–5 trading DTE (Coach: also collect 0–5 DTE)."""
from datetime import date

from market_data import ssr_mexp_capture as mx


def test_dte_window_is_trading_dte_1_through_max():
    listed = ["2026-09-25", "2026-09-28", "2026-09-29", "2026-09-30",
              "2026-10-01", "2026-10-02", "2026-10-09"]
    day = date(2026, 9, 25)  # Friday
    got = mx.select_listed_dte_window(listed, day, 5)
    assert "2026-09-25" not in got
    assert "2026-09-28" in got
    assert "2026-10-02" in got
    assert "2026-10-09" not in got
    assert "2026-09-26" not in got


def test_dte_window_never_invents_dates():
    assert mx.select_listed_dte_window([], date(2026, 9, 25), 5) == []
    assert mx.select_listed_dte_window(["2026-09-25"], date(2026, 9, 25), 5) == []


def test_on_defaults_are_0_to_5_all_names():
    cfg = mx.load_config({"LABS_SSR_MEXP": "on"})
    assert cfg.max_books == 5
    assert "SPX" in cfg.symbols and "SPY" in cfg.symbols and "AAPL" in cfg.symbols
