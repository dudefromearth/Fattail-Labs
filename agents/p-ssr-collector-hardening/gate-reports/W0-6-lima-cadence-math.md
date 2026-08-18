# W0-6 Lima — Cadence, storage, and Massive quota

**Project:** SSR Collector Hardening  
**Agent:** Lima  
**Date:** 2026-08-18 00:20 ET (before RTH 09:30)  
**Host read:** StudioOne cache `~/Library/Caches/fattail-ssr` (read-only SSH from StudioTwo). Gold volume listed, not written.  
**Not done:** no env change, no collector restart, no code, no `Architecture/00-decision-log.md` write.

**Verdict:** **GO** — report complete, cadence unchanged.

---

## 1. History (cited, not invented)

| When | Ruling | Source |
|---|---|---|
| 2026-08-16 | **OD-6 / DL-400:** from Monday **2026-08-17 open**, StudioOne **must** write OPF chain snaps with full greeks at **3–5s**. Default **4s**. Fail-loud outside [3, 5]. Friday **2026-08-14** stays labeled **5-min**, not rewritten. First RTH hour expect 720–1200 snaps (5-min would be ~12). | `Architecture/00-decision-log.md` DL-400 · assessment `docs/Options-Lab-MSC-3D-Surface-Design-Port-Assessment-2026-08-16.md` §6 · `data/ssr-capture-plan.md` OD-6 |
| 2026-08-17 | **DL-428 (Coach):** gold tap is **2–5s**, default **2s**. **5-min is forbidden.** Collect every enabled Admin universe symbol. Pre 04:00–09:30, RTH 09:30–16:00, extended 16:00–20:00. `LABS_SSR_CHAIN_EVERY_S` fail-loud outside [2, 5]. **Supersedes the cadence band in DL-400.** Monday 2026-08-17 is a hole (tap never started). | `Architecture/00-decision-log.md` DL-428 · `server/market_data/ssr_live_capture.py` `CHAIN_EVERY_S_*` · `scripts/ssr-live-capture-run.sh` default `2` · `server/tests/test_ssr_live_capture_cadence.py` |
| 2026-08-17 | **DL-430** briefly set weekday wake to 08:00 (superseded). Same 2–5s cadence. | DL-430 |
| 2026-08-17 | **DL-431 max published window:** do not shrink the clock. Massive pre **04:00–09:30**, RTH **09:30–16:00**, after **16:00–20:00**. Cboe overnight GTH (SPX / XSP / VIX / RUT) **20:15–09:25** Sun–Thu. Cboe equity GTH (from 2026-08-17) **07:30–09:25** + Curb **16:00–16:15**. Sleep **only** Friday 20:00 → Sunday 20:15. Weeknights stay up (`phase=gth`). **Supersedes the 08:00 wake in DL-430.** | DL-431 · `phase_at` / `next_wake` in `ssr_live_capture.py` |

Coach stamp (2026-08-18, verbatim): cadence is 2s; original spec was 3–5s; **confirm which is intended before RTH and size disk + provider quota**; do not change cadence without the math. Cadence pick remains **REPORT ONLY** until Coach chooses (`agents/p-ssr-collector-hardening/seeds/W0-0-coach-stamp.md`).

**Doc drift (flag only):** `docs/ops/StudioOne-SSR-Live-Capture.md` still prints OD-6 as 3–5s / default 4. Code + DL-428 are 2–5s / default 2. Specs that still say “3–5s gold” are historical OD-6 language, not the live env.

---

## 2. Current as-built (measured 2026-08-18 ~00:17 ET)

| Item | Value | Evidence |
|---|---|---|
| `LABS_SSR_CHAIN_EVERY_S` | **2** (live process env) | `ps eww` on StudioOne pid 21268 |
| Code default if unset | **2.0**; fail-loud outside [2, 5] | `ssr_live_capture.chain_every_s` · test `test_chain_every_s_default_is_two` |
| `LABS_SSR_WINGS` | **15** (live) | same process env; `CADENCE.json` `wings: 15` |
| `chain_feed` | `--interval 2` | pid 21274 |
| `sym_feed` | `--interval 5` | pid 21272 |
| Universe in `CADENCE.json` / `PROVENANCE.json` | 20 names including **VIX, VIX1D** | cache `day=2026-08-18` |
| Tradeable chain symbols | **18** (reference skipped) | `chain_rows()` · 18 dirs under `cache/.../chain/` |
| Chain set | AAPL AMZN GLD GOOGL IWM META MSFT NVDA QQQ SLV SPX SPY TLT TSLA UNG USO XLF XSP | measured dirs + migration `085_market_symbol_universe_curate.sql` (VIX/VIX1D are `role=reference`, `087`) |
| GTH polling | **all 18 every cycle** | 420 snaps/symbol, same UTC name `snap-041755198Z.json` |
| Phase | `gth` | newest snap `phase` |
| Redis interest | **20** `mb:ladder:…:w15:dual` keys | `redis-cli --scan` (read-only) |
| Dual extra | `SPX` **and** `I:SPX`; `XSP` **and** `I:XSP` | same scan. UNG/USO interest on **2026-08-19** (next listed exp) |
| Write path | local SSD cache first; gold copy **off** | cache `day=2026-08-18` **67M**; gold same day **52K** (provenance only) |
| Tap vs Massive | tap is Redis **reader**. `write_snap` / `store.get_json` only. | module docstring + `capture_chain` |

