"""OHLC tf map unit tests (no Massive)."""

from __future__ import annotations

import pytest

from market_data.ohlc_service import (
    OHLC_LOOKBACK_DAYS,
    OHLC_LOOKBACK_YEARS,
    normalize_ohlc_tf,
)


def test_normalize_ohlc_tf():
    assert normalize_ohlc_tf("1d") == "1d"
    assert normalize_ohlc_tf("4H") == "4h"
    assert normalize_ohlc_tf("10m") == "10m"
    with pytest.raises(ValueError):
        normalize_ohlc_tf("5m")


def test_lookback_at_least_three_years():
    assert OHLC_LOOKBACK_YEARS >= 3
    assert OHLC_LOOKBACK_DAYS >= 3 * 365
