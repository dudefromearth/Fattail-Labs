"""FatTail Hard member API — Hard Spec v1.0 H1.

Session auth; identity isolation; private practice data.
"""

from __future__ import annotations

from datetime import date, datetime

from fastapi import APIRouter, HTTPException, Request

import db
import hard_domain as hd
from guards import require_session
from routes.trade_log.common import _storage_identity_id

router = APIRouter(tags=["hard"])


def _parse_date(raw: object) -> date:
    if raw is None or raw == "":
        return hd.today_eastern()
    if isinstance(raw, date) and not isinstance(raw, datetime):
        return raw
    s = str(raw).strip()[:10]
    try:
        return date.fromisoformat(s)
    except ValueError as exc:
        raise HTTPException(
            status_code=422, detail="log_date must be YYYY-MM-DD"
        ) from exc


def _set_active_or_paused_status(
    cur, identity_id: int, status: str
) -> dict:
    active = hd.get_active_enrollment(cur, identity_id)
    if active:
        eid = int(active["id"])
    elif status == "exited":
        cur.execute(
            """SELECT id FROM member_hard_enrollments
               WHERE identity_id = %s AND status = 'paused'
               ORDER BY id DESC LIMIT 1""",
            (identity_id,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(
                status_code=409, detail="No active or paused enrollment"
            )
        eid = int(row["id"])
    else:
        raise HTTPException(status_code=409, detail="No active Hard enrollment")
    try:
        return hd.set_status(cur, identity_id, eid, status=status)
    except hd.HardDomainError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get("/api/me/hard")
def hard_me(request: Request) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            return hd.me_snapshot(cur, iid)


@router.get("/api/me/hard/variants")
def hard_variants(request: Request) -> dict:
    require_session(request)
    return {"variants": hd.list_variants_public()}


@router.post("/api/me/hard/enroll")
async def hard_enroll(request: Request) -> dict:
    claims = require_session(request)
    try:
        body = await request.json()
    except Exception as exc:
        raise HTTPException(status_code=422, detail="JSON body required") from exc
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")
    program_kind = str(body.get("program_kind") or "").strip()
    variant_id = str(body.get("variant_id") or "").strip()
    consent = body.get("consent")
    if consent is not None and not isinstance(consent, dict):
        raise HTTPException(status_code=422, detail="consent must be an object")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            try:
                en = hd.enroll(
                    cur,
                    iid,
                    program_kind=program_kind,
                    variant_id=variant_id,
                    consent=consent,
                )
            except hd.HardDomainError as exc:
                detail = str(exc)
                code = 409 if "Already" in detail else 422
                raise HTTPException(status_code=code, detail=detail) from exc
    return {"enrollment": en}


@router.post("/api/me/hard/daily")
async def hard_daily(request: Request) -> dict:
    claims = require_session(request)
    try:
        body = await request.json()
    except Exception as exc:
        raise HTTPException(status_code=422, detail="JSON body required") from exc
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")
    log_date = _parse_date(body.get("log_date") or body.get("date"))
    tasks = body.get("tasks")
    if not isinstance(tasks, dict):
        raise HTTPException(status_code=422, detail="tasks object required")
    note = body.get("progress_note")
    if note is not None:
        note = str(note)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            active = hd.get_active_enrollment(cur, iid)
            if not active:
                raise HTTPException(
                    status_code=409, detail="No active Hard enrollment"
                )
            try:
                log = hd.upsert_daily_log(
                    cur,
                    iid,
                    int(active["id"]),
                    log_date=log_date,
                    tasks=tasks,
                    progress_note=note,
                )
            except hd.HardDomainError as exc:
                raise HTTPException(status_code=422, detail=str(exc)) from exc
            stats = hd.compliance_stats(
                cur, iid, int(active["id"]), today=hd.today_eastern()
            )
    return {"log": log, "compliance": stats}


@router.post("/api/me/hard/pause")
def hard_pause(request: Request) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            en = _set_active_or_paused_status(cur, iid, "paused")
    return {"enrollment": en}


@router.post("/api/me/hard/exit")
def hard_exit(request: Request) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            en = _set_active_or_paused_status(cur, iid, "exited")
    return {"enrollment": en}


@router.post("/api/me/hard/resume")
async def hard_resume(request: Request) -> dict:
    """Resume a paused enrollment by id (body.enrollment_id) or latest paused."""
    claims = require_session(request)
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            eid = body.get("enrollment_id")
            if eid is not None:
                try:
                    eid = int(eid)
                except (TypeError, ValueError) as exc:
                    raise HTTPException(
                        status_code=422, detail="enrollment_id must be int"
                    ) from exc
            else:
                cur.execute(
                    """SELECT id FROM member_hard_enrollments
                       WHERE identity_id = %s AND status = 'paused'
                       ORDER BY id DESC LIMIT 1""",
                    (iid,),
                )
                row = cur.fetchone()
                if not row:
                    raise HTTPException(
                        status_code=404, detail="No paused enrollment"
                    )
                eid = int(row["id"])
            try:
                en = hd.set_status(cur, iid, eid, status="active")
            except hd.HardDomainError as exc:
                raise HTTPException(status_code=409, detail=str(exc)) from exc
    return {"enrollment": en}
