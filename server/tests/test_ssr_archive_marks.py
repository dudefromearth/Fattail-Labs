"""A2 marks tape: generic, batch, provenance beside mid, named gap, flat-day carve-out."""

from __future__ import annotations

import json
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from market_data.ssr_archive_read import (
    captured_reachable,
    coverage,
    day_fetch,
    day_index,
    day_marks,
    hole_http_status,
    list_marks_on_disk,
    nearest_mark,
)

NY = ZoneInfo("America/New_York")
DAY = date(2026, 8, 27)


def _counts(folder: Path, symbol: str, expiration: str) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    doc: dict = {"day": DAY.isoformat(), "symbols": {}}
    if (folder / "COUNTS.json").is_file():
        doc = json.loads((folder / "COUNTS.json").read_text(encoding="utf-8"))
    doc.setdefault("symbols", {})[symbol] = {
        "snaps": 1,
        "expiration": expiration,
        "not_today": False,
    }
    (folder / "COUNTS.json").write_text(json.dumps(doc), encoding="utf-8")


def _chain_snap(folder: Path, symbol: str, name: str, captured_at: str) -> None:
    dest = folder / "chain" / symbol
    dest.mkdir(parents=True, exist_ok=True)
    (dest / name).write_text(
        json.dumps(
            {
                "captured_at": captured_at,
                "generation": {"spot": 1.0, "content_hash": name, "rows": [{"strike": 1}]},
            }
        ),
        encoding="utf-8",
    )


def _mark_line(
    captured_at: str,
    mid: float,
    *,
    symbol: str = "VIX",
    source: str = "massive_proxy_v1",
    label: str = "Proxy underlier via VIXY (massive_proxy_v1)",
) -> str:
    return json.dumps(
        {
            "captured_at": captured_at,
            "symbol": symbol,
            "mid": mid,
            "bid": mid - 0.01,
            "ask": mid + 0.01,
            "source": source,
            "label": label,
        }
    )


def _write_tape(folder: Path, symbol: str, lines: list[str]) -> None:
    dest = folder / "marks"
    dest.mkdir(parents=True, exist_ok=True)
    stem = "session" if symbol.upper() == "SESSION" else symbol.lower()
    (dest / f"{stem}.jsonl").write_text("\n".join(lines) + "\n", encoding="utf-8")


def test_batch_nearest_and_provenance_not_in_mid(tmp_path: Path) -> None:
    """AT-SOAR-50/51/58: generic tapes; source sits beside mid."""
    folder = tmp_path / f"day={DAY.isoformat()}"
    _write_tape(
        folder,
        "VIX",
        [
            _mark_line("2026-08-27T15:59:00-04:00", 17.40, symbol="VIX"),
            _mark_line("2026-08-27T16:00:00-04:00", 17.395, symbol="VIX"),
        ],
    )
    _write_tape(
        folder,
        "SPY",
        [
            _mark_line(
                "2026-08-27T16:00:00-04:00",
                770.1,
                symbol="SPY",
                source="massive",
                label="Market Bus underlier (massive)",
            )
        ],
    )
    t = datetime(2026, 8, 27, 16, 0, 2, tzinfo=NY)
    doc = day_marks(DAY, ["VIX", "SPY"], t, root=tmp_path)
    assert doc["hole"] is None
    by = {row["symbol"]: row for row in doc["marks"]}
    assert by["VIX"]["mid"] == 17.395
    assert by["VIX"]["source"] == "massive_proxy_v1"
    assert "proxy" not in str(by["VIX"]["mid"]).lower()
    assert by["VIX"]["label"]
    assert by["SPY"]["mid"] == 770.1
    assert by["SPY"]["source"] == "massive"
    assert set(list_marks_on_disk(folder)) >= {"VIX", "SPY"}


