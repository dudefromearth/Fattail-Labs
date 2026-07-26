"""Admin API — Canonical Course Model export / import / validate / inspect.

Spec: Specs/FatTail-Labs-Canonical-Course-Model-Spec-v1.0.md
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

import db
from course_model import (
    CourseModelError,
    export_course_document,
    import_document,
    inspect_document,
    normalize_document,
    validate,
)
from guards import require_admin

router = APIRouter(tags=["canonical-courses"])


def _body_document(body: dict) -> dict:
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="body must be a JSON object")
    if "document" in body:
        return body["document"]
    # Allow posting the document at the top level
    if body.get("format") or body.get("package") or body.get("course") or body.get(
        "course_title"
    ):
        return body
    raise HTTPException(
        status_code=422,
        detail="expected { document: … } or a canonical/legacy course document",
    )


@router.post("/api/admin/canonical-courses/validate")
async def canonical_validate(request: Request) -> dict:
    require_admin(request)
    body = await request.json()
    doc = _body_document(body)
    mode = (body.get("mode") if isinstance(body, dict) else None) or "structural"
    if mode not in ("structural", "publish", "strict"):
        raise HTTPException(status_code=422, detail="mode must be structural|publish|strict")
    resolve = None
    if body.get("resolve_env"):
        resolve = body["resolve_env"]
    else:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT slug FROM categories")
                resolve = {"category_slugs": [r["slug"] for r in cur.fetchall()]}
    return validate(doc, mode=mode, resolve_env=resolve)


@router.post("/api/admin/canonical-courses/inspect")
async def canonical_inspect(request: Request) -> dict:
    require_admin(request)
    body = await request.json()
    doc = _body_document(body)
    return inspect_document(doc)


@router.post("/api/admin/canonical-courses/import")
async def canonical_import(request: Request) -> dict:
    require_admin(request)
    body = await request.json()
    doc = _body_document(body)
    mode = body.get("mode") or "create_draft"
    if mode not in ("create_draft", "replace_draft", "publish"):
        raise HTTPException(
            status_code=422, detail="mode must be create_draft|replace_draft|publish"
        )
    target_slug = body.get("target_slug")
    validate_mode = body.get("validate_mode") or (
        "publish" if mode == "publish" else "structural"
    )
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                result = import_document(
                    cur,
                    doc,
                    mode=mode,
                    target_slug=target_slug,
                    validate_mode=validate_mode,
                )
        return result
    except CourseModelError as exc:
        status = 422
        if exc.detail.get("code") == "PUBLISHED_REPLACE_FORBIDDEN":
            status = 422
        raise HTTPException(
            status_code=status,
            detail={"message": str(exc), **({"validation": exc.detail} if exc.detail else {})},
        ) from exc


@router.get("/api/admin/courses/{slug}/canonical")
def export_canonical(slug: str, request: Request) -> dict:
    require_admin(request)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                return export_course_document(cur, slug)
    except CourseModelError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/api/admin/courses/{slug}/canonical")
async def replace_canonical(slug: str, request: Request) -> dict:
    """Import with replace_draft targeting this slug."""
    require_admin(request)
    body = await request.json()
    doc = _body_document(body)
    validate_mode = body.get("validate_mode") or "structural"
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                return import_document(
                    cur,
                    doc,
                    mode="replace_draft",
                    target_slug=slug,
                    validate_mode=validate_mode,
                )
    except CourseModelError as exc:
        raise HTTPException(
            status_code=422,
            detail={"message": str(exc), **({"validation": exc.detail} if exc.detail else {})},
        ) from exc


# Transitional aliases (Course Package naming)
@router.post("/api/admin/course-packages/validate")
async def package_validate_alias(request: Request) -> dict:
    return await canonical_validate(request)


@router.post("/api/admin/course-packages/inspect")
async def package_inspect_alias(request: Request) -> dict:
    return await canonical_inspect(request)


@router.post("/api/admin/course-packages/import")
async def package_import_alias(request: Request) -> dict:
    return await canonical_import(request)


@router.get("/api/admin/courses/{slug}/package")
def package_export_alias(slug: str, request: Request) -> dict:
    return export_canonical(slug, request)
