"""One surfacing ledger per (identity, date, kind) — B-P1."""

from __future__ import annotations

from datetime import date

KIND_DAY_OPEN = "coach_day_open"
KIND_DAY_CLOSE = "coach_day_close"
VALID_KINDS = (KIND_DAY_OPEN, KIND_DAY_CLOSE)
STATE_FIRED = "fired"
STATE_CONSUMED = "consumed"


def ledger_get(cur, identity_id: int, journal_date: date, kind: str) -> dict | None:
    cur.execute(
        """SELECT identity_id, journal_date, kind, state, channel, created_at
           FROM member_journal_surfacing
           WHERE identity_id = %s AND journal_date = %s AND kind = %s""",
        (int(identity_id), journal_date, kind),
    )
    return cur.fetchone()


def ledger_record(
    cur,
    identity_id: int,
    journal_date: date,
    kind: str,
    *,
    state: str,
    channel: str,
) -> dict:
    """Insert fired/consumed. Idempotent — existing row wins."""
    if kind not in VALID_KINDS:
        raise ValueError(f"unknown surfacing kind {kind}")
    existing = ledger_get(cur, identity_id, journal_date, kind)
    if existing:
        return existing
    cur.execute(
        """INSERT INTO member_journal_surfacing
             (identity_id, journal_date, kind, state, channel)
           VALUES (%s, %s, %s, %s, %s)""",
        (int(identity_id), journal_date, kind, state, channel),
    )
    row = ledger_get(cur, identity_id, journal_date, kind)
    return row or {
        "kind": kind,
        "state": state,
        "channel": channel,
        "journal_date": journal_date,
    }


def try_fire(
    cur, identity_id: int, journal_date: date, kind: str, *, channel: str
) -> bool:
    """True if this call is the first fire (not already fired or consumed)."""
    existing = ledger_get(cur, identity_id, journal_date, kind)
    if existing:
        return False
    ledger_record(
        cur, identity_id, journal_date, kind, state=STATE_FIRED, channel=channel
    )
    return True


def consume(
    cur, identity_id: int, journal_date: date, kind: str, *, channel: str = "heat"
) -> None:
    """Mark kind used for the date without firing (heat suppress)."""
    ledger_record(
        cur, identity_id, journal_date, kind, state=STATE_CONSUMED, channel=channel
    )
