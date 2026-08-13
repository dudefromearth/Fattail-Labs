#!/usr/bin/env python3
"""P2-8: spot-check entitled quotes / 1s depth vs trades (SPY)."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date
from pathlib import Path

_SERVER = Path(__file__).resolve().parents[1]
if str(_SERVER) not in sys.path:
    sys.path.insert(0, str(_SERVER))

from market_data.raw_store import open_day  # noqa: E402


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--symbol", default="SPY")
    p.add_argument("--day", required=True)
    args = p.parse_args()
    day = date.fromisoformat(args.day[:10])
    sym = args.symbol.upper()
    out = {k: open_day(sym, k, day) for k in ("trades", "quotes", "aggs_1s")}
    print(json.dumps(out, indent=2, default=str))
    ev = Path(__file__).resolve().parents[2] / "docs" / "evidence" / "volume-profile"
    ev.mkdir(parents=True, exist_ok=True)
    lines = [
        f"# P2-8 {sym} quotes/1s depth ({day.isoformat()})\n",
        "| Kind | exists | complete | rows | bytes |",
        "|------|--------|----------|------|-------|",
    ]
    for k, v in out.items():
        lines.append(
            f"| {k} | {v['exists']} | {v['complete']} | {v.get('rows')} | {v.get('bytes')} |"
        )
    (ev / "p2-quotes-1s-depth.md").write_text("\n".join(lines) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
