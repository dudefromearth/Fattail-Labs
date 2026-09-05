#!/usr/bin/env python3
"""ATRV track-A traversal benchmark — era-1 corpus, read-only.

Answers the question ATRV's design turns on: when traversing the archive, is the
cost dominated by FILE OPEN, by JSON PARSE, or by DISK I/O? The mitigation is
completely different in each case (ATRV §13.1), so elapsed time alone is not an
actionable result.

Read-only. Opens nothing for writing, needs no stamp, no BUILD AUTHORITY.

    python3 scripts/atrv-bench.py --root /Volumes/FatTail2TB/fattail-market-data/ssr/live_capture
    python3 scripts/atrv-bench.py --root ... --days 5 --json bench.json

Stdlib only — runs on StudioOne with no environment setup.
"""

from __future__ import annotations

import argparse
import json
import os
import statistics
import sys
import time
from pathlib import Path

# --------------------------------------------------------------------------- util

def _ns() -> int:
    return time.perf_counter_ns()


class Split:
    """Accumulates where the time actually went."""

    def __init__(self) -> None:
        self.parts: dict[str, int] = {}

    def add(self, name: str, ns: int) -> None:
        self.parts[name] = self.parts.get(name, 0) + ns

    @property
    def total(self) -> int:
        return sum(self.parts.values())

    def report(self) -> dict[str, float]:
        t = self.total or 1
        return {k: round(100.0 * v / t, 1) for k, v in sorted(
            self.parts.items(), key=lambda kv: -kv[1])}


def human(n: float, unit: str = "B") -> str:
    for suf in ("", "K", "M", "G"):
        if abs(n) < 1024:
            return f"{n:.1f}{suf}{unit}"
        n /= 1024
    return f"{n:.1f}T{unit}"


def drop_caches_hint() -> str:
    if sys.platform == "darwin":
        return "sudo purge"
    return "sync && echo 3 | sudo tee /proc/sys/vm/drop_caches"


# --------------------------------------------------------------------------- discovery

def find_days(root: Path, limit: int | None) -> list[Path]:
    days = sorted(p for p in root.glob("day=*") if p.is_dir())
    if limit:
        days = days[-limit:]
    return days


def snaps_for(day: Path) -> list[Path]:
    """Era-1 layouts: day=D/chain/<SYM>/snap-*.json, or flat day=D/chain/snap-*.json."""
    out: list[Path] = []
    chain = day / "chain"
    if not chain.is_dir():
        return out
    out.extend(sorted(chain.glob("snap-*.json")))            # flat (2026-08-14)
    for sym in sorted(p for p in chain.iterdir() if p.is_dir()):
        out.extend(sorted(sym.glob("snap-*.json")))
    return out


# --------------------------------------------------------------------------- passes

def pass_index_only(day: Path) -> dict:
    """Pass 1 — the Read API's claim: index WITHOUT opening envelopes.

    Only stat(). If this is slow, file count is the constraint and packing is the
    answer (ATRV §13.1).
    """
    sp = Split()
    t0 = _ns()
    files = snaps_for(day)
    sp.add("listdir", _ns() - t0)

    total = 0
    t0 = _ns()
    for f in files:
        total += f.stat().st_size
    sp.add("stat", _ns() - t0)

    return {"pass": "index_only", "files": len(files), "bytes": total,
            "ns": sp.total, "split_pct": sp.report()}


def pass_full_scan(day: Path, field: str = "mid") -> dict:
    """Pass 2 — §1.8's mark-once pass: open, read, parse, extract one field.

    The split across open/read/parse/extract IS the finding.
    """
    sp = Split()
    files = snaps_for(day)
    nbytes = 0
    rows_seen = 0
    parse_fail = 0

    for f in files:
        t = _ns(); fh = open(f, "rb"); sp.add("open", _ns() - t)
        t = _ns(); raw = fh.read(); fh.close(); sp.add("read", _ns() - t)
        nbytes += len(raw)

        t = _ns()
        try:
            doc = json.loads(raw)
        except Exception:
            parse_fail += 1
            sp.add("parse", _ns() - t)
            continue
        sp.add("parse", _ns() - t)

        t = _ns()
        gen = doc.get("generation") or {}
        rows = gen.get("rows") or []
        for r in rows:
            if isinstance(r, dict) and r.get(field) is not None:
                rows_seen += 1
        sp.add("extract", _ns() - t)

    return {"pass": "full_scan", "files": len(files), "bytes": nbytes,
            "rows_with_field": rows_seen, "parse_failures": parse_fail,
            "ns": sp.total, "split_pct": sp.report()}


