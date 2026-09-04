# Collector Capture Range — Full Agent Bench Plan v1.0

**Date:** 2026-09-04  
**Plan revision:** **v1.0**  
**Canonical filename:** `docs/Collector-Capture-Range-Full-Agent-Bench-Plan-v1.0.md`  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship / cutover)  
**Host:** StudioOne (`StudioOne.local`) · store `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture`  
**Report (WHAT + numbers):** `Specs/COLLECTOR_RANGE.md` — written by the work, not this plan  
**This file is sequencing law.** It does not replace Coach’s four-part prompt.

**Parents:** Arch **28** · SO-AR Spec v0.8 + A1/A2_1 · `ssr_live_capture` as-built · Width Maturity `Specs/wm_out/` (placements.csv, REPORT.md) · **DL-539** · config invariant 2

Coach named this program in the 2026-09-04 prompt. It is **not** LIM. It is **not** a silent exception to the five-module freeze. The prompt **is** the GO to sequence it. Cutover of the **live** collector still requires a **second**, explicit Coach go after a PASS parallel day.

---

## 0. Mission

The capture band is a **fixed listed-strike wing count**. On the Width Maturity bank that left **80 of 224** constant-σ placements `not_listed`, and it spends rows on strikes that only ever quote a nickel.

New standard, Coach (not suggestions):

- Band = **spot ± k·σ_T per tenor**, recomputed on an interval.
- **Hysteresis** recenter when `|spot − band_center| > b·σ_T`.
- **Trailing-edge retention** so a 9:31 0DTE fly is still on the tape at 15:55 on a 1% trend day.
- Collect **nothing irrelevant** (placeholder quotes).
- Record the band **in every snapshot**. Bump schema version.
- Behind a **config flag, default OFF**. Old script stays deployable.
- **Do not** switch the live collector. Coach decides after the parallel day.

Live week of **Sep 8** (Sep 7 is Labor Day, market closed) after **one full parallel day**.

```text
This plan (W0)     landed 2026-09-04 · commit+push · no collector edits
P1  Audit          measure as-built; IV provenance; wm_out misses
P2  Design+sim     k, b, flag OFF, replay every archive day, table vs current
P3  Parallel day   live_capture_v2 beside live_capture · compare_capture.py
P4  Cutover        Coach GO only · config swap · first live-day sanity
```

Delta gates: **PASS / FAIL / BLOCKED**. Never waived. A FAIL on P3 is not a cutover.

---

## 1. Calendar (binding)

| Date | Session | Role |
|------|---------|------|
| **2026-09-04 Fri** | RTH in progress at plan stamp | Plan only. No collector edit. No live flag. |
| **2026-09-05 Sat – 09-06 Sun** | Closed | P1 audit + P2 implement/simulate on archive. |
| **2026-09-07 Mon** | Labor Day — **market closed** | No parallel day. Finish P2 tables. Stage launchd for v2 **disabled**. |
| **2026-09-08 Tue** | First session of the week | **Earliest parallel day.** Both daemons. `compare_capture.py` at 16:30. |
| **2026-09-09+** | After a P3 PASS **and** Coach go | P4 cutover. Not before. |

If P1/P2 are not closed Sunday night, **slip the parallel day**. Do not run a half-ready v2 on Sep 8.

---

## 2. What is already known (do not rediscover; do measure)

These are **starting facts** from the Width Maturity run and a disk/code read on StudioOne 2026-09-04. P1 **quotes the code** and **re-measures**. If the tape contradicts a row below, the tape wins and the report says so.

