"""Developing-only bin loop + session clock. No live Massive."""

from __future__ import annotations

from datetime import date
from pathlib import Path

from market_data.vp_engine.bin_landed import bin_developing, ingested_days, latest_ingested_day
from market_data.vp_engine.coverage import mark_session
from market_data.vp_ingest.store import append_print
from market_data.vp_ingest.futures_schedules import session_is_open


def test_latest_ingested_not_calendar_today(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("LABS_MARKET_DATA_ROOT", str(tmp_path))
    append_print(
        tmp_path,
        {
            "sym": "ES",
            "contract": "ESZ6",
            "p": 6700.0,
            "s": 1,
            "t": 1,
            "session_end_date": "2026-09-21",
        },
    )
    assert latest_ingested_day(tmp_path, "ES") == date(2026, 9, 21)
    assert date(2026, 9, 21) in ingested_days(tmp_path, "ES")


def test_bin_developing_only_latest(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("LABS_MARKET_DATA_ROOT", str(tmp_path))
    for iso in ("2026-09-17", "2026-09-18"):
        append_print(
            tmp_path,
            {
                "sym": "ES",
                "contract": "ESZ6",
                "p": 6700.0,
                "s": 1,
                "t": 1,
                "session_end_date": iso,
            },
        )
        mark_session(tmp_path, "ES", date.fromisoformat(iso), binned=False)
        mark_session(tmp_path, "ES", date.fromisoformat(iso), binned=True)
    report = bin_developing(tmp_path)
    assert report["ES"] == "2026-09-18:developing"
    hist = tmp_path / "vp/engine/ES/developing/histogram.json"
    assert hist.is_file()


def test_vendor_close_is_not_open():
    st = {
        "results": [
            {
                "product_code": "ES",
                "session_end_date": "2026-09-18",
                "market_event": "close",
            }
        ]
    }
    assert session_is_open(st, product="ES") is False


def test_vendor_open_is_open():
    st = {
        "results": [
            {
                "product_code": "ES",
                "session_end_date": "2026-09-21",
                "market_event": "open",
            }
        ]
    }
    assert session_is_open(st, product="ES") is True
