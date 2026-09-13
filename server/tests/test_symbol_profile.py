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


XSP_SPY_WIDTHS = [1, 2, 3, 4, 5, 6, 7]
MSC_SPX_WIDTHS = [20, 25, 30, 35, 40, 45, 50]


def test_at_xs12_xsp_fixed_points_overlay_keeps_fetch_step_floor():
    """Migrate-152 overlay: XSP 1–7 fixed_points; fetch_step_floor stays 5.0."""
    p = resolve_symbol_profile(
        {
            "symbol": "XSP",
            "kind": "index",
            "strike_step": 1.0,
            "app_profile_json": {
                "fly_width_mode": "fixed_points",
                "fly_widths": list(XSP_SPY_WIDTHS),
                "fetch_step_floor": 5.0,
            },
        }
    )
    assert p["fly_width_mode"] == "fixed_points"
    assert p["fly_widths"] == XSP_SPY_WIDTHS
    assert p["fetch_step_floor"] == 5.0
    assert p["source"] == "market_symbol_universe"
    assert p["kind"] == "index"


def test_at_xs12_spy_fixed_points_overlay_keeps_fetch_step_floor():
    """Migrate-152 overlay: SPY 1–7 fixed_points; fetch_step_floor stays 2.5."""
    p = resolve_symbol_profile(
        {
            "symbol": "SPY",
            "kind": "etf",
            "strike_step": 1.0,
            "app_profile_json": {
                "fly_width_mode": "fixed_points",
                "fly_widths": list(XSP_SPY_WIDTHS),
                "fly_width_count": 8,
                "fetch_step_floor": 2.5,
            },
        }
    )
    assert p["fly_width_mode"] == "fixed_points"
    assert p["fly_widths"] == XSP_SPY_WIDTHS
    assert p["fetch_step_floor"] == 2.5
    assert p["source"] == "market_symbol_universe"
    assert p["kind"] == "etf"


def test_at_xs12_overlay_omitting_floor_keeps_kind_default():
    """JSON_SET only mode+widths — omitted fetch_step_floor stays kind default."""
    xsp = resolve_symbol_profile(
        {
            "symbol": "XSP",
            "kind": "index",
            "strike_step": 1.0,
            "app_profile_json": {
                "fly_width_mode": "fixed_points",
                "fly_widths": list(XSP_SPY_WIDTHS),
            },
        }
    )
    spy = resolve_symbol_profile(
        {
            "symbol": "SPY",
            "kind": "etf",
            "strike_step": 1.0,
            "app_profile_json": {
                "fly_width_mode": "fixed_points",
                "fly_widths": list(XSP_SPY_WIDTHS),
            },
        }
    )
    assert xsp["fly_widths"] == XSP_SPY_WIDTHS
    assert xsp["fetch_step_floor"] == kind_defaults("index")["fetch_step_floor"]
    assert spy["fly_widths"] == XSP_SPY_WIDTHS
    assert spy["fetch_step_floor"] == kind_defaults("etf")["fetch_step_floor"]


def test_at_xs12_spx_vix_unchanged_msc_spx():
    """SPX / VIX stay msc_spx 20…50; fetch_step_floor 5.0 (not migrate-152)."""
    for symbol in ("SPX", "VIX"):
        p = resolve_symbol_profile(
            {
                "symbol": symbol,
                "kind": "index",
                "strike_step": 5,
                "app_profile_json": {
                    "fly_width_mode": "msc_spx",
                    "fly_widths": list(MSC_SPX_WIDTHS),
                    "fetch_step_floor": 5.0,
                },
            }
        )
        assert p["fly_width_mode"] == "msc_spx", symbol
        assert p["fly_widths"] == MSC_SPX_WIDTHS, symbol
        assert p["fetch_step_floor"] == 5.0, symbol
        assert p["source"] == "market_symbol_universe", symbol
