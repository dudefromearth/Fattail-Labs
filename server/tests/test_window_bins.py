"""REQ-007 v2 window bins — coverage queried, no capture-start date literal."""

from __future__ import annotations

from datetime import date, datetime, timezone
from pathlib import Path

from market_data.vp_engine import window_bins


def test_no_capture_start_date_literal():
    text = Path(window_bins.__file__).read_text(encoding="utf-8")
    for tok in ("2026-09-06", "2026-09-07", "Sep 6", "September 6"):
        assert tok not in text


def test_empty_window_has_bin_source(monkeypatch, tmp_path):
    monkeypatch.setenv("LABS_MARKET_DATA_ROOT", str(tmp_path))
    t0 = int(datetime(2026, 8, 1, tzinfo=timezone.utc).timestamp() * 1000)
    t1 = t0 + 3600_000
    body = window_bins.assemble_window("ES", from_t=t0, to_t=t1)
    assert body["kind"] == "window"
    assert body["bin_source"] in ("prints", "aggs-derived", "mixed")
    assert "bins" in body
