#!/usr/bin/env python3
"""ATRV encoding experiment — smallest LOSSLESS form of the surface.

Coach: "reduce the data size without loss of precision, and precompute
surfaces so any strategy can be derived at any instant or series."

LOSSLESS is the binding word, and it rules out the obvious answer. float32
carries ~7 significant digits and cannot represent 12.35 exactly. Option
prices and greeks arrive as DECIMALS on a tick grid, so the exact form is a
SCALED INTEGER, not a float -- 12.35 -> 1235 at scale 100, exactly, forever.
Integers also delta-encode, which floats do not.

So the chain tested here is:

    column-major   one contract's field, contiguous in time
    scaled int     exact; the scale is INFERRED from the data and the
                   encoder FAILS LOUD if any value does not fit it
    delta-in-time  a quote 2 s later is usually the same or near it
    zigzag varint  small signed deltas cost 1 byte
    zstd/gzip      on top of all of the above

Every field is verified by EXACT comparison against the original JSON value
before any size is reported. A field that does not round-trip exactly is
reported BROKEN and excluded -- "no loss of precision" is asserted, never
assumed.

It also answers the open float32 question with data rather than opinion:
how many real values would float32 have damaged?

Read-only. Writes nothing outside --work (and nothing at all without it).

    python3 scripts/atrv-encode-experiment.py --root <live_capture> --limit 3000

Stdlib only, optional zstd.
"""

from __future__ import annotations

import argparse
import gzip
import json
import struct
import sys
from collections import defaultdict
from decimal import Decimal
from pathlib import Path

# ---------------------------------------------------------------- codec

def pick_codec():
    try:
        import zstandard as zs
        c = zs.ZstdCompressor(level=10)
        return "zstd level 10", c.compress, True
    except Exception:
        pass
    try:
        from compression import zstd as _z
        return "zstd stdlib level 10", (lambda b: _z.compress(b, 10)), True
    except Exception:
        pass
    return "gzip level 9 (FALLBACK — zstd compresses better and far faster)", \
           (lambda b: gzip.compress(b, 9)), False


def human(n: float) -> str:
    for s in ("B", "KB", "MB", "GB"):
        if abs(n) < 1024:
            return f"{n:.1f}{s}"
        n /= 1024
    return f"{n:.1f}TB"


# ---------------------------------------------------------------- varint

def zigzag(n: int) -> int:
    return (n << 1) ^ (n >> 63)


def put_uvarint(out: bytearray, v: int) -> None:
    while v >= 0x80:
        out.append((v & 0x7F) | 0x80)
        v >>= 7
    out.append(v)


def encode_deltas(vals: list[int | None]) -> bytes:
    """Delta-in-time + zigzag varint. None (absent) is a reserved marker."""
    out = bytearray()
    prev = 0
    for v in vals:
        if v is None:
            out.append(0xFF); out.append(0xFF)      # absent marker
            continue
        put_uvarint(out, zigzag(v - prev))
        prev = v
    return bytes(out)


# ---------------------------------------------------------------- scale

def decimals_of(x) -> int | None:
    """Exact number of decimal places, from the literal. None if not numeric."""
    if isinstance(x, bool) or x is None:
        return None
    if isinstance(x, int):
        return 0
    if isinstance(x, float):
        d = Decimal(repr(x))
        e = -d.as_tuple().exponent
        return max(e, 0)
    return None


GREEK_FIELDS = ("delta", "gamma", "theta", "vega", "iv")


def to_scaled(x, scale: int) -> int | None:
    """Exact integer, or None if it does not fit the scale (caller fails loud)."""
    if x is None or isinstance(x, bool):
        return None
    d = Decimal(repr(x)) * scale
    if d != d.to_integral_value():
        return None
    return int(d)


def to_quantised(x, scale: int) -> tuple[int | None, float]:
    """Rounded integer at a DECLARED quantum, plus the absolute error introduced.
    Not lossless by definition; the error is the point of reporting it."""
    if x is None or isinstance(x, bool):
        return None, 0.0
    d = Decimal(repr(x)) * scale
    q = int(d.to_integral_value())
    return q, abs(float(d - q)) / scale


# ---------------------------------------------------------------- predictors

