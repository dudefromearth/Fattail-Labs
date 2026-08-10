"""Trade chart assembly — Massive bars + short-TTL cache (Phase 2 charts).

Config: MASSIVE_API_KEY (or POLYGON_API_KEY). Missing key → fail loud.
Cache key: (series_ticker, tf, from_ymd, to_ymd). Default TTL 120s.
"""

from __future__ import annotations

import os
import threading
import time
from datetime import datetime, timezone
from typing import Any

from market_data.massive_client import MassiveClient, MassiveClientError
from market_data import live_marks as lm
from trade_log_domain.trade_chart import (
    bars_look_complete,
    build_markers,
    chart_window,
    normalize_tf,
    product_underlier,
    resolve_series_candidates,
    structure_strike_band,
    tf_agg_params,
)

_lock = threading.Lock()
_cache: dict[str, tuple[float, list[dict[str, Any]]]] = {}


def cache_ttl_s() -> int:
    raw = (os.environ.get("LABS_TRADE_CHART_CACHE_TTL_S") or "120").strip()
    try:
        n = int(raw)
    except ValueError as exc:
        raise ValueError(
            f"LABS_TRADE_CHART_CACHE_TTL_S must be int, got {raw!r}"
        ) from exc
    if n < 5 or n > 3600:
        raise ValueError("LABS_TRADE_CHART_CACHE_TTL_S must be 5..3600")
    return n


def _cache_get(key: str) -> list[dict[str, Any]] | None:
    ttl = cache_ttl_s()
    with _lock:
        hit = _cache.get(key)
        if not hit:
            return None
        ts, bars = hit
        if time.monotonic() - ts > ttl:
            del _cache[key]
            return None
        return list(bars)


def _cache_put(key: str, bars: list[dict[str, Any]]) -> None:
    with _lock:
        _cache[key] = (time.monotonic(), list(bars))
        # Bound memory: drop oldest half if oversized
        if len(_cache) > 256:
            ordered = sorted(_cache.items(), key=lambda kv: kv[1][0])
            for k, _ in ordered[:128]:
                _cache.pop(k, None)


def clear_chart_cache() -> None:
    """Test helper."""
    with _lock:
        _cache.clear()


def _universe_rows(cur) -> list[dict[str, Any]]:
    return lm.list_universe(cur, enabled_only=False)


def find_pair_for_trade(
    trade: dict[str, Any],
    book: list[dict[str, Any]],
) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    """Return (paired_open, paired_close) for this trade id from match_open_close."""
    from trade_log_domain.matching import match_open_close

    tid = trade.get("id")
    for m in match_open_close(book):
        o, c = m.get("open"), m.get("close")
        if o and o.get("id") == tid:
            return o, c
        if c and c.get("id") == tid:
            return o, c
    return None, None


