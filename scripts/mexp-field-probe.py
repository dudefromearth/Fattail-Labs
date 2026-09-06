#!/usr/bin/env python3
"""SSR-MEXP field probe — what does the archive ACTUALLY carry?

Answers AT-MEXP-16 / 17 / 20 and, downstream, ATRV AT-ATRV-29 and AZ-ALGO E50.
Those three specs now assert as LAW that the era-1 write path discarded depth
(`bid_size` / `ask_size`), quote age (`sip_timestamp`) and the intraperiod
bound (`day.high` / `day.low`). That assertion was inferred from source, not
from a file. If it is wrong, the specs are wrong in the expensive direction:
era-1 could train a fill model, and after-tax answers would not need era-2.

Read-only. Opens nothing for writing, needs no stamp, no BUILD AUTHORITY.
Prints STRUCTURE ONLY -- key names, types, presence counts. No market values,
no prices, no sizes. Safe to paste into a gate report.

    python3 scripts/mexp-field-probe.py --root /Volumes/.../ssr/live_capture
    python3 scripts/mexp-field-probe.py --root ... --days 3 --json probe.json

Stdlib only.
"""

from __future__ import annotations

import argparse
import datetime
import json
import sys
from pathlib import Path


def weekend(day_name: str) -> bool:
    try:
        return datetime.date.fromisoformat(day_name.split('=', 1)[1]).weekday() >= 5
    except Exception:
        return False

# The fields the three specs claim are absent. Each maps to what it would
# unblock if present.
CLAIMED_ABSENT = {
    "bid_size":      "fill-probability model (ATRV 3.7) -- queue position",
    "ask_size":      "fill-probability model (ATRV 3.7) -- queue position",
    "sip_timestamp": "quote staleness (ATRV 3.6 gap 2)",
    "last_trade":    "intraperiod bound (ATRV 3.6 gap 1)",
    "day":           "intraperiod bound -- day.high / day.low (ATRV 3.6 gap 1)",
    "expiration":    "multi-expiration era-2 marker (SSR-MEXP 7/8)",
}

GREEKS = ("delta", "gamma", "theta", "vega", "iv")


def snaps_for(day: Path) -> list[Path]:
    chain = day / "chain"
    if not chain.is_dir():
        return []
    out = sorted(chain.glob("snap-*.json"))
    for sym in sorted(p for p in chain.iterdir() if p.is_dir()):
        out.extend(sorted(sym.glob("snap-*.json")))
    return out


def shape(v) -> str:
    if isinstance(v, dict):
        return f"dict[{len(v)}]"
    if isinstance(v, list):
        return f"list[{len(v)}]"
    return type(v).__name__


def probe_day(day: Path, sample: int) -> dict:
    files = snaps_for(day)
    if not files:
        return {"day": day.name, "skipped": "no snapshots"}

    # sample evenly across the session -- open, mid and close can differ
    idx = sorted({0, len(files) // 2, len(files) - 1} |
                 {i * len(files) // sample for i in range(sample)})
    idx = [i for i in idx if 0 <= i < len(files)]

    top_keys: dict[str, str] = {}
    row_keys: dict[str, str] = {}
    present = {k: 0 for k in CLAIMED_ABSENT}
    greeks_present = {g: 0 for g in GREEKS}
    rows_seen = 0
    parsed = 0

    for i in idx:
        try:
            doc = json.loads(files[i].read_bytes())
        except Exception:
            continue
        parsed += 1
        for k, v in doc.items():
            top_keys.setdefault(k, shape(v))

        gen = doc.get("generation")
        gen = gen if isinstance(gen, dict) else doc
        for k, v in gen.items():
            top_keys.setdefault(f"generation.{k}", shape(v))
        for k in CLAIMED_ABSENT:
            if k in gen:
                present[k] += 1

        rows = gen.get("rows") or []
        for r in rows[:200]:
            if not isinstance(r, dict):
                continue
            rows_seen += 1
            for k, v in r.items():
                row_keys.setdefault(k, shape(v))
            for k in CLAIMED_ABSENT:
                if k in r and r[k] is not None:
                    present[k] += 1
            for g in GREEKS:
                if r.get(g) is not None:
                    greeks_present[g] += 1

    return {"day": day.name, "snapshots": len(files), "sampled": len(idx),
            "parsed": parsed, "rows_inspected": rows_seen,
            "top_level_keys": top_keys, "row_keys": row_keys,
            "claimed_absent_found": {k: v for k, v in present.items() if v},
            "greeks_found": {g: c for g, c in greeks_present.items() if c}}


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root", required=True)
    ap.add_argument("--days", type=int, default=3, help="most recent N days")
    ap.add_argument("--sample", type=int, default=5, help="snapshots per day")
    ap.add_argument("--json", help="write full results here")
    a = ap.parse_args()

    root = Path(a.root).expanduser()
    days = sorted(p for p in root.glob("day=*") if p.is_dir())[-a.days:]
    if not days:
        sys.exit(f"!! no day=* folders under {root}")

    print(f"corpus : {root}")
    print(f"days   : {len(days)}  ({days[0].name} … {days[-1].name})\n")

    out = {"root": str(root), "results": []}
    verdicts: dict[str, bool] = {k: False for k in CLAIMED_ABSENT}

    for d in days:
        r = probe_day(d, a.sample)
        out["results"].append(r)
        if "skipped" in r:
            why = ("Saturday/Sunday — no session, empty is CORRECT"
                   if weekend(r["day"]) else "!! WEEKDAY — check capture")
            print(f"{r['day']}: {r['skipped']}  ({why})")
            continue
        print(f"{r['day']}  {r['snapshots']:,} snapshots · sampled {r['sampled']}"
              f" · {r['rows_inspected']:,} rows")
        print(f"  row keys ({len(r['row_keys'])}): "
              f"{', '.join(sorted(r['row_keys']))}")
        print(f"  greeks  : {sorted(r['greeks_found']) or 'NONE'}")
        if r["claimed_absent_found"]:
            print(f"  !! FOUND (specs say absent): "
                  f"{sorted(r['claimed_absent_found'])}")
        for k in r["claimed_absent_found"]:
            verdicts[k] = True
        print()

    print("=" * 68)
    print("VERDICT -- three specs assert these are absent from the archive:\n")
    wrong = []
    for k, unblocks in CLAIMED_ABSENT.items():
        if verdicts[k]:
            print(f"  {k:<14} PRESENT  ** spec is wrong **  → unblocks {unblocks}")
            wrong.append(k)
        else:
            print(f"  {k:<14} absent   (confirms SSR-MEXP §3.1 / ATRV §3.6)")
    print()
    if wrong:
        print(f"  {len(wrong)} field(s) contradict the specs. AMEND, do not build:")
        print("    SSR-MEXP §1.10 / §3.1 · ATRV §3.6 + AT-ATRV-29 · AZ-ALGO E50")
        print("    Era-1 may be able to answer after-tax §14 after all.")
    else:
        print("  Confirmed. Era-1 is `era1_no_depth`; after-tax §14 waits on era-2.")
    print("=" * 68)

    out["verdicts"] = verdicts
    if a.json:
        Path(a.json).write_text(json.dumps(out, indent=2) + "\n")
        print(f"\nwrote {a.json}")


if __name__ == "__main__":
    main()
