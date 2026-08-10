"""Vertical option chain ladder — member read API (diff-on-change).

GET /api/me/market/chain-ladder

Symbol list is the same SoR as Admin: ``market_symbol_universe``
(via product ``symbol`` + optional ``feed_symbol`` for Massive options path).

Poll this endpoint. The browser never full-page-reloads.

Response modes:
  - ``unchanged`` — content_hash matches / nothing moved
  - ``diff`` — only strikes whose bid/ask/mid/vol/oi/greeks/iv changed
  - ``full`` — first load (no prior hash) or band geometry rebuilt
"""

from __future__ import annotations

import math
import threading
import time
from datetime import date, datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, HTTPException, Query, Request

import db
from guards import require_session
from market_data import live_marks as lm
from market_data import universe_admin as ua
from market_data.chain_ladder import (
    build_ladder,
    diff_ladder,
    dte_from_expiration,
    extract_chain_underlying_price,
    is_proxy_mark_source,
    sigma_band_points,
)
from market_data.massive_client import MassiveClient, MassiveClientError
from routes.trade_log.common import _require_tool_member

router = APIRouter(tags=["chain-ladder"])

_cache_lock = threading.Lock()
_latest: dict[str, dict[str, Any]] = {}
_by_hash: dict[str, dict[str, Any]] = {}
_fetched_at: dict[str, float] = {}
_CACHE_TTL_S = 1.5


def _cache_key(product: str, chain_ul: str, expiration: str, side: str, sigma: float) -> str:
    return f"{product}|{chain_ul}|{expiration}|{side}|{sigma}"


def _native_mark_mid(product_symbol: str) -> tuple[float | None, str | None]:
    """Return (mid, source) only when mark is **not** a proxy (OC2 / OC5a)."""
    with db.transaction() as conn:
        with conn.cursor() as cur:
            m = lm.get_live_mark(cur, product_symbol)
            if not m or m.get("mid") is None:
                return None, None
            src = str(m.get("source") or "")
            if is_proxy_mark_source(src):
                return None, src  # present but unusable for strike/vol math
            try:
                return float(m["mid"]), src
            except (TypeError, ValueError):
                return None, src


def _vol_pct_for_dte(dte: int) -> float | None:
    """Non-proxy vol percent for σ. VIX1D for 0–1 DTE, else VIX (OC5a)."""
    order = ("VIX1D", "VIX") if int(dte) <= 1 else ("VIX", "VIX1D")
    for sym in order:
        mid, _src = _native_mark_mid(sym)
        if mid is not None and mid > 0:
            # Sanity: annualized vol % is rarely > 200; ETF dollars can be similar
            # magnitude to low VIX — proxy already filtered by source.
            return float(mid)
    return None


def _resolve_universe_symbol(symbol: str | None) -> dict[str, Any]:
    """Map product symbol (Admin universe) → chain underlier + spot product.

    Product ``symbol`` is the Admin key (e.g. SPX, AAPL).
    Massive options path uses ``feed_symbol`` when set (e.g. I:SPX), else product.
    """
    raw = (symbol or "SPX").strip().upper()
    if not raw:
        raw = "SPX"
    # Allow I:SPX typed in manually → treat as product SPX with feed I:SPX
    if raw.startswith("I:"):
        product = raw[2:]
        feed = raw
        with db.transaction() as conn:
            with conn.cursor() as cur:
                row = ua.get_one(cur, product)
        if row:
            return {
                "product": row["symbol"],
                "chain_underlier": (row.get("feed_symbol") or feed).strip(),
                "kind": row.get("kind") or "index",
                "enabled": row.get("enabled", True),
            }
        return {
            "product": product,
            "chain_underlier": feed,
            "kind": "index",
            "enabled": True,
        }

    with db.transaction() as conn:
        with conn.cursor() as cur:
            row = ua.get_one(cur, raw)
    if not row:
        raise HTTPException(
            status_code=422,
            detail=f"{raw!r} is not in the Admin market universe — add it under Admin → Symbols",
        )
    if not row.get("enabled", True):
        raise HTTPException(
            status_code=422,
            detail=f"{raw!r} is disabled in the Admin market universe",
        )
    feed = (row.get("feed_symbol") or "").strip()
    chain_ul = feed if feed else row["symbol"]
    return {
        "product": row["symbol"],
        "chain_underlier": chain_ul,
        "kind": row.get("kind") or "equity",
        "enabled": True,
    }


