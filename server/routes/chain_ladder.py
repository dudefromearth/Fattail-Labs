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
    DEFAULT_STRIKE_WINGS,
    MASSIVE_PAGE_LIMIT,
    MAX_STRIKES_PER_DTE,
    STRIKE_WING_CHOICES,
    build_ladder,
    diff_ladder,
    dte_from_expiration,
    extract_chain_underlying_price,
    infer_listed_step,
    is_proxy_mark_source,
    select_listed_wing_window,
    strike_window_from_wings,
)
from market_data.massive_client import MassiveClient, MassiveClientError
from market_data.market_bus import metrics as mb_metrics
from market_data.market_bus import singleflight as mb_sf
from market_data.market_bus.config import bus_enabled
from market_data.market_bus.store import get_store
from opf.session import build_opf_session
from opf.static_facts import default_static_facts
from routes.trade_log.common import _require_tool_member

router = APIRouter(tags=["chain-ladder"])

_cache_lock = threading.Lock()
_latest: dict[str, dict[str, Any]] = {}
_by_hash: dict[str, dict[str, Any]] = {}
_fetched_at: dict[str, float] = {}
_CACHE_TTL_S = 1.5


def _cache_key(product: str, chain_ul: str, expiration: str, side: str, wings: int) -> str:
    # HM15: dual-side generation shared across viewSide (side not in key)
    return f"{product}|{chain_ul}|{expiration}|w{int(wings)}|dual"


def _bus_ladder_key(chain_ul: str, expiration: str, side: str, wings: int) -> str:
    return f"mb:ladder:{chain_ul}:{expiration}:w{int(wings)}:dual"