def test_named_gap_never_locf(tmp_path: Path) -> None:
    """AT-SOAR-52: a stretch with nothing near is MARK GAP, mid is null."""
    folder = tmp_path / f"day={DAY.isoformat()}"
    _write_tape(
        folder,
        "VIX",
        [
            _mark_line("2026-08-27T12:00:00-04:00", 17.5),
            _mark_line("2026-08-27T12:00:06-04:00", 17.51),
        ],
    )
    t = datetime(2026, 8, 27, 15, 0, 0, tzinfo=NY)
    row = nearest_mark(folder, "VIX", t)
    assert row["hole"] == "MARK GAP"
    assert row["mid"] is None
    assert hole_http_status("MARK GAP") == 200


def test_missing_tape_is_marks_none(tmp_path: Path) -> None:
    folder = tmp_path / f"day={DAY.isoformat()}"
    folder.mkdir()
    t = datetime(2026, 8, 27, 12, 0, 0, tzinfo=NY)
    row = nearest_mark(folder, "VIX", t)
    assert row["hole"] == "MARKS NONE"
    assert row["mid"] is None


def test_coverage_tape_is_not_absent_book(tmp_path: Path) -> None:
    """AT-SOAR-57: VIX tape is not count=0 / UNKNOWN chain book."""
    folder = tmp_path / f"day={DAY.isoformat()}"
    _counts(folder, "SPX", "2026-08-27")
    _chain_snap(folder, "SPX", "snap-160000Z.json", "2026-08-27T12:00:00-04:00")
    _write_tape(folder, "VIX", [_mark_line("2026-08-27T12:00:00-04:00", 17.4)])
    doc = coverage(days=[DAY], symbols=["VIX", "SPX"], root=tmp_path)
    day = doc["days"][0]
    books = {b["symbol"]: b for b in day["books"]}
    tapes = {m["symbol"]: m for m in day["marks"]}
    assert "VIX" not in books
    assert tapes["VIX"]["kind"] == "tape"
    assert tapes["VIX"]["count"] == 1
    assert books["SPX"]["count"] >= 1


def test_generation_vix_null_is_not_consulted(tmp_path: Path) -> None:
    """AT-SOAR-53/54: envelope vix is irrelevant."""
    folder = tmp_path / f"day={DAY.isoformat()}"
    _counts(folder, "SPX", "2026-08-27")
    dest = folder / "chain" / "SPX"
    dest.mkdir(parents=True, exist_ok=True)
    (dest / "snap-160000Z.json").write_text(
        json.dumps(
            {
                "captured_at": "2026-08-27T12:00:00-04:00",
                "generation": {"vix": None, "spot": 1.0, "rows": [{"strike": 1}]},
            }
        ),
        encoding="utf-8",
    )
    _write_tape(folder, "VIX", [_mark_line("2026-08-27T12:00:00-04:00", 17.855)])
    t = datetime(2026, 8, 27, 12, 0, 0, tzinfo=NY)
    row = nearest_mark(folder, "VIX", t)
    assert row["mid"] == 17.855
    assert row["hole"] is None


def test_flat_spy_without_counts(tmp_path: Path) -> None:
    """AT-SOAR-55 / A2-2: 08-14 layout, COUNTS missing, still retrieve."""
    day = date(2026, 8, 14)
    folder = tmp_path / f"day={day.isoformat()}"
    chain = folder / "chain"
    chain.mkdir(parents=True, exist_ok=True)
    (chain / "snap-132009Z.json").write_text(
        json.dumps(
            {
                "captured_at": "2026-08-14T09:20:09-04:00",
                "generation": {"spot": 1.0, "rows": [{"strike": 1}]},
            }
        ),
        encoding="utf-8",
    )
    idx = day_index(day, "SPY", root=tmp_path)
    assert idx.get("hole") is None
    assert idx.get("count", 0) >= 1
    fetched = day_fetch(day, "SPY", 0, root=tmp_path)
    assert fetched.get("hole") is None
    assert (fetched.get("count_on_disk") or 0) >= 1
    assert (fetched.get("returned") or 0) >= 1


