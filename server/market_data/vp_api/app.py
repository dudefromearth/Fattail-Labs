"""Contract v1.0 HTTP. Computing consumers only. 403 members even in dev."""

from __future__ import annotations

import json
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, Query, Request
from fastapi.responses import JSONResponse

import auth
from config import get_config
from guards import require_session
from market_data.vp_api.range_gate import refuse_below_floor
from market_data.vp_engine.coverage import VP_ROW, ceiling_of, floor_of, load_coverage
from market_data.vp_engine.rebuild import histogram_path
from market_data.vp_ingest.store import archive_root, in_rth

app = FastAPI(title="VP Profile API", docs_url=None, redoc_url=None)

SOURCE_FOR_TARGET = {"SPX": "ES", "XSP": "MES"}
RATIO = {"ES": 1, "SPY": 1, "MES": 0.1}


def _root() -> Path:
    return archive_root()


def _computing(request: Request) -> JSONResponse | dict:
    try:
        claims = require_session(request)
    except Exception:
        return JSONResponse(status_code=401, content={"error": "unauthenticated"})
    role = str(claims.get("role") or "observer")
    if not auth.role_at_least(role, "administrator"):
        return JSONResponse(
            status_code=403, content={"error": "computing_consumers_only"}
        )
    return claims


def _envelope(hist: dict[str, Any], *, target: str, source: str) -> dict[str, Any]:
    now_ns = int(datetime.now(timezone.utc).timestamp() * 1_000_000_000)
    mapping = {
        "ratio": RATIO.get(source, 1),
        "offset_published": 0,
        "offset_fit": 0,
        "fit_as_of": 0,
        "residual_rmse": 0,
        "sample_count": 0,
        "mark_source": "none",
    }
    flags = dict(hist.get("flags") or {})
    flags.setdefault("approximation", "none")
    flags["mapping"] = "FAILED"  # VPS3 not installed; bins still source-space
    return {
        "target_symbol": target,
        "source": source,
        "kind": hist.get("kind"),
        "session_date": hist.get("session_date"),
        "as_of": now_ns,
        "computed_at": now_ns,
        "profile_generation_id": hist.get("generation_id"),
        "parameter_set_hash": hist.get("parameter_hash"),
        "status": hist.get("status"),
        "flags": flags,
        "gaps": hist.get("gaps") or [],
        "mapping": mapping,
        "vp_row": hist.get("vp_row") or VP_ROW.get(source, 0.25),
        "bins": hist.get("bins") or [],
    }


def _load_hist(source: str, kind: str, session_date: date) -> dict[str, Any] | None:
    path = histogram_path(_root(), source, session_date, kind)
    if not path.is_file():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


@app.get("/v1/health")
def health(request: Request):
    gate = _computing(request)
    if isinstance(gate, JSONResponse):
        return gate
    cov = load_coverage(_root())
    collectors = {}
    for src in ("SPY", "ES", "MES"):
        row = cov.get(src) or {}
        collectors[src] = {
            "live": bool(row.get("ceiling")),
            "last_print_ns": 0,
        }
    return {
        "collectors": collectors,
        "gap_report": [],
        "mapping_fit": {},
        "backup_watch": "OK",
    }


@app.get("/v1/profile/{target_symbol}/range")
def profile_range(
    request: Request,
    target_symbol: str,
    from_: str | None = Query(default=None, alias="from"),
    to: str | None = Query(default=None),
    price_lo: float | None = Query(default=None),
    price_hi: float | None = Query(default=None),
    row: float | None = Query(default=None),
    source: str | None = Query(default=None),
):
    gate = _computing(request)
    if isinstance(gate, JSONResponse):
        return gate
    target = target_symbol.upper()
    if target not in SOURCE_FOR_TARGET:
        return JSONResponse(status_code=404, content={"error": "unknown_target"})
    src = (source or SOURCE_FOR_TARGET[target]).upper()
    if not from_ or not to:
        return JSONResponse(status_code=422, content={"error": "bad_range"})
    try:
        a = date.fromisoformat(from_)
        b = date.fromisoformat(to)
    except ValueError:
        return JSONResponse(status_code=422, content={"error": "bad_range"})
    refused = refuse_below_floor(
        from_d=a, to_d=b, floor=floor_of(_root(), src), ceiling=ceiling_of(_root(), src)
    )
    if refused:
        return JSONResponse(status_code=422, content=refused)
    # Sum session histograms in [from, to] in source space (single-session
    # today: one day). Futures multi-session /range in target space is VPS3.
    days = load_coverage(_root()).get(src, {}).get("sessions_binned") or []
    acc: dict[float, int] = {}
    gaps: list[Any] = []
    vp_row = row if row is not None else VP_ROW.get(src, 0.25)
    last = None
    for iso in days:
        d = date.fromisoformat(iso)
        if d < a or d > b:
            continue
        hist = _load_hist(src, "session", d)
        if not hist:
            continue
        last = hist
        for bn in hist.get("bins") or []:
            px = float(bn["price"])
            if price_lo is not None and px < price_lo:
                continue
            if price_hi is not None and px > price_hi:
                continue
            acc[px] = acc.get(px, 0) + int(bn["volume"])
        gaps.extend(hist.get("gaps") or [])
    if last is None:
        return JSONResponse(status_code=503, content={"error": "UNAVAILABLE", "status": "UNAVAILABLE"})
    bins = [{"price": p, "volume": acc[p]} for p in sorted(acc)]
    body = _envelope(last, target=target, source=src)
    body["kind"] = "range"
    body["bins"] = bins
    body["gaps"] = gaps
    body["vp_row"] = vp_row
    body["status"] = "GAPPED" if gaps else "COMPLETE"
    return body


@app.get("/v1/profile/{target_symbol}/{kind}")
def profile(
    request: Request,
    target_symbol: str,
    kind: str,
    session_date: str | None = Query(default=None),
    as_of: str | None = Query(default=None),
    row: float | None = Query(default=None),
    source: str | None = Query(default=None),
):
    del as_of, row
    gate = _computing(request)
    if isinstance(gate, JSONResponse):
        return gate
    target = target_symbol.upper()
    if target not in SOURCE_FOR_TARGET:
        return JSONResponse(status_code=404, content={"error": "unknown_target"})
    if kind == "composite":
        return JSONResponse(status_code=404, content={"error": "unknown_target"})
    if kind not in ("session", "developing"):
        return JSONResponse(status_code=404, content={"error": "unknown_target"})
    src = (source or SOURCE_FOR_TARGET[target]).upper()
    if kind == "developing":
        day = date.today()
        hist = _load_hist(src, "developing", day)
        if not hist:
            return JSONResponse(
                status_code=503, content={"error": "UNAVAILABLE", "status": "UNAVAILABLE"}
            )
        return _envelope(hist, target=target, source=src)
    if not session_date:
        return JSONResponse(status_code=422, content={"error": "bad_range"})
    day = date.fromisoformat(session_date)
    if in_rth() and day == date.today():
        return JSONResponse(
            status_code=503, content={"error": "UNAVAILABLE", "status": "UNAVAILABLE"}
        )
    hist = _load_hist(src, "session", day)
    if not hist:
        return JSONResponse(
            status_code=503, content={"error": "UNAVAILABLE", "status": "UNAVAILABLE"}
        )
    return _envelope(hist, target=target, source=src)
