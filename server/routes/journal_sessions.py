"""Journal Session APIs — Spec v0.2 · JS1-2 (member text; no agent).

Isolation: identity_id from session cookie only. Body identity_id ignored.
Create entitlement: D6 / Retrospective §10.1 via journal_session_domain.
"""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from fastapi.responses import Response

import db
import journal_session_agent as jsa
import journal_session_domain as jsd
import journal_session_media as jsm
import journal_session_structured as jss
from guards import require_session
from routes.trade_log.common import _storage_identity_id

router = APIRouter(tags=["journal-sessions"])


def _raise_domain(exc: jsd.JournalSessionError) -> None:
    payload: dict | str
    if exc.extra:
        payload = {"detail": exc.detail, **exc.extra}
    else:
        payload = exc.detail
    raise HTTPException(status_code=exc.code, detail=payload)


def _require_create(cur, claims: dict, identity_id: int) -> None:
    role = str(claims.get("role") or "observer")
    if not jsd.can_create_session(cur, identity_id, role):
        raise HTTPException(status_code=403, detail=jsd.CREATE_DENY_DETAIL)


@router.get("/api/me/journal-sessions/week-activity")
def journal_week_activity(
    request: Request,
    date_from: str,
    date_to: str,
) -> dict:
    """Member-message band dots for Week view (Spec v0.6 §1.6)."""
    claims = require_session(request)
    try:
        d0 = date.fromisoformat(date_from[:10])
        d1 = date.fromisoformat(date_to[:10])
    except ValueError as e:
        raise HTTPException(status_code=422, detail="Invalid date range") from e
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            days = jsd.week_activity_bands(cur, iid, d0, d1)
    return {"days": days}


@router.get("/api/me/journal-sessions/closures")
def list_journal_closures(
    request: Request,
    date_from: str | None = None,
    date_to: str | None = None,
) -> dict:
    """Closed journal dates for this member (Session Spec §10)."""
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            try:
                df = jsd._as_date(date_from) if date_from else None
                dt = jsd._as_date(date_to) if date_to else None
            except ValueError as e:
                raise HTTPException(status_code=422, detail=str(e)) from e
            closures = jsd.list_closures(cur, iid, date_from=df, date_to=dt)
    return {"closures": closures}


@router.get("/api/me/journal-sessions")
def list_journal_sessions(
    request: Request,
    journal_date: str | None = None,
    status: str | None = None,
    limit: int = 100,
) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            try:
                sessions = jsd.list_sessions(
                    cur,
                    iid,
                    journal_date=journal_date,
                    status=status,
                    limit=limit,
                )
            except jsd.JournalSessionError as e:
                _raise_domain(e)
    return {"sessions": sessions}


@router.get("/api/me/journal-sessions/schemas")
def journal_session_schemas(request: Request) -> dict:
    """Code-owned structured checklists per tag (JS2-1 · Spec §5)."""
    require_session(request)
    return jss.all_schemas()


@router.get("/api/me/journal-sessions/schema")
def journal_session_schema(request: Request, tag: str) -> dict:
    require_session(request)
    tag = str(tag or "").strip()
    if tag not in jsd.VALID_TAGS:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid tag. Allowed: {', '.join(sorted(jsd.VALID_TAGS))}",
        )
    return jss.schema_for_tag(tag)


@router.get("/api/me/journal-sessions/prefill")
def journal_session_prefill(
    request: Request,
    tag: str,
    journal_date: str | None = None,
) -> dict:
    """Trade-log / prior-plan prefill — never invents invalidation (Hotel)."""
    claims = require_session(request)
    tag = str(tag or "").strip()
    if tag not in jsd.VALID_TAGS:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid tag. Allowed: {', '.join(sorted(jsd.VALID_TAGS))}",
        )
    jd = journal_date or date.today().isoformat()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            try:
                jd_d = jsd._as_date(jd)
            except ValueError as e:
                raise HTTPException(status_code=422, detail=str(e)) from e
            prefill = jss.prefill_structured(cur, iid, tag, jd_d)
    return {
        "tag": tag,
        "journal_date": jd_d.isoformat(),
        "prefill": prefill,
        "note": "Member must confirm; invalidation never auto-filled.",
    }