def predict_encode(grid: list[list[int | None]], mode: str) -> bytes:
    """Encode a [contract][time] integer grid under one predictor.

    Coach asked whether the 3D surface libraries help storage. They do not --
    they are renderers, and their buffers are lossy float32. But the INSTINCT
    is right: a chain across strike and time IS a surface, and it is smooth in
    BOTH directions. That is exactly what lossless predictive coding exploits
    (PNG filters, FLAC linear prediction) -- predict each value from its
    neighbours, store only the small residual.

      time    v[c][t]   - v[c][t-1]              quotes barely move in 2 s
      strike  v[c][t]   - v[c-1][t]              adjacent strikes are similar
      planar  v[c][t] - (v[c][t-1] + v[c-1][t] - v[c-1][t-1])
    """
    out = bytearray()
    C = len(grid)
    T = len(grid[0]) if C else 0
    for c in range(C):
        for t in range(T):
            v = grid[c][t]
            if v is None:
                out.append(0xFF); out.append(0xFF)
                continue
            if mode == "time":
                prev = grid[c][t - 1] if t else 0
                base = prev if prev is not None else 0
            elif mode == "strike":
                prev = grid[c - 1][t] if c else 0
                base = prev if prev is not None else 0
            else:  # planar
                a_ = grid[c][t - 1] if t else None
                b_ = grid[c - 1][t] if c else None
                d_ = grid[c - 1][t - 1] if (c and t) else None
                if a_ is not None and b_ is not None and d_ is not None:
                    base = a_ + b_ - d_
                elif a_ is not None:
                    base = a_
                elif b_ is not None:
                    base = b_
                else:
                    base = 0
            put_uvarint(out, zigzag(v - base))
    return bytes(out)


def predictor_sweep(cols, order, files, field_dec, comp, declared=None) -> dict:
    declared = declared or {}
    """Per FIELD, which predictor wins? The answer differs by field and that
    IS the finding: prices move little in time but a lot across strikes;
    greeks and IV are smooth in both."""
    by_field: dict[str, list] = defaultdict(list)
    for (cid, fn) in order:
        by_field[fn].append(cid)

    rows = []
    for fname in sorted(field_dec):
        scale = 10 ** field_dec[fname]
        cids = sorted(by_field[fname], key=lambda x: (x[0] is None, x[0]))
        grid: list[list[int | None]] = []
        for cid in cids:
            vals = cols[(cid, fname)]
            if fname in declared:
                grid.append([to_quantised(v, scale)[0] if v is not None else None
                             for v in vals])
            else:
                grid.append([to_scaled(v, scale) if v is not None else None
                             for v in vals])
        if not grid or not grid[0]:
            continue
        sizes = {}
        for mode in ("time", "strike", "planar"):
            sizes[mode] = len(comp(predict_encode(grid, mode)))
        best = min(sizes, key=sizes.get)
        rows.append({"field": fname, **sizes, "best": best})
    return rows


# ---------------------------------------------------------------- load

def snaps_for(day: Path, symbol: str | None = None) -> list[Path]:
    """Snapshots for a day.

    WITHOUT --symbol this concatenates every book's directory, so the file
    order is book-major, not time-major. A contract's column then has huge
    gaps in it and the TIME predictor is measured against a scrambled axis --
    which will make `strike` win for the wrong reason. Pass --symbol to hold
    one book's real timeline. See the header note on predictor results.
    """
    chain = day / "chain"
    if not chain.is_dir():
        return []
    if symbol:
        d = chain / symbol
        return sorted(d.glob("snap-*.json")) if d.is_dir() else []
    out = sorted(chain.glob("snap-*.json"))
    for sym in sorted(p for p in chain.iterdir() if p.is_dir()):
        out.extend(sorted(sym.glob("snap-*.json")))
    return out


