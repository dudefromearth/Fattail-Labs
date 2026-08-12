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
    """Stable hash of ladder rows + spot (ignore fetch timestamps for equality).

    HM15/HM16: when dual_side, view ``side`` is not part of the hash — both
    books are already in rows; Calls/Puts is a client filter only.
    """
    dual = bool(payload.get("dual_side", False))
    core = {
        "underlier": payload.get("underlier"),
        "expiration": payload.get("expiration"),
        "dual_side": dual,
        "spot": payload.get("spot"),
        "rows": payload.get("rows") or [],
    }
    if not dual:
        core["side"] = payload.get("side")
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


# Massive Option Chain Snapshot: max limit is 250 contracts per page.
MASSIVE_PAGE_LIMIT = 250
MAX_STRIKES_PER_DTE = MASSIVE_PAGE_LIMIT  # one side, one expiry (per DTE)

# Broker-style wing count: N **listed** strikes above *and* below ATM.
# Includes fractional listings (e.g. AAPL 302.50). 2×100+1 ≤ 250 page.
STRIKE_WING_CHOICES = (10, 25, 50, 100)
DEFAULT_STRIKE_WINGS = 25


def infer_listed_step(strikes: list[float], spot: float) -> float | None:
    """Smallest positive gap among strikes near spot (e.g. 2.5 for AAPL, 5 for SPX)."""
    xs = sorted({float(s) for s in strikes if s is not None})
    if len(xs) < 2:
        return None
    # Prefer gaps within ~8% of spot (or ±40 pts floor) so far OTM $5/$10 don't dominate
    radius = max(40.0, abs(float(spot)) * 0.08) if spot else 40.0
    near = [k for k in xs if abs(k - float(spot)) <= radius] or xs
    gaps = [near[i + 1] - near[i] for i in range(len(near) - 1) if near[i + 1] > near[i]]
    if not gaps:
        return None
    return float(min(gaps))


def select_listed_wing_window(
    strikes: list[float],
    spot: float,
    wings: int,
) -> tuple[float, float, float, float, int]:
    """Pick ±``wings`` **listed** strikes around ATM (fractional OK).

    Returns ``(band, lo, hi, atm, listed_count)``.
    """
    wings = int(wings)
    if wings < 1:
        raise ValueError("wings must be >= 1")
    max_wings = (MAX_STRIKES_PER_DTE - 1) // 2
    if wings > max_wings:
        wings = max_wings
    xs = sorted({float(s) for s in strikes if s is not None})
    if not xs:
        raise ValueError("no listed strikes")
    spot = float(spot)
    atm = min(xs, key=lambda k: abs(k - spot))
    i = xs.index(atm)
    lo_i = max(0, i - wings)
    hi_i = min(len(xs) - 1, i + wings)
    lo = xs[lo_i]
    hi = xs[hi_i]
    band = max(spot - lo, hi - spot)
    return band, lo, hi, atm, (hi_i - lo_i + 1)


def strike_window_from_wings(
    spot: float,
    *,
    step: float,
    wings: int,
) -> tuple[float, float, float, float]:
    """Dollar window from assumed grid step (fetch pre-filter only).

    Prefer ``select_listed_wing_window`` on real listings for the final ladder —
    equities list 0.5 / 1 / 2.5 / 5 intervals that a fixed $1 grid mis-counts.
    """
    spot = float(spot)
    step = float(step)
    wings = int(wings)
    if spot <= 0:
        raise ValueError("spot must be positive")
    if step <= 0:
        raise ValueError("step must be positive")
    if wings < 1:
        raise ValueError("wings must be >= 1")
    max_wings = (MAX_STRIKES_PER_DTE - 1) // 2
    if wings > max_wings:
        wings = max_wings
    atm = round(spot / step) * step
    lo = atm - wings * step
    hi = atm + wings * step
    band = max(spot - lo, hi - spot)
    return band, lo, hi, atm


def sigma_band_points(
    spot: float,
    *,
    vol_pct: float | None,
    dte: int,
    sigma: float = 2.5,
) -> float:
    """Legacy σ half-width (points). Ladder range uses strike wings instead."""
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


