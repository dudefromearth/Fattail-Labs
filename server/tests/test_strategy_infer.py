"""Butterfly vs broken wing fly geometry."""

from trade_log_domain.strategy_infer import (
    classify_butterfly_geometry,
    refine_strategy_from_legs,
)


def _leg(side: str, qty: int, strike: float, right: str = "PUT") -> dict:
    return {
        "side": side,
        "quantity": qty,
        "strike": strike,
        "right": right,
        "underlier": "SPX",
        "expiry": "2026-08-15",
        "pos_effect": "TO_OPEN",
    }


def test_symmetric_butterfly():
    legs = [
        _leg("BUY", 1, 5700),
        _leg("SELL", 2, 5750),
        _leg("BUY", 1, 5800),
    ]
    assert classify_butterfly_geometry(legs) == "BUTTERFLY"
    assert refine_strategy_from_legs("BUTTERFLY", legs) == "BUTTERFLY"


def test_broken_wing_asymmetric():
    legs = [
        _leg("BUY", 1, 5700),
        _leg("SELL", 2, 5750),
        _leg("BUY", 1, 5850),  # upper wing 100 vs lower 50
    ]
    assert classify_butterfly_geometry(legs) == "BROKEN_WING_FLY"
    assert refine_strategy_from_legs("BUTTERFLY", legs) == "BROKEN_WING_FLY"
    assert refine_strategy_from_legs("CUSTOM", legs) == "BROKEN_WING_FLY"


def test_scaled_quantities_still_fly():
    legs = [
        _leg("BUY", 2, 100),
        _leg("SELL", 4, 105),
        _leg("BUY", 2, 110),
    ]
    assert classify_butterfly_geometry(legs) == "BUTTERFLY"


def test_short_fly_pattern():
    legs = [
        _leg("SELL", 1, 100),
        _leg("BUY", 2, 105),
        _leg("SELL", 1, 115),
    ]
    assert classify_butterfly_geometry(legs) == "BROKEN_WING_FLY"


def test_vertical_not_fly():
    legs = [
        _leg("BUY", 1, 100),
        _leg("SELL", 1, 105),
    ]
    assert classify_butterfly_geometry(legs) is None
    assert refine_strategy_from_legs("VERTICAL", legs) == "VERTICAL"
