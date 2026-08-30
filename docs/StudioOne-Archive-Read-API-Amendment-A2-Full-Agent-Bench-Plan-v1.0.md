# StudioOne Archive Read API — Amendment A2 Full Agent Bench Plan v1.0

**Date:** 2026-08-29  
**Plan revision:** **v1.0**  
**Canonical filename:** `docs/StudioOne-Archive-Read-API-Amendment-A2-Full-Agent-Bench-Plan-v1.0.md`  
**Owner (orchestration):** Juliet  
**W0 artifact:** [`agents/go/SOAR-A2-W0.md`](../agents/go/SOAR-A2-W0.md)  
**Board:** [`agents/p-studioone-archive-read/`](../agents/p-studioone-archive-read/) — **A2 strip.** The v2.1 GO stays on this board and is not this program.

**Law Delta reads (together, A2_1 does not supersede v0.8 or A1):**

| Doc | Role |
|-----|------|
| Spec **v0.8** | [`Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8.md`](../Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8.md) |
| **Amendment A1** | [`Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8-Amendment-A1.md`](../Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8-Amendment-A1.md) |
| **Amendment A2_1** | [`Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8-Amendment-A2_1.md`](../Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8-Amendment-A2_1.md) · sha1 `4cb4ffce5c9d0928b6beb5dd7c3b1e867df61f10` — **this GO's WHAT** |

`Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8-Amendment-A2.md` is the pre-fold sibling (A2 + COUNTS carve-out). **Cite A2_1.** Do not stamp A2.

**Parents:** Arch **28** · OT-EF / **DL-309** · **DL-597** store path · SO-AR plan **v2.1** (closed packets stay closed; AT-SOAR-45 still binds) · Time Machine One Source **v0.4** consumes this when it lands and is **NX**.

Juliet does not invent WHAT. Advisor-set numbers stand unless Coach overrules in one line on `SOAR-A2-W0.md`.  
Delta: **PASS / FAIL / BLOCKED**, never waived.  
**No product code in W0.** **W0-0 STAMP · W0-BA GO 2026-08-29.** W1+ unblocked. Dash bounce on **Coach W5-GO** — A2_1 does not authorise it. Time Machine does not move.

---

## 0. Mission

One layer. Smallest reversible step. Local proof that can fail.

Captured data with no route: the marks tape (twenty names + session) and 2026-08-14 SPY. Serve the tape. Adapt the flat-day read. Do not rewrite disk. Do not change the tap. Do not touch Time Machine.

```text
W0     Review + Coach ticks → W0-G → W0-BA
W1     Characterize as-built (no ship) — disk already read; prove AT-SOAR-50 and 55 fail today
W2     Alpha — marks route + coverage distinction + nearest / named gap + flat-day SPY
W3     Alpha — Labs proxy pass-through
W4     Mike — Bearer on the new route (same archive class)
W5-GO  Coach word → StudioOne dash bounce
W5     Wire reader into the dash; AT-SOAR-45 still binds
W6     Kilo AT-SOAR-50…57
W7     Lima
W-G    Delta
```

The v2.1 GO (`W0–W5` bounced; **W6–W8 still blocked on W5-G**) is **not** this program. Do not wait on it. Do not close it from this board strip.

**SO-AR module lock (Coach 2026-08-29):** one at a time. This strip owns `ssr_archive_read.py` through **W2-G**. TMOS W1 (`TODAY_LIVE`) starts after that gate, not in the same packet. Dash bounce remains **W5-GO**.

---

## 1. Locked (FP)