**Coach-observed overnight chains** (stamp §1; **not** a session map yet): **SPX, XSP, IWM, USO**. Treat as Coach observation to size against until the map is config.

**Measured this GTH session** (label: observation, not law): newest snaps with a generation — **IWM, QQQ, SPY, UNG, USO, XSP**. SPX has both full snaps (~19.7 KB) and a newest **NO CHAIN** (263 B). Eleven names are hole-only tonight. Cboe text in DL-431 names SPX/XSP (and VIX/RUT, not chained here); QQQ/SPY/UNG overnight are **measured**, not Coach-map.

Monday `day=2026-08-17` cache is empty chain dirs (88K) — matches DL-428 “Monday is a hole.”

---

## 3. Disk math

### 3.1 Bytes per snap — MEASURED

Read-only walk of StudioOne cache `day=2026-08-18/chain` (7,560 files, 43,742,300 bytes). No gold-path write.

| Class | Bytes | How |
|---|---|---|
| Hole (`NO CHAIN …`, `generation: null`) | **265** avg (263–269) | 5,255 files `< 2 KB` |
| Typical **full** generation (wings=15, compact `dump_snap`, ~62 rows) | **19,300** planning | newest liquid: IWM 19,044 · QQQ 19,273 · SPY 19,563 · USO 19,068 · XSP 19,655 · (SPX when full 19,686). Mean ≈ 19.3 KB |
| Thin book (UNG) | **11,850** | 42 rows |
| Observed GTH mix tonight | **104,148 B / cycle** (18 files) | sum of per-symbol averages |

Friday **2026-08-14** gold (different era: 5-min, 129 files, avg **47,489 B**) is **not** used below. As-built payload class is **wings=15 / ~19.3 KB**. If `LABS_SSR_WINGS` later returns to code default 25, rescale disk ~1.6–2.5×; do not mix that into this table.

Marks are a rounding error next to chain: 1.0 MB in ~18 min GTH (~80 MB / 24 h at 5 s). Ignored in GB tables.

**Assumptions for projections**

- RTH and Massive published window (04:00–20:00): **18 full** @ 19,300 B.  
- Overnight GTH all-18: **Coach mix** = 4 full + 14 hole = **80,910 B/cycle** (and a worst row of 18 full).  
- Phase-aware: **18** names 04:00–20:00; **4 Coach names** 20:00–04:00; no hole files out of session. Pre/extended stay all-18 until a session map exists.  
- Windows: RTH **6.5 h** (09:30–16:00) = 23,400 s. Full published weekday = **16 h** (04:00–20:00) + **8 h** overnight GTH (20:00–04:00) = **24 h** Mon–Thu. Friday is 16 h then sleep (DL-431).  
- GB = 10⁹ bytes. Uncompressed JSON as written (no P6 rollup).

### 3.2 One RTH day (09:30–16:00 ET)

Phase-aware does **not** change RTH (all 18 in session).

| Cadence | Cycles | Snaps (×18) | Disk, 18 full |
|---|---:|---:|---:|
| **2 s** (live) | 11,700 | 210,600 | **4.06 GB** |
| 3 s | 7,800 | 140,400 | 2.71 GB |
| 4 s | 5,850 | 105,300 | 2.03 GB |
| 5 s | 4,680 | 84,240 | 1.63 GB |

### 3.3 One full published weekday (04:00–20:00 + overnight GTH)

| Cadence | 16 h · 18 full | 8 h GTH · all-18 Coach mix | 8 h GTH · phase-aware 4 | **Day all-18 mix** | **Day phase-aware** | Day worst (18 full all night) |
|---|---:|---:|---:|---:|---:|---:|
| **2 s** | 10.01 GB | 1.17 GB | 1.11 GB | **11.17 GB** | **11.12 GB** | 15.01 GB |
| 3 s | 6.67 GB | 0.78 GB | 0.74 GB | 7.45 GB | 7.41 GB | 10.01 GB |
| 4 s | 5.00 GB | 0.58 GB | 0.56 GB | 5.59 GB | 5.56 GB | 7.50 GB |
| 5 s | 4.00 GB | 0.47 GB | 0.44 GB | 4.47 GB | 4.45 GB | 6.00 GB |

Measured GTH mix tonight (6 full-ish + holes, 104 KB/cycle) would put the 2 s overnight slice at **~1.50 GB** instead of 1.17 GB. Still a ~12 GB weekday.

**Phase-aware disk win is negligible** (~50 MB/night vs Coach mix). Hole files are 265 B. The session map is not a storage project.

Sanity: cache `day=2026-08-18` was **67M** after ~18 min of mixed GTH (~0.22 GB/h). That rate × 8 h GTH ≈ 1.8 GB, in band with the 1.2–1.5 GB overnight column (plus marks + FS).

