"""Quant Lab read API — ATRV v0.8 primitives over the [C][T] store.

GET  /api/me/quant/days                       what is built
GET  /api/me/quant/series?day&book&contracts&fields&t0&t1
GET  /api/me/quant/mark?day&book&legs&t0&t1   mark[t] with presence, never interpolated
POST /api/me/quant/simulate                   Monte Carlo over fills — a DISTRIBUTION

Not member-facing in the Strategy Lab sense yet: this is the primitive.
QLAB §4.5 governs what calls it from a notebook; QLAB §4.4 governs what
reaches a member. The response says which fields are display_legal.
Nothing here opens a snapshot file or the archive (AT-ATRV-3, AT-QLAB-4).
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Body, HTTPException, Query, Request, Response

from config import validate_quant_env
from guards import require_session
from quant.layout import ALL_FIELDS
from quant.simulate import ExitRule, Leg, Params, SimulateRefusal, simulate, sweep_entries
from quant.store import StoreError, list_days, open_day

router = APIRouter(tags=["quant"])
API_VERSION = 1
MAX_CONTRACTS = 400
MAX_PATHS = 20_000
SIDES = ("C", "P")


def _settings() -> dict:
    return validate_quant_env()


def _not_configured() -> Response:
    body = {"error": "QUANT STORE NOT CONFIGURED", "api_version": API_VERSION}
    return Response(content=json.dumps(body, separators=(",", ":")), status_code=501,
                    media_type="application/json; charset=utf-8",
                    headers={"Cache-Control": "max-age=0, must-revalidate"})


def _store(day: str, book: str):
    s = _settings()
    if not s["root"]:
        return None
    try:
        return open_day(s["root"], day, book)
    except StoreError as exc:
        raise HTTPException(status_code=404, detail=f"NO_BUILD: {exc}") from exc


def _parse_legs(raw: str) -> list[tuple[float, str, int]]:
    """'628C:+1,630C:-2,632C:+1' -> [(628.0,'C',1), ...]"""
    out = []
    for part in raw.split(","):
        part = part.strip()
        if not part:
            continue
        try:
            spec, q = part.split(":")
            side = spec[-1].upper()
            strike = float(spec[:-1])
            qty = int(q)
        except Exception as exc:
            raise HTTPException(status_code=422, detail=f"BAD_LEG {part!r}") from exc
        if side not in SIDES or qty == 0:
            raise HTTPException(status_code=422, detail=f"BAD_LEG {part!r}")
        out.append((strike, side, qty))
    if not out:
        raise HTTPException(status_code=422, detail="NO_LEGS")
    return out


def _exit_rule(body: dict) -> ExitRule:
    kind = str(body.get("exit_kind", "time"))
    if kind not in ("time", "target"):
        raise HTTPException(status_code=422, detail="exit_kind must be time|target")
    try:
        pct = float(body.get("target_pct", 150.0))
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail="target_pct must be a number") from exc
    if kind == "target" and not (0 < pct <= 10_000):
        raise HTTPException(status_code=422, detail="target_pct must be in (0, 10000]")
    return ExitRule(kind=kind, pct=pct)


def _resolve(st, legs: list[tuple[float, str, int]]) -> list[tuple[int, int]]:
    res = []
    for strike, side, qty in legs:
        c = st.find(strike, side)
        if c is None:
            raise HTTPException(status_code=404,
                                detail=f"CONTRACT_NOT_IN_BOOK {strike:g}{side} — never in the band this day")
        res.append((c, qty))
    return res


@router.get("/api/me/quant/days")
def quant_days(request: Request) -> Any:
    require_session(request)
    s = _settings()
    if not s["root"]:
        return _not_configured()
    return {"api_version": API_VERSION, "days": list_days(Path(s["root"])),
            "greeks_quantum_decimals": s["greeks_quantum"]}


@router.get("/api/me/quant/spot")
def quant_spot(request: Request, day: str, book: str) -> Any:
    """The day's time axis and spot — what a scrubber needs before any leg exists."""
    require_session(request)
    st = _store(day, book)
    if st is None:
        return _not_configured()
    return {"api_version": API_VERSION, "day": st.day, "book": st.book, "T": st.T,
            "time_ms": st.times(), "spot": [st.spot(t) for t in range(st.T)],
            "strikes": sorted({c[0] for c in st.contracts()})}


