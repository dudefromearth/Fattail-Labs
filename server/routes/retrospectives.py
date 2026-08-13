"""Retrospective APIs — Journal-Retrospective Spec v0.5 (R1b entitlement).

Create from Journal type; gather dual report; complete sets next scope boundary.
Create/gather: plan-aware §10.1. List/get/complete/abandon: session + isolation
(downgrade preserves access to own rows).
"""

from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query, Request

import db
import journal_session_domain as jsd
import retrospective_agent as ra
import retrospective_domain as rd
from guards import require_session
from routes.trade_log.common import (
    _get_account,
    _load_member_book,
    _storage_identity_id,
)

router = APIRouter(tags=["retrospectives"])

# Library list defaults (member retrospective main page pages 10 at a time).
LIST_DEFAULT_LIMIT = 10
LIST_MAX_LIMIT = 100


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
            readiness = rd.build_start_readiness(cur, iid, scope, now=_now())
            history = rd.build_cadence_history(cur, iid)
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
        "readiness": readiness,
        "history": history,
    }


@router.get("/api/me/retrospectives")
def list_retrospectives(
    request: Request,
    limit: int = Query(
        default=LIST_DEFAULT_LIMIT,
        ge=1,
        le=LIST_MAX_LIMIT,
        description="Page size (default 10, max 100)",
    ),
    offset: int = Query(
        default=0,
        ge=0,
        description="Rows to skip (page_index * limit)",
    ),
) -> dict:
    """List own retros — any authenticated identity (isolation only).

    Paged: default ``limit=10``. Response includes ``total`` for library pager UI.
    """
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            cur.execute(
                """SELECT COUNT(*) AS n
                   FROM member_retrospectives
                   WHERE identity_id = %s AND status <> 'abandoned'""",
                (iid,),
            )
            total = int((cur.fetchone() or {}).get("n") or 0)
            cur.execute(
                """SELECT id, identity_id, status, is_maiden, scope_start, scope_end,
                          title, body_md, report_json, comparison_json, agent_json,
                          prompt_version_id, cadence_days_at_period, period_index,
                          interrupted, completed_at, created_at, updated_at
                   FROM member_retrospectives
                   WHERE identity_id = %s AND status <> 'abandoned'
                   ORDER BY COALESCE(completed_at, created_at) DESC
                   LIMIT %s OFFSET %s""",
                (iid, int(limit), int(offset)),
            )
            rows = cur.fetchall()
    return {
        "retrospectives": [rd.serialize_row(r) for r in rows],
        "total": total,
        "limit": int(limit),
        "offset": int(offset),
    }


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
    account_id = body.get("account_id")
    if account_id is not None:
        try:
            account_id = int(account_id)
        except (TypeError, ValueError) as exc:
            raise HTTPException(
                status_code=422, detail="account_id must be an integer"
            ) from exc

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
            # Spec v0.7.1 — period_index, cadence stamp, interruption flag,
            # prompt version stamp (R8 · mirror Journal J3)
            period_index = rd.next_period_index(cur, iid)
            cadence_days = rd.effective_cadence_days(cur, iid, claims)
            interrupted = rd.period_was_interrupted(
                cur, iid, scope["scope_start"], scope["scope_end"], cadence_days
            )
            prompt_vid = ra.active_prompt_version_id(cur)
            cur.execute(
                """INSERT INTO member_retrospectives
                     (identity_id, status, is_maiden, scope_start, scope_end,
                      title, body_md, prompt_version_id, cadence_days_at_period,
                      period_index, interrupted)
                   VALUES (%s, 'draft', %s, %s, %s, %s, '', %s, %s, %s, %s)""",
                (
                    iid,
                    1 if is_maiden else 0,
                    scope["scope_start"],
                    scope["scope_end"],
                    title,
                    prompt_vid,
                    cadence_days,
                    period_index,
                    1 if interrupted else 0,
                ),
            )
            rid = int(cur.lastrowid)
            if run_gather:
                _run_gather(cur, claims, iid, rid, account_id=account_id)
            cur.execute(
                """SELECT id, identity_id, status, is_maiden, scope_start, scope_end,
                          title, body_md, report_json, comparison_json, agent_json,
                          prompt_version_id, cadence_days_at_period, period_index,
                          interrupted, completed_at, created_at, updated_at
                   FROM member_retrospectives
                   WHERE id = %s AND identity_id = %s""",
                (rid, iid),
            )
            row = cur.fetchone()
    return rd.serialize_row(row)


