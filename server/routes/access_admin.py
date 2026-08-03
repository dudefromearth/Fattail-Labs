"""Admin Access Policy API — Spec v0.4 §8.2. Administrator only. No public probe."""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Request

import db
from access_control.evaluate import evaluate
from access_control.keys import TargetKeyError, validate_target_key
from access_control.policy import load_policies_many, load_policy, policy_from_row
from access_control.revalidate import revalidate_for_targets
from access_control.types import TargetMeta
from access_control.viewer import viewer_from_claims, viewer_from_parts
from access_control.write_validate import PolicyWriteError, validate_policy_write
from guards import require_admin

router = APIRouter(prefix="/api/admin/access", tags=["admin-access"])


def _parse_dt(raw: Any) -> Optional[datetime]:
    if raw is None or raw == "":
        return None
    if isinstance(raw, datetime):
        return raw.replace(tzinfo=None) if raw.tzinfo else raw
    s = str(raw).strip().replace("Z", "+00:00")
    try:
        d = datetime.fromisoformat(s)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="invalid datetime") from exc
    if d.tzinfo is not None:
        d = d.replace(tzinfo=None)
    return d


def _json_dumps(val: Any) -> Optional[str]:
    if val is None:
        return None
    return json.dumps(val)


def _row_public(row: dict) -> dict:
    p = policy_from_row(row)
    return {
        "target_key": p.target_key,
        "enabled": p.enabled,
        "mode": p.mode,
        "min_role": p.min_role,
        "selected_plans": list(p.selected_plans) if p.selected_plans else None,
        "exact_plans_only": p.exact_plans_only,
        "all_plans": list(p.all_plans) if p.all_plans else None,
        "deny_plans": list(p.deny_plans) if p.deny_plans else None,
        "plan_role_combine": p.plan_role_combine,
        "require_signed_in": p.require_signed_in,
        "opens_at": row.get("opens_at").isoformat(sep=" ") if row.get("opens_at") else None,
        "closes_at": row.get("closes_at").isoformat(sep=" ") if row.get("closes_at") else None,
        "close_behavior": p.close_behavior,
        "deny_ui": p.deny_ui,
        "time_ui": p.time_ui,
        "campaign_id": p.campaign_id,
        "grandfather_enrollments": p.grandfather_enrollments,
        "label": p.label,
        "notes": p.notes,
        "version": p.version,
        "updated_by": row.get("updated_by"),
        "created_at": row["created_at"].isoformat(sep=" ") if row.get("created_at") else None,
        "updated_at": row["updated_at"].isoformat(sep=" ") if row.get("updated_at") else None,
    }


def _audit(cur, target_key: str, actor_id: int | None, action: str, before, after) -> None:
    cur.execute(
        """INSERT INTO access_policy_audit
             (target_key, actor_id, action, before_json, after_json)
           VALUES (%s, %s, %s, %s, %s)""",
        (
            target_key,
            actor_id,
            action,
            _json_dumps(before),
            _json_dumps(after),
        ),
    )


