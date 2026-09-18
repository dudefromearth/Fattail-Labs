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
        **_unserved(),
    }


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
    return {
        **body,
        "vp_api_base": api_base(),
        "live_coverage": live_coverage(body),
        "sa_parameter_set_hash": parameter_set_hash(),
        "dev_only": True,
        "collector_store": "READ-ONLY",
        "today": date.today().isoformat(),
    }
