"""Wiki compile candidate + watcher-state store (Wiki Spec v1.2 W0).

Sibling tables (OD-WK4 / India W0-1):
  wiki_compile_candidates       — append-only inbox rows (W0 stub never writes)
  wiki_compile_watcher_state    — singleton last SHA (not a candidate row)

AT-WK5: first SHA is a snapshot. Last SHA must not live on a candidate row.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import db


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def get_watcher_state(conn=None) -> dict[str, Any]:
    """Return {last_sha, recorded_at}. last_sha is None until the stub runs."""

    def _read(c) -> dict[str, Any]:
        with c.cursor() as cur:
            cur.execute(
                "SELECT last_sha, recorded_at FROM wiki_compile_watcher_state WHERE id = 1"
            )
            row = cur.fetchone()
        if row is None:
            return {"last_sha": None, "recorded_at": None}
        return {
            "last_sha": row["last_sha"],
            "recorded_at": row["recorded_at"],
        }

    if conn is not None:
        return _read(conn)
    with db.transaction() as c:
        return _read(c)


def count_candidates(conn=None) -> int:
    def _count(c) -> int:
        with c.cursor() as cur:
            cur.execute("SELECT COUNT(*) AS n FROM wiki_compile_candidates")
            row = cur.fetchone()
        return int(row["n"] if row else 0)

    if conn is not None:
        return _count(conn)
    with db.transaction() as c:
        return _count(c)


def set_watcher_sha(conn, sha: str) -> None:
    """Write last SHA into watcher-state only. Never touches candidates."""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO wiki_compile_watcher_state (id, last_sha, recorded_at)
            VALUES (1, %s, %s)
            ON DUPLICATE KEY UPDATE
              last_sha = VALUES(last_sha),
              recorded_at = VALUES(recorded_at)
            """,
            (sha, utc_now()),
        )
