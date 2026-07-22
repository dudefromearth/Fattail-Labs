"""Shared row lookups (refactor step 2/4).

The slug -> id -> 404 dance appeared eight times across route modules."""

from fastapi import HTTPException


def course_id_by_slug(cur, slug: str, *, published_only: bool = False) -> int:
    sql = "SELECT id FROM courses WHERE slug = %s"
    if published_only:
        sql += " AND status = 'published'"
    cur.execute(sql, (slug,))
    row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return row["id"]
