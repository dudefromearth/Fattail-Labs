#!/usr/bin/env python3
"""labs-sym-feed — universe marks + market status → Redis (MB-P3).

REST snapshots by default (Massive stocks WS only if entitled — use --probe-ws).

  LABS_MARKET_BUS=1 REDIS_URL=redis://127.0.0.1:6379/0 \\
    .venv/bin/python -m market_data.sym_feed --once
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from typing import Any


def _fetch_market_status(api_key: str, base: str) -> dict[str, Any]:
    url = f"{base.rstrip('/')}/v1/marketstatus/now?apiKey={api_key}"
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "Authorization": f"Bearer {api_key}",
            "User-Agent": "FatTail-Labs-sym-feed/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        body = resp.read().decode("utf-8")
    data = json.loads(body)
    return data if isinstance(data, dict) else {"raw": data}


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Market Bus symbol + status feed")
    p.add_argument("--once", action="store_true")
    p.add_argument("--interval", type=float, default=5.0)
    p.add_argument("--probe-ws", action="store_true")
    args = p.parse_args(argv)

    os.environ.setdefault("LABS_MARKET_BUS", "1")

    if args.probe_ws:
        print(
            "PROBE: Massive stocks WebSocket entitlement is plan-specific.\n"
            "  Spec §8.3: prefer WS if entitled, else REST snapshot poll.\n"
            "  This feed uses MassiveClient.fetch_underlier_mark (REST).\n"
            "  File connect transcript on MiniTwo as "
            "agents/p-market-bus/gate-reports/S1-0-ws-probe.md when WS is entitled.",
            flush=True,
        )
        return 0

    from market_data.market_bus.config import bus_enabled
    from market_data.market_bus.store import BusStore, get_store
    from market_data.massive_client import MassiveClient, MassiveClientError
    import db
    from market_data import universe_admin as ua

    if not bus_enabled():
        print("LABS_MARKET_BUS must be enabled", file=sys.stderr)
        return 2

    store = get_store() or BusStore()
    client = MassiveClient()

    def tick() -> None:
        try:
            status = _fetch_market_status(client.api_key, client.base_url)
            doc = {
                "t": "session",
                "as_of": time.time(),
                "market": status.get("market"),
                "serverTime": status.get("serverTime"),
                "exchanges": status.get("exchanges"),
                "source": "massive_marketstatus_now",
            }
            store.set_json("mb:session:market_status", doc, ttl_s=180.0)
            print(f"status market={doc.get('market')}", flush=True)
        except Exception as exc:
            print(f"status fail: {exc}", flush=True)

        with db.transaction() as conn:
            with conn.cursor() as cur:
                rows = ua.list_all(cur, enabled_only=True)

        for row in rows:
            product = str(row.get("symbol") or "").upper()
            feed = (row.get("feed_symbol") or product or "").strip()
            proxy = (row.get("proxy_symbol") or "").strip()
            if not product:
                continue
            try:
                source = "massive"
                try:
                    mark_sym = feed if feed else product
                    if product in ("VIX", "VIX1D"):
                        index_ticker = (
                            mark_sym
                            if mark_sym.upper().startswith("I:")
                            else f"I:{product}"
                        )
                        mark = client.fetch_index_mark(index_ticker)
                        source = "massive_index_v1"
                    elif mark_sym.startswith("I:"):
                        # SPX/XSP still use the stocks snapshot path; not this packet
                        mark = client.fetch_underlier_mark(mark_sym.replace("I:", "", 1))
                    else:
                        mark = client.fetch_underlier_mark(mark_sym)
                    mid = mark.get("mid")
                except MassiveClientError:
                    if not proxy:
                        raise
                    mark = client.fetch_underlier_mark(proxy)
                    mid = mark.get("mid")
                    source = "massive_proxy_v1"
                if mid is None:
                    continue
                doc = {
                    "symbol": product,
                    "feed": feed,
                    "mid": float(mid),
                    "bid": mark.get("bid"),
                    "ask": mark.get("ask"),
                    "prev_close": mark.get("prev_close"),
                    "source": source,
                    "label": (
                        f"Market Bus underlier ({source})"
                        if source != "massive_proxy_v1"
                        else f"Proxy underlier via {proxy} (massive_proxy_v1)"
                    ),
                    "ts": time.time(),
                    "seq": int(time.time() * 1000),
                }
                store.set_json(f"mb:sym:{product}", doc, ttl_s=30.0)
                # O2 dual-write → MySQL (temporary; exit after bus-primary proof)
                try:
                    from market_data.underlier_marks import dual_write_mysql_from_bus_doc

                    with db.transaction() as conn:
                        with conn.cursor() as cur:
                            dual_write_mysql_from_bus_doc(cur, product, doc)
                except Exception as dw_exc:
                    print(f"sym {product} dual-write warn: {dw_exc}", flush=True)
                print(f"sym {product} mid={mid} src={source}", flush=True)
            except Exception as exc:
                print(f"sym {product} fail: {exc}", flush=True)

    if args.once:
        tick()
        return 0
    while True:
        tick()
        time.sleep(max(1.0, float(args.interval)))


if __name__ == "__main__":
    raise SystemExit(main())
