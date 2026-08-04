# Habit Catalog — Full Multi-Agent Bench Plan

**Date:** 2026-08-03  
**Program:** `agents/p-habit-catalog/`  
**Spec:** [`Specs/FatTail-Labs-Habit-Catalog-Spec-v0.1.md`](../Specs/FatTail-Labs-Habit-Catalog-Spec-v0.1.md)  
**Architecture:** [`Architecture/13-habit-catalog-design.md`](../Architecture/13-habit-catalog-design.md)  
**North star:** [`Specs/FatTail-Labs-North-Star-Member-Ethos-Spec-v1.2.md`](../Specs/FatTail-Labs-North-Star-Member-Ethos-Spec-v1.2.md)  

**Sequencing law:** **No implementation seeds until HC0-G PASS (Coach GO).**  
Vertical slice (`daily.execution.size-reason`) must close the loop before full seed polish.

---

## 0. Mission (one screen)

Ship **Habit Catalog** as Practice methodology SoR:

1. System catalog of first-class habits  
2. Member **active stack** + **evidence events**  
3. **Coverage law** (no invented gaps)  
4. Retro install → habit plans (max 2)  
5. Journal evidence hooks  
6. Journey **methodology strip** (not grade fusion)  
7. Family B export/purge  

**Tags remain lexicon; Habits remain methodology.**

---

## 1. Outcomes / Definition of Done

| # | Outcome |
|---|---------|
| 1 | Member adopts starter stack or installs habits; sees week coverage |
| 2 | Journal member messages can create phase evidence events |
| 3 | Retro shows coverage; install creates plan + activation |
| 4 | Journey returns `methodology` without changing grades |
| 5 | Isolation + export/purge proven |
| 6 | Guide mentions Habits; suite nav live |
| 7 | HC6-G PASS · DL entry · Spec status BUILD/as-built |

---

## 2. Critical path

```text
HC0 Spec GO
  → HC1 Schema + seed + domain + APIs
  → HC2 /app/habits + suite nav
  → HC3 Retro coverage + install  ──┐
  → HC4 Journal evidence (+ soft)  ─┼→ vertical slice green
  → HC5 Journey strip              ─┘
  → HC6 Export + Guide + CLOSE
```

HC3 and HC4 may parallel after HC2 if Alpha capacity allows; **HC1 blocks all**.

---

## 3. Phase plans

### HC0 — Spec lock & GO

| Seed | Agent | Work |
|------|-------|------|
| HC0-0 | **Coach** | Locks L1–L6; GO / amend Spec |
| HC0-1 | **India** | Domain model, coverage law, Family B floor, Journey non-fusion |
| HC0-2 | **Tango** | Copy, shame, capacity, starter stack language |
| HC0-3 | **Echo** | Value-first landing wireframes/notes; suite nav weight |
| HC0-4 | **Mike** | Isolation, export/purge surface list, no admin raw |
| HC0-G | **Delta** | Ternary: Spec + reviews complete → unlock HC1 |

**Deliverable:** Spec header → BUILD AUTHORITY · DL-xxx GO · board NEXT = HC1

---

### HC1 — Schema, seed, domain, APIs

| Seed | Agent | Work |
|------|-------|------|
| HC1-1 | **Alpha** | Migration `NNN_habit_catalog.sql`: definitions, activations, events; `habit_definition_id` on plans |
| HC1-2 | **Alpha** | Seed definitions from Spec §3.3; containers not activatable |
| HC1-3 | **Alpha** | `habit_domain.py`: coverage algorithm exact Spec §2.1 |
| HC1-4 | **Alpha** | Routes `/api/me/habits/*`; extend habit-plans create |
| HC1-5 | **Kilo** | Characterization: coverage matrix, isolation, plan cap, soft max |
| HC1-G | **Delta** | API + tests green; no UI required |

**Out of scope:** Frontend, journal hooks, journey payload.

**Evidence:** pytest list in gate report; curl catalog/active/coverage.

---

### HC2 — Member UI

| Seed | Agent | Work |
|------|-------|------|
| HC2-1 | **Charlie** | `practiceSuite.ts` + Habits route `/app/habits` |
| HC2-2 | **Charlie** | Landing: active stack, week proof, install, catalog accordion, starter CTA |
| HC2-3 | **Echo** | Visual pass: hierarchy, empty states, no encyclopedia lead |
| HC2-4 | **Tango** | Copy pass on UI strings |
| HC2-G | **Delta** | Browser/manual evidence: empty → adopt → list |

---

### HC3 — Retrospective integration

| Seed | Agent | Work |
|------|-------|------|
| HC3-1 | **Alpha** | Attach `habit_coverage` to retro gather or GET workspace |
| HC3-2 | **Charlie** | `RetroCoveragePanel` + Install CTA → plans + active |
| HC3-3 | **Kilo** | Tests: missing only when due+active; install 409 on 3rd plan |
| HC3-G | **Delta** | Ceremony evidence + API |

---

### HC4 — Journal evidence

