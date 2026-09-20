"""SA prototype: computing consumer of VP Contract v1.1 (mock harness + live flip)."""

from __future__ import annotations

from datetime import date
from typing import Any

from sa_dev.detect import detect
from sa_dev.params import parameter_set_hash
from sa_dev.vp_client import (
    FIXTURE_BASE,
    ContractMismatch,
    api_base,
    get_health,
    get_profile,
    get_range,
    is_coverage_response,
    live_coverage,
)


def _unserved() -> dict[str, str]:
    return {
        "replay": "UNSERVED",
        "footprint": "UNSERVED",
        "market_delta": "UNSERVED",
        "gex_overlay": "UNSERVED",
        "characterization": "UNSERVED",
        "exploration": "UNSERVED",
    }


def _named(state: str, **extra: Any) -> dict[str, Any]:
    return {
        "named_state": state,
        "vp_api_base": api_base(),
        **extra,
        **_unserved(),
    }


def structure_for(
    target_symbol: str,
    *,
    source: str | None = None,
    session_date: str | None = None,
    kind: str = "session",
    harness: str = "auto",
    headers: dict[str, str] | None = None,
    include_bins: bool = False,
) -> dict[str, Any]:
    """harness: fixture → always mock; live → env base; auto → live if not mock."""
    if harness == "fixture":
        base = FIXTURE_BASE
    elif harness == "live":
        base = api_base()
        if base.startswith("mock:"):
            return _named(
                "WAITING FOR LIVE COVERAGE",
                detail="LABS_SA_DEV_VP_API_BASE is still mock:// — INFRA /health is not live",
            )
    else:
        base = api_base()

    try:
        profile = get_profile(
            target_symbol,
            kind,
            source=source,
            session_date=session_date,
            base=base,
            headers=headers,
        )
    except ContractMismatch as exc:
        return _named("CONTRACT MISMATCH", detail=str(exc))

    if profile.get("status") == "UNAVAILABLE" or profile.get("error") == "UNAVAILABLE":
        src = (source or "").upper()
        return _named(
            "NO COVERAGE" if src == "SPY" else "UNAVAILABLE",
            detail="payload as declared — no invented depth",
            status="UNAVAILABLE",
            source=source,
            target_symbol=target_symbol,
            coverage=profile.get("coverage"),
        )

    if is_coverage_response(profile):
        return _named(
            "COVERAGE",
            detail="payload as declared — no invented depth",
            coverage=profile.get("coverage", profile),
            coverage_floor=profile.get("coverage_floor"),
            error=profile.get("error"),
            status=profile.get("status") or "UNAVAILABLE",
        )

    if "entries" in profile:
        chosen = None
        for e in profile["entries"]:
            if e.get("status") in ("COMPLETE", "GAPPED") and e.get("bins"):
                chosen = e
                break
        if chosen is None:
            chosen = profile["entries"][0]
        profile = chosen

    bins = list(profile.get("bins") or [])
    objects = detect(bins) if bins else detect([])
    src = str(profile.get("source") or source or "")
    target = str(profile.get("target_symbol") or target_symbol).upper()
    caption = (
        f"Structure computed from traded volume ({src} prints, mapped to "
        f"{target}). Not a forecast."
    )
    flags = profile.get("flags") or {}
    attributed = sum(int(n.get("attributed_volume") or 0) for n in objects["nodes"])
    return {
        "source": src,
        "target_symbol": target,
        "session_date": profile.get("session_date"),
        "vp_row": profile.get("vp_row"),
        "status": profile.get("status"),
        "flags": flags,
        "gaps": profile.get("gaps") or [],
        "mapping": profile.get("mapping"),
        "caption": caption,
        "vp_api_base": base,
        "harness": "fixture" if base.startswith("mock:") else "live",
        "profile_generation_id": profile.get("profile_generation_id"),
        "parameter_set_hash": objects["parameter_set_hash"],
        "as_of": profile.get("as_of"),
        "computed_at": profile.get("computed_at"),
        "groupings": objects["groupings"],
        "nodes": objects["nodes"],
        "edges": objects["edges"],
        "crevasses": objects["crevasses"],
        "uncharted": objects["uncharted"],
        "sa_q2": objects["sa_q2"],
        "sa_q4": objects["sa_q4"],
        "bin_count": len(bins),
        "attributed_volume": attributed,
        "coverage": profile.get("coverage"),
        **({"bins": bins} if include_bins else {}),
        **_unserved(),
    }


def window_for(
    target_symbol: str,
    *,
    from_t: int,
    to_t: int,
    source: str | None = None,
    row: float | None = None,
    headers: dict[str, str] | None = None,
) -> dict[str, Any]:
    from sa_dev.vp_client import get_window

    try:
        return get_window(
            target_symbol,
            from_t=from_t,
            to_t=to_t,
            source=source,
            row=row,
            headers=headers,
        )
    except ContractMismatch as exc:
        return _named("CONTRACT MISMATCH", detail=str(exc))


