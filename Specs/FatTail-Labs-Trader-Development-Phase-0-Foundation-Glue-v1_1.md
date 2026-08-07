# FatTail Labs — Trader Development Phase 0
## Foundation Glue — Product Enhancement

**Status:** **BUILD AUTHORITY** (Coach GO 2026-08-07 · DL-254) — implement under Agent Bench TD0  
**Supersedes:** v1.0 (2026-08-07 draft) — all v1.0 content preserved; deltas listed in §11  
**Type:** Product enhancement (no new SoR, no new tables, no new vendors)  
**Horizon:** ~1–3 weeks  
**Value / Effort / Risk:** High / Low / Low  
**Parent:** [Trader Development Roadmap v1.1](./FatTail-Labs-Trader-Development-Roadmap-v1_1.md)  
**OD authority:** [Decision Addendum v1.1](./FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md)
**As-built contracts this spec finishes against (do not respec):**
Tag Manager Spec **v0.3** (BUILD AUTHORITY, DL-159) · Trade Log Spec **v1.1** (+§15/§16) ·
Journal Session Spec **v0.6** · Practice Context Spec **v0.2** (implemented resolutions) ·
Member Practice Export Spec **v1.3** · Continuous Journaling Direction (DL-191)
**Doctrine:** Trader development, not trade development · process outcomes only · Family B absolute · fail loud · capacity over dependency

---

## 1. Goal statement

Phase 0 makes the existing Practice surfaces tell **one trader-development story** and turns
the Tag lexicon from installed infrastructure into a **daily process tool**. Nothing new is
invented: the member should leave Phase 0 able to (a) see the formation spine named
consistently wherever they practice, (b) label trades and journal sessions from the lexicon
without hunting, and (c) ask one process question of their book — "what did I label, and how
often?" — from Reports. The phase is complete when a member describes Practice as *practice*,
not as "my journal," and no code path invented a second vocabulary, store, or score to do it.

| Mode | This phase |
|------|------------|
| **Own** | Process Tags productization; trader-development framing across chrome |
| **Match** | None (no sync, no charts) |
| **Refuse** | No new analytics theater; no P&L-by-tag anywhere |

---

## 2. User journeys

### 2.1 Happy path — the daily label loop

1. Member opens `/app/trade-log` (Practice context: account + date already in chrome).
2. Logs a fill via the trade sheet; in the same sheet, assigns `chased` (behavior) and
   `followed plan` (process) from the shared TagPicker. Two taps, no navigation.
3. Opens Journal for the date (one hop via day strip); tags the session `hesitation`.
4. End of week, opens Reports; filters the window by tag `chased`; sees **count of labeled
   trades and days** for the window. No P&L column appears next to the tag.
5. The Practice story strip is visible on the hub the whole time, naming where this activity
   sits in the spine.

### 2.2 Failure paths (must fail loud, not silently)

| Failure | Required behavior |
|---------|-------------------|
| Member picks a retired tag (stale client list) | Assignment rejected 422 with reason; picker refreshes. Never silently dropped |
| Tag filter requested with unknown/retired tag id | Empty result **with explicit "no matches for this tag"** state — not an unfiltered list |
| Tag service unavailable | Picker shows error state; trade/journal save is **not blocked** (tags are never required — TM v0.3) |
| Export after new filter API lands | Round-trip unchanged; regression suite proves it (§7) |

---

## 3. In / out of scope

| Item | Mode | In v1.1 |
|------|------|---------|
| Practice story chrome (§4) | Own | Yes |
| Tag assign/unassign density on Trade Log + Journal (§5) | Own | Yes |
| Tag → Reports thin filter (§6) | Own | Yes |
| Journal ↔ day-trades strip polish (§5.3) | Own | Yes |
| Export/import regression gate (§7) | Reliability | Yes |
| Playbook CRUD, Campaign object | Own | **No — Phase 1** |
| Broker sync, trade charts | Match | **No — Phase 2** |
| Journey meter formula changes | — | **No** |
| Win-rate / expectancy by tag | Refuse | **Never** (TM v0.3 §7) |

---

## 4. Practice story chrome

### 4.1 Placement

One short strip (or single line) on: **Practice hub**, **Journey intro**, **Playbook stub**
(until Phase 1 replaces it), and the Practice suite empty states. Not on every app header —
the suite nav already names the apps; the strip explains the spine once per surface entry,
not per pageview.

