"""Admin API — first-class Resources (Resource Spec v1.0 / R2)."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

import db
import resources_domain as rd
from guards import require_admin
from repo import course_id_by_slug

router = APIRouter(prefix="/api/admin", tags=["admin-resources"])


def _http_err(exc: rd.ResourceError) -> HTTPException:
    if exc.code == "NAME_CONFLICT":
        status = 409
    elif exc.code in (
        "NOT_FOUND",
        "VERSION_NOT_FOUND",
        "COURSE_NOT_FOUND",
        "LINK_NOT_FOUND",
        "NO_VERSIONS",
    ):
        status = 404
    else:
        status = 422
    return HTTPException(
        status_code=status,
        detail={
            "message": str(exc),
            "code": exc.code,
            "field": "title" if exc.code == "NAME_CONFLICT" else None,
        },
    )


@router.get("/resources")
def admin_list_resources(request: Request) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT r.id, r.slug, r.title, r.description_md, r.type, r.category_slug,
                          r.emoji, r.published_version_id, r.created_at, r.updated_at,
                          v.version AS published_version
                   FROM resources r
                   LEFT JOIN resource_versions v ON v.id = r.published_version_id
                   ORDER BY r.title"""
            )
            rows = cur.fetchall()
            rids = [r["id"] for r in rows]
            courses_by: dict[int, list] = {}
            if rids:
                ph = ",".join(["%s"] * len(rids))
                cur.execute(
                    f"""SELECT l.resource_id, c.slug, c.title, l.pinned_version_id, pv.version AS pin_version
                        FROM course_resource_links l
                        JOIN courses c ON c.id = l.course_id
                        JOIN resource_versions pv ON pv.id = l.pinned_version_id
                        WHERE l.resource_id IN ({ph})""",
                    rids,
                )
                for L in cur.fetchall():
                    courses_by.setdefault(L["resource_id"], []).append(
                        {
                            "slug": L["slug"],
                            "title": L["title"],
                            "pinned_version": L["pin_version"],
                        }
                    )
    return {
        "resources": [
            {
                **{k: r[k] for k in r if k != "published_version_id"},
                "published": r["published_version_id"] is not None,
                "published_version": r.get("published_version"),
                "courses": courses_by.get(r["id"], []),
            }
            for r in rows
        ]
    }


@router.post("/resources")
async def admin_create_resource(request: Request) -> dict:
    require_admin(request)
    body = await request.json()
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                out = rd.create_resource(
                    cur,
                    title=body.get("title") or "",
                    description_md=body.get("description_md") or "",
                    type=body.get("type") or "other",
                    category_slug=body.get("category_slug") or "",
                    kind=body.get("kind") or "link",
                    url=body.get("url") or "",
                    slug=body.get("slug"),
                    emoji=body.get("emoji"),
                    publish=bool(body.get("publish")),
                    changelog_md=body.get("changelog_md"),
                )
        return out
    except rd.ResourceError as exc:
        raise _http_err(exc) from exc