def _upsert(cur, fields: dict, actor_id: int | None) -> dict:
    cur.execute(
        "SELECT * FROM access_policies WHERE target_key = %s",
        (fields["target_key"],),
    )
    before_row = cur.fetchone()
    before = _row_public(before_row) if before_row else None

    opens = _parse_dt(fields.get("opens_at"))
    closes = _parse_dt(fields.get("closes_at"))

    cur.execute(
        """INSERT INTO access_policies (
             target_key, enabled, mode, min_role,
             selected_plans_json, exact_plans_only, all_plans_json, deny_plans_json,
             plan_role_combine, require_signed_in, opens_at, closes_at, close_behavior,
             deny_ui_json, time_ui_json, campaign_id, grandfather_enrollments,
             label, notes, version, updated_by
           ) VALUES (
             %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,1,%s
           )
           ON DUPLICATE KEY UPDATE
             enabled=VALUES(enabled),
             mode=VALUES(mode),
             min_role=VALUES(min_role),
             selected_plans_json=VALUES(selected_plans_json),
             exact_plans_only=VALUES(exact_plans_only),
             all_plans_json=VALUES(all_plans_json),
             deny_plans_json=VALUES(deny_plans_json),
             plan_role_combine=VALUES(plan_role_combine),
             require_signed_in=VALUES(require_signed_in),
             opens_at=VALUES(opens_at),
             closes_at=VALUES(closes_at),
             close_behavior=VALUES(close_behavior),
             deny_ui_json=VALUES(deny_ui_json),
             time_ui_json=VALUES(time_ui_json),
             campaign_id=VALUES(campaign_id),
             grandfather_enrollments=VALUES(grandfather_enrollments),
             label=VALUES(label),
             notes=VALUES(notes),
             version=version+1,
             updated_by=VALUES(updated_by)""",
        (
            fields["target_key"],
            fields["enabled"],
            fields["mode"],
            fields["min_role"],
            _json_dumps(fields["selected_plans"]),
            1 if fields["exact_plans_only"] else 0,
            _json_dumps(fields["all_plans"]),
            _json_dumps(fields["deny_plans"]),
            fields["plan_role_combine"],
            1 if fields["require_signed_in"] else 0,
            opens,
            closes,
            fields["close_behavior"],
            _json_dumps(fields["deny_ui"]),
            _json_dumps(fields["time_ui"]),
            fields.get("campaign_id"),
            1 if fields["grandfather_enrollments"] else 0,
            fields["label"],
            fields.get("notes"),
            actor_id,
        ),
    )
    cur.execute(
        "SELECT * FROM access_policies WHERE target_key = %s",
        (fields["target_key"],),
    )
    after_row = cur.fetchone()
    after = _row_public(after_row)
    action = "update" if before else "create"
    _audit(cur, fields["target_key"], actor_id, action, before, after)
    return after


