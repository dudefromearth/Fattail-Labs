"""Market Bus WebSocket — one socket per tab; **server pushes** chain updates.

WS /api/me/market/stream

Architecture (member chain ladder):
  chain_feed / _fetch_ladder → (optional Redis) → this socket **pushes**
  chain full | diff | unchanged → browser MarketSocket → UI setState.

The React surface does **not** interval-poll HTTP. It only applies pushed messages.
When the US equity session is closed, the push loop idles and the client holds
the last ladder.
"""

from __future__ import annotations

import asyncio
import json
import time
from datetime import datetime, timezone
from typing import Any
from zoneinfo import ZoneInfo

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from guards import claims_or_none
from routes.trade_log.common import _require_tool_member

router = APIRouter(tags=["market-stream"])

_PUSH_INTERVAL_S = 2.0
_CLOSED_SLEEP_S = 15.0
_NY = ZoneInfo("America/New_York")


def _utc_now_iso() -> str:
    return (
        datetime.now(timezone.utc)
        .isoformat()
        .replace("+00:00", "Z")
    )


def _session_open_for_chain_push() -> bool:
    """True when continuous chain pushes should run (RTH open)."""
    # Prefer Redis market status when bus is warm
    try:
        from market_data.market_bus.config import bus_enabled
        from market_data.market_bus.store import get_store

        if bus_enabled():
            store = get_store()
            if store is not None:
                doc = store.get_json("mb:session:market_status")
                if isinstance(doc, dict) and doc.get("market") is not None:
                    m = str(doc.get("market") or "").strip().lower()
                    if m == "open":
                        return True
                    if m in ("closed", "extended-hours", "early-close"):
                        return False
    except Exception:
        pass

    # Clock fallback: Mon–Fri 09:30–16:00 America/New_York
    now = datetime.now(_NY)
    if now.weekday() >= 5:
        return False
    mins = now.hour * 60 + now.minute
    return (9 * 60 + 30) <= mins < (16 * 60)


@router.websocket("/api/me/market/stream")
async def market_stream(ws: WebSocket) -> None:
    await ws.accept()
    claims = claims_or_none(ws)
    if not claims:
        await ws.send_json(
            {"t": "err", "code": "auth", "message": "Sign in required"}
        )
        await ws.close(code=4401)
        return
    try:
        _require_tool_member(claims, capability="read")
    except Exception as exc:
        await ws.send_json(
            {"t": "err", "code": "forbidden", "message": str(exc)}
        )
        await ws.close(code=4403)
        return

    await ws.send_json(
        {
            "t": "hello",
            "v": 1,
            "heartbeat_s": 15,
            "server_time": _utc_now_iso(),
            "push": True,
        }
    )

    # Active chain subscriptions: key -> params + last content_hash
    chain_subs: dict[str, dict[str, Any]] = {}
    stop = asyncio.Event()
    push_task = asyncio.create_task(
        _chain_push_loop(ws, chain_subs, stop),
        name="market-stream-chain-push",
    )

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
                await ws.send_json(
                    {"t": "err", "code": "bad_json", "message": "invalid json"}
                )
                continue
            op = (msg.get("op") or "").strip().lower()
            if op == "ping":
                await ws.send_json({"t": "pong"})
                continue
            if op == "hello":
                await ws.send_json(
                    {
                        "t": "hello",
                        "v": 1,
                        "heartbeat_s": 15,
                        "push": True,
                    }
                )
                continue
            if op == "sub":
                await _handle_sub(ws, msg, chain_subs)
                continue
            if op == "unsub":
                for c in msg.get("chains") or []:
                    if isinstance(c, dict):
                        key = _chain_sub_key(c)
                        chain_subs.pop(key, None)
                await ws.send_json(
                    {
                        "t": "unsub_ok",
                        "chains": sorted(chain_subs.keys()),
                    }
                )
                continue
            await ws.send_json(
                {"t": "err", "code": "unknown_op", "message": op}
            )
    except WebSocketDisconnect:
        return
    finally:
        stop.set()
        push_task.cancel()
        try:
            await push_task
        except asyncio.CancelledError:
            pass


def _chain_sub_key(c: dict[str, Any]) -> str:
    """HM15/HM16: dual-side generation key — side is view-only, not in key."""
    symbol = str(c.get("symbol") or "SPX").upper()
    exp = str(c.get("expiration") or "")[:10]
    wings = int(c.get("wings") or 25)
    return f"chain:{symbol}:{exp}:w{wings}"


