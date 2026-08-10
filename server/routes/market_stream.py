"""Market Bus WebSocket — one socket per tab (MB-P4).

WS /api/me/market/stream
"""

from __future__ import annotations

import asyncio
import json
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from guards import claims_or_none
from routes.trade_log.common import _require_tool_member

router = APIRouter(tags=["market-stream"])


@router.websocket("/api/me/market/stream")
async def market_stream(ws: WebSocket) -> None:
    await ws.accept()
    # Cookie session available after accept on same origin
    claims = claims_or_none(ws)
    if not claims:
        await ws.send_json({"t": "err", "code": "auth", "message": "Sign in required"})
        await ws.close(code=4401)
        return
    try:
        _require_tool_member(claims, capability="read")
    except Exception as exc:
        await ws.send_json({"t": "err", "code": "forbidden", "message": str(exc)})
        await ws.close(code=4403)
        return

    await ws.send_json(
        {
            "t": "hello",
            "v": 1,
            "heartbeat_s": 15,
            "server_time": __import__("datetime")
            .datetime.now(__import__("datetime").timezone.utc)
            .isoformat()
            .replace("+00:00", "Z"),
        }
    )

    subs: set[str] = set()
    try:
        while True:
            try:
                raw = await asyncio.wait_for(ws.receive_text(), timeout=20.0)
            except asyncio.TimeoutError:
                await ws.send_json({"t": "pong"})
                continue
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await ws.send_json({"t": "err", "code": "bad_json", "message": "invalid json"})
                continue
            op = (msg.get("op") or "").strip().lower()
            if op == "ping":
                await ws.send_json({"t": "pong"})
                continue
            if op == "hello":
                await ws.send_json({"t": "hello", "v": 1, "heartbeat_s": 15})
                continue
            if op == "sub":
                await _handle_sub(ws, msg, subs)
                continue
            if op == "unsub":
                for s in msg.get("symbols") or []:
                    subs.discard(f"sym:{str(s).upper()}")
                for c in msg.get("chains") or []:
                    if isinstance(c, dict):
                        key = (
                            f"chain:{c.get('symbol')}:{c.get('expiration')}:"
                            f"{c.get('side')}:w{c.get('wings', 25)}"
                        )
                        subs.discard(key)
                await ws.send_json({"t": "unsub_ok", "subs": sorted(subs)})
                continue
            await ws.send_json({"t": "err", "code": "unknown_op", "message": op})
    except WebSocketDisconnect:
        return


async def _handle_sub(ws: WebSocket, msg: dict[str, Any], subs: set[str]) -> None:
    from market_data.market_bus.store import get_store
    from routes import chain_ladder as cl

    # Universe gate for symbols
    for s in msg.get("symbols") or []:
        sym = str(s).strip().upper()
        if not sym:
            continue
        try:
            cl._resolve_universe_symbol(sym)
        except Exception as exc:
            await ws.send_json(
                {"t": "err", "code": "universe", "message": str(getattr(exc, "detail", exc))}
            )
            continue
        topic = f"sym:{sym}"
        subs.add(topic)
        # Snapshot from Redis if present
        store = get_store()
        doc = store.get_json(f"mb:sym:{sym}") if store else None
        await ws.send_json(
            {"t": "sym", "symbol": sym, "mode": "full", **(doc or {"mid": None, "note": "warming"})}
        )

    for c in msg.get("chains") or []:
        if not isinstance(c, dict):
            continue
        symbol = str(c.get("symbol") or "SPX").upper()
        exp = str(c.get("expiration") or "")[:10]
        side = str(c.get("side") or "call").lower()
        wings = int(c.get("wings") or 25)
        try:
            resolved = cl._resolve_universe_symbol(symbol)
        except Exception as exc:
            await ws.send_json(
                {"t": "err", "code": "universe", "message": str(getattr(exc, "detail", exc))}
            )
            continue
        try:
            # MB7: snapshot first via shared generation path
            ladder = await asyncio.to_thread(
                cl._fetch_ladder,
                product=resolved["product"],
                chain_underlier=resolved["chain_underlier"],
                kind=str(resolved.get("kind") or "equity"),
                expiration=exp,
                side=side,
                wings=wings,
                strike_step_cfg=resolved.get("strike_step"),
            )
        except Exception as exc:
            detail = getattr(exc, "detail", None) or str(exc)
            await ws.send_json({"t": "err", "code": "chain", "message": str(detail)})
            continue
        key = f"chain:{symbol}:{exp}:{side}:w{wings}"
        subs.add(key)
        await ws.send_json(
            {
                "t": "chain",
                "mode": "full",
                "key": key,
                "content_hash": ladder.get("content_hash"),
                "ladder": ladder,
            }
        )

    if msg.get("session"):
        store = get_store()
        doc = store.get_json("mb:session:market_status") if store else None
        await ws.send_json({"t": "session", "mode": "full", **(doc or {"status": "unknown"})})

    await ws.send_json({"t": "sub_ok", "subs": sorted(subs)})
