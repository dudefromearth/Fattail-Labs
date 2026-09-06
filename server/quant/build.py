#!/usr/bin/env python3
"""Closed-day builder: era-1 JSON day -> packs + [C][T] scaled-int store.

RUNS ON THE COLLECTOR (StudioOne), after the session closes, against a day
that is closed. Opens the archive READ-ONLY. Refuses to write anywhere
under the archive root. Everything it produces is a cache: deletable,
rebuildable, never authoritative (ATRV §2.1).

    python3 -m quant.build --archive <live_capture> --out <store_root> \
        --day 2026-09-04 --book XSP --greeks-quantum 6

Two products, one read of the day:

  packs/     the ORIGINAL snapshot bytes, length-prefixed, zstd. Byte-identical
             on decode — verbatim by construction, verified before the build
             is called done. This is the recording.
  [C][T]     contract-major scaled-int columns + presence mask. This is the
             instrument. Quotes exact on their tick grid; greeks at a DECLARED
             quantum with the max error introduced recorded in meta.json.

Measured on the real XSP book: ~6 s/day for the transpose, ~198x smaller than
the JSON at 1e-6 (docs/evidence/atrv-bench-2026-09-05.md §3.1, §4.1).
"""

from __future__ import annotations

import argparse
import array
import hashlib
import io
import json
import os
import re
import struct
import sys
import time
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_EVEN
from pathlib import Path

from quant.layout import (ALL_FIELDS, COUNT_FIELDS, GREEK_FIELDS, NULL_I32,
                          QUOTE_FIELDS, QUOTE_SCALE, STAMP_FIELDS,
                          STORE_VERSION, side_of)

_SNAP = re.compile(r"^snap-(\d{2})(\d{2})(\d{2})(\d{0,3})Z(?:__\d+)?\.json$")


# ---------------------------------------------------------------- zstd

def _zstd():
    try:
        import zstandard as zs
        return zs.ZstdCompressor(level=10).compress, zs.ZstdDecompressor().decompress
    except ImportError:
        sys.exit("!! zstandard is required for the builder: pip install zstandard")


# ---------------------------------------------------------------- time

def snap_time_ms(doc: dict, fname: str, day: str) -> int | None:
    """Epoch ms for a snapshot. captured_at first, filename clock as fallback."""
    raw = doc.get("captured_at")
    if isinstance(raw, str) and raw:
        try:
            dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return int(dt.timestamp() * 1000)
        except ValueError:
            pass
    gen = doc.get("generation") or {}
    fu = gen.get("fetched_at_unix")
    if isinstance(fu, (int, float)):
        return int(fu * 1000)
    m = _SNAP.match(fname)
    if m:
        hh, mm, ss = int(m.group(1)), int(m.group(2)), int(m.group(3))
        frac = m.group(4) or ""
        ms = int(frac.ljust(3, "0")) if frac else 0
        d = datetime.fromisoformat(day).replace(tzinfo=timezone.utc)
        return int(d.replace(hour=hh, minute=mm, second=ss).timestamp() * 1000) + ms
    return None


# ---------------------------------------------------------------- scaling

def to_int(v, scale: int, *, quantise: bool) -> tuple[int, float] | None:
    """Scaled integer for a numeric value.

    quantise=False: exact or None (caller records a scale violation).
    quantise=True:  rounded; returns (int, abs_error_introduced).
    """
    if v is None or isinstance(v, bool):
        return None
    try:
        d = Decimal(repr(float(v))) * scale
    except Exception:
        return None
    q = d.to_integral_value(rounding=ROUND_HALF_EVEN)
    if not quantise and q != d:
        return None
    err = abs(float(d - q)) / scale if quantise else 0.0
    iq = int(q)
    if not (-2_147_483_647 <= iq <= 2_147_483_647):
        return None
    return iq, err


# ---------------------------------------------------------------- build

