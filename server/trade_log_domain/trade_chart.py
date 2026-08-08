"""Trade chart review domain (Phase 2 Match Hygiene — charts track).

Pure functions: underlier resolution, hold window, entry/exit markers,
structure strike band. No FastAPI, no Massive, no DB.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Literal

Timeframe = Literal["5m", "15m", "1d"]
VALID_TFS: frozenset[str] = frozenset({"5m", "15m", "1d"})

# Context margin around hold window (spec: hold ± context).
_MARGIN: dict[str, timedelta] = {
    "5m": timedelta(hours=1),
    "15m": timedelta(hours=3),
    "1d": timedelta(days=7),
}

# Static fallback when market_symbol_universe is empty / unavailable.
# Matches migration 085–086 doctrine (labeled proxies).
_DEFAULT_PROXY: dict[str, str] = {
    "SPX": "SPY",
    "XSP": "SPY",
    "VIX": "VIXY",
    "VIX1D": "VIXY",
}


def normalize_tf(raw: str | None) -> Timeframe:
    s = (raw or "15m").strip().lower()
    if s == "1d" or s == "d" or s == "day":
        return "1d"
    if s == "5m" or s == "5":
        return "5m"
    if s == "15m" or s == "15":
        return "15m"
    raise ValueError(f"tf must be one of 5m|15m|1d, got {raw!r}")


def product_underlier(trade: dict[str, Any]) -> str | None:
    """Book underlier for the structure (one chart per structure, never per leg)."""
    legs = trade.get("legs") or []
    for leg in legs:
        u = (leg.get("underlier") or "").strip().upper()
        if u:
            return u
    for leg in legs:
        sym = (leg.get("symbol") or "").strip().upper()
        if not sym:
            continue
        # Equity/ETF/crypto/future fills often store product on symbol only.
        ac = (leg.get("asset_class") or trade.get("asset_class") or "").lower()
        if ac in ("equity", "etf", "crypto", "future", "index") or not leg.get(
            "expiry"
        ):
            # Strip leading slash futures shorthand (/ES → ES for display; keep as-is)
            return sym.lstrip("/")
        # OCC-style options leave underlier on underlier field; skip OCC root guess.
    return None


def structure_strike_band(trade: dict[str, Any]) -> dict[str, float] | None:
    """Min/max strike zone for multi-leg shading (not a P&L curve)."""
    strikes: list[float] = []
    for leg in trade.get("legs") or []:
        s = leg.get("strike")
        if s is None:
            continue
        try:
            strikes.append(float(s))
        except (TypeError, ValueError):
            continue
    if not strikes:
        return None
    lo, hi = min(strikes), max(strikes)
    if lo == hi:
        # Single strike — thin band (±0.25% or ±1 pt floor)
        pad = max(abs(lo) * 0.0025, 1.0)
        return {"low": lo - pad, "high": hi + pad}
    return {"low": lo, "high": hi}


def _parse_exec(raw: str | None) -> datetime | None:
    if not raw:
        return None
    s = str(raw).strip().replace(" ", "T")
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    try:
        dt = datetime.fromisoformat(s)
    except ValueError:
        return None
    if dt.tzinfo is None:
        # Trade log stores naive wall times; treat as UTC for chart window math.
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def hold_endpoints(
    trade: dict[str, Any],
    *,
    paired_open: dict[str, Any] | None = None,
    paired_close: dict[str, Any] | None = None,
) -> tuple[datetime | None, datetime | None]:
    """Return (entry_at, exit_at) for the structure hold.

    Prefer explicit paired open/close; fall back to this trade's exec_at alone.
    """
    from trade_log_domain.structure import trade_is_close_fill

    entry_t = exit_t = None
    if paired_open is not None:
        entry_t = _parse_exec(paired_open.get("exec_at"))
    if paired_close is not None:
        exit_t = _parse_exec(paired_close.get("exec_at"))

    self_t = _parse_exec(trade.get("exec_at"))
    if entry_t is None and exit_t is None:
        if self_t is None:
            return None, None
        if trade_is_close_fill(trade):
            return None, self_t
        return self_t, None

    if entry_t is None and self_t is not None and not trade_is_close_fill(trade):
        entry_t = self_t
    if exit_t is None and self_t is not None and trade_is_close_fill(trade):
        exit_t = self_t
    return entry_t, exit_t


def chart_window(
    trade: dict[str, Any],
    tf: Timeframe,
    *,
    paired_open: dict[str, Any] | None = None,
    paired_close: dict[str, Any] | None = None,
    now: datetime | None = None,
) -> tuple[datetime, datetime] | None:
    """Hold window ± context margin. None if no usable timestamps."""
    entry_t, exit_t = hold_endpoints(
        trade, paired_open=paired_open, paired_close=paired_close
    )
    if entry_t is None and exit_t is None:
        return None
    if entry_t is None:
        entry_t = exit_t
    assert entry_t is not None
    if exit_t is None:
        # Open still working — extend to now (capped) so intraday chart is useful.
        n = now or datetime.now(timezone.utc)
        if n.tzinfo is None:
            n = n.replace(tzinfo=timezone.utc)
        exit_t = max(entry_t, n)
    if exit_t < entry_t:
        entry_t, exit_t = exit_t, entry_t

    margin = _MARGIN[tf]
    start = entry_t - margin
    end = exit_t + margin
    # Intraday floors: at least ~ half session of bars for short holds.
    if tf in ("5m", "15m"):
        min_span = timedelta(hours=2) if tf == "5m" else timedelta(hours=4)
        if end - start < min_span:
            mid = entry_t + (exit_t - entry_t) / 2
            start = mid - min_span / 2
            end = mid + min_span / 2
    return start, end


def build_markers(
    trade: dict[str, Any],
    *,
    paired_open: dict[str, Any] | None = None,
    paired_close: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """Entry/exit markers from fill exec times (not option prints)."""
    from trade_log_domain.structure import trade_is_close_fill

    markers: list[dict[str, Any]] = []
    entry_t, exit_t = hold_endpoints(
        trade, paired_open=paired_open, paired_close=paired_close
    )
    # Single-fill open with no pair still gets an entry marker.
    if entry_t is None and exit_t is None:
        t = _parse_exec(trade.get("exec_at"))
        if t is None:
            return []
        kind = "exit" if trade_is_close_fill(trade) else "entry"
        markers.append(
            {
                "kind": kind,
                "t": t.isoformat().replace("+00:00", "Z"),
                "t_ms": int(t.timestamp() * 1000),
                "label": "Exit" if kind == "exit" else "Entry",
                "trade_id": trade.get("id"),
            }
        )
        return markers

    if entry_t is not None:
        markers.append(
            {
                "kind": "entry",
                "t": entry_t.isoformat().replace("+00:00", "Z"),
                "t_ms": int(entry_t.timestamp() * 1000),
                "label": "Entry",
                "trade_id": (paired_open or trade).get("id"),
            }
        )
    if exit_t is not None:
        markers.append(
            {
                "kind": "exit",
                "t": exit_t.isoformat().replace("+00:00", "Z"),
                "t_ms": int(exit_t.timestamp() * 1000),
                "label": "Exit",
                "trade_id": (paired_close or trade).get("id"),
            }
        )
    return markers


def resolve_series_ticker(
    product: str,
    *,
    universe: list[dict[str, Any]] | None = None,
) -> tuple[str, str | None, str]:
    """Map book product → Massive series ticker + optional proxy label.

    Returns (series_ticker, proxy_label_or_None, source).
    source is ``massive_v1`` or ``massive_proxy_v1`` (never silent proxy).
    """
    product = (product or "").strip().upper().lstrip("/")
    if not product:
        raise ValueError("product underlier required")

    if universe:
        for u in universe:
            if (u.get("symbol") or "").strip().upper() != product:
                continue
            proxy = (u.get("proxy_symbol") or "").strip().upper()
            feed = (u.get("feed_symbol") or "").strip()
            if proxy:
                return (
                    proxy,
                    f"{proxy} proxy for {product}",
                    "massive_proxy_v1",
                )
            # Prefer non-index feed when present (I:SPX often not entitled for aggs)
            if feed and not feed.upper().startswith("I:"):
                return feed.upper(), None, "massive_v1"
            if feed and feed.upper().startswith("I:"):
                # Index feed without proxy — try feed, label as native index
                return feed, None, "massive_v1"
            return product, None, "massive_v1"

    proxy = _DEFAULT_PROXY.get(product)
    if proxy:
        return proxy, f"{proxy} proxy for {product}", "massive_proxy_v1"
    return product, None, "massive_v1"


def tf_agg_params(tf: Timeframe) -> tuple[int, str]:
    """Massive range multiplier + timespan."""
    if tf == "5m":
        return 5, "minute"
    if tf == "15m":
        return 15, "minute"
    return 1, "day"


def bars_look_complete(
    bars: list[dict[str, Any]],
    *,
    window_start: datetime,
    window_end: datetime,
    tf: Timeframe,
) -> tuple[bool, str | None]:
    """Heuristic completeness: zero bars → missing; sparse gap → stale/partial.

    Fail loud: never invent bars. Empty is always incomplete.
    """
    if not bars:
        return False, "missing_bars"
    # Require at least 2 points so a path is meaningful
    if len(bars) < 2:
        return False, "missing_bars"
    # For intraday, if the entire window is in the future, bars are unexpected
    now = datetime.now(timezone.utc)
    if window_start > now + timedelta(hours=1):
        return False, "window_in_future"
    # Stale: last bar ends far before window end for closed holds in the past
    last_t = bars[-1].get("t")
    if isinstance(last_t, (int, float)) and window_end < now - timedelta(days=2):
        last_dt = datetime.fromtimestamp(float(last_t) / 1000.0, tz=timezone.utc)
        gap = window_end - last_dt
        if tf == "1d" and gap > timedelta(days=5):
            return False, "stale_bars"
        if tf in ("5m", "15m") and gap > timedelta(hours=6):
            return False, "stale_bars"
    return True, None
