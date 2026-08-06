"""Shared live marks store — one stream, all members' Curate collections.

Writers: live_stream process (or platform-tick warm path).
Readers: strategy_runtime.marks.get_mark for every identity.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Any

# Default if table empty / migration not applied yet (dev only path)
# Coach universe: indexes + ETFs + Mag7 stocks (options-heavy, 3–5 expirations/week class)
DEFAULT_UNIVERSE = (
    "SPX",
    "XSP",
    "VIX",
    "SPY",
    "QQQ",
    "IWM",
    "GLD",
    "TLT",
    "SLV",
    "USO",
    "XLF",
    "UNG",
    "AAPL",
    "AMZN",
    "NVDA",
    "TSLA",
    "GOOGL",
    "META",
    "MSFT",
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _now_iso() -> str:
    return _now().isoformat().replace("+00:00", "Z")


def stale_seconds() -> int:
    raw = (os.environ.get("LABS_MARK_STALE_SECONDS") or "60").strip()
    try:
        n = int(raw)
    except ValueError as exc:
        raise ValueError(f"LABS_MARK_STALE_SECONDS must be int, got {raw!r}") from exc
    if n < 5:
        raise ValueError("LABS_MARK_STALE_SECONDS must be >= 5")
    return n


def live_marks_required() -> bool:
    """If true, missing/stale marks fail loud (no stub)."""
    v = (os.environ.get("LABS_LIVE_MARKS_REQUIRED") or "").strip().lower()
    return v in ("1", "true", "yes", "on")


def list_universe(cur, *, enabled_only: bool = True) -> list[dict[str, Any]]:
    try:
        if enabled_only:
            cur.execute(
                """SELECT symbol, feed_symbol, proxy_symbol, kind, role, enabled,
                          sort_order, note, options_cadence
                   FROM market_symbol_universe
                   WHERE enabled = 1
                   ORDER BY sort_order ASC, symbol ASC"""
            )
        else:
            cur.execute(
                """SELECT symbol, feed_symbol, proxy_symbol, kind, role, enabled,
                          sort_order, note, options_cadence
                   FROM market_symbol_universe
                   ORDER BY sort_order ASC, symbol ASC"""
            )
        rows = cur.fetchall()
    except Exception:
        # Table missing or pre-085 columns — fallback list
        return [
            {
                "symbol": s,
                "feed_symbol": None,
                "proxy_symbol": None,
                "kind": "index"
                if s in ("SPX", "XSP", "VIX", "VIX1D")
                else ("etf" if s in ("SPY", "QQQ", "IWM", "GLD", "TLT", "SLV", "USO", "XLF", "UNG") else "equity"),
                "role": "reference" if s in ("VIX", "VIX1D") else "tradeable",
                "enabled": True,
                "sort_order": i * 10,
                "note": "default universe (migration pending?)",
                "options_cadence": "3-5x/week",
            }
            for i, s in enumerate(DEFAULT_UNIVERSE + ("VIX1D",))
        ]
    if not rows:
        return [
            {
                "symbol": s,
                "feed_symbol": None,
                "proxy_symbol": None,
                "kind": "equity",
                "role": "tradeable",
                "enabled": True,
                "sort_order": i,
                "note": None,
                "options_cadence": None,
            }
            for i, s in enumerate(DEFAULT_UNIVERSE)
        ]
    return [
        {
            "symbol": r["symbol"],
            "feed_symbol": r.get("feed_symbol"),
            "proxy_symbol": r.get("proxy_symbol"),
            "kind": r["kind"],
            "role": r.get("role") or "tradeable",
            "enabled": bool(r["enabled"]),
            "sort_order": int(r["sort_order"]),
            "note": r.get("note"),
            "options_cadence": r.get("options_cadence"),
        }
        for r in rows
    ]


def universe_symbols(cur) -> list[str]:
    return [r["symbol"] for r in list_universe(cur, enabled_only=True)]


def upsert_mark(
    cur,
    *,
    symbol: str,
    mid: float,
    bid: float | None,
    ask: float | None,
    last_trade: float | None,
    source: str,
    label: str,
    asof: datetime | None = None,
    raw: dict | None = None,
    prev_close: float | None = None,
    day_open: float | None = None,
    day_high: float | None = None,
    day_low: float | None = None,
) -> None:
    symbol = symbol.strip().upper()
    asof = asof or _now()
    day_change_pct = None
    if prev_close is not None and float(prev_close) != 0:
        day_change_pct = (float(mid) - float(prev_close)) / float(prev_close) * 100.0
    cur.execute(
        """INSERT INTO market_live_marks
           (symbol, mid, bid, ask, last_trade, prev_close, day_open, day_high, day_low,
            day_change_pct, asof_ts, source, label, stream_seq, raw_json)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 1, %s)
           ON DUPLICATE KEY UPDATE
             mid = VALUES(mid),
             bid = VALUES(bid),
             ask = VALUES(ask),
             last_trade = VALUES(last_trade),
             prev_close = VALUES(prev_close),
             day_open = VALUES(day_open),
             day_high = VALUES(day_high),
             day_low = VALUES(day_low),
             day_change_pct = VALUES(day_change_pct),
             asof_ts = VALUES(asof_ts),
             source = VALUES(source),
             label = VALUES(label),
             stream_seq = stream_seq + 1,
             raw_json = VALUES(raw_json)""",
        (
            symbol,
            float(mid),
            float(bid) if bid is not None else None,
            float(ask) if ask is not None else None,
            float(last_trade) if last_trade is not None else None,
            float(prev_close) if prev_close is not None else None,
            float(day_open) if day_open is not None else None,
            float(day_high) if day_high is not None else None,
            float(day_low) if day_low is not None else None,
            day_change_pct,
            asof,
            source[:64],
            label[:128],
            json.dumps(raw) if raw is not None else None,
        ),
    )


def get_live_mark(cur, symbol: str) -> dict[str, Any] | None:
    symbol = (symbol or "").strip().upper()
    cur.execute(
        """SELECT symbol, mid, bid, ask, last_trade, prev_close, day_open, day_high,
                  day_low, day_change_pct, asof_ts, source, label, stream_seq
           FROM market_live_marks WHERE symbol = %s""",
        (symbol,),
    )
    r = cur.fetchone()
    if not r:
        return None
    asof = r["asof_ts"]
    age_s = None
    if asof is not None:
        if getattr(asof, "tzinfo", None) is None:
            asof_aware = asof.replace(tzinfo=timezone.utc)
        else:
            asof_aware = asof
        age_s = (_now() - asof_aware).total_seconds()
    return {
        "symbol": r["symbol"],
        "mid": float(r["mid"]),
        "bid": float(r["bid"]) if r.get("bid") is not None else None,
        "ask": float(r["ask"]) if r.get("ask") is not None else None,
        "last_trade": float(r["last_trade"]) if r.get("last_trade") is not None else None,
        "prev_close": float(r["prev_close"]) if r.get("prev_close") is not None else None,
        "day_open": float(r["day_open"]) if r.get("day_open") is not None else None,
        "day_high": float(r["day_high"]) if r.get("day_high") is not None else None,
        "day_low": float(r["day_low"]) if r.get("day_low") is not None else None,
        "day_change_pct": float(r["day_change_pct"])
        if r.get("day_change_pct") is not None
        else None,
        "asof": asof.isoformat().replace("+00:00", "Z")
        if hasattr(asof, "isoformat")
        else str(asof),
        "age_seconds": age_s,
        "stale": age_s is not None and age_s > stale_seconds(),
        "source": r["source"],
        "label": r["label"],
        "stream_seq": int(r["stream_seq"] or 0),
    }


def list_live_marks(cur) -> list[dict[str, Any]]:
    cur.execute(
        """SELECT symbol, mid, bid, ask, last_trade, asof_ts, source, label, stream_seq
           FROM market_live_marks ORDER BY symbol ASC"""
    )
    out = []
    for r in cur.fetchall():
        m = get_live_mark(cur, r["symbol"])
        if m:
            out.append(m)
    return out


def set_heartbeat(
    cur,
    *,
    status: str,
    symbols: list[str] | None = None,
    poll_interval_s: int | None = None,
    error: str | None = None,
    touch_ok: bool = False,
) -> None:
    """Update stream heartbeat. touch_ok=True sets last_ok_at to now."""
    err_val = (error or "")[:512] if error else None
    cur.execute(
        """INSERT INTO market_stream_heartbeat
           (id, status, last_ok_at, last_error, symbols_json, poll_interval_s)
           VALUES (1, %s, %s, %s, %s, %s)
           ON DUPLICATE KEY UPDATE
             status = VALUES(status),
             last_error = VALUES(last_error),
             symbols_json = COALESCE(VALUES(symbols_json), symbols_json),
             poll_interval_s = COALESCE(VALUES(poll_interval_s), poll_interval_s)""",
        (
            status,
            _now() if touch_ok else None,
            err_val,
            json.dumps(symbols) if symbols is not None else None,
            poll_interval_s,
        ),
    )
    if touch_ok:
        cur.execute(
            """UPDATE market_stream_heartbeat
               SET last_ok_at = %s, last_error = NULL, status = %s WHERE id = 1""",
            (_now(), status),
        )
    elif error:
        cur.execute(
            """UPDATE market_stream_heartbeat
               SET last_error = %s, status = %s WHERE id = 1""",
            (err_val, status),
        )


def get_heartbeat(cur) -> dict[str, Any]:
    try:
        cur.execute("SELECT * FROM market_stream_heartbeat WHERE id = 1")
        r = cur.fetchone()
    except Exception:
        return {
            "status": "unknown",
            "last_ok_at": None,
            "last_error": "heartbeat table missing",
            "symbols": [],
            "poll_interval_s": None,
            "stale_seconds_policy": stale_seconds(),
        }
    if not r:
        return {
            "status": "stopped",
            "last_ok_at": None,
            "last_error": None,
            "symbols": [],
            "poll_interval_s": None,
            "stale_seconds_policy": stale_seconds(),
        }
    symbols = r.get("symbols_json")
    if isinstance(symbols, str):
        try:
            symbols = json.loads(symbols)
        except json.JSONDecodeError:
            symbols = []
    last_ok = r.get("last_ok_at")
    age = None
    if last_ok is not None:
        if getattr(last_ok, "tzinfo", None) is None:
            last_ok_a = last_ok.replace(tzinfo=timezone.utc)
        else:
            last_ok_a = last_ok
        age = (_now() - last_ok_a).total_seconds()
    return {
        "status": r["status"],
        "last_ok_at": last_ok.isoformat().replace("+00:00", "Z")
        if last_ok and hasattr(last_ok, "isoformat")
        else (str(last_ok) if last_ok else None),
        "last_ok_age_seconds": age,
        "last_error": r.get("last_error"),
        "symbols": symbols or [],
        "poll_interval_s": int(r["poll_interval_s"])
        if r.get("poll_interval_s") is not None
        else None,
        "stale_seconds_policy": stale_seconds(),
        "live_marks_required": live_marks_required(),
        "shared": True,
        "note": "One stream for all members — not per-member sockets",
    }


def stream_status_payload(cur) -> dict[str, Any]:
    hb = get_heartbeat(cur)
    marks = list_live_marks(cur)
    universe = list_universe(cur, enabled_only=True)
    return {
        "heartbeat": hb,
        "universe": universe,
        "marks": marks,
        "mark_count": len(marks),
        "fresh_count": sum(1 for m in marks if not m.get("stale")),
        "stale_count": sum(1 for m in marks if m.get("stale")),
        "vol_reference": vol_reference(cur),
        "asof": _now_iso(),
    }


KIND_ORDER = ("index", "etf", "equity")
KIND_LABELS = {
    "index": "Indexes",
    "etf": "ETFs",
    "equity": "Stocks",
}


def symbol_catalog(cur, *, tradeable_only: bool = False) -> dict[str, Any]:
    """All enabled universe symbols with marks, grouped by type for Curate pickers."""
    universe = list_universe(cur, enabled_only=True)
    marks_by = {m["symbol"]: m for m in list_live_marks(cur)}
    groups: dict[str, list[dict[str, Any]]] = {k: [] for k in KIND_ORDER}
    items: list[dict[str, Any]] = []

    for u in universe:
        role = u.get("role") or "tradeable"
        if tradeable_only and role != "tradeable":
            continue
        kind = (u.get("kind") or "equity").lower()
        if kind not in groups:
            groups[kind] = []
        mark = marks_by.get(u["symbol"])
        row = {
            "symbol": u["symbol"],
            "kind": kind,
            "kind_label": KIND_LABELS.get(kind, kind.title()),
            "role": role,
            "feed_symbol": u.get("feed_symbol"),
            "proxy_symbol": u.get("proxy_symbol"),
            "note": u.get("note"),
            "options_cadence": u.get("options_cadence"),
            "sort_order": u.get("sort_order"),
            "mark": mark,
            "mid": mark["mid"] if mark else None,
            "prev_close": mark.get("prev_close") if mark else None,
            "day_change_pct": mark.get("day_change_pct") if mark else None,
            "stale": mark.get("stale") if mark else None,
            "source": mark.get("source") if mark else None,
            "is_proxy": bool(mark and "proxy" in str(mark.get("source") or "").lower()),
            "href": f"/app/strategy-lab/symbols/{u['symbol']}",
        }
        groups[kind].append(row)
        items.append(row)

    ordered_groups = []
    for k in KIND_ORDER:
        if groups.get(k):
            ordered_groups.append(
                {
                    "kind": k,
                    "label": KIND_LABELS.get(k, k.title()),
                    "symbols": groups[k],
                }
            )
    for k, rows in groups.items():
        if k not in KIND_ORDER and rows:
            ordered_groups.append(
                {"kind": k, "label": KIND_LABELS.get(k, k.title()), "symbols": rows}
            )

    return {
        "groups": ordered_groups,
        "symbols": items,
        "tradeable_only": tradeable_only,
        "count": len(items),
        "asof": _now_iso(),
        "vol_reference": vol_reference(cur),
    }


def symbol_detail(cur, symbol: str) -> dict[str, Any] | None:
    """Full info page payload for one universe symbol."""
    symbol = (symbol or "").strip().upper()
    if not symbol:
        return None
    universe = list_universe(cur, enabled_only=False)
    u = next((x for x in universe if x["symbol"] == symbol), None)
    if u is None:
        return None
    mark = get_live_mark(cur, symbol)
    kind = (u.get("kind") or "equity").lower()
    role = u.get("role") or "tradeable"
    return {
        "symbol": symbol,
        "kind": kind,
        "kind_label": KIND_LABELS.get(kind, kind.title()),
        "role": role,
        "feed_symbol": u.get("feed_symbol"),
        "proxy_symbol": u.get("proxy_symbol"),
        "note": u.get("note"),
        "options_cadence": u.get("options_cadence"),
        "enabled": u.get("enabled", True),
        "mark": mark,
        "mid": mark["mid"] if mark else None,
        "prev_close": mark.get("prev_close") if mark else None,
        "day_change_pct": mark.get("day_change_pct") if mark else None,
        "day_open": mark.get("day_open") if mark else None,
        "day_high": mark.get("day_high") if mark else None,
        "day_low": mark.get("day_low") if mark else None,
        "stale": mark.get("stale") if mark else None,
        "source": mark.get("source") if mark else None,
        "label": mark.get("label") if mark else None,
        "is_proxy": bool(mark and "proxy" in str(mark.get("source") or "").lower()),
        "asof": mark.get("asof") if mark else None,
        "age_seconds": mark.get("age_seconds") if mark else None,
        "can_scan_open": role == "tradeable",
        "vol_context": vol_reference(cur) if kind == "index" or symbol in ("VIX", "VIX1D") else None,
        "related": [
            x["symbol"]
            for x in universe
            if x.get("enabled")
            and x["symbol"] != symbol
            and (x.get("kind") or "").lower() == kind
        ][:12],
        "info": {
            "shared_stream": True,
            "usage": (
                "Reference for regime / decisions"
                if role == "reference"
                else "Available as Curate scan underlier for sim packages"
            ),
            "honesty": (
                "Marks come from the shared live stream (all members). "
                "Proxy sources are labeled — not silent."
            ),
        },
        "asof_page": _now_iso(),
    }


def is_tradeable_symbol(cur, symbol: str) -> bool:
    symbol = (symbol or "").strip().upper()
    for u in list_universe(cur, enabled_only=True):
        if u["symbol"] == symbol and (u.get("role") or "tradeable") == "tradeable":
            return True
    return False


def vol_reference(cur) -> dict[str, Any]:
    """VIX + Daily VIX (VIX1D) for strategy decisions — shared across members.

    Each entry: mid (live or proxy), prev_close (daily reference), day_change_pct,
    source/label honesty.
    """
    out: dict[str, Any] = {
        "vix": get_live_mark(cur, "VIX"),
        "vix1d": get_live_mark(cur, "VIX1D"),
        "note": (
            "VIX = 30-day IV regime; VIX1D = Daily VIX (1-day IV) for 0DTE/daily decisions. "
            "prev_close is prior session reference. Proxy sources are labeled — not true index."
        ),
        "decision_hints": {
            "vix_mid": "Use for regime / size / structure width context",
            "vix_prev_close": "Daily reference — change vs yesterday",
            "vix1d_mid": "Daily/0DTE vol pressure (when true feed available)",
            "vix1d_prev_close": "Prior day Daily VIX reference",
        },
    }
    # Convenience flat fields for bots
    for key, mark in (("vix", out["vix"]), ("vix1d", out["vix1d"])):
        if mark:
            out[f"{key}_mid"] = mark["mid"]
            out[f"{key}_prev_close"] = mark.get("prev_close")
            out[f"{key}_day_change_pct"] = mark.get("day_change_pct")
            out[f"{key}_source"] = mark.get("source")
            out[f"{key}_is_proxy"] = "proxy" in str(mark.get("source") or "").lower()
        else:
            out[f"{key}_mid"] = None
            out[f"{key}_prev_close"] = None
            out[f"{key}_day_change_pct"] = None
            out[f"{key}_source"] = None
            out[f"{key}_is_proxy"] = None
    return out
