# Data capture plan — Structure Surface Replay

**Date:** 2026-08-14 (Friday)  
**Status:** **GO — live tap running** (pre-market dump 09:20 ET). This folder is the standing archive; the tap rolls to the next weekday so every market day accumulates from here.  
**Machine:** this laptop only. Nothing on MiniTwo.  
**Disk:** write-once under `/Volumes/FatTail2TB/fattail-market-data/ssr/` (volume renamed from `sabrant2tb`, DL-367). Never write to `/Volumes/Sabrant 2TB` (other APFS slice).  
**Provenance (live):** `live_capture`

Goal: enough data by Saturday morning to **place a structure, walk the day, and read a distribution out**. Saturday’s proof day is **today**. Named older days are second.

---

## 1. Live tap (first)

A **reader**. It does not call Massive. It samples the OPF / Market Bus plane Options Lab already uses.

The plane is not writing until the existing writers run. On go: start `sym_feed` + `chain_feed` and hold **standing interest** on **SPY 0DTE dual-side**. Same path as Heatmap, not a second fetch.

### Session window

| Phase | Clock (America/New_York) | What we keep |
|---|---|---|
| Pre-market | from go → 09:30 | whatever the plane already has (often held / prior close — labeled, not dressed up as live NBBO) |
| RTH | 09:30 → 16:00 | full cadence |
| Extended | 16:00 → 20:00 | keep going **while the plane still publishes**; if it goes silent, stop and mark `session_end` — do not invent |

### Cadence

| Stream | Interval | Size (today) | Massive cost |
|---|---|---|---|
| 0DTE / next-exp chain snapshot (quotes + **full greeks** as the generation already carries them) | **3–5s from 2026-08-17 open (OD-6)**. Friday **2026-08-14** stays **5-min** as captured. | ~720–1200 snaps / RTH hour at 3–5s | **$0 extra** — `chain_feed` already refreshes ~2s; this is disk cadence |
| SPY / VIX / VIX1D **marks** (last/mid on the bus) | **every 5 seconds** (same as `sym_feed`) | a few MB of JSONL | none (tap is a read) |

**OD-6 (Coach 2026-08-16):** StudioOne’s prior interval is immaterial. From Monday **2026-08-17** open, StudioOne **must** write OPF chain snaps with full greeks at **3–5s**. Not deferred. Friday 2026-08-14 remains labeled 5-min and is **not** rewritten. This is the gold plane Strategy Lab bots are tested against.

### Folder (immutable)

`/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture/day=2026-08-14/`

| Path | Rule |
|---|---|
| `chain/snap-HHMMSSZ.json` | one file per snapshot, never rewritten |
| `marks/spy.jsonl` | append-only |
| `marks/vix.jsonl` | append-only |
| `marks/vix1d.jsonl` | append-only |
| `MANIFEST.json` | written once at end |
| `CHECKLIST.partial.json` | while live |
| `CHECKLIST.json` | written once at end |

No overwrites. A bad snap is a new file or a named hole, never a rewrite.

### Holes — named, not filled

| Wanted | On the plane? | What we do |
|---|---|---|
| SPY **per-print** trades | **No.** Bus has last/mid, not the tape. | Live: marks only. **After 16:00** pull today’s prints with existing `fetch_trades_day` into the same day folder as **`massive_trades_day`**, not `live_capture`. |
| Full listed 0DTE book | **No.** Plane holds the **wings window** (~spot ± wings), not every strike. | Persist that window. Missing far strikes = **NOT TRADED**, not invented. |
| Native VIX / VIX1D | Maybe. Universe maps `I:VIX` / `I:VIX1D`, proxy **VIXY**. Index tape is often **403**. | Write whatever mark arrives. If source is `massive_proxy_v1` / VIXY, the file says so. Silent proxy → **VIX NO**. |
| Greeks / IV | **Yes, if** Massive put them on the snapshot (`delta` / `gamma` / `theta` / `vega`, `iv`). | Persist as carried. Blank IV on a snap → that snap is **IV NO**, we do not backfill. |

