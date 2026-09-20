"""Sibling job: python -m market_data.vp_ingest.futures_feed

ONE futures WS. ES+MES multiplexed. Not stocks T.SPY.
"""

from __future__ import annotations

import json
import os
import sys
import threading
import time
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Callable, Iterable

from market_data.vp_ingest.futures_capture import (
    PRODUCTS,
    ingest_futures_frame,
    maybe_absence,
    record_disconnect,
)
from market_data.vp_ingest.futures_contracts import (
    _http_get_json,
    fetch_active_contracts,
    pick_roll_set,
)
from market_data.vp_ingest.futures_schedules import (
    es_mes_halt_window,
    halt_is_scheduled,
    session_is_open,
)
from market_data.vp_ingest.disk_guard import CHECK_EVERY_S, below_guard
from market_data.vp_ingest.store import archive_root, append_gap


def _now_raw() -> int:
    # UTC nanoseconds — display conversion is not this job's.
    return time.time_ns()


def run_loop(
    *,
    root: Path,
    allowed: set[str],
    connect: Callable[[], Iterable[str]],
    stop: threading.Event,
    status_fn: Callable[[], dict[str, Any] | None] | None = None,
    schedule_fn: Callable[[], dict[str, Any] | None] | None = None,
) -> None:
    last: dict[str, int] = {}
    gap: dict[str, dict[str, Any] | None] = {}
    last_disk = 0.0
    last_meta = 0.0
    disk_stopped = False
    META_EVERY_S = 30.0
    status: dict[str, Any] | None = None
    schedule: dict[str, Any] | None = None
    halt = {p: False for p in PRODUCTS}
    opened = {p: True for p in PRODUCTS}
    sed: str | None = None

    def refresh_meta() -> None:
        nonlocal status, schedule, halt, opened, sed
        status = status_fn() if status_fn else {"status": "open"}
        schedule = schedule_fn() if schedule_fn else {}
        halt = {
            p: halt_is_scheduled(schedule, now_ns=_now_raw(), product=p) for p in PRODUCTS
        }
        opened = {p: session_is_open(status, product=p) and not halt[p] for p in PRODUCTS}
        sed = None
        if isinstance(status, dict):
            sed = (
                status.get("session_end_date")
                or session_end_from_status(status, product="ES")
                or session_end_from_status(status, product="MES")
            )

    while not stop.is_set():
        refresh_meta()
        try:
            for frame in connect():
                if stop.is_set():
                    return
                now = time.time()
                if now - last_disk >= CHECK_EVERY_S:
                    last_disk = now
                    if below_guard(root):
                        if not disk_stopped:
                            for p in PRODUCTS:
                                append_gap(
                                    root,
                                    p,
                                    {
                                        "kind": "DISK_GUARD",
                                        "t": _now_raw(),
                                        "state": "open",
                                    },
                                )
                            print("vp-futures DISK_GUARD: <5 GiB free; stopping writes", flush=True)
                        disk_stopped = True
                if disk_stopped:
                    continue
                now_meta = time.time()
                if now_meta - last_meta >= META_EVERY_S:
                    last_meta = now_meta
                    refresh_meta()
                ingest_futures_frame(
                    frame,
                    root=root,
                    allowed=allowed,
                    last_print_ns=last,
                    open_gap=gap,
                    default_session_end_date=str(sed)[:10] if sed else None,
                )
                maybe_absence(
                    root,
                    PRODUCTS,
                    last,
                    gap,
                    _now_raw(),
                    session_open=opened,
                    scheduled_halt=halt,
                )
        except Exception:
            record_disconnect(
                root,
                PRODUCTS,
                gap,
                _now_raw(),
                session_open=opened,
                scheduled_halt=halt,
            )
            if stop.wait(1.0):
                return


