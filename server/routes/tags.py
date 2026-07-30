"""Public/member Tag Manager APIs — list vocabulary + assign existing tags only."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

import db
import journal_session_domain as jsd
import tag_domain as td
from guards import require_session
from routes.trade_log.common import _storage_identity_id

router = APIRouter(tags=["tags"])


def _raise(exc: td.TagError) -> None:
    payload: dict | str
    if exc.extra:
        payload = {"detail": exc.detail, **exc.extra}
    else:
        payload = exc.detail
    raise HTTPException(status_code=exc.code, detail=payload)


def _assert_journal_session_mutable(cur, object_id: int, claims: dict, iid: int) -> int:
    """Ownership + open-only for tag changes (Spec v0.5 §5.1 / J4-3)."""
    role = str(claims.get("role") or "observer")
    cur.execute(
        """SELECT identity_id, status, journal_date
           FROM member_journal_sessions WHERE id = %s""",
        (object_id,),
    )
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Object not found")
    owner_id = int(row["identity_id"])
    if role != "administrator" and owner_id != int(iid):
        raise HTTPException(status_code=403, detail="Not your object")
    status = str(row.get("status") or "")
    if status not in ("open", "partial"):
        raise HTTPException(
            status_code=409,
            detail="This journal entry is closed — tags can no longer be changed.",
        )
    try:
        jsd.assert_date_open(cur, owner_id, jsd._as_date(row["journal_date"]))
    except jsd.JournalSessionError as e:
        raise HTTPException(status_code=e.code, detail=e.detail) from e
    return owner_id


@router.get("/api/tags")
def list_active_tags(request: Request, include_retired: bool = False) -> dict:
    """List system vocabulary for pickers and Resources hub Lexicon."""
    require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            categories = td.list_categories(cur)
            if include_retired:
                # Only admin should pass include_retired via admin route; members get active
                tags = td.list_tags(cur, status="active")
            else:
                tags = td.list_tags(cur, status="active")
    return {"categories": categories, "tags": tags}


@router.get("/api/tags/categories")
def list_tag_categories(request: Request) -> dict:
    require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            categories = td.list_categories(cur)
    return {"categories": categories}


@router.get("/api/tags/assignments")
def get_object_assignments(
    request: Request,
    object_type: str,
    object_id: int,
) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            try:
                ot = td._assert_object_type(object_type)
            except td.TagError as e:
                _raise(e)
            # Family B objects: only owner (or admin) may read
            if ot in td.MEMBER_OBJECT_TYPES:
                role = str(claims.get("role") or "observer")
                if role != "administrator":
                    items = td.list_assignments_for_object(
                        cur,
                        object_type=ot,
                        object_id=object_id,
                        identity_id=iid,
                    )
                    # Filter to this identity only
                    items = [
                        a
                        for a in items
                        if a.get("identity_id") is None
                        or int(a["identity_id"]) == int(iid)
                    ]
                else:
                    items = td.list_assignments_for_object(
                        cur, object_type=ot, object_id=object_id
                    )
            else:
                items = td.list_assignments_for_object(
                    cur, object_type=ot, object_id=object_id
                )
    return {"assignments": items}


@router.put("/api/tags/assignments")
async def put_object_assignments(request: Request) -> dict:
    """Replace tags on an object. Body: object_type, object_id, tag_ids[]."""
    claims = require_session(request)
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}
    object_type = str(body.get("object_type") or "")
    try:
        object_id = int(body.get("object_id"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail="object_id required")
    raw_ids = body.get("tag_ids") or []
    if not isinstance(raw_ids, list):
        raise HTTPException(status_code=422, detail="tag_ids must be a list")
    tag_ids = [int(x) for x in raw_ids]

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            role = str(claims.get("role") or "observer")
            try:
                ot = td._assert_object_type(object_type)
            except td.TagError as e:
                _raise(e)
            if ot in td.PUBLIC_OBJECT_TYPES and role != "administrator":
                raise HTTPException(
                    status_code=403,
                    detail="Administrator role required to tag public objects",
                )
            owner_id = iid if ot in td.MEMBER_OBJECT_TYPES else None
            if ot == "journal_session":
                owner_id = _assert_journal_session_mutable(cur, object_id, claims, iid)
            try:
                items = td.set_assignments_for_object(
                    cur,
                    object_type=ot,
                    object_id=object_id,
                    tag_ids=tag_ids,
                    identity_id=owner_id,
                )
            except td.TagError as e:
                _raise(e)
    return {"assignments": items}


@router.post("/api/tags/assignments")
async def post_assignment(request: Request) -> dict:
    """Assign one tag. Body: tag_id, object_type, object_id."""
    claims = require_session(request)
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}
    try:
        tag_id = int(body.get("tag_id"))
        object_id = int(body.get("object_id"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail="tag_id and object_id required")
    object_type = str(body.get("object_type") or "")

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            role = str(claims.get("role") or "observer")
            try:
                ot = td._assert_object_type(object_type)
            except td.TagError as e:
                _raise(e)
            if ot in td.PUBLIC_OBJECT_TYPES and role != "administrator":
                raise HTTPException(
                    status_code=403,
                    detail="Administrator role required to tag public objects",
                )
            owner_id = iid if ot in td.MEMBER_OBJECT_TYPES else None
            if ot == "journal_session":
                owner_id = _assert_journal_session_mutable(cur, object_id, claims, iid)
            try:
                a = td.assign_tag(
                    cur,
                    tag_id=tag_id,
                    object_type=ot,
                    object_id=object_id,
                    identity_id=owner_id,
                )
            except td.TagError as e:
                _raise(e)
    return {"assignment": a}


@router.delete("/api/tags/assignments")
async def delete_assignment(request: Request) -> dict:
    claims = require_session(request)
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}
    try:
        tag_id = int(body.get("tag_id"))
        object_id = int(body.get("object_id"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail="tag_id and object_id required")
    object_type = str(body.get("object_type") or "")

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            role = str(claims.get("role") or "observer")
            try:
                ot = td._assert_object_type(object_type)
            except td.TagError as e:
                _raise(e)
            if ot in td.PUBLIC_OBJECT_TYPES and role != "administrator":
                raise HTTPException(
                    status_code=403,
                    detail="Administrator role required",
                )
            owner_check = iid if ot in td.MEMBER_OBJECT_TYPES else None
            if ot == "journal_session":
                owner_check = _assert_journal_session_mutable(
                    cur, object_id, claims, iid
                )
            try:
                td.unassign_tag(
                    cur,
                    tag_id=tag_id,
                    object_type=ot,
                    object_id=object_id,
                    identity_id=owner_check,
                )
            except td.TagError as e:
                _raise(e)
    return {"ok": True}
