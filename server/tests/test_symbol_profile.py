"""Per-symbol app profile resolution."""

from market_data.symbol_profile import kind_defaults, resolve_symbol_profile


def test_spx_index_msc_widths():
    p = resolve_symbol_profile(
        {
            "symbol": "SPX",
            "kind": "index",
            "strike_step": 5,
            "app_profile_json": {
                "fly_width_mode": "msc_spx",
                "fly_widths": [20, 25, 30, 35, 40, 45, 50],
            },
        }
    )
    assert p["fly_widths"][0] == 20
    assert p["fly_widths"][-1] == 50
    assert p["default_wings"] == 25
    assert p["fetch_step_floor"] == 5.0


def test_tsla_step_multiples():
    p = resolve_symbol_profile(
        {
            "symbol": "TSLA",
            "kind": "equity",
            "strike_step": 2.5,
            "app_profile_json": {
                "fly_width_mode": "step_multiples",
                "fly_width_count": 4,
            },
        }
    )
    assert p["fly_widths"] == [2.5, 5.0, 7.5, 10.0]
    assert p["fetch_step_floor"] == 2.5


def test_kind_defaults_etf():
    d = kind_defaults("etf")
    assert d["fly_width_mode"] == "step_multiples"


def test_kind_defaults_session_bounds_od_sess_3():
    """Index 16:15 vs equity 16:00 — session class, not τ."""
    assert kind_defaults("index")["rth_close"] == "16:15"
    assert kind_defaults("equity")["rth_close"] == "16:00"
    assert kind_defaults("etf")["rth_close"] == "16:00"
    idx = resolve_symbol_profile({"symbol": "SPX", "kind": "index"})
    eq = resolve_symbol_profile({"symbol": "AAPL", "kind": "equity"})
    assert idx["rth_close"] == "16:15"
    assert eq["rth_close"] == "16:00"
