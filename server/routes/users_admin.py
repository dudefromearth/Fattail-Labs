"""Admin Users — roster + per-user login/engagement analytics.

Email-keyed identities with: how/how-often they logged in (login_events),
membership pulled from fattail.ai / 0-dte SSO (memberships + identity_links),
pages navigated + estimated time on platform (page_views), and course
engagement proxies (lesson_progress, enrollments, quiz_attempts).

Read-only. Admin session required. Spec: FatTail-Labs-User-Activity-Analytics-Spec-v1.0.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import PlainTextResponse

import activity
import db
import identity
from auth import ROLE_ORDER
from guards import require_admin

router = APIRouter(prefix="/api/admin/users", tags=["admin-users"])


def _iso(dt) -> str | None:
    return dt.isoformat() + "Z" if dt is not None else None


def _epoch(dt) -> int | None:
    try:
        return int(dt.timestamp())
    except Exception:  # noqa: BLE001
        return None


def _max_dt(*dts):
    vals = [d for d in dts if d is not None]
    return max(vals) if vals else None


def _role_rank(role: str | None) -> int:
    return ROLE_ORDER.index(role) if role in ROLE_ORDER else -1


def _providers_for(cur, ids: list[int]) -> dict[int, list[str]]:
    if not ids:
        return {}
    ph = ",".join(["%s"] * len(ids))
    cur.execute(
        f"""SELECT identity_id, provider FROM identity_links
            WHERE identity_id IN ({ph}) ORDER BY provider""",
        tuple(ids),
    )
    out: dict[int, list[str]] = {}
    for r in cur.fetchall():
        out.setdefault(int(r["identity_id"]), []).append(r["provider"])
    return out


def _active_memberships_for(cur, ids: list[int]) -> dict[int, list[dict]]:
    if not ids:
        return {}
    ph = ",".join(["%s"] * len(ids))
    cur.execute(
        f"""SELECT m.identity_id, p.slug, p.name, p.grants_role, m.status, m.source
            FROM memberships m JOIN plans p ON p.id = m.plan_id
            WHERE m.identity_id IN ({ph})
              AND m.status IN ('active','grace')
              AND (m.current_period_end IS NULL OR m.current_period_end > NOW())""",
        tuple(ids),
    )
    out: dict[int, list[dict]] = {}
    for r in cur.fetchall():
        out.setdefault(int(r["identity_id"]), []).append(r)
    return out


def _membership_label(rows: list[dict]) -> str:
    """Highest-ranked active plan name (status), or a dash."""
    if not rows:
        return "—"
    best = max(rows, key=lambda r: _role_rank(r.get("grants_role")))
    return f"{best['name']} ({best['status']})"


def _roster(cur, like: str | None, limit: int, offset: int) -> tuple[list[dict], int]:
    """Shared query for the list + CSV. Returns (users, total)."""
    where = ""
    params: list = []
    if like:
        where = "WHERE (i.email LIKE %s OR i.display_name LIKE %s)"
        params += [like, like]

    cur.execute(f"SELECT COUNT(*) AS n FROM identities i {where}", tuple(params))
    total = int(cur.fetchone()["n"])

    cur.execute(
        f"""SELECT i.identity_id, i.email, i.display_name, i.created_at,
            (SELECT COUNT(*) FROM login_events le
                WHERE le.identity_id = i.identity_id) AS login_count,
            (SELECT MAX(le.created_at) FROM login_events le
                WHERE le.identity_id = i.identity_id) AS last_login,
            (SELECT COUNT(*) FROM page_views pv
                WHERE pv.identity_id = i.identity_id) AS pageview_count,
            (SELECT MAX(pv.created_at) FROM page_views pv
                WHERE pv.identity_id = i.identity_id) AS last_pageview,
            (SELECT COALESCE(SUM(lp.watch_seconds),0) FROM lesson_progress lp
                WHERE lp.identity_id = i.identity_id) AS watch_seconds,
            (SELECT MAX(lp.updated_at) FROM lesson_progress lp
                WHERE lp.identity_id = i.identity_id) AS last_lesson_at,
            (SELECT COUNT(*) FROM enrollments e
                WHERE e.identity_id = i.identity_id) AS courses_enrolled
            FROM identities i
            {where}
            ORDER BY last_login IS NULL, last_login DESC, i.created_at DESC
            LIMIT %s OFFSET %s""",
        tuple(params) + (limit, offset),
    )
    rows = cur.fetchall()
    ids = [int(r["identity_id"]) for r in rows]
    providers = _providers_for(cur, ids)
    memberships = _active_memberships_for(cur, ids)

    users = []
    for r in rows:
        iid = int(r["identity_id"])
        last_active = _max_dt(
            r.get("last_login"), r.get("last_pageview"), r.get("last_lesson_at")
        )
        users.append({
            "identity_id": iid,
            "email": r["email"],
            "display_name": r["display_name"],
            "role": identity.derive_role(cur, iid),
            "providers": providers.get(iid, []),
            "membership": _membership_label(memberships.get(iid, [])),
            "created_at": _iso(r["created_at"]),
            "login_count": int(r["login_count"] or 0),
            "last_login": _iso(r["last_login"]),
            "pageview_count": int(r["pageview_count"] or 0),
            "last_pageview": _iso(r["last_pageview"]),
            "last_active": _iso(last_active),
            "watch_seconds": int(r["watch_seconds"] or 0),
            "courses_enrolled": int(r["courses_enrolled"] or 0),
        })
    return users, total


@router.get("")
def list_users(
    request: Request, search: str = "", limit: int = 50, offset: int = 0
) -> dict:
    require_admin(request)
    limit = max(1, min(int(limit), 200))
    offset = max(0, int(offset))
    like = f"%{search.strip()}%" if search.strip() else None
    with db.transaction() as conn:
        with conn.cursor() as cur:
            users, total = _roster(cur, like, limit, offset)
    return {"users": users, "total": total, "limit": limit, "offset": offset,
            "search": search}


@router.get("/export.csv")
def export_csv(request: Request, search: str = "") -> PlainTextResponse:
    """Roster CSV export (all matching users, capped)."""
    require_admin(request)
    like = f"%{search.strip()}%" if search.strip() else None
    with db.transaction() as conn:
        with conn.cursor() as cur:
            users, _ = _roster(cur, like, 5000, 0)
    cols = ["email", "display_name", "role", "providers", "membership",
            "login_count", "last_login", "pageview_count", "last_active",
            "watch_seconds", "courses_enrolled", "created_at"]
    lines = [",".join(cols)]
    for u in users:
        vals = [
            u["email"], u["display_name"], u["role"],
            " ".join(u["providers"]), u["membership"],
            str(u["login_count"]), u["last_login"] or "",
            str(u["pageview_count"]), u["last_active"] or "",
            str(u["watch_seconds"]), str(u["courses_enrolled"]),
            u["created_at"] or "",
        ]
        lines.append(",".join('"' + str(v).replace('"', '""') + '"' for v in vals))
    body = "\n".join(lines) + "\n"
    return PlainTextResponse(
        body,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="labs-users.csv"'},
    )


@router.get("/{identity_id}")
def user_detail(identity_id: int, request: Request) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT identity_id, email, display_name, role_override,
                          created_at, updated_at
                   FROM identities WHERE identity_id = %s""",
                (identity_id,),
            )
            who = cur.fetchone()
            if not who:
                raise HTTPException(status_code=404, detail="User not found")
            role = identity.derive_role(cur, identity_id)

            cur.execute(
                """SELECT provider, external_id, created_at FROM identity_links
                   WHERE identity_id = %s ORDER BY created_at""",
                (identity_id,),
            )
            links = [
                {"provider": r["provider"], "external_id": r["external_id"],
                 "linked_at": _iso(r["created_at"])}
                for r in cur.fetchall()
            ]

            cur.execute(
                """SELECT p.slug, p.name, p.grants_role, m.status, m.source,
                          m.external_ref, m.started_at, m.current_period_end
                   FROM memberships m JOIN plans p ON p.id = m.plan_id
                   WHERE m.identity_id = %s
                   ORDER BY m.started_at DESC""",
                (identity_id,),
            )
            memberships = [
                {"plan_slug": r["slug"], "plan_name": r["name"],
                 "grants_role": r["grants_role"], "status": r["status"],
                 "source": r["source"], "external_ref": r["external_ref"],
                 "started_at": _iso(r["started_at"]),
                 "current_period_end": _iso(r["current_period_end"])}
                for r in cur.fetchall()
            ]

            cur.execute(
                """SELECT COUNT(*) AS n, MIN(created_at) AS first_at,
                          MAX(created_at) AS last_at
                   FROM login_events WHERE identity_id = %s""",
                (identity_id,),
            )
            lstat = cur.fetchone()
            cur.execute(
                """SELECT provider, COUNT(*) AS n FROM login_events
                   WHERE identity_id = %s GROUP BY provider""",
                (identity_id,),
            )
            by_method = {r["provider"]: int(r["n"]) for r in cur.fetchall()}
            cur.execute(
                """SELECT created_at, provider, role, ip, user_agent
                   FROM login_events WHERE identity_id = %s
                   ORDER BY created_at DESC LIMIT 25""",
                (identity_id,),
            )
            recent_logins = [
                {"at": _iso(r["created_at"]), "provider": r["provider"],
                 "role": r["role"], "ip": r["ip"], "user_agent": r["user_agent"]}
                for r in cur.fetchall()
            ]

            cur.execute(
                "SELECT COUNT(*) AS n FROM page_views WHERE identity_id = %s",
                (identity_id,),
            )
            pv_total = int(cur.fetchone()["n"])
            cur.execute(
                """SELECT path, COUNT(*) AS n FROM page_views
                   WHERE identity_id = %s GROUP BY path
                   ORDER BY n DESC LIMIT 15""",
                (identity_id,),
            )
            top_paths = [{"path": r["path"], "count": int(r["n"])}
                         for r in cur.fetchall()]
            cur.execute(
                """SELECT path, created_at FROM page_views
                   WHERE identity_id = %s ORDER BY created_at DESC LIMIT 30""",
                (identity_id,),
            )
            recent_views = [
                {"path": r["path"], "at": _iso(r["created_at"])}
                for r in cur.fetchall()
            ]
            cur.execute(
                """SELECT created_at FROM page_views WHERE identity_id = %s
                   ORDER BY created_at LIMIT 5000""",
                (identity_id,),
            )
            epochs = [e for e in (_epoch(r["created_at"]) for r in cur.fetchall())
                      if e is not None]
            time_on_platform = activity.estimate_sessions(epochs)

            cur.execute(
                """SELECT COALESCE(SUM(watch_seconds),0) AS watch,
                          MAX(updated_at) AS last_lesson
                   FROM lesson_progress WHERE identity_id = %s""",
                (identity_id,),
            )
            lp = cur.fetchone()
            cur.execute(
                """SELECT COUNT(*) AS enrolled, COUNT(completed_at) AS completed
                   FROM enrollments WHERE identity_id = %s""",
                (identity_id,),
            )
            enr = cur.fetchone()
            try:
                cur.execute(
                    "SELECT COUNT(*) AS n FROM quiz_attempts WHERE identity_id = %s",
                    (identity_id,),
                )
                quiz_attempts = int(cur.fetchone()["n"])
            except Exception:  # noqa: BLE001 — table optional across envs
                quiz_attempts = 0

    return {
        "identity_id": int(who["identity_id"]),
        "email": who["email"],
        "display_name": who["display_name"],
        "role": role,
        "role_override": who["role_override"],
        "created_at": _iso(who["created_at"]),
        "providers": links,
        "memberships": memberships,
        "logins": {
            "total": int(lstat["n"] or 0),
            "first_at": _iso(lstat["first_at"]),
            "last_at": _iso(lstat["last_at"]),
            "by_method": by_method,
            "recent": recent_logins,
        },
        "page_views": {
            "total": pv_total,
            "top_paths": top_paths,
            "recent": recent_views,
        },
        "time_on_platform": time_on_platform,
        "engagement": {
            "watch_seconds": int(lp["watch"] or 0),
            "last_lesson_at": _iso(lp["last_lesson"]),
            "courses_enrolled": int(enr["enrolled"] or 0),
            "courses_completed": int(enr["completed"] or 0),
            "quiz_attempts": quiz_attempts,
        },
    }
