"""Contract v1.1 HTTP. Computing consumers only. 403 members even in dev."""

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
from market_data.vp_api.range_gate import range_decision
from market_data.vp_engine.coverage import VP_ROW, ceiling_of, floor_of, load_coverage
from market_data.vp_engine.display_rebin import display_rebin
from market_data.vp_engine.rebuild import histogram_path
from market_data.vp_http_cache import HEALTH, payload_response
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


def _coverage_pair(source: str) -> dict[str, str | None]:
    fl = floor_of(_root(), source)
    cl = ceiling_of(_root(), source)
    return {
        "floor_session": fl.isoformat() if fl else None,
        "ceiling_session": cl.isoformat() if cl else None,
    }


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
        "coverage": _coverage_pair(source),
    }


def _last_print_t(source: str) -> int:
    """Raw vendor t of the last landed print, or 0."""
    import gzip

    trades = _root() / "vp" / "ingest" / source.upper() / "trades"
    if not trades.is_dir():
        return 0
    days = sorted(p for p in trades.glob("day=*") if (p / "prints.jsonl.gz").is_file())
    if not days:
        return 0
    path = days[-1] / "prints.jsonl.gz"
    last = None
    try:
        with gzip.open(path, "rt", encoding="utf-8") as fh:
            for line in fh:
                if line.strip():
                    last = line
    except OSError:
        return 0
    if not last:
        return 0
    try:
        rec = json.loads(last)
        return int(rec.get("t") or 0)
    except (json.JSONDecodeError, TypeError, ValueError):
        return 0


def _load_hist(source: str, kind: str, session_date: date) -> dict[str, Any] | None:
    path = histogram_path(_root(), source, session_date, kind)
    if not path.is_file():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def _apply_display_row(
    bins: list[dict[str, Any]],
    body: dict[str, Any],
    *,
    native_row: float,
    requested: float | None,
) -> JSONResponse | dict[str, Any]:
    """SA-L8: row= is render-only. Echoing it without applying is forbidden."""
    if requested is None:
        body["bins"] = bins
        body["vp_row"] = native_row
        return body
    err, out = display_rebin(bins, native_row=native_row, requested_row=requested)
    if err is not None:
        return JSONResponse(status_code=422, content=err)
    body["bins"] = out
    body["vp_row"] = requested
    flags = dict(body.get("flags") or {})
    if requested != native_row:
        flags["approximation"] = "display_rebin"
        flags["substrate_vp_row"] = native_row
    body["flags"] = flags
    return body


@app.get("/v1/health")
def health(request: Request):
    gate = _computing(request)
    if isinstance(gate, JSONResponse):
        return gate
    cov = load_coverage(_root())
    collectors = {}
    coverage = {}
    for src in ("SPY", "ES", "MES"):
        row = cov.get(src) or {}
        last_t = _last_print_t(src)
        collectors[src] = {
            "live": last_t > 0,
            "last_print_ns": last_t,
        }
        binned = list(row.get("sessions_binned") or [])
        coverage[src] = {
            "floor_session": row.get("floor"),
            "ceiling_session": row.get("ceiling"),
            "sessions_binned": len(binned),
        }
    return JSONResponse(
        content={
            "collectors": collectors,
            "coverage": coverage,
            "gap_report": [],
            "mapping_fit": {},
            "backup_watch": "OK",
        },
        headers={"Cache-Control": HEALTH},
    )


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
    allow_partial: bool = Query(default=False),
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
    kind, extra = range_decision(
        from_d=a,
        to_d=b,
        floor=floor_of(_root(), src),
        ceiling=ceiling_of(_root(), src),
        allow_partial=allow_partial,
    )
    if kind == "422":
        return JSONResponse(status_code=422, content=extra)
    if kind == "partial" and extra:
        a = date.fromisoformat(str(extra["served_from"]))
        b = date.fromisoformat(str(extra["served_to"]))
    # Sum session histograms in [from, to] in source space (single-session
    # today: one day). Futures multi-session /range in target space is VPS3.
    days = load_coverage(_root()).get(src, {}).get("sessions_binned") or []
    acc: dict[float, int] = {}
    gaps: list[Any] = []
    last = None
    native_row = VP_ROW.get(src, 0.25)
    for iso in days:
        d = date.fromisoformat(iso)
        if d < a or d > b:
            continue
        hist = _load_hist(src, "session", d)
        if not hist:
            continue
        last = hist
        native_row = float(hist.get("vp_row") or native_row)
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
    body["gaps"] = gaps
    body["status"] = "GAPPED" if gaps else "COMPLETE"
    if kind == "partial" and extra:
        body["coverage"] = {**(body.get("coverage") or {}), **extra}
    applied = _apply_display_row(bins, body, native_row=native_row, requested=row)
    live = in_rth() and b >= date.today()
    return payload_response(request, applied, kind=body.get("kind") if isinstance(applied, dict) else "range", live=live)


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
    del as_of
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
        body = _envelope(hist, target=target, source=src)
        native = float(hist.get("vp_row") or VP_ROW.get(src, 0.25))
        applied = _apply_display_row(
            list(body.get("bins") or []), body, native_row=native, requested=row
        )
        return payload_response(request, applied, kind="developing", live=True)
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
    body = _envelope(hist, target=target, source=src)
    native = float(hist.get("vp_row") or VP_ROW.get(src, 0.25))
    applied = _apply_display_row(
        list(body.get("bins") or []), body, native_row=native, requested=row
    )
    return payload_response(request, applied, kind="session", live=False)
