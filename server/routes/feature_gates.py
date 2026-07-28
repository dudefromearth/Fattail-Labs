"""Feature gates — countdown / waitlist surfaces.

Admin manages gates at /admin/gates. Public surfaces call GET for active gate
state and POST to collect waitlist emails.
"""

from __future__ import annotations

import re
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import PlainTextResponse

import db
from guards import require_admin

public = APIRouter(tags=["feature-gates"])
admin = APIRouter(prefix="/api/admin", tags=["admin-feature-gates"])

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# Surfaces that may host a gate (extend as sub-hubs adopt the feature).
KNOWN_SURFACES = frozenset(
    {"home", "hub", "app", "resource", "live", "wiki", "course", "campaign"}
)

GATE_FIELDS = frozenset(
    {
        "label",
        "enabled",
        "opens_at",
        "headline",
        "body_md",
        "cta_primary_label",
        "cta_primary_href",
        "cta_secondary_label",
        "cta_secondary_href",
        "collect_email",
        "email_prompt",
        "reveal_path",
        "footer_note",
    }
)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _parse_opens_at(raw) -> datetime | None:
    if raw is None or raw == "":
        return None
    if isinstance(raw, datetime):
        return raw.replace(tzinfo=None) if raw.tzinfo else raw
    s = str(raw).strip().replace("Z", "+00:00")
    try:
        d = datetime.fromisoformat(s)
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail="opens_at must be ISO-8601 datetime or null",
        ) from exc
    if d.tzinfo is not None:
        d = d.astimezone(timezone.utc).replace(tzinfo=None)
    return d


def _row_public(r: dict, *, now: datetime) -> dict:
    """Public payload: only what the gate UI needs + whether it is currently active."""
    opens_at = r.get("opens_at")
    enabled = bool(r["enabled"])
    active = enabled
    if enabled and opens_at is not None and now >= opens_at:
        # Time has passed — treat as open (gate inactive).
        active = False
    return {
        "surface_key": r["surface_key"],
        "active": active,
        "enabled": enabled,
        "opens_at": opens_at.isoformat() + "Z" if opens_at else None,
        "headline": r["headline"] or "Coming soon",
        "body_md": r.get("body_md") or "",
        "cta_primary_label": r.get("cta_primary_label") or "",
        "cta_primary_href": r.get("cta_primary_href") or "",
        "cta_secondary_label": r.get("cta_secondary_label") or "",
        "cta_secondary_href": r.get("cta_secondary_href") or "",
        "collect_email": bool(r.get("collect_email")),
        "email_prompt": r.get("email_prompt") or "Get notified when we open",
        "reveal_path": r.get("reveal_path") or "/",
        "footer_note": r.get("footer_note"),
    }


def _row_admin(r: dict, email_count: int = 0) -> dict:
    opens_at = r.get("opens_at")
    return {
        "surface_key": r["surface_key"],
        "label": r.get("label") or r["surface_key"],
        "enabled": bool(r["enabled"]),
        "opens_at": opens_at.isoformat() + "Z" if opens_at else None,
        "headline": r["headline"] or "",
        "body_md": r.get("body_md") or "",
        "cta_primary_label": r.get("cta_primary_label") or "",
        "cta_primary_href": r.get("cta_primary_href") or "",
        "cta_secondary_label": r.get("cta_secondary_label") or "",
        "cta_secondary_href": r.get("cta_secondary_href") or "",
        "collect_email": bool(r.get("collect_email")),
        "email_prompt": r.get("email_prompt") or "",
        "reveal_path": r.get("reveal_path") or "/",
        "footer_note": r.get("footer_note"),
        "email_count": email_count,
        "updated_at": r["updated_at"].isoformat() + "Z"
        if r.get("updated_at")
        else None,
    }


def _load(cur, surface_key: str) -> dict | None:
    cur.execute(
        """SELECT surface_key, label, enabled, opens_at, headline, body_md,
                  cta_primary_label, cta_primary_href,
                  cta_secondary_label, cta_secondary_href,
                  collect_email, email_prompt, reveal_path, footer_note,
                  created_at, updated_at
           FROM feature_gates WHERE surface_key = %s""",
        (surface_key,),
    )
    return cur.fetchone()


@public.get("/api/feature-gates/{surface_key}")
def get_public_gate(surface_key: str) -> dict:
    """Active gate for a surface, or { active: false } if open / unknown."""
    sk = (surface_key or "").strip().lower()
    if sk not in KNOWN_SURFACES:
        raise HTTPException(status_code=404, detail="Unknown surface")
    now = _utcnow()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            row = _load(cur, sk)
            if not row:
                return {
                    "surface_key": sk,
                    "active": False,
                    "enabled": False,
                    "opens_at": None,
                    "headline": "",
                    "body_md": "",
                    "collect_email": False,
                    "reveal_path": "/",
                }
            return _row_public(row, now=now)


@public.post("/api/feature-gates/{surface_key}/waitlist")
async def join_waitlist(surface_key: str, request: Request) -> dict:
    """Collect an email for the gate waitlist (public, when collect_email is on)."""
    sk = (surface_key or "").strip().lower()
    if sk not in KNOWN_SURFACES:
        raise HTTPException(status_code=404, detail="Unknown surface")
    body = await request.json()
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")
    email = (body.get("email") or "").strip().lower()
    if not email or not EMAIL_RE.match(email) or len(email) > 320:
        raise HTTPException(status_code=422, detail="Valid email required")
    source = (body.get("source") or "gate").strip()[:64] or "gate"

    now = _utcnow()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            row = _load(cur, sk)
            if not row:
                raise HTTPException(status_code=404, detail="Gate not configured")
            pub = _row_public(row, now=now)
            if not pub["active"]:
                raise HTTPException(
                    status_code=409,
                    detail="This feature is already open; waitlist is closed",
                )
            if not pub["collect_email"]:
                raise HTTPException(
                    status_code=409, detail="Email collection is off for this gate"
                )
            cur.execute(
                """INSERT INTO feature_gate_emails (surface_key, email, source)
                   VALUES (%s, %s, %s)
                   ON DUPLICATE KEY UPDATE source = VALUES(source)""",
                (sk, email, source),
            )
    return {"ok": True, "email": email, "surface_key": sk}


