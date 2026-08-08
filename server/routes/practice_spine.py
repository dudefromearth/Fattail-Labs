"""Playbook + Practice Campaign APIs — TD Phase 1 + Scrapbook v1.1a (DL-255)."""

from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, Query, Request, UploadFile
from fastapi.responses import Response

import db
import playbook_scrapbook_domain as pbs
import practice_spine_domain as psd
from guards import require_session
from routes.trade_log.common import _storage_identity_id

router = APIRouter(tags=["practice-spine"])


def _raise(exc: psd.PracticeSpineError) -> None:
    detail: dict | str
    if exc.extra:
        detail = {"message": exc.detail, **exc.extra}
    else:
        detail = exc.detail
    raise HTTPException(status_code=exc.code, detail=detail)


def _iid(cur, claims: dict) -> int:
    return _storage_identity_id(cur, claims)


# ── Playbook books ──────────────────────────────────────────────────────────


@router.get("/api/me/playbook/entries")
def list_playbook_entries(
    request: Request,
    include_archived: bool = Query(False),
) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            if include_archived:
                cur.execute(
                    """SELECT * FROM member_playbook_entries
                       WHERE identity_id = %s ORDER BY updated_at DESC, id DESC""",
                    (iid,),
                )
            else:
                cur.execute(
                    """SELECT * FROM member_playbook_entries
                       WHERE identity_id = %s AND status = 'active'
                       ORDER BY updated_at DESC, id DESC""",
                    (iid,),
                )
            rows = cur.fetchall() or []
            entries = []
            for r in rows:
                try:
                    pbs.ensure_book_pages_migrated(cur, iid, int(r["id"]))
                    cur.execute(
                        """SELECT * FROM member_playbook_entries
                           WHERE id = %s AND identity_id = %s""",
                        (int(r["id"]), iid),
                    )
                    r2 = cur.fetchone() or r
                    entries.append(pbs.serialize_book_meta(cur, r2))
                except psd.PracticeSpineError:
                    entries.append(psd.serialize_playbook(r))
    return {"entries": entries}


@router.post("/api/me/playbook/entries")
async def create_playbook_entry(request: Request) -> dict:
    claims = require_session(request)
    body = await request.json()
    if not isinstance(body, dict):
        body = {}
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                entry = pbs.create_book(
                    cur,
                    iid,
                    title=str(body.get("title") or ""),
                    subtitle=str(body.get("subtitle") or ""),
                    body_md=str(body.get("body_md") or ""),
                    structured=body.get("structured")
                    if isinstance(body.get("structured"), dict)
                    else None,
                )
    except psd.PracticeSpineError as e:
        _raise(e)
    return {"entry": entry}


@router.get("/api/me/playbook/entries/{entry_id}")
def get_playbook_entry(
    entry_id: int,
    request: Request,
    full: bool = Query(False),
) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            try:
                if full:
                    entry = pbs.load_tree(cur, iid, entry_id)
                else:
                    pbs.ensure_book_pages_migrated(cur, iid, entry_id)
                    cur.execute(
                        """SELECT * FROM member_playbook_entries
                           WHERE id = %s AND identity_id = %s""",
                        (entry_id, iid),
                    )
                    row = cur.fetchone()
                    if not row:
                        raise HTTPException(status_code=404, detail="Playbook book not found")
                    entry = pbs.serialize_book_meta(cur, row)
            except psd.PracticeSpineError as e:
                _raise(e)
    return {"entry": entry}


@router.patch("/api/me/playbook/entries/{entry_id}")
async def patch_playbook_entry(entry_id: int, request: Request) -> dict:
    claims = require_session(request)
    body = await request.json()
    if not isinstance(body, dict):
        body = {}
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                kwargs: dict = {}
                if "title" in body:
                    kwargs["title"] = str(body.get("title") or "")
                if "subtitle" in body:
                    kwargs["subtitle"] = body.get("subtitle")
                if "status" in body:
                    kwargs["status"] = str(body.get("status") or "")
                if "structured" in body:
                    kwargs["structured"] = (
                        body["structured"]
                        if isinstance(body.get("structured"), dict)
                        else {}
                    )
                if "cover_attachment_id" in body:
                    kwargs["cover_attachment_id"] = body.get("cover_attachment_id")
                # legacy body_md ignored as write path — refresh from pages only
                entry = pbs.patch_book(cur, iid, entry_id, **kwargs)
    except psd.PracticeSpineError as e:
        _raise(e)
    return {"entry": entry}


