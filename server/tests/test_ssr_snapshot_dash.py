"""Chain Snapshot dashboard — localhost bind + day summary."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import pytest


def test_dash_host_localhost_only(monkeypatch):
    monkeypatch.setenv("LABS_SSR_DASH_HOST", "0.0.0.0")
    from market_data.ssr_snapshot_dash import dash_host

    with pytest.raises(RuntimeError, match="localhost only"):
        dash_host()


def test_dash_port_default(monkeypatch):
    monkeypatch.delenv("LABS_SSR_DASH_PORT", raising=False)
    from market_data.ssr_snapshot_dash import dash_port

    assert dash_port() == 5055


def test_summarize_day_nested_and_flat(tmp_path: Path):
    from market_data.ssr_snapshot_dash import summarize_day

    day = date(2026, 8, 17)
    folder = tmp_path / f"day={day.isoformat()}" / "chain"
    spy = folder / "SPY"
    spy.mkdir(parents=True)
    (spy / "snap-033238Z.json").write_text(
        json.dumps(
            {
                "symbol": "SPY",
                "captured_at": "2026-08-17T23:32:38-04:00",
                "phase": "closed",
                "hole": "NO CHAIN SPY",
                "iv_count": 0,
                "greek_count": 0,
            }
        ),
        encoding="utf-8",
    )
    (spy / "snap-033843Z.json").write_text(
        json.dumps(
            {
                "symbol": "SPY",
                "captured_at": "2026-08-17T23:38:43-04:00",
                "phase": "closed",
                "hole": None,
                "iv_count": 62,
                "greek_count": 62,
                "row_count": 62,
            }
        ),
        encoding="utf-8",
    )
    # Friday-flat sibling day
    fri = date(2026, 8, 14)
    flat = tmp_path / f"day={fri.isoformat()}" / "chain"
    flat.mkdir(parents=True)
    (flat / "snap-132009Z.json").write_text(
        json.dumps(
            {
                "topic": "mb:ladder:SPY:2026-08-14:w25:dual",
                "captured_at": "2026-08-14T09:20:09-04:00",
                "phase": "pre",
                "iv_count": 81,
                "row_count": 102,
            }
        ),
        encoding="utf-8",
    )

    mon = summarize_day(day, root=tmp_path)
    assert mon["snaps"] == 2
    assert mon["symbols_with_snaps"] == 1
    assert mon["latest_with_iv"] == 1
    assert mon["latest_holes"] == 0
    assert mon["symbols"][0]["symbol"] == "SPY"
    assert mon["symbols"][0]["iv_count"] == 62

    fri_doc = summarize_day(fri, root=tmp_path)
    assert fri_doc["snaps"] == 1
    assert fri_doc["symbols"][0]["symbol"] == "SPY"
    assert fri_doc["symbols"][0]["phase"] == "pre"
    assert fri_doc["latest_with_iv"] == 1


def test_list_days_newest_first(tmp_path: Path):
    from market_data.ssr_snapshot_dash import list_days

    (tmp_path / "day=2026-08-14").mkdir()
    (tmp_path / "day=2026-08-17").mkdir()
    (tmp_path / "logs").mkdir()
    assert list_days(tmp_path) == ["2026-08-17", "2026-08-14"]