| Seed | Agent | Work |
|------|-------|------|
| HC4-1 | **Alpha** | On member message: derive `journal_phase_*` events when activation due |
| HC4-2 | **Alpha** | Optional: one soft prompt key for due+missing (respect RTH, distress) |
| HC4-3 | **Kilo** | Tests: phase event written; distress path no prompt; closed date no write |
| HC4-G | **Delta** | Vertical slice journal→event→coverage |

---

### HC5 — Journey expression

| Seed | Agent | Work |
|------|-------|------|
| HC5-1 | **Alpha** | `GET /api/me/journey` + `methodology` object |
| HC5-2 | **Charlie** | `JourneyMethodologyStrip` + link `/app/habits` |
| HC5-3 | **Kilo** | Assert grade fields unchanged when methodology present |
| HC5-G | **Delta** | Strip visible; meters golden path still green |

---

### HC6 — Portability, docs, close

| Seed | Agent | Work |
|------|-------|------|
| HC6-1 | **Alpha** | Export Spec bump + export/purge activations/events |
| HC6-2 | **Lima** | Guide + ADMIN if needed + DL close + Spec as-built note |
| HC6-3 | **Charlie** | Guide § Habits short |
| HC6-4 | **Kilo** | Full suite related tests |
| HC6-G | **Delta** | Program PASS |

---

## 4. Agent RACI (summary)

| Agent | Owns |
|-------|------|
| **Coach** | GO, L1–L6 locks, ship/no-ship |
| **Juliet** | Board, seeds, sequencing |
| **India** | Spec integrity, domain, coverage law |
| **Alpha** | Schema, domain, APIs, hooks |
| **Charlie** | Web UI, suite nav, Journey strip |
| **Echo** | Value-first visual design |
| **Tango** | Member psychology, copy |
| **Mike** | Family B, export/purge security |
| **Kilo** | Characterization, isolation, non-fusion |
| **Delta** | Ternary gates HC0–HC6 |
| **Lima** | DL, Spec status, Guide truth |
| **Hotel** | Optional seed craft accuracy |
| **Foxtrot** | Deploy only if env flags needed (none expected) |

**Coordination:** through Coach/Juliet only. No waived Delta gates.

---

## 5. Seed inventory

```text
agents/p-habit-catalog/
  CHARTER.md
  ORCHESTRATOR.md
  IMPLEMENTATION-PLAN.md
  seeds/
    HC0-0-coach-go.md
    HC0-1-india-spec.md
    HC0-2-tango-copy.md
    HC0-3-echo-ux.md
    HC0-4-mike-privacy.md
    HC0-G-delta.md
    HC1-1-alpha-schema.md
    HC1-2-alpha-seed.md
    HC1-3-alpha-domain.md
    HC1-4-alpha-api.md
    HC1-5-kilo-tests.md
    HC1-G-delta.md
    HC2-1-charlie-nav-route.md
    HC2-2-charlie-landing.md
    HC2-3-echo-visual.md
    HC2-4-tango-ui-copy.md
    HC2-G-delta.md
    HC3-1-alpha-retro-coverage.md
    HC3-2-charlie-retro-ui.md
    HC3-3-kilo-retro-tests.md
    HC3-G-delta.md
    HC4-1-alpha-journal-events.md
    HC4-2-alpha-soft-prompt.md
    HC4-3-kilo-journal-tests.md
    HC4-G-delta.md
    HC5-1-alpha-journey-payload.md
    HC5-2-charlie-journey-ui.md
    HC5-3-kilo-nonfusion.md
    HC5-G-delta.md
    HC6-1-alpha-export.md
    HC6-2-lima-docs.md
    HC6-3-charlie-guide.md
    HC6-4-kilo-suite.md
    HC6-G-delta-close.md
  gate-reports/
    README.md
```

Seeds HC0 written at program open; HC1+ may be fleshed when GO lands (Juliet).

---

## 6. Invariants (all seeds)

1. Standalone repo; no MSC code.  
2. Family B isolation; fail loud.  
3. Coverage law exact — no invented gaps.  
4. Max 2 active habit plans.  
5. Journey grade non-fusion.  
6. Distress overrides habit prompts.  
7. Process language; no profit claims; no shame streaks.  
8. Evidence over assertion at every gate.  
9. Change control: seed lists files before touch.

---

## 7. Risk register

| Risk | Mitigation |
|------|------------|
| Checkbox fatigue | Value-first landing; soft max; vertical slice first |
| False coverage | Under-count; proxy labeled |
| Scope creep | HC1–2 slice before full seed polish |
| Privacy | Mike HC0; export/purge HC6 |
| Retro invents struggle | Coverage law + Ethos Truth 1 |

---

## 8. Coach GO checklist (HC0-0)

- [ ] Spec v0.1 accepted or amended  
- [ ] L1–L6 locks recorded  
- [ ] Reviews HC0-1…4 PASS or waived with written residual  
- [ ] HC0-G PASS  
- [ ] DL GO entry  
- [ ] Board NEXT = HC1  

---

## 9. Document history

| Ver | Date | Note |
|-----|------|------|
| 1.0 | 2026-08-03 | Initial multi-agent plan from Architecture/13 + Spec v0.1 |
