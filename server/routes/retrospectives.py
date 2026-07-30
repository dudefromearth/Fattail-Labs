"""Retrospective APIs — Journal-Retrospective Spec v0.5 (R1b entitlement).

Create from Journal type; gather dual report; complete sets next scope boundary.
Create/gather: plan-aware §10.1. List/get/complete/abandon: session + isolation
(downgrade preserves access to own rows).
"""

from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request

import db
import retrospective_agent as ra
import retrospective_domain as rd
from guards import require_session
from routes.trade_log.common import (
    _load_member_book,
    _storage_identity_id,
)

router = APIRouter(tags=["retrospectives"])


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _require_create_or_gather(cur, claims: dict, identity_id: int) -> None:
    """Spec §10.1 — fail loud 403."""
    role = str(claims.get("role") or "observer")
    if not rd.can_create_or_gather(cur, identity_id, role):
        raise HTTPException(status_code=403, detail=rd.CREATE_DENY_DETAIL)


@router.get("/api/me/retrospectives/preview-scope")
def preview_scope(request: Request) -> dict:
    """Show maiden vs since-last before create (Journal confirm UI)."""
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            _require_create_or_gather(cur, claims, iid)
            scope = rd.resolve_scope(cur, iid, now=_now())
    return {
        "is_maiden": scope["is_maiden"],
        "scope_start": rd._iso(scope["scope_start"]),
        "scope_end": rd._iso(scope["scope_end"]),
        "prior_id": scope["prior_id"],
        "prior_completed_at": scope["prior_completed_at"],
        "label": (
            "Maiden journey — first full look-back"
            if scope["is_maiden"]
            else "Since your last completed retrospective"
        ),
    }


@router.get("/api/me/retrospectives")
def list_retrospectives(request: Request) -> dict:
    """List own retros — any authenticated identity (isolation only)."""
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            cur.execute(
                """SELECT id, identity_id, status, is_maiden, scope_start, scope_end,
                          title, body_md, report_json, comparison_json, agent_json,
                          completed_at, created_at, updated_at
                   FROM member_retrospectives
                   WHERE identity_id = %s AND status <> 'abandoned'
                   ORDER BY COALESCE(completed_at, created_at) DESC
                   LIMIT 100""",
                (iid,),
            )
            rows = cur.fetchall()
    return {"retrospectives": [rd.serialize_row(r) for r in rows]}


@router.post("/api/me/retrospectives")
async def create_retrospective(request: Request) -> dict:
    """Start from Journal type=Retrospective. Auto-gather dual report."""
    claims = require_session(request)
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}
    title = str(body.get("title") or "").strip()[:255]
    run_gather = body.get("gather", True)
    if not isinstance(run_gather, bool):
        run_gather = True

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            _require_create_or_gather(cur, claims, iid)
            open_r = rd.open_retrospective(cur, iid)
            if open_r:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        f"You already have an open retrospective "
                        f"(id={open_r['id']}, status={open_r['status']}). "
                        "Complete or abandon it before starting another."
                    ),
                )
            scope = rd.resolve_scope(cur, iid, now=_now())
            is_maiden = bool(scope["is_maiden"])
            if not title:
                title = (
                    "Maiden journey"
                    if is_maiden
                    else f"Retrospective {scope['scope_end'].date().isoformat()}"
                )
            cur.execute(
                """INSERT INTO member_retrospectives
                     (identity_id, status, is_maiden, scope_start, scope_end,
                      title, body_md)
                   VALUES (%s, 'draft', %s, %s, %s, %s, '')""",
                (
                    iid,
                    1 if is_maiden else 0,
                    scope["scope_start"],
                    scope["scope_end"],
                    title,
                ),
            )
            rid = int(cur.lastrowid)
            if run_gather:
                _run_gather(cur, claims, iid, rid)
            cur.execute(
                """SELECT id, identity_id, status, is_maiden, scope_start, scope_end,
                          title, body_md, report_json, comparison_json, agent_json,
                          completed_at, created_at, updated_at
                   FROM member_retrospectives
                   WHERE id = %s AND identity_id = %s""",
                (rid, iid),
            )
            row = cur.fetchone()
    return rd.serialize_row(row)