@router.get("/api/me/quant/chain")
def quant_chain(request: Request, day: str, book: str,
                t_ms: int = Query(..., description="playhead, epoch ms")) -> Any:
    """The whole chain at the snapshot that WAS the decision surface at t_ms.

    Time Machine's per-instant read. Slices column t across every contract
    present at that instant — no snapshot file opened (AT-ATRV-3), no
    nearest-neighbour search, nothing between snapshots invented
    (t_at_or_before, never interpolated). Greeks are quantised and say so.
    """
    require_session(request)
    st = _store(day, book)
    if st is None:
        return _not_configured()
    t = st.t_at_or_before(t_ms)
    if t is None:
        raise HTTPException(status_code=404, detail="BEFORE_FIRST_SNAPSHOT")
    rows = []
    sc = st.scale("mid")
    for c, (k, side, exp) in enumerate(st.contracts()):
        if not st.present(c, t):
            continue
        def val(f, scale=None):
            v = st.value(f, c, t)
            return None if v is None else (v / (scale or st.scale(f)) if st.scale(f) != 1 else v)
        rows.append({"strike": k, "side": side, "expiration": exp,
                     "mid": val("mid"), "bid": val("bid"), "ask": val("ask"),
                     "delta": val("delta"), "gamma": val("gamma"), "theta": val("theta"),
                     "vega": val("vega"), "iv": val("iv"),
                     "volume": val("volume"), "open_interest": val("open_interest"),
                     "quote_age_ms": (None if st.value("last_updated", c, t) is None
                                      else -st.value("last_updated", c, t))})
    return {"api_version": API_VERSION, "day": st.day, "book": st.book,
            "t": t, "time_ms": st.time_ms(t), "requested_ms": t_ms,
            "lag_ms": t_ms - st.time_ms(t), "spot": st.spot(t), "rows": rows,
            "quantised": {f: st.quantised(f) for f in ("delta", "gamma", "theta", "vega", "iv")},
            "greeks_quantum_decimals": st.meta.get("greeks_quantum_decimals"),
            "content_hash": f"store:{st.meta.get('source_sha1','')[:12]}:{t}",
            "note": "the snapshot at or before t — never a blend of two"}


@router.get("/api/me/quant/series")
def quant_series(request: Request, day: str, book: str,
                 contracts: str = Query(..., description="'628C,630P'"),
                 fields: str = Query("mid"), t0: int = 0, t1: int | None = None) -> Any:
    require_session(request)
    st = _store(day, book)
    if st is None:
        return _not_configured()
    fl = [f for f in fields.split(",") if f]
    bad = [f for f in fl if f not in ALL_FIELDS]
    if bad:
        raise HTTPException(status_code=422, detail=f"UNKNOWN_FIELD {bad}")
    cs = []
    for spec in contracts.split(","):
        spec = spec.strip()
        if not spec:
            continue
        c = st.find(float(spec[:-1]), spec[-1].upper())
        if c is None:
            raise HTTPException(status_code=404, detail=f"CONTRACT_NOT_IN_BOOK {spec}")
        cs.append(c)
    if len(cs) > MAX_CONTRACTS:
        raise HTTPException(status_code=422, detail=f"TOO_MANY_CONTRACTS > {MAX_CONTRACTS}")
    g = st.gather(fl, cs, t0, t1)
    g.update({"api_version": API_VERSION, "day": st.day, "book": st.book, "T": st.T,
              "time_ms": st.times()[g["t0"]:g["t1"]],
              "quantised": {f: st.quantised(f) for f in fl},
              "provenance": {"store": st.meta.get("source_sha1"),
                             "built_at": st.meta.get("built_at")}})
    return g


@router.get("/api/me/quant/mark")
def quant_mark(request: Request, day: str, book: str,
               legs: str = Query(..., description="'628C:+1,630C:-2,632C:+1'"),
               t0: int = 0, t1: int | None = None) -> Any:
    require_session(request)
    st = _store(day, book)
    if st is None:
        return _not_configured()
    resolved = _resolve(st, _parse_legs(legs))
    mark, ok = st.mark(resolved, "mid", t0, t1)
    sc = st.scale("mid")
    times = st.times()[t0:(st.T if t1 is None else t1)]
    return {
        "api_version": API_VERSION, "day": st.day, "book": st.book,
        "legs": [{"strike": k, "side": s, "qty": q} for (k, s, q) in _parse_legs(legs)],
        "t0": t0, "t1": st.T if t1 is None else t1,
        "time_ms": times,
        "spot": [st.spot(t) for t in range(t0, st.T if t1 is None else t1)],
        "mark": [None if m is None else m / sc for m in mark],   # price units, per share
        "leg_present": ok,
        "withheld": sum(1 for o in ok if not o),
        "units": "price per share; multiply by contract multiplier for dollars",
        "note": "withheld where any leg was absent — never interpolated (AT-ATRV-6)",
    }