| ID | Decision |
|----|----------|
| **FP-A2-1** | **Marks route.** Every `marks/*.jsonl` the tap writes is retrievable: VIX, VIX1D, sixteen underliers, `session.jsonl`. Not VIX alone. Path: StudioOne `GET /api/marks`. Labs `GET /api/me/options-lab/archive/marks`. Query: `day`, `symbol`, `t` (RFC3339). Same Bearer class as coverage/index/fetch. |
| **FP-A2-2** | **Coverage distinguishes a marks tape from a chain book.** A tape is never reported as `count=0 / expiration=UNKNOWN / status=none`. That describes an absent book. v0.8 §9 item 2 (*leave marks unserved*) is **closed** by A2-1. |
| **FP-A2-3** | **Nearest-in-time** to the requested instant. A stretch of tape with no mark **near** that instant is hole **`MARK GAP`** (200, named). **Never** last-observation-carried-forward. A stale number that moves plausibly is OT-EF. |
| **FP-A2-4** | **Near = 15 s GAP floor (Coach, 2026-08-29).** Locked. VIX marks land every 5.7 s, so 15 is 2.5× the marks cadence — the same multiplier the chain uses, landing on a different number because the tape is slower. Typical nearest during RTH is about 3 s, half an interval. Fifteen is the stall detector, not the match distance. On 2026-08-27 it would have fired exactly twice, on the two real stalls at 20.9 s, and never during the session. Farther than **max(2.5 × observed marks cadence, 15 s)** → `MARK GAP`. |
| **FP-A2-5** | A null `generation.vix` is **not** a gap. The hole belongs to the tape. The route **must not wait** on the tap writing `generation.vix`. Blocking on that key is a fail. |
| **FP-A2-6** | **2026-08-14 SPY.** 129 snaps at `chain/snap-*.json` resolve as SPY through coverage, index, and fetch. Layout adapted at read. **The day is not rewritten.** |
| **FP-A2-7** | **Flat-layout COUNTS carve-out only (A2-2).** v0.8 refuses a book it cannot identify (`UNKNOWN` / 404). That stands for nested `chain/<SYM>/`. **2026-08-14** is the exception because it is unambiguous: 129 snaps, one book, pre-subdirectory `chain/snap-*.json` = SPY. Not a general “identify it anyway” path. |
| **FP-A2-8** | **Symbol-completeness.** For every collected date, every symbol with data on disk in **any** layout is fetchable. Test enumerates the disk and fails on the first unreachable name. Empty `mkdir` of the universe with zero snaps remains **NOT TODAY** / grey — that is 0DTE, not a missing route. |
| **FP-A2-9** | Today remains **409 `TODAY_LIVE`** on this path. Proof is a **past** pre-feature day (2026-08-27). Lifting today is One Source, not this GO. |
| **FP-A2-10** | Same pool (4) / queue (8) / nice-below-tap. **AT-SOAR-45** unchanged and binding. Marks takes a worker from the same pool. |
| **FP-A2-11** | **Rollback:** remove the marks route. Flat-day resolution reverts to 404, which is current behaviour. No disk migration to undo. |
| **FP-A2-12** | Browser never calls StudioOne. No client Massive. No TM chrome. No tap write. No admin-tree edits. No MiniTwo until asked. |
| **FP-A2-13** | **`VIX NOT NATIVE` (Coach, 2026-08-29).** Daily stats flag on any day whose VIX source is not native. Coverage carries it when the route is built; §7.3 `flags[]` when the nightly stats pass runs. VIXY remain a labelled fail-over. A future entitlement lapse must not go unnoticed. Native is the `source` field, not the number. VIX1D same treatment. |

**As-built (W1 must quote, already measured 2026-08-28 / 29):**

- Store `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture`, 13 days `2026-08-14`…`2026-08-28`.
- Eighteen chain names in `chain/<SYM>/`. First-class symbols **honoured** for folders with snaps (2026-08-27: GLD, IWM, QQQ, SPX, SPY, XLF, XSP).
- `marks/vix.jsonl` on 2026-08-27: **14,622** lines; first print `mid=17.855`. Chain retrieve: 404 `UNKNOWN`.
- Sixteen underlier jsonl + `vix1d.jsonl` + `session.jsonl`: no route.
- 2026-08-14: 129 flat snaps; index/fetch SPY **404 UNKNOWN**. AT-SOAR-30 already claimed this day readable. Live it is not. That fail is W1 evidence, not a pass to carry.

---

## 2. Coach ticks (`SOAR-A2-W0.md`)

**Stamped 2026-08-29.** W0-BA **GO** same word.

