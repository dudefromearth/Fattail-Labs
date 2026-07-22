"""Member endpoints: progress, enrollment records, student-page data.

Specs: Progress Tracking v1.0 §3 · Enrollment Records & Student Page v1.0 §2–3.
Access follows the Enrollment & Access matrix; enrollment itself is bookkeeping,
never a gate.
"""

from fastapi import APIRouter, HTTPException, Request

import auth
import db
from guards import require_session
from repo import course_id_by_slug

router = APIRouter(tags=["member"])

MAX_DELTA = 60          # seconds per report, anti-gaming clamp
COMPLETE_RATIO = 0.9


def _lesson_for_access(cur, course_slug: str, lesson_slug: str, role: str) -> dict:
    cur.execute(
        """SELECT l.id, l.kind, l.duration_seconds, l.free_preview,
                  c.id AS course_id
           FROM lessons l
           JOIN modules m ON l.module_id = m.id
           JOIN courses c ON m.course_id = c.id
           WHERE c.slug = %s AND l.slug = %s AND c.status = 'published'""",
        (course_slug, lesson_slug),
    )
    row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    if not row["free_preview"] and not auth.role_at_least(role, "alumni"):
        raise HTTPException(status_code=403, detail="Membership required")
    return row


def _ensure_enrollment(cur, identity_id: int, course_id: int) -> None:
    cur.execute(
        "INSERT IGNORE INTO enrollments (identity_id, course_id) VALUES (%s, %s)",
        (identity_id, course_id),
    )


def _course_summary(cur, identity_id: int, course_id: int) -> dict:
    """Progress summary shared by continue/enrollments (spec rules: percent over
    standard-module lessons; resume = latest-touched incomplete, else first)."""
    cur.execute(
        """SELECT l.slug, l.title, m.title AS module_title, m.kind,
                  lp.completed_at, lp.last_position, lp.updated_at AS touched_at
           FROM lessons l
           JOIN modules m ON l.module_id = m.id
           LEFT JOIN lesson_progress lp
             ON lp.lesson_id = l.id AND lp.identity_id = %s
           WHERE m.course_id = %s
           ORDER BY m.sort_order, l.sort_order""",
        (identity_id, course_id),
    )
    lessons = cur.fetchall()
    standard = [x for x in lessons if x["kind"] == "standard"]
    total = len(standard)
    done = sum(1 for x in standard if x["completed_at"] is not None)

    incomplete = [x for x in lessons if x["completed_at"] is None]
    resume = None
    if incomplete:
        touched = [x for x in incomplete if x["touched_at"] is not None]
        touched.sort(key=lambda x: x["touched_at"], reverse=True)
        pick = touched[0] if touched else incomplete[0]
        resume = {
            "lesson_slug": pick["slug"],
            "title": pick["title"],
            "module_title": pick["module_title"],
            "last_position": pick["last_position"] or 0,
        }
    return {
        "total": total,
        "done": done,
        "percent": round(100 * done / total) if total else 0,
        "resume": resume,
    }


def _refresh_course_completion(cur, identity_id: int, course_id: int) -> None:
    summary = _course_summary(cur, identity_id, course_id)
    if summary["total"] > 0 and summary["done"] >= summary["total"]:
        cur.execute(
            """UPDATE enrollments SET completed_at = COALESCE(completed_at, NOW())
               WHERE identity_id = %s AND course_id = %s""",
            (identity_id, course_id),
        )


@router.post("/api/courses/{course_slug}/enroll")
def enroll(course_slug: str, request: Request) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            course_id = course_id_by_slug(cur, course_slug, published_only=True)
            _ensure_enrollment(cur, claims["identity_id"], course_id)
            cur.execute(
                """SELECT enrolled_at, completed_at FROM enrollments
                   WHERE identity_id = %s AND course_id = %s""",
                (claims["identity_id"], course_id),
            )
            enr = cur.fetchone()
    return {
        "enrolled": True,
        "enrolled_at": enr["enrolled_at"].isoformat(),
        "completed_at": enr["completed_at"].isoformat() if enr["completed_at"] else None,
    }


