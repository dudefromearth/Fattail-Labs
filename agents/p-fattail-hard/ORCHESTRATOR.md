# FatTail Hard — Orchestrator Board

**Program:** `agents/p-fattail-hard/`  
**Coach GO:** 2026-07-31 — H0 opened  
**Build authority:** `Specs/FatTail-Labs-Hard-Mental-Toughness-Spec-v1.0.md`  
**Plan:** `IMPLEMENTATION-PLAN.md`  
**Science:** `science/aMCC-source-pack-v1.md`  

**Doctrine:** Coach Content Law §11 — nothing of Coach’s removed; opinions labeled.

---

## Status board

| Phase | Status | Notes |
|-------|--------|-------|
| **H0** Spec + source pack | **COMPLETE** (2026-07-31) | Spec v1.0 + pack + DL-177 |
| **H1** Domain + privacy + API | **COMPLETE** (2026-07-31) | mig 059 · hard_domain · `/api/me/hard*` · tests |
| **H2** UI + daily + cites | **COMPLETE** (2026-07-31) | `/app/toughness*` · PhysiologyCite · Apps card |
| **H3** MT meter + composite | **COMPLETE** (2026-07-31) | `pi-weights-v1-option1+mt` · Journey §4.1 |
| **H4** Photos + menu depth | **NEXT** | Photos deferred from H2 code, kept in Spec |
| **H5** Agent | pending | Track B deps |
| **H6** Export + close | pending | |

---

## H0 checklist

- [x] Coach GO on plan  
- [x] Hard Spec v1.0 with C1–C10 intact  
- [x] aMCC source pack v1 (primary verified PubMed)  
- [x] ORCHESTRATOR frozen  
- [x] Decision log DL-177  
- [ ] Formal Hotel sign-off on secondaries (open — before H2 copy ship)  
- [ ] Formal Tango/Mike inline reviews (open — H1/H2 gates)  

---

## Defaults locked at GO

| Q | Answer |
|---|--------|
| Photos | Spec keeps requirement; H2 ships record; photos H4 |
| True 75 | Credited offering page + optional link log |
| Route | `/toughness` + Practice link |
| Agent | After H2/H3 |
| MT weights | Proposed in Spec §8.3; Coach ratifies H3-1 |

---

## H1 checklist

- [x] Migration `059_hard_mental_toughness.sql`
- [x] `hard_domain.py` — variants, enroll, daily, pause/exit/resume, MT raw empty rules
- [x] Routes `GET/POST /api/me/hard*`
- [x] Characterization `tests/test_hard.py` (4 passed)
- [x] Physiology cite payload on `GET /api/me/hard`

## H2 checklist

- [x] Hub + True 75 + FatTail Hard + Today pages
- [x] Mandatory aMCC Sources block (`PhysiologyCite`)
- [x] Enroll / daily / pause / exit
- [x] Apps grid Toughness card
- [x] Progress **record** (photo still H4)

## H3 checklist

- [x] `mental_toughness` on process meters
- [x] Empty until active Hard enrollment
- [x] Seven-weight maps when MT live
- [x] Model version bump + Journey Spec + tests

## Next command

Start **H4** (photos + menu depth) or **H5** (agent) when Coach prioritizes.
