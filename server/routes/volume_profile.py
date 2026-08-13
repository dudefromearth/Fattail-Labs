"""Volume Profile + raw dual-store APIs (Spec v0.4 §10.4).

Request path is read-only — never starts a pull. Production measured artifacts
are gated on P2-3 / C-0 (PRODUCTION_BINS_FROZEN).
"""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, HTTPException, Query, Request

import db
from guards import require_admin, require_session
from market_data.raw_store import KINDS, open_day, scan_raw_inventory, upsert_raw_series_catalog
from market_data.storage import (
    MountError,
    load_mounts,
    market_data_root,
    plane_configured,
    upsert_mount_catalog,
)
from market_data.vp_eligibility import (
    ALGO_VERSION,
    PRODUCTION_BINS_FROZEN,
    QUARANTINED,
    VpEligibilityError,
    resolve_series,
)
from routes.trade_log.common import _require_tool_member

member_router = APIRouter(tags=["volume-profile"])
admin_router = APIRouter(tags=["admin-volume-profile"])


def _require_plane() -> None:
    if not plane_configured():
        raise HTTPException(
            status_code=503,
            detail="volume-profile plane not enabled (set LABS_MARKET_DATA_MOUNTS)",
        )
    try:
        load_mounts(require_present=True)
    except MountError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


def _parse_day(raw: str) -> date:
    try:
        return date.fromisoformat(str(raw).strip()[:10])
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="day must be YYYY-MM-DD") from exc


