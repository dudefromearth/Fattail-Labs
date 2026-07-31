"""Tag Manager — two-tier vocabulary (Spec v0.2).

Platform ``tags`` = curated lexicon (admin).
``member_tags`` = each trader's personal vocabulary (Family B), seeded from
lexicon with immutable ``lexicon_key``. Members may auto-create labels;
near-duplicate is a hint, never a block. No P&amp;L correlation.
"""

from __future__ import annotations

import re
import secrets
from datetime import datetime, timezone
from typing import Any

# --- constants ----------------------------------------------------------------

VALID_STATUS = frozenset({"active", "retired"})
MEMBER_TAG_SOURCES = frozenset({"seeded", "member_created", "adopted"})
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
LABEL_MAX = 128
NEAR_DUP_THRESHOLD = 0.72  # soft hint only


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
        "lexicon_key": row.get("lexicon_key"),
        "status": row["status"],
        "merged_into_tag_id": (
            int(row["merged_into_tag_id"]) if row.get("merged_into_tag_id") else None
        ),
        "created_at": _iso(row.get("created_at")),
        "updated_at": _iso(row.get("updated_at")),
    }


def serialize_member_tag(row: dict, *, category: dict | None = None) -> dict[str, Any]:
    return {
        "id": int(row["id"]),
        "identity_id": int(row["identity_id"]),
        "label": row["label"],
        "description": row.get("description"),
        "category_id": int(row["category_id"]) if row.get("category_id") else None,
        "category": category,
        "color": row.get("color"),
        "lexicon_key": row.get("lexicon_key"),
        "source": row.get("source") or "member_created",
        "status": row["status"],
        "merged_into_tag_id": (
            int(row["merged_into_tag_id"]) if row.get("merged_into_tag_id") else None
        ),
        "export_key": row.get("export_key"),
        "usage_count": int(row["usage_count"]) if row.get("usage_count") is not None else None,
        "created_at": _iso(row.get("created_at")),
        "updated_at": _iso(row.get("updated_at")),
    }


def serialize_assignment(row: dict, *, tag: dict | None = None) -> dict[str, Any]:
    tid = row.get("tag_id")
    mtid = row.get("member_tag_id")
    return {
        "id": int(row["id"]),
        "tag_id": int(tid) if tid is not None else None,
        "member_tag_id": int(mtid) if mtid is not None else None,
        "object_type": row["object_type"],
        "object_id": int(row["object_id"]),
        "identity_id": int(row["identity_id"]) if row.get("identity_id") else None,
        "export_key": row.get("export_key"),
        "created_at": _iso(row.get("created_at")),
        "tag": tag,
    }


def _lexicon_key_from_label(label: str) -> str:
    s = label.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    return (s[:64] or "tag")


def _normalize_label(label: str) -> str:
    lab = " ".join((label or "").strip().split())
    if not lab:
        raise TagError(422, "label is required")
    if len(lab) > LABEL_MAX:
        raise TagError(422, f"label max {LABEL_MAX} characters")
    return lab


