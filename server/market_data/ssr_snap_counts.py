"""Live snap counts for the Chain Snapshot board.

The tap writes one compact day document on every snap (Redis + COUNTS.json).
The dashboard reads that document. It must never list the snap tree on the
2-second poll — today's RTH book is hundreds of thousands of files.

Redis (Labs SSR, not Market Bus chain schema):
  key      ssr:counts:YYYY-MM-DD
  channel  ssr:counts   payload = day ISO
Sidecar:
  {live_cache}/ssr/live_capture/day=YYYY-MM-DD/COUNTS.json
"""

from __future__ import annotations

import json
import os
from datetime import date
from pathlib import Path
from typing import Any

COUNTS_NAME = "COUNTS.json"
REDIS_KEY_PREFIX = "ssr:counts:"
REDIS_CHANNEL = "ssr:counts"


def redis_key(day: date) -> str:
    return f"{REDIS_KEY_PREFIX}{day.isoformat()}"


def _now_iso() -> str:
    from datetime import datetime
    from zoneinfo import ZoneInfo

    return datetime.now(ZoneInfo("America/New_York")).isoformat()


def _archive_root() -> Path:
    from market_data.ssr_live_capture import data_root

    return data_root() / "ssr" / "live_capture"


def day_folder(day: date) -> Path:
    return _archive_root() / f"day={day.isoformat()}"


def sidecar_path(day_root: Path) -> Path:
    return day_root / COUNTS_NAME


def empty_doc(day: date) -> dict[str, Any]:
    return {
        "day": day.isoformat(),
        "updated_at": None,
        "snaps": 0,
        "symbols": {},
        "source": "empty",
    }


def apply_snap(
    doc: dict[str, Any],
    symbol: str,
    filename: str,
    header: dict[str, Any] | None = None,
    *,
    at: str | None = None,
) -> dict[str, Any]:
    """Increment one symbol in place. O(1)."""
    sym = (symbol or "").strip().upper()
    if not sym or not filename:
        return doc
    symbols = doc.setdefault("symbols", {})
    row = symbols.get(sym) or {"snaps": 0}
    row["snaps"] = int(row.get("snaps") or 0) + 1
    row["last"] = filename
    head = header or {}
    for key in (
        "captured_at",
        "phase",
        "hole",
        "row_count",
        "iv_count",
        "greek_count",
        "expiration",
        "topic",
    ):
        if key in head:
            row[key] = head[key]
    row["not_today"] = False
    symbols[sym] = row
    doc["snaps"] = sum(
        int((v or {}).get("snaps") or 0)
        for v in symbols.values()
        if not (v or {}).get("not_today")
    )
    doc["updated_at"] = at or _now_iso()
    doc["source"] = "live"
    return doc


def apply_miss(
    doc: dict[str, Any],
    symbol: str,
    header: dict[str, Any] | None = None,
    *,
    at: str | None = None,
) -> dict[str, Any]:
    """Named miss for a scheduled symbol. Does not increment snap count.

    The last real snap filename stays. Dashboard hole flag updates.
    """
    sym = (symbol or "").strip().upper()
    if not sym:
        return doc
    symbols = doc.setdefault("symbols", {})
    row = symbols.get(sym) or {"snaps": 0}
    head = header or {}
    row["last_miss_at"] = at or _now_iso()
    for key in ("phase", "expiration", "topic"):
        if key in head and head[key] is not None:
            row[key] = head[key]
    # A live last snap is still the capture. Do not paint the board as NO CHAIN
    # because Redis missed one 2s beat.
    has_live = bool(row.get("last")) and int(row.get("row_count") or 0) > 0
    if not has_live:
        row["hole"] = head.get("hole") or f"NO CHAIN {sym}"
        if head.get("captured_at"):
            row["captured_at"] = head["captured_at"]
    row["not_today"] = False
    symbols[sym] = row
    doc["updated_at"] = at or _now_iso()
    doc["source"] = "live"
    return doc


def apply_not_today(
    doc: dict[str, Any],
    symbol: str,
    *,
    next_expiration: str | None = None,
    listed: list[str] | None = None,
    at: str | None = None,
) -> dict[str, Any]:
    """Mark a name that does not expire on this day. Not a hole."""
    sym = (symbol or "").strip().upper()
    if not sym:
        return doc
    symbols = doc.setdefault("symbols", {})
    row = symbols.get(sym) or {"snaps": 0}
    row["not_today"] = True
    row["state"] = "NOT TODAY"
    row["hole"] = None
    if next_expiration:
        row["next_expiration"] = next_expiration
    if listed:
        row["listed"] = list(listed)
    symbols[sym] = row
    doc["updated_at"] = at or _now_iso()
    return doc


