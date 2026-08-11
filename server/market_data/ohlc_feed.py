#!/usr/bin/env python3
"""OHLC durable store feed — bootstrap + morning append.

Usage (from server/ with env):

  set -a && source ../.env && set +a
  .venv/bin/python -m market_data.ohlc_feed --once          # append all
  .venv/bin/python -m market_data.ohlc_feed --bootstrap     # force full where incomplete
  .venv/bin/python -m market_data.ohlc_feed --symbol SPX --tf 1d

launchd (MiniTwo): run --once after RTH open (e.g. 09:45 ET) and optionally
after close. Sole Massive writer for historical bars (with ohlc_service miss path).
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timedelta, timezone
from typing import Any

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import db  # noqa: E402
from market_data import ohlc_service as ohlc_svc  # noqa: E402
from market_data import ohlc_store as store  # noqa: E402
from market_data import universe_admin as ua  # noqa: E402
from market_data.massive_client import MassiveClient, MassiveClientError  # noqa: E402
from market_data.symbol_profile import resolve_symbol_profile  # noqa: E402
from routes.chain_ladder import _resolve_universe_symbol  # noqa: E402

_DEFAULT_TFS = ("1d", "1h", "5m")


def _fetch_aggs_range(
    *,
    product: str,
    feed: str | None,
    proxy: str | None,
    tf: str,
    start: datetime,
    end: datetime,
    client: MassiveClient,
) -> tuple[list[dict[str, Any]], str, str | None, str]:
    """Return (bars, series_ticker, proxy_label, source)."""
    mult, timespan = ohlc_svc._TF_SPEC[ohlc_svc.normalize_ohlc_tf(tf)]
    last_err: Exception | None = None
    for ticker, proxy_label, source in ohlc_svc._candidates(product, feed, proxy):
        try:
            bars = client.fetch_aggs(
                ticker,
                multiplier=mult,
                timespan=timespan,
                start=start,
                end=end,
                limit=50000,
            )
        except MassiveClientError as exc:
            last_err = exc
            continue
        if len(bars) < 1:
            last_err = MassiveClientError(f"no bars for {ticker}")
            continue
        # Normalize keys
        out = []
        for b in bars:
            if not isinstance(b, dict) or b.get("t") is None or b.get("c") is None:
                continue
            out.append(
                {
                    "t": int(b["t"]),
                    "o": b.get("o"),
                    "h": b.get("h"),
                    "l": b.get("l"),
                    "c": b.get("c"),
                    "v": b.get("v"),
                }
            )
        if out:
            return out, ticker, proxy_label, source
    raise MassiveClientError(str(last_err or f"no OHLC for {product}"))


def sync_symbol_tf(
    cur,
    *,
    product: str,
    tf: str,
    force_bootstrap: bool = False,
    client: MassiveClient | None = None,
) -> dict[str, Any]:
    product = product.strip().upper()
    tf = ohlc_svc.normalize_ohlc_tf(tf)
    resolved = _resolve_universe_symbol(product)
    feed = resolved.get("chain_underlier")
    # Prefer native product for stocks; feed for indexes is I:SPX
    feed_sym = None
    proxy = resolved.get("proxy_symbol")
    if str(resolved.get("kind")) == "index":
        feed_sym = resolved.get("chain_underlier")
    md = client or MassiveClient()
    meta = store.get_series_meta(cur, product, tf)
    end = datetime.now(timezone.utc)

    if force_bootstrap or not meta or not meta.get("bootstrap_complete"):
        start = end - timedelta(days=ohlc_svc.OHLC_LOOKBACK_DAYS)
        print(f"[ohlc_feed] BOOTSTRAP {product} {tf} from {start.date()}", flush=True)
        bars, ticker, plab, source = _fetch_aggs_range(
            product=product,
            feed=feed_sym or feed,
            proxy=proxy,
            tf=tf,
            start=start,
            end=end,
            client=md,
        )
        meta = store.upsert_bars(
            cur,
            product,
            tf,
            bars,
            series_ticker=ticker,
            proxy_label=plab,
            source=source,
            bootstrap_complete=True,
        )
        print(
            f"[ohlc_feed]   wrote {len(bars)} bars last_t={meta.get('last_t')}",
            flush=True,
        )
        return {"action": "bootstrap", "meta": meta, "bars": len(bars)}

    if not store.needs_append(meta, tf) and not force_bootstrap:
        print(f"[ohlc_feed] SKIP {product} {tf} (tip fresh)", flush=True)
        return {"action": "skip", "meta": meta, "bars": 0}

    start = store.bars_from_t(meta.get("last_t"), tf=tf)
    print(
        f"[ohlc_feed] APPEND {product} {tf} from {start.isoformat()} last={meta.get('last_t')}",
        flush=True,
    )
    bars, ticker, plab, source = _fetch_aggs_range(
        product=product,
        feed=feed_sym or feed,
        proxy=proxy,
        tf=tf,
        start=start,
        end=end,
        client=md,
    )
    meta = store.upsert_bars(
        cur,
        product,
        tf,
        bars,
        series_ticker=ticker,
        proxy_label=plab,
        source=source,
        bootstrap_complete=True,
    )
    print(f"[ohlc_feed]   appended {len(bars)} bars n={meta.get('bar_count')}", flush=True)
    return {"action": "append", "meta": meta, "bars": len(bars)}


def run(
    *,
    symbols: list[str] | None,
    tfs: list[str],
    force_bootstrap: bool,
) -> int:
    md = MassiveClient()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            if symbols:
                rows = []
                for s in symbols:
                    r = ua.get_one(cur, s)
                    if r and r.get("enabled", True):
                        rows.append(r)
            else:
                rows = ua.list_all(cur, enabled_only=True)

    errors = 0
    for row in rows:
        prof = resolve_symbol_profile(row, symbol=row["symbol"])
        if not prof.get("supports_options") and row.get("role") == "reference":
            # Still bootstrap 1d for reference underliers (VIX)
            pass
        for tf in tfs:
            try:
                with db.transaction() as conn:
                    with conn.cursor() as cur:
                        sync_symbol_tf(
                            cur,
                            product=row["symbol"],
                            tf=tf,
                            force_bootstrap=force_bootstrap,
                            client=md,
                        )
            except Exception as exc:
                errors += 1
                print(f"[ohlc_feed] FAIL {row['symbol']} {tf}: {exc}", flush=True)
    return 1 if errors else 0


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="OHLC store bootstrap / morning append")
    p.add_argument("--once", action="store_true", help="Append (or bootstrap if empty) all")
    p.add_argument(
        "--bootstrap",
        action="store_true",
        help="Force full lookback rewrite for selected series",
    )
    p.add_argument("--symbol", action="append", dest="symbols", help="Limit to symbol(s)")
    p.add_argument(
        "--tf",
        action="append",
        dest="tfs",
        help="Timeframes (default: 1d,1h,5m)",
    )
    args = p.parse_args(argv)
    tfs = args.tfs or list(_DEFAULT_TFS)
    if not args.once and not args.bootstrap and not args.symbols:
        p.print_help()
        return 2
    return run(
        symbols=args.symbols,
        tfs=tfs,
        force_bootstrap=bool(args.bootstrap),
    )


if __name__ == "__main__":
    raise SystemExit(main())
