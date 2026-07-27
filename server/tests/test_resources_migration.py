"""R4 — attachment → resource backfill (idempotent map)."""

from __future__ import annotations

import uuid

import db
from migrate_attachments_to_resources import migrate_attachment, run as migrate_run


def _uid(p: str = "zzmig") -> str:
    return f"{p}-{uuid.uuid4().hex[:8]}"


def _cleanup(aid: int, cid: int, *, mid: int | None = None, lid: int | None = None):
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT resource_id FROM resource_migration_map WHERE attachment_id = %s",
                (aid,),
            )
            m = cur.fetchone()
            if m:
                rid = m["resource_id"]
                cur.execute(
                    "DELETE FROM resource_migration_map WHERE attachment_id = %s",
                    (aid,),
                )
                cur.execute(
                    "DELETE FROM course_resource_links WHERE resource_id = %s",
                    (rid,),
                )
                cur.execute(
                    "UPDATE resources SET published_version_id = NULL WHERE id = %s",
                    (rid,),
                )
                cur.execute(
                    "DELETE FROM resource_versions WHERE resource_id = %s", (rid,)
                )
                cur.execute("DELETE FROM resources WHERE id = %s", (rid,))
            cur.execute("DELETE FROM attachments WHERE id = %s", (aid,))
            if lid:
                cur.execute("DELETE FROM lessons WHERE id = %s", (lid,))
            if mid:
                cur.execute("DELETE FROM modules WHERE id = %s", (mid,))
            cur.execute("DELETE FROM courses WHERE id = %s", (cid,))


def test_migrate_course_attachment_published_and_idempotent():
    slug = _uid("zzmig-c")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO courses (slug, title, subtitle, description_md, level, status)
                   VALUES (%s, %s, '', 'mig', 'beginner', 'published')""",
                (slug, f"Mig Course {slug}"),
            )
            cid = int(cur.lastrowid)
            cur.execute(
                """INSERT INTO attachments
                   (owner_type, owner_id, title, kind, url, free_preview, description_md, emoji)
                   VALUES ('course', %s, %s, 'link', %s, 1, 'desc', '📊')""",
                (cid, "Trade Log Sheet", "https://example.com/mig-log"),
            )
            aid = int(cur.lastrowid)
            cur.execute(
                """SELECT a.id, a.title, a.kind, a.url, a.free_preview,
                          a.description_md, a.emoji
                   FROM attachments a WHERE a.id = %s""",
                (aid,),
            )
            att = cur.fetchone()
            r1 = migrate_attachment(
                cur,
                attachment=att,
                course_id=cid,
                course_status="published",
                lesson_id=0,
            )
            assert r1["status"] == "migrated"
            assert r1["published"] is True
            r2 = migrate_attachment(
                cur,
                attachment=att,
                course_id=cid,
                course_status="published",
                lesson_id=0,
            )
            assert r2["status"] == "skipped_already"

            cur.execute(
                "SELECT resource_id, version_id FROM resource_migration_map WHERE attachment_id = %s",
                (aid,),
            )
            m = cur.fetchone()
            assert m
            cur.execute(
                "SELECT published_version_id, title FROM resources WHERE id = %s",
                (m["resource_id"],),
            )
            res = cur.fetchone()
            assert res["published_version_id"] == m["version_id"]
            assert res["title"] == "Trade Log Sheet"
            cur.execute(
                """SELECT free_preview FROM course_resource_links
                   WHERE course_id = %s AND resource_id = %s AND lesson_id = 0""",
                (cid, m["resource_id"]),
            )
            assert cur.fetchone()["free_preview"] in (1, True)

    _cleanup(aid, cid)


def test_migrate_lesson_attachment_not_auto_published():
    slug = _uid("zzmig-l")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO courses (slug, title, subtitle, description_md, level, status)
                   VALUES (%s, %s, '', 'mig', 'beginner', 'published')""",
                (slug, f"Mig Lesson Course {slug}"),
            )
            cid = int(cur.lastrowid)
            cur.execute(
                """INSERT INTO modules (course_id, title, slug, sort_order, kind)
                   VALUES (%s, 'M1', 'm1', 0, 'standard')""",
                (cid,),
            )
            mid = int(cur.lastrowid)
            cur.execute(
                """INSERT INTO lessons (module_id, slug, title, sort_order, kind)
                   VALUES (%s, 'l1', 'L1', 0, 'text')""",
                (mid,),
            )
            lid = int(cur.lastrowid)
            cur.execute(
                """INSERT INTO attachments
                   (owner_type, owner_id, title, kind, url, free_preview)
                   VALUES ('lesson', %s, 'Lesson Worksheet', 'file', 'private:zz-ws.pdf', 0)""",
                (lid,),
            )
            aid = int(cur.lastrowid)
            cur.execute(
                "SELECT id, title, kind, url, free_preview, description_md, emoji FROM attachments WHERE id = %s",
                (aid,),
            )
            att = cur.fetchone()
            r = migrate_attachment(
                cur,
                attachment=att,
                course_id=cid,
                course_status="published",
                lesson_id=lid,
            )
            assert r["status"] == "migrated"
            assert r["published"] is False
            assert r["lesson_id"] == lid
            cur.execute(
                "SELECT published_version_id FROM resources WHERE id = %s",
                (r["resource_id"],),
            )
            assert cur.fetchone()["published_version_id"] is None

    _cleanup(aid, cid, mid=mid, lid=lid)


def test_dry_run_full_runner():
    """Smoke: dry-run does not write map rows for a fresh probe."""
    slug = _uid("zzmig-d")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO courses (slug, title, subtitle, description_md, level, status)
                   VALUES (%s, %s, '', 'mig', 'beginner', 'draft')""",
                (slug, f"Dry {slug}"),
            )
            cid = int(cur.lastrowid)
            cur.execute(
                """INSERT INTO attachments
                   (owner_type, owner_id, title, kind, url, free_preview)
                   VALUES ('course', %s, 'Dry Only', 'link', 'https://example.com/dry', 0)""",
                (cid,),
            )
            aid = int(cur.lastrowid)

    s = migrate_run(dry_run=True)
    hit = [r for r in s["results"] if r.get("attachment_id") == aid]
    assert hit and hit[0]["status"] == "would_migrate"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM resource_migration_map WHERE attachment_id = %s",
                (aid,),
            )
            assert cur.fetchone() is None
            cur.execute("DELETE FROM attachments WHERE id = %s", (aid,))
            cur.execute("DELETE FROM courses WHERE id = %s", (cid,))
