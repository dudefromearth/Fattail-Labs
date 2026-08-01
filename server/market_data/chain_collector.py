#!/usr/bin/env python3
"""Collect Massive option chain snapshots to the local ChainStore.

Historical tests read this archive. The past cannot be reconstructed cheaply
at ~5s cadence — collect forward and keep data local.

Usage (from server/ with env loaded):

  set -a && source ../.env && set +a
  export MASSIVE_API_KEY=...
  # optional:
  # export LABS_CHAIN_STORE_ROOT=/path/to/chains
  # export MASSIVE_CHAIN_UNDERLIER=I:SPX   # or SPX
  .venv/bin/python -m market_data.chain_collector --interval 5

  # one shot:
  .venv/bin/python -m market_data.chain_collector --once

Env (fail loud when collector runs):
  MASSIVE_API_KEY          required
  MASSIVE_API_BASE         optional (default https://api.massive.com)
  MASSIVE_CHAIN_UNDERLIER  optional (default I:SPX)
  LABS_CHAIN_STORE_ROOT    optional (default <repo>/data/market/chains)
  CHAIN_EXPIRY_DAYS        optional — only expirations within N days (default 14)
"""

from __future__ import annotations

import argparse
import os
import signal
import sys
import time
from datetime import date, datetime, timedelta, timezone
from typing import Any

from market_data.chain_store import ChainStore, default_store_root
from market_data.massive_client import MassiveClient, MassiveClientError

_stop = False


def _handle_stop(signum: int, frame: Any) -> None:
    global _stop
    _stop = True
    print(f"\n[chain_collector] signal {signum} — stopping after this snap", flush=True)


def _underlier() -> str:
    return (os.environ.get("MASSIVE_CHAIN_UNDERLIER") or "I:SPX").strip()


def _expiry_window_days() -> int:
    raw = (os.environ.get("CHAIN_EXPIRY_DAYS") or "14").strip()
    try:
        n = int(raw)
    except ValueError as exc:
        raise SystemExit(f"CHAIN_EXPIRY_DAYS must be int, got {raw!r}") from exc
    if n < 1:
        raise SystemExit("CHAIN_EXPIRY_DAYS must be >= 1")
    return n


def collect_once(
    client: MassiveClient,
    store: ChainStore,
    *,
    underlier: str,
    expiry_days: int,
) -> dict[str, Any]:
    today = date.today()
    gte = today.isoformat()
    lte = (today + timedelta(days=expiry_days)).isoformat()
    t0 = time.perf_counter()
    contracts = client.fetch_option_chain(
        underlier,
        expiration_date_gte=gte,
        expiration_date_lte=lte,
    )
    elapsed = time.perf_counter() - t0
    meta = store.write_snapshot(
        underlier=underlier,
        contracts=contracts,
        extra={
            "fetch_seconds": round(elapsed, 3),
            "expiration_date.gte": gte,
            "expiration_date.lte": lte,
        },
    )
    return {
        "as_of": meta.as_of,
        "path": str(meta.path),
        "contract_count": meta.contract_count,
        "fetch_seconds": round(elapsed, 3),
        "underlier": underlier,
    }


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Massive → local option chain collector")
    p.add_argument(
        "--interval",
        type=float,
        default=5.0,
        help="Seconds between snaps in loop mode (default 5)",
    )
    p.add_argument(
        "--once",
        action="store_true",
        help="Single snapshot then exit",
    )
    p.add_argument(
        "--underlier",
        default=None,
        help="Override MASSIVE_CHAIN_UNDERLIER (default I:SPX)",
    )
    p.add_argument(
        "--store-root",
        default=None,
        help="Override LABS_CHAIN_STORE_ROOT",
    )
    args = p.parse_args(argv)

    underlier = (args.underlier or _underlier()).strip()
    if not underlier:
        print("underlier required", file=sys.stderr)
        return 2

    try:
        client = MassiveClient()
        expiry_days = _expiry_window_days()
    except (MassiveClientError, SystemExit) as exc:
        print(str(exc), file=sys.stderr)
        return 2

    root = (
        __import__("pathlib").Path(args.store_root).expanduser().resolve()
        if args.store_root
        else default_store_root()
    )
    store = ChainStore(root)
    print(
        f"[chain_collector] underlier={underlier!r} store={store.root} "
        f"expiry_days={expiry_days} interval={args.interval}",
        flush=True,
    )

    signal.signal(signal.SIGINT, _handle_stop)
    signal.signal(signal.SIGTERM, _handle_stop)

    if args.once:
        try:
            info = collect_once(
                client, store, underlier=underlier, expiry_days=expiry_days
            )
        except MassiveClientError as exc:
            print(f"[chain_collector] FAIL: {exc}", file=sys.stderr)
            return 1
        print(
            f"[chain_collector] wrote {info['contract_count']} contracts "
            f"in {info['fetch_seconds']}s → {info['path']}",
            flush=True,
        )
        return 0

    if args.interval < 1.0:
        print("--interval must be >= 1", file=sys.stderr)
        return 2

    n_ok = 0
    n_fail = 0
    while not _stop:
        loop_start = time.perf_counter()
        try:
            info = collect_once(
                client, store, underlier=underlier, expiry_days=expiry_days
            )
            n_ok += 1
            print(
                f"[chain_collector] #{n_ok} {info['as_of']} "
                f"n={info['contract_count']} {info['fetch_seconds']}s",
                flush=True,
            )
        except MassiveClientError as exc:
            n_fail += 1
            print(f"[chain_collector] FAIL #{n_fail}: {exc}", file=sys.stderr)
            # Back off a bit on failure so we don't hammer a bad key/plan
            time.sleep(min(30.0, args.interval))
            continue

        elapsed = time.perf_counter() - loop_start
        sleep_for = args.interval - elapsed
        if sleep_for > 0 and not _stop:
            # Interruptible sleep
            end = time.time() + sleep_for
            while not _stop and time.time() < end:
                time.sleep(min(0.25, end - time.time()))

    print(
        f"[chain_collector] stopped ok={n_ok} fail={n_fail} store={store.root}",
        flush=True,
    )
    return 0 if n_fail == 0 or n_ok > 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
