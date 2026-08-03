"""Lesson endpoint — Enrollment & Access + Access Control Spec v0.4.

Public URL shape: /course/{course}/{module}/{lesson}
API: /api/courses/{course}/modules/{module}/lessons/{lesson}

Policy preferred when access_policies row exists for lesson:{id}; else as-built
(free_preview OR can_access_member_content).
"""

from fastapi import APIRouter, HTTPException, Request

import auth
import db
import identity
import video
from access_control.evaluate import evaluate
from access_control.policy import load_policy
from access_control.types import TargetMeta
from access_control.viewer import parse_preview_cookie, viewer_from_claims
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


def _load_lesson_row(cur, course_slug: str, module_slug: str, lesson_slug: str):
    cur.execute(
        """SELECT l.id, l.slug, l.title, l.kind, l.duration_seconds,
                  l.free_preview, l.video_provider, l.video_id, l.video_params,
                  l.body_md,
                  m.id AS module_id, m.slug AS module_slug, m.title AS module_title,
                  c.id AS course_id, c.slug AS course_slug, c.title AS course_title,
                  c.status AS course_status
           FROM lessons l
           JOIN modules m ON l.module_id = m.id
           JOIN courses c ON m.course_id = c.id
           WHERE c.slug = %s AND m.slug = %s AND l.slug = %s""",
        (course_slug, module_slug, lesson_slug),
    )
    return cur.fetchone()


@router.get("/{course_slug}/modules/{module_slug}/lessons/{lesson_slug}")
def lesson_detail(
    course_slug: str, module_slug: str, lesson_slug: str, request: Request
) -> dict:
    claims = _session_claims(request)
    preview = parse_preview_cookie(request.cookies.get("ft_access_preview"))
    with db.transaction() as conn:
        with conn.cursor() as cur:
            row = _load_lesson_row(cur, course_slug, module_slug, lesson_slug)

    if row is None:
        raise HTTPException(status_code=404, detail="Lesson not found")

    is_admin = bool(claims and claims.get("role") == "administrator")
    if row["course_status"] != "published" and not is_admin:
        raise HTTPException(status_code=404, detail="Lesson not found")

    if claims is None and preview is None:
        raise HTTPException(status_code=401, detail="Sign in to watch")

    target_key = f"lesson:{int(row['id'])}"
    progress = {"last_position": 0, "completed": False}
    questions = None
    access_payload = None
    with db.transaction() as conn:
        with conn.cursor() as cur:
            viewer = viewer_from_claims(cur, claims, preview_as=preview)
            policy = load_policy(cur, target_key)
            member_ok = False
            if claims:
                member_ok = identity.can_access_member_content(
                    cur,
                    int(claims["identity_id"]),
                    str(claims.get("role") or "observer"),
                )
            meta = TargetMeta(
                free_preview=bool(row["free_preview"]),
                course_id=int(row["course_id"]),
                member_content_ok=member_ok,
            )
            decision = evaluate(target_key, viewer, policy=policy, meta=meta)
            access_payload = decision.to_public_dict()

            if not decision.allow or not decision.has_capability("read"):
                if decision.code == "signin_required":
                    raise HTTPException(
                        status_code=401,
                        detail={"message": "Sign in to watch", "access": access_payload},
                    )
                if decision.mode == "hide" or decision.code == "hidden":
                    raise HTTPException(status_code=404, detail="Lesson not found")
                raise HTTPException(
                    status_code=403,
                    detail={
                        "message": "Membership required",
                        "access": access_payload,
                    },
                )

            if claims and not preview:
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
        msg = str(exc)
        if "not configured" in msg.lower():
            raise HTTPException(status_code=503, detail=msg) from exc
        video_payload = None

    return {
        "progress": progress,
        "questions": questions,
        "id": row["id"],
        "slug": row["slug"],
        "title": row["title"],
        "kind": row["kind"],
        "duration_seconds": row["duration_seconds"],
        "free_preview": bool(row["free_preview"]),
        "module_id": row["module_id"],
        "module_slug": row["module_slug"],
        "module_title": row["module_title"],
        "course_id": row["course_id"],
        "course_slug": row["course_slug"],
        "course_title": row["course_title"],
        "body_md": row["body_md"],
        "video": video_payload,
        "access": access_payload,
    }


@router.get("/{course_slug}/modules/{module_slug}/lessons/{lesson_slug}/public")
def lesson_public(course_slug: str, module_slug: str, lesson_slug: str) -> dict:
    """Public landing payload — safe metadata; no video."""
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT l.id, l.slug, l.title, l.kind, l.duration_seconds,
                          l.free_preview, l.body_md,
                          m.id AS module_id, m.slug AS module_slug, m.title AS module_title,
                          c.id AS course_id, c.slug AS course_slug, c.title AS course_title
                   FROM lessons l
                   JOIN modules m ON l.module_id = m.id
                   JOIN courses c ON m.course_id = c.id
                   WHERE c.slug = %s AND m.slug = %s AND l.slug = %s
                     AND c.status = 'published'""",
                (course_slug, module_slug, lesson_slug),
            )
            row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    free = bool(row["free_preview"])
    return {
        "id": row["id"],
        "slug": row["slug"],
        "title": row["title"],
        "kind": row["kind"],
        "duration_seconds": row["duration_seconds"],
        "free_preview": free,
        "module_id": row["module_id"],
        "course_id": row["course_id"],
        "module_slug": row["module_slug"],
        "module_title": row["module_title"],
        "course_slug": row["course_slug"],
        "course_title": row["course_title"],
        "body_md": row["body_md"] if free else None,
    }
