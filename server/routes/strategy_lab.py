"""Strategy Lab API — member-owned strategies (identity_id isolation).

All routes under /api/me/strategy-lab/*.
Artifacts always belong to the session identity; never cross-tenant.
Portability: Specs/Strategy-Lab-Portability-Spec-v1.0.md
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse

import db
import member_privacy as privacy
import strategy_lab_domain as sld
from config import get_config
from guards import require_session
from routes.trade_log.common import _storage_identity_id

router = APIRouter(tags=["strategy-lab"])


def _iid(cur, claims: dict) -> int:
    return _storage_identity_id(cur, claims)


def _get_owned(cur, identity_id: int, public_id: str) -> dict:
    row = sld.get_by_public_id(cur, identity_id, public_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return row


@router.get("/api/me/strategy-lab/meta")
def strategy_lab_meta(request: Request) -> dict:
    """Phase/state machine catalog (no auth secrets)."""
    require_session(request)
    return sld.meta_payload()


@router.get("/api/me/strategy-lab/strategies")
def list_strategies(request: Request) -> dict:
    """List this member's strategies. Seeds one blank strategy if empty."""
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            cur.execute(
                "SELECT COUNT(*) AS n FROM strategy_lab_strategies WHERE identity_id = %s",
                (iid,),
            )
            n = int(cur.fetchone()["n"])
            if n == 0:
                sld.ensure_seed(cur, iid)
            strategies = sld.list_strategies(cur, iid)
    return {
        "strategies": strategies,
        "max_per_phase": sld.MAX_PER_PHASE,
        "identity_scoped": True,
    }


@router.post("/api/me/strategy-lab/strategies")
async def create_strategy(request: Request) -> dict:
    claims = require_session(request)
    try:
        body = await request.json()
    except Exception as exc:
        raise HTTPException(status_code=422, detail="JSON body required") from exc
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")
    name = str(body.get("name") or "Untitled strategy")
    description = str(body.get("description") or "")
    phase = str(body.get("phase") or "development")
    phase_state = body.get("phase_state")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                strategy = sld.create_strategy(
                    cur,
                    iid,
                    name=name,
                    description=description,
                    phase=phase,
                    phase_state=str(phase_state) if phase_state else None,
                    blank=True,
                )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return {"strategy": strategy}


@router.get("/api/me/strategy-lab/strategies/{public_id}")
def get_strategy(public_id: str, request: Request) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            row = _get_owned(cur, iid, public_id)
            strategy = sld.row_to_dict(row)
    return {"strategy": strategy}


@router.patch("/api/me/strategy-lab/strategies/{public_id}")
async def patch_strategy(public_id: str, request: Request) -> dict:
    """Rename, description, and/or phase_state. Ownership enforced."""
    claims = require_session(request)
    try:
        body = await request.json()
    except Exception as exc:
        raise HTTPException(status_code=422, detail="JSON body required") from exc
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            _get_owned(cur, iid, public_id)
            strategy = None
            try:
                if "name" in body:
                    strategy = sld.rename(
                        cur,
                        iid,
                        public_id,
                        str(body.get("name") or ""),
                        bump_version=bool(body.get("bump_version")),
                        bump_part=str(body.get("bump_part") or "minor"),
                    )
                if "description" in body:
                    strategy = sld.patch_description(
                        cur, iid, public_id, str(body.get("description") or "")
                    )
                if "phase_state" in body:
                    strategy = sld.set_phase_state(
                        cur, iid, public_id, str(body["phase_state"])
                    )
            except ValueError as exc:
                raise HTTPException(status_code=422, detail=str(exc)) from exc
            if strategy is None:
                row = _get_owned(cur, iid, public_id)
                strategy = sld.row_to_dict(row)
    return {"strategy": strategy}


@router.post("/api/me/strategy-lab/strategies/{public_id}/advance-state")
def advance_state(public_id: str, request: Request) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            _get_owned(cur, iid, public_id)
            try:
                strategy = sld.advance_phase_state(cur, iid, public_id)
            except ValueError as exc:
                raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"strategy": strategy}


@router.post("/api/me/strategy-lab/strategies/{public_id}/move")
async def move_strategy(public_id: str, request: Request) -> dict:
    claims = require_session(request)
    try:
        body = await request.json()
    except Exception as exc:
        raise HTTPException(status_code=422, detail="JSON body required") from exc
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")
    to_phase = str(body.get("phase") or body.get("to_phase") or "").strip()
    if not to_phase:
        raise HTTPException(status_code=422, detail="phase is required")
    reason = body.get("reason")
    phase_state = body.get("phase_state") or body.get("disposition")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            _get_owned(cur, iid, public_id)
            try:
                strategy = sld.move_phase(
                    cur,
                    iid,
                    public_id,
                    to_phase,
                    reason=str(reason) if reason else None,
                    phase_state=str(phase_state) if phase_state else None,
                )
            except ValueError as exc:
                raise HTTPException(status_code=409, detail=str(exc)) from exc
    return {"strategy": strategy}


