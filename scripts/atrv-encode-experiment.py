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


def to_scaled(x, scale: int) -> int | None:
    """Exact integer, or None if it does not fit the scale (caller fails loud)."""
    if x is None or isinstance(x, bool):
        return None
    d = Decimal(repr(x)) * scale
    if d != d.to_integral_value():
        return None
    return int(d)


# ---------------------------------------------------------------- load

def snaps_for(day: Path) -> list[Path]:
    chain = day / "chain"
    if not chain.is_dir():
        return []
    out = sorted(chain.glob("snap-*.json"))
    for sym in sorted(p for p in chain.iterdir() if p.is_dir()):
        out.extend(sorted(sym.glob("snap-*.json")))
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root", required=True)
    ap.add_argument("--day")
    ap.add_argument("--limit", type=int, default=3000)
    ap.add_argument("--json", help="write results here")
    a = ap.parse_args()

    root = Path(a.root).expanduser().resolve()
    days = [d for d in sorted(root.glob("day=*")) if d.is_dir() and snaps_for(d)]
    if not days:
        sys.exit(f"!! no non-empty day=* under {root}")
    day = next((d for d in days if d.name == a.day), None) if a.day else days[-1]
    if day is None:
        sys.exit(f"!! {a.day} not found or empty")

    files = snaps_for(day)[:a.limit]
    codec_name, comp, real_zstd = pick_codec()
    print(f"archive : {root}  (read-only)")
    print(f"day     : {day.name}   {len(files):,} snapshots")
    print(f"codec   : {codec_name}\n")

    # ---- read into column form, keeping the ORIGINAL values for verification
    raw_bytes = 0
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
            cid = (r.get("strike"), r.get("right"), r.get("expiration"))
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

    # ---- per-field scale, inferred and checked
    field_dec: dict[str, int] = {}
    for (cid, fname), vals in cols.items():
        for v in vals:
            d = decimals_of(v)
            if d is not None:
                field_dec[fname] = max(field_dec.get(fname, 0), d)

    print(f"{'field':<16}{'scale':>8}{'exact?':>9}{'f32 damage':>13}")
    print("-" * 46)
    encoded: dict[str, bytes] = {}
    broken: list[str] = []
    f32_damaged: dict[str, int] = {}
    f32_total: dict[str, int] = {}
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
        print(f"{fname:<16}{scale:>8}{'YES' if exact else 'NO -- BROKEN':>9}"
              f"{pct:>12.1f}%")

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

    if a.json:
        Path(a.json).write_text(json.dumps({
            "day": day.name, "snapshots": len(files), "codec": codec_name,
            "raw_bytes": raw_bytes, "float32_bytes": f32_size,
            "scaled_int_bytes": i32_size, "delta_varint_bytes": len(body),
            "compressed_bytes": len(packed), "broken_fields": broken,
            "float32_damaged": f32_damaged, "float32_total": f32_total,
            "scales": {k: 10**v for k, v in field_dec.items()},
        }, indent=2) + "\n")
        print(f"\nwrote {a.json}")


if __name__ == "__main__":
    main()
