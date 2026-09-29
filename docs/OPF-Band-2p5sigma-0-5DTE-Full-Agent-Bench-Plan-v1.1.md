# OPF — Full book, SPX and XSP, 0–5 DTE — Full Agent Bench Plan v1.1

**Status:** PLAN — not GO. No seat writes code until Coach accepts this plan.  
**Supersedes:** `docs/OPF-Band-2p5sigma-0-5DTE-Full-Agent-Bench-Plan-v1.0.md` (bytes unchanged). v1.0 remains the plan of spec v0.1.  
**Spec:** `docs/OPF-Band-2p5sigma-0-5DTE-v0_2.md` is the law. `docs/OPF-Band-2p5sigma-0-5DTE-v0_1.md` is the baseline.  
**Cadence finding:** `docs/OPF-Actual-Cadence-Finding-v0_1.md`.  
**Decision:** DL-799 is in commit `46a555f6` with the spec and the cadence finding. DL-799 names two measurements. Coach then required three, before W1. This plan carries three. DL-799 is not rewritten.  
Date: 2026-09-28.  
Machine: StudioOne, `~/Fattail-Labs-mexp2`. **CP-1.** The running collector is not modified to satisfy this plan.

**Standing scope:** nothing is built that spec v0.2 does not name. A finding goes to Coach. It is not built.

**Out of scope (stop if a seed tries):** any Labs control, layout, selector, or default (spec §4). Another restart of `chain_feed`. An edit to the live capture plist. A rebuild of the running band tap. A write into `ssr/live_capture` or `ssr/band_capture` for this program. Charlie and Echo are not seated.

Board: `agents/p-opf-band-2p5sigma/`. Seeds are not issued. W1 is not dispatched.

---

## What changed from v1.0

| | v1.0 | v1.1 |
|---|---|---|
| Spec | v0.1, σ window | v0.2, full listed book for SPX and XSP |
| Coverage | ≥2.5σ both sides | Every listed strike present, with greeks (spec §6) |
| Feed | One serial pass, widen SPX and XSP | Dedicated SPX and XSP workers. Other names stay on the wing window, on their own pass |
| Key | `w{N}` sized to the σ window | New key, named below. Member `w{N}` ladder stays as it is |
| Before W1 | — | Three measurements, recorded in this file |
| Friday | "4 snaps, collector down during regular hours" | Superseded by the read below. v1.0's paragraph stays in v1.0 |
| Monday 2026-09-28 | Not in v1.0 | Regular-hours file count explained below |

---

## Delta, before W1

Read-only Massive client on StudioOne. No Redis write, no archive write. The live feed kept its process. No HTTP 429 in either probe. Fetches used `limit=250`. Byte counts are the compact JSON of the Massive results array (`separators=(",", ":")`). They are the snapshot, not an archive-file wrapper.

Clock: after the close. First probe 20:44 ET. Size and quote poll 20:54–20:55 ET. Capture had already logged `session_end` until `2026-09-29T00:00:00-04:00`.

### 1. Concurrency, rate limit, interval held

Two seconds was the ask. The interval that was held is **2.0 seconds for the SPX + XSP 0DTE pair**, and only for that pair.

| Probe | What ran | Wall | Result |
|---|---|---:|---|
| One book | SPX 2026-09-29 | 0.407 s | 486 contracts, 2 pages |
| Two at once | SPX and XSP 2026-09-29 | 0.59 s | Both completed |
| Four at once | Those two, plus both names for 2026-09-30 | 0.624 s | SPX 2026-09-30 stopped at the 750-contract ceiling. The other three completed. Page cap, not a rate limit |
| Hold | Same pair, every 2.0 s, 24 passes, 48 s, starting 20:44:39 ET | period 2.0 s | 0 overruns, 0 errors |
| All six books | One worker per name, six expirations one after another inside the worker, 20:54 ET | **3.301 s** | SPX's own walk was 3.29 s. The 1,198-contract book took 1.14 s of that |

The six-book pass does not hold two seconds. Spec §1a already says the far books take T1 and T2 when the pass overruns, and the 0DTE path does not yield. W1 builds the 0DTE wake at **2.0 seconds**. T1 stays **15 seconds**. T2 stays **60 seconds**.

### 2. Gigabytes per regular-hours session

Session in this table: **09:30–16:00 ET, 23,400 seconds.** That is the window the file-count comparison uses. Snapshots were taken 20:54 ET on 2026-09-28, so 2026-09-29 is Tuesday's 0DTE book. Trading DTE is counted from Tuesday.