@member_router.get("/api/me/market/volume-profile")
def get_member_volume_profile(
    request: Request,
    symbol: str = Query(...),
    algo_version: str | None = Query(default=None),
    from_: str | None = Query(default=None, alias="from"),
    to: str | None = Query(default=None),
) -> dict:
    claims = require_session(request)
    _require_tool_member(claims, capability="read")
    _require_plane()
    try:
        resolved = resolve_series(symbol)
    except VpEligibilityError as exc:
        status = 422 if exc.code == "quarantined" else 404
        raise HTTPException(
            status_code=status,
            detail={"code": exc.code, "message": exc.detail},
        ) from exc

    version = (algo_version or ALGO_VERSION).strip()
    payload = {
        "symbol": resolved["symbol"],
        "series_ticker": resolved["series_ticker"],
        "proxy_of": resolved["proxy_of"],
        "price_space": resolved["price_space"],
        "algo_version": version,
        "from": from_,
        "to": to,
        "measured": False,
        "state": "WAITING",
        "reason": (
            "production bins gated on P2-3 condition freeze + C-0; "
            "interim chart is OHLC-window estimate only"
        ),
        "source": None,
        "volumes": None,
        "n_bins": None,
        "method": None,
    }
    if not PRODUCTION_BINS_FROZEN:
        return payload

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT symbol, series_ticker, algo_version, method, store_path,
                       study_start, study_end, as_of_session, n_bins, total_volume,
                       meta_json
                FROM volume_profile_artifact
                WHERE symbol = %s AND algo_version = %s
                """,
                (resolved["symbol"], version),
            )
            row = cur.fetchone()
    if not row:
        payload["state"] = "NOT TRADED"
        payload["reason"] = "no measured artifact for this symbol/algo_version"
        return payload
    payload.update(
        {
            "measured": True,
            "state": "ok",
            "reason": None,
            "method": row.get("method"),
            "store_path": row.get("store_path"),
            "n_bins": row.get("n_bins"),
            "total_volume": row.get("total_volume"),
            "study_start": str(row["study_start"]) if row.get("study_start") else None,
            "study_end": str(row["study_end"]) if row.get("study_end") else None,
            "as_of_session": str(row["as_of_session"]) if row.get("as_of_session") else None,
        }
    )
    return payload


@member_router.get("/api/me/market/raw/day")
def get_member_raw_day(
    request: Request,
    series: str = Query(..., description="Native series ticker (e.g. SPY)"),
    kind: str = Query(..., description="trades | quotes | aggs_1s"),
    day: str = Query(...),
    preview_rows: int = Query(default=0, ge=0, le=50),
) -> dict:
    """Strategy Lab raw-day contract (AT-R8). Opens a partition; does not pull."""
    claims = require_session(request)
    _require_tool_member(claims, capability="read")
    _require_plane()
    kind_n = kind.strip()
    if kind_n not in KINDS:
        raise HTTPException(status_code=422, detail=f"kind must be one of {list(KINDS)}")
    try:
        resolved = resolve_series(series)
    except VpEligibilityError as exc:
        status = 422 if exc.code == "quarantined" else 404
        raise HTTPException(
            status_code=status,
            detail={"code": exc.code, "message": exc.detail},
        ) from exc
    if resolved["series_ticker"] != resolved["symbol"] and series.upper() != resolved["series_ticker"]:
        # Product proxy (SPX) — still open the physical series tape
        pass
    d = _parse_day(day)
    return open_day(
        resolved["series_ticker"],
        kind_n,
        d,
        preview_rows=preview_rows,
    )


@admin_router.get("/api/admin/market/storage/mounts")
def admin_storage_mounts(request: Request) -> dict:
    require_admin(request)
    _require_plane()
    mounts = load_mounts(require_present=True)
    rows = []
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                rows = upsert_mount_catalog(cur, mounts)
    except Exception:
        from market_data.storage import mount_telemetry

        rows = [mount_telemetry(m) for m in mounts]
    return {
        "root": str(market_data_root()),
        "mounts": rows,
        "bins_frozen": PRODUCTION_BINS_FROZEN,
        "algo_version": ALGO_VERSION,
    }


@admin_router.get("/api/admin/market/raw/status")
def admin_raw_status(request: Request) -> dict:
    require_admin(request)
    _require_plane()
    inv = scan_raw_inventory()
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                upsert_raw_series_catalog(cur, inv)
    except Exception:
        # Catalog is convenience; inventory from disk is SoR
        pass
    return {
        "root": str(market_data_root()),
        "series": inv,
        "bins_frozen": PRODUCTION_BINS_FROZEN,
    }


@admin_router.get("/api/admin/market/volume-profile/status")
def admin_vp_status(
    request: Request,
    symbol: str | None = Query(default=None),
    algo_version: str | None = Query(default=None),
) -> dict:
    require_admin(request)
    _require_plane()
    version = (algo_version or ALGO_VERSION).strip()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            if symbol:
                cur.execute(
                    """
                    SELECT symbol, series_ticker, algo_version, method, store_path,
                           study_start, study_end, as_of_session, n_bins, total_volume
                    FROM volume_profile_artifact
                    WHERE symbol = %s AND algo_version = %s
                    """,
                    (symbol.strip().upper(), version),
                )
            else:
                cur.execute(
                    """
                    SELECT symbol, series_ticker, algo_version, method, store_path,
                           study_start, study_end, as_of_session, n_bins, total_volume
                    FROM volume_profile_artifact
                    WHERE algo_version = %s
                    """,
                    (version,),
                )
            artifacts = list(cur.fetchall() or [])
            cur.execute(
                """
                SELECT public_id, job_type, symbol, series_ticker, kind, status, created_at
                FROM volume_profile_job
                ORDER BY id DESC
                LIMIT 20
                """
            )
            jobs = list(cur.fetchall() or [])
    return {
        "algo_version": version,
        "bins_frozen": PRODUCTION_BINS_FROZEN,
        "quarantined": sorted(QUARANTINED),
        "artifacts": artifacts,
        "recent_jobs": jobs,
    }


@admin_router.post("/api/admin/market/raw/backfill")
def admin_raw_backfill(request: Request) -> dict:
    """Queue only — request path never starts a pull (Spec §10.4)."""
    require_admin(request)
    _require_plane()
    raise HTTPException(
        status_code=409,
        detail={
            "code": "read_only_request_path",
            "message": (
                "HTTP must not start a Massive pull. Run "
                "python -m market_data.raw_campaign on the job host."
            ),
        },
    )


@admin_router.post("/api/admin/market/volume-profile/rebuild")
def admin_vp_rebuild(request: Request) -> dict:
    require_admin(request)
    _require_plane()
    if not PRODUCTION_BINS_FROZEN:
        raise HTTPException(
            status_code=409,
            detail={
                "code": "bins_not_frozen",
                "message": "production bin writes wait on P2-3 condition freeze + C-0",
            },
        )
    raise HTTPException(status_code=501, detail="rebuild not implemented until C-1")
