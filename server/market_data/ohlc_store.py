"""Durable OHLC series — bootstrap once, append daily (and on demand).

Volume Profile and other charts read from MySQL. Massive is used only to:
  1) bootstrap a missing series (full lookback)
  2) append bars after ``last_t``
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def get_series_meta(cur, product: str, tf: str) -> dict[str, Any] | None:
    product = product.strip().upper()
    cur.execute(
        """SELECT product, tf, series_ticker, proxy_label, source,
                  first_t, last_t, bar_count, bootstrap_complete, last_append_at
           FROM market_ohlc_series
           WHERE product = %s AND tf = %s""",
        (product, tf),
    )
    r = cur.fetchone()
    if not r:
        return None
    return {
        "product": r["product"],
        "tf": r["tf"],
        "series_ticker": r.get("series_ticker"),
        "proxy_label": r.get("proxy_label"),
        "source": r.get("source"),
        "first_t": int(r["first_t"]) if r.get("first_t") is not None else None,
        "last_t": int(r["last_t"]) if r.get("last_t") is not None else None,
        "bar_count": int(r.get("bar_count") or 0),
        "bootstrap_complete": bool(int(r.get("bootstrap_complete") or 0)),
        "last_append_at": r.get("last_append_at"),
    }


def load_bars(
    cur,
    product: str,
    tf: str,
    *,
    from_t: int | None = None,
    to_t: int | None = None,
    limit: int | None = None,
) -> list[dict[str, Any]]:
    product = product.strip().upper()
    sql = """SELECT bar_t AS t, o, h, l, c, v
             FROM market_ohlc_bars
             WHERE product = %s AND tf = %s"""
    args: list[Any] = [product, tf]
    if from_t is not None:
        sql += " AND bar_t >= %s"
        args.append(int(from_t))
    if to_t is not None:
        sql += " AND bar_t <= %s"
        args.append(int(to_t))
    sql += " ORDER BY bar_t ASC"
    if limit is not None and limit > 0:
        sql += " LIMIT %s"
        args.append(int(limit))
    cur.execute(sql, args)
    out = []
    for r in cur.fetchall() or []:
        out.append(
            {
                "t": int(r["t"]),
                "o": float(r["o"]) if r.get("o") is not None else None,
                "h": float(r["h"]) if r.get("h") is not None else None,
                "l": float(r["l"]) if r.get("l") is not None else None,
                "c": float(r["c"]),
                "v": float(r["v"]) if r.get("v") is not None else None,
            }
        )
    return out


def upsert_bars(
    cur,
    product: str,
    tf: str,
    bars: list[dict[str, Any]],
    *,
    series_ticker: str | None = None,
    proxy_label: str | None = None,
    source: str | None = None,
    bootstrap_complete: bool | None = None,
) -> dict[str, Any]:
    """Insert/update bars and refresh series meta. Returns meta."""
    product = product.strip().upper()
    tf = (tf or "").strip().lower()
    if not bars:
        meta = get_series_meta(cur, product, tf)
        return meta or {
            "product": product,
            "tf": tf,
            "bar_count": 0,
            "bootstrap_complete": False,
        }

    # Upsert in chunks
    chunk = 500
    for i in range(0, len(bars), chunk):
        part = bars[i : i + chunk]
        values = []
        for b in part:
            t = b.get("t")
            if t is None:
                continue
            c = b.get("c")
            if c is None:
                continue
            values.append(
                (
                    product,
                    tf,
                    int(t),
                    float(b["o"]) if b.get("o") is not None else None,
                    float(b["h"]) if b.get("h") is not None else None,
                    float(b["l"]) if b.get("l") is not None else None,
                    float(c),
                    float(b["v"]) if b.get("v") is not None else None,
                )
            )
        if not values:
            continue
        cur.executemany(
            """INSERT INTO market_ohlc_bars (product, tf, bar_t, o, h, l, c, v)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
               ON DUPLICATE KEY UPDATE
                 o = VALUES(o), h = VALUES(h), l = VALUES(l),
                 c = VALUES(c), v = VALUES(v)""",
            values,
        )

    cur.execute(
        """SELECT MIN(bar_t) AS first_t, MAX(bar_t) AS last_t, COUNT(*) AS n
           FROM market_ohlc_bars WHERE product = %s AND tf = %s""",
        (product, tf),
    )
    agg = cur.fetchone() or {}
    first_t = int(agg["first_t"]) if agg.get("first_t") is not None else None
    last_t = int(agg["last_t"]) if agg.get("last_t") is not None else None
    n = int(agg.get("n") or 0)

    prev = get_series_meta(cur, product, tf)
    boot = (
        bool(bootstrap_complete)
        if bootstrap_complete is not None
        else (prev["bootstrap_complete"] if prev else False)
    )
    cur.execute(
        """INSERT INTO market_ohlc_series
             (product, tf, series_ticker, proxy_label, source,
              first_t, last_t, bar_count, bootstrap_complete, last_append_at)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
           ON DUPLICATE KEY UPDATE
             series_ticker = COALESCE(VALUES(series_ticker), series_ticker),
             proxy_label = COALESCE(VALUES(proxy_label), proxy_label),
             source = COALESCE(VALUES(source), source),
             first_t = VALUES(first_t),
             last_t = VALUES(last_t),
             bar_count = VALUES(bar_count),
             bootstrap_complete = GREATEST(bootstrap_complete, VALUES(bootstrap_complete)),
             last_append_at = VALUES(last_append_at)""",
        (
            product,
            tf,
            series_ticker,
            proxy_label,
            source,
            first_t,
            last_t,
            n,
            1 if boot else 0,
            _now(),
        ),
    )
    return get_series_meta(cur, product, tf) or {}


def needs_append(meta: dict[str, Any] | None, tf: str) -> bool:
    """True if series is missing tip for current session / day."""
    if not meta or meta.get("last_t") is None:
        return True
    last = datetime.fromtimestamp(int(meta["last_t"]) / 1000.0, tz=timezone.utc)
    now = datetime.now(timezone.utc)
    age = now - last
    tf = (tf or "1d").lower()
    if tf == "1d":
        # Append if last bar is before today's UTC date (or very old)
        return last.date() < now.date() or age > timedelta(hours=20)
    if tf in ("4h", "1h"):
        return age > timedelta(hours=2)
    if tf in ("30m", "10m", "5m"):
        return age > timedelta(minutes=20)
    return age > timedelta(hours=6)


def bars_from_t(last_t_ms: int | None, *, overlap_bars: int = 3, tf: str = "1d") -> datetime:
    """Start time for Massive append fetch (overlap for forming bar rewrite)."""
    if last_t_ms is None:
        return datetime.now(timezone.utc) - timedelta(days=1096)
    # step back a few bars
    step = {
        "1d": timedelta(days=3),
        "4h": timedelta(hours=12),
        "1h": timedelta(hours=6),
        "30m": timedelta(hours=3),
        "10m": timedelta(hours=1),
        "5m": timedelta(minutes=30),
    }.get((tf or "1d").lower(), timedelta(days=2))
    return datetime.fromtimestamp(last_t_ms / 1000.0, tz=timezone.utc) - step