def _run_gather(cur, claims: dict, iid: int, rid: int) -> None:
    cur.execute(
        """SELECT id, status, is_maiden, scope_start, scope_end
           FROM member_retrospectives
           WHERE id = %s AND identity_id = %s""",
        (rid, iid),
    )
    row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Retrospective not found")
    if row["status"] == "complete":
        raise HTTPException(status_code=409, detail="Already complete")
    if row["status"] == "abandoned":
        raise HTTPException(status_code=409, detail="Abandoned")

    cur.execute(
        """UPDATE member_retrospectives SET status = 'gathering'
           WHERE id = %s AND identity_id = %s""",
        (rid, iid),
    )
    trades, _accounts = _load_member_book(cur, iid, None)
    prior = rd.last_complete_retrospective(cur, iid)
    prior_id = int(prior["id"]) if prior else None
    is_maiden = bool(row["is_maiden"])
    report, comparison = rd.gather_report(
        cur,
        iid,
        row["scope_start"],
        row["scope_end"],
        is_maiden=is_maiden,
        prior_id=None if is_maiden else prior_id,
        role=str(claims.get("role") or "activator"),
        trades=trades,
    )
    scope_end = datetime.now(timezone.utc).replace(tzinfo=None)
    cur.execute(
        """UPDATE member_retrospectives
           SET status = 'ready',
               scope_end = %s,
               report_json = %s,
               comparison_json = %s
           WHERE id = %s AND identity_id = %s""",
        (
            scope_end,
            json.dumps(report),
            json.dumps(comparison),
            rid,
            iid,
        ),
    )


@router.post("/api/me/retrospectives/{retro_id}/gather")
def gather_retrospective(retro_id: int, request: Request) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            _require_create_or_gather(cur, claims, iid)
            _run_gather(cur, claims, iid, retro_id)
            cur.execute(
                """SELECT id, identity_id, status, is_maiden, scope_start, scope_end,
                          title, body_md, report_json, comparison_json, agent_json,
                          completed_at, created_at, updated_at
                   FROM member_retrospectives
                   WHERE id = %s AND identity_id = %s""",
                (retro_id, iid),
            )
            row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Retrospective not found")
    return rd.serialize_row(row)


@router.get("/api/me/retrospectives/{retro_id}")
def get_retrospective(retro_id: int, request: Request) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            cur.execute(
                """SELECT id, identity_id, status, is_maiden, scope_start, scope_end,
                          title, body_md, report_json, comparison_json, agent_json,
                          completed_at, created_at, updated_at
                   FROM member_retrospectives
                   WHERE id = %s AND identity_id = %s""",
                (retro_id, iid),
            )
            row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Retrospective not found")
    return rd.serialize_row(row)


@router.patch("/api/me/retrospectives/{retro_id}")
async def patch_retrospective(retro_id: int, request: Request) -> dict:
    claims = require_session(request)
    try:
        body = await request.json()
    except Exception as exc:
        raise HTTPException(status_code=422, detail="JSON body required") from exc
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")

    updates: list[str] = []
    params: list = []
    if "title" in body:
        updates.append("title = %s")
        params.append(str(body.get("title") or "").strip()[:255])
    if "body_md" in body:
        updates.append("body_md = %s")
        params.append(str(body.get("body_md") or ""))
    if not updates:
        raise HTTPException(status_code=422, detail="No recognized fields")

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            params.extend([retro_id, iid])
            cur.execute(
                f"""UPDATE member_retrospectives
                   SET {", ".join(updates)}
                   WHERE id = %s AND identity_id = %s
                     AND status IN ('draft', 'ready', 'complete')""",
                tuple(params),
            )
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Not found or not editable")
            cur.execute(
                """SELECT id, identity_id, status, is_maiden, scope_start, scope_end,
                          title, body_md, report_json, comparison_json, agent_json,
                          completed_at, created_at, updated_at
                   FROM member_retrospectives
                   WHERE id = %s AND identity_id = %s""",
                (retro_id, iid),
            )
            row = cur.fetchone()
    return rd.serialize_row(row)


