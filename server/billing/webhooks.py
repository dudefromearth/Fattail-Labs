"""Native Billing v2.0 — webhook ingestion.  Spec §6.3 / §6.4.

Verify -> PERSIST -> acknowledge -> process. Returning 200 once the event is
durably stored, before processing, is deliberate: providers retry aggressively and
Stripe disables endpoints that fail repeatedly. Storage is the acknowledgement;
processing is our own problem.

Durable dedupe in billing_events replaces webhook_security.py's in-process replay
cache FOR BILLING ONLY. That cache is documented as "single-worker launchd is
sufficient" — fine for membership sync, unacceptable for money, because a process
restart must not open a replay window.
"""

from __future__ import annotations

import json
import pymysql


class DuplicateEvent(Exception):
    """Already stored. Return 200 immediately — this is the NORMAL path."""


def ingest(cur, *, provider: str, event_ref: str, event_type: str,
           provider_created_at, payload: dict) -> int:
    try:
        cur.execute(
            """INSERT INTO billing_events
                 (provider, event_ref, event_type, provider_created_at, payload_json)
               VALUES (%s,%s,%s,%s,%s)""",
            (provider, event_ref, event_type, provider_created_at,
             json.dumps(payload)))
    except pymysql.err.IntegrityError as exc:
        raise DuplicateEvent(event_ref) from exc
    cur.execute("SELECT LAST_INSERT_ID() id")
    return cur.fetchone()["id"]


def is_stale(cur, *, provider: str, subject_ref: str, provider_created_at) -> bool:
    """§6.4 — providers do NOT guarantee ordering. A subscription.deleted can arrive
    before the update that preceded it. Without this check a late-arriving stale
    event silently downgrades a paying member."""
    cur.execute(
        """SELECT MAX(provider_created_at) latest FROM billing_events
            WHERE provider=%s AND processed_at IS NOT NULL
              AND JSON_UNQUOTE(JSON_EXTRACT(payload_json,'$.subject')) = %s""",
        (provider, subject_ref))
    row = cur.fetchone()
    latest = row["latest"] if row else None
    return latest is not None and provider_created_at is not None and provider_created_at < latest


def mark_processed(cur, event_id: int, result: str) -> None:
    cur.execute(
        "UPDATE billing_events SET processed_at=UTC_TIMESTAMP(), process_result=LEFT(%s,255) WHERE id=%s",
        (result, event_id))
