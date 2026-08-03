"""Admin API — in-place editing endpoints (role: administrator).

Field allowlists per entity; anything outside them is a 422. Video params are
validated against the provider allowlist BEFORE persisting, so a bad config can
never reach the player.
"""

import hashlib
import json
import re
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request, UploadFile

import auth
import db
import video
from guards import require_admin
from repo import course_id_by_slug
from config import get_config

router = APIRouter(prefix="/api/admin", tags=["admin"])

COURSE_FIELDS = frozenset(
    {
        "title",
        "subtitle",
        "description_md",
        "short_description",
        "level",
        "status",
        "trailer_video_id",
        "hero_image_url",
        "card_color",
        "catalog_section",
        "flagship",
        "pathway_position",
        "audience_category",
        "estimated_duration_minutes",
        "learning_outcomes",  # JSON array via PUT
        "certification_enabled",
    }
)
VALID_AUDIENCE = frozenset({"public", "members", "coaching"})
UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"
MEDIA_TYPES = {"image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp"}
MEDIA_MAX_BYTES = 5 * 1024 * 1024
PRIVATE_TYPES = {
    **MEDIA_TYPES,
    "application/pdf": ".pdf",
    "application/zip": ".zip",
    "text/csv": ".csv",
    "text/plain": ".txt",
    "text/markdown": ".md",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
}
PRIVATE_MAX_BYTES = 25 * 1024 * 1024
MODULE_FIELDS = frozenset({"title", "kind", "description_md"})
VALID_MODULE_KINDS = frozenset({"standard", "worksheets", "resources", "bonus"})
LESSON_FIELDS = frozenset(
    {"title", "video_id", "video_params", "video_provider", "free_preview",
     "duration_seconds", "body_md", "kind"}
)
VALID_LESSON_KINDS = frozenset({"video", "text", "download", "external", "replay", "quiz"})
VALID_LEVELS = frozenset({"beginner", "intermediate", "advanced"})
VALID_STATUS = frozenset({"draft", "published", "archived"})

_YT_URL = re.compile(
    r"(?:youtube(?:-nocookie)?\.com/(?:watch\?.*?v=|embed/|shorts/)|youtu\.be/)([\w-]{11})"
)


def normalize_video_id(raw: str | None, provider: str = "youtube") -> str | None:
    """Normalize video id for youtube (URL/id) or bunny (Stream GUID)."""
    try:
        return video.normalize_video_id(provider, raw)
    except video.VideoConfigError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/courses")
