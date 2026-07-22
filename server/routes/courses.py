"""Public read API — catalog + course detail (spec §8, P1b).

Only published courses are visible. Public payloads never include gated
content fields (video_id, body_md, external_url, attachment URLs for
non-preview material).
"""

from fastapi import APIRouter, HTTPException, Query

import db
import video

router = APIRouter(prefix="/api/courses", tags=["courses"])

VALID_SORTS = frozenset({"newest", "enrolled", "title"})
VALID_LEVELS = frozenset({"beginner", "intermediate", "advanced"})

_LIST_SQL = """
SELECT c.id, c.slug, c.title, c.subtitle, c.description_md, c.hero_image_url,
       c.card_color,
       c.level, c.certification_enabled, c.published_at,
       (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS enrolled_count,
       (SELECT COUNT(*) FROM lessons l JOIN modules m ON l.module_id = m.id
         WHERE m.course_id = c.id) AS lesson_count,
       (SELECT COALESCE(SUM(l.duration_seconds), 0)
          FROM lessons l JOIN modules m ON l.module_id = m.id
         WHERE m.course_id = c.id) AS total_duration_seconds,
       (SELECT COUNT(*) FROM reviews r
         WHERE r.course_id = c.id AND r.status = 'visible') AS review_count,
       (SELECT ROUND(AVG(r.rating), 1) FROM reviews r
         WHERE r.course_id = c.id AND r.status = 'visible'
        HAVING COUNT(*) >= 3) AS avg_rating
FROM courses c
WHERE c.status = 'published'
"""


def _categories_for(cur, course_ids: list[int]) -> dict[int, list[dict]]:
    if not course_ids:
        return {}
    placeholders = ",".join(["%s"] * len(course_ids))
    cur.execute(
        f"""SELECT cc.course_id, cat.slug, cat.name
            FROM course_categories cc JOIN categories cat ON cc.category_id = cat.id
            WHERE cc.course_id IN ({placeholders})""",
        course_ids,
    )
    out: dict[int, list[dict]] = {}
    for row in cur.fetchall():
        out.setdefault(row["course_id"], []).append(
            {"slug": row["slug"], "name": row["name"]}
        )
    return out


def _instructors_for(cur, course_ids: list[int]) -> dict[int, list[dict]]:
    if not course_ids:
        return {}
    placeholders = ",".join(["%s"] * len(course_ids))
    cur.execute(
        f"""SELECT ci.course_id, i.name, i.avatar_url
            FROM course_instructors ci JOIN instructors i ON ci.instructor_id = i.id
            WHERE ci.course_id IN ({placeholders})
            ORDER BY ci.sort_order""",
        course_ids,
    )
    out: dict[int, list[dict]] = {}
    for row in cur.fetchall():
        out.setdefault(row["course_id"], []).append(
            {"name": row["name"], "avatar_url": row["avatar_url"]}
        )
    return out


@router.get("")
def list_courses(
    category: str | None = None,
    level: str | None = None,
    q: str | None = None,
    sort: str = Query(default="newest"),
) -> dict:
    if sort not in VALID_SORTS:
        raise HTTPException(status_code=422, detail=f"sort must be one of {sorted(VALID_SORTS)}")
    if level is not None and level not in VALID_LEVELS:
        raise HTTPException(status_code=422, detail=f"level must be one of {sorted(VALID_LEVELS)}")

    sql = _LIST_SQL
    args: list = []
    if level:
        sql += " AND c.level = %s"
        args.append(level)
    if q:
        sql += " AND (c.title LIKE %s OR c.description_md LIKE %s)"
        args.extend([f"%{q}%", f"%{q}%"])
    if category:
        sql += """ AND c.id IN (SELECT cc.course_id FROM course_categories cc
                   JOIN categories cat ON cc.category_id = cat.id WHERE cat.slug = %s)"""
        args.append(category)

    order = {
        "newest": " ORDER BY c.published_at DESC",
        "enrolled": " ORDER BY enrolled_count DESC, c.published_at DESC",
        "title": " ORDER BY c.title ASC",
    }[sort]
    sql += order

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, args)
            rows = cur.fetchall()
            ids = [r["id"] for r in rows]
            cats = _categories_for(cur, ids)
            instructors = _instructors_for(cur, ids)

    courses = []
    for r in rows:
        courses.append(
            {
                "slug": r["slug"],
                "title": r["title"],
                "subtitle": r["subtitle"],
                "description_md": r["description_md"],
                "hero_image_url": r["hero_image_url"],
                "card_color": r["card_color"],
                "level": r["level"],
                "certification_enabled": bool(r["certification_enabled"]),
                "published_at": r["published_at"].isoformat() if r["published_at"] else None,
                "enrolled_count": r["enrolled_count"],
                "lesson_count": r["lesson_count"],
                "total_duration_seconds": r["total_duration_seconds"],
                "review_count": r["review_count"],
                "avg_rating": float(r["avg_rating"]) if r["avg_rating"] is not None else None,
                "categories": cats.get(r["id"], []),
                "instructors": instructors.get(r["id"], []),
            }
        )
    return {"courses": courses}


