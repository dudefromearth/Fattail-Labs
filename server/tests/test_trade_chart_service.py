"""Trade chart service — native series first, labeled proxy fallback."""

from datetime import datetime, timedelta, timezone
from typing import Any

import pytest

from market_data.massive_client import MassiveClientError
from market_data.trade_chart_service import build_trade_chart, clear_chart_cache


def _leg(*, under: str = "SPX", strike: float = 5900.0) -> dict[str, Any]:
    return {
        "side": "BUY",
        "quantity": 1,
        "pos_effect": "TO_OPEN",
        "underlier": under,
        "expiry": "2026-04-21",
        "strike": strike,
        "right": "PUT",
        "fill_price": 1.0,
        "asset_class": "equity_option",
    }


def _trade(exec_at: str) -> dict[str, Any]:
    return {
        "id": 42,
        "account_id": 1,
        "exec_at": exec_at,
        "strategy": "BUTTERFLY",
        "asset_class": "equity_option",
        "legs": [_leg(), _leg(strike=5850), _leg(strike=5800)],
    }


class _FakeMassive:
    """Configurable fetch_aggs by symbol."""

    def __init__(
        self,
        by_symbol: dict[str, list[dict[str, Any]] | Exception],
    ) -> None:
        self.by_symbol = by_symbol
        self.calls: list[str] = []

    def fetch_aggs(self, symbol: str, **kwargs: Any) -> list[dict[str, Any]]:
        self.calls.append(symbol)
        val = self.by_symbol.get(symbol)
        if val is None:
            raise MassiveClientError(f"unexpected symbol {symbol}")
        if isinstance(val, Exception):
            raise val
        return list(val)


def _bars_around(center: datetime, n: int = 8, step_min: int = 15) -> list[dict]:
    out = []
    start = center - timedelta(minutes=step_min * (n // 2))
    for i in range(n):
        t = start + timedelta(minutes=step_min * i)
        px = 5900.0 + i
        out.append(
            {
                "t": int(t.timestamp() * 1000),
                "o": px,
                "h": px + 1,
                "l": px - 1,
                "c": px,
                "v": 1.0,
            }
        )
    return out


@pytest.fixture(autouse=True)
def _clear_cache():
    clear_chart_cache()
    yield
    clear_chart_cache()


def test_build_trade_chart_uses_native_spx_when_available():
    center = datetime(2026, 4, 1, 15, 0, tzinfo=timezone.utc)
    trade = _trade("2026-04-01T15:00:00+00:00")
    client = _FakeMassive(
        {
            "I:SPX": _bars_around(center),
            "SPX": MassiveClientError("should not be needed"),
            "SPY": MassiveClientError("should not use proxy"),
        }
    )
    out = build_trade_chart(
        None,
        trade,
        tf="15m",
        client=client,  # type: ignore[arg-type]
    )
    assert out["ok"] is True
    assert out["series_ticker"] == "I:SPX"
    assert out["proxy_label"] is None
    assert out["source"] == "massive_v1"
    assert out["structure_band"] is not None  # strikes on same axis as SPX
    assert client.calls[0] == "I:SPX"
    assert "SPY" not in client.calls


def test_build_trade_chart_falls_back_to_spy_when_index_not_entitled():
    center = datetime(2026, 4, 1, 15, 0, tzinfo=timezone.utc)
    trade = _trade("2026-04-01T15:00:00+00:00")
    client = _FakeMassive(
        {
            "I:SPX": MassiveClientError("Massive HTTP 403 not entitled"),
            "SPX": MassiveClientError("Massive HTTP 404"),
            "SPY": _bars_around(center, n=8),  # ETF-scale prices ok for completeness
        }
    )
    # Rewrite SPY bars to ETF-ish prices (completeness only checks count/times)
    client.by_symbol["SPY"] = _bars_around(center)
    out = build_trade_chart(
        None,
        trade,
        tf="15m",
        client=client,  # type: ignore[arg-type]
    )
    assert out["ok"] is True
    assert out["series_ticker"] == "SPY"
    assert out["proxy_label"] is not None
    assert "SPY" in out["proxy_label"] and "SPX" in out["proxy_label"]
    assert out["source"] == "massive_proxy_v1"
    assert out["structure_band"] is None  # hide strike band on proxy axis
    assert "I:SPX" in client.calls
    assert "SPY" in client.calls


def test_build_trade_chart_falls_back_when_native_empty():
    center = datetime(2026, 4, 1, 15, 0, tzinfo=timezone.utc)
    trade = _trade("2026-04-01T15:00:00+00:00")
    client = _FakeMassive(
        {
            "I:SPX": [],
            "SPX": [],
            "SPY": _bars_around(center),
        }
    )
    out = build_trade_chart(
        None,
        trade,
        tf="15m",
        client=client,  # type: ignore[arg-type]
    )
    assert out["ok"] is True
    assert out["series_ticker"] == "SPY"
    assert out["proxy_label"]