@router.post("/api/me/quant/simulate")
def quant_simulate(request: Request, body: dict = Body(...)) -> Any:
    require_session(request)
    s = _settings()
    if not s["root"]:
        return _not_configured()
    try:
        day = str(body["day"]); book = str(body["book"])
        legs_raw = str(body["legs"])
        t_entry = int(body["t_entry"]); t_exit = int(body["t_exit"])
        paths = int(body.get("paths", 1000)); seed = int(body.get("seed", 1))
        latency = int(body.get("latency_snapshots", 1))
    except (KeyError, ValueError, TypeError) as exc:
        raise HTTPException(status_code=422, detail=f"BAD_BODY {exc}") from exc
    if not (1 <= paths <= MAX_PATHS):
        raise HTTPException(status_code=422, detail=f"paths must be 1..{MAX_PATHS}")
    if latency < 0:
        raise HTTPException(status_code=422, detail="latency_snapshots must be >= 0; 0 is `idealised`")
    st = _store(day, book)
    parsed = _parse_legs(legs_raw)
    resolved = _resolve(st, parsed)
    strategy_id = f"{book}:{day}:" + ",".join(f"{k:g}{sd}:{q:+d}" for k, sd, q in parsed)
    prm = Params(seed=seed, paths=paths, strategy_id=strategy_id,
                 p_fill=s["p_fill"], fee_per_contract=s["fee_per_contract"],
                 latency_snapshots=latency)
    try:
        out = simulate(st, [Leg(c, q) for c, q in resolved], t_entry, t_exit, prm, _exit_rule(body))
    except SimulateRefusal as exc:
        raise HTTPException(status_code=409, detail={"refusal": exc.code, "detail": exc.detail}) from exc
    out["api_version"] = API_VERSION
    out["day"], out["book"] = st.day, st.book
    out["legs"] = [{"strike": k, "side": sd, "qty": q} for k, sd, q in parsed]
    if latency == 0:
        out["assumptions"]["label"] = "idealised"   # §3.6: zero latency is superhuman
    out["provenance"] = {"store": st.meta.get("source_sha1"), "built_at": st.meta.get("built_at"),
                         "greeks_quantum_decimals": st.meta.get("greeks_quantum_decimals")}
    return out


@router.post("/api/me/quant/sweep")
def quant_sweep(request: Request, body: dict = Body(...)) -> Any:
    """Entry sweep: one structure, every entry in a window, one exit, fill MC each."""
    require_session(request)
    s = _settings()
    if not s["root"]:
        return _not_configured()
    try:
        day = str(body["day"]); book = str(body["book"]); legs_raw = str(body["legs"])
        t_from = int(body["t_from"]); t_to = int(body["t_to"]); t_exit = int(body["t_exit"])
        step = int(body.get("step", 30)); ppe = int(body.get("paths_per_entry", 100))
        seed = int(body.get("seed", 1)); latency = int(body.get("latency_snapshots", 1))
    except (KeyError, ValueError, TypeError) as exc:
        raise HTTPException(status_code=422, detail=f"BAD_BODY {exc}") from exc
    n_entries = max(0, (t_to - t_from) // max(step, 1) + 1)
    if n_entries * ppe > MAX_PATHS * 10:
        raise HTTPException(status_code=422, detail=f"TOO_LARGE {n_entries} entries x {ppe} paths")
    st = _store(day, book)
    parsed = _parse_legs(legs_raw); resolved = _resolve(st, parsed)
    strategy_id = f"{book}:{day}:" + ",".join(f"{k:g}{sd}:{q:+d}" for k, sd, q in parsed)
    prm = Params(seed=seed, paths=ppe, strategy_id=strategy_id, p_fill=s["p_fill"],
                 fee_per_contract=s["fee_per_contract"], latency_snapshots=latency)
    try:
        out = sweep_entries(st, [Leg(c, q) for c, q in resolved], t_from, t_to, t_exit, step, prm, ppe,
                            _exit_rule(body))
    except SimulateRefusal as exc:
        raise HTTPException(status_code=409, detail={"refusal": exc.code, "detail": exc.detail}) from exc
    out["api_version"] = API_VERSION; out["day"], out["book"] = st.day, st.book
    out["legs"] = [{"strike": k, "side": sd, "qty": q} for k, sd, q in parsed]
    return out