def clamp_band_to_max_strikes(
    spot: float,
    band: float,
    *,
    step: float,
    max_strikes: int = MAX_STRIKES_PER_DTE,
) -> tuple[float, float, float]:
    """Clamp half-width so strike count for one DTE/side is ≤ max_strikes."""
    spot = float(spot)
    band = float(band)
    step = float(step)
    if spot <= 0:
        raise ValueError("spot must be positive")
    if step <= 0:
        raise ValueError("step must be positive")
    if band < 0:
        raise ValueError("band must be non-negative")
    max_strikes = max(3, int(max_strikes))
    max_half_steps = (max_strikes - 1) // 2
    max_band = max_half_steps * step
    if band > max_band:
        band = max_band
    lo = math.floor((spot - band) / step) * step
    hi = math.ceil((spot + band) / step) * step
    while int(round((hi - lo) / step)) + 1 > max_strikes and hi > lo:
        if abs(hi - spot) >= abs(spot - lo):
            hi -= step
        else:
            lo += step
    return band, lo, hi


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


def _is_standard_contract(details: dict[str, Any], row: dict[str, Any]) -> bool:
    """HM19: keep standard 100-share contracts; drop adjusted/non-standard."""
    spc = details.get("shares_per_contract")
    if spc is not None:
        try:
            if int(float(spc)) != 100:
                return False
        except (TypeError, ValueError):
            return False
    # Some feeds flag adjustments
    for k in ("adjustment", "adjusted", "nonstandard", "is_adjusted"):
        v = details.get(k)
        if v is True or str(v).lower() in ("1", "true", "yes", "adjusted"):
            return False
    return True


def modal_strike_step(strikes: list[float]) -> float | None:
    """HM20: most common consecutive gap among distinct strikes in band."""
    s = sorted({round(float(x), 6) for x in strikes if x is not None})
    if len(s) < 2:
        return None
    counts: dict[float, int] = {}
    for i in range(1, len(s)):
        g = round(s[i] - s[i - 1], 6)
        if g > 0:
            counts[g] = counts.get(g, 0) + 1
    if not counts:
        return None
    return max(counts.items(), key=lambda kv: (kv[1], -kv[0]))[0]


def _row_key(side: str, strike: float) -> str:
    return f"{side}:{float(strike)}"


def _positive_px(v: Any) -> float | None:
    """Parse a price; treat missing/non-positive as no market (premarket zeros)."""
    x = _f(v)
    if x is None or x <= 0:
        return None
    return x


