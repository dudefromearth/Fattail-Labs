"""Practice Own spine — Playbook + Campaign (Trader Development Phase 1).

Family B. Fail loud. No P&L. No rule engine.
"""

from __future__ import annotations

import json
import secrets
from datetime import datetime, timezone
from typing import Any


PLAYBOOK_STATUSES = frozenset({"active", "archived"})
CAMPAIGN_STATUSES = frozenset({"planned", "active", "completed", "abandoned"})
# planned → active → completed; abandoned from planned|active; terminals reopen = new season
_CAMPAIGN_TRANSITIONS: dict[str, frozenset[str]] = {
    "planned": frozenset({"active", "abandoned"}),
    "active": frozenset({"completed", "abandoned"}),
    "completed": frozenset(),
    "abandoned": frozenset(),
}


class PracticeSpineError(Exception):
    def __init__(self, code: int, detail: str, *, extra: dict | None = None):
        self.code = code
        self.detail = detail
        self.extra = extra or {}
        super().__init__(detail)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _iso(v: Any) -> str | None:
    if v is None:
        return None
    if isinstance(v, datetime):
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")
        return v.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    return str(v)


def _parse_dt(raw: Any) -> datetime | None:
    if raw is None or raw == "":
        return None
    if isinstance(raw, datetime):
        return raw.replace(tzinfo=None) if raw.tzinfo else raw
    s = str(raw).replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(s)
        return dt.replace(tzinfo=None) if dt.tzinfo else dt
    except ValueError as exc:
        raise PracticeSpineError(422, f"invalid datetime: {raw!r}") from exc


def _export_key(prefix: str) -> str:
    return f"{prefix}-{secrets.token_hex(8)}"


def _json_loads(raw: Any) -> dict | None:
    if raw is None:
        return None
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str):
        try:
            v = json.loads(raw)
            return v if isinstance(v, dict) else None
        except json.JSONDecodeError:
            return None
    return None


# ── Playbook ────────────────────────────────────────────────────────────────


def serialize_playbook(row: dict) -> dict:
    return {
        "id": int(row["id"]),
        "title": row.get("title") or "",
        "body_md": row.get("body_md") or "",
        "structured": _json_loads(row.get("structured_json")) or {},
        "status": row.get("status") or "active",
        "export_key": row.get("export_key"),
        "created_at": _iso(row.get("created_at")),
        "updated_at": _iso(row.get("updated_at")),
    }


def list_playbooks(cur, identity_id: int, *, include_archived: bool = False) -> list[dict]:
    if include_archived:
        cur.execute(
            """SELECT * FROM member_playbook_entries
               WHERE identity_id = %s ORDER BY updated_at DESC, id DESC""",
            (identity_id,),
        )
    else:
        cur.execute(
            """SELECT * FROM member_playbook_entries
               WHERE identity_id = %s AND status = 'active'
               ORDER BY updated_at DESC, id DESC""",
            (identity_id,),
        )
    return [serialize_playbook(r) for r in cur.fetchall() or []]


def get_playbook(cur, identity_id: int, entry_id: int) -> dict | None:
    cur.execute(
        """SELECT * FROM member_playbook_entries
           WHERE id = %s AND identity_id = %s""",
        (entry_id, identity_id),
    )
    row = cur.fetchone()
    return serialize_playbook(row) if row else None


def create_playbook(
    cur,
    identity_id: int,
    *,
    title: str,
    body_md: str = "",
    structured: dict | None = None,
) -> dict:
    title = (title or "").strip()
    if not title:
        raise PracticeSpineError(422, "title is required")
    if len(title) > 255:
        raise PracticeSpineError(422, "title max 255 characters")
    sj = json.dumps(structured) if isinstance(structured, dict) and structured else None
    key = _export_key("pb")
    cur.execute(
        """INSERT INTO member_playbook_entries
             (identity_id, title, body_md, structured_json, status, export_key)
           VALUES (%s, %s, %s, %s, 'active', %s)""",
        (identity_id, title, body_md or "", sj, key),
    )
    eid = int(cur.lastrowid)
    out = get_playbook(cur, identity_id, eid)
    assert out is not None
    return out