@router.get("/policies")
def list_policies(request: Request, limit: int = 200) -> dict:
    require_admin(request)
    limit = max(1, min(int(limit), 1000))
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT * FROM access_policies
                   ORDER BY updated_at DESC LIMIT %s""",
                (limit,),
            )
            rows = cur.fetchall()
    return {"policies": [_row_public(r) for r in rows]}


@router.get("/policies/{target_key:path}")
def get_policy(target_key: str, request: Request) -> dict:
    require_admin(request)
    try:
        key = validate_target_key(target_key)
    except TargetKeyError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM access_policies WHERE target_key = %s", (key,))
            row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Policy not found")
    return _row_public(row)


@router.put("/policies/{target_key:path}")
async def put_policy(target_key: str, request: Request) -> dict:
    claims = require_admin(request)
    body = await request.json() if int(request.headers.get("content-length") or 0) else {}
    try:
        fields = validate_policy_write(target_key, body)
    except PolicyWriteError as exc:
        raise HTTPException(
            status_code=422,
            detail={"message": exc.message, "field": exc.field},
        ) from exc
    actor = int(claims["identity_id"]) if claims.get("identity_id") else None
    with db.transaction() as conn:
        with conn.cursor() as cur:
            after = _upsert(cur, fields, actor)
    revalidate_for_targets([fields["target_key"]])
    return after


@router.delete("/policies/{target_key:path}")
def delete_policy(target_key: str, request: Request) -> dict:
    claims = require_admin(request)
    try:
        key = validate_target_key(target_key)
    except TargetKeyError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    actor = int(claims["identity_id"]) if claims.get("identity_id") else None
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM access_policies WHERE target_key = %s", (key,))
            before_row = cur.fetchone()
            if before_row is None:
                raise HTTPException(status_code=404, detail="Policy not found")
            before = _row_public(before_row)
            cur.execute("DELETE FROM access_policies WHERE target_key = %s", (key,))
            _audit(cur, key, actor, "delete", before, None)
    revalidate_for_targets([key])
    return {"ok": True, "target_key": key}


@router.post("/policies/bulk")
async def bulk_policies(request: Request) -> dict:
    claims = require_admin(request)
    body = await request.json() if int(request.headers.get("content-length") or 0) else {}
    items = body.get("policies") or body.get("items") or []
    if not isinstance(items, list) or not items:
        raise HTTPException(status_code=422, detail="policies list required")
    actor = int(claims["identity_id"]) if claims.get("identity_id") else None
    results = []
    keys = []
    with db.transaction() as conn:
        with conn.cursor() as cur:
            for item in items:
                if not isinstance(item, dict):
                    raise HTTPException(status_code=422, detail="each policy must be object")
                tk = item.get("target_key")
                if not tk:
                    raise HTTPException(status_code=422, detail="target_key required on each item")
                try:
                    fields = validate_policy_write(str(tk), item)
                except PolicyWriteError as exc:
                    raise HTTPException(
                        status_code=422,
                        detail={
                            "message": exc.message,
                            "field": exc.field,
                            "target_key": tk,
                        },
                    ) from exc
                after = _upsert(cur, fields, actor)
                results.append(after)
                keys.append(fields["target_key"])
    revalidate_for_targets(keys)
    return {"policies": results, "count": len(results)}


@router.get("/decision")
def admin_decision(
    request: Request,
    target: str,
    role: str | None = None,
    plans: str | None = None,
) -> dict:
    """Admin-only evaluate probe (not a public oracle)."""
    require_admin(request)
    try:
        validate_target_key(target)
    except TargetKeyError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    plan_list = tuple(p.strip() for p in (plans or "").split(",") if p.strip())
    if role:
        viewer = viewer_from_parts(
            identity_id=1,
            session_role=role,
            access_role=role,
            plan_slugs=plan_list,
            signed_in=True,
            is_admin=False,
        )
    else:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                claims = require_admin(request)
                viewer = viewer_from_claims(cur, claims)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            policy = load_policy(cur, target)
    d = evaluate(target, viewer, policy=policy, meta=TargetMeta())
    return {
        "decision": d.to_public_dict(),
        "evaluated_as": d.evaluated_as,
        "target_key": target,
    }


@router.post("/decision/batch")
async def admin_decision_batch(request: Request) -> dict:
    require_admin(request)
    body = await request.json() if int(request.headers.get("content-length") or 0) else {}
    keys = body.get("targets") or body.get("keys") or []
    if not isinstance(keys, list) or not keys:
        raise HTTPException(status_code=422, detail="targets list required")
    role = body.get("role")
    plan_list = tuple(body.get("plan_slugs") or [])
    if role:
        viewer = viewer_from_parts(
            identity_id=1,
            session_role=str(role),
            access_role=str(role),
            plan_slugs=plan_list,
            signed_in=True,
            is_admin=False,
        )
    else:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                claims = require_admin(request)
                viewer = viewer_from_claims(cur, claims)
    str_keys = [str(k) for k in keys]
    with db.transaction() as conn:
        with conn.cursor() as cur:
            policies = load_policies_many(cur, str_keys)
    from access_control.evaluate import evaluate_many

    out = evaluate_many(str_keys, viewer, policies=policies)
    return {
        "decisions": {k: out[k].to_public_dict() for k in str_keys},
    }


@router.get("/audit")
def list_audit(request: Request, target: str | None = None, limit: int = 100) -> dict:
    require_admin(request)
    limit = max(1, min(int(limit), 500))
    with db.transaction() as conn:
        with conn.cursor() as cur:
            if target:
                cur.execute(
                    """SELECT id, target_key, actor_id, action, before_json, after_json, created_at
                       FROM access_policy_audit
                       WHERE target_key = %s
                       ORDER BY id DESC LIMIT %s""",
                    (target, limit),
                )
            else:
                cur.execute(
                    """SELECT id, target_key, actor_id, action, before_json, after_json, created_at
                       FROM access_policy_audit
                       ORDER BY id DESC LIMIT %s""",
                    (limit,),
                )
            rows = cur.fetchall()
    items = []
    for r in rows:
        items.append(
            {
                "id": r["id"],
                "target_key": r["target_key"],
                "actor_id": r["actor_id"],
                "action": r["action"],
                "before": r["before_json"],
                "after": r["after_json"],
                "created_at": r["created_at"].isoformat(sep=" ") if r["created_at"] else None,
            }
        )
    return {"audit": items}
