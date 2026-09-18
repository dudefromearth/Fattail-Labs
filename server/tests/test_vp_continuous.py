"""D6 back-adjusted continuous series. No live Massive."""

from __future__ import annotations

from datetime import date
from pathlib import Path

from market_data.vp_engine.continuous import (
    METHOD,
    VERSION,
    build_roll_table,
    last_price,
    shift_bars,
    shift_bins,
)
from market_data.vp_engine.coverage import mark_session
from market_data.vp_ingest.store import append_print


def _print(root: Path, *, day: str, contract: str, p: float, s: int, t: int) -> None:
    append_print(
        root,
        {
            "sym": "ES",
            "contract": contract,
            "p": p,
            "s": s,
            "t": t,
            "session_end_date": day,
        },
    )


def test_roll_gap_shifts_old_era_into_current_frame(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("LABS_MARKET_DATA_ROOT", str(tmp_path))
    # 09-17: ESU6 only at 100. 09-18: both, ESZ6 volume-leads at 110, ESU6 last 100.
    _print(tmp_path, day="2026-09-17", contract="ESU6", p=100.0, s=50, t=1)
    _print(tmp_path, day="2026-09-18", contract="ESU6", p=100.0, s=5, t=10)
    _print(tmp_path, day="2026-09-18", contract="ESZ6", p=110.0, s=80, t=11)
    mark_session(tmp_path, "ES", date(2026, 9, 17), binned=True)
    mark_session(tmp_path, "ES", date(2026, 9, 18), binned=True)

    from market_data.vp_engine.rebuild import load_prints

    doc = build_roll_table(tmp_path, "ES", load_prints=load_prints)
    assert doc["method"] == METHOD
    assert doc["version"] == VERSION
    assert len(doc["rolls"]) == 1
    assert doc["rolls"][0]["from"] == "ESU6"
    assert doc["rolls"][0]["to"] == "ESZ6"
    assert doc["rolls"][0]["gap"] == 10.0
    assert doc["adjust"]["2026-09-18"] == 0.0
    assert doc["adjust"]["2026-09-17"] == 10.0

    shifted = shift_bins([{"price": 100.0, "volume": 50}], 10.0)
    assert shifted[0]["price"] == 110.0
    bars = shift_bars([{"o": 99.0, "h": 101.0, "l": 98.0, "c": 100.0, "v": 1}], 10.0)
    assert bars[0]["c"] == 110.0
    assert bars[0]["o"] == 109.0


def test_spy_has_no_rolls(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("LABS_MARKET_DATA_ROOT", str(tmp_path))
    append_print(tmp_path, {"sym": "SPY", "p": 500, "s": 1, "t": 1, "c": []})
    mark_session(tmp_path, "SPY", date(2026, 9, 17), binned=True)
    from market_data.vp_engine.rebuild import load_prints

    doc = build_roll_table(tmp_path, "SPY", load_prints=load_prints)
    assert doc["rolls"] == []


def test_range_across_roll_is_one_band(tmp_path: Path, monkeypatch):
    """T5 unit: 09-17 ESU6 + 09-18 ESZ6 accumulate at the current-frame price."""
    monkeypatch.setenv("LABS_MARKET_DATA_ROOT", str(tmp_path))
    _print(tmp_path, day="2026-09-17", contract="ESU6", p=100.0, s=50, t=1)
    _print(tmp_path, day="2026-09-18", contract="ESU6", p=100.0, s=5, t=10)
    _print(tmp_path, day="2026-09-18", contract="ESZ6", p=110.0, s=80, t=11)
    mark_session(tmp_path, "ES", date(2026, 9, 17), binned=True)
    mark_session(tmp_path, "ES", date(2026, 9, 18), binned=True)
    from market_data.vp_engine.rebuild import load_prints, rebuild_session

    rebuild_session(root=tmp_path, symbol="ES", session_date=date(2026, 9, 17))
    rebuild_session(root=tmp_path, symbol="ES", session_date=date(2026, 9, 18))
    from market_data.vp_engine.continuous import VERSION, load_roll_table
    import json

    doc = load_roll_table(tmp_path, "ES")
    assert doc and doc["rolls"]
    acc: dict[float, int] = {}
    for iso in ("2026-09-17", "2026-09-18"):
        hist = json.loads(
            (
                tmp_path
                / "vp/engine/ES/continuous"
                / VERSION
                / "session"
                / f"day={iso}"
                / "histogram.json"
            ).read_text()
        )
        for bn in hist["bins"]:
            acc[float(bn["price"])] = acc.get(float(bn["price"]), 0) + int(bn["volume"])
    assert 100.0 not in acc
    assert 110.0 in acc
    assert acc[110.0] >= 50


def test_last_price_uses_final_print():
    rows = [
        {"contract": "ESU6", "p": 1},
        {"contract": "ESZ6", "p": 2},
        {"contract": "ESU6", "p": 3},
    ]
    assert last_price(rows, "ESU6") == 3.0
    assert last_price(rows, "ESZ6") == 2.0