class DayBuild:
    def __init__(self, day: str, book: str, greeks_quantum: int) -> None:
        self.day, self.book = day, book
        self.gq = greeks_quantum
        self.scale = {f: QUOTE_SCALE for f in QUOTE_FIELDS}
        self.scale.update({f: 10 ** greeks_quantum for f in GREEK_FIELDS})
        self.scale.update({f: 1 for f in COUNT_FIELDS + STAMP_FIELDS})
        self.quantised = set(GREEK_FIELDS)
        self.max_err = {f: 0.0 for f in GREEK_FIELDS}
        self.scale_violations: dict[str, int] = {}
        self.cids: dict[tuple, int] = {}
        self.cid_order: list[tuple] = []
        self.T = 0
        self.time: list[int] = []
        self.spot: list[int] = []
        self.cols: dict[str, list[array.array]] = {f: [] for f in ALL_FIELDS}
        self.present: list[array.array] = []
        self.rows = 0
        self.snap_sha = hashlib.sha1()

    def _new_contract(self, cid: tuple, cap: int) -> int:
        c = len(self.cid_order)
        self.cids[cid] = c
        self.cid_order.append(cid)
        for f in ALL_FIELDS:
            a = array.array("i", [NULL_I32]) * cap
            self.cols[f].append(a)
        self.present.append(array.array("B", bytes(cap)))
        return c

    def add(self, doc: dict, t: int, cap: int, snap_ms: int = 0) -> None:
        gen = doc.get("generation") or {}
        exp = doc.get("expiration") or gen.get("expiration")
        sp = to_int(gen.get("spot"), 100, quantise=True)
        self.spot.append(sp[0] if sp else NULL_I32)
        for r in gen.get("rows") or []:
            if not isinstance(r, dict):
                continue
            k = r.get("strike")
            if k is None:
                continue
            cid = (float(k), side_of(r), str(exp) if exp else None)
            c = self.cids.get(cid)
            if c is None:
                c = self._new_contract(cid, cap)
            self.present[c][t] = 1
            self.rows += 1
            for f in ALL_FIELDS:
                v = r.get(f)
                if v is None:
                    continue
                if f in STAMP_FIELDS:
                    # epoch ms overflows int32; the OFFSET from the snapshot's own
                    # time fits, loses nothing given time[t], and IS the quote-age
                    # quantity ATRV §3.6 gap 2 asks for. Semantics of the vendor
                    # field itself are still PENDING (measurement note §2).
                    try:
                        v = int(v) - snap_ms
                    except (TypeError, ValueError):
                        continue
                got = to_int(v, self.scale[f], quantise=(f in self.quantised))
                if got is None:
                    self.scale_violations[f] = self.scale_violations.get(f, 0) + 1
                    continue
                iv, err = got
                if f in self.quantised and err > self.max_err[f]:
                    self.max_err[f] = err
                self.cols[f][c][t] = iv

    def write(self, out: Path) -> dict:
        out.mkdir(parents=True, exist_ok=True)
        T, C = self.T, len(self.cid_order)
        (out / "time.i64").write_bytes(array.array("q", self.time).tobytes())
        (out / "spot.i32").write_bytes(array.array("i", self.spot).tobytes())
        with open(out / "present.u8", "wb") as fh:
            for a in self.present:
                fh.write(a.tobytes()[:T])
        for f in ALL_FIELDS:
            with open(out / f"{f}.i32", "wb") as fh:
                for a in self.cols[f]:
                    fh.write(a.tobytes()[: 4 * T])
        meta = {
            "version": STORE_VERSION, "day": self.day, "book": self.book,
            "T": T, "C": C, "rows": self.rows,
            "contracts": [[k, s, e] for (k, s, e) in self.cid_order],
            "fields": {
                f: {"scale": self.scale[f],
                    "quantised": f in self.quantised,
                    "max_error": (self.max_err.get(f) if f in self.quantised else 0.0),
                    "scale_violations": self.scale_violations.get(f, 0)}
                for f in ALL_FIELDS},
            "greeks_quantum_decimals": self.gq,
            "stamp_encoding": {f: "offset_ms_from_time[t]" for f in STAMP_FIELDS},
            "null_i32": NULL_I32,
            "source_sha1": self.snap_sha.hexdigest(),
            "built_at": datetime.now(timezone.utc).isoformat(),
        }
        (out / "meta.json").write_text(json.dumps(meta, indent=1) + "\n")
        return meta


