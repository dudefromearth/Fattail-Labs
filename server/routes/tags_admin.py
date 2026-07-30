"""Admin Tag Manager — definition CRUD, merge, usage aggregates."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

import db
import tag_domain as td
from guards import require_admin
from member_privacy import audit

router = APIRouter(prefix="/api/admin/tags", tags=["admin-tags"])


def _raise(exc: td.TagError) -> None:
    payload: dict | str
    if exc.extra:
        payload = {"detail": exc.detail, **exc.extra}
    else:
        payload = exc.detail
    raise HTTPException(status_code=exc.code, detail=payload)


@router.get("")
def admin_list_tags(request: Request) -> dict:
    claims = require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            categories = td.list_categories(cur)
            tags = td.list_tags(cur, include_retired=True)
            usage = td.usage_counts(cur)
    _ = claims
    return {"categories": categories, "tags": tags, "usage": usage}


@router.post("")
async def admin_create_tag(request: Request) -> dict:
    claims = require_admin(request)
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}
    with db.transaction() as conn:
        with conn.cursor() as cur:
            try:
                tag = td.create_tag(
                    cur,
                    label=str(body.get("label") or ""),
                    description=body.get("description"),
                    category_id=(
                        int(body["category_id"])
                        if body.get("category_id") is not None
                        else None
                    ),
                    color=body.get("color"),
                    slug=body.get("slug"),
                )
            except td.TagError as e:
                _raise(e)
            except (TypeError, ValueError) as e:
                raise HTTPException(status_code=422, detail=str(e)) from e
            audit(
                cur,
                actor_identity_id=int(claims["identity_id"]),
                subject_identity_id=int(claims["identity_id"]),
                action="tag_create",
                detail=f"tag_id={tag['id']} label={tag['label']}",
            )
    return {"tag": tag}


@router.patch("/{tag_id}")
async def admin_update_tag(request: Request, tag_id: int) -> dict:
    claims = require_admin(request)
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}
    with db.transaction() as conn:
        with conn.cursor() as cur:
            try:
                cat = body.get("category_id")
                tag = td.update_tag(
                    cur,
                    tag_id,
                    label=body.get("label"),
                    description=body.get("description"),
                    category_id=int(cat) if cat is not None and cat != "" else None,
                    clear_category=body.get("category_id") == ""
                    or body.get("clear_category") is True,
                    color=body.get("color"),
                    status=body.get("status"),
                )
            except td.TagError as e:
                _raise(e)
            except (TypeError, ValueError) as e:
                raise HTTPException(status_code=422, detail=str(e)) from e
            audit(
                cur,
                actor_identity_id=int(claims["identity_id"]),
                subject_identity_id=int(claims["identity_id"]),
                action="tag_update",
                detail=f"tag_id={tag_id}",
            )
    return {"tag": tag}


@router.post("/{tag_id}/retire")
def admin_retire_tag(request: Request, tag_id: int) -> dict:
    claims = require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            try:
                tag = td.retire_tag(cur, tag_id)
            except td.TagError as e:
                _raise(e)
            audit(
                cur,
                actor_identity_id=int(claims["identity_id"]),
                subject_identity_id=int(claims["identity_id"]),
                action="tag_retire",
                detail=f"tag_id={tag_id}",
            )
    return {"tag": tag}


@router.delete("/{tag_id}")
def admin_delete_tag(request: Request, tag_id: int) -> dict:
    claims = require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            try:
                td.delete_tag(cur, tag_id)
            except td.TagError as e:
                _raise(e)
            audit(
                cur,
                actor_identity_id=int(claims["identity_id"]),
                subject_identity_id=int(claims["identity_id"]),
                action="tag_delete",
                detail=f"tag_id={tag_id}",
            )
    return {"ok": True}


@router.post("/merge")
async def admin_merge_tags(request: Request) -> dict:
    claims = require_admin(request)
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}
    try:
        source_id = int(body.get("source_tag_id"))
        target_id = int(body.get("target_tag_id"))
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=422, detail="source_tag_id and target_tag_id required"
        )
    with db.transaction() as conn:
        with conn.cursor() as cur:
            try:
                result = td.merge_tags(
                    cur, source_tag_id=source_id, target_tag_id=target_id
                )
            except td.TagError as e:
                _raise(e)
            audit(
                cur,
                actor_identity_id=int(claims["identity_id"]),
                subject_identity_id=int(claims["identity_id"]),
                action="tag_merge",
                detail=f"source={source_id} target={target_id}",
            )
    return result


@router.get("/usage")
def admin_tag_usage(request: Request) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            usage = td.usage_counts(cur)
    return {"usage": usage}


@router.post("/categories")
async def admin_create_category(request: Request) -> dict:
    claims = require_admin(request)
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}
    with db.transaction() as conn:
        with conn.cursor() as cur:
            try:
                cat = td.create_category(
                    cur,
                    label=str(body.get("label") or ""),
                    system_key=body.get("system_key"),
                    sort_order=int(body.get("sort_order") or 0),
                )
            except td.TagError as e:
                _raise(e)
            except Exception as e:
                raise HTTPException(status_code=409, detail=str(e)) from e
            audit(
                cur,
                actor_identity_id=int(claims["identity_id"]),
                subject_identity_id=int(claims["identity_id"]),
                action="tag_category_create",
                detail=f"category_id={cat['id']}",
            )
    return {"category": cat}
