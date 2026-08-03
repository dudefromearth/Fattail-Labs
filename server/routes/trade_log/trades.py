"""Trade Log trades CRUD + list routes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

import db
import trade_log_catalog as cat
from guards import require_session
from routes.trade_log.common import (
    _dec,
    _ensure_default_account,
    _get_account,
    _insert_legs,
    _load_legs,
    _load_member_book,
    _load_trade,
    _maybe_set_account_venue,
    _parse_exec_at,
    _process_fields,
    _require_tool_member,
    _storage_identity_id,
    _trade_row,
    _validate_leg,
)

router = APIRouter(tags=["trade-log"])

@router.get("/api/me/trade-log")
@router.get("/api/me/trade-log/trades")
def list_trades(request: Request, account_id: int | None = None) -> dict:
    claims = require_session(request)
    _require_tool_member(claims, capability="read")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            default_acct = _ensure_default_account(cur, iid)
            # Full multi-year books must not be silently truncated (Reports/analytics).
            trades, accounts = _load_member_book(cur, iid, account_id)
            default_account_id = int(default_acct["id"])
    # Legacy key for old clients/tests that expect entries (prose-shaped)
    entries = [
        {
            "id": t["id"],
            "traded_on": (t["exec_at"] or "")[:10] if t.get("exec_at") else None,
            "setup_md": t["setup_md"],
            "plan_md": t["plan_md"],
            "rules_md": t["rules_md"],
            "adherence": t["adherence"],
            "deviation_md": t["deviation_md"],
            "lesson_md": t["lesson_md"],
            "pnl_amount": t["pnl_amount"],
            "created_at": t.get("created_at"),
            "updated_at": t.get("updated_at"),
        }
        for t in trades
    ]
    return {
        "trades": trades,
        "accounts": accounts,
        "default_account_id": default_account_id,
        "entries": entries,
    }


@router.get("/api/me/trade-log/trades/{trade_id}")
def get_trade(trade_id: int, request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            return _load_trade(cur, trade_id, iid)


@router.post("/api/me/trade-log")
@router.post("/api/me/trade-log/trades")
async def create_trade(request: Request) -> dict:
    """Create multi-leg trade, or legacy prose body → NOTE trade (no legs)."""
    claims = require_session(request)
    _require_tool_member(claims)
    body = await request.json()
    legs_in = body.get("legs")
    # Legacy MVP shape: process fields only
    if legs_in is None and body.get("strategy") is None and (
        body.get("setup_md") is not None or body.get("plan_md") is not None
    ):
        body = {
            **body,
            "strategy": "NOTE",
            "legs": [],
            "exec_at": body.get("traded_on") or body.get("exec_at"),
        }
        legs_in = []

    strategy = (body.get("strategy") or "CUSTOM").upper()
    if strategy not in cat.STRATEGY_CODES:
        raise HTTPException(status_code=422, detail=f"unknown strategy: {strategy}")
    asset_class = (body.get("asset_class") or "equity_option").lower()
    if asset_class not in cat.ASSET_CLASSES:
        raise HTTPException(status_code=422, detail="invalid asset_class")
    order_type = (body.get("order_type") or "LMT").upper()[:32]
    net_side = body.get("net_side")
    if net_side:
        net_side = str(net_side).upper()
        if net_side not in cat.NET_SIDES:
            raise HTTPException(status_code=422, detail="net_side must be DEBIT|CREDIT")
    else:
        net_side = None
    net_price = _dec(body.get("net_price"))
    proc = _process_fields(body)
    legs = legs_in if isinstance(legs_in, list) else []
    if strategy != "NOTE" and len(legs) == 0 and strategy not in ("CUSTOM", "NOTE"):
        # allow empty for STOCK etc if they send one leg — require ≥1 for non-NOTE
        if strategy not in ("NOTE",):
            pass  # allow zero legs for flexibility in P1; UI sends legs for spreads
    exec_at = _parse_exec_at(body.get("exec_at") or body.get("traded_on"))

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            if body.get("account_id") is not None:
                acct = _get_account(cur, iid, int(body["account_id"]))
            else:
                acct = _ensure_default_account(cur, iid)
            account_id = int(acct["id"])
            # First trade may assign venue if still provisional
            chosen = (body.get("broker") or body.get("venue") or "").strip()
            if acct.get("broker") == cat.UNSET_VENUE:
                if not chosen or chosen == cat.UNSET_VENUE:
                    # Legacy prose NOTE without venue → FatTail canonical book
                    if strategy == "NOTE" and not chosen:
                        chosen = "fattail"
                    else:
                        raise HTTPException(
                            status_code=422,
                            detail={
                                "message": "Choose a venue for this account "
                                "(broker, sim, or FatTail canonical) on first trade",
                                "code": "VENUE_REQUIRED",
                            },
                        )
                _maybe_set_account_venue(
                    cur,
                    iid,
                    account_id,
                    broker=chosen,
                    broker_label=(body.get("broker_label") or None),
                    only_if_unset=True,
                )
            elif chosen and chosen != cat.UNSET_VENUE:
                # Optional: user may re-bind only if still unset (above); ignore re-pick
                pass
            cur.execute(
                """INSERT INTO member_trade_log_trades
                     (identity_id, account_id, exec_at, asset_class, strategy, order_type,
                      net_price, net_side, setup_md, plan_md, rules_md, adherence,
                      deviation_md, lesson_md, pnl_amount)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (
                    iid,
                    account_id,
                    exec_at,
                    asset_class,
                    strategy,
                    order_type,
                    net_price,
                    net_side,
                    proc["setup_md"],
                    proc["plan_md"],
                    proc["rules_md"],
                    proc["adherence"],
                    proc["deviation_md"],
                    proc["lesson_md"],
                    proc["pnl_amount"],
                ),
            )
            tid = int(cur.lastrowid)
            _insert_legs(cur, tid, iid, account_id, legs)
            out = _load_trade(cur, tid, iid)
    return out