# Dual-side one-page budget: strikes × 2 ≤ 250 ⇒ ≤125 strikes
_MAX_DUAL_WINGS = 50  # ±50 ≈ 101 strikes × 2 ≈ 202 contracts


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
                "proxy_symbol": (row.get("proxy_symbol") or None),
                "kind": row.get("kind") or "index",
                "enabled": row.get("enabled", True),
                "strike_step": row.get("strike_step"),
            }
        return {
            "product": product,
            "chain_underlier": feed,
            "proxy_symbol": None,
            "kind": "index",
            "enabled": True,
            "strike_step": None,
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
    proxy = (row.get("proxy_symbol") or "").strip() or None
    return {
        "product": row["symbol"],
        "chain_underlier": chain_ul,
        "proxy_symbol": proxy,
        "kind": row.get("kind") or "equity",
        "enabled": True,
        "strike_step": row.get("strike_step"),
    }


def _strike_step(product: str, kind: str, configured: float | None = None) -> float:
    """Guess step for **fetch width** only. Prefer Admin strike_step when set.

    Equities/ETFs often list **0.5 / 1 / 2.5 / 5** near ATM — use 0.5 as the
    finest common grid so the Massive strike filter does not skip halves.
    Final wings are applied on **listed** strikes, not this guess.
    """
    if configured is not None:
        try:
            s = float(configured)
            if s > 0:
                return s
        except (TypeError, ValueError):
            pass
    if kind == "index" or product in ("SPX", "NDX", "RUT"):
        return 5.0
    if product == "XSP":
        return 1.0
    # equity / etf / other — finest common OCC fraction
    return 0.5


def _strikes_from_raw(raw: list) -> list[float]:
    out: list[float] = []
    for row in raw:
        if not isinstance(row, dict):
            continue
        details = row.get("details") or {}
        k = details.get("strike_price")
        if k is None:
            continue
        try:
            out.append(float(k))
        except (TypeError, ValueError):
            continue
    return out


def _probe_spot(
    client: MassiveClient,
    *,
    chain_underlier: str,
    expiration: str,
    product: str,
    mark_mid: float | None,
    mark_src: str | None,
) -> tuple[float, str]:
    """Resolve usable spot without downloading the full chain (OC2).

    Order: one-page Massive sample for underlying_asset → native marks → 503.
    """
    # Tiny sample: single page, single expiry — enough for underlying_asset.value
    try:
        sample = client.fetch_option_chain(
            chain_underlier,
            expiration_date=expiration,
            limit=50,
            max_pages=1,
        )
    except MassiveClientError:
        sample = []
    chain_spot = extract_chain_underlying_price(sample)
    if chain_spot is not None:
        return chain_spot, "chain_underlying"
    if mark_mid is not None:
        return mark_mid, "marks_native"
    raise HTTPException(
        status_code=503,
        detail=(
            f"No usable spot for {product}: chain sample had no underlying_asset.value "
            f"and live marks are missing or proxy-only (source={mark_src or 'none'}). "
            "Not using SPY/VIXY scale for strikes."
        ),
    )


def _fetch_ladder_uncached(
    *,
    product: str,
    chain_underlier: str,
    kind: str,
    expiration: str,
    side: str,
    wings: int,
    strike_step_cfg: float | None = None,
) -> dict[str, Any]:
    """Massive pull + dual-side ladder build (HM15–HM20). No process cache."""
    wings_req = int(wings)
    # HM17 / OD8: keep dual-side under 250 contracts (one page)
    wings_eff = min(wings_req, _MAX_DUAL_WINGS)
    dte = dte_from_expiration(expiration)
    vol_pct = _vol_pct_for_dte(dte)
    mark_mid, mark_src = _native_mark_mid(product)
    step_guess = _strike_step(product, kind, strike_step_cfg)
    is_index = kind == "index" or product in ("SPX", "NDX", "RUT")
    # Fetch pre-filter: use per-symbol profile floor when present (Admin / kind defaults).
    fetch_floor = 2.5
    try:
        from market_data import universe_admin as _ua
        from market_data.symbol_profile import resolve_symbol_profile

        with db.transaction() as conn:
            with conn.cursor() as cur:
                urow = _ua.get_one(cur, product)
        if urow:
            prof = resolve_symbol_profile(urow, symbol=product)
            if prof.get("fetch_step_floor") is not None:
                fetch_floor = float(prof["fetch_step_floor"])
    except Exception:
        pass
    # Equities/ETFs often use step_guess=0.5 so wings×0.5 ≈ ±$12.5 — too narrow.
    # Over-fetch with floor, then trim via select_listed_wing_window.
    fetch_step = step_guess
    if not is_index and step_guess < 5.0:
        fetch_step = max(step_guess, fetch_floor)

    try:
        client = MassiveClient()
    except MassiveClientError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    spot, spot_source = _probe_spot(
        client,
        chain_underlier=chain_underlier,
        expiration=expiration,
        product=product,
        mark_mid=mark_mid,
        mark_src=mark_src,
    )
    mb_metrics.record_massive_call(1)

    def _pull(lo: float | None, hi: float | None) -> list:
        mb_metrics.record_massive_call(1)
        # HM15: both sides — never pass contract_type
        return client.fetch_option_chain(
            chain_underlier,
            expiration_date=expiration,
            strike_price_gte=lo,
            strike_price_lte=hi,
            contract_type=None,
            limit=MASSIVE_PAGE_LIMIT,
            max_pages=1,
            allow_truncate=False,  # HM18
        )

    try:
        _band0, lo0, hi0, _atm0 = strike_window_from_wings(
            spot, step=fetch_step, wings=wings_eff
        )
        raw = _pull(lo0, hi0)
    except MassiveClientError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    chain_spot2 = extract_chain_underlying_price(raw)
    if chain_spot2 is not None:
        spot = chain_spot2
        spot_source = "chain_underlying"

    listed_strikes = _strikes_from_raw(raw)
    if not listed_strikes:
        raise HTTPException(
            status_code=502,
            detail=f"No option contracts returned for {product} {expiration}",
        )

    try:
        band, lo, hi, atm, listed_n = select_listed_wing_window(
            listed_strikes, spot, wings_eff
        )
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    step = infer_listed_step(listed_strikes, spot) or step_guess

    payload = build_ladder(
        raw,
        underlier=chain_underlier,
        spot=spot,
        expiration=expiration,
        side=side,
        band=band,
        vix=vol_pct,
        dte=dte,
        strike_lo=lo,
        strike_hi=hi,
        wings=wings_eff,
        strike_step=step,
        dual_side=True,
    )
    payload["product"] = product
    payload["kind"] = kind
    payload["spot_source"] = spot_source
    payload["vol_source"] = "vix1d_or_vix_native" if vol_pct is not None else "none"
    payload["atm_strike"] = atm
    payload["listed_in_window"] = listed_n
    payload["wings_requested"] = wings_req
    payload["wings_effective"] = wings_eff
    payload["max_strikes_per_dte"] = MAX_STRIKES_PER_DTE
    payload["massive_page_limit"] = MASSIVE_PAGE_LIMIT
    payload["bus"] = "redis" if bus_enabled() else "process"
    return payload


def _fetch_ladder(
    *,
    product: str,
    chain_underlier: str,
    kind: str,
    expiration: str,
    side: str,
    wings: int,
    strike_step_cfg: float | None = None,
) -> dict[str, Any]:
    """Shared generation: Redis (MB-P1) or in-process TTL + single-flight.

    Concurrent members share one Massive fill per key (OC15 / MB2).
    """
    wings = int(wings)
    key = _cache_key(product, chain_underlier, expiration, side, wings)
    bus_key = _bus_ladder_key(chain_underlier, expiration, side, wings)
    now = time.monotonic()

    store = get_store()
    if store is not None:
        try:
            hit = store.get_json(bus_key)
            if hit and hit.get("content_hash"):
                store.touch_interest(bus_key)
                # park for diff
                with _cache_lock:
                    _latest[key] = hit
                    _fetched_at[key] = now
                    h = str(hit.get("content_hash") or "")
                    if h:
                        _by_hash[h] = hit
                return hit
        except Exception:
            pass  # fall through to fill

    # In-process L1 (H1-2 minimal + L1 in front of Redis)
    with _cache_lock:
        prev_payload = _latest.get(key)
        ts = _fetched_at.get(key, 0.0)
        if prev_payload and (now - ts) < _CACHE_TTL_S and "_raw" not in prev_payload:
            return prev_payload

    def _fill() -> dict[str, Any]:
        return _fetch_ladder_uncached(
            product=product,
            chain_underlier=chain_underlier,
            kind=kind,
            expiration=expiration,
            side=side,
            wings=wings,
            strike_step_cfg=strike_step_cfg,
        )

    try:
        payload = mb_sf.do(bus_key, _fill)
    except HTTPException:
        raise
    except MassiveClientError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    if store is not None:
        try:
            store.set_json(bus_key, payload)
            store.touch_interest(bus_key)
        except Exception:
            pass

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


@router.get("/api/me/market/bus-metrics")
def market_bus_metrics(request: Request) -> dict:
    """Debug counters for AT-MB1 (tool member)."""
    claims = require_session(request)
    _require_tool_member(claims, capability="read")
    store_ok = False
    try:
        st = get_store()
        store_ok = bool(st and st.ping())
    except Exception:
        store_ok = False
    return {
        "bus_enabled": bus_enabled(),
        "redis_ok": store_ok,
        "massive_calls": mb_metrics.massive_call_count(),
    }


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
    wings: int = Query(
        default=DEFAULT_STRIKE_WINGS,
        description="Strikes above and below ATM (10|25|50|100; default 25)",
    ),
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

    wings_n = int(wings)
    if wings_n not in STRIKE_WING_CHOICES:
        raise HTTPException(
            status_code=422,
            detail=f"wings must be one of {list(STRIKE_WING_CHOICES)}",
        )

    resolved = _resolve_universe_symbol(symbol or underlier or "SPX")
    nxt = _fetch_ladder(
        product=resolved["product"],
        chain_underlier=resolved["chain_underlier"],
        kind=str(resolved.get("kind") or "equity"),
        expiration=exp,
        side=side_n,
        wings=wings_n,
        strike_step_cfg=resolved.get("strike_step"),
    )

    prev: dict[str, Any] | None = None
    if since_hash:
        with _cache_lock:
            prev = _by_hash.get(since_hash)

    patch = diff_ladder(prev, nxt)
    mode = patch.get("mode")
    session = _opf_session_for_ladder(
        product=resolved["product"],
        kind=str(resolved.get("kind") or "equity"),
        expiration=exp,
        generation_as_of=nxt.get("as_of"),
        mark_sources=[
            str(r.get("mid_source") or "")
            for r in (nxt.get("rows") or [])
            if isinstance(r, dict)
        ],
    )
    if mode == "unchanged":
        return {
            "unchanged": True,
            "mode": "unchanged",
            "content_hash": patch.get("content_hash"),
            "as_of": patch.get("as_of"),
            "product": resolved["product"],
            "opf_session": session,
            "server_time": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        }
    if mode == "diff":
        return {
            "unchanged": False,
            "mode": "diff",
            "product": resolved["product"],
            **{k: v for k, v in patch.items() if k != "mode"},
            "opf_session": session,
            "server_time": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        }
    return {
        "unchanged": False,
        "mode": "full",
        "product": resolved["product"],
        "ladder": nxt,
        "content_hash": nxt.get("content_hash"),
        "opf_session": session,
        "server_time": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }


def _opf_session_for_ladder(
    *,
    product: str,
    kind: str | None,
    expiration: str,
    generation_as_of: str | None,
    mark_sources: list[str],
) -> dict[str, Any]:
    """HTTP ladder envelope (H2). Redis L0 read only — no Massive hop."""
    settlement = default_static_facts().product(product).settlement
    return build_opf_session(
        product=product,
        product_kind=kind,
        expiration=expiration,
        settlement=settlement,
        generation_as_of=generation_as_of,
        mark_sources=mark_sources,
    )


# Analyzer / OPF active option horizon (calendar DTE).
# Historical default was effectively ~3 *listed dates* (API limit=3), which for
# SPX daily is only ~0–2 DTE. Active plane now holds through this many DTE.
OPF_ACTIVE_DTE_HORIZON = 10


def _et_now_parts() -> tuple[date, int]:
    """America/New_York calendar date + minutes since midnight."""
    try:
        from zoneinfo import ZoneInfo

        et = datetime.now(ZoneInfo("America/New_York"))
        return et.date(), et.hour * 60 + et.minute
    except Exception:
        # Fallback: UTC (should not be used in prod)
        n = datetime.now(timezone.utc)
        return n.date(), n.hour * 60 + n.minute


def _same_day_expiration_still_selectable(today: date) -> bool:
    """
    Include 0DTE in the exp dropdown until 16:00 ET settlement cutoff.

    RTH may already report closed (equity close / held) while 0DTE index
    options are still the correct pointer until 4:00 PM Eastern.
    """
    et_day, mins = _et_now_parts()
    if et_day != today:
        # Server calendar day vs ET day mismatch — prefer ET day for 0DTE
        if et_day > today:
            return False
    return mins < 16 * 60


def _contracts_from_dates(
    dates: list[str],
    *,
    today: date,
    limit: int,
    session_open: bool | None = None,
    max_dte: int | None = None,
) -> list[dict]:
    """Build listed-expiration contracts for UI/OPF pointer selection.

    Returns upcoming listed dates (valid option pointers) within ``max_dte``
    calendar days when set.

    0DTE is kept until **16:00 ET** (settlement), not dropped as soon as RTH
    reports closed — users must still be able to select today while it is live.
    """
    # Use ET calendar day so "today" matches the user's market day
    et_today, _ = _et_now_parts()
    day = et_today
    upcoming = [
        e for e in sorted({str(d)[:10] for d in dates if d}) if e >= day.isoformat()
    ]
    horizon = int(max_dte) if max_dte is not None else None
    keep_0dte = _same_day_expiration_still_selectable(day)
    out: list[dict] = []
    for e in upcoming:
        dte = dte_from_expiration(e, today=day)
        # Drop 0DTE only after 16:00 ET — not merely because session_open is false
        if dte <= 0 and not keep_0dte:
            continue
        if horizon is not None and dte > horizon:
            continue
        out.append(
            {
                "expiration": e,
                "dte": dte,
                "label": f"{e} · 0 DTE" if dte == 0 else f"{e} · {dte} DTE",
            }
        )
        if len(out) >= int(limit):
            break
    return out


def _session_open_for_expiry_default() -> bool:
    """True while 0DTE is still a selectable live pointer (before 16:00 ET)."""
    et_today, _ = _et_now_parts()
    return _same_day_expiration_still_selectable(et_today)


def _pick_default_expiration(
    contracts: list[dict], *, session_open: bool
) -> str | None:
    """Prefer live 0DTE while RTH open; after close, skip to next expiry."""
    if not contracts:
        return None
    if session_open:
        return str(contracts[0]["expiration"])
    for c in contracts:
        if int(c.get("dte") or 0) > 0:
            return str(c["expiration"])
    return str(contracts[0]["expiration"])


def _scan_expirations_live(
    chain_underlier: str, *, days: int, limit: int, today: date
) -> list[str]:
    """Discover next ``limit`` distinct listed dates without full-chain download.

    Stops as soon as we have enough future expirations (early exit).
    """
    gte = today.isoformat()
    lte = (today + timedelta(days=int(days))).isoformat()
    today_s = today.isoformat()
    need = int(limit)
    client = MassiveClient()
    found: set[str] = set()

    def _stop(results: list) -> bool:
        for row in results:
            details = row.get("details") or {}
            e = details.get("expiration_date")
            if e:
                es = str(e)[:10]
                if es >= today_s:
                    found.add(es)
        return len(found) >= need

    # call_type filter halves SPX volume; we only need dates, either side works
    client.fetch_option_chain_until(
        chain_underlier,
        should_stop=_stop,
        expiration_date_gte=gte,
        expiration_date_lte=lte,
        contract_type="call",
        # More pages when asking for a long listed calendar (Analyzer selects)
        max_pages=max(20, min(80, need * 2)),
    )
    return sorted(found)[:need]


@router.get("/api/me/market/chain-ladder/expirations")
def list_chain_ladder_expirations(
    request: Request,
    symbol: str | None = Query(default=None),
    underlier: str | None = Query(default=None),
    limit: int = Query(
        default=30,
        ge=1,
        le=90,
        description=(
            "Max distinct listed expiration dates to return within the DTE "
            "horizon (default 30, max 90)"
        ),
    ),
    days: int = Query(
        default=OPF_ACTIVE_DTE_HORIZON,
        ge=1,
        le=400,
        description=(
            f"Look-ahead window in calendar days (default "
            f"{OPF_ACTIVE_DTE_HORIZON} = OPF active DTE horizon)"
        ),
    ),
    max_dte: int = Query(
        default=OPF_ACTIVE_DTE_HORIZON,
        ge=0,
        le=400,
        description=(
            f"Only return listed expirations with calendar DTE ≤ this "
            f"(default {OPF_ACTIVE_DTE_HORIZON}; OPF active option horizon)"
        ),
    ),
    refresh: bool = Query(
        default=False,
        description="Force live Massive scan and write-through preform store",
    ),
) -> dict:
    """Listed expirations for option-pointer selection (OC3 · OC11 store-first).

    SoR for Analyzer position-card / Builder expiration dropdowns: every
    returned date is a valid listed chain expiration within the OPF active
    DTE horizon (default **10 DTE**). Prefer preformed calendar when fresh;
    else live scan + write-through. After cash close, 0DTE is omitted.
    """
    claims = require_session(request)
    _require_tool_member(claims, capability="read")
    resolved = _resolve_universe_symbol(symbol or underlier or "SPX")
    ul = resolved["chain_underlier"]
    product = resolved["product"]
    today = date.today()
    source = "live_scan"
    session_open = _session_open_for_expiry_default()
    # Scan at least the DTE horizon so we do not miss listed dates at the edge
    scan_days = max(int(days), int(max_dte), OPF_ACTIVE_DTE_HORIZON)

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
                contracts = _contracts_from_dates(
                    stored_dates,
                    today=today,
                    limit=limit,
                    session_open=session_open,
                    max_dte=max_dte,
                )
                # Preform may be short (old 3/10-cap) — top up with live scan
                if len(contracts) < min(int(limit), 5):
                    try:
                        dates = _scan_expirations_live(
                            ul,
                            days=scan_days,
                            limit=max(limit, 10),
                            today=today,
                        )
                        try:
                            ua.write_chain_calendar(
                                cur, product, expirations=dates[: max(limit, 40)]
                            )
                            source = "preform_topped_up"
                        except Exception:
                            source = "preform_plus_live"
                        contracts = _contracts_from_dates(
                            dates,
                            today=today,
                            limit=limit,
                            session_open=session_open,
                            max_dte=max_dte,
                        )
                    except MassiveClientError:
                        pass  # keep preform contracts
            else:
                try:
                    dates = _scan_expirations_live(
                        ul,
                        days=scan_days,
                        limit=max(limit, 10),
                        today=today,
                    )
                except MassiveClientError as exc:
                    raise HTTPException(status_code=502, detail=str(exc)) from exc
                try:
                    ua.write_chain_calendar(
                        cur, product, expirations=dates[: max(limit, 40)]
                    )
                    source = "live_scan_write_through"
                except Exception:
                    source = "live_scan"
                contracts = _contracts_from_dates(
                    dates,
                    today=today,
                    limit=limit,
                    session_open=session_open,
                    max_dte=max_dte,
                )

    default_exp = _pick_default_expiration(contracts, session_open=session_open)
    return {
        "symbol": product,
        "underlier": ul,
        "as_of_day": today.isoformat(),
        "limit": int(limit),
        "days": int(scan_days),
        "max_dte": int(max_dte),
        "opf_active_dte_horizon": OPF_ACTIVE_DTE_HORIZON,
        "source": source,
        "session_open": session_open,
        "contracts": contracts,
        "expirations": [c["expiration"] for c in contracts],
        "default_expiration": default_exp,
        "count": len(contracts),
    }