def list_admin_courses(request: Request) -> dict:
    """Catalog for administrators: drafts, published, and archived.

    Public ``GET /api/courses`` stays published-only. Admins need every course
    on /courses so new drafts do not "disappear" after create/save.
    """
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT c.id, c.slug, c.title, c.subtitle, c.description_md,
                          c.hero_image_url, c.card_color, c.level, c.status,
                          c.sort_order, c.catalog_section,
                          c.certification_enabled, c.published_at,
                          (SELECT COUNT(*) FROM enrollments e
                            WHERE e.course_id = c.id) AS enrolled_count,
                          (SELECT COUNT(*) FROM lessons l
                             JOIN modules m ON l.module_id = m.id
                            WHERE m.course_id = c.id) AS lesson_count,
                          (SELECT COALESCE(SUM(l.duration_seconds), 0)
                             FROM lessons l JOIN modules m ON l.module_id = m.id
                            WHERE m.course_id = c.id) AS total_duration_seconds,
                          (SELECT COUNT(*) FROM reviews r
                            WHERE r.course_id = c.id
                              AND r.status = 'visible') AS review_count,
                          (SELECT ROUND(AVG(r.rating), 1) FROM reviews r
                            WHERE r.course_id = c.id AND r.status = 'visible'
                           HAVING COUNT(*) >= 3) AS avg_rating
                   FROM courses c
                   ORDER BY c.sort_order ASC,
                     COALESCE(c.published_at, c.created_at) DESC"""
            )
            rows = cur.fetchall()
            ids = [r["id"] for r in rows]
            cats: dict[int, list[dict]] = {}
            instructors: dict[int, list[dict]] = {}
            if ids:
                placeholders = ",".join(["%s"] * len(ids))
                cur.execute(
                    f"""SELECT cc.course_id, cat.slug, cat.name
                        FROM course_categories cc
                        JOIN categories cat ON cc.category_id = cat.id
                        WHERE cc.course_id IN ({placeholders})""",
                    ids,
                )
                for row in cur.fetchall():
                    cats.setdefault(row["course_id"], []).append(
                        {"slug": row["slug"], "name": row["name"]}
                    )
                cur.execute(
                    f"""SELECT ci.course_id, i.name, i.avatar_url
                        FROM course_instructors ci
                        JOIN instructors i ON ci.instructor_id = i.id
                        WHERE ci.course_id IN ({placeholders})
                        ORDER BY ci.sort_order""",
                    ids,
                )
                for row in cur.fetchall():
                    instructors.setdefault(row["course_id"], []).append(
                        {"name": row["name"], "avatar_url": row["avatar_url"]}
                    )

    courses = []
    for r in rows:
        courses.append(
            {
                "id": r["id"],
                "slug": r["slug"],
                "title": r["title"],
                "subtitle": r["subtitle"],
                "description_md": r["description_md"],
                "hero_image_url": r["hero_image_url"],
                "card_color": r["card_color"],
                "sort_order": r["sort_order"],
                "catalog_section": r["catalog_section"] or "",
                "level": r["level"],
                "status": r["status"],
                "certification_enabled": bool(r["certification_enabled"]),
                "published_at": (
                    r["published_at"].isoformat() if r["published_at"] else None
                ),
                "enrolled_count": r["enrolled_count"],
                "lesson_count": r["lesson_count"],
                "total_duration_seconds": r["total_duration_seconds"],
                "review_count": r["review_count"],
                "avg_rating": (
                    float(r["avg_rating"]) if r["avg_rating"] is not None else None
                ),
                "categories": cats.get(r["id"], []),
                "instructors": instructors.get(r["id"], []),
            }
        )
    return {"courses": courses}


@router.get("/courses/{slug}")
def admin_course(slug: str, request: Request) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, slug, title, subtitle, description_md, short_description,
                          level, status, trailer_video_id, hero_image_url, card_color,
                          certification_enabled, flagship, pathway_position,
                          audience_category, estimated_duration_minutes,
                          learning_outcomes_json, model_instance_version
                   FROM courses WHERE slug = %s""",
                (slug,),
            )
            course = cur.fetchone()
            if course is None:
                raise HTTPException(status_code=404, detail="Course not found")
            cur.execute(
                """SELECT m.id AS module_id, m.slug AS module_slug, m.title AS module_title,
                          m.kind, m.description_md AS module_description_md,
                          l.id, l.slug, l.title, l.kind AS lesson_kind,
                          l.duration_seconds, l.free_preview,
                          l.video_provider, l.video_id, l.video_params
                   FROM modules m
                   LEFT JOIN lessons l ON l.module_id = m.id
                   WHERE m.course_id = %s
                   ORDER BY m.sort_order, l.sort_order""",
                (course["id"],),
            )
            rows = cur.fetchall()

    modules: list[dict] = []
    for r in rows:
        if not modules or modules[-1]["module_id"] != r["module_id"]:
            modules.append(
                {
                    "module_id": r["module_id"],
                    "slug": r["module_slug"],
                    "title": r["module_title"],
                    "kind": r["kind"],
                    "description_md": r.get("module_description_md") or "",
                    "lessons": [],
                }
            )
        if r["id"] is not None:
            params = r["video_params"]
            if isinstance(params, (str, bytes)):
                params = json.loads(params)
            modules[-1]["lessons"].append(
                {
                    "id": r["id"], "slug": r["slug"], "title": r["title"],
                    "kind": r["lesson_kind"],
                    "duration_seconds": r["duration_seconds"],
                    "free_preview": bool(r["free_preview"]),
                    "video_provider": r["video_provider"],
                    "video_id": r["video_id"],
                    "video_params": params or {},
                }
            )
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT cat.slug, cat.name FROM course_categories cc
                   JOIN categories cat ON cc.category_id = cat.id
                   WHERE cc.course_id = %s""",
                (course["id"],),
            )
            cats = cur.fetchall()
            cur.execute(
                """SELECT i.id, i.name, i.bio_md FROM course_instructors ci
                   JOIN instructors i ON ci.instructor_id = i.id
                   WHERE ci.course_id = %s ORDER BY ci.sort_order""",
                (course["id"],),
            )
            instructors = cur.fetchall()
            cur.execute(
                """SELECT id, title, kind, url, free_preview FROM attachments
                   WHERE owner_type = 'course' AND owner_id = %s""",
                (course["id"],),
            )
            attachments = cur.fetchall()
    # Normalize JSON / bools for admin UI
    outcomes = course.get("learning_outcomes_json")
    if isinstance(outcomes, (str, bytes)):
        try:
            outcomes = json.loads(outcomes)
        except (json.JSONDecodeError, TypeError):
            outcomes = []
    elif outcomes is None:
        outcomes = []
    course_out = {
        **course,
        "flagship": bool(course.get("flagship")),
        "certification_enabled": bool(course.get("certification_enabled")),
        "learning_outcomes": outcomes if isinstance(outcomes, list) else [],
        "short_description": course.get("short_description") or "",
        "audience_category": course.get("audience_category") or "members",
    }
    course_out.pop("learning_outcomes_json", None)
    return {
        **course_out,
        "modules": modules,
        "categories": cats,
        "instructors": instructors,
        "attachments": attachments,
    }


@router.put("/courses/{slug}")
async def update_course(slug: str, request: Request) -> dict:
    require_admin(request)
    body = await request.json()
    unknown = set(body) - COURSE_FIELDS
    if unknown:
        raise HTTPException(status_code=422, detail=f"Unknown fields: {sorted(unknown)}")
    if not body:
        raise HTTPException(status_code=422, detail="Empty update")
    if "trailer_video_id" in body:
        # Trailers stay YouTube (marketing / public course page)
        body["trailer_video_id"] = normalize_video_id(
            body["trailer_video_id"], "youtube"
        )
    if "level" in body and body["level"] not in VALID_LEVELS:
        raise HTTPException(status_code=422, detail=f"level must be one of {sorted(VALID_LEVELS)}")
    if "status" in body and body["status"] not in VALID_STATUS:
        raise HTTPException(status_code=422, detail=f"status must be one of {sorted(VALID_STATUS)}")
    if "audience_category" in body and body["audience_category"] not in VALID_AUDIENCE:
        raise HTTPException(
            status_code=422,
            detail=f"audience_category must be one of {sorted(VALID_AUDIENCE)}",
        )
    # Coerce types from admin UI (often stringified via dirty map)
    if "flagship" in body:
        v = body["flagship"]
        body["flagship"] = 1 if v in (True, 1, "1", "true", "True", "yes") else 0
    if "certification_enabled" in body:
        v = body["certification_enabled"]
        body["certification_enabled"] = (
            1 if v in (True, 1, "1", "true", "True", "yes") else 0
        )
    if "pathway_position" in body:
        v = body["pathway_position"]
        if v in (None, "", "null", "None"):
            body["pathway_position"] = None
        else:
            try:
                body["pathway_position"] = int(v)
            except (TypeError, ValueError) as exc:
                raise HTTPException(
                    status_code=422, detail="pathway_position must be an integer or empty"
                ) from exc
    if "estimated_duration_minutes" in body:
        v = body["estimated_duration_minutes"]
        if v in (None, "", "null", "None"):
            body["estimated_duration_minutes"] = None
        else:
            try:
                body["estimated_duration_minutes"] = int(v)
            except (TypeError, ValueError) as exc:
                raise HTTPException(
                    status_code=422,
                    detail="estimated_duration_minutes must be an integer or empty",
                ) from exc
    if "learning_outcomes" in body:
        lo = body.pop("learning_outcomes")
        if isinstance(lo, str):
            # one outcome per line from UI
            lines = [ln.strip() for ln in lo.splitlines() if ln.strip()]
            body["learning_outcomes_json"] = json.dumps(lines) if lines else None
        elif isinstance(lo, list):
            body["learning_outcomes_json"] = json.dumps(lo) if lo else None
        elif lo is None:
            body["learning_outcomes_json"] = None
        else:
            raise HTTPException(status_code=422, detail="learning_outcomes must be list or text")

    publish_touch = (
        ", published_at = COALESCE(published_at, NOW())"
        if body.get("status") == "published"
        else ""
    )
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, title, slug FROM courses WHERE slug = %s", (slug,)
            )
            existing = cur.fetchone()
            if existing is None:
                raise HTTPException(status_code=404, detail="Course not found")

            # Name and public URL stay in lockstep: title change rewrites slug.
            # Conflicts fail the save (no silent -2 suffix) so the editor can highlight.
            if "title" in body:
                title = (str(body["title"]) or "").strip() or "New Course"
                body["title"] = title
                body["slug"] = _claim_course_slug(
                    cur, _slugify(title), exclude_slug=slug
                )

            sets = ", ".join(f"{f} = %s" for f in body)
            cur.execute(
                f"UPDATE courses SET {sets}{publish_touch} WHERE slug = %s",
                [*body.values(), slug],
            )
            cur.execute(
                "SELECT slug, title FROM courses WHERE id = %s", (existing["id"],)
            )
            row = cur.fetchone()
    return {
        "ok": True,
        "updated": sorted(body),
        "id": int(existing["id"]),
        "slug": row["slug"],
        "title": row["title"],
    }


def _slugify(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return slug or "item"


# Static first path segments under /course that must never be course slugs.
_RESERVED_COURSE_SLUGS = frozenset({"category"})


def _name_conflict(message: str, *, slug: str) -> HTTPException:
    return HTTPException(
        status_code=409,
        detail={
            "code": "NAME_CONFLICT",
            "message": message,
            "field": "title",
            "slug": slug,
        },
    )


def _claim_course_slug(
    cur, base: str, *, exclude_slug: str | None = None
) -> str:
    """Exact course slug from title, or 409 if URL would not be unique."""
    slug = base or "course"
    if exclude_slug and slug == exclude_slug:
        return slug
    if slug in _RESERVED_COURSE_SLUGS:
        raise _name_conflict(
            f"“{slug}” is reserved for the site structure. Choose a different name.",
            slug=slug,
        )
    cur.execute("SELECT title FROM courses WHERE slug = %s", (slug,))
    row = cur.fetchone()
    if row is not None:
        raise _name_conflict(
            f"Another course already uses the URL /course/{slug} "
            f"(“{row['title']}”). Choose a different name.",
            slug=slug,
        )
    return slug


def _unique_course_slug(
    cur, base: str, *, exclude_slug: str | None = None
) -> str:
    """Allocate free course slug with -2, -3… (create defaults only)."""
    slug = base or "course"
    n = 2
    while True:
        if exclude_slug and slug == exclude_slug:
            return slug
        if slug not in _RESERVED_COURSE_SLUGS:
            cur.execute("SELECT 1 FROM courses WHERE slug = %s", (slug,))
            if cur.fetchone() is None:
                return slug
        slug = f"{base}-{n}"
        n += 1


def _course_id_for_module(cur, module_id: int) -> int:
    cur.execute("SELECT course_id FROM modules WHERE id = %s", (module_id,))
    row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Module not found")
    return int(row["course_id"])


def _claim_module_slug(
    cur, course_id: int, base: str, *, exclude_id: int | None = None
) -> str:
    """Exact module slug unique within the course, or 409."""
    slug = base or "module"
    cur.execute(
        """SELECT m.id, m.title, c.slug AS course_slug
           FROM modules m
           JOIN courses c ON c.id = m.course_id
           WHERE m.course_id = %s AND m.slug = %s""",
        (course_id, slug),
    )
    row = cur.fetchone()
    if row is not None and (
        exclude_id is None or int(row["id"]) != int(exclude_id)
    ):
        raise _name_conflict(
            f"Another module already uses the URL segment “{slug}” under "
            f"/course/{row['course_slug']}/… (“{row['title']}”). "
            f"Choose a different name.",
            slug=slug,
        )
    return slug


def _unique_module_slug(
    cur, course_id: int, base: str, *, exclude_id: int | None = None
) -> str:
    """Allocate free module slug within the course (-2, -3… for create defaults)."""
    slug = base or "module"
    n = 2
    while True:
        cur.execute(
            "SELECT id FROM modules WHERE course_id = %s AND slug = %s",
            (course_id, slug),
        )
        row = cur.fetchone()
        if row is None or (
            exclude_id is not None and int(row["id"]) == int(exclude_id)
        ):
            return slug
        slug = f"{base}-{n}"
        n += 1


def _claim_lesson_slug(
    cur,
    module_id: int,
    base: str,
    *,
    exclude_id: int | None = None,
) -> str:
    """Exact lesson slug unique within the module. Full public path is
    /course/{course}/{module}/{lesson} — uniqueness of the combination."""
    slug = base or "lesson"
    cur.execute(
        """SELECT l.id, l.title, m.slug AS module_slug, c.slug AS course_slug
           FROM lessons l
           JOIN modules m ON l.module_id = m.id
           JOIN courses c ON m.course_id = c.id
           WHERE l.module_id = %s AND l.slug = %s""",
        (module_id, slug),
    )
    row = cur.fetchone()
    if row is not None and (
        exclude_id is None or int(row["id"]) != int(exclude_id)
    ):
        raise _name_conflict(
            f"Another lesson already uses "
            f"/course/{row['course_slug']}/{row['module_slug']}/{slug} "
            f"(“{row['title']}”). Choose a different name.",
            slug=slug,
        )
    return slug


def _unique_lesson_slug(
    cur, module_id: int, base: str, *, exclude_id: int | None = None
) -> str:
    """Allocate free lesson slug within the module (-2, -3… for create defaults)."""
    slug = base or "lesson"
    n = 2
    while True:
        cur.execute(
            "SELECT id FROM lessons WHERE module_id = %s AND slug = %s",
            (module_id, slug),
        )
        row = cur.fetchone()
        if row is None or (
            exclude_id is not None and int(row["id"]) == int(exclude_id)
        ):
            return slug
        slug = f"{base}-{n}"
        n += 1


@router.put("/lessons/{lesson_id}")
async def update_lesson(lesson_id: int, request: Request) -> dict:
    claims = require_admin(request)
    body = await request.json()
    unknown = set(body) - LESSON_FIELDS
    if unknown:
        raise HTTPException(status_code=422, detail=f"Unknown fields: {sorted(unknown)}")
    if not body:
        raise HTTPException(status_code=422, detail="Empty update")

    if "kind" in body and body["kind"] not in VALID_LESSON_KINDS:
        raise HTTPException(status_code=422, detail=f"kind must be one of {sorted(VALID_LESSON_KINDS)}")
    if "video_provider" in body:
        prov = (body["video_provider"] or "youtube").strip().lower()
        if prov not in video.VALID_PROVIDERS:
            raise HTTPException(
                status_code=422,
                detail=f"video_provider must be one of {sorted(video.VALID_PROVIDERS)}",
            )
        body["video_provider"] = prov
    # Resolve provider for id/params validation (body may only patch video_id)
    provider_for_val = body.get("video_provider")
    if provider_for_val is None and ("video_id" in body or "video_params" in body):
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT video_provider FROM lessons WHERE id = %s", (lesson_id,)
                )
                row = cur.fetchone()
                provider_for_val = (row or {}).get("video_provider") or "youtube"
    provider_for_val = (provider_for_val or "youtube").strip().lower()
    if "video_id" in body:
        body["video_id"] = normalize_video_id(body["video_id"], provider_for_val)
    if "video_params" in body:
        try:
            params = video.parse_params(body["video_params"])
            if params:
                # Validate by building embed (raises on bad params / missing bunny cfg)
                vid = body.get("video_id")
                if not vid:
                    with db.transaction() as conn:
                        with conn.cursor() as cur:
                            cur.execute(
                                "SELECT video_id FROM lessons WHERE id = %s",
                                (lesson_id,),
                            )
                            r = cur.fetchone()
                            vid = (r or {}).get("video_id")
                if vid:
                    video.embed_config(provider_for_val, vid, params)
            body["video_params"] = json.dumps(params) if params else None
        except video.VideoConfigError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
    free_preview_flip = None
    if "free_preview" in body:
        body["free_preview"] = 1 if body["free_preview"] else 0
        free_preview_flip = bool(body["free_preview"])
    if "duration_seconds" in body:
        body["duration_seconds"] = int(body["duration_seconds"])

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT l.id, l.slug, l.title, l.module_id,
                          m.course_id, c.status AS course_status, c.slug AS course_slug
                   FROM lessons l
                   JOIN modules m ON l.module_id = m.id
                   JOIN courses c ON m.course_id = c.id
                   WHERE l.id = %s""",
                (lesson_id,),
            )
            existing = cur.fetchone()
            if existing is None:
                raise HTTPException(status_code=404, detail="Lesson not found")

            # Name ↔ URL segment lockstep. Full path unique via (module, lesson).
            if "title" in body:
                title = (str(body["title"]) or "").strip() or "New Lesson"
                body["title"] = title
                body["slug"] = _claim_lesson_slug(
                    cur,
                    int(existing["module_id"]),
                    _slugify(title),
                    exclude_id=lesson_id,
                )

            sets = ", ".join(f"{f} = %s" for f in body)
            cur.execute(
                f"UPDATE lessons SET {sets} WHERE id = %s",
                [*body.values(), lesson_id],
            )
            if free_preview_flip is not None:
                from access_control.dual_write import dual_write_lesson_free_preview

                actor_id = int(claims["identity_id"]) if claims.get("identity_id") else None
                dual_write_lesson_free_preview(
                    cur, lesson_id, free_preview_flip, actor_id=actor_id
                )
            cur.execute(
                """SELECT l.slug, l.title, m.slug AS module_slug, c.slug AS course_slug
                   FROM lessons l
                   JOIN modules m ON l.module_id = m.id
                   JOIN courses c ON m.course_id = c.id
                   WHERE l.id = %s""",
                (lesson_id,),
            )
            row = cur.fetchone()
    return {
        "ok": True,
        "updated": sorted(body),
        "slug": row["slug"],
        "title": row["title"],
        "module_slug": row["module_slug"],
        "course_slug": row["course_slug"],
        "id": lesson_id,
    }


