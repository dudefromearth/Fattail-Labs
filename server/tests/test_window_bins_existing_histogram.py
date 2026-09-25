"""assemble_window reads ONLY the Engine's existing precomputed histograms
(session/day=*/histogram.json, developing/histogram.json) — no raw print
parsing, no separate precompute pipeline. A day contributes its full
histogram or nothing; there is no intraday time slicing.
"""

from __future__ import annotations

import json
from datetime import date, datetime, timezone
from pathlib import Path

from market_data.vp_engine import window_bins


def _write_histogram(
    root: Path, symbol: str, day: date, bins: list[dict], *, kind: str, vp_row: float = 0.25
) -> None:
    if kind == "developing":
        path = root / "vp" / "engine" / symbol.upper() / "developing" / "histogram.json"
    else:
        path = root / "vp" / "engine" / symbol.upper() / "session" / f"day={day.isoformat()}" / "histogram.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps({"kind": kind, "symbol": symbol, "vp_row": vp_row, "status": "COMPLETE", "bins": bins}),
        encoding="utf-8",
    )


def _write_coverage_floor(root: Path, symbol: str, floor: date) -> None:
    path = root / "vp" / "engine" / "coverage.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    data = json.loads(path.read_text(encoding="utf-8")) if path.is_file() else {}
    data[symbol] = {
        "floor": floor.isoformat(),
        "ceiling": floor.isoformat(),
        "sessions_ingested": [floor.isoformat()],
        "sessions_binned": [floor.isoformat()],
    }
    path.write_text(json.dumps(data), encoding="utf-8")


def _write_ingested_day(root: Path, symbol: str, day: date) -> None:
    path = root / "vp" / "ingest" / symbol.upper() / "trades" / f"day={day.isoformat()}" / "prints.jsonl.gz"
    path.parent.mkdir(parents=True, exist_ok=True)
    import gzip

    with gzip.open(path, "wt", encoding="utf-8") as fh:
        fh.write("")


def _ms(day: date, hour: int, minute: int) -> int:
    dt = datetime(day.year, day.month, day.day, hour, minute, tzinfo=timezone.utc)
    return int(dt.timestamp() * 1000)


def test_reads_completed_day_histogram_verbatim(monkeypatch, tmp_path):
    monkeypatch.setenv("LABS_MARKET_DATA_ROOT", str(tmp_path))
    day = date(2020, 1, 2)
    _write_coverage_floor(tmp_path, "ES", day)
    _write_ingested_day(tmp_path, "ES", day)
    # A later ingested day exists so `day` itself is not "latest" (which
    # would read developing/histogram.json instead of the session file).
    _write_ingested_day(tmp_path, "ES", date(2020, 1, 3))
    _write_histogram(
        tmp_path,
        "ES",
        day,
        [
            {"price": 4000.0, "volume": 5},
            {"price": 4000.25, "volume": 0},
            {"price": 4000.5, "volume": 3},
        ],
        kind="session",
    )
    body = window_bins.assemble_window("ES", from_t=_ms(day, 0, 0), to_t=_ms(day, 23, 59))
    assert body["bin_source"] == "prints"
    assert {b["price"]: b["volume"] for b in body["bins"]} == {4000.0: 5, 4000.5: 3}


def test_latest_day_reads_developing_histogram(monkeypatch, tmp_path):
    monkeypatch.setenv("LABS_MARKET_DATA_ROOT", str(tmp_path))
    today = datetime.now(tz=timezone.utc).date()
    _write_coverage_floor(tmp_path, "ES", today)
    _write_ingested_day(tmp_path, "ES", today)
    _write_histogram(tmp_path, "ES", today, [{"price": 4100.0, "volume": 7}], kind="developing")
    body = window_bins.assemble_window("ES", from_t=_ms(today, 0, 0), to_t=_ms(today, 23, 59))
    assert body["bin_source"] == "prints"
    assert {b["price"]: b["volume"] for b in body["bins"]} == {4100.0: 7}


def test_missing_histogram_contributes_nothing_not_fabricated(monkeypatch, tmp_path):
    """No histogram file for a day → that day contributes zero bins. Never
    falls back to reading raw prints to fabricate one."""
    monkeypatch.setenv("LABS_MARKET_DATA_ROOT", str(tmp_path))
    day = date(2020, 1, 2)
    _write_coverage_floor(tmp_path, "ES", day)
    _write_ingested_day(tmp_path, "ES", day)
    body = window_bins.assemble_window("ES", from_t=_ms(day, 0, 0), to_t=_ms(day, 23, 59))
    assert body["bins"] == []
    assert body["status"] == "EMPTY"


def test_sums_across_multiple_day_histograms(monkeypatch, tmp_path):
    monkeypatch.setenv("LABS_MARKET_DATA_ROOT", str(tmp_path))
    d1 = date(2020, 1, 2)
    d2 = date(2020, 1, 3)
    _write_coverage_floor(tmp_path, "ES", d1)
    _write_ingested_day(tmp_path, "ES", d1)
    _write_ingested_day(tmp_path, "ES", d2)
    _write_histogram(tmp_path, "ES", d1, [{"price": 4000.0, "volume": 5}], kind="session")
    _write_histogram(tmp_path, "ES", d2, [{"price": 4000.0, "volume": 2}, {"price": 4001.0, "volume": 9}], kind="developing")
    body = window_bins.assemble_window("ES", from_t=_ms(d1, 0, 0), to_t=_ms(d2, 23, 59))
    assert {b["price"]: b["volume"] for b in body["bins"]} == {4000.0: 7, 4001.0: 9}
