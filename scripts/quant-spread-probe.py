#!/usr/bin/env python3
"""Spread probe over a Quant Lab day store — the axis a spread-based P(fill) is fitted on.

▶ RUN ON: any host that has the store (MacBook dev checkout, or StudioOne against
  its own build). Read-only. Never touches the archive.

    python3 scripts/quant-spread-probe.py --root server/data/quant-store \
        --day 2026-09-04 --book XSP [--json out.json]

Reports, per (side, OTM-distance band, 30-min ET slot) — distance is SIGNED toward OTM
(puts: spot-strike, calls: strike-spot); ITM is its own band, never pooled with OTM: sorted-quantile half-spread in
dollars and as a fraction of mid, and the shares of quotes that are locked/crossed,
bid-null or bid-zero. Reductions are order-free (sorted quantiles, counts). No means.
"""
from __future__ import annotations
import argparse, json, sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
import numpy as np

NULL = -2_147_483_648
ET = timezone(timedelta(hours=-4))  # EDT — 2026-09-04 is in daylight time; probe asserts it
MONEY_BANDS = [(-1e9, 0), (0, 2), (2, 5), (5, 10), (10, 20), (20, 1e9)]  # first band = ITM
QS = (0.10, 0.25, 0.50, 0.75, 0.90)


def load(root: Path, day: str, book: str):
    p = root / f"day={day}" / f"book={book}"
    meta = json.loads((p / "meta.json").read_text())
    T, C = meta["T"], meta["C"]
    col = lambda f: np.memmap(p / f"{f}.i32", dtype="<i4", mode="r", shape=(C, T))
    present = np.memmap(p / "present.u8", dtype="u1", mode="r", shape=(C, T))
    time = np.memmap(p / "time.i64", dtype="<i8", mode="r", shape=(T,))
    spot = np.memmap(p / "spot.i32", dtype="<i4", mode="r", shape=(T,))
    return meta, col("bid"), col("ask"), col("mid"), present, np.asarray(time), np.asarray(spot)