def test_nested_counts_missing_still_unknown(tmp_path: Path) -> None:
    """Carve-out is flat layout only — nested chain/<SYM>/ still 404s."""
    folder = tmp_path / f"day={DAY.isoformat()}"
    _chain_snap(folder, "SPX", "snap-160000Z.json", "2026-08-27T12:00:00-04:00")
    idx = day_index(DAY, "SPX", root=tmp_path)
    assert idx.get("hole") == "UNKNOWN"


def test_symbol_completeness_enumerates(tmp_path: Path) -> None:
    """AT-SOAR-56: first unreachable name fails."""
    folder = tmp_path / f"day={DAY.isoformat()}"
    _counts(folder, "SPX", "2026-08-27")
    _chain_snap(folder, "SPX", "snap-160000Z.json", "2026-08-27T12:00:00-04:00")
    _write_tape(folder, "VIX", [_mark_line("2026-08-27T12:00:00-04:00", 17.4)])
    _write_tape(
        folder,
        "SESSION",
        [
            json.dumps(
                {
                    "captured_at": "2026-08-27T12:00:00-04:00",
                    "phase": "rth",
                    "source": "massive",
                }
            )
        ],
    )
    names = captured_reachable(folder)
    planes = {s: p for s, p in names}
    assert planes["SPX"] == "chain"
    assert planes["VIX"] == "marks"
    assert planes["SESSION"] == "marks"
    t = datetime(2026, 8, 27, 12, 0, 0, tzinfo=NY)
    for symbol, plane in names:
        if plane == "chain":
            doc = day_index(DAY, symbol, root=tmp_path)
            assert doc.get("hole") is None, symbol
            assert (doc.get("count") or 0) > 0, symbol
        else:
            row = nearest_mark(folder, symbol, t)
            assert row["hole"] is None, symbol


def test_vix_not_native_flag_on_proxy_tape(tmp_path: Path) -> None:
    """AT-SOAR-59: proxy tape is flagged; source stays beside mid."""
    folder = tmp_path / f"day={DAY.isoformat()}"
    _write_tape(folder, "VIX", [_mark_line("2026-08-27T12:00:00-04:00", 17.855)])
    _write_tape(
        folder,
        "VIX1D",
        [
            _mark_line(
                "2026-08-27T12:00:00-04:00",
                17.855,
                symbol="VIX1D",
            )
        ],
    )
    doc = coverage(days=[DAY], symbols=["VIX", "VIX1D"], root=tmp_path)
    day = doc["days"][0]
    assert "VIX NOT NATIVE" in day["flags"]
    assert "VIX1D NOT NATIVE" in day["flags"]
    books = {b["symbol"]: b for b in day["books"]}
    assert "VIX" not in books
    t = datetime(2026, 8, 27, 12, 0, 0, tzinfo=NY)
    row = nearest_mark(folder, "VIX", t)
    assert row["mid"] == 17.855
    assert row["source"] == "massive_proxy_v1"
    assert row["mid"] != row["source"]


def test_native_vix_tape_is_not_flagged(tmp_path: Path) -> None:
    folder = tmp_path / f"day={DAY.isoformat()}"
    _write_tape(
        folder,
        "VIX",
        [
            _mark_line(
                "2026-08-27T12:00:00-04:00",
                14.43,
                symbol="VIX",
                source="massive_index_v1",
                label="Market Bus underlier (massive_index_v1)",
            )
        ],
    )
    doc = coverage(days=[DAY], symbols=["VIX"], root=tmp_path)
    day = doc["days"][0]
    assert "VIX NOT NATIVE" not in day["flags"]
    tapes = {m["symbol"]: m for m in day["marks"]}
    assert tapes["VIX"]["kind"] == "tape"
    t = datetime(2026, 8, 27, 12, 0, 0, tzinfo=NY)
    row = nearest_mark(folder, "VIX", t)
    assert row["mid"] == 14.43
    assert row["source"] == "massive_index_v1"