@router.post("/api/me/strategy-lab/strategies/{public_id}/backtest")
def run_backtest(public_id: str, request: Request) -> dict:
    """Development in-sample back test of pack settings (stub until Massive)."""
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            _get_owned(cur, iid, public_id)
            try:
                out = sld.run_backtest(cur, iid, public_id)
            except ValueError as exc:
                raise HTTPException(status_code=422, detail=str(exc)) from exc
    return out


@router.post("/api/me/strategy-lab/strategies/{public_id}/forward-walk")
def run_forward_walk(public_id: str, request: Request) -> dict:
    """Development walk-forward validation before Curation."""
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            _get_owned(cur, iid, public_id)
            try:
                out = sld.run_forward_walk(cur, iid, public_id)
            except ValueError as exc:
                raise HTTPException(status_code=422, detail=str(exc)) from exc
    return out


@router.get("/api/me/strategy-lab/strategies/{public_id}/validation")
def get_validation(public_id: str, request: Request) -> dict:
    """Checklist: back test + forward walk status for Development → Curation."""
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            row = _get_owned(cur, iid, public_id)
            strategy = sld.row_to_dict(row)
    attrs = strategy.get("attributes") if isinstance(strategy.get("attributes"), dict) else {}
    bag = attrs.get("validation@1") if isinstance(attrs.get("validation@1"), dict) else {}
    gaps = sld.validation_gaps(strategy)
    return {
        "validation": bag,
        "gaps": gaps,
        "ready_for_curation": (
            sld.normalize_phase(strategy.get("phase")) == "development"
            and sld.ready_for_curation(str(strategy.get("phase_state") or ""))
            and not gaps
        ),
        "phase_state": strategy.get("phase_state"),
        "phase_state_label": strategy.get("phase_state_label"),
    }


@router.post("/api/me/strategy-lab/strategies/{public_id}/promote")
def promote_strategy(public_id: str, request: Request) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            row = _get_owned(cur, iid, public_id)
            strategy_dict = sld.row_to_dict(row)
            pack_cfg = sld.get_pack_config(strategy_dict)
            if pack_cfg:
                from strategy_packs.registry import get_pack

                pack_id = str(pack_cfg.get("pack_id") or "butterfly")
                mod = get_pack(pack_id)
                if mod is not None and hasattr(mod, "before_promote_to_curation"):
                    if not mod.before_promote_to_curation(pack_cfg):
                        raise HTTPException(
                            status_code=422,
                            detail="Pack config invalid for promote to Curation",
                        )
            try:
                strategy = sld.promote(cur, iid, public_id)
            except ValueError as exc:
                raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"strategy": strategy}


@router.post("/api/me/strategy-lab/strategies/{public_id}/bin")
async def bin_strategy(public_id: str, request: Request) -> dict:
    claims = require_session(request)
    try:
        body = await request.json()
    except Exception as exc:
        raise HTTPException(status_code=422, detail="JSON body required") from exc
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")
    disposition = str(body.get("disposition") or "retired").strip().lower()
    if disposition not in ("retired", "trashed"):
        raise HTTPException(
            status_code=422, detail="disposition must be retired or trashed"
        )
    reason = str(body.get("reason") or "").strip()
    if not reason:
        raise HTTPException(status_code=422, detail="reason is required")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            _get_owned(cur, iid, public_id)
            strategy = sld.move_phase(
                cur,
                iid,
                public_id,
                "bin",
                reason=reason,
                phase_state=disposition,
            )
    return {"strategy": strategy}


def _env_name() -> str:
    try:
        return str(get_config().env or "dev")
    except Exception:
        return "dev"


def _email_for(cur, claims: dict) -> str:
    email = str(claims.get("email") or "").strip()
    if email:
        return email
    iid = int(claims.get("identity_id") or 0)
    if iid:
        cur.execute(
            "SELECT email FROM identities WHERE identity_id = %s LIMIT 1",
            (iid,),
        )
        row = cur.fetchone()
        if row and row.get("email"):
            return str(row["email"])
    return ""


