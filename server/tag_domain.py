"""Platform Tag Manager — admin lexicon + polymorphic assignments.

Coach locks: admin-only definition CRUD; members assign existing tags only.
No auto-create of labels. No member-owned tag definition tables.
"""

from __future__ import annotations

import re
import secrets
from datetime import datetime, timezone
from typing import Any

# --- constants ----------------------------------------------------------------

VALID_STATUS = frozenset({"active", "retired"})
MEMBER_OBJECT_TYPES = frozenset(
    {
        "journal_session",
        "trade",
        "retrospective",
        "playbook_entry",
    }
)
PUBLIC_OBJECT_TYPES = frozenset({"course", "resource", "lesson"})
VALID_OBJECT_TYPES = MEMBER_OBJECT_TYPES | PUBLIC_OBJECT_TYPES

SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class TagError(Exception):
    def __init__(self, code: int, detail: str, *, extra: dict | None = None):
        self.code = code
        self.detail = detail
        self.extra = extra or {}
        super().__init__(detail)


def _iso(dt: Any) -> str | None:
    if dt is None:
        return None
    if isinstance(dt, datetime):
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc).isoformat()
        return dt.isoformat()
    return str(dt)


def _slugify(label: str) -> str:
    s = label.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s[:64] or "tag"


def _new_export_key() -> str:
    return secrets.token_hex(16)


# --- serialize ----------------------------------------------------------------


def serialize_category(row: dict) -> dict[str, Any]:
    return {
        "id": int(row["id"]),
        "system_key": row.get("system_key"),
        "label": row["label"],
        "sort_order": int(row.get("sort_order") or 0),
    }


def serialize_tag(row: dict, *, category: dict | None = None) -> dict[str, Any]:
    return {
        "id": int(row["id"]),
        "slug": row["slug"],
        "label": row["label"],
        "description": row.get("description"),
        "category_id": int(row["category_id"]) if row.get("category_id") else None,
        "category": category,
        "color": row.get("color"),
        "status": row["status"],
        "merged_into_tag_id": (
            int(row["merged_into_tag_id"]) if row.get("merged_into_tag_id") else None
        ),
        "created_at": _iso(row.get("created_at")),
        "updated_at": _iso(row.get("updated_at")),
    }


def serialize_assignment(row: dict, *, tag: dict | None = None) -> dict[str, Any]:
    return {
        "id": int(row["id"]),
        "tag_id": int(row["tag_id"]),
        "object_type": row["object_type"],
        "object_id": int(row["object_id"]),
        "identity_id": int(row["identity_id"]) if row.get("identity_id") else None,
        "export_key": row.get("export_key"),
        "created_at": _iso(row.get("created_at")),
        "tag": tag,
    }


# --- categories ---------------------------------------------------------------


def list_categories(cur) -> list[dict]:
    cur.execute(
        """SELECT id, system_key, label, sort_order, created_at, updated_at
           FROM tag_categories ORDER BY sort_order ASC, id ASC"""
    )
    return [serialize_category(r) for r in cur.fetchall()]


def create_category(cur, *, label: str, system_key: str | None = None, sort_order: int = 0) -> dict:
    label = (label or "").strip()
    if not label:
        raise TagError(422, "label is required")
    sk = (system_key or "").strip() or None
    cur.execute(
        """INSERT INTO tag_categories (system_key, label, sort_order)
           VALUES (%s, %s, %s)""",
        (sk, label, int(sort_order)),
    )
    cid = int(cur.lastrowid)
    cur.execute("SELECT * FROM tag_categories WHERE id = %s", (cid,))
    return serialize_category(cur.fetchone())


# --- tags (definitions) -------------------------------------------------------


def _load_tag(cur, tag_id: int) -> dict:
    cur.execute("SELECT * FROM tags WHERE id = %s", (tag_id,))
    row = cur.fetchone()
    if not row:
        raise TagError(404, "Tag not found")
    return row


def _category_map(cur) -> dict[int, dict]:
    cats = list_categories(cur)
    return {c["id"]: c for c in cats}