@router.get("/resources/{slug}")
def admin_get_resource(slug: str, request: Request) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, slug, title, description_md, type, category_slug, emoji,
                          published_version_id, created_at, updated_at
                   FROM resources WHERE slug = %s""",
                (slug,),
            )
            res = cur.fetchone()
            if not res:
                raise HTTPException(status_code=404, detail="Resource not found")
            versions = rd.list_versions(cur, res["id"])
            pub_ver = None
            if res["published_version_id"]:
                for v in versions:
                    if v["id"] == res["published_version_id"]:
                        pub_ver = v["version"]
            cur.execute(
                """SELECT l.id AS link_id, l.free_preview, l.sort_order, l.lesson_id,
                          c.slug AS course_slug, c.title AS course_title,
                          v.version AS pinned_version
                   FROM course_resource_links l
                   JOIN courses c ON c.id = l.course_id
                   JOIN resource_versions v ON v.id = l.pinned_version_id
                   WHERE l.resource_id = %s""",
                (res["id"],),
            )
            links = cur.fetchall()
    return {
        **res,
        "published": res["published_version_id"] is not None,
        "published_version": pub_ver,
        "versions": versions,
        "course_links": links,
    }


@router.patch("/resources/{slug}")
async def admin_patch_resource(slug: str, request: Request) -> dict:
    """Update head metadata only (not version payload)."""
    require_admin(request)
    body = await request.json()
    allow = {
        "title",
        "description_md",
        "type",
        "category_slug",
        "emoji",
    }
    unknown = set(body) - allow
    if unknown:
        raise HTTPException(status_code=422, detail=f"Unknown fields: {sorted(unknown)}")
    if not body:
        raise HTTPException(status_code=422, detail="Empty update")
    if "type" in body:
        try:
            body["type"] = (body["type"] or "").strip().lower()
            if body["type"] not in rd.VALID_TYPES:
                raise rd.ResourceError("bad type", code="BAD_TYPE")
        except rd.ResourceError as exc:
            raise _http_err(exc) from exc

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, slug, title FROM resources WHERE slug = %s", (slug,)
            )
            existing = cur.fetchone()
            if not existing:
                raise HTTPException(status_code=404, detail="Resource not found")

            # Name and /resource/{slug} stay in lockstep. Conflicts fail the save.
            if "title" in body:
                title = (str(body["title"]) or "").strip() or "Resource"
                body["title"] = title
                try:
                    body["slug"] = rd.claim_slug(
                        cur, title, exclude_id=int(existing["id"])
                    )
                except rd.ResourceError as exc:
                    raise _http_err(exc) from exc

            sets = ", ".join(f"{k} = %s" for k in body)
            cur.execute(
                f"UPDATE resources SET {sets} WHERE id = %s",
                [*body.values(), existing["id"]],
            )
            cur.execute(
                "SELECT slug, title FROM resources WHERE id = %s",
                (existing["id"],),
            )
            row = cur.fetchone()
    return {
        "ok": True,
        "updated": sorted(body),
        "slug": row["slug"],
        "title": row["title"],
    }


@router.post("/resources/{slug}/versions")
async def admin_add_version(slug: str, request: Request) -> dict:
    require_admin(request)
    body = await request.json()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM resources WHERE slug = %s", (slug,))
            res = cur.fetchone()
            if not res:
                raise HTTPException(status_code=404, detail="Resource not found")
            try:
                out = rd.add_version(
                    cur,
                    res["id"],
                    kind=body.get("kind") or "link",
                    url=body.get("url") or "",
                    changelog_md=body.get("changelog_md"),
                    description_md=body.get("description_md"),
                    title_override=body.get("title_override"),
                    publish=bool(body.get("publish")),
                    content_type=body.get("content_type"),
                    byte_size=body.get("byte_size"),
                )
            except rd.ResourceError as exc:
                raise _http_err(exc) from exc
    return out


@router.post("/resources/{slug}/publish")
async def admin_publish(slug: str, request: Request) -> dict:
    """Body: { \"version\": N } to publish, or { \"version\": null } to unpublish."""
    require_admin(request)
    body = await request.json() if int(request.headers.get("content-length") or 0) else {}
    version = body.get("version", ...)
    if version is ...:
        raise HTTPException(
            status_code=422, detail="version required (int or null to unpublish)"
        )
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM resources WHERE slug = %s", (slug,))
            res = cur.fetchone()
            if not res:
                raise HTTPException(status_code=404, detail="Resource not found")
            try:
                if version is None:
                    out = rd.unpublish(cur, res["id"])
                else:
                    out = rd.publish_version(cur, res["id"], int(version))
            except (rd.ResourceError, TypeError, ValueError) as exc:
                if isinstance(exc, rd.ResourceError):
                    raise _http_err(exc) from exc
                raise HTTPException(status_code=422, detail="version must be int or null") from exc
    return out


@router.post("/courses/{course_slug}/resources")
async def admin_attach_resource(course_slug: str, request: Request) -> dict:
    """Attach existing resource: { resource_slug, pinned_version?, free_preview?, lesson_id? }."""
    require_admin(request)
    body = await request.json()
    resource_slug = (body.get("resource_slug") or body.get("slug") or "").strip()
    if not resource_slug:
        raise HTTPException(status_code=422, detail="resource_slug required")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cid = course_id_by_slug(cur, course_slug)
            cur.execute("SELECT id FROM resources WHERE slug = %s", (resource_slug,))
            res = cur.fetchone()
            if not res:
                raise HTTPException(status_code=404, detail="Resource not found")
            pin = body.get("pinned_version")
            try:
                out = rd.attach_to_course(
                    cur,
                    course_id=cid,
                    resource_id=res["id"],
                    pinned_version=int(pin) if pin is not None else None,
                    free_preview=bool(body.get("free_preview")),
                    lesson_id=int(body.get("lesson_id") or 0),
                    sort_order=int(body.get("sort_order") or 0),
                )
            except rd.ResourceError as exc:
                raise _http_err(exc) from exc
            out["resource_slug"] = resource_slug
            out["course_slug"] = course_slug
    return out


@router.patch("/courses/{course_slug}/resources/{resource_slug}")
async def admin_patch_course_resource(
    course_slug: str, resource_slug: str, request: Request
) -> dict:
    """Update pin / free_preview / sort_order on a course link."""
    require_admin(request)
    body = await request.json()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cid = course_id_by_slug(cur, course_slug)
            cur.execute("SELECT id FROM resources WHERE slug = %s", (resource_slug,))
            res = cur.fetchone()
            if not res:
                raise HTTPException(status_code=404, detail="Resource not found")
            rid = res["id"]
            lid = int(body.get("lesson_id") or 0)
            if "pinned_version" in body:
                try:
                    rd.set_pin(
                        cur,
                        course_id=cid,
                        resource_id=rid,
                        version=int(body["pinned_version"]),
                        lesson_id=lid,
                    )
                except (rd.ResourceError, TypeError, ValueError) as exc:
                    if isinstance(exc, rd.ResourceError):
                        raise _http_err(exc) from exc
                    raise HTTPException(status_code=422, detail="bad pinned_version") from exc
            updates = {}
            if "free_preview" in body:
                updates["free_preview"] = 1 if body["free_preview"] else 0
            if "sort_order" in body:
                updates["sort_order"] = int(body["sort_order"])
            if updates:
                sets = ", ".join(f"{k} = %s" for k in updates)
                cur.execute(
                    f"""UPDATE course_resource_links SET {sets}
                       WHERE course_id = %s AND resource_id = %s AND lesson_id = %s""",
                    [*updates.values(), cid, rid, lid],
                )
                if cur.rowcount == 0:
                    raise HTTPException(status_code=404, detail="Link not found")
    return {"ok": True, "course_slug": course_slug, "resource_slug": resource_slug}


@router.delete("/courses/{course_slug}/resources/{resource_slug}")
def admin_unlink_resource(
    course_slug: str, resource_slug: str, request: Request, lesson_id: int = 0
) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cid = course_id_by_slug(cur, course_slug)
            cur.execute("SELECT id FROM resources WHERE slug = %s", (resource_slug,))
            res = cur.fetchone()
            if not res:
                raise HTTPException(status_code=404, detail="Resource not found")
            try:
                rd.unlink_from_course(
                    cur,
                    course_id=cid,
                    resource_id=res["id"],
                    lesson_id=lesson_id,
                )
            except rd.ResourceError as exc:
                raise _http_err(exc) from exc
    return {"ok": True, "unlinked": resource_slug}


@router.get("/courses/{course_slug}/resources")
def admin_list_course_resources(course_slug: str, request: Request) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cid = course_id_by_slug(cur, course_slug)
            cur.execute(
                """SELECT r.slug, r.title, r.type, r.emoji, r.published_version_id,
                          v.version AS pinned_version, v.id AS pinned_version_id,
                          v.kind, l.free_preview, l.sort_order, l.lesson_id, l.id AS link_id,
                          pv.version AS published_version
                   FROM course_resource_links l
                   JOIN resources r ON r.id = l.resource_id
                   JOIN resource_versions v ON v.id = l.pinned_version_id
                   LEFT JOIN resource_versions pv ON pv.id = r.published_version_id
                   WHERE l.course_id = %s
                   ORDER BY l.sort_order, r.title""",
                (cid,),
            )
            rows = cur.fetchall()
    return {
        "course_slug": course_slug,
        "resources": [
            {
                "slug": r["slug"],
                "title": r["title"],
                "type": r["type"],
                "emoji": r["emoji"],
                "pinned_version": r["pinned_version"],
                "pinned_version_id": r["pinned_version_id"],
                "kind": r["kind"],
                "free_preview": bool(r["free_preview"]),
                "sort_order": r["sort_order"],
                "lesson_id": r["lesson_id"] or 0,
                "link_id": r["link_id"],
                "library_published": r["published_version_id"] is not None,
                "published_version": r["published_version"],
                "download_path": f"/api/resource-versions/{r['pinned_version_id']}/download",
            }
            for r in rows
        ],
    }
