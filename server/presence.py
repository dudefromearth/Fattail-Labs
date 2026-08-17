"""Live member presence — heartbeat upsert + online window.

A member's browser pings POST /api/presence every ~60s while the tab is visible;
touch() upserts member_presence.last_seen. The admin Users roster derives an
"online now" status from last_seen within ONLINE_WINDOW_SECONDS. Best-effort —
never raises to the caller.
"""

from __future__ import annotations

import logging

import db

log = logging.getLogger("labs.presence")

# A member counts as online if seen within this window. Heartbeat is ~60s, so 150s
# tolerates one missed beat + network jitter while staying accurate to ~2 minutes.
ONLINE_WINDOW_SECONDS = 150


def touch(identity_id: int) -> None:
    """Record that this member is active right now. Best-effort; skips id 0."""
    try:
        iid = int(identity_id)
    except (TypeError, ValueError):
        return
    if not iid:
        return
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO member_presence (identity_id, last_seen)
                       VALUES (%s, NOW())
                       ON DUPLICATE KEY UPDATE last_seen = NOW()""",
                    (iid,),
                )
    except Exception as exc:  # noqa: BLE001 — presence must not break navigation
        log.warning("presence touch failed for identity %s: %s", iid, exc)
