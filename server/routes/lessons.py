"""Lesson endpoint — access matrix per Enrollment & Access spec §3.

Anonymous: 401 always (even free previews — signup is the price of the preview).
observer: previews play, gated lessons 403 (upgrade prompt).
activator+: everything plays (member playback).
"""

from fastapi import APIRouter, HTTPException, Request

import auth
import db
import video
from config import get_config
from routes.quizzes import public_questions

router = APIRouter(prefix="/api/courses", tags=["lessons"])


def _session_claims(request: Request) -> dict | None:
    token = request.cookies.get(get_config().session_cookie)
    if not token:
        return None
    try:
        return auth.verify_session(token)
    except auth.AuthError:
        return None


@router.get("/{course_slug}/lessons/{lesson_slug}")
def lesson_detail(course_slug: str, lesson_slug: str, request: Request) -> dict:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT l.id, l.slug, l.title, l.kind, l.duration_seconds,
                          l.free_preview, l.video_provider, l.video_id, l.video_params,
                          l.body_md, m.title AS module_title,
                          c.slug AS course_slug, c.title AS course_title
                   FROM lessons l
                   JOIN modules m ON l.module_id = m.id
                   JOIN courses c ON m.course_id = c.id
                   WHERE c.slug = %s AND l.slug = %s AND c.status = 'published'""",
                (course_slug, lesson_slug),
            )
            row = cur.fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Lesson not found")

    claims = _session_claims(request)
    if claims is None:
        raise HTTPException(status_code=401, detail="Sign in to watch")
    if not row["free_preview"] and not auth.role_at_least(claims["role"], "alumni"):
        raise HTTPException(status_code=403, detail="Membership required")

    progress = {"last_position": 0, "completed": False}
    questions = None
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT last_position, completed_at FROM lesson_progress
                   WHERE identity_id = %s AND lesson_id = %s""",
                (claims["identity_id"], row["id"]),
            )
            prow = cur.fetchone()
            if prow:
                progress = {
                    "last_position": prow["last_position"],
                    "completed": prow["completed_at"] is not None,
                }
            if row["kind"] == "quiz":
                questions = public_questions(cur, row["id"])

    try:
        video_payload = video.embed_config(
            row["video_provider"], row["video_id"], row["video_params"]
        )
    except video.VideoConfigError as exc:
        # Missing Bunny keys or bad config — fail loud (503 for ops misconfig)
        msg = str(exc)
        code = 503 if "not configured" in msg.lower() else 500
        raise HTTPException(status_code=code, detail=msg) from exc

    return {
        "progress": progress,
        "questions": questions,
        "slug": row["slug"],
        "title": row["title"],
        "kind": row["kind"],
        "duration_seconds": row["duration_seconds"],
        "free_preview": bool(row["free_preview"]),
        "module_title": row["module_title"],
        "course_slug": row["course_slug"],
        "course_title": row["course_title"],
        "body_md": row["body_md"],
        "video": video_payload,
    }


@router.get("/{course_slug}/lessons/{lesson_slug}/public")
def lesson_public(course_slug: str, lesson_slug: str) -> dict:
    """Public landing payload (SEO spec v1.1): safe lesson metadata for
    anonymous visitors and crawlers. NEVER includes video fields; lesson notes
    only for free previews. The watchable lesson stays behind sign-up."""
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT l.slug, l.title, l.kind, l.duration_seconds,
                          l.free_preview, l.body_md,
                          m.title AS module_title,
                          c.slug AS course_slug, c.title AS course_title
                   FROM lessons l
                   JOIN modules m ON l.module_id = m.id
                   JOIN courses c ON m.course_id = c.id
                   WHERE c.slug = %s AND l.slug = %s AND c.status = 'published'""",
                (course_slug, lesson_slug),
            )
            row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    free = bool(row["free_preview"])
    return {
        "slug": row["slug"],
        "title": row["title"],
        "kind": row["kind"],
        "duration_seconds": row["duration_seconds"],
        "free_preview": free,
        "module_title": row["module_title"],
        "course_slug": row["course_slug"],
        "course_title": row["course_title"],
        "body_md": row["body_md"] if free else None,
    }