def list_tags(cur, *, status: str | None = "active", include_retired: bool = False) -> list[dict]:
    cmap = _category_map(cur)
    if include_retired:
        cur.execute("SELECT * FROM tags ORDER BY label ASC")
    elif status is None:
        cur.execute("SELECT * FROM tags ORDER BY label ASC")
    else:
        st = status if status in VALID_STATUS else "active"
        cur.execute(
            "SELECT * FROM tags WHERE status = %s ORDER BY label ASC",
            (st,),
        )
    out = []
    for r in cur.fetchall():
        cat = cmap.get(int(r["category_id"])) if r.get("category_id") else None
        out.append(serialize_tag(r, category=cat))
    return out


def get_tag(cur, tag_id: int) -> dict:
    row = _load_tag(cur, tag_id)
    cat = None
    if row.get("category_id"):
        cur.execute("SELECT * FROM tag_categories WHERE id = %s", (row["category_id"],))
        c = cur.fetchone()
        if c:
            cat = serialize_category(c)
    return serialize_tag(row, category=cat)


def create_tag(
    cur,
    *,
    label: str,
    description: str | None = None,
    category_id: int | None = None,
    color: str | None = None,
    slug: str | None = None,
) -> dict:
    label = (label or "").strip()
    if not label:
        raise TagError(422, "label is required")
    if len(label) > 128:
        raise TagError(422, "label too long")
    slug_v = (slug or _slugify(label)).strip().lower()
    if not SLUG_RE.match(slug_v):
        raise TagError(422, f"invalid slug: {slug_v}")
    if category_id is not None:
        cur.execute("SELECT id FROM tag_categories WHERE id = %s", (category_id,))
        if not cur.fetchone():
            raise TagError(422, "category_id not found")
    try:
        cur.execute(
            """INSERT INTO tags (slug, label, description, category_id, color, status)
               VALUES (%s, %s, %s, %s, %s, 'active')""",
            (
                slug_v,
                label,
                (description or "").strip() or None,
                category_id,
                (color or "").strip() or None,
            ),
        )
    except Exception as e:
        raise TagError(409, f"tag conflict: {e}") from e
    return get_tag(cur, int(cur.lastrowid))


def update_tag(
    cur,
    tag_id: int,
    *,
    label: str | None = None,
    description: str | None = None,
    category_id: int | None = None,
    color: str | None = None,
    status: str | None = None,
    clear_category: bool = False,
) -> dict:
    row = _load_tag(cur, tag_id)
    new_label = label.strip() if label is not None else row["label"]
    new_desc = (
        description.strip() if description is not None else row.get("description")
    )
    if description is not None and not (description or "").strip():
        new_desc = None
    if clear_category:
        new_cat = None
    elif category_id is not None:
        cur.execute("SELECT id FROM tag_categories WHERE id = %s", (category_id,))
        if not cur.fetchone():
            raise TagError(422, "category_id not found")
        new_cat = category_id
    else:
        new_cat = row.get("category_id")
    new_color = color.strip() if color is not None else row.get("color")
    if color is not None and not (color or "").strip():
        new_color = None
    new_status = row["status"]
    if status is not None:
        st = status.strip().lower()
        if st not in VALID_STATUS:
            raise TagError(422, f"status must be one of {sorted(VALID_STATUS)}")
        new_status = st
    try:
        cur.execute(
            """UPDATE tags
               SET label = %s, description = %s, category_id = %s,
                   color = %s, status = %s
               WHERE id = %s""",
            (new_label, new_desc, new_cat, new_color, new_status, tag_id),
        )
    except Exception as e:
        raise TagError(409, f"tag conflict: {e}") from e
    return get_tag(cur, tag_id)


def retire_tag(cur, tag_id: int) -> dict:
    return update_tag(cur, tag_id, status="retired")


def delete_tag(cur, tag_id: int) -> None:
    _load_tag(cur, tag_id)
    cur.execute(
        "SELECT COUNT(*) AS n FROM tag_assignments WHERE tag_id = %s",
        (tag_id,),
    )
    n = int(cur.fetchone()["n"])
    if n > 0:
        raise TagError(
            409,
            f"Tag has {n} assignment(s); retire instead of delete",
            extra={"assignment_count": n},
        )
    cur.execute("DELETE FROM tags WHERE id = %s", (tag_id,))


