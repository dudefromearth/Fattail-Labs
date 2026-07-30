"""Habit plans API — Journal Retrospective Spec v0.5 §9.2 / §18 (R4).

Isolation: identity_id only. Max 2 active → 409 fail loud.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

import db
import retrospective_domain as rd
from guards import require_session
from routes.trade_log.common import _storage_identity_id

router = APIRouter(tags=["habit-plans"])


def _require_practice(cur, claims: dict, identity_id: int) -> None:
    role = str(claims.get("role") or "observer")
    if not rd.can_create_or_gather(cur, identity_id, role):
        raise HTTPException(status_code=403, detail=rd.CREATE_DENY_DETAIL)


@router.get("/api/me/habit-plans")
def list_plans(request: Request) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            plans = rd.list_habit_plans(cur, iid)
    return {"habit_plans": plans, "max_active": rd.MAX_ACTIVE_HABIT_PLANS}


@router.post("/api/me/habit-plans")
async def create_plan(request: Request) -> dict:
    claims = require_session(request)
    try:
        body = await request.json()
    except Exception as exc:
        raise HTTPException(status_code=422, detail="JSON body required") from exc
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")

    title = str(body.get("title") or "").strip()[:255]
    habit = str(body.get("habit") or "").strip()[:512]
    why = str(body.get("why_process") or "")
    if not habit and not title:
        raise HTTPException(
            status_code=422, detail="title or habit is required"
        )
    try:
        signal = rd.validate_observable_signal(
            str(body.get("observable_signal") or "")
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    status = str(body.get("status") or "proposed").strip()
    try:
        status = rd.validate_habit_status(status)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    if status not in ("proposed", "active"):
        raise HTTPException(
            status_code=422,
            detail="create status must be proposed or active",
        )

    retro_id = body.get("retrospective_id")
    if retro_id is not None:
        try:
            retro_id = int(retro_id)
        except (TypeError, ValueError) as exc:
            raise HTTPException(
                status_code=422, detail="retrospective_id must be int"
            ) from exc

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            _require_practice(cur, claims, iid)
            if retro_id is not None:
                cur.execute(
                    """SELECT id FROM member_retrospectives
                       WHERE id = %s AND identity_id = %s""",
                    (retro_id, iid),
                )
                if cur.fetchone() is None:
                    raise HTTPException(
                        status_code=404, detail="Retrospective not found"
                    )
            if status == "active":
                n = rd.count_active_habit_plans(cur, iid, for_update=True)
                if n >= rd.MAX_ACTIVE_HABIT_PLANS:
                    raise HTTPException(
                        status_code=409,
                        detail=(
                            f"At most {rd.MAX_ACTIVE_HABIT_PLANS} active habit "
                            "plans — keep, lapse, or retire one first"
                        ),
                    )
            cur.execute(
                """INSERT INTO member_habit_plans
                     (identity_id, retrospective_id, title, habit, why_process,
                      observable_signal, status, activated_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s,
                           CASE WHEN %s = 'active' THEN CURRENT_TIMESTAMP ELSE NULL END)""",
                (
                    iid,
                    retro_id,
                    title or habit[:255],
                    habit or title,
                    why,
                    signal,
                    status,
                    status,
                ),
            )
            pid = int(cur.lastrowid)
            row = rd.get_habit_plan(cur, iid, pid)
    return rd.serialize_habit_plan(row)


@router.get("/api/me/habit-plans/{plan_id}")
def get_plan(plan_id: int, request: Request) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            row = rd.get_habit_plan(cur, iid, plan_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Habit plan not found")
    return rd.serialize_habit_plan(row)


@router.patch("/api/me/habit-plans/{plan_id}")
async def patch_plan(plan_id: int, request: Request) -> dict:
    claims = require_session(request)
    try:
        body = await request.json()
    except Exception as exc:
        raise HTTPException(status_code=422, detail="JSON body required") from exc
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            _require_practice(cur, claims, iid)
            # Lock row + count under identity for activate races
            cur.execute(
                """SELECT * FROM member_habit_plans
                   WHERE id = %s AND identity_id = %s
                   FOR UPDATE""",
                (plan_id, iid),
            )
            row = cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Habit plan not found")

            updates: list[str] = []
            params: list = []

            if "title" in body:
                updates.append("title = %s")
                params.append(str(body.get("title") or "").strip()[:255])
            if "habit" in body:
                updates.append("habit = %s")
                params.append(str(body.get("habit") or "").strip()[:512])
            if "why_process" in body:
                updates.append("why_process = %s")
                params.append(str(body.get("why_process") or ""))
            if "observable_signal" in body:
                try:
                    sig = rd.validate_observable_signal(
                        str(body.get("observable_signal") or "")
                    )
                except ValueError as exc:
                    raise HTTPException(status_code=422, detail=str(exc)) from exc
                updates.append("observable_signal = %s")
                params.append(sig)

            new_status = None
            if "status" in body:
                try:
                    new_status = rd.validate_habit_status(
                        str(body.get("status") or "")
                    )
                except ValueError as exc:
                    raise HTTPException(status_code=422, detail=str(exc)) from exc
                old = row["status"]
                if not rd.can_transition_habit(old, new_status):
                    raise HTTPException(
                        status_code=409,
                        detail=f"Cannot transition habit plan from {old} to {new_status}",
                    )
                if new_status == "active" and old != "active":
                    n = rd.count_active_habit_plans(cur, iid, for_update=True)
                    if n >= rd.MAX_ACTIVE_HABIT_PLANS:
                        raise HTTPException(
                            status_code=409,
                            detail=(
                                f"At most {rd.MAX_ACTIVE_HABIT_PLANS} active habit "
                                "plans — keep, lapse, or retire one first"
                            ),
                        )
                    updates.append("status = %s")
                    params.append(new_status)
                    updates.append("activated_at = COALESCE(activated_at, CURRENT_TIMESTAMP)")
                    updates.append("retired_at = NULL")
                elif new_status in rd.HABIT_TERMINAL:
                    updates.append("status = %s")
                    params.append(new_status)
                    if new_status == "retired":
                        updates.append("retired_at = CURRENT_TIMESTAMP")
                else:
                    updates.append("status = %s")
                    params.append(new_status)

            if not updates:
                raise HTTPException(status_code=422, detail="No recognized fields")

            params.extend([plan_id, iid])
            cur.execute(
                f"""UPDATE member_habit_plans
                   SET {", ".join(updates)}
                   WHERE id = %s AND identity_id = %s""",
                tuple(params),
            )
            out = rd.get_habit_plan(cur, iid, plan_id)
    return rd.serialize_habit_plan(out)


@router.delete("/api/me/habit-plans/{plan_id}")
def delete_plan(plan_id: int, request: Request) -> dict:
    """Delete only proposed (never activated) plans; else retire."""
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            _require_practice(cur, claims, iid)
            cur.execute(
                """SELECT * FROM member_habit_plans
                   WHERE id = %s AND identity_id = %s FOR UPDATE""",
                (plan_id, iid),
            )
            row = cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Habit plan not found")
            if row["status"] == "proposed" and row.get("activated_at") is None:
                cur.execute(
                    """DELETE FROM member_habit_plans
                       WHERE id = %s AND identity_id = %s""",
                    (plan_id, iid),
                )
                return {"ok": True, "id": plan_id, "deleted": True}
            cur.execute(
                """UPDATE member_habit_plans
                   SET status = 'retired', retired_at = CURRENT_TIMESTAMP
                   WHERE id = %s AND identity_id = %s""",
                (plan_id, iid),
            )
    return {"ok": True, "id": plan_id, "status": "retired"}