@router.post("/api/me/journal-sessions")
async def create_journal_session(request: Request) -> dict:
    claims = require_session(request)
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}
    # Never trust client identity
    body.pop("identity_id", None)

    tag = str(body.get("tag") or "").strip() or None
    raw_tags = body.get("tags")
    tags: list[str] | None = None
    if isinstance(raw_tags, list):
        tags = [str(t).strip() for t in raw_tags if str(t).strip()]
    journal_date = body.get("journal_date")
    if not journal_date:
        journal_date = date.today().isoformat()
    structured = body.get("structured")
    if structured is not None and not isinstance(structured, dict):
        raise HTTPException(status_code=422, detail="structured must be an object")
    prefill = bool(body.get("prefill", False))

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            _require_create(cur, claims, iid)
            try:
                session = jsd.create_session(
                    cur,
                    iid,
                    tag=tag,
                    tags=tags,
                    journal_date=str(journal_date),
                    structured=structured,
                    prefill=prefill,
                )
            except jsd.JournalSessionError as e:
                _raise_domain(e)
            except ValueError as e:
                raise HTTPException(status_code=422, detail=str(e)) from e
    return {"session": session}


@router.get("/api/me/journal-sessions/{session_id}")
def get_journal_session(request: Request, session_id: int) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            session = jsd.get_session(cur, iid, session_id, include_messages=True)
    if session is None:
        raise HTTPException(status_code=404, detail=jsd.NOT_FOUND_DETAIL)
    return {"session": session}


@router.patch("/api/me/journal-sessions/{session_id}")
async def patch_journal_session(request: Request, session_id: int) -> dict:
    claims = require_session(request)
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}
    body.pop("identity_id", None)

    structured_set = "structured" in body
    structured = body.get("structured") if structured_set else None

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            try:
                session = jsd.patch_session(
                    cur,
                    iid,
                    session_id,
                    structured=structured,
                    structured_set=structured_set,
                )
            except jsd.JournalSessionError as e:
                _raise_domain(e)
    return {"session": session}


@router.post("/api/me/journal-sessions/{session_id}/messages")
async def post_journal_message(request: Request, session_id: int) -> dict:
    """Append a member message (J1). Client cannot assert author=agent."""
    claims = require_session(request)
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}
    body.pop("identity_id", None)
    body_md = body.get("body_md")
    if body_md is None:
        body_md = body.get("body")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            try:
                message = jsd.append_member_message(
                    cur, iid, session_id, body_md=str(body_md or "")
                )
            except jsd.JournalSessionError as e:
                _raise_domain(e)
    return {"message": message}


@router.post("/api/me/journal-sessions/{session_id}/seal")
async def seal_journal_session(request: Request, session_id: int) -> dict:
    claims = require_session(request)
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}
    require_complete = bool(body.get("require_complete", False))
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            try:
                session = jsd.seal_session(
                    cur,
                    iid,
                    session_id,
                    require_complete=require_complete,
                )
            except jsd.JournalSessionError as e:
                _raise_domain(e)
    return {"session": session}


@router.post("/api/me/journal-sessions/{session_id}/partial")
def partial_journal_session(request: Request, session_id: int) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            try:
                session = jsd.mark_partial(cur, iid, session_id)
            except jsd.JournalSessionError as e:
                _raise_domain(e)
    return {"session": session}


@router.get("/api/me/journal-sessions/{session_id}/agent")
def journal_session_agent_status(request: Request, session_id: int) -> dict:
    """Agent mode, depth budget, entitlement (JS3-1)."""
    claims = require_session(request)
    role = str(claims.get("role") or "observer")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            try:
                status = jsa.build_agent_status(
                    cur, iid, session_id, role=role
                )
            except jsa.AgentTurnError as e:
                payload = {"detail": e.detail, **e.extra} if e.extra else e.detail
                raise HTTPException(status_code=e.code, detail=payload) from e
    return {"agent": status, "prompt_constant": "JOURNAL_SESSION_SYSTEM_PROMPT_V1"}


