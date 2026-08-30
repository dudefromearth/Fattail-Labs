# StudioOne Archive Read API — Full Agent Bench Plan v1.5

**SUPERSEDED** by [`docs/StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v1.6.md`](./StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v1.6.md). Do not stamp this revision.

**Date:** 2026-08-27  
**Plan revision:** **v1.5** (superseded)  
**Canonical filename:** `docs/StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v1.5.md`  
**Supersedes:** v1.4 … v1.0  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**W0 artifact:** [`agents/go/SOAR-W0.md`](../agents/go/SOAR-W0.md)  
**Board:** [`agents/p-studioone-archive-read/`](../agents/p-studioone-archive-read/)  
**Spec:** [`Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8.md`](../Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8.md) **v0.8** (Coach strikes the false local-date proof; this plan does not edit the spec)

DAG and packets follow v1.2 except as named. No product code in W0. Dash bounce = **Coach W5-GO**.

---

## Names (one path, one name)

| Name in this plan | Path | Not |
|-------------------|------|-----|
| **Store** (the archive the API reads) | `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture` | Do **not** call this “gold” |
| **Cache leftover** | `~/Library/Caches/fattail-ssr/ssr/live_capture` | Stall workaround; not the SoR |
| Friday 08-14 5-min SPY | **Store** `day=2026-08-14/chain/snap-*.json` (flat) | First tape; not rewritten |

v0.1 used “gold” for a *different*, then-empty FatTail2TB tree. **DL-597** made FatTail2TB the live/archive store. Adjacent-tree mixups in v1.2–v1.3 came from using both words for the same path. **FP2, census, W2, W5 speak only “store.”**

---

## 0. Answers to the v1.4 review

### 0.1 DST tie-break — envelope first, mtime last

`st_mtime` is not in the snapshot. It dies on `cp` without `-p`, many restores, a drive migration, an rsync flag. This corpus will be copied (backup appliance, later 90TB). A lost mtime would silently reorder one folder per year.

The envelope already has the instant. Opening is expensive at 5,800 files; it is cheap for **the handful of files, on the one fall-back Sunday, whose clock has two in-window candidates.**

**Rule [advisor-set]:**

1. Window as v1.3: `[D 00:00 NY, D+1 00:00 NY)`.  
2. Zero candidates → `OUT OF WINDOW`.  
3. One candidate → that instant. **No open.**  
4. Two candidates → **open that one JSON**. Usable `captured_at` / generation `as_of` that matches one candidate → take it. Unreadable or no usable timestamp → closer `st_mtime`. Still tied → `OUT OF WINDOW` (do not guess).

This is an **explicit exception** to “index never opens JSON.” AT-SOAR-7: no open **except** two-in-window files (AT-SOAR-46). Named in the reader, not a silent `json.loads` on the hot path.

Coach ticks **dst-A**.

### 0.2 Ambiguous band is one UTC hour, always a Sunday

Two-in-window only for clocks in **`[04:00Z, 05:00Z)`** on the US fall-back night (window `Nov 1 04:00Z`–`Nov 2 05:00Z` in 2026).

That hour is either:

- **00:00–01:00 EDT Sunday morning** — Saturday night, **nothing trading**, or  
- **23:00–24:00 EST Sunday night** — **live GTH**.

Exposure: **one hour, one non-session morning vs one GTH hour, always Sunday.** AT-SOAR-46 must plant the synthetic file **inside `[04:00Z, 05:00Z)`**, not anywhere on Nov 1.

### 0.3 Census root (restated)

Measured on **store** `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture` · `chain/<SYM>/` · **88/127 wrap**. Not cache leftover.

---

## 1. Locked

| ID | Decision |
|----|----------|
| **FP2** | Order by reconstructed `t` on **store** `chain/<SYM>/`. |
| **FP20** | Window = `[D 00:00 NY, D+1 00:00 NY)`. |
| **FP20a** | Window ≡ local-date except fall-back. Implement window. |
| **FP20b** | Two-in-window → **envelope timestamp**; mtime only if unusable. |
| **FP21** | Hash order = `t` order. |
| **FP22** | W5-G requires AT-SOAR-45. |
| **FP23** | Say **store**, never “gold,” for FatTail2TB live_capture. |

**Coach ticks:** spec-C · §9b · **dst-A** · §9.1–4.

| # | Juliet rec |
|---|------------|
| **dst-A** | Envelope first; mtime fallback; exception named on AT-SOAR-7 |

---

## 2. AT deltas vs v1.4

| ID | Claim |
|----|--------|
| **AT-SOAR-7** | Index does not `open()` JSON **except** two-in-window files |
| **AT-SOAR-46** | `day=2026-11-01`, filename clock in **`[04:00Z, 05:00Z)`**; envelope `captured_at` selects the matching candidate; mtime ignored when envelope is usable; corrupt envelope → mtime |
| **AT-SOAR-47** | Non-fall-back: window pick equals NY-local-date pick |

---

## 3. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v1.5** | 2026-08-27 | Envelope-first DST tie-break. Ambiguous band `[04:00Z,05:00Z)`. Path named **store** only. |
| **v1.4** | 2026-08-27 | SUPERSEDED — mtime-only tie-break. |

**One-line law:**  
**The store is FatTail2TB `chain/<SYM>/`; `t` is the clock in `[D 00:00 NY, D+1 00:00 NY)`; on the one Sunday hour when both candidates fit, the envelope is opened and the rest of the index is not.**
