"""Canonical Parquet column sets for VP raw kinds (Spec A-3).

Campaign writes project Massive rows onto these columns. Extra vendor fields
are stored as JSON in `extra_json` so we do not silently drop data.
"""

from __future__ import annotations

import json
from typing import Any

import pyarrow as pa


TRADES_COLUMNS: tuple[str, ...] = (
    "sip_timestamp",
    "participant_timestamp",
    "trf_timestamp",
    "price",
    "size",
    "exchange",
    "conditions",
    "id",
    "tape",
    "trf_id",
    "sequence_number",
    "extra_json",
)

QUOTES_COLUMNS: tuple[str, ...] = (
    "sip_timestamp",
    "participant_timestamp",
    "trf_timestamp",
    "bid_price",
    "bid_size",
    "ask_price",
    "ask_size",
    "exchange",
    "conditions",
    "indicators",
    "tape",
    "sequence_number",
    "extra_json",
)

AGGS_1S_COLUMNS: tuple[str, ...] = (
    "t",
    "o",
    "h",
    "l",
    "c",
    "v",
    "vw",
    "n",
    "extra_json",
)

KIND_COLUMNS = {
    "trades": TRADES_COLUMNS,
    "quotes": QUOTES_COLUMNS,
    "aggs_1s": AGGS_1S_COLUMNS,
}


def _json_dump(v: Any) -> str | None:
    if v is None:
        return None
    if isinstance(v, (list, dict)):
        return json.dumps(v, separators=(",", ":"), default=str)
    return str(v)


def project_rows(kind: str, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    cols = KIND_COLUMNS.get(kind)
    if cols is None:
        raise ValueError(f"unknown kind {kind}")
    known = set(cols) - {"extra_json"}
    out: list[dict[str, Any]] = []
    for r in rows:
        proj: dict[str, Any] = {c: None for c in cols}
        extra: dict[str, Any] = {}
        for k, v in r.items():
            if k in known:
                if k == "conditions" and isinstance(v, (list, dict)):
                    proj[k] = json.dumps(v, separators=(",", ":"), default=str)
                else:
                    proj[k] = v
            else:
                extra[k] = v
        proj["extra_json"] = json.dumps(extra, separators=(",", ":"), default=str) if extra else None
        out.append(proj)
    return out


def table_for(kind: str, rows: list[dict[str, Any]]) -> pa.Table:
    cols = KIND_COLUMNS[kind]
    if not rows:
        empty = {c: pa.array([], type=pa.string() if c in {"conditions", "extra_json", "id"} else None) for c in cols}
        # All-string empty table is honest for a zero-row day
        arrays = {c: pa.array([], type=pa.string()) for c in cols}
        return pa.table(arrays)
    projected = project_rows(kind, rows)
    data: dict[str, list[Any]] = {c: [] for c in cols}
    for r in projected:
        for c in cols:
            v = r.get(c)
            if isinstance(v, (list, dict)):
                data[c].append(_json_dump(v))
            else:
                data[c].append(v)
    return pa.table(data)
