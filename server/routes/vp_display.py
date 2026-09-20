"""Member display path for VP/SA (A2.6 · Data-Delivery D4/D5).

Authenticated members receive health / OHLC / range / stream via Labs.
Computing-class VP API stays off the browser.
OHLC/contracts for ES/MES hop to StudioOne history :4012 (SODP3).
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query, Request
from starlette.responses import JSONResponse, StreamingResponse

import auth
from config import get_config
from guards import require_session
from market_data.vp_http_cache import HEALTH, payload_response
from sa_dev.service import (
    contracts_for_source,
    health,
    ohlc_for_source,
    range_for,
    structure_for,
)
from sa_dev.stream import iter_live_sse, iter_mock_sse

router = APIRouter(tags=["vp-display"])


def _computing_headers() -> dict[str, str]:
    """Labs is the computing consumer (A2.6). Never forward the member cookie."""
    token = auth.issue_computing_session()
    name = get_config().session_cookie
    return {"Cookie": f"{name}={token}"}


def _require_member(request: Request) -> dict:
    return require_session(request)


_INPROCESS = frozenset({"", "inprocess", "mock", "mock://"})
_PIN_HOSTS = {"studioone.local": "192.168.1.111"}


def _history_base() -> str:
    env = (os.environ.get("LABS_HISTORY_API_BASE") or "").strip()
    if env.lower() in _INPROCESS and env != "":
        return ""
    if env:
        return _pin_url(env.rstrip("/"))
    env_path = Path(__file__).resolve().parents[2] / ".env"
    if not env_path.is_file():
        return ""
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        if k.strip() == "LABS_HISTORY_API_BASE":
            raw = v.strip().strip('"').strip("'")
            if raw.lower() in _INPROCESS:
                return ""
            return _pin_url(raw.rstrip("/")) if raw else ""
    return ""


def _pin_url(url: str) -> str:
    from urllib.parse import urlsplit, urlunsplit

    u = urlsplit(url)
    host = (u.hostname or "").lower()
    if host not in _PIN_HOSTS:
        return url
    netloc = _PIN_HOSTS[host]
    if u.port:
        netloc = f"{netloc}:{u.port}"
    return urlunsplit((u.scheme, netloc, u.path, u.query, u.fragment))


def _history_hop(path: str, params: dict[str, str] | None = None) -> JSONResponse | None:
    base = _history_base()
    if not base:
        return None
    qs = urllib.parse.urlencode({k: v for k, v in (params or {}).items() if v})
    url = f"{base}{path}" + (f"?{qs}" if qs else "")
    headers = {**_computing_headers(), "Accept": "application/json"}
    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            raw = resp.read()
            parsed = json.loads(raw.decode("utf-8")) if raw else {}
            return JSONResponse(content=parsed, status_code=resp.status)
    except urllib.error.HTTPError as exc:
        raw = exc.read()
        try:
            parsed = json.loads(raw.decode("utf-8")) if raw else {"error": "upstream"}
        except json.JSONDecodeError:
            parsed = {"error": "upstream_non_json", "status": exc.code}
        return JSONResponse(content=parsed, status_code=exc.code)
    except urllib.error.URLError as exc:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "history_upstream_unavailable",
                "message": f"StudioOne history unreachable: {exc}",
            },
        ) from exc


@router.get("/api/app/vp/v1/health")
def get_health(request: Request):
    _require_member(request)
    body = health(headers=_computing_headers())
    return JSONResponse(content=body, headers={"Cache-Control": HEALTH})


@router.get("/api/app/vp/v1/structure/{target_symbol}")
def get_structure(
    request: Request,
    target_symbol: str,
    source: str | None = Query(default=None),
    session_date: str | None = Query(default=None),
    kind: str = Query(default="session"),
    harness: str = Query(default="live"),
    include_bins: bool = Query(default=False),
):
    _require_member(request)
    payload = structure_for(
        target_symbol,
        source=source,
        session_date=session_date,
        kind=kind,
        harness=harness,
        headers=_computing_headers(),
        include_bins=include_bins,
    )
    if "bins" in payload and not include_bins:
        raise HTTPException(status_code=500, detail="bins leaked into structure")
    live = harness == "live" and kind == "developing"
    return payload_response(request, payload, kind=kind, live=live)


@router.get("/api/app/vp/v1/range/{target_symbol}")
def get_range_profile(
    request: Request,
    target_symbol: str,
    source: str | None = Query(default=None),
    from_date: str = Query(alias="from"),
    to_date: str = Query(alias="to"),
    price_lo: float | None = Query(default=None),
    price_hi: float | None = Query(default=None),
    row: float | None = Query(default=None),
    harness: str = Query(default="live"),
):
    _require_member(request)
    payload = range_for(
        target_symbol,
        source=source,
        from_date=from_date,
        to_date=to_date,
        price_lo=price_lo,
        price_hi=price_hi,
        row=row,
        harness=harness,
        headers=_computing_headers(),
    )
    return payload_response(request, payload, kind="range", live=harness == "live")


@router.get("/api/app/vp/v1/contracts/{source}")
def get_contracts(request: Request, source: str):
    _require_member(request)
    hopped = _history_hop(f"/history/v1/contracts/{source.upper()}")
    if hopped is not None:
        return hopped
    rows = contracts_for_source(source)
    return {"source": source.upper(), "contracts": rows}


@router.get("/api/app/vp/v1/ohlc/{source}")
def get_source_ohlc(
    request: Request,
    source: str,
    tf: str = Query(default="5m"),
    lookback_days: int = Query(default=0),
    contract: str | None = Query(default=None),
    bars: int | None = Query(default=None),
    before_t: int | None = Query(default=None),
):
    """Futures OHLC hops to StudioOne history (N-bar model, REQ-006)."""
    _require_member(request)
    if tf not in ("1m", "5m", "15m", "1h", "1d"):
        raise HTTPException(status_code=422, detail="tf must be 1m|5m|15m|1h|1d")
    params: dict[str, str] = {"tf": tf}
    if contract:
        params["contract"] = contract
    if bars is not None:
        params["bars"] = str(bars)
    if before_t is not None:
        params["before_t"] = str(before_t)
    hopped = _history_hop(f"/history/v1/ohlc/{source.upper()}", params)
    if hopped is not None:
        return hopped
    payload = ohlc_for_source(
        source, tf=tf, lookback_days=lookback_days, contract=contract
    )
    return payload_response(request, payload, kind="ohlc", live=True)


@router.get("/api/app/vp/v1/stream")
def get_stream(
    request: Request,
    source: str = Query(default="ES"),
    timeframe: str = Query(default="5m"),
    harness: str = Query(default="live"),
    once: bool = Query(default=False),
):
    _require_member(request)
    if harness == "fixture":
        gen = iter_mock_sse(source, timeframe, once=True if once else False)
    else:
        gen = iter_live_sse(source, timeframe, headers=_computing_headers())
    return StreamingResponse(
        gen,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