**Week at live 2 s (phase-aware):** 4 × 11.12 + Friday 10.01 ≈ **55 GB**. A 22-day month ≈ **240 GB** raw. Gold volume is 2 TB. Retention/compress is P6, not a reason to move cadence tonight.

---

## 4. Provider quota (Massive)

**Tap = $0 extra Massive.** `ssr_live_capture` only `GET`s Redis generations the plane already holds (`store.get_json` on `mb:ladder:…`). Dashboard `:5055` is also a disk reader (DL-429).

**Sole chain writer:** `python -m market_data.chain_feed --interval 2` (live). One uncached ladder per **interest topic** per tick (`chain_feed.py` `tick()` → `cl._fetch_ladder_uncached`).

Each uncached fetch is **two** Massive HTTP calls today (`_probe_spot` sample + windowed `_pull`; both `record_massive_call(1)` in `server/routes/chain_ladder.py`). Size the **topic × interval** first; HTTP ≈ 2× that.

**Live interest count = 20** (SCAN 2026-08-18 00:19 ET). That is 18 tradeable names + dual `I:SPX` / `I:XSP`. Tap `touch_interest` every 15 s (`INTEREST_EVERY_S`) on every `ladder_topics` key keeps the set warm (`interest_grace_s` default 45).

Cadence of **disk** (`LABS_SSR_CHAIN_EVERY_S`) does **not** change this table. Moving the tap to 3 s or 5 s leaves `chain_feed` at 2 s and the 20 keys warm.

| Window | `chain_feed` ticks @ 2 s | Ladder fetches (×20 topics) | HTTP (×2) |
|---|---:|---:|---:|
| RTH 6.5 h | 11,700 | **234,000** | 468,000 |
| 16 h published | 28,800 | 576,000 | 1,152,000 |
| 8 h GTH all-18 (20 topics) | 14,400 | **288,000** | 576,000 |
| 8 h GTH phase-aware 4 names → **6 topics** (SPX, I:SPX, XSP, I:XSP, IWM, USO) | 14,400 | **86,400** | 172,800 |
| Mon–Thu 24 h all-18 | 43,200 | **864,000** | 1,728,000 |

Overnight quota lever is **stop touching interest** for out-of-session names (then keys expire). Writing fewer hole JSON files does not cut Massive. Dual product+feed keys for SPX/XSP are as-built double fetches of the same chain — note for a later feed hygiene packet, not a cadence change.

No Massive plan dollar cap is on file in this repo. This report sizes **calls**, not invoices.

---

## 5. Recommendation — **OPINION**

**Keep 2 s until Coach says otherwise.** Do not change `LABS_SSR_CHAIN_EVERY_S`.

Why the math does not force 3 s:

1. DL-428 already picked **2–5 s / default 2 s** over DL-400’s 3–5 s. That is the last Coach cadence law.  
2. **~11 GB/weekday** uncompressed at 2 s is small next to the 2 TB gold volume. 3 s saves ~33% disk (~3.7 GB/day) and **zero** Massive.  
3. Gold plane for Strategy Lab is the finer tick (OD-6 tightened; DL-428 tightened again). Retreat needs a Coach reason other than “the original spec said 3–5.”  
4. The real overnight waste Coach named is **14 out-of-session polls + a red hole counter**, not gigabytes. That is the session map + hole semantics (P1), plus dropping those interest keys so `chain_feed` idles them.

A 3 s pick is defensible only as **fewer files for replay I/O**, labeled convenience, not quota. **OPINION:** do not take it before RTH Tuesday.

---

## 6. Verdict

**GO** — cadence + storage + quota report is complete. Live cadence stays **2 s**. Env not touched. Collector not restarted.

Coach still owns the number. If Coach picks 3, 4, or 5 after this file, that is a new DL and a **between-phase** env cutover — not tonight’s GTH.

---

## DL draft (do not file until India / W0-G)

Suggested next id **DL-432** (newest filed is DL-431). Append-only; Lima will write `Architecture/00-decision-log.md` only after W0-G.

```text
## 2026-08-18 — DL-432 Gold tap cadence remains 2s pending Coach pick

**Decision:** After the W0-6 cadence / storage / quota report
(`agents/p-ssr-collector-hardening/gate-reports/W0-6-lima-cadence-math.md`),
StudioOne stays at **LABS_SSR_CHAIN_EVERY_S=2** (DL-428 band [2, 5];
5-min still forbidden). No env change before RTH 2026-08-18.

Disk at 2s is ~4.1 GB per RTH day and ~11 GB per full published
weekday (18 full snaps @ measured ~19.3 KB, wings=15). Phase-aware
GTH (Coach-observed SPX / XSP / IWM / USO) does not move disk.

Massive is **chain_feed --interval 2 × live interest topics**
(20 keys tonight). The tap is a Redis reader — $0 extra Massive.
Changing disk cadence does not change that product. Overnight
quota drops only if out-of-session interest is released.

Coach may still pick 3s / 4s / 5s after this report; that pick
is a new DL and a between-phase cutover.

**Does not supersede** DL-428 (band + default) or DL-431 (max
published window). Records that the math was done before open
and the live number was left at 2s.
```
