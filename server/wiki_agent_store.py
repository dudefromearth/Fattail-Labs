"""Wiki Agent contracts ledger + source registry (Spec v0.1.2 §4)."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

import db
from wiki_agent_ulid import new_ulid

VALID_STATUS = frozenset(
    {
        "received",
        "validated",
        "drafted",
        "awaiting_approval",
        "published",
        "rejected",
        "failed",
        "accepted",
        "failed-partial",
    }
)


class SessionSealedError(RuntimeError):
    """Transcript mutation after sealed_at."""


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _json(val: Any) -> str:
    return json.dumps(val, separators=(",", ":"))


def lookup_source(slug: str) -> dict | None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT slug, principal_callsign, allowed_kind, enabled "
                "FROM wiki_agent_sources WHERE slug = %s",
                (slug,),
            )
            return cur.fetchone()


def upsert_source(
    slug: str, *, principal_callsign: str, allowed_kind: str, enabled: bool = True
) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO wiki_agent_sources
                  (slug, principal_callsign, allowed_kind, enabled)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                  principal_callsign = VALUES(principal_callsign),
                  allowed_kind = VALUES(allowed_kind),
                  enabled = VALUES(enabled)
                """,
                (slug, principal_callsign, allowed_kind, 1 if enabled else 0),
            )


def insert_contract(
    *,
    envelope: dict,
    principal: str,
    status: str,
    reject_reason: str = "",
    failure_reason: str = "",
) -> dict:
    if status not in VALID_STATUS:
        raise ValueError(f"invalid status {status!r}")
    cid = new_ulid()
    now = _now()
    validated_at = now if status in {"validated", "accepted"} else None
    rejected_at = now if status == "rejected" else None
    failed_at = now if status in {"failed", "failed-partial"} else None
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO wiki_contracts
                  (contract_id, contract_version, kind, source, delivered_at,
                   principal, refs_json, payload_json, status, reject_reason,
                   failure_reason, commit_shas_json, board_card_ids_json,
                   sealed_at, received_at, validated_at, rejected_at, failed_at)
                VALUES
                  (%s, %s, %s, %s, %s,
                   %s, %s, %s, %s, %s,
                   %s, %s, %s,
                   %s, %s, %s, %s, %s)
                """,
                (
                    cid,
                    envelope.get("contract_version") or "1",
                    envelope.get("kind") or "",
                    envelope.get("source") or "",
                    now,
                    principal,
                    _json(envelope.get("refs") or []),
                    _json(envelope.get("payload") or {}),
                    status,
                    reject_reason or "",
                    failure_reason or "",
                    "[]",
                    "[]",
                    None,
                    now,
                    validated_at,
                    rejected_at,
                    failed_at,
                ),
            )
    return get_contract(cid)


def mark_failed(
    contract_id: str, reason: str, *, board_card_ids: list | None = None
) -> dict:
    now = _now()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            if board_card_ids is not None:
                cur.execute(
                    """
                    UPDATE wiki_contracts
                       SET status = 'failed',
                           failure_reason = %s,
                           failed_at = %s,
                           board_card_ids_json = %s
                     WHERE contract_id = %s
                    """,
                    (reason or "", now, _json(board_card_ids), contract_id),
                )
            else:
                cur.execute(
                    """
                    UPDATE wiki_contracts
                       SET status = 'failed',
                           failure_reason = %s,
                           failed_at = %s
                     WHERE contract_id = %s
                    """,
                    (reason or "", now, contract_id),
                )
    return get_contract(contract_id)


def record_board_ids(contract_id: str, ids: list[int]) -> dict:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE wiki_contracts
                   SET board_card_ids_json = %s,
                       status = 'awaiting_approval',
                       awaiting_approval_at = %s
                 WHERE contract_id = %s
                """,
                (_json(ids), _now(), contract_id),
            )
    return get_contract(contract_id)


