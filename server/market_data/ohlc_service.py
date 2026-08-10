"""Underlier OHLC for Options Lab Volume Profile (Massive aggs).

All timeframes request **at least 3 calendar years** of history (down to 10m).
Pagination is handled in MassiveClient.fetch_aggs.
"""

from __future__ import annotations

import threading
import time
from datetime import datetime, timedelta, timezone
from typing import Any

from market_data.massive_client import MassiveClient, MassiveClientError

# Product requirement: ≥3 years of bars at every TF including the smallest (10m).
OHLC_LOOKBACK_YEARS = 3
OHLC_LOOKBACK_DAYS = OHLC_LOOKBACK_YEARS * 365 + 1  # 1096 calendar days

# tf_id → (multiplier, timespan) — lookback is always OHLC_LOOKBACK_DAYS
_TF_SPEC: dict[str, tuple[int, str]] = {
    "1d": (1, "day"),
    "4h": (4, "hour"),
    "1h": (1, "hour"),
    "30m": (30, "minute"),
    "10m": (10, "minute"),
}

_ALLOWED = frozenset(_TF_SPEC.keys())

_lock = threading.Lock()
_cache: dict[str, tuple[float, dict[str, Any]]] = {}
_CACHE_TTL = 120.0  # larger payloads; 2 min cache


def normalize_ohlc_tf(tf: str) -> str:
    t = (tf or "1d").strip().lower()
    if t not in _ALLOWED:
        raise ValueError(
            f"tf must be one of {sorted(_ALLOWED)}, got {tf!r}"
        )
    return t


def _cache_get(key: str) -> dict[str, Any] | None:
    with _lock:
        hit = _cache.get(key)
        if not hit:
            return None
        ts, doc = hit
        if time.monotonic() - ts > _CACHE_TTL:
            del _cache[key]
            return None
        return dict(doc)


def _cache_put(key: str, doc: dict[str, Any]) -> None:
    with _lock:
        _cache[key] = (time.monotonic(), dict(doc))
        if len(_cache) > 64:
            ordered = sorted(_cache.items(), key=lambda kv: kv[1][0])
            for k, _ in ordered[:32]:
                _cache.pop(k, None)


def _candidates(
    product: str, feed: str | None, proxy: str | None
) -> list[tuple[str, str | None, str]]:
    """(ticker, proxy_label, source) preference order."""
    out: list[tuple[str, str | None, str]] = []
    seen: set[str] = set()

    def add(sym: str, label: str | None, source: str) -> None:
        s = (sym or "").strip()
        if not s:
            return
        key = s.upper() if not s.upper().startswith("I:") else s
        if key in seen:
            return
        seen.add(key)
        out.append((s if s.upper().startswith("I:") else s.upper(), label, source))

    if feed:
        add(feed, None, "massive_v1")
    add(product, None, "massive_v1")
    if proxy and proxy.upper() != product.upper():
        add(proxy, f"{proxy} proxy for {product}", "massive_proxy_v1")
    return out


def fetch_product_ohlc(
    *,
    product: str,
    feed_symbol: str | None,
    proxy_symbol: str | None,
    tf: str,
    client: MassiveClient | None = None,
) -> dict[str, Any]:
    """Return ≥3y bars for product when the provider has them; fail loud if none."""
    product = (product or "").strip().upper()
    if not product:
        raise ValueError("product required")
    tf_n = normalize_ohlc_tf(tf)
    mult, timespan = _TF_SPEC[tf_n]

    end = datetime.now(timezone.utc)
    start = end - timedelta(days=OHLC_LOOKBACK_DAYS)
    cache_key = (
        f"{product}|{feed_symbol}|{proxy_symbol}|{tf_n}|"
        f"{start.date()}|{end.date()}|y{OHLC_LOOKBACK_YEARS}"
    )
    cached = _cache_get(cache_key)
    if cached is not None:
        cached["cache_hit"] = True
        return cached

    md = client or MassiveClient()
    last_err: str | None = None
    for ticker, proxy_label, source in _candidates(
        product, feed_symbol, proxy_symbol
    ):
        try:
            bars = md.fetch_aggs(
                ticker,
                multiplier=mult,
                timespan=timespan,
                start=start,
                end=end,
                limit=50000,
            )
        except MassiveClientError as exc:
            last_err = str(exc)
            continue
        if len(bars) < 2:
            last_err = f"insufficient bars for {ticker}"
            continue

        # Span of returned history (provider may have less than 3y entitlement)
        first_t = bars[0].get("t")
        last_t = bars[-1].get("t")
        span_days = None
        if isinstance(first_t, (int, float)) and isinstance(last_t, (int, float)):
            span_days = max(0.0, (float(last_t) - float(first_t)) / 86400000.0)

        payload = {
            "ok": True,
            "product": product,
            "series_ticker": ticker,
            "proxy_label": proxy_label,
            "source": source,
            "tf": tf_n,
            "multiplier": mult,
            "timespan": timespan,
            "lookback_years_requested": OHLC_LOOKBACK_YEARS,
            "lookback_days_requested": OHLC_LOOKBACK_DAYS,
            "history_span_days": span_days,
            "from": start.isoformat().replace("+00:00", "Z"),
            "to": end.isoformat().replace("+00:00", "Z"),
            "bar_count": len(bars),
            "bars": bars,
            "cache_hit": False,
        }
        _cache_put(cache_key, payload)
        return payload

    raise RuntimeError(
        last_err or f"No OHLC bars for {product} tf={tf_n}"
    )
