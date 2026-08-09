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
    _require_tool_member(claims, capability="read")
    # Hide provisional "unset" from pickers — only used server-side at provision
    venues = [v for v in cat.VENUES if v["code"] != cat.UNSET_VENUE]
    return {"venues": venues, "strategies": cat.STRATEGIES}


# --- Accounts ----------------------------------------------------------------


@router.get("/api/me/trade-log/accounts")
def list_accounts(request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims, capability="read")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            _ensure_default_account(cur, iid)
            # trade_count = structure opens (and notes), not raw fills.
            # ToS import stores open + close as separate trade rows; counting
            # every row double-counts ~round-trips (e.g. 1474 fills → ~737 books).
            # Align with structure.trade_is_close_fill: close when TO_CLOSE > TO_OPEN.
            # B5: aggregate legs once scoped by identity (not unscoped global GROUP BY).
            cur.execute(
                """SELECT a.*, COALESCE(tc.cnt, 0) AS trade_count
                   FROM member_trade_log_accounts a
                   LEFT JOIN (
                     SELECT t.account_id AS account_id, COUNT(*) AS cnt
                     FROM member_trade_log_trades t
                     LEFT JOIN (
                       SELECT trade_id,
                              SUM(CASE WHEN pos_effect = 'TO_CLOSE' THEN 1 ELSE 0 END)
                                AS n_close,
                              SUM(CASE WHEN pos_effect = 'TO_OPEN' THEN 1 ELSE 0 END)
                                AS n_open
                       FROM member_trade_log_legs
                       WHERE identity_id = %s
                       GROUP BY trade_id
                     ) leg ON leg.trade_id = t.id
                     WHERE t.identity_id = %s
                       AND COALESCE(leg.n_close, 0) <= COALESCE(leg.n_open, 0)
                     GROUP BY t.account_id
                   ) tc ON tc.account_id = a.id
                   WHERE a.identity_id = %s
                   ORDER BY a.status ASC, a.sort_order ASC, a.id ASC""",
                (iid, iid, iid),
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
    # Default: FatTail book (canonical storage). Not a connected broker.
    broker = (body.get("broker") or cat.CANONICAL_BOOK_VENUE).strip()
    if broker not in cat.VENUE_CODES or broker == cat.UNSET_VENUE:
        broker = cat.CANONICAL_BOOK_VENUE
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
            starting = body.get("starting_balance")
            if starting is not None and starting != "":
                try:
                    starting = float(starting)
                except (TypeError, ValueError):
                    raise HTTPException(
                        status_code=422, detail="starting_balance must be a number"
                    )
            else:
                starting = None
            cur.execute(
                """INSERT INTO member_trade_log_accounts
                     (identity_id, label, broker, broker_label, currency, starting_balance,
                      status, badge_color, sort_order, notes_md)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (
                    iid,
                    label[:128],
                    broker,
                    broker_label,
                    (body.get("currency") or "USD")[:8],
                    starting,
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
            try:
                import practice_spine_domain as psd

                psd.on_account_created(cur, iid, int(row["id"]))
            except Exception:
                pass
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
            starting = row.get("starting_balance")
            if "starting_balance" in body:
                raw_start = body.get("starting_balance")
                if raw_start is None or raw_start == "":
                    starting = None
                else:
                    try:
                        starting = float(raw_start)
                    except (TypeError, ValueError):
                        raise HTTPException(
                            status_code=422, detail="starting_balance must be a number"
                        )
            bp_posture = row.get("buying_power_posture") or "arbitrary"
            bp_value = row.get("buying_power_value")
            bp_as_of = row.get("buying_power_as_of")
            if "buying_power_posture" in body or "buying_power_value" in body:
                if "buying_power_posture" in body:
                    bp_posture = str(body.get("buying_power_posture") or "arbitrary").lower()
                if bp_posture not in ("arbitrary", "self_report", "live_sync"):
                    raise HTTPException(
                        status_code=422, detail="invalid buying_power_posture"
                    )
                if "buying_power_value" in body:
                    raw_bp = body.get("buying_power_value")
                    if raw_bp is None or raw_bp == "":
                        bp_value = None
                    else:
                        try:
                            bp_value = float(raw_bp)
                        except (TypeError, ValueError):
                            raise HTTPException(
                                status_code=422,
                                detail="buying_power_value must be a number",
                            )
                if bp_posture == "arbitrary":
                    bp_value = None
                    bp_as_of = None
                elif bp_posture == "self_report" and (
                    "buying_power_value" in body or "buying_power_posture" in body
                ):
                    from datetime import datetime, timezone

                    bp_as_of = datetime.now(timezone.utc).replace(tzinfo=None)
            cur.execute(
                """UPDATE member_trade_log_accounts
                   SET label=%s, broker=%s, broker_label=%s, currency=%s,
                       starting_balance=%s,
                       buying_power_posture=%s, buying_power_value=%s,
                       buying_power_as_of=%s, status=%s,
                       badge_color=%s, sort_order=%s, notes_md=%s
                   WHERE id=%s AND identity_id=%s""",
                (
                    str(label)[:128],
                    broker,
                    broker_label,
                    (body.get("currency") or row.get("currency") or "USD")[:8],
                    starting,
                    bp_posture,
                    bp_value,
                    bp_as_of,
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

