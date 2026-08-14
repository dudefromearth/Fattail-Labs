"""Extract-and-confirm events — Journal Session v0.7 §6."""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any

import journal_session_domain as jsd
import journal_session_structured as jss


class ConfirmError(jsd.JournalSessionError):
    pass


def _now() -> datetime:
    return jsd._now_utc()


def assert_extract_keys(keys: list[str]) -> None:
    allowed = jss.all_field_keys()
    unknown = [k for k in keys if k not in allowed]
    if unknown:
        raise ConfirmError(422, f"unknown structured field key: {unknown[0]}")


def apply_confirmation(
    cur,
    identity_id: int,
    session_id: int,
    *,
    field_key: str,
    value: Any,
    present: bool,
    source_message_ids: list[int] | None,
    method: str,
) -> dict:
    """Write confirmation event + structured_json in the same transaction."""
    assert_extract_keys([field_key])
    if method not in ("extraction", "interview"):
        raise ConfirmError(422, "method must be extraction or interview")
    row = jsd._load_mutable_row(cur, identity_id, session_id)
    jd = jsd._as_date(row["journal_date"])
    jsd.assert_date_open(cur, identity_id, jd)

    if present and source_message_ids:
        _assert_member_messages(cur, identity_id, session_id, source_message_ids)

    cur.execute(
        """INSERT INTO member_journal_confirmations
             (session_id, identity_id, field_key, value_present,
              source_message_ids_json, method, confirmed_at)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        (
            session_id,
            identity_id,
            field_key,
            1 if present else 0,
            json.dumps([int(x) for x in (source_message_ids or [])]),
            method,
            jsd._naive_utc(_now()),
        ),
    )

    existing = row.get("structured_json")
    if isinstance(existing, str):
        try:
            existing = json.loads(existing)
        except json.JSONDecodeError:
            existing = {}
    if not isinstance(existing, dict):
        existing = {}
    if present:
        existing[field_key] = value
    else:
        existing.pop(field_key, None)
    # Keep only known keys; do not restore required-for-complete
    cleaned = {k: v for k, v in existing.items() if k in jss.all_field_keys()}
    sj = json.dumps(cleaned) if cleaned else None

    provenance = _read_provenance(cur, session_id)
    provenance[field_key] = {
        "source_message_ids": [int(x) for x in (source_message_ids or [])],
        "confirmed_at": _now().isoformat(),
        "method": method,
    }
    if not present:
        provenance.pop(field_key, None)

    cur.execute(
        """UPDATE member_journal_sessions
           SET structured_json = %s, structured_provenance_json = %s
           WHERE id = %s AND identity_id = %s AND status IN ('open', 'partial')""",
        (sj, json.dumps(provenance), session_id, identity_id),
    )
    if cur.rowcount == 0:
        raise ConfirmError(409, jsd.CLOSED_SESSION_DETAIL)
    return jsd.get_session(cur, identity_id, session_id, include_messages=True)


def apply_interview_fields(
    cur,
    identity_id: int,
    session_id: int,
    fields: dict[str, Any],
) -> dict:
    """Interview path — same event law, method=interview."""
    if not isinstance(fields, dict):
        raise ConfirmError(422, "structured must be an object")
    assert_extract_keys(list(fields.keys()))
    session = None
    for key, val in fields.items():
        present = val is not None and str(val).strip() != ""
        session = apply_confirmation(
            cur,
            identity_id,
            session_id,
            field_key=key,
            value=val if present else None,
            present=present,
            source_message_ids=[],
            method="interview",
        )
    return session or jsd.get_session(
        cur, identity_id, session_id, include_messages=True
    )


def _assert_member_messages(
    cur, identity_id: int, session_id: int, ids: list[int]
) -> None:
    if not ids:
        return
    cur.execute(
        """SELECT id FROM member_journal_messages
           WHERE session_id = %s AND identity_id = %s
             AND author = 'member' AND id IN ({})""".format(
            ",".join(["%s"] * len(ids))
        ),
        (session_id, identity_id, *[int(x) for x in ids]),
    )
    found = {int(r["id"]) for r in (cur.fetchall() or [])}
    missing = [int(x) for x in ids if int(x) not in found]
    if missing:
        raise ConfirmError(
            422, "extraction source must be a member-authored message in this session"
        )


def _read_provenance(cur, session_id: int) -> dict:
    cur.execute(
        """SELECT structured_provenance_json FROM member_journal_sessions
           WHERE id = %s""",
        (session_id,),
    )
    row = cur.fetchone() or {}
    raw = row.get("structured_provenance_json")
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except json.JSONDecodeError:
            raw = {}
    return dict(raw) if isinstance(raw, dict) else {}


def purge_confirmations_for_identity(cur, identity_id: int) -> int:
    cur.execute(
        "DELETE FROM member_journal_confirmations WHERE identity_id = %s",
        (int(identity_id),),
    )
    return int(cur.rowcount or 0)
