"""Member endpoints: progress, enrollment records, student-page data, profile.

Specs: Progress Tracking v1.0 §3 · Enrollment Records & Student Page v1.0 §2–3 ·
Member Profile + Journey Visibility v1.0.
Access follows the Enrollment & Access matrix; enrollment itself is bookkeeping,
never a gate.
"""

import hashlib
import json
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, Request, UploadFile

import auth
import db
import identity
from guards import require_session
from repo import course_id_by_slug

router = APIRouter(tags=["member"])

MAX_DELTA = 60          # seconds per report, anti-gaming clamp
COMPLETE_RATIO = 0.9

AVATAR_TYPES = {"image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp"}
AVATAR_MAX_BYTES = 2 * 1024 * 1024
AVATAR_DIR = Path(__file__).resolve().parent.parent / "uploads" / "avatars"
DISPLAY_NAME_MAX = 64

# Idle timeout preference (minutes) — all roles except administrator
SESSION_IDLE_MIN_DEFAULT = 30
SESSION_IDLE_MIN_LO = 15
SESSION_IDLE_MIN_HI = 60

# Home quick nav — journal is always first; optional chips from profile.
HOME_QUICK_NAV_DEFAULT = ("journal",)
HOME_QUICK_NAV_OPTIONAL = (
    "wiki",
    "strategy_lab",
    "fattail_hard",
    "courses",
)
HOME_QUICK_NAV_ALLOWED = frozenset(HOME_QUICK_NAV_DEFAULT + HOME_QUICK_NAV_OPTIONAL)

# Journey UI prefs (J3 / F3) — server-side only; never localStorage.
JOURNEY_UI_PREFS_KEYS = frozenset(
    {
        "recovery_invite_dismissed",
        "recovery_invite_dismissed_at",
    }
)


def _normalize_journey_ui_prefs(raw) -> dict:
    """Sanitize journey_ui_prefs_json → public dict (unknown keys dropped)."""
    if raw is None:
        return {
            "recovery_invite_dismissed": False,
            "recovery_invite_dismissed_at": None,
        }
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except (TypeError, ValueError):
            raw = {}
    if not isinstance(raw, dict):
        raw = {}
    dismissed = bool(raw.get("recovery_invite_dismissed"))
    at = raw.get("recovery_invite_dismissed_at")
    if at is not None:
        at = str(at).strip() or None
    return {
        "recovery_invite_dismissed": dismissed,
        "recovery_invite_dismissed_at": at,
    }


def _normalize_home_quick_nav(raw) -> list[str]:
    """Return ordered unique keys; journal always first. Invalid keys dropped."""
    if raw is None:
        return list(HOME_QUICK_NAV_DEFAULT)
    if isinstance(raw, str):
        import json

        try:
            raw = json.loads(raw)
        except Exception:
            return list(HOME_QUICK_NAV_DEFAULT)
    if not isinstance(raw, (list, tuple)):
        return list(HOME_QUICK_NAV_DEFAULT)
    seen: set[str] = set()
    out: list[str] = []
    # Journal is always present first (default home entry).
    out.append("journal")
    seen.add("journal")
    for item in raw:
        key = str(item or "").strip().lower().replace("-", "_")
        if key == "strategy-lab":
            key = "strategy_lab"
        if key == "fattail-hard":
            key = "fattail_hard"
        if key not in HOME_QUICK_NAV_ALLOWED or key in seen:
            continue
        out.append(key)
        seen.add(key)
    return out


