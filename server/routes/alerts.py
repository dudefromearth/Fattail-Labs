"""Member Alerts Manager API — ALM §5. Session cookie. Not a market socket."""

from __future__ import annotations

import json
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Body, HTTPException, Query, Request
from fastapi.responses import StreamingResponse

import alerts_registry as reg
import db
from guards import require_session

router = APIRouter(tags=["member-alerts"])

_NOW = "%Y-%m-%d %H:%M:%S"


def _require_manager() -> None:
    if not reg.alerts_manager_enabled():
        raise HTTPException(
            status_code=503,
            detail="Alerts Manager is not live (LABS_ALERTS_MANAGER=0).",
        )


def _iid(claims: dict) -> int:
    iid = int(claims.get("identity_id") or 0)
    if iid < 1:
        raise HTTPException(status_code=401, detail="session has no identity")
    return iid


def _row(r: dict) -> dict:
    local = r.get("local_ref_json")
    trigger = r.get("trigger_json")
    if isinstance(local, str):
        local = json.loads(local)
    if isinstance(trigger, str):
        trigger = json.loads(trigger)
    return {
        "alert_id": r["alert_id"],
        "suite": r["suite"],
        "source_system": r["source_system"],
        "domain": r["domain"],
        "alert_class": r["alert_class"],
        "surface_type": r["surface_type"],
        "symbol": r.get("symbol"),
        "title": r["title"],
        "severity": r["severity"],
        "color": r.get("color"),
        "behavior": r["behavior"],
        "enabled": bool(r["enabled"]),
        "active": False,
        "unbound": bool(r["unbound"]),
        "local_ref": local,
        "trigger": trigger,
        "expires_at": r.get("expires_at"),
        "created_at": r["created_at"],
        "updated_at": r["updated_at"],
        "deep_link": r.get("deep_link"),
    }


@router.get("/api/me/alerts")
def list_alerts(
    request: Request,
    suite: str | None = Query(None),
    source_system: str | None = Query(None),
    symbol: str | None = Query(None),
) -> dict:
    claims = require_session(request)
    _require_manager()
    iid = _iid(claims)
    sql = "SELECT * FROM member_alerts WHERE identity_id = %s"
    args: list = [iid]
    if suite:
        sql += " AND suite = %s"
        args.append(suite)
    if source_system:
        sql += " AND source_system = %s"
        args.append(source_system)
    if symbol:
        sql += " AND symbol = %s"
        args.append(symbol)
    sql += " ORDER BY created_at DESC"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, args)
            rows = cur.fetchall() or []
    return {"alerts": [_row(r) for r in rows]}


