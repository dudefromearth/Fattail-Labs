"""D6 back-adjusted continuous futures series.

Derived view. Per-contract prints remain the SoR. Versioned parameters;
a rebuild is byte-identical. SPY is not adjusted.
"""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Any

from market_data.vp_engine.coverage import load_coverage
from market_data.vp_engine.histogram import parameter_hash
from market_data.vp_ingest.lead_contract import select_lead_contract, volume_leader

METHOD = "back-adjust"
VERSION = "back-adjust-v1"
FUTURES = frozenset({"ES", "MES"})
TICK = {"ES": 0.25, "MES": 0.25}


def rolls_path(root: Path, source: str) -> Path:
    return root / "vp" / "engine" / source.upper() / "continuous" / VERSION / "rolls.json"


def last_price(prints: list[dict[str, Any]], contract: str) -> float | None:
    last: float | None = None
    for rec in prints:
        if str(rec.get("contract") or "").upper() != contract:
            continue
        try:
            last = float(rec.get("p") if rec.get("p") is not None else rec.get("price"))
        except (TypeError, ValueError):
            continue
    return last


def snap_gap(gap: float, tick: float) -> float:
    if tick <= 0:
        return gap
    return round(gap / tick) * tick


def session_lead(
    prints: list[dict[str, Any]],
    *,
    product: str,
    session: date,
    contracts: list[dict[str, Any]] | None = None,
) -> tuple[str | None, str]:
    lead, rule = select_lead_contract(
        prints, product=product, contracts=contracts, as_of=session
    )
    if lead:
        return lead, rule
    return volume_leader(prints), "volume_only"


def build_roll_table(
    root: Path,
    source: str,
    *,
    load_prints,
    contracts: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Newest era is the true frame. Older eras += sum of later roll gaps."""
    src = source.upper()
    days = load_coverage(root).get(src, {}).get("sessions_binned") or []
    sessions = sorted(date.fromisoformat(x) for x in days)
    leads: list[tuple[date, str, str, list[dict[str, Any]]]] = []
    for d in sessions:
        prints = load_prints(root, src, d)
        lead, rule = session_lead(prints, product=src, session=d, contracts=contracts)
        if lead:
            leads.append((d, lead, rule, prints))
    rolls: list[dict[str, Any]] = []
    adjust: dict[str, float] = {d.isoformat(): 0.0 for d, *_ in leads}
    tick = TICK.get(src, 0.25)
    # Walk newest → oldest. When lead changes, gap on the newer session.
    for i in range(len(leads) - 1, 0, -1):
        d_new, lead_new, rule_new, prints_new = leads[i]
        d_old, lead_old, rule_old, prints_old = leads[i - 1]
        if lead_new == lead_old:
            adjust[d_old.isoformat()] = adjust[d_new.isoformat()]
            continue
        px_new = last_price(prints_new, lead_new)
        px_old = last_price(prints_new, lead_old)
        if px_old is None:
            px_old = last_price(prints_old, lead_old)
        if px_new is None or px_old is None:
            gap = 0.0
        else:
            gap = snap_gap(px_new - px_old, tick)
        rolls.append(
            {
                "session": d_new.isoformat(),
                "from": lead_old,
                "to": lead_new,
                "gap": gap,
                "rule": rule_new,
            }
        )
        adjust[d_old.isoformat()] = adjust[d_new.isoformat()] + gap
        # older sessions already visited keep adding as we go further back —
        # fill any still-zero older than d_old in a second pass
    # Propagate: each session inherits the next-newer session's adjust plus its own roll
    # The loop already set each older session from its immediate newer neighbor.
    # Sessions before the first lead still 0 if missing from leads.
    cadj: dict[str, float] = {}
    if rolls:
        cadj[str(rolls[0]["to"])] = 0.0
        for r in rolls:
            cadj[str(r["from"])] = cadj.get(str(r["to"]), 0.0) + float(r["gap"])
    params = {
        "version": VERSION,
        "method": METHOD,
        "source": src,
        "tick": tick,
        "rolls": [(r["session"], r["from"], r["to"], r["gap"]) for r in rolls],
    }
    doc = {
        "version": VERSION,
        "method": METHOD,
        "source": src,
        "parameter_hash": parameter_hash(params),
        "rolls": rolls,
        "adjust": adjust,
        "contract_adjust": cadj,
    }
    path = rolls_path(root, src)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(doc, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return doc


def load_roll_table(root: Path, source: str) -> dict[str, Any] | None:
    path = rolls_path(root, source)
    if not path.is_file():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def adjust_for(root: Path, source: str, session: date | str) -> float:
    src = source.upper()
    if src not in FUTURES:
        return 0.0
    doc = load_roll_table(root, src)
    if not doc:
        return 0.0
    iso = session if isinstance(session, str) else session.isoformat()
    try:
        return float((doc.get("adjust") or {}).get(iso) or 0.0)
    except (TypeError, ValueError):
        return 0.0


def continuous_histogram_path(root: Path, source: str, session_date: date) -> Path:
    return (
        root
        / "vp"
        / "engine"
        / source.upper()
        / "continuous"
        / VERSION
        / "session"
        / f"day={session_date.isoformat()}"
        / "histogram.json"
    )


def adjust_print_price(rec: dict[str, Any], cadj: dict[str, float], session_delta: float) -> float | None:
    try:
        px = float(rec.get("p") if rec.get("p") is not None else rec.get("price"))
    except (TypeError, ValueError):
        return None
    contract = str(rec.get("contract") or "").upper()
    if contract and contract in cadj:
        return px + cadj[contract]
    return px + session_delta


def shift_bins(bins: list[dict[str, Any]], delta: float) -> list[dict[str, Any]]:
    if not delta:
        return list(bins)
    out = []
    for bn in bins:
        item = dict(bn)
        item["price"] = float(bn["price"]) + delta
        out.append(item)
    return out


def shift_bars(bars: list[dict[str, Any]], delta: float) -> list[dict[str, Any]]:
    if not delta:
        return list(bars)
    out = []
    for b in bars:
        item = dict(b)
        for k in ("o", "h", "l", "c"):
            if k in item and item[k] is not None:
                item[k] = float(item[k]) + delta
        out.append(item)
    return out


def provenance(root: Path, source: str) -> dict[str, Any] | None:
    src = source.upper()
    if src not in FUTURES:
        return None
    doc = load_roll_table(root, src)
    if not doc:
        return {
            "adjusted": True,
            "method": METHOD,
            "rolls": 0,
            "version": VERSION,
        }
    return {
        "adjusted": True,
        "method": METHOD,
        "rolls": len(doc.get("rolls") or []),
        "version": VERSION,
        "parameter_hash": doc.get("parameter_hash"),
    }