@router.post("/api/progress")
async def report_progress(request: Request) -> dict:
    claims = require_session(request)
    body = await request.json()
    course_slug = body.get("course_slug") or ""
    lesson_slug = body.get("lesson_slug") or ""
    try:
        position = max(0, int(body.get("position", 0)))
        delta = max(0, min(MAX_DELTA, int(body.get("watched_delta", 0))))
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail="position/watched_delta must be integers") from exc

    with db.transaction() as conn:
        with conn.cursor() as cur:
            lesson = _lesson_for_access(cur, course_slug, lesson_slug, claims["role"])
            _ensure_enrollment(cur, claims["identity_id"], lesson["course_id"])
            duration = lesson["duration_seconds"] or 0
            if duration:
                position = min(position, duration + 60)
            cur.execute(
                """INSERT INTO lesson_progress
                     (identity_id, lesson_id, watch_seconds, last_position)
                   VALUES (%s, %s, %s, %s)
                   ON DUPLICATE KEY UPDATE
                     watch_seconds = watch_seconds + VALUES(watch_seconds),
                     last_position = VALUES(last_position)""",
                (claims["identity_id"], lesson["id"], delta, position),
            )
            if lesson["kind"] == "video" and duration > 0:
                cur.execute(
                    """UPDATE lesson_progress
                       SET completed_at = COALESCE(completed_at, NOW())
                       WHERE identity_id = %s AND lesson_id = %s
                         AND watch_seconds >= %s""",
                    (claims["identity_id"], lesson["id"], int(duration * COMPLETE_RATIO)),
                )
            cur.execute(
                """SELECT watch_seconds, completed_at FROM lesson_progress
                   WHERE identity_id = %s AND lesson_id = %s""",
                (claims["identity_id"], lesson["id"]),
            )
            row = cur.fetchone()
            if row["completed_at"] is not None:
                _refresh_course_completion(cur, claims["identity_id"], lesson["course_id"])
    return {
        "watch_seconds": row["watch_seconds"],
        "completed": row["completed_at"] is not None,
    }


@router.post("/api/progress/complete")
async def mark_complete(request: Request) -> dict:
    claims = require_session(request)
    body = await request.json()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            lesson = _lesson_for_access(
                cur, body.get("course_slug") or "", body.get("lesson_slug") or "",
                claims["role"],
            )
            _ensure_enrollment(cur, claims["identity_id"], lesson["course_id"])
            cur.execute(
                """INSERT INTO lesson_progress
                     (identity_id, lesson_id, watch_seconds, last_position, completed_at)
                   VALUES (%s, %s, 0, 0, NOW())
                   ON DUPLICATE KEY UPDATE
                     completed_at = COALESCE(completed_at, NOW())""",
                (claims["identity_id"], lesson["id"]),
            )
            _refresh_course_completion(cur, claims["identity_id"], lesson["course_id"])
    return {"completed": True}


@router.get("/api/me/progress")
def my_course_progress(course: str, request: Request) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT l.slug, lp.watch_seconds, lp.last_position, lp.completed_at
                   FROM lesson_progress lp
                   JOIN lessons l ON lp.lesson_id = l.id
                   JOIN modules m ON l.module_id = m.id
                   JOIN courses c ON m.course_id = c.id
                   WHERE lp.identity_id = %s AND c.slug = %s""",
                (claims["identity_id"], course),
            )
            rows = cur.fetchall()
    return {
        "lessons": {
            r["slug"]: {
                "completed": r["completed_at"] is not None,
                "last_position": r["last_position"],
                "watch_seconds": r["watch_seconds"],
            }
            for r in rows
        }
    }


@router.get("/api/me/enrollments")
def my_enrollments(request: Request) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT e.course_id, e.enrolled_at, e.completed_at,
                          c.slug, c.title, c.level
                   FROM enrollments e
                   JOIN courses c ON e.course_id = c.id
                   WHERE e.identity_id = %s AND c.status = 'published'
                   ORDER BY e.enrolled_at DESC""",
                (claims["identity_id"],),
            )
            enrollments = cur.fetchall()
            out = []
            for e in enrollments:
                summary = _course_summary(cur, claims["identity_id"], e["course_id"])
                out.append(
                    {
                        "course": {"slug": e["slug"], "title": e["title"], "level": e["level"]},
                        "enrolled_at": e["enrolled_at"].isoformat(),
                        "completed_at": e["completed_at"].isoformat() if e["completed_at"] else None,
                        "progress": {
                            "total": summary["total"],
                            "done": summary["done"],
                            "percent": summary["percent"],
                        },
                        "resume": summary["resume"],
                    }
                )
    return {"enrollments": out}