def merge_tags(cur, *, source_tag_id: int, target_tag_id: int) -> dict:
    """Re-point assignments from source → target; retire source."""
    if source_tag_id == target_tag_id:
        raise TagError(422, "source and target must differ")
    src = _load_tag(cur, source_tag_id)
    tgt = _load_tag(cur, target_tag_id)
    if tgt["status"] != "active":
        raise TagError(422, "target tag must be active")
    # Re-point where no conflict; drop source rows that would duplicate target
    cur.execute(
        """SELECT object_type, object_id FROM tag_assignments WHERE tag_id = %s""",
        (target_tag_id,),
    )
    existing = {(r["object_type"], int(r["object_id"])) for r in cur.fetchall()}
    cur.execute(
        """SELECT id, object_type, object_id FROM tag_assignments WHERE tag_id = %s""",
        (source_tag_id,),
    )
    for r in cur.fetchall():
        key = (r["object_type"], int(r["object_id"]))
        if key in existing:
            cur.execute("DELETE FROM tag_assignments WHERE id = %s", (r["id"],))
        else:
            cur.execute(
                "UPDATE tag_assignments SET tag_id = %s WHERE id = %s",
                (target_tag_id, r["id"]),
            )
    cur.execute(
        """UPDATE tags SET status = 'retired', merged_into_tag_id = %s WHERE id = %s""",
        (target_tag_id, source_tag_id),
    )
    return {
        "source": serialize_tag(src),
        "target": get_tag(cur, target_tag_id),
    }


def usage_counts(cur) -> list[dict]:
    """Admin aggregate assignment counts per tag (no per-member breakdown)."""
    cur.execute(
        """SELECT t.id, t.slug, t.label, t.status,
                  COUNT(a.id) AS assignment_count
           FROM tags t
           LEFT JOIN tag_assignments a ON a.tag_id = t.id
           GROUP BY t.id
           ORDER BY assignment_count DESC, t.label ASC"""
    )
    return [
        {
            "tag_id": int(r["id"]),
            "slug": r["slug"],
            "label": r["label"],
            "status": r["status"],
            "assignment_count": int(r["assignment_count"]),
        }
        for r in cur.fetchall()
    ]


# --- assignments --------------------------------------------------------------


def _assert_object_type(object_type: str) -> str:
    ot = (object_type or "").strip()
    if ot not in VALID_OBJECT_TYPES:
        raise TagError(
            422,
            f"Invalid object_type. Allowed: {', '.join(sorted(VALID_OBJECT_TYPES))}",
        )
    return ot


def list_assignments_for_object(
    cur,
    *,
    object_type: str,
    object_id: int,
    identity_id: int | None = None,
) -> list[dict]:
    ot = _assert_object_type(object_type)
    oid = int(object_id)
    cur.execute(
        """SELECT a.*, t.slug, t.label, t.description, t.status AS tag_status,
                  t.category_id, t.color
           FROM tag_assignments a
           JOIN tags t ON t.id = a.tag_id
           WHERE a.object_type = %s AND a.object_id = %s
           ORDER BY t.label ASC""",
        (ot, oid),
    )
    rows = cur.fetchall()
    # Family B: if identity_id filter requested for member objects, enforce
    if ot in MEMBER_OBJECT_TYPES and identity_id is not None:
        rows = [
            r
            for r in rows
            if r.get("identity_id") is None or int(r["identity_id"]) == int(identity_id)
        ]
    cmap = _category_map(cur)
    out = []
    for r in rows:
        cat = cmap.get(int(r["category_id"])) if r.get("category_id") else None
        tag = {
            "id": int(r["tag_id"]),
            "slug": r["slug"],
            "label": r["label"],
            "description": r.get("description"),
            "status": r["tag_status"],
            "color": r.get("color"),
            "category": cat,
        }
        out.append(serialize_assignment(r, tag=tag))
    return out


