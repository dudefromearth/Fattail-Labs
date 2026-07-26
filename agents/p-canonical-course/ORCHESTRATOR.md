# ORCHESTRATOR — Canonical Course Model (p-canonical-course)

**Project:** Canonical Course Model v1.0  
**Spec:** `Specs/FatTail-Labs-Canonical-Course-Model-Spec-v1.0.md`  
**Architecture:** `Architecture/08-canonical-course-model.md`  
**Design:** `Architecture/09-canonical-course-design.md`  
**Plan:** `IMPLEMENTATION-PLAN.md`  
**Charter:** `CHARTER.md`  
**Decisions:** DL-061 · DL-061a  

---

## Vision (Coach)

One portable, inspectable, validatable definition of a Course — references over
duplication, content blocks, export/import round-trip — shared by manual create
and automated production. YouTube video; resource pointers; free_preview = auth only.

---

## Status board

| Phase | Status | Owner | Evidence |
|-------|--------|-------|----------|
| **C0** Spec + arch + design + DL | **DONE** | Juliet · Lima | Specs + Arch 08/09 + DL-061/a |
| **C1** Model core | **DONE** | Alpha · Kilo | migration 028 · course_model.py · schema |
| **C2** API + tests | **DONE** | Alpha · Kilo | routes + test_canonical_course_model |
| **C3** Admin UI MVP | **DONE** | Charlie | Export package · Import package |
| **C4** Board converge | **PARTIAL** | Alpha | validate-on-place; materialize residual |
| **C5** Media ZIP | **DEFERRED** | — | Coach: not now |
| **C6** New field UI | **PENDING** | Charlie | seed C6 |
| **C7** Project close | **PENDING** | Delta · Lima | seed C7 |

---

## Next actions (Coach)

1. Prefer **C4 residual** (single materialize path) or skip and run **C7**.  
2. Optional **C6** admin fields.  
3. Do **not** open C5 without reopening media-ZIP decision.

---

## Seeds

| Seed | Agent | Status |
|------|-------|--------|
| `seeds/C1-alpha-model-core.md` | Alpha | DONE |
| `seeds/C2-alpha-api-import-export.md` | Alpha | DONE |
| `seeds/C3-charlie-admin-ui.md` | Charlie | DONE |
| `seeds/C4-alpha-board-converge.md` | Alpha | PARTIAL |
| `seeds/C6-charlie-course-fields.md` | Charlie | PENDING |
| `seeds/C7-delta-lima-close.md` | Delta · Lima | PENDING |

Full sequencing: **`IMPLEMENTATION-PLAN.md`**.

---

## Invariants

1. MySQL = runtime SoR for members.  
2. Fail loud on invalid package / missing refs.  
3. Never silent overwrite published.  
4. No member PII; no media ZIP v1.0.  
5. YouTube only; preserve lesson kinds; free_preview = auth flag.  
6. No MarketSwarm code import.  
7. Evidence over assertion at Delta gates.  

---

## Definition of done (project)

- [x] Spec + architecture + design + decision log  
- [x] Round-trip tests green  
- [x] Admin export/import without SQL  
- [x] DL-061 / DL-061a  
- [x] Delta C2 gate report  
- [ ] C4 residual **or** Coach-accepted dual path  
- [ ] C7 Delta project PASS  

**Full plan:** [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md)  
**Charter:** [CHARTER.md](./CHARTER.md)
