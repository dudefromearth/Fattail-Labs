"""Tradier transform unit tests — OCC parsing, direction, dedup, gainloss stamping.

Uses Tradier's documented response field shapes (docs.tradier.com):
  history.event[]          : date, type, symbol, quantity, price, amount, description, commission
  gainloss.closed_position[]: open_date, close_date, gain_loss, quantity, symbol, ...
"""

from __future__ import annotations

from integrations.tradier import transform as tfm


def test_parse_occ_call():
    got = tfm.parse_occ_symbol("SPY210319C00150000")
    assert got == {
        "underlier": "SPY",
        "expiry": "2021-03-19",
        "strike": "150",
        "right": "CALL",
    }


def test_parse_occ_put_with_space_and_fractional_strike():
    got = tfm.parse_occ_symbol("AAPL 210319P00152500")
    assert got["underlier"] == "AAPL"
    assert got["right"] == "PUT"
    assert got["strike"] == "152.5"
    assert got["expiry"] == "2021-03-19"


def test_parse_occ_rejects_equity():
    assert tfm.parse_occ_symbol("AAPL") is None
    assert tfm.parse_occ_symbol("") is None
    assert tfm.parse_occ_symbol(None) is None


def test_equity_buy_event_to_trade():
    ev = {
        "date": "2015-04-01T15:25:47.000Z",
        "type": "trade",
        "symbol": "AAPL",
        "quantity": 10,
        "price": 124,
        "amount": -1240,
        "description": "Bought 10 AAPL @ 124.00",
        "commission": 0,
    }
    t = tfm.history_event_to_trade(ev, "VA000001")
    assert t["asset_class"] == "equity"
    assert t["exec_at"] == "2015-04-01T15:25:47.000Z"
    leg = t["legs"][0]
    assert leg["side"] == "BUY"
    assert leg["quantity"] == "10"
    assert leg["underlier"] == "AAPL"
    assert leg["fill_price"] == "124"
    assert leg["right"] is None
    assert t["external_order_id"].startswith("tradier:")


def test_option_sell_event_parses_occ():
    ev = {
        "date": "2021-03-15T14:30:00.000Z",
        "type": "option",
        "symbol": "SPY210319C00400000",
        "quantity": -2,
        "price": 3.15,
        "amount": 630,
        "description": "Sold 2 SPY Mar 19 2021 400 Call @ 3.15",
        "commission": 1.30,
    }
    t = tfm.history_event_to_trade(ev, "VA000001")
    assert t["asset_class"] == "equity_option"
    leg = t["legs"][0]
    assert leg["side"] == "SELL"
    assert leg["right"] == "CALL"
    assert leg["strike"] == "400"
    assert leg["expiry"] == "2021-03-19"
    assert leg["fees"] == "1.3"


def test_non_trade_events_skipped():
    assert tfm.history_event_to_trade({"type": "dividend", "symbol": "AAPL"}, "A") is None
    assert tfm.history_event_to_trade({"type": "ach", "amount": 500}, "A") is None


def test_content_hash_is_stable_and_distinct():
    ev = {
        "date": "2015-04-01T15:25:47.000Z",
        "type": "trade",
        "symbol": "AAPL",
        "quantity": 10,
        "price": 124,
        "amount": -1240,
    }
    h1 = tfm.content_hash("ACC", ev)
    h2 = tfm.content_hash("ACC", dict(ev))
    assert h1 == h2  # stable → re-sync dedups
    ev2 = dict(ev, price=125)
    assert tfm.content_hash("ACC", ev2) != h1  # different fill → different id


def test_transform_stamps_gainloss_pnl_and_effects():
    trade_events = [
        {
            "date": "2015-02-01T15:25:47.000Z",
            "type": "trade",
            "symbol": "AAPL",
            "quantity": 10,
            "price": 145,
            "amount": -1450,
            "description": "Bought 10 AAPL @ 145.00",
            "commission": 0,
        },
        {
            "date": "2015-03-01T15:25:47.000Z",
            "type": "trade",
            "symbol": "AAPL",
            "quantity": -10,
            "price": 148.65,
            "amount": 1486.5,
            "description": "Sold 10 AAPL @ 148.65",
            "commission": 0,
        },
    ]
    gainloss = [
        {
            "open_date": "2015-02-01T15:25:47.000Z",
            "close_date": "2015-03-01T15:25:47.000Z",
            "cost": 1450,
            "proceeds": 1486.5,
            "gain_loss": 36.5,
            "quantity": 10,
            "symbol": "AAPL",
            "term": 28,
        }
    ]
    out = tfm.transform(
        account_id="VA000001",
        trade_events=trade_events,
        option_events=[],
        closed_positions=gainloss,
    )
    assert out["adapter"] == "tradier"
    trades = out["trades"]
    assert len(trades) == 2
    opens = [t for t in trades if t["legs"][0]["pos_effect"] == "TO_OPEN"]
    closes = [t for t in trades if t["legs"][0]["pos_effect"] == "TO_CLOSE"]
    assert len(opens) == 1 and len(closes) == 1
    assert closes[0]["pnl_amount"] == "36.5"
    # transient reconciliation hints stripped from output
    assert "_day" not in trades[0] and "_symbol" not in trades[0]
    assert out["warnings"] == []


def test_transform_warns_on_unmatched_gainloss():
    out = tfm.transform(
        account_id="A",
        trade_events=[],
        option_events=[],
        closed_positions=[
            {"symbol": "TSLA", "open_date": "2015-01-01", "close_date": "2015-01-05", "gain_loss": 10}
        ],
    )
    assert out["trades"] == []
    assert any("unmatched" in w for w in out["warnings"])
