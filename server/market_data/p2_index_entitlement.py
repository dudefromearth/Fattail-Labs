#!/usr/bin/env python3
"""P2-6: reconfirm index products are 403 on native tape (Spec §7.2)."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date
from pathlib import Path

_SERVER = Path(__file__).resolve().parents[1]
if str(_SERVER) not in sys.path:
    sys.path.insert(0, str(_SERVER))


INDEX_TICKERS = ("I:SPX", "I:XSP", "I:VIX", "I:VIX1D")


def classify_index_error(msg: str) -> str:
    text = msg or ""
    if "403" in text:
        return "403"
    if "429" in text:
        return "429"
    return "err"


def probe(day: date) -> list[dict]:
    from market_data.massive_client import MassiveClient, MassiveClientError

    client = MassiveClient()
    out: list[dict] = []
    for ticker in INDEX_TICKERS:
        row = {"ticker": ticker, "day": day.isoformat(), "kind": "trades"}
        try:
            rows = client.fetch_trades_day(ticker, day.isoformat(), max_pages=1)
            row["status"] = "unexpected_ok"
            row["rows"] = len(rows)
        except MassiveClientError as exc:
            row["status"] = classify_index_error(str(exc))
            row["error"] = str(exc)[:240]
        out.append(row)
    return out


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--day", default="2026-08-11")
    args = p.parse_args()
    day = date.fromisoformat(args.day[:10])
    results = probe(day)
    print(json.dumps(results, indent=2))
    ev = Path(__file__).resolve().parents[2] / "docs" / "evidence" / "volume-profile"
    ev.mkdir(parents=True, exist_ok=True)
    (ev / "p2-index-entitlement.md").write_text(
        "# P2-6 Index entitlement\n\n"
        f"Day: {day.isoformat()}\n\n```json\n{json.dumps(results, indent=2)}\n```\n"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
