"""Admin Stats — site traffic (landings, acquisition, users vs non-users).

Read-only; admin session required. Data comes from landing_events (migration 125)
via traffic.py. First page under the admin "Stats" nav group.
"""

from __future__ import annotations

from fastapi import APIRouter, Request

import traffic
from guards import require_admin

router = APIRouter(prefix="/api/admin/stats", tags=["admin-stats"])


@router.get("/traffic")
def get_traffic(request: Request, days: int = 30) -> dict:
    require_admin(request)
    try:
        d = int(days)
    except (TypeError, ValueError):
        d = 30
    return traffic.traffic_summary(d)
