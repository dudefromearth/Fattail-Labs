"""Contract v1.1 HTTP. Computing consumers only. 403 members even in dev."""

from __future__ import annotations

import json
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, Query, Request
from fastapi.responses import JSONResponse, StreamingResponse

import auth
from config import get_config
from market_data.vp_api.range_gate import range_decision
from market_data.vp_engine.continuous import (
    FUTURES,
    adjust_for,
    continuous_histogram_path,
    provenance,
    shift_bins,
)
from market_data.vp_engine.coverage import VP_ROW, ceiling_of, floor_of, load_coverage
from market_data.vp_engine.display_rebin import display_rebin
from market_data.vp_engine.rebuild import histogram_path
from market_data.vp_chunks import TFS, assemble_bars, ns_bars, parse_bound
from market_data.vp_hot import hot
from market_data.vp_http_cache import HEALTH, payload_response
from market_data.vp_ingest.store import archive_root, in_rth
from market_data.vp_stream import iter_source_sse
from market_data.vp_warmer import load_chunks

app = FastAPI(title="VP Profile API", docs_url=None, redoc_url=None)

SOURCE_FOR_TARGET = {"SPX": "ES", "XSP": "MES"}
RATIO = {"ES": 1, "SPY": 1, "MES": 0.1}


def _root() -> Path:
    return archive_root()


def _computing(request: Request) -> JSONResponse | dict:
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


def _continuous_block(source: str) -> dict[str, Any] | None:
    return provenance(_root(), source)


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
        **(
            {"continuous": _continuous_block(source)}
            if _continuous_block(source)
            else {}
        ),
    }


_LAST_PRINT: dict[str, tuple[float, int, int]] = {}
_LAST_PRINT_SCANNING: set[str] = set()


def _scan_last_print(source: str) -> int:
    import gzip

    trades = _root() / "vp" / "ingest" / source.upper() / "trades"
    if not trades.is_dir():
        return 0
    days = sorted(p for p in trades.glob("day=*") if (p / "prints.jsonl.gz").is_file())
    if not days:
        return 0
    path = days[-1] / "prints.jsonl.gz"
    try:
        st = path.stat()
    except OSError:
        return 0
    hit = _LAST_PRINT.get(source)
    if hit and hit[0] == st.st_mtime and hit[1] == st.st_size:
        return hit[2]
    last = None
    try:
        with gzip.open(path, "rt", encoding="utf-8") as fh:
            for line in fh:
                if line.strip():
                    last = line
    except OSError:
        return 0
    val = 0
    if last:
        try:
            rec = json.loads(last)
            val = int(rec.get("t") or 0)
        except (json.JSONDecodeError, TypeError, ValueError):
            val = 0
    _LAST_PRINT[source] = (st.st_mtime, st.st_size, val)
    return val


def _last_print_t(source: str) -> int:
    """Cached last vendor t. Miss returns 0 and scans in the background (health must not take seconds)."""
    import threading

    hit = _LAST_PRINT.get(source)
    if hit:
        return hit[2]
    if source not in _LAST_PRINT_SCANNING:
        _LAST_PRINT_SCANNING.add(source)

        def _run() -> None:
            try:
                _scan_last_print(source)
            finally:
                _LAST_PRINT_SCANNING.discard(source)

        threading.Thread(target=_run, daemon=True, name=f"vp-lastprint-{source}").start()
    return 0


def _load_hist(source: str, kind: str, session_date: date) -> dict[str, Any] | None:
    path = histogram_path(_root(), source, session_date, kind)
    if not path.is_file():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def _load_hist_published(source: str, kind: str, session_date: date) -> tuple[dict[str, Any] | None, bool]:
    """Futures session: prefer D6 continuous histogram (already in current frame)."""
    if kind == "session" and source.upper() in FUTURES:
        path = continuous_histogram_path(_root(), source, session_date)
        if path.is_file():
            return json.loads(path.read_text(encoding="utf-8")), True
    return _load_hist(source, kind, session_date), False


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
    days = load_coverage(_root()).get(src, {}).get("sessions_binned") or []
    live = in_rth() and b >= date.today()
    cov_gen = ",".join(iso for iso in days if a <= date.fromisoformat(iso) <= b)
    ck = f"range:{src}:{a.isoformat()}:{b.isoformat()}:{price_lo}:{price_hi}:{row}"
    layer = hot()
    if layer.enabled and cov_gen:
        cached = layer.get(ck)
        if cached and isinstance(cached.get("body"), dict) and (
            (not live and layer.gen_matches(cached, cov_gen))
            or (live and layer.gen_matches(cached, cov_gen))
        ):
            return payload_response(request, cached["body"], kind="range", live=live)
    acc: dict[float, int] = {}
    gaps: list[Any] = []
    last = None
    native_row = VP_ROW.get(src, 0.25)
    for iso in days:
        d = date.fromisoformat(iso)
        if d < a or d > b:
            continue
        hist, already = _load_hist_published(src, "session", d)
        if not hist:
            continue
        last = hist
        native_row = float(hist.get("vp_row") or native_row)
        delta = 0.0 if already else (adjust_for(_root(), src, d) if src in FUTURES else 0.0)
        for bn in shift_bins(list(hist.get("bins") or []), delta):
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
    if layer.enabled and isinstance(applied, dict):
        layer.set(ck, applied, gen=cov_gen)
    return payload_response(request, applied, kind="range", live=live)


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
        gid = str(hist.get("generation_id") or "")
        ck = f"dev:{src}:{row}"
        layer = hot()
        if layer.enabled and gid:
            cached = layer.get(ck)
            if cached and isinstance(cached.get("body"), dict) and layer.gen_matches(cached, gid):
                return payload_response(request, cached["body"], kind="developing", live=True)
        body = _envelope(hist, target=target, source=src)
        native = float(hist.get("vp_row") or VP_ROW.get(src, 0.25))
        applied = _apply_display_row(
            list(body.get("bins") or []), body, native_row=native, requested=row
        )
        if layer.enabled and isinstance(applied, dict) and gid:
            layer.set(ck, applied, gen=gid)
        return payload_response(request, applied, kind="developing", live=True)
    if not session_date:
        return JSONResponse(status_code=422, content={"error": "bad_range"})
    day = date.fromisoformat(session_date)
    if in_rth() and day == date.today():
        return JSONResponse(
            status_code=503, content={"error": "UNAVAILABLE", "status": "UNAVAILABLE"}
        )
    hist, already = _load_hist_published(src, "session", day)
    if not hist:
        return JSONResponse(
            status_code=503, content={"error": "UNAVAILABLE", "status": "UNAVAILABLE"}
        )
    body = _envelope(hist, target=target, source=src)
    native = float(hist.get("vp_row") or VP_ROW.get(src, 0.25))
    bins = list(body.get("bins") or [])
    if src in FUTURES and not already:
        bins = shift_bins(bins, adjust_for(_root(), src, day))
        body["bins"] = bins
    applied = _apply_display_row(
        bins, body, native_row=native, requested=row
    )
    return payload_response(request, applied, kind="session", live=False)


