"""Reviews + course discussion (Reviews Spec v1.0 · Course Discussion Spec v1.0).

Reading is public; writing requires a session (reviews additionally require
enrollment + >=1 completed lesson). Moderation is admin-only. All rules enforced
here — the UI is convenience.
"""

from fastapi import APIRouter, HTTPException, Request

import auth
import db
from config import get_config

router = APIRouter(tags=["community"])

VALID_MOD_STATUS = frozenset({"visible", "held"})


def _claims_or_none(request: Request) -> dict | None:
    token = request.cookies.get(get_config().session_cookie)
    if not token:
        return None
    try:
        return auth.verify_session(token)
    except auth.AuthError:
        return None


def _require_session(request: Request) -> dict:
    claims = _claims_or_none(request)
    if claims is None:
        raise HTTPException(status_code=401, detail="Sign in required")
    return claims


def _require_admin(request: Request) -> dict:
    claims = _require_session(request)
    if not auth.role_at_least(claims["role"], "administrator"):
        raise HTTPException(status_code=403, detail="Administrator role required")
    return claims


def _course_id(cur, slug: str) -> int:
    cur.execute(
        "SELECT id FROM courses WHERE slug = %s AND status = 'published'", (slug,)
    )
    row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return row["id"]


# --- reviews ------------------------------------------------------------------

def _review_eligibility(cur, identity_id: int, course_id: int) -> tuple[bool, str]:
    cur.execute(
        "SELECT 1 FROM enrollments WHERE identity_id = %s AND course_id = %s",
        (identity_id, course_id),
    )
    if cur.fetchone() is None:
        return False, "Enroll in the course to review it"
    cur.execute(
        """SELECT 1 FROM lesson_progress lp
           JOIN lessons l ON lp.lesson_id = l.id
           JOIN modules m ON l.module_id = m.id
           WHERE lp.identity_id = %s AND m.course_id = %s
             AND lp.completed_at IS NOT NULL LIMIT 1""",
        (identity_id, course_id),
    )
    if cur.fetchone() is None:
        return False, "Complete a lesson to review this course"
    return True, ""


@router.get("/api/courses/{slug}/reviews")
def list_reviews(slug: str, request: Request) -> dict:
    claims = _claims_or_none(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            course_id = _course_id(cur, slug)
            cur.execute(
                """SELECT r.id, r.rating, r.body, r.created_at, r.status,
                          i.display_name, i.email, r.identity_id
                   FROM reviews r JOIN identities i ON r.identity_id = i.identity_id
                   WHERE r.course_id = %s
                   ORDER BY r.created_at DESC LIMIT 100""",
                (course_id,),
            )
            rows = cur.fetchall()
            cur.execute(
                """SELECT ROUND(AVG(rating),1) AS avg_rating, COUNT(*) AS n
                   FROM reviews WHERE course_id = %s AND status = 'visible'""",
                (course_id,),
            )
            agg = cur.fetchone()

            viewer = None
            if claims:
                eligible, reason = _review_eligibility(
                    cur, claims["identity_id"], course_id
                )
                mine = next(
                    (r for r in rows if r["identity_id"] == claims["identity_id"]),
                    None,
                )
                viewer = {
                    "can_review": eligible,
                    "reason": reason,
                    "is_admin": auth.role_at_least(claims["role"], "administrator"),
                    "my_review": (
                        {"rating": mine["rating"], "body": mine["body"],
                         "status": mine["status"]}
                        if mine else None
                    ),
                }

    is_admin = bool(viewer and viewer["is_admin"])
    visible = [
        r for r in rows
        if r["status"] == "visible"
        or is_admin
        or (claims and r["identity_id"] == claims["identity_id"])
    ]
    return {
        "aggregate": {
            "avg": float(agg["avg_rating"]) if agg["n"] >= 3 and agg["avg_rating"] else None,
            "count": agg["n"],
        },
        "reviews": [
            {
                "id": r["id"],
                "author": r["display_name"] or r["email"].split("@")[0],
                "rating": r["rating"],
                "body": r["body"],
                "status": r["status"],
                "created_at": r["created_at"].isoformat(),
            }
            for r in visible
        ],
        "viewer": viewer,
    }


@router.post("/api/courses/{slug}/reviews")
async def upsert_review(slug: str, request: Request) -> dict:
    claims = _require_session(request)
    body = await request.json()
    try:
        rating = int(body.get("rating"))
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail="rating must be an integer") from exc
    if not 1 <= rating <= 5:
        raise HTTPException(status_code=422, detail="rating must be 1-5")
    text = (body.get("body") or "").strip()

    with db.transaction() as conn:
        with conn.cursor() as cur:
            course_id = _course_id(cur, slug)
            eligible, reason = _review_eligibility(cur, claims["identity_id"], course_id)
            if not eligible:
                raise HTTPException(status_code=403, detail=reason)
            cur.execute(
                """INSERT INTO reviews (identity_id, course_id, rating, body)
                   VALUES (%s, %s, %s, %s)
                   ON DUPLICATE KEY UPDATE rating = VALUES(rating),
                                           body = VALUES(body)""",
                (claims["identity_id"], course_id, rating, text),
            )
    return {"ok": True}


