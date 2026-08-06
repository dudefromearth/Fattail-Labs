"""Strategy Lab Curate run environment API.

/api/me/strategy-lab/curate/*
Sim broker + fake money only — never Tradier.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Request

import db
import strategy_lab_domain as sld
from guards import require_session
from routes.trade_log.common import _storage_identity_id
from strategy_runtime import curate_domain as cd
from strategy_runtime.envelope import normalize_envelope
from strategy_runtime.marks import MarksError
from strategy_runtime.tick import run_tick, tick_many

router = APIRouter(tags=["strategy-lab-curate"])


def _iid(cur, claims: dict) -> int:
    return _storage_identity_id(cur, claims)


@router.get("/api/me/strategy-lab/curate/meta")
def curate_meta(request: Request) -> dict:
    require_session(request)
    from market_data import live_marks as lm

    with db.transaction() as conn:
        with conn.cursor() as cur:
            universe = lm.list_universe(cur, enabled_only=True)
            hb = lm.get_heartbeat(cur)
    return {
        "account_mode": "curate_sim",
        "broker": "sim",
        "fill_model": cd.FILL_MODEL_MARK_MID_V1,
        "fill_model_label": (
            "mark_mid_v1 — sim fills at package entry; marks walk for manage; "
            "not live broker; not Tradier"
        ),
        "statuses": sorted(cd.STATUSES),
        "deploy_for_members": False,
        "shared_live_marks": True,
        "symbol_universe": [u["symbol"] for u in universe],
        "stream_heartbeat": hb,
        "note": (
            "Design+Curate multi-member; one shared live marks stream for all "
            "collections. Deploy Tradier separate."
        ),
    }


@router.get("/api/me/strategy-lab/curate/correlation")
def curate_correlation(
    request: Request,
    a: str = "",
    b: str = "",
    days: int = 60,
) -> dict:
    """Pearson correlation of daily returns for any two symbols."""
    require_session(request)
    from market_data.correlation import correlate_symbols

    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                return correlate_symbols(cur, a, b, days=days)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/api/me/strategy-lab/curate/correlation/relative")
def curate_correlation_relative(
    request: Request,
    symbols: str = "",
    benchmark: str = "SPY",
    days: int = 60,
) -> dict:
    """Relative correlations: each symbol vs benchmark (+ pairwise).

    symbols: comma-separated list (default: enabled tradeable universe).
    """
    require_session(request)
    from market_data.correlation import relative_correlations
    from market_data import live_marks as lm

    with db.transaction() as conn:
        with conn.cursor() as cur:
            if symbols.strip():
                syms = [s.strip().upper() for s in symbols.split(",") if s.strip()]
            else:
                syms = [
                    u["symbol"]
                    for u in lm.list_universe(cur, enabled_only=True)
                    if (u.get("role") or "tradeable") == "tradeable"
                ]
            try:
                return relative_correlations(
                    cur, syms, benchmark=benchmark, days=days
                )
            except Exception as exc:  # noqa: BLE001
                raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/api/me/strategy-lab/curate/symbols")
def curate_symbols_catalog(
    request: Request, tradeable_only: bool = False
) -> dict:
    """Symbol universe catalog for Curate pickers — organized by type."""
    require_session(request)
    from market_data import live_marks as lm

    with db.transaction() as conn:
        with conn.cursor() as cur:
            return lm.symbol_catalog(cur, tradeable_only=tradeable_only)


@router.get("/api/me/strategy-lab/curate/symbols/{symbol}")
def curate_symbol_detail(symbol: str, request: Request) -> dict:
    """Symbol info page payload (mark, cadence, role, honesty)."""
    require_session(request)
    from market_data import live_marks as lm

    with db.transaction() as conn:
        with conn.cursor() as cur:
            detail = lm.symbol_detail(cur, symbol)
    if detail is None:
        raise HTTPException(status_code=404, detail="Symbol not in universe")
    return detail


@router.get("/api/me/strategy-lab/curate/live-marks")
def curate_live_marks(request: Request) -> dict:
    """Shared live marks stream status + latest mids (all members read the same)."""
    require_session(request)
    from market_data import live_marks as lm

    with db.transaction() as conn:
        with conn.cursor() as cur:
            return lm.stream_status_payload(cur)


@router.get("/api/me/strategy-lab/curate/vol-reference")
def curate_vol_reference(request: Request) -> dict:
    """VIX + Daily VIX (VIX1D) for strategy decisions — shared multi-member reference.

    Includes mid, prev_close (daily reference), day_change_pct, proxy honesty flags.
    """
    require_session(request)
    from market_data import live_marks as lm

    with db.transaction() as conn:
        with conn.cursor() as cur:
            return lm.vol_reference(cur)


@router.get("/api/me/strategy-lab/curate/reports-book")
def curate_reports_book(
    request: Request, starting_capital: float = 50_000.0
) -> dict:
    """Practice-style equity/stats book from Curate closed packages (process book)."""
    claims = require_session(request)
    from strategy_runtime.reports_book import build_run_reports_book

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            return build_run_reports_book(
                cur,
                iid,
                starting_capital=float(starting_capital),
                source="curate_sim",
            )


@router.get("/api/me/strategy-lab/deploy/reports-book")
def deploy_reports_book(
    request: Request, starting_capital: float = 50_000.0
) -> dict:
    """Deploy phase reports — same DTO as Practice Reports.

    Until Tradier Deploy multi-member is live, built from Curate closed outcomes
    with an honest source_note (process book for promote / portfolio).
    """
    claims = require_session(request)
    from strategy_runtime.reports_book import build_run_reports_book

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            book = build_run_reports_book(
                cur,
                iid,
                starting_capital=float(starting_capital),
                source="curate_sim",
            )
    book["account_label"] = "Strategy Lab · Deploy reports"
    book["phase"] = "deployment"
    book["source_note"] = (
        "Detailed equity & stats (Practice Reports layout). "
        "Data from closed Curate sim packages until Tradier Deploy fills the same path."
    )
    return book


@router.get("/api/me/strategy-lab/curate/comparison")
def curate_comparison(request: Request) -> dict:
    """Compare all this member's Curate strategy runs (portfolio / promote).

    Multi-member product: each member sees only their identity-scoped runs.
    Purpose: many strategies side-by-side for promote vs portfolio inclusion.
    """
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            return cd.comparison_report(cur, iid)


@router.post("/api/me/strategy-lab/curate/tick-all")
async def curate_tick_all(request: Request) -> dict:
    """Tick every armed/running Curate instance for this member (multi-strategy)."""
    claims = require_session(request)
    body: dict[str, Any] = {}
    try:
        raw = await request.json()
        if isinstance(raw, dict):
            body = raw
    except Exception:
        body = {}
    mark_step_frac = float(body.get("mark_step_frac", 0.15))

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            rows = cd.list_tickable_instances(cur, iid)
            if not rows:
                return {
                    "ticked": 0,
                    "ok": 0,
                    "errors": 0,
                    "results": [],
                    "note": "No armed or running Curate instances",
                }
            out = tick_many(cur, rows, mark_step_frac=mark_step_frac)
    out["scope"] = "member"
    out["identity_scoped"] = True
    return out


@router.post("/api/me/strategy-lab/curate/platform-tick")
async def curate_platform_tick(request: Request) -> dict:
    """Multi-member worker tick: all armed/running Curate instances (admin).

    Fair order: oldest last_tick_at first. Isolates errors per instance.
    """
    claims = require_session(request)
    role = str(claims.get("role") or "")
    if role != "administrator":
        raise HTTPException(status_code=403, detail="administrator required")
    body: dict[str, Any] = {}
    try:
        raw = await request.json()
        if isinstance(raw, dict):
            body = raw
    except Exception:
        body = {}
    mark_step_frac = float(body.get("mark_step_frac", 0.15))
    limit = int(body.get("limit", 500))

    with db.transaction() as conn:
        with conn.cursor() as cur:
            rows = cd.list_all_tickable_instances(cur, limit=limit)
            out = tick_many(cur, rows, mark_step_frac=mark_step_frac)
    out["scope"] = "platform"
    out["multi_member"] = True
    return out


@router.get("/api/me/strategy-lab/curate/positions-report")
def curate_positions_report(
    request: Request,
    status: str = "all",
    strategy_id: str | None = None,
    limit: int = 200,
) -> dict:
    """Report all Curate (sim) positions and progress for this member.

    Not Tradier Deploy — sim packages only until member Deploy is provisioned.
    """
    claims = require_session(request)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                report = cd.positions_report(
                    cur,
                    iid,
                    status=status,
                    strategy_public_id=strategy_id,
                    limit=limit,
                )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return report


@router.get("/api/me/strategy-lab/curate/instances")
def list_curate_instances(
    request: Request, strategy_id: str | None = None
) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            instances = cd.list_instances(cur, iid, strategy_id)
    return {"instances": instances}


@router.post("/api/me/strategy-lab/curate/instances")
async def create_curate_instance(request: Request) -> dict:
    claims = require_session(request)
    try:
        body = await request.json()
    except Exception as exc:
        raise HTTPException(status_code=422, detail="JSON body required") from exc
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")
    strategy_public_id = str(body.get("strategy_id") or "").strip()
    if not strategy_public_id:
        raise HTTPException(status_code=422, detail="strategy_id required")
    envelope_in = body.get("envelope")
    if envelope_in is not None and not isinstance(envelope_in, dict):
        raise HTTPException(status_code=422, detail="envelope must be object")

    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                srow = sld.get_by_public_id(cur, iid, strategy_public_id)
                if srow is None:
                    raise HTTPException(status_code=404, detail="Strategy not found")
                env = None
                if envelope_in:
                    from market_data import live_marks as lm

                    env = normalize_envelope(envelope_in)
                    scan_sym = str(env.get("scan_symbol") or "").upper()
                    if scan_sym and not lm.is_tradeable_symbol(cur, scan_sym):
                        raise HTTPException(
                            status_code=422,
                            detail=(
                                f"scan_symbol {scan_sym!r} is not a tradeable "
                                f"universe symbol (use Curate symbol picker)"
                            ),
                        )
                instance = cd.create_instance(
                    cur, identity_id=iid, strategy_row=srow, envelope=env
                )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    return {"instance": instance}


@router.get("/api/me/strategy-lab/curate/instances/{public_id}")
def get_curate_instance(public_id: str, request: Request) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            row = cd.get_instance(cur, iid, public_id)
            if row is None:
                raise HTTPException(status_code=404, detail="Curate instance not found")
            inst = cd.instance_to_dict(row)
            positions = cd.list_positions(cur, iid, int(row["id"]))
            decisions = cd.list_decisions(cur, iid, int(row["id"]), limit=50)
    return {"instance": inst, "positions": positions, "decisions": decisions}


@router.post("/api/me/strategy-lab/curate/instances/{public_id}/arm")
def arm_curate_instance(public_id: str, request: Request) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            row = cd.get_instance(cur, iid, public_id)
            if row is None:
                raise HTTPException(status_code=404, detail="Curate instance not found")
            if row["status"] not in ("draft", "paused", "halted"):
                raise HTTPException(
                    status_code=422,
                    detail=f"cannot arm from status {row['status']!r}",
                )
            inst = cd.set_status(
                cur, row, status="armed", message="Curate instance armed"
            )
    return {"instance": inst}


@router.post("/api/me/strategy-lab/curate/instances/{public_id}/pause")
def pause_curate_instance(public_id: str, request: Request) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            row = cd.get_instance(cur, iid, public_id)
            if row is None:
                raise HTTPException(status_code=404, detail="Curate instance not found")
            if row["status"] not in ("armed", "running"):
                raise HTTPException(
                    status_code=422,
                    detail=f"cannot pause from status {row['status']!r}",
                )
            inst = cd.set_status(
                cur, row, status="paused", message="Curate instance paused"
            )
    return {"instance": inst}


@router.post("/api/me/strategy-lab/curate/instances/{public_id}/tick")
async def tick_curate_instance(public_id: str, request: Request) -> dict:
    """Run one manage-before-scan tick (member-triggered v1; worker later)."""
    claims = require_session(request)
    body: dict[str, Any] = {}
    try:
        raw = await request.json()
        if isinstance(raw, dict):
            body = raw
    except Exception:
        body = {}

    mark_overrides = body.get("mark_overrides")
    if mark_overrides is not None and not isinstance(mark_overrides, dict):
        raise HTTPException(status_code=422, detail="mark_overrides must be object")
    mark_step_frac = float(body.get("mark_step_frac", 0.15))
    force_pnl_frac = body.get("force_pnl_frac")
    if force_pnl_frac is not None:
        force_pnl_frac = float(force_pnl_frac)

    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                row = cd.get_instance(cur, iid, public_id)
                if row is None:
                    raise HTTPException(
                        status_code=404, detail="Curate instance not found"
                    )
                result = run_tick(
                    cur,
                    row,
                    mark_overrides=mark_overrides,
                    mark_step_frac=mark_step_frac,
                    force_pnl_frac=force_pnl_frac,
                )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except MarksError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return result


@router.get("/api/me/strategy-lab/curate/instances/{public_id}/decisions")
def list_curate_decisions(
    public_id: str, request: Request, limit: int = 100
) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            row = cd.get_instance(cur, iid, public_id)
            if row is None:
                raise HTTPException(status_code=404, detail="Curate instance not found")
            decisions = cd.list_decisions(
                cur, iid, int(row["id"]), limit=limit
            )
    return {"decisions": decisions}
