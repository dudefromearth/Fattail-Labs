#!/usr/bin/env python3
"""Shared live marks stream — poll Massive once for the universe; all members read DB.

Usage (from server/ with env):

  set -a && source ../.env && set +a
  export MASSIVE_API_KEY="${MASSIVE_API_KEY:-$POLYGON_API_KEY}"
  .venv/bin/python -m market_data.live_stream --once
  .venv/bin/python -m market_data.live_stream --interval 5

Indexes (SPX/XSP/VIX): try feed_symbol (I:*); on 403/404 use proxy_symbol when set
(e.g. SPX→SPY) with labeled source so members know it is a proxy until entitled.
"""

from __future__ import annotations

import argparse
import os
import signal
import sys
import time
from datetime import datetime, timezone
from typing import Any

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import db  # noqa: E402
from market_data import live_marks as lm  # noqa: E402
from market_data.massive_client import MassiveClient, MassiveClientError  # noqa: E402

_stop = False


def _handle_stop(signum: int, frame: Any) -> None:
    global _stop
    _stop = True
    print(f"\n[live_stream] signal {signum} — stopping", flush=True)


def _fetch_for_row(client: MassiveClient, row: dict[str, Any]) -> dict[str, Any]:
    """Resolve mark for universe row → product symbol mid + provenance."""
    product = row["symbol"]
    feed = (row.get("feed_symbol") or product or "").strip()
    proxy = (row.get("proxy_symbol") or "").strip() or None

    tried: list[str] = []
    last_err: Exception | None = None

    for candidate in [feed, product]:
        if not candidate or candidate in tried:
            continue
        tried.append(candidate)
        try:
            m = client.fetch_underlier_mark(candidate)
            m["product_symbol"] = product
            m["feed_used"] = candidate
            m["via_proxy"] = False
            return m
        except MassiveClientError as exc:
            last_err = exc

    if proxy:
        try:
            m = client.fetch_underlier_mark(proxy)
            m["product_symbol"] = product
            m["feed_used"] = proxy
            m["via_proxy"] = True
            m["proxy_for"] = product
            return m
        except MassiveClientError as exc:
            last_err = exc

    raise MassiveClientError(
        f"{product}: no mark from {tried}"
        + (f" or proxy {proxy}" if proxy else "")
        + (f" ({last_err})" if last_err else "")
    )


def poll_once(client: MassiveClient, universe: list[dict[str, Any]]) -> dict[str, Any]:
    ok = 0
    err = 0
    errors: list[str] = []
    symbols = [u["symbol"] for u in universe]
    with db.transaction() as conn:
        with conn.cursor() as cur:
            for row in universe:
                product = row["symbol"]
                try:
                    m = _fetch_for_row(client, row)
                    asof = datetime.now(timezone.utc)
                    via_proxy = bool(m.get("via_proxy"))
                    source = (
                        "massive_proxy_v1" if via_proxy else "massive_live_stream_v1"
                    )
                    if via_proxy:
                        label = (
                            f"Shared stream PROXY {m.get('feed_used')}→{product} "
                            f"(index feed not entitled; not true {product})"
                        )
                    else:
                        label = "Shared live stream (all members)"
                    # Daily reference: prev session OHLC on feed or proxy ticker
                    prev_sym = str(m.get("feed_used") or product)
                    prev = client.fetch_prev_day(prev_sym)
                    lm.upsert_mark(
                        cur,
                        symbol=product,
                        mid=m["mid"],
                        bid=m.get("bid"),
                        ask=m.get("ask"),
                        last_trade=m.get("last_trade"),
                        source=source,
                        label=label[:128],
                        asof=asof,
                        prev_close=prev.get("close") if prev else None,
                        day_open=prev.get("open") if prev else None,
                        day_high=prev.get("high") if prev else None,
                        day_low=prev.get("low") if prev else None,
                        raw={
                            "asof_ns": m.get("asof_ns"),
                            "feed_used": m.get("feed_used"),
                            "via_proxy": via_proxy,
                            "proxy_for": m.get("proxy_for"),
                            "prev_day": prev,
                            "role": row.get("role"),
                        },
                    )
                    ok += 1
                    tag = "PROXY" if via_proxy else "LIVE"
                    print(
                        f"[live_stream] {tag} {product} mid={m['mid']:.4f} "
                        f"via={m.get('feed_used')}",
                        flush=True,
                    )
                except MassiveClientError as exc:
                    err += 1
                    errors.append(f"{product}: {exc}")
                    print(f"[live_stream] FAIL {product}: {exc}", flush=True)
            if ok:
                lm.set_heartbeat(
                    cur,
                    status="running",
                    symbols=symbols,
                    touch_ok=True,
                )
            else:
                lm.set_heartbeat(
                    cur,
                    status="error",
                    symbols=symbols,
                    error="; ".join(errors)[:500],
                    touch_ok=False,
                )
    return {"ok": ok, "errors": err, "error_detail": errors}


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Shared live marks stream for Curate")
    p.add_argument("--once", action="store_true", help="Single poll then exit")
    p.add_argument(
        "--interval",
        type=float,
        default=5.0,
        help="Seconds between polls (default 5)",
    )
    args = p.parse_args(argv)

    signal.signal(signal.SIGINT, _handle_stop)
    signal.signal(signal.SIGTERM, _handle_stop)

    client = MassiveClient()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            universe = lm.list_universe(cur, enabled_only=True)
            symbols = [u["symbol"] for u in universe]
            lm.set_heartbeat(
                cur,
                status="running",
                symbols=symbols,
                poll_interval_s=int(args.interval),
                touch_ok=False,
            )

    print(
        f"[live_stream] universe={symbols} interval={args.interval}s",
        flush=True,
    )

    if args.once:
        out = poll_once(client, universe)
        print(f"[live_stream] done ok={out['ok']} errors={out['errors']}", flush=True)
        return 0 if out["ok"] > 0 else 1

    while not _stop:
        t0 = time.perf_counter()
        with db.transaction() as conn:
            with conn.cursor() as cur:
                universe = lm.list_universe(cur, enabled_only=True)
        poll_once(client, universe)
        elapsed = time.perf_counter() - t0
        sleep_for = max(0.5, float(args.interval) - elapsed)
        end = time.time() + sleep_for
        while not _stop and time.time() < end:
            time.sleep(0.2)

    with db.transaction() as conn:
        with conn.cursor() as cur:
            lm.set_heartbeat(cur, status="stopped", symbols=symbols)
    print("[live_stream] stopped", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
