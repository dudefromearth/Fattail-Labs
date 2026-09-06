"""Store layout shared by the builder and the reader. Versioned.

<root>/day=YYYY-MM-DD/book=<SYMBOL>/
    meta.json        header: version, day, book, T, C, contracts, fields, scales
    time.i64         T x int64 little-endian, epoch ms
    spot.i32         T x int32, spot * 100 (cents)
    present.u8       C*T bytes, 1 = contract was in the band at t
    <field>.i32      C*T int32 LE, contract-major. NULL_I32 = value absent
    packs/           pack-HHMM.bin.zst — original snapshot BYTES, length-prefixed

Contract identity is (strike, side, expiration). Era-1 rows carry `side`,
not `right`; expiration lives on the snapshot, not the row. Keying on the
wrong name collapses calls and puts into one id — which is exactly what the
Track A experiments did, and why the builder is written against the real
shape rather than the assumed one.
"""

from __future__ import annotations

STORE_VERSION = 1

# Fields carried into the hot store. Quotes are exact on their tick grid;
# greeks and iv are QUANTISED at LABS_QUANT_GREEKS_QUANTUM decimals (declared,
# rounded, max error recorded). Counters are integers.
QUOTE_FIELDS = ("mid", "bid", "ask")
GREEK_FIELDS = ("delta", "gamma", "theta", "vega", "iv")
COUNT_FIELDS = ("volume", "open_interest")
STAMP_FIELDS = ("last_updated",)
ALL_FIELDS = QUOTE_FIELDS + GREEK_FIELDS + COUNT_FIELDS + STAMP_FIELDS

# Quote scale: mids sit on a half-cent grid in the real archive (bid+ask)/2,
# so 1000 is exact for all three. Inferred scale would find this too; it is
# pinned so two builds of the same day are byte-identical (AT-ATRV-1).
QUOTE_SCALE = 1000

# int32 sentinel for "this field was null on this row". Distinct from
# present=0 ("this contract was not in the band"). Both are information.
NULL_I32 = -2_147_483_648


def side_of(row: dict) -> str | None:
    s = row.get("side") or row.get("right")
    if s is None:
        return None
    s = str(s).strip().upper()
    if s in ("C", "CALL"):
        return "C"
    if s in ("P", "PUT"):
        return "P"
    return s or None
