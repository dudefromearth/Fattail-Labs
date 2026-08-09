"""Journal Day Net Calendar prefs — exposure map toggle (Spec v0.2 · JED-1b)."""

from __future__ import annotations


def get_day_net_map_enabled(cur, identity_id: int) -> bool:
    """Default ON when no row (Spec §5.0)."""
    try:
        cur.execute(
            """SELECT day_net_map_enabled FROM member_journal_prefs
               WHERE identity_id = %s""",
            (int(identity_id),),
        )
        row = cur.fetchone()
    except Exception:
        return True
    if not row:
        return True
    return bool(int(row.get("day_net_map_enabled") or 0))


def set_day_net_map_enabled(cur, identity_id: int, enabled: bool) -> bool:
    v = 1 if enabled else 0
    cur.execute(
        """INSERT INTO member_journal_prefs (identity_id, day_net_map_enabled)
           VALUES (%s, %s)
           ON DUPLICATE KEY UPDATE day_net_map_enabled = VALUES(day_net_map_enabled)""",
        (int(identity_id), v),
    )
    return bool(v)
