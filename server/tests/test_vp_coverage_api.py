"""Coverage floor + /range refuse. No live Massive."""

from __future__ import annotations

from datetime import date

from market_data.vp_api.range_gate import refuse_below_floor
from market_data.vp_engine.coverage import (
    is_contiguous,
    mark_session,
    next_backfill_session,
)
from market_data.vp_engine.histogram import build_histogram
from market_data.vp_ingest.store import append_print
from market_data.vp_engine.rebuild import rebuild_session


def test_contiguous_allows_weekend_hole():
    days = [date(2026, 9, 11), date(2026, 9, 14)]  # Fri + Mon; Sat/Sun are not RTH keys
    assert is_contiguous(days) is True
    days2 = [date(2026, 9, 17)]
    assert is_contiguous(days2) is True


def test_newest_first_next_is_yesterday(tmp_path):
    mark_session(tmp_path, "ES", date(2026, 9, 17), binned=False)
    nxt = next_backfill_session(tmp_path, "ES", today=date(2026, 9, 17))
    assert nxt == date(2026, 9, 16)


def test_refuse_range_below_floor():
    floor = date(2026, 9, 17)
    ceil = date(2026, 9, 17)
    assert refuse_below_floor(
        from_d=date(2026, 9, 1), to_d=date(2026, 9, 17), floor=floor, ceiling=ceil
    ) == {"error": "range_below_coverage", "coverage_floor": "2026-09-17"}
    assert (
        refuse_below_floor(
            from_d=date(2026, 9, 17), to_d=date(2026, 9, 17), floor=floor, ceiling=ceil
        )
        is None
    )


def test_allow_partial_is_truncated_slice():
    from market_data.vp_api.range_gate import range_decision

    kind, extra = range_decision(
        from_d=date(2026, 1, 1),
        to_d=date(2026, 9, 17),
        floor=date(2026, 9, 17),
        ceiling=date(2026, 9, 17),
        allow_partial=True,
    )
    assert kind == "partial"
    assert extra is not None
    assert extra["truncated"] is True
    assert extra["served_from"] == "2026-09-17"


def test_rebuild_marks_coverage(tmp_path):
    append_print(
        tmp_path,
        {
            "sym": "ES",
            "contract": "ESZ6",
            "p": 7700.10,
            "s": 1,
            "t": 1_789_650_000_000,
            "session_end_date": "2026-09-17",
        },
    )
    h = rebuild_session(
        root=tmp_path, symbol="ES", session_date=date(2026, 9, 17), kind="session"
    )
    assert h["bins"]
    assert h["kind"] == "session"
    from market_data.vp_engine.coverage import floor_of

    assert floor_of(tmp_path, "ES") == date(2026, 9, 17)
    # F3 still: bins not rewritten by mapping
    h2 = build_histogram(
        [{"p": 7700.10, "s": 1, "t": 1, "c": [], "oddlot": False, "sym": "ES"}],
        vp_row=0.25,
        kind="session",
        symbol="ES",
        session_date="2026-09-17",
    )
    assert h2["bins"][0]["price"] == 7700.00
