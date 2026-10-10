"""Admin affiliate registry + credit-tier rules (LK Phase 3b — see
Specs/Links-Attribution-Affiliates-Spec-v0_2.md). Admin only. Never
self-serve (AF-L4/AF-L12): every affiliate row starts pending and only
an admin approval provisions an identity.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

import db
import identity as identity_mod
from guards import require_admin
from links.credits import balance

router = APIRouter(prefix="/api/admin/affiliates", tags=["admin-affiliates"])


@router.get("")
def list_affiliates(request: Request) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, name, email, status, identity_id, approved_at, approved_by, created_at
                FROM affiliates ORDER BY created_at DESC
                """
            )
            rows = cur.fetchall()
            out = []
            for r in rows:
                bal = balance(cur, r["identity_id"]) if r["identity_id"] else None
                out.append({**r, "credit_balance": bal})
    return {"affiliates": out}


@router.post("")
async def create_affiliate(request: Request) -> dict:
    require_admin(request)
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}
    name = (body.get("name") or "").strip()
    email = (body.get("email") or "").strip().lower()
    if not name:
        raise HTTPException(status_code=422, detail="name is required")
    if not email or "@" not in email:
        raise HTTPException(status_code=422, detail="a valid email is required")
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO affiliates (name, email, status) VALUES (%s, %s, 'pending')",
                    (name, email),
                )
                row_id = cur.lastrowid
                cur.execute(
                    """
                    SELECT id, name, email, status, identity_id, approved_at, approved_by, created_at
                    FROM affiliates WHERE id=%s
                    """,
                    (row_id,),
                )
                row = cur.fetchone()
    except Exception as exc:
        if "ux_affiliates_email" in str(exc):
            raise HTTPException(status_code=409, detail="an affiliate with this email already exists") from exc
        raise
    return {"affiliate": row}


@router.patch("/{affiliate_id}")
async def update_affiliate(affiliate_id: int, request: Request) -> dict:
    claims = require_admin(request)
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}
    new_status = (body.get("status") or "").strip()
    if new_status not in ("approved", "revoked", "pending"):
        raise HTTPException(status_code=422, detail="status must be pending, approved, or revoked")

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM affiliates WHERE id=%s", (affiliate_id,))
            row = cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="unknown affiliate")

            identity_id = row["identity_id"]
            if new_status == "approved" and identity_id is None:
                # AF-L12: provision (or reuse, if the email already matches a
                # member) an identity — never a membership row.
                identity_id = identity_mod.get_or_create_identity(cur, row["email"], row["name"])
                cur.execute(
                    """
                    UPDATE affiliates
                    SET status=%s, identity_id=%s, approved_at=UTC_TIMESTAMP(6), approved_by=%s
                    WHERE id=%s
                    """,
                    (new_status, identity_id, str(claims.get("identity_id", "")), affiliate_id),
                )
            else:
                cur.execute("UPDATE affiliates SET status=%s WHERE id=%s", (new_status, affiliate_id))

            cur.execute(
                """
                SELECT id, name, email, status, identity_id, approved_at, approved_by, created_at
                FROM affiliates WHERE id=%s
                """,
                (affiliate_id,),
            )
            out = cur.fetchone()
    return {"affiliate": out}


@router.get("/tier-rules")
def list_tier_rules(request: Request) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT price_id, credits, label FROM credit_tier_rules ORDER BY credits")
            rows = cur.fetchall()
    return {"rules": rows}


@router.post("/tier-rules")
async def upsert_tier_rule(request: Request) -> dict:
    require_admin(request)
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}
    price_id = (body.get("price_id") or "").strip()
    label = (body.get("label") or "").strip()
    credits = body.get("credits")
    if not price_id:
        raise HTTPException(status_code=422, detail="price_id is required")
    if not label:
        raise HTTPException(status_code=422, detail="label is required")
    if not isinstance(credits, int) or isinstance(credits, bool) or credits < 0:
        raise HTTPException(status_code=422, detail="credits must be a non-negative integer")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO credit_tier_rules (price_id, credits, label)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE credits=VALUES(credits), label=VALUES(label)
                """,
                (price_id, credits, label),
            )
    return {"rule": {"price_id": price_id, "credits": credits, "label": label}}


@router.delete("/tier-rules/{price_id}")
def delete_tier_rule(price_id: str, request: Request) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM credit_tier_rules WHERE price_id=%s", (price_id,))
    return {"deleted": True}
