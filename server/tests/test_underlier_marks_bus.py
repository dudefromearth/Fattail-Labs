"""Bus-first underlier marks + open-book helpers (unit, no Redis required)."""

from __future__ import annotations

from market_data.open_book_marks import (
    positions_opf_enabled,
    trade_to_strategy_intent,
)
from market_data.underlier_marks import _from_bus_doc


def test_from_bus_doc_basic():
    m = _from_bus_doc(
        "SPY",
        {"mid": 500.5, "bid": 500.4, "ask": 500.6, "source": "massive", "ts": 1e9},
    )
    assert m is not None
    assert m["symbol"] == "SPY"
    assert m["mid"] == 500.5
    assert m["plane"] == "mb:sym"


def test_from_bus_doc_proxy_label():
    m = _from_bus_doc(
        "SPX",
        {"mid": 5200.0, "source": "massive_proxy_v1", "ts": 1e9},
    )
    assert m is not None
    assert "proxy" in m["label"].lower() or "Proxy" in m["label"]


def test_trade_to_strategy_intent_butterfly():
    trade = {
        "id": 9,
        "strategy": "BUTTERFLY",
        "legs": [
            {
                "underlier": "SPX",
                "strike": 5000,
                "expiry": "2026-08-15",
                "option_right": "C",
                "side": "BUY",
                "quantity": 1,
            },
            {
                "underlier": "SPX",
                "strike": 5050,
                "expiry": "2026-08-15",
                "option_right": "CALL",
                "side": "SELL",
                "quantity": 2,
            },
            {
                "underlier": "SPX",
                "strike": 5100,
                "expiry": "2026-08-15",
                "option_right": "C",
                "side": "BUY",
                "quantity": 1,
            },
        ],
    }
    intent = trade_to_strategy_intent(trade)
    assert intent is not None
    assert intent.product == "SPX"
    assert len(intent.legs) == 3
    assert intent.legs[1].qty == -2.0


def test_trade_to_strategy_intent_equity_none():
    trade = {
        "id": 1,
        "strategy": "STOCK",
        "legs": [
            {"underlier": "AAPL", "side": "BUY", "quantity": 100, "fill_price": 190},
        ],
    }
    assert trade_to_strategy_intent(trade) is None


def test_positions_opf_flag_default_on(monkeypatch):
    monkeypatch.delenv("LABS_POSITIONS_OPF", raising=False)
    assert positions_opf_enabled() is True
    monkeypatch.setenv("LABS_POSITIONS_OPF", "0")
    assert positions_opf_enabled() is False