def assign_tag(
    cur,
    *,
    tag_id: int,
    object_type: str,
    object_id: int,
    identity_id: int | None,
) -> dict:
    ot = _assert_object_type(object_type)
    oid = int(object_id)
    tag = _load_tag(cur, int(tag_id))
    if tag["status"] != "active":
        raise TagError(422, "Cannot assign a retired tag")
    if ot in MEMBER_OBJECT_TYPES:
        if identity_id is None:
            raise TagError(422, "identity_id required for member-owned objects")
        iid = int(identity_id)
    else:
        iid = None
    try:
        cur.execute(
            """INSERT INTO tag_assignments
                 (tag_id, object_type, object_id, identity_id, export_key)
               VALUES (%s, %s, %s, %s, %s)""",
            (int(tag_id), ot, oid, iid, _new_export_key()),
        )
    except Exception as e:
        # unique conflict — treat as idempotent get
        cur.execute(
            """SELECT * FROM tag_assignments
               WHERE tag_id = %s AND object_type = %s AND object_id = %s""",
            (int(tag_id), ot, oid),
        )
        row = cur.fetchone()
        if not row:
            raise TagError(409, f"assignment conflict: {e}") from e
        return serialize_assignment(row, tag=serialize_tag(tag))
    aid = int(cur.lastrowid)
    cur.execute("SELECT * FROM tag_assignments WHERE id = %s", (aid,))
    return serialize_assignment(cur.fetchone(), tag=serialize_tag(tag))


def unassign_tag(
    cur,
    *,
    tag_id: int,
    object_type: str,
    object_id: int,
    identity_id: int | None = None,
) -> None:
    ot = _assert_object_type(object_type)
    oid = int(object_id)
    cur.execute(
        """SELECT * FROM tag_assignments
           WHERE tag_id = %s AND object_type = %s AND object_id = %s""",
        (int(tag_id), ot, oid),
    )
    row = cur.fetchone()
    if not row:
        raise TagError(404, "Assignment not found")
    if (
        ot in MEMBER_OBJECT_TYPES
        and identity_id is not None
        and row.get("identity_id") is not None
        and int(row["identity_id"]) != int(identity_id)
    ):
        raise TagError(403, "Not your assignment")
    cur.execute("DELETE FROM tag_assignments WHERE id = %s", (row["id"],))


def set_assignments_for_object(
    cur,
    *,
    object_type: str,
    object_id: int,
    tag_ids: list[int],
    identity_id: int | None,
) -> list[dict]:
    """Replace full set of tags on an object (idempotent)."""
    ot = _assert_object_type(object_type)
    oid = int(object_id)
    wanted = {int(t) for t in tag_ids}
    current = list_assignments_for_object(
        cur, object_type=ot, object_id=oid, identity_id=identity_id
    )
    have = {int(a["tag_id"]) for a in current}
    for tid in have - wanted:
        unassign_tag(
            cur,
            tag_id=tid,
            object_type=ot,
            object_id=oid,
            identity_id=identity_id,
        )
    for tid in wanted - have:
        assign_tag(
            cur,
            tag_id=tid,
            object_type=ot,
            object_id=oid,
            identity_id=identity_id,
        )
    return list_assignments_for_object(
        cur, object_type=ot, object_id=oid, identity_id=identity_id
    )


def list_assignments_for_identity(cur, identity_id: int) -> list[dict]:
    """All Family B assignments for export/purge."""
    cur.execute(
        """SELECT a.*, t.slug, t.label, t.status AS tag_status
           FROM tag_assignments a
           JOIN tags t ON t.id = a.tag_id
           WHERE a.identity_id = %s
           ORDER BY a.object_type, a.object_id, t.label""",
        (int(identity_id),),
    )
    return [
        {
            **serialize_assignment(r),
            "tag_slug": r["slug"],
            "tag_label": r["label"],
            "tag_status": r["tag_status"],
        }
        for r in cur.fetchall()
    ]


def purge_assignments_for_identity(cur, identity_id: int) -> int:
    cur.execute(
        "DELETE FROM tag_assignments WHERE identity_id = %s",
        (int(identity_id),),
    )
    return int(cur.rowcount or 0)