@router.put("/modules/{module_id}")
async def update_module(module_id: int, request: Request) -> dict:
    require_admin(request)
    body = await request.json()
    unknown = set(body) - MODULE_FIELDS
    if unknown:
        raise HTTPException(status_code=422, detail=f"Unknown fields: {sorted(unknown)}")
    if not body:
        raise HTTPException(status_code=422, detail="Empty update")
    if "kind" in body and body["kind"] not in VALID_MODULE_KINDS:
        raise HTTPException(status_code=422, detail=f"kind must be one of {sorted(VALID_MODULE_KINDS)}")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT m.id, m.slug, m.course_id, c.slug AS course_slug
                   FROM modules m JOIN courses c ON c.id = m.course_id
                   WHERE m.id = %s""",
                (module_id,),
            )
            existing = cur.fetchone()
            if existing is None:
                raise HTTPException(status_code=404, detail="Module not found")
            if "title" in body:
                title = (str(body["title"]) or "").strip() or "New Module"
                body["title"] = title
                body["slug"] = _claim_module_slug(
                    cur,
                    int(existing["course_id"]),
                    _slugify(title),
                    exclude_id=module_id,
                )
            sets = ", ".join(f"{f} = %s" for f in body)
            cur.execute(
                f"UPDATE modules SET {sets} WHERE id = %s",
                [*body.values(), module_id],
            )
            cur.execute(
                "SELECT slug, title FROM modules WHERE id = %s", (module_id,)
            )
            row = cur.fetchone()
    return {
        "ok": True,
        "updated": sorted(body),
        "id": module_id,
        "slug": row["slug"],
        "title": row["title"],
        "course_slug": existing["course_slug"],
        "module_id": module_id,
    }


@router.post("/courses/{slug}/modules")
async def create_module(slug: str, request: Request) -> dict:
    require_admin(request)
    body = await request.json() if int(request.headers.get("content-length") or 0) else {}
    title = (body.get("title") or "New Module").strip() or "New Module"
    kind = body.get("kind") or "standard"
    if kind not in VALID_MODULE_KINDS:
        raise HTTPException(status_code=422, detail=f"kind must be one of {sorted(VALID_MODULE_KINDS)}")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            course = {"id": course_id_by_slug(cur, slug)}
            mod_slug = _unique_module_slug(cur, course["id"], _slugify(title))
            cur.execute(
                "SELECT COALESCE(MAX(sort_order), -1) + 1 AS nxt FROM modules WHERE course_id = %s",
                (course["id"],),
            )
            nxt = cur.fetchone()["nxt"]
            cur.execute(
                """INSERT INTO modules (course_id, title, slug, sort_order, kind)
                   VALUES (%s, %s, %s, %s, %s)""",
                (course["id"], title, mod_slug, nxt, kind),
            )
            module_id = cur.lastrowid
    return {"module_id": module_id, "slug": mod_slug, "title": title}


@router.post("/modules/{module_id}/lessons")
async def create_lesson(module_id: int, request: Request) -> dict:
    require_admin(request)
    body = await request.json() if int(request.headers.get("content-length") or 0) else {}
    title = (body.get("title") or "New Lesson").strip() or "New Lesson"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT m.id, m.slug AS module_slug, c.slug AS course_slug
                   FROM modules m JOIN courses c ON c.id = m.course_id
                   WHERE m.id = %s""",
                (module_id,),
            )
            mod = cur.fetchone()
            if mod is None:
                raise HTTPException(status_code=404, detail="Module not found")
            # Unique within module: full URL is course/module/lesson.
            slug = _unique_lesson_slug(cur, module_id, _slugify(title))
            cur.execute(
                "SELECT COALESCE(MAX(sort_order), -1) + 1 AS nxt FROM lessons WHERE module_id = %s",
                (module_id,),
            )
            nxt = cur.fetchone()["nxt"]
            cur.execute(
                """INSERT INTO lessons (module_id, slug, title, sort_order, kind,
                                        duration_seconds, free_preview)
                   VALUES (%s, %s, %s, %s, 'video', 0, 0)""",
                (module_id, slug, title, nxt),
            )
            lesson_id = cur.lastrowid
    return {
        "id": lesson_id,
        "slug": slug,
        "title": title,
        "module_slug": mod["module_slug"],
        "course_slug": mod["course_slug"],
    }


