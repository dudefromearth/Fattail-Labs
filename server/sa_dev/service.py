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


_TF_SECONDS = {"1m": 60, "5m": 300, "15m": 900, "1h": 3600, "1d": 86400}


def bar_invariant(bar: dict[str, Any]) -> bool:
    """l ≤ min(o,c) ≤ max(o,c) ≤ h. Wicks are that bar's own range."""
    try:
        o = float(bar["o"])
        h = float(bar["h"])
        l = float(bar["l"])
        c = float(bar["c"])
    except (KeyError, TypeError, ValueError):
        return False
    return l <= min(o, c) <= max(o, c) <= h


def dominant_contract(rows: list[dict[str, Any]]) -> str | None:
    """Lead ticker only. Prefer select_lead_contract (calendar + volume)."""
    from market_data.vp_ingest.lead_contract import volume_leader

    return volume_leader(rows)


def bars_from_prints(
    rows: list[dict[str, Any]],
    *,
    tf: str = "5m",
    product: str | None = None,
    contracts: list[dict[str, Any]] | None = None,
    as_of: date | None = None,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], str | None, str]:
    """Aggregate SOURCE-space prints into OHLC. One lead contract. Drop illegal bars."""
    from market_data.vp_ingest.lead_contract import select_lead_contract
    from market_data.vp_ingest.store import vendor_ts_to_seconds

    contract, lead_rule = select_lead_contract(
        rows, product=product, contracts=contracts, as_of=as_of
    )
    if contract:
        rows = [
            r
            for r in rows
            if str(r.get("contract") or "").strip().upper() == contract
        ]
    step = _TF_SECONDS.get(tf, 300)
    buckets: dict[int, dict[str, Any]] = {}
    for rec in rows:
        try:
            px = float(rec.get("p") if rec.get("p") is not None else rec.get("price"))
            ts = vendor_ts_to_seconds(rec.get("t") or 0)
        except (TypeError, ValueError):
            continue
        if px <= 0 or ts <= 0:
            continue
        bucket = int(ts // step) * step
        vol = rec.get("s") if rec.get("s") is not None else rec.get("size") or 0
        try:
            vol_n = float(vol)
        except (TypeError, ValueError):
            vol_n = 0
        bar = buckets.get(bucket)
        if bar is None:
            buckets[bucket] = {
                "t": bucket * 1000,
                "o": px,
                "h": px,
                "l": px,
                "c": px,
                "v": vol_n,
            }
        else:
            bar["h"] = max(bar["h"], px)
            bar["l"] = min(bar["l"], px)
            bar["c"] = px
            bar["v"] = (bar.get("v") or 0) + vol_n
    honest: list[dict[str, Any]] = []
    gaps: list[dict[str, Any]] = []
    for k in sorted(buckets):
        bar = buckets[k]
        if bar_invariant(bar):
            honest.append(bar)
        else:
            gaps.append({"t": bar["t"], "reason": "invariant"})
    return honest, gaps, contract, lead_rule


def ohlc_for_source(
    source: str,
    *,
    tf: str = "5m",
    lookback_days: int = 5,
) -> dict[str, Any]:
    """Admin-dev SOURCE-space OHLC from the VP print store (A12.4 / A8.4)."""
    from sa_dev.store_read import list_source_days, load_prints, store_ok

    src = (source or "").upper()
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
    from market_data.vp_hot import hot
    from market_data.vp_ingest.store import prints_path

    stamp_parts: list[str] = []
    root = None
    try:
        from sa_dev.store_read import store_root

        root = store_root()
    except Exception:
        root = None
    if root is not None:
        for iso in days:
            p = prints_path(root, src, date.fromisoformat(iso))
            if p.is_file():
                st = p.stat()
                stamp_parts.append(f"{iso}:{int(st.st_mtime)}:{st.st_size}")
    stamp = f"{src}:{tf}:{lookback_days}:" + "|".join(stamp_parts)
    ck = f"ohlc:{src}:{tf}:{lookback_days}"
    layer = hot()
    if layer.enabled and stamp_parts:
        cached = layer.get(ck)
        if cached and isinstance(cached.get("body"), dict) and layer.gen_matches(cached, stamp):
            return cached["body"]
    rows: list[dict[str, Any]] = []
    for iso in days:
        rows.extend(load_prints(src, date.fromisoformat(iso)))
    bars, gaps, contract, lead_rule = bars_from_prints(
        rows, tf=tf, product=src
    )
    last_t = bars[-1]["t"] if bars else 0
    gid = f"{src}:{tf}:{contract or ''}:{last_t}:{len(bars)}"
    out = {
        "ok": True,
        "source": src,
        "space": "source",
        "tf": tf,
        "lookback_days": lookback_days,
        "bars": bars,
        "bar_count": len(bars),
        "gaps": gaps,
        "contract": contract,
        "lead_rule": lead_rule,
        "store": detail,
        "profile_generation_id": gid,
    }
    if layer.enabled and stamp_parts:
        layer.set(ck, out, gen=stamp)
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
    coverage = _coverage_block(body)
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