def write_session_clock(root: Path, status: dict[str, Any], tickers: list[str]) -> Path:
    """Named session state for watchdog / engine. Vendor market-status is SoR."""
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc).isoformat()
    body: dict[str, Any] = {
        "as_of": now,
        "tickers": list(tickers),
        "products": {},
    }
    for p in PRODUCTS:
        opened = session_is_open(status, product=p)
        window = es_mes_halt_window()
        halt = halt_is_scheduled({}, product=p) or window is not None
        sed = session_end_from_status(status, product=p)
        if window:
            reason = "halt"
        elif opened and not halt:
            reason = "in_session"
        elif halt:
            reason = "halt"
        else:
            reason = "closed"
        body["products"][p] = {
            "open": bool(opened and not halt),
            "halt": bool(halt),
            "halt_window": window,
            "session_end_date": sed,
            "reason": reason,
        }
    path = root / "vp" / "engine" / "session_clock.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    prev = None
    if path.is_file():
        try:
            prev = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            prev = None
    path.write_text(json.dumps(body, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    if prev:
        for p in PRODUCTS:
            old = (prev.get("products") or {}).get(p, {}).get("reason")
            new = body["products"][p]["reason"]
            if old != new:
                print(
                    f"vp-futures session {p} {old} -> {new} "
                    f"sed={body['products'][p]['session_end_date']}",
                    flush=True,
                )
    return path


def fetch_market_status() -> dict[str, Any]:
    """Vendor /futures/v1/market-status — session_end_date, open/halt."""
    url = "/futures/v1/market-status?limit=200"
    acc: dict[str, Any] = {"status": "OK", "results": []}
    for _ in range(20):
        data = _http_get_json(url)
        rows = data.get("results") if isinstance(data, dict) else None
        if isinstance(rows, list):
            acc["results"].extend(rows)
        nxt = data.get("next_url") if isinstance(data, dict) else None
        if not nxt:
            break
        url = str(nxt)
    return acc


def session_end_from_status(status: dict[str, Any] | None, *, product: str) -> str | None:
    if not status:
        return None
    for row in status.get("results") or []:
        if not isinstance(row, dict):
            continue
        if str(row.get("product_code") or "").upper() == product.upper():
            sed = row.get("session_end_date")
            if sed:
                return str(sed)[:10]
    return None


def live_connect(tickers: list[str]) -> Iterable[str]:
    import websockets.sync.client as ws_client

    key = (os.environ.get("MASSIVE_API_KEY") or os.environ.get("POLYGON_API_KEY") or "").strip()
    if not key:
        raise RuntimeError("MASSIVE_API_KEY required for futures WS")
    url = (os.environ.get("MASSIVE_FUTURES_WS_URL") or "wss://socket.massive.com/futures").strip()
    params = ",".join(f"T.{t}" for t in tickers)
    with ws_client.connect(url, open_timeout=30, close_timeout=5) as ws:
        ws.send(json.dumps({"action": "auth", "params": key}))
        ws.send(json.dumps({"action": "subscribe", "params": params}))
        while True:
            yield ws.recv()


def main(argv: list[str] | None = None) -> int:
    del argv
    root = archive_root()
    last_refresh = date.min
    tickers: list[str] = []
    stop = threading.Event()

    def refresh() -> list[str]:
        contracts = fetch_active_contracts()
        return pick_roll_set(contracts, as_of=date.today())

    tickers = refresh()
    last_refresh = date.today()
    if not tickers:
        print("vp-futures: no active ES/MES tickers from /futures/v1/contracts", file=sys.stderr)
        return 2
    print(f"vp-futures subscribe {tickers}", flush=True)
    allowed = set(tickers)

    def status_and_clock() -> dict[str, Any]:
        nonlocal last_refresh
        st = fetch_market_status()
        write_session_clock(root, st, tickers)
        sed = session_end_from_status(st, product="ES")
        today = date.today()
        if today != last_refresh or (sed and sed != last_refresh.isoformat()):
            nxt = refresh()
            if nxt and nxt != list(tickers):
                print(f"vp-futures roll-set {list(tickers)} -> {nxt}", flush=True)
                tickers[:] = nxt
                allowed.clear()
                allowed.update(nxt)
            last_refresh = today
        return st

    run_loop(
        root=root,
        allowed=allowed,
        connect=lambda: live_connect(tickers),
        stop=stop,
        status_fn=status_and_clock,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
