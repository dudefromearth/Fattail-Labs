"""Unit tests for primitive Algo day path (no Massive)."""

from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

from market_data.algo_replay_path import samples_from_marks_jsonl, samples_from_ohlc_bars

NY = ZoneInfo("America/New_York")


def test_marks_jsonl_extracts_mid_and_time(tmp_path):
    p = tmp_path / "spx.jsonl"
    p.write_text(
        '{"captured_at":"2026-08-20T13:30:00-04:00","mid":7641.1}\n'
        '{"captured_at":"2026-08-20T13:30:05-04:00","mid":7642.0}\n'
        "not-json\n"
        '{"captured_at":"2026-08-20T13:30:10-04:00","mid":0}\n',
        encoding="utf-8",
    )
    rows = samples_from_marks_jsonl(p)
    assert len(rows) == 2
    assert rows[0]["spot"] == 7641.1
    assert rows[1]["spot"] == 7642.0
    assert rows[1]["t_ms"] > rows[0]["t_ms"]


def test_ohlc_bars_filter_to_ny_day():
    t0 = int(datetime(2026, 8, 20, 10, 0, tzinfo=NY).timestamp() * 1000)
    t1 = int(datetime(2026, 8, 21, 10, 0, tzinfo=NY).timestamp() * 1000)
    bars = [
        {"t": t0, "c": 7640.0},
        {"t": t1, "c": 7700.0},
        {"t": t0 + 300_000, "c": 7645.0},
    ]
    rows = samples_from_ohlc_bars(bars, "2026-08-20")
    assert [r["spot"] for r in rows] == [7640.0, 7645.0]
