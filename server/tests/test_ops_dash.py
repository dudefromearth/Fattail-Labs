"""OPS-DASH named states. No Massive. No bins in the snapshot."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from market_data.ops_dash import LIVE_PANE
from market_data.ops_dash.snapshot import build_snapshot, collector_panel
from market_data.vp_engine.coverage import mark_session
from market_data.vp_ingest.store import append_print


def test_live_pane_named_and_retired_html_gone():
    root = Path(__file__).resolve().parents[1] / "market_data" / "ops_dash"
    assert (root / "snapshot.py").is_file()
    assert not (root / "page.py").exists()
    assert LIVE_PANE == "http://studioone.local:5055"
    text = (root / "__init__.py").read_text(encoding="utf-8")
    assert "5055" in text
    assert "custom series" not in text.lower()


def test_snapshot_has_no_bins_key(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("LABS_MARKET_DATA_ROOT", str(tmp_path))
    doc = build_snapshot(root=tmp_path, repo=Path(__file__).resolve().parents[2])
    assert doc["read_only"] is True
    assert doc["no_bins"] is True
    blob = json.dumps(doc)
    assert '"bins"' not in blob
    assert "chain_feed" in doc
    assert set(doc["collectors"]) == {"SPY", "ES", "MES"}


def test_collector_no_coverage_when_empty(tmp_path: Path):
    now = __import__("datetime").datetime.now(
        tz=__import__("zoneinfo").ZoneInfo("America/New_York")
    )
    panel = collector_panel(tmp_path, "SPY", {"sym_feed": {"running": False, "pid": None}}, now, "2026-09-17")
    assert panel["state"] == "NO COVERAGE"


def test_engine_no_coverage_until_binned(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("LABS_MARKET_DATA_ROOT", str(tmp_path))
    append_print(
        tmp_path,
        {
            "sym": "ES",
            "contract": "ESZ6",
            "p": 7700,
            "s": 1,
            "t": 1_789_650_000_000,
            "session_end_date": "2026-09-17",
        },
    )
    mark_session(tmp_path, "ES", date(2026, 9, 17), binned=True)
    doc = build_snapshot(root=tmp_path, repo=Path(__file__).resolve().parents[2])
    assert doc["engine"]["ES"]["sessions_binned"] == 1
    assert doc["engine"]["SPY"]["state"] == "NO COVERAGE"