@app.get("/v1/ohlc/{source_symbol}/{timeframe}")
def ohlc_window(
    request: Request,
    source_symbol: str,
    timeframe: str,
    from_: str | None = Query(default=None, alias="from"),
    to: str | None = Query(default=None),
):
    """Assemble from warmed session chunks. No print-gzip on this path."""
    gate = _computing(request)
    if isinstance(gate, JSONResponse):
        return gate
    src = source_symbol.upper()
    if src not in ("SPY", "ES", "MES"):
        return JSONResponse(status_code=404, content={"error": "unknown_target"})
    tf = timeframe.lower()
    if tf not in TFS:
        return JSONResponse(status_code=422, content={"error": "bad_range"})
    a = parse_bound(from_)
    b = parse_bound(to)
    if from_ and a is None:
        return JSONResponse(status_code=422, content={"error": "bad_range"})
    if to and b is None:
        return JSONResponse(status_code=422, content={"error": "bad_range"})
    if a and b and a > b:
        return JSONResponse(status_code=422, content={"error": "bad_range"})
    days: list[str] = []
    if a and b:
        d = a
        while d <= b:
            days.append(d.isoformat())
            d = date.fromordinal(d.toordinal() + 1)
    else:
        from market_data.vp_warmer import _session_days

        days = [x.isoformat() for x in _session_days(_root(), src)]
        if a:
            days = [x for x in days if x >= a.isoformat()]
        if b:
            days = [x for x in days if x <= b.isoformat()]
    chunks = load_chunks(src, tf, days)
    adj = None
    if src in FUTURES:
        from market_data.vp_engine.continuous import load_roll_table

        doc = load_roll_table(_root(), src)
        adj = (doc or {}).get("adjust") if doc else None
    bars, served, contract, rule = assemble_bars(chunks, from_d=a, to_d=b, adjust=adj)
    missing = [d for d in days if d not in served]
    if not served:
        return JSONResponse(
            status_code=503,
            content={"error": "UNAVAILABLE", "status": "WARMING", "missing": missing[:14]},
        )
    live = in_rth() and (b is None or b >= date.today())
    body = {
        "source": src,
        "timeframe": tf,
        "kind": "ohlc",
        "status": "GAPPED" if missing else "COMPLETE",
        "contract": contract,
        "lead_rule": rule,
        "bars": ns_bars(bars),
        "gaps": [{"session": d, "cause": "WARMING"} for d in missing],
        "coverage": {
            "floor_session": served[0] if served else None,
            "ceiling_session": served[-1] if served else None,
        },
        "profile_generation_id": f"{src}:{tf}:{served[0]}:{served[-1]}:{len(bars)}",
        "flags": {"mapping": "FAILED", "approximation": "none"},
    }
    cont = _continuous_block(src)
    if cont:
        body["continuous"] = cont
    return payload_response(request, body, kind="ohlc", live=live)


@app.get("/v1/stream")
@app.get("/v1/stream/{source_symbol}")
async def stream_ticks(
    request: Request,
    source_symbol: str | None = None,
    source: str | None = Query(default=None),
):
    """Contract v1.3 SSE. Tails ingest. Collectors untouched."""
    gate = _computing(request)
    if isinstance(gate, JSONResponse):
        return gate
    src = (source_symbol or source or "").upper()
    if not src:
        return JSONResponse(status_code=422, content={"error": "source_required"})
    return StreamingResponse(
        iter_source_sse(src),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-store", "X-Accel-Buffering": "no"},
    )
