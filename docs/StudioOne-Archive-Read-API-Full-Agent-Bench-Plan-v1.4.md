# StudioOne Archive Read API — Full Agent Bench Plan v1.4

**SUPERSEDED** by [`docs/StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v1.5.md`](./StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v1.5.md). Do not stamp this revision.

**Date:** 2026-08-27  
**Plan revision:** **v1.4** (superseded)  
**Canonical filename:** `docs/StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v1.4.md`  
**Supersedes:** v1.3 · v1.2 · v1.1 · v1.0  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**W0 artifact:** [`agents/go/SOAR-W0.md`](../agents/go/SOAR-W0.md)  
**Board:** [`agents/p-studioone-archive-read/`](../agents/p-studioone-archive-read/)  
**Spec:** [`Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8.md`](../Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8.md) **v0.8** (Coach will strike the false local-date proof; this plan does not edit the spec)

DAG, packets, and NX from v1.2/v1.3 stand except as named. No product code in W0. Dash bounce = **Coach W5-GO**.

---

## 0. Answers to the v1.3 review

### 0.1 Census root — named

The per-book wrap census (plan v1.3 §0.1) was run on:

**`/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture`**

That is the store the API reads (spec v0.8 §1 · **DL-597**). Not `~/Library/Caches/fattail-ssr`. Only `chain/<SYM>/snap-*` (Friday-flat `chain/snap-*` as one book).

| Result | Number |
|--------|--------|
| Root | `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture` |
| Books with ≥1 chain snap | **127** |
| Books that wrap (same `chain/<SYM>/` has ≥22:00Z **and** ≤05:00Z) | **88** |
| 08-14 Friday flat | 129 snaps · no wrap |
| 08-17 | 18×2 leftover chain snaps on **this same gold root** · no wrap |

08-17 gold leftover vs cache-tree “zero snaps” were **two roots**. This census is the tree the ladder walks. **FP2 stands on it.**

### 0.2 Local-date test is equivalent (except DST). Spec’s proof is false.

v0.8’s worked example assumed folder D held GTH **the evening before D**. `ensure_day` kills that: folder D is exactly `today_ny() == D`. Every snap in folder D has NY local date **D** by construction. The two UTC candidates are 24h apart, so **exactly one** has NY date D, and it is the right one.

**Window rule and local-date rule agree on every non-fall-back day.** Keep the **window** as the implementation: it is explicit and uses the same call as the tap. Do **not** keep v0.8’s claim that local-date is silently wrong. That proof is Coach’s to strike. NX17 (forbidding local-date as false) is **withdrawn**.

W8 Lima: leftover list includes “v0.8 local-date proof / ‘GTH prior evening through D+1’” — **do not rewrite the spec in this program**; Coach owns the strike.

### 0.3 Fall-back DST — both candidates can be inside the window

Folder D = `[D 00:00 NY, D+1 00:00 NY)`. On the **November fall-back** that span is **25 hours of UTC**, longer than the filename clock’s 24h period.

**Worked case — Sunday 2026-11-01 (US fall-back).**

- `window_start` = Nov 1 00:00 America/New_York = **Nov 1 04:00Z** (still EDT)  
- `window_end` = Nov 2 00:00 America/New_York = **Nov 2 05:00Z** (EST)  
- File `snap-043000Z.json` candidates: **Nov 1 04:30Z** (00:30 EDT) and **Nov 2 04:30Z** (23:30 EST Nov 1).  
- **Both** lie in `[04:00Z, 05:00Z next)`.  
- Local-date test: **both** have NY date Nov 1. No tie-break.

Spring-forward is a 23-hour window — at most one candidate. Harmless.

**Tie-break [advisor-set] — `stat.st_mtime`, no envelope:**

1. Compute both UTC candidates from the clock + D / D+1.  
2. Keep those inside `[window_start, window_end)`.  
3. **One** → that instant.  
4. **None** → `OUT OF WINDOW`.  
5. **Two** → take the candidate whose UTC instant is **closer to `path.stat().st_mtime`** (interpreted as UTC). Write time is the tap’s own order; index law stays filename+stat.

Do not walk name-sort to roll the date (that is the wrap we already rejected). Coach ticks **dst-A**.

**AT-SOAR-46:** synthetic folder `day=2026-11-01`, file `snap-043000Z.json`, mtime near Nov 1 00:30 ET → `t` is 00:30 EDT, not 23:30 EST. Reverse mtime → the other candidate.

### 0.4 Hash order, Seek leftover, AT-SOAR-45

Unchanged from v1.3: hash is `t`-order; Seek `sorted` / `i % 64` is Lima W8; W5-G requires load-vs-cadence **AT-SOAR-45**.

---

## 1. Locked

| ID | Decision |
|----|----------|
| **FP2** | Order by reconstructed `t` on gold `chain/<SYM>/`. Census: 88/127 wrap **on FatTail2TB**. |
| **FP20** | Window = `[D 00:00 NY, D+1 00:00 NY)` from `ensure_day`/`today_ny`. |
| **FP20a** | Window and local-date are **equivalent** except fall-back. Implement **window**. Local-date is not “wrong.” |
| **FP20b** | Fall-back two-in-window → **mtime closer**. |
| **FP21** | Hash order = that `t` order. |
| **FP22** | W5-G requires AT-SOAR-45. |

**Coach ticks:** spec-C · §9b · **dst-A** · §9.1–4.

| # | Juliet rec |
|---|------------|
| **spec-C** | Implement §2 (expiration optional) |
| **§9b** | `t`-order always; census named on FatTail2TB `chain/<SYM>/` |
| **dst-A** | Two-in-window → closer `st_mtime` |
| **§9.1–4** | Accept spec positions |

---

## 2. DAG / packets

Same as v1.2. W2 implements FP20+FP20b+FP21. W8 leftover list += v0.8 false local-date proof (Coach strikes spec) + Seek paragraph.

**NX17 withdrawn.** New **NX18:** do not ship “local-date is silently wrong” as a comment/doc claim. **NX19:** do not use name-order clock-rollback as the DST tie-break.

---

## 3. AT deltas

Keep v1.3 ATs. Add:

| ID | Claim |
|----|--------|
| **AT-SOAR-46** | 2026-11-01 `043000Z` two-in-window; mtime picks one candidate, not both, not OUT OF WINDOW |
| **AT-SOAR-47** | Non-fall-back day: window pick **equals** NY-local-date pick |

---

## 4. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v1.4** | 2026-08-27 | Census root named FatTail2TB. Local-date ≡ window except DST. Fall-back mtime tie-break. |
| **v1.3** | 2026-08-27 | SUPERSEDED — claimed local-date fails on D-1. |

**One-line law:**  
**The API reads FatTail2TB `chain/<SYM>/`, places each clock in `[D 00:00 NY, D+1 00:00 NY)`, orders and hashes by that instant, and on the one 25-hour night uses mtime when both candidates fit.**
