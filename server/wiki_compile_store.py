"""Wiki compile candidate + watcher-state store (Wiki Spec v1.2 W0).

Sibling tables (OD-WK4 / India W0-1):
  wiki_compile_candidates       — append-only inbox rows (W0 stub never writes)
  wiki_compile_watcher_state    — singleton last SHA (not a candidate row)

AT-WK5: first SHA is a snapshot. Last SHA must not live on a candidate row.
"""

from __future__ import annotations

import json
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


HELP_TARGET_DISABLED = "help and both are disabled until OD-WK6 (W1 wiki-only)"
AUDIENCE_WIDEN = "audience widening is refused (WK9)"
STAFF_SINK_MISSING = "staff compile refused until a staff sink exists (OD-WK3)"


def _row(r: dict) -> dict:
    ids = r.get("compiled_content_ids")
    if isinstance(ids, str):
        try:
            ids = json.loads(ids)
        except json.JSONDecodeError:
            ids = []
    return {
        "id": int(r["id"]),
        "identity_key": r["identity_key"],
        "kind": r["kind"],
        "origin": r["origin"],
        "title": r["title"],
        "source_ref": r.get("source_ref"),
        "deployed_sha": r.get("deployed_sha"),
        "deployed_at": r.get("deployed_at"),
        "surface_key": r.get("surface_key"),
        "state_key": r.get("state_key"),
        "route": r.get("route"),
        "audience": r["audience"],
        "suggested_target": r.get("suggested_target"),
        "suggested_title": r.get("suggested_title"),
        "rationale": r.get("rationale"),
        "suggested_parent": r.get("suggested_parent"),
        "note": r.get("note"),
        "disposition": r["disposition"],
        "compiled_content_ids": ids or [],
        "created_at": r.get("created_at"),
        "disposed_at": r.get("disposed_at"),
        "disposed_by": r.get("disposed_by"),
    }


def list_candidates(conn=None) -> list[dict]:
    def _list(c) -> list[dict]:
        with c.cursor() as cur:
            cur.execute(
                """
                SELECT * FROM wiki_compile_candidates
                ORDER BY FIELD(disposition, 'open', 'compiling', 'compiled', 'dismissed'),
                         created_at DESC
                """
            )
            return [_row(r) for r in cur.fetchall()]

    if conn is not None:
        return _list(conn)
    with db.transaction() as c:
        return _list(c)


def get_candidate(candidate_id: int, conn=None) -> dict | None:
    def _get(c) -> dict | None:
        with c.cursor() as cur:
            cur.execute(
                "SELECT * FROM wiki_compile_candidates WHERE id = %s",
                (candidate_id,),
            )
            r = cur.fetchone()
        return _row(r) if r else None

    if conn is not None:
        return _get(conn)
    with db.transaction() as c:
        return _get(c)


def get_open_by_identity(identity_key: str, conn=None) -> dict | None:
    def _get(c) -> dict | None:
        with c.cursor() as cur:
            cur.execute(
                """
                SELECT * FROM wiki_compile_candidates
                WHERE identity_key = %s AND disposition IN ('open', 'compiling')
                LIMIT 1
                """,
                (identity_key,),
            )
            r = cur.fetchone()
        return _row(r) if r else None

    if conn is not None:
        return _get(conn)
    with db.transaction() as c:
        return _get(c)


def insert_admin_point(
    *,
    identity_key: str,
    title: str,
    surface_key: str,
    state_key: str | None,
    route: str,
    note: str | None,
    audience: str = "member",
    conn=None,
) -> dict:
    now = utc_now()

    def _ins(c) -> dict:
        existing = get_open_by_identity(identity_key, c)
        if existing:
            if note:
                with c.cursor() as cur:
                    cur.execute(
                        """
                        UPDATE wiki_compile_candidates
                        SET note = %s, origin = 'admin_pointed'
                        WHERE id = %s
                        """,
                        (note, existing["id"]),
                    )
                return get_candidate(existing["id"], c) or existing
            return existing
        with c.cursor() as cur:
            cur.execute(
                """
                INSERT INTO wiki_compile_candidates (
                  identity_key, kind, origin, title, source_ref,
                  deployed_sha, deployed_at, surface_key, state_key, route,
                  audience, suggested_target, suggested_title, rationale,
                  suggested_parent, note, disposition, compiled_content_ids,
                  created_at
                ) VALUES (
                  %s, 'feature', 'admin_pointed', %s, %s,
                  NULL, NULL, %s, %s, %s,
                  %s, 'wiki', %s,
                  %s, NULL, %s, 'open', NULL, %s
                )
                """,
                (
                    identity_key,
                    title,
                    route,
                    surface_key,
                    state_key,
                    route,
                    audience,
                    title,
                    f"no wiki article bound to surface_key={surface_key}",
                    note,
                    now,
                ),
            )
            cid = int(cur.lastrowid)
        return get_candidate(cid, c)

    if conn is not None:
        return _ins(conn)
    with db.transaction() as c:
        return _ins(c)


def set_disposition(
    candidate_id: int,
    disposition: str,
    *,
    disposed_by: int | None = None,
    compiled_content_ids: list | None = None,
    audience: str | None = None,
    note: str | None = None,
    conn=None,
) -> dict:
    now = utc_now()

    def _set(c) -> dict:
        with c.cursor() as cur:
            sets = ["disposition = %s"]
            args: list = [disposition]
            if compiled_content_ids is not None:
                sets.append("compiled_content_ids = %s")
                args.append(json.dumps(compiled_content_ids))
            if audience is not None:
                sets.append("audience = %s")
                args.append(audience)
            if note is not None:
                sets.append("note = %s")
                args.append(note)
            if disposition in ("compiled", "dismissed", "compiling"):
                sets.append("disposed_at = %s")
                args.append(now)
                if disposed_by is not None:
                    sets.append("disposed_by = %s")
                    args.append(disposed_by)
            args.append(candidate_id)
            cur.execute(
                f"UPDATE wiki_compile_candidates SET {', '.join(sets)} WHERE id = %s",
                args,
            )
        row = get_candidate(candidate_id, c)
        if row is None:
            raise RuntimeError(f"candidate {candidate_id} missing after update")
        return row

    if conn is not None:
        return _set(conn)
    with db.transaction() as c:
        return _set(c)


def candidate_for_content_item(content_item_id: int, conn=None) -> dict | None:
    needle = int(content_item_id)

    def _get(c) -> dict | None:
        with c.cursor() as cur:
            cur.execute(
                "SELECT * FROM wiki_compile_candidates WHERE compiled_content_ids IS NOT NULL"
            )
            rows = cur.fetchall()
        for r in rows:
            parsed = _row(r)
            ids = parsed.get("compiled_content_ids") or []
            if needle in [int(x) for x in ids]:
                return parsed
        return None

    if conn is not None:
        return _get(conn)
    with db.transaction() as c:
        return _get(c)
