# ORCHESTRATOR — Canonical Course Model (p-canonical-course)

**Project:** Canonical Course Model v1.0  
**Spec:** `Specs/FatTail-Labs-Canonical-Course-Model-Spec-v1.0.md`  
**Architecture:** `Architecture/08-canonical-course-model.md`  
**Design:** `Architecture/09-canonical-course-design.md`  
**Plan:** `IMPLEMENTATION-PLAN.md`  
**Charter:** `CHARTER.md`  
**Decisions:** DL-061 · DL-061a  
**Close gate:** `gate-reports/C7-project-close.md` → **PASS** (2026-07-26)

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
| **C4** Board converge | **ACCEPTED RESIDUAL** | Alpha | validate-on-place; dual write path OK for v1.0 |
| **C5** Media ZIP | **DEFERRED** | — | Coach: not now |
| **C6** New field UI | **OPTIONAL** | Charlie | not required for v1.0 close |
| **C7** Project close | **DONE / PASS** | Delta · Lima · Mike | `gate-reports/C7-project-close.md` |

---

## Project status: **CLOSED (v1.0)**

Optional follow-ons (not blocking):

1. C4 full shared materialize in `apply_placement`  
2. C6 admin fields for flagship / pathway / audience  
3. C5 media ZIP if Coach reopens  

---

## Seeds

| Seed | Agent | Status |
|------|-------|--------|
| `seeds/C1-alpha-model-core.md` | Alpha | DONE |
| `seeds/C2-alpha-api-import-export.md` | Alpha | DONE |
| `seeds/C3-charlie-admin-ui.md` | Charlie | DONE |
| `seeds/C4-alpha-board-converge.md` | Alpha | ACCEPTED RESIDUAL |
| `seeds/C6-charlie-course-fields.md` | Charlie | OPTIONAL |
| `seeds/C7-delta-lima-close.md` | Delta · Lima | DONE |

---

## Invariants (still binding for any follow-on)

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
- [x] C4 residual accepted (validate shared; materialize dual path)  
- [x] C7 Delta project PASS  

**Full plan:** [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md)  
**Charter:** [CHARTER.md](./CHARTER.md)  