def _similarity(a: str, b: str) -> float:
    """Simple token Jaccard for near-duplicate hints (not a block)."""
    ta = set(re.findall(r"[a-z0-9]+", a.lower()))
    tb = set(re.findall(r"[a-z0-9]+", b.lower()))
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / len(ta | tb)


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
    lk = _lexicon_key_from_label(label)
    try:
        cur.execute(
            """INSERT INTO tags
                 (slug, label, description, category_id, color, lexicon_key, status)
               VALUES (%s, %s, %s, %s, %s, %s, 'active')""",
            (
                slug_v,
                label,
                (description or "").strip() or None,
                category_id,
                (color or "").strip() or None,
                lk,
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
        """SELECT a.*,
                  t.slug AS p_slug, t.label AS p_label, t.description AS p_description,
                  t.status AS p_status, t.category_id AS p_category_id, t.color AS p_color,
                  mt.label AS m_label, mt.description AS m_description,
                  mt.status AS m_status, mt.category_id AS m_category_id,
                  mt.color AS m_color, mt.lexicon_key AS m_lexicon_key,
                  mt.id AS m_id
           FROM tag_assignments a
           LEFT JOIN tags t ON t.id = a.tag_id
           LEFT JOIN member_tags mt ON mt.id = a.member_tag_id
           WHERE a.object_type = %s AND a.object_id = %s
           ORDER BY COALESCE(mt.label, t.label) ASC""",
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
        if r.get("m_id"):
            tag = {
                "id": int(r["m_id"]),
                "label": r["m_label"],
                "description": r.get("m_description"),
                "status": r.get("m_status"),
                "color": r.get("m_color"),
                "lexicon_key": r.get("m_lexicon_key"),
                "member_tag": True,
            }
            # Compatibility: expose as tag_id for older clients when only member id
            if r.get("tag_id") is None:
                r = dict(r)
                r["tag_id"] = int(r["m_id"])
        else:
            cat = (
                cmap.get(int(r["p_category_id"])) if r.get("p_category_id") else None
            )
            tag = {
                "id": int(r["tag_id"]) if r.get("tag_id") else None,
                "slug": r.get("p_slug"),
                "label": r.get("p_label"),
                "description": r.get("p_description"),
                "status": r.get("p_status"),
                "color": r.get("p_color"),
                "category": cat,
                "member_tag": False,
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
    n = int(cur.rowcount or 0)
    # Personal vocabulary (definitions)
    try:
        cur.execute(
            "DELETE FROM member_tags WHERE identity_id = %s",
            (int(identity_id),),
        )
        n += int(cur.rowcount or 0)
        cur.execute(
            "DELETE FROM member_tag_categories WHERE identity_id = %s",
            (int(identity_id),),
        )
        n += int(cur.rowcount or 0)
    except Exception:
        pass
    return n


# --- member personal vocabulary (Spec v0.2 two-tier) -------------------------


def ensure_member_vocabulary(cur, identity_id: int) -> dict[str, int]:
    """Seed personal categories + tags from platform lexicon once per identity.

    Deleted seeds are never re-seeded (member may adopt from lexicon later).
    """
    iid = int(identity_id)
    cur.execute(
        "SELECT COUNT(*) AS n FROM member_tag_categories WHERE identity_id = %s",
        (iid,),
    )
    if int(cur.fetchone()["n"] or 0) > 0:
        return {"seeded": 0, "already": 1}

    # Categories from platform
    cats = list_categories(cur)
    cat_map: dict[str, int] = {}  # system_key -> member category id
    for c in cats:
        sk = c.get("system_key")
        cur.execute(
            """INSERT INTO member_tag_categories
                 (identity_id, label, system_key, sort_order)
               VALUES (%s, %s, %s, %s)""",
            (iid, c["label"], sk, int(c.get("sort_order") or 0)),
        )
        if sk:
            cat_map[str(sk)] = int(cur.lastrowid)

    # Active lexicon terms
    platform = list_tags(cur, status="active")
    n = 0
    for t in platform:
        sk = None
        if t.get("category") and t["category"].get("system_key"):
            sk = t["category"]["system_key"]
        elif t.get("category_id"):
            # resolve system_key
            for c in cats:
                if c["id"] == t["category_id"]:
                    sk = c.get("system_key")
                    break
        mcat = cat_map.get(str(sk)) if sk else None
        lk = t.get("lexicon_key") or _lexicon_key_from_label(t["label"])
        try:
            cur.execute(
                """INSERT INTO member_tags
                     (identity_id, category_id, label, description, color,
                      lexicon_key, source, status, export_key)
                   VALUES (%s, %s, %s, %s, %s, %s, 'seeded', 'active', %s)""",
                (
                    iid,
                    mcat,
                    t["label"],
                    t.get("description"),
                    t.get("color"),
                    lk,
                    _new_export_key(),
                ),
            )
            n += 1
        except Exception:
            continue
    return {"seeded": n, "already": 0}


def list_member_categories(cur, identity_id: int) -> list[dict]:
    ensure_member_vocabulary(cur, identity_id)
    cur.execute(
        """SELECT id, identity_id, label, system_key, sort_order, created_at
           FROM member_tag_categories
           WHERE identity_id = %s
           ORDER BY sort_order ASC, id ASC""",
        (int(identity_id),),
    )
    return [
        {
            "id": int(r["id"]),
            "label": r["label"],
            "system_key": r.get("system_key"),
            "sort_order": int(r.get("sort_order") or 0),
        }
        for r in cur.fetchall() or []
    ]


def list_member_tags(
    cur,
    identity_id: int,
    *,
    include_retired: bool = False,
    with_usage: bool = False,
) -> list[dict]:
    ensure_member_vocabulary(cur, identity_id)
    iid = int(identity_id)
    cats = {c["id"]: c for c in list_member_categories(cur, iid)}
    status_clause = "" if include_retired else "AND t.status = 'active'"
    if with_usage:
        cur.execute(
            f"""SELECT t.*,
                      (SELECT COUNT(*) FROM tag_assignments a
                        WHERE a.member_tag_id = t.id) AS usage_count
                FROM member_tags t
               WHERE t.identity_id = %s
                 {status_clause}
               ORDER BY t.label ASC""",
            (iid,),
        )
    else:
        cur.execute(
            f"""SELECT t.* FROM member_tags t
               WHERE t.identity_id = %s
                 {status_clause}
               ORDER BY t.label ASC""",
            (iid,),
        )
    rows = list(cur.fetchall() or [])
    out = []
    for r in rows:
        cat = None
        if r.get("category_id") and int(r["category_id"]) in cats:
            cat = cats[int(r["category_id"])]
        out.append(serialize_member_tag(r, category=cat))
    return out


def near_duplicate_hints(
    cur, identity_id: int, label: str
) -> list[dict[str, Any]]:
    """Soft near-dup list — never blocks create."""
    lab = _normalize_label(label)
    tags = list_member_tags(cur, identity_id, include_retired=False)
    hits = []
    for t in tags:
        s = _similarity(lab, t["label"])
        if s >= NEAR_DUP_THRESHOLD or lab.lower() == t["label"].lower():
            hits.append({"tag": t, "score": round(s, 3)})
    hits.sort(key=lambda x: -x["score"])
    return hits[:5]


def resolve_or_create_member_tag(
    cur,
    identity_id: int,
    label: str,
    *,
    allow_create: bool = True,
) -> dict[str, Any]:
    """Resolve label to member tag; optionally auto-create (Spec §6.1)."""
    lab = _normalize_label(label)
    ensure_member_vocabulary(cur, identity_id)
    iid = int(identity_id)
    cur.execute(
        """SELECT * FROM member_tags
           WHERE identity_id = %s AND label = %s
           LIMIT 1""",
        (iid, lab),
    )
    row = cur.fetchone()
    if row:
        if row["status"] != "active":
            # Reactivate retired on explicit use
            cur.execute(
                """UPDATE member_tags SET status = 'active'
                   WHERE id = %s AND identity_id = %s""",
                (int(row["id"]), iid),
            )
            row["status"] = "active"
        return {
            "tag": serialize_member_tag(row),
            "created": False,
            "near_duplicates": [],
        }

    hints = near_duplicate_hints(cur, iid, lab)
    if not allow_create:
        raise TagError(404, "Tag not found", extra={"near_duplicates": hints})

    # Default category: first behavior or first category
    cats = list_member_categories(cur, iid)
    default_cat = None
    for c in cats:
        if c.get("system_key") == "behavior":
            default_cat = c["id"]
            break
    if default_cat is None and cats:
        default_cat = cats[0]["id"]

    cur.execute(
        """INSERT INTO member_tags
             (identity_id, category_id, label, description, color,
              lexicon_key, source, status, export_key)
           VALUES (%s, %s, %s, NULL, NULL, NULL, 'member_created', 'active', %s)""",
        (iid, default_cat, lab, _new_export_key()),
    )
    tid = int(cur.lastrowid)
    cur.execute("SELECT * FROM member_tags WHERE id = %s", (tid,))
    return {
        "tag": serialize_member_tag(cur.fetchone()),
        "created": True,
        "near_duplicates": hints,
    }


def adopt_lexicon_term(cur, identity_id: int, lexicon_key: str) -> dict:
    """Adopt a platform lexicon term into personal vocabulary (§5 re-adopt)."""
    ensure_member_vocabulary(cur, identity_id)
    iid = int(identity_id)
    lk = (lexicon_key or "").strip()
    if not lk:
        raise TagError(422, "lexicon_key required")
    cur.execute(
        """SELECT * FROM member_tags
           WHERE identity_id = %s AND lexicon_key = %s LIMIT 1""",
        (iid, lk),
    )
    existing = cur.fetchone()
    if existing:
        if existing["status"] != "active":
            cur.execute(
                """UPDATE member_tags SET status = 'active', source = 'adopted'
                   WHERE id = %s""",
                (int(existing["id"]),),
            )
            existing["status"] = "active"
            existing["source"] = "adopted"
        return serialize_member_tag(existing)

    cur.execute(
        "SELECT * FROM tags WHERE lexicon_key = %s AND status = 'active' LIMIT 1",
        (lk,),
    )
    plat = cur.fetchone()
    if not plat:
        raise TagError(404, "Lexicon term not found")

    cats = list_member_categories(cur, iid)
    mcat = None
    if plat.get("category_id"):
        cur.execute(
            "SELECT system_key FROM tag_categories WHERE id = %s",
            (int(plat["category_id"]),),
        )
        crow = cur.fetchone()
        sk = crow.get("system_key") if crow else None
        for c in cats:
            if sk and c.get("system_key") == sk:
                mcat = c["id"]
                break

    cur.execute(
        """INSERT INTO member_tags
             (identity_id, category_id, label, description, color,
              lexicon_key, source, status, export_key)
           VALUES (%s, %s, %s, %s, %s, %s, 'adopted', 'active', %s)""",
        (
            iid,
            mcat,
            plat["label"],
            plat.get("description"),
            plat.get("color"),
            lk,
            _new_export_key(),
        ),
    )
    cur.execute("SELECT * FROM member_tags WHERE id = %s", (int(cur.lastrowid),))
    return serialize_member_tag(cur.fetchone())


def assign_member_tag(
    cur,
    *,
    member_tag_id: int,
    object_type: str,
    object_id: int,
    identity_id: int,
) -> dict:
    ot = _assert_object_type(object_type)
    if ot not in MEMBER_OBJECT_TYPES:
        raise TagError(422, "member_tag_id only for member-owned objects")
    iid = int(identity_id)
    cur.execute(
        "SELECT * FROM member_tags WHERE id = %s AND identity_id = %s",
        (int(member_tag_id), iid),
    )
    mt = cur.fetchone()
    if not mt:
        raise TagError(404, "Member tag not found")
    if mt["status"] != "active":
        raise TagError(422, "Cannot assign a retired tag")

    # Prefer platform tag_id when lexicon-linked (legacy readers)
    platform_tag_id = None
    if mt.get("lexicon_key"):
        cur.execute(
            "SELECT id FROM tags WHERE lexicon_key = %s LIMIT 1",
            (mt["lexicon_key"],),
        )
        pr = cur.fetchone()
        if pr:
            platform_tag_id = int(pr["id"])

    try:
        cur.execute(
            """INSERT INTO tag_assignments
                 (tag_id, member_tag_id, object_type, object_id, identity_id, export_key)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (
                platform_tag_id,
                int(member_tag_id),
                ot,
                int(object_id),
                iid,
                _new_export_key(),
            ),
        )
    except Exception as e:
        cur.execute(
            """SELECT * FROM tag_assignments
               WHERE member_tag_id = %s AND object_type = %s AND object_id = %s""",
            (int(member_tag_id), ot, int(object_id)),
        )
        row = cur.fetchone()
        if not row:
            raise TagError(409, f"assignment conflict: {e}") from e
        return serialize_assignment(row, tag=serialize_member_tag(mt))
    aid = int(cur.lastrowid)
    cur.execute("SELECT * FROM tag_assignments WHERE id = %s", (aid,))
    return serialize_assignment(cur.fetchone(), tag=serialize_member_tag(mt))


def set_member_assignments_for_object(
    cur,
    *,
    object_type: str,
    object_id: int,
    member_tag_ids: list[int],
    identity_id: int,
) -> list[dict]:
    """Replace Family B assignments using personal vocabulary ids."""
    ot = _assert_object_type(object_type)
    oid = int(object_id)
    iid = int(identity_id)
    wanted = {int(t) for t in member_tag_ids}

    cur.execute(
        """SELECT * FROM tag_assignments
           WHERE object_type = %s AND object_id = %s AND identity_id = %s""",
        (ot, oid, iid),
    )
    current = list(cur.fetchall() or [])
    have = set()
    for r in current:
        mid = r.get("member_tag_id")
        if mid is not None:
            have.add(int(mid))
        elif r.get("tag_id") is not None:
            # Map legacy platform assignment → member tag via lexicon_key
            cur.execute(
                """SELECT mt.id FROM member_tags mt
                   JOIN tags pt ON pt.lexicon_key = mt.lexicon_key
                  WHERE mt.identity_id = %s AND pt.id = %s
                  LIMIT 1""",
                (iid, int(r["tag_id"])),
            )
            m = cur.fetchone()
            if m:
                have.add(int(m["id"]))

    for mid in have - wanted:
        cur.execute(
            """DELETE FROM tag_assignments
               WHERE object_type = %s AND object_id = %s AND identity_id = %s
                 AND (member_tag_id = %s
                      OR (member_tag_id IS NULL AND tag_id IN (
                            SELECT pt.id FROM tags pt
                            JOIN member_tags mt ON mt.lexicon_key = pt.lexicon_key
                           WHERE mt.id = %s AND mt.identity_id = %s
                      )))""",
            (ot, oid, iid, mid, mid, iid),
        )
    for mid in wanted - have:
        assign_member_tag(
            cur,
            member_tag_id=mid,
            object_type=ot,
            object_id=oid,
            identity_id=iid,
        )
    return list_assignments_for_object(
        cur, object_type=ot, object_id=oid, identity_id=iid
    )


def member_usage_counts(cur, identity_id: int) -> dict[int, int]:
    """Personal usage counts by member_tag_id (Family B — own only)."""
    ensure_member_vocabulary(cur, identity_id)
    cur.execute(
        """SELECT member_tag_id AS id, COUNT(*) AS n
           FROM tag_assignments
           WHERE identity_id = %s AND member_tag_id IS NOT NULL
           GROUP BY member_tag_id""",
        (int(identity_id),),
    )
    out = {int(r["id"]): int(r["n"]) for r in cur.fetchall() or []}
    # Legacy platform-tag assignments counted against matching lexicon_key
    cur.execute(
        """SELECT mt.id AS id, COUNT(*) AS n
           FROM tag_assignments a
           JOIN tags pt ON pt.id = a.tag_id
           JOIN member_tags mt
             ON mt.identity_id = a.identity_id
            AND mt.lexicon_key = pt.lexicon_key
          WHERE a.identity_id = %s
            AND a.member_tag_id IS NULL
            AND a.tag_id IS NOT NULL
          GROUP BY mt.id""",
        (int(identity_id),),
    )
    for r in cur.fetchall() or []:
        mid = int(r["id"])
        out[mid] = out.get(mid, 0) + int(r["n"])
    return out