@router.post("/api/me/playbook/entries/{entry_id}/save")
def save_playbook(entry_id: int, request: Request) -> dict:
    claims = require_session(request)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                out = pbs.save_version(cur, iid, entry_id)
    except psd.PracticeSpineError as e:
        _raise(e)
    return out


@router.get("/api/me/playbook/entries/{entry_id}/versions")
def list_playbook_versions(entry_id: int, request: Request) -> dict:
    claims = require_session(request)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                versions = pbs.list_versions(cur, iid, entry_id)
    except psd.PracticeSpineError as e:
        _raise(e)
    return {"versions": versions}


@router.post("/api/me/playbook/entries/{entry_id}/versions/{version_n}/restore")
def restore_playbook_version(
    entry_id: int, version_n: int, request: Request
) -> dict:
    claims = require_session(request)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                book = pbs.restore_version(cur, iid, entry_id, version_n)
    except psd.PracticeSpineError as e:
        _raise(e)
    return {"entry": book}


@router.post("/api/me/playbook/entries/{entry_id}/discard")
def discard_playbook(entry_id: int, request: Request) -> dict:
    claims = require_session(request)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                out = pbs.discard(cur, iid, entry_id)
    except psd.PracticeSpineError as e:
        _raise(e)
    return out


# ── Chapters / pages ────────────────────────────────────────────────────────


@router.post("/api/me/playbook/entries/{entry_id}/chapters")
async def create_chapter(entry_id: int, request: Request) -> dict:
    claims = require_session(request)
    body = await request.json()
    if not isinstance(body, dict):
        body = {}
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                entry = pbs.create_chapter(
                    cur,
                    iid,
                    entry_id,
                    title=str(body.get("title") or ""),
                    blurb=body.get("blurb"),
                )
    except psd.PracticeSpineError as e:
        _raise(e)
    return {"entry": entry}


@router.patch("/api/me/playbook/chapters/{chapter_id}")
async def patch_chapter(chapter_id: int, request: Request) -> dict:
    claims = require_session(request)
    body = await request.json()
    if not isinstance(body, dict):
        body = {}
    kwargs: dict = {}
    if "title" in body:
        kwargs["title"] = str(body.get("title") or "")
    if "blurb" in body:
        kwargs["blurb"] = body.get("blurb")
    if "sort_order" in body:
        kwargs["sort_order"] = int(body["sort_order"])
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                entry = pbs.patch_chapter(cur, iid, chapter_id, **kwargs)
    except psd.PracticeSpineError as e:
        _raise(e)
    return {"entry": entry}


@router.delete("/api/me/playbook/chapters/{chapter_id}")
def delete_chapter(chapter_id: int, request: Request) -> dict:
    claims = require_session(request)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                entry = pbs.delete_chapter(cur, iid, chapter_id)
    except psd.PracticeSpineError as e:
        _raise(e)
    return {"entry": entry}


@router.post("/api/me/playbook/chapters/{chapter_id}/pages")
async def create_page(chapter_id: int, request: Request) -> dict:
    claims = require_session(request)
    body = await request.json()
    if not isinstance(body, dict):
        body = {}
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                entry = pbs.create_page(
                    cur,
                    iid,
                    chapter_id,
                    title=body.get("title"),
                    body_md=str(body.get("body_md") or ""),
                )
    except psd.PracticeSpineError as e:
        _raise(e)
    return {"entry": entry}