| # | Coach |
|---|-------|
| **A2_1** | **Accept.** Byte-identical to A2 plus the COUNTS carve-out. Diff confirmed. Cite A2_1, not A2. |
| **§9.2** | **Reverse accepted.** Serve the tape. That position was written without knowing what was on it. |
| **near** | **15 s GAP floor.** Stall detector. 2.5× marks cadence. On 08-27 fires twice at 20.9 s stalls, never during the session. |
| **COUNTS** | **Accept as written in A2-2.** Flat 08-14 only, 129 snaps, one book. Nested `chain/<SYM>/` still 404s. Not a general identify-it-anyway path. |
| **bounce** | stays Coach. **W5-GO.** Time Machine does not move. |

Fold when the route is built: **`VIX NOT NATIVE`** daily stats flag (FP-A2-13).

Advisor-set (pool, cache, chain GAP, API v1) stand from v0.8 + A1 unless overridden on that file.

---

## 3. Hard gates

| Gate | Rule | Unblocks |
|------|------|----------|
| **W0-2 India** | Quote as-built: marks unroutable; 08-14 UNKNOWN; `_book_hole` COUNTS; `snap_files` already glob-flat; TM `coverageUrl(symbol)` is **NX**, not this GO. | W0-G |
| **W0-3 Mike** | New route same Bearer class as `/api/coverage`. `/` stays open. 501 ≠ 401. | W4 |
| **W0-4 Hotel** | `MARK GAP` is named, never LOCF. Null `generation.vix` is not a hole. VIX is not a second SPX spot. | W0-G |
| **W0-5 Echo** | Coverage of a tape is not the coverage of an absent book. No new member chrome (TM is NX). | W0-G |
| **W0-6 Tango** | Grey no-folder = grey uncollected. Empty 0DTE `mkdir` is NOT TODAY, not a broken calendar. | W0-G |
| **W0-G** | Token fully ticked. Review packets file. Do **not** re-block W1: Coach granted W0-BA in the W0-0 word. | (filed) |
| **W0-BA** | **GO 2026-08-29** | W1 |
| **W1-G** | Drift table. AT-SOAR-50 and 55 **fail today** as evidence. **A fixture does not close 50.** Live proof is StudioOne dash (not bounced). Diff empty of ship. | W2 |
| **W2-G** | Marks route on the reader. Coverage distinguishes tape vs book. Nearest / `MARK GAP`. 08-14 SPY 200. COUNTS-missing + snaps ≠ 404. AT-SOAR-50, 52, 53, 54, 55 on fixtures **or** store. | W3 |
| **W3-G** | Labs `/api/me/options-lab/archive/marks`. Session-only. 501 absent. | W4 |
| **W4-G** | 401 ≠ empty marks. | W5 |
| **W5-GO** | Coach word | W5 |
| **W5-G** | Live marks + **AT-SOAR-45** (collection still outranks). | W6 |
| **W6-G** | AT-SOAR-50…59 never waived. 50 is a live pre-feature day, not a fixture. | W7 |
| **W-G** | Fail-closed: LOCF, wait on `generation.vix`, tape reported as absent book, 08-14 still UNKNOWN, TM code, tap write, bounce without W5-GO, rewrite of disk, proxy VIX read as native, missing `VIX NOT NATIVE` | ship |

---

## 4. DAG

```text
W0-0 Coach ticks on SOAR-A2-W0.md  [STAMP 2026-08-29]
  → W0-1 Lima sha1 + DL
  → W0-2 India
       ├── W0-3 Mike
       ├── W0-4 Hotel
       ├── W0-5 Echo
       └── W0-6 Tango
  → W0-G (files; does not re-block W1)
  → W0-BA GO 2026-08-29 (Coach, same word as W0-0)
       → W1 characterize → W1-G
            → W2 reader → W2-G
                 → W3 proxy → W3-G
                      → W4 bearer → W4-G
                           → W5-GO → W5 dash → W5-G
                                → W6 Kilo AT-SOAR-50…57 → W6-G
       → W7 Lima
  → W-G Delta
```

---

## 5. Packets

