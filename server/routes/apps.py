"""Public Apps catalog — first-class id + slug + title (/app/{slug})."""

from __future__ import annotations

import re

from fastapi import APIRouter, HTTPException, Request

import db
from guards import require_admin

router = APIRouter(tags=["apps"])

VALID_STATUS = frozenset({"soon", "live", "external"})


def _slugify(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", (title or "").lower()).strip("-")
    return slug or "app"


def _claim_app_slug(cur, base: str, *, exclude_id: int | None = None) -> str:
    slug = base or "app"
    cur.execute("SELECT id, title FROM apps WHERE slug = %s", (slug,))
    row = cur.fetchone()
    if row is not None and (
        exclude_id is None or int(row["id"]) != int(exclude_id)
    ):
        raise HTTPException(
            status_code=409,
            detail={
                "code": "NAME_CONFLICT",
                "message": (
                    f"Another app already uses the URL /app/{slug} "
                    f"(“{row['title']}”). Choose a different name."
                ),
                "field": "title",
                "slug": slug,
            },
        )
    return slug


def _row(r: dict) -> dict:
    return {
        "id": r["id"],
        "slug": r["slug"],
        "title": r["title"],
        "blurb": r["blurb"] or "",
        "status": r["status"],
        "sort_order": r["sort_order"],
        "href": f"/app/{r['slug']}",
    }


@router.get("/api/apps")
def list_apps() -> dict:
    """Public catalog of member apps (id + slug + title)."""
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, slug, title, blurb, status, sort_order
                   FROM apps ORDER BY sort_order, id"""
            )
            rows = cur.fetchall()
    return {"apps": [_row(r) for r in rows]}


@router.get("/api/apps/{slug}")
def get_app(slug: str) -> dict:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, slug, title, blurb, status, sort_order
                   FROM apps WHERE slug = %s""",
                (slug,),
            )
            row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="App not found")
    return _row(row)


@router.post("/api/admin/apps")
async def create_app(request: Request) -> dict:
    require_admin(request)
    body = await request.json() if int(request.headers.get("content-length") or 0) else {}
    title = (body.get("title") or "New App").strip() or "New App"
    blurb = (body.get("blurb") or "").strip()
    status = (body.get("status") or "soon").strip().lower()
    if status not in VALID_STATUS:
        raise HTTPException(
            status_code=422, detail=f"status must be one of {sorted(VALID_STATUS)}"
        )
    with db.transaction() as conn:
        with conn.cursor() as cur:
            # Create defaults may suffix -2 if needed; renames use claim (strict).
            base = _slugify(title)
            slug = base
            n = 2
            while True:
                cur.execute("SELECT 1 FROM apps WHERE slug = %s", (slug,))
                if cur.fetchone() is None:
                    break
                slug = f"{base}-{n}"
                n += 1
            cur.execute("SELECT COALESCE(MAX(sort_order), -1) + 1 AS nxt FROM apps")
            nxt = int(cur.fetchone()["nxt"])
            cur.execute(
                """INSERT INTO apps (slug, title, blurb, status, sort_order)
                   VALUES (%s, %s, %s, %s, %s)""",
                (slug, title, blurb, status, nxt),
            )
            app_id = int(cur.lastrowid)
            cur.execute(
                "SELECT id, slug, title, blurb, status, sort_order FROM apps WHERE id = %s",
                (app_id,),
            )
            row = cur.fetchone()
    return _row(row)


@router.put("/api/admin/apps/{app_id}")
async def update_app(app_id: int, request: Request) -> dict:
    """Update app; title change rewrites slug (409 on conflict)."""
    require_admin(request)
    body = await request.json()
    allowed = {"title", "blurb", "status", "sort_order"}
    unknown = set(body) - allowed
    if unknown:
        raise HTTPException(status_code=422, detail=f"Unknown fields: {sorted(unknown)}")
    if not body:
        raise HTTPException(status_code=422, detail="Empty update")
    if "status" in body and body["status"] not in VALID_STATUS:
        raise HTTPException(
            status_code=422, detail=f"status must be one of {sorted(VALID_STATUS)}"
        )
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, slug, title FROM apps WHERE id = %s", (app_id,)
            )
            existing = cur.fetchone()
            if existing is None:
                raise HTTPException(status_code=404, detail="App not found")
            if "title" in body:
                title = (str(body["title"]) or "").strip() or "New App"
                body["title"] = title
                body["slug"] = _claim_app_slug(
                    cur, _slugify(title), exclude_id=app_id
                )
            if "sort_order" in body:
                body["sort_order"] = int(body["sort_order"])
            sets = ", ".join(f"{k} = %s" for k in body)
            cur.execute(
                f"UPDATE apps SET {sets} WHERE id = %s",
                [*body.values(), app_id],
            )
            cur.execute(
                "SELECT id, slug, title, blurb, status, sort_order FROM apps WHERE id = %s",
                (app_id,),
            )
            row = cur.fetchone()
    return _row(row)
