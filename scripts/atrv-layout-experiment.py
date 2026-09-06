#!/usr/bin/env python3
"""ATRV layout experiment — compute, pack, compress: which one actually pays?

The era-1 benchmark reported READ dominant (55.4%) at 0.38 ms per file across
330k files/day. That is ambiguous and the two readings want OPPOSITE fixes:

    bytes-bound     -> COMPRESSION wins (fewer bytes to move)
    per-file-bound  -> PACKING wins     (fewer files to touch)

Reasoning cannot settle it. This builds all four layouts from real snapshots
and times them, and separately prices Coach's compute-as-you-collect idea.

    A  baseline      one file per snapshot, as archived
    B  compressed    one file per snapshot, zstd/gzip
    C  packed        N snapshots per file
    D  packed+comp   both

Plus:
    MARK-ONCE        cost of computing K structure marks per snapshot,
                     against the 2 s capture budget

SAFETY
  * The archive is opened READ-ONLY. Nothing is written under --root, ever;
    the script refuses if --work resolves inside --root.
  * Every variant is byte-roundtrip verified before it is timed. A layout
    that does not decode to the original bytes is reported as BROKEN and
    excluded -- "verbatim capture survives compression" is asserted, not hoped.

    python3 scripts/atrv-layout-experiment.py \
        --root /Volumes/FatTail2TB/fattail-market-data/ssr/live_capture \
        --work /tmp/atrv-layout --limit 20000 --pack 30

Stdlib only, with an optional zstd fast path.
"""

from __future__ import annotations

import argparse
import gzip
import io
import json
import os
import shutil
import statistics
import sys
import time
from pathlib import Path

# ---------------------------------------------------------------- compressor

def pick_codec():
    """zstd if available (what we would ship), else gzip with a loud caveat."""
    try:
        import zstandard as zs                                    # pip install
        c = zs.ZstdCompressor(level=3); d = zs.ZstdDecompressor()
        return ("zstd (python-zstandard, level 3)",
                c.compress, d.decompress, ".zst", True)
    except Exception:
        pass
    try:
        from compression import zstd as _z                        # py3.14+
        return ("zstd (stdlib, level 3)",
                lambda b: _z.compress(b, 3), _z.decompress, ".zst", True)
    except Exception:
        pass
    return ("gzip level 1 (stdlib FALLBACK — understates zstd speed ~3-5x)",
            lambda b: gzip.compress(b, 1), gzip.decompress, ".gz", False)


def ns() -> int:
    return time.perf_counter_ns()


def human(n: float) -> str:
    for s in ("B", "KB", "MB", "GB"):
        if abs(n) < 1024:
            return f"{n:.1f}{s}"
        n /= 1024
    return f"{n:.1f}TB"


# ---------------------------------------------------------------- discovery

def snaps_for(day: Path) -> list[Path]:
    chain = day / "chain"
    if not chain.is_dir():
        return []
    out = sorted(chain.glob("snap-*.json"))
    for sym in sorted(p for p in chain.iterdir() if p.is_dir()):
        out.extend(sorted(sym.glob("snap-*.json")))
    return out


# ---------------------------------------------------------------- build

