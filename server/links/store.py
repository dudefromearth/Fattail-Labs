"""One row per link, updated in place (LK-L1).

owner has no parameter and no statement writes it.
A fence failure stores nothing and does not call reachability.
A reachability failure after a passing fence is a warning; the row is stored.
Slug is generated here and is not an update field.
"""

from __future__ import annotations

import json

import pymysql

from links.fence import assert_destination_storable, reachability
from links.slug import new_slug

_LABEL_MAX = 255
_DEST_MAX = 2048
_PLACEMENT_KEYS = ("source", "medium", "campaign", "placement")


def create_link(
    cur,
    *,
    destination,
    label,
    static=False,
    design=None,
    placement=None,
) -> dict:
    destination = _destination(destination)
    label = _label(label)
    assert_destination_storable(destination)
    warning = reachability(destination)
    source, medium, campaign, place = _placement(placement)
    design_json = _design(design)
    flag = 1 if static else 0
    for _ in range(8):
        slug = new_slug()
        try:
            cur.execute(
                """
                INSERT INTO links (
                    slug, destination, label, active, `static`,
                    source, medium, campaign, placement, design_json
                ) VALUES (%s, %s, %s, 1, %s, %s, %s, %s, %s, %s)
                """,
                (slug, destination, label, flag, source, medium, campaign, place, design_json),
            )
        except pymysql.err.IntegrityError:
            continue
        row = get_link(cur, slug)
        if row is None:
            raise RuntimeError("link insert did not read back")
        row["warning"] = warning
        return row
    raise RuntimeError("slug space exhausted")


def update_link(
    cur,
    slug,
    *,
    destination=None,
    label=None,
    active=None,
    design=None,
    placement=None,
) -> dict:
    current = get_link(cur, slug)
    if current is None:
        raise LookupError("unknown link")
    warning = None
    sets: list[str] = []
    params: list = []
    if destination is not None:
        destination = _destination(destination)
        assert_destination_storable(destination)
        warning = reachability(destination)
        sets.append("destination=%s")
        params.append(destination)
    if label is not None:
        sets.append("label=%s")
        params.append(_label(label))
    if active is not None:
        sets.append("active=%s")
        params.append(1 if active else 0)
    if design is not None:
        sets.append("design_json=%s")
        params.append(_design(design))
    if placement is not None:
        source, medium, campaign, place = _placement(placement)
        sets.extend(["source=%s", "medium=%s", "campaign=%s", "placement=%s"])
        params.extend([source, medium, campaign, place])
    if sets:
        params.append(current["slug"])
        cur.execute(f"UPDATE links SET {', '.join(sets)} WHERE slug=%s", params)
    row = get_link(cur, current["slug"])
    if row is None:
        raise RuntimeError("link update did not read back")
    row["warning"] = warning
    return row


def get_link(cur, slug) -> dict | None:
    if not isinstance(slug, str) or len(slug) != 6:
        return None
    cur.execute(
        """
        SELECT slug, destination, label, active, `static` AS static_flag,
               source, medium, campaign, placement, owner, design_json,
               created_at, updated_at
        FROM links
        WHERE slug=%s
        """,
        (slug,),
    )
    row = cur.fetchone()
    if row is None:
        return None
    return _public_row(row)


def _public_row(row: dict) -> dict:
    design = row.get("design_json")
    if isinstance(design, (bytes, bytearray)):
        design = design.decode("utf-8")
    if isinstance(design, str):
        design = json.loads(design) if design else None
    return {
        "slug": row["slug"],
        "destination": row["destination"],
        "label": row["label"],
        "active": bool(row["active"]),
        "static": bool(row["static_flag"]),
        "source": row["source"],
        "medium": row["medium"],
        "campaign": row["campaign"],
        "placement": row["placement"],
        "owner": row["owner"],
        "design": design,
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def _destination(destination) -> str:
    if not isinstance(destination, str):
        raise TypeError("destination must be a string")
    text = destination.strip()
    if not text or len(text) > _DEST_MAX:
        raise ValueError("destination length")
    return text


def _label(label) -> str:
    if not isinstance(label, str):
        raise TypeError("label must be a string")
    text = label.strip()
    if not text or len(text) > _LABEL_MAX:
        raise ValueError("label length")
    return text


def _placement(placement) -> tuple:
    if placement is None:
        return (None, None, None, None)
    if not isinstance(placement, dict):
        raise TypeError("placement must be a dict or None")
    unknown = set(placement) - set(_PLACEMENT_KEYS)
    if unknown:
        raise ValueError("unknown placement field")
    values = []
    for key in _PLACEMENT_KEYS:
        value = placement.get(key)
        if value is None:
            values.append(None)
            continue
        if not isinstance(value, str):
            raise TypeError(f"{key} must be a string")
        text = value.strip()
        if not text:
            values.append(None)
            continue
        if len(text) > 255:
            raise ValueError(f"{key} is too long")
        values.append(text)
    return tuple(values)


def _design(design):
    if design is None:
        return None
    try:
        encoded = json.dumps(design, separators=(",", ":"), ensure_ascii=True)
    except TypeError as exc:
        raise TypeError("design must be JSON") from exc
    if len(encoded) > 65535:
        raise ValueError("design is too long")
    return encoded
