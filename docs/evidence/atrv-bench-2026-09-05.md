# ATRV Track A — measurement note, 2026-09-05/06

*Revised 2026-09-06 after the second StudioOne run (`28a6d22`): four PENDING items closed, one opened.*

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
| Tree at run time | `d756df4` for the probe / encode / layout runs; `4498a02` for transpose, per-field and per-book; the first bench ran at `7bd496e` |
| Raw outputs | **Committed at `28a6d22`** — 15 files under `docs/evidence/`: bench, probe, encode, encode-perfield, encode-perbook, layout-warm, layout-cold, transpose |

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

**Bytes per day. MEASURED** from `atrv-bench-era1.json`:

| Day | Files | Raw JSON | Per file |
|---|---|---|---|
| 09-01 | 217,793 | 4.25 GB | 20.5 KB |
| 09-02 | 330,224 | 7.25 GB | 23.0 KB |
| 09-03 | 74,609 | 1.48 GB | 20.7 KB |
| 09-04 | 261,019 | 5.72 GB | 23.0 KB |

**RETRACTED by this:** SSR-MEXP §5.1's *≈1.6 GB/day* (MODELLED). Measured raw is
**2.7–4.5× that.** The read rate on 09-02 was 7.25 GB / 126 s ≈ **59 MB/s** — far below
what the volume can deliver sequentially, which is the per-file-overhead signature §3 then
confirmed.

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
(`exp=YYYY-MM-DD/`), not a row field. **Distinct expirations captured: 0 — MEASURED**
(`atrv-encode-perbook.txt`). The key exists; the value is empty. Era-1 is 0DTE-only and
labelled as such. AT-MEXP-13/14 stand.

**`last_updated` — a per-row field no spec names. MEASURED present** on every XSP row,
integer, ~1.7e12 magnitude (an epoch-milliseconds timestamp; float32 damages 100% of them,
which is what a 41-bit integer does in a 24-bit mantissa). If this is the vendor's quote
update time it is **ATRV §3.6 gap 2 (quote staleness) on era-1 after all**, under a name
the probe was not looking for. If it is the collector's write time it is nothing. **Semantics
PENDING** — one look at the vendor's field documentation settles it; do not assume.

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

### 3.1 The closed-day transpose — pack → `[C][T]`

`atrv-layout-experiment.py --transpose` @ `4498a02` · XSP, 6,000 snapshots, pack=30, warm

| Source | read + parse + transpose | C | T | 4-leg gather |
|---|---|---|---|---|
| A loose JSON | 3.22 s | 51 | 6,000 | 1.54 ms |
| C packs | **3.02 s** | 51 | 6,000 | 1.63 ms |
| D packs + zstd | 3.10 s | 51 | 6,000 | 1.61 ms |

**MEASURED. Projected full day: ~6 s from packs.** The nightly transpose is **cheap**, as
the advisor's hypothesis had it. `C` was discovered as it grew — the closed-day answer to
the ratcheting band — and no absent cell was filled.

Scale caveat: XSP is a 51-contract book. A 200-contract SPX book scales roughly linearly —
call it ~25 s. Still nothing. Packs vs loose JSON at 1.07× here is a warm, single-book,
6k-file sample — not a storm — and says nothing against §3's 2.27×.

**This closes §5 item 1.** The in-session `[C][T]` argument has no remaining evidence.

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

**Per field — MEASURED** (`atrv-encode-perfield.txt`):

| Field | Inferred scale | float32 damaged |
|---|---|---|
| bid, ask | 100 (cents) | 92.7%, 88.4% |
| mid | 1,000 (half-cents) | 87.0% |
| volume, open_interest | 1 | **0%** — integers survive |
| last_updated | 1 | 100% — a 41-bit integer |
| **delta, gamma, theta, vega, iv** | **10¹⁷ – 10²⁰** | 100% |

**The greek scales are the finding.** The vendor's greeks are float64 with noise far below
any meaningful quantum; "lossless" preserved a gamma of `2.3e-17`. On the per-book run that
made the greeks **98% of the compressed output** (411–720 KB each against ~6 KB for every
quote and counter) and made *delta+varint* (14.3 MB) **larger** than plain int32 (8.6 MB).

So the advisor's split is confirmed and sharpened: **quotes sit on a tick grid, where "exact"
is well-defined and free. Greeks do not, and "lossless" is the wrong standard for a computed
double.** The honest standard is *exact at a declared quantum*, with the max error introduced
reported beside it, and the raw bytes remaining in the pack. `atrv-encode-experiment.py`
@ `19f23d1` implements `--greeks-quantum`; on a fixture with vendor-style noise the ratio
went **11.2× → 101×** at 1e-6 with max error 5.0e-07. **Real-data rerun PENDING.**

**Per-book size, MEASURED:** XSP, 3,000 snapshots — JSON 68.6 MB → **5.1 MB, 13.5×**,
with greek noise intact. That figure is a **floor**; the mixed-book 26.1× is not the
comparable number and is retired.

**Predictor sweep, per book — MEASURED** (`atrv-encode-perbook.txt`, real time axis):

| Field | Winner | Why it makes physical sense |
|---|---|---|
| ask, mid, volume, OI, last_updated | **time** | a quote barely moves in 2 s; counters are monotone |
| bid | strike (by 0.1 KB) | tie |
| delta, gamma, theta, vega, iv | **strike** | a smile is smooth across strikes |

The scrambled-axis result ("strike on every field") is **retired**. The split is the one
Grok predicted from first principles. On quotes the predictors tie at ~6 KB — there is
nothing left to win — so the per-field choice matters only for greeks, and only after their
quantum is declared.

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
   build. **Pack → `[C][T]` timing is now MEASURED at ~6 s/day (§3.1).** Hypothesis held.
   Closed.
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
compression for speed, compression wins storage, both compose · in-stream marking is free ·
**the nightly transpose is ~6 s/day and is not a problem** · era-1 captured one expiration ·
quotes compress to nothing under any predictor; greeks are the whole size question, and
"lossless" is the wrong word for them.

**Opens (each with a run attached, not a paragraph):**

| | Question | Run |
|---|---|---|
| **OD-ATRV-5** (proposed) | Hot book encoding — plain scaled-int mmap vs delta+varint. Cannot mmap a varint stream and keep 26× | tier benchmark |
| — | ~~Nightly transpose cost from packs~~ | **MEASURED ~6 s/day. Closed.** |
| — | ~~Per-field float32 damage~~ | **MEASURED. Closed** — greeks need a quantum |
| — | **Greek quantum** — 1e-6 proposed; Sheldon's call, it touches estimators | rerun with `--greeks-quantum 6`, PENDING |
| — | ~~Per-book predictor~~ | **MEASURED. Closed** — time for quotes, strike for greeks |
| — | `last_updated` semantics — vendor quote time or collector write time? | vendor docs, PENDING |
| — | True cold layout numbers | `sudo purge` + rerun, PENDING (needs a terminal password) |
| **OD-2** | File count **and bytes/day** vs SSR-MEXP §5.1 — both off by 3–20× | Foxtrot |

---

## 7. Raw outputs

Committed from StudioOne at **`28a6d22`** — 15 files under `docs/evidence/`. Timings, key
names and counts only; no market values. This note cites those bytes.
