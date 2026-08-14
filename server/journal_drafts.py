"""Server-side journal composer drafts — Journal Session v0.7 §7."""

from __future__ import annotations

from datetime import date

import journal_session_domain as jsd


def get_draft(cur, identity_id: int, journal_date: date) -> dict | None:
    cur.execute(
        """SELECT identity_id, journal_date, body_md, updated_at
           FROM member_journal_drafts
           WHERE identity_id = %s AND journal_date = %s""",
        (int(identity_id), journal_date),
    )
    row = cur.fetchone()
    if not row:
        return None
    closed = False
    try:
        jsd.assert_date_open(cur, identity_id, journal_date)
    except jsd.JournalSessionError as e:
        closed = e.code == 409
    return {
        "journal_date": str(row["journal_date"])[:10],
        "body_md": row.get("body_md") or "",
        "updated_at": str(row["updated_at"]) if row.get("updated_at") else None,
        "read_only": closed,
    }


def put_draft(cur, identity_id: int, journal_date: date, body_md: str) -> dict:
    try:
        jsd.assert_date_open(cur, identity_id, journal_date)
    except jsd.JournalSessionError as e:
        if e.code == 409:
            raise jsd.JournalSessionError(
                409,
                "date is closed — draft is read-only",
                extra={"code": "date_closed", "read_only": True},
            ) from e
        raise
    body = str(body_md or "")
    cur.execute(
        """INSERT INTO member_journal_drafts (identity_id, journal_date, body_md)
           VALUES (%s, %s, %s)
           ON DUPLICATE KEY UPDATE body_md = VALUES(body_md)""",
        (int(identity_id), journal_date, body),
    )
    out = get_draft(cur, identity_id, journal_date)
    return out or {"journal_date": journal_date.isoformat(), "body_md": body}


def delete_draft(cur, identity_id: int, journal_date: date) -> None:
    cur.execute(
        """DELETE FROM member_journal_drafts
           WHERE identity_id = %s AND journal_date = %s""",
        (int(identity_id), journal_date),
    )


def purge_drafts_for_identity(cur, identity_id: int) -> int:
    cur.execute(
        "DELETE FROM member_journal_drafts WHERE identity_id = %s",
        (int(identity_id),),
    )
    return int(cur.rowcount or 0)