async def _read_lab_document(request: Request) -> tuple[dict[str, Any], str, str | None]:
    """Return (document, policy, confirm)."""
    ctype = (request.headers.get("content-type") or "").lower()
    policy = "additive"
    confirm: str | None = None
    document: Any = None

    if "multipart/form-data" in ctype:
        form = await request.form()
        policy = str(form.get("policy") or "additive").strip().lower()
        confirm = str(form.get("confirm") or "") or None
        upload = form.get("file")
        if upload is None:
            raise HTTPException(status_code=422, detail="file required")
        raw = await upload.read()
        if len(raw) > sld.MAX_IMPORT_BYTES:
            raise HTTPException(status_code=413, detail="payload_too_large")
        import json as _json

        try:
            document = _json.loads(raw.decode("utf-8"))
        except Exception as exc:
            raise HTTPException(status_code=422, detail="invalid JSON file") from exc
    else:
        try:
            body = await request.json()
        except Exception as exc:
            raise HTTPException(status_code=422, detail="JSON body required") from exc
        if not isinstance(body, dict):
            raise HTTPException(status_code=422, detail="JSON object required")
        policy = str(body.get("policy") or "additive").strip().lower()
        confirm = body.get("confirm")
        if confirm is not None:
            confirm = str(confirm)
        if "document" in body and isinstance(body["document"], dict):
            document = body["document"]
        elif body.get("format") == sld.FORMAT_ID:
            document = body
        elif body.get("text") or body.get("content"):
            import json as _json

            raw_text = str(body.get("text") or body.get("content") or "")
            if len(raw_text.encode("utf-8")) > sld.MAX_IMPORT_BYTES:
                raise HTTPException(status_code=413, detail="payload_too_large")
            try:
                document = _json.loads(raw_text)
            except Exception as exc:
                raise HTTPException(status_code=422, detail="invalid JSON text") from exc
        else:
            raise HTTPException(
                status_code=422,
                detail="document (or full pack) required",
            )

    if not isinstance(document, dict):
        raise HTTPException(status_code=422, detail="document must be a JSON object")
    return document, policy, confirm


@router.get("/api/me/strategy-lab/export")
def export_lab(
    request: Request,
    include_bin: bool = True,
    include_email: bool = False,
) -> Any:
    """Download whole Strategy Lab pack (Portability Spec v1.0).

    Email omitted by default (SLP-6); pass include_email=true to stamp label only.
    """
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            pack = sld.build_export_pack(
                cur,
                iid,
                email=_email_for(cur, claims) if include_email else None,
                include_email=include_email,
                env=_env_name(),
                include_bin=include_bin,
            )
            privacy.audit(
                cur,
                actor_identity_id=iid,
                subject_identity_id=iid,
                action="export",
                surfaces=["strategy_lab"],
                detail=f"strategies={pack['lab']['counts']['total']}",
            )
    return JSONResponse(
        pack,
        headers={
            "Content-Disposition": 'attachment; filename="strategy-lab-export.json"'
        },
    )


@router.post("/api/me/strategy-lab/import/detect")
async def import_detect(request: Request) -> dict:
    claims = require_session(request)
    document, _policy, _confirm = await _read_lab_document(request)
    result = sld.detect_pack(document)
    if not result.get("ok"):
        raise HTTPException(
            status_code=422,
            detail={
                "error": result.get("error"),
                "message": result.get("detail"),
            },
        )
    return result


