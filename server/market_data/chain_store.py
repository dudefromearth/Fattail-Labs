"""Local chain snapshot archive — append-only files for historical Test.

Layout (under root):
  {root}/{underlier_safe}/YYYY-MM-DD/snapshots.jsonl.gz

Each line is one JSON object:
  {
    "schema_version": 1,
    "as_of": "ISO-8601 UTC",
    "underlier": "I:SPX",
    "source": "massive",
    "contract_count": N,
    "contracts": [ ... Massive result rows ... ]
  }

Historical tests **must** read this store. Do not re-fetch the past on demand.
"""

from __future__ import annotations

import gzip
import json
import os
import re
from dataclasses import dataclass
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Iterator


SCHEMA_VERSION = 1

_SAFE = re.compile(r"[^A-Za-z0-9._-]+")


def underlier_dir_name(underlier: str) -> str:
    s = (underlier or "").strip()
    if not s:
        raise ValueError("underlier required")
    # I:SPX -> I_SPX
    s = s.replace(":", "_")
    s = _SAFE.sub("_", s)
    return s


def default_store_root() -> Path:
    """LABS_CHAIN_STORE_ROOT or <repo>/data/market/chains."""
    env = (os.environ.get("LABS_CHAIN_STORE_ROOT") or "").strip()
    if env:
        return Path(env).expanduser().resolve()
    # server/market_data/ -> repo root
    here = Path(__file__).resolve().parent
    repo = here.parent.parent
    return (repo / "data" / "market" / "chains").resolve()


@dataclass(frozen=True)
class SnapshotMeta:
    path: Path
    as_of: str
    underlier: str
    contract_count: int
    source: str


class ChainStore:
    def __init__(self, root: Path | None = None) -> None:
        self.root = (root or default_store_root()).resolve()

    def day_dir(self, underlier: str, day: date) -> Path:
        return self.root / underlier_dir_name(underlier) / day.isoformat()

    def snapshots_path(self, underlier: str, day: date) -> Path:
        return self.day_dir(underlier, day) / "snapshots.jsonl.gz"

    def write_snapshot(
        self,
        *,
        underlier: str,
        contracts: list[dict[str, Any]],
        as_of: datetime | None = None,
        source: str = "massive",
        extra: dict[str, Any] | None = None,
    ) -> SnapshotMeta:
        if not isinstance(contracts, list):
            raise TypeError("contracts must be a list")
        as_of = as_of or datetime.now(timezone.utc)
        if as_of.tzinfo is None:
            as_of = as_of.replace(tzinfo=timezone.utc)
        as_of = as_of.astimezone(timezone.utc)
        day = as_of.date()
        path = self.snapshots_path(underlier, day)
        path.parent.mkdir(parents=True, exist_ok=True)

        record: dict[str, Any] = {
            "schema_version": SCHEMA_VERSION,
            "as_of": as_of.isoformat().replace("+00:00", "Z"),
            "underlier": underlier,
            "source": source,
            "contract_count": len(contracts),
            "contracts": contracts,
        }
        if extra:
            record["extra"] = extra

        line = json.dumps(record, separators=(",", ":"), ensure_ascii=False)
        # Append gzip member; gzip open append works for multi-member streams
        # readable by gzip.open sequentially.
        with gzip.open(path, "ab") as fh:
            fh.write(line.encode("utf-8"))
            fh.write(b"\n")

        return SnapshotMeta(
            path=path,
            as_of=record["as_of"],
            underlier=underlier,
            contract_count=len(contracts),
            source=source,
        )

    def iter_day(
        self, underlier: str, day: date
    ) -> Iterator[dict[str, Any]]:
        path = self.snapshots_path(underlier, day)
        if not path.is_file():
            return
            yield  # pragma: no cover — makes this a generator
        with gzip.open(path, "rt", encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                obj = json.loads(line)
                if isinstance(obj, dict):
                    yield obj

    def list_days(self, underlier: str) -> list[date]:
        base = self.root / underlier_dir_name(underlier)
        if not base.is_dir():
            return []
        out: list[date] = []
        for p in sorted(base.iterdir()):
            if p.is_dir():
                try:
                    out.append(date.fromisoformat(p.name))
                except ValueError:
                    continue
        return out

    def latest_snapshot(self, underlier: str) -> dict[str, Any] | None:
        days = self.list_days(underlier)
        if not days:
            return None
        last: dict[str, Any] | None = None
        for rec in self.iter_day(underlier, days[-1]):
            last = rec
        return last

    def count_snapshots(self, underlier: str) -> int:
        n = 0
        for d in self.list_days(underlier):
            for _ in self.iter_day(underlier, d):
                n += 1
        return n
