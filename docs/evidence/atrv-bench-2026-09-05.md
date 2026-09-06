# ATRV Track A — measurement note, 2026-09-05/06

**Status: MEASUREMENT NOTE. Not a spec. Not product law.** Nothing here amends ATRV,
SSR-MEXP, QLAB or AZ-ALGO. Anything that should, goes through Foxtrot (host/format),
Sheldon (types touching estimators), Coach, and a decision-log entry — not through this file.

**What this is:** the first numbers from the real era-1 archive, with host, script sha,
file set and run conditions attached, so they can be cited instead of remembered. Every
figure is tagged:

| Tag | Meaning |
|---|---|
| **MEASURED** | produced by a script in this repo, on the named host, output on disk |
| **CORRECTED** | arithmetic on MEASURED per-day figures; not a rerun |
| **MODELLED** | arithmetic from assumptions; no file behind it |
| **PENDING** | script committed, run not yet made |
| **RETRACTED** | was asserted, then falsified by a MEASURED figure |

---

## 0. Environment

| | |
|---|---|
| Host | **StudioOne** — Mac Studio M1 Max, 32 GB. **The collector.** Every run was read-only and capture was not observed to be affected |
| Corpus | `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture`, era-1 layout `day=D/chain/<SYM>/snap-*.json` |
| Days | `2026-09-01` … `2026-09-04` (Tue–Fri). `2026-09-05` is a Saturday and is correctly empty |
| Python | 3.x system; `zstandard 0.25.0` installed for jobs 2–4 |
| Tree at run time | `d756df4` for the probe / encode / layout runs; the first bench ran at `7bd496e` |
| Raw outputs | `docs/evidence/{atrv-bench-era1,mexp-field-probe,atrv-encode,atrv-layout-warm,atrv-layout-cold}.{txt,json}` — **on StudioOne, not yet committed** |

Cache state: **warm** throughout. `sudo purge` requires a password and was not run, so
no figure below is a true cold number. Where cold matters it is said.

---

## 1. Traversal cost — what dominates

`scripts/atrv-bench.py` @ `7bd496e` (later `8e9b6da`, `68d1473`) · full scan, `mid`, 5 days

| Day | Files | Full scan | read / parse / open % | 1-contract waste |
|---|---|---|---|---|
| 09-01 | 217,793 | 147 s | 59.5 / 25.3 / 12.7 | 17,628× |
| 09-02 | 330,224 | 251 s | 50.3 / 23.2 / 24.3 | 13,606× |
| 09-03 | 74,609 | 43 s | 65.0 / 27.5 / 5.1 | 8,780× |
| 09-04 | 261,019 | 180 s | 46.7 / 26.2 / 24.8 | 17,109× |

**MEASURED.** Parse failures: 0. Coverage on days with files ≥ 99.8%.

**Dominance, mean over the four days with files: read 55.4% · parse 25.6% · open 16.7%.**
**CORRECTED** — the script as run averaged in the empty Saturday and printed 44.3%; fixed in
`8e9b6da`. The per-day figures above are unaffected.

**RETRACTED by this run:** "parse-dominated, ~82%" (QLAB §3, DL-674, ATRV §13.1 — all
marked *modelled* at the time, from a smoke fixture). The M4-over-M1-Max argument that
rested on it is void. It does not transfer to the M1 Max either — `read()` here is storage
I/O, not memory bandwidth.

**How to read "read dominates."** 0.38 ms per file across 330k files is consistent with
per-file overhead, not byte throughput. §3 below tests which.

**File count.** 74k–330k files/day against a model of ~16k/day/symbol (SSR-MEXP §5.1).
At ~11,700 snapshots per book-day that implies 6–28 books per day. **MEASURED count,
MODELLED interpretation** — OD-2 owns the reconciliation.

---

## 2. What the archive carries

`scripts/mexp-field-probe.py` @ `d756df4` · 3 days, sampled snapshots, structure only

| Field | Archive | Consequence |
|---|---|---|
| `bid_size` / `ask_size` | **absent** | fill-probability model cannot be fitted on era-1 |
| `sip_timestamp` | **absent** | quote age unknown on era-1 |
| `last_trade`, `day` OHLC | **absent** | no intraperiod bound on era-1 |
| `delta gamma theta vega iv` | present | greeks archived as quoted |
| `expiration` | **present** (specs said absent) | see below |

**MEASURED.** Confirms SSR-MEXP AT-MEXP-16/20, ATRV §3.6 `fidelity: era1_no_depth`,
AT-ATRV-29, and AZ-ALGO E50 **as written**. After-tax §14 waits on era-2. Package `PaR`
on era-1 remains a lookup.

**`expiration` present in the payload is not era-2.** The era distinction is the *path*
(`exp=YYYY-MM-DD/`), not a row field, and a present field is not multiple expirations
captured. Distinct-expiration count per day is **PENDING** (`atrv-encode-experiment.py`
now reports it). AT-MEXP-13/14 stand.

---

## 3. Layout — pack, compress, or both

`scripts/atrv-layout-experiment.py` @ `d756df4` · 20,000 snapshots, pack=30, zstd,
**all books concatenated** (book-major order — fine for scan timing, not for a time axis)