@router.patch("/api/me/playbook/pages/{page_id}")
async def patch_page(page_id: int, request: Request) -> dict:
    claims = require_session(request)
    body = await request.json()
    if not isinstance(body, dict):
        body = {}
    kwargs: dict = {}
    if "title" in body:
        kwargs["title"] = body.get("title")
    if "body_md" in body:
        kwargs["body_md"] = str(body.get("body_md") or "")
    if "sort_order" in body:
        kwargs["sort_order"] = int(body["sort_order"])
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                entry = pbs.patch_page(cur, iid, page_id, **kwargs)
    except psd.PracticeSpineError as e:
        _raise(e)
    return {"entry": entry}


@router.delete("/api/me/playbook/pages/{page_id}")
def delete_page(page_id: int, request: Request) -> dict:
    claims = require_session(request)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                entry = pbs.delete_page(cur, iid, page_id)
    except psd.PracticeSpineError as e:
        _raise(e)
    return {"entry": entry}


# ── Evidence ────────────────────────────────────────────────────────────────


@router.get("/api/me/playbook/entries/{entry_id}/evidence")
def get_evidence(entry_id: int, request: Request) -> dict:
    claims = require_session(request)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                evidence = pbs.list_evidence(cur, iid, entry_id)
    except psd.PracticeSpineError as e:
        _raise(e)
    return {"evidence": evidence}


@router.post("/api/me/playbook/entries/{entry_id}/evidence")
async def post_evidence(entry_id: int, request: Request) -> dict:
    claims = require_session(request)
    body = await request.json()
    if not isinstance(body, dict):
        body = {}
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                out = pbs.add_evidence(
                    cur,
                    iid,
                    entry_id,
                    object_type=str(body.get("object_type") or ""),
                    object_id=int(body.get("object_id")),
                    note_md=body.get("note_md"),
                )
    except (TypeError, ValueError) as e:
        raise HTTPException(status_code=422, detail="object_id required") from e
    except psd.PracticeSpineError as e:
        _raise(e)
    return out


@router.delete("/api/me/playbook/entries/{entry_id}/evidence/{evidence_id}")
def delete_evidence(entry_id: int, evidence_id: int, request: Request) -> dict:
    claims = require_session(request)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                out = pbs.remove_evidence(cur, iid, entry_id, evidence_id)
    except psd.PracticeSpineError as e:
        _raise(e)
    return out


@router.get("/api/me/journal-sessions/{session_id}/playbooks")
def journal_session_playbooks(session_id: int, request: Request) -> dict:
    """Playbooks linked to this journal (association is journal-side primary)."""
    claims = require_session(request)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                linked = pbs.list_playbooks_for_journal_session(cur, iid, session_id)
                # Catalog of active books for picker
                cur.execute(
                    """SELECT id, title, status FROM member_playbook_entries
                       WHERE identity_id = %s AND status = 'active'
                       ORDER BY updated_at DESC, id DESC""",
                    (iid,),
                )
                books = [
                    {
                        "id": int(r["id"]),
                        "title": r.get("title") or "",
                        "status": r.get("status") or "active",
                    }
                    for r in cur.fetchall() or []
                ]
    except psd.PracticeSpineError as e:
        _raise(e)
    return {"linked": linked, "books": books}


@router.put("/api/me/journal-sessions/{session_id}/playbooks/{book_id}")
def link_journal_playbook(session_id: int, book_id: int, request: Request) -> dict:
    claims = require_session(request)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                linked = pbs.set_journal_playbook_link(
                    cur, iid, session_id, book_id, linked=True
                )
    except psd.PracticeSpineError as e:
        _raise(e)
    return {"linked": linked}


@router.delete("/api/me/journal-sessions/{session_id}/playbooks/{book_id}")
def unlink_journal_playbook(session_id: int, book_id: int, request: Request) -> dict:
    claims = require_session(request)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                linked = pbs.set_journal_playbook_link(
                    cur, iid, session_id, book_id, linked=False
                )
    except psd.PracticeSpineError as e:
        _raise(e)
    return {"linked": linked}