def build(files: list[Path], work: Path, comp, ext: str, pack: int) -> dict:
    """Materialise the four layouts. Returns per-variant path + bytes + build ns."""
    out: dict = {}

    # A -- baseline copy (so every variant is timed off the same device/cache)
    a = work / "A_baseline"; a.mkdir(parents=True, exist_ok=True)
    t = ns(); nb = 0
    for i, f in enumerate(files):
        b = f.read_bytes(); nb += len(b)
        (a / f"{i:07d}.json").write_bytes(b)
    out["A_baseline"] = {"dir": a, "bytes": nb, "files": len(files),
                         "build_ns": ns() - t}

    # B -- one compressed file per snapshot
    b_ = work / "B_compressed"; b_.mkdir(parents=True, exist_ok=True)
    t = ns(); nb = 0
    for i, f in enumerate(files):
        z = comp((a / f"{i:07d}.json").read_bytes()); nb += len(z)
        (b_ / f"{i:07d}.json{ext}").write_bytes(z)
    out["B_compressed"] = {"dir": b_, "bytes": nb, "files": len(files),
                           "build_ns": ns() - t}

    # C -- packed: `pack` snapshots per file, length-prefixed records
    c = work / "C_packed"; c.mkdir(parents=True, exist_ok=True)
    t = ns(); nb = 0; nfiles = 0
    for start in range(0, len(files), pack):
        buf = io.BytesIO()
        for i in range(start, min(start + pack, len(files))):
            rec = (a / f"{i:07d}.json").read_bytes()
            buf.write(len(rec).to_bytes(4, "big")); buf.write(rec)
        blob = buf.getvalue(); nb += len(blob); nfiles += 1
        (c / f"pack-{start:07d}.bin").write_bytes(blob)
    out["C_packed"] = {"dir": c, "bytes": nb, "files": nfiles,
                       "build_ns": ns() - t}

    # D -- packed then compressed (compression sees repetition ACROSS snapshots)
    d = work / "D_packed_compressed"; d.mkdir(parents=True, exist_ok=True)
    t = ns(); nb = 0; nfiles = 0
    for p in sorted(c.glob("pack-*.bin")):
        z = comp(p.read_bytes()); nb += len(z); nfiles += 1
        (d / (p.stem + ".bin" + ext)).write_bytes(z)
    out["D_packed_compressed"] = {"dir": d, "bytes": nb, "files": nfiles,
                                  "build_ns": ns() - t}
    return out


def unpack(blob: bytes):
    off, n = 0, len(blob)
    while off < n:
        ln = int.from_bytes(blob[off:off + 4], "big"); off += 4
        yield blob[off:off + ln]; off += ln


# ---------------------------------------------------------------- verify

def verify(v: dict, decomp, ext: str, files: list[Path]) -> dict:
    """Every layout must decode to the ORIGINAL bytes. Otherwise it is BROKEN."""
    truth = [f.read_bytes() for f in files[:50]]
    ok = {}

    got = [(v["A_baseline"]["dir"] / f"{i:07d}.json").read_bytes()
           for i in range(len(truth))]
    ok["A_baseline"] = got == truth

    got = [decomp((v["B_compressed"]["dir"] / f"{i:07d}.json{ext}").read_bytes())
           for i in range(len(truth))]
    ok["B_compressed"] = got == truth

    recs: list[bytes] = []
    for p in sorted(v["C_packed"]["dir"].glob("pack-*.bin")):
        recs.extend(unpack(p.read_bytes()))
        if len(recs) >= len(truth):
            break
    ok["C_packed"] = recs[:len(truth)] == truth

    recs = []
    for p in sorted(v["D_packed_compressed"]["dir"].glob("pack-*")):
        recs.extend(unpack(decomp(p.read_bytes())))
        if len(recs) >= len(truth):
            break
    ok["D_packed_compressed"] = recs[:len(truth)] == truth
    return ok


# ---------------------------------------------------------------- time

def scan_flat(d: Path, pat: str, decomp=None) -> tuple[int, int, int]:
    t = ns(); nb = 0; nrows = 0
    for f in sorted(d.glob(pat)):
        raw = f.read_bytes(); nb += len(raw)
        if decomp:
            raw = decomp(raw)
        doc = json.loads(raw)
        gen = doc.get("generation") or doc
        nrows += len(gen.get("rows") or [])
    return ns() - t, nb, nrows


def scan_packed(d: Path, pat: str, decomp=None) -> tuple[int, int, int]:
    t = ns(); nb = 0; nrows = 0
    for f in sorted(d.glob(pat)):
        blob = f.read_bytes(); nb += len(blob)
        if decomp:
            blob = decomp(blob)
        for rec in unpack(blob):
            doc = json.loads(rec)
            gen = doc.get("generation") or doc
            nrows += len(gen.get("rows") or [])
    return ns() - t, nb, nrows


# ---------------------------------------------------------------- mark-once