@router.delete("/modules/{module_id}")
def delete_module(module_id: int, request: Request) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM modules WHERE id = %s", (module_id,))
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Module not found")
    return {"ok": True}


@router.delete("/lessons/{lesson_id}")
def delete_lesson(lesson_id: int, request: Request) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM lessons WHERE id = %s", (lesson_id,))
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Lesson not found")
    return {"ok": True}


# --- v1.3: media, reorder, assignment, course creation ------------------------

@router.post("/media")
async def upload_media(file: UploadFile, request: Request, private: bool = False) -> dict:
    require_admin(request)
    types = PRIVATE_TYPES if private else MEDIA_TYPES
    max_bytes = PRIVATE_MAX_BYTES if private else MEDIA_MAX_BYTES
    ext = types.get(file.content_type or "")
    if ext is None:
        raise HTTPException(status_code=422, detail=f"Unsupported type: {file.content_type}")
    data = await file.read()
    if len(data) > max_bytes:
        raise HTTPException(status_code=422, detail=f"File exceeds {max_bytes // (1024*1024)} MB")
    name = hashlib.sha256(data).hexdigest()[:24] + ext
    if private:
        target = UPLOADS_DIR / "private"
        target.mkdir(parents=True, exist_ok=True)
        (target / name).write_bytes(data)
        return {"url": f"private:{name}", "private": True}
    UPLOADS_DIR.mkdir(exist_ok=True)
    (UPLOADS_DIR / name).write_bytes(data)
    return {"url": f"/api/media/{name}"}


