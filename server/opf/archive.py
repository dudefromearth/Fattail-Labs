"""Cold day-shard generation archive (OPF16 · OPF28 · OPF33)."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from opf import config as opf_config
from opf.generation import ChainGeneration, GenerationKey


class ArchiveGap(Exception):
    """Nearest generation too stale for query (OPF33)."""

    def __init__(self, message: str, *, meta: dict[str, Any]) -> None:
        super().__init__(message)
        self.meta = meta

    def to_dict(self) -> dict[str, Any]:
        return {"gap": True, **self.meta}


_SAFE = re.compile(r"[^A-Za-z0-9._:-]+")


def _safe(s: str) -> str:
    return _SAFE.sub("_", s)


def _day_dir(root: Path, day: str) -> Path:
    return root / day


def archive_put(gen: ChainGeneration, *, root: Path | None = None) -> Path:
    """Write generation to day shard. Path: {root}/{day}/{product}_{exp}_w{N}.json"""
    root = root or opf_config.archive_root()
    day = gen.key.expiration  # shard by expiration day (also as_of day alternative)
    as_of_day = (gen.as_of or "")[:10] or day
    d = _day_dir(root, as_of_day)
    d.mkdir(parents=True, exist_ok=True)
    name = f"{_safe(gen.key.product)}_{gen.key.expiration}_w{gen.key.wings}.json"
    path = d / name
    doc = {
        "product": gen.key.product,
        "chain_underlier": gen.key.chain_underlier,
        "expiration": gen.key.expiration,
        "wings": gen.key.wings,
        "spot": gen.spot,
        "as_of": gen.as_of,
        "content_hash": gen.content_hash,
        "dual_side": gen.dual_side,
        "excluded_adjusted_count": gen.excluded_adjusted_count,
        "rows": gen.rows,
    }
    path.write_text(json.dumps(doc, separators=(",", ":"), default=str), encoding="utf-8")
    return path


def archive_get(
    key: GenerationKey,
    *,
    as_of: str | None = None,
    root: Path | None = None,
    max_stale_ms: int | None = None,
) -> ChainGeneration | None:
    """Load generation; if as_of set, enforce max-stale (OPF33)."""
    root = root or opf_config.archive_root()
    max_stale = opf_config.archive_max_stale_ms() if max_stale_ms is None else max_stale_ms

    # Search day dirs for matching file
    name = f"{_safe(key.product)}_{key.expiration}_w{key.wings}.json"
    candidates: list[Path] = []
    if root.exists():
        for day_dir in sorted(root.iterdir()):
            if day_dir.is_dir():
                p = day_dir / name
                if p.is_file():
                    candidates.append(p)
        # also direct path by expiration
        p2 = root / key.expiration / name
        if p2.is_file() and p2 not in candidates:
            candidates.append(p2)

    if not candidates:
        return None

    # Prefer newest as_of
    best: ChainGeneration | None = None
    best_ts = -1.0
    for p in candidates:
        doc = json.loads(p.read_text(encoding="utf-8"))
        gen = _doc_to_gen(doc)
        ts = _as_of_ts(gen.as_of)
        if ts >= best_ts:
            best_ts = ts
            best = gen

    if best is None:
        return None

    if as_of:
        query_ts = _as_of_ts(as_of)
        if query_ts is not None and best_ts >= 0:
            age_ms = (query_ts - best_ts) * 1000.0
            # generation should be at or before query; staleness = query - gen.as_of
            if age_ms > max_stale:
                raise ArchiveGap(
                    f"archive generation stale: age_ms={age_ms:.0f} max={max_stale}",
                    meta={
                        "gap": True,
                        "age_ms": age_ms,
                        "max_stale_ms": max_stale,
                        "generation_as_of": best.as_of,
                        "query_as_of": as_of,
                        "expiration": key.expiration,
                    },
                )
    return best


def _doc_to_gen(doc: dict[str, Any]) -> ChainGeneration:
    key = GenerationKey(
        product=str(doc["product"]),
        chain_underlier=str(doc.get("chain_underlier") or doc["product"]),
        expiration=str(doc["expiration"])[:10],
        wings=int(doc.get("wings") or 25),
    )
    return ChainGeneration(
        key=key,
        rows=list(doc.get("rows") or []),
        spot=doc.get("spot"),
        as_of=str(doc.get("as_of") or ""),
        content_hash=str(doc.get("content_hash") or ""),
        dual_side=bool(doc.get("dual_side", True)),
        excluded_adjusted_count=int(doc.get("excluded_adjusted_count") or 0),
        raw=doc,
    )


def _as_of_ts(as_of: str | None) -> float:
    if not as_of:
        return -1.0
    try:
        s = as_of.replace("Z", "+00:00")
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.timestamp()
    except ValueError:
        return -1.0