def _run_gather(
    cur,
    claims: dict,
    iid: int,
    rid: int,
    account_id: int | None = None,
) -> None:
    """Gather dual report.

    account_id scopes the book sample only (Practice Context Spec v0.2 §2 / §4).
    Stored permanently on the report so completed retrospectives ignore later
    chrome changes.
    """
    cur.execute(
        """SELECT id, status, is_maiden, scope_start, scope_end,
                  cadence_days_at_period, interrupted
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
    # Book is account-scoped; steps 1–8 stay trader-level (domain uses iid).
    book_account_id = int(account_id) if account_id is not None else None
    account_scope: dict = {"account_id": None, "label": "All accounts"}
    if book_account_id is not None:
        acct = _get_account(cur, iid, book_account_id)
        account_scope = {
            "account_id": int(acct["id"]),
            "label": str(acct.get("label") or f"Account {book_account_id}"),
            "broker": acct.get("broker"),
        }
    trades, _accounts = _load_member_book(cur, iid, book_account_id)
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
    # Freeze account scope at gather — completed renders ignore chrome (§4).
    report["account_scope"] = account_scope
    # Spec §9 — stamp interruption notice into report (stated, not scolded)
    notice = rd.build_interruption_notice(
        interrupted=bool(row.get("interrupted")),
        scope_start=row.get("scope_start"),
        scope_end=row.get("scope_end"),
        cadence_days=(
            int(row["cadence_days_at_period"])
            if row.get("cadence_days_at_period") is not None
            else None
        ),
        is_maiden=is_maiden,
        prior_completed_at=row.get("scope_start"),
    )
    report["interruption"] = notice
    scope_end = datetime.now(timezone.utc).replace(tzinfo=None)
    # Refresh notice with final scope_end after Option C end = gather time
    if notice is not None:
        notice = rd.build_interruption_notice(
            interrupted=True,
            scope_start=row.get("scope_start"),
            scope_end=scope_end,
            cadence_days=(
                int(row["cadence_days_at_period"])
                if row.get("cadence_days_at_period") is not None
                else None
            ),
            is_maiden=is_maiden,
            prior_completed_at=row.get("scope_start"),
        )
        report["interruption"] = notice
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
async def gather_retrospective(retro_id: int, request: Request) -> dict:
    claims = require_session(request)
    body: dict = {}
    try:
        raw = await request.json()
        if isinstance(raw, dict):
            body = raw
    except Exception:
        body = {}
    account_id = body.get("account_id")
    if account_id is not None:
        try:
            account_id = int(account_id)
        except (TypeError, ValueError) as exc:
            raise HTTPException(
                status_code=422, detail="account_id must be an integer"
            ) from exc
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            _require_create_or_gather(cur, claims, iid)
            _run_gather(cur, claims, iid, retro_id, account_id=account_id)
            cur.execute(
                """SELECT id, identity_id, status, is_maiden, scope_start, scope_end,
                          title, body_md, report_json, comparison_json, agent_json,
                          prompt_version_id, cadence_days_at_period, period_index,
                          interrupted, completed_at, created_at, updated_at
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
                          prompt_version_id, cadence_days_at_period, period_index,
                          interrupted, completed_at, created_at, updated_at
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
                          prompt_version_id, cadence_days_at_period, period_index,
                          interrupted, completed_at, created_at, updated_at
                   FROM member_retrospectives
                   WHERE id = %s AND identity_id = %s""",
                (retro_id, iid),
            )
            row = cur.fetchone()
    return rd.serialize_row(row)


@router.get("/api/me/retrospectives/{retro_id}/closure-preview")
def closure_preview(retro_id: int, request: Request) -> dict:
    """Dates that will close on complete (Session Spec §10 · Appendix B)."""
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            cur.execute(
                """SELECT id, scope_start, scope_end, status
                   FROM member_retrospectives
                   WHERE id = %s AND identity_id = %s""",
                (retro_id, iid),
            )
            row = cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Not found")
            preview = jsd.preview_closures_for_retro(
                cur,
                iid,
                scope_start=row["scope_start"],
                scope_end=row["scope_end"],
            )
    return preview


@router.post("/api/me/retrospectives/{retro_id}/complete")
def complete_retrospective(retro_id: int, request: Request) -> dict:
    claims = require_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            cur.execute(
                """SELECT id, status, scope_start, scope_end FROM member_retrospectives
                   WHERE id = %s AND identity_id = %s""",
                (retro_id, iid),
            )
            row = cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Not found")
            closed_dates: list[str] = []
            if row["status"] == "complete":
                # Idempotent re-apply closures for safety
                closed_dates = jsd.apply_closures_on_retro_complete(
                    cur,
                    iid,
                    retrospective_id=retro_id,
                    scope_start=row["scope_start"],
                    scope_end=row["scope_end"],
                )
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
                        """SELECT scope_start, scope_end FROM member_retrospectives
                           WHERE id = %s AND identity_id = %s""",
                        (retro_id, iid),
                    )
                    refreshed = cur.fetchone()
                    if refreshed:
                        row = {**row, **refreshed}
                cur.execute(
                    """UPDATE member_retrospectives
                       SET status = 'complete', completed_at = CURRENT_TIMESTAMP
                       WHERE id = %s AND identity_id = %s""",
                    (retro_id, iid),
                )
                # Session Spec §10 — close NY days strictly before gather date
                closed_dates = jsd.apply_closures_on_retro_complete(
                    cur,
                    iid,
                    retrospective_id=retro_id,
                    scope_start=row["scope_start"],
                    scope_end=row["scope_end"],
                )
            cur.execute(
                """SELECT id, identity_id, status, is_maiden, scope_start, scope_end,
                          title, body_md, report_json, comparison_json, agent_json,
                          prompt_version_id, cadence_days_at_period, period_index,
                          interrupted, completed_at, created_at, updated_at
                   FROM member_retrospectives
                   WHERE id = %s AND identity_id = %s""",
                (retro_id, iid),
            )
            out = cur.fetchone()
    result = rd.serialize_row(out)
    result["closed_journal_dates"] = closed_dates
    result["gather_date_stays_open"] = True
    return result


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
async def analyze_retrospective(retro_id: int, request: Request) -> dict:
    """Spec §16 sequence agent — holds order; no prescribe; stamps prompt version.

    Body (optional): ``{"focused_step": 1-9}`` — one step focus for the turn.
    """
    claims = require_session(request)
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}
    focused_step = body.get("focused_step")
    try:
        focused_step_n = int(focused_step) if focused_step is not None else None
    except (TypeError, ValueError):
        focused_step_n = None

    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = _storage_identity_id(cur, claims)
            _require_create_or_gather(cur, claims, iid)
            cur.execute(
                """SELECT id, identity_id, status, is_maiden, scope_start, scope_end,
                          title, body_md, report_json, comparison_json, agent_json,
                          prompt_version_id, cadence_days_at_period, period_index,
                          interrupted, completed_at, created_at, updated_at
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
                    detail="Gather a dual report before running the sequence agent",
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
            # Stamp / refresh prompt version at sequence run (R8)
            pvid = row.get("prompt_version_id") or ra.active_prompt_version_id(cur)
            _, prompt_body = ra.load_active_prompt_body(cur)
            if not row.get("prompt_version_id"):
                cur.execute(
                    """UPDATE member_retrospectives
                       SET prompt_version_id = %s
                       WHERE id = %s AND identity_id = %s""",
                    (pvid, retro_id, iid),
                )
            cause_filled = bool(str(row.get("body_md") or "").strip())
            try:
                agent_out = ra.run_analyze(
                    report,
                    role=role,
                    has_observer_trial=has_trial,
                    prompt_version_id=str(pvid),
                    focused_step=focused_step_n,
                    cause_filled=cause_filled,
                    prompt_body=prompt_body,
                )
            except ra.AgentConfigError as exc:
                raise HTTPException(status_code=503, detail=str(exc)) from exc
            except PermissionError as exc:
                raise HTTPException(status_code=403, detail=str(exc)) from exc
            except ra.AgentValidationError as exc:
                raise HTTPException(status_code=422, detail=str(exc)) from exc

            cur.execute(
                """UPDATE member_retrospectives
                   SET agent_json = %s,
                       prompt_version_id = COALESCE(prompt_version_id, %s)
                   WHERE id = %s AND identity_id = %s""",
                (json.dumps(agent_out), pvid, retro_id, iid),
            )
            cur.execute(
                """SELECT id, identity_id, status, is_maiden, scope_start, scope_end,
                          title, body_md, report_json, comparison_json, agent_json,
                          prompt_version_id, cadence_days_at_period, period_index,
                          interrupted, completed_at, created_at, updated_at
                   FROM member_retrospectives
                   WHERE id = %s AND identity_id = %s""",
                (retro_id, iid),
            )
            out = cur.fetchone()
    return rd.serialize_row(out)
