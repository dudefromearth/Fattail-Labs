# StudioOne Archive Read API — Full Agent Bench Plan v1.6

**SUPERSEDED** by [`docs/StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v1.7.md`](./StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v1.7.md). Do not stamp this revision.

**Date:** 2026-08-27  
**Plan revision:** **v1.6** (superseded)  
**Canonical filename:** `docs/StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v1.6.md`  
**Supersedes:** v1.5 … v1.0  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**W0 artifact:** [`agents/go/SOAR-W0.md`](../agents/go/SOAR-W0.md)  
**Board:** [`agents/p-studioone-archive-read/`](../agents/p-studioone-archive-read/)  
**Spec:** v0.8 — Coach adds hole **`AMBIGUOUS INSTANT`** and strikes the false local-date proof; this plan does not edit the spec

Packets/DAG as v1.2. Path name: **store** = `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture`.

---

## 0. Answers to the v1.5 review

### 0.1 Envelope timestamp — **confirmed**, not a W2 discovery

Read 2026-08-27 on **store** `day=2026-08-25/chain/SPX/snap-000000997Z.json`:

| Field | Value |
|-------|--------|
| `captured_at` | `2026-08-25T20:00:00.997973-04:00` |
| `generation.as_of` | `2026-08-25T23:59:55.022499Z` |
| Also present | `generation.spot`, `generation.content_hash` |

Friday-flat `day=2026-08-14/chain/snap-132009Z.json`: `captured_at` and `generation.as_of` both present.

**Prefer `captured_at`** (snap write instant; matches the filename clock). `as_of` is the bus generation, seconds earlier. Both exist on nested and Friday-flat. FP20b is not a silent degrade to mtime.

Coach ticks **env-A** (field exists) as Accept of this quote.

### 0.2 Tie-break cascade — do not say `OUT OF WINDOW` when both fit

`OUT OF WINDOW` means **no** candidate is inside. Here **both** are. Hotel reads the hole as data truth.

**Rule [advisor-set], two-in-window files only (`[04:00Z,05:00Z)` fall-back Sunday):**

1. Open that JSON. Usable `captured_at` (else `generation.as_of`) that matches one candidate → take it.  
2. Else closer `st_mtime`.  
3. Else **neighbour-monotonic:** already-resolved `t` on either side; take the candidate that keeps sequence non-decreasing. Not name-order rollback.  
4. Else hole **`AMBIGUOUS INSTANT`** — two in-window candidates, nothing separated them. **200**, named row, skipped like `UNREADABLE`. Never `OUT OF WINDOW`.

An isolated file in that hour with nothing around it is the only case that reaches (4). Coach ticks **dst-A**.

AT-SOAR-7: no envelope open **except** two-in-window files.

### 0.3 Band (unchanged)

AT-SOAR-46 plants inside **`[04:00Z, 05:00Z)`** only.

---

## 1. Locked

| ID | Decision |
|----|----------|
| **FP20b** | Two-in-window: **`captured_at` → `as_of` → mtime → neighbour-monotonic → `AMBIGUOUS INSTANT`**. |
| **FP24** | Envelope timestamp **confirmed** on store nested + Friday-flat. |

**Coach ticks:** spec-C · §9b · **env-A** · **dst-A** · §9.1–4.

| # | Juliet rec |
|---|------------|
| **env-A** | Accept quote: `captured_at` present; prefer it |
| **dst-A** | Cascade above; hole `AMBIGUOUS INSTANT` not `OUT OF WINDOW` |

Lima W8 leftover += spec hole table add `AMBIGUOUS INSTANT` (Coach owns the spec line).

---

## 2. AT deltas

| ID | Claim |
|----|--------|
| **AT-SOAR-46** | Nov 1 file in `[04:00Z,05:00Z)`; usable `captured_at` selects matching candidate |
| **AT-SOAR-48** | Unreadable envelope, mtime stripped: neighbour `t` picks the monotonic candidate |
| **AT-SOAR-49** | Unreadable, no mtime, no neighbours → hole `AMBIGUOUS INSTANT`, not `OUT OF WINDOW` |

---

## 3. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v1.6** | 2026-08-27 | Envelope field confirmed. Cascade + `AMBIGUOUS INSTANT`. |
| **v1.5** | 2026-08-27 | SUPERSEDED — last step misnamed OUT OF WINDOW. |

**One-line law:**  
**On the one Sunday hour, open that file; `captured_at` places it; if nothing can, say AMBIGUOUS INSTANT — never OUT OF WINDOW, never a quiet mtime-only reorder after a copy.**
