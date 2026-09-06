"""Characterization: Monte Carlo over fills. AT-ATRV-15, 19, 20, 23, 24, 30."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from quant.build import build_day
from quant.simulate import (BAND_KEYS, DISPLAY_LEGAL, Leg, Params, SimulateRefusal,
                            simulate, simulate_path)
from quant.store import DayStore
from tests.quant_fixture import write_day

pytest.importorskip("zstandard")


@pytest.fixture(scope="module")
def st(tmp_path_factory) -> DayStore:
    root = tmp_path_factory.mktemp("qs")
    arch = write_day(root / "arch", snaps=120)
    build_day(arch, root / "store", "2026-09-04", "XSP", greeks_quantum=6, verify=False)
    return DayStore(root / "store" / "day=2026-09-04" / "book=XSP")


def fly(st):
    return [Leg(st.find(628.0, "C"), 1), Leg(st.find(630.0, "C"), -2), Leg(st.find(632.0, "C"), 1)]


def prm(seed=42, paths=400, **kw):
    base = dict(seed=seed, paths=paths, strategy_id="fly", p_fill=0.85, fee_per_contract=0.65)
    base.update(kw)
    return Params(**base)


def test_same_seed_is_byte_identical(st):
    a = simulate(st, fly(st), 5, 100, prm())
    b = simulate(st, fly(st), 5, 100, prm())
    assert json.dumps(a, sort_keys=True) == json.dumps(b, sort_keys=True)


def test_path_stream_is_function_of_seed_strategy_index(st):
    """AT-ATRV-23: path i is the same whether computed first, last, or alone."""
    p = prm()
    solo = simulate_path(st, fly(st), 6, 101, p, 37)
    reverse = [simulate_path(st, fly(st), 6, 101, p, i) for i in range(50, -1, -1)]
    assert reverse[50 - 37] == solo


def test_different_seed_differs(st):
    a = simulate(st, fly(st), 5, 100, prm(seed=1))
    b = simulate(st, fly(st), 5, 100, prm(seed=2))
    assert a["bands"] != b["bands"]


def test_every_fill_is_taxed(st):
    """AT-ATRV-15: no untaxed fill. Friction and fees both > 0 on every traded path."""
    for i in range(50):
        r = simulate_path(st, fly(st), 5, 100, prm(), i)
        if r["traded"]:
            assert r["friction"] > 0 and r["fees"] > 0


def test_no_scalar_pnl_and_no_featured_quantile(st):
    """AT-ATRV-19 / 30: the primitive is a distribution; no top-level p50/mean."""
    r = simulate(st, fly(st), 5, 100, prm())
    for banned in ("pnl", "mean", "expected", "sharpe", "win_rate", "p50", "standard_error"):
        assert banned not in r
    assert set(r["bands"]) == set(BAND_KEYS)              # the set exists
    assert "tail_cvar" not in r and "tail_cvar" in r["researcher_only"]
    assert "tail_cvar" not in r["display_legal"]
    assert set(r["display_legal"]) == set(DISPLAY_LEGAL)


def test_modality_reported_and_stability_present(st):
    r = simulate(st, fly(st), 5, 100, prm(paths=600))
    assert r["modality"]["n_modes"] is not None
    assert "n_half_vs_n" in r["stability"]
    assert r["fidelity"] == "era1_no_depth"
    assert r["assumptions"]["fill_model"] == "unfitted_pessimistic"


def test_entry_nofill_is_no_trade(st):
    r = simulate(st, fly(st), 5, 100, prm(p_fill=0.5, paths=300))
    assert r["n_traded"] < r["n"]
    assert 0 < r["no_fill_rate"]["entry"] < 1


def test_refuses_absent_leg_by_name(st):
    late = st.find(619.0, "C")            # admitted after ~60 snaps
    with pytest.raises(SimulateRefusal) as ei:
        simulate(st, [Leg(late, 1)], 0, 100, prm())
    assert ei.value.code == "LEG_ABSENT_AT_INSTANT"


def test_refuses_bad_window(st):
    with pytest.raises(SimulateRefusal) as ei:
        simulate(st, fly(st), 100, 5, prm())
    assert ei.value.code == "BAD_WINDOW"


def test_sweep_pools_every_entry_and_is_reproducible(st):
    from quant.simulate import sweep_entries
    r = sweep_entries(st, fly(st), 5, 60, 100, step=5, prm=prm(paths=40), paths_per_entry=40)
    assert r["entries"] == 12 and r["n_pooled"] > 0
    assert "p50" not in r and set(r["bands"]) == set(BAND_KEYS)
    r2 = sweep_entries(st, fly(st), 5, 60, 100, step=5, prm=prm(paths=40), paths_per_entry=40)
    assert json.dumps(r, sort_keys=True) == json.dumps(r2, sort_keys=True)
