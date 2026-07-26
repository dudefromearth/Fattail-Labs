"""Resource Library + first-class Resources API (Resource Spec v1.0 / R2).

Member: published hub list, slug resolve, version download (gated).
Legacy: attachment download path retained until R6 cutover.
"""

from __future__ import annotations

import re
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse, RedirectResponse

import auth
import db
from guards import require_session

router = APIRouter(tags=["resources"])

PRIVATE_DIR = Path(__file__).resolve().parent.parent / "uploads" / "private"


def _serve_file_or_link(*, title: str, kind: str, url: str):
    if kind == "link":
        # Only allow http(s) redirects (no SSRF to file:// or internal schemes)
        if not (url.startswith("https://") or url.startswith("http://")):
            raise HTTPException(status_code=422, detail="Invalid link URL")
        return RedirectResponse(url=url, status_code=302)

    if (url or "").startswith("private:"):
        name = url.split(":", 1)[1]
        if "/" in name or ".." in name:
            raise HTTPException(status_code=404, detail="Resource not found")
        path = PRIVATE_DIR / name
        if not path.is_file():
            raise HTTPException(status_code=404, detail="File missing")
        ext = path.suffix
        safe_title = re.sub(r"[^\w\- ]", "", title).strip() or "resource"
        return FileResponse(path, filename=f"{safe_title}{ext}")

    if url.startswith("https://") or url.startswith("http://") or url.startswith("/"):
        return RedirectResponse(url=url, status_code=302)
    raise HTTPException(status_code=404, detail="Resource not found")


