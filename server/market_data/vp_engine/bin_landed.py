"""Bin every ingested session already on disk. No Massive."""

from __future__ import annotations

from datetime import date
from pathlib import Path

from market_data.vp_engine.coverage import SOURCES
from market_data.vp_engine.rebuild import rebuild_session
from market_data.vp_ingest.store import archive_root, prints_path


def ingested_days(root: Path, source: str) -> list[date]:
    trades = root / "vp" / "ingest" / source.upper() / "trades"
    if not trades.is_dir():
        return []
    out: list[date] = []
    for child in trades.iterdir():
        name = child.name
        if name.startswith("day=") and (child / "prints.jsonl.gz").is_file():
            out.append(date.fromisoformat(name.split("=", 1)[1]))
    return sorted(out)


def bin_all(root: Path | None = None) -> dict[str, list[str]]:
    ar = root or archive_root()
    report: dict[str, list[str]] = {}
    today = date.today()
    for source in SOURCES:
        days = ingested_days(ar, source)
        done: list[str] = []
        for day in days:
            kind = "developing" if day == today else "session"
            rebuild_session(root=ar, symbol=source, session_date=day, kind=kind)
            if kind == "developing":
                # also snapshot under session/ for the coverage interval
                rebuild_session(root=ar, symbol=source, session_date=day, kind="session")
            done.append(day.isoformat())
        report[source] = done
    return report


def main() -> int:
    report = bin_all()
    for src, days in report.items():
        print(f"{src} binned {days or '[]'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
