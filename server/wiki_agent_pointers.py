"""Pointer registry — hashes of canonical refs, not bodies."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone

import db


def _now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def content_hash(payload: dict) -> str:
    blob = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(blob.encode("utf-8")).hexdigest()


def upsert(
    *,
    source: str,
    ref_kind: str,
    ref_id: str,
    canonical_url: str,
    payload: dict,
) -> str:
    """Return created | updated | unchanged."""
    digest = content_hash(payload)
    now = _now()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, content_hash FROM wiki_pointers
                 WHERE source=%s AND ref_kind=%s AND ref_id=%s
                """,
                (source, ref_kind, ref_id),
            )
            row = cur.fetchone()
            if row is None:
                cur.execute(
                    """
                    INSERT INTO wiki_pointers
                      (source, ref_kind, ref_id, canonical_url, content_hash, last_seen_at)
                    VALUES (%s,%s,%s,%s,%s,%s)
                    """,
                    (source, ref_kind, ref_id, canonical_url, digest, now),
                )
                return "created"
            cur.execute(
                """
                UPDATE wiki_pointers
                   SET canonical_url=%s, content_hash=%s, last_seen_at=%s
                 WHERE id=%s
                """,
                (canonical_url, digest, now, row["id"]),
            )
            if row["content_hash"] != digest:
                return "updated"
            return "unchanged"


def list_ids(source: str) -> set[tuple[str, str]]:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT ref_kind, ref_id FROM wiki_pointers WHERE source=%s",
                (source,),
            )
            return {(r["ref_kind"], r["ref_id"]) for r in cur.fetchall()}


def get(source: str, ref_kind: str, ref_id: str) -> dict | None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT source, ref_kind, ref_id, canonical_url, content_hash, last_seen_at
                  FROM wiki_pointers
                 WHERE source=%s AND ref_kind=%s AND ref_id=%s
                """,
                (source, ref_kind, ref_id),
            )
            return cur.fetchone()


def delete(source: str, ref_kind: str, ref_id: str) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                DELETE FROM wiki_pointers
                 WHERE source=%s AND ref_kind=%s AND ref_id=%s
                """,
                (source, ref_kind, ref_id),
            )


def count(source: str | None = None) -> int:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            if source:
                cur.execute(
                    "SELECT COUNT(*) AS n FROM wiki_pointers WHERE source=%s",
                    (source,),
                )
            else:
                cur.execute("SELECT COUNT(*) AS n FROM wiki_pointers")
            return int(cur.fetchone()["n"])
