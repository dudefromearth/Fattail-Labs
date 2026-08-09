"""Admin Flow — aggregate user journey across all members.

Answers "where do members naturally flow, and where do they drop off" by
sessionising page_views (the same member navigation the Users view counts),
mapping paths to readable areas, and rolling up into a step-based Sankey plus a
drop-off table and the most common journeys.

Read-only. Admin session required. All aggregation lives in flow.py (pure); this
module only fetches rows and applies the date-window / tier filters.
Spec: FatTail-Labs-User-Flow-Spec-v1.0.
"""

from __future__ import annotations

from fastapi import APIRouter, Request

import db
import flow
from guards import require_admin

router = APIRouter(prefix="/api/admin/flow", tags=["admin-flow"])

# Windows the UI offers (label -> days; 0 == all time).
_ALLOWED_DAYS = frozenset({7, 30, 90, 0})
# Same paid-plan set the Users billing view uses.
PAID_PLAN_SLUGS = ("observer", "observer-trial", "activator", "navigator")


def _paid_identity_ids(cur) -> set[int]:
    ph = ",".join(["%s"] * len(PAID_PLAN_SLUGS))
    cur.execute(
        f"""SELECT DISTINCT m.identity_id
              FROM memberships m JOIN plans p ON p.id = m.plan_id
             WHERE m.status IN ('active','grace')
               AND (m.current_period_end IS NULL OR m.current_period_end > NOW())
               AND p.slug IN ({ph})""",
        tuple(PAID_PLAN_SLUGS),
    )
    return {int(r["identity_id"]) for r in cur.fetchall()}


@router.get("")
def get_flow(request: Request):
    require_admin(request)

    try:
        days = int(request.query_params.get("days", "30"))
    except (TypeError, ValueError):
        days = 30
    if days not in _ALLOWED_DAYS:
        days = 30
    tier = (request.query_params.get("tier") or "all").strip().lower()
    if tier not in ("all", "paid", "free"):
        tier = "all"

    with db.transaction() as conn:
        with conn.cursor() as cur:
            where = []
            params: list = []
            if days:
                where.append("created_at >= (NOW() - INTERVAL %s DAY)")
                params.append(days)
            clause = (" WHERE " + " AND ".join(where)) if where else ""
            cur.execute(
                f"""SELECT identity_id, path, UNIX_TIMESTAMP(created_at) AS ts
                      FROM page_views{clause}""",
                tuple(params),
            )
            rows = cur.fetchall()

            paid_ids: set[int] = set()
            if tier != "all":
                paid_ids = _paid_identity_ids(cur)

    if tier == "paid":
        rows = [r for r in rows if int(r["identity_id"]) in paid_ids]
    elif tier == "free":
        rows = [r for r in rows if int(r["identity_id"]) not in paid_ids]

    triples = [(int(r["identity_id"]), r["path"], int(r["ts"])) for r in rows]
    payload = flow.build_flow(triples)
    payload["filters"] = {"days": days, "tier": tier}
    return payload
