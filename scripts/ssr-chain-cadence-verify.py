#!/usr/bin/env python3
"""Count gold chain snaps in a New York window. OD-6 first-hour proof.

  .venv/bin/python scripts/ssr-chain-cadence-verify.py \\
      --day 2026-08-17 --start 09:30 --end 10:30

Expected at 2–5s: one tick every 2–5s (720–1800 unique snap times / RTH hour).
Per-symbol files live under chain/{SYMBOL}/snap-*.json.
Friday 2026-08-14 at 5-min: ~12 files per hour.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date, datetime, time
from pathlib import Path
from zoneinfo import ZoneInfo

NY = ZoneInfo("America/New_York")


def parse_hhmm(raw: str) -> time:
    h, m = raw.split(":")
    return time(int(h), int(m))


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="OD-6 chain cadence verify")
    p.add_argument("--day", required=True)
    p.add_argument("--start", default="09:30")
    p.add_argument("--end", default="10:30")
    p.add_argument(
        "--root",
        default="/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture",
    )
    args = p.parse_args(argv)
    day = date.fromisoformat(args.day)
    start = datetime.combine(day, parse_hhmm(args.start), tzinfo=NY)
    end = datetime.combine(day, parse_hhmm(args.end), tzinfo=NY)
    chain = Path(args.root) / f"day={day.isoformat()}" / "chain"
    files = sorted(chain.glob("**/snap-*.json")) if chain.is_dir() else []
    in_window: list[Path] = []
    greeks_ok = 0
    cadence_labels: list[str] = []
    symbols: set[str] = set()
    for path in files:
        try:
            doc = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        raw = doc.get("captured_at") or ""
        try:
            ts = datetime.fromisoformat(raw)
        except ValueError:
            continue
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=NY)
        ts = ts.astimezone(NY)
        if start <= ts < end:
            in_window.append(path)
            sym = str(doc.get("symbol") or path.parent.name or "").upper()
            if sym:
                symbols.add(sym)
            if int(doc.get("greek_count") or 0) > 0:
                greeks_ok += 1
            elif isinstance(doc.get("generation"), dict):
                rows = doc["generation"].get("rows") or []
                if any(
                    isinstance(r, dict)
                    and all(r.get(k) is not None for k in ("delta", "gamma", "theta", "vega"))
                    for r in rows
                    if isinstance(r, dict)
                ):
                    greeks_ok += 1
            lab = doc.get("chain_cadence")
            if lab:
                cadence_labels.append(str(lab))
    ticks = {path.name for path in in_window}
    n = len(ticks)
    files_n = len(in_window)
    span_s = (end - start).total_seconds()
    expected_lo = int(span_s / 5.0)
    expected_hi = int(span_s / 2.0) + 2
    verdict = "PASS" if expected_lo <= n <= expected_hi + 30 else "FAIL"
    if n == 0:
        verdict = "MISSING"
    print(
        json.dumps(
            {
                "day": day.isoformat(),
                "window_et": f"{args.start}–{args.end}",
                "ticks_in_window": n,
                "files_in_window": files_n,
                "symbols": sorted(symbols),
                "greeks_present": greeks_ok,
                "expected_2_5s": f"{expected_lo}–{expected_hi}",
                "legacy_5min_would_be": int(span_s / 300.0),
                "cadence_labels": sorted(set(cadence_labels)),
                "verdict": verdict,
                "chain_dir": str(chain),
            },
            indent=2,
        )
    )
    return 0 if verdict == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
