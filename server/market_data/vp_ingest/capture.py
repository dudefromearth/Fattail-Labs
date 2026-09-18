"""Parse Massive stocks T events; gap supervision; replay-friendly runner.

Live WS is StudioOne-only (LABS_VP_SPY_TRADES=1). Tests inject a tape.
"""

from __future__ import annotations

import json
import os
import threading
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Iterable
from zoneinfo import ZoneInfo

from market_data.vp_ingest.conditions import annotate
from market_data.vp_ingest.store import (
    GAP_MIN_SECONDS,
    append_gap,
    append_print,
    archive_root,
    in_rth,
)
from market_data.vp_ingest.trade_symbols import stocks_subscribe_params, trade_capture_symbols

ET = ZoneInfo("America/New_York")
SYMBOL = "SPY"


def parse_trade_event(
    ev: dict[str, Any], *, allowed: frozenset[str] | None = None
) -> dict[str, Any] | None:
    if (ev.get("ev") or ev.get("evnt")) != "T":
        return None
    sym = str(ev.get("sym") or "").upper()
    if allowed is None:
        allowed = trade_capture_symbols()
    if sym not in allowed:
        return None
    cond = ev.get("c") or []
    if not isinstance(cond, list):
        cond = [cond]
    cond_ids = [int(x) for x in cond if x is not None]
    labels = annotate(cond_ids)
    size = ev.get("s")
    ds = ev.get("ds")
    rec = {
        "sym": sym,
        "p": ev.get("p"),
        "s": size,
        "ds": ds,
        "x": ev.get("x"),
        "c": cond_ids,
        "t": ev.get("t"),
        "pt": ev.get("pt"),
        "q": ev.get("q"),
        "i": ev.get("i"),
        "auction": bool(labels["auction"]),
        "oddlot": bool(labels["oddlot"]),
        "unknown_condition_ids": labels["unknown_condition_ids"],
    }
    return rec


def ingest_ws_payload(
    raw: str | bytes,
    *,
    root: Path,
    last_print_ms: list[int],
    open_gap: list[dict[str, Any] | None],
) -> int:
    """Handle one WS text frame (object or array). Returns prints stored."""
    if isinstance(raw, bytes):
        raw = raw.decode("utf-8")
    data = json.loads(raw)
    events = data if isinstance(data, list) else [data]
    n = 0
    for ev in events:
        if not isinstance(ev, dict):
            continue
        if ev.get("ev") == "status":
            continue
        rec = parse_trade_event(ev)
        if rec is None:
            continue
        append_print(root, rec)
        t = int(rec["t"] or 0)
        last_print_ms[0] = t
        if open_gap[0] is not None:
            g = open_gap[0]
            g["closed_ms"] = t
            g["reason_close"] = "print"
            append_gap(root, str(rec.get("sym") or SYMBOL), g)
            open_gap[0] = None
        n += 1
    return n


def maybe_absence_gap(
    root: Path,
    last_print_ms: list[int],
    open_gap: list[dict[str, Any] | None],
    now_ms: int,
    *,
    gap_min_s: int = GAP_MIN_SECONDS,
) -> None:
    if open_gap[0] is not None:
        return
    now = datetime.fromtimestamp(now_ms / 1000.0, tz=ET)
    if not in_rth(now):
        return
    last = last_print_ms[0]
    if last <= 0:
        return
    if (now_ms - last) / 1000.0 < gap_min_s:
        return
    open_gap[0] = {
        "kind": "print_absence",
        "opened_ms": last + gap_min_s * 1000,
        "t_ms": now_ms,
        "gap_min_seconds": gap_min_s,
    }
    append_gap(root, SYMBOL, {**open_gap[0], "state": "open"})


def record_disconnect_gap(
    root: Path,
    open_gap: list[dict[str, Any] | None],
    now_ms: int,
) -> None:
    if open_gap[0] is not None:
        return
    open_gap[0] = {
        "kind": "feed_liveness",
        "opened_ms": now_ms,
        "t_ms": now_ms,
    }
    append_gap(root, SYMBOL, {**open_gap[0], "state": "open"})


def replay_tape(
    frames: Iterable[str],
    root: Path,
    *,
    clocks_ms: Iterable[int] | None = None,
) -> int:
    last = [0]
    gap: list[dict[str, Any] | None] = [None]
    n = 0
    clock_iter = iter(clocks_ms or [])
    for frame in frames:
        n += ingest_ws_payload(frame, root=root, last_print_ms=last, open_gap=gap)
        try:
            now = next(clock_iter)
        except StopIteration:
            now = int(last[0] or 0)
        if now:
            maybe_absence_gap(root, last, gap, now)
    return n


def _now_ms() -> int:
    return int(time.time() * 1000)


def run_live_loop(
    *,
    root: Path,
    connect: Callable[[], Any],
    stop: threading.Event,
    gap_min_s: int = GAP_MIN_SECONDS,
) -> None:
    """connect() yields an iterable of text frames; raises on disconnect."""
    last = [0]
    gap: list[dict[str, Any] | None] = [None]
    while not stop.is_set():
        try:
            for frame in connect():
                if stop.is_set():
                    return
                ingest_ws_payload(frame, root=root, last_print_ms=last, open_gap=gap)
                maybe_absence_gap(
                    root, last, gap, _now_ms(), gap_min_s=gap_min_s
                )
        except Exception:
            record_disconnect_gap(root, gap, _now_ms())
            if stop.wait(1.0):
                return


def start_spy_trades_thread(
    *,
    root: Path | None = None,
    connect: Callable[[], Any] | None = None,
) -> threading.Event:
    stop = threading.Event()
    ar = root or archive_root()

    def _connect_ws():
        if connect is not None:
            return connect()
        return _live_ws_frames()

    t = threading.Thread(
        target=run_live_loop,
        kwargs={"root": ar, "connect": _connect_ws, "stop": stop},
        name="vp-spy-trades",
        daemon=True,
    )
    t.start()
    return stop


def _live_ws_frames() -> Iterable[str]:
    """One stocks-cluster WS. StudioOne only. Not used by tests."""
    import websockets.sync.client as ws_client

    key = (os.environ.get("MASSIVE_API_KEY") or os.environ.get("POLYGON_API_KEY") or "").strip()
    if not key:
        raise RuntimeError("MASSIVE_API_KEY required for VP SPY trades WS")
    url = (
        os.environ.get("MASSIVE_STOCKS_WS_URL") or "wss://socket.massive.com/stocks"
    ).strip()
    with ws_client.connect(url, open_timeout=30, close_timeout=5) as ws:
        ws.send(json.dumps({"action": "auth", "params": key}))
        ws.send(json.dumps({"action": "subscribe", "params": stocks_subscribe_params()}))
        while True:
            yield ws.recv()
