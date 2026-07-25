"""Trade Log — process-first member tool (Family B).

Application Framework C5 · T-D5 · Member-Data-Privacy isolation.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

import auth
import db
from guards import require_session

router = APIRouter(tags=["trade-log"])

ADHERENCE = frozenset({"followed", "partial", "broke", "unknown"})


def _require_tool_member(claims: dict) -> int:
    """Mike default: activator+ for authored tools; administrators always."""
    role = claims["role"]
    if not (
        auth.role_at_least(role, "activator")
        or auth.role_at_least(role, "administrator")
    ):
        raise HTTPException(
            status_code=403,
            detail="Trade Log requires Activator membership or higher",
        )
    return int(claims["identity_id"])


def _row(r: dict) -> dict:
    return {
        "id": r["id"],
        "traded_on": r["traded_on"].isoformat() if r["traded_on"] else None,
        "setup_md": r["setup_md"] or "",
        "plan_md": r["plan_md"] or "",
        "rules_md": r["rules_md"] or "",
        "adherence": r["adherence"] or "unknown",
        "deviation_md": r["deviation_md"] or "",
        "lesson_md": r["lesson_md"] or "",
        "pnl_amount": float(r["pnl_amount"]) if r["pnl_amount"] is not None else None,
        "created_at": r["created_at"].isoformat() if r["created_at"] else None,
        "updated_at": r["updated_at"].isoformat() if r["updated_at"] else None,
    }


@router.get("/api/me/trade-log")
def list_entries(request: Request) -> dict:
    claims = require_session(request)
    iid = _require_tool_member(claims)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT * FROM member_trade_log_entries
                   WHERE identity_id = %s
                   ORDER BY COALESCE(traded_on, DATE(created_at)) DESC, id DESC
                   LIMIT 200""",
                (iid,),
            )
            rows = cur.fetchall()
    return {"entries": [_row(r) for r in rows]}


@router.post("/api/me/trade-log")
async def create_entry(request: Request) -> dict:
    claims = require_session(request)
    iid = _require_tool_member(claims)
    body = await request.json()
    adherence = (body.get("adherence") or "unknown").strip()
    if adherence not in ADHERENCE:
        raise HTTPException(status_code=422, detail=f"adherence must be one of {sorted(ADHERENCE)}")
    pnl = body.get("pnl_amount")
    if pnl is not None:
        try:
            pnl = float(pnl)
        except (TypeError, ValueError) as exc:
            raise HTTPException(status_code=422, detail="pnl_amount must be a number") from exc
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO member_trade_log_entries
                     (identity_id, traded_on, setup_md, plan_md, rules_md,
                      adherence, deviation_md, lesson_md, pnl_amount)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (
                    iid,
                    body.get("traded_on") or None,
                    (body.get("setup_md") or "").strip(),
                    (body.get("plan_md") or "").strip(),
                    (body.get("rules_md") or "").strip(),
                    adherence,
                    (body.get("deviation_md") or "").strip(),
                    (body.get("lesson_md") or "").strip(),
                    pnl,
                ),
            )
            eid = cur.lastrowid
            cur.execute(
                "SELECT * FROM member_trade_log_entries WHERE id = %s AND identity_id = %s",
                (eid, iid),
            )
            row = cur.fetchone()
    return _row(row)


@router.delete("/api/me/trade-log/{entry_id}")
def delete_entry(entry_id: int, request: Request) -> dict:
    claims = require_session(request)
    iid = _require_tool_member(claims)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM member_trade_log_entries WHERE id = %s AND identity_id = %s",
                (entry_id, iid),
            )
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True, "id": entry_id}
