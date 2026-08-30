"""AT-SOAR-36…39 nightly stats pass."""

from __future__ import annotations

import json
from datetime import date, timedelta
from pathlib import Path

from market_data.ssr_archive_stats import (
    load_store_stats,
    measure_day,
    run_pass,
)
from market_data.ssr_archive_read import dst_envelope_opens, reset_dst_envelope_opens


DAY = date(2026, 8, 25)


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


def _snap(folder: Path, symbol: str, name: str, captured_at: str) -> None:
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


def _tape(folder: Path, symbol: str, source: str = "massive_proxy_v1") -> None:
    dest = folder / "marks"
    dest.mkdir(parents=True, exist_ok=True)
    stem = "session" if symbol.upper() == "SESSION" else symbol.lower()
    line = json.dumps(
        {
            "captured_at": "2026-08-25T09:30:00-04:00",
            "symbol": symbol.upper(),
            "mid": 17.4,
            "source": source,
        }
    )
    (dest / f"{stem}.jsonl").write_text(line + "\n", encoding="utf-8")


def test_writes_beside_day_and_skips_settled(tmp_path: Path, monkeypatch) -> None:
    """AT-SOAR-36."""
    monkeypatch.setattr("market_data.ssr_archive_stats.archive_root", lambda: tmp_path)
    monkeypatch.setattr("market_data.ssr_archive_read.archive_root", lambda: tmp_path)
    folder = tmp_path / f"day={DAY.isoformat()}"
    _counts(folder, "SPX", "2026-08-25")
    _snap(folder, "SPX", "snap-133000Z.json", "2026-08-25T09:30:00-04:00")
    _snap(folder, "SPX", "snap-133004Z.json", "2026-08-25T09:30:04-04:00")
    _tape(folder, "VIX")
    reset_dst_envelope_opens()
    first = run_pass(root=tmp_path, backfill=True)
    assert first["last_run_status"] == "ok"
    assert first["hole"] is None
    assert (folder / "STATS.json").is_file()
    assert dst_envelope_opens == []
    stamp = (folder / "STATS.json").read_text(encoding="utf-8")
    run_pass(root=tmp_path)
    assert (folder / "STATS.json").read_text(encoding="utf-8") == stamp


def test_failed_run_records_reason(tmp_path: Path, monkeypatch) -> None:
    """AT-SOAR-37."""
    monkeypatch.setattr("market_data.ssr_archive_stats.archive_root", lambda: tmp_path)
    folder = tmp_path / f"day={DAY.isoformat()}"
    folder.mkdir()
    def _boom(*_a, **_k):
        raise RuntimeError("nope")

    monkeypatch.setattr("market_data.ssr_archive_stats.measure_day", _boom)
    try:
        run_pass(root=tmp_path, backfill=True)
        assert False, "expected fail loud"
    except RuntimeError:
        pass
    doc = json.loads((tmp_path / "STATS.json").read_text(encoding="utf-8"))
    assert doc["last_run_status"] == "failed"
    assert "nope" in (doc.get("last_run_error") or "")
    assert not (folder / "STATS.json").is_file()


def test_stale_when_missing_or_old(tmp_path: Path, monkeypatch) -> None:
    """AT-SOAR-38."""
    monkeypatch.setattr("market_data.ssr_archive_stats.archive_root", lambda: tmp_path)
    monkeypatch.setattr("market_data.ssr_archive_read.archive_root", lambda: tmp_path)
    missing = load_store_stats(root=tmp_path)
    assert missing["hole"] == "STATS STALE"
    folder = tmp_path / f"day={DAY.isoformat()}"
    _counts(folder, "SPX", "2026-08-25")
    _snap(folder, "SPX", "snap-133000Z.json", "2026-08-25T09:30:00-04:00")
    run_pass(root=tmp_path, backfill=True)
    ok = load_store_stats(root=tmp_path)
    assert ok["hole"] is None
    from datetime import datetime
    from zoneinfo import ZoneInfo

    ny = ZoneInfo("America/New_York")
    old = datetime.now(tz=ny) - timedelta(hours=30)
    monkeypatch.setattr(
        "market_data.ssr_archive_stats.now_ny", lambda: old + timedelta(hours=30)
    )
    rolled = json.loads((tmp_path / "STATS.json").read_text(encoding="utf-8"))
    rolled["last_run_at"] = old.isoformat()
    (tmp_path / "STATS.json").write_text(json.dumps(rolled), encoding="utf-8")
    stale = load_store_stats(root=tmp_path)
    assert stale["hole"] == "STATS STALE"


def test_disagree_recomputes(tmp_path: Path, monkeypatch) -> None:
    """AT-SOAR-39: files win."""
    monkeypatch.setattr("market_data.ssr_archive_stats.archive_root", lambda: tmp_path)
    monkeypatch.setattr("market_data.ssr_archive_read.archive_root", lambda: tmp_path)
    folder = tmp_path / f"day={DAY.isoformat()}"
    _counts(folder, "SPX", "2026-08-25")
    _snap(folder, "SPX", "snap-133000Z.json", "2026-08-25T09:30:00-04:00")
    run_pass(root=tmp_path, backfill=True)
    _snap(folder, "SPX", "snap-133010Z.json", "2026-08-25T09:30:10-04:00")
    again = run_pass(root=tmp_path)
    day_doc = json.loads((folder / "STATS.json").read_text(encoding="utf-8"))
    assert day_doc["books"][0]["count"] == 2
    assert again["last_run_status"] == "ok"


def test_vix_not_native_flag(tmp_path: Path) -> None:
    folder = tmp_path / f"day={DAY.isoformat()}"
    _counts(folder, "SPX", "2026-08-25")
    _snap(folder, "SPX", "snap-133000Z.json", "2026-08-25T09:30:00-04:00")
    _tape(folder, "VIX", source="massive_proxy_v1")
    doc = measure_day(DAY, root=tmp_path)
    assert "VIX NOT NATIVE" in doc["flags"]


def test_stats_plist_loads_in_background_session() -> None:
    """SSH bootstrap is Background; Aqua-only calendar jobs never fire."""
    from pathlib import Path

    raw = (
        Path(__file__).resolve().parents[2]
        / "infra"
        / "launchd"
        / "ai.fattail.labs.ssr-archive-stats.plist.example"
    ).read_text(encoding="utf-8")
    assert "LimitLoadToSessionType" in raw
    assert "<string>Background</string>" in raw
    assert "<key>Hour</key>" in raw
    assert "<integer>2</integer>" in raw
    assert "<key>Minute</key>" in raw
    assert "<integer>0</integer>" in raw
