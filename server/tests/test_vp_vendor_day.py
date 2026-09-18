"""Vendor day mapping + autorun continues independents. No live Massive."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from market_data.vp_ingest.vendor_day import rest_futures_to_rec, rest_stock_to_rec, write_day_prints
from market_data.vp_ops import autorun


def test_rest_stock_maps_captured_first_spy_print():
    row = {
        "conditions": [12, 37],
        "exchange": 8,
        "id": "52983525027890",
        "participant_timestamp": 1789632000000110000,
        "price": 759.36,
        "sequence_number": 3006,
        "sip_timestamp": 1789632000015817760,
        "size": 5,
    }
    rec = rest_stock_to_rec(row, symbol="SPY")
    assert rec["sym"] == "SPY"
    assert rec["p"] == 759.36
    assert rec["s"] == 5
    assert rec["t"] == 1789632000015
    assert rec["oddlot"] is True
    assert rec["auction"] is False
    assert rec["x"] == 8
    assert rec["c"] == [12, 37]


def test_rest_futures_maps_es():
    rec = rest_futures_to_rec(
        {
            "ticker": "ESU6",
            "timestamp": 1789596000309662041,
            "price": 7557.5,
            "size": 1,
            "session_end_date": "2026-09-17",
            "sequence_number": 1,
        }
    )
    assert rec is not None
    assert rec["sym"] == "ES"
    assert rec["contract"] == "ESU6"
    assert rec["session_end_date"] == "2026-09-17"


def test_write_day_prints_manifest(tmp_path: Path):
    recs = [
        {"sym": "SPY", "p": 1, "s": 1, "t": 1, "c": []},
        {"sym": "SPY", "p": 2, "s": 2, "t": 2, "c": []},
    ]
    man = write_day_prints(tmp_path, "SPY", date(2026, 9, 17), recs, vendor="test")
    assert man["count"] == 2
    assert man["complete"] is True
    assert man["sha256"]
    assert (tmp_path / "vp/ingest/SPY/trades/day=2026-09-17/prints.jsonl.gz").is_file()
    assert (tmp_path / "vp/ingest/SPY/trades/day=2026-09-17/manifest.json").is_file()


def test_autorun_continues_when_a_fails(tmp_path: Path, monkeypatch):
    q = {
        "items": [
            {"id": "A-BACKFILL-5", "depends_on": [], "cmd": "exit 2"},
            {"id": "B-HOT-126-STABLE", "depends_on": [], "cmd": "exit 0"},
            {"id": "C-DEEP", "depends_on": ["A-BACKFILL-5"], "cmd": "exit 0"},
            {"id": "F-COMMIT-HELP-WATCH", "depends_on": [], "cmd": "exit 0"},
        ]
    }
    queue = tmp_path / "evening-queue.json"
    queue.write_text(json.dumps(q), encoding="utf-8")
    reports = tmp_path / "reports"
    monkeypatch.setattr(autorun, "QUEUE", queue)
    monkeypatch.setattr(autorun, "REPORTS", reports)
    rc = autorun.main()
    assert rc == 0
    text = (reports / f"autorun-{__import__('datetime').date.today().isoformat()}.md").read_text()
    assert "A-BACKFILL-5: exit 2" in text
    assert "B-HOT-126-STABLE: exit 0" in text
    assert "C-DEEP: SKIP" in text
    assert "F-COMMIT-HELP-WATCH: exit 0" in text
