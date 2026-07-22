"""Resource Library (Resource Library Spec v1.0): global listing + gated
downloads. Private files live outside the static mount and stream only through
the role-checked download endpoint."""

import re
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse, RedirectResponse

import auth
import db
from routes.member import require_session

router = APIRouter(tags=["resources"])

PRIVATE_DIR = Path(__file__).resolve().parent.parent / "uploads" / "private"


@router.get("/api/resources")
def library(request: Request) -> dict:
    require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT a.id, a.title, a.kind, a.url, a.free_preview,
                          a.description_md, a.emoji,
                          c.slug AS course_slug, c.title AS course_title
                   FROM attachments a
                   JOIN courses c ON a.owner_type = 'course' AND a.owner_id = c.id
                   WHERE c.status = 'published'
                   ORDER BY c.title, a.title""",
            )
            rows = cur.fetchall()
            cur.execute(
                """SELECT cc.course_id, cat.slug, cat.name
                   FROM course_categories cc JOIN categories cat ON cc.category_id = cat.id""",
            )
            cat_rows = cur.fetchall()
            cur.execute("SELECT id, slug FROM courses WHERE status = 'published'")
            course_ids = {r["slug"]: r["id"] for r in cur.fetchall()}

    cats_by_course: dict[int, list[dict]] = {}
    for r in cat_rows:
        cats_by_course.setdefault(r["course_id"], []).append(
            {"slug": r["slug"], "name": r["name"]}
        )
    return {
        "resources": [
            {
                "id": r["id"],
                "title": r["title"],
                "kind": r["kind"],
                "free": bool(r["free_preview"]),
                "description_md": r["description_md"],
                "emoji": r["emoji"],
                "url": r["url"] if r["kind"] == "link" else None,
                "course": {"slug": r["course_slug"], "title": r["course_title"]},
                "categories": cats_by_course.get(course_ids.get(r["course_slug"], -1), []),
            }
            for r in rows
        ]
    }


@router.get("/api/attachments/{attachment_id}/download")
def download(attachment_id: int, request: Request):
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT a.title, a.kind, a.url, a.free_preview FROM attachments a
                   JOIN courses c ON a.owner_type = 'course' AND a.owner_id = c.id
                   WHERE a.id = %s AND c.status = 'published'""",
                (attachment_id,),
            )
            row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Resource not found")
    # Free resources: any signed-in account. Members-only: alumni+ (spec v1.1).
    if not row["free_preview"] and not auth.role_at_least(claims["role"], "alumni"):
        raise HTTPException(status_code=403, detail="Membership required to download resources")
    if row["kind"] == "link":
        return RedirectResponse(url=row["url"], status_code=302)

    url = row["url"] or ""
    if url.startswith("private:"):
        name = url.split(":", 1)[1]
        if "/" in name or ".." in name:
            raise HTTPException(status_code=404, detail="Resource not found")
        path = PRIVATE_DIR / name
        if not path.is_file():
            raise HTTPException(status_code=404, detail="File missing")
        ext = path.suffix
        safe_title = re.sub(r"[^\w\- ]", "", row["title"]).strip() or "resource"
        return FileResponse(path, filename=f"{safe_title}{ext}")
    # Legacy/public-media file URLs: just redirect.
    return RedirectResponse(url=url, status_code=302)