def _strike_step(product: str, kind: str) -> float:
    if kind == "index" or product in ("SPX", "NDX", "RUT"):
        return 5.0
    if product == "XSP":
        return 1.0
    return 1.0


def _fetch_ladder(
    *,
    product: str,
    chain_underlier: str,
    kind: str,
    expiration: str,
    side: str,
    sigma: float,
) -> dict[str, Any]:
    # OC15: shared generation key is (feed, expiration) for upstream; include
    # product/side/sigma so filtered ladders stay distinct in the response cache.
    key = _cache_key(product, chain_underlier, expiration, side, sigma)
    now = time.monotonic()
    with _cache_lock:
        prev_payload = _latest.get(key)
        ts = _fetched_at.get(key, 0.0)
        if prev_payload and (now - ts) < _CACHE_TTL_S:
            return prev_payload

    dte = dte_from_expiration(expiration)
    vol_pct = _vol_pct_for_dte(dte)

    # Wide provisional band for first Massive pull when spot unknown pre-fetch;
    # re-filter with true spot after chain underlying is known.
    mark_mid, mark_src = _native_mark_mid(product)
    provisional_spot = mark_mid if mark_mid is not None else 5000.0
    step = _strike_step(product, kind)
    # Generous first window so we get underlying_asset on results
    prov_band = sigma_band_points(
        provisional_spot, vol_pct=vol_pct, dte=dte, sigma=max(float(sigma), 2.0)
    )
    # Expand further so underlying_asset arrives even if provisional was SPY-scale
    # (we no longer use proxy mid — mark_mid is native-only).
    lo = math.floor((provisional_spot - prov_band * 2) / step) * step
    hi = math.ceil((provisional_spot + prov_band * 2) / step) * step
    if mark_mid is None:
        # No native mark: open a wider strike query (indexes ~ index levels)
        lo = max(step, lo * 0.5) if lo > 1000 else lo
        hi = hi * 1.5 if hi > 1000 else hi + 500

    try:
        client = MassiveClient()
    except MassiveClientError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    # OC15 generation: one upstream fetch per (feed, expiry) window
    gen_key = f"gen|{chain_underlier}|{expiration}"
    with _cache_lock:
        gen_hit = _latest.get(gen_key)
        gen_ts = _fetched_at.get(gen_key, 0.0)
        if gen_hit and (now - gen_ts) < _CACHE_TTL_S and isinstance(gen_hit.get("_raw"), list):
            raw = gen_hit["_raw"]
        else:
            raw = None
    if raw is None:
        try:
            raw = client.fetch_option_chain(
                chain_underlier,
                expiration_date=expiration,
                # omit tight strike filter when no native spot — underlying price first
                strike_price_gte=lo if mark_mid is not None else None,
                strike_price_lte=hi if mark_mid is not None else None,
                max_pages=40 if mark_mid is not None else 12,
            )
        except MassiveClientError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc
        with _cache_lock:
            _latest[gen_key] = {"_raw": raw}
            _fetched_at[gen_key] = time.monotonic()

    # OC2: chain underlying first
    chain_spot = extract_chain_underlying_price(raw)
    spot_source = "chain_underlying"
    if chain_spot is not None:
        spot = chain_spot
    elif mark_mid is not None:
        spot = mark_mid
        spot_source = "marks_native"
    else:
        raise HTTPException(
            status_code=503,
            detail=(
                f"No usable spot for {product}: chain had no underlying_asset.value "
                f"and live marks are missing or proxy-only "
                f"(source={mark_src or 'none'}) — not using SPY/VIXY scale for strikes"
            ),
        )

    band = sigma_band_points(spot, vol_pct=vol_pct, dte=dte, sigma=sigma)
    lo2 = math.floor((spot - band) / step) * step
    hi2 = math.ceil((spot + band) / step) * step

    # If first fetch was unfiltered wide, re-fetch banded when needed
    if mark_mid is None or any(
        True
        for row in raw
        if (row.get("details") or {}).get("strike_price") is not None
        and (
            float((row.get("details") or {}).get("strike_price")) < lo2
            or float((row.get("details") or {}).get("strike_price")) > hi2
        )
    ):
        try:
            raw = client.fetch_option_chain(
                chain_underlier,
                expiration_date=expiration,
                strike_price_gte=lo2,
                strike_price_lte=hi2,
                contract_type=side if side in ("call", "put") else None,
                max_pages=40,
            )
        except MassiveClientError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc
        # refresh underlying if present
        chain_spot2 = extract_chain_underlying_price(raw)
        if chain_spot2 is not None:
            spot = chain_spot2
            spot_source = "chain_underlying"
            band = sigma_band_points(spot, vol_pct=vol_pct, dte=dte, sigma=sigma)

    payload = build_ladder(
        raw,
        underlier=chain_underlier,
        spot=spot,
        expiration=expiration,
        side=side,
        band=band,
        sigma=sigma,
        vix=vol_pct,
        dte=dte,
    )
    payload["product"] = product
    payload["kind"] = kind
    payload["spot_source"] = spot_source
    payload["vol_source"] = "vix1d_or_vix_native" if vol_pct is not None else "fallback_band"
    with _cache_lock:
        _latest[key] = payload
        _fetched_at[key] = time.monotonic()
        h = str(payload.get("content_hash") or "")
        if h:
            _by_hash[h] = payload
            if len(_by_hash) > 64:
                keep = {str(p.get("content_hash")) for p in _latest.values()}
                for dead in list(_by_hash.keys()):
                    if dead not in keep:
                        _by_hash.pop(dead, None)
    return payload