def patch_playbook(
    cur,
    identity_id: int,
    entry_id: int,
    *,
    title: str | None = None,
    body_md: str | None = None,
    structured: dict | None = None,
    status: str | None = None,
) -> dict:
    row = get_playbook(cur, identity_id, entry_id)
    if not row:
        raise PracticeSpineError(404, "Playbook entry not found")
    new_title = row["title"] if title is None else (title or "").strip()
    if not new_title:
        raise PracticeSpineError(422, "title is required")
    new_body = row["body_md"] if body_md is None else (body_md or "")
    new_status = row["status"] if status is None else status.strip().lower()
    if new_status not in PLAYBOOK_STATUSES:
        raise PracticeSpineError(422, "status must be active|archived")
    if structured is None:
        sj = json.dumps(row.get("structured") or {}) if row.get("structured") else None
        # keep existing from DB
        cur.execute(
            "SELECT structured_json FROM member_playbook_entries WHERE id = %s",
            (entry_id,),
        )
        existing = cur.fetchone()
        sj = existing.get("structured_json") if existing else None
    else:
        sj = json.dumps(structured) if structured else None
    cur.execute(
        """UPDATE member_playbook_entries
           SET title = %s, body_md = %s, structured_json = %s, status = %s
           WHERE id = %s AND identity_id = %s""",
        (new_title[:255], new_body, sj, new_status, entry_id, identity_id),
    )
    out = get_playbook(cur, identity_id, entry_id)
    assert out is not None
    return out


def assert_playbook_owned(cur, identity_id: int, entry_id: int | None) -> None:
    if entry_id is None:
        return
    cur.execute(
        """SELECT id FROM member_playbook_entries
           WHERE id = %s AND identity_id = %s""",
        (entry_id, identity_id),
    )
    if not cur.fetchone():
        raise PracticeSpineError(404, "Playbook entry not found")


# ── Campaigns ───────────────────────────────────────────────────────────────


def serialize_campaign(cur, row: dict) -> dict:
    cid = int(row["id"])
    cur.execute(
        """SELECT playbook_entry_id FROM member_practice_campaign_playbooks
           WHERE campaign_id = %s ORDER BY playbook_entry_id""",
        (cid,),
    )
    pids = [int(r["playbook_entry_id"]) for r in cur.fetchall() or []]
    return {
        "id": cid,
        "title": row.get("title") or "",
        "status": row.get("status") or "planned",
        "starts_at": _iso(row.get("starts_at")),
        "ends_at": _iso(row.get("ends_at")),
        "playbook_entry_ids": pids,
        "export_key": row.get("export_key"),
        "created_at": _iso(row.get("created_at")),
        "updated_at": _iso(row.get("updated_at")),
    }


def list_campaigns(cur, identity_id: int) -> list[dict]:
    cur.execute(
        """SELECT * FROM member_practice_campaigns
           WHERE identity_id = %s
           ORDER BY
             CASE status
               WHEN 'active' THEN 0
               WHEN 'planned' THEN 1
               WHEN 'completed' THEN 2
               ELSE 3
             END,
             updated_at DESC, id DESC""",
        (identity_id,),
    )
    return [serialize_campaign(cur, r) for r in cur.fetchall() or []]


def get_campaign(cur, identity_id: int, campaign_id: int) -> dict | None:
    cur.execute(
        """SELECT * FROM member_practice_campaigns
           WHERE id = %s AND identity_id = %s""",
        (campaign_id, identity_id),
    )
    row = cur.fetchone()
    return serialize_campaign(cur, row) if row else None


def get_active_campaign(cur, identity_id: int) -> dict | None:
    cur.execute(
        """SELECT * FROM member_practice_campaigns
           WHERE identity_id = %s AND status = 'active'
           ORDER BY id DESC LIMIT 1""",
        (identity_id,),
    )
    row = cur.fetchone()
    return serialize_campaign(cur, row) if row else None


def _set_campaign_playbooks(
    cur, identity_id: int, campaign_id: int, playbook_ids: list[int]
) -> None:
    cleaned: list[int] = []
    for raw in playbook_ids:
        try:
            pid = int(raw)
        except (TypeError, ValueError):
            continue
        assert_playbook_owned(cur, identity_id, pid)
        if pid not in cleaned:
            cleaned.append(pid)
    cur.execute(
        "DELETE FROM member_practice_campaign_playbooks WHERE campaign_id = %s",
        (campaign_id,),
    )
    for pid in cleaned:
        cur.execute(
            """INSERT INTO member_practice_campaign_playbooks
                 (campaign_id, playbook_entry_id) VALUES (%s, %s)""",
            (campaign_id, pid),
        )


