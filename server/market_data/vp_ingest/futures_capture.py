"""ES/MES trades on one futures WS. Replay-friendly. Not the stocks collector.

Timestamps stored raw (UTC ns or whatever the frame carries). Session key =
vendor session_end_date. No local-clock session identity.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Iterable

from market_data.vp_ingest.futures_contracts import PRODUCTS, product_of_ticker
from market_data.vp_ingest.futures_schedules import halt_is_scheduled, session_is_open
from market_data.vp_ingest.store import (
    GAP_MIN_SECONDS,
    append_gap,
    append_print,
    vendor_ts_to_seconds,
)


def parse_futures_trade(ev: dict[str, Any], *, allowed: set[str]) -> dict[str, Any] | None:
    if (ev.get("ev") or "") != "T":
        return None
    contract = str(ev.get("sym") or ev.get("ticker") or "").upper()
    if not contract or contract not in allowed:
        return None
    product = product_of_ticker(contract)
    if product not in PRODUCTS:
        return None
    ts = ev.get("t") if ev.get("t") is not None else ev.get("timestamp")
    sed = ev.get("session_end_date")
    # Vendor session_end_date only — caller may stamp from market-status, never local clock.
    cond = ev.get("c")
    rec: dict[str, Any] = {
        "sym": product,
        "contract": contract,
        "p": ev.get("p") if ev.get("p") is not None else ev.get("price"),
        "s": ev.get("s") if ev.get("s") is not None else ev.get("size"),
        "t": ts,  # raw UTC ns (or vendor unit) — no conversion
    }
    if sed:
        rec["session_end_date"] = str(sed)[:10]
    if "x" in ev:
        rec["x"] = ev.get("x")
    if "z" in ev:
        rec["z"] = ev.get("z")
    if "q" in ev:
        rec["q"] = ev.get("q")
    if cond is not None:
        rec["c"] = cond if isinstance(cond, list) else [cond]
    return rec


def ingest_futures_frame(
    raw: str | bytes,
    *,
    root: Path,
    allowed: set[str],
    last_print_ns: dict[str, int],
    open_gap: dict[str, dict[str, Any] | None],
    default_session_end_date: str | None = None,
) -> int:
    if isinstance(raw, bytes):
        raw = raw.decode("utf-8")
    data = json.loads(raw)
    events = data if isinstance(data, list) else [data]
    n = 0
    for ev in events:
        if not isinstance(ev, dict) or ev.get("ev") == "status":
            continue
        rec = parse_futures_trade(ev, allowed=allowed)
        if rec is None:
            continue
        if not rec.get("session_end_date"):
            if not default_session_end_date:
                continue
            rec["session_end_date"] = str(default_session_end_date)[:10]
        append_print(root, rec)
        product = rec["sym"]
        t = int(rec["t"] or 0)
        last_print_ns[product] = t
        g = open_gap.get(product)
        if g is not None:
            g["closed_t"] = t
            g["reason_close"] = "print"
            append_gap(root, product, g)
            open_gap[product] = None
        n += 1
    return n


def record_disconnect(
    root: Path,
    products: tuple[str, ...],
    open_gap: dict[str, dict[str, Any] | None],
    now_t: int,
    *,
    session_open: dict[str, bool],
    scheduled_halt: dict[str, bool],
) -> None:
    for product in products:
        if scheduled_halt.get(product):
            continue
        if not session_open.get(product):
            continue
        if open_gap.get(product) is not None:
            continue
        g = {"kind": "feed_liveness", "opened_t": now_t, "t": now_t}
        open_gap[product] = g
        append_gap(root, product, {**g, "state": "open"})


def maybe_absence(
    root: Path,
    products: tuple[str, ...],
    last_print_ns: dict[str, int],
    open_gap: dict[str, dict[str, Any] | None],
    now_t: int,
    *,
    session_open: dict[str, bool],
    scheduled_halt: dict[str, bool],
    gap_min_s: int = GAP_MIN_SECONDS,
) -> None:
    for product in products:
        if scheduled_halt.get(product):
            continue
        if not session_open.get(product):
            continue
        if open_gap.get(product) is not None:
            continue
        last = last_print_ns.get(product) or 0
        if last <= 0:
            continue
        # Compare in seconds. Do not assume now_t and last share a unit
        # (wall ns vs vendor ms is the live defect).
        silence = vendor_ts_to_seconds(now_t) - vendor_ts_to_seconds(last)
        if silence < gap_min_s:
            continue
        g = {
            "kind": "print_absence",
            "opened_t": last,
            "t": now_t,
            "gap_min_seconds": gap_min_s,
            "silence_s": round(silence, 3),
        }
        open_gap[product] = g
        append_gap(root, product, {**g, "state": "open"})


def replay_tape(
    frames: Iterable[str],
    root: Path,
    allowed: set[str],
) -> int:
    last: dict[str, int] = {}
    gap: dict[str, dict[str, Any] | None] = {}
    n = 0
    for frame in frames:
        n += ingest_futures_frame(
            frame, root=root, allowed=allowed, last_print_ns=last, open_gap=gap
        )
    return n


def regenerate_print_absence(
    root: Path,
    product: str,
    day,
    *,
    gap_min_s: int = GAP_MIN_SECONDS,
    now_t: int | None = None,
    session_open: bool = True,
) -> dict[str, int]:
    """Rebuild print_absence rows from raw prints. Keep feed_liveness / DISK_GUARD.

    Law: one gap opens after ≥ gap_min_s of print silence, closes at the
    next print. Raw prints are the SoR.
    """
    import gzip
    import json
    from datetime import date as date_cls

    from market_data.vp_ingest.store import gaps_path, prints_path

    if not isinstance(day, date_cls):
        day = date_cls.fromisoformat(str(day)[:10])
    ppath = prints_path(root, product, day)
    gpath = gaps_path(root, product, day)
    prints: list[dict[str, Any]] = []
    if ppath.exists():
        with gzip.open(ppath, "rt", encoding="utf-8") as fh:
            for line in fh:
                if line.strip():
                    prints.append(json.loads(line))
    prints.sort(key=lambda r: vendor_ts_to_seconds(int(r.get("t") or 0)))

    kept: list[dict[str, Any]] = []
    if gpath.exists():
        for line in gpath.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            rec = json.loads(line)
            if rec.get("kind") == "print_absence":
                continue
            kept.append(rec)

    new_abs = 0
    for a, b in zip(prints, prints[1:]):
        ta = int(a.get("t") or 0)
        tb = int(b.get("t") or 0)
        silence = vendor_ts_to_seconds(tb) - vendor_ts_to_seconds(ta)
        if silence < gap_min_s:
            continue
        from datetime import datetime, timezone
        from zoneinfo import ZoneInfo
        from market_data.vp_ingest.futures_schedules import cme_equity_index_halt_now

        mid = vendor_ts_to_seconds(ta) + silence / 2
        mid_dt = datetime.fromtimestamp(mid, tz=timezone.utc)
        if cme_equity_index_halt_now(mid_dt):
            continue
        kept.append(
            {
                "kind": "print_absence",
                "opened_t": ta,
                "t": tb,
                "closed_t": tb,
                "reason_close": "print",
                "gap_min_seconds": gap_min_s,
                "silence_s": round(silence, 3),
                "symbol": product.upper(),
                "regenerated": True,
            }
        )
        new_abs += 1
    if session_open and prints and now_t is not None:
        last = int(prints[-1].get("t") or 0)
        silence = vendor_ts_to_seconds(now_t) - vendor_ts_to_seconds(last)
        if silence >= gap_min_s:
            kept.append(
                {
                    "kind": "print_absence",
                    "opened_t": last,
                    "t": now_t,
                    "gap_min_seconds": gap_min_s,
                    "silence_s": round(silence, 3),
                    "state": "open",
                    "symbol": product.upper(),
                    "regenerated": True,
                }
            )
            new_abs += 1

    gpath.parent.mkdir(parents=True, exist_ok=True)
    tmp = gpath.with_suffix(".jsonl.tmp")
    with tmp.open("w", encoding="utf-8") as fh:
        for rec in kept:
            fh.write(json.dumps(rec, separators=(",", ":")) + "\n")
    tmp.replace(gpath)
    return {
        "kept_other": sum(1 for r in kept if r.get("kind") != "print_absence"),
        "print_absence": new_abs,
        "prints": len(prints),
    }


def gap_context(
    status: dict[str, Any] | None,
    schedule: dict[str, Any] | None,
    products: tuple[str, ...] = PRODUCTS,
) -> tuple[dict[str, bool], dict[str, bool]]:
    from market_data.vp_ingest.futures_schedules import halt_is_scheduled, session_is_open

    halt = {p: halt_is_scheduled(schedule) for p in products}
    opened = {p: session_is_open(status, product=p) and not halt[p] for p in products}
    return opened, halt
