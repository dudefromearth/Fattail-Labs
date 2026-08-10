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
# Doctrine (aligned with live_stream): try native index feed first; labeled
# proxy only when the feed cannot deliver. Cash indexes are calculated series,
# not traded books — prefer I:SPX over SPY shape-proxy by default.
_DEFAULT_FEED: dict[str, str] = {
    "SPX": "I:SPX",
    "XSP": "I:XSP",
    "VIX": "I:VIX",
    "VIX1D": "I:VIX1D",
}
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
    """Entry/exit markers from fill exec times (not option prints).

    Selection-aware (which blotter row the member opened):

    - **TO OPEN** selected → always **Entry** at this fill (never Exit here).
    - **TO CLOSE** selected → always **Exit** at this fill; **Entry** only when
      a paired open exists (matched open fill with exec_at).

    Chart window may still span the full hold via :func:`hold_endpoints`;
    markers follow the selected side only.
    """
    from trade_log_domain.structure import trade_is_close_fill

    def _mk(
        kind: str,
        dt: datetime,
        *,
        trade_id: Any,
    ) -> dict[str, Any]:
        return {
            "kind": kind,
            "t": dt.isoformat().replace("+00:00", "Z"),
            "t_ms": int(dt.timestamp() * 1000),
            "label": "Exit" if kind == "exit" else "Entry",
            "trade_id": trade_id,
        }

    is_close = trade_is_close_fill(trade)
    self_t = _parse_exec(trade.get("exec_at"))

    # --- TO OPEN selected: Entry only ---
    if not is_close:
        entry_t = None
        if paired_open is not None:
            entry_t = _parse_exec(paired_open.get("exec_at"))
        if entry_t is None:
            entry_t = self_t
        if entry_t is None:
            return []
        return [
            _mk(
                "entry",
                entry_t,
                trade_id=(paired_open or trade).get("id"),
            )
        ]

    # --- TO CLOSE selected: Exit always; Entry if paired open has time ---
    markers: list[dict[str, Any]] = []
    entry_t = None
    if paired_open is not None:
        entry_t = _parse_exec(paired_open.get("exec_at"))
    if entry_t is not None:
        markers.append(
            _mk("entry", entry_t, trade_id=paired_open.get("id") if paired_open else None)
        )

    exit_t = None
    if paired_close is not None:
        exit_t = _parse_exec(paired_close.get("exec_at"))
    if exit_t is None:
        exit_t = self_t
    if exit_t is not None:
        markers.append(
            _mk(
                "exit",
                exit_t,
                trade_id=(paired_close or trade).get("id"),
            )
        )
    return markers


def resolve_series_candidates(
    product: str,
    *,
    universe: list[dict[str, Any]] | None = None,
) -> list[tuple[str, str | None, str]]:
    """Ordered Massive series attempts for a book product.

    Native feed first (e.g. ``I:SPX``), then labeled proxy (e.g. SPY) if
    configured. Each item is ``(series_ticker, proxy_label_or_None, source)``.
    ``proxy_label`` is set only on proxy candidates — never silent.
    source is ``massive_v1`` or ``massive_proxy_v1``.
    """
    product = (product or "").strip().upper().lstrip("/")
    if not product:
        raise ValueError("product underlier required")

    feed: str | None = None
    proxy: str | None = None
    if universe:
        for u in universe:
            if (u.get("symbol") or "").strip().upper() != product:
                continue
            raw_feed = (u.get("feed_symbol") or "").strip()
            raw_proxy = (u.get("proxy_symbol") or "").strip().upper()
            feed = raw_feed or None
            proxy = raw_proxy or None
            break
    if feed is None and product in _DEFAULT_FEED:
        feed = _DEFAULT_FEED[product]
    if proxy is None and product in _DEFAULT_PROXY:
        proxy = _DEFAULT_PROXY[product]

    out: list[tuple[str, str | None, str]] = []
    seen: set[str] = set()

    def _add(ticker: str, label: str | None, source: str) -> None:
        key = ticker.strip()
        if not key:
            return
        # Cache/identity key: case-sensitive path segment for I:SPX vs i:spx
        norm = key if key.upper().startswith("I:") else key.upper()
        if norm in seen:
            return
        seen.add(norm)
        out.append((key if key.upper().startswith("I:") else key.upper(), label, source))

    # 1) Explicit feed (I:SPX, equity ticker, …)
    if feed:
        _add(feed, None, "massive_v1")
    # 2) Product symbol itself when distinct from feed
    _add(product, None, "massive_v1")
    # 3) Labeled proxy last (only when Massive cannot deliver native)
    if proxy and proxy != product:
        _add(proxy, f"{proxy} proxy for {product}", "massive_proxy_v1")

    if not out:
        _add(product, None, "massive_v1")
    return out


def resolve_series_ticker(
    product: str,
    *,
    universe: list[dict[str, Any]] | None = None,
) -> tuple[str, str | None, str]:
    """Primary preferred series (native feed first).

    For fallback attempts use :func:`resolve_series_candidates`. Returns
    ``(series_ticker, proxy_label_or_None, source)`` for the first candidate
    (proxy_label is None when primary is native).
    """
    return resolve_series_candidates(product, universe=universe)[0]


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