def _legacy_library_rows(cur) -> list[dict]:
    cur.execute(
        """SELECT a.id, a.title, a.kind, a.url, a.free_preview,
                  a.description_md, a.emoji,
                  c.slug AS course_slug, c.title AS course_title, c.id AS course_id
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
    cats_by_course: dict[int, list[dict]] = {}
    for r in cat_rows:
        cats_by_course.setdefault(r["course_id"], []).append(
            {"slug": r["slug"], "name": r["name"]}
        )
    out = []
    for r in rows:
        out.append(
            {
                "source": "attachment",
                "id": r["id"],
                "slug": None,
                "title": r["title"],
                "kind": r["kind"],
                "type": "other",
                "free": bool(r["free_preview"]),
                "description_md": r["description_md"],
                "emoji": r["emoji"],
                "version": None,
                "url": r["url"] if r["kind"] == "link" else None,
                "course": {"slug": r["course_slug"], "title": r["course_title"]},
                "courses": [{"slug": r["course_slug"], "title": r["course_title"]}],
                "categories": cats_by_course.get(r["course_id"], []),
                "download_path": f"/api/attachments/{r['id']}/download",
            }
        )
    return out


def _first_class_library_rows(cur) -> list[dict]:
    cur.execute(
        """SELECT r.id, r.slug, r.title, r.description_md, r.type, r.category_slug,
                  r.emoji, r.published_version_id,
                  v.id AS version_id, v.version, v.kind, v.url
           FROM resources r
           JOIN resource_versions v ON v.id = r.published_version_id
           ORDER BY r.title""",
    )
    rows = cur.fetchall()
    if not rows:
        return []

    rids = [r["id"] for r in rows]
    ph = ",".join(["%s"] * len(rids))
    cur.execute(
        f"""SELECT l.resource_id, l.free_preview, c.slug, c.title
            FROM course_resource_links l
            JOIN courses c ON c.id = l.course_id
            WHERE l.resource_id IN ({ph})""",
        rids,
    )
    links = cur.fetchall()
    courses_by_rid: dict[int, list[dict]] = {}
    free_by_rid: dict[int, bool] = {}
    for L in links:
        courses_by_rid.setdefault(L["resource_id"], []).append(
            {"slug": L["slug"], "title": L["title"]}
        )
        if L["free_preview"]:
            free_by_rid[L["resource_id"]] = True

    out = []
    for r in rows:
        cats = []
        if r["category_slug"]:
            cats = [{"slug": r["category_slug"], "name": r["category_slug"]}]
        free = bool(free_by_rid.get(r["id"]))
        courses = courses_by_rid.get(r["id"], [])
        out.append(
            {
                "source": "resource",
                "id": r["id"],
                "slug": r["slug"],
                "title": r["title"],
                "kind": r["kind"],
                "type": r["type"],
                "free": free,
                "description_md": r["description_md"],
                "emoji": r["emoji"],
                "version": r["version"],
                "version_id": r["version_id"],
                "url": r["url"] if r["kind"] == "link" else None,
                "course": courses[0] if courses else None,
                "courses": courses,
                "categories": cats,
                "download_path": f"/api/resource-versions/{r['version_id']}/download",
            }
        )
    return out


@router.get("/api/resources")
def library(request: Request) -> dict:
    """Published first-class resources + legacy course attachments (dual-read until R6)."""
    require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            modern = _first_class_library_rows(cur)
            legacy = _legacy_library_rows(cur)
    # Prefer modern first; legacy fills until backfill
    return {"resources": modern + legacy, "sources": ["resource", "attachment"]}


@router.get("/api/resources/{slug}")
def resource_by_slug(slug: str, request: Request) -> dict:
    """Resolve slug to the single published version (or 404)."""
    require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT r.id, r.slug, r.title, r.description_md, r.type, r.category_slug,
                          r.emoji, v.id AS version_id, v.version, v.kind, v.url, v.changelog_md
                   FROM resources r
                   JOIN resource_versions v ON v.id = r.published_version_id
                   WHERE r.slug = %s""",
                (slug,),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Resource not found")
            cur.execute(
                """SELECT l.free_preview, c.slug, c.title
                   FROM course_resource_links l
                   JOIN courses c ON c.id = l.course_id
                   WHERE l.resource_id = %s""",
                (row["id"],),
            )
            links = cur.fetchall()
    free = any(bool(L["free_preview"]) for L in links)
    return {
        "id": row["id"],
        "slug": row["slug"],
        "title": row["title"],
        "description_md": row["description_md"],
        "type": row["type"],
        "category_slug": row["category_slug"],
        "emoji": row["emoji"],
        "version": row["version"],
        "version_id": row["version_id"],
        "kind": row["kind"],
        "url": row["url"] if row["kind"] == "link" else None,
        "free": free,
        "changelog_md": row["changelog_md"],
        "courses": [{"slug": L["slug"], "title": L["title"]} for L in links],
        "download_path": f"/api/resource-versions/{row['version_id']}/download",
    }


@router.get("/api/resource-versions/{version_id}/download")
def download_version(version_id: int, request: Request):
    """Download a resource version (published hub cut or course-pinned cut)."""
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT v.id, v.resource_id, v.version, v.kind, v.url,
                          r.slug, r.title, r.published_version_id
                   FROM resource_versions v
                   JOIN resources r ON r.id = v.resource_id
                   WHERE v.id = %s""",
                (version_id,),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Resource not found")

            is_admin = claims.get("role") == "administrator"
            is_published_cut = row["published_version_id"] == row["id"]

            cur.execute(
                """SELECT free_preview FROM course_resource_links
                   WHERE resource_id = %s AND pinned_version_id = %s""",
                (row["resource_id"], version_id),
            )
            pin_links = cur.fetchall()
            cur.execute(
                """SELECT free_preview FROM course_resource_links
                   WHERE resource_id = %s""",
                (row["resource_id"],),
            )
            any_links = cur.fetchall()

    free = False
    allowed = is_admin
    if is_published_cut:
        free = any(bool(L["free_preview"]) for L in any_links)
        allowed = True  # listed material; access gated below
    elif pin_links:
        free = any(bool(L["free_preview"]) for L in pin_links)
        allowed = True
    elif not is_admin:
        raise HTTPException(status_code=404, detail="Resource not found")

    if not allowed:
        raise HTTPException(status_code=404, detail="Resource not found")

    if not free and not is_admin and not auth.role_at_least(claims["role"], "alumni"):
        raise HTTPException(
            status_code=403, detail="Membership required to download resources"
        )

    return _serve_file_or_link(title=row["title"], kind=row["kind"], url=row["url"] or "")


@router.get("/api/attachments/{attachment_id}/download")
def download_attachment(attachment_id: int, request: Request):
    """Legacy attachment download (Resource Library v1.x) until R6 cutover."""
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
    if not row["free_preview"] and not auth.role_at_least(claims["role"], "alumni"):
        if claims.get("role") != "administrator":
            raise HTTPException(
                status_code=403, detail="Membership required to download resources"
            )
    return _serve_file_or_link(
        title=row["title"], kind=row["kind"], url=row["url"] or ""
    )
