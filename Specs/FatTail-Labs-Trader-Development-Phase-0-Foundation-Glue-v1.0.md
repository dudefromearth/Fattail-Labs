# FatTail Labs — Trader Development Phase 0  
## Foundation Glue — Product Enhancement

**Status:** DRAFT — Coach review  
**Type:** Product enhancement (no major new architecture)  
**Horizon:** ~1–3 weeks  
**Value / Effort / Risk:** High / Low / Low  
**Parent:** [Trader Development Roadmap v1.0](./FatTail-Labs-Trader-Development-Roadmap-v1.0.md)  
**Touches:** Practice suite chrome · Tag Manager (as-built) · Trade Log · Journal · Reports · Journey copy · Practice export regression  

---

## 1. Summary

Phase 0 does **not** invent the formation loop. It **makes existing surfaces tell one story** and turns **Tags** from infrastructure into a **visible process tool**.

| Mode | This phase |
|------|------------|
| Own | Process Tags productization; trader-dev framing |
| Match | None (no sync/charts yet) |
| Refuse | No new analytics theater |

---

## 2. Problem

| Gap | Effect |
|-----|--------|
| Story is split across apps | Members experience “tools,” not trader development |
| Tag Manager v0.3 is live but under-surfaced | Lexicon exists; labeling + process filters are not habitual |
| Reports underuse Tags | Process language does not appear in review chrome |

---

## 3. Product change description

### 3.1 Practice story chrome

**Enhancement:** Consistent one-line (or short strip) framing across Practice hub, suite nav context, Playbook stub, Journey intro:

> Playbook → Campaign → Log & Tags → Journal → Retrospective → Journey · Toughness

**Copy rules (Tango):** process outcomes; no profit claims; “operator / practice / capital preservation.”

### 3.2 Tags discoverability (Trade Log + Journal)

**Enhancement:** Ensure members can **assign and unassign** lexicon tags without hunting:

- Trade drawer / row actions: compact tag control (Tag Manager v0.3 contract)  
- Journal session: tag control already partially present — verify density and empty states  
- No free-text create; retired tags not assignable (existing rules)

### 3.3 Tag → Reports thin slice

**Additional feature:** Process filter on Reports (and/or Trade Log list) by tag category **process** / **behavior**:

- Counts of labeled trades / days  
- Filter book by selected tag(s)  
- **Explicit non-goal:** win-rate or expectancy by tag as headline (Tag Manager Spec forbids P&L correlation theater)

### 3.4 Journal ↔ day trades strip

**Enhancement:** Polish any gaps so a Journal day shows the day’s Trade Log evidence in one glance (link density, empty states, Practice date context).

### 3.5 Portability regression

**Quality gate:** Practice export/import remains green for Trade Log, Journal sessions, Retros, Tags assignments; no silent breakage while Phase 1 objects land.

---

## 4. Architectural change

**None required** beyond optional:

| Item | Note |
|------|------|
| Reports filter API | Query param or post-filter on existing analytics routes |
| Tag assignment UX | Existing `/api/tags` + assignment APIs |

No new tables. No new vendors. No campaign/playbook SoR yet (Phase 1).

---

## 5. Surfaces & acceptance

| Surface | Done when |
|---------|-----------|
| Practice / suite | Story framing visible and consistent |
| Trade Log | Tag assign/filter obvious without admin docs |
| Journal | Tags + day trades usable in one session |
| Reports | At least one process-tag filter with counts |
| Tests | Existing tag + export tests still pass; add thin filter tests if new API |

---

## 6. Dependencies

| Depends on | Status |
|------------|--------|
| Tag Manager v0.3 | As-built |
| Practice suite nav | As-built |
| Practice Context (account/date) | Spec v0.2 — use, do not rewrite |

---

## 7. Out of scope

- Playbook CRUD (Phase 1)  
- Campaign model (Phase 1)  
- Broker auto-sync (Phase 2)  
- Trade charts (Phase 2)  
- Journey meter formula changes  

---

## 8. Exit criteria

1. Member can label trades/sessions from lexicon without confusion.  
2. Member can filter process-relevant activity by tag on Reports or blotter.  
3. Product copy states trader-development spine, not “trading journal.”  
4. Export/import suite still green.  

---

## 9. Agent Bench

| Artifact | Path |
|----------|------|
| Phase bench plan | [`Docs/Trader-Development-Phase-0-Agent-Bench-Plan.md`](../Docs/Trader-Development-Phase-0-Agent-Bench-Plan.md) |
| Full program plan | [`Docs/Trader-Development-Full-Agent-Bench-Plan-v1.0.md`](../Docs/Trader-Development-Full-Agent-Bench-Plan-v1.0.md) |
| Board | [`agents/p-trader-development/`](../agents/p-trader-development/) |

Gate prefix: **TD0-***. No TD1+ until **TD0-G** PASS.

---

## 10. Document history

| Date | Note |
|------|------|
| 2026-08-07 | v1.0 draft |
| 2026-08-07 | Linked Agent Bench plan TD0 |
