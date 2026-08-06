"""Pearson correlation of daily returns — any two symbols (shared stream universe).

Uses Massive daily aggs. Resolves feed/proxy tickers via market_symbol_universe
when a product symbol is an index (SPX→SPY proxy for series until entitled).
"""

from __future__ import annotations

from math import sqrt
from typing import Any

from market_data import live_marks as lm
from market_data.massive_client import MassiveClient, MassiveClientError


def pearson(xs: list[float], ys: list[float]) -> float | None:
    """Pearson r for equal-length series. None if undefined."""
    n = len(xs)
    if n != len(ys) or n < 3:
        return None
    mx = sum(xs) / n
    my = sum(ys) / n
    num = 0.0
    dx2 = 0.0
    dy2 = 0.0
    for x, y in zip(xs, ys):
        dx = x - mx
        dy = y - my
        num += dx * dy
        dx2 += dx * dx
        dy2 += dy * dy
    den = sqrt(dx2 * dy2)
    if den <= 0:
        return None
    r = num / den
    # clamp numerical noise
    if r > 1.0:
        r = 1.0
    if r < -1.0:
        r = -1.0
    return r


def daily_log_returns(closes: list[float]) -> list[float]:
    out: list[float] = []
    for i in range(1, len(closes)):
        a, b = closes[i - 1], closes[i]
        if a <= 0 or b <= 0:
            continue
        out.append((b - a) / a)  # simple returns (stable for corr)
    return out


def resolve_series_ticker(cur, symbol: str) -> tuple[str, str]:
    """Return (series_ticker, note) for Massive daily bars."""
    symbol = (symbol or "").strip().upper()
    for u in lm.list_universe(cur, enabled_only=False):
        if u["symbol"] != symbol:
            continue
        feed = (u.get("feed_symbol") or "").strip()
        proxy = (u.get("proxy_symbol") or "").strip()
        # Prefer proxy for index series when feed is I:* (often not entitled)
        if proxy:
            return proxy, f"series via proxy {proxy} for {symbol}"
        if feed and not feed.startswith("I:"):
            return feed, f"series via feed {feed}"
        return symbol, "native symbol"
    return symbol, "native symbol (not in universe)"


def aligned_returns(
    client: MassiveClient,
    ticker_a: str,
    ticker_b: str,
    *,
    days: int = 60,
) -> tuple[list[float], list[float], list[str], dict[str, Any]]:
    """Align closes on common dates; return (ra, rb, dates, meta)."""
    sa = client.fetch_daily_closes(ticker_a, days=days)
    sb = client.fetch_daily_closes(ticker_b, days=days)
    by_a = {r["t"]: r["close"] for r in sa if r.get("t")}
    by_b = {r["t"]: r["close"] for r in sb if r.get("t")}
    dates = sorted(set(by_a) & set(by_b))
    closes_a = [by_a[d] for d in dates]
    closes_b = [by_b[d] for d in dates]
    ra = daily_log_returns(closes_a)
    rb = daily_log_returns(closes_b)
    # returns length = len(closes)-1; drop first date for return alignment
    ret_dates = dates[1:] if len(dates) > 1 else []
    # if some returns skipped due to zero, lengths may differ — recompute pairwise
    if len(ra) != len(rb):
        ra2: list[float] = []
        rb2: list[float] = []
        rd: list[str] = []
        for i in range(1, len(dates)):
            ca0, ca1 = by_a[dates[i - 1]], by_a[dates[i]]
            cb0, cb1 = by_b[dates[i - 1]], by_b[dates[i]]
            if ca0 <= 0 or ca1 <= 0 or cb0 <= 0 or cb1 <= 0:
                continue
            ra2.append((ca1 - ca0) / ca0)
            rb2.append((cb1 - cb0) / cb0)
            rd.append(dates[i])
        return ra2, rb2, rd, {
            "closes_a": len(closes_a),
            "closes_b": len(closes_b),
            "common_days": len(dates),
        }
    return ra, rb, ret_dates, {
        "closes_a": len(closes_a),
        "closes_b": len(closes_b),
        "common_days": len(dates),
    }