Seeds under `agents/p-studioone-archive-read/seeds/`, prefix **`A2-`**. Do not reuse v2.1 seed files.

### W0 — review (no code)

| Seed | Agent |
|------|-------|
| `A2-W0-0-coach-plan-stamp.md` | Coach — ticks on `SOAR-A2-W0.md` |
| `A2-W0-1-lima-hash.md` | Lima — sha1 A2_1 + this plan; DL |
| `A2-W0-2-india-prior-art.md` | India — as-built quotes |
| `A2-W0-3-mike.md` | Mike — Bearer class |
| `A2-W0-4-hotel.md` | Hotel — named gap, no LOCF, VIX ≠ SPX spot |
| `A2-W0-5-echo.md` | Echo — tape vs absent book |
| `A2-W0-6-tango.md` | Tango — grey no-folder |
| `A2-W0-G-delta.md` | Delta |
| `A2-W0-BA-coach-build-authority.md` | Coach BUILD |

### W1 — characterize

| Seed | Agent | Done when |
|------|-------|-----------|
| `A2-W1-1-india-prior-art.md` | India | Drift vs A2_1. Quote `_book_hole` UNKNOWN on missing COUNTS; `snap_files` flat SPY. **Live dash** AT-SOAR-50/55 fail today (bounce is W5-GO). **A fixture does not close 50.** Labs reader may already exist (DL-623) — that is not 50. **No edits.** |
| `A2-W1-G-delta.md` | Delta | Product diff empty of *this* ship. 50 and 55 recorded as **fail today on the live dash**. |

### W2 — reader

| Seed | Agent | Files |
|------|-------|-------|
| `A2-W2-1-alpha-reader.md` | Alpha | `server/market_data/ssr_archive_read.py` + `server/tests/test_ssr_archive_*.py`. Marks retrieve. Coverage `marks` distinct from `books`. Nearest / `MARK GAP` at **15 s floor**. Flat SPY. COUNTS-missing + snaps = 200. **`VIX NOT NATIVE` on coverage.** |
| `A2-W2-G-delta.md` | Delta | AT-SOAR-50…55, 57 on reader (fixture or store). 56 enumerates disk. |

### W3 — Labs proxy

| Seed | Agent | Files |
|------|-------|-------|
| `A2-W3-1-alpha-proxy.md` | Alpha | `server/routes/ssr_archive.py`. Member `GET /api/me/options-lab/archive/marks`. Same session gate as fetch. |
| `A2-W3-G-delta.md` | Delta | Proxy 501/unreachable shape. No TM callers. |

### W4 — auth

| Seed | Agent |
|------|-------|
| `A2-W4-1-mike-bearer.md` | Mike — marks route Bearer; HTML `/` open |
| `A2-W4-G-delta.md` | Delta |

### W5 — StudioOne dash

| Seed | Agent |
|------|-------|
| `A2-W5-0-coach-go.md` | Coach — word to bounce |
| `A2-W5-1-alpha-dash.md` | Alpha — add `/api/marks` to `ARCHIVE_API_PATHS` + `_serve_archive` |
| `A2-W5-2-foxtrot.md` | Foxtrot — bounce `ai.fattail.labs.ssr-snapshot-dash` |
| `A2-W5-G-delta.md` | Delta — live AT-SOAR-50, 55, **45** |

### W6 / W7 / W-G

| Seed | Agent |
|------|-------|
| `A2-W6-1-kilo-ats.md` | Kilo — AT-SOAR-50…59. **50 is a live 2026-08-27 walk**, not a fixture. Never waive. |
| `A2-W6-G-delta.md` | Delta |
| `A2-W7-1-lima.md` | Lima — §9 item 2 closed in the amendment; parent one-liner in TM One Source v0.4 that SO-AR now serves the tape (no TM code). |
| `A2-W-G-delta.md` | Delta |

---

## 6. Acceptance (from A2_1 — never waive)

