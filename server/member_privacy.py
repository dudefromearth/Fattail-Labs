"""Member Data & Privacy helpers (Spec v0.1).

Isolation key is always Labs identity_id. Admin content reads require a valid,
in-scope, unexpired, unrevoked consent grant — never role alone (PD-8).
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Iterable

from fastapi import HTTPException

VALID_SURFACES = frozenset({"trade_log", "journal", "playbook", "journey"})


def parse_surfaces(raw: Any) -> list[str]:
    if raw is None:
        return []
    if isinstance(raw, (bytes, bytearray)):
        raw = raw.decode("utf-8")
    if isinstance(raw, str):
        raw = json.loads(raw)
    if not isinstance(raw, list):
        raise HTTPException(status_code=422, detail="surfaces must be a list")
    out: list[str] = []
    for s in raw:
        s = str(s).strip()
        if s not in VALID_SURFACES:
            raise HTTPException(
                status_code=422,
                detail=f"unknown surface {s!r}; allowed {sorted(VALID_SURFACES)}",
            )
        if s not in out:
            out.append(s)
    if not out:
        raise HTTPException(status_code=422, detail="surfaces must be non-empty")
    return out


def surfaces_json(surfaces: Iterable[str]) -> str:
    return json.dumps(list(surfaces))


def assert_self(claims: dict, identity_id: int) -> None:
    if int(claims["identity_id"]) != int(identity_id):
        raise HTTPException(status_code=403, detail="Not your data")


def audit(
    cur,
    *,
    actor_identity_id: int,
    subject_identity_id: int,
    action: str,
    surfaces: list[str] | None = None,
    consent_grant_id: int | None = None,
    detail: str | None = None,
) -> None:
    cur.execute(
        """INSERT INTO member_access_audit
             (actor_identity_id, subject_identity_id, action, surfaces_json,
              consent_grant_id, detail)
           VALUES (%s, %s, %s, %s, %s, %s)""",
        (
            actor_identity_id,
            subject_identity_id,
            action,
            json.dumps(surfaces) if surfaces is not None else None,
            consent_grant_id,
            detail,
        ),
    )


def active_grant(
    cur,
    *,
    member_identity_id: int,
    admin_identity_id: int,
    surface: str,
) -> dict | None:
    """Return the grant row if admin may read surface for member now."""
    if surface not in VALID_SURFACES:
        raise HTTPException(status_code=422, detail=f"unknown surface {surface!r}")
    cur.execute(
        """SELECT id, member_identity_id, admin_identity_id, surfaces_json,
                  purpose, created_at, expires_at, revoked_at
           FROM member_consent_grants
           WHERE member_identity_id = %s
             AND admin_identity_id = %s
             AND revoked_at IS NULL
             AND expires_at > UTC_TIMESTAMP()
           ORDER BY id DESC""",
        (member_identity_id, admin_identity_id),
    )
    for row in cur.fetchall():
        surfaces = parse_surfaces(row["surfaces_json"])
        if surface in surfaces:
            return row
    return None


def require_examination_grant(
    cur,
    *,
    member_identity_id: int,
    admin_identity_id: int,
    surface: str,
) -> dict:
    grant = active_grant(
        cur,
        member_identity_id=member_identity_id,
        admin_identity_id=admin_identity_id,
        surface=surface,
    )
    if grant is None:
        audit(
            cur,
            actor_identity_id=admin_identity_id,
            subject_identity_id=member_identity_id,
            action="deny",
            surfaces=[surface],
            detail="no valid consent grant",
        )
        raise HTTPException(
            status_code=403,
            detail="Member consent required for this surface (no valid grant)",
        )
    return grant


def utc_now() -> datetime:
    return datetime.now(timezone.utc)
