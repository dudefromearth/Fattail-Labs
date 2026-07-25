"""Member privacy APIs — analytics consent, examination grants, isolated notes.

Specs: FatTail-Labs-Member-Data-Privacy-Spec-v0.1
       FatTail-Labs-Application-Framework-Spec-v1.0 (AF-B1)
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Request

import db
import member_privacy as privacy
from guards import require_admin, require_session

router = APIRouter(tags=["privacy"])

# Mike D-2 default (aggregate floor) — used when aggregates ship in W7.
MIN_COHORT_K = 5


def _parse_expires(raw: str | None, default_hours: int = 72) -> datetime:
    if not raw:
        return datetime.now(timezone.utc) + timedelta(hours=default_hours)
    try:
        # Accept ISO-8601; treat naive as UTC
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="expires_at must be ISO-8601") from exc


# ── Member: analytics consent ─────────────────────────────────────────────


@router.get("/api/me/privacy/analytics-consent")
def get_analytics_consent(request: Request) -> dict:
    claims = require_session(request)
    iid = int(claims["identity_id"])
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT opted_in, updated_at FROM member_analytics_consent "
                "WHERE identity_id = %s",
                (iid,),
            )
            row = cur.fetchone()
    if row is None:
        # D-3: default opt-in false
        return {"opted_in": False, "updated_at": None}
    return {
        "opted_in": bool(row["opted_in"]),
        "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
    }


@router.put("/api/me/privacy/analytics-consent")
async def put_analytics_consent(request: Request) -> dict:
    claims = require_session(request)
    iid = int(claims["identity_id"])
    body = await request.json()
    if "opted_in" not in body:
        raise HTTPException(status_code=422, detail="opted_in required")
    opted = 1 if body["opted_in"] else 0
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO member_analytics_consent (identity_id, opted_in)
                   VALUES (%s, %s)
                   ON DUPLICATE KEY UPDATE opted_in = VALUES(opted_in)""",
                (iid, opted),
            )
    return {"opted_in": bool(opted)}


# ── Member: examination grants ────────────────────────────────────────────


@router.get("/api/me/privacy/examination-grants")
def list_my_grants(request: Request) -> dict:
    claims = require_session(request)
    iid = int(claims["identity_id"])
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, admin_identity_id, surfaces_json, purpose,
                          created_at, expires_at, revoked_at
                   FROM member_consent_grants
                   WHERE member_identity_id = %s
                   ORDER BY id DESC""",
                (iid,),
            )
            rows = cur.fetchall()
    grants = []
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    for r in rows:
        exp = r["expires_at"]
        active = r["revoked_at"] is None and exp is not None and exp > now
        grants.append(
            {
                "id": r["id"],
                "admin_identity_id": r["admin_identity_id"],
                "surfaces": privacy.parse_surfaces(r["surfaces_json"]),
                "purpose": r["purpose"],
                "created_at": r["created_at"].isoformat() if r["created_at"] else None,
                "expires_at": exp.isoformat() if exp else None,
                "revoked_at": r["revoked_at"].isoformat() if r["revoked_at"] else None,
                "active": active,
            }
        )
    return {"grants": grants}


@router.post("/api/me/privacy/examination-grants")
async def create_grant(request: Request) -> dict:
    """Member grants a specific admin access to named surfaces (IN-1)."""
    claims = require_session(request)
    member_id = int(claims["identity_id"])
    body = await request.json()
    admin_id = body.get("admin_identity_id")
    if not isinstance(admin_id, int) or admin_id <= 0:
        raise HTTPException(status_code=422, detail="admin_identity_id required")
    if admin_id == member_id:
        raise HTTPException(status_code=422, detail="cannot grant to yourself")
    surfaces = privacy.parse_surfaces(body.get("surfaces"))
    purpose = (body.get("purpose") or "").strip()[:512]
    expires = _parse_expires(body.get("expires_at"))
    if expires <= datetime.now(timezone.utc):
        raise HTTPException(status_code=422, detail="expires_at must be in the future")

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT identity_id FROM identities WHERE identity_id = %s",
                (admin_id,),
            )
            if cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Admin identity not found")
            # Content read still requires administrator session on admin routes (AF-B1).
            cur.execute(
                """INSERT INTO member_consent_grants
                     (member_identity_id, admin_identity_id, surfaces_json, purpose, expires_at)
                   VALUES (%s, %s, %s, %s, %s)""",
                (
                    member_id,
                    admin_id,
                    privacy.surfaces_json(surfaces),
                    purpose,
                    expires.replace(tzinfo=None),
                ),
            )
            grant_id = cur.lastrowid
            privacy.audit(
                cur,
                actor_identity_id=member_id,
                subject_identity_id=member_id,
                action="grant",
                surfaces=surfaces,
                consent_grant_id=grant_id,
                detail=f"to admin {admin_id}",
            )
    return {"id": grant_id, "surfaces": surfaces, "expires_at": expires.isoformat()}


@router.delete("/api/me/privacy/examination-grants/{grant_id}")
def revoke_grant(grant_id: int, request: Request) -> dict:
    claims = require_session(request)
    member_id = int(claims["identity_id"])
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, member_identity_id, surfaces_json, revoked_at
                   FROM member_consent_grants WHERE id = %s""",
                (grant_id,),
            )
            row = cur.fetchone()
            if row is None or int(row["member_identity_id"]) != member_id:
                raise HTTPException(status_code=404, detail="Grant not found")
            if row["revoked_at"] is None:
                cur.execute(
                    "UPDATE member_consent_grants SET revoked_at = UTC_TIMESTAMP() "
                    "WHERE id = %s",
                    (grant_id,),
                )
                privacy.audit(
                    cur,
                    actor_identity_id=member_id,
                    subject_identity_id=member_id,
                    action="revoke",
                    surfaces=privacy.parse_surfaces(row["surfaces_json"]),
                    consent_grant_id=grant_id,
                )
    return {"ok": True, "id": grant_id, "revoked": True}


