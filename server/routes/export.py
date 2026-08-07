"""Member Practice export + import API — Spec portability v1.1 (two-way)."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, Response

import db
import export_domain as ex
import import_domain as im
import member_privacy as privacy
from guards import require_session

router = APIRouter(tags=["export"])


def _iid(claims: dict) -> int:
    iid = int(claims.get("identity_id") or 0)
    if iid == 0:
        raise HTTPException(status_code=400, detail="No identity for this session")
    return iid


async def _read_import_body(request: Request) -> tuple[bytes, str, str]:
    """Return (data, kind, policy)."""
    ctype = (request.headers.get("content-type") or "").lower()
    policy = "additive"
    if "multipart/form-data" in ctype:
        form = await request.form()
        policy = str(form.get("policy") or "additive").strip().lower()
        upload = form.get("file")
        if upload is None:
            raise HTTPException(status_code=422, detail="file required")
        raw = await upload.read()
        data, kind = im.decode_payload(raw_bytes=raw)
        return data, kind, policy
    body = await request.json()
    policy = str(body.get("policy") or "additive").strip().lower()
    data, kind = im.decode_payload(
        text=body.get("text") or body.get("content"),
        b64=body.get("base64"),
    )
    return data, kind, policy


@router.get("/api/me/export")
def export_pack(request: Request, format: str = "zip") -> Any:
    """Full Practice pack: trade_log + journal + retrospective + journey."""
    claims = require_session(request)
    iid = _iid(claims)
    role = str(claims.get("role") or "observer")
    fmt = (format or "zip").strip().lower()
    if fmt not in ("zip", "json"):
        raise HTTPException(status_code=422, detail="format must be zip or json")

    with db.transaction() as conn:
        with conn.cursor() as cur:
            pack = ex.build_member_pack(cur, iid, role=role)
            privacy.audit(
                cur,
                actor_identity_id=iid,
                subject_identity_id=iid,
                action="export",
                surfaces=[
                    "playbook",
                    "practice_campaign",
                    "trade_log",
                    "journal",
                    "journal_session",
                    "retrospective",
                    "journey",
                ],
                detail=f"pack format={fmt}",
            )

    if fmt == "json":
        return JSONResponse(
            pack,
            headers={
                "Content-Disposition": 'attachment; filename="fattail-member-export.json"'
            },
        )

    body = ex.pack_to_zip_bytes(pack)
    return Response(
        content=body,
        media_type="application/zip",
        headers={
            "Content-Disposition": 'attachment; filename="fattail-member-export.zip"'
        },
    )


@router.get("/api/me/export/journal")
def export_journal(request: Request) -> Any:
    claims = require_session(request)
    iid = _iid(claims)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            doc = ex.build_journal_document(cur, iid)
            privacy.audit(
                cur,
                actor_identity_id=iid,
                subject_identity_id=iid,
                action="export",
                surfaces=["journal"],
                detail="journal only",
            )
    return JSONResponse(
        doc,
        headers={"Content-Disposition": 'attachment; filename="journal.json"'},
    )


@router.get("/api/me/export/retrospectives")
def export_retrospectives(request: Request) -> Any:
    claims = require_session(request)
    iid = _iid(claims)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            doc = ex.build_retrospective_document(cur, iid)
            privacy.audit(
                cur,
                actor_identity_id=iid,
                subject_identity_id=iid,
                action="export",
                surfaces=["retrospective"],
                detail="retrospective only",
            )
    return JSONResponse(
        doc,
        headers={"Content-Disposition": 'attachment; filename="retrospective.json"'},
    )


@router.get("/api/me/export/journey")
def export_journey(request: Request) -> Any:
    claims = require_session(request)
    iid = _iid(claims)
    role = str(claims.get("role") or "observer")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            doc = ex.build_journey_document(cur, iid, role=role)
            privacy.audit(
                cur,
                actor_identity_id=iid,
                subject_identity_id=iid,
                action="export",
                surfaces=["journey"],
                detail="journey only",
            )
    return JSONResponse(
        doc,
        headers={"Content-Disposition": 'attachment; filename="journey.json"'},
    )


# ── Import (v1.1 two-way) ─────────────────────────────────────────────────


@router.post("/api/me/import/detect")
async def import_detect(request: Request) -> dict:
    claims = require_session(request)
    _iid(claims)
    try:
        data, kind, _policy = await _read_import_body(request)
        return im.detect_payload(data, kind)
    except im.ImportErrorLoud as exc:
        raise HTTPException(
            status_code=exc.status,
            detail={"message": exc.message, **exc.extra},
        ) from exc


@router.post("/api/me/import/preview")
async def import_preview(request: Request) -> dict:
    claims = require_session(request)
    iid = _iid(claims)
    try:
        data, kind, policy = await _read_import_body(request)
        docs = im.unpack_payload(data, kind)
        with db.transaction() as conn:
            with conn.cursor() as cur:
                return im.preview_all(cur, iid, docs, policy)
    except im.ImportErrorLoud as exc:
        raise HTTPException(
            status_code=exc.status,
            detail={"message": exc.message, **exc.extra},
        ) from exc


@router.post("/api/me/practice-data/purge")
async def purge_practice_data(request: Request) -> dict:
    """Delete Practice data only — membership, courses, and identity remain.

    Body: ``{ "confirm": "DELETE_PRACTICE_DATA" }`` (fail loud without exact phrase).
    After purge, member may **Load Practice data** from an export (additive insert).
    """
    claims = require_session(request)
    iid = _iid(claims)
    body = await request.json()
    confirm = str((body or {}).get("confirm") or "").strip()
    if confirm != im.PURGE_CONFIRM:
        raise HTTPException(
            status_code=422,
            detail={
                "message": f'confirm must be exactly "{im.PURGE_CONFIRM}"',
                "kept": [
                    "membership",
                    "identity",
                    "course_enrollments",
                    "lesson_progress",
                ],
                "deleted_surfaces": [
                    "trade_log",
                    "journal",
                    "retrospective",
                    "habit_plans",
                    "live_checkins",
                ],
            },
        )
    with db.transaction() as conn:
        with conn.cursor() as cur:
            counts = im.purge_practice_data(cur, iid)
            privacy.audit(
                cur,
                actor_identity_id=iid,
                subject_identity_id=iid,
                action="purge_practice",
                surfaces=[
                    "trade_log",
                    "journal",
                    "retrospective",
                    "journey",
                ],
                detail="practice data deleted; membership retained",
            )
    return {
        "ok": True,
        "membership_retained": True,
        "deleted": counts,
        "note": (
            "Practice data removed. Membership and course progress remain. "
            "You can Load Practice data from an export (additive)."
        ),
    }


@router.post("/api/me/import/commit")
async def import_commit(request: Request) -> dict:
    claims = require_session(request)
    iid = _iid(claims)
    try:
        data, kind, policy = await _read_import_body(request)
        docs = im.unpack_payload(data, kind)
        with db.transaction() as conn:
            with conn.cursor() as cur:
                out = im.commit_all(cur, iid, docs, policy, claims=claims)
                surfaces = [
                    s
                    for s in docs
                    if s
                    in (
                        "playbook",
                        "practice_campaign",
                        "trade_log",
                        "journal",
                        "journal_session",
                        "retrospective",
                        "journey",
                    )
                ]
                privacy.audit(
                    cur,
                    actor_identity_id=iid,
                    subject_identity_id=iid,
                    action="import",
                    surfaces=surfaces,
                    detail=f"policy=additive mode=additive",
                )
        return {"ok": True, **out}
    except im.ImportErrorLoud as exc:
        raise HTTPException(
            status_code=exc.status,
            detail={"message": exc.message, **exc.extra},
        ) from exc