async def _reorder(cur, table: str, parent_col: str, parent_id: int, ids: list) -> None:
    if not isinstance(ids, list) or not all(isinstance(i, int) for i in ids):
        raise HTTPException(status_code=422, detail="ids must be a list of integers")
    cur.execute(f"SELECT id FROM {table} WHERE {parent_col} = %s", (parent_id,))
    existing = {r["id"] for r in cur.fetchall()}
    if set(ids) != existing or len(ids) != len(existing):
        raise HTTPException(status_code=422, detail="ids must match existing children exactly")
    for order, row_id in enumerate(ids):
        cur.execute(f"UPDATE {table} SET sort_order = %s WHERE id = %s", (order, row_id))


@router.post("/courses/reorder")
async def reorder_courses(request: Request) -> dict:
    """Full catalog order: body {course_ids: [...]} — rewrites sort_order x10
    (Catalog-Order Spec v1.0; mirrors module/lesson reorder)."""
    require_admin(request)
    body = await request.json()
    ids = body.get("course_ids")
    if not isinstance(ids, list) or not ids or not all(isinstance(i, int) for i in ids):
        raise HTTPException(status_code=422, detail="course_ids must be a non-empty list of ids")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM courses")
            known = {r["id"] for r in cur.fetchall()}
            unknown = [i for i in ids if i not in known]
            if unknown:
                raise HTTPException(status_code=422, detail=f"Unknown course ids: {unknown}")
            for pos, cid in enumerate(ids, 1):
                cur.execute(
                    "UPDATE courses SET sort_order = %s WHERE id = %s", (pos * 10, cid)
                )
    return {"ok": True, "count": len(ids)}