---

## 2. Historical (second, after the tap is writing)

SPY **prints are already on disk** (2004–2026). Do **not** re-download those.

Massive **does not** give a dated historical 0DTE snapshot in the current client (live snapshot only). Older days: **tape yes, opening chain likely NO**. Saturday’s engine proof is **today**. Older days still get tape + whatever VIX we can lawfully read; chain hole stays **NO CHAIN**.

### Build set (~10)

| Day | Why |
|---|---|
| 2024-08-05 | Unwind crash — fat left tail |
| 2024-08-08 | Recovery trend after that crash |
| 2024-07-11 | CPI trend day |
| 2024-09-18 | FOMC, two-way |
| 2024-11-06 | Post-election gap |
| 2024-12-18 | FOMC |
| 2026-08-04 | Recent — range from tape on pull |
| 2026-08-05 | Recent |
| 2026-08-06 | Recent |
| 2026-08-07 | Recent |

### Holdout (do not tune on these)

2026-08-10, 2026-08-11, 2026-08-12, and **today** after close.

**2026-08-13 tape is already broken** (3,037 prints, pulled at 05:11 ET). Checklist = **NO TAPE** unless a later lawful re-pull writes a **new** folder — never overwrite the broken part.

Each historical day uses the same checklist. VIX1D history is a known hole (no stable Yahoo series; Massive index often 403).

---

## 3. Completeness (per day)

Four bits. No patching.

| Bit | OK means | Hole name |
|---|---|---|
| **TAPE** | SPY prints exist and look like a full session (or we only claim marks) | **NO TAPE** |
| **CHAIN** | at least one 0DTE generation with listed strikes + quotes | **NOT TRADED** / **NO CHAIN** |
| **IV** | opening snap has per-contract `iv` | **IV NO** |
| **VIX** | native or **labeled** proxy | **VIX NO** |

A day with a hole is marked. We never interpolate.

---

## 4. Status messages

Once the tap is up, post in the capture chat **every 15 minutes** until extended ends or the plane dies:

- clock phase (pre / RTH / extended)
- chain snaps written / last `as_of`
- SPY / VIX / VIX1D last mark + source
- any new hole (feed idle, empty generation, proxy, silent IV)

End-of-day: one final checklist for `day=2026-08-14`.

---

## Order on go

1. Start existing `sym_feed` + `chain_feed`, hold SPY 0DTE interest, start the writer, dump **pre-market now**.
2. 15-minute status in chat.
3. Historical day list + tape inventory **after** the tap is confirmed writing.
4. After 16:00: Massive `fetch_trades_day` for today → same folder, separate provenance. Extended keeps sampling until 20:00 or silence.

---

## Standing archive (from today)

Today’s folder is the first day of the standing archive. The tap process **rolls to the next weekday at 04:00 ET** (`day=YYYY-MM-DD/` write-once). Next week it runs **every market day** automatically as long as this process (or the local launchd wrapper) is up. MiniTwo is not involved.

**Coach (2026-08-15):** collect an **entire week** this coming week (Mon 2026-08-17 → Fri 2026-08-21), **then continue continuously**, **then** turn the archive into a proper testing lab. Do not stop the tap after five days. The lab is after gold is accumulating, not instead of collecting.

**Capture host (Coach 2026-08-15):** **StudioOne** — dedicated, always-on. Not this laptop (StudioTwo), not MiniTwo. One writer. See [`docs/ops/StudioOne-SSR-Live-Capture.md`](../docs/ops/StudioOne-SSR-Live-Capture.md).

StudioOne must be **awake** and **Sabrant mounted** Mon–Fri 04:00–20:00 ET. launchd `ai.fattail.labs.ssr-live-capture` starts the tap at 04:00 weekdays. Feeds (`sym_feed` + `chain_feed`) start from `scripts/ssr-live-capture-run.sh`. Unload the StudioTwo job before the first StudioOne fire.

Writer: `server/market_data/ssr_live_capture.py`  
Inventory: `data/ssr-historical-inventory.md`