### 4.2 Copy (normative — OD-0.1 locked)

**OD-0.1 LOCKED — progressive until Phase 1 exit, then full spine.**

**Phase 0 ship (progressive):**

> **You are building a trader, not a trade.** Log & Tags → Journal → Retrospective → Journey · Toughness — Playbook and Campaigns arrive next.

**After Phase 1 exit (full spine):**

> **You are building a trader, not a trade.** Playbook → Campaign → Log & Tags → Journal → Retrospective → Journey · Toughness

**Copy rules (Tango gate):** process outcomes only; no profit claims; operator / practice /
capital-preservation language; no copy explaining how surfaces relate beyond the one strip
(delete a surface reference rather than explain it — standing Coach rule).

---

## 5. Tags discoverability

### 5.1 Trade Log

- Trade sheet: TagPicker section in the process block (below adherence). Assign/unassign
  against `object_type=trade` via existing `/api/tags/assignments` (TM v0.3 §5).
- Blotter row: read-only tag chips (max ~3 + overflow count); click-through opens sheet.
- No free-text create; retired tags never offered (existing rules — verify, don't rebuild).

### 5.2 Journal

- Session tag control exists — this phase **verifies density and empty states** only:
  picker reachable without scrolling past the composer; empty state teaches the lexicon in
  one line ("Label the day in the trader's language — browse the Lexicon"), linking the
  read-only Lexicon browse on `/resource`.

### 5.3 Journal ↔ day trades strip

Close the glance gaps: a Journal day shows that date's Trade Log evidence (day-book DTO,
as-built `analytics/day-book`) with working link density and honest empty states ("No fills
logged for this date" — never blank). One hop each direction (CJ direction §4.2).

### 5.4 UX invariants

1. Assigning a tag never navigates away from the sheet/session.
2. Tags are never required to save anything (TM v0.3 §7 — re-assert in tests).
3. Member cannot create/rename/retire from any Practice surface (admin lexicon only).

---

## 6. Tag → Reports thin slice

### 6.1 Product shape

On **Reports** (primary) — and optionally the blotter filter row (secondary) — a member can:

- Filter the analysis window by one or more tags in categories **process** / **behavior**
  (seed categories per TM v0.3 §6; categories are data — read from `/api/tags`, not hardcoded).
- See **counts**: labeled trades in window; labeled journal days in window; per-tag frequency.

### 6.2 Explicit non-goals (Refuse — binding)

No win-rate, expectancy, P&L, or equity series **grouped by, filtered into, or displayed
adjacent to** a tag. TM v0.3 forbids P&L correlation; "adjacent" is included deliberately —
a tag filter that re-renders the P&L chart for the filtered subset is correlation theater by
composition. If the member has P&L opt-in enabled in Reports, tag filters apply to
**process widgets only** in Phase 0.

### 6.3 Contract — OD-0.2 LOCKED (Option A)

**Server-side filter only** — identity-scoped join on
`tag_assignments (object_type IN ('trade','journal_session'), identity_id = caller)`.

| Mechanism | Shape |
|-----------|--------|
| **A (locked)** | `tag_ids=` on analytics reads and/or thin `GET /api/me/tags/usage?from=&to=` — server joins assignments Family-B-scoped |
| B client post-filter | **Rejected** — lies under pagination/windows |

New endpoint (if any) gets characterization tests in the same change (platform invariant #10).
Blotter secondary filter: **in Phase 0** if free; otherwise Reports-primary is enough for exit.

---

## 7. Reliability invariants

| ID | Invariant |
|----|-----------|
| R-0.1 | Family B: tag filter reads never cross identity; assignments on member objects invisible to any other member (TM v0.3 verification #5 re-run) |
| R-0.2 | Practice export/import round-trip stays green for Trade Log, Journal sessions, Retros, and tag assignments; additive import never duplicates assignments |
| R-0.3 | No new tables, no new vocabulary store, no per-app tag cache acting as SoR |
| R-0.4 | Tag reads fail loud (explicit error/empty states); never a silent unfiltered fallback |
| R-0.5 | Story chrome is static copy — no new data dependency that can break a page |

---

## 8. Acceptance criteria (Delta-checkable)

1. From a fresh trade in the sheet, assign + unassign a lexicon tag without leaving the sheet; assignment visible on blotter chip after save. (UI walk)
2. Journal session tag control reachable and functional on desktop + mobile widths; empty state copy approved by Tango. (UI walk)
3. Reports shows tag filter for process/behavior categories; filtered counts match a hand-checked fixture. (curl + fixture test)
4. Filtering by a tag with zero assignments in window shows explicit empty state. (UI walk)
5. Retired tag: not offered in picker; direct API assign returns 422. (curl)
6. No surface renders P&L, win-rate, or expectancy grouped by or alongside a tag filter. (UI walk + grep-level copy check)
7. Export → purge → import round trip preserves tag assignments exactly once. (pytest — existing suite + any new filter tests)
8. Story strip present on agreed surfaces with approved copy; absent everywhere else. (UI walk)
9. Non-admin cannot reach any tag CRUD from Practice. (curl 403)

---

## 9. Dependencies

| Depends on | Status |
|------------|--------|
| Tag Manager v0.3 | As-built (DL-159) |
| Trade Log v1.1 sheet + day-book analytics | As-built |
| Journal Session v0.6 | As-built |
| Practice Context v0.2 | Implemented resolutions — **use, do not rewrite** |
| Member Practice Export v1.3 | As-built — regression target |

## 10. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Filter API scope-creeps into analytics rebuild | OD-0.2 bounds it to counts + filter; anything more is Phase 2 report pack |
| Story copy names unbuilt features | OD-0.1 progressive option |
| Tag adjacency to P&L slips in via Reports composition | §6.2 binding rule + acceptance #6 |

---

## 11. v1.0 → v1.1 ideas inventory (nothing silently dropped)

| v1.0 item | Disposition |
|-----------|-------------|
| Story chrome (§3.1) | Kept; copy drafted; placement bounded; OD-0.1 added |
| Tags discoverability (§3.2) | Kept; expanded to concrete surfaces + invariants |
| Tag → Reports thin slice (§3.3) | Kept; "and/or" mechanism resolved into OD-0.2 with recommendation |
| Journal ↔ day strip (§3.4) | Kept (§5.3) |
| Portability regression (§3.5) | Kept, promoted to reliability invariant R-0.2 |
| "No new tables / vendors" (§4) | Kept, promoted to R-0.3 |
| All v1.0 out-of-scope items | Kept verbatim (§3) |

## 12. Open decisions — **RESOLVED** (Decision Addendum v1.1)

| # | Lock |
|---|------|
| OD-0.1 | **Progressive** story copy until Phase 1 exit; then full spine |
| OD-0.2 | **Option A** server-side tag filter / usage API |
| OD-0.3 | **Lexicon link allowed** in Practice empty states (teaching moment) |

See [Decision Addendum](./FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md).

## 13. Decision-log entry (draft, on approval)

> **Phase 0 Foundation Glue:** Practice surfaces adopt one trader-development story strip;
> Tag lexicon (TM v0.3) surfaced as a daily labeling tool on Trade Log and Journal; Reports
> gains a process/behavior tag filter with counts only — no P&L correlation or adjacency,
> ever. No new stores, vocabularies, or vendors. Export round-trip regression is a phase
> gate. No profit claims. Family B unchanged.

## 14. Agent Bench

| Artifact | Path |
|----------|------|
| Phase bench plan | [`Docs/Trader-Development-Phase-0-Agent-Bench-Plan.md`](../Docs/Trader-Development-Phase-0-Agent-Bench-Plan.md) |
| Full program plan | [`Docs/Trader-Development-Full-Agent-Bench-Plan-v1.0.md`](../Docs/Trader-Development-Full-Agent-Bench-Plan-v1.0.md) |
| Board | [`agents/p-trader-development/`](../agents/p-trader-development/) |
| Decision addendum | [`FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md`](./FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md) |

Gate prefix: **TD0-***. No TD1+ until **TD0-G** PASS.

---

## 15. Document history

| Date | Note |
|------|------|
| 2026-08-07 | v1.0 draft (Coach/Grok) |
| 2026-08-07 | v1.1 Claude first pass — journeys, contracts, acceptance, ODs |
| 2026-08-07 | v1.1a — OD locks + Agent Bench links (Decision Addendum) |