def _lesson_for_access(
    cur,
    course_slug: str,
    lesson_slug: str,
    role: str,
    *,
    identity_id: int,
    module_slug: str | None = None,
) -> dict:
    if module_slug:
        cur.execute(
            """SELECT l.id, l.kind, l.duration_seconds, l.free_preview,
                      c.id AS course_id
               FROM lessons l
               JOIN modules m ON l.module_id = m.id
               JOIN courses c ON m.course_id = c.id
               WHERE c.slug = %s AND m.slug = %s AND l.slug = %s
                 AND c.status = 'published'""",
            (course_slug, module_slug, lesson_slug),
        )
    else:
        # Ambiguous if two modules share a lesson slug — prefer unique match.
        cur.execute(
            """SELECT l.id, l.kind, l.duration_seconds, l.free_preview,
                      c.id AS course_id
               FROM lessons l
               JOIN modules m ON l.module_id = m.id
               JOIN courses c ON m.course_id = c.id
               WHERE c.slug = %s AND l.slug = %s AND c.status = 'published'""",
            (course_slug, lesson_slug),
        )
        rows = cur.fetchall()
        if len(rows) > 1:
            raise HTTPException(
                status_code=422,
                detail="module_slug required when lesson slug is not unique in course",
            )
        row = rows[0] if rows else None
        if row is None:
            raise HTTPException(status_code=404, detail="Lesson not found")
        if not row["free_preview"] and not identity.can_access_member_content(
            cur, identity_id, role
        ):
            raise HTTPException(status_code=403, detail="Membership required")
        return row
    row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    if not row["free_preview"] and not identity.can_access_member_content(
        cur, identity_id, role
    ):
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
        """SELECT l.slug, l.title, m.slug AS module_slug, m.title AS module_title,
                  m.kind, lp.completed_at, lp.last_position, lp.updated_at AS touched_at
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
            "module_slug": pick["module_slug"],
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
    else:
        # Un-completing a lesson (or incomplete course) clears course completion.
        cur.execute(
            """UPDATE enrollments SET completed_at = NULL
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
            lesson = _lesson_for_access(
                cur,
                course_slug,
                lesson_slug,
                claims["role"],
                identity_id=int(claims["identity_id"]),
            )
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
    """Toggle lesson completion.

    Body: { course_slug, lesson_slug, completed?: bool }
    - completed omitted or true → mark complete
    - completed false → clear completed_at (undo accidental mark)
    """
    claims = require_session(request)
    body = await request.json()
    # Default true preserves existing clients that only POST to complete.
    want_complete = body.get("completed")
    if want_complete is None:
        want_complete = True
    else:
        want_complete = bool(want_complete)

    with db.transaction() as conn:
        with conn.cursor() as cur:
            lesson = _lesson_for_access(
                cur,
                body.get("course_slug") or "",
                body.get("lesson_slug") or "",
                claims["role"],
                identity_id=int(claims["identity_id"]),
            )
            _ensure_enrollment(cur, claims["identity_id"], lesson["course_id"])
            if want_complete:
                cur.execute(
                    """INSERT INTO lesson_progress
                         (identity_id, lesson_id, watch_seconds, last_position, completed_at)
                       VALUES (%s, %s, 0, 0, NOW())
                       ON DUPLICATE KEY UPDATE
                         completed_at = COALESCE(completed_at, NOW())""",
                    (claims["identity_id"], lesson["id"]),
                )
            else:
                cur.execute(
                    """INSERT INTO lesson_progress
                         (identity_id, lesson_id, watch_seconds, last_position, completed_at)
                       VALUES (%s, %s, 0, 0, NULL)
                       ON DUPLICATE KEY UPDATE
                         completed_at = NULL""",
                    (claims["identity_id"], lesson["id"]),
                )
            _refresh_course_completion(cur, claims["identity_id"], lesson["course_id"])
    return {"completed": want_complete}


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


