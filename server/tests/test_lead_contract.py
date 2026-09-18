"""Derived lead-contract rule. No hardcoded ESU6/ESZ6 in the rule."""

from datetime import date

from market_data.vp_ingest.lead_contract import select_lead_contract


def _p(contract: str, size: int) -> dict:
    return {"contract": contract, "s": size, "p": 1}


META = [
    {"ticker": "ESU6", "product_code": "ES", "last_trade_date": "2026-09-18"},
    {"ticker": "ESZ6", "product_code": "ES", "last_trade_date": "2026-12-18"},
]


def test_volume_only_without_contracts():
    prints = [_p("ESU6", 100), _p("ESZ6", 5)]
    lead, rule = select_lead_contract(prints, product="ES")
    assert lead == "ESU6"
    assert rule == "volume_only"


def test_roll_week_follows_volume_leader():
    prints = [_p("ESU6", 10), _p("ESZ6", 90)]
    lead, rule = select_lead_contract(
        prints, product="ES", contracts=META, as_of=date(2026, 9, 18)
    )
    assert lead == "ESZ6"
    assert rule == "volume_in_roll_window"


def test_outside_roll_window_front_even_if_next_prints():
    prints = [_p("ESU6", 5), _p("ESZ6", 99)]
    lead, rule = select_lead_contract(
        prints, product="ES", contracts=META, as_of=date(2026, 8, 1)
    )
    assert lead == "ESU6"
    assert rule == "front_calendar"


def test_after_front_expiry_next_is_the_new_front():
    prints = [_p("ESU6", 50), _p("ESZ6", 1)]
    lead, rule = select_lead_contract(
        prints, product="ES", contracts=META, as_of=date(2026, 9, 19)
    )
    assert lead == "ESZ6"
    assert rule == "front_calendar"


def test_ohlc_uses_lead_rule_not_hardcoded_ticker():
    from sa_dev.service import bars_from_prints

    t0 = 1_789_727_400_000
    rows = [
        {"p": 7719.25, "t": t0, "s": 10, "contract": "ESZ6"},
        {"p": 7652.25, "t": t0 + 400, "s": 2, "contract": "ESU6"},
        {"p": 7721.0, "t": t0 + 4000, "s": 12, "contract": "ESZ6"},
    ]
    bars, gaps, contract, rule = bars_from_prints(
        rows, tf="5m", product="ES", contracts=META, as_of=date(2026, 9, 18)
    )
    assert contract == "ESZ6"
    assert rule == "volume_in_roll_window"
    assert bars[0]["l"] == 7719.25