def list_books(day: Path) -> list[str]:
    chain = day / "chain"
    if not chain.is_dir():
        return []
    return sorted(p.name for p in chain.iterdir() if p.is_dir())


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root", required=True)
    ap.add_argument("--day")
    ap.add_argument("--limit", type=int, default=3000)
    ap.add_argument("--symbol", help="restrict to ONE book directory. Required for a "
                    "trustworthy time-predictor number — without it the file order "
                    "is book-major and the time axis is scrambled")
    ap.add_argument("--list-books", action="store_true",
                    help="print the book directories for the chosen day and exit")
    ap.add_argument("--quantum", action="append", default=[],
                    metavar="FIELD=DECIMALS",
                    help="declare a precision for a field instead of inferring it, e.g. "
                         "delta=6. Repeatable. Values are ROUNDED to it and the max error "
                         "introduced is reported. Use for computed doubles (greeks, iv) whose "
                         "trailing digits are float noise, not information")
    ap.add_argument("--greeks-quantum", type=int, default=None,
                    help="shorthand: apply this many decimals to delta gamma theta vega iv")
    ap.add_argument("--max-contracts", type=int, default=400,
                    help="cap distinct contracts held in memory (default 400). "
                         "THIS RUNS ON THE COLLECTOR: capture never yields, so "
                         "the cap is a safety limit, not a tuning knob")
    ap.add_argument("--predictors", action="store_true",
                    help="sweep time / strike / planar predictors per field")
    ap.add_argument("--json", help="write results here")
    a = ap.parse_args()

    root = Path(a.root).expanduser().resolve()
    days = [d for d in sorted(root.glob("day=*")) if d.is_dir() and snaps_for(d)]
    if not days:
        sys.exit(f"!! no non-empty day=* under {root}")
    day = next((d for d in days if d.name == a.day), None) if a.day else days[-1]
    if day is None:
        sys.exit(f"!! {a.day} not found or empty")

    if a.list_books:
        books = list_books(day)
        print(f"{day.name}: {len(books)} book directories")
        for b in books:
            print(f"  {b:<24}{len(snaps_for(day, b)):>8,} snapshots")
        return

    files = snaps_for(day, a.symbol)[:a.limit]
    if not files:
        sys.exit(f"!! no snapshots for {day.name}"
                 + (f" symbol={a.symbol}" if a.symbol else ""))
    codec_name, comp, real_zstd = pick_codec()
    print(f"archive : {root}  (read-only)")
    print(f"day     : {day.name}   {len(files):,} snapshots"
          + (f"   book={a.symbol}" if a.symbol
             else "   ALL BOOKS -- time axis is scrambled, see --symbol"))
    print(f"codec   : {codec_name}")
    print(f"cap     : {a.max_contracts} contracts held in memory\n")

    # ---- read into column form, keeping the ORIGINAL values for verification
    raw_bytes = 0
    kept: set = set()                               # contract cap -- see --max-contracts
    exps: set = set()                               # distinct expirations actually captured
    cols: dict[tuple, list] = defaultdict(list)     # (contract, field) -> [values]
    order: list[tuple] = []
    seen = set()
    for t, f in enumerate(files):
        b = f.read_bytes(); raw_bytes += len(b)
        doc = json.loads(b)
        gen = doc.get("generation") or doc
        for r in gen.get("rows") or []:
            if not isinstance(r, dict):
                continue
            exps.add(r.get("expiration"))
            cid = (r.get("strike"), r.get("right"), r.get("expiration"))
            if cid not in kept:
                if len(kept) >= a.max_contracts:
                    continue
                kept.add(cid)
            for k, v in r.items():
                if k in ("strike", "right", "expiration"):
                    continue
                key = (cid, k)
                if key not in seen:
                    seen.add(key); order.append(key)
                col = cols[key]
                while len(col) < t:
                    col.append(None)               # absent before admission
                col.append(v)
    for key in order:
        while len(cols[key]) < len(files):
            cols[key].append(None)

    # ---- per-field scale: inferred from the data, OR declared
    inferred: dict[str, int] = {}
    for (cid, fname), vals in cols.items():
        for v in vals:
            d = decimals_of(v)
            if d is not None:
                inferred[fname] = max(inferred.get(fname, 0), d)

    declared: dict[str, int] = {}
    if a.greeks_quantum is not None:
        for g in GREEK_FIELDS:
            declared[g] = a.greeks_quantum
    for spec in a.quantum:
        f, _, n = spec.partition("=")
        declared[f.strip()] = int(n)

    field_dec = dict(inferred)
    field_dec.update({k: v for k, v in declared.items() if k in inferred})

    # A quantum is a PRECISION CHOICE, not lossless. Say so, and measure it.
    if declared:
        print("DECLARED QUANTA (rounded, NOT lossless — max error introduced is measured):")
        for f in sorted(k for k in declared if k in inferred):
            print(f"  {f:<14} inferred 1e-{inferred[f]:<3} -> declared 1e-{declared[f]}")
        print()
    noisy = [f for f, d in inferred.items() if d > 12 and f not in declared]
    if noisy:
        print(f"!! {len(noisy)} field(s) carry >12 decimals of float noise and have NO declared")
        print(f"   quantum: {sorted(noisy)}. 'Lossless' here preserves 1e-17 gamma — that is")
        print(f"   not information, and it will dominate the output. Use --greeks-quantum.\n")

    known = sorted(e for e in exps if e is not None)
    print(f"expirations captured: {len(known)}"
          + (f"  -> {known[:8]}{' …' if len(known) > 8 else ''}" if known else "")
          + ("   ** MULTI-EXPIRATION ALREADY IN ERA-1 **" if len(known) > 1 else ""))
    print()
    print(f"{'field':<16}{'scale':>8}{'exact?':>10}{'f32 damage':>13}")
    print("-" * 60)
    encoded: dict[str, bytes] = {}
    broken: list[str] = []
    f32_damaged: dict[str, int] = {}
    f32_total: dict[str, int] = {}
    max_err: dict[str, float] = {}
    per_field_raw = defaultdict(int)

    for fname in sorted(field_dec):
        scale = 10 ** field_dec[fname]
        blobs = bytearray()
        exact = True
        dmg = tot = 0
        for (cid, fn), vals in cols.items():
            if fn != fname:
                continue
            ints: list[int | None] = []
            for v in vals:
                if v is None:
                    ints.append(None); continue
                if fname in declared:
                    iv, err = to_quantised(v, scale)
                    max_err[fname] = max(max_err.get(fname, 0.0), err)
                else:
                    iv = to_scaled(v, scale)
                    if iv is None:
                        exact = False
                        ints.append(None)
                        continue
                ints.append(iv)
                # float32 check, against the same original value
                tot += 1
                if struct.unpack("f", struct.pack("f", float(v)))[0] != float(v):
                    dmg += 1
                per_field_raw[fname] += len(json.dumps(v)) + len(fname) + 3
            blobs += encode_deltas(ints)
        encoded[fname] = bytes(blobs)
        f32_damaged[fname], f32_total[fname] = dmg, tot
        if not exact:
            broken.append(fname)
        pct = (100.0 * dmg / tot) if tot else 0.0
        status = ("QUANTISED" if fname in declared else
                  ("YES" if exact else "NO -- BROKEN"))
        tail = (f"   max err {max_err.get(fname, 0.0):.1e}" if fname in declared else "")
        print(f"{fname:<16}{scale:>8}{status:>10}{pct:>12.1f}%{tail}")

    if broken:
        print(f"\n  !! NOT EXACT at the inferred scale: {broken}")
        print("     The encoder must fail loud here rather than round. Excluded.")

    body = b"".join(v for k, v in encoded.items() if k not in broken)
    packed = comp(body)
    n_num = sum(f32_total.values())
    f32_size = n_num * 4
    i32_size = n_num * 4

    print("\n" + "=" * 62)
    print(f"{'JSON as archived':<34}{human(raw_bytes):>12}   1.00x")
    for label, size in (("float32 columns (LOSSY)", f32_size),
                        ("scaled int32 columns", i32_size),
                        ("+ delta + varint", len(body)),
                        ("+ compression", len(packed))):
        print(f"{label:<34}{human(size):>12}{raw_bytes/max(size,1):>7.1f}x")
    print("=" * 62)

    tot_dmg = sum(f32_damaged.values())
    print(f"\nFLOAT32 VERDICT: {tot_dmg:,} of {n_num:,} values "
          f"({100.0*tot_dmg/max(n_num,1):.1f}%) do not survive float32 exactly.")
    print("  Scaled integers make the question moot -- and are SMALLER,")
    print("  because integer deltas compress and float bit patterns do not.")

    if not real_zstd:
        print("\n  NOTE: gzip fallback. zstd is both smaller and much faster here.")

    if a.predictors:
        print("\nPREDICTOR SWEEP — compressed bytes per field, lower is better")
        print(f"{'field':<16}{'time':>11}{'strike':>11}{'planar':>11}{'best':>9}")
        print("-" * 58)
        sweep = predictor_sweep(cols, order, files, field_dec, comp, declared)
        tot = {"time": 0, "strike": 0, "planar": 0, "mixed": 0}
        for r in sweep:
            print(f"{r['field']:<16}{human(r['time']):>11}{human(r['strike']):>11}"
                  f"{human(r['planar']):>11}{r['best']:>9}")
            for m in ("time", "strike", "planar"):
                tot[m] += r[m]
            tot["mixed"] += r[r["best"]]
        print("-" * 58)
        print(f"{'ALL ONE PREDICTOR':<16}{human(tot['time']):>11}"
              f"{human(tot['strike']):>11}{human(tot['planar']):>11}")
        single = min(tot['time'], tot['strike'], tot['planar'])
        print(f"\n  best single predictor : {human(single)}")
        print(f"  PER-FIELD choice      : {human(tot['mixed'])}"
              f"   ({single/max(tot['mixed'],1):.2f}x better)")
        print("  -> the winner differs BY FIELD, so the encoder stores one")
        print("     predictor id per field. That is a byte of header, not a design.")

    if a.json:
        Path(a.json).write_text(json.dumps({
            "predictor_sweep": (sweep if a.predictors else None),
            "day": day.name, "snapshots": len(files), "codec": codec_name,
            "raw_bytes": raw_bytes, "float32_bytes": f32_size,
            "scaled_int_bytes": i32_size, "delta_varint_bytes": len(body),
            "compressed_bytes": len(packed), "broken_fields": broken,
            "float32_damaged": f32_damaged, "float32_total": f32_total,
            "scales": {k: 10**v for k, v in field_dec.items()},
            "inferred_decimals": inferred, "declared_decimals": declared,
            "max_quantisation_error": max_err,
        }, indent=2) + "\n")
        print(f"\nwrote {a.json}")


if __name__ == "__main__":
    main()