# ── Archive ─────────────────────────────────────────────────────────────────


@router.get("/api/me/playbook/entries/{entry_id}/archive")
def get_archive(entry_id: int, request: Request) -> dict:
    claims = require_session(request)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                archive = pbs.list_archive(cur, iid, entry_id)
    except psd.PracticeSpineError as e:
        _raise(e)
    return {"archive": archive}


@router.post("/api/me/playbook/entries/{entry_id}/archive")
async def post_archive(
    entry_id: int,
    request: Request,
    file: UploadFile = File(...),
) -> dict:
    claims = require_session(request)
    data = await file.read()
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                out = pbs.save_attachment(
                    cur,
                    iid,
                    entry_id,
                    content_type=file.content_type or "application/octet-stream",
                    data=data,
                    original_name=file.filename,
                )
    except psd.PracticeSpineError as e:
        _raise(e)
    return out


@router.get("/api/me/playbook/entries/{entry_id}/archive/{att_id}/bytes")
def get_archive_bytes(entry_id: int, att_id: int, request: Request) -> Response:
    claims = require_session(request)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                data, ct = pbs.read_attachment_bytes(cur, iid, entry_id, att_id)
    except psd.PracticeSpineError as e:
        _raise(e)
    return Response(content=data, media_type=ct)


@router.delete("/api/me/playbook/entries/{entry_id}/archive/{att_id}")
def delete_archive(entry_id: int, att_id: int, request: Request) -> dict:
    claims = require_session(request)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                out = pbs.purge_attachment(cur, iid, entry_id, att_id)
    except psd.PracticeSpineError as e:
        _raise(e)
    return out


# ── Campaigns (unchanged) ───────────────────────────────────────────────────


@router.get("/api/me/practice/campaigns")
def list_campaigns(request: Request) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            campaigns = psd.list_campaigns(cur, iid)
            active = psd.get_active_campaign(cur, iid)
    return {"campaigns": campaigns, "active": active}


@router.get("/api/me/practice/campaigns/active")
def get_active_campaign(request: Request) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            active = psd.get_active_campaign(cur, iid)
    return {"active": active}


@router.post("/api/me/practice/campaigns")
async def create_campaign(request: Request) -> dict:
    claims = require_session(request)
    body = await request.json()
    if not isinstance(body, dict):
        body = {}
    pids = body.get("playbook_entry_ids")
    if pids is not None and not isinstance(pids, list):
        raise HTTPException(status_code=422, detail="playbook_entry_ids must be a list")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                camp = psd.create_campaign(
                    cur,
                    iid,
                    title=str(body.get("title") or ""),
                    starts_at=body.get("starts_at"),
                    ends_at=body.get("ends_at"),
                    playbook_entry_ids=pids,
                    activate=bool(body.get("activate")),
                )
    except psd.PracticeSpineError as e:
        _raise(e)
    return {"campaign": camp}


@router.patch("/api/me/practice/campaigns/{campaign_id}")
async def patch_campaign(campaign_id: int, request: Request) -> dict:
    claims = require_session(request)
    body = await request.json()
    if not isinstance(body, dict):
        body = {}
    kwargs: dict = {}
    if "title" in body:
        kwargs["title"] = str(body.get("title") or "")
    if "status" in body:
        kwargs["status"] = str(body.get("status") or "")
    if "starts_at" in body:
        kwargs["starts_at"] = body.get("starts_at")
    if "ends_at" in body:
        kwargs["ends_at"] = body.get("ends_at")
    if "playbook_entry_ids" in body:
        pids = body.get("playbook_entry_ids")
        if pids is not None and not isinstance(pids, list):
            raise HTTPException(
                status_code=422, detail="playbook_entry_ids must be a list"
            )
        kwargs["playbook_entry_ids"] = pids or []
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                camp = psd.patch_campaign(cur, iid, campaign_id, **kwargs)
    except psd.PracticeSpineError as e:
        _raise(e)
    return {"campaign": camp}