def build_trade_chart(
    cur,
    trade: dict[str, Any],
    *,
    book: list[dict[str, Any]] | None = None,
    tf: str = "15m",
    client: MassiveClient | None = None,
) -> dict[str, Any]:
    """Assemble chart payload for one trade. Never invents bars.

    Status:
      ok — complete bars
      error — missing underlier / window / bars / config (message in error)
    """
    try:
        tf_n = normalize_tf(tf)
    except ValueError as exc:
        return {
            "ok": False,
            "status": "error",
            "error": "invalid_tf",
            "message": str(exc),
            "trade_id": trade.get("id"),
            "tf": tf,
            "bars": [],
            "markers": [],
        }

    product = product_underlier(trade)
    if not product:
        return {
            "ok": False,
            "status": "error",
            "error": "no_underlier",
            "message": "No underlier on trade legs — cannot chart structure.",
            "trade_id": trade.get("id"),
            "tf": tf_n,
            "bars": [],
            "markers": [],
        }

    paired_open = paired_close = None
    if book is not None:
        paired_open, paired_close = find_pair_for_trade(trade, book)

    window = chart_window(
        trade,
        tf_n,
        paired_open=paired_open,
        paired_close=paired_close,
    )
    if window is None:
        return {
            "ok": False,
            "status": "error",
            "error": "no_window",
            "message": "Trade has no usable exec_at for chart window.",
            "trade_id": trade.get("id"),
            "tf": tf_n,
            "product_symbol": product,
            "bars": [],
            "markers": [],
        }
    w_start, w_end = window

    universe = _universe_rows(cur) if cur is not None else []
    # Native index feed first (I:SPX); labeled SPY/VIXY proxy only if feed fails.
    candidates = resolve_series_candidates(product, universe=universe)
    mult, timespan = tf_agg_params(tf_n)
    markers = build_markers(
        trade, paired_open=paired_open, paired_close=paired_close
    )
    structure_band_raw = structure_strike_band(trade)

    t0 = int(w_start.timestamp() * 1000)
    t1 = int(w_end.timestamp() * 1000)
    window_meta = {
        "from": w_start.isoformat().replace("+00:00", "Z"),
        "to": w_end.isoformat().replace("+00:00", "Z"),
    }

    cache_hit = False
    last_err: Exception | None = None
    last_incomplete: tuple[str, str | None, str, str | None] | None = None
    # (series, proxy_label, source, reason)
    series = candidates[0][0]
    proxy_label: str | None = candidates[0][1]
    source = candidates[0][2]
    bars: list[dict[str, Any]] = []
    md: MassiveClient | None = None

    for idx, (cand_series, cand_proxy_label, cand_source) in enumerate(candidates):
        series, proxy_label, source = cand_series, cand_proxy_label, cand_source
        cache_key = (
            f"{series}|{tf_n}|{w_start.date().isoformat()}|{w_end.date().isoformat()}"
        )
        cached = _cache_get(cache_key)
        if cached is not None:
            bars = cached
            cache_hit = True
        else:
            if md is None:
                try:
                    md = client or MassiveClient()
                except MassiveClientError as exc:
                    return {
                        "ok": False,
                        "status": "error",
                        "error": "market_data_unavailable",
                        "message": str(exc),
                        "trade_id": trade.get("id"),
                        "tf": tf_n,
                        "product_symbol": product,
                        "series_ticker": series,
                        "proxy_label": proxy_label,
                        "source": source,
                        "bars": [],
                        "markers": markers,
                        "structure_band": None,
                    }
            try:
                bars = md.fetch_aggs(
                    series,
                    multiplier=mult,
                    timespan=timespan,
                    start=w_start,
                    end=w_end,
                )
            except MassiveClientError as exc:
                last_err = exc
                # Try next candidate (proxy) when native feed not entitled / errors.
                if idx + 1 < len(candidates):
                    continue
                return {
                    "ok": False,
                    "status": "error",
                    "error": "market_data_error",
                    "message": str(exc),
                    "trade_id": trade.get("id"),
                    "tf": tf_n,
                    "product_symbol": product,
                    "series_ticker": series,
                    "proxy_label": proxy_label,
                    "source": source,
                    "window": window_meta,
                    "bars": [],
                    "markers": markers,
                    "structure_band": None,
                }
            _cache_put(cache_key, bars)

        # Clip to window (aggs API is day-granular on from/to)
        clipped = [
            b for b in bars if b.get("t") is not None and t0 <= int(b["t"]) <= t1
        ]
        complete, reason = bars_look_complete(
            clipped, window_start=w_start, window_end=w_end, tf=tf_n
        )
        if complete:
            bars = clipped
            break
        last_incomplete = (series, proxy_label, source, reason)
        # Empty/incomplete native series → fall through to proxy when available.
        if idx + 1 < len(candidates):
            continue
        return {
            "ok": False,
            "status": "error",
            "error": reason or "missing_bars",
            "message": (
                "No complete bars for this window — chart will not invent a path."
                if reason == "missing_bars"
                else f"Bars incomplete ({reason})."
            ),
            "trade_id": trade.get("id"),
            "tf": tf_n,
            "product_symbol": product,
            "series_ticker": series,
            "proxy_label": proxy_label,
            "source": source,
            "window": window_meta,
            "bars": [],  # never partial path as complete
            "markers": markers,
            "structure_band": None,
            "cache": {"hit": cache_hit, "ttl_s": cache_ttl_s()},
        }
    else:
        # Exhausted candidates without complete bars (should have returned above).
        series, proxy_label, source, reason = last_incomplete or (
            series,
            proxy_label,
            source,
            "missing_bars",
        )
        msg_extra = f" ({last_err})" if last_err else ""
        return {
            "ok": False,
            "status": "error",
            "error": reason or "missing_bars",
            "message": (
                "No complete bars for this window — chart will not invent a path."
                + msg_extra
            ),
            "trade_id": trade.get("id"),
            "tf": tf_n,
            "product_symbol": product,
            "series_ticker": series,
            "proxy_label": proxy_label,
            "source": source,
            "window": window_meta,
            "bars": [],
            "markers": markers,
            "structure_band": None,
            "cache": {"hit": cache_hit, "ttl_s": cache_ttl_s()},
        }

    # Structure band uses option strikes; only meaningful when the price axis
    # matches the book (native SPX). Hide when a proxy series is active
    # (SPY vs SPX strikes are different scale).
    band = structure_band_raw
    if proxy_label and product in ("SPX", "XSP", "VIX", "VIX1D"):
        band = None

    return {
        "ok": True,
        "status": "ok",
        "error": None,
        "message": None,
        "trade_id": trade.get("id"),
        "tf": tf_n,
        "product_symbol": product,
        "series_ticker": series,
        "proxy_label": proxy_label,
        "source": source,
        "window": window_meta,
        "bars": bars,
        "markers": markers,
        "structure_band": band,
        "cache": {"hit": cache_hit, "ttl_s": cache_ttl_s()},
    }