@router.post("/api/me/strategy-lab/import/preview")
async def import_preview(request: Request) -> dict:
    claims = require_session(request)
    document, policy, _confirm = await _read_lab_document(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            preview = sld.preview_import(cur, iid, document, policy=policy)
    if preview.get("error") == "invalid_format" or preview.get("error") == "unsupported_model":
        raise HTTPException(
            status_code=422,
            detail={
                "error": preview.get("error"),
                "message": preview.get("detail"),
                "preview": preview,
            },
        )
    return preview


@router.post("/api/me/strategy-lab/import/commit")
async def import_commit(request: Request) -> dict:
    claims = require_session(request)
    document, policy, confirm = await _read_lab_document(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            try:
                result = sld.commit_import(
                    cur,
                    iid,
                    document,
                    policy=policy,
                    confirm=confirm,
                )
            except PermissionError as exc:
                raise HTTPException(status_code=422, detail=str(exc)) from exc
            except RuntimeError as exc:
                raise HTTPException(
                    status_code=500, detail=str(exc)
                ) from exc
            except ValueError as exc:
                code = str(exc)
                status = 409 if code == "phase_capacity" else 422
                raise HTTPException(status_code=status, detail=code) from exc
            privacy.audit(
                cur,
                actor_identity_id=iid,
                subject_identity_id=iid,
                action="import",
                surfaces=["strategy_lab"],
                detail=(
                    f"policy={result.get('policy')} created={result.get('created')} "
                    f"skipped={result.get('skipped')} recovery={result.get('recovery_id')}"
                ),
            )
    return result


# ── Strategy Packs (Architecture Spec + Implementation Plan PR-1/2/3) ──────


@router.get("/api/me/strategy-lab/packs")
def list_packs(request: Request) -> dict:
    require_session(request)
    from strategy_packs.registry import list_packs as _list

    return {"packs": _list(enabled_only=True)}


@router.get("/api/me/strategy-lab/packs/{pack_id}")
def get_pack_detail(pack_id: str, request: Request) -> dict:
    require_session(request)
    from strategy_packs.registry import pack_detail

    try:
        return pack_detail(pack_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/api/me/strategy-lab/packs/{pack_id}/validate")
async def validate_pack_config(pack_id: str, request: Request) -> dict:
    require_session(request)
    try:
        body = await request.json()
    except Exception as exc:
        raise HTTPException(status_code=422, detail="JSON body required") from exc
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")
    config = body.get("config") if "config" in body else body
    if not isinstance(config, dict):
        raise HTTPException(status_code=422, detail="config object required")
    from strategy_packs.registry import get_pack_or_raise

    try:
        mod = get_pack_or_raise(pack_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return mod.validate(config)


@router.post("/api/me/strategy-lab/packs/{pack_id}/rank")
async def rank_pack_structures(pack_id: str, request: Request) -> dict:
    require_session(request)
    try:
        body = await request.json()
    except Exception as exc:
        raise HTTPException(status_code=422, detail="JSON body required") from exc
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")
    config = body.get("config")
    if not isinstance(config, dict):
        raise HTTPException(status_code=422, detail="config object required")
    strict = bool(body.get("strict_primary"))
    from strategy_packs.chain_stub import build_stub_chain
    from strategy_packs.packs.butterfly.validation import resolve_dte_window
    from strategy_packs.registry import get_pack_or_raise

    try:
        mod = get_pack_or_raise(pack_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    chain = body.get("chain")
    if not isinstance(chain, dict):
        window = resolve_dte_window(config) or (0, 0)
        dte = window[0]
        chain = build_stub_chain(
            underlying=str(config.get("underlying") or "SPX"),
            dte=dte,
        )

    if not hasattr(mod, "rank_structures"):
        raise HTTPException(status_code=501, detail="Pack does not support rank")
    result = mod.rank_structures(config, chain, strict_primary=strict)
    if not result.get("ok"):
        code = result.get("error") or "rank_failed"
        status = 422
        raise HTTPException(
            status_code=status,
            detail={"error": code, "message": result.get("detail"), "result": result},
        )
    return result


@router.put("/api/me/strategy-lab/strategies/{public_id}/pack-config")
async def put_pack_config(public_id: str, request: Request) -> dict:
    """Save pack config onto strategy attributes (version bump default)."""
    claims = require_session(request)
    try:
        body = await request.json()
    except Exception as exc:
        raise HTTPException(status_code=422, detail="JSON body required") from exc
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")
    pack_id = str(body.get("pack_id") or "butterfly")
    config = body.get("config")
    if not isinstance(config, dict):
        raise HTTPException(status_code=422, detail="config object required")
    bump = body.get("bump_version")
    if bump is None:
        bump = True
    from strategy_packs.registry import get_pack_or_raise

    try:
        mod = get_pack_or_raise(pack_id)
        pack_version = str(mod.meta().get("version") or "1.0.0")
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            _get_owned(cur, iid, public_id)
            try:
                strategy = sld.set_pack_config(
                    cur,
                    iid,
                    public_id,
                    pack_id=pack_id,
                    pack_version=pack_version,
                    config=config,
                    bump_version=bool(bump),
                )
            except ValueError as exc:
                raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"strategy": strategy}


@router.get("/api/me/strategy-lab/recoveries")
def list_lab_recoveries(request: Request) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            items = sld.list_recoveries(cur, iid)
    return {"recoveries": items}


@router.post("/api/me/strategy-lab/import/restore-recovery")
async def restore_recovery(request: Request) -> dict:
    claims = require_session(request)
    try:
        body = await request.json()
    except Exception as exc:
        raise HTTPException(status_code=422, detail="JSON body required") from exc
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")
    recovery_id = str(body.get("recovery_id") or "").strip()
    confirm = str(body.get("confirm") or "").strip()
    if not recovery_id:
        raise HTTPException(status_code=422, detail="recovery_id required")
    if confirm != "RESTORE_RECOVERY":
        raise HTTPException(
            status_code=422, detail="confirm must be RESTORE_RECOVERY"
        )
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            pack = sld.load_recovery_pack(cur, iid, recovery_id)
            if pack is None:
                raise HTTPException(status_code=404, detail="recovery not found or expired")
            try:
                result = sld.commit_import(
                    cur,
                    iid,
                    pack,
                    policy="replace_lab",
                    confirm="REPLACE_LAB",
                )
            except Exception as exc:
                raise HTTPException(status_code=422, detail=str(exc)) from exc
            privacy.audit(
                cur,
                actor_identity_id=iid,
                subject_identity_id=iid,
                action="import",
                surfaces=["strategy_lab"],
                detail=f"restore-recovery {recovery_id}",
            )
    return result

