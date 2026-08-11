"""Bus-first underlier marks (Market Bus Universal Adoption Plan §B).

Priority:
  1. Redis ``mb:sym:{PRODUCT}`` (sym_feed)
  2. MySQL ``market_live_marks`` (Arch/18 dual-write / live_stream fallback)
  3. None (caller fails loud or degrades)

Never invent mids. Proxy sources are labeled (MB8).
"""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any

from market_data import live_marks as lm


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _from_bus_doc(product: str, doc: dict[str, Any]) -> dict[str, Any] | None:
    mid = doc.get("mid")
    if mid is None:
        return None
    try:
        mid_f = float(mid)
    except (TypeError, ValueError):
        return None
    if mid_f <= 0:
        return None
    ts = doc.get("ts")
    age_s = None
    asof = doc.get("as_of") or doc.get("asof")
    if isinstance(ts, (int, float)):
        age_s = max(0.0, time.time() - float(ts))
        asof = asof or datetime.fromtimestamp(float(ts), tz=timezone.utc).isoformat().replace(
            "+00:00", "Z"
        )
    source = str(doc.get("source") or "mb:sym")
    label = str(doc.get("label") or "Market Bus underlier mark")
    if "proxy" in source.lower():
        label = doc.get("label") or f"Proxy underlier mark ({source})"
    stale = False
    try:
        stale = age_s is not None and age_s > float(lm.stale_seconds())
    except Exception:
        stale = False
    return {
        "symbol": product,
        "mid": mid_f,
        "bid": float(doc["bid"]) if doc.get("bid") is not None else None,
        "ask": float(doc["ask"]) if doc.get("ask") is not None else None,
        "last_trade": float(doc["last"]) if doc.get("last") is not None else None,
        "prev_close": float(doc["prev_close"]) if doc.get("prev_close") is not None else None,
        "day_change_pct": float(doc["day_change_pct"])
        if doc.get("day_change_pct") is not None
        else None,
        "asof": asof or _now_iso(),
        "age_seconds": age_s,
        "stale": stale,
        "source": source,
        "label": label,
        "plane": "mb:sym",
        "stream_seq": int(doc.get("seq") or 0),
    }


def get_underlier_mark(
    product: str,
    *,
    cur=None,
) -> dict[str, Any] | None:
    """Return normalized underlier mark or None.

    ``cur`` optional — required for MySQL fallback.
    """
    sym = (product or "").strip().upper()
    if not sym:
        return None

    # 1) Market Bus
    try:
        from market_data.market_bus.config import bus_enabled
        from market_data.market_bus.store import get_store

        if bus_enabled():
            store = get_store()
            if store is not None:
                doc = store.get_json(f"mb:sym:{sym}")
                if isinstance(doc, dict):
                    m = _from_bus_doc(sym, doc)
                    if m is not None:
                        return m
    except Exception:
        pass

    # 2) MySQL dual-write / live_stream
    if cur is not None:
        try:
            m = lm.get_live_mark(cur, sym)
            if m is not None:
                m = dict(m)
                m["plane"] = "mysql"
                return m
        except Exception:
            return None
    return None


def list_underlier_marks(cur, symbols: list[str] | None = None) -> list[dict[str, Any]]:
    """Bus-first marks for universe (or explicit symbol list)."""
    if symbols is None:
        try:
            universe = lm.list_universe(cur, enabled_only=True)
            symbols = [str(u.get("symbol") or "").upper() for u in universe if u.get("symbol")]
        except Exception:
            symbols = []
    out: list[dict[str, Any]] = []
    seen: set[str] = set()
    for s in symbols:
        s = (s or "").strip().upper()
        if not s or s in seen:
            continue
        seen.add(s)
        m = get_underlier_mark(s, cur=cur)
        if m:
            out.append(m)
    return out


def dual_write_mysql_from_bus_doc(cur, product: str, doc: dict[str, Any]) -> None:
    """O2 dual-write: mirror bus mark into market_live_marks (temporary)."""
    mid = doc.get("mid")
    if mid is None:
        return
    try:
        mid_f = float(mid)
    except (TypeError, ValueError):
        return
    source = str(doc.get("source") or "mb:sym")[:64]
    label = str(doc.get("label") or "Market Bus dual-write")[:128]
    asof = None
    ts = doc.get("ts")
    if isinstance(ts, (int, float)):
        asof = datetime.fromtimestamp(float(ts), tz=timezone.utc)
    try:
        lm.upsert_mark(
            cur,
            symbol=product,
            mid=mid_f,
            bid=float(doc["bid"]) if doc.get("bid") is not None else None,
            ask=float(doc["ask"]) if doc.get("ask") is not None else None,
            last_trade=float(doc["last"]) if doc.get("last") is not None else None,
            prev_close=float(doc["prev_close"]) if doc.get("prev_close") is not None else None,
            asof=asof,
            source=source,
            label=label,
            raw=doc,
        )
    except Exception:
        # Dual-write must not break the feed loop
        pass