# ── Member: isolated tool notes (probe content for W2 isolation) ──────────


@router.get("/api/me/tools/{surface}/notes")
def list_my_notes(surface: str, request: Request) -> dict:
    claims = require_session(request)
    iid = int(claims["identity_id"])
    if surface not in ("trade_log", "journal", "playbook"):
        raise HTTPException(status_code=404, detail="Unknown surface")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, surface, body_md, created_at, updated_at
                   FROM member_tool_notes
                   WHERE identity_id = %s AND surface = %s
                   ORDER BY id DESC""",
                (iid, surface),
            )
            rows = cur.fetchall()
    return {
        "notes": [
            {
                "id": r["id"],
                "surface": r["surface"],
                "body_md": r["body_md"],
                "created_at": r["created_at"].isoformat() if r["created_at"] else None,
                "updated_at": r["updated_at"].isoformat() if r["updated_at"] else None,
            }
            for r in rows
        ]
    }


@router.post("/api/me/tools/{surface}/notes")
async def create_my_note(surface: str, request: Request) -> dict:
    claims = require_session(request)
    iid = int(claims["identity_id"])
    if surface not in ("trade_log", "journal", "playbook"):
        raise HTTPException(status_code=404, detail="Unknown surface")
    body = await request.json()
    text = (body.get("body_md") or "").strip()
    if not text:
        raise HTTPException(status_code=422, detail="body_md required")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO member_tool_notes (identity_id, surface, body_md)
                   VALUES (%s, %s, %s)""",
                (iid, surface, text),
            )
            note_id = cur.lastrowid
    return {"id": note_id, "surface": surface, "body_md": text}


@router.get("/api/me/tools/{surface}/notes/{note_id}")
def get_my_note(surface: str, note_id: int, request: Request) -> dict:
    """Explicit owner check — never return another member's note."""
    claims = require_session(request)
    iid = int(claims["identity_id"])
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, identity_id, surface, body_md, created_at
                   FROM member_tool_notes WHERE id = %s AND surface = %s""",
                (note_id, surface),
            )
            row = cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Not found")
            if int(row["identity_id"]) != iid:
                # Fail closed: same as not found (no existence leak)
                raise HTTPException(status_code=404, detail="Not found")
    return {
        "id": row["id"],
        "surface": row["surface"],
        "body_md": row["body_md"],
        "created_at": row["created_at"].isoformat() if row["created_at"] else None,
    }


# ── Admin: consented examination only ─────────────────────────────────────


@router.get("/api/admin/members/{member_id}/tools/{surface}/notes")
def admin_read_member_notes(member_id: int, surface: str, request: Request) -> dict:
    """Admin content read — denied without valid grant (IN-2, PD-7, AF-B1)."""
    admin = require_admin(request)
    admin_id = int(admin["identity_id"])
    if surface not in ("trade_log", "journal", "playbook"):
        raise HTTPException(status_code=404, detail="Unknown surface")

    # Commit audit even when denying (transaction would roll back on HTTPException).
    grant = None
    rows: list = []
    with db.transaction() as conn:
        with conn.cursor() as cur:
            grant = privacy.active_grant(
                cur,
                member_identity_id=member_id,
                admin_identity_id=admin_id,
                surface=surface,
            )
            if grant is None:
                privacy.audit(
                    cur,
                    actor_identity_id=admin_id,
                    subject_identity_id=member_id,
                    action="deny",
                    surfaces=[surface],
                    detail="no valid consent grant",
                )
            else:
                cur.execute(
                    """SELECT id, surface, body_md, created_at, updated_at
                       FROM member_tool_notes
                       WHERE identity_id = %s AND surface = %s
                       ORDER BY id DESC""",
                    (member_id, surface),
                )
                rows = cur.fetchall()
                privacy.audit(
                    cur,
                    actor_identity_id=admin_id,
                    subject_identity_id=member_id,
                    action="read",
                    surfaces=[surface],
                    consent_grant_id=int(grant["id"]),
                )
    if grant is None:
        raise HTTPException(
            status_code=403,
            detail="Member consent required for this surface (no valid grant)",
        )
    return {
        "member_identity_id": member_id,
        "surface": surface,
        "consent_grant_id": int(grant["id"]),
        "notes": [
            {
                "id": r["id"],
                "body_md": r["body_md"],
                "created_at": r["created_at"].isoformat() if r["created_at"] else None,
            }
            for r in rows
        ],
    }


@router.get("/api/admin/privacy/min-cohort-k")
def admin_min_cohort(request: Request) -> dict:
    """Expose D-2 default for aggregate implementers (W7)."""
    require_admin(request)
    return {"min_cohort_k": MIN_COHORT_K}
