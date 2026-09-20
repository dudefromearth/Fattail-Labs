"""Futures history sidecar — SODP2 / F3. Computing-class. StudioOne :4012.

Massive-first. Fill never copied. No chain_feed / vp-api port.
"""

from __future__ import annotations

import os

from fastapi import FastAPI, Query, Request
from fastapi.responses import JSONResponse

import auth
from sa_dev.futures_history import serve as serve_history

app = FastAPI(title="Futures History", docs_url=None, redoc_url=None)


def _computing(request: Request) -> JSONResponse | dict:
    from config import get_config

    token = request.cookies.get(get_config().session_cookie)
    if not token:
        return JSONResponse(status_code=401, content={"error": "unauthenticated"})
    try:
        claims = auth.verify_computing_session(token)
    except Exception:
        return JSONResponse(status_code=401, content={"error": "unauthenticated"})
    role = str(claims.get("role") or "observer")
    if not auth.role_at_least(role, "administrator"):
        return JSONResponse(
            status_code=403, content={"error": "computing_consumers_only"}
        )
    return claims


def _gate(request: Request):
    gate = _computing(request)
    if isinstance(gate, JSONResponse):
        return gate
    return None


@app.get("/history/v1/health")
@app.get("/api/history/v1/health")
def get_health(request: Request):
    blocked = _gate(request)
    if blocked is not None:
        return blocked
    return {"ok": True, "service": "history", "price_source": "massive_futures_aggs"}


@app.get("/history/v1/ohlc/{source}")
@app.get("/api/history/v1/ohlc/{source}")
def get_ohlc(
    request: Request,
    source: str,
    tf: str = Query(default="5m"),
    contract: str | None = Query(default=None),
    bars: int | None = Query(default=None),
    before_t: int | None = Query(default=None),
):
    blocked = _gate(request)
    if blocked is not None:
        return blocked
    kw: dict = {"tf": tf, "contract": contract, "before_t": before_t}
    if bars is not None:
        kw["bars_rule"] = bars
    return serve_history(source, **kw)


@app.get("/history/v1/contracts/{source}")
@app.get("/api/history/v1/contracts/{source}")
def get_contracts(request: Request, source: str):
    blocked = _gate(request)
    if blocked is not None:
        return blocked
    from datetime import date

    from symbology.catalog import contract_symbol, quarterly_from

    src = source.upper()
    rows = []
    for y, m, code in quarterly_from(date.today(), count=8):
        sym = contract_symbol(src, y, code)
        rows.append({"id": sym, "label": sym, "product": src})
    return {"source": src, "contracts": rows}


def main() -> int:
    host = (os.environ.get("LABS_HISTORY_API_HOST") or "").strip()
    port_raw = (os.environ.get("LABS_HISTORY_API_PORT") or "").strip()
    if not host or not port_raw:
        raise SystemExit("LABS_HISTORY_API_HOST and LABS_HISTORY_API_PORT are required")
    import uvicorn

    uvicorn.run(
        "history_app:app",
        host=host,
        port=int(port_raw),
        reload=False,
        timeout_keep_alive=75,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