@router.post("/courses/{slug}/reorder-modules")
async def reorder_modules(slug: str, request: Request) -> dict:
    require_admin(request)
    body = await request.json()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            course = {"id": course_id_by_slug(cur, slug)}
            await _reorder(cur, "modules", "course_id", course["id"], body.get("module_ids"))
    return {"ok": True}


@router.post("/modules/{module_id}/reorder-lessons")
async def reorder_lessons(module_id: int, request: Request) -> dict:
    require_admin(request)
    body = await request.json()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1 FROM modules WHERE id = %s", (module_id,))
            if cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Module not found")
            await _reorder(cur, "lessons", "module_id", module_id, body.get("lesson_ids"))
    return {"ok": True}


@router.get("/categories")
def all_categories(request: Request) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT slug, name FROM categories ORDER BY name")
            return {"categories": cur.fetchall()}


@router.get("/instructors")
def all_instructors(request: Request) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, name FROM instructors ORDER BY name")
            return {"instructors": cur.fetchall()}


@router.put("/courses/{slug}/categories")
async def set_categories(slug: str, request: Request) -> dict:
    require_admin(request)
    body = await request.json()
    slugs = body.get("category_slugs")
    if not isinstance(slugs, list):
        raise HTTPException(status_code=422, detail="category_slugs must be a list")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            course = {"id": course_id_by_slug(cur, slug)}
            cur.execute("DELETE FROM course_categories WHERE course_id = %s", (course["id"],))
            for cat_slug in slugs:
                cur.execute(
                    """INSERT INTO course_categories (course_id, category_id)
                       SELECT %s, id FROM categories WHERE slug = %s""",
                    (course["id"], cat_slug),
                )
    return {"ok": True}


