"""Agent principals, API keys, and actor attribution (Agent Identity Spec v1.0)."""

from __future__ import annotations

import json
import re
import secrets
from dataclasses import dataclass
from typing import Any, Literal

import db
import identity as identity_mod

ActorKind = Literal["human", "agent"]

VALID_SCOPES = frozenset(
    {
        "ai:run",
        "ai:status",
        "admin:read",
        "admin:content",
        "board:operate",
    }
)
DEFAULT_AI_SCOPES = ["ai:run", "ai:status"]
CALLSIGN_RE = re.compile(r"^[a-z][a-z0-9_-]{1,62}$")


class AgentAuthError(Exception):
    pass


@dataclass(frozen=True)
class Actor:
    kind: ActorKind
    id: int
    label: str
    role: str | None = None
    scopes: frozenset[str] = frozenset()
    key_id: int | None = None  # set for agent API key auth

    @property
    def is_human_admin(self) -> bool:
        return self.kind == "human" and self.role == "administrator"

    def has_scopes(self, required: list[str] | tuple[str, ...] | frozenset[str]) -> bool:
        if self.is_human_admin:
            return True
        need = frozenset(required)
        return need <= self.scopes


def _hash_secret(secret: str) -> str:
    # Reuse identity scrypt format for consistency
    return identity_mod.hash_password(secret)


def _verify_secret(secret: str, stored: str) -> bool:
    return identity_mod.verify_password(secret, stored)


def normalize_callsign(raw: str) -> str:
    cs = (raw or "").strip().lower()
    if not CALLSIGN_RE.match(cs):
        raise AgentAuthError(
            f"invalid callsign {raw!r}: use lowercase letters, digits, _- (2–63 chars)"
        )
    return cs


def normalize_scopes(scopes: list[str] | None) -> list[str]:
    if scopes is None:
        return list(DEFAULT_AI_SCOPES)
    out: list[str] = []
    for s in scopes:
        s = str(s).strip()
        if s not in VALID_SCOPES:
            raise AgentAuthError(f"unknown scope {s!r}; allowed: {sorted(VALID_SCOPES)}")
        if s not in out:
            out.append(s)
    if not out:
        raise AgentAuthError("scopes must be non-empty")
    return out


def create_principal(callsign: str, display_name: str) -> dict:
    cs = normalize_callsign(callsign)
    name = (display_name or cs).strip()
    if not name:
        raise AgentAuthError("display_name required")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id FROM agent_principals WHERE callsign = %s", (cs,)
            )
            if cur.fetchone():
                raise AgentAuthError(f"principal already exists: {cs}")
            cur.execute(
                "INSERT INTO agent_principals (callsign, display_name, status) "
                "VALUES (%s, %s, 'active')",
                (cs, name),
            )
            pid = cur.lastrowid
            cur.execute(
                "SELECT id, callsign, display_name, status, created_at "
                "FROM agent_principals WHERE id = %s",
                (pid,),
            )
            row = cur.fetchone()
    return _principal_row(row)


def set_principal_status(principal_id: int, status: str) -> dict:
    if status not in ("active", "disabled"):
        raise AgentAuthError("status must be active|disabled")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE agent_principals SET status = %s WHERE id = %s",
                (status, principal_id),
            )
            if cur.rowcount == 0:
                raise AgentAuthError("principal not found")
            cur.execute(
                "SELECT id, callsign, display_name, status, created_at "
                "FROM agent_principals WHERE id = %s",
                (principal_id,),
            )
            row = cur.fetchone()
    return _principal_row(row)


def list_principals() -> list[dict]:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, callsign, display_name, status, created_at "
                "FROM agent_principals ORDER BY callsign"
            )
            principals = [_principal_row(r) for r in cur.fetchall()]
            cur.execute(
                """SELECT id, principal_id, name, key_prefix, scopes_json,
                          created_at, last_used_at, revoked_at
                   FROM agent_api_keys ORDER BY id"""
            )
            keys_by_p: dict[int, list] = {}
            for k in cur.fetchall():
                keys_by_p.setdefault(k["principal_id"], []).append(_key_meta(k))
    for p in principals:
        p["keys"] = keys_by_p.get(p["id"], [])
    return principals


