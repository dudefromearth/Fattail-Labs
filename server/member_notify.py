"""Member notifications — in-app inbox (Family B).

Spec: Journal Retrospective v0.7.1 §14 · Mike channel policy interim lock:
  - Primary channel: **in_app**
  - Email: not used for Family B material (trade counts, deviations, tags)
    without a Mike-approved payload. email_status stays ``skipped``.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any
from zoneinfo import ZoneInfo

import db

log = logging.getLogger("labs.member_notify")

# Mike · Coach lock (Spec §20 item 11)
CHANNEL_POLICY = {
    "primary": "in_app",
    "email_for_family_b_material": False,
    "email_allowed_payload": "none_until_mike_approved",
    "note": (
        "Trade counts, deviation counts, and tag names are Family B. "
        "In-app only until email payload is explicitly approved."
    ),
}

KIND_RETRO_MATERIAL = "retrospective.material_ready"

# US cash equity regular session (approx) — America/New_York
_NY = ZoneInfo("America/New_York")
RTH_OPEN_MINUTES = 9 * 60 + 30  # 09:30
RTH_CLOSE_MINUTES = 16 * 60  # 16:00


class MemberNotifyError(Exception):
    def __init__(self, code: int, detail: str):
        self.code = code
        self.detail = detail
        super().__init__(detail)


def channel_policy() -> dict[str, Any]:
    return dict(CHANNEL_POLICY)


def is_regular_trading_hours(now: datetime | None = None) -> bool:
    """True during weekday RTH in America/New_York (Spec §14 never during market hours)."""
    dt = now or datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    local = dt.astimezone(_NY)
    if local.weekday() >= 5:  # Sat/Sun
        return False
    minutes = local.hour * 60 + local.minute
    return RTH_OPEN_MINUTES <= minutes < RTH_CLOSE_MINUTES


def _iso(dt: Any) -> str | None:
    if dt is None:
        return None
    if isinstance(dt, datetime):
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc).isoformat()
        return dt.isoformat()
    return str(dt)


def serialize_notification(row: dict) -> dict[str, Any]:
    payload = row.get("payload_json")
    if isinstance(payload, (bytes, bytearray)):
        payload = payload.decode("utf-8")
    if isinstance(payload, str):
        try:
            payload = json.loads(payload)
        except json.JSONDecodeError:
            payload = None
    return {
        "id": int(row["id"]),
        "kind": row["kind"],
        "title": row["title"],
        "body": row["body"],
        "href": row["href"],
        "channel": row.get("channel") or "in_app",
        "period_key": row.get("period_key"),
        "resource_type": row.get("resource_type"),
        "resource_id": row.get("resource_id"),
        "payload": payload,
        "email_status": row.get("email_status") or "skipped",
        "suppressed_reason": row.get("suppressed_reason"),
        "read_at": _iso(row.get("read_at")),
        "created_at": _iso(row.get("created_at")),
    }


def list_for_identity(
    cur,
    identity_id: int,
    *,
    unread_only: bool = False,
    kind: str | None = None,
    limit: int = 50,
) -> list[dict]:
    limit = max(1, min(int(limit), 100))
    sql = """SELECT id, kind, title, body, href, channel, period_key,
                    resource_type, resource_id, payload_json, email_status,
                    suppressed_reason, read_at, created_at
             FROM member_notifications
             WHERE identity_id = %s
               AND suppressed_reason IS NULL"""
    params: list[Any] = [int(identity_id)]
    if unread_only:
        sql += " AND read_at IS NULL"
    if kind:
        sql += " AND kind = %s"
        params.append(kind)
    sql += " ORDER BY id DESC LIMIT %s"
    params.append(limit)
    cur.execute(sql, tuple(params))
    return [serialize_notification(r) for r in cur.fetchall() or []]


def unread_count(cur, identity_id: int) -> int:
    cur.execute(
        """SELECT COUNT(*) AS n FROM member_notifications
           WHERE identity_id = %s AND read_at IS NULL
             AND suppressed_reason IS NULL""",
        (int(identity_id),),
    )
    return int(cur.fetchone()["n"] or 0)


def mark_read(cur, identity_id: int, notification_id: int) -> bool:
    cur.execute(
        """UPDATE member_notifications
           SET read_at = UTC_TIMESTAMP()
           WHERE id = %s AND identity_id = %s AND read_at IS NULL""",
        (int(notification_id), int(identity_id)),
    )
    return cur.rowcount > 0


def has_period_notification(
    cur, identity_id: int, *, kind: str, period_key: str
) -> bool:
    cur.execute(
        """SELECT id FROM member_notifications
           WHERE identity_id = %s AND kind = %s AND period_key = %s
           LIMIT 1""",
        (int(identity_id), kind, period_key),
    )
    return cur.fetchone() is not None


def create_in_app(
    cur,
    *,
    identity_id: int,
    kind: str,
    title: str,
    body: str,
    href: str,
    period_key: str,
    resource_type: str | None = None,
    resource_id: str | None = None,
    payload: dict | None = None,
) -> dict | None:
    """Insert in-app notification. Idempotent on (identity, kind, period_key).

    Email is never sent for Family B material (channel policy).
    Returns None if already existed (once-per-period).
    """
    kind = (kind or "").strip()
    title = (title or "").strip()
    body = (body or "").strip()
    href = (href or "").strip()
    period_key = (period_key or "").strip()
    if not kind or not title or not body or not href or not period_key:
        raise MemberNotifyError(422, "kind, title, body, href, period_key required")

    if has_period_notification(cur, identity_id, kind=kind, period_key=period_key):
        return None

    payload_s = json.dumps(payload) if payload is not None else None
    try:
        cur.execute(
            """INSERT INTO member_notifications
                 (identity_id, kind, title, body, href, channel, period_key,
                  resource_type, resource_id, payload_json, email_status)
               VALUES (%s, %s, %s, %s, %s, 'in_app', %s, %s, %s, %s, 'skipped')""",
            (
                int(identity_id),
                kind[:64],
                title[:512],
                body,
                href[:1024],
                period_key[:64],
                resource_type,
                str(resource_id) if resource_id is not None else None,
                payload_s,
            ),
        )
    except Exception as e:
        # Unique race — treat as already sent
        if has_period_notification(cur, identity_id, kind=kind, period_key=period_key):
            return None
        raise MemberNotifyError(409, f"notification insert failed: {e}") from e

    nid = int(cur.lastrowid)
    cur.execute(
        """SELECT id, kind, title, body, href, channel, period_key,
                  resource_type, resource_id, payload_json, email_status,
                  suppressed_reason, read_at, created_at
           FROM member_notifications WHERE id = %s""",
        (nid,),
    )
    return serialize_notification(cur.fetchone())


def purge_for_identity(cur, identity_id: int) -> int:
    cur.execute(
        "DELETE FROM member_notifications WHERE identity_id = %s",
        (int(identity_id),),
    )
    return int(cur.rowcount or 0)