def mark_once(files: list[Path], k: int) -> dict:
    """Price Coach's idea: compute K structure marks per snapshot, in-stream.

    The structures are butterflies built from strikes actually present.
    Timed EXCLUDING file read, because in production the snapshot is already
    in memory at capture time -- that is the whole point.
    """
    doc = json.loads(files[0].read_bytes())
    gen = doc.get("generation") or doc
    rows = gen.get("rows") or []
    strikes = sorted({r.get("strike") for r in rows
                      if isinstance(r, dict) and r.get("strike") is not None})
    if len(strikes) < 7:
        return {"skipped": "not enough strikes"}

    widths = [w for w in (1, 2, 3, 4, 6, 8) if 2 * w < len(strikes)]
    structs = []
    for w in widths:
        for i in range(w, len(strikes) - w):
            structs.append((strikes[i - w], strikes[i], strikes[i + w]))
            if len(structs) >= k:
                break
        if len(structs) >= k:
            break

    docs = []
    for f in files[:400]:
        try:
            d0 = json.loads(f.read_bytes())
            docs.append(d0.get("generation") or d0)
        except Exception:
            pass

    t = ns()
    marks = 0
    for gen in docs:
        px = {r.get("strike"): r.get("mid") for r in (gen.get("rows") or [])
              if isinstance(r, dict)}
        for lo, mid, hi in structs:
            a, b, c = px.get(lo), px.get(mid), px.get(hi)
            if a is not None and b is not None and c is not None:
                _ = a - 2 * b + c
                marks += 1
    el = ns() - t
    n = max(len(docs), 1)
    return {"structures": len(structs), "snapshots_timed": n,
            "marks": marks, "ns_per_snapshot": el / n,
            "ms_per_snapshot": el / n / 1e6,
            "pct_of_2s_budget": (el / n / 1e9) / 2.0 * 100}


# ---------------------------------------------------------------- anatomy

def anatomy(files: list[Path]) -> dict:
    """Where do a snapshot's bytes actually GO?

    JSON repeats every key name on every row and writes every number as
    decimal text. This measures that overhead against the same values held
    as float32 columns -- which is what the derived store already is.

    It does NOT propose changing the archive format: SSR-MEXP 3.1 makes
    capture verbatim, and verbatim is what makes the corpus re-answerable
    to questions nobody has asked yet. Compression recovers key repetition
    LOSSLESSLY; a format change spends the option permanently.
    """
    doc = json.loads(files[0].read_bytes())
    raw = files[0].read_bytes()
    gen = doc.get("generation") or doc
    rows = [r for r in (gen.get("rows") or []) if isinstance(r, dict)]
    if not rows:
        return {"skipped": "no rows"}

    keys = sorted({k for r in rows for k in r})
    # bytes spent writing key names, with their quotes and colon
    key_bytes = sum(len(k) + 3 for r in rows for k in r)
    # bytes spent on values, as text
    val_bytes = 0
    numeric = 0
    for r in rows:
        for k, v in r.items():
            val_bytes += len(json.dumps(v))
            if isinstance(v, (int, float)) and not isinstance(v, bool):
                numeric += 1
    punct = max(len(raw) - key_bytes - val_bytes, 0)

    f32 = numeric * 4                       # the same numbers, binary
    return {"file_bytes": len(raw), "rows": len(rows), "keys": len(keys),
            "key_name_bytes": key_bytes, "value_text_bytes": val_bytes,
            "structural_bytes": punct, "numeric_fields": numeric,
            "float32_equivalent": f32,
            "key_pct": 100.0 * key_bytes / len(raw),
            "value_pct": 100.0 * val_bytes / len(raw),
            "struct_pct": 100.0 * punct / len(raw),
            "columnar_ratio": len(raw) / f32 if f32 else 0}


# ---------------------------------------------------------------- main