| Name | Expiration | Tue DTE | Cadence | Contracts | Pages | Bytes | Greeks | Fetch |
|---|---|---:|---|---:|---:|---:|---:|---:|
| SPX | 2026-09-29 | 0 | every 0DTE wake | 486 | 2 | 436,610 | 483 | 0.393 s |
| SPX | 2026-09-30 | 1 | 15 s | 1,198 | 5 | 1,108,657 | 1,198 | 1.031 s |
| SPX | 2026-10-01 | 2 | 15 s | 474 | 2 | 421,208 | 472 | 0.391 s |
| SPX | 2026-10-02 | 3 | 60 s | 586 | 3 | 536,297 | 586 | 0.588 s |
| SPX | 2026-10-05 | 4 | 60 s | 424 | 2 | 380,967 | 423 | 0.404 s |
| SPX | 2026-10-06 | 5 | 60 s | 420 | 2 | 368,887 | 417 | 0.395 s |
| XSP | 2026-09-29 | 0 | every 0DTE wake | 552 | 3 | 412,026 | 446 | 0.545 s |
| XSP | 2026-09-30 | 1 | 15 s | 606 | 3 | 542,679 | 606 | 0.586 s |
| XSP | 2026-10-01 | 2 | 15 s | 372 | 2 | 309,056 | 355 | 0.374 s |
| XSP | 2026-10-02 | 3 | 60 s | 480 | 2 | 399,291 | 471 | 0.418 s |
| XSP | 2026-10-05 | 4 | 60 s | 342 | 2 | 280,466 | 330 | 0.353 s |
| XSP | 2026-10-06 | 5 | 60 s | 342 | 2 | 276,749 | 326 | 0.347 s |

Greeks are the after-close count. XSP 2026-09-29 had greeks on 446 of 552 contracts. Tuesday's §6 check is a regular-hours check. This table does not fail that check in advance.

**SPX 2026-09-30 fails spec §1.** 1,198 contracts, five pages, past the 750-contract ceiling. The spec fails that book loud and does not store it short. W1 does not raise the ceiling. The gigabyte rows below show the book both ways: stored, and refused.

Regular hours, both names, decimal GB (bytes / 10⁹):

| 0DTE persist | SPX 2026-09-30 | SPX | XSP | Both |
|---|---|---:|---:|---:|
| Every 2.0 s wake (11,700 snaps) | stored | 8.00 | 6.52 | **14.52** |
| Every 2.0 s wake | refused at 750 | 6.27 | 6.52 | **12.79** |
| Every 7 s (3,343 snaps) | stored | 4.35 | 3.08 | 7.43 |
| Every 7 s | refused at 750 | 2.62 | 3.08 | **5.70** |

T1 is 1,560 snaps and T2 is 390 snaps in every row. The 7-second column is the slow end of the regular-hours archive new-hash median (4.5–7.2 s through 2026-09-25). It is the expected disk if a snap is written when the quote generation changes. The 2-second column is the disk if every wake is stored.

The figure W1 plans disk against, under the ceiling the spec already has, is **12.79 GB per regular-hours session for both names** if quotes move on every 2-second wake, and **about 5.70 GB** if the regular-hours generation stays near 7 seconds. SPX alone at the 2-second wake with the ceiling held is **6.27 GB**. XSP alone is **6.52 GB**.

