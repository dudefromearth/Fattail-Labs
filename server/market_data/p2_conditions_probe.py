#!/usr/bin/env python3
"""P2-3 probe: reconcile included trade volume vs Massive daily bar.

Does not freeze condition list — records achieved tolerance for Coach decision.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date
from pathlib import Path

_SERVER = Path(__file__).resolve().parents[1]
if str(_SERVER) not in sys.path:
    sys.path.insert(0, str(_SERVER))

from market_data.massive_client import MassiveClient  # noqa: E402
from market_data.raw_campaign import market_data_root  # noqa: E402


def load_day_trades(series: str, day: date) -> list[dict]:
    import pyarrow.parquet as pq

    root = market_data_root()
    part = (
        root
        / "raw"
        / series.upper()
        / "trades"
        / f"year={day.year:04d}"
        / f"month={day.month:02d}"
        / f"day={day.day:02d}"
        / "part-000.parquet"
    )
    if not part.is_file():
        raise SystemExit(f"missing {part}")
    table = pq.read_table(part)
    return table.to_pylist()


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--symbol", default="SPY")
    p.add_argument("--day", required=True)
    args = p.parse_args()
    day = date.fromisoformat(args.day[:10])
    sym = args.symbol.upper()

    trades = load_day_trades(sym, day)
    tape_vol = 0.0
    for t in trades:
        try:
            s = float(t.get("size") or 0)
        except (TypeError, ValueError):
            continue
        if s > 0:
            tape_vol += s

    client = MassiveClient()
    bars = client.fetch_aggs(
        sym, multiplier=1, timespan="day", start=day.isoformat(), end=day.isoformat()
    )
    bar_vol = float(bars[0]["v"]) if bars and bars[0].get("v") is not None else None
    rel = None
    if bar_vol and bar_vol > 0:
        rel = (tape_vol - bar_vol) / bar_vol

    out = {
        "symbol": sym,
        "day": day.isoformat(),
        "trade_rows": len(trades),
        "tape_size_sum": tape_vol,
        "massive_daily_v": bar_vol,
        "relative_error": rel,
        "note": "condition filter not yet frozen — all trades included",
    }
    print(json.dumps(out, indent=2))
    root = market_data_root()
    ev = Path(__file__).resolve().parents[2] / "docs" / "evidence" / "volume-profile"
    ev.mkdir(parents=True, exist_ok=True)
    (ev / "p2-conditions-sample.json").write_text(json.dumps(out, indent=2) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