@router.post("/api/me/journal-sessions/{session_id}/agent/turn")
async def journal_session_agent_turn(request: Request, session_id: int) -> dict:
    """One interview turn — local mode (JS3-1). D7 attribution server-set only."""
    claims = require_session(request)
    role = str(claims.get("role") or "observer")
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}
    # Never trust client identity / author escalation
    body.pop("identity_id", None)
    body.pop("author", None)
    body.pop("agent_service", None)
    member_body = body.get("body_md") or body.get("member_body")

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            try:
                result = jsa.run_agent_turn(
                    cur,
                    iid,
                    session_id,
                    role=role,
                    member_body=str(member_body) if member_body is not None else None,
                )
            except jsa.AgentTurnError as e:
                payload = {"detail": e.detail, **e.extra} if e.extra else e.detail
                raise HTTPException(status_code=e.code, detail=payload) from e
            except jsd.JournalSessionError as e:
                _raise_domain(e)
            session = jsd.get_session(cur, iid, session_id, include_messages=True)
    return {"turn": result, "session": session}


@router.get("/api/me/journal-sessions/{session_id}/attachments")
def list_attachments(request: Request, session_id: int) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            # ownership via list filter
            session = jsd.get_session(cur, iid, session_id, include_messages=False)
            if session is None:
                raise HTTPException(status_code=404, detail=jsd.NOT_FOUND_DETAIL)
            items = jsm.list_attachments(cur, iid, session_id)
    return {"attachments": items}


@router.post("/api/me/journal-sessions/{session_id}/attachments")
async def upload_attachment(
    request: Request,
    session_id: int,
    file: UploadFile = File(...),
    caption: str | None = None,
) -> dict:
    claims = require_session(request)
    role = str(claims.get("role") or "observer")
    data = await file.read()
    ctype = file.content_type or ""
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            _require_create(cur, claims, iid)
            try:
                att = jsm.save_attachment(
                    cur,
                    iid,
                    session_id,
                    content_type=ctype,
                    data=data,
                    caption_md=caption,
                )
            except jsm.MediaError as e:
                payload = {"detail": e.detail, **e.extra} if e.extra else e.detail
                raise HTTPException(status_code=e.code, detail=payload) from e
            except jsd.JournalSessionError as e:
                _raise_domain(e)
    return {"attachment": att}


@router.get("/api/me/journal-sessions/{session_id}/attachments/{attachment_id}/bytes")
def download_attachment(
    request: Request, session_id: int, attachment_id: int
) -> Response:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            try:
                data, ctype = jsm.read_attachment_bytes(
                    cur, iid, session_id, attachment_id
                )
            except jsm.MediaError as e:
                raise HTTPException(status_code=e.code, detail=e.detail) from e
    return Response(
        content=data,
        media_type=ctype,
        headers={"Cache-Control": "private, no-store"},
    )


@router.patch(
    "/api/me/journal-sessions/{session_id}/attachments/{attachment_id}"
)
async def patch_attachment(
    request: Request, session_id: int, attachment_id: int
) -> dict:
    """Update caption (Spec v0.6 lightbox)."""
    claims = require_session(request)
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}
    caption = body.get("caption_md")
    if caption is not None:
        caption = str(caption)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            try:
                att = jsm.update_caption(
                    cur, iid, session_id, attachment_id, caption
                )
            except jsm.MediaError as e:
                raise HTTPException(status_code=e.code, detail=e.detail) from e
            except jsd.JournalSessionError as e:
                _raise_domain(e)
    return {"attachment": att}


@router.delete("/api/me/journal-sessions/{session_id}/attachments/{attachment_id}")
def delete_attachment_route(
    request: Request, session_id: int, attachment_id: int
) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            try:
                jsm.delete_attachment(cur, iid, session_id, attachment_id)
            except jsm.MediaError as e:
                raise HTTPException(status_code=e.code, detail=e.detail) from e
            except jsd.JournalSessionError as e:
                _raise_domain(e)
    return {"ok": True}