@router.post("/api/me/alerts")
def upsert_alert(request: Request, body: dict = Body(...)) -> dict:
    claims = require_session(request)
    _require_manager()
    iid = _iid(claims)

    source = str(body.get("source_system") or "").strip()
    entry = reg.lookup(source)
    if entry is None:
        raise HTTPException(status_code=400, detail="unregistered source_system")

    suite = str(body.get("suite") or "").strip()
    severity = str(body.get("severity") or "").strip().lower()
    if not suite or not severity:
        raise HTTPException(status_code=400, detail="suite and severity are required")
    if suite != entry["suite"]:
        raise HTTPException(status_code=400, detail="suite does not match registry")
    if severity not in reg.SEVERITIES:
        raise HTTPException(status_code=400, detail="invalid severity")

    surface = str(body.get("surface_type") or body.get("kind") or "").strip()
    allowed = entry["types"]
    if not allowed:
        raise HTTPException(
            status_code=400,
            detail="source_system has no alert types",
        )
    if surface not in allowed:
        raise HTTPException(status_code=400, detail="surface_type not in registry")

    alert_class = str(body.get("alert_class") or "threshold").strip()
    if alert_class not in reg.CLASSES:
        raise HTTPException(status_code=400, detail="invalid alert_class")

    title = str(body.get("title") or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="title required")

    trigger = body.get("trigger") or {}
    local_ref = body.get("local_ref")
    if local_ref is None and body.get("position_id"):
        local_ref = {"position_id": body.get("position_id")}
    unbound = bool(body.get("unbound"))
    if isinstance(local_ref, dict) and local_ref.get("position_id") is None:
        if surface == "position":
            unbound = True

    now = datetime.now(timezone.utc).strftime(_NOW)
    alert_id = str(body.get("alert_id") or body.get("id") or f"al_{secrets.token_hex(8)}")
    deep = str(
        body.get("deep_link")
        or f"/app/options-lab/analyzer?alert={alert_id}"
    )
    symbol = body.get("symbol")
    domain = str(body.get("domain") or "work_surface")
    color = body.get("color")
    behavior = str(body.get("behavior") or "once_only")
    enabled = 1 if body.get("enabled", True) else 0

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT alert_id FROM member_alerts WHERE alert_id = %s AND identity_id = %s",
                (alert_id, iid),
            )
            exists = cur.fetchone()
            if exists:
                cur.execute(
                    """
                    UPDATE member_alerts SET
                      suite=%s, source_system=%s, domain=%s, alert_class=%s,
                      surface_type=%s, symbol=%s, title=%s, severity=%s, color=%s,
                      behavior=%s, enabled=%s, unbound=%s, local_ref_json=%s,
                      trigger_json=%s, deep_link=%s, updated_at=%s
                    WHERE alert_id=%s AND identity_id=%s
                    """,
                    (
                        suite, source, domain, alert_class, surface, symbol, title,
                        severity, color, behavior, enabled, 1 if unbound else 0,
                        json.dumps(local_ref) if local_ref is not None else None,
                        json.dumps(trigger), deep, now, alert_id, iid,
                    ),
                )
            else:
                cur.execute(
                    """
                    INSERT INTO member_alerts (
                      alert_id, identity_id, suite, source_system, domain, alert_class,
                      surface_type, symbol, title, severity, color, behavior, enabled,
                      unbound, local_ref_json, trigger_json, expires_at, deep_link,
                      created_at, updated_at
                    ) VALUES (
                      %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NULL,%s,%s,%s
                    )
                    """,
                    (
                        alert_id, iid, suite, source, domain, alert_class, surface,
                        symbol, title, severity, color, behavior, enabled,
                        1 if unbound else 0,
                        json.dumps(local_ref) if local_ref is not None else None,
                        json.dumps(trigger), deep, now, now,
                    ),
                )
            cur.execute(
                "SELECT * FROM member_alerts WHERE alert_id = %s AND identity_id = %s",
                (alert_id, iid),
            )
            row = cur.fetchone()
    return _row(row)


@router.get("/api/me/alerts/stats")
def stats(request: Request) -> dict:
    claims = require_session(request)
    _require_manager()
    iid = _iid(claims)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT suite, alert_class, COUNT(*) AS n
                FROM member_alerts WHERE identity_id = %s
                GROUP BY suite, alert_class
                """,
                (iid,),
            )
            rows = cur.fetchall() or []
            cur.execute(
                """
                SELECT
                  SUM(enabled = 1) AS armed,
                  SUM(unbound = 1) AS unbound
                FROM member_alerts WHERE identity_id = %s
                """,
                (iid,),
            )
            tot = cur.fetchone() or {}
    by_suite: dict[str, int] = {}
    by_class: dict[str, int] = {}
    for r in rows:
        by_suite[r["suite"]] = by_suite.get(r["suite"], 0) + int(r["n"])
        by_class[r["alert_class"]] = by_class.get(r["alert_class"], 0) + int(r["n"])
    return {
        "armed": int(tot.get("armed") or 0),
        "active_now": 0,
        "unbound": int(tot.get("unbound") or 0),
        "by_suite": by_suite,
        "by_class": by_class,
    }


@router.get("/api/me/alerts/stream")
def stream(request: Request) -> StreamingResponse:
    """Member-identity SSE. Not MarketSocket / not /api/me/market/stream."""
    require_session(request)
    _require_manager()

    def gen():
        yield "event: hello\ndata: {\"ok\":true}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream")