@admin.get("/feature-gates")
def admin_list_gates(request: Request) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT g.*,
                          (SELECT COUNT(*) FROM feature_gate_emails e
                           WHERE e.surface_key = g.surface_key) AS email_count
                   FROM feature_gates g
                   ORDER BY g.surface_key"""
            )
            rows = cur.fetchall()
    return {
        "gates": [_row_admin(r, int(r.get("email_count") or 0)) for r in rows],
        "known_surfaces": sorted(KNOWN_SURFACES),
    }


@admin.get("/feature-gates/{surface_key}")
def admin_get_gate(surface_key: str, request: Request) -> dict:
    require_admin(request)
    sk = (surface_key or "").strip().lower()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            row = _load(cur, sk)
            if not row:
                raise HTTPException(status_code=404, detail="Gate not found")
            cur.execute(
                "SELECT COUNT(*) AS n FROM feature_gate_emails WHERE surface_key = %s",
                (sk,),
            )
            n = int(cur.fetchone()["n"])
    return _row_admin(row, n)


@admin.put("/feature-gates/{surface_key}")
async def admin_put_gate(surface_key: str, request: Request) -> dict:
    """Create or update a gate. Body: any subset of GATE_FIELDS."""
    require_admin(request)
    sk = (surface_key or "").strip().lower()
    if sk not in KNOWN_SURFACES:
        raise HTTPException(
            status_code=422,
            detail=f"surface_key must be one of {sorted(KNOWN_SURFACES)}",
        )
    body = await request.json()
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")

    with db.transaction() as conn:
        with conn.cursor() as cur:
            existing = _load(cur, sk)
            if not existing:
                cur.execute(
                    """INSERT INTO feature_gates (surface_key, label)
                       VALUES (%s, %s)""",
                    (sk, sk),
                )
                existing = _load(cur, sk)

            patch: dict = {}
            for k in GATE_FIELDS:
                if k not in body:
                    continue
                if k == "opens_at":
                    patch[k] = _parse_opens_at(body[k])
                elif k in ("enabled", "collect_email"):
                    patch[k] = 1 if body[k] else 0
                elif k in (
                    "label",
                    "headline",
                    "cta_primary_label",
                    "cta_secondary_label",
                    "email_prompt",
                ):
                    patch[k] = str(body[k] if body[k] is not None else "")[:512]
                elif k in (
                    "cta_primary_href",
                    "cta_secondary_href",
                    "reveal_path",
                ):
                    patch[k] = str(body[k] if body[k] is not None else "")[:512]
                elif k == "footer_note":
                    v = body[k]
                    patch[k] = None if v is None or v == "" else str(v)[:1024]
                elif k == "body_md":
                    v = body[k]
                    patch[k] = None if v is None else str(v)
            if patch:
                cols = ", ".join(f"{k} = %s" for k in patch)
                cur.execute(
                    f"UPDATE feature_gates SET {cols} WHERE surface_key = %s",
                    (*tuple(patch.values()), sk),
                )
            row = _load(cur, sk)
            cur.execute(
                "SELECT COUNT(*) AS n FROM feature_gate_emails WHERE surface_key = %s",
                (sk,),
            )
            n = int(cur.fetchone()["n"])
    return _row_admin(row, n)


@admin.get("/feature-gates/{surface_key}/emails")
def admin_list_emails(surface_key: str, request: Request) -> dict:
    require_admin(request)
    sk = (surface_key or "").strip().lower()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            if not _load(cur, sk):
                raise HTTPException(status_code=404, detail="Gate not found")
            cur.execute(
                """SELECT id, email, source, created_at
                   FROM feature_gate_emails
                   WHERE surface_key = %s
                   ORDER BY created_at DESC, id DESC""",
                (sk,),
            )
            rows = cur.fetchall()
    return {
        "surface_key": sk,
        "emails": [
            {
                "id": r["id"],
                "email": r["email"],
                "source": r["source"],
                "created_at": r["created_at"].isoformat() + "Z"
                if r.get("created_at")
                else None,
            }
            for r in rows
        ],
    }


@admin.get("/feature-gates/{surface_key}/emails.csv")
def admin_export_emails_csv(surface_key: str, request: Request) -> PlainTextResponse:
    """CSV export for mail management systems."""
    require_admin(request)
    sk = (surface_key or "").strip().lower()
    with db.transaction() as conn:
        with conn.cursor() as cur:
            if not _load(cur, sk):
                raise HTTPException(status_code=404, detail="Gate not found")
            cur.execute(
                """SELECT email, source, created_at
                   FROM feature_gate_emails
                   WHERE surface_key = %s
                   ORDER BY created_at ASC, id ASC""",
                (sk,),
            )
            rows = cur.fetchall()
    lines = ["email,source,created_at,surface_key"]
    for r in rows:
        created = r["created_at"].isoformat() if r.get("created_at") else ""
        email = str(r["email"]).replace('"', '""')
        source = str(r["source"] or "").replace('"', '""')
        lines.append(f'"{email}","{source}","{created}","{sk}"')
    body = "\n".join(lines) + "\n"
    return PlainTextResponse(
        body,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="waitlist-{sk}.csv"',
        },
    )
