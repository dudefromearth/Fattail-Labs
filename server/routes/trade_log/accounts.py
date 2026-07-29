"""Trade Log accounts + venues routes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

import db
import trade_log_catalog as cat
from guards import require_session
from routes.trade_log.common import (
    _account_row,
    _count_active,
    _ensure_default_account,
    _get_account,
    _require_tool_member,
    _storage_identity_id,
)

router = APIRouter(tags=["trade-log"])

@router.get("/api/me/trade-log/venues")
def list_venues(request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims)
    # Hide provisional "unset" from pickers — only used server-side at provision
    venues = [v for v in cat.VENUES if v["code"] != cat.UNSET_VENUE]
    return {"venues": venues, "strategies": cat.STRATEGIES}


# --- Accounts ----------------------------------------------------------------


@router.get("/api/me/trade-log/accounts")
def list_accounts(request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            _ensure_default_account(cur, iid)
            cur.execute(
                """SELECT * FROM member_trade_log_accounts
                   WHERE identity_id = %s
                   ORDER BY status ASC, sort_order ASC, id ASC""",
                (iid,),
            )
            rows = cur.fetchall()
    return {"accounts": [_account_row(r) for r in rows]}


@router.post("/api/me/trade-log/accounts")
async def create_account(request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims)
    body = await request.json()
    label = (body.get("label") or "").strip()
    if not label:
        raise HTTPException(status_code=422, detail="label is required")
    broker = (body.get("broker") or "").strip()
    if broker not in cat.VENUE_CODES or broker == cat.UNSET_VENUE:
        raise HTTPException(
            status_code=422,
            detail="broker (venue) is required — choose a broker, sim, or FatTail canonical",
        )
    broker_label = (body.get("broker_label") or "").strip() or None
    if broker in cat.OTHER_VENUES and not broker_label:
        raise HTTPException(status_code=422, detail="broker_label required when venue is other/other_sim")
    status = (body.get("status") or "active").strip()
    if status not in cat.ACCOUNT_STATUSES:
        raise HTTPException(status_code=422, detail="status must be active|archived")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            if status == "active" and _count_active(cur, iid) >= cat.MAX_ACTIVE_ACCOUNTS:
                raise HTTPException(
                    status_code=422,
                    detail=f"At most {cat.MAX_ACTIVE_ACCOUNTS} active accounts — archive one first",
                )
            cur.execute(
                """INSERT INTO member_trade_log_accounts
                     (identity_id, label, broker, broker_label, currency, status,
                      badge_color, sort_order, notes_md)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (
                    iid,
                    label[:128],
                    broker,
                    broker_label,
                    (body.get("currency") or "USD")[:8],
                    status,
                    body.get("badge_color"),
                    int(body.get("sort_order") or 0),
                    (body.get("notes_md") or "").strip() or None,
                ),
            )
            cur.execute(
                "SELECT * FROM member_trade_log_accounts WHERE id = %s",
                (cur.lastrowid,),
            )
            row = cur.fetchone()
    return _account_row(row)


@router.patch("/api/me/trade-log/accounts/{account_id}")
async def patch_account(account_id: int, request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims)
    body = await request.json()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            row = _get_account(cur, iid, account_id)
            label = body.get("label", row["label"])
            if isinstance(label, str):
                label = label.strip()
            if not label:
                raise HTTPException(status_code=422, detail="label is required")
            broker = body.get("broker", row["broker"])
            if broker not in cat.VENUE_CODES:
                raise HTTPException(status_code=422, detail="invalid broker venue")
            # Allow leaving unset only if already unset; user cannot PATCH to unset
            if broker == cat.UNSET_VENUE and row["broker"] != cat.UNSET_VENUE:
                raise HTTPException(
                    status_code=422,
                    detail="choose a broker, sim, or FatTail canonical venue",
                )
            broker_label = body.get("broker_label", row.get("broker_label"))
            if broker_label is not None:
                broker_label = str(broker_label).strip() or None
            if broker in cat.OTHER_VENUES and not broker_label:
                raise HTTPException(
                    status_code=422,
                    detail="broker_label required when venue is other/other_sim",
                )
            status = body.get("status", row["status"])
            if status not in cat.ACCOUNT_STATUSES:
                raise HTTPException(status_code=422, detail="status must be active|archived")
            if (
                status == "active"
                and row["status"] != "active"
                and _count_active(cur, iid) >= cat.MAX_ACTIVE_ACCOUNTS
            ):
                raise HTTPException(
                    status_code=422,
                    detail=f"At most {cat.MAX_ACTIVE_ACCOUNTS} active accounts",
                )
            cur.execute(
                """UPDATE member_trade_log_accounts
                   SET label=%s, broker=%s, broker_label=%s, currency=%s, status=%s,
                       badge_color=%s, sort_order=%s, notes_md=%s
                   WHERE id=%s AND identity_id=%s""",
                (
                    str(label)[:128],
                    broker,
                    broker_label,
                    (body.get("currency") or row.get("currency") or "USD")[:8],
                    status,
                    body.get("badge_color", row.get("badge_color")),
                    int(body["sort_order"]) if body.get("sort_order") is not None else row.get("sort_order") or 0,
                    (body.get("notes_md") if "notes_md" in body else row.get("notes_md")) or None,
                    account_id,
                    iid,
                ),
            )
            cur.execute(
                "SELECT * FROM member_trade_log_accounts WHERE id = %s",
                (account_id,),
            )
            return _account_row(cur.fetchone())

