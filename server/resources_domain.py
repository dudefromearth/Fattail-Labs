"""First-class versioned Resources — pure domain ops (Resource Spec v1.0).

R1: no HTTP. Callers pass a dict cursor inside an open transaction.
"""

from __future__ import annotations

import re
from typing import Any

VALID_TYPES = frozenset({"spreadsheet", "document", "image", "link", "other"})
VALID_KINDS = frozenset({"file", "link"})


class ResourceError(Exception):
    def __init__(self, message: str, *, code: str = "RESOURCE_ERROR"):
        super().__init__(message)
        self.code = code


def slugify(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", (title or "").lower()).strip("-")
    return slug or "resource"


def _require_type(t: str) -> str:
    t = (t or "").strip().lower()
    if t not in VALID_TYPES:
        raise ResourceError(
            f"type must be one of {sorted(VALID_TYPES)}", code="BAD_TYPE"
        )
    return t


def _require_kind(k: str) -> str:
    k = (k or "").strip().lower()
    if k not in VALID_KINDS:
        raise ResourceError(
            f"kind must be one of {sorted(VALID_KINDS)}", code="BAD_KIND"
        )
    return k


def unique_slug(cur, base: str) -> str:
    """Return base or base-2, base-3, … not already in resources."""
    base = slugify(base)[:200]
    cur.execute("SELECT slug FROM resources WHERE slug = %s OR slug LIKE %s", (base, f"{base}-%"))
    taken = {r["slug"] for r in cur.fetchall()}
    if base not in taken:
        return base
    n = 2
    while f"{base}-{n}" in taken:
        n += 1
    return f"{base}-{n}"


def create_resource(
    cur,
    *,
    title: str,
    description_md: str = "",
    type: str,
    category_slug: str = "",
    kind: str,
    url: str,
    slug: str | None = None,
    emoji: str | None = None,
    publish: bool = False,
    changelog_md: str | None = None,
    created_by_identity_id: int | None = None,
    content_type: str | None = None,
    byte_size: int | None = None,
) -> dict[str, Any]:
    """Create resource head + version 1. Default unpublished (RES-D6)."""
    title = (title or "").strip()
    if not title:
        raise ResourceError("title is required", code="TITLE_REQUIRED")
    url = (url or "").strip()
    if not url:
        raise ResourceError("url is required", code="URL_REQUIRED")
    rtype = _require_type(type)
    rkind = _require_kind(kind)
    base_slug = slugify(slug) if slug else slugify(title)
    final_slug = unique_slug(cur, base_slug)
    emoji_val = (emoji or "").strip()[:16] or None

    cur.execute(
        """INSERT INTO resources
           (slug, title, description_md, type, category_slug, emoji)
           VALUES (%s, %s, %s, %s, %s, %s)""",
        (
            final_slug,
            title[:512],
            description_md or None,
            rtype,
            (category_slug or "").strip()[:128],
            emoji_val,
        ),
    )
    resource_id = int(cur.lastrowid)

    cur.execute(
        """INSERT INTO resource_versions
           (resource_id, version, kind, url, description_md, changelog_md,
            byte_size, content_type, created_by_identity_id)
           VALUES (%s, 1, %s, %s, %s, %s, %s, %s, %s)""",
        (
            resource_id,
            rkind,
            url[:1024],
            description_md or None,
            changelog_md,
            byte_size,
            content_type,
            created_by_identity_id,
        ),
    )
    version_id = int(cur.lastrowid)

    if publish:
        cur.execute(
            "UPDATE resources SET published_version_id = %s WHERE id = %s",
            (version_id, resource_id),
        )

    return {
        "resource_id": resource_id,
        "slug": final_slug,
        "version": 1,
        "version_id": version_id,
        "published": bool(publish),
    }


def add_version(
    cur,
    resource_id: int,
    *,
    kind: str,
    url: str,
    changelog_md: str | None = None,
    description_md: str | None = None,
    title_override: str | None = None,
    created_by_identity_id: int | None = None,
    content_type: str | None = None,
    byte_size: int | None = None,
    publish: bool = False,
) -> dict[str, Any]:
    """Append immutable version N+1. Does not publish unless publish=True."""
    url = (url or "").strip()
    if not url:
        raise ResourceError("url is required", code="URL_REQUIRED")
    rkind = _require_kind(kind)

    cur.execute("SELECT id FROM resources WHERE id = %s", (resource_id,))
    if cur.fetchone() is None:
        raise ResourceError(f"resource {resource_id} not found", code="NOT_FOUND")

    cur.execute(
        "SELECT COALESCE(MAX(version), 0) AS m FROM resource_versions WHERE resource_id = %s",
        (resource_id,),
    )
    next_v = int(cur.fetchone()["m"]) + 1

    cur.execute(
        """INSERT INTO resource_versions
           (resource_id, version, kind, url, title_override, description_md,
            changelog_md, byte_size, content_type, created_by_identity_id)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        (
            resource_id,
            next_v,
            rkind,
            url[:1024],
            (title_override or None),
            description_md,
            changelog_md,
            byte_size,
            content_type,
            created_by_identity_id,
        ),
    )
    version_id = int(cur.lastrowid)

    if publish:
        publish_version(cur, resource_id, next_v)

    return {
        "resource_id": resource_id,
        "version": next_v,
        "version_id": version_id,
        "published": bool(publish),
    }


def _version_row(cur, resource_id: int, version: int) -> dict:
    cur.execute(
        """SELECT id, resource_id, version, kind, url FROM resource_versions
           WHERE resource_id = %s AND version = %s""",
        (resource_id, version),
    )
    row = cur.fetchone()
    if not row:
        raise ResourceError(
            f"version {version} not found for resource {resource_id}",
            code="VERSION_NOT_FOUND",
        )
    return row


def publish_version(cur, resource_id: int, version: int) -> dict[str, Any]:
    """Set this version as the sole published cut (slug target)."""
    cur.execute("SELECT id, slug FROM resources WHERE id = %s", (resource_id,))
    res = cur.fetchone()
    if not res:
        raise ResourceError(f"resource {resource_id} not found", code="NOT_FOUND")
    vrow = _version_row(cur, resource_id, version)
    cur.execute(
        "UPDATE resources SET published_version_id = %s WHERE id = %s",
        (vrow["id"], resource_id),
    )
    return {
        "resource_id": resource_id,
        "slug": res["slug"],
        "published_version": version,
        "published_version_id": vrow["id"],
    }


def unpublish(cur, resource_id: int) -> dict[str, Any]:
    """Clear library publish; course pins unchanged."""
    cur.execute("SELECT id, slug FROM resources WHERE id = %s", (resource_id,))
    res = cur.fetchone()
    if not res:
        raise ResourceError(f"resource {resource_id} not found", code="NOT_FOUND")
    cur.execute(
        "UPDATE resources SET published_version_id = NULL WHERE id = %s",
        (resource_id,),
    )
    return {"resource_id": resource_id, "slug": res["slug"], "published_version_id": None}


def attach_to_course(
    cur,
    *,
    course_id: int,
    resource_id: int,
    pinned_version: int | None = None,
    free_preview: bool = False,
    lesson_id: int = 0,
    sort_order: int = 0,
) -> dict[str, Any]:
    """Link resource to course (or lesson if lesson_id > 0). Default pin = published else latest."""
    cur.execute("SELECT id FROM courses WHERE id = %s", (course_id,))
    if cur.fetchone() is None:
        raise ResourceError(f"course {course_id} not found", code="COURSE_NOT_FOUND")

    cur.execute(
        """SELECT id, published_version_id FROM resources WHERE id = %s""",
        (resource_id,),
    )
    res = cur.fetchone()
    if not res:
        raise ResourceError(f"resource {resource_id} not found", code="NOT_FOUND")

    if pinned_version is not None:
        vrow = _version_row(cur, resource_id, pinned_version)
        pin_id = int(vrow["id"])
        pin_ver = int(vrow["version"])
    elif res["published_version_id"]:
        pin_id = int(res["published_version_id"])
        cur.execute(
            "SELECT version FROM resource_versions WHERE id = %s", (pin_id,)
        )
        pin_ver = int(cur.fetchone()["version"])
    else:
        cur.execute(
            """SELECT id, version FROM resource_versions
               WHERE resource_id = %s ORDER BY version DESC LIMIT 1""",
            (resource_id,),
        )
        latest = cur.fetchone()
        if not latest:
            raise ResourceError("resource has no versions", code="NO_VERSIONS")
        pin_id = int(latest["id"])
        pin_ver = int(latest["version"])

    lid = int(lesson_id or 0)
    cur.execute(
        """INSERT INTO course_resource_links
           (course_id, resource_id, pinned_version_id, sort_order, free_preview, lesson_id)
           VALUES (%s, %s, %s, %s, %s, %s)
           ON DUPLICATE KEY UPDATE
             pinned_version_id = VALUES(pinned_version_id),
             free_preview = VALUES(free_preview),
             sort_order = VALUES(sort_order)""",
        (
            course_id,
            resource_id,
            pin_id,
            sort_order,
            1 if free_preview else 0,
            lid,
        ),
    )
    cur.execute(
        """SELECT id FROM course_resource_links
           WHERE course_id = %s AND resource_id = %s AND lesson_id = %s""",
        (course_id, resource_id, lid),
    )
    link = cur.fetchone()
    return {
        "link_id": int(link["id"]),
        "course_id": course_id,
        "resource_id": resource_id,
        "pinned_version": pin_ver,
        "pinned_version_id": pin_id,
        "free_preview": bool(free_preview),
        "lesson_id": lid,
    }


def set_pin(
    cur,
    *,
    course_id: int,
    resource_id: int,
    version: int,
    lesson_id: int = 0,
) -> dict[str, Any]:
    """Point course link at a specific version of the resource."""
    vrow = _version_row(cur, resource_id, version)
    lid = int(lesson_id or 0)
    cur.execute(
        """UPDATE course_resource_links
           SET pinned_version_id = %s
           WHERE course_id = %s AND resource_id = %s AND lesson_id = %s""",
        (vrow["id"], course_id, resource_id, lid),
    )
    if cur.rowcount == 0:
        raise ResourceError("course resource link not found", code="LINK_NOT_FOUND")
    return {
        "course_id": course_id,
        "resource_id": resource_id,
        "pinned_version": version,
        "pinned_version_id": int(vrow["id"]),
        "lesson_id": lid,
    }


def unlink_from_course(
    cur, *, course_id: int, resource_id: int, lesson_id: int = 0
) -> None:
    lid = int(lesson_id or 0)
    cur.execute(
        """DELETE FROM course_resource_links
           WHERE course_id = %s AND resource_id = %s AND lesson_id = %s""",
        (course_id, resource_id, lid),
    )
    if cur.rowcount == 0:
        raise ResourceError("course resource link not found", code="LINK_NOT_FOUND")


def get_by_slug(cur, slug: str, *, published_only: bool = False) -> dict | None:
    cur.execute(
        """SELECT r.id, r.slug, r.title, r.description_md, r.type, r.category_slug,
                  r.published_version_id, r.emoji,
                  v.id AS version_id, v.version, v.kind, v.url AS version_url,
                  v.changelog_md
           FROM resources r
           LEFT JOIN resource_versions v ON v.id = r.published_version_id
           WHERE r.slug = %s""",
        (slug,),
    )
    row = cur.fetchone()
    if not row:
        return None
    if published_only and not row["published_version_id"]:
        return None
    return row


def list_versions(cur, resource_id: int) -> list[dict]:
    cur.execute(
        """SELECT id, version, kind, url, changelog_md, created_at
           FROM resource_versions WHERE resource_id = %s ORDER BY version""",
        (resource_id,),
    )
    return list(cur.fetchall())


def get_published_version(cur, resource_id: int) -> dict | None:
    cur.execute(
        """SELECT v.* FROM resources r
           JOIN resource_versions v ON v.id = r.published_version_id
           WHERE r.id = %s""",
        (resource_id,),
    )
    return cur.fetchone()


def get_pinned_for_course(
    cur, *, course_id: int, resource_id: int, lesson_id: int = 0
) -> dict | None:
    lid = int(lesson_id or 0)
    cur.execute(
        """SELECT l.id AS link_id, l.free_preview, v.id AS version_id, v.version,
                  v.kind, v.url, r.slug, r.title, r.published_version_id
           FROM course_resource_links l
           JOIN resource_versions v ON v.id = l.pinned_version_id
           JOIN resources r ON r.id = l.resource_id
           WHERE l.course_id = %s AND l.resource_id = %s AND l.lesson_id = %s""",
        (course_id, resource_id, lid),
    )
    return cur.fetchone()
