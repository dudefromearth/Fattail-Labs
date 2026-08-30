"""SO-AR reader: coverage hours from names+stat, Friday-flat, reconstruct t."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from market_data.ssr_archive_read import (
    available,
    book_coverage,
    coverage,
    rth_status,
    retrieve,
    reset_dst_envelope_opens,
    symbol_availability,
)


def _counts(folder: Path, symbol: str, expiration: str, *, not_today: bool = False) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "COUNTS.json").write_text(
        json.dumps(
            {
                "day": folder.name.removeprefix("day="),
                "symbols": {
                    symbol: {
                        "snaps": 0,
                        "expiration": expiration,
                        "not_today": not_today,
                    }
                },
            }
        ),
        encoding="utf-8",
    )


def _snap(folder: Path, symbol: str, name: str, captured_at: str, **extra: object) -> None:
    dest = folder / "chain" / symbol
    dest.mkdir(parents=True, exist_ok=True)
    body = {
        "provenance": "live_capture",
        "symbol": symbol,
        "captured_at": captured_at,
        "generation": {"content_hash": name, "rows": extra.pop("rows", [])},
        **extra,
    }
    (dest / name).write_text(json.dumps(body), encoding="utf-8")


def test_rth_status_late_start_is_partial():
    day = date(2026, 8, 25)
    assert (
        rth_status(day, "2026-08-25T11:00:00-04:00", "2026-08-25T16:00:00-04:00")
        == "partial"
    )
    assert (
        rth_status(day, "2026-08-25T09:30:00-04:00", "2026-08-25T16:00:00-04:00")
        == "rth_complete"
    )
    assert rth_status(day, None, None) == "none"


def test_coverage_hours_from_filename_not_envelope(tmp_path: Path):
    """AT-SOAR-1 / AT-SOAR-2: 11:00 start is partial; hours from reconstructed t."""
    reset_dst_envelope_opens()
    day = date(2026, 8, 25)
    folder = tmp_path / f"day={day.isoformat()}"
    _counts(folder, "SPX", "2026-08-25")
    _snap(folder, "SPX", "snap-150000Z.json", "2099-01-01T00:00:00Z")
    _snap(folder, "SPX", "snap-190000Z.json", "2099-01-01T00:00:00Z")
    (tmp_path / "day=2026-08-17").mkdir()
    from market_data.ssr_archive_read import dst_envelope_opens

    doc = coverage(days=[date(2026, 8, 17), day], symbols=["SPX"], root=tmp_path)
    assert dst_envelope_opens == []
    by_date = {row["date"]: row for row in doc["days"]}
    assert by_date["2026-08-17"]["status"] == "none"
    late = by_date["2026-08-25"]
    assert late["status"] == "partial"
    spx = late["books"][0]
    assert spx["first_at"].startswith("2026-08-25T11:00")
    assert spx["last_at"].startswith("2026-08-25T15:00")
    assert spx["count"] == 2


def test_folder_only_day_is_none(tmp_path: Path):
    """AT-SOAR-3."""
    day = date(2026, 8, 17)
    (tmp_path / f"day={day.isoformat()}").mkdir()
    doc = coverage(days=[day], symbols=["SPX"], root=tmp_path)
    assert doc["days"][0]["status"] == "none"
    assert doc["days"][0]["books"][0]["count"] == 0


def test_available_store_is_archive_not_cache(tmp_path: Path):
    day = date(2026, 8, 25)
    folder = tmp_path / f"day={day.isoformat()}"
    _counts(folder, "SPX", "2026-08-25")
    _snap(folder, "SPX", "snap-150000Z.json", "2026-08-25T11:00:00-04:00")
    doc = available(days=[day], symbols=["SPX"], root=tmp_path)
    assert doc["store"] == "archive"
    assert doc["days"][0]["symbols"][0]["first_at"].startswith("2026-08-25T11:00")


def test_retrieve_selected_dates_symbols_coarse_step(tmp_path: Path):
    day = date(2026, 8, 25)
    folder = tmp_path / f"day={day.isoformat()}"
    _counts(folder, "SPX", "2026-08-25")
    _counts(folder, "SPY", "2026-08-25")
    for name, cap in (
        ("snap-133000000Z.json", "2026-08-25T09:30:00-04:00"),
        ("snap-133020000Z.json", "2026-08-25T09:30:20-04:00"),
        ("snap-133040000Z.json", "2026-08-25T09:30:40-04:00"),
        ("snap-133100000Z.json", "2026-08-25T09:31:00-04:00"),
    ):
        _snap(folder, "SPX", name, cap)
    _snap(folder, "SPY", "snap-133000000Z.json", "2026-08-25T09:30:00-04:00")
    doc = retrieve([day], ["SPX", "SPY"], step_s=60, root=tmp_path)
    by_sym = {row["symbol"]: row for row in doc["items"]}
    assert by_sym["SPX"]["snaps_on_disk"] == 4
    assert by_sym["SPX"]["returned"] == 2
    files = [s["_file"] for s in by_sym["SPX"]["snaps"]]
    assert files == ["snap-133000000Z.json", "snap-133100000Z.json"]


def test_friday_flat_spy(tmp_path: Path):
    """AT-SOAR-30."""
    day = date(2026, 8, 14)
    chain = tmp_path / f"day={day.isoformat()}" / "chain"
    chain.mkdir(parents=True)
    _counts(tmp_path / f"day={day.isoformat()}", "SPY", "2026-08-14")
    (chain / "snap-132009Z.json").write_text(
        json.dumps(
            {
                "topic": "mb:ladder:SPY:2026-08-14:w25:dual",
                "captured_at": "2026-08-14T09:20:09-04:00",
                "generation": {"rows": []},
            }
        ),
        encoding="utf-8",
    )
    row = symbol_availability(day, "SPY", root=tmp_path)
    assert row["snaps"] == 1
    assert row["status"] == "partial"
    assert row["first_at"].startswith("2026-08-14T09:20")
    book = book_coverage(day, "SPY", root=tmp_path)
    assert book["first_file"] == "snap-132009Z.json"
