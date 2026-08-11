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
    via_proxy = bool(
        doc.get("via_proxy")
        or doc.get("mid_is_proxy")
        or "proxy" in source.lower()
    )
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
        "via_proxy": via_proxy,
        "mid_is_proxy": via_proxy,
        "feed_used": doc.get("feed_used"),
        "proxy_mid": float(doc["proxy_mid"])
        if doc.get("proxy_mid") is not None
        else (mid_f if via_proxy else None),
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
                raw = m.get("raw") if isinstance(m.get("raw"), dict) else {}
                # get_live_mark may not parse raw_json — load via source/label
                via = "proxy" in str(m.get("source") or "").lower() or "PROXY" in str(
                    m.get("label") or ""
                )
                if isinstance(raw, dict):
                    via = via or bool(raw.get("via_proxy") or raw.get("mid_is_proxy"))
                    m["feed_used"] = raw.get("feed_used")
                    m["proxy_mid"] = raw.get("proxy_mid")
                m["via_proxy"] = via
                m["mid_is_proxy"] = via
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


def write_bus_sym(product: str, mark: dict[str, Any]) -> None:
    """Publish underlier mark to Redis mb:sym (best-effort)."""
    try:
        from market_data.market_bus.config import bus_enabled
        from market_data.market_bus.store import get_store

        if not bus_enabled():
            return
        store = get_store()
        if store is None:
            return
        mid = mark.get("mid")
        if mid is None:
            return
        via = bool(mark.get("via_proxy") or mark.get("mid_is_proxy"))
        doc = {
            "symbol": product.upper(),
            "mid": float(mid),
            "bid": mark.get("bid"),
            "ask": mark.get("ask"),
            "prev_close": mark.get("prev_close"),
            "source": mark.get("source") or "mb:sym",
            "label": mark.get("label") or "Market Bus underlier mark",
            "via_proxy": via,
            "mid_is_proxy": via,
            "feed_used": mark.get("feed_used"),
            "proxy_mid": mark.get("proxy_mid") or (float(mid) if via else None),
            "ts": time.time(),
            "seq": int(time.time() * 1000),
        }
        store.set_json(f"mb:sym:{product.upper()}", doc, ttl_s=60.0)
    except Exception:
        pass


def ensure_fresh_underlier_marks(
    cur,
    symbols: list[str],
    *,
    max_age_s: float = 45.0,
    max_fetch: int = 40,
) -> dict[str, Any]:
    """Refresh missing/stale underliers from Massive; write MySQL + bus.

    Called from Positions valuation and universe list so live UIs are not
    stuck on a frozen MySQL row when live_stream/sym_feed is down.

    Returns summary: {refreshed: [...], skipped: [...], errors: [...]}
    """
    from market_data.live_stream import _fetch_for_row
    from market_data.massive_client import MassiveClient, MassiveClientError

    want: list[str] = []
    seen: set[str] = set()
    for s in symbols:
        s = (s or "").strip().upper()
        if not s or s in seen:
            continue
        seen.add(s)
        m = get_underlier_mark(s, cur=cur)
        age = m.get("age_seconds") if m else None
        if m is None or m.get("stale") or (age is not None and float(age) > max_age_s):
            want.append(s)
    want = want[: max(1, int(max_fetch))]
    if not want:
        return {"refreshed": [], "skipped": list(seen), "errors": []}

    # Universe rows for feed/proxy resolution
    by_sym: dict[str, dict[str, Any]] = {}
    try:
        for u in lm.list_universe(cur, enabled_only=False):
            by_sym[str(u.get("symbol") or "").upper()] = u
    except Exception:
        pass

    refreshed: list[str] = []
    errors: list[str] = []
    try:
        client = MassiveClient()
    except Exception as exc:
        return {
            "refreshed": [],
            "skipped": [s for s in seen if s not in want],
            "errors": [f"MassiveClient: {exc}"],
        }

    for product in want:
        row = by_sym.get(product) or {
            "symbol": product,
            "feed_symbol": None,
            "proxy_symbol": None,
            "kind": "equity",
            "role": "tradeable",
        }
        try:
            m = _fetch_for_row(client, row)
            via_proxy = bool(m.get("via_proxy"))
            source = "massive_proxy_v1" if via_proxy else "massive_on_demand_v1"
            if via_proxy:
                label = (
                    f"On-demand PROXY {m.get('feed_used')}→{product}"
                )[:128]
            else:
                label = "On-demand underlier mark (Positions/universe)"
            prev_sym = str(m.get("feed_used") or product)
            prev = None
            try:
                prev = client.fetch_prev_day(prev_sym)
            except Exception:
                prev = None
            asof = datetime.now(timezone.utc)
            lm.upsert_mark(
                cur,
                symbol=product,
                mid=m["mid"],
                bid=m.get("bid"),
                ask=m.get("ask"),
                last_trade=m.get("last_trade"),
                source=source,
                label=label,
                asof=asof,
                prev_close=prev.get("close") if prev else None,
                day_open=prev.get("open") if prev else None,
                day_high=prev.get("high") if prev else None,
                day_low=prev.get("low") if prev else None,
                raw={
                    "feed_used": m.get("feed_used"),
                    "via_proxy": via_proxy,
                    "prev_day": prev,
                },
            )
            write_bus_sym(
                product,
                {
                    "mid": m["mid"],
                    "bid": m.get("bid"),
                    "ask": m.get("ask"),
                    "prev_close": prev.get("close") if prev else None,
                    "source": source,
                    "label": label,
                },
            )
            refreshed.append(product)
        except MassiveClientError as exc:
            errors.append(f"{product}: {exc}")
        except Exception as exc:
            errors.append(f"{product}: {exc}")

    if refreshed:
        try:
            lm.set_heartbeat(
                cur,
                status="running",
                symbols=refreshed,
                touch_ok=True,
            )
        except Exception:
            pass

    return {
        "refreshed": refreshed,
        "skipped": [s for s in seen if s not in want],
        "errors": errors,
    }
