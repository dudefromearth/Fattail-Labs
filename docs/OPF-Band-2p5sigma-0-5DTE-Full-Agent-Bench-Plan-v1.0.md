# OPF 2.5σ band 0–5 DTE — Full Agent Bench Plan v1.0

**Status:** PLAN — not GO. No seat writes code until Coach accepts this plan.  
**Spec:** `docs/OPF-Band-2p5sigma-0-5DTE-v0_1.md`  
**Source analysis:** `docs/OPF-Strike-Band-by-DTE-Analysis-v0_1.md`  
**Tree:** StudioOne `~/Fattail-Labs-mexp2` (running collector, HEAD `a91302a2`). API `:5055` in that tree. FatTail-Labs `main` only for `snap_files` glob.  
**CP-1:** running collector never modified in place. Parallel capture one full RTH day, swap after close (Sep 7 discipline). Nothing changes during RTH.  
**Scope rule:** nothing is built that the spec does not name. Findings go to Coach; they are not built.

**Out of scope (stop if a seed tries):** any Labs control, layout, selector, default (spec §4). Charlie and Echo are not seated. Runner/Analyzer/Strategy Lab packets that add UI are forbidden.

Board: `agents/p-opf-band-2p5sigma/`.

---

## Friday 2026-09-25 — 4 snaps (explained before swap)

**Fact.** Live tap pid **42355** `lstart = Fri Sep 25 16:29:09 2026`. Coverage: SPX 0DTE **4** snaps, all after 16:26 ET. The day was missed because the collector **was not running during RTH**.

**Err log (`ssr-live-capture.err.log`, last write 16:26 that day):**

1. Repeated `ModuleNotFoundError: market_data.ssr_session_map` from **`/Users/ernie/Fattail-Labs/server/market_data/ssr_live_capture.py`** — launchd `WorkingDirectory` is still Fattail-Labs while `LABS_REPO` is mexp2; a kickstart without the env ran the **wrong tree**.
2. `FileNotFoundError` under `/Volumes/FatTail2TB/fattail-market-data/ssr/...` — disk not mounted.
3. `redis.exceptions.ConnectionError: 127.0.0.1:6379 Connection refused`.
4. After mexp2 started: `RuntimeError: LABS_SSR_MAX_DTE is missing` until the plist env was set.
5. Process then stayed up (Mon 10:30 books exist). Out log at 16:29: `premarket_dump` / `phase=extended` / `snaps: 6` / `CHAIN: NO CHAIN` for SPX.

**Why `w15` vs `w25`.** mexp2 `.env` has `LABS_SSR_WINGS=15`. Capture looks up `w{N}` then **15 and 25**. Friday’s few snaps used `w15`. Monday 0DTE used `w25` because that ladder was the one with rows (Labs/Analyzer interest). Spec §1 retires the count model; the plan must not reintroduce a fallback ladder that is narrower than `active(t)`.

**Before Tuesday parallel and before swap:** Foxtrot seed F0 confirms (read-only, then after-close only): Redis up, FatTail2TB mounted, launchd `ProgramArguments` + `WorkingDirectory` + `LABS_REPO` all point at **mexp2**, `LABS_SSR_MAX_DTE` present, no second tap on the live path. Alpha does not edit the live plist during RTH.

---

## Sequencing