def _normalize_contract(row: dict[str, Any]) -> dict[str, Any] | None:
    """Normalize Massive option snapshot row → ladder contract.

    Premarket / extended-hours: Massive often returns last_quote bid=ask=midpoint=0
    while still publishing last_trade and day OHLC from the prior session.
    Live NBBO is preferred; otherwise held marks (last trade → day close) so
    analysis packages remain usable with an explicit mid_source for UI disclaimer.
    """
    details = row.get("details") or {}
    quote = row.get("last_quote") or {}
    greeks = row.get("greeks") or {}
    day = row.get("day") or {}
    last_trade = row.get("last_trade") or {}

    if not _is_standard_contract(details, row):
        return None

    strike = _f(details.get("strike_price"))
    if strike is None:
        return None
    side = _contract_side(row)
    if side is None:
        return None
    exp = details.get("expiration_date")
    if not exp:
        return None

    # Live NBBO — zeros mean "no book", not a free option
    bid = _positive_px(quote.get("bid") if quote else None) or _positive_px(
        row.get("bid")
    )
    ask = _positive_px(quote.get("ask") if quote else None) or _positive_px(
        row.get("ask")
    )
    mid = _positive_px(quote.get("midpoint") if quote else None) or _positive_px(
        quote.get("mid") if quote else None
    )
    mid_source: str | None = None
    if mid is not None:
        mid_source = "nbbo"
    elif bid is not None and ask is not None:
        mid = (bid + ask) / 2.0
        mid_source = "nbbo"

    # Last trade (Massive: last_trade.price) — prior print still present pre-open
    last = _positive_px(
        last_trade.get("price") if isinstance(last_trade, dict) else None
    ) or _positive_px(
        last_trade.get("p") if isinstance(last_trade, dict) else None
    )
    if last is None:
        last = _positive_px(quote.get("last") if quote else None) or _positive_px(
            row.get("last")
        )

    day_close = (
        _positive_px(day.get("close")) if isinstance(day, dict) else None
    )

    # Held / pre-open package mid — not live NBBO (UI must disclaimer)
    if mid is None and last is not None:
        mid = last
        mid_source = "last_trade"
    if mid is None and day_close is not None:
        mid = day_close
        mid_source = "day_close"

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
        "day_close": day_close,
        "mid_source": mid_source,
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
    vix: float | None,
    dte: int,
    strike_lo: float | None = None,
    strike_hi: float | None = None,
    wings: int | None = None,
    strike_step: float | None = None,
    sigma: float | None = None,
    dual_side: bool = True,
    excluded_adjusted_count: int = 0,
) -> dict[str, Any]:
    """Build ladder for strike window.

    **HM15:** When ``dual_side=True`` (default for Heatmap), both call and put
    standard contracts in the window are included. ``side`` is retained for
    view-filter consumers (rows filtered) and meta.
    """
    view_side = (side or "call").strip().lower()
    if view_side not in ("call", "put"):
        raise ValueError("side must be call|put")
    exp = str(expiration)[:10]
    if strike_lo is not None and strike_hi is not None:
        lo = float(strike_lo)
        hi = float(strike_hi)
    else:
        lo = float(spot) - float(band)
        hi = float(spot) + float(band)

    # key (side, strike) → contract; standard only via _normalize_contract
    by_key: dict[tuple[str, float], dict[str, Any]] = {}
    excluded = int(excluded_adjusted_count)
    for raw in raw_contracts:
        details = raw.get("details") or {}
        if details and not _is_standard_contract(details, raw):
            excluded += 1
            continue
        n = _normalize_contract(raw)
        if not n:
            # side unknown or missing strike — not necessarily adjusted
            continue
        if n["expiration"] != exp:
            continue
        if not dual_side and n["side"] != view_side:
            continue
        k = float(n["strike"])
        if k < lo or k > hi:
            continue
        by_key[(str(n["side"]), k)] = n

    all_strikes = sorted({k for (_s, k) in by_key.keys()}, reverse=True)
    spot_strike = None
    if all_strikes:
        spot_strike = min(all_strikes, key=lambda s: abs(s - float(spot)))

    rows: list[dict[str, Any]] = []
    for k in all_strikes:
        for sd in ("call", "put") if dual_side else (view_side,):
            c = by_key.get((sd, k))
            if not c:
                continue
            rows.append(
                {
                    "strike": k,
                    "side": sd,
                    "is_spot": spot_strike is not None and k == spot_strike,
                    "ticker": c.get("ticker"),
                    "mid": c.get("mid"),
                    "bid": c.get("bid"),
                    "ask": c.get("ask"),
                    "mid_source": c.get("mid_source"),
                    "volume": c.get("volume"),
                    "open_interest": c.get("open_interest"),
                    "delta": c.get("delta"),
                    "gamma": c.get("gamma"),
                    "theta": c.get("theta"),
                    "vega": c.get("vega"),
                    "iv": c.get("iv"),
                }
            )

    modal = strike_step if strike_step is not None else modal_strike_step(all_strikes)

    payload = {
        "underlier": underlier,
        "expiration": exp,
        "side": view_side,  # view default; books hold both when dual_side
        "dual_side": bool(dual_side),
        "spot": float(spot),
        "vix": vix,
        "dte": int(dte),
        "band": float(band),
        "strike_lo": lo,
        "strike_hi": hi,
        "spot_strike": spot_strike,
        "fields": list(LADDER_FIELDS),
        "rows": rows,
        "row_count": len(rows),
        "excluded_adjusted_count": excluded,
        "as_of": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "fetched_at_unix": time.time(),
    }
    if wings is not None:
        payload["wings"] = int(wings)
    if modal is not None:
        payload["strike_step"] = float(modal)
    if sigma is not None:
        payload["sigma"] = float(sigma)
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

    def _key(r: dict[str, Any]) -> str:
        sd = str(r.get("side") or "call").lower()
        return _row_key(sd, float(r["strike"]))

    prev_by = {
        _key(r): r
        for r in (prev.get("rows") or [])
        if r.get("strike") is not None
    }
    next_by = {
        _key(r): r
        for r in (nxt.get("rows") or [])
        if r.get("strike") is not None
    }

    upserts: list[dict[str, Any]] = []
    for key, row in next_by.items():
        old = prev_by.get(key)
        if old is None or _row_signature(old) != _row_signature(row):
            upserts.append(row)

    # removes: composite keys "call:7800.0" for dual-side safety
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
        "wings": nxt.get("wings"),
        "strike_step": nxt.get("strike_step"),
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
