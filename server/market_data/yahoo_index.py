"""Yahoo Finance index OHLC fallback for trade charts.

Massive index aggs (I:SPX) only cover a limited history (roughly 2024+ for
daily, recent sessions for minute). Cash indexes are calculated series —
Yahoo (^GSPC, ^VIX) carries deep daily history and limited intraday.

Used only after Massive native feed fails; never silent — source is
``yahoo_index_v1``. Prefer true index levels over ETF proxies (SPY/VIXY).
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Literal

Timeframe = Literal["5m", "15m", "1d"]

# Book product → Yahoo ticker (true index, not ETF).
_YAHOO_INDEX: dict[str, str] = {
    "SPX": "^GSPC",
    "VIX": "^VIX",
    # VIX1D has no stable long Yahoo series; skip (Massive/proxy only).
}

# Yahoo intraday lookback limits (documented yfinance/Yahoo constraints).
_INTRADAY_MAX_LOOKBACK: dict[str, timedelta] = {
    "5m": timedelta(days=55),
    "15m": timedelta(days=55),
}


class YahooIndexError(RuntimeError):
    """Yahoo index fetch failed or returned no usable bars."""


def yahoo_ticker_for_product(product: str) -> str | None:
    p = (product or "").strip().upper()
    return _YAHOO_INDEX.get(p)


def _interval(tf: Timeframe) -> str:
    if tf == "5m":
        return "5m"
    if tf == "15m":
        return "15m"
    return "1d"


def fetch_yahoo_index_aggs(
    product: str,
    *,
    tf: Timeframe,
    start: datetime,
    end: datetime,
) -> tuple[list[dict[str, Any]], str, Timeframe]:
    """Fetch OHLC bars for an index product from Yahoo.

    Returns ``(bars, yahoo_ticker, tf_used)``.
    For old windows where intraday is unavailable, falls back to daily
    automatically (``tf_used`` may be ``1d`` while request was 15m/5m).

    Raises YahooIndexError when no series can be produced.
    """
    product = (product or "").strip().upper()
    ysym = yahoo_ticker_for_product(product)
    if not ysym:
        raise YahooIndexError(f"no Yahoo index map for {product!r}")

    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)
    if end < start:
        start, end = end, start

    # Try requested TF first; degrade to daily for deep history.
    attempts: list[Timeframe] = [tf]
    if tf in ("5m", "15m"):
        attempts.append("1d")

    last_err: Exception | None = None
    for try_tf in attempts:
        fetch_start, fetch_end = start, end
        if try_tf in ("5m", "15m"):
            max_lb = _INTRADAY_MAX_LOOKBACK[try_tf]
            # Yahoo rejects intraday outside lookback — skip without calling.
            age = datetime.now(timezone.utc) - start
            if age > max_lb:
                last_err = YahooIndexError(
                    f"{ysym} {try_tf} outside Yahoo lookback ({max_lb.days}d)"
                )
                continue
        else:
            # Daily: widen so same-day trade windows still get ≥2 sessions
            # (bars_look_complete requires 2 points; 0DTE holds fit in one day).
            fetch_start = start - timedelta(days=7)
            fetch_end = end + timedelta(days=3)
        try:
            bars = _download(ysym, try_tf, fetch_start, fetch_end)
        except Exception as exc:  # noqa: BLE001 — surface as YahooIndexError
            last_err = exc
            continue
        if bars:
            return bars, ysym, try_tf

    raise YahooIndexError(
        f"Yahoo {ysym} empty for {product} tf={tf}"
        + (f" ({last_err})" if last_err else "")
    )


def _download(
    ysym: str,
    tf: Timeframe,
    start: datetime,
    end: datetime,
) -> list[dict[str, Any]]:
    try:
        import yfinance as yf
    except ImportError as exc:
        raise YahooIndexError(
            "yfinance required for index chart fallback: pip install yfinance"
        ) from exc

    interval = _interval(tf)
    # Yahoo end is exclusive for daily; pad one day.
    end_pad = end + timedelta(days=1)
    # yfinance accepts YYYY-MM-DD or datetime
    hist = yf.Ticker(ysym).history(
        start=start.astimezone(timezone.utc).date().isoformat(),
        end=end_pad.astimezone(timezone.utc).date().isoformat(),
        interval=interval,
        auto_adjust=True,
        actions=False,
    )
    if hist is None or getattr(hist, "empty", True):
        return []

    out: list[dict[str, Any]] = []
    for idx, row in hist.iterrows():
        try:
            ts = idx.to_pydatetime() if hasattr(idx, "to_pydatetime") else idx
            if getattr(ts, "tzinfo", None) is None:
                ts = ts.replace(tzinfo=timezone.utc)
            else:
                ts = ts.astimezone(timezone.utc)
            t_ms = int(ts.timestamp() * 1000)
            o = float(row["Open"])
            h = float(row["High"])
            l = float(row["Low"])
            c = float(row["Close"])
            v = float(row["Volume"]) if row.get("Volume") == row.get("Volume") else None
        except (TypeError, ValueError, KeyError):
            continue
        if c != c:  # NaN
            continue
        out.append({"t": t_ms, "o": o, "h": h, "l": l, "c": c, "v": v})
    out.sort(key=lambda b: int(b["t"]))
    return out
