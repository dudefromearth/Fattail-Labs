"""Accounts & Capital API — Capital v0.3 · Funding v0.2 · Positions View v0.2."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Request

import capital_domain as cap
import capital_positions as cpos
import db
from guards import require_session
from routes.trade_log.common import (
    _load_member_book,
    _require_tool_member,
    _storage_identity_id,
)

router = APIRouter(tags=["capital"])


def _raise(exc: cap.CapitalError) -> None:
    raise HTTPException(status_code=exc.code, detail=exc.detail)


@router.get("/api/me/capital/overview")
def capital_overview(request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims, capability="read")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            return cap.capital_overview(cur, iid)


@router.get("/api/me/capital/positions-valuation")
def positions_valuation(
    request: Request,
    account_id: int | None = Query(None),
    campaign_id: int | None = Query(None),
    undirected: bool | None = Query(None),
    asset_class: str | None = Query(None),
) -> dict:
    """Open book × marks — Positions View Spec v0.2. MySQL hot path only."""
    claims = require_session(request)
    _require_tool_member(claims, capability="read")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)

            def load_book(c, identity_id, acct):
                return _load_member_book(c, identity_id, acct)

            return cpos.positions_valuation(
                cur,
                iid,
                account_id=account_id,
                campaign_id=campaign_id,
                undirected=undirected,
                asset_class=asset_class,
                load_book=load_book,
            )


@router.patch("/api/me/capital/accounts/{account_id}/buying-power")
async def patch_account_buying_power(account_id: int, request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims)
    body = await request.json()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            try:
                row = cap.patch_account_buying_power(
                    cur, iid, int(account_id), body or {}
                )
            except cap.CapitalError as e:
                _raise(e)
            return {"account": row}


@router.get("/api/me/capital/prefs")
def get_prefs(request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims, capability="read")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            return {"prefs": cap.get_or_create_prefs(cur, iid)}


@router.patch("/api/me/capital/prefs")
async def patch_prefs(request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims)
    body = await request.json()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            try:
                prefs = cap.patch_prefs(cur, iid, body or {})
            except cap.CapitalError as e:
                _raise(e)
            return {"prefs": prefs}


@router.get("/api/me/capital/accounts/{account_id}/movements")
def list_movements(account_id: int, request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims, capability="read")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            try:
                rows = cap.list_movements(cur, iid, int(account_id))
            except cap.CapitalError as e:
                _raise(e)
            return {"movements": rows, "account_id": int(account_id)}


@router.post("/api/me/capital/accounts/{account_id}/movements")
async def add_movement(account_id: int, request: Request) -> dict:
    claims = require_session(request)
    _require_tool_member(claims)
    body = await request.json()
    amount = body.get("amount")
    if amount is None or amount == "":
        raise HTTPException(status_code=422, detail="amount is required")
    try:
        amount_f = float(amount)
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail="amount must be a number")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            try:
                row = cap.add_movement(
                    cur,
                    iid,
                    int(account_id),
                    amount=amount_f,
                    occurred_at=body.get("occurred_at"),
                    note=body.get("note"),
                    reverses_movement_id=(
                        int(body["reverses_movement_id"])
                        if body.get("reverses_movement_id") not in (None, "")
                        else None
                    ),
                )
            except cap.CapitalError as e:
                _raise(e)
            overview = cap.capital_overview(cur, iid)
            return {"movement": row, "overview": overview}