@router.patch("/api/me/trade-log/trades/{trade_id}")
async def patch_trade(trade_id: int, request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims)
    body = await request.json()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            cur.execute(
                """SELECT * FROM member_trade_log_trades
                   WHERE id = %s AND identity_id = %s""",
                (trade_id, iid),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Trade not found")
            account_id = int(row["account_id"])
            if body.get("account_id") is not None:
                acct = _get_account(cur, iid, int(body["account_id"]))
                account_id = int(acct["id"])
            strategy = (body.get("strategy") or row["strategy"]).upper()
            if strategy not in cat.STRATEGY_CODES:
                raise HTTPException(status_code=422, detail="unknown strategy")
            asset_class = (body.get("asset_class") or row.get("asset_class") or "equity_option").lower()
            order_type = (body.get("order_type") or row.get("order_type") or "LMT").upper()[:32]
            net_side = body.get("net_side", row.get("net_side"))
            if net_side:
                net_side = str(net_side).upper()
                if net_side not in cat.NET_SIDES:
                    raise HTTPException(status_code=422, detail="net_side must be DEBIT|CREDIT")
            else:
                net_side = None
            net_price = (
                _dec(body["net_price"])
                if "net_price" in body
                else row.get("net_price")
            )
            exec_at = (
                _parse_exec_at(body["exec_at"])
                if body.get("exec_at") is not None
                else row["exec_at"]
            )
            merged = {
                "setup_md": body.get("setup_md", row.get("setup_md")),
                "plan_md": body.get("plan_md", row.get("plan_md")),
                "rules_md": body.get("rules_md", row.get("rules_md")),
                "adherence": body.get("adherence", row.get("adherence")),
                "deviation_md": body.get("deviation_md", row.get("deviation_md")),
                "lesson_md": body.get("lesson_md", row.get("lesson_md")),
                "pnl_amount": body.get("pnl_amount", row.get("pnl_amount")),
            }
            proc = _process_fields(merged)
            cur.execute(
                """UPDATE member_trade_log_trades
                   SET account_id=%s, exec_at=%s, asset_class=%s, strategy=%s,
                       order_type=%s, net_price=%s, net_side=%s,
                       setup_md=%s, plan_md=%s, rules_md=%s, adherence=%s,
                       deviation_md=%s, lesson_md=%s, pnl_amount=%s
                   WHERE id=%s AND identity_id=%s""",
                (
                    account_id,
                    exec_at,
                    asset_class,
                    strategy,
                    order_type,
                    net_price,
                    net_side,
                    proc["setup_md"],
                    proc["plan_md"],
                    proc["rules_md"],
                    proc["adherence"],
                    proc["deviation_md"],
                    proc["lesson_md"],
                    proc["pnl_amount"],
                    trade_id,
                    iid,
                ),
            )
            if "legs" in body:
                if not isinstance(body["legs"], list):
                    raise HTTPException(status_code=422, detail="legs must be a list")
                cur.execute(
                    "DELETE FROM member_trade_log_legs WHERE trade_id = %s AND identity_id = %s",
                    (trade_id, iid),
                )
                _insert_legs(cur, trade_id, iid, account_id, body["legs"])
            return _load_trade(cur, trade_id, iid)


@router.delete("/api/me/trade-log/{trade_id}")
@router.delete("/api/me/trade-log/trades/{trade_id}")
def delete_trade(trade_id: int, request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            cur.execute(
                """DELETE FROM member_trade_log_trades
                   WHERE id = %s AND identity_id = %s""",
                (trade_id, iid),
            )
            if cur.rowcount == 0:
                # legacy table fallback
                cur.execute(
                    """DELETE FROM member_trade_log_entries
                       WHERE id = %s AND identity_id = %s""",
                    (trade_id, iid),
                )
                if cur.rowcount == 0:
                    raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True, "id": trade_id}