def correlate_symbols(
    cur,
    symbol_a: str,
    symbol_b: str,
    *,
    days: int = 60,
    client: MassiveClient | None = None,
) -> dict[str, Any]:
    """Correlation coefficient between any two symbols (daily returns)."""
    a = (symbol_a or "").strip().upper()
    b = (symbol_b or "").strip().upper()
    if not a or not b:
        raise ValueError("symbol_a and symbol_b required")
    if a == b:
        return {
            "symbol_a": a,
            "symbol_b": b,
            "coefficient": 1.0,
            "method": "pearson_daily_simple_returns",
            "days_requested": days,
            "n_returns": None,
            "note": "identical symbols → r = 1",
        }

    ta, note_a = resolve_series_ticker(cur, a)
    tb, note_b = resolve_series_ticker(cur, b)
    client = client or MassiveClient()
    try:
        ra, rb, ret_dates, meta = aligned_returns(client, ta, tb, days=days)
    except MassiveClientError as exc:
        raise ValueError(str(exc)) from exc

    r = pearson(ra, rb)
    if r is None:
        raise ValueError(
            f"insufficient overlapping daily data for {a}/{b} "
            f"(common_days={meta.get('common_days')})"
        )

    return {
        "symbol_a": a,
        "symbol_b": b,
        "series_ticker_a": ta,
        "series_ticker_b": tb,
        "series_note_a": note_a,
        "series_note_b": note_b,
        "coefficient": round(r, 6),
        "method": "pearson_daily_simple_returns",
        "days_requested": days,
        "n_returns": len(ra),
        "date_start": ret_dates[0] if ret_dates else None,
        "date_end": ret_dates[-1] if ret_dates else None,
        "meta": meta,
        "interpretation": _interpret(r),
    }


def _interpret(r: float) -> str:
    ar = abs(r)
    if ar >= 0.8:
        strength = "very strong"
    elif ar >= 0.6:
        strength = "strong"
    elif ar >= 0.4:
        strength = "moderate"
    elif ar >= 0.2:
        strength = "weak"
    else:
        strength = "very weak / near zero"
    direction = "positive" if r >= 0 else "negative (inverse)"
    return f"{strength} {direction} correlation"


def relative_correlations(
    cur,
    symbols: list[str],
    *,
    benchmark: str = "SPY",
    days: int = 60,
) -> dict[str, Any]:
    """Correlation of each symbol vs benchmark + optional pairwise among symbols."""
    client = MassiveClient()
    bench = (benchmark or "SPY").strip().upper()
    unique = []
    for s in symbols:
        s = (s or "").strip().upper()
        if s and s not in unique:
            unique.append(s)

    vs_bench: dict[str, Any] = {}
    for s in unique:
        if s == bench:
            vs_bench[s] = {
                "coefficient": 1.0,
                "benchmark": bench,
                "note": "benchmark",
            }
            continue
        try:
            res = correlate_symbols(cur, s, bench, days=days, client=client)
            vs_bench[s] = {
                "coefficient": res["coefficient"],
                "benchmark": bench,
                "n_returns": res["n_returns"],
                "series_ticker": res["series_ticker_a"],
                "interpretation": res["interpretation"],
            }
        except (ValueError, MassiveClientError) as exc:
            vs_bench[s] = {
                "coefficient": None,
                "benchmark": bench,
                "error": str(exc)[:200],
            }

    pairwise: list[dict[str, Any]] = []
    for i, a in enumerate(unique):
        for b in unique[i + 1 :]:
            try:
                res = correlate_symbols(cur, a, b, days=days, client=client)
                pairwise.append(
                    {
                        "symbol_a": a,
                        "symbol_b": b,
                        "coefficient": res["coefficient"],
                        "n_returns": res["n_returns"],
                    }
                )
            except (ValueError, MassiveClientError) as exc:
                pairwise.append(
                    {
                        "symbol_a": a,
                        "symbol_b": b,
                        "coefficient": None,
                        "error": str(exc)[:200],
                    }
                )

    return {
        "benchmark": bench,
        "days": days,
        "vs_benchmark": vs_bench,
        "pairwise": pairwise,
        "symbols": unique,
    }
