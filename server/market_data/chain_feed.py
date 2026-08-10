#!/usr/bin/env python3
"""labs-chain-feed — sole Massive writer for chain generations (MB-P2).

Usage:
  LABS_MARKET_BUS=1 REDIS_URL=redis://127.0.0.1:6379/0 \\
    .venv/bin/python -m market_data.chain_feed --once
  .venv/bin/python -m market_data.chain_feed --interval 2
"""

from __future__ import annotations

import argparse
import os
import sys
import time


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Market Bus chain feed")
    p.add_argument("--once", action="store_true")
    p.add_argument("--interval", type=float, default=2.0)
    p.add_argument(
        "--symbol",
        default="SPX",
        help="Default warm product if no interest keys",
    )
    args = p.parse_args(argv)

    os.environ.setdefault("LABS_MARKET_BUS", "1")

    from market_data.market_bus.config import bus_enabled
    from market_data.market_bus.store import BusStore, get_store
    from routes import chain_ladder as cl

    if not bus_enabled():
        print("LABS_MARKET_BUS must be enabled", file=sys.stderr)
        return 2

    store = get_store()
    if store is None:
        store = BusStore()

    def tick() -> None:
        topics = store.list_interest_topics("mb:ladder:")
        if not topics:
            # Eager warm default SPX nearest via empty interest — feed still needs
            # API demand; for --once smoke, warm SPX if universe allows.
            print("no interest keys; idle", flush=True)
            return
        for topic in topics:
            # mb:ladder:{feed}:{exp}:{side}:w{N}
            parts = topic.split(":")
            if len(parts) < 6:
                continue
            feed, exp, side, wpart = parts[2], parts[3], parts[4], parts[5]
            wings = int(wpart[1:]) if wpart.startswith("w") else 25
            product = feed[2:] if feed.startswith("I:") else feed
            try:
                resolved = cl._resolve_universe_symbol(product)
            except Exception as exc:
                print(f"skip {topic}: {exc}", flush=True)
                continue
            try:
                payload = cl._fetch_ladder_uncached(
                    product=resolved["product"],
                    chain_underlier=resolved["chain_underlier"],
                    kind=str(resolved.get("kind") or "equity"),
                    expiration=exp,
                    side=side,
                    wings=wings,
                    strike_step_cfg=resolved.get("strike_step"),
                )
                store.set_json(topic, payload)
                print(
                    f"wrote {topic} hash={payload.get('content_hash')} rows={payload.get('row_count')}",
                    flush=True,
                )
            except Exception as exc:
                print(f"fail {topic}: {exc}", flush=True)

    if args.once:
        tick()
        return 0
    while True:
        tick()
        time.sleep(max(0.5, float(args.interval)))


if __name__ == "__main__":
    raise SystemExit(main())
