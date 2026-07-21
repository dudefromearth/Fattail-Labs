"""Admin API — in-place editing endpoints (role: administrator).

Field allowlists per entity; anything outside them is a 422. Video params are
validated against the provider allowlist BEFORE persisting, so a bad config can
never reach the player.
"""

import json
import re

from fastapi import APIRouter, HTTPException, Request

import auth
import db
import video
from config import get_config

router = APIRouter(prefix="/api/admin", tags=["admin"])

COURSE_FIELDS = frozenset(
    {"title", "subtitle", "description_md", "level", "status", "trailer_video_id"}
)
MODULE_FIELDS = frozenset({"title", "kind"})
VALID_MODULE_KINDS = frozenset({"standard", "worksheets", "resources", "bonus"})
LESSON_FIELDS = frozenset(
    {"title", "video_id", "video_params", "free_preview", "duration_seconds", "body_md"}
)
VALID_LEVELS = frozenset({"beginner", "intermediate", "advanced"})
VALID_STATUS = frozenset({"draft", "published", "archived"})

_YT_URL = re.compile(
    r"(?:youtube(?:-nocookie)?\.com/(?:watch\?.*?v=|embed/|shorts/)|youtu\.be/)([\w-]{11})"
)


def require_admin(request: Request) -> dict:
    cfg = get_config()
    token = request.cookies.get(cfg.session_cookie)
    if not token:
        raise HTTPException(status_code=401, detail="No session")
    try:
        claims = auth.verify_session(token)
    except auth.AuthError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    if not auth.role_at_least(claims["role"], "administrator"):
        raise HTTPException(status_code=403, detail="Administrator role required")
    return claims


def normalize_video_id(raw: str | None) -> str | None:
    """Accept a bare 11-char ID or any pasted YouTube URL; store the bare ID."""
    if raw is None:
        return None
    raw = raw.strip()
    if not raw:
        return None
    match = _YT_URL.search(raw)
    if match:
        return match.group(1)
    if re.fullmatch(r"[\w-]{11}", raw):
        return raw
    raise HTTPException(status_code=422, detail=f"Not a YouTube URL or video id: {raw!r}")


@router.get("/courses/{slug}")
def admin_course(slug: str, request: Request) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, slug, title, subtitle, description_md, level, status,
                          trailer_video_id
                   FROM courses WHERE slug = %s""",
                (slug,),
            )
            course = cur.fetchone()
            if course is None:
                raise HTTPException(status_code=404, detail="Course not found")
            cur.execute(
                """SELECT m.id AS module_id, m.title AS module_title, m.kind,
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
                {"module_id": r["module_id"], "title": r["module_title"],
                 "kind": r["kind"], "lessons": []}
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
    return {**course, "modules": modules}


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
        body["trailer_video_id"] = normalize_video_id(body["trailer_video_id"])
    if "level" in body and body["level"] not in VALID_LEVELS:
        raise HTTPException(status_code=422, detail=f"level must be one of {sorted(VALID_LEVELS)}")
    if "status" in body and body["status"] not in VALID_STATUS:
        raise HTTPException(status_code=422, detail=f"status must be one of {sorted(VALID_STATUS)}")

    sets = ", ".join(f"{f} = %s" for f in body)
    publish_touch = ", published_at = COALESCE(published_at, NOW())" if body.get("status") == "published" else ""
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"UPDATE courses SET {sets}{publish_touch} WHERE slug = %s",
                [*body.values(), slug],
            )
            if cur.rowcount == 0:
                cur.execute("SELECT 1 FROM courses WHERE slug = %s", (slug,))
                if cur.fetchone() is None:
                    raise HTTPException(status_code=404, detail="Course not found")
    return {"ok": True, "updated": sorted(body)}


@router.put("/lessons/{lesson_id}")
async def update_lesson(lesson_id: int, request: Request) -> dict:
    require_admin(request)
    body = await request.json()
    unknown = set(body) - LESSON_FIELDS
    if unknown:
        raise HTTPException(status_code=422, detail=f"Unknown fields: {sorted(unknown)}")
    if not body:
        raise HTTPException(status_code=422, detail="Empty update")

    if "video_id" in body:
        body["video_id"] = normalize_video_id(body["video_id"])
    if "video_params" in body:
        params = video.parse_params(body["video_params"])
        if params:
            # Validate against the allowlist by building the URL (raises on bad params).
            video.youtube_embed_url(body.get("video_id") or "x" * 11, params)
        body["video_params"] = json.dumps(params) if params else None
    if "free_preview" in body:
        body["free_preview"] = 1 if body["free_preview"] else 0
    if "duration_seconds" in body:
        body["duration_seconds"] = int(body["duration_seconds"])

    sets = ", ".join(f"{f} = %s" for f in body)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"UPDATE lessons SET {sets} WHERE id = %s",
                [*body.values(), lesson_id],
            )
            cur.execute("SELECT slug FROM lessons WHERE id = %s", (lesson_id,))
            if cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Lesson not found")
    return {"ok": True, "updated": sorted(body)}


def _slugify(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return slug or "lesson"


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
    sets = ", ".join(f"{f} = %s" for f in body)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"UPDATE modules SET {sets} WHERE id = %s", [*body.values(), module_id]
            )
            cur.execute("SELECT 1 FROM modules WHERE id = %s", (module_id,))
            if cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Module not found")
    return {"ok": True, "updated": sorted(body)}


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
            cur.execute("SELECT id FROM courses WHERE slug = %s", (slug,))
            course = cur.fetchone()
            if course is None:
                raise HTTPException(status_code=404, detail="Course not found")
            cur.execute(
                "SELECT COALESCE(MAX(sort_order), -1) + 1 AS nxt FROM modules WHERE course_id = %s",
                (course["id"],),
            )
            nxt = cur.fetchone()["nxt"]
            cur.execute(
                "INSERT INTO modules (course_id, title, sort_order, kind) VALUES (%s, %s, %s, %s)",
                (course["id"], title, nxt, kind),
            )
            module_id = cur.lastrowid
    return {"module_id": module_id}


@router.post("/modules/{module_id}/lessons")
async def create_lesson(module_id: int, request: Request) -> dict:
    require_admin(request)
    body = await request.json() if int(request.headers.get("content-length") or 0) else {}
    title = (body.get("title") or "New Lesson").strip() or "New Lesson"
    base = _slugify(title)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1 FROM modules WHERE id = %s", (module_id,))
            if cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Module not found")
            cur.execute(
                "SELECT slug FROM lessons WHERE module_id = %s", (module_id,)
            )
            taken = {r["slug"] for r in cur.fetchall()}
            slug = base
            n = 2
            while slug in taken:
                slug = f"{base}-{n}"
                n += 1
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
    return {"id": lesson_id, "slug": slug}


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