def record_commits(contract_id: str, shas: list[str]) -> dict:
    now = _now()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE wiki_contracts
                   SET status = 'drafted',
                       commit_shas_json = %s,
                       drafted_at = %s
                 WHERE contract_id = %s
                """,
                (_json(shas), now, contract_id),
            )
    return get_contract(contract_id)


def update_payload_if_unsealed(contract_id: str, payload: dict) -> dict:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE wiki_contracts
                   SET payload_json = %s
                 WHERE contract_id = %s
                   AND sealed_at IS NULL
                """,
                (_json(payload), contract_id),
            )
            if cur.rowcount == 0:
                row = None
                cur.execute(
                    "SELECT contract_id, sealed_at FROM wiki_contracts WHERE contract_id = %s",
                    (contract_id,),
                )
                row = cur.fetchone()
                if row is None:
                    raise KeyError(contract_id)
                raise SessionSealedError("session_sealed")
    got = get_contract(contract_id)
    if got is None:
        raise KeyError(contract_id)
    return got


def seal_contract(contract_id: str) -> dict:
    now = _now()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE wiki_contracts
                   SET sealed_at = %s
                 WHERE contract_id = %s
                   AND kind = 'session'
                   AND sealed_at IS NULL
                """,
                (now, contract_id),
            )
            if cur.rowcount == 0:
                cur.execute(
                    "SELECT contract_id, kind, sealed_at FROM wiki_contracts WHERE contract_id = %s",
                    (contract_id,),
                )
                row = cur.fetchone()
                if row is None:
                    raise KeyError(contract_id)
                raise SessionSealedError("session_sealed")
    got = get_contract(contract_id)
    if got is None:
        raise KeyError(contract_id)
    return got


def get_contract(contract_id: str) -> dict | None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM wiki_contracts WHERE contract_id = %s",
                (contract_id,),
            )
            row = cur.fetchone()
    return _public(row) if row else None


def _public(row: dict) -> dict:
    def _load(key: str, default):
        raw = row.get(key)
        if raw in (None, ""):
            return default
        if isinstance(raw, (list, dict)):
            return raw
        return json.loads(raw)

    return {
        "contract_id": row["contract_id"],
        "contract_version": row["contract_version"],
        "kind": row["kind"],
        "source": row["source"],
        "delivered_at": _iso(row.get("delivered_at")),
        "principal": row["principal"],
        "refs": _load("refs_json", []),
        "payload": _load("payload_json", {}),
        "status": row["status"],
        "reject_reason": row.get("reject_reason") or "",
        "failure_reason": row.get("failure_reason") or "",
        "commit_shas": _load("commit_shas_json", []),
        "board_card_ids": _load("board_card_ids_json", []),
        "sealed_at": _iso(row.get("sealed_at")),
        "received_at": _iso(row.get("received_at")),
        "validated_at": _iso(row.get("validated_at")),
        "drafted_at": _iso(row.get("drafted_at")),
        "awaiting_approval_at": _iso(row.get("awaiting_approval_at")),
        "published_at": _iso(row.get("published_at")),
        "rejected_at": _iso(row.get("rejected_at")),
        "failed_at": _iso(row.get("failed_at")),
        "reason": (row.get("failure_reason") or row.get("reject_reason") or ""),
    }


def upsert_watermark(
    *,
    source_kind: str,
    source_id: str,
    content_hash: str,
    contract_id: str,
) -> dict:
    """Wiki-side hash watermark (L9/L10). Never stores page bytes."""
    now = _now()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO wiki_source_watermarks
                  (source_kind, source_id, content_hash, seen_at, contract_id)
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                  content_hash = VALUES(content_hash),
                  seen_at = VALUES(seen_at),
                  contract_id = VALUES(contract_id)
                """,
                (source_kind, source_id, content_hash, now, contract_id),
            )
    got = get_watermark(source_kind, source_id)
    if got is None:
        raise RuntimeError("watermark_write_failed")
    return got


def get_watermark(source_kind: str, source_id: str) -> dict | None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT source_kind, source_id, content_hash, seen_at, contract_id
                  FROM wiki_source_watermarks
                 WHERE source_kind = %s AND source_id = %s
                """,
                (source_kind, source_id),
            )
            row = cur.fetchone()
    if row is None:
        return None
    return {
        "source_kind": row["source_kind"],
        "source_id": row["source_id"],
        "content_hash": row["content_hash"],
        "seen_at": _iso(row.get("seen_at")),
        "contract_id": row["contract_id"],
    }


def _iso(val) -> str | None:
    if val is None:
        return None
    if hasattr(val, "isoformat"):
        return val.isoformat()
    return str(val)
