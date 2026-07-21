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

COURSE_FIELDS = frozenset({"title", "subtitle", "description_md", "level", "status"})
LESSON_FIELDS = frozenset(
    {"title", "video_id", "video_params", "free_preview", "duration_seconds"}
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
                """SELECT id, slug, title, subtitle, description_md, level, status
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
