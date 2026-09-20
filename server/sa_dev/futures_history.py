"""SODP2 / F3 — Massive-first futures history. Born on StudioOne.

Not a copy of _aggs_price_fill. Massive native per-contract aggs are the BASE.
Local prints are tail only. Empty Massive is MASSIVE EMPTY, never SHORT HISTORY.
"""

from __future__ import annotations

import json
import os
import re
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from symbology.catalog import MONTH_TO_CODE, contract_symbol, parse_long_form

FUTURES_SOURCES = frozenset({"ES", "MES"})
REQUESTED_WINDOW_DAYS = 90
_FETCH_BUFFER_DAYS = 20
_DECADE = re.compile(r"^([A-Z]+)([FGHJKMNQUVXZ])(\d)$")
_RES = {"1m": "1min", "5m": "5min", "15m": "15min"}


def vendor_ticker(bound: str) -> str:
    """Labs identity ESZ2026 → Massive ESZ6. Decade form passes through."""
    s = (bound or "").strip().upper()
    parsed = parse_long_form(s)
    if parsed:
        root, year, month = parsed
        return f"{root}{MONTH_TO_CODE[month]}{year % 10}"
    if _DECADE.match(s):
        return s
    raise ValueError(f"unrecognized bound_symbol: {bound}")


def bound_symbol_of(vendor: str, *, as_of: date | None = None) -> str:
    s = (vendor or "").strip().upper()
    parsed = parse_long_form(s)
    if parsed:
        return s
    m = _DECADE.match(s)
    if not m:
        raise ValueError(f"unrecognized vendor ticker: {vendor}")
    root, code, y1 = m.group(1), m.group(2), int(m.group(3))
    now = as_of or date.today()
    year = (now.year // 10) * 10 + y1
    if year < now.year - 1:
        year += 10
    return contract_symbol(root, year, code)


def _cache_root() -> Path:
    raw = (
        os.environ.get("LABS_FUTURES_HISTORY_ROOT")
        or os.environ.get("LABS_MARKET_DATA_ROOT")
        or ""
    ).strip()
    if not raw:
        raise RuntimeError("LABS_FUTURES_HISTORY_ROOT or LABS_MARKET_DATA_ROOT required")
    p = Path(raw) / "vp" / "futures_history"
    p.mkdir(parents=True, exist_ok=True)
    return p


def _cache_path(vendor: str, tf: str) -> Path:
    return _cache_root() / f"{vendor}_{tf}.json"


def _load_cache(vendor: str, tf: str) -> dict[str, Any] | None:
    path = _cache_path(vendor, tf)
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def _save_cache(vendor: str, tf: str, bars: list[dict[str, Any]]) -> None:
    path = _cache_path(vendor, tf)
    path.write_text(
        json.dumps(
            {
                "vendor_ticker": vendor,
                "tf": tf,
                "fetched_at": datetime.now(timezone.utc).isoformat(),
                "bars": bars,
            },
            separators=(",", ":"),
        ),
        encoding="utf-8",
    )


def _default_bound(source: str) -> str:
    from symbology.service import current_strip

    src = source.upper()
    front = current_strip().front_by_root.get(src)
    if not front:
        raise ValueError(f"no strip front for {src}")
    return str(front)


def _span_days(bars: list[dict[str, Any]]) -> float:
    if len(bars) < 2:
        return 0.0
    return max(0.0, (float(bars[-1]["t"]) - float(bars[0]["t"])) / 86400000.0)


def _print_tail(source: str, tf: str, after_t: int) -> list[dict[str, Any]]:
    try:
        from market_data.vp_chunks import assemble_bars
        from market_data.vp_warmer import load_chunks
        from sa_dev.store_read import list_source_days, store_ok
    except Exception:
        return []
    ok, _ = store_ok()
    if not ok:
        return []
    days = list_source_days(source.upper())[-3:]
    if not days:
        return []
    chunks = load_chunks(source.upper(), tf, days)
    bars, *_rest = assemble_bars(chunks)
    return [b for b in bars if int(b.get("t") or 0) > after_t]


def serve(
    source: str,
    *,
    tf: str = "5m",
    contract: str | None = None,
    requested_window_days: int = REQUESTED_WINDOW_DAYS,
) -> dict[str, Any]:
    src = (source or "").upper()
    if src not in FUTURES_SOURCES:
        return {
            "ok": False,
            "source": src,
            "named_state": "NOT FUTURES",
            "short_history": False,
            "bars": [],
            "bar_count": 0,
        }
    res = _RES.get(tf)
    if not res:
        return {
            "ok": False,
            "source": src,
            "named_state": "BAD TF",
            "short_history": False,
            "bars": [],
            "bar_count": 0,
        }
    try:
        bound = (contract or "").strip().upper() or _default_bound(src)
        vendor = vendor_ticker(bound)
        bound = bound_symbol_of(bound)
    except ValueError as exc:
        return {
            "ok": False,
            "source": src,
            "named_state": "BAD SYMBOL",
            "detail": str(exc),
            "short_history": False,
            "bars": [],
            "bar_count": 0,
        }

    window = max(1, int(requested_window_days))
    end = datetime.now(timezone.utc).date()
    start = end - timedelta(days=window + _FETCH_BUFFER_DAYS)
    cutoff_ms = int(
        datetime.combine(
            end - timedelta(days=window + _FETCH_BUFFER_DAYS),
            datetime.min.time(),
            tzinfo=timezone.utc,
        ).timestamp()
        * 1000
    )

    cached = _load_cache(vendor, tf)
    raw: list[dict[str, Any]] = []
    if cached and isinstance(cached.get("bars"), list) and cached["bars"]:
        raw = cached["bars"]
        last_t = int(raw[-1]["t"])
        stale = (datetime.now(timezone.utc).timestamp() * 1000) - last_t > 36 * 3600 * 1000
        first_ok = int(raw[0]["t"]) <= cutoff_ms
        if stale or not first_ok:
            raw = []

    if not raw:
        from market_data.massive_client import MassiveClient, MassiveClientError

        try:
            client = MassiveClient()
            fetched = client.fetch_futures_aggs(
                vendor,
                resolution=res,
                start=start.isoformat(),
                end=end.isoformat(),
            )
        except MassiveClientError as exc:
            return {
                "ok": False,
                "source": src,
                "bound_symbol": bound,
                "vendor_ticker": vendor,
                "named_state": "MASSIVE EMPTY",
                "detail": str(exc),
                "short_history": False,
                "price_source": "massive_futures_aggs",
                "requested_window_days": window,
                "history_span_days": 0,
                "bars": [],
                "bar_count": 0,
            }
        if not fetched:
            return {
                "ok": False,
                "source": src,
                "bound_symbol": bound,
                "vendor_ticker": vendor,
                "named_state": "MASSIVE EMPTY",
                "detail": f"Massive /futures/v1/aggs/{vendor} returned no bars",
                "short_history": False,
                "price_source": "massive_futures_aggs",
                "requested_window_days": window,
                "history_span_days": 0,
                "bars": [],
                "bar_count": 0,
            }
        raw = fetched
        try:
            _save_cache(vendor, tf, raw)
        except OSError:
            pass

    bars = [b for b in raw if int(b.get("t") or 0) >= cutoff_ms]
    last_t = int(bars[-1]["t"]) if bars else 0
    tail = _print_tail(src, tf, last_t) if last_t else []
    if tail:
        bars = bars + tail
    span = _span_days(bars)
    short = span < float(window) if bars else True
    out: dict[str, Any] = {
        "ok": True,
        "source": src,
        "tf": tf,
        "bound_symbol": bound,
        "vendor_ticker": vendor,
        "price_source": "massive_futures_aggs",
        "tail_source": "vp_prints" if tail else "none",
        "requested_window_days": window,
        "history_span_days": round(span, 2),
        "short_history": short,
        "bars": bars,
        "bar_count": len(bars),
    }
    if short:
        out["named_state"] = "SHORT HISTORY"
        out["detail"] = (
            f"price span {span:.1f}d < {window}d (source=massive_futures_aggs)"
        )
    return out
