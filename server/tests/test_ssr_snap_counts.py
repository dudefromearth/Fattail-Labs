"""Snap-count ledger — O(1) increment, sidecar, no full-tree dash poll."""

from __future__ import annotations

from datetime import date
from pathlib import Path

from market_data.ssr_snap_counts import (
    apply_not_today,
    apply_snap,
    dash_view,
    empty_doc,
    ensure_counts,
    load_sidecar,
    record_snap,
    seed_from_disk,
)


DAY = date(2026, 8, 18)


def test_apply_snap_increments():
    doc = empty_doc(DAY)
    apply_snap(
        doc,
        "spx",
        "snap-130000000Z.json",
        {"captured_at": "2026-08-18T13:00:00-04:00", "iv_count": 10, "hole": None},
        at="2026-08-18T13:00:00-04:00",
    )
    apply_snap(
        doc,
        "SPX",
        "snap-130002000Z.json",
        {"captured_at": "2026-08-18T13:00:02-04:00", "iv_count": 11, "hole": None},
        at="2026-08-18T13:00:02-04:00",
    )
    apply_snap(
        doc,
        "QQQ",
        "snap-130002000Z.json",
        {"captured_at": "2026-08-18T13:00:02-04:00", "iv_count": 0, "hole": "NO CHAIN QQQ"},
        at="2026-08-18T13:00:02-04:00",
    )
    assert doc["snaps"] == 3
    assert doc["symbols"]["SPX"]["snaps"] == 2
    assert doc["symbols"]["SPX"]["last"] == "snap-130002000Z.json"
    assert doc["symbols"]["QQQ"]["snaps"] == 1
    apply_not_today(
        doc,
        "AAPL",
        next_expiration="2026-08-19",
        listed=["2026-08-19", "2026-08-21"],
    )
    view = dash_view(doc)
    assert view["symbols_with_snaps"] == 2
    assert view["not_today"] == 1
    assert view["latest_with_iv"] == 1
    assert view["latest_holes"] == 1
    aapl = next(s for s in view["symbols"] if s["symbol"] == "AAPL")
    assert aapl["not_today"] is True
    assert aapl["next_expiration"] == "2026-08-19"
    assert aapl.get("hole") is None


def test_record_and_sidecar(tmp_path: Path):
    day_root = tmp_path / "day=2026-08-18"
    record_snap(
        DAY,
        "IWM",
        "snap-a.json",
        {"captured_at": "2026-08-18T09:31:00-04:00", "iv_count": 4, "greek_count": 4},
        day_root=day_root,
    )
    hit = load_sidecar(day_root)
    assert hit is not None
    assert hit["snaps"] == 1
    assert hit["symbols"]["IWM"]["last"] == "snap-a.json"


def test_seed_from_disk_counts_names_only(tmp_path: Path):
    chain = tmp_path / "chain" / "SPY"
    chain.mkdir(parents=True)
    (chain / "snap-1.json").write_text(
        '{"symbol":"SPY","iv_count":3,"captured_at":"t1"}', encoding="utf-8"
    )
    (chain / "snap-2.json").write_text(
        '{"symbol":"SPY","iv_count":9,"captured_at":"t2","phase":"rth"}',
        encoding="utf-8",
    )
    doc = seed_from_disk(DAY, day_root=tmp_path)
    assert doc["snaps"] == 2
    assert doc["symbols"]["SPY"]["last"] == "snap-2.json"
    assert doc["symbols"]["SPY"]["iv_count"] == 9
    assert doc["source"] == "seed"


def test_ensure_counts_uses_sidecar_not_rescan(tmp_path: Path):
    record_snap(DAY, "NVDA", "snap-z.json", {"iv_count": 1}, day_root=tmp_path)
    # Junk files should not change a live sidecar.
    junk = tmp_path / "chain" / "NVDA"
    junk.mkdir(parents=True)
    (junk / "snap-zzz.json").write_text("{}", encoding="utf-8")
    doc = ensure_counts(DAY, day_root=tmp_path)
    assert doc["snaps"] == 1
    assert doc["symbols"]["NVDA"]["last"] == "snap-z.json"