def mint_key(
    principal_id: int,
    *,
    name: str = "default",
    scopes: list[str] | None = None,
) -> dict:
    scope_list = normalize_scopes(scopes)
    prefix = secrets.token_hex(4)
    secret = secrets.token_hex(32)
    raw = f"ftl_ag_{prefix}_{secret}"
    key_hash = _hash_secret(secret)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, status FROM agent_principals WHERE id = %s",
                (principal_id,),
            )
            prow = cur.fetchone()
            if not prow:
                raise AgentAuthError("principal not found")
            if prow["status"] != "active":
                raise AgentAuthError("principal is disabled")
            cur.execute(
                """INSERT INTO agent_api_keys
                   (principal_id, name, key_prefix, key_hash, scopes_json)
                   VALUES (%s, %s, %s, %s, %s)""",
                (
                    principal_id,
                    (name or "default").strip()[:128],
                    prefix,
                    key_hash,
                    json.dumps(scope_list),
                ),
            )
            kid = cur.lastrowid
    return {
        "key_id": kid,
        "key": raw,
        "prefix": prefix,
        "scopes": scope_list,
        "name": (name or "default").strip()[:128],
        "principal_id": principal_id,
    }


def revoke_key(key_id: int) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE agent_api_keys SET revoked_at = CURRENT_TIMESTAMP "
                "WHERE id = %s AND revoked_at IS NULL",
                (key_id,),
            )
            if cur.rowcount == 0:
                # either missing or already revoked
                cur.execute("SELECT id, revoked_at FROM agent_api_keys WHERE id = %s", (key_id,))
                row = cur.fetchone()
                if not row:
                    raise AgentAuthError("key not found")
                # already revoked — idempotent ok
                return


def verify_agent_bearer(token: str) -> Actor:
    """Parse and verify ftl_ag_<prefix>_<secret>."""
    token = (token or "").strip()
    if not token.startswith("ftl_ag_"):
        raise AgentAuthError("invalid agent token format")
    body = token[len("ftl_ag_") :]
    if "_" not in body:
        raise AgentAuthError("invalid agent token format")
    prefix, _, secret = body.partition("_")
    if len(prefix) != 8 or not secret:
        raise AgentAuthError("invalid agent token format")

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT k.id AS key_id, k.key_hash, k.scopes_json, k.revoked_at,
                          p.id AS principal_id, p.callsign, p.display_name, p.status
                   FROM agent_api_keys k
                   JOIN agent_principals p ON p.id = k.principal_id
                   WHERE k.key_prefix = %s""",
                (prefix,),
            )
            row = cur.fetchone()
            if not row:
                raise AgentAuthError("unknown agent key")
            if row["revoked_at"] is not None:
                raise AgentAuthError("agent key revoked")
            if row["status"] != "active":
                raise AgentAuthError("agent principal disabled")
            if not _verify_secret(secret, row["key_hash"]):
                raise AgentAuthError("invalid agent key")
            cur.execute(
                "UPDATE agent_api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = %s",
                (row["key_id"],),
            )

    scopes_raw = row["scopes_json"]
    if isinstance(scopes_raw, str):
        scopes_raw = json.loads(scopes_raw)
    scopes = frozenset(str(s) for s in (scopes_raw or []))
    return Actor(
        kind="agent",
        id=int(row["principal_id"]),
        label=str(row["callsign"]),
        role=None,
        scopes=scopes,
        key_id=int(row["key_id"]),
    )


def record_event(
    actor: Actor,
    action: str,
    *,
    resource: str | None = None,
    detail: dict[str, Any] | None = None,
) -> None:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO actor_events
                   (actor_kind, actor_id, actor_label, action, resource, detail_json)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (
                    actor.kind,
                    actor.id,
                    actor.label[:255],
                    action[:128],
                    (resource or None),
                    json.dumps(detail) if detail is not None else None,
                ),
            )


def _principal_row(row: dict) -> dict:
    created = row.get("created_at")
    return {
        "id": row["id"],
        "callsign": row["callsign"],
        "display_name": row["display_name"],
        "status": row["status"],
        "created_at": created.isoformat(sep=" ") if hasattr(created, "isoformat") else created,
    }


def _key_meta(row: dict) -> dict:
    scopes = row["scopes_json"]
    if isinstance(scopes, str):
        scopes = json.loads(scopes)
    def _ts(v):
        if v is None:
            return None
        return v.isoformat(sep=" ") if hasattr(v, "isoformat") else v

    return {
        "id": row["id"],
        "name": row["name"],
        "prefix": row["key_prefix"],
        "scopes": list(scopes or []),
        "created_at": _ts(row.get("created_at")),
        "last_used_at": _ts(row.get("last_used_at")),
        "revoked_at": _ts(row.get("revoked_at")),
        "active": row.get("revoked_at") is None,
    }
