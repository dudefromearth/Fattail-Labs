# StudioOne Archive Read API — Full Agent Bench Plan v1.3

**SUPERSEDED** by [`docs/StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v1.4.md`](./StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v1.4.md). Do not stamp this revision.

**Date:** 2026-08-27  
**Plan revision:** **v1.3** (superseded)  
**Canonical filename:** `docs/StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v1.3.md`  
**Supersedes:** v1.2 · v1.1 · v1.0  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**W0 artifact:** [`agents/go/SOAR-W0.md`](../agents/go/SOAR-W0.md)  
**Board:** [`agents/p-studioone-archive-read/`](../agents/p-studioone-archive-read/)  
**Spec:** [`Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8.md`](../Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8.md) **v0.8**  
**Governance:** doctrine · AGENTS.md · spec-create-review-workflow

This revision answers the five findings on plan v1.2. Packets, DAG, and NX from v1.2 stand except as named below.

Delta: **PASS / FAIL / BLOCKED**. No product code in W0. Dash bounce = **Coach W5-GO**.

---

## 0. Answers that were blocking W2

### 0.1 Wrap census — **per `chain/<SYM>/`**, not the day folder

Re-run 2026-08-27 on gold. Only `chain/<SYM>/snap-*` (Friday-flat `chain/snap-*` counted as one book). `marks/` and sidecars **excluded**.

| Result | Number |
|--------|--------|
| Books with at least one chain snap | **127** |
| Books that wrap (≥22:00Z **and** ≤05:00Z in the **same SYM dir**) | **88** |
| 08-14 Friday flat | 129 snaps, 25 late, 0 early, **no wrap** (RTH-only) |
| 08-17 | **18 books × 2 snaps = 36 chain files**, all ≤05:00Z, **no wrap** |

08-17’s “36” was **not** `marks/`. Gold leftover `snap-033238Z` / `snap-033843Z` (two per symbol). The earlier “zero chain on cache 08-17” was a different tree. Both statements can be true of different roots; the ladder cares about `chain/<SYM>/`.

**FP2 stands on the book sequence it governs.** Every dense-day book (08-18…08-26, every SYM that has a full session) wraps. Name-sort is not time order on those books.

### 0.2 The window is two UTC instants derived from D

Juliet’s “GTH_START 20:15 through the session” was **not a window**. The tap files by **NY calendar date**, not by GTH start.

Quoted from `server/market_data/ssr_live_capture.py`:

| Symbol | Value | Role |
|--------|--------|------|
| `today_ny()` | `now_ny().date()` — America/New_York | NY session date |
| `ensure_day()` | if `today_ny() != self.day`: finalize, `self.day = today_ny()`, `self.root = day_dir(self.day)` | Folder **rolls at NY midnight** |
| `day_dir(day)` | `…/live_capture/day={day.isoformat()}` | Folder D |
| `GTH_START` | `(20, 15)` ET | **Wake** for overnight GTH — **not** the folder bound |
| `EXT_END` | `(20, 0)` ET | Phase clock — **not** the folder bound |

**Folder D contains every snap written while `today_ny() == D`.**

That interval, in words:

- **Start (inclusive):** `D` 00:00:00.000 America/New_York  
- **End (exclusive):** `(D + 1 day)` 00:00:00.000 America/New_York  

As UTC instants (EDT example, offset −04:00):

- `window_start(D)` = `D 00:00:00-04:00` = **`D 04:00:00Z`**  
- `window_end(D)` = `(D+1) 00:00:00-04:00` = **`(D+1) 04:00:00Z`** (exclusive)

During EST (−05:00) those become `D 05:00:00Z` and `(D+1) 05:00:00Z`. Implementation must convert via the NY zone, not hard-code 04:00Z.

**D-1 vs D, in words:** the start belongs to **calendar D**, not D-1. A write at 20:17 ET on D is still `today_ny()==D`, still folder D, clock `001730Z`. GTH that began at 20:15 ET on **D-1** was filed in **folder D-1** (that NY date had not rolled). Overnight GTH **crosses two folders at NY midnight**, not at 20:15.

Config: `window_start` / `window_end` derived from D as above; fail loud if the zone is missing. Same rule the tap uses to choose `day_dir`.