@router.post("/api/admin/reviews/{review_id}/moderate")
async def moderate_review(review_id: int, request: Request) -> dict:
    _require_admin(request)
    body = await request.json()
    status = body.get("status")
    if status not in VALID_MOD_STATUS:
        raise HTTPException(status_code=422, detail=f"status must be one of {sorted(VALID_MOD_STATUS)}")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("UPDATE reviews SET status = %s WHERE id = %s", (status, review_id))
            if cur.rowcount == 0:
                cur.execute("SELECT 1 FROM reviews WHERE id = %s", (review_id,))
                if cur.fetchone() is None:
                    raise HTTPException(status_code=404, detail="Review not found")
    return {"ok": True}


# --- discussion ---------------------------------------------------------------

@router.get("/api/courses/{slug}/threads")
def list_threads(slug: str, request: Request) -> dict:
    claims = _claims_or_none(request)
    is_admin = bool(claims and auth.role_at_least(claims["role"], "administrator"))
    with db.transaction() as conn:
        with conn.cursor() as cur:
            course_id = _course_id(cur, slug)
            status_filter = "" if is_admin else "AND t.status = 'visible'"
            cur.execute(
                f"""SELECT t.id, t.title, t.status, t.created_at,
                           i.display_name, i.email, i.role_override,
                           (SELECT COUNT(*) FROM comments c
                             WHERE c.thread_id = t.id AND c.status = 'visible') AS comment_count
                    FROM threads t JOIN identities i ON t.identity_id = i.identity_id
                    WHERE t.scope_type = 'course' AND t.scope_id = %s {status_filter}
                    ORDER BY t.created_at DESC LIMIT 100""",
                (course_id,),
            )
            rows = cur.fetchall()
    return {
        "threads": [
            {
                "id": t["id"],
                "title": t["title"],
                "status": t["status"],
                "author": t["display_name"] or t["email"].split("@")[0],
                "author_is_admin": t["role_override"] == "administrator",
                "comment_count": t["comment_count"],
                "created_at": t["created_at"].isoformat(),
            }
            for t in rows
        ],
        "viewer": {
            "can_post": claims is not None,
            "is_admin": is_admin,
        },
    }


@router.post("/api/courses/{slug}/threads")
async def create_thread(slug: str, request: Request) -> dict:
    claims = _require_session(request)
    body = await request.json()
    title = (body.get("title") or "").strip()
    text = (body.get("body") or "").strip()
    if not title:
        raise HTTPException(status_code=422, detail="title required")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            course_id = _course_id(cur, slug)
            cur.execute(
                """INSERT INTO threads (scope_type, scope_id, identity_id, title, body_md)
                   VALUES ('course', %s, %s, %s, %s)""",
                (course_id, claims["identity_id"], title, text),
            )
            thread_id = cur.lastrowid
    return {"id": thread_id}


