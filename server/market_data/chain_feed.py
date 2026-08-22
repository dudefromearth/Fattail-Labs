#!/usr/bin/env python3
"""labs-chain-feed — sole Massive writer for chain generations (MB-P2 · OPF L0).

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
    from opf.keys import parse_ladder_topic
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
            print("no interest keys; idle", flush=True)
            return
        for topic in topics:
            # OPF4: dual keys end with :w{N}:dual; underlier may contain ':' (I:SPX)
            parsed = parse_ladder_topic(topic)
            if parsed is None:
                print(f"skip unparseable topic {topic}", flush=True)
                continue
            wings = parsed.wings
            product = parsed.product_hint
            exp = parsed.expiration
            side = parsed.side or "call"
            write_key = (
                f"mb:ladder:{parsed.chain_underlier}:{exp}:w{wings}:dual"
                if parsed.dual
                else topic
            )
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
                from market_data.chain_provenance import apply_chain_provenance

                payload = apply_chain_provenance(payload)
                # Always write dual canonical key when dual interest
                store.set_json(write_key, payload)
                if write_key != topic and parsed.dual:
                    # interest may have been dual already under write_key
                    pass
                print(
                    f"wrote {write_key} hash={payload.get('content_hash')} "
                    f"rows={payload.get('row_count')} dual={parsed.dual}",
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
