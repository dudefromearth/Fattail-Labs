"""Labs disk cache for settled archive books. Whole-day LRU. Hash in the key."""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

CACHE_CEILING_BYTES = 20 * 1024 * 1024 * 1024


def _safe(part: str) -> str:
    return "".join(c if c.isalnum() or c in "-_." else "_" for c in part)[:80]


def cache_enabled(root: str | None) -> bool:
    return bool(root) and Path(root).is_dir()


def _book_dir(root: Path, day: str, symbol: str, expiration: str, digest: str) -> Path:
    return root / _safe(day) / _safe(symbol) / _safe(expiration or "held") / _safe(digest)


def _day_dir(root: Path, day: str) -> Path:
    return root / _safe(day)


def _head_path(root: Path, day: str, symbol: str, expiration: str) -> Path:
    return root / _safe(day) / _safe(symbol) / _safe(expiration or "held") / "HEAD"


def _read_head(root: Path, day: str, symbol: str, expiration: str) -> str:
    path = _head_path(root, day, symbol, expiration)
    if not path.is_file():
        return ""
    try:
        return path.read_text(encoding="utf-8").strip()
    except OSError:
        return ""


def _dir_bytes(path: Path) -> int:
    total = 0
    if not path.is_dir():
        return 0
    for child in path.rglob("*"):
        if child.is_file():
            try:
                total += child.stat().st_size
            except OSError:
                continue
    return total


def _touch(path: Path) -> None:
    import os

    now = time.time()
    try:
        os.utime(path, (now, now))
    except OSError:
        pass


def get_cached(
    root: str | None,
    *,
    day: str,
    symbol: str,
    expiration: str,
    digest: str,
    kind: str,
) -> dict[str, Any] | None:
    if not cache_enabled(root):
        return None
    if not digest:
        digest = _read_head(Path(root), day, symbol, expiration)
    if not digest:
        return None
    path = _book_dir(Path(root), day, symbol, expiration, digest) / f"{_safe(kind)}.json"
    if not path.is_file():
        return None
    try:
        doc = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    if not isinstance(doc, dict):
        return None
    _touch(_day_dir(Path(root), day))
    return doc


def put_cached(
    root: str | None,
    *,
    day: str,
    symbol: str,
    expiration: str,
    digest: str,
    kind: str,
    doc: dict[str, Any],
) -> None:
    if not cache_enabled(root) or not digest:
        return
    if doc.get("live") or doc.get("hole") in ("TODAY_LIVE", "UNKNOWN", "WRONG BOOK"):
        return
    base = Path(root)
    folder = _book_dir(base, day, symbol, expiration, digest)
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / f"{_safe(kind)}.json"
    payload = {k: v for k, v in doc.items() if k != "_cache_hit"}
    path.write_text(json.dumps(payload, default=str, separators=(",", ":")), encoding="utf-8")
    _head_path(base, day, symbol, expiration).write_text(digest, encoding="utf-8")
    _touch(_day_dir(base, day))
    _evict(base)


def _evict(root: Path) -> None:
    total = _dir_bytes(root)
    if total <= CACHE_CEILING_BYTES:
        return
    days = [p for p in root.iterdir() if p.is_dir()]
    days.sort(key=lambda p: p.stat().st_mtime)
    for folder in days:
        if total <= CACHE_CEILING_BYTES:
            break
        size = _dir_bytes(folder)
        try:
            import shutil

            shutil.rmtree(folder)
            total -= size
        except OSError:
            continue