def record_not_today(
    day: date,
    symbol: str,
    *,
    next_expiration: str | None = None,
    listed: list[str] | None = None,
    store: Any = None,
    day_root: Path | None = None,
) -> dict[str, Any]:
    root = day_root if day_root is not None else day_folder(day)
    doc = load_counts(day, store=store, day_root=root) or empty_doc(day)
    apply_not_today(
        doc,
        symbol,
        next_expiration=next_expiration,
        listed=listed,
    )
    persist_counts(day, doc, store=store, day_root=root)
    return doc


def dash_view(doc: dict[str, Any], *, root: Path | None = None) -> dict[str, Any]:
    """Shape the board already paints (summarize_day)."""
    symbols_in = doc.get("symbols") or {}
    symbols: list[dict[str, Any]] = []
    holes = 0
    ivs = 0
    greeks = 0
    last_at: str | None = None
    not_today = 0
    for sym, raw in sorted(symbols_in.items()):
        row = dict(raw or {})
        row["symbol"] = sym
        if row.get("not_today"):
            not_today += 1
            row["state"] = row.get("state") or "NOT TODAY"
            symbols.append(row)
            continue
        if row.get("hole"):
            holes += 1
        if int(row.get("iv_count") or 0) > 0:
            ivs += 1
        if int(row.get("greek_count") or 0) > 0:
            greeks += 1
        cap = str(row.get("captured_at") or "")
        if cap and (last_at is None or cap > last_at):
            last_at = cap
        symbols.append(row)
    snap_rows = [s for s in symbols if not s.get("not_today")]
    return {
        "day": doc.get("day"),
        "root": str(root) if root is not None else None,
        "exists": True,
        "snaps": int(doc.get("snaps") or 0),
        "symbols_with_snaps": len(snap_rows),
        "not_today": not_today,
        "latest_holes": holes,
        "latest_with_iv": ivs,
        "latest_with_greeks": greeks,
        "last_captured_at": last_at,
        "updated_at": doc.get("updated_at"),
        "counts_source": doc.get("source") or "cache",
        "cadence": None,
        "checklist": None,
        "symbols": symbols,
    }


def load_sidecar(day_root: Path) -> dict[str, Any] | None:
    path = sidecar_path(day_root)
    if not path.is_file():
        return None
    try:
        doc = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return doc if isinstance(doc, dict) else None


def write_sidecar(day_root: Path, doc: dict[str, Any]) -> Path:
    day_root.mkdir(parents=True, exist_ok=True)
    dest = sidecar_path(day_root)
    tmp = dest.with_name(dest.name + ".partial")
    tmp.write_text(
        json.dumps(doc, default=str, indent=2) + "\n",
        encoding="utf-8",
    )
    tmp.replace(dest)
    return dest


def load_redis(store: Any, day: date) -> dict[str, Any] | None:
    if store is None:
        return None
    try:
        raw = store._r.get(redis_key(day))
    except Exception:
        return None
    if not raw:
        return None
    try:
        doc = json.loads(raw)
    except json.JSONDecodeError:
        return None
    return doc if isinstance(doc, dict) else None


def save_redis(store: Any, day: date, doc: dict[str, Any]) -> None:
    """Durable day doc + publish. Not mb:* and not the short chain TTL."""
    if store is None:
        return
    payload = json.dumps(doc, default=str, separators=(",", ":"))
    try:
        store._r.set(redis_key(day), payload)
        store._r.publish(
            REDIS_CHANNEL,
            json.dumps({"day": day.isoformat(), "snaps": doc.get("snaps")}, default=str),
        )
    except Exception:
        # Sidecar remains; tap must not die because the board cache blipped.
        return


def load_counts(
    day: date,
    *,
    store: Any = None,
    day_root: Path | None = None,
) -> dict[str, Any] | None:
    root = day_root if day_root is not None else day_folder(day)
    hit = load_redis(store, day)
    if hit:
        hit["source"] = hit.get("source") or "redis"
        return hit
    hit = load_sidecar(root)
    if hit:
        hit["source"] = hit.get("source") or "sidecar"
        return hit
    return None


def persist_counts(
    day: date,
    doc: dict[str, Any],
    *,
    store: Any = None,
    day_root: Path | None = None,
) -> None:
    root = day_root if day_root is not None else day_folder(day)
    write_sidecar(root, doc)
    save_redis(store, day, doc)