def range_for(
    target_symbol: str,
    *,
    source: str | None = None,
    from_date: str,
    to_date: str,
    price_lo: float | None = None,
    price_hi: float | None = None,
    row: float | None = None,
    harness: str = "auto",
    headers: dict[str, str] | None = None,
) -> dict[str, Any]:
    """Full-history profile slice (A12). Bins are the display payload."""
    if harness == "fixture":
        base = FIXTURE_BASE
    elif harness == "live":
        base = api_base()
        if base.startswith("mock:"):
            return _named("WAITING FOR LIVE COVERAGE")
    else:
        base = api_base()
    try:
        profile = get_range(
            target_symbol,
            from_date=from_date,
            to_date=to_date,
            source=source,
            price_lo=price_lo,
            price_hi=price_hi,
            row=row,
            base=base,
            headers=headers,
            allow_partial=True,
        )
    except ContractMismatch as exc:
        return _named("CONTRACT MISMATCH", detail=str(exc))
    if is_coverage_response(profile):
        return _named(
            "COVERAGE",
            coverage=profile.get("coverage", profile),
            coverage_floor=profile.get("coverage_floor"),
            error=profile.get("error"),
        )
    if profile.get("status") == "UNAVAILABLE" or profile.get("error") == "UNAVAILABLE":
        return _named("UNAVAILABLE", coverage=profile.get("coverage"))
    bins = list(profile.get("bins") or [])
    return {
        "source": profile.get("source") or source,
        "target_symbol": profile.get("target_symbol") or target_symbol,
        "status": profile.get("status"),
        "flags": profile.get("flags"),
        "coverage": profile.get("coverage"),
        "bins": bins,
        "bin_count": len(bins),
        "vp_row": profile.get("vp_row") or row,
        "kind": "range",
        "vp_api_base": base,
        "profile_generation_id": profile.get("profile_generation_id"),
        "parameter_set_hash": profile.get("parameter_set_hash"),
        "truncated": bool((profile.get("coverage") or {}).get("truncated")),
    }


from market_data.vp_ohlc import bar_invariant, bars_from_prints, dominant_contract  # noqa: F401
_TF_SECONDS = {"1m": 60, "5m": 300, "15m": 900, "1h": 3600, "1d": 86400}
_REQ001_MIN_DAYS = 90


def contracts_for_source(source: str) -> list[dict[str, Any]]:
    """Active outright futures for the product (REQ-003 minimum)."""
    src = (source or "").upper()
    if src == "SPY":
        return [{"id": "SPY", "label": "SPY", "product": "SPY"}]
    from market_data.vp_ingest.futures_contracts import (
        fetch_active_contracts,
        product_of_ticker,
        _OUTRIGHT,
    )

    try:
        rows = fetch_active_contracts()
    except Exception:
        rows = []
    # Include recently printed contracts even if vendor dropped them from active.
    from sa_dev.store_read import list_source_days, store_ok
    from market_data.vp_warmer import load_chunks

    ok, _ = store_ok()
    if ok:
        days = list_source_days(src)[-8:]
        for ch in load_chunks(src, "5m", days):
            t = str(ch.get("contract") or "").upper()
            if t:
                rows.append({"ticker": t, "product_code": src, "last_trade_date": ""})
    out: list[dict[str, Any]] = []
    seen: set[str] = set()
    for c in rows:
        ticker = str(c.get("ticker") or "").upper()
        if not ticker or ticker in seen:
            continue
        if product_of_ticker(ticker) != src:
            continue
        if not _OUTRIGHT.match(ticker):
            continue
        seen.add(ticker)
        ltd = str(c.get("last_trade_date") or "")[:10]
        out.append({"id": ticker, "label": ticker, "product": src, "last_trade_date": ltd})
    out.sort(key=lambda r: (r.get("last_trade_date") or "9999", r["id"]))
    # Always offer the nearby quarterly so an expired front (e.g. ESU6) is selectable.
    if src in ("ES", "MES"):
        q = "HMUZ"
        y = date.today().year
        m = date.today().month
        # map month → last quarterly letter index
        qi = 0
        for i, letter in enumerate(q):
            # H=3, M=6, U=9, Z=12
            mm = {0: 3, 1: 6, 2: 9, 3: 12}[i]
            if m <= mm:
                qi = i
                break
        else:
            qi = 0
            y += 1
        nearby: list[str] = []
        for delta in (-2, -1, 0, 1, 2):
            idx = qi + delta
            yy = y
            while idx < 0:
                idx += 4
                yy -= 1
            while idx > 3:
                idx -= 4
                yy += 1
            nearby.append(f"{src}{q[idx]}{yy % 10}")
        have = {r["id"] for r in out}
        for t in nearby:
            if t not in have:
                out.append({"id": t, "label": t, "product": src, "last_trade_date": ""})
                have.add(t)
        out.sort(key=lambda r: (r.get("last_trade_date") or "9999", r["id"]))
    if not out and src in ("ES", "MES"):
        # Vendor miss — still offer the two nearby month codes we already trade.
        yr = date.today().year % 10
        out = [
            {"id": f"{src}U{yr}", "label": f"{src}U{yr}", "product": src},
            {"id": f"{src}Z{yr}", "label": f"{src}Z{yr}", "product": src},
        ]
    return out