| ID | Claim |
|----|--------|
| **AT-SOAR-50** | **The proof that fails today.** 2026-08-27 returns **real VIX values matching the tape**, not empty and not UNKNOWN. Null or empty means the route is wrong. Tape has 14,622 lines; first print `mid=17.855`. **Live day, not a fixture. A fixture does not close 50.** |
| **AT-SOAR-51** | Every `marks/*.jsonl` is retrievable — VIX, VIX1D, sixteen underliers. Count of served names equals count of files on disk. `session.jsonl` is on the same route. |
| **AT-SOAR-52** | Nearest-in-time. **GAP floor = 15 s.** Synthetic tape with a deliberate gap → **named gap** inside it, never last known. |
| **AT-SOAR-53** | Null `generation.vix` on a pre-feature day does **not** produce a gap. The tape supplies the value. |
| **AT-SOAR-54** | Marks route works with `generation.vix` absent entirely. Nothing blocks on that key. |
| **AT-SOAR-55** | **2026-08-14 SPY** through coverage, index, and fetch. Flat layout read; day not rewritten. |
| **AT-SOAR-56** | **Symbol-completeness.** Every collected date: every symbol with data on disk in any layout is fetchable. Enumerate disk; fail on the first unreachable name. |
| **AT-SOAR-57** | Coverage distinguishes a **marks tape** from a **chain book**. A tape is never `count=0 / expiration=UNKNOWN / status=none`. |
| **AT-SOAR-58** | Batch. `source` / `label` sit beside `mid`. A `massive_proxy_v1` tape stays labeled. |
| **AT-SOAR-59** | **`VIX NOT NATIVE`.** 2026-08-27 flags. A synthetic native tape does not. Source field, not the number. |
| **AT-SOAR-45** | Unchanged. Collection outranks reads. Marks takes a pool worker. |

---

## 7. Non-goals (NX)

| ID | Out |
|----|-----|
| **NX-TAP** | Change the tap. Writing `generation.vix` is Coach / StudioOne, not this GO. |
| **NX-TM** | Time Machine. `coverageUrl(symbol)` staying single-symbol is noted and **not this GO**. |
| **NX-REWRITE** | Rewrite 2026-08-14 or any day. |
| **NX-BOUNCE** | Dash bounce without **Coach W5-GO**. A2_1 does not authorise it. |
| **NX-SESSION-WANT** | Decide whether any consumer wants `session.jsonl`. Serve it; do not productise it. |
| **NX-TODAY** | Lift `TODAY_LIVE`. One Source. |
| **NX-V2.1** | Close or wait on v2.1 W6–W8. |
| **NX1** | MiniTwo until Coach asks |
| **NX2** | Browser → StudioOne · client Massive |
| **NX3** | Sidecar · packed day · Friday rewrite as a write |

---

## 8. Fail-closed

LOCF on a marks gap · wait on `generation.vix` · report a present tape as an absent chain book · leave 2026-08-14 UNKNOWN · 404 a captured book because COUNTS is missing · TM callers in this GO · tap write · bounce without W5-GO · rewrite disk · waive AT-SOAR-50 or 55 · fixture closing 50 · proxy VIX read as native · a non-native VIX day with no `VIX NOT NATIVE` flag.

---

## 9. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v1.0** | 2026-08-29 | Stamp target. Law = v0.8 + A1 + **Amendment A2_1**. Marks route + flat-day SPY + symbol-completeness. SO-AR only. Proof that fails today: AT-SOAR-50, 55. Rollback: remove the route. |
| **v1.0 W0-0** | 2026-08-29 | Coach stamped. Near = **15 s GAP floor**. COUNTS carve-out accepted as written. `VIX NOT NATIVE` folded. W0-BA **GO**. W5 bounce still Coach. TM does not move. A2_1 sha1 `4cb4ffce5c9d0928b6beb5dd7c3b1e867df61f10`. |

**One-line law:**  
**Serve every marks tape; nearest-in-time, 15 s GAP floor, named gap, never last-known; 2026-08-14 SPY is readable; everything on disk is retrievable; a non-native VIX day is flagged; Time Machine does not move; bounce is Coach’s word.**

W0-G evidence is v0.8 + A1 + **A2_1** + this plan + `SOAR-A2-W0.md`. Not A2. Not plan v2.1 as this GO’s DAG.
