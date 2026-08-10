"""Trade chart assembly — Massive bars + short-TTL cache (Phase 2 charts).

Config: MASSIVE_API_KEY (or POLYGON_API_KEY). Missing key → fail loud.
Cache key: (series_ticker, tf, from_ymd, to_ymd). Default TTL 120s.

Series order for index books (SPX/VIX):
  1. Massive native feed (I:SPX)
  2. Yahoo true index (^GSPC) when Massive has no bars for the window
  3. Labeled ETF proxy (SPY) last
"""

from __future__ import annotations

import os
import threading
import time
from datetime import datetime, timedelta, timezone
from typing import Any

from market_data.massive_client import MassiveClient, MassiveClientError
from market_data import live_marks as lm
from market_data.yahoo_index import (
    YahooIndexError,
    fetch_yahoo_index_aggs,
    yahoo_ticker_for_product,
)
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
    # Native Massive first; Yahoo true index next; labeled ETF proxy last.
    candidates = resolve_series_candidates(product, universe=universe)
    natives = [c for c in candidates if c[2] != "massive_proxy_v1"]
    proxies = [c for c in candidates if c[2] == "massive_proxy_v1"]
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
    series = (natives or candidates)[0][0]
    proxy_label: str | None = (natives or candidates)[0][1]
    source = (natives or candidates)[0][2]
    bars: list[dict[str, Any]] = []
    md: MassiveClient | None = None
    tf_effective = tf_n
    fallback_note: str | None = None

    def _try_clip_complete(
        raw_bars: list[dict[str, Any]],
        *,
        check_tf: str,
        win_start: datetime,
        win_end: datetime,
    ) -> tuple[list[dict[str, Any]], bool, str | None]:
        lo = int(win_start.timestamp() * 1000)
        hi = int(win_end.timestamp() * 1000)
        clipped = [
            b for b in raw_bars if b.get("t") is not None and lo <= int(b["t"]) <= hi
        ]
        ok, reason = bars_look_complete(
            clipped, window_start=win_start, window_end=win_end, tf=check_tf  # type: ignore[arg-type]
        )
        return clipped, ok, reason

    def _ensure_massive() -> MassiveClient | dict[str, Any]:
        nonlocal md
        if md is not None:
            return md
        try:
            md = client or MassiveClient()
            return md
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

    # --- Phase 1: Massive native feeds (I:SPX, product symbol) ---
    for cand_series, cand_proxy_label, cand_source in natives:
        series, proxy_label, source = cand_series, cand_proxy_label, cand_source
        cache_key = (
            f"{series}|{tf_n}|{w_start.date().isoformat()}|{w_end.date().isoformat()}"
        )
        cached = _cache_get(cache_key)
        if cached is not None:
            bars = cached
            cache_hit = True
        else:
            ensured = _ensure_massive()
            if isinstance(ensured, dict):
                # No Massive key — still try Yahoo / proxy below.
                last_err = MassiveClientError(ensured.get("message") or "no massive")
                break
            try:
                bars = ensured.fetch_aggs(
                    series,
                    multiplier=mult,
                    timespan=timespan,
                    start=w_start,
                    end=w_end,
                )
            except MassiveClientError as exc:
                last_err = exc
                continue
            _cache_put(cache_key, bars)

        clipped, complete, reason = _try_clip_complete(
            bars, check_tf=tf_n, win_start=w_start, win_end=w_end
        )
        if complete:
            bars = clipped
            break
        last_incomplete = (series, proxy_label, source, reason)
    else:
        # Native Massive did not yield complete bars — try Yahoo true index.
        bars = []
        if yahoo_ticker_for_product(product):
            y_cache = (
                f"yahoo:{product}|{tf_n}|"
                f"{w_start.date().isoformat()}|{w_end.date().isoformat()}"
            )
            cached = _cache_get(y_cache)
            if cached is not None:
                bars = cached
                cache_hit = True
                series = product
                proxy_label = None
                source = "yahoo_index_v1"
                clipped, complete, reason = _try_clip_complete(
                    bars, check_tf=tf_n, win_start=w_start, win_end=w_end
                )
                # Daily cache may need 1d completeness if we stored degraded bars
                if not complete:
                    clipped, complete, reason = _try_clip_complete(
                        bars, check_tf="1d", win_start=w_start, win_end=w_end
                    )
                    if complete:
                        tf_effective = "1d"
                        fallback_note = (
                            f"Daily {product} (minute index history unavailable "
                            f"for this window)"
                        )
                if complete:
                    bars = clipped
                else:
                    bars = []
            if not bars:
                try:
                    y_bars, y_sym, tf_used = fetch_yahoo_index_aggs(
                        product, tf=tf_n, start=w_start, end=w_end
                    )
                    _cache_put(y_cache, y_bars)
                    series = product  # show SPX not ^GSPC
                    proxy_label = None
                    source = "yahoo_index_v1"
                    check_tf = tf_used
                    # Daily bars for a same-day 0DTE window: expand clip so
                    # neighboring sessions remain (need ≥2 points + context).
                    if tf_used == "1d":
                        clip_start = w_start - timedelta(days=7)
                        clip_end = w_end + timedelta(days=3)
                    else:
                        clip_start, clip_end = w_start, w_end
                    clipped, complete, reason = _try_clip_complete(
                        y_bars,
                        check_tf=check_tf,
                        win_start=clip_start,
                        win_end=clip_end,
                    )
                    if complete:
                        bars = clipped
                        tf_effective = tf_used
                        if tf_used != tf_n:
                            fallback_note = (
                                f"Daily {product} via Yahoo ({y_sym}) — "
                                f"minute index history unavailable for this window"
                            )
                        else:
                            fallback_note = f"{product} via Yahoo ({y_sym})"
                    else:
                        last_incomplete = (
                            product,
                            None,
                            "yahoo_index_v1",
                            reason,
                        )
                        last_err = YahooIndexError(
                            reason or "incomplete yahoo bars"
                        )
                except YahooIndexError as exc:
                    last_err = exc

        # --- Phase 3: Massive ETF proxy (SPY/VIXY) — last resort ---
        if not bars:
            for cand_series, cand_proxy_label, cand_source in proxies:
                series, proxy_label, source = (
                    cand_series,
                    cand_proxy_label,
                    cand_source,
                )
                # Clarify why proxy was used when native+Yahoo failed.
                if product in ("SPX", "XSP", "VIX", "VIX1D"):
                    proxy_label = (
                        f"{series} proxy for {product} "
                        f"(no index bars for this window)"
                    )
                cache_key = (
                    f"{series}|{tf_n}|"
                    f"{w_start.date().isoformat()}|{w_end.date().isoformat()}"
                )
                cached = _cache_get(cache_key)
                if cached is not None:
                    bars = cached
                    cache_hit = True
                else:
                    ensured = _ensure_massive()
                    if isinstance(ensured, dict):
                        return ensured
                    try:
                        bars = ensured.fetch_aggs(
                            series,
                            multiplier=mult,
                            timespan=timespan,
                            start=w_start,
                            end=w_end,
                        )
                    except MassiveClientError as exc:
                        last_err = exc
                        continue
                    _cache_put(cache_key, bars)

                clipped, complete, reason = _try_clip_complete(
                    bars, check_tf=tf_n, win_start=w_start, win_end=w_end
                )
                if complete:
                    bars = clipped
                    break
                last_incomplete = (series, proxy_label, source, reason)
            else:
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
    # matches the book (native SPX). Hide when an ETF proxy series is active.
    band = structure_band_raw
    if source == "massive_proxy_v1" and product in ("SPX", "XSP", "VIX", "VIX1D"):
        band = None

    return {
        "ok": True,
        "status": "ok",
        "error": None,
        "message": fallback_note,
        "trade_id": trade.get("id"),
        "tf": tf_n,
        "tf_effective": tf_effective,
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