async def _handle_sub(
    ws: WebSocket,
    msg: dict[str, Any],
    chain_subs: dict[str, dict[str, Any]],
) -> None:
    from routes import chain_ladder as cl

    # Symbols (marks snapshot) — one-shot; not the chain push path
    for s in msg.get("symbols") or []:
        sym = str(s).strip().upper()
        if not sym:
            continue
        try:
            cl._resolve_universe_symbol(sym)
        except Exception as exc:
            await ws.send_json(
                {
                    "t": "err",
                    "code": "universe",
                    "message": str(getattr(exc, "detail", exc)),
                }
            )
            continue
        store_doc = None
        try:
            from market_data.market_bus.store import get_store

            store = get_store()
            store_doc = store.get_json(f"mb:sym:{sym}") if store else None
        except Exception:
            store_doc = None
        await ws.send_json(
            {
                "t": "sym",
                "symbol": sym,
                "mode": "full",
                **(store_doc or {"mid": None, "note": "warming"}),
            }
        )

    # Chains — snapshot now + register for continuous **push**
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
                {
                    "t": "err",
                    "code": "universe",
                    "message": str(getattr(exc, "detail", exc)),
                }
            )
            continue
        try:
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
            await ws.send_json(
                {"t": "err", "code": "chain", "message": str(detail)}
            )
            continue

        key = f"chain:{symbol}:{exp}:w{wings}"
        chain_subs[key] = {
            "symbol": symbol,
            "expiration": exp,
            "side": side,  # view hint only; generation is dual-side
            "wings": wings,
            "product": resolved["product"],
            "chain_underlier": resolved["chain_underlier"],
            "kind": str(resolved.get("kind") or "equity"),
            "strike_step_cfg": resolved.get("strike_step"),
            "last_hash": ladder.get("content_hash"),
        }

        # Interest for chain_feed warm path
        try:
            from market_data.market_bus.store import get_store

            store = get_store()
            if store is not None:
                bus_key = cl._bus_ladder_key(
                    str(resolved["chain_underlier"]),
                    exp,
                    side,
                    wings,
                )
                store.touch_interest(bus_key)
                store.set_json(bus_key, ladder)
        except Exception:
            pass

        await ws.send_json(
            {
                "t": "chain",
                "mode": "full",
                "key": key,
                "content_hash": ladder.get("content_hash"),
                "ladder": ladder,
                "session_open": _session_open_for_chain_push(),
            }
        )

    if msg.get("session"):
        store_doc = None
        try:
            from market_data.market_bus.store import get_store

            store = get_store()
            store_doc = (
                store.get_json("mb:session:market_status") if store else None
            )
        except Exception:
            store_doc = None
        await ws.send_json(
            {
                "t": "session",
                "mode": "full",
                "open": _session_open_for_chain_push(),
                **(store_doc or {}),
            }
        )

    await ws.send_json(
        {
            "t": "sub_ok",
            "chains": sorted(chain_subs.keys()),
            "session_open": _session_open_for_chain_push(),
            "push": True,
        }
    )


async def _chain_push_loop(
    ws: WebSocket,
    chain_subs: dict[str, dict[str, Any]],
    stop: asyncio.Event,
) -> None:
    """Server-side loop: push chain full/diff/unchanged into the open socket."""
    from routes import chain_ladder as cl
    from market_data.chain_ladder import diff_ladder

    held_notified = False
    while not stop.is_set():
        try:
            if not chain_subs:
                await asyncio.sleep(_PUSH_INTERVAL_S)
                continue

            if not _session_open_for_chain_push():
                if not held_notified and chain_subs:
                    try:
                        await ws.send_json(
                            {
                                "t": "session",
                                "mode": "held",
                                "open": False,
                                "message": "Market closed — holding last chain",
                                "as_of": time.time(),
                            }
                        )
                    except Exception:
                        return
                    held_notified = True
                await asyncio.sleep(_CLOSED_SLEEP_S)
                continue

            held_notified = False
            # Snapshot keys to avoid mutation during iteration
            for key, meta in list(chain_subs.items()):
                if stop.is_set():
                    return
                try:
                    ladder = await asyncio.to_thread(
                        cl._fetch_ladder,
                        product=meta["product"],
                        chain_underlier=meta["chain_underlier"],
                        kind=meta["kind"],
                        expiration=meta["expiration"],
                        side=meta["side"],
                        wings=int(meta["wings"]),
                        strike_step_cfg=meta.get("strike_step_cfg"),
                    )
                except Exception as exc:
                    try:
                        await ws.send_json(
                            {
                                "t": "err",
                                "code": "chain",
                                "message": str(
                                    getattr(exc, "detail", None) or exc
                                ),
                                "key": key,
                            }
                        )
                    except Exception:
                        return
                    continue

                new_hash = ladder.get("content_hash")
                prev_hash = meta.get("last_hash")
                try:
                    if prev_hash and new_hash and prev_hash == new_hash:
                        await ws.send_json(
                            {
                                "t": "chain",
                                "mode": "unchanged",
                                "key": key,
                                "content_hash": new_hash,
                                "as_of": ladder.get("as_of"),
                                "session_open": True,
                            }
                        )
                    elif prev_hash:
                        # Build patch from server hash cache when possible
                        with cl._cache_lock:
                            prev = cl._by_hash.get(str(prev_hash))
                        patch = diff_ladder(prev, ladder)
                        mode = patch.get("mode") or "full"
                        if mode == "unchanged":
                            await ws.send_json(
                                {
                                    "t": "chain",
                                    "mode": "unchanged",
                                    "key": key,
                                    "content_hash": new_hash,
                                    "as_of": ladder.get("as_of"),
                                    "session_open": True,
                                }
                            )
                        elif mode == "diff":
                            await ws.send_json(
                                {
                                    "t": "chain",
                                    "mode": "diff",
                                    "key": key,
                                    "content_hash": patch.get("content_hash"),
                                    "as_of": patch.get("as_of"),
                                    "spot": patch.get("spot"),
                                    "band": patch.get("band"),
                                    "upserts": patch.get("upserts") or [],
                                    "removes": patch.get("removes") or [],
                                    "changed_strike_count": patch.get(
                                        "changed_strike_count"
                                    ),
                                    "session_open": True,
                                }
                            )
                        else:
                            await ws.send_json(
                                {
                                    "t": "chain",
                                    "mode": "full",
                                    "key": key,
                                    "content_hash": new_hash,
                                    "ladder": ladder,
                                    "session_open": True,
                                }
                            )
                    else:
                        await ws.send_json(
                            {
                                "t": "chain",
                                "mode": "full",
                                "key": key,
                                "content_hash": new_hash,
                                "ladder": ladder,
                                "session_open": True,
                            }
                        )
                except Exception:
                    return

                meta["last_hash"] = new_hash
                chain_subs[key] = meta

            await asyncio.sleep(_PUSH_INTERVAL_S)
        except asyncio.CancelledError:
            raise
        except Exception:
            await asyncio.sleep(_PUSH_INTERVAL_S)
