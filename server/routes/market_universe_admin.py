"""Admin + member read API for shared market symbol universe."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Request

import db
from guards import require_admin, require_session
from market_data import universe_admin as ua
from routes.trade_log.common import _require_tool_member

admin_router = APIRouter(prefix="/api/admin/market-universe", tags=["admin-market-universe"])
member_router = APIRouter(tags=["market-universe"])


def _raise(exc: ua.UniverseError) -> None:
    detail: dict | str
    if exc.extra:
        detail = {"message": exc.detail, **exc.extra}
    else:
        detail = exc.detail
    raise HTTPException(status_code=exc.code, detail=detail)


@admin_router.get("")
def admin_list(request: Request, enabled_only: bool = Query(False)) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            rows = ua.list_all(cur, enabled_only=enabled_only)
    return {"symbols": rows, "count": len(rows)}


@admin_router.post("/validate")
async def admin_validate(request: Request) -> dict:
    """Dry-run Massive availability check (no DB write)."""
    require_admin(request)
    body = await request.json()
    try:
        result = ua.validate_with_massive(
            symbol=str(body.get("symbol") or ""),
            feed_symbol=body.get("feed_symbol"),
            proxy_symbol=body.get("proxy_symbol"),
            kind=str(body.get("kind") or "equity"),
        )
    except ua.UniverseError as e:
        _raise(e)
    return result


@admin_router.post("")
async def admin_create(request: Request) -> dict:
    require_admin(request)
    body = await request.json()
    validate = body.get("validate", True)
    if isinstance(validate, str):
        validate = validate.lower() not in ("0", "false", "no")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            try:
                row = ua.create(
                    cur,
                    symbol=str(body.get("symbol") or ""),
                    kind=str(body.get("kind") or "equity"),
                    feed_symbol=body.get("feed_symbol"),
                    proxy_symbol=body.get("proxy_symbol"),
                    role=str(body.get("role") or "tradeable"),
                    enabled=bool(body.get("enabled", True)),
                    sort_order=int(body.get("sort_order") or 0),
                    note=body.get("note"),
                    options_cadence=body.get("options_cadence"),
                    validate=bool(validate),
                )
            except ua.UniverseError as e:
                _raise(e)
    return {"symbol": row}


@admin_router.patch("/{symbol}")
async def admin_patch(symbol: str, request: Request) -> dict:
    require_admin(request)
    body = await request.json()
    validate = body.get("validate", True)
    if isinstance(validate, str):
        validate = validate.lower() not in ("0", "false", "no")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            try:
                row = ua.patch(cur, symbol, body or {}, validate=bool(validate))
            except ua.UniverseError as e:
                _raise(e)
    return {"symbol": row}


@admin_router.delete("/{symbol}")
def admin_delete(symbol: str, request: Request) -> dict:
    require_admin(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            try:
                ua.delete(cur, symbol)
            except ua.UniverseError as e:
                _raise(e)
    return {"ok": True, "deleted": symbol.upper()}


@member_router.get("/api/me/market/universe")
def member_list_universe(
    request: Request,
    enabled_only: bool = Query(True),
) -> dict:
    """Common read view of the shared SoR (Practice + Lab)."""
    claims = require_session(request)
    _require_tool_member(claims, capability="read")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            rows = ua.list_all(cur, enabled_only=enabled_only)
            # Attach latest mark when present (Positions / Lab same SoR)
            try:
                from market_data import live_marks as lm

                for row in rows:
                    m = lm.get_live_mark(cur, row["symbol"])
                    if m:
                        row["mid"] = m.get("mid")
                        row["prev_close"] = m.get("prev_close")
                        row["day_change_pct"] = m.get("day_change_pct")
                        row["mark_asof"] = m.get("asof")
                    else:
                        row["mid"] = None
                        row["prev_close"] = None
                        row["day_change_pct"] = None
                        row["mark_asof"] = None
            except Exception:
                for row in rows:
                    row.setdefault("mid", None)
    return {"symbols": rows, "count": len(rows), "source": "market_symbol_universe"}
