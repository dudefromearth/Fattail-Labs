"""SOURCE-space OHLC aggregation. Lead-contract filtered. No SA imports."""

from __future__ import annotations

from datetime import date
from typing import Any

from market_data.vp_ingest.lead_contract import select_lead_contract, volume_leader
from market_data.vp_ingest.store import vendor_ts_to_seconds

TF_SECONDS = {"1m": 60, "5m": 300, "15m": 900, "1h": 3600, "1d": 86400}


def bar_invariant(bar: dict[str, Any]) -> bool:
    try:
        o = float(bar["o"])
        h = float(bar["h"])
        l = float(bar["l"])
        c = float(bar["c"])
    except (KeyError, TypeError, ValueError):
        return False
    return l <= min(o, c) <= max(o, c) <= h


def dominant_contract(rows: list[dict[str, Any]]) -> str | None:
    return volume_leader(rows)


def bars_from_prints(
    rows: list[dict[str, Any]],
    *,
    tf: str = "5m",
    product: str | None = None,
    contracts: list[dict[str, Any]] | None = None,
    as_of: date | None = None,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], str | None, str]:
    contract, lead_rule = select_lead_contract(
        rows, product=product, contracts=contracts, as_of=as_of
    )
    if contract:
        rows = [
            r
            for r in rows
            if str(r.get("contract") or "").strip().upper() == contract
        ]
    step = TF_SECONDS.get(tf, 300)
    buckets: dict[int, dict[str, Any]] = {}
    for rec in rows:
        try:
            px = float(rec.get("p") if rec.get("p") is not None else rec.get("price"))
            ts = vendor_ts_to_seconds(rec.get("t") or 0)
        except (TypeError, ValueError):
            continue
        if px <= 0 or ts <= 0:
            continue
        bucket = int(ts // step) * step
        vol = rec.get("s") if rec.get("s") is not None else rec.get("size") or 0
        try:
            vol_n = float(vol)
        except (TypeError, ValueError):
            vol_n = 0
        bar = buckets.get(bucket)
        if bar is None:
            buckets[bucket] = {
                "t": bucket * 1000,
                "o": px,
                "h": px,
                "l": px,
                "c": px,
                "v": vol_n,
            }
        else:
            bar["h"] = max(bar["h"], px)
            bar["l"] = min(bar["l"], px)
            bar["c"] = px
            bar["v"] = (bar.get("v") or 0) + vol_n
    honest: list[dict[str, Any]] = []
    gaps: list[dict[str, Any]] = []
    for k in sorted(buckets):
        bar = buckets[k]
        if bar_invariant(bar):
            honest.append(bar)
        else:
            gaps.append({"t": bar["t"], "reason": "invariant"})
    return honest, gaps, contract, lead_rule