def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root", required=True, help="live_capture root (READ-ONLY)")
    ap.add_argument("--work", required=True, help="scratch dir — must be OUTSIDE root")
    ap.add_argument("--day", help="day=YYYY-MM-DD (default: most recent non-empty)")
    ap.add_argument("--limit", type=int, default=20000, help="snapshots to use")
    ap.add_argument("--pack", type=int, default=30, help="snapshots per packed file")
    ap.add_argument("--structures", type=int, default=500, help="mark-once structures")
    ap.add_argument("--keep", action="store_true", help="do not delete --work at the end")
    ap.add_argument("--json", help="write results here")
    a = ap.parse_args()

    root = Path(a.root).expanduser().resolve()
    work = Path(a.work).expanduser().resolve()

    # ---- safety: never write inside the archive
    if root == work or root in work.parents:
        sys.exit(f"!! REFUSING: --work ({work}) is inside --root ({root}).\n"
                 f"   The archive is read-only gold. Pick a scratch path elsewhere.")
    if work.exists() and any(work.iterdir()):
        sys.exit(f"!! REFUSING: {work} exists and is not empty. Pick a fresh path.")

    days = [d for d in sorted(root.glob("day=*")) if d.is_dir() and snaps_for(d)]
    if not days:
        sys.exit(f"!! no non-empty day=* under {root}")
    day = next((d for d in days if d.name == a.day), None) if a.day else days[-1]
    if day is None:
        sys.exit(f"!! {a.day} not found or empty. Available: "
                 f"{', '.join(d.name for d in days[-8:])}")

    files = snaps_for(day)[:a.limit]
    codec_name, comp, decomp, ext, real_zstd = pick_codec()

    print(f"archive : {root}   (read-only)")
    print(f"day     : {day.name}   using {len(files):,} of {len(snaps_for(day)):,} snapshots")
    print(f"scratch : {work}")
    print(f"codec   : {codec_name}")
    print(f"pack    : {a.pack} snapshots/file\n")
    if not real_zstd:
        print("  NOTE: no zstd available. gzip is SLOWER than zstd, so B and D")
        print("        below are a PESSIMISTIC read of compression. If they win")
        print("        anyway, zstd wins by more.  (pip install zstandard)\n")

    work.mkdir(parents=True, exist_ok=True)
    try:
        print("building layouts …")
        v = build(files, work, comp, ext, a.pack)

        print("verifying byte-roundtrip …")
        ok = verify(v, decomp, ext, files)
        for k, good in ok.items():
            if not good:
                print(f"  !! {k} BROKEN — does not decode to original bytes")
        print()

        base_bytes = v["A_baseline"]["bytes"]
        plans = [
            ("A_baseline",          lambda: scan_flat(v["A_baseline"]["dir"], "*.json")),
            ("B_compressed",        lambda: scan_flat(v["B_compressed"]["dir"], f"*.json{ext}", decomp)),
            ("C_packed",            lambda: scan_packed(v["C_packed"]["dir"], "pack-*.bin")),
            ("D_packed_compressed", lambda: scan_packed(v["D_packed_compressed"]["dir"], f"pack-*.bin{ext}", decomp)),
        ]

        results = {}
        print(f"{'layout':<22}{'files':>9}{'on disk':>11}{'scan':>10}"
              f"{'vs A':>8}{'rows':>12}")
        print("-" * 72)
        for name, fn in plans:
            if not ok.get(name):
                print(f"{name:<22}  BROKEN — excluded")
                continue
            el, nb, nrows = fn()
            results[name] = {"scan_ns": el, "read_bytes": nb,
                             "rows": nrows,
                             "files": v[name]["files"],
                             "on_disk": v[name]["bytes"],
                             "build_ns": v[name]["build_ns"]}
            print(f"{name:<22}{v[name]['files']:>9,}{human(v[name]['bytes']):>11}"
                  f"{el/1e9:>9.2f}s"
                  f"{(results['A_baseline']['scan_ns']/el if 'A_baseline' in results else 1):>7.2f}x"
                  f"{nrows:>12,}")

        # every layout must have parsed the same rows
        rowsets = {n: r["rows"] for n, r in results.items()}
        if len(set(rowsets.values())) > 1:
            print(f"\n  !! ROW COUNTS DIFFER {rowsets} — a layout lost data. "
                  f"Treat timings as void.")

        print("\n" + "=" * 72)
        if "A_baseline" in results and len(results) > 1:
            base = results["A_baseline"]["scan_ns"]
            best = min((r["scan_ns"], n) for n, r in results.items())
            comp_only = results.get("B_compressed", {}).get("scan_ns")
            pack_only = results.get("C_packed", {}).get("scan_ns")
            print(f"FASTEST: {best[1]}  ({base/best[0]:.2f}x baseline)\n")
            if comp_only and pack_only:
                cg, pg = base / comp_only, base / pack_only
                print(f"  compression alone : {cg:>5.2f}x")
                print(f"  packing alone     : {pg:>5.2f}x")
                # A verdict must clear a floor, not merely win a race between
                # two non-improvements. 1.04x is not "packing dominates".
                if max(cg, pg) < 1.20:
                    print("\n  -> NEITHER helps materially at this scale "
                          f"(best {max(cg,pg):.2f}x). Do NOT write a mitigation\n"
                          "     into a spec on this evidence. Re-run cold "
                          "(`sudo purge`) and with a\n     larger --limit; if it "
                          "still flattens, the cost is elsewhere.")
                elif pg > cg * 1.3:
                    print("\n  -> PER-FILE overhead dominates. PACK. Compression is "
                          "secondary\n     (storage, not speed). SSR-MEXP's file-count "
                          "constraint is the\n     real one and is understated.")
                elif cg > pg * 1.3:
                    print("\n  -> BYTES dominate. COMPRESS AT REST, as Coach proposed. "
                          "Packing is\n     a storage/inode question, not a latency one.")
                else:
                    print("\n  -> Neither dominates alone. Ship BOTH (layout D) — they "
                          "compose,\n     and D's compressor also sees repetition ACROSS "
                          "snapshots.")
            print(f"\n  storage: A {human(base_bytes)} -> D "
                  f"{human(results.get('D_packed_compressed',{}).get('on_disk',0))}")
        print("=" * 72)

        print("\nMARK-ONCE — pricing compute-as-you-collect")
        m = mark_once(files, a.structures)
        if "skipped" in m:
            print(f"  skipped: {m['skipped']}")
        else:
            print(f"  {m['structures']} structures over {m['snapshots_timed']} snapshots")
            print(f"  {m['ms_per_snapshot']:.2f} ms per snapshot"
                  f"  =  {m['pct_of_2s_budget']:.3f}% of the 2 s capture budget")
            verdict = ("FREE — do it in stream" if m["pct_of_2s_budget"] < 5
                       else "NOT free — needs its own process/budget")
            print(f"  -> {verdict}")

        print("\nANATOMY — where a snapshot's bytes go")
        an = anatomy(files)
        if "skipped" in an:
            print(f"  skipped: {an['skipped']}")
        else:
            print(f"  {human(an['file_bytes'])} per snapshot · {an['rows']} rows "
                  f"× {an['keys']} keys")
            print(f"    key names repeated on every row {an['key_pct']:>5.1f}%"
                  f"   ({human(an['key_name_bytes'])})")
            print(f"    values as decimal text          {an['value_pct']:>5.1f}%"
                  f"   ({human(an['value_text_bytes'])})")
            print(f"    braces, commas, whitespace      {an['struct_pct']:>5.1f}%"
                  f"   ({human(an['structural_bytes'])})")
            print(f"  same numbers as float32 columns : {human(an['float32_equivalent'])}"
                  f"  = {an['columnar_ratio']:.1f}x smaller")
            print("  -> that ratio is the DERIVED store's headroom, not a reason to")
            print("     change the archive: verbatim (SSR-MEXP §3.1) is what keeps the")
            print("     corpus answerable to questions nobody has asked yet, and")
            print("     compression recovers the key repetition WITHOUT spending it.")

        out = {"day": day.name, "snapshots": len(files), "codec": codec_name,
               "anatomy": an,
               "real_zstd": real_zstd, "pack": a.pack,
               "verify": ok, "results": results, "mark_once": m}
        if a.json:
            Path(a.json).write_text(json.dumps(out, indent=2, default=str) + "\n")
            print(f"\nwrote {a.json}")
    finally:
        if not a.keep and work.exists():
            shutil.rmtree(work, ignore_errors=True)
            print(f"\ncleaned {work}")


if __name__ == "__main__":
    main()