This collector also writes from midnight until 20:00 ET (Monday's first flat SPX file is `snap-040008180Z.json`, 00:00:08 ET; the last is `snap-235959373Z.json`, 19:59:59 ET) and then sleeps. After 16:59:59 ET the quotes measured below were still, so those later hours are not a second 2-second tape. Size Tuesday from the regular-hours table, and let the quiet hours add a snap only when the quote timestamp moves.

### 3. Massive's generation interval

The quote clock is `last_quote.last_updated`.

On the 2026-09-29 book, the newest quote for SPX and for XSP was **2026-09-28 16:59:59.96 ET**. Inside that same SPX snapshot, quote times run back to 16:23:09 ET. XSP's quotes in that snapshot sit between 16:59:00 and 16:59:59 ET.

Eight polls, 20:54:45 through 20:55:21 ET, about five seconds apart, both names at once: the quote hash and the newest timestamp **did not change**. Zero errors.

A hash taken at 20:44 ET that also folded in delta, gamma, theta, vega, and implied volatility changed on every 2-second sample. That hash is not the quote generation. The quote-and-timestamp hash sat still, and the newest quote was already four hours old.

**Written down:** during this poll Massive was not producing a new quote for these two books. The interval the workers aim at is the rate at which `last_updated` advances. Tonight, after 17:00 ET, that rate was zero. The regular-hours record of a new archive generation remains a median of 4.5–7.2 seconds from 2026-08-18 through 2026-09-25. W1 wakes every 2.0 seconds, because that wake was held, and it writes a snap when the newest quote timestamp changes. A wake with the same timestamp writes nothing.

---

## The key

One key per book:

- `mb:book:I:SPX:{YYYY-MM-DD}`
- `mb:book:I:XSP:{YYYY-MM-DD}`

The value is the full listed snapshot for that expiration. `chain_feed` discovers work from `mb:ladder:` interest, so this prefix stays off that serial pass. The member ladder stays `mb:ladder:{SPX|I:SPX}:{expiration}:w{N}:dual` at the width it has now. A member wings request addresses that ladder key. It does not write `mb:book:`.

---

## Parallel archive

- Live, untouched Tuesday: `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture`
- v0.1 band tap, already running, not this writer: `.../ssr/band_capture` (pid **74138**, tree `~/Fattail-Labs-mexp2-band`)
- v0.2 parallel: `/Volumes/FatTail2TB/fattail-market-data/ssr/fullbook_capture`

Separate launchd label. `LABS_REPO=~/Fattail-Labs-mexp2`. It does not start a second `chain_feed` and it does not stop the live capture. Live capture pid **73887** (cwd `~/Fattail-Labs-mexp2/server`, started 16:53:32 ET) and feed pid **73931** (cwd `~/Fattail-Labs/server`, the one allowed restart) stay up.

---

## Before Tuesday's parallel run

Read on StudioOne, 2026-09-28 after the close. Nothing on the live path was restarted or rewritten for these two notes. The plist repair stands.

### Monday 2026-09-28 — 3,135 regular-hours files

Flat `day=2026-09-28/chain/SPX`, filenames 13:30Z–20:00Z. 3,135 files. Median gap still 2.404 s. Mean gap 7.456 s. 146 gaps over 30 s, totaling about 5,274 s. Zero gaps under 1 s.

Every one of those 146 gaps has another snap inside it (another symbol, or an `exp=` book). The process was not stopped. The pass was busy writing the other books, and the flat SPX file waited.

`day=2026-09-28/PROVENANCE.json`, written at 00:00:01 ET when the day folder was created: `capture_max_dte` 5, `mexp_symbols` the full 18-name list, `root` the live_capture day folder. The status ticks in that folder show one snap counter from 00:01:01 ET through 16:52:50 ET, then a new counter from 16:54:05 ET through 19:59:15 ET. Two processes, one after the other.

Friday's PROVENANCE, by comparison, recorded `capture_max_dte` 1 and mexp symbols SPX and XSP only, and Friday's flat SPX median was 2.32 s with one gap over 30 s. Monday's extra books are the difference.

The same shape continued after the repair. From 16:53:32 ET to 20:00 ET the flat SPX median was 2.435 s, the mean was 7.062 s, and 27 gaps exceeded 30 s. All 27 contain another book's snap. The repaired process then slept at 20:00 ET (`sleep_until=2026-09-29T00:00:00-04:00`). It is asleep now. Pid 73887 is that process.

The repair changed the script path and the working directory to `~/Fattail-Labs-mexp2`. The backup plist and the live plist carry the same environment: `LABS_REPO` mexp2, `LABS_SSR_MAX_DTE=5`, `LABS_SSR_MEXP=on`, all 18 symbols, sleep at 20:00. That environment is what the pass will wake into. This plan does not edit it.

### Friday 2026-09-25 — 8,496 regular-hours files, and four nested snaps

Flat `day=2026-09-25/chain/SPX`: **8,496** regular-hours files, 13:30:02Z through 19:59:53Z, median gap 2.32 s, one gap over 30 s (33 s), zero gaps under 1 s. Archive root in PROVENANCE: `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture/day=2026-09-25`, started 00:00:01 ET, wings 15, provenance `live_capture`.

The status ticks in that same folder are one counter at a time:

| Counter | From | To | Role |
|---|---|---|---|
| 145 → 148,886 | 00:00:52 ET | 10:41:45 ET | Already running at midnight. Opened the day folder. Wrote the morning |
| short restarts | 10:42, 10:45 | | Sequential. The counter drops, then climbs |
| 8 → 70,898 | 11:01:16 ET | 16:09:19 ET | Wrote the rest of the regular-hours session |
| 11 → 3,572 | 16:10:21 ET | 16:25:29 ET | After the close |
| 8, then 5 → 371 | 16:26:21 ET | 16:28:42 ET | The restart that traced `LABS_SSR_MAX_DTE is missing` from `~/Fattail-Labs-mexp2/server/market_data/ssr_live_capture.py` |
| 6 → 23,164 | 16:29:42 ET | 19:59:44 ET | The process whose start the v1.0 plan recorded (pid 42355, lstart 16:29). It wrote the evening |

The four files `chain/SPX/exp=2026-09-25/snap-202621427Z.json` through `snap-202628647Z.json` are 16:26:21–16:28:46 ET. That is the count of four. They are the nested folder during that restart. The flat folder is the regular-hours session, and the 11:01–16:09 process wrote the end of it.

The run script `cd`s to `$LABS_REPO/server` and executes that tree. The plist backed up before the repair already set `LABS_REPO` to mexp2, with the script file still under `~/Fattail-Labs`. A launchd start under that plist runs the mexp2 code. The 16:26 traceback is that file. The regular-hours counters landed in this archive and did not overlap.

Sampled flat snaps, same archive, provenance `live_capture`: 09:30 ET topic `mb:ladder:SPX:2026-09-25:w25:dual` (102 rows); 12:45 ET `mb:ladder:I:SPX:2026-09-25:w15:dual` (62 rows); 15:59 ET `mb:ladder:SPX:2026-09-25:w15:dual` (62 rows). The capture stored the ladder the feed had published.

Two captures have not been writing this flat archive. Friday and Monday both have zero sub-second pairs, and the snap counter never runs as two interleaved series. Since 16:55 ET a second process has been up: the band tap, pid 74138, archive `ssr/band_capture` only. It does not write `ssr/live_capture`.

---

## Sequencing

No phase is dispatched by this plan.

| Phase | When | Who | Packet | Gate |
|---|---|---|---|---|
| **W0** | now, read only | India | Spec v0.2 against this plan: full book, 750 fail-loud, key name, 2.0 s wake, persist on `last_updated`, §4 freeze, CP-1 | **W0-G** the plan names only what v0.2 names, and the three measurements are the ones above |
| **W1** | after W0-G and Coach's acceptance, after the close, or on a tree live launchd does not exec | Alpha, Kilo | Parallel writer. New archive root. New key. 0DTE wake 2.0 s. Snap written when the newest quote timestamp changes. T1 15 s, T2 60 s. Ceiling 750, fail loud, SPX 2026-09-30 included in the test as the book that must fail. Live path untouched | **W1-G** unit tests for the ceiling, the wake, and the unchanged-timestamp skip |
| **W2** | after W1-G, after the close | Alpha | Workers publish `mb:book:`. Member ladder fetch stays clamped. No second feed restart | **W2-G** a reader of `mb:ladder:` still receives the window; `mb:book:` receives the full snapshot |
| **W3** | after W1 | Alpha | `:5055` `/api/books` coverage is spec §6. Labs `main` `snap_files` globs `exp=*/` | **W3-G** curl books for the stored SPX expirations. The refused book is absent and named |
| **W4** | before 09:30 ET Tue 2026-09-29 | Foxtrot | Parallel launchd, `fullbook_capture`, mexp2 tree. Live pid 73887 not killed. Feed pid 73931 not restarted. Band pid 74138 left on its own archive | **W4-G** two archives, live cadence unchanged |
| **W5** | Tue 2026-09-29 regular hours | Kilo, Delta, read only | `docs/OPF-Strike-Band-by-DTE-Analysis-v0_2.md`. Measured pass interval, per-book archive cadence, every listed strike with greeks. 10:30 and 15:30, SPX and XSP, DTE 0–5 | **W5-G** on that report. Clock-gated |
| **W6** | after the close Tuesday | Foxtrot | Swap. Old capture runnable one week. No regular-hours swap | **W6-G** |
| **W7** | Wednesday morning | Delta, Coach | Existing Analyzer expiry control, SPX 3 DTE, full listed book behind it. No new control | **W7-G** Coach's screen |

Lima logs the acceptance and, on the swap day, the swap. The Friday and Monday reads above are the explanation v1.0 owed before the parallel run.

---

## Feed and plist, as left

- One chain feed. Pid 73931. Tree `~/Fattail-Labs`. Interval flag `--interval 2`. After the close, with four topics hot, the pass log showed about 1.8 s. The ~55 s figure remains the ~120-topic pass from earlier that evening, in the cadence finding.
- Live capture pid 73887, tree `~/Fattail-Labs-mexp2`, asleep until midnight ET.
- Band tap pid 74138, tree `~/Fattail-Labs-mexp2-band`, archive `ssr/band_capture`. v0.1 σ window. Not converted to v0.2.
- Plist `ai.fattail.labs.ssr-live-capture`: script and working directory `~/Fattail-Labs-mexp2`. Repair stands.