def record_miss(
    day: date,
    symbol: str,
    header: dict[str, Any] | None = None,
    *,
    store: Any = None,
    day_root: Path | None = None,
) -> dict[str, Any]:
    root = day_root if day_root is not None else day_folder(day)
    doc = load_counts(day, store=store, day_root=root) or empty_doc(day)
    apply_miss(doc, symbol, header)
    persist_counts(day, doc, store=store, day_root=root)
    return doc


def record_snap(
    day: date,
    symbol: str,
    filename: str,
    header: dict[str, Any] | None = None,
    *,
    store: Any = None,
    day_root: Path | None = None,
) -> dict[str, Any]:
    root = day_root if day_root is not None else day_folder(day)
    doc = load_counts(day, store=store, day_root=root) or empty_doc(day)
    apply_snap(doc, symbol, filename, header)
    persist_counts(day, doc, store=store, day_root=root)
    return doc


def _latest_name(sym_dir: Path) -> str | None:
    best: str | None = None
    try:
        with os.scandir(sym_dir) as it:
            for ent in it:
                name = ent.name
                if (
                    ent.is_file()
                    and name.startswith("snap-")
                    and name.endswith(".json")
                    and (best is None or name > best)
                ):
                    best = name
    except OSError:
        return None
    return best


def _count_snaps(sym_dir: Path) -> int:
    n = 0
    try:
        with os.scandir(sym_dir) as it:
            for ent in it:
                name = ent.name
                if ent.is_file() and name.startswith("snap-") and name.endswith(".json"):
                    n += 1
    except OSError:
        return 0
    return n


def seed_from_disk(day: date, *, day_root: Path | None = None) -> dict[str, Any]:
    """One-shot name scan. Reads JSON for the last file per symbol only."""
    root = day_root if day_root is not None else day_folder(day)
    chain = root / "chain"
    doc = empty_doc(day)
    doc["source"] = "seed"
    if not chain.is_dir():
        doc["updated_at"] = _now_iso()
        return doc
    symbols: dict[str, Any] = {}
    try:
        children = list(chain.iterdir())
    except OSError:
        children = []
    for child in children:
        if child.is_dir():
            n = _count_snaps(child)
            last = _latest_name(child)
            if n <= 0 or not last:
                continue
            row: dict[str, Any] = {"snaps": n, "last": last}
            head_path = child / last
            try:
                raw = json.loads(head_path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                raw = None
            if isinstance(raw, dict):
                for key in (
                    "captured_at",
                    "phase",
                    "hole",
                    "row_count",
                    "iv_count",
                    "greek_count",
                    "expiration",
                    "topic",
                ):
                    if key in raw:
                        row[key] = raw[key]
            symbols[child.name.upper()] = row
        elif child.name.startswith("snap-") and child.suffix == ".json":
            # Friday-flat
            row = symbols.setdefault("SPY", {"snaps": 0, "last": child.name})
            row["snaps"] = int(row.get("snaps") or 0) + 1
            if child.name >= str(row.get("last") or ""):
                row["last"] = child.name
    doc["symbols"] = symbols
    doc["snaps"] = sum(int((v or {}).get("snaps") or 0) for v in symbols.values())
    doc["updated_at"] = _now_iso()
    return doc


def mark_universe_not_today(
    doc: dict[str, Any],
    day: date,
    universe: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Paint every enabled name that does not expire on `day`."""
    from market_data.ssr_live_capture import (
        chain_rows,
        listed_expiration_dates,
        load_enabled_universe,
    )

    rows = universe
    if rows is None:
        try:
            rows = load_enabled_universe()
        except Exception:
            rows = []
    today = day.isoformat()
    for row in chain_rows(rows or []):
        dates = listed_expiration_dates(row)
        if today in dates:
            continue
        nxt = min((d for d in dates if d > today), default=None)
        apply_not_today(
            doc,
            str(row.get("symbol") or ""),
            next_expiration=nxt,
            listed=dates,
        )
    return doc


def ensure_counts(
    day: date,
    *,
    store: Any = None,
    day_root: Path | None = None,
) -> dict[str, Any]:
    root = day_root if day_root is not None else day_folder(day)
    hit = load_counts(day, store=store, day_root=root)
    if hit and int(hit.get("snaps") or 0) > 0:
        mark_universe_not_today(hit, day)
        return hit
    seeded = seed_from_disk(day, day_root=root)
    mark_universe_not_today(seeded, day)
    persist_counts(day, seeded, store=store, day_root=root)
    return seeded