@router.get("/api/threads/{thread_id}")
def thread_detail(thread_id: int, request: Request) -> dict:
    claims = _claims_or_none(request)
    is_admin = bool(claims and auth.role_at_least(claims["role"], "administrator"))
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT t.id, t.title, t.body_md, t.status, t.created_at,
                          i.display_name, i.email, i.role_override
                   FROM threads t JOIN identities i ON t.identity_id = i.identity_id
                   WHERE t.id = %s""",
                (thread_id,),
            )
            t = cur.fetchone()
            if t is None or (t["status"] != "visible" and not is_admin):
                raise HTTPException(status_code=404, detail="Thread not found")
            status_filter = "" if is_admin else "AND c.status = 'visible'"
            cur.execute(
                f"""SELECT c.id, c.body_md, c.status, c.created_at,
                           i.display_name, i.email, i.role_override
                    FROM comments c JOIN identities i ON c.identity_id = i.identity_id
                    WHERE c.thread_id = %s {status_filter}
                    ORDER BY c.created_at ASC LIMIT 200""",
                (thread_id,),
            )
            comments = cur.fetchall()
    def author(row):
        return {
            "author": row["display_name"] or row["email"].split("@")[0],
            "author_is_admin": row["role_override"] == "administrator",
        }
    return {
        "id": t["id"],
        "title": t["title"],
        "body": t["body_md"],
        "status": t["status"],
        "created_at": t["created_at"].isoformat(),
        **author(t),
        "comments": [
            {
                "id": c["id"],
                "body": c["body_md"],
                "status": c["status"],
                "created_at": c["created_at"].isoformat(),
                **author(c),
            }
            for c in comments
        ],
    }


@router.post("/api/threads/{thread_id}/comments")
async def create_comment(thread_id: int, request: Request) -> dict:
    claims = _require_session(request)
    body = await request.json()
    text = (body.get("body") or "").strip()
    if not text:
        raise HTTPException(status_code=422, detail="body required")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM threads WHERE id = %s AND status = 'visible'",
                (thread_id,),
            )
            if cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Thread not found")
            cur.execute(
                "INSERT INTO comments (thread_id, identity_id, body_md) VALUES (%s, %s, %s)",
                (thread_id, claims["identity_id"], text),
            )
            comment_id = cur.lastrowid
    return {"id": comment_id}


@router.post("/api/admin/threads/{thread_id}/moderate")
async def moderate_thread(thread_id: int, request: Request) -> dict:
    return await _moderate("threads", thread_id, request)


@router.post("/api/admin/comments/{comment_id}/moderate")
async def moderate_comment(comment_id: int, request: Request) -> dict:
    return await _moderate("comments", comment_id, request)


async def _moderate(table: str, row_id: int, request: Request) -> dict:
    _require_admin(request)
    body = await request.json()
    status = body.get("status")
    if status not in VALID_MOD_STATUS:
        raise HTTPException(status_code=422, detail=f"status must be one of {sorted(VALID_MOD_STATUS)}")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(f"UPDATE {table} SET status = %s WHERE id = %s", (status, row_id))
            cur.execute(f"SELECT 1 FROM {table} WHERE id = %s", (row_id,))
            if cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


# --- students roster (Students Tab Spec v1.0) ---------------------------------

@router.get("/api/courses/{slug}/students")
def course_students(slug: str, request: Request) -> dict:
    claims = _claims_or_none(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            course_id = _course_id(cur, slug)
            cur.execute(
                "SELECT COUNT(*) AS n FROM enrollments WHERE course_id = %s",
                (course_id,),
            )
            count = cur.fetchone()["n"]
            if claims is None:
                return {"count": count, "students": None}
            cur.execute(
                """SELECT i.display_name, i.email, i.role_override,
                          e.enrolled_at, e.completed_at
                   FROM enrollments e
                   JOIN identities i ON e.identity_id = i.identity_id
                   WHERE e.course_id = %s
                   ORDER BY e.enrolled_at DESC LIMIT 200""",
                (course_id,),
            )
            rows = cur.fetchall()
    return {
        "count": count,
        "students": [
            {
                "name": r["display_name"] or r["email"].split("@")[0],
                "is_admin": r["role_override"] == "administrator",
                "enrolled_at": r["enrolled_at"].isoformat(),
                "completed": r["completed_at"] is not None,
            }
            for r in rows
        ],
    }
