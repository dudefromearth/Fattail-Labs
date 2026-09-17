"""Read Ingest archive (read-only) → write Engine store. No Massive."""

from __future__ import annotations

import gzip
import json
from datetime import date
from pathlib import Path
from typing import Any

from market_data.vp_engine.coverage import VP_ROW, mark_session
from market_data.vp_engine.histogram import build_histogram, canonical_bytes
from market_data.vp_ingest.store import archive_root, gaps_path, prints_path


def load_prints(root: Path, symbol: str, day: date) -> list[dict[str, Any]]:
    path = prints_path(root, symbol, day)
    if not path.is_file():
        return []
    rows = []
    with gzip.open(path, "rt", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def load_gaps(root: Path, symbol: str, day: date) -> list[dict[str, Any]]:
    path = gaps_path(root, symbol, day)
    if not path.is_file():
        return []
    rows = []
    with path.open(encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def histogram_path(root: Path, symbol: str, session_date: date, kind: str) -> Path:
    if kind == "developing":
        return root / "vp" / "engine" / symbol.upper() / "developing" / "histogram.json"
    return (
        root
        / "vp"
        / "engine"
        / symbol.upper()
        / "session"
        / f"day={session_date.isoformat()}"
        / "histogram.json"
    )


def rebuild_session(
    *,
    root: Path | None = None,
    symbol: str = "SPY",
    session_date: date,
    vp_row: float | None = None,
    kind: str = "session",
) -> dict[str, Any]:
    if kind == "composite":
        raise ValueError("composite is fenced on VPS2 (session|developing only)")
    ar = root or archive_root()
    symbol = symbol.upper()
    row = float(vp_row if vp_row is not None else VP_ROW.get(symbol, 0.10))
    prints = load_prints(ar, symbol, session_date)
    gaps = load_gaps(ar, symbol, session_date)
    payload = build_histogram(
        prints,
        vp_row=row,
        gaps=gaps,
        kind=kind,
        symbol=symbol,
        session_date=session_date.isoformat(),
    )
    out = histogram_path(ar, symbol, session_date, kind)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(canonical_bytes(payload))
    if prints:
        mark_session(ar, symbol, session_date, binned=False)
        mark_session(ar, symbol, session_date, binned=True)
    return payload
