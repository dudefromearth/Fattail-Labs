"""Session / developing histograms. No analysis objects."""

from __future__ import annotations

import hashlib
import json
from collections import defaultdict
from decimal import Decimal
from typing import Any, Iterable

from market_data.vp_engine.eligibility import print_eligible, size_int
from market_data.vp_engine.labels import assert_clean
from market_data.vp_engine.rows import row_price, row_step


def _in_gap(ts_ms: int, gaps: Iterable[dict[str, Any]]) -> bool:
    for g in gaps:
        lo = int(g.get("opened_ms") or g.get("t_ms") or 0)
        hi = int(g.get("closed_ms") or g.get("opened_ms") or 0)
        if hi < lo:
            hi = lo
        if lo <= ts_ms <= hi:
            return True
    return False


def parameter_hash(params: dict[str, Any]) -> str:
    blob = json.dumps(params, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(blob).hexdigest()[:16]


def build_histogram(
    prints: Iterable[dict[str, Any]],
    *,
    vp_row: float,
    gaps: Iterable[dict[str, Any]] | None = None,
    kind: str = "session",
    symbol: str = "SPY",
    session_date: str = "",
    q5_exclude_oddlots: bool = True,
) -> dict[str, Any]:
    if kind == "composite":
        raise ValueError("composite is fenced on VPS2 (session|developing only)")
    gap_list = list(gaps or [])
    vols: dict[float, int] = defaultdict(int)
    excluded = 0
    for rec in prints:
        ts = int(rec.get("t") or 0)
        if gap_list and _in_gap(ts, gap_list):
            excluded += size_int(rec)
            continue
        if not print_eligible(rec):
            excluded += size_int(rec)
            continue
        p = rec.get("p")
        if p is None:
            continue
        row = row_price(p, vp_row)
        vols[row] += size_int(rec)

    params = {
        "kind": kind,
        "symbol": symbol,
        "session_date": session_date,
        "vp_row": str(vp_row),
        "q5_exclude_oddlots": q5_exclude_oddlots,
        "q4": "ambiguous_excluded",
        "avg_price_excluded": True,
    }
    ph = parameter_hash(params)

    if not vols:
        payload = {
            "kind": kind,
            "symbol": symbol,
            "session_date": session_date,
            "vp_row": vp_row,
            "status": "UNAVAILABLE",
            "flags": {"mapping": "OK", "approximation": "none"},
            "gaps": gap_list,
            "bins": [],
            "total_volume": 0,
            "excluded_volume": excluded,
            "parameter_hash": ph,
            "generation_id": ph,
        }
        assert_clean(payload)
        return payload

    step = row_step(vp_row)
    lo = min(vols)
    hi = max(vols)
    bins = []
    x = Decimal(str(lo))
    end = Decimal(str(hi))
    while x <= end:
        px = float(x)
        bins.append({"price": px, "volume": int(vols.get(px, 0))})
        x += step

    status = "GAPPED" if gap_list else "COMPLETE"
    payload = {
        "kind": kind,
        "symbol": symbol,
        "session_date": session_date,
        "vp_row": vp_row,
        "status": status,
        "flags": {"mapping": "OK", "approximation": "none"},
        "gaps": gap_list,
        "bins": bins,
        "total_volume": sum(b["volume"] for b in bins),
        "excluded_volume": excluded,
        "parameter_hash": ph,
        "generation_id": ph,
    }
    assert_clean(payload)
    return payload


def canonical_bytes(payload: dict[str, Any]) -> bytes:
    return json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")


def bins_canonical_bytes(payload: dict[str, Any]) -> bytes:
    """Source-space bins only. Offset republish must not change this (F3 / v0.6.1)."""
    return json.dumps(payload.get("bins") or [], sort_keys=True, separators=(",", ":")).encode(
        "utf-8"
    )


def developing_maybe_republish(
    previous: dict[str, Any] | None, current: dict[str, Any]
) -> dict[str, Any]:
    """Volume-driven 15 s: no new eligible volume ⇒ keep prior bytes."""
    if previous is None:
        return current
    if previous.get("bins") == current.get("bins") and previous.get(
        "total_volume"
    ) == current.get("total_volume"):
        return previous
    return current


def bar_proxy_row(
    *,
    volume: int,
    vwap: float | None,
    close: float,
    vp_row: float,
) -> dict[str, Any]:
    """AT-VPS-13: bar volume on vendor-VWAP row else close. Never high–low smear."""
    if vwap is not None:
        row = row_price(vwap, vp_row)
        flag = "bar_vwap"
    else:
        row = row_price(close, vp_row)
        flag = "bar_close"
    payload = {
        "kind": "bar_proxy",
        "symbol": "SPY",
        "session_date": "",
        "vp_row": vp_row,
        "status": "COMPLETE",
        "flags": {"mapping": "OK", "approximation": flag},
        "gaps": [],
        "bins": [{"price": row, "volume": int(volume)}],
        "total_volume": int(volume),
        "excluded_volume": 0,
        "parameter_hash": parameter_hash({"approx": flag, "vp_row": str(vp_row)}),
        "generation_id": "",
    }
    payload["generation_id"] = payload["parameter_hash"]
    assert_clean(payload)
    return payload