def create_campaign(
    cur,
    identity_id: int,
    *,
    title: str,
    starts_at: Any = None,
    ends_at: Any = None,
    playbook_entry_ids: list[int] | None = None,
    activate: bool = False,
) -> dict:
    title = (title or "").strip()
    if not title:
        raise PracticeSpineError(422, "title is required")
    start = _parse_dt(starts_at)
    end = _parse_dt(ends_at)
    if start and end and end < start:
        raise PracticeSpineError(422, "ends_at must be on or after starts_at")
    status = "planned"
    if activate:
        _ensure_single_active_slot(cur, identity_id)
        status = "active"
    key = _export_key("camp")
    cur.execute(
        """INSERT INTO member_practice_campaigns
             (identity_id, title, status, starts_at, ends_at, export_key)
           VALUES (%s, %s, %s, %s, %s, %s)""",
        (identity_id, title[:255], status, start, end, key),
    )
    cid = int(cur.lastrowid)
    if playbook_entry_ids is not None:
        _set_campaign_playbooks(cur, identity_id, cid, playbook_entry_ids)
    out = get_campaign(cur, identity_id, cid)
    assert out is not None
    return out


def _ensure_single_active_slot(cur, identity_id: int, *, except_id: int | None = None) -> None:
    cur.execute(
        """SELECT id FROM member_practice_campaigns
           WHERE identity_id = %s AND status = 'active'""",
        (identity_id,),
    )
    rows = cur.fetchall() or []
    for r in rows:
        if except_id is not None and int(r["id"]) == int(except_id):
            continue
        raise PracticeSpineError(
            409,
            "Only one active campaign at a time — complete or abandon the current season first",
            extra={"active_campaign_id": int(r["id"])},
        )


def patch_campaign(
    cur,
    identity_id: int,
    campaign_id: int,
    *,
    title: str | None = None,
    starts_at: Any = ...,
    ends_at: Any = ...,
    status: str | None = None,
    playbook_entry_ids: list[int] | None = None,
) -> dict:
    cur.execute(
        """SELECT * FROM member_practice_campaigns
           WHERE id = %s AND identity_id = %s""",
        (campaign_id, identity_id),
    )
    row = cur.fetchone()
    if not row:
        raise PracticeSpineError(404, "Campaign not found")
    cur_status = str(row["status"] or "planned")
    new_title = row["title"] if title is None else (title or "").strip()
    if not new_title:
        raise PracticeSpineError(422, "title is required")
    new_start = row["starts_at"] if starts_at is ... else _parse_dt(starts_at)
    new_end = row["ends_at"] if ends_at is ... else _parse_dt(ends_at)
    if new_start and new_end and new_end < new_start:
        raise PracticeSpineError(422, "ends_at must be on or after starts_at")
    new_status = cur_status if status is None else status.strip().lower()
    if new_status not in CAMPAIGN_STATUSES:
        raise PracticeSpineError(422, "invalid campaign status")
    if new_status != cur_status:
        allowed = _CAMPAIGN_TRANSITIONS.get(cur_status, frozenset())
        if new_status not in allowed:
            raise PracticeSpineError(
                422,
                f"cannot transition campaign from {cur_status!r} to {new_status!r}",
            )
        if new_status == "active":
            _ensure_single_active_slot(cur, identity_id, except_id=campaign_id)
    cur.execute(
        """UPDATE member_practice_campaigns
           SET title = %s, starts_at = %s, ends_at = %s, status = %s
           WHERE id = %s AND identity_id = %s""",
        (new_title[:255], new_start, new_end, new_status, campaign_id, identity_id),
    )
    if playbook_entry_ids is not None:
        _set_campaign_playbooks(cur, identity_id, campaign_id, playbook_entry_ids)
    out = get_campaign(cur, identity_id, campaign_id)
    assert out is not None
    return out


def assert_campaign_owned(cur, identity_id: int, campaign_id: int | None) -> None:
    if campaign_id is None:
        return
    cur.execute(
        """SELECT id FROM member_practice_campaigns
           WHERE id = %s AND identity_id = %s""",
        (campaign_id, identity_id),
    )
    if not cur.fetchone():
        raise PracticeSpineError(404, "Campaign not found")
