"""Read raw day partitions + catalog scan (Strategy Lab / admin status)."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Any

from market_data.storage import market_data_root

KINDS = ("trades", "quotes", "aggs_1s")


def day_part_path(series: str, kind: str, day: date, *, root: Path | None = None) -> Path:
    base = root or market_data_root()
    return (
        base
        / "raw"
        / series.upper()
        / kind
        / f"year={day.year:04d}"
        / f"month={day.month:02d}"
        / f"day={day.day:02d}"
        / "part-000.parquet"
    )


def day_ok_path(part: Path) -> Path:
    return part.with_suffix(part.suffix + ".ok")


def read_ok_meta(ok: Path) -> dict[str, Any] | None:
    if not ok.is_file():
        return None
    try:
        return json.loads(ok.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def open_day(
    series: str,
    kind: str,
    day: date,
    *,
    preview_rows: int = 0,
    root: Path | None = None,
) -> dict[str, Any]:
    if kind not in KINDS:
        raise ValueError(f"kind must be one of {KINDS}")
    part = day_part_path(series, kind, day, root=root)
    ok = day_ok_path(part)
    meta = read_ok_meta(ok) or {}
    payload: dict[str, Any] = {
        "series_ticker": series.upper(),
        "kind": kind,
        "day": day.isoformat(),
        "store_path": str(part),
        "complete": ok.is_file(),
        "exists": part.is_file(),
        "bytes": part.stat().st_size if part.is_file() else 0,
        "rows": meta.get("rows"),
        "source_meta": meta or None,
        "preview": [],
        "columns": [],
    }
    if not part.is_file():
        return payload
    import pyarrow.parquet as pq

    table = pq.read_table(part)
    payload["columns"] = list(table.column_names)
    payload["rows"] = int(table.num_rows)
    if preview_rows > 0 and table.num_rows:
        n = min(int(preview_rows), int(table.num_rows))
        payload["preview"] = table.slice(0, n).to_pylist()
    return payload


def scan_raw_inventory(*, root: Path | None = None) -> list[dict[str, Any]]:
    """Walk raw/{SERIES}/{kind}/…/*.ok and summarize bytes/days per series×kind."""
    base = root or market_data_root()
    raw = base / "raw"
    out: list[dict[str, Any]] = []
    if not raw.is_dir():
        return out
    for series_dir in sorted(p for p in raw.iterdir() if p.is_dir()):
        series = series_dir.name.upper()
        for kind in KINDS:
            kind_dir = series_dir / kind
            if not kind_dir.is_dir():
                continue
            oks = list(kind_dir.rglob("*.ok"))
            first: str | None = None
            last: str | None = None
            byte_count = 0
            day_count = 0
            for ok in oks:
                meta = read_ok_meta(ok) or {}
                day_s = str(meta.get("day") or "")[:10]
                part = ok.with_name(ok.name[: -len(".ok")]) if ok.name.endswith(".ok") else ok
                # part-000.parquet.ok → part-000.parquet
                if ok.name.endswith(".parquet.ok"):
                    part = ok.with_name(ok.name[: -len(".ok")])
                if part.is_file():
                    byte_count += part.stat().st_size
                if day_s:
                    first = day_s if first is None or day_s < first else first
                    last = day_s if last is None or day_s > last else last
                    day_count += 1
                else:
                    day_count += 1
            out.append(
                {
                    "series_ticker": series,
                    "kind": kind,
                    "day_count": day_count,
                    "byte_count": byte_count,
                    "first_session": first,
                    "last_session": last,
                    "complete": False,
                }
            )
    return out


def upsert_raw_series_catalog(cur: Any, inventory: list[dict[str, Any]]) -> None:
    for row in inventory:
        cur.execute(
            """
            INSERT INTO market_raw_series
              (series_ticker, kind, first_session, last_session, day_count, byte_count, complete)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
              first_session = VALUES(first_session),
              last_session = VALUES(last_session),
              day_count = VALUES(day_count),
              byte_count = VALUES(byte_count),
              complete = VALUES(complete)
            """,
            (
                row["series_ticker"],
                row["kind"],
                row.get("first_session"),
                row.get("last_session"),
                int(row.get("day_count") or 0),
                int(row.get("byte_count") or 0),
                1 if row.get("complete") else 0,
            ),
        )
