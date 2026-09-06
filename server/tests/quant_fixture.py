"""Synthetic era-1 day in the REAL archive shape.

Rows carry `side` (not `right`), `bid`/greeks may be null, `expiration` is on
the snapshot, `captured_at` is ISO. Vendor-style greek noise at 1e-17 so the
quantum path is exercised. The band RATCHETS so C grows mid-session.
"""

from __future__ import annotations

import json
import math
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path


def write_day(root: Path, day: str = "2026-09-04", book: str = "XSP",
              snaps: int = 240, seed: int = 7) -> Path:
    rng = random.Random(seed)
    d = root / f"day={day}" / "chain" / book
    d.mkdir(parents=True, exist_ok=True)
    t0 = datetime.fromisoformat(f"{day}T13:30:00+00:00")
    spot = 630.0
    for n in range(snaps):
        spot += rng.uniform(-0.08, 0.08)
        lo = 620 - (n // 60)          # ratchet: widens every 60 snaps
        hi = 640 + (n // 60)
        ts = t0 + timedelta(seconds=2 * n)
        ts_ms = ts.timestamp() * 1000
        rows = []
        for k in range(lo, hi + 1):
            for side in ("C", "P"):
                sgn = 1 if side == "C" else -1
                intrinsic = max(sgn * (spot - k), 0.0)
                ext = max(0.05, 3.0 * math.exp(-((k - spot) / 6.0) ** 2))
                mid = round(intrinsic + ext, 3)                # half-cent grid
                bid = None if rng.random() < 0.03 else round(mid - 0.05, 2)
                ask = round(mid + 0.05, 2)
                g = 0.02 * math.exp(-((k - spot) / 5.0) ** 2) * (1 + rng.uniform(-1e-9, 1e-9))
                dl = sgn / (1 + math.exp(sgn * (k - spot) / 2.5)) * (1 + rng.uniform(-1e-12, 1e-12))
                null_g = rng.random() < 0.02
                rows.append({
                    "strike": float(k), "side": side, "is_spot": abs(k - spot) < 0.5,
                    "ticker": f"O:{book}{day.replace('-', '')[2:]}{side}{k*1000:08.0f}",
                    "mid": mid, "bid": bid, "ask": ask, "mid_source": "quote",
                    "volume": n * 3 + k % 7,
                    # vendor sends NANOSECONDS; a quote a few hundred ms stale
                    "last_updated": (int(ts_ms) - 250 - (k % 5) * 100) * 1_000_000,
                    "open_interest": 1000 + k,
                    "delta": None if null_g else dl,
                    "gamma": None if null_g else g,
                    "theta": None if null_g else -g * 120,
                    "vega": None if null_g else g * 400,
                    "iv": 0.15 + 0.0004 * abs(k - spot) + rng.uniform(-1e-13, 1e-13),
                })
        doc = {
            "provenance": "test", "captured_at": ts.isoformat().replace("+00:00", "Z"),
            "phase": "rth", "symbol": book, "expiration": day, "topic": "chain",
            "generation": {"underlier": book, "expiration": day, "side": "both",
                           "dual_side": True, "spot": round(spot, 2), "vix": 15.0,
                           "dte": 0, "rows": rows, "row_count": len(rows)},
            "hole": None, "chain_cadence_s": 2.0, "row_count": len(rows),
        }
        name = f"snap-{ts:%H%M%S}000Z.json"
        (d / name).write_text(json.dumps(doc))
    return root