| Fact | Evidence | Consequence |
|------|----------|-------------|
| Store | `LABS_MARKET_DATA_ROOT` default `/Volumes/FatTail2TB/fattail-market-data` · `ssr/live_capture/day=YYYY-MM-DD/chain/<SYM>/snap-HHMMSSmmmZ.json` | P3 writes **`live_capture_v2`**, never this tree |
| Cadence | `LABS_SSR_CHAIN_EVERY_S=2` · fail-loud outside [2, 5] | Dual daemons at 2 s is a **rate-limit question**, not a guess |
| Wing count | `LABS_SSR_WINGS=15` on StudioOne `.env`. Code default **25** (`WINGS_DEFAULT`). Lookup tries configured, then **15 and 25**, so a mismatch cannot miss a live chain | Band is **listed-strike count around ATM**, not σ |
| Who chooses strikes | `chain_ladder.select_listed_wing_window` / `build_ladder` · `chain_feed` publishes `mb:ladder:{underlier}:{exp}:w{wings}:dual` · tap **reads Redis**, does not call Massive | Changing the band is a **feed + tap** change, not a tap-only filter of a wider book |
| Recenter today | Each generation recenters ATM from **current spot**; the **count** of wings is fixed. Range in points = N × listed step. It does **not** retain yesterday’s far strikes when spot runs | Trailing-edge retention is **new** |
| 0DTE vs 1–10 DTE | SO-AR v0.8: archive is **0DTE only by design**. Tap uses `front_expiration` = session day. Width Maturity topics were `…:SPX:2026-09-02:w25:dual` | **P1 must prove** whether 1–10 DTE files exist. If they do not, 1–10 DTE is **new fetch scope**, not a band rewrite of existing snaps. Do not pretend the archive holds tenors it does not. |
| Width Maturity misses | `Specs/wm_out/placements.csv` · **80 / 224** constant-σ `not_listed` · REPORT: K3 off the OPF wing window | P1.2 misses table is against **this file**, not a re-run |
| IV suspect | Aug 25 SPX ATM IV **4.68%** vs XSP **9.63%** same open. `chain_ladder._normalize_contract` sets `iv` from Massive `implied_volatility` | P1.4 is a **gate** for P2: σ_T is not trustworthy until this is named |
| Bank vol | Width Maturity days are VIX **~14–17**. High-vol is **projected from σ scaling**, never measured | Every VIX-25 number in the report is labeled **projected** |

---

## 3. Invariants (all parts)

1. **Do not switch the live collector.** Flag default **OFF**. Old script remains installed.
2. **v2 never writes `live_capture`.** Parallel store is `…/ssr/live_capture_v2`. Studies keep reading v1 until P4.
3. **No invented strikes.** Unlisted at the exchange stays unlisted. `not_listed` vs `outside_band` is a named distinction.
4. **Fail loud.** Missing/invalid new config aborts the v2 daemon; it must not silently fall back to wings=15.
5. **Schema bump is in-band.** Every v2 snap carries `band_center`, `k`, `b`, `σ_T`, recenter flag, schema version. v1 snaps stay as they are.
6. **Massive is sole upstream** (Arch 28). The tap still does not call Massive. If the σ-band requires a **wider fetch**, that change lives in **`chain_feed` / `chain_ladder`**, coalesced, not a second Massive client in the tap.
7. **OPF / OT-EF.** Representable or named. A missing wing is `not_listed` / `NOT TRADED`, never a synthesized quote.
8. **Three-OK** still applies to anything **outside** this program (LIM, Time Machine, dash bounce, MiniTwo). This program does not bounce MiniTwo.
9. **High-vol is projected.** The sentence “VIX 25 would capture X rows” must say **projected**.

---

## 4. Work breakdown

### P1 — Audit (no writer change)

**Where:** StudioOne. Read-only on the gold disk + collector source.

**Inputs:** `server/market_data/ssr_live_capture.py`, `chain_feed.py`, `chain_ladder.py`, `chain_store.py`; `.env` `LABS_SSR_WINGS`; archive Aug 14 – Sep 4; `Specs/wm_out/placements.csv`.

**Do:**

1. **Quote the code** that chooses the strike set. State: fixed count vs points vs % vs listing; set at startup / per day / every generation; whether it recenters; whether it retains.
2. **Measure**, per symbol per day, 0DTE **and each 1–10 DTE tenor that actually exists on disk**:
   - strikes: count, K_min, K_max, `(K_min−spot)/σ_T`, `(K_max−spot)/σ_T` at **9:31, 12:00, 14:00, 15:00, 15:55**.
   - `σ_T = spot × ATM_IV × sqrt(T_remaining)` from **that snapshot’s chain**, T to **16:00** in years with `252 × 6.5` (same as Width Maturity).
   - drift: band center − spot. Flag: spot left the band, or came within **0.5σ** of an edge.
   - waste: fraction of rows with bid ≤ 0.05, **or** mid < 4 ticks, **or** quote unchanged 60 s.
   - misses: every `not_listed` row in `placements.csv` → **outside the captured band** vs **not on the exchange list**.
