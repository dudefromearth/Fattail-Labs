"""Contract v1.3 stream: tick / bar / gen / heartbeat.

HTTP payloads remain authoritative (rule 1). Stream is a hint; gen triggers
re-GET. Mock fixture is finite. Live relay proxies sidecar /v1/stream, or
tails the print store when INFRA has not seated the socket yet.
"""

from __future__ import annotations

import asyncio
import json
from datetime import date, datetime, timezone
from typing import Any, AsyncIterator

from sa_dev.vp_client import api_base

AS_OF_NS = 1789660800000000000


def sse(event: str, data: dict[str, Any]) -> bytes:
    return f"event: {event}\ndata: {json.dumps(data, separators=(',', ':'))}\n\n".encode()


def mock_stream_events(
    source: str = "SPY",
    timeframe: str = "5m",
) -> list[tuple[str, dict[str, Any]]]:
    """Finite fixture: hello, heartbeat, tick, bar, gen, heartbeat."""
    src = source.upper()
    px = 640.30 if src == "SPY" else 6558.50
    bar = {
        "t": AS_OF_NS,
        "o": px - 0.10,
        "h": px + 0.20,
        "l": px - 0.20,
        "c": px,
        "v": 12,
    }
    return [
        ("hello", {"protocol": "vp-stream/1.3", "source": src, "timeframe": timeframe}),
        ("heartbeat", {"t": AS_OF_NS, "source": src}),
        ("tick", {"source": src, "p": px, "t": AS_OF_NS + 1_000_000}),
        ("bar", {"source": src, "timeframe": timeframe, **bar}),
        (
            "gen",
            {
                "source": src,
                "profile_generation_id": "g-stream-f1",
                "kind": "ohlc",
            },
        ),
        ("heartbeat", {"t": AS_OF_NS + 1_000_000_000, "source": src}),
    ]


async def iter_mock_sse(
    source: str, timeframe: str, *, once: bool = True
) -> AsyncIterator[bytes]:
    for ev, data in mock_stream_events(source, timeframe):
        yield sse(ev, data)
        await asyncio.sleep(0)
    if once:
        return
    t = AS_OF_NS + 2_000_000_000
    while True:
        yield sse("heartbeat", {"t": t, "source": source.upper()})
        t += 1_000_000_000
        await asyncio.sleep(1.0)


async def iter_upstream_sse(
    source: str,
    timeframe: str,
    *,
    headers: dict[str, str] | None = None,
) -> AsyncIterator[bytes]:
    import http.client
    from urllib.parse import urlencode, urlsplit

    use = api_base().rstrip("/")
    if use.startswith("mock:"):
        async for chunk in iter_mock_sse(source, timeframe, once=False):
            yield chunk
        return
    parts = urlsplit(use)
    q = urlencode({"source": source.upper(), "timeframe": timeframe})
    path = f"/v1/stream?{q}"

    def _open() -> tuple[http.client.HTTPConnection, http.client.HTTPResponse]:
        conn = http.client.HTTPConnection(
            parts.hostname or "", parts.port or 80, timeout=30
        )
        hdrs = dict(headers or {})
        hdrs.setdefault("Accept", "text/event-stream")
        hdrs.setdefault("Connection", "keep-alive")
        conn.request("GET", path, headers=hdrs)
        return conn, conn.getresponse()

    conn, resp = await asyncio.to_thread(_open)
    if resp.status != 200:
        conn.close()
        raise RuntimeError(f"upstream stream {resp.status}")
    try:
        while True:
            chunk = await asyncio.to_thread(resp.readline)
            if not chunk:
                break
            yield chunk if chunk.endswith(b"\n") else chunk + b"\n"
    finally:
        conn.close()


async def iter_print_tail_sse(source: str, timeframe: str) -> AsyncIterator[bytes]:
    """Labs-side stream from the print store when sidecar /v1/stream is 404."""
    from market_data.vp_ingest.store import vendor_ts_to_seconds
    from sa_dev.store_read import list_source_days, load_prints

    src = source.upper()
    yield sse(
        "hello",
        {
            "protocol": "vp-stream/1.3",
            "source": src,
            "timeframe": timeframe,
            "relay": "labs-print-tail",
        },
    )
    last_t = 0.0
    last_px = 0.0
    last_gen = ""
    while True:
        now_ns = int(datetime.now(timezone.utc).timestamp() * 1_000_000_000)
        yield sse("heartbeat", {"t": now_ns, "source": src})
        days = await asyncio.to_thread(list_source_days, src)
        if days:
            rows = await asyncio.to_thread(
                load_prints, src, date.fromisoformat(days[-1])
            )
            rec = rows[-1] if rows else None
            if rec:
                try:
                    px = float(
                        rec.get("p") if rec.get("p") is not None else rec.get("price")
                    )
                    ts = vendor_ts_to_seconds(rec.get("t") or 0)
                except (TypeError, ValueError):
                    px, ts = 0.0, 0.0
                if px > 0 and ts >= last_t:
                    t_ns = int(ts * 1_000_000_000)
                    if ts != last_t or px != last_px:
                        yield sse("tick", {"source": src, "p": px, "t": t_ns})
                        last_t, last_px = ts, px
                    gen = f"{src}:{timeframe}:{t_ns}"
                    if gen != last_gen:
                        last_gen = gen
                        yield sse(
                            "gen",
                            {
                                "source": src,
                                "profile_generation_id": gen,
                                "kind": "ohlc",
                            },
                        )
        await asyncio.sleep(0.5)


async def iter_live_sse(
    source: str,
    timeframe: str,
    *,
    headers: dict[str, str] | None = None,
) -> AsyncIterator[bytes]:
    try:
        async for chunk in iter_upstream_sse(source, timeframe, headers=headers):
            yield chunk
    except Exception:
        async for chunk in iter_print_tail_sse(source, timeframe):
            yield chunk
