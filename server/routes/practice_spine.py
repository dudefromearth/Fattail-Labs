"""Playbook + Practice Campaign APIs — Trader Development Phase 1."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Request

import db
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


# ── Playbook ────────────────────────────────────────────────────────────────


@router.get("/api/me/playbook/entries")
def list_playbook_entries(
    request: Request,
    include_archived: bool = Query(False),
) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            entries = psd.list_playbooks(
                cur, iid, include_archived=include_archived
            )
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
                entry = psd.create_playbook(
                    cur,
                    iid,
                    title=str(body.get("title") or ""),
                    body_md=str(body.get("body_md") or ""),
                    structured=body.get("structured")
                    if isinstance(body.get("structured"), dict)
                    else None,
                )
    except psd.PracticeSpineError as e:
        _raise(e)
    return {"entry": entry}


@router.get("/api/me/playbook/entries/{entry_id}")
def get_playbook_entry(entry_id: int, request: Request) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _iid(cur, claims)
            entry = psd.get_playbook(cur, iid, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Playbook entry not found")
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
                if "body_md" in body:
                    kwargs["body_md"] = str(body.get("body_md") or "")
                if "status" in body:
                    kwargs["status"] = str(body.get("status") or "")
                if "structured" in body:
                    kwargs["structured"] = (
                        body["structured"]
                        if isinstance(body.get("structured"), dict)
                        else {}
                    )
                entry = psd.patch_playbook(cur, iid, entry_id, **kwargs)
    except psd.PracticeSpineError as e:
        _raise(e)
    return {"entry": entry}


# ── Campaigns ───────────────────────────────────────────────────────────────


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
