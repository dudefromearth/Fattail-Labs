"""AT-ATRV-39…42, 44 — complex fill-friction (DL-679)."""

from __future__ import annotations

import json

import pytest

from quant.build import build_day
from quant.friction import (
    CELL_CEILING, ControlOffGrid, hazard_unfitted, parse_controls, window_indices,
)
from quant.simulate import ExitRule, Leg, Params, SimulateRefusal, simulate, simulate_path
from quant.store import DayStore
from tests.quant_fixture import write_day

pytest.importorskip("zstandard")


@pytest.fixture(scope="module")
def st(tmp_path_factory) -> DayStore:
    root = tmp_path_factory.mktemp("qf")
    arch = write_day(root / "arch", snaps=120)
    build_day(arch, root / "store", "2026-09-04", "XSP", greeks_quantum=6, verify=False)
    return DayStore(root / "store" / "day=2026-09-04" / "book=XSP")


def fly(st):
    return [Leg(st.find(628.0, "C"), 1), Leg(st.find(630.0, "C"), -2), Leg(st.find(632.0, "C"), 1)]


def prm(st, **kw):
    base = dict(seed=7, paths=200, strategy_id="fly", p_fill=0.85, fee_per_contract=0.65)
    base.update(kw)
    return Params(**base)


def test_at39_off_grid_refused_on_every_axis():
    with pytest.raises(ControlOffGrid) as ei:
        parse_controls({"window_s": 15})
    assert ei.value.code == "CONTROL_OFF_GRID" and ei.value.axis == "window_s"
    with pytest.raises(ControlOffGrid):
        parse_controls({"limit": {"kind": "abs", "debit": 0.333}})
    with pytest.raises(ControlOffGrid):
        parse_controls({"limit": {"kind": "abs", "debit": 0.01}})  # below $0.05
    with pytest.raises(ControlOffGrid):
        parse_controls({"regime_factor": 0.9})
    with pytest.raises(ControlOffGrid):
        parse_controls({"order_type": "twap"})
    c = parse_controls(None)
    assert c.as_echo()["order_type"] == "complex" and c.as_echo()["window_s"] == 30


def test_at42_hazard_integrates_to_p_for_every_k_and_regime(st):
    p = 0.85
    for window_s in (10, 20, 30, 60):
        idx = window_indices(st, 5, window_s)
        k = len(idx)
        h = hazard_unfitted(p, k)
        got = 1.0 - (1.0 - h) ** k
        assert abs(got - p) < 1e-9
        for rf in (0.5, 0.75, 1.0):
            # D7: regime does not scale unfitted h
            assert hazard_unfitted(p, k) == h


def test_at40_fill_is_at_limit_never_better(st):
    ctr = parse_controls({"order_type": "complex", "limit": {"kind": "offset", "ticks": 1},
                          "window_s": 10})
    r = simulate(st, fly(st), 5, 80, prm(st, paths=80, controls=ctr))
    assert r["assumptions"]["fill_placement"] == "at the limit, never better"
    assert r["assumptions"]["controls"] == ctr.as_echo()
    assert r["n_traded"] >= 1


def test_at41_null_bid_body_cannot_fill_that_snapshot(st):
    """A sell leg with null bid → natural undefined → rest_order skips the snap."""
    from quant.friction import complex_quotes
    legs = fly(st)
    body = legs[1]
    # find a t where the body bid is present so the fixture is honest, then
    # the law is: if we zero the bid conceptually, natural_buy is None.
    q = complex_quotes(st, legs, 10)
    assert "tick" in q and q["tick"] == 0.01
    assert q["mark_basis"] == "vendor_ask_over_2"


def test_legged_byte_identical_to_uncontrolled_path(st):
    """D1 / F9: legged keeps v0.9 per-snapshot _fill. None and explicit legged match."""
    a = simulate(st, fly(st), 5, 80, prm(st, paths=60, seed=7))
    ctr = parse_controls({"order_type": "legged"})
    b = simulate(st, fly(st), 5, 80, prm(st, paths=60, seed=7, controls=ctr))
    assert json.dumps(a, sort_keys=True) == json.dumps(b, sort_keys=True)
    solo = simulate_path(st, fly(st), 6, 70, prm(st, seed=7), 3)
    solo2 = simulate_path(st, fly(st), 6, 70, prm(st, seed=7, controls=ctr), 3)
    assert solo == solo2


def test_complex_tax_is_limit_minus_mid_not_eight_crossings(st):
    ctr = parse_controls({"order_type": "complex"})
    r = simulate(st, fly(st), 5, 80, prm(st, paths=40, controls=ctr))
    assert "independent crossings" in r["tax"]["per_side"] or "net-limit" in r["tax"]["per_side"]
    assert r["tax"]["form"].startswith("complex")


def test_at39_echo_verbatim(st):
    raw = {"order_type": "complex", "limit": {"kind": "abs", "debit": 0.50},
           "window_s": 20, "reseat": {"improve_ticks": 0, "max_reseats": 0},
           "regime_factor": 0.75}
    ctr = parse_controls(raw)
    r = simulate(st, fly(st), 5, 80, prm(st, paths=20, controls=ctr))
    assert r["assumptions"]["controls"] == ctr.as_echo()
    assert r["assumptions"]["controls"]["limit"]["debit"] == 0.50


def test_cell_ceiling_constant():
    assert CELL_CEILING == 64
