"""Trade Log trades CRUD + list routes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

import db
import trade_log_catalog as cat
from guards import require_session
from routes.trade_log.common import (
    _TRADE_PAGE_DEFAULT,
    _dec,
    _ensure_default_account,
    _get_account,
    _insert_legs,
    _load_legs,
    _load_member_book,
    _load_member_book_page,
    _load_trade,
    _maybe_set_account_venue,
    _normalize_entry_source,
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
def list_trades(
    request: Request,
    account_id: int | None = None,
    limit: int | None = None,
    cursor: str | None = None,
    full: bool = False,
    practice_campaign_id: int | None = None,
    playbook_entry_id: int | None = None,
) -> dict:
    """List trades for the blotter.

    **Default (lazy):** newest-first page (`limit` default 80, max 200) with
    ``has_more`` / ``next_cursor`` for load-more. Keeps browser memory bounded.

    **full=1:** legacy full-book load (capped server-side) for tools that need it.
    Reports/Journal analytics use dedicated analytics routes (server domain), not this.

    Spine filters (Phase 1): ``practice_campaign_id``, ``playbook_entry_id``.
    """
    claims = require_session(request)
    _require_tool_member(claims, capability="read")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            default_acct = _ensure_default_account(cur, iid)
            default_account_id = int(default_acct["id"])
            if full:
                trades, accounts = _load_member_book(
                    cur,
                    iid,
                    account_id,
                    practice_campaign_id=practice_campaign_id,
                    playbook_entry_id=playbook_entry_id,
                )
                has_more = False
                next_cursor = None
            else:
                page_limit = limit if limit is not None else _TRADE_PAGE_DEFAULT
                trades, accounts, has_more, next_cursor = _load_member_book_page(
                    cur,
                    iid,
                    account_id,
                    limit=page_limit,
                    cursor=cursor,
                    practice_campaign_id=practice_campaign_id,
                    playbook_entry_id=playbook_entry_id,
                )
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
        "has_more": has_more,
        "next_cursor": next_cursor,
        "page_limit": None if full else (limit if limit is not None else _TRADE_PAGE_DEFAULT),
    }


@router.get("/api/me/trade-log/opens")
def list_unmatched_opens(
    request: Request,
    account_id: int | None = None,
) -> dict:
    """Unmatched open fills only — server-side match (full book), small payload.

    Used by Open:N filter without downloading the entire blotter to the client.
    """
    claims = require_session(request)
    _require_tool_member(claims, capability="read")
    from trade_log_domain.matching import match_open_close

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            default_acct = _ensure_default_account(cur, iid)
            trades, accounts = _load_member_book(cur, iid, account_id)
            matched = match_open_close(trades)
            opens = [m["open"] for m in matched if m.get("close") is None]
    return {
        "trades": opens,
        "accounts": accounts,
        "default_account_id": int(default_acct["id"]),
        "count": len(opens),
    }


@router.get("/api/me/trade-log/trades/{trade_id}")
def get_trade(trade_id: int, request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            return _load_trade(cur, trade_id, iid)


@router.get("/api/me/trade-log/trades/{trade_id}/chart")
def get_trade_chart(
    trade_id: int,
    request: Request,
    tf: str = "15m",
) -> dict:
    """Static underlier OHLC for trade review (Phase 2 charts).

    Query: ``tf=5m|15m|1d`` (default 15m).
    Fail loud: missing/stale bars → ``ok: false`` with empty bars (never a fake path).
    SPX/XSP/VIX use labeled proxy series per Massive doctrine.
    """
    claims = require_session(request)
    _require_tool_member(claims, capability="read")
    from market_data.trade_chart_service import build_trade_chart

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            trade = _load_trade(cur, trade_id, iid)
            # Pair open/close from same-account book for hold window + markers.
            account_id = int(trade["account_id"]) if trade.get("account_id") else None
            book, _accounts = _load_member_book(cur, iid, account_id)
            return build_trade_chart(cur, trade, book=book, tf=tf)


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
            entry_source = _normalize_entry_source(
                body.get("entry_source"), default="manual"
            )
            playbook_entry_id = body.get("playbook_entry_id")
            practice_campaign_id = body.get("practice_campaign_id")
            try:
                import practice_spine_domain as psd

                pb_id = (
                    int(playbook_entry_id)
                    if playbook_entry_id not in (None, "")
                    else None
                )
                camp_id = (
                    int(practice_campaign_id)
                    if practice_campaign_id not in (None, "")
                    else None
                )
                psd.assert_playbook_owned(cur, iid, pb_id)
                psd.assert_campaign_owned(cur, iid, camp_id)
            except Exception as exc:
                from practice_spine_domain import PracticeSpineError

                if isinstance(exc, PracticeSpineError):
                    raise HTTPException(status_code=exc.code, detail=exc.detail) from exc
                if playbook_entry_id not in (None, "") or practice_campaign_id not in (
                    None,
                    "",
                ):
                    # missing tables pre-migration — fail loud
                    raise
                pb_id, camp_id = None, None
            cur.execute(
                """INSERT INTO member_trade_log_trades
                     (identity_id, account_id, exec_at, asset_class, strategy, order_type,
                      net_price, net_side, setup_md, plan_md, rules_md, adherence,
                      deviation_md, lesson_md, pnl_amount, entry_source,
                      playbook_entry_id, practice_campaign_id)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
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
                    entry_source,
                    pb_id,
                    camp_id,
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
            pb_id = row.get("playbook_entry_id")
            camp_id = row.get("practice_campaign_id")
            if "playbook_entry_id" in body:
                pb_id = (
                    int(body["playbook_entry_id"])
                    if body.get("playbook_entry_id") not in (None, "")
                    else None
                )
            if "practice_campaign_id" in body:
                camp_id = (
                    int(body["practice_campaign_id"])
                    if body.get("practice_campaign_id") not in (None, "")
                    else None
                )
            try:
                import practice_spine_domain as psd

                psd.assert_playbook_owned(
                    cur, iid, int(pb_id) if pb_id is not None else None
                )
                psd.assert_campaign_owned(
                    cur, iid, int(camp_id) if camp_id is not None else None
                )
            except Exception as exc:
                from practice_spine_domain import PracticeSpineError

                if isinstance(exc, PracticeSpineError):
                    raise HTTPException(status_code=exc.code, detail=exc.detail) from exc
            cur.execute(
                """UPDATE member_trade_log_trades
                   SET account_id=%s, exec_at=%s, asset_class=%s, strategy=%s,
                       order_type=%s, net_price=%s, net_side=%s,
                       setup_md=%s, plan_md=%s, rules_md=%s, adherence=%s,
                       deviation_md=%s, lesson_md=%s, pnl_amount=%s,
                       playbook_entry_id=%s, practice_campaign_id=%s
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
                    pb_id,
                    camp_id,
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