def pass_one_contract(day: Path, field: str = "mid") -> dict:
    """Pass 3 — the transpose cost (ATRV §1): one contract's series.

    Reads every file and keeps ~1/C of each. This is the number that justifies a
    derived contract-major store, so it is measured rather than asserted.
    """
    files = snaps_for(day)
    if not files:
        return {"pass": "one_contract", "skipped": "no files"}

    # pick a strike near the middle of the first snapshot
    target = None
    try:
        doc = json.loads(files[0].read_bytes())
        rows = (doc.get("generation") or {}).get("rows") or []
        strikes = sorted({r.get("strike") for r in rows if isinstance(r, dict)
                          and r.get("strike") is not None})
        if strikes:
            target = strikes[len(strikes) // 2]
    except Exception:
        pass
    if target is None:
        return {"pass": "one_contract", "skipped": "no strike found"}

    t0 = _ns()
    nbytes = 0
    series = []
    for f in files:
        raw = f.read_bytes()
        nbytes += len(raw)
        try:
            doc = json.loads(raw)
        except Exception:
            continue
        for r in (doc.get("generation") or {}).get("rows") or []:
            if isinstance(r, dict) and r.get("strike") == target:
                series.append(r.get(field))
                break
    ns = _ns() - t0

    wanted = len(series) * 8
    return {"pass": "one_contract", "strike": target, "files": len(files),
            "bytes_touched": nbytes, "bytes_wanted": wanted,
            "waste_ratio": round(nbytes / max(wanted, 1), 1),
            "points": len(series), "ns": ns}


# --------------------------------------------------------------------------- main

def run(root: Path, ndays: int, field: str) -> dict:
    days = find_days(root, ndays)
    if not days:
        sys.exit(f"!! no day=* folders under {root}")

    print(f"corpus : {root}")
    print(f"days   : {len(days)}  ({days[0].name} … {days[-1].name})")
    print(f"field  : {field}")
    print(f"\nnote: run once cold ({drop_caches_hint()}), once warm.\n")

    out: dict = {"root": str(root), "days": [d.name for d in days],
                 "field": field, "results": []}

    for d in days:
        row: dict = {"day": d.name}
        for fn in (pass_index_only, pass_full_scan, pass_one_contract):
            r = fn(d, field) if fn is not pass_index_only else fn(d)
            row[r["pass"]] = r
        out["results"].append(row)

        idx, scan = row["index_only"], row["full_scan"]
        one = row["one_contract"]
        print(f"{d.name}")
        print(f"  index-only : {idx['files']:>6,} files  {idx['ns']/1e6:>8.1f} ms"
              f"   {human(idx['bytes'])}")
        print(f"  full scan  : {scan['ns']/1e6:>8.1f} ms   {human(scan['bytes'])}"
              f"   split {scan['split_pct']}")
        if "waste_ratio" in one:
            print(f"  1 contract : {one['ns']/1e6:>8.1f} ms   touched"
                  f" {human(one['bytes_touched'])} to want"
                  f" {human(one['bytes_wanted'])}"
                  f"  → {one['waste_ratio']:,}x waste")
        print()

    # ---- the finding
    tot: dict[str, float] = {}
    for row in out["results"]:
        for k, v in row["full_scan"]["split_pct"].items():
            tot[k] = tot.get(k, 0) + v
    if tot:
        n = len(out["results"])
        avg = {k: round(v / n, 1) for k, v in sorted(tot.items(), key=lambda kv: -kv[1])}
        out["dominance"] = avg
        top = next(iter(avg))
        print("=" * 62)
        print(f"DOMINANCE (full-scan, mean across days): {avg}")
        print(f"\n  '{top}' dominates → per ATRV §13.1 the mitigation is:")
        print({
            "parse":   "  derived columnar layer built once/day; archive stays verbatim",
            "open":    "  pack snapshots per book per interval — a LAYOUT change",
            "read":    "  compression at rest",
            "extract": "  cache the per-structure mark series (§1.8)",
            "stat":    "  file count is the constraint — packing, not compression",
            "listdir": "  directory fan-out — shard by hour or pack",
        }.get(top, "  unclassified — report to Juliet"))
        print("=" * 62)

    scans = [r["full_scan"]["ns"] / 1e6 for r in out["results"]]
    if len(scans) > 1:
        out["scan_ms"] = {"median": round(statistics.median(scans), 1),
                          "min": round(min(scans), 1), "max": round(max(scans), 1)}
        print(f"\nfull-scan ms/day: median {out['scan_ms']['median']}"
              f"  min {out['scan_ms']['min']}  max {out['scan_ms']['max']}")
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root", required=True, help="live_capture root")
    ap.add_argument("--days", type=int, default=5, help="most recent N days (default 5)")
    ap.add_argument("--field", default="mid", help="field to extract (default mid)")
    ap.add_argument("--json", help="write full results here")
    a = ap.parse_args()

    res = run(Path(a.root).expanduser(), a.days, a.field)
    if a.json:
        Path(a.json).write_text(json.dumps(res, indent=2) + "\n")
        print(f"\nwrote {a.json}")


if __name__ == "__main__":
    main()
