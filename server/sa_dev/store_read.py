"""READ-ONLY access to the INFRA collector store. Never append."""

from __future__ import annotations

import gzip
import json
import os
from datetime import date
from pathlib import Path
from typing import Any

from market_data.vp_ingest.store import gaps_path, prints_path

# SA-DEV-W0 named StudioTwo collector path. Used when LABS_MARKET_DATA_ROOT
# is set but unmounted (Pod). Never a silent default: named in the payload.
_SA_DEV_LOCAL = Path("/Users/ernie/fattail-market-data")


def store_root() -> Path:
    ok, detail = store_ok()
    if not ok:
        raise RuntimeError(detail)
    if detail.startswith("local-collector:"):
        return Path(detail.split(":", 1)[1])
    return Path(detail)


def ingest_writable() -> bool:
    """APPS must never write here. Used as a test assertion."""
    return False


def list_source_days(symbol: str) -> list[str]:
    root = store_root() / "vp" / "ingest" / symbol.upper() / "trades"
    if not root.is_dir():
        return []
    days: list[str] = []
    for p in root.iterdir():
        name = p.name
        if name.startswith("day=") and (p / "prints.jsonl.gz").is_file():
            days.append(name[4:])
    days.sort()
    return days


def load_prints(symbol: str, day: date) -> list[dict[str, Any]]:
    path = prints_path(store_root(), symbol, day)
    if not path.is_file():
        return []
    rows: list[dict[str, Any]] = []
    with gzip.open(path, "rt", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def load_gaps(symbol: str, day: date) -> list[dict[str, Any]]:
    path = gaps_path(store_root(), symbol, day)
    if not path.is_file():
        return []
    rows: list[dict[str, Any]] = []
    with path.open(encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def store_ok() -> tuple[bool, str]:
    raw = (os.environ.get("LABS_MARKET_DATA_ROOT") or "").strip()
    if raw:
        root = Path(raw)
        if root.is_dir():
            return True, str(root)
        if _SA_DEV_LOCAL.is_dir():
            return True, f"local-collector:{_SA_DEV_LOCAL}"
        return False, f"store not a directory: {root}"
    if _SA_DEV_LOCAL.is_dir():
        return True, f"local-collector:{_SA_DEV_LOCAL}"
    return False, "LABS_MARKET_DATA_ROOT missing"
