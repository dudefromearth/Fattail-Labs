# StudioOne Archive Read API — Full Agent Bench Plan v1.7

**SUPERSEDED** by [`docs/StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v2.0.md`](./StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v2.0.md). Do not stamp this revision.

**Date:** 2026-08-27  
**Plan revision:** **v1.7** (superseded)  
**Canonical filename:** `docs/StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v1.7.md`  
**Supersedes:** v1.6 … v1.0  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**W0 artifact:** [`agents/go/SOAR-W0.md`](../agents/go/SOAR-W0.md)  
**Board:** [`agents/p-studioone-archive-read/`](../agents/p-studioone-archive-read/)  
**Spec:** v0.8 — Coach adds `AMBIGUOUS INSTANT` and strikes the false local-date proof; this plan does not edit the spec

Packets/DAG as v1.2. **Store** = `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture`.

---

## 0. Answers to the v1.6 review

### 0.1 Window rule checked on store data

`snap-000000997Z.json` in store `day=2026-08-25/chain/SPX/`:

- Candidates: Aug 25 00:00:00.997Z (outside `[Aug 25 04:00Z, Aug 26 04:00Z)`) and Aug 26 00:00:00.997Z (inside) = 20:00 ET Aug 25  
- `captured_at` = `2026-08-25T20:00:00.997973-04:00`

**Exact agreement on a wrapping file.** FP20 is measured, not only reasoned.

### 0.2 Nearest candidate, not equality

`as_of` is the bus generation: in that quote `23:59:55.022Z` vs write `00:00:00.997Z` — ~6 s earlier, across UTC midnight. Equality never hits `as_of`. `captured_at` only matches to milliseconds (filename truncation).

**Pick the in-window candidate nearest the timestamp.** Candidates are 23–24 h apart; six seconds cannot flip nearness.

**Sanity bound [advisor-set]: 5 minutes.** If `|timestamp − chosen candidate| > 5 min`, reject the envelope and continue the cascade. Do not trust a wild `captured_at`.

### 0.3 Cascade order — neighbour before mtime

Copied corpora keep **wrong** mtimes that are present and uniform (`cp` without `-p`). Step “mtime second” would pick confidently from copy time.

**Neighbour-monotonic uses already-resolved `t` from data.** It degrades honestly. Mtime is last, and **only if `st_mtime` itself falls inside the folder window.** Preserved write mtime sits seconds from `captured_at` → inside. Copy-time mtime is months/years outside → rejected on sight.

**Two-in-window (`[04:00Z,05:00Z)` fall-back Sunday) [advisor-set]:**

1. Open that JSON. Usable `captured_at` (else `as_of`) → **nearest** in-window candidate, unless > 5 min away.  
2. **Neighbour-monotonic** on already-resolved neighbours.  
3. **mtime if in-window** → nearest candidate to that mtime.  
4. Else **`AMBIGUOUS INSTANT`** (200, named, skipped). Never `OUT OF WINDOW`.

Coach ticks **env-A** (field quote) and **dst-A** (this cascade).

**AT-SOAR-48** plants a **wrong mtime outside the window**, not a stripped mtime, and proves neighbour-monotonic wins.

---

## 1. Locked

| ID | Decision |
|----|----------|
| **FP20** | Window measured on wrapping store file (0.1). |
| **FP20b** | Envelope **nearest** (+ 5 min bound) → neighbour-monotonic → in-window mtime → `AMBIGUOUS INSTANT`. |

**Coach ticks:** spec-C · §9b · env-A · dst-A · §9.1–4.

| # | Juliet rec |
|---|------------|
| **env-A** | Accept `captured_at` quote; prefer it |
| **dst-A** | Cascade 0.3 |

---

## 2. AT deltas vs v1.6

| ID | Claim |
|----|--------|
| **AT-SOAR-46** | `[04:00Z,05:00Z)`; `captured_at` **nearest** candidate (millisecond truncation OK) |
| **AT-SOAR-46b** | Envelope `as_of` ~6 s off still selects nearest; equality not required |
| **AT-SOAR-46c** | Envelope 1 h off the nearer candidate → rejected; cascade continues |
| **AT-SOAR-48** | Unreadable envelope, **mtime outside window** → neighbour-monotonic wins |
| **AT-SOAR-49** | No envelope, mtime outside, no neighbours → `AMBIGUOUS INSTANT` |

---

## 3. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v1.7** | 2026-08-27 | Nearest-candidate. Neighbour before mtime. Mtime must be in-window. AT-SOAR-48 wrong-mtime. Window checked on store wrap file. |
| **v1.6** | 2026-08-27 | SUPERSEDED |

**One-line law:**  
**Place the clock in the NY-midnight window by nearness to `captured_at`; if the envelope is junk, trust neighbours before mtime; if mtime is copy-time, throw it out; if nothing separates two in-window candidates, say AMBIGUOUS INSTANT.**