@router.get("/api/me/journey")
def my_journey(request: Request) -> dict:
    """Journey template: derived view over enrollments + lesson_progress only.

    Member-Data-Privacy DS-2 / Application Framework Journey — no second store.
    """
    claims = require_session(request)
    iid = int(claims["identity_id"])
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT e.course_id, e.enrolled_at, e.completed_at,
                          c.slug, c.title, c.level
                   FROM enrollments e
                   JOIN courses c ON e.course_id = c.id
                   WHERE e.identity_id = %s AND c.status = 'published'
                   ORDER BY e.enrolled_at DESC""",
                (iid,),
            )
            enrollments = cur.fetchall()
            courses = []
            completed_courses = 0
            in_progress = 0
            for e in enrollments:
                summary = _course_summary(cur, iid, e["course_id"])
                done = e["completed_at"] is not None or (
                    summary["total"] > 0 and summary["done"] >= summary["total"]
                )
                if done:
                    completed_courses += 1
                elif summary["done"] > 0:
                    in_progress += 1
                courses.append(
                    {
                        "slug": e["slug"],
                        "title": e["title"],
                        "level": e["level"],
                        "enrolled_at": e["enrolled_at"].isoformat(),
                        "completed_at": e["completed_at"].isoformat()
                        if e["completed_at"]
                        else None,
                        "percent": summary["percent"],
                        "lessons_done": summary["done"],
                        "lessons_total": summary["total"],
                        "resume": summary["resume"],
                    }
                )
            cur.execute(
                """SELECT COUNT(*) AS n FROM lesson_progress
                   WHERE identity_id = %s AND completed_at IS NOT NULL""",
                (iid,),
            )
            lessons_completed = int(cur.fetchone()["n"])
            cur.execute(
                """SELECT COALESCE(SUM(watch_seconds), 0) AS w FROM lesson_progress
                   WHERE identity_id = %s""",
                (iid,),
            )
            watch_seconds = int(cur.fetchone()["w"])
    return {
        "source": "enrollments+lesson_progress",
        "stats": {
            "courses_enrolled": len(courses),
            "courses_completed": completed_courses,
            "courses_in_progress": in_progress,
            "lessons_completed": lessons_completed,
            "watch_seconds": watch_seconds,
        },
        "courses": courses,
    }


# --- Profile + Journey presence (Member Profile + Journey Visibility Spec v1.0) ---


def _clamp_idle_minutes(value: object) -> int:
    try:
        n = int(value)  # type: ignore[arg-type]
    except (TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=422,
            detail=f"session_idle_minutes must be an integer {SESSION_IDLE_MIN_LO}–{SESSION_IDLE_MIN_HI}",
        ) from exc
    if not SESSION_IDLE_MIN_LO <= n <= SESSION_IDLE_MIN_HI:
        raise HTTPException(
            status_code=422,
            detail=(
                f"session_idle_minutes must be between "
                f"{SESSION_IDLE_MIN_LO} and {SESSION_IDLE_MIN_HI}"
            ),
        )
    return n


def _profile_row(cur, identity_id: int) -> dict | None:
    cur.execute(
        """SELECT identity_id, email, display_name, avatar_url, journey_visible,
                  journey_visible_at, share_reputation, share_personal_growth,
                  share_attendance, session_idle_minutes,
                  retrospective_pnl_expanded, retro_cadence_days,
                  home_quick_nav_json, journey_ui_prefs_json
           FROM identities WHERE identity_id = %s""",
        (identity_id,),
    )
    return cur.fetchone()


def _profile_payload(row: dict, role: str) -> dict:
    idle = row.get("session_idle_minutes")
    try:
        idle_n = int(idle) if idle is not None else SESSION_IDLE_MIN_DEFAULT
    except (TypeError, ValueError):
        idle_n = SESSION_IDLE_MIN_DEFAULT
    if not SESSION_IDLE_MIN_LO <= idle_n <= SESSION_IDLE_MIN_HI:
        idle_n = SESSION_IDLE_MIN_DEFAULT
    cadence = row.get("retro_cadence_days")
    try:
        cadence_n = int(cadence) if cadence is not None else None
    except (TypeError, ValueError):
        cadence_n = None
    quick_nav = _normalize_home_quick_nav(row.get("home_quick_nav_json"))
    journey_ui = _normalize_journey_ui_prefs(row.get("journey_ui_prefs_json"))
    return {
        "identity_id": int(row["identity_id"]),
        "email": row["email"] or "",
        "display_name": row["display_name"] or "",
        "avatar_url": row["avatar_url"],
        "journey_visible": bool(row["journey_visible"]),
        "journey_visible_at": row["journey_visible_at"].isoformat()
        if row.get("journey_visible_at")
        else None,
        "share_reputation": bool(row.get("share_reputation", 1)),
        "share_personal_growth": bool(row.get("share_personal_growth", 0)),
        "share_attendance": bool(row.get("share_attendance", 1)),
        "session_idle_minutes": idle_n,
        "session_idle_minutes_min": SESSION_IDLE_MIN_LO,
        "session_idle_minutes_max": SESSION_IDLE_MIN_HI,
        "session_idle_minutes_default": SESSION_IDLE_MIN_DEFAULT,
        "retrospective_pnl_expanded": bool(
            row.get("retrospective_pnl_expanded") or 0
        ),
        # Spec v0.7.1 — trader cadence; null = use meter-profile default
        "retro_cadence_days": cadence_n,
        "home_quick_nav": quick_nav,
        "home_quick_nav_options": [
            {"id": "journal", "label": "Journal", "required": True},
            {"id": "wiki", "label": "Wiki", "required": False},
            {"id": "strategy_lab", "label": "Strategy Lab", "required": False},
            {"id": "fattail_hard", "label": "FatTail Hard", "required": False},
            {"id": "courses", "label": "Courses", "required": False},
        ],
        "journey_ui_prefs": journey_ui,
        "role": role,
    }


@router.get("/api/me/profile")
def get_profile(request: Request) -> dict:
    claims = require_session(request)
    iid = int(claims["identity_id"])
    if iid == 0:
        raise HTTPException(status_code=400, detail="No identity for this session")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            row = _profile_row(cur, iid)
    if row is None:
        raise HTTPException(status_code=404, detail="Identity not found")
    return _profile_payload(row, claims["role"])


@router.patch("/api/me/profile")
async def patch_profile(request: Request) -> dict:
    claims = require_session(request)
    iid = int(claims["identity_id"])
    if iid == 0:
        raise HTTPException(status_code=400, detail="No identity for this session")
    try:
        body = await request.json()
    except Exception as exc:
        raise HTTPException(status_code=422, detail="JSON body required") from exc
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")

    updates: list[str] = []
    params: list = []

    if "display_name" in body:
        name = str(body["display_name"] or "").strip()
        if len(name) > DISPLAY_NAME_MAX:
            raise HTTPException(
                status_code=422,
                detail=f"display_name max {DISPLAY_NAME_MAX} characters",
            )
        updates.append("display_name = %s")
        params.append(name)

    if "journey_visible" in body:
        visible = body["journey_visible"]
        if not isinstance(visible, bool):
            raise HTTPException(
                status_code=422, detail="journey_visible must be boolean"
            )
        updates.append("journey_visible = %s")
        params.append(1 if visible else 0)
        if visible:
            updates.append("journey_visible_at = CURRENT_TIMESTAMP")
        else:
            updates.append("journey_visible_at = NULL")

    for field in (
        "share_reputation",
        "share_personal_growth",
        "share_attendance",
    ):
        if field in body:
            val = body[field]
            if not isinstance(val, bool):
                raise HTTPException(
                    status_code=422, detail=f"{field} must be boolean"
                )
            updates.append(f"{field} = %s")
            params.append(1 if val else 0)

    if "session_idle_minutes" in body:
        idle = _clamp_idle_minutes(body["session_idle_minutes"])
        updates.append("session_idle_minutes = %s")
        params.append(idle)

    if "retrospective_pnl_expanded" in body:
        exp = body["retrospective_pnl_expanded"]
        if not isinstance(exp, bool):
            raise HTTPException(
                status_code=422,
                detail="retrospective_pnl_expanded must be boolean",
            )
        updates.append("retrospective_pnl_expanded = %s")
        params.append(1 if exp else 0)

    if "home_quick_nav" in body:
        nav = _normalize_home_quick_nav(body["home_quick_nav"])
        updates.append("home_quick_nav_json = %s")
        params.append(json.dumps(nav))

    # J3 / F3 — merge journey UI prefs (server-side dismiss, not localStorage)
    journey_prefs_patch = body.get("journey_ui_prefs")
    if journey_prefs_patch is not None and not isinstance(journey_prefs_patch, dict):
        raise HTTPException(
            status_code=422, detail="journey_ui_prefs must be an object"
        )

    # Spec v0.7.1 §12 — cadence change is forward-only (history row; never
    # rewrites past retrospectives' cadence_days_at_period).
    cadence_change: int | None = None
    if "retro_cadence_days" in body:
        raw = body["retro_cadence_days"]
        if raw is None:
            # Clear preference → fall back to meter profile
            updates.append("retro_cadence_days = NULL")
        else:
            try:
                cadence_change = int(raw)
            except (TypeError, ValueError) as exc:
                raise HTTPException(
                    status_code=422, detail="retro_cadence_days must be an integer"
                ) from exc

    if (
        not updates
        and cadence_change is None
        and "retro_cadence_days" not in body
        and journey_prefs_patch is None
    ):
        raise HTTPException(status_code=422, detail="No recognized fields")

    params.append(iid)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            if journey_prefs_patch is not None:
                # Merge onto existing prefs (Family B: own identity only)
                cur.execute(
                    "SELECT journey_ui_prefs_json FROM identities WHERE identity_id = %s",
                    (iid,),
                )
                existing_row = cur.fetchone() or {}
                merged = _normalize_journey_ui_prefs(
                    existing_row.get("journey_ui_prefs_json")
                )
                if "recovery_invite_dismissed" in journey_prefs_patch:
                    dismissed = bool(journey_prefs_patch["recovery_invite_dismissed"])
                    merged["recovery_invite_dismissed"] = dismissed
                    if dismissed:
                        from datetime import datetime, timezone

                        merged["recovery_invite_dismissed_at"] = (
                            datetime.now(timezone.utc)
                            .replace(microsecond=0)
                            .isoformat()
                            .replace("+00:00", "Z")
                        )
                    else:
                        merged["recovery_invite_dismissed_at"] = None
                # Drop unknown keys from client patch (allowlisted only)
                for k in list(journey_prefs_patch.keys()):
                    if k not in JOURNEY_UI_PREFS_KEYS:
                        continue
                updates.append("journey_ui_prefs_json = %s")
                # Insert before trailing identity_id
                params.insert(-1, json.dumps(merged))
            if updates:
                cur.execute(
                    f"UPDATE identities SET {', '.join(updates)} WHERE identity_id = %s",
                    tuple(params),
                )
            if cadence_change is not None:
                import retrospective_domain as rd

                try:
                    rd.set_retro_cadence_days(cur, iid, cadence_change)
                except ValueError as exc:
                    raise HTTPException(status_code=422, detail=str(exc)) from exc
            row = _profile_row(cur, iid)
    if row is None:
        raise HTTPException(status_code=404, detail="Identity not found")
    return _profile_payload(row, claims["role"])


@router.post("/api/me/profile/avatar")
async def upload_avatar(
    request: Request, file: UploadFile = File(...)
) -> dict:
    claims = require_session(request)
    iid = int(claims["identity_id"])
    if iid == 0:
        raise HTTPException(status_code=400, detail="No identity for this session")
    ctype = (file.content_type or "").split(";")[0].strip().lower()
    ext = AVATAR_TYPES.get(ctype)
    if ext is None:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported type: {file.content_type}. Use PNG, JPEG, or WebP.",
        )
    data = await file.read()
    if len(data) > AVATAR_MAX_BYTES:
        raise HTTPException(status_code=422, detail="Avatar exceeds 2 MB")
    if len(data) == 0:
        raise HTTPException(status_code=422, detail="Empty file")

    name = "avt_" + hashlib.sha256(data).hexdigest()[:24] + ext
    AVATAR_DIR.mkdir(parents=True, exist_ok=True)
    (AVATAR_DIR / name).write_bytes(data)
    url = f"/api/media/avatars/{name}"

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT avatar_url FROM identities WHERE identity_id = %s",
                (iid,),
            )
            prev = cur.fetchone()
            cur.execute(
                "UPDATE identities SET avatar_url = %s WHERE identity_id = %s",
                (url, iid),
            )
            row = _profile_row(cur, iid)

    # Best-effort remove previous Labs avatar file if unshared path.
    if prev and prev.get("avatar_url"):
        _maybe_unlink_avatar(prev["avatar_url"], keep_url=url)

    if row is None:
        raise HTTPException(status_code=404, detail="Identity not found")
    return _profile_payload(row, claims["role"])


@router.delete("/api/me/profile/avatar")
def delete_avatar(request: Request) -> dict:
    claims = require_session(request)
    iid = int(claims["identity_id"])
    if iid == 0:
        raise HTTPException(status_code=400, detail="No identity for this session")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT avatar_url FROM identities WHERE identity_id = %s",
                (iid,),
            )
            prev = cur.fetchone()
            cur.execute(
                "UPDATE identities SET avatar_url = NULL WHERE identity_id = %s",
                (iid,),
            )
            row = _profile_row(cur, iid)
    if prev and prev.get("avatar_url"):
        _maybe_unlink_avatar(prev["avatar_url"], keep_url=None)
    if row is None:
        raise HTTPException(status_code=404, detail="Identity not found")
    return _profile_payload(row, claims["role"])


def _maybe_unlink_avatar(url: str, keep_url: str | None) -> None:
    if not url or url == keep_url:
        return
    prefix = "/api/media/avatars/"
    if not url.startswith(prefix):
        return
    name = url[len(prefix) :]
    if not name or "/" in name or ".." in name:
        return
    path = AVATAR_DIR / name
    try:
        if path.is_file():
            path.unlink()
    except OSError:
        pass


@router.get("/api/journey/presence")
def journey_presence(request: Request) -> dict:
    """Opt-in presence roster — display name + avatar only (compat).

    Prefer GET /api/journey/leaderboard for process scores (Gamification Spec v1.0).
    """
    require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT display_name, avatar_url
                   FROM identities
                   WHERE journey_visible = 1
                     AND TRIM(COALESCE(display_name, '')) <> ''
                   ORDER BY display_name ASC, identity_id ASC
                   LIMIT 500"""
            )
            rows = cur.fetchall()
    return {
        "members": [
            {
                "display_name": (r["display_name"] or "").strip(),
                "avatar_url": r["avatar_url"],
            }
            for r in rows
        ]
    }