@router.post("/api/me/retrospectives/{retro_id}/complete")
def complete_retrospective(retro_id: int, request: Request) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            cur.execute(
                """SELECT id, status FROM member_retrospectives
                   WHERE id = %s AND identity_id = %s""",
                (retro_id, iid),
            )
            row = cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Not found")
            if row["status"] == "complete":
                pass  # idempotent
            elif row["status"] not in ("ready", "draft"):
                raise HTTPException(
                    status_code=409,
                    detail=f"Cannot complete from status {row['status']}",
                )
            else:
                # Ensure gather ran — gather needs create entitlement
                if row["status"] == "draft":
                    _require_create_or_gather(cur, claims, iid)
                    _run_gather(cur, claims, iid, retro_id)
                cur.execute(
                    """UPDATE member_retrospectives
                       SET status = 'complete', completed_at = CURRENT_TIMESTAMP
                       WHERE id = %s AND identity_id = %s""",
                    (retro_id, iid),
                )
            cur.execute(
                """SELECT id, identity_id, status, is_maiden, scope_start, scope_end,
                          title, body_md, report_json, comparison_json, agent_json,
                          completed_at, created_at, updated_at
                   FROM member_retrospectives
                   WHERE id = %s AND identity_id = %s""",
                (retro_id, iid),
            )
            out = cur.fetchone()
    return rd.serialize_row(out)


@router.post("/api/me/retrospectives/{retro_id}/abandon")
def abandon_retrospective(retro_id: int, request: Request) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            cur.execute(
                """UPDATE member_retrospectives SET status = 'abandoned'
                   WHERE id = %s AND identity_id = %s
                     AND status IN ('draft', 'gathering', 'ready')""",
                (retro_id, iid),
            )
            if cur.rowcount == 0:
                raise HTTPException(
                    status_code=409,
                    detail="Not found or already complete/abandoned",
                )
    return {"ok": True, "id": retro_id, "status": "abandoned"}


@router.post("/api/me/retrospectives/{retro_id}/analyze")
def analyze_retrospective(retro_id: int, request: Request) -> dict:
    """Spec §8 agent analyze — fail loud if unconfigured; local mode only (R5)."""
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            _require_create_or_gather(cur, claims, iid)
            cur.execute(
                """SELECT id, identity_id, status, is_maiden, scope_start, scope_end,
                          title, body_md, report_json, comparison_json, agent_json,
                          completed_at, created_at, updated_at
                   FROM member_retrospectives
                   WHERE id = %s AND identity_id = %s""",
                (retro_id, iid),
            )
            row = cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Retrospective not found")
            if row["status"] not in ("ready", "complete"):
                raise HTTPException(
                    status_code=409,
                    detail="Gather a dual report before running analysis",
                )
            report = row.get("report_json")
            if isinstance(report, (bytes, bytearray)):
                report = report.decode("utf-8")
            if isinstance(report, str):
                try:
                    report = json.loads(report)
                except json.JSONDecodeError:
                    report = None
            if not isinstance(report, dict):
                raise HTTPException(
                    status_code=409,
                    detail="No staged report — run gather first",
                )

            role = str(claims.get("role") or "observer")
            has_trial = rd.has_active_plan_slug(cur, iid, rd.OBSERVER_TRIAL_SLUG)
            try:
                agent_out = ra.run_analyze(
                    report,
                    role=role,
                    has_observer_trial=has_trial,
                )
            except ra.AgentConfigError as exc:
                raise HTTPException(status_code=503, detail=str(exc)) from exc
            except PermissionError as exc:
                raise HTTPException(status_code=403, detail=str(exc)) from exc
            except ra.AgentValidationError as exc:
                raise HTTPException(status_code=422, detail=str(exc)) from exc

            cur.execute(
                """UPDATE member_retrospectives
                   SET agent_json = %s
                   WHERE id = %s AND identity_id = %s""",
                (json.dumps(agent_out), retro_id, iid),
            )
            cur.execute(
                """SELECT id, identity_id, status, is_maiden, scope_start, scope_end,
                          title, body_md, report_json, comparison_json, agent_json,
                          completed_at, created_at, updated_at
                   FROM member_retrospectives
                   WHERE id = %s AND identity_id = %s""",
                (retro_id, iid),
            )
            out = cur.fetchone()
    return rd.serialize_row(out)
