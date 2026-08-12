"""OPF pre-market / extended-hours mark cascade (held + theo)."""

from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

from opf.generation import ChainGeneration, ContractStore, GenerationKey
from opf.leg import LegIntent, LegPricer, resolve_leg_mid
from opf.package import PackagePricer, StrategyIntent
from opf.static_facts import default_static_facts


def test_resolve_leg_mid_nbbo():
    mid, src = resolve_leg_mid(
        {"bid": 1.0, "ask": 1.2, "mid": 0},
        side="call",
        strike=100,
        spot=100,
        tau=0.05,
        iv=0.2,
    )
    assert src == "nbbo"
    assert abs(mid - 1.1) < 1e-9


def test_resolve_leg_mid_zero_quote_uses_last_trade():
    mid, src = resolve_leg_mid(
        {
            "bid": 0,
            "ask": 0,
            "mid": 0,
            "last_trade": {"price": 31.0},
            "day": {"close": 29.2},
        },
        side="call",
        strike=7730,
        spot=7728.2,
        tau=0.01,
        iv=0.16,
    )
    assert src == "last_trade"
    assert mid == 31.0


def test_resolve_leg_mid_day_close_when_no_trade():
    mid, src = resolve_leg_mid(
        {"bid": 0, "ask": 0, "mid": 0, "day": {"close": 29.2}},
        side="call",
        strike=7730,
        spot=7728.2,
        tau=0.01,
        iv=0.16,
    )
    assert src == "day_close"
    assert mid == 29.2


def test_resolve_leg_mid_theo_bs_when_no_held():
    mid, src = resolve_leg_mid(
        {"bid": 0, "ask": 0, "mid": 0, "iv": 0.2},
        side="call",
        strike=100,
        spot=100,
        tau=30 / 365,
        iv=0.2,
    )
    assert src == "theo_bs"
    assert mid is not None and mid > 0


def test_package_pricer_pre_open_held_disclaimer():
    store = ContractStore()
    exp = "2026-08-13"
    clock = datetime(2026, 8, 12, 8, 25, tzinfo=ZoneInfo("America/New_York"))
    facts = default_static_facts()
    # Zero NBBO + last_trade (Massive premarket shape)
    rows = []
    for side, K, last in (
        ("put", 7650.0, 12.0),
        ("put", 7690.0, 18.0),
        ("call", 7770.0, 16.0),
        ("call", 7810.0, 11.0),
    ):
        rows.append(
            {
                "side": side,
                "strike": K,
                "bid": 0,
                "ask": 0,
                "mid": 0,
                "last_trade": {"price": last},
                "iv": 0.16,
                "expiration": exp,
            }
        )
    store.put(
        ChainGeneration(
            key=GenerationKey("SPX", "I:SPX", exp, 50),
            rows=rows,
            spot=7728.2,
            as_of="2026-08-12T12:25:00Z",
            content_hash="preopen1",
        )
    )
    intent = StrategyIntent(
        strategy_id="ic",
        product="SPX",
        structure="iron_condor",
        legs=[
            LegIntent("a", "put", 7650, exp, -1, "SPX"),
            LegIntent("b", "put", 7690, exp, 1, "SPX"),
            LegIntent("c", "call", 7770, exp, 1, "SPX"),
            LegIntent("d", "call", 7810, exp, -1, "SPX"),
        ],
    )
    q = PackagePricer(store, facts=facts, as_of_clock=clock).quote(
        intent, require_epoch_ok=False
    )
    assert q["complete"] is True, q.get("error")
    assert q["package_debit_per_share"] is not None
    assert q["mark_mode"] == "pre_open_held"
    assert q["basis_source"] == "pre_open_held"
    assert q["mark_disclaimer"] and "until the market opens" in q["mark_disclaimer"]
    for lm in q["leg_marks"]:
        assert lm["mark_source"] == "last_trade"
        assert lm["mid"] is not None and lm["mid"] > 0


def test_package_pricer_live_nbbo_no_disclaimer():
    store = ContractStore()
    exp = "2026-08-13"
    clock = datetime(2026, 8, 12, 11, 0, tzinfo=ZoneInfo("America/New_York"))
    facts = default_static_facts()
    rows = [
        {"side": "call", "strike": 100.0, "bid": 1.0, "ask": 1.2, "mid": 1.1, "iv": 0.2},
        {"side": "call", "strike": 105.0, "bid": 0.5, "ask": 0.6, "mid": 0.55, "iv": 0.2},
    ]
    store.put(
        ChainGeneration(
            key=GenerationKey("SPX", "I:SPX", exp, 25),
            rows=rows,
            spot=100.0,
            as_of="2026-08-12T15:00:00Z",
            content_hash="live1",
        )
    )
    intent = StrategyIntent(
        strategy_id="v",
        product="SPX",
        legs=[
            LegIntent("a", "call", 100, exp, 1, "SPX"),
            LegIntent("b", "call", 105, exp, -1, "SPX"),
        ],
    )
    q = PackagePricer(store, facts=facts, as_of_clock=clock).quote(
        intent, require_epoch_ok=False
    )
    assert q["complete"] is True
    assert q["mark_mode"] == "live"
    assert q.get("mark_disclaimer") is None
    assert q["basis_source"] == "natural_mid"