@router.get("/api/me/market/chain-ladder")
def get_chain_ladder(
    request: Request,
    expiration: str = Query(..., description="YYYY-MM-DD expiration"),
    symbol: str | None = Query(
        default=None,
        description="Product symbol from Admin market universe (e.g. SPX, AAPL)",
    ),
    underlier: str | None = Query(
        default=None,
        description="Deprecated alias for symbol / feed (prefer symbol=)",
    ),
    side: str = Query(default="call", description="call|put"),
    sigma: float = Query(default=2.0, ge=0.5, le=5.0),
    since_hash: str | None = Query(
        default=None,
        description="Last applied content_hash — enables strike-level diff",
    ),
) -> dict:
    """Poll for ladder. Prefer ``mode=diff`` so only changed strikes update."""
    claims = require_session(request)
    _require_tool_member(claims, capability="read")

    exp = (expiration or "").strip()[:10]
    try:
        date.fromisoformat(exp)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="expiration must be YYYY-MM-DD") from exp

    side_n = (side or "call").strip().lower()
    if side_n not in ("call", "put"):
        raise HTTPException(status_code=422, detail="side must be call|put")

    resolved = _resolve_universe_symbol(symbol or underlier or "SPX")
    nxt = _fetch_ladder(
        product=resolved["product"],
        chain_underlier=resolved["chain_underlier"],
        kind=str(resolved.get("kind") or "equity"),
        expiration=exp,
        side=side_n,
        sigma=float(sigma),
    )

    prev: dict[str, Any] | None = None
    if since_hash:
        with _cache_lock:
            prev = _by_hash.get(since_hash)

    patch = diff_ladder(prev, nxt)
    mode = patch.get("mode")
    if mode == "unchanged":
        return {
            "unchanged": True,
            "mode": "unchanged",
            "content_hash": patch.get("content_hash"),
            "as_of": patch.get("as_of"),
            "product": resolved["product"],
            "server_time": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        }
    if mode == "diff":
        return {
            "unchanged": False,
            "mode": "diff",
            "product": resolved["product"],
            **{k: v for k, v in patch.items() if k != "mode"},
            "server_time": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        }
    return {
        "unchanged": False,
        "mode": "full",
        "product": resolved["product"],
        "ladder": nxt,
        "content_hash": nxt.get("content_hash"),
        "server_time": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }


def _contracts_from_dates(dates: list[str], *, today: date, limit: int) -> list[dict]:
    upcoming = [e for e in sorted({str(d)[:10] for d in dates if d}) if e >= today.isoformat()]
    upcoming = upcoming[: int(limit)]
    out = []
    for e in upcoming:
        dte = dte_from_expiration(e, today=today)
        out.append(
            {
                "expiration": e,
                "dte": dte,
                "label": f"{e} · 0 DTE" if dte == 0 else f"{e} · {dte} DTE",
            }
        )
    return out


def _scan_expirations_live(
    chain_underlier: str, *, days: int, limit: int, today: date
) -> list[str]:
    gte = today.isoformat()
    lte = (today + timedelta(days=int(days))).isoformat()
    client = MassiveClient()
    raw = client.fetch_option_chain(
        chain_underlier,
        expiration_date_gte=gte,
        expiration_date_lte=lte,
        max_pages=12,
    )
    exps: set[str] = set()
    for row in raw:
        details = row.get("details") or {}
        e = details.get("expiration_date")
        if e:
            exps.add(str(e)[:10])
    return sorted(e for e in exps if e >= today.isoformat())[: int(limit)]


@router.get("/api/me/market/chain-ladder/expirations")
def list_chain_ladder_expirations(
    request: Request,
    symbol: str | None = Query(default=None),
    underlier: str | None = Query(default=None),
    limit: int = Query(
        default=3,
        ge=1,
        le=10,
        description="How many next distinct expiration dates (default 3)",
    ),
    days: int = Query(
        default=60,
        ge=1,
        le=120,
        description="Look-ahead window when scanning the chain for distinct expiries",
    ),
    refresh: bool = Query(
        default=False,
        description="Force live Massive scan and write-through preform store",
    ),
) -> dict:
    """Next N distinct listed expirations (OC3 · OC11 store-first).

    Prefer preformed ``next_expirations_json`` when fresh (same UTC session day).
    Else live scan + write-through.
    """
    claims = require_session(request)
    _require_tool_member(claims, capability="read")
    resolved = _resolve_universe_symbol(symbol or underlier or "SPX")
    ul = resolved["chain_underlier"]
    product = resolved["product"]
    today = date.today()
    source = "live_scan"

    with db.transaction() as conn:
        with conn.cursor() as cur:
            row = ua.get_one(cur, product)
            stored_dates: list[str] = []
            if row and not refresh and ua.calendar_is_fresh(row):
                raw_json = row.get("next_expirations_json")
                if isinstance(raw_json, list):
                    for item in raw_json:
                        if isinstance(item, str):
                            stored_dates.append(item[:10])
                        elif isinstance(item, dict) and item.get("expiration"):
                            stored_dates.append(str(item["expiration"])[:10])
                if stored_dates:
                    source = "preform"

            if source == "preform":
                contracts = _contracts_from_dates(stored_dates, today=today, limit=limit)
            else:
                try:
                    dates = _scan_expirations_live(
                        ul, days=days, limit=max(limit, 3), today=today
                    )
                except MassiveClientError as exc:
                    raise HTTPException(status_code=502, detail=str(exc)) from exc
                # store more than limit for a bit of headroom
                try:
                    ua.write_chain_calendar(cur, product, expirations=dates[:10])
                    source = "live_scan_write_through"
                except Exception:
                    source = "live_scan"
                contracts = _contracts_from_dates(dates, today=today, limit=limit)

    return {
        "symbol": product,
        "underlier": ul,
        "as_of_day": today.isoformat(),
        "limit": int(limit),
        "source": source,
        "contracts": contracts,
        "expirations": [c["expiration"] for c in contracts],
        "default_expiration": contracts[0]["expiration"] if contracts else None,
    }
