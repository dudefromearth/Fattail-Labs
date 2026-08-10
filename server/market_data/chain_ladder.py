"""SPX (or underlier) vertical chain ladder — simple, no heatmap pipeline.

Fetch Massive option snapshot ±σ band of spot, one expiry, group by strike.
Content hash lets the UI update **data only** when results change (no page reload).
"""

from __future__ import annotations

import hashlib
import json
import math
import time
from datetime import date, datetime, timezone
from typing import Any


# Display columns (right of strike) — 7 fields
LADDER_FIELDS = (
    "mid",
    "bid",
    "ask",
    "volume",
    "open_interest",
    "delta",
    "iv",
)


def _f(v: Any) -> float | None:
    if v is None or v == "":
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _i(v: Any) -> int | None:
    if v is None or v == "":
        return None
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return None


def content_hash(payload: dict[str, Any]) -> str:
    """Stable hash of ladder rows + spot (ignore fetch timestamps for equality)."""
    core = {
        "underlier": payload.get("underlier"),
        "expiration": payload.get("expiration"),
        "side": payload.get("side"),
        "spot": payload.get("spot"),
        "rows": payload.get("rows") or [],
    }
    raw = json.dumps(core, sort_keys=True, default=str, separators=(",", ":"))
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:16]


def is_proxy_mark_source(source: str | None) -> bool:
    """True when marks mid must not be used as native index/vol (Arch/18)."""
    s = (source or "").strip().lower()
    if not s:
        return False
    if "proxy" in s:
        return True
    if s in ("massive_proxy_v1", "proxy", "etf_proxy"):
        return True
    return False


def sigma_band_points(
    spot: float,
    *,
    vol_pct: float | None,
    dte: int,
    sigma: float = 2.0,
) -> float:
    """Strike half-width (points) for ±sigma of expected move over DTE.

    vol_pct: annualized vol in percent points (e.g. 14.2 for 14.2% IV) —
    **never** an ETF dollar price. Caller must refuse proxy VIXY marks (OC5a).

    em ≈ spot × (vol_pct/100) × √(effective_days/252); band = sigma × em.
    effective_days = max(1, dte) so 0DTE never collapses to zero width.
    Fallback if no usable vol: 3% of spot × √days × (sigma/2).
    """
    spot = float(spot)
    if spot <= 0:
        raise ValueError("spot must be positive")
    sigma = float(sigma)
    if sigma <= 0:
        raise ValueError("sigma must be positive")
    days = max(1, int(dte))  # OC5a: never √0
    if vol_pct is not None and vol_pct > 0:
        em = spot * (float(vol_pct) / 100.0) * math.sqrt(days / 252.0)
        return max(spot * 0.005, sigma * em)  # floor ~0.5% of spot
    return spot * 0.03 * math.sqrt(days) * (sigma / 2.0)


def extract_chain_underlying_price(raw_contracts: list[dict[str, Any]]) -> float | None:
    """Prefer Massive snapshot underlying (correct index scale) — OC2."""
    for row in raw_contracts:
        ua = row.get("underlying_asset")
        if isinstance(ua, dict):
            for key in ("value", "price", "last"):
                px = ua.get(key)
                if px is not None:
                    try:
                        v = float(px)
                        if v > 0:
                            return v
                    except (TypeError, ValueError):
                        pass
        und = row.get("underlying")
        if isinstance(und, dict):
            for key in ("price", "value", "last"):
                px = und.get(key)
                if px is not None:
                    try:
                        v = float(px)
                        if v > 0:
                            return v
                    except (TypeError, ValueError):
                        pass
    return None


def _contract_side(row: dict[str, Any]) -> str | None:
    details = row.get("details") or {}
    t = (details.get("contract_type") or details.get("option_type") or "").lower()
    if t in ("call", "c"):
        return "call"
    if t in ("put", "p"):
        return "put"
    ticker = str(details.get("ticker") or row.get("ticker") or "")
    # OCC-style ...C00... / ...P00...
    for i, ch in enumerate(ticker):
        if ch in ("C", "P") and i + 1 < len(ticker) and ticker[i + 1].isdigit():
            return "call" if ch == "C" else "put"
    return None


