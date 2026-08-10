"""Playbook + Practice Campaign APIs — TD Phase 1 + Scrapbook v1.1a (DL-255)."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, File, HTTPException, Query, Request, UploadFile
from fastapi.responses import JSONResponse, Response

import db
import export_domain as ex
import member_privacy as privacy
import playbook_scrapbook_domain as pbs
import practice_spine_domain as psd
from guards import require_admin, require_session
from routes.trade_log.common import _require_tool_member, _storage_identity_id
import campaign_panel as cpanel
import auth

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
    _require_tool_member(claims, capability="read")
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
            # D2 — list is meta only; migrate flat→pages on open (get/full), not N+1 here.
            entries = []
            for r in rows:
                try:
                    entries.append(pbs.serialize_book_meta(cur, r))
                except psd.PracticeSpineError:
                    entries.append(psd.serialize_playbook(r))
    return {"entries": entries}


@router.post("/api/me/playbook/entries")
async def create_playbook_entry(request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims, capability="write")
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
    _require_tool_member(claims, capability="read")
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
    _require_tool_member(claims, capability="write")
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
    _require_tool_member(claims, capability="write")
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
    _require_tool_member(claims, capability="read")
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
    _require_tool_member(claims, capability="write")
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
    _require_tool_member(claims, capability="write")
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
    _require_tool_member(claims, capability="write")
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
    _require_tool_member(claims, capability="write")
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
    _require_tool_member(claims, capability="write")
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
    _require_tool_member(claims, capability="write")
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
    _require_tool_member(claims, capability="write")
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
    _require_tool_member(claims, capability="write")
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
    _require_tool_member(claims, capability="read")
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
    _require_tool_member(claims, capability="write")
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
    _require_tool_member(claims, capability="write")
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
    _require_tool_member(claims, capability="read")
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
    _require_tool_member(claims, capability="write")
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
    _require_tool_member(claims, capability="write")
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
    _require_tool_member(claims, capability="read")
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
    _require_tool_member(claims, capability="write")
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


@router.get("/api/me/playbook/entries/{entry_id}/export")
def export_one_playbook(entry_id: int, request: Request, format: str = "zip") -> Any:
    """PB3 single-book export: ZIP (JSON + media) or playbook.json only."""
    claims = require_session(request)
    _require_tool_member(claims, capability="export")
    fmt = (format or "zip").strip().lower()
    if fmt not in ("zip", "json"):
        raise HTTPException(status_code=422, detail="format must be zip or json")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                # Ensure book exists / Family B (raises PracticeSpineError)
                pbs.load_tree(cur, iid, entry_id)
                if fmt == "json":
                    doc = ex.build_single_playbook_document(cur, iid, entry_id)
                    privacy.audit(
                        cur,
                        actor_identity_id=iid,
                        subject_identity_id=iid,
                        action="export",
                        surfaces=["playbook"],
                        detail=f"single book {entry_id} json",
                    )
                    return JSONResponse(
                        doc,
                        headers={
                            "Content-Disposition": (
                                f'attachment; filename="playbook-{entry_id}.json"'
                            )
                        },
                    )
                body = ex.single_playbook_to_zip_bytes(cur, iid, entry_id)
                privacy.audit(
                    cur,
                    actor_identity_id=iid,
                    subject_identity_id=iid,
                    action="export",
                    surfaces=["playbook"],
                    detail=f"single book {entry_id} zip",
                )
                return Response(
                    content=body,
                    media_type="application/zip",
                    headers={
                        "Content-Disposition": (
                            f'attachment; filename="playbook-{entry_id}.zip"'
                        )
                    },
                )
    except pbs.PracticeSpineError as e:
        _raise(e)
    except psd.PracticeSpineError as e:
        _raise(e)


@router.post("/api/me/playbook/entries/{entry_id}/cover")
async def post_cover(
    entry_id: int,
    request: Request,
    file: UploadFile = File(...),
) -> dict:
    """Direct cover upload — one file sets the book cover (image only)."""
    claims = require_session(request)
    _require_tool_member(claims, capability="write")
    data = await file.read()
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                out = pbs.set_cover_from_upload(
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


@router.delete("/api/me/playbook/entries/{entry_id}/cover")
def delete_cover(entry_id: int, request: Request) -> dict:
    """Clear cover image (archive file kept)."""
    claims = require_session(request)
    _require_tool_member(claims, capability="write")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                out = pbs.clear_cover(cur, iid, entry_id)
    except psd.PracticeSpineError as e:
        _raise(e)
    return out


@router.get("/api/me/playbook/entries/{entry_id}/archive/{att_id}/bytes")
def get_archive_bytes(entry_id: int, att_id: int, request: Request) -> Response:
    claims = require_session(request)
    _require_tool_member(claims, capability="read")
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
    _require_tool_member(claims, capability="write")
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
def list_campaigns(
    request: Request,
    account_id: int | None = None,
) -> dict:
    """List Practice campaigns (human mode). Multiple actives allowed (DL-259).

    Ensures **ledger furniture** per active account (Structured Practice §2.1) —
    not member charters. Does not invent seasonal campaigns on browse.
    """
    claims = require_session(request)
    _require_tool_member(claims, capability="read")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            campaigns = psd.list_campaigns(cur, iid)
            actives = psd.list_active_campaigns(
                cur, iid, account_id=account_id
            )
            # `active` kept for stamp convenience (newest / account-preferring)
            active = psd.get_active_campaign(
                cur, iid, account_id=account_id
            )
    return {
        "campaigns": campaigns,
        "active": active,
        "actives": actives,
    }


@router.get("/api/me/practice/campaigns/active")
def get_active_campaign(
    request: Request,
    account_id: int | None = None,
) -> dict:
    claims = require_session(request)
    _require_tool_member(claims, capability="read")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            active = psd.get_active_campaign(
                cur, iid, account_id=account_id
            )
            actives = psd.list_active_campaigns(
                cur, iid, account_id=account_id
            )
    return {"active": active, "actives": actives}


@router.get("/api/me/practice/campaigns/eligible")
def list_eligible_campaigns(
    request: Request,
    account_id: int,
    exec_at: str | None = None,
) -> dict:
    """L4 picker — ledger + window-covering charters for this fill time.

    account_id required (ledger is per-book). exec_at defaults to now.
    """
    claims = require_session(request)
    _require_tool_member(claims, capability="read")
    try:
        aid = int(account_id)
    except (TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=422, detail="account_id must be an integer"
        ) from exc
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                when = psd._parse_dt(exec_at) if exec_at else psd._utcnow()
                camps = psd.list_eligible_campaigns_for_fill(
                    cur, iid, aid, exec_at=when
                )
    except psd.PracticeSpineError as e:
        _raise(e)
    return {"campaigns": camps, "exec_at": exec_at}


@router.post("/api/me/practice/campaigns")
async def create_campaign(request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims, capability="write")
    body = await request.json()
    if not isinstance(body, dict):
        body = {}
    pids = body.get("playbook_entry_ids")
    if pids is not None and not isinstance(pids, list):
        raise HTTPException(status_code=422, detail="playbook_entry_ids must be a list")
    account_id = body.get("account_id")
    if account_id is not None and account_id != "":
        try:
            account_id = int(account_id)
        except (TypeError, ValueError) as exc:
            raise HTTPException(
                status_code=422, detail="account_id must be an integer"
            ) from exc
    else:
        account_id = None
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
                    account_id=account_id,
                    starting_capital=body.get("starting_capital"),
                    goals_md=body.get("goals_md"),
                    is_default=bool(body.get("is_default")),
                    max_drawdown_pct=body.get("max_drawdown_pct"),
                    capital_allocation_mode=body.get("capital_allocation_mode"),
                    capital_allocation_note=body.get("capital_allocation_note"),
                    strategy_codes=body.get("strategy_codes"),
                    retrospective_id=body.get("retrospective_id"),
                    same_bet=body.get("same_bet"),
                )
    except psd.PracticeSpineError as e:
        _raise(e)
    return {"campaign": camp}


@router.get("/api/me/practice/campaigns/{campaign_id}")
def get_campaign(campaign_id: int, request: Request) -> dict:
    """Single campaign for dedicated editor (Family B) + lineage chrome."""
    claims = require_session(request)
    _require_tool_member(claims, capability="read")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            camp = psd.get_campaign(cur, iid, campaign_id, with_lineage=True)
    if camp is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"campaign": camp}


@router.get("/api/me/practice/campaigns/{campaign_id}/amendments")
def list_campaign_amendments(campaign_id: int, request: Request) -> dict:
    """Append-only amendment history (Family B). No UPDATE/DELETE routes."""
    claims = require_session(request)
    _require_tool_member(claims, capability="read")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                amendments = psd.list_amendments(cur, iid, campaign_id)
    except psd.PracticeSpineError as e:
        _raise(e)
    return {"amendments": amendments}


@router.get("/api/me/practice/campaigns/{campaign_id}/journey-series")
def get_campaign_journey_series(campaign_id: int, request: Request) -> dict:
    """One-shot scrub series — events + axis meta. Client derives shape in memory.

    Prefer this over repeated journey-shape?as_of= while dragging the slider.
    """
    claims = require_session(request)
    _require_tool_member(claims, capability="read")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                series = psd.journey_series(cur, iid, campaign_id)
    except psd.PracticeSpineError as e:
        _raise(e)
    return {"series": series}


@router.get("/api/me/practice/campaigns/{campaign_id}/journey-shape")
def get_campaign_journey_shape(
    campaign_id: int,
    request: Request,
    as_of: str | None = Query(None, description="YYYY-MM-DD scrub day"),
) -> dict:
    """Campaign Journey shape-at-T — six house axes. Ledger → 404.

    For interactive scrub, use journey-series (one fetch) instead.
    """
    claims = require_session(request)
    _require_tool_member(claims, capability="read")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                shape = psd.journey_shape_at(
                    cur, iid, campaign_id, as_of=as_of
                )
    except psd.PracticeSpineError as e:
        _raise(e)
    return {"shape": shape}


@router.get("/api/me/practice/campaigns/{campaign_id}/panel")
def get_campaign_panel(
    campaign_id: int,
    request: Request,
    as_of: str | None = Query(None),
) -> dict:
    """Campaign Panel v1 — Six Controls blood-work report. Ledger → 404."""
    claims = require_session(request)
    _require_tool_member(claims, capability="read")
    can_edit = auth.role_at_least(str(claims.get("role") or ""), "administrator")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                panel = cpanel.build_panel(
                    cur,
                    iid,
                    campaign_id,
                    as_of=as_of,
                    can_edit=can_edit,
                )
    except psd.PracticeSpineError as e:
        _raise(e)
    return {"panel": panel}


@router.patch("/api/me/practice/campaigns/{campaign_id}/panel/{attribute}")
async def patch_campaign_panel_control(
    campaign_id: int, attribute: str, request: Request
) -> dict:
    """Admin-only dial: acceptable + display domain for one of the six controls."""
    claims = require_admin(request)
    body = await request.json()
    if not isinstance(body, dict):
        body = {}
    kwargs: dict = {}
    for key in (
        "range_low",
        "range_high",
        "display_low",
        "display_high",
        "n_floor",
    ):
        if key in body:
            kwargs[key] = body.get(key)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                panel = cpanel.patch_control(
                    cur, iid, campaign_id, attribute, **kwargs
                )
    except psd.PracticeSpineError as e:
        _raise(e)
    return {"panel": panel}


@router.get("/api/me/practice/campaigns/{campaign_id}/bounds")
def list_campaign_bounds(campaign_id: int, request: Request) -> dict:
    """List bounds (includes house six after ensure). Prefer /panel for UI."""
    claims = require_session(request)
    _require_tool_member(claims, capability="read")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                try:
                    cpanel.ensure_six_controls(cur, iid, campaign_id)
                except psd.PracticeSpineError:
                    pass
                bounds = psd.list_bounds(cur, iid, campaign_id)
    except psd.PracticeSpineError as e:
        _raise(e)
    return {"bounds": bounds}


@router.post("/api/me/practice/campaigns/{campaign_id}/renew")
def renew_campaign(campaign_id: int, request: Request) -> dict:
    """Draft successor from terminal campaign (Concept Spec §4.5.4)."""
    claims = require_session(request)
    _require_tool_member(claims, capability="write")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                camp = psd.renew_campaign(cur, iid, campaign_id)
    except psd.PracticeSpineError as e:
        _raise(e)
    return {"campaign": camp}


@router.patch("/api/me/practice/campaigns/{campaign_id}")
async def patch_campaign(campaign_id: int, request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims, capability="write")
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
    if "account_id" in body:
        kwargs["account_id"] = body.get("account_id")
    if "starting_capital" in body:
        kwargs["starting_capital"] = body.get("starting_capital")
    if "goals_md" in body:
        kwargs["goals_md"] = body.get("goals_md")
    if "is_default" in body:
        kwargs["is_default"] = bool(body.get("is_default"))
    if "max_drawdown_pct" in body:
        kwargs["max_drawdown_pct"] = body.get("max_drawdown_pct")
    if "capital_allocation_mode" in body:
        kwargs["capital_allocation_mode"] = body.get("capital_allocation_mode")
    if "capital_allocation_note" in body:
        kwargs["capital_allocation_note"] = body.get("capital_allocation_note")
    if "strategy_codes" in body:
        kwargs["strategy_codes"] = body.get("strategy_codes")
    if "retrospective_id" in body:
        kwargs["retrospective_id"] = body.get("retrospective_id")
    if "same_bet" in body:
        kwargs["same_bet"] = body.get("same_bet")
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
                camp = psd.attach_lineage(cur, iid, camp)
    except psd.PracticeSpineError as e:
        _raise(e)
    return {"campaign": camp}


@router.delete("/api/me/practice/campaigns/{campaign_id}")
def delete_campaign(campaign_id: int, request: Request) -> dict:
    """Hard-delete only if never signed and unreferenced (§4.5.6 / OD-PB-7)."""
    claims = require_session(request)
    _require_tool_member(claims, capability="write")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                psd.delete_campaign(cur, iid, campaign_id)
    except psd.PracticeSpineError as e:
        _raise(e)
    return {"ok": True, "deleted_id": campaign_id}


@router.post("/api/me/practice/campaigns/{campaign_id}/cover")
async def post_campaign_cover(
    campaign_id: int,
    request: Request,
    file: UploadFile = File(...),
) -> dict:
    """Direct cover upload for campaign library card (image only)."""
    claims = require_session(request)
    _require_tool_member(claims, capability="write")
    data = await file.read()
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                out = psd.set_campaign_cover_from_upload(
                    cur,
                    iid,
                    campaign_id,
                    content_type=file.content_type or "application/octet-stream",
                    data=data,
                    original_name=file.filename,
                )
    except psd.PracticeSpineError as e:
        _raise(e)
    return out


@router.delete("/api/me/practice/campaigns/{campaign_id}/cover")
def delete_campaign_cover(campaign_id: int, request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims, capability="write")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                out = psd.clear_campaign_cover(cur, iid, campaign_id)
    except psd.PracticeSpineError as e:
        _raise(e)
    return out


@router.get("/api/me/practice/campaigns/{campaign_id}/cover/bytes")
def get_campaign_cover_bytes(campaign_id: int, request: Request) -> Response:
    claims = require_session(request)
    _require_tool_member(claims, capability="read")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                iid = _iid(cur, claims)
                data, ct = psd.read_campaign_cover_bytes(cur, iid, campaign_id)
    except psd.PracticeSpineError as e:
        _raise(e)
    return Response(
        content=data,
        media_type=ct,
        headers={"Cache-Control": "private, max-age=3600"},
    )
