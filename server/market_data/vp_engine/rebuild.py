"""Read Ingest archive (read-only) → write Engine store. No Massive."""

from __future__ import annotations

import gzip
import json
from datetime import date
from pathlib import Path
from typing import Any

from market_data.vp_engine.coverage import mark_session
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
    from symbology.spec import assert_native_grain

    row = assert_native_grain(symbol, vp_row)
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
        try:
            mark_session(ar, symbol, session_date, binned=False)
            mark_session(ar, symbol, session_date, binned=True)
        except ValueError:
            if kind != "developing":
                raise
        if symbol in ("ES", "MES") and kind == "session":
            rebuild_continuous(ar, symbol, vp_row=row)
    return payload


def rebuild_continuous(root: Path, symbol: str, *, vp_row: float | None = None) -> dict[str, Any]:
    """Rebuild the full D6 derived view from raw prints. Never edits SoR."""
    from market_data.vp_engine.continuous import (
        adjust_print_price,
        build_roll_table,
        continuous_histogram_path,
    )
    from market_data.vp_engine.coverage import load_coverage

    symbol = symbol.upper()
    from symbology.spec import assert_native_grain

    row = assert_native_grain(symbol, vp_row)
    doc = build_roll_table(root, symbol, load_prints=load_prints)
    cadj = {str(k): float(v) for k, v in (doc.get("contract_adjust") or {}).items()}
    days = load_coverage(root).get(symbol, {}).get("sessions_binned") or []
    for iso in days:
        d = date.fromisoformat(iso)
        recs = load_prints(root, symbol, d)
        gaps = load_gaps(root, symbol, d)
        from market_data.vp_engine.continuous import session_lead

        lead, _rule = session_lead(recs, product=symbol, session=d)
        if lead:
            recs = [r for r in recs if str(r.get("contract") or "").upper() == lead]
        session_delta = float((doc.get("adjust") or {}).get(iso) or 0.0)
        adj_prints = []
        for rec in recs:
            px = adjust_print_price(rec, cadj, session_delta)
            if px is None:
                continue
            item = dict(rec)
            item["p"] = px
            adj_prints.append(item)
        cont = build_histogram(
            adj_prints,
            vp_row=row,
            gaps=gaps,
            kind="session",
            symbol=symbol,
            session_date=iso,
        )
        cont_path = continuous_histogram_path(root, symbol, d)
        cont_path.parent.mkdir(parents=True, exist_ok=True)
        cont_path.write_bytes(canonical_bytes(cont))
    return doc