def _normalize_contract(row: dict[str, Any]) -> dict[str, Any] | None:
    details = row.get("details") or {}
    quote = row.get("last_quote") or {}
    greeks = row.get("greeks") or {}
    day = row.get("day") or {}

    strike = _f(details.get("strike_price"))
    if strike is None:
        return None
    side = _contract_side(row)
    if side is None:
        return None
    exp = details.get("expiration_date")
    if not exp:
        return None

    bid = _f(quote.get("bid") if quote else None) or _f(row.get("bid"))
    ask = _f(quote.get("ask") if quote else None) or _f(row.get("ask"))
    mid = _f(quote.get("midpoint") or quote.get("mid"))
    if mid is None and bid is not None and ask is not None:
        mid = (bid + ask) / 2.0
    last = _f(quote.get("last")) or _f(row.get("last"))
    if mid is None:
        mid = last

    vol = _i(day.get("volume") if isinstance(day, dict) else None)
    if vol is None:
        vol = _i(row.get("volume"))

    return {
        "strike": strike,
        "side": side,
        "expiration": str(exp)[:10],
        "ticker": details.get("ticker") or row.get("ticker"),
        "mid": mid,
        "bid": bid,
        "ask": ask,
        "last": last,
        "volume": vol,
        "open_interest": _i(row.get("open_interest")),
        "delta": _f(greeks.get("delta")),
        "gamma": _f(greeks.get("gamma")),
        "theta": _f(greeks.get("theta")),
        "vega": _f(greeks.get("vega")),
        "iv": _f(row.get("implied_volatility")),
    }


def build_ladder(
    raw_contracts: list[dict[str, Any]],
    *,
    underlier: str,
    spot: float,
    expiration: str,
    side: str = "call",
    band: float,
    sigma: float,
    vix: float | None,
    dte: int,
) -> dict[str, Any]:
    """Filter ±band around spot, one side, vertical strike order."""
    side = (side or "call").strip().lower()
    if side not in ("call", "put"):
        raise ValueError("side must be call|put")
    exp = str(expiration)[:10]
    lo = float(spot) - float(band)
    hi = float(spot) + float(band)

    by_strike: dict[float, dict[str, Any]] = {}
    for raw in raw_contracts:
        n = _normalize_contract(raw)
        if not n:
            continue
        if n["expiration"] != exp:
            continue
        if n["side"] != side:
            continue
        k = float(n["strike"])
        if k < lo or k > hi:
            continue
        by_strike[k] = n

    strikes = sorted(by_strike.keys())
    # Nearest strike to spot for highlight
    spot_strike = None
    if strikes:
        spot_strike = min(strikes, key=lambda s: abs(s - float(spot)))

    rows = []
    for k in strikes:
        c = by_strike[k]
        rows.append(
            {
                "strike": k,
                "is_spot": spot_strike is not None and k == spot_strike,
                "ticker": c.get("ticker"),
                "mid": c.get("mid"),
                "bid": c.get("bid"),
                "ask": c.get("ask"),
                "volume": c.get("volume"),
                "open_interest": c.get("open_interest"),
                "delta": c.get("delta"),
                "gamma": c.get("gamma"),
                "theta": c.get("theta"),
                "vega": c.get("vega"),
                "iv": c.get("iv"),
            }
        )

    payload = {
        "underlier": underlier,
        "expiration": exp,
        "side": side,
        "spot": float(spot),
        "vix": vix,
        "dte": int(dte),
        "sigma": float(sigma),
        "band": float(band),
        "strike_lo": lo,
        "strike_hi": hi,
        "spot_strike": spot_strike,
        "fields": list(LADDER_FIELDS),
        "rows": rows,
        "row_count": len(rows),
        "as_of": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "fetched_at_unix": time.time(),
    }
    payload["content_hash"] = content_hash(payload)
    return payload


