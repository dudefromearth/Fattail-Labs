"""OHLC session-chunk warmer. Gzip scan lives here, never on the member request."""

from __future__ import annotations

import os
import threading
import time
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

from market_data.vp_chunks import HORIZON_SESSIONS, SOURCES, TFS, chunk_key, decode_chunk, encode_chunk
from market_data.vp_engine.rebuild import load_prints
from market_data.vp_hot import hot
from market_data.vp_ingest.store import archive_root, prints_path

_lock = threading.Lock()


def _stamp(path: Path) -> str:
    st = path.stat()
    return f"{int(st.st_mtime)}:{st.st_size}"


def _session_days(root: Path, source: str) -> list[date]:
    trades = root / "vp" / "ingest" / source.upper() / "trades"
    if not trades.is_dir():
        return []
    days: list[date] = []
    for p in trades.iterdir():
        if p.name.startswith("day=") and (p / "prints.jsonl.gz").is_file():
            try:
                days.append(date.fromisoformat(p.name[4:]))
            except ValueError:
                continue
    days.sort()
    return days[-HORIZON_SESSIONS:]


def warm_session(source: str, session: date, *, root: Path | None = None) -> dict[str, int]:
    """Rebuild all TF chunks for one source session. Returns gzip bytes written."""
    from market_data.vp_ohlc import bars_from_prints

    ar = root or archive_root()
    path = prints_path(ar, source, session)
    if not path.is_file():
        return {}
    stamp = _stamp(path)
    layer = hot()
    if not layer.enabled:
        return {}
    iso = session.isoformat()
    wrote: dict[str, int] = {}
    # Skip if every TF chunk already matches stamp.
    need = False
    for tf in TFS:
        raw = layer.get_raw(chunk_key(source, tf, iso))
        if not raw:
            need = True
            break
        try:
            if decode_chunk(raw).get("gen") != stamp:
                need = True
                break
        except Exception:
            need = True
            break
    if not need:
        return {}
    prints = load_prints(ar, source, session)
    for tf in TFS:
        bars, gaps, contract, rule = bars_from_prints(prints, tf=tf, product=source)
        obj = {
            "gen": stamp,
            "session": iso,
            "tf": tf,
            "source": source.upper(),
            "contract": contract,
            "lead_rule": rule,
            "bars": bars,
            "gaps": gaps,
        }
        blob = encode_chunk(obj)
        ok = layer.set_raw(chunk_key(source, tf, iso), blob)
        if ok:
            wrote[tf] = len(blob)
    return wrote


def expire_beyond_horizon(*, root: Path | None = None) -> int:
    ar = root or archive_root()
    layer = hot()
    if not layer.enabled:
        return 0
    dropped = 0
    for src in SOURCES:
        keep = {d.isoformat() for d in _session_days(ar, src)}
        for key in layer.scan_keys(f"ohlc:{src}:*"):
            parts = key.split(":")
            if len(parts) != 4:
                continue
            iso = parts[3]
            if iso == "developing":
                continue
            if iso not in keep:
                layer.delete(key)
                dropped += 1
    return dropped


def warm_all(*, root: Path | None = None) -> dict[str, Any]:
    ar = root or archive_root()
    t0 = time.perf_counter()
    n = 0
    bytes_w = 0
    with _lock:
        for src in SOURCES:
            for session in _session_days(ar, src):
                wrote = warm_session(src, session, root=ar)
                n += len(wrote)
                bytes_w += sum(wrote.values())
        dropped = expire_beyond_horizon(root=ar)
    return {
        "chunks_written": n,
        "bytes_written": bytes_w,
        "expired": dropped,
        "ms": round((time.perf_counter() - t0) * 1000),
        "horizon": HORIZON_SESSIONS,
        "used_bytes": hot().used_bytes,
        "cap_bytes": hot().cap_bytes,
    }


def warm_loop(stop: threading.Event | None = None) -> None:
    while stop is None or not stop.is_set():
        try:
            warm_all()
        except Exception:
            pass
        if stop is None:
            time.sleep(60)
            continue
        stop.wait(60)


def main() -> int:
    report = warm_all()
    print(report, flush=True)
    return 0


def start_background() -> None:
    flag = (os.environ.get("LABS_VP_WARMER") or "").strip().lower()
    if flag not in ("1", "true", "yes"):
        return
    if not hot().enabled:
        return
    t = threading.Thread(target=warm_loop, name="vp-warmer", daemon=True)
    t.start()


if __name__ == "__main__":
    raise SystemExit(main())


def load_chunks(source: str, tf: str, days: list[str]) -> list[dict[str, Any]]:
    layer = hot()
    out: list[dict[str, Any]] = []
    if not layer.enabled:
        return out
    for iso in days:
        raw = layer.get_raw(chunk_key(source, tf, iso))
        if not raw:
            continue
        try:
            out.append(decode_chunk(raw))
        except Exception:
            continue
    return out