Worked case (spec): clock `001730Z` in folder D → candidates `D 00:17:30Z` (20:17 ET on **D-1**, **outside** window) and `(D+1) 00:17:30Z` (20:17 ET on **D**, **inside**). Take the second. Local-date test would also pick it here; it fails for the symmetric case in folder D-1 — window test does not.

### 0.3 Day hash is `t`-order

Coverage hash is sha256 of `filename\tsize\n` **in the same order as the index**: reconstructed-`t` ascending, then filename as a tie-break for TAP RESTART (two snaps, same instant).

Name-order hashing is forbidden. Index, fetch `day_hash`, ETag, Labs cache key, and 409 **must use this function**. Two implementations that disagree on order disagree on whether the day changed.

AT-SOAR-5 is restated: hash over **`t`-sorted** rows, not `sorted(paths)` by name.

### 0.4 Leftover Seek paragraph (Lima W8)

Spec §1 still says: *Seek: `paths = sorted(chain/SYM/snap-*.json)`; level 0 is `paths[i]` for `i % 64 == 0`.*

Wrong twice under FP2 + §4.3: sequence is **`t`-order**, stride is **derived `S`**, not 64. Cost claim (no envelope) survives. Add to Lima repair list with the other leftovers (plan v1.2 §0.3).

### 0.5 Collection-outranks-reads must be measured

AT-SOAR-35 only proves the tap **process** is up after bounce. A tap that is up and **dropping snaps** passes it.

**AT-SOAR-45 (W5, blocking for W5-G):** During RTH (or a GTH band with live writes), hold the archive pool at **4** concurrent fetches of a dense settled day for **≥ 60 s**. Compare §4.7 delta distribution on **today’s live book** for that window vs the preceding 60 s (same book). Median and p95 must not move outside the DL-400 band **because of the load** — if they were inside [3,5] they stay inside; if the live median is ~2 s it stays ~2 s. A new GAP that appears only in the load window **fails**. Evidence = cadence endpoint, not “process still running.”

---

## 1. Locked additions (v1.3)

| ID | Decision |
|----|----------|
| **FP2** | Order by reconstructed `t` on **`chain/<SYM>/`**. Evidence: 88/127 books wrap. |
| **FP20** | Window = `[D 00:00 NY, D+1 00:00 NY)` from `ensure_day`/`today_ny`, **not** `GTH_START`. |
| **FP21** | Hash input order = that same `t` order (filename tie-break). |
| **FP22** | W5-G requires AT-SOAR-45, not only AT-SOAR-35. |

Coach ticks on `SOAR-W0.md` unchanged in *count*: spec-C, §9b, §9.1–4. **§9b rec is now: Accept `t`-order; census is per-book and wrap holds.**

---

## 2. DAG / packets

Same as plan v1.2. W2-1 must implement window as **FP20**, hash as **FP21**. W5-G includes **AT-SOAR-45**. W8 Lima includes Seek leftover.

---

## 3. AT deltas vs v1.2

| ID | Claim |
|----|--------|
| **AT-SOAR-5** | Hash is `t`-sorted `filename\tsize\n`; name-sort of the same files produces a **different** digest on a wrapping book |
| **AT-SOAR-41** | `001730Z` in folder D → **D 20:17 ET** (inside window), not D-1 20:17 ET |
| **AT-SOAR-42** | Wrapping `chain/SPX/` indexed in `t` order |
| **AT-SOAR-43** | Cadence deltas from `t` are non-negative across 00:00Z |
| **AT-SOAR-45** | Full-pool archive load does not add a GAP or push live p95 out of the pre-load band (cadence evidence) |

---

## 4. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v1.3** | 2026-08-27 | Per-book wrap census (88/127). Window = NY midnight pair from `ensure_day`. Hash is `t`-order. Seek leftover. AT-SOAR-45 load vs collection. |
| **v1.2** | 2026-08-27 | SUPERSEDED — folder-level census; GTH_START misquoted as window start. |

**One-line law:**  
**The ladder is `t`-order on `chain/<SYM>/`; `t` is the clock inside `[D 00:00 NY, D+1 00:00 NY)`; the hash walks that same sequence; W5 is not green until a loaded archive leaves the tap’s cadence alone.**
