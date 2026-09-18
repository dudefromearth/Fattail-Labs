"""Newest-first historical ingest. Contiguous descending from yesterday.

Vendor path: date-addressed REST day files (SPY /v3/trades, ES/MES
/futures/v1/trades). Flat-file S3 attempted when keys exist.
After-close only (CP-1). Land → bin → coverage. Resumable via manifest.
"""

from __future__ import annotations

import gzip
import json
import sys
from datetime import date, timedelta
from pathlib import Path

from market_data.vp_engine.coverage import SOURCES, next_backfill_session
from market_data.vp_engine.rebuild import rebuild_session
from market_data.vp_ingest.store import archive_root, in_rth, prints_path
from market_data.vp_ingest.vendor_day import (
    already_complete,
    fetch_futures_product_day,
    fetch_spy_day,
    flat_files_blocker,
    write_day_prints,
)

FIVE_SESSION_FLOOR_TARGET = date(2026, 9, 14)


def plan(root: Path | None = None, *, today: date | None = None) -> dict[str, str | None]:
    ar = root or archive_root()
    today = today or date.today()
    return {s: (d.isoformat() if d else None) for s, d in (
        (s, next_backfill_session(ar, s, today=today)) for s in SOURCES
    )}


def _fetch_source(source: str, day: date) -> list[dict]:
    src = source.upper()
    if src == "SPY":
        return fetch_spy_day(day)
    if src in ("ES", "MES"):
        return fetch_futures_product_day(src, day)
    raise ValueError(src)


def land_session(
    source: str,
    day: date,
    *,
    root: Path | None = None,
    recs: list[dict] | None = None,
    skip_if_complete: bool = True,
) -> dict:
    ar = root or archive_root()
    src = source.upper()
    if skip_if_complete and already_complete(ar, src, day):
        print(f"backfill skip complete {src} {day.isoformat()}", flush=True)
        rebuild_session(root=ar, symbol=src, session_date=day, kind="session")
        return {"source": src, "session": day.isoformat(), "skipped": True}
    rows = recs if recs is not None else _fetch_source(src, day)
    vendor = "massive_rest_v3_trades" if src == "SPY" else "massive_rest_futures_v1_trades"
    man = write_day_prints(ar, src, day, rows, vendor=vendor)
    rebuild_session(root=ar, symbol=src, session_date=day, kind="session")
    print(
        f"backfill landed {src} {day.isoformat()} count={man['count']} "
        f"bytes={man['bytes']} sha256={man['sha256'][:12]}",
        flush=True,
    )
    return man


def pull_five(*, root: Path | None = None, today: date | None = None, target: date = FIVE_SESSION_FLOOR_TARGET) -> dict:
    """Newest-first until each primary source floor is at/below target (5 sessions)."""
    ar = root or archive_root()
    today = today or date.today()
    report: dict[str, list] = {s: [] for s in SOURCES}
    if in_rth():
        print("backfill5 HOLD CP-1: no vendor historical during RTH", flush=True)
        return {"hold": "CP-1", "flat_files_blocker": flat_files_blocker(), "report": report}
    print(f"flat_files_blocker={flat_files_blocker()}", flush=True)
    for src in SOURCES:
        guard = 0
        while guard < 8:
            guard += 1
            nxt = next_backfill_session(ar, src, today=today)
            if nxt is None or nxt < target:
                break
            report[src].append(land_session(src, nxt, root=ar))
    return {"hold": None, "flat_files_blocker": flat_files_blocker(), "report": report}


def count_gz(path: Path) -> int:
    n = 0
    with gzip.open(path, "rt", encoding="utf-8") as fh:
        for line in fh:
            if line.strip():
                n += 1
    return n


def dry_run_0917(*, compare: Path | None = None, root: Path | None = None) -> dict:
    """Fetch 2026-09-17 into a scratch tree; compare counts to an existing capture."""
    day = date(2026, 9, 17)
    scratch = (root or Path("/tmp/vp-dry-0917")).resolve()
    scratch.mkdir(parents=True, exist_ok=True)
    out: dict = {
        "session": day.isoformat(),
        "flat_files_blocker": flat_files_blocker(),
        "sources": {},
    }
    for src in SOURCES:
        recs = _fetch_source(src, day)
        man = write_day_prints(
            scratch, src, day, recs,
            vendor="dry-run",
            extra={"dry_run": True},
        )
        local_n = None
        if compare is not None:
            lp = prints_path(compare, src, day)
            if lp.is_file():
                local_n = count_gz(lp)
        first = recs[0] if recs else None
        out["sources"][src] = {
            "fetched": man["count"],
            "bytes": man["bytes"],
            "sha256": man["sha256"],
            "local_count": local_n,
            "count_delta": (man["count"] - local_n) if local_n is not None else None,
            "first": {
                "p": None if first is None else first.get("p"),
                "t": None if first is None else first.get("t"),
                "contract": None if first is None else first.get("contract"),
            },
        }
        print(
            f"dry-run {src} fetched={man['count']} local={local_n} "
            f"delta={out['sources'][src]['count_delta']}",
            flush=True,
        )
    report = scratch / "dry-run-0917.json"
    report.write_text(json.dumps(out, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"dry-run wrote {report}", flush=True)
    return out


def main(argv: list[str] | None = None) -> int:
    argv = list(argv or sys.argv[1:])
    today = date.today()
    if argv[:1] == ["--dry-run-0917"]:
        compare = None
        if "--compare" in argv:
            compare = Path(argv[argv.index("--compare") + 1])
        dry_run_0917(compare=compare)
        return 0
    planned = plan(today=today)
    print(f"backfill newest-first today={today.isoformat()} plan={planned}")
    print(f"flat_files_blocker={flat_files_blocker()}")
    if in_rth():
        print(
            "HOLD CP-1: Massive historical REST/flat-files share the account "
            "with StudioOne chain_feed. Tranche starts after 16:00 ET; "
            "order remains strictly descending from yesterday."
        )
        return 0
    if argv[:1] == ["--five"]:
        pull_five(today=today)
        return 0
    nxt = planned
    for src, iso in nxt.items():
        if not iso:
            continue
        land_session(src, date.fromisoformat(iso))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
