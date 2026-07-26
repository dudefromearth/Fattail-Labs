"""R4 — Backfill course/lesson attachments into first-class Resources.

Idempotent via resource_migration_map (attachment_id PK).

Usage:
  cd server && set -a && source ../.env && set +a
  .venv/bin/python migrate_attachments_to_resources.py
  .venv/bin/python migrate_attachments_to_resources.py --dry-run
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parent
REPO_ROOT = SERVER_DIR.parent
sys.path.insert(0, str(SERVER_DIR))


def _load_env() -> None:
    env_file = REPO_ROOT / ".env"
    if not env_file.is_file():
        return
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_env()

import db  # noqa: E402
import resources_domain as rd  # noqa: E402


def infer_type(kind: str, url: str, title: str) -> str:
    k = (kind or "link").lower()
    u = (url or "").lower()
    t = (title or "").lower()
    if k == "link":
        return "link"
    if any(x in u or x in t for x in (".xlsx", ".xls", ".csv", "spreadsheet", "log")):
        return "spreadsheet"
    if any(
        x in u or x in t
        for x in (".png", ".jpg", ".jpeg", ".webp", ".gif", "infographic", "diagram")
    ):
        return "image"
    return "document"


def _already_migrated(cur, attachment_id: int) -> bool:
    cur.execute(
        "SELECT resource_id FROM resource_migration_map WHERE attachment_id = %s",
        (attachment_id,),
    )
    return cur.fetchone() is not None


def migrate_attachment(
    cur,
    *,
    attachment: dict,
    course_id: int,
    course_status: str,
    lesson_id: int = 0,
    dry_run: bool = False,
) -> dict:
    aid = int(attachment["id"])
    if _already_migrated(cur, aid):
        return {"attachment_id": aid, "status": "skipped_already"}

    title = (attachment.get("title") or f"resource-{aid}").strip()
    kind = attachment.get("kind") or "link"
    if kind not in ("file", "link"):
        kind = "link"
    url = (attachment.get("url") or "").strip()
    if not url:
        return {"attachment_id": aid, "status": "skipped_no_url"}

    rtype = infer_type(kind, url, title)
    publish = (course_status == "published") and lesson_id == 0
    free = bool(attachment.get("free_preview"))
    emoji = attachment.get("emoji")
    desc = attachment.get("description_md") or ""

    if dry_run:
        return {
            "attachment_id": aid,
            "status": "would_migrate",
            "title": title,
            "type": rtype,
            "publish": publish,
            "course_id": course_id,
            "lesson_id": lesson_id,
        }

    # Prefer stable slug from title; unique_slug handles collisions
    created = rd.create_resource(
        cur,
        title=title,
        description_md=desc,
        type=rtype,
        category_slug="",
        kind=kind,
        url=url,
        slug=None,
        emoji=emoji,
        publish=publish,
    )
    rid = created["resource_id"]
    vid = created["version_id"]

    rd.attach_to_course(
        cur,
        course_id=course_id,
        resource_id=rid,
        pinned_version=1,
        free_preview=free,
        lesson_id=lesson_id,
        sort_order=0,
    )

    cur.execute(
        """INSERT INTO resource_migration_map (attachment_id, resource_id, version_id)
           VALUES (%s, %s, %s)""",
        (aid, rid, vid),
    )
    return {
        "attachment_id": aid,
        "status": "migrated",
        "resource_id": rid,
        "version_id": vid,
        "slug": created["slug"],
        "published": publish,
        "course_id": course_id,
        "lesson_id": lesson_id,
    }


def run(*, dry_run: bool = False) -> dict:
    results: list[dict] = []
    with db.transaction() as conn:
        with conn.cursor() as cur:
            # Course-level
            cur.execute(
                """SELECT a.id, a.title, a.kind, a.url, a.free_preview,
                          a.description_md, a.emoji,
                          c.id AS course_id, c.status AS course_status
                   FROM attachments a
                   JOIN courses c ON a.owner_type = 'course' AND a.owner_id = c.id
                   ORDER BY a.id"""
            )
            for row in cur.fetchall():
                results.append(
                    migrate_attachment(
                        cur,
                        attachment=row,
                        course_id=int(row["course_id"]),
                        course_status=row["course_status"] or "draft",
                        lesson_id=0,
                        dry_run=dry_run,
                    )
                )

            # Lesson-level
            cur.execute(
                """SELECT a.id, a.title, a.kind, a.url, a.free_preview,
                          a.description_md, a.emoji,
                          l.id AS lesson_id, m.course_id, c.status AS course_status
                   FROM attachments a
                   JOIN lessons l ON a.owner_type = 'lesson' AND a.owner_id = l.id
                   JOIN modules m ON l.module_id = m.id
                   JOIN courses c ON m.course_id = c.id
                   ORDER BY a.id"""
            )
            for row in cur.fetchall():
                results.append(
                    migrate_attachment(
                        cur,
                        attachment=row,
                        course_id=int(row["course_id"]),
                        course_status=row["course_status"] or "draft",
                        lesson_id=int(row["lesson_id"]),
                        dry_run=dry_run,
                    )
                )

            # Orphan attachments (no course/lesson owner match) — leave unmapped
            cur.execute(
                """SELECT a.id FROM attachments a
                   LEFT JOIN resource_migration_map m ON m.attachment_id = a.id
                   WHERE m.attachment_id IS NULL
                     AND NOT (
                       (a.owner_type = 'course' AND EXISTS (
                         SELECT 1 FROM courses c WHERE c.id = a.owner_id))
                       OR
                       (a.owner_type = 'lesson' AND EXISTS (
                         SELECT 1 FROM lessons l WHERE l.id = a.owner_id))
                     )"""
            )
            for row in cur.fetchall():
                results.append(
                    {"attachment_id": row["id"], "status": "skipped_orphan"}
                )

    summary = {
        "dry_run": dry_run,
        "total": len(results),
        "migrated": sum(1 for r in results if r["status"] == "migrated"),
        "would_migrate": sum(1 for r in results if r["status"] == "would_migrate"),
        "skipped_already": sum(1 for r in results if r["status"] == "skipped_already"),
        "skipped_no_url": sum(1 for r in results if r["status"] == "skipped_no_url"),
        "skipped_orphan": sum(1 for r in results if r["status"] == "skipped_orphan"),
        "results": results,
    }
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Migrate attachments → resources")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Report what would migrate without writing",
    )
    args = parser.parse_args()
    summary = run(dry_run=args.dry_run)
    print(
        f"{'DRY-RUN ' if args.dry_run else ''}"
        f"attachments→resources: total={summary['total']} "
        f"migrated={summary['migrated']} would={summary['would_migrate']} "
        f"already={summary['skipped_already']} no_url={summary['skipped_no_url']} "
        f"orphan={summary['skipped_orphan']}"
    )
    # Compact detail for failures / interesting rows
    for r in summary["results"]:
        if r["status"] in ("migrated", "would_migrate", "skipped_no_url", "skipped_orphan"):
            print(f"  {r}")


if __name__ == "__main__":
    main()