@router.put("/courses/{slug}/instructors")
async def set_instructors(slug: str, request: Request) -> dict:
    require_admin(request)
    body = await request.json()
    ids = body.get("instructor_ids")
    if not isinstance(ids, list) or not all(isinstance(i, int) for i in ids):
        raise HTTPException(status_code=422, detail="instructor_ids must be a list of integers")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            course = {"id": course_id_by_slug(cur, slug)}
            cur.execute("DELETE FROM course_instructors WHERE course_id = %s", (course["id"],))
            for order, iid in enumerate(ids):
                cur.execute(
                    "INSERT INTO course_instructors (course_id, instructor_id, sort_order) "
                    "VALUES (%s, %s, %s)",
                    (course["id"], iid, order),
                )
    return {"ok": True}


@router.post("/courses/{slug}/attachments")
async def create_attachment(slug: str, request: Request) -> dict:
    """R6 cutover: create a first-class Resource + course link (not a raw attachment).

    Response keeps ``id`` as version_id for older clients; also returns resource slug.
    """
    require_admin(request)
    import resources_domain as rd

    body = await request.json()
    title = (body.get("title") or "").strip()
    kind = body.get("kind") or "link"
    url = (body.get("url") or "").strip()
    free = bool(body.get("free_preview"))
    description = (body.get("description_md") or "").strip() or ""
    emoji = (body.get("emoji") or "").strip() or None
    if emoji and len(emoji) > 16:
        raise HTTPException(status_code=422, detail="emoji too long")
    if not title or kind not in ("file", "link") or not url:
        raise HTTPException(status_code=422, detail="title, kind (file|link), url required")
    rtype = "link" if kind == "link" else "document"
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cid = course_id_by_slug(cur, slug)
                created = rd.create_resource(
                    cur,
                    title=title,
                    description_md=description,
                    type=rtype,
                    kind=kind,
                    url=url,
                    emoji=emoji,
                    publish=False,
                )
                link = rd.attach_to_course(
                    cur,
                    course_id=cid,
                    resource_id=created["resource_id"],
                    pinned_version=1,
                    free_preview=free,
                )
                return {
                    "id": created["version_id"],
                    "resource_id": created["resource_id"],
                    "slug": created["slug"],
                    "version_id": created["version_id"],
                    "link_id": link["link_id"],
                    "via": "resource",
                }
    except rd.ResourceError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.put("/attachments/{attachment_id}")