def snaps_for(day_dir: Path, book: str) -> list[Path]:
    d = day_dir / "chain" / book
    return sorted(d.glob("snap-*.json")) if d.is_dir() else []


def build_day(archive: Path, out_root: Path, day: str, book: str, *,
              greeks_quantum: int, pack_minutes: int = 1,
              limit: int | None = None, verify: bool = True) -> dict:
    comp, decomp = _zstd()
    day_dir = archive / f"day={day}"
    files = snaps_for(day_dir, book)
    if limit:
        files = files[:limit]
    if not files:
        raise SystemExit(f"!! no snapshots: {day_dir}/chain/{book}")

    out = out_root / f"day={day}" / f"book={book}"
    packs = out / "packs"
    packs.mkdir(parents=True, exist_ok=True)

    b = DayBuild(day, book, greeks_quantum)
    cap = len(files)
    t0 = time.perf_counter()

    # one read of the day: pack the bytes, transpose the object
    pack_buf = io.BytesIO(); pack_key = None; pack_count = 0; pack_bytes_in = 0
    pack_index: list[dict] = []

    def flush():
        nonlocal pack_buf, pack_key, pack_count
        if pack_key is None or pack_count == 0:
            return
        blob = comp(pack_buf.getvalue())
        p = packs / f"pack-{pack_key}.bin.zst"
        p.write_bytes(blob)
        pack_index.append({"pack": p.name, "snapshots": pack_count,
                           "bytes_in": pack_buf.tell(), "bytes_out": len(blob)})
        pack_buf = io.BytesIO(); pack_count = 0

    t = 0
    for f in files:
        raw = f.read_bytes()
        b.snap_sha.update(raw)
        try:
            doc = json.loads(raw)
        except json.JSONDecodeError:
            continue
        ms = snap_time_ms(doc, f.name, day)
        if ms is None:
            continue
        key = datetime.fromtimestamp(ms / 1000, timezone.utc)
        key = f"{key:%H%M}"[:4 - (0 if pack_minutes == 1 else 0)]
        if pack_minutes > 1:
            mm = int(key[2:]) // pack_minutes * pack_minutes
            key = f"{key[:2]}{mm:02d}"
        if key != pack_key:
            flush(); pack_key = key
        pack_buf.write(struct.pack(">I", len(raw))); pack_buf.write(raw)
        pack_count += 1; pack_bytes_in += len(raw)

        b.time.append(ms)
        b.add(doc, t, cap, snap_ms=ms)
        t += 1
    flush()
    b.T = t
    meta = b.write(out)
    meta["packs"] = pack_index
    meta["pack_bytes_in"] = pack_bytes_in
    meta["pack_bytes_out"] = sum(p["bytes_out"] for p in pack_index)
    meta["build_seconds"] = round(time.perf_counter() - t0, 3)
    meta["snapshots_read"] = len(files)

    if verify:
        meta["verify"] = verify_build(files, out, decomp)
        if not meta["verify"]["packs_byte_identical"]:
            raise SystemExit("!! PACK VERIFY FAILED: decoded bytes != original. Build is void.")
        if meta["verify"]["cells_mismatched"]:
            raise SystemExit(f"!! CELL VERIFY FAILED: {meta['verify']['cells_mismatched']} "
                             f"cells disagree with the snapshot. Build is void (AT-ATRV-2).")
    (out / "meta.json").write_text(json.dumps(meta, indent=1) + "\n")
    return meta


# ---------------------------------------------------------------- verify

def _unpack(blob: bytes):
    off = 0
    while off < len(blob):
        n = struct.unpack(">I", blob[off:off + 4])[0]; off += 4
        yield blob[off:off + n]; off += n


