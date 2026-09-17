"""VPS2 Engine goldens — F1, F2, F5, F7; AT-VPS-1…7, 13. No live Massive."""

from __future__ import annotations

import pytest

from market_data.vp_engine.eligibility import print_eligible
from market_data.vp_engine.histogram import (
    bar_proxy_row,
    bins_canonical_bytes,
    build_histogram,
    canonical_bytes,
    developing_maybe_republish,
)
from market_data.vp_engine.labels import lint
from market_data.vp_engine.rows import row_price


def _p(price, size, *, t=1_000, c=None, oddlot=False):
    return {"p": price, "s": size, "t": t, "c": c or [], "oddlot": oddlot, "sym": "SPY"}


def test_at_vps_1_floor_rule_on_and_off_tick():
    assert row_price(640.00, 0.10) == 640.00
    assert row_price(640.05, 0.10) == 640.00
    assert row_price(640.09, 0.10) == 640.00
    assert row_price(640.10, 0.10) == 640.10
    assert row_price(640.19, 0.10) == 640.10


def _f1_tape():
    # Spec §10 F1
    return [
        _p(640.05, 3, t=10),
        _p(640.07, 2, t=11),
        _p(640.12, 5, t=12),
        _p(640.19, 2, t=13),
        _p(640.25, 7, t=14),
        _p(640.31, 4, t=15),
        _p(640.10, 50, t=16, c=[2]),  # average-price excluded
    ]


def test_f1_prints_to_histogram():
    gap = [{"kind": "feed_liveness", "opened_ms": 100, "closed_ms": 200}]
    h = build_histogram(
        _f1_tape(),
        vp_row=0.10,
        gaps=gap,
        session_date="fixture-f1",
    )
    by = {b["price"]: b["volume"] for b in h["bins"]}
    assert by[640.00] == 5
    assert by[640.10] == 7
    assert by[640.20] == 7
    assert by[640.30] == 4
    assert h["total_volume"] == 23
    assert h["excluded_volume"] == 50
    assert h["gaps"] == gap
    assert h["status"] == "GAPPED"
    assert lint(h) == []


def test_f2_zero_row_honesty():
    tape = [p for p in _f1_tape() if p["p"] not in (640.25,)]  # drop 640.20-bin prints
    # 640.25×7 is the 640.20 bin; also drop average-price
    h = build_histogram(tape, vp_row=0.10, session_date="fixture-f2")
    by = {b["price"]: b["volume"] for b in h["bins"]}
    assert 640.20 in by
    assert by[640.20] == 0
    assert h["status"] == "COMPLETE"


def test_f5_gap_excludes_and_prior_complete():
    prior = build_histogram(_f1_tape()[:6], vp_row=0.10, session_date="d0")
    assert prior["status"] == "COMPLETE"
    hole = [{"kind": "feed_liveness", "opened_ms": 50, "closed_ms": 50 + 6 * 60 * 1000}]
    mid = _p(640.05, 9, t=50 + 3 * 60 * 1000)  # inside 6-min hole
    after = _p(640.05, 1, t=50 + 7 * 60 * 1000)
    h = build_histogram(
        [_p(640.05, 3, t=10), mid, after],
        vp_row=0.10,
        gaps=hole,
        session_date="d1",
    )
    assert h["status"] == "GAPPED"
    assert h["total_volume"] == 4  # 3 + 1, not the 9
    assert h["excluded_volume"] == 9
    assert prior["status"] == "COMPLETE"


def test_f3_offset_republish_bins_byte_identical():
    """v0.6.1 F3: bins stay source-space; offset republish does not rewrite them."""
    h = build_histogram(_f1_tape()[:6], vp_row=0.10, session_date="f3")
    a = {
        **h,
        "mapping": {
            "ratio": 1,
            "offset_published": 2.48,
            "offset_fit": 2.52,
        },
    }
    b = {
        **h,
        "mapping": {
            "ratio": 1,
            "offset_published": 2.60,
            "offset_fit": 2.60,
        },
    }
    assert bins_canonical_bytes(a) == bins_canonical_bytes(b)
    assert bins_canonical_bytes(a) == bins_canonical_bytes(h)
    assert a["bins"] == h["bins"]


def test_composite_is_fenced():
    with pytest.raises(ValueError, match="composite is fenced"):
        build_histogram(_f1_tape()[:6], vp_row=0.10, kind="composite")


def test_f7_parameter_change_new_hash():
    a = build_histogram(_f1_tape()[:6], vp_row=0.10, session_date="d")
    b = build_histogram(_f1_tape()[:6], vp_row=0.25, session_date="d")
    assert a["parameter_hash"] != b["parameter_hash"]
    assert a["generation_id"] != b["generation_id"]
    assert canonical_bytes(a) != canonical_bytes(b)
    a2 = build_histogram(_f1_tape()[:6], vp_row=0.10, session_date="d")
    assert canonical_bytes(a) == canonical_bytes(a2)


def test_at_vps_2_zero_rows_not_omitted():
    test_f2_zero_row_honesty()


def test_at_vps_3_gap_listed_no_interpolation():
    test_f5_gap_excludes_and_prior_complete()


def test_at_vps_4_quiet_printing_not_gap():
    tape = [_p(640.05, 1, t=i) for i in range(10, 20)]
    h = build_histogram(tape, vp_row=0.10)
    assert h["status"] == "COMPLETE"
    assert h["gaps"] == []


def test_at_vps_5_developing_no_republish_without_volume():
    h1 = build_histogram(_f1_tape()[:6], vp_row=0.10, kind="developing")
    h2 = build_histogram(_f1_tape()[:6], vp_row=0.10, kind="developing")
    kept = developing_maybe_republish(h1, h2)
    assert kept is h1
    h3 = build_histogram(_f1_tape()[:6] + [_p(640.05, 8, t=99)], vp_row=0.10, kind="developing")
    pub = developing_maybe_republish(h1, h3)
    assert pub is h3
    assert pub["total_volume"] == h1["total_volume"] + 8


def test_at_vps_6_rebuild_byte_identity():
    test_f7_parameter_change_new_hash()


def test_at_vps_7_no_forbidden_labels():
    h = build_histogram(_f1_tape()[:6], vp_row=0.10)
    assert lint(h) == []
    assert "poc" not in str(h).lower()


def test_at_vps_13_bar_proxy_vwap_else_close():
    a = bar_proxy_row(volume=1000, vwap=640.07, close=640.20, vp_row=0.10)
    assert a["flags"]["approximation"] == "bar_vwap"
    assert a["bins"][0]["price"] == 640.00
    b = bar_proxy_row(volume=1000, vwap=None, close=640.20, vp_row=0.10)
    assert b["flags"]["approximation"] == "bar_close"
    assert b["bins"][0]["price"] == 640.20
    assert lint(a) == []


def test_q5_oddlot_excluded():
    tape = [_p(640.05, 3), _p(640.05, 7, oddlot=True, c=[37])]
    h = build_histogram(tape, vp_row=0.10)
    assert h["total_volume"] == 3
    assert h["excluded_volume"] == 7
    assert not print_eligible(_p(640.05, 7, oddlot=True, c=[37]))