def ohlc_for_source(
    source: str,
    *,
    tf: str = "5m",
    lookback_days: int = 5,
    contract: str | None = None,
) -> dict[str, Any]:
    """Admin-dev SOURCE-space OHLC from the VP print store (A12.4 / A8.4)."""
    from sa_dev.store_read import list_source_days, store_ok

    src = (source or "").upper()
    requested = (contract or "").strip().upper() or None
    ok, detail = store_ok()
    if not ok:
        return {
            "ok": False,
            "source": src,
            "space": "source",
            "named_state": "NO STORE",
            "detail": detail,
            "bars": [],
            "bar_count": 0,
        }
    days = list_source_days(src)
    if lookback_days > 0:
        days = days[-int(lookback_days) :]
    from market_data.vp_chunks import assemble_bars
    from market_data.vp_warmer import load_chunks

    chunks = load_chunks(src, tf, days)
    served_iso = {str(c.get("session") or "") for c in chunks}
    missing = [d for d in days if d not in served_iso]
    # Request path does not scan print gzip. Missing days wait on the warmer.
    bars, served, contract, lead_rule = assemble_bars(
        chunks,
        from_d=date.fromisoformat(days[0]) if days else None,
        to_d=date.fromisoformat(days[-1]) if days else None,
    )
    last_t = bars[-1]["t"] if bars else 0
    span_days = 0.0
    if bars and len(bars) >= 2:
        span_days = max(0.0, (float(bars[-1]["t"]) - float(bars[0]["t"])) / 86400000.0)
    price_source = "vp_prints"
    gid = f"req001:{src}:{tf}:{contract or ''}:{last_t}:{len(bars)}:{price_source}"
    status = "COMPLETE" if not missing else ("WARMING" if not bars else "GAPPED")
    if span_days < _REQ001_MIN_DAYS:
        status = "SHORT HISTORY"
    out: dict[str, Any] = {
        "ok": True,
        "source": src,
        "space": "source",
        "tf": tf,
        "lookback_days": lookback_days,
        "bars": bars,
        "bar_count": len(bars),
        "gaps": [{"session": d, "cause": "WARMING"} for d in missing],
        "contract": contract,
        "lead_rule": lead_rule,
        "store": detail,
        "status": status,
        "profile_generation_id": gid,
        "missing": missing,
        "history_span_days": round(span_days, 2),
        "price_source": price_source,
        "req001_min_days": _REQ001_MIN_DAYS,
    }
    if span_days < _REQ001_MIN_DAYS:
        out["named_state"] = "SHORT HISTORY"
        out["detail"] = (
            f"price span {span_days:.1f}d < {_REQ001_MIN_DAYS}d "
            f"(store={detail}; source={price_source})"
        )
    cont = _continuous_block(src)
    if cont:
        out["continuous"] = cont
    return out


_FUTURES_SOURCES = frozenset({"ES", "MES", "NQ", "CL", "GC", "RTY", "YM"})


def _continuous_block(source: str, rolls: int = 0) -> dict[str, Any] | None:
    """D6.5 — futures payloads carry the continuous provenance block."""
    src = (source or "").upper()
    if src not in _FUTURES_SOURCES:
        return None
    return {"adjusted": True, "method": "back-adjust", "rolls": int(rolls or 0)}


def _stamp_continuous_coverage(coverage: dict[str, Any] | None) -> dict[str, Any]:
    out: dict[str, Any] = dict(coverage or {})
    for src, rec in list(out.items()):
        if not isinstance(rec, dict):
            continue
        if rec.get("continuous"):
            continue
        block = _continuous_block(str(src))
        if block:
            rec = dict(rec)
            rec["continuous"] = block
            out[src] = rec
    return out


def _coverage_block(body: dict[str, Any]) -> dict[str, Any]:
    """Normalize v1.1 health coverage to {SOURCE: {floor_session, ceiling_session, ...}}."""
    block = body.get("coverage")
    if isinstance(block, dict) and block:
        sample = next(iter(block.values()), None)
        if isinstance(sample, dict) and (
            "floor_session" in sample or "sessions_binned" in sample
        ):
            return block
    out: dict[str, Any] = {}
    for src, rec in (body.get("collectors") or {}).items():
        if isinstance(rec, dict) and isinstance(rec.get("coverage"), dict):
            out[str(src)] = rec["coverage"]
    return out


def health(*, headers: dict[str, str] | None = None) -> dict[str, Any]:
    try:
        body = get_health(headers=headers)
    except ContractMismatch as exc:
        return {
            "named_state": "CONTRACT MISMATCH",
            "detail": str(exc),
            "vp_api_base": api_base(),
            "live_coverage": False,
            "dev_only": True,
        }
    coverage = _stamp_continuous_coverage(_coverage_block(body))
    return {
        **body,
        "coverage": coverage or body.get("coverage"),
        "vp_api_base": api_base(),
        "live_coverage": live_coverage(body),
        "sa_parameter_set_hash": parameter_set_hash(),
        "dev_only": True,
        "collector_store": "READ-ONLY",
        "today": date.today().isoformat(),
    }