async def update_attachment(attachment_id: int, request: Request) -> dict:
    require_admin(request)
    body = await request.json()
    allowed = {
        k: v for k, v in body.items()
        if k in ("title", "kind", "url", "free_preview", "description_md", "emoji")
    }
    if not allowed:
        raise HTTPException(status_code=422, detail="Nothing to update")
    if "kind" in allowed and allowed["kind"] not in ("file", "link"):
        raise HTTPException(status_code=422, detail="kind must be file|link")
    if "free_preview" in allowed:
        allowed["free_preview"] = 1 if allowed["free_preview"] else 0
    if "description_md" in allowed:
        allowed["description_md"] = (allowed["description_md"] or "").strip() or None
    if "emoji" in allowed:
        allowed["emoji"] = (allowed["emoji"] or "").strip() or None
        if allowed["emoji"] and len(allowed["emoji"]) > 16:
            raise HTTPException(status_code=422, detail="emoji too long")
    sets = ", ".join(f"{f} = %s" for f in allowed)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"UPDATE attachments SET {sets} WHERE id = %s",
                [*allowed.values(), attachment_id],
            )
            cur.execute("SELECT 1 FROM attachments WHERE id = %s", (attachment_id,))
            if cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Attachment not found")
    return {"ok": True}


@router.delete("/attachments/{attachment_id}")
def delete_attachment(attachment_id: int, request: Request) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM attachments WHERE id = %s", (attachment_id,))
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Attachment not found")
    return {"ok": True}


@router.post("/courses")
async def create_course(request: Request) -> dict:
    require_admin(request)
    body = await request.json() if int(request.headers.get("content-length") or 0) else {}
    title = (body.get("title") or "New Course").strip() or "New Course"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            slug = _unique_course_slug(cur, _slugify(title))
            cur.execute(
                """INSERT INTO courses (slug, title, subtitle, description_md, level, status)
                   VALUES (%s, %s, '', '', 'beginner', 'draft')""",
                (slug, title),
            )
            course_id = int(cur.lastrowid)
    return {"id": course_id, "slug": slug, "title": title}


@router.delete("/courses/{slug}")
def delete_course(slug: str, request: Request) -> dict:
    """Course lifecycle (spec v1.4): total deletion incl. non-FK relations
    (attachments + their private files, course-scoped threads)."""
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            course = {"id": course_id_by_slug(cur, slug)}
            course_id = course["id"]

            # Private files referenced by this course's attachments.
            cur.execute(
                """SELECT url FROM attachments
                   WHERE owner_type = 'course' AND owner_id = %s AND kind = 'file'""",
                (course_id,),
            )
            private_files = [
                r["url"].split(":", 1)[1]
                for r in cur.fetchall()
                if (r["url"] or "").startswith("private:")
            ]
            cur.execute(
                "DELETE FROM attachments WHERE owner_type = 'course' AND owner_id = %s",
                (course_id,),
            )
            cur.execute(
                "DELETE FROM threads WHERE scope_type = 'course' AND scope_id = %s",
                (course_id,),
            )
            cur.execute("DELETE FROM courses WHERE id = %s", (course_id,))

    private_dir = UPLOADS_DIR / "private"
    for name in private_files:
        if "/" in name or ".." in name:
            continue
        try:
            (private_dir / name).unlink(missing_ok=True)
        except OSError:
            pass
    return {"ok": True, "deleted": slug}


# --- Media library (Media Library spec v1.0) ----------------------------------

@router.get("/media")
def list_media(request: Request) -> dict:
    """Public-tier uploads, newest first (private-tier files are attachments,
    managed through the resource flows — not listed here)."""
    require_admin(request)
    from datetime import datetime, timezone
    items = []
    if UPLOADS_DIR.is_dir():
        for p in sorted(UPLOADS_DIR.iterdir(),
                        key=lambda x: x.stat().st_mtime, reverse=True):
            if p.is_file():
                items.append({
                    "name": p.name,
                    "url": f"/api/media/{p.name}",
                    "bytes": p.stat().st_size,
                    "modified": datetime.fromtimestamp(
                        p.stat().st_mtime, tz=timezone.utc).isoformat(),
                })
    return {"media": items}


@router.delete("/media/{name}")
def delete_media(name: str, request: Request) -> dict:
    """Delete an upload — refused (409) while anything still references it."""
    require_admin(request)
    if "/" in name or ".." in name or not name:
        raise HTTPException(status_code=422, detail="Invalid name")
    path = UPLOADS_DIR / name
    if not path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    url = f"/api/media/{name}"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT slug FROM courses WHERE hero_image_url = %s", (url,))
            used_by = [r["slug"] for r in cur.fetchall()]
            cur.execute("SELECT COUNT(*) AS n FROM attachments WHERE url = %s", (url,))
            attach_n = cur.fetchone()["n"]
    if used_by or attach_n:
        raise HTTPException(
            status_code=409,
            detail=f"In use — banner for {used_by or 'no courses'}, {attach_n} attachment(s)",
        )
    path.unlink()
    return {"ok": True}
