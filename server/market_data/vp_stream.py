"""Contract v1.3 SSE. Tails ingest store. Collectors untouched."""

from __future__ import annotations

import asyncio
import json
from datetime import date, datetime, timezone
from pathlib import Path
from typing import AsyncIterator

from market_data.vp_engine.rebuild import histogram_path, load_prints
from market_data.vp_ingest.store import archive_root, vendor_ts_to_seconds


def sse(event: str, data: dict) -> bytes:
    return f"event: {event}\ndata: {json.dumps(data, separators=(',', ':'))}\n\n".encode()


async def iter_source_sse(
    source: str,
    *,
    root: Path | None = None,
    cadence_s: float = 0.25,
) -> AsyncIterator[bytes]:
    src = source.upper()
    ar = root or archive_root()
    now_ns = int(datetime.now(timezone.utc).timestamp() * 1_000_000_000)
    yield sse("hello", {"protocol": "vp-stream/1.3", "source": src})
    last_t = 0.0
    last_gen = ""
    while True:
        now_ns = int(datetime.now(timezone.utc).timestamp() * 1_000_000_000)
        today = date.today()
        rows = await asyncio.to_thread(load_prints, ar, src, today)
        rec = rows[-1] if rows else None
        if rec:
            try:
                px = float(rec.get("p") if rec.get("p") is not None else 0)
                ts = vendor_ts_to_seconds(rec.get("t") or 0)
            except (TypeError, ValueError):
                px, ts = 0.0, 0.0
            if px > 0 and ts > last_t:
                last_t = ts
                t_ns = int(ts * 1_000_000_000)
                yield sse("tick", {"t" : t_ns, "p": px, "s": rec.get("s")})
        hist = histogram_path(ar, src, today, "developing")
        if hist.is_file():
            gen = f"{src}:developing:{hist.stat().st_mtime_ns}"
            if gen != last_gen:
                last_gen = gen
                yield sse("gen", {"kind": "developing", "profile_generation_id": gen})
        yield sse("hb", {"t": now_ns, "last_print_age_s": (now_ns / 1e9 - last_t) if last_t else None})
        await asyncio.sleep(max(0.25, cadence_s))