| Phase | When | Who | Packet | Gate |
|-------|------|-----|--------|------|
| **W0** | immediately (no code) | India, Hotel | Spec alignment: band math, feed topic choice, CP-1 parallel path, §4 consumer freeze | **W0-G** Delta: spec names only what will be built; Q1 is 2.5σ everywhere |
| **W1** | after W0-G, **after close** or on a branch not loaded by live launchd | Alpha, Kilo | Capture: `σ_T`, follow, ratchet, IV hold, env keys. Parallel writer to a **new archive root**. Live path untouched | **W1-G** unit tests: 0DTE and 5DTE windows; degenerate IV holds last good; ratchet union |
| **W2** | after W1-G, after close | Alpha | Feed publishes a per-expiry window that **covers `active(t)`**. No `w15`/`w25` fallback. Archive never stores a subset because Redis was narrower | **W2-G** fixture: `active(t)` ⊆ published ladder |
| **W3** | after W1 (can overlap W2) | Alpha | `:5055` document `expiration=`; add `/api/books?symbol=&date=`; Labs `main` `snap_files` globs `exp=*/`; docs site | **W3-G** curl coverage/fetch/books for six SPX books; Labs reader lists extra books |
| **W4** | after W1–W3 G | Foxtrot | Parallel launchd **beside** live, different archive path, mexp2 tree only. Starts **before 09:30 Tue 2026-09-29**. Live tap pid 42355 not killed | **W4-G** two writers, two roots; live snap cadence unchanged |
| **W5** | Tue 2026-09-29 RTH | Kilo + Delta (read-only) | Evidence: Part 2 rerun on **parallel** archive → `docs/OPF-Strike-Band-by-DTE-Analysis-v0_2.md`. 10:30 and 15:30, SPX+XSP, DTE 0–5, ≥2.5σ both sides; one ratchet row (spot moved, trailing strikes remain). Storage row-writes vs analysis estimate | **W5-G** PASS only on that report |
| **W6** | **after close** Tue | Foxtrot | Swap: parallel becomes live path. Old capture kept runnable **one week**. No RTH swap | **W6-G** live writes 2.5σ books; old command documented |
| **W7** | Wed morning | Delta, Coach AP-1 | Analyzer (existing expiry UI) places a 2.5σ fly on SPX 3 DTE from live feed. No new control | **W7-G** Coach screen |

Lima: DL the GO, the Friday miss, and the swap. Charlie/Echo: **not seated**.

---

## Feed topic (W0 India, then W2)

Spec §2 leaves the Redis shape to the plan. **Proposal for W0 (not code):** keep `mb:ladder:{SYM}:{exp}:w{N}:dual` but set `N` to the listed-strike count of `active(t)` that capture (or a strike-range fetch that is then clipped to `active(t)`). Do **not** filter a too-narrow `w15`/`w25` on the way in. If India prefers a `lo`/`hi` topic, that is the finding; seats do not invent a third bus.

---

## Parallel path (named)

- Live (untouched Tue): existing `LABS_MARKET_DATA_ROOT/.../ssr/live_capture`
- Parallel: a **new** directory name under the same disk (exact path in Foxtrot seed F1; not the live folder). Process: separate launchd label, `LABS_REPO=~/Fattail-Labs-mexp2`, does not steal `chain_feed` (CP-1). Interest topics for the parallel tap must not starve the live tap — W0 India flags if one Redis interest set cannot serve two windows; if so, **finding for Coach**, not a silent second Massive client.

---

## Seeds (pasteable; no execution until GO)

See `agents/p-opf-band-2p5sigma/seeds/`.

| Seed | Agent | Files in scope (mexp2 unless noted) |
|------|-------|--------------------------------------|
| I0 | India | spec + analysis only (read) |
| H0 | Hotel | T_σ, ATM IV degenerate hold (read) |
| A1 | Alpha | `ssr_mexp_capture.py`, `ssr_live_capture.py` band; tests |
| A2 | Alpha | `chain_feed` / ladder fetch cover `active(t)` |
| A3 | Alpha | `ssr_archive_read.py` `/api/books`; docs HTML; **FatTail-Labs main** `snap_files` only |
| F0 | Foxtrot | read-only health of live tap (Redis, disk, plist, MAX_DTE) |
| F1 | Foxtrot | parallel launchd + path |
| F2 | Foxtrot | after-close swap |
| K1 | Kilo | characterization tests with A1 |
| K2 | Kilo | analysis v0.2 harness (API only) |
| D\* | Delta | each W\*-G |
| L1 | Lima | DL |

---

## Dispatch

**Not dispatched.** Coach accepts this plan, then Juliet sequences W0. First code is A1 **after close** or on a tree the live launchd does not exec.
