"""Tag Manager APIs — platform lexicon + personal vocabulary (Spec v0.2)."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Request

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
    """List platform lexicon (admin-curated). Prefer /api/me/tags for pickers."""
    require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            categories = td.list_categories(cur)
            tags = td.list_tags(cur, status="active")
    return {"categories": categories, "tags": tags}


@router.get("/api/me/tags/usage")
def process_tag_usage(
    request: Request,
    from_day: str | None = Query(None, description="YYYY-MM-DD inclusive"),
    to_day: str | None = Query(None, description="YYYY-MM-DD inclusive"),
    categories: str = Query(
        "process,behavior",
        description="Comma-separated category system_keys (default process,behavior)",
    ),
) -> dict:
    """Process/behavior tag frequency for Reports (Trader Development Phase 0).

    Counts only — never P&L or win-rate. Family B scoped to session identity.
    """
    claims = require_session(request)
    keys = [k.strip() for k in (categories or "").split(",") if k.strip()]
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            return td.process_tag_usage(
                cur,
                iid,
                from_day=from_day,
                to_day=to_day,
                category_keys=keys or None,
            )


@router.get("/api/me/tags")
def list_my_tags(
    request: Request,
    include_retired: bool = Query(False),
    with_usage: bool = Query(False),
) -> dict:
    """Personal vocabulary — seeded from lexicon; Family B definitions."""
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            cats = td.list_member_categories(cur, iid)
            tags = td.list_member_tags(
                cur, iid, include_retired=include_retired, with_usage=with_usage
            )
            if with_usage:
                usage = td.member_usage_counts(cur, iid)
                for t in tags:
                    t["usage_count"] = usage.get(int(t["id"]), 0)
    return {"categories": cats, "tags": tags}


@router.post("/api/me/tags/resolve")
async def resolve_my_tag(request: Request) -> dict:
    """Resolve-or-create a personal label (auto-create + near-dup hint)."""
    claims = require_session(request)
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}
    label = str(body.get("label") or "")
    allow_create = body.get("allow_create", True)
    if not isinstance(allow_create, bool):
        allow_create = True
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            try:
                result = td.resolve_or_create_member_tag(
                    cur, iid, label, allow_create=allow_create
                )
            except td.TagError as e:
                _raise(e)
    return result


@router.post("/api/me/tags/adopt")
async def adopt_lexicon_tag(request: Request) -> dict:
    """Adopt a lexicon term into personal vocabulary by lexicon_key."""
    claims = require_session(request)
    try:
        body = await request.json()
    except Exception:
        body = {}
    lk = str((body or {}).get("lexicon_key") or "")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            try:
                tag = td.adopt_lexicon_term(cur, iid, lk)
            except td.TagError as e:
                _raise(e)
    return {"tag": tag}


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
    """Replace tags on an object.

    Body: object_type, object_id, and either:
    - ``member_tag_ids`` (Family B personal vocabulary — preferred), or
    - ``tag_ids`` (platform lexicon ids — public objects / legacy).
    """
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
    raw_member = body.get("member_tag_ids")
    raw_ids = body.get("tag_ids") or []
    use_member = isinstance(raw_member, list)
    if use_member:
        member_tag_ids = [int(x) for x in raw_member]
        tag_ids = []
    else:
        if not isinstance(raw_ids, list):
            raise HTTPException(status_code=422, detail="tag_ids must be a list")
        tag_ids = [int(x) for x in raw_ids]
        member_tag_ids = []

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
                if use_member and ot in td.MEMBER_OBJECT_TYPES:
                    items = td.set_member_assignments_for_object(
                        cur,
                        object_type=ot,
                        object_id=object_id,
                        member_tag_ids=member_tag_ids,
                        identity_id=int(owner_id or iid),
                    )
                else:
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