def verify_build(files: list[Path], out: Path, decomp, sample_cells: int = 400) -> dict:
    """The build is not done until (1) packs decode to the ORIGINAL bytes and
    (2) sampled store cells equal the snapshot value at the declared scale."""
    from quant.store import DayStore
    # (1) packs
    recs: list[bytes] = []
    for p in sorted((out / "packs").glob("pack-*.bin.zst")):
        recs.extend(_unpack(decomp(p.read_bytes())))
    originals = [f.read_bytes() for f in files]
    packs_ok = len(recs) == len(originals) and all(a == b for a, b in zip(recs, originals))

    # (2) cells — pick snapshots spread across the day
    st = DayStore(out)
    mism = 0; checked = 0
    idx = sorted({i * len(files) // 20 for i in range(20)} | {len(files) - 1})
    for t in idx:
        doc = json.loads(originals[t])
        gen = doc.get("generation") or {}
        exp = doc.get("expiration") or gen.get("expiration")
        for r in (gen.get("rows") or [])[:20]:
            if not isinstance(r, dict) or r.get("strike") is None:
                continue
            cid = (float(r["strike"]), side_of(r), str(exp) if exp else None)
            c = st.contract_index(cid)
            if c is None:
                mism += 1; continue
            if not st.present(c, t):
                mism += 1; continue
            for f in ("mid", "ask", "delta", "iv", "volume"):
                v = r.get(f)
                got = st.value(f, c, t)
                if v is None:
                    if got is not None:
                        mism += 1
                    continue
                exp_int = to_int(v, st.scale(f), quantise=st.quantised(f))
                if exp_int is None or got != exp_int[0]:
                    mism += 1
                checked += 1
                if checked >= sample_cells:
                    break
    return {"packs_byte_identical": packs_ok, "packs_decoded": len(recs),
            "cells_checked": checked, "cells_mismatched": mism}


# ---------------------------------------------------------------- cli

def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--archive", required=True, help="live_capture root (READ-ONLY)")
    ap.add_argument("--out", required=True, help="store root — must be OUTSIDE --archive")
    ap.add_argument("--day", required=True, help="YYYY-MM-DD, a CLOSED day")
    ap.add_argument("--book", required=True, help="book directory, e.g. XSP")
    ap.add_argument("--greeks-quantum", type=int, required=True,
                    help="decimals for delta/gamma/theta/vega/iv (declared, not lossless)")
    ap.add_argument("--pack-minutes", type=int, default=1)
    ap.add_argument("--limit", type=int, help="snapshots (testing only)")
    ap.add_argument("--no-verify", action="store_true")
    a = ap.parse_args()

    archive = Path(a.archive).expanduser().resolve()
    out = Path(a.out).expanduser().resolve()
    if out == archive or archive in out.parents:
        sys.exit(f"!! REFUSING: --out {out} is inside the archive {archive}")

    meta = build_day(archive, out, a.day, a.book, greeks_quantum=a.greeks_quantum,
                     pack_minutes=a.pack_minutes, limit=a.limit, verify=not a.no_verify)
    print(f"day={meta['day']} book={meta['book']}  T={meta['T']:,}  C={meta['C']}  "
          f"rows={meta['rows']:,}  {meta['build_seconds']} s")
    print(f"packs : {len(meta['packs'])} files, {meta['pack_bytes_in']/2**20:.1f} MB -> "
          f"{meta['pack_bytes_out']/2**20:.1f} MB")
    for f, m in meta["fields"].items():
        q = f"quantised 1e-{a.greeks_quantum}, max err {m['max_error']:.1e}" if m["quantised"] else "exact"
        sv = f"  !! {m['scale_violations']} scale violations" if m["scale_violations"] else ""
        print(f"  {f:<14} scale {m['scale']:<9} {q}{sv}")
    if "verify" in meta:
        v = meta["verify"]
        print(f"verify: packs byte-identical={v['packs_byte_identical']} "
              f"({v['packs_decoded']:,} decoded)  cells checked={v['cells_checked']} "
              f"mismatched={v['cells_mismatched']}")


if __name__ == "__main__":
    main()
