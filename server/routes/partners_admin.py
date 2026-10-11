"""Admin partner registry (LK Phase 4b — see
Specs/Links-Growth-Acquisition-Spec-v0_1.md, ruled by
Specs/Links-Growth-Acquisition-Spec-v0_2.md §2). Deliberately separate
from the affiliates/credit-tier registry (PM-L1) — cash or comp'd
membership, never store credit. Never self-serve (mirrors AF-L4/
AF-L12): every partner row starts pending and only an admin approval
provisions an identity.

No cash ledger, no invoice, no payable-status field anywhere in this
module (PM-L3/Q11) — the dollar-equivalent total is computed read-only
from the existing link_attributions attribution signal on every read,
never stored.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

import db
import identity as identity_mod
from guards import require_admin

router = APIRouter(prefix="/api/admin/partners", tags=["admin-partners"])

_TERMS_TYPES = ("cash", "comp_membership")
_STATUSES = ("pending", "approved", "revoked")

_PARTNER_COLUMNS = (
    "id, name, email, company, terms_type, terms_cents, terms_plan_id, "
    "status, identity_id, approved_at, approved_by, created_at"
)


def _signups_and_total(cur, identity_id: int, terms_type: str, terms_cents: int | None) -> dict:
    """PM-L3/Q11: a read-only dollar-equivalent total, computed from the
    existing attribution signal (D8: the signal, never a ledger) —
    never stored, never an invoice or payable record."""
    cur.execute(
        """
        SELECT COUNT(*) AS n FROM link_attributions
        WHERE slug IN (SELECT slug FROM links WHERE owner = %s)
        """,
        (str(identity_id),),
    )
    signups = cur.fetchone()["n"]
    total_cents = signups * terms_cents if terms_type == "cash" and terms_cents else None
    return {"signups": signups, "total_cents": total_cents}


@router.get("")
def list_partners(request: Request) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(f"SELECT {_PARTNER_COLUMNS} FROM partners ORDER BY created_at DESC")
            rows = cur.fetchall()
            out = []
            for r in rows:
                stats = (
                    _signups_and_total(cur, r["identity_id"], r["terms_type"], r["terms_cents"])
                    if r["identity_id"]
                    else {"signups": 0, "total_cents": None}
                )
                out.append({**r, **stats})
    return {"partners": out}


@router.post("")
async def create_partner(request: Request) -> dict:
    require_admin(request)
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}
    name = (body.get("name") or "").strip()
    email = (body.get("email") or "").strip().lower()
    company = (body.get("company") or "").strip() or None
    terms_type = (body.get("terms_type") or "").strip()
    terms_cents = body.get("terms_cents")
    terms_plan_id = body.get("terms_plan_id")

    if not name:
        raise HTTPException(status_code=422, detail="name is required")
    if not email or "@" not in email:
        raise HTTPException(status_code=422, detail="a valid email is required")
    if terms_type not in _TERMS_TYPES:
        raise HTTPException(status_code=422, detail="terms_type must be cash or comp_membership")

    if terms_type == "cash":
        if not isinstance(terms_cents, int) or isinstance(terms_cents, bool) or terms_cents <= 0:
            raise HTTPException(
                status_code=422, detail="terms_cents must be a positive integer for cash terms"
            )
        terms_plan_id = None
    else:
        if (
            not isinstance(terms_plan_id, int)
            or isinstance(terms_plan_id, bool)
            or terms_plan_id <= 0
        ):
            raise HTTPException(
                status_code=422,
                detail="terms_plan_id must be a positive integer for comp_membership terms",
            )
        terms_cents = None

    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                if terms_plan_id is not None:
                    cur.execute("SELECT id FROM plans WHERE id=%s", (terms_plan_id,))
                    if cur.fetchone() is None:
                        raise HTTPException(status_code=422, detail="unknown terms_plan_id")
                cur.execute(
                    """
                    INSERT INTO partners (name, email, company, terms_type, terms_cents, terms_plan_id, status)
                    VALUES (%s, %s, %s, %s, %s, %s, 'pending')
                    """,
                    (name, email, company, terms_type, terms_cents, terms_plan_id),
                )
                row_id = cur.lastrowid
                cur.execute(f"SELECT {_PARTNER_COLUMNS} FROM partners WHERE id=%s", (row_id,))
                row = cur.fetchone()
    except HTTPException:
        raise
    except Exception as exc:
        if "ux_partners_email" in str(exc):
            raise HTTPException(
                status_code=409, detail="a partner with this email already exists"
            ) from exc
        raise
    return {"partner": row}


@router.patch("/{partner_id}")
async def update_partner(partner_id: int, request: Request) -> dict:
    claims = require_admin(request)
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}
    new_status = (body.get("status") or "").strip()
    if new_status not in _STATUSES:
        raise HTTPException(status_code=422, detail="status must be pending, approved, or revoked")

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM partners WHERE id=%s", (partner_id,))
            row = cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="unknown partner")

            identity_id = row["identity_id"]
            if new_status == "approved" and identity_id is None:
                # PM-L2: reuse AF-L12's exact pattern — a minimal identities
                # row, no membership, so links.owner stays one consistent
                # type (identity_id) everywhere in the app.
                identity_id = identity_mod.get_or_create_identity(cur, row["email"], row["name"])
                cur.execute(
                    """
                    UPDATE partners
                    SET status=%s, identity_id=%s, approved_at=UTC_TIMESTAMP(6), approved_by=%s
                    WHERE id=%s
                    """,
                    (new_status, identity_id, str(claims.get("identity_id", "")), partner_id),
                )
            else:
                cur.execute("UPDATE partners SET status=%s WHERE id=%s", (new_status, partner_id))

            cur.execute(f"SELECT {_PARTNER_COLUMNS} FROM partners WHERE id=%s", (partner_id,))
            out = cur.fetchone()
    return {"partner": out}


@router.post("/{partner_id}/grant-membership")
def grant_membership(partner_id: int, request: Request) -> dict:
    """PM-L4/D19: a real membership grant for a comp_membership partner
    — identity.upsert_membership() directly, never a faked checkout,
    never a Stripe API call. Admin-initiated; calling it again is a
    harmless re-grant (upsert_membership is itself idempotent on
    (identity_id, plan_id, source))."""
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM partners WHERE id=%s", (partner_id,))
            row = cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="unknown partner")
            if row["terms_type"] != "comp_membership":
                raise HTTPException(status_code=422, detail="partner terms are not comp_membership")
            if row["status"] != "approved" or not row["identity_id"]:
                raise HTTPException(status_code=422, detail="partner must be approved first")
            if not row["terms_plan_id"]:
                raise HTTPException(status_code=422, detail="partner has no terms_plan_id configured")
            identity_mod.upsert_membership(
                cur,
                int(row["identity_id"]),
                int(row["terms_plan_id"]),
                "active",
                "partner-comp",
                external_ref=f"partner:{partner_id}",
            )
    return {"granted": True}