@router.get("/api/me/activity")
def my_activity(request: Request) -> dict:
    claims = require_session(request)
    events: list[dict] = []
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT c.slug AS course_slug, c.title AS course_title,
                          e.enrolled_at, e.completed_at
                   FROM enrollments e JOIN courses c ON e.course_id = c.id
                   WHERE e.identity_id = %s AND c.status = 'published'""",
                (claims["identity_id"],),
            )
            for r in cur.fetchall():
                events.append(
                    {"type": "enrolled", "at": r["enrolled_at"],
                     "course_slug": r["course_slug"], "course_title": r["course_title"]}
                )
                if r["completed_at"]:
                    events.append(
                        {"type": "course_completed", "at": r["completed_at"],
                         "course_slug": r["course_slug"], "course_title": r["course_title"]}
                    )
            cur.execute(
                """SELECT l.slug AS lesson_slug, l.title AS lesson_title,
                          c.slug AS course_slug, c.title AS course_title,
                          lp.updated_at, lp.completed_at, lp.watch_seconds
                   FROM lesson_progress lp
                   JOIN lessons l ON lp.lesson_id = l.id
                   JOIN modules m ON l.module_id = m.id
                   JOIN courses c ON m.course_id = c.id
                   WHERE lp.identity_id = %s AND c.status = 'published'
                   ORDER BY lp.updated_at DESC LIMIT 50""",
                (claims["identity_id"],),
            )
            for r in cur.fetchall():
                events.append(
                    {
                        "type": "lesson_completed" if r["completed_at"] else "lesson_watched",
                        "at": r["completed_at"] or r["updated_at"],
                        "course_slug": r["course_slug"], "course_title": r["course_title"],
                        "lesson_slug": r["lesson_slug"], "lesson_title": r["lesson_title"],
                        "watch_seconds": r["watch_seconds"],
                    }
                )
            # Stats for the student page header.
            cur.execute(
                """SELECT COUNT(*) AS lessons_done FROM lesson_progress
                   WHERE identity_id = %s AND completed_at IS NOT NULL""",
                (claims["identity_id"],),
            )
            lessons_done = cur.fetchone()["lessons_done"]
            cur.execute(
                "SELECT COALESCE(SUM(watch_seconds),0) AS watch FROM lesson_progress WHERE identity_id = %s",
                (claims["identity_id"],),
            )
            watch = cur.fetchone()["watch"]

    events.sort(key=lambda x: x["at"], reverse=True)
    for e in events:
        e["at"] = e["at"].isoformat()
    return {
        "events": events[:50],
        "stats": {"lessons_completed": lessons_done, "watch_seconds": int(watch)},
    }


@router.get("/api/me/continue")
def continue_learning(request: Request) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT c.id, c.slug, c.title, c.level,
                          MAX(lp.updated_at) AS last_activity
                   FROM lesson_progress lp
                   JOIN lessons l ON lp.lesson_id = l.id
                   JOIN modules m ON l.module_id = m.id
                   JOIN courses c ON m.course_id = c.id
                   WHERE lp.identity_id = %s AND c.status = 'published'
                   GROUP BY c.id, c.slug, c.title, c.level
                   ORDER BY last_activity DESC
                   LIMIT 12""",
                (claims["identity_id"],),
            )
            courses = cur.fetchall()
            out = []
            for course in courses:
                summary = _course_summary(cur, claims["identity_id"], course["id"])
                if summary["total"] == 0 or summary["done"] >= summary["total"]:
                    continue
                out.append(
                    {
                        "course": {
                            "slug": course["slug"], "title": course["title"],
                            "level": course["level"], "total": summary["total"],
                            "completed": summary["done"], "percent": summary["percent"],
                        },
                        "resume": summary["resume"],
                    }
                )
                if len(out) >= 6:
                    break
    return {"courses": out}
