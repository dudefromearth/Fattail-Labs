"""Member market session status — gate chain polling when equities are closed."""

from __future__ import annotations

import time
from typing import Any

from fastapi import APIRouter, Request

from guards import require_session
from opf.session import (
    open_from_massive_doc as _open_from_massive_doc,
    printing_from_massive_doc as _printing_from_massive_doc,
)
from routes.trade_log.common import _require_tool_member

router = APIRouter(tags=["market-session"])


@router.get("/api/me/market/session-status")
def get_session_status(request: Request) -> dict[str, Any]:
    """Whether US equities session is open for continuous chain polling.

    Prefer Market Bus Redis snapshot; else Massive /v1/marketstatus/now;
    else fail-soft with clock-agnostic closed=false only if Massive unreachable
    (client applies its own clock fallback on error).
    """
    claims = require_session(request)
    _require_tool_member(claims, capability="read")

    # 1) Redis bus cache
    try:
        from market_data.market_bus.config import bus_enabled
        from market_data.market_bus.store import get_store

        if bus_enabled():
            store = get_store()
            if store is not None:
                doc = store.get_json("mb:session:market_status")
                if isinstance(doc, dict) and (
                    doc.get("market") is not None or doc.get("exchanges")
                ):
                    return {
                        "ok": True,
                        "open": _open_from_massive_doc(doc),
                        "printing": _printing_from_massive_doc(doc),
                        "market": doc.get("market"),
                        "exchanges": doc.get("exchanges"),
                        "serverTime": doc.get("serverTime"),
                        "as_of": doc.get("as_of") or time.time(),
                        "source": "redis_mb_session",
                    }
    except Exception:
        pass

    # 2) Live Massive status
    try:
        from market_data.massive_client import MassiveClient
        import urllib.request
        import json as _json

        client = MassiveClient()
        url = (
            f"{client.base_url.rstrip('/')}/v1/marketstatus/now"
            f"?apiKey={client.api_key}"
        )
        req = urllib.request.Request(
            url,
            headers={
                "Accept": "application/json",
                "Authorization": f"Bearer {client.api_key}",
                "User-Agent": "FatTail-Labs-session-status/1.0",
            },
        )
        with urllib.request.urlopen(req, timeout=12) as resp:
            body = resp.read().decode("utf-8")
        data = _json.loads(body)
        if not isinstance(data, dict):
            data = {"raw": data}
        return {
            "ok": True,
            "open": _open_from_massive_doc(data),
            "printing": _printing_from_massive_doc(data),
            "market": data.get("market"),
            "exchanges": data.get("exchanges"),
            "serverTime": data.get("serverTime"),
            "as_of": time.time(),
            "source": "massive_marketstatus_now",
        }
    except Exception as exc:
        return {
            "ok": False,
            "open": None,
            "printing": None,
            "error": str(exc),
            "as_of": time.time(),
            "source": "unavailable",
        }