def q(v: np.ndarray) -> dict:
    if v.size == 0:
        return {}
    s = np.sort(v)
    return {f"p{int(x*100):02d}": float(s[min(s.size - 1, int(x * s.size))]) for x in QS}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", required=True); ap.add_argument("--day", required=True)
    ap.add_argument("--book", required=True); ap.add_argument("--json")
    a = ap.parse_args()
    meta, bid, ask, mid, present, time, spot = load(Path(a.root), a.day, a.book)
    scale = meta["fields"]["mid"]["scale"] if isinstance(meta["fields"], dict) else 1000
    T, C = meta["T"], meta["C"]
    contracts = meta["contracts"]
    strike = np.array([float(c[0]) for c in contracts]); side = np.array([c[1] for c in contracts])
    assert datetime.fromtimestamp(int(time[0]) / 1000, ET).utcoffset() == timedelta(hours=-4)
    # session window 09:30–16:00 ET
    et = [datetime.fromtimestamp(int(t) / 1000, ET) for t in time]
    hm = np.array([d.hour * 60 + d.minute for d in et])
    in_sess = (hm >= 9 * 60 + 30) & (hm < 16 * 60)
    slot = (hm - (9 * 60 + 30)) // 30  # 0..12
    spot_ok = spot != NULL
    spot_d = np.where(spot_ok, spot / 100.0, np.nan)

    out = {"day": a.day, "book": a.book, "T": T, "C": C, "session_snapshots": int(in_sess.sum()),
           "spot_null_in_session": int((in_sess & ~spot_ok).sum()), "cells": {}}
    rows = []
    for sd in ("P", "C"):
        cs = np.where(side == sd)[0]
        if cs.size == 0:
            continue
        b = np.asarray(bid[cs]); k = np.asarray(ask[cs]); m = np.asarray(mid[cs]); pr = np.asarray(present[cs]).astype(bool)
        dist = (spot_d[None, :] - strike[cs][:, None]) if sd == "P" else (strike[cs][:, None] - spot_d[None, :])  # OTM > 0
        for lo, hi in MONEY_BANDS:
            for s in range(13):
                sel = pr & in_sess[None, :] & (slot[None, :] == s) & (dist >= lo) & (dist < hi)
                n = int(sel.sum())
                if n == 0:
                    continue
                bb, kk, mm = b[sel], k[sel], m[sel]
                bid_null = bb == NULL; ask_null = kk == NULL
                both = ~bid_null & ~ask_null
                bid_zero = both & (bb == 0)
                locked = both & (bb == kk); crossed = both & (bb > kk)
                good = both & (bb < kk)
                hs = (kk[good] - bb[good]) / (2.0 * scale)
                midv = mm[good]; midd = np.where(midv == NULL, np.nan, midv / scale)
                rel = hs[midd > 0] / midd[midd > 0]
                band = "ITM" if lo < -1e8 else f"{lo}-{'inf' if hi > 1e8 else hi}"
                key = f"{sd}|{band}|{s:02d}"
                cell = {"n": n, "bid_null": int(bid_null.sum()), "ask_null": int(ask_null.sum()),
                        "bid_zero": int(bid_zero.sum()), "locked": int(locked.sum()), "crossed": int(crossed.sum()),
                        "half_spread_usd": q(hs), "half_spread_over_mid": q(rel)}
                out["cells"][key] = cell
                rows.append((sd, lo, hi, s, cell))
    # print a compact table: p50/p90 half-spread ($) and share bid-null, per side×band, pooled over session slots
    print(f"# spread probe {a.book} {a.day} — session snapshots {out['session_snapshots']} / T={T}, C={C}")
    print(f"{'side':4} {'OTM':>7} {'n':>9} {'bidNull%':>8} {'bid0%':>6} {'lock%':>6} {'x%':>5} {'hs p10':>7} {'hs p50':>7} {'hs p90':>7} {'rel p50':>8}")
    for sd in ("P", "C"):
        for lo, hi in MONEY_BANDS:
            cells = [c for (s2, l2, h2, s, c) in rows if s2 == sd and l2 == lo]
            if not cells:
                continue
            n = sum(c["n"] for c in cells)
            # pooled quantiles need the raw values; recompute pooled from the cells' raw is not stored — re-select
            cs = np.where(side == sd)[0]
            b = np.asarray(bid[cs]); k = np.asarray(ask[cs]); m = np.asarray(mid[cs]); pr = np.asarray(present[cs]).astype(bool)
            dist = (spot_d[None, :] - strike[cs][:, None]) if sd == "P" else (strike[cs][:, None] - spot_d[None, :])
            sel = pr & in_sess[None, :] & (dist >= lo) & (dist < hi)
            bb, kk, mm = b[sel], k[sel], m[sel]
            both = (bb != NULL) & (kk != NULL); good = both & (bb < kk)
            hs = (kk[good] - bb[good]) / (2.0 * scale); midd = mm[good] / scale
            rel = hs[midd > 0] / midd[midd > 0]
            qh, qr = q(hs), q(rel)
            band = "ITM" if lo < -1e8 else f"{lo}-{'inf' if hi>1e8 else int(hi)}"
            print(f"{sd:4} {band:>7} {n:>9} {100*sum(c['bid_null'] for c in cells)/n:>7.1f}% "
                  f"{100*sum(c['bid_zero'] for c in cells)/n:>5.1f}% {100*sum(c['locked'] for c in cells)/n:>5.1f}% "
                  f"{100*sum(c['crossed'] for c in cells)/n:>4.1f}% {qh.get('p10',float('nan')):>7.3f} {qh.get('p50',float('nan')):>7.3f} "
                  f"{qh.get('p90',float('nan')):>7.3f} {qr.get('p50',float('nan')):>8.3f}")
    # time-of-day view for the band Coach trades (puts, 2–10 OTM): p50 half-spread by slot
    print("\n# puts 2–10 from spot — p50 half-spread ($) by 30-min ET slot (09:30 = slot 00)")
    line = []
    for s in range(13):
        vals = [out["cells"].get(f"P|{lo}-{hi}|{s:02d}", {}).get("half_spread_usd", {}).get("p50") for lo, hi in ((2, 5), (5, 10))]
        vals = [v for v in vals if v is not None]
        line.append(f"{s:02d}:{(max(vals) if vals else float('nan')):.3f}")
    print("  " + "  ".join(line))
    if a.json:
        Path(a.json).write_text(json.dumps(out, indent=1))
        print(f"\nwritten {a.json}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
