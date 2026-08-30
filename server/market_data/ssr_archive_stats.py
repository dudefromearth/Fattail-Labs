"""Nightly stats pass — StudioOne, beside the days. Spec v0.8 §7.2.

Filenames + stat only. No envelope opens. First run backfills every
collected day (DL-400 / DL-609). Settled days are measured once.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import tempfile
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

from market_data.ssr_archive_read import (
    API_VERSION,
    archive_root,
    cadence_stats,
    day_folder,
    list_marks_on_disk,
    list_symbols_on_disk,
    parse_day,
    vol_not_native_flags,
    _flat_spy_layout,
)
from market_data.ssr_live_capture import now_ny

NY = ZoneInfo("America/New_York")
STALE_AFTER = timedelta(hours=26)
DAY_STATS_NAME = "STATS.json"
STORE_STATS_NAME = "STATS.json"


def _atomic_write(path: Path, doc: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    raw = json.dumps(doc, default=str, indent=2) + "\n"
    fd, tmp = tempfile.mkstemp(prefix=".stats-", suffix=".json", dir=str(path.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            fh.write(raw)
        os.replace(tmp, path)
    except Exception:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise


def _files_fingerprint(folder: Path) -> str:
    """Filename + size, no envelope. Identity of the day as collected."""
    import hashlib

    h = hashlib.sha256()
    chain = folder / "chain"
    paths: list[Path] = []
    if chain.is_dir():
        paths.extend(sorted(chain.rglob("snap-*.json")))
    marks = folder / "marks"
    if marks.is_dir():
        paths.extend(sorted(p for p in marks.iterdir() if p.suffix == ".jsonl"))
    for counts in (folder / "COUNTS.json", folder / "PROVENANCE.json"):
        if counts.is_file():
            paths.append(counts)
    for p in paths:
        try:
            size = p.stat().st_size
        except OSError:
            size = 0
        rel = str(p.relative_to(folder))
        h.update(f"{rel}\t{size}\n".encode("utf-8"))
    return h.hexdigest()


def collected_days(*, root: Path | None = None) -> list[date]:
    base = root if root is not None else archive_root()
    out: list[date] = []
    if not base.is_dir():
        return out
    for child in sorted(base.iterdir()):
        if child.is_dir() and child.name.startswith("day="):
            try:
                out.append(parse_day(child.name.removeprefix("day=")))
            except ValueError:
                continue
    return out


def _load_json(path: Path) -> dict[str, Any] | None:
    if not path.is_file():
        return None
    try:
        doc = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError, UnicodeError):
        return None
    return doc if isinstance(doc, dict) else None


def measure_day(day: date, *, root: Path | None = None) -> dict[str, Any]:
    folder = day_folder(day, root=root)
    symbols = list_symbols_on_disk(folder)
    if _flat_spy_layout(folder) and "SPY" not in symbols:
        symbols = ["SPY"]
    books = [
        cadence_stats(day, sym, root=root, allow_envelope=False) for sym in symbols
    ]
    marks = []
    for name in list_marks_on_disk(folder):
        path = folder / "marks" / (
            "session.jsonl" if name == "SESSION" else f"{name.lower()}.jsonl"
        )
        try:
            st = path.stat()
            size = st.st_size
        except OSError:
            size = 0
        marks.append({"symbol": name, "kind": "tape", "bytes": size, "file": path.name})
    flags = vol_not_native_flags(folder)
    return {
        "day": day.isoformat(),
        "measured_at": now_ny().isoformat(),
        "files_hash": _files_fingerprint(folder),
        "books": books,
        "marks": marks,
        "flags": flags,
        "api_version": API_VERSION,
    }


def _day_needs_measure(folder: Path, existing: dict[str, Any] | None) -> bool:
    if existing is None:
        return True
    current = _files_fingerprint(folder)
    stored = str(existing.get("files_hash") or "")
    return stored != current


def _rollup(
    *,
    root: Path,
    days: list[dict[str, Any]],
    status: str,
    error: str | None,
    ran_at: datetime,
) -> dict[str, Any]:
    bytes_total = 0
    medians: list[dict[str, Any]] = []
    flags: list[str] = []
    for row in days:
        for book in row.get("books") or []:
            med = book.get("delta_median")
            if med is not None:
                medians.append(
                    {
                        "day": row["day"],
                        "symbol": book.get("symbol"),
                        "delta_median": med,
                        "delta_p95": book.get("delta_p95"),
                        "count": book.get("count"),
                        "within_dl609": book.get("within_dl609"),
                        "within_dl400": book.get("within_dl400"),
                    }
                )
        for m in row.get("marks") or []:
            bytes_total += int(m.get("bytes") or 0)
        for f in row.get("flags") or []:
            if f not in flags:
                flags.append(f)
        if any(b.get("tap_restart") for b in (row.get("books") or [])):
            if "TAP RESTART" not in flags:
                flags.append("TAP RESTART")
    hole = None
    if status != "ok":
        hole = "STATS STALE"
    return {
        "api_version": API_VERSION,
        "last_run_at": ran_at.isoformat(),
        "last_run_status": status,
        "last_run_error": error,
        "days_collected": len(days),
        "bytes_total": bytes_total,
        "medians_by_day": medians,
        "flags": flags,
        "band": {
            "dl609": [2.0, 5.0],
            "dl400_leftover": [3.0, 5.0],
            "law": "DL-609",
        },
        "hole": hole,
    }


def run_pass(
    *,
    root: Path | None = None,
    force: bool = False,
    backfill: bool = False,
) -> dict[str, Any]:
    """Measure days. First run / backfill = every collected day, oldest first."""
    base = root if root is not None else archive_root()
    if not base.is_dir():
        raise RuntimeError(f"archive root is not a directory: {base}")
    ran_at = now_ny()
    days = collected_days(root=base)
    measured: list[dict[str, Any]] = []
    try:
        for day in days:
            folder = day_folder(day, root=base)
            path = folder / DAY_STATS_NAME
            existing = _load_json(path)
            if force or backfill or existing is None or _day_needs_measure(folder, existing):
                if existing is not None and not force and not _day_needs_measure(folder, existing):
                    measured.append(existing)
                    continue
                doc = measure_day(day, root=base)
                _atomic_write(path, doc)
                measured.append(doc)
            else:
                measured.append(existing)
        rollup = _rollup(
            root=base, days=measured, status="ok", error=None, ran_at=ran_at
        )
        _atomic_write(base / STORE_STATS_NAME, rollup)
        return rollup
    except Exception as exc:
        rollup = _rollup(
            root=base,
            days=measured,
            status="failed",
            error=f"{type(exc).__name__}: {exc}",
            ran_at=ran_at,
        )
        try:
            _atomic_write(base / STORE_STATS_NAME, rollup)
        except OSError:
            pass
        raise


def load_store_stats(*, root: Path | None = None) -> dict[str, Any]:
    base = root if root is not None else archive_root()
    path = base / STORE_STATS_NAME
    doc = _load_json(path)
    if doc is None:
        return {"api_version": API_VERSION, "hole": "STATS STALE"}
    raw = doc.get("last_run_at")
    status = doc.get("last_run_status")
    stale = status != "ok" or not raw
    if raw and not stale:
        try:
            ts = datetime.fromisoformat(str(raw))
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=NY)
            if now_ny() - ts.astimezone(NY) > STALE_AFTER:
                stale = True
        except ValueError:
            stale = True
    if stale:
        doc = dict(doc)
        doc["hole"] = "STATS STALE"
        doc.setdefault("api_version", API_VERSION)
        return doc
    doc.setdefault("api_version", API_VERSION)
    doc["hole"] = None
    return doc


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="StudioOne nightly archive stats")
    parser.add_argument("--backfill", action="store_true", help="measure every collected day")
    parser.add_argument("--force", action="store_true", help="recompute even when hash matches")
    args = parser.parse_args(argv)
    try:
        os.nice(10)
    except OSError:
        pass
    first = not (archive_root() / STORE_STATS_NAME).is_file()
    rollup = run_pass(backfill=args.backfill or first, force=args.force)
    print(json.dumps({"ok": True, "days_collected": rollup.get("days_collected"), "last_run_status": rollup.get("last_run_status")}, default=str))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ssr_archive_stats FAIL: {type(exc).__name__}: {exc}", file=sys.stderr)
        raise
