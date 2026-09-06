"""[C][T] store reader. Memory-mapped, presence-first, stdlib only.

A gather is a page fault, not a parse (ATRV §2.2). No zstd needed to read:
the hot columns are plain scaled-int arrays; only the packs are compressed,
and nothing on the read path opens a pack.

Two absences, never conflated (ATRV §2.3):
    present[c][t] == 0   the contract was not in the band at t — informative
    value == NULL_I32    the contract was present but this field was null
Neither is ever filled, forward-filled, or interpolated. AT-ATRV-5, 6.
"""

from __future__ import annotations

import json
import mmap
import struct
from functools import lru_cache
from pathlib import Path
from typing import Iterable

from quant.layout import ALL_FIELDS, NULL_I32, STORE_VERSION


class StoreError(RuntimeError):
    pass


class DayStore:
    def __init__(self, path: Path) -> None:
        self.path = Path(path)
        mp = self.path / "meta.json"
        if not mp.is_file():
            raise StoreError(f"no meta.json under {self.path}")
        self.meta = json.loads(mp.read_text())
        if self.meta.get("version") != STORE_VERSION:
            raise StoreError(f"store version {self.meta.get('version')} != {STORE_VERSION}")
        self.T = int(self.meta["T"]); self.C = int(self.meta["C"])
        self.day = self.meta["day"]; self.book = self.meta["book"]
        self._cids = {tuple(c): i for i, c in enumerate(self.meta["contracts"])}
        self._maps: dict[str, mmap.mmap] = {}
        self._files: dict[str, object] = {}
        self._present = self._map("present.u8", 1)
        self._time = self._map("time.i64", 8)
        self._spot = self._map("spot.i32", 4)

    # ---- mapping
    def _map(self, name: str, width: int) -> mmap.mmap:
        p = self.path / name
        if not p.is_file():
            raise StoreError(f"missing {name} under {self.path}")
        fh = open(p, "rb")
        m = mmap.mmap(fh.fileno(), 0, access=mmap.ACCESS_READ)
        self._files[name] = fh; self._maps[name] = m
        return m

    def _field(self, f: str) -> mmap.mmap:
        if f not in ALL_FIELDS:
            raise StoreError(f"unknown field {f!r}")
        m = self._maps.get(f"{f}.i32")
        return m if m is not None else self._map(f"{f}.i32", 4)

    def close(self) -> None:
        for m in self._maps.values():
            m.close()
        for fh in self._files.values():
            fh.close()

    # ---- header
    def scale(self, f: str) -> int:
        return int(self.meta["fields"][f]["scale"])

    def quantised(self, f: str) -> bool:
        return bool(self.meta["fields"][f]["quantised"])

    def contracts(self) -> list[tuple]:
        return [tuple(c) for c in self.meta["contracts"]]

    def contract_index(self, cid: tuple) -> int | None:
        k, s, e = cid
        return self._cids.get((float(k), s, e))

    def find(self, strike: float, side: str) -> int | None:
        """First contract at (strike, side) regardless of expiration — era-1 has one."""
        for (k, s, e), i in self._cids.items():
            if k == float(strike) and s == side:
                return i
        return None

    # ---- axes
    def time_ms(self, t: int) -> int:
        return struct.unpack_from("<q", self._time, 8 * t)[0]

    def times(self) -> list[int]:
        return list(struct.unpack(f"<{self.T}q", self._time[: 8 * self.T]))

    def spot(self, t: int) -> float | None:
        v = struct.unpack_from("<i", self._spot, 4 * t)[0]
        return None if v == NULL_I32 else v / 100.0

    def t_at_or_before(self, ms: int) -> int | None:
        """Largest t with time[t] <= ms. Never interpolates — returns the
        snapshot that was the decision surface at that instant."""
        lo, hi = 0, self.T - 1
        if self.T == 0 or self.time_ms(0) > ms:
            return None
        while lo < hi:
            mid = (lo + hi + 1) // 2
            if self.time_ms(mid) <= ms:
                lo = mid
            else:
                hi = mid - 1
        return lo

    # ---- cells
    def present(self, c: int, t: int) -> bool:
        return self._present[c * self.T + t] == 1

    def value(self, f: str, c: int, t: int) -> int | None:
        """Scaled integer, or None if absent. Presence is checked FIRST."""
        if not self.present(c, t):
            return None
        v = struct.unpack_from("<i", self._field(f), 4 * (c * self.T + t))[0]
        return None if v == NULL_I32 else v

    def series(self, f: str, c: int, t0: int = 0, t1: int | None = None) -> list[int | None]:
        """One contract's contiguous run — the whole reason for the layout."""
        t1 = self.T if t1 is None else min(t1, self.T)
        n = t1 - t0
        base = c * self.T + t0
        raw = struct.unpack_from(f"<{n}i", self._field(f), 4 * base)
        pres = self._present[base: base + n]
        return [None if (p == 0 or v == NULL_I32) else v for v, p in zip(raw, pres)]

    def present_series(self, c: int, t0: int = 0, t1: int | None = None) -> list[bool]:
        t1 = self.T if t1 is None else min(t1, self.T)
        base = c * self.T + t0
        return [b == 1 for b in self._present[base: base + (t1 - t0)]]

    def last_updated_ms(self, c: int, t: int) -> int | None:
        """Absolute epoch ms: stored as an offset from time[t] (build.py)."""
        off = self.value("last_updated", c, t)
        return None if off is None else self.time_ms(t) + off

    # ---- gather + mark
    def gather(self, fields: Iterable[str], cs: Iterable[int],
               t0: int = 0, t1: int | None = None) -> dict:
        cs = list(cs); fields = list(fields)
        return {
            "t0": t0, "t1": self.T if t1 is None else t1,
            "contracts": [self.meta["contracts"][c] for c in cs],
            "values": {f: [self.series(f, c, t0, t1) for c in cs] for f in fields},
            "present": [self.present_series(c, t0, t1) for c in cs],
            "scales": {f: self.scale(f) for f in fields},
        }

    def mark(self, legs: list[tuple[int, int]], field: str = "mid",
             t0: int = 0, t1: int | None = None) -> tuple[list[int | None], list[bool]]:
        """mark[t] = Σ qty_i × price_i(t), scaled units. Withheld (None) at any t
        where ANY leg is absent or null — never interpolated (AT-ATRV-6)."""
        t1 = self.T if t1 is None else min(t1, self.T)
        cols = [(q, self.series(field, c, t0, t1)) for c, q in legs]
        n = t1 - t0
        out: list[int | None] = [None] * n
        ok: list[bool] = [False] * n
        for t in range(n):
            s = 0; good = True
            for q, col in cols:
                v = col[t]
                if v is None:
                    good = False; break
                s += q * v
            if good:
                out[t] = s; ok[t] = True
        return out, ok


@lru_cache(maxsize=32)
def open_day(root: str, day: str, book: str) -> DayStore:
    return DayStore(Path(root) / f"day={day}" / f"book={book}")


def list_days(root: Path) -> list[dict]:
    out = []
    for d in sorted(Path(root).glob("day=*")):
        for b in sorted(d.glob("book=*")):
            mp = b / "meta.json"
            if mp.is_file():
                m = json.loads(mp.read_text())
                out.append({"day": m["day"], "book": m["book"], "T": m["T"], "C": m["C"],
                            "greeks_quantum_decimals": m.get("greeks_quantum_decimals")})
    return out
