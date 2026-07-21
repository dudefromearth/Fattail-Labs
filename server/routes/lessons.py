"""Lesson endpoint — free-preview lessons are public; gated lessons require
membership (401 until the member path lands, then role-checked)."""

from fastapi import APIRouter, HTTPException

import db
import video

router = APIRouter(prefix="/api/courses", tags=["lessons"])


@router.get("/{course_slug}/lessons/{lesson_slug}")
def lesson_detail(course_slug: str, lesson_slug: str) -> dict:
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
    if not row["free_preview"]:
        # Member playback arrives with the member path (P1c).
        raise HTTPException(status_code=401, detail="Members only")

    return {
        "slug": row["slug"],
        "title": row["title"],
        "kind": row["kind"],
        "duration_seconds": row["duration_seconds"],
        "free_preview": True,
        "module_title": row["module_title"],
        "course_slug": row["course_slug"],
        "course_title": row["course_title"],
        "body_md": row["body_md"],
        "video": video.embed_config(
            row["video_provider"], row["video_id"], row["video_params"]
        ),
    }