| Layout | Files | On disk | Warm scan | "Cold" scan* |
|---|---|---|---|---|
| A baseline (loose JSON) | 20,000 | 450 MB | 1.00× (4.23 s) | 1.00× (8.41 s) |
| B compressed per file | 20,000 | — | **0.67×** (slower) | 1.36× |
| C packed ×30 | 667 | 450 MB | **1.17×** | **2.27×** |
| D packed + compressed | 667 | **30 MB** | — | — |

**MEASURED.** *"Cold" = no purge; page cache partially evicted between runs. Baseline slowed
4.23 → 8.41 s. **A true cold run is PENDING** and is expected to widen C's margin.

Byte-roundtrip verified on all four before timing. Row counts equal across layouts.

**Reading.** Packing is the *speed* win (per-file overhead, as §1 suggested). Compression
is the *storage* win (15×) and is slower on a warm cache. They answer different questions
and compose (D). The script's own floor refused to name a mitigation on the 1.17× warm
result — correctly.

**Mark-once in stream: 0.04 ms per snapshot** (500 structures, 400 snapshots timed) —
0.002% of the 2 s budget. **MEASURED.** Scope: a mark for a structure *known when the
snapshot arrives*. It is a registration list on the tap. It does not replace `[C][T]`.

---

## 4. Encoding — lossless size

`scripts/atrv-encode-experiment.py` @ `d756df4` · 3,000 snapshots, ≤400 contracts, zstd

| Form | Size | vs JSON |
|---|---|---|
| JSON as archived | 66.8 MB | 1.0× |
| scaled-int + delta-in-time + varint + zstd | **2.6 MB** | **26.1×** |

**MEASURED**, every field verified exact against the original JSON value.

**float32 does not represent 76.6% of values exactly. MEASURED.** ATRV §2.2's `float32`
is lossy by construction; byte-identical replay (AT-ATRV-20, AT-QLAB-2) cannot pass on it.
**Per-field breakdown is PENDING** — the aggregate hides whether prices (cent grid, unambiguous)
or greeks (need a stated quantum) are the problem. Law until the table exists: quotes are
scaled ints; greeks get an explicit scale or stay out of the byte-identical AT.

**Predictor sweep: RETRACTED as run.** "Strike wins on every field" included `volume` and
`open_interest`, monotone counters that cannot prefer a strike neighbour — a tell. Cause:
snapshots were concatenated book-major, so the time axis was scrambled. Fixed in `3f65c47`
(`--symbol`). **Per-book rerun PENDING.** The synthetic result (planar ≈ 2× on prices and
greeks) is **MODELLED** until then.

**Smoothness is a codec on `present = 1` cells only.** Predicting an absent cell from its
neighbours is interpolation (ATRV AT-ATRV-5/6). Any spec sentence that cites a smoothness
gain carries this sentence with it.

---

## 5. Two arguments made from these numbers, and withdrawn

Recorded here so they are not fished out later.

1. **"The 147–251 s nightly re-read argues for building `[C][T]` in-session."** Withdrawn.
   That figure was measured on **loose JSON files** — the old layout. A nightly transpose
   in a world of packs reads ~11k pack files, not 330k JSON files. The exhibit argues against
   JSON-on-disk, which both designs already abandon. It does not argue against a closed-day
   build. **Pack → `[C][T]` timing is PENDING** (`1e999fe`, `--transpose`); hypothesis on
   record: it is cheap.
2. **"A 6.6 KB columnar write per snapshot is smaller than the 23 KB JSON, so co-write it."**
   Withdrawn. That 6.6 KB is a **moment** — all strikes at one `t`, column-ordered. It is
   still snapshot-major. Writing it in-session does not yield the gather; the transpose is
   still owed. `C` is also not known at 09:31 (the band ratchets), so a live `[C][T]` file
   must grow rows mid-session — a different data structure, **unmeasured**.

What survives from both: **mark-once in stream for declared structures** (§3), and the
**sidecar pattern** — pack is durable and is the recovery path, so a fast copy outside the
socket loop is allowed to be fragile.

---

## 6. What this note settles, and what it opens

**Settles (MEASURED):** transpose waste is real and large · read, not parse, dominates on
loose JSON · depth is absent on era-1 · float32 is lossy on this data · packing beats
compression for speed, compression wins storage, both compose · in-stream marking is free.

**Opens (each with a run attached, not a paragraph):**

| | Question | Run |
|---|---|---|
| **OD-ATRV-5** (proposed) | Hot book encoding — plain scaled-int mmap vs delta+varint. Cannot mmap a varint stream and keep 26× | tier benchmark |
| — | Nightly transpose cost from packs | `--transpose`, PENDING |
| — | Per-field float32 damage; greeks' quantum | table from `atrv-encode.json`, PENDING |
| — | Per-book predictor | `--symbol --predictors`, PENDING |
| — | True cold layout numbers | `sudo purge` + rerun, PENDING |
| **OD-2** | File count vs SSR-MEXP §5.1 model | Foxtrot |

---

## 7. Commit the raw outputs

The `.txt`/`.json` under `docs/evidence/` exist only on StudioOne. They contain timings,
key names and counts — no market values, no secrets — and should be committed from that
host so this note points at bytes rather than at a chat.