def dte_from_expiration(expiration: str, *, today: date | None = None) -> int:
    today = today or date.today()
    exp = date.fromisoformat(str(expiration)[:10])
    return max(0, (exp - today).days)


def _row_signature(row: dict[str, Any]) -> str:
    """Compare only market fields that should trigger a cell update."""
    parts = [
        row.get("mid"),
        row.get("bid"),
        row.get("ask"),
        row.get("volume"),
        row.get("open_interest"),
        row.get("delta"),
        row.get("gamma"),
        row.get("theta"),
        row.get("vega"),
        row.get("iv"),
        row.get("ticker"),
        bool(row.get("is_spot")),
    ]
    return json.dumps(parts, default=str, separators=(",", ":"))


def diff_ladder(
    prev: dict[str, Any] | None,
    nxt: dict[str, Any],
) -> dict[str, Any]:
    """Row-level patch: only strikes whose market fields changed.

    Does **not** re-send the full chain. UI applies upserts/removes in place.
    """
    if not prev or not isinstance(prev.get("rows"), list):
        return {
            "mode": "full",
            "ladder": nxt,
            "content_hash": nxt.get("content_hash"),
        }

    # Same market content → nothing to patch (ignore as_of clock)
    if prev.get("content_hash") and prev.get("content_hash") == nxt.get("content_hash"):
        return {
            "mode": "unchanged",
            "content_hash": nxt.get("content_hash"),
            "as_of": nxt.get("as_of"),
        }

    prev_by = {float(r["strike"]): r for r in (prev.get("rows") or []) if r.get("strike") is not None}
    next_by = {float(r["strike"]): r for r in (nxt.get("rows") or []) if r.get("strike") is not None}

    upserts: list[dict[str, Any]] = []
    for strike, row in next_by.items():
        old = prev_by.get(strike)
        if old is None or _row_signature(old) != _row_signature(row):
            upserts.append(row)

    removes = sorted(s for s in prev_by.keys() if s not in next_by)

    meta_changed = {
        "spot": prev.get("spot") != nxt.get("spot"),
        "vix": prev.get("vix") != nxt.get("vix"),
        "band": prev.get("band") != nxt.get("band"),
        "spot_strike": prev.get("spot_strike") != nxt.get("spot_strike"),
        "strike_lo": prev.get("strike_lo") != nxt.get("strike_lo"),
        "strike_hi": prev.get("strike_hi") != nxt.get("strike_hi"),
    }

    # Nothing market-visible changed
    if (
        not upserts
        and not removes
        and not any(meta_changed.values())
        and prev.get("content_hash") == nxt.get("content_hash")
    ):
        return {
            "mode": "unchanged",
            "content_hash": nxt.get("content_hash"),
            "as_of": nxt.get("as_of"),
        }

    return {
        "mode": "diff",
        "content_hash": nxt.get("content_hash"),
        "as_of": nxt.get("as_of"),
        "fetched_at_unix": nxt.get("fetched_at_unix"),
        "underlier": nxt.get("underlier"),
        "expiration": nxt.get("expiration"),
        "side": nxt.get("side"),
        "fields": nxt.get("fields"),
        "sigma": nxt.get("sigma"),
        "dte": nxt.get("dte"),
        "row_count": nxt.get("row_count"),
        # meta always included when diff so spot highlight can move
        "spot": nxt.get("spot"),
        "vix": nxt.get("vix"),
        "band": nxt.get("band"),
        "strike_lo": nxt.get("strike_lo"),
        "strike_hi": nxt.get("strike_hi"),
        "spot_strike": nxt.get("spot_strike"),
        "upserts": upserts,
        "removes": removes,
        "changed_strike_count": len(upserts),
        "removed_strike_count": len(removes),
        "meta_changed": meta_changed,
    }