@router.get("/{slug}")
def course_detail(slug: str) -> dict:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                _LIST_SQL + " AND c.slug = %s",
                (slug,),
            )
            row = cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Course not found")
            course_id = row["id"]

            cats = _categories_for(cur, [course_id])
            instructors_map = _instructors_for(cur, [course_id])
            cur.execute(
                """SELECT i.name, i.bio_md, i.avatar_url
                   FROM course_instructors ci JOIN instructors i ON ci.instructor_id = i.id
                   WHERE ci.course_id = %s ORDER BY ci.sort_order""",
                (course_id,),
            )
            instructor_bios = cur.fetchall()

            cur.execute(
                """SELECT id, title, sort_order, kind FROM modules
                   WHERE course_id = %s ORDER BY sort_order""",
                (course_id,),
            )
            modules = cur.fetchall()
            module_ids = [m["id"] for m in modules]
            lessons_by_module: dict[int, list[dict]] = {}
            if module_ids:
                placeholders = ",".join(["%s"] * len(module_ids))
                # Public payload: structural fields only — no video_id, body_md,
                # or external_url. Gated content is served by member routes.
                cur.execute(
                    f"""SELECT module_id, slug, title, sort_order, kind,
                               duration_seconds, free_preview
                        FROM lessons WHERE module_id IN ({placeholders})
                        ORDER BY module_id, sort_order""",
                    module_ids,
                )
                for lesson in cur.fetchall():
                    lessons_by_module.setdefault(lesson["module_id"], []).append(
                        {
                            "slug": lesson["slug"],
                            "title": lesson["title"],
                            "kind": lesson["kind"],
                            "duration_seconds": lesson["duration_seconds"],
                            "free_preview": bool(lesson["free_preview"]),
                        }
                    )

            cur.execute(
                """SELECT id, title, kind, url, free_preview FROM attachments
                   WHERE owner_type = 'course' AND owner_id = %s""",
                (course_id,),
            )
            attachments = [
                {
                    "id": a["id"],
                    "title": a["title"],
                    "kind": a["kind"],
                    "free": bool(a["free_preview"]),
                    "url": a["url"] if a["kind"] == "link" else None,
                }
                for a in cur.fetchall()
            ]

            cur.execute(
                "SELECT trailer_video_id, trailer_provider FROM courses WHERE id = %s",
                (course_id,),
            )
            trow = cur.fetchone()
            trailer = video.embed_config(
                trow["trailer_provider"], trow["trailer_video_id"], None
            )

    return {
        "slug": row["slug"],
        "title": row["title"],
        "subtitle": row["subtitle"],
        "description_md": row["description_md"],
        "hero_image_url": row["hero_image_url"],
        "trailer": trailer,
        "level": row["level"],
        "certification_enabled": bool(row["certification_enabled"]),
        "published_at": row["published_at"].isoformat() if row["published_at"] else None,
        "enrolled_count": row["enrolled_count"],
        "lesson_count": row["lesson_count"],
        "avg_rating": float(row["avg_rating"]) if row["avg_rating"] is not None else None,
        "categories": cats.get(course_id, []),
        "instructors": [
            {"name": b["name"], "bio_md": b["bio_md"], "avatar_url": b["avatar_url"]}
            for b in instructor_bios
        ],
        "modules": [
            {
                "title": m["title"],
                "kind": m["kind"],
                "lessons": lessons_by_module.get(m["id"], []),
            }
            for m in modules
        ],
        "attachments": attachments,
    }