3. **Storage:** rows/day, bytes/day per symbol; waste fraction of each.
4. **IV provenance:** feed-supplied (`implied_volatility`) vs computed; T convention; ATM strike pick late day. Reproduce Aug 25 4.7% and the ~6% 15:00 prints. If ATM pick is wrong late day, **say so before any k is chosen**.

**Out:** `Specs/COLLECTOR_RANGE.md` §1 with tables. If 1–10 DTE is absent, that section is one named hole: `TENOR NOT CAPTURED`, not empty tables.

**Gate P1:** numbers exist for 0DTE SPX/XSP at the five clocks; miss table covers all 80 constant-σ `not_listed`; IV paragraph names the Massive field and the T used. **FAIL** if σ_T cannot be defended.

---

### P2 — Design, implement, simulate (flag OFF)

**Decisions (Coach; this plan does not reopen them):**

| Knob | Law | How P1 feeds it |
|------|-----|-----------------|
| **k** | smallest k that captures **100%** of quotes that ever exceed 4 ticks that day | From P1 waste + “ever > 4 ticks” strike set. Expect **k ≈ 3** on 0DTE; **show the number**. Cost in rows vs current wings=15. |
| **b** | recenter when `|spot − center| > b·σ_T`. Expect **~0.5** | Show equivalent **% move** at 9:31 and 15:00 on a **VIX-14 measured** day and a **VIX-25 projected** day. If a % knob is wanted, the config is the σ fraction; the daemon derives %. |
| **Retention** | 0DTE: any strike once inside the band stays until that expiration expires. Longer tenors: retain **within the day**, reset at the open | Prove with a 1% trend-day replay that a 9:31 fly is still present at 15:55. |
| **Premarket** | Prior close ATM IV until 9:30:xx live chain quotes | Name the prior-close source (marks tape / last RTH snap). Fail loud if missing. |
| **Placeholders** | never collect strikes that only ever quote placeholders | Waste before/after on the replay. |
| **Schema** | every snap: `band_center`, `k`, `b`, `σ_T`, recenter flag, schema version | Bump a named version (propose `capture_schema=2` in the report; Coach can rename). |
| **Flag** | default **OFF**. Old path identical | Env e.g. `LABS_SSR_BAND=wings` (default) \| `sigma`. Invalid value aborts v2. |

**Implement:**

- New band logic in a **module** the tap and (if needed) `chain_feed` both import. Do not fork a second Massive client.
- If σ-band **in points** exceeds the current Massive window, **widen the feed fetch** behind the same flag. Dual-run must not silently clip v2 to the old window — that would fake a PASS on superset.
- Replay harness: every archive day, **no live writes**. Output: per day strikes, waste, bytes, and any Width Maturity placement strike the new band would still miss. **Target: zero misses at proposed k.**
- Side-by-side table vs current wings rule.
- Projected rows/day: VIX 14 **measured**; VIX 25 **projected** from σ scaling.

**Files in play (expected; P1 may add one):**

| Path | Change |
|------|--------|
| `server/market_data/ssr_band.py` | **new** — σ_T, k, b, retain set, recenter |
| `server/market_data/ssr_live_capture.py` | flag branch; v2 schema fields; **default OFF** |
| `server/market_data/chain_ladder.py` / `chain_feed.py` | fetch window when flag on; no behavior change when off |
| `Specs/replay_capture_band.py` | **new** — archive replay |
| `server/tests/test_ssr_band.py` | characterization: flag off ≡ old; retain; recenter; placeholder drop |
| `Specs/COLLECTOR_RANGE.md` | §2 rule + simulation table |

**Gate P2:** flag off → golden snap hash / row set unchanged on a fixture day. Replay table complete. Proposed k captures 100% of >4-tick quotes and **zero** WM constant-σ misses (or a named leftover with Coach tick). VIX-25 column labeled projected.

---

### P3 — Parallel-day proof (Sep 8 earliest)

**Setup (before the open, not during):**

1. **Store:** `…/ssr/live_capture_v2/day=YYYY-MM-DD/`. v2 daemon `LABS_SSR_CAPTURE_ROOT` (or equivalent) points here. v1 untouched.
2. **Rate limits:** read Massive / bus caps **before** two daemons at 2 s. If both cannot hold cadence, **say so before the day** and either: (a) v2 reads the **same Redis generations** v1 already warms (preferred — tap is a reader), or (b) slip. Do not discover this at 9:45.
3. **Disk:** projected bytes **v1+v2** on a trend day vs **free space** on FatTail2TB. Three weeks already on the volume. FAIL the morning if headroom < 2× the projection.
4. **`Specs/compare_capture.py`:** scheduled **16:30 ET**. PASS/FAIL per symbol:

| # | Criterion |
|---|-----------|
| 1 | **Superset:** every `(symbol, expiry, strike, timestamp)` v1 captured inside the old band, v2 captured too, matched within **one cadence tick**. Zero misses. |
| 2 | Extra v2 rows **only** from strikes outside the old band, or retained trailing strikes. Nothing else differs. |
| 3 | Band center tracked spot; every recenter logged with spot, σ_T, trigger distance. |
| 4 | Cadence **2 s both daemons** all day (p50 / p99 gap). |
| 5 | v2 survived **16:00 close, GTH, and next morning premarket** without a restart. (Sep 8 PASS is incomplete until **Sep 9 premarket** is observed, or GTH overnight is logged.) |
| 6 | Waste fraction in v2 **≤ P2 projection**. |

5. **Logs:** one file per day per daemon. Anything compare cannot explain is **FAIL**, not a warning.

**Criterion 5 note:** a Tue parallel day cannot claim “next morning premarket” until Wed 9:30. Report Sep 8 as **intraday PASS/FAIL**; overnight+premarket is a **follow-on check** before P4.

**Gate P3:** compare script prints PASS on 1–4 and 6 for every scheduled symbol; cadence p99 named; disk headroom named. Coach reads the log, not chat.

---

### P4 — Cutover (Coach go only)

Only after a P3 PASS **and** Coach’s go:

- Swap **by config**, not by editing a running process. Old script stays installed, disabled.
- First live v1-off day: run `compare_capture.py` against the **previous day’s shape** as sanity; run Width Maturity job on **v2** with **zero** `not_listed` on constant-σ placements (for widths the band is designed to hold).
- Write **cutover date** and **schema version** into `Specs/COLLECTOR_RANGE.md` so every later study knows where the band changed.

This plan **does not authorise P4**.

---

## 5. Deliverables

| Artifact | When |
|----------|------|
| This plan | **now** (this commit) |
| `Specs/COLLECTOR_RANGE.md` | grows through P1–P4; never empty of P1 numbers if P2 starts |
| Flag-off implementation + replay harness + tests | P2 |
| `Specs/compare_capture.py` | P2 (written), P3 (fired at 16:30) |
| Parallel-day logs + compare PASS/FAIL | P3 |
| Cutover date + schema version in the report | P4 only |

**Not in this program:** LIM, Time Machine, MiniTwo deploy, dash bounce, rewriting Friday 2026-08-14, deleting v1 days.

---

## 6. Explicit non-claims

- The archive **cannot** show VIX-25 behavior. Projected from σ scaling only.
- The archive **may not** hold 1–10 DTE. P1 says so in one hole name if that is the disk.
- Width Maturity `not_listed` is a **lower bound** on miss pain (call flies, two protocols, 8 widths). The new band is for the **collector**, not only that study.
- Sep 4 2026 is a **partial** day in `wm_out/`. Do not use it as a full-session audit row.

---

## 7. Stop conditions

- P1 IV gate FAIL → no k, no P2 live-shaped code.
- Replay still misses a WM constant-σ strike at proposed k → raise k or show the strike is **unlisted**, not outside σ. Do not ship a k that misses listed needed wings.
- Dual-daemon cadence cannot hold 2 s → do not start Sep 8; report before the open.
- Disk projection > free space → do not start Sep 8.
- compare FAIL → no P4. Fix, another parallel day.

---

## 8. Execution order (do not skip)

1. Land this plan on `main` (this commit). **No collector edits in the same body of work.**
2. P1 on StudioOne against the gold disk + `wm_out/placements.csv`.
3. Draft `Specs/COLLECTOR_RANGE.md` §1. Gate.
4. P2 module + flag OFF + tests + replay. Fill §2. Gate.
5. Stage v2 launchd **disabled**. Rate-limit and disk memo **before** Sep 8 open.
6. P3 parallel day. 16:30 compare. Overnight/premarket follow-on.
7. Coach go → P4. Not this plan’s to fire.