@router.get("/api/me/journey/scores")
def my_journey_scores(request: Request) -> dict:
    """Self presence: process meters (private) + contribution scores.

    Personal path = process health meters (routine, learning, live, adherence).
    Community path = reputation / public contribution when opted in.
    """
    import journey_scores as js

    claims = require_session(request)
    iid = int(claims["identity_id"])
    if iid == 0:
        raise HTTPException(status_code=400, detail="No identity for this session")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            scores = js.scores_for_identity(cur, iid)
            process = js.process_meters(
                cur, iid, role=str(claims.get("role") or "observer")
            )
            cur.execute(
                "SELECT journey_visible FROM identities WHERE identity_id = %s",
                (iid,),
            )
            row = cur.fetchone()
            visible = bool(row and row["journey_visible"])
            rank = None
            if visible:
                board = js.leaderboard_rows(cur, viewer_identity_id=iid)
                rank = js.rank_for_identity(board)
    return {
        **scores,
        "process": process,
        "journey_visible": visible,
        "rank": rank,
        "weights": {
            "reputation": js.W_REP,
            "personal_growth": js.W_GROW,
            "attendance_streak": js.W_ATT,
            "streak_cap": js.STREAK_CAP,
        },
    }


@router.get("/api/me/journey/process-timeline")
def my_process_timeline(request: Request, samples: int = 26) -> dict:
    """Temporal Process Flow samples (practice start → today) for radar scrubber.

    Each point reconstructs meters as-of that day. ``samples`` 2–52 (default 26).
    """
    import journey_scores as js

    claims = require_session(request)
    iid = int(claims["identity_id"])
    if iid == 0:
        raise HTTPException(status_code=400, detail="No identity for this session")
    n = max(2, min(int(samples or 26), 52))
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return js.process_timeline(
                cur,
                iid,
                role=str(claims.get("role") or "observer"),
                samples=n,
            )


@router.get("/api/journey/leaderboard")
def journey_leaderboard(request: Request) -> dict:
    """Community Leaderboard — opt-in process peers (Contribution Score rank)."""
    import journey_scores as js

    claims = require_session(request)
    iid = int(claims["identity_id"])
    with db.transaction() as conn:
        with conn.cursor() as cur:
            members = js.leaderboard_rows(cur, viewer_identity_id=iid)
    return {
        "members": members,
        "sort": "contribution_desc",
        "framing": "process_peers",
    }
