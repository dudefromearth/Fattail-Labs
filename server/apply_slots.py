"""Server-owned apply conversation slots.

No Calendly. No Chili Piper. Times are America/New_York wall clocks
(YYYY-MM-DDTHH:MM). A row with a valid starts_et is live; empty is hidden.
"""

from __future__ import annotations

import logging
from typing import Any

from apply_invite import is_when_valid


def _db():
    import db

    return db

log = logging.getLogger("labs.apply_slots")


class ApplySlotsError(Exception):
    pass


def slot_is_live(starts_et: str) -> bool:
    return is_when_valid((starts_et or "").strip())


HOSTS = ("coach", "lakesia")


def _host(raw: Any) -> str:
    key = str(raw or "coach").strip()
    return key if key in HOSTS else "coach"


def _row(raw: dict[str, Any]) -> dict[str, Any]:
    starts = str(raw.get("starts_et") or "").strip()
    return {
        "id": int(raw["id"]),
        "starts_et": starts,
        "host": _host(raw.get("host")),
        "sort_order": int(raw.get("sort_order") or 0),
        "live": slot_is_live(starts),
    }


def public_payload(slots: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Applicant list — live rows only. Never invent times."""
    return [
        {
            "id": int(s["id"]),
            "starts_et": str(s["starts_et"]),
            "host": _host(s.get("host")),
        }
        for s in slots
        if s.get("live")
    ]


def list_all() -> list[dict[str, Any]]:
    with _db().transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, starts_et, host, sort_order FROM apply_slots "
                "ORDER BY sort_order ASC, id ASC"
            )
            rows = cur.fetchall()
    return [_row(r) for r in rows]


def list_live(host: str | None = None) -> list[dict[str, Any]]:
    rows = [s for s in list_all() if s["live"]]
    if host:
        want = _host(host)
        return [s for s in rows if s["host"] == want]
    return rows


def is_live_when(when: str, host: str | None = None) -> bool:
    raw = (when or "").strip()
    if not slot_is_live(raw):
        return False
    rows = list_live(host) if host else list_live()
    return any(s["starts_et"] == raw for s in rows)


def get_slot(slot_id: int) -> dict[str, Any] | None:
    with _db().transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, starts_et, host, sort_order FROM apply_slots WHERE id = %s",
                (int(slot_id),),
            )
            row = cur.fetchone()
    return _row(row) if row else None


def update_starts(slot_id: int, starts_et: str) -> dict[str, Any]:
    raw = (starts_et or "").strip()
    if raw and not is_when_valid(raw):
        raise ApplySlotsError(
            "starts_et must be empty or YYYY-MM-DDTHH:MM in America/New_York"
        )
    with _db().transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE apply_slots SET starts_et = %s WHERE id = %s",
                (raw, int(slot_id)),
            )
            if cur.rowcount < 1:
                raise ApplySlotsError(f"apply slot {slot_id} not found")
    slot = get_slot(int(slot_id))
    if slot is None:
        raise ApplySlotsError(f"apply slot {slot_id} not found after write")
    return slot


def update_host(slot_id: int, host: str) -> dict[str, Any]:
    key = str(host or "").strip()
    if key not in HOSTS:
        raise ApplySlotsError("host must be coach or lakesia")
    with _db().transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE apply_slots SET host = %s WHERE id = %s",
                (key, int(slot_id)),
            )
            if cur.rowcount < 1:
                raise ApplySlotsError(f"apply slot {slot_id} not found")
    slot = get_slot(int(slot_id))
    if slot is None:
        raise ApplySlotsError(f"apply slot {slot_id} not found after write")
    return slot


def add_slot(host: str = "coach") -> dict[str, Any]:
    """Append an empty (hidden) slot. Count is not frozen."""
    key = _host(host)
    with _db().transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COALESCE(MAX(sort_order), 0) AS m FROM apply_slots")
            row = cur.fetchone() or {}
            nxt = int(row.get("m") or 0) + 10
            cur.execute(
                "INSERT INTO apply_slots (starts_et, host, sort_order) "
                "VALUES (%s, %s, %s)",
                ("", key, nxt),
            )
            new_id = int(cur.lastrowid)
    slot = get_slot(new_id)
    if slot is None:
        raise ApplySlotsError("apply slot insert miss after write")
    return slot


def delete_slot(slot_id: int) -> None:
    with _db().transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM apply_slots WHERE id = %s", (int(slot_id),))
            if cur.rowcount < 1:
                raise ApplySlotsError(f"apply slot {slot_id} not found")
