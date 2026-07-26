# ORCHESTRATOR — Canonical Course Model (p-canonical-course)

**Project:** Canonical Course Model v1.0  
**Spec:** `Specs/FatTail-Labs-Canonical-Course-Model-Spec-v1.0.md`  
**Plan:** `IMPLEMENTATION-PLAN.md`  
**Close gate:** C7 PASS; **C4 + C6 completed** after close residual  

---

## Status board

| Phase | Status | Evidence |
|-------|--------|----------|
| C0 Spec + arch + design | **DONE** | Specs + Arch 08/09 + DL-061/a |
| C1 Model core | **DONE** | migration 028 · course_model.py |
| C2 API + tests | **DONE** | canonical routes + tests |
| C3 Admin UI export/import | **DONE** | Export package · Import package |
| **C4** Board → shared materialize | **DONE** | `apply_placement` → `import_document`; `materialized_via` |
| C5 Media ZIP | **DEFERRED** | Coach: not now |
| **C6** New field admin UI | **DONE** | COURSE_FIELDS + CourseCanonicalMeta |
| C7 Project close | **DONE / PASS** | gate-reports/C7-project-close.md |

## Project status: **IMPLEMENTED (v1.0 plan)**

Optional only: C5 media ZIP if Coach reopens.

## Seeds

| Seed | Status |
|------|--------|
| C1–C3 | DONE |
| C4 | **DONE** |
| C5 | DEFERRED |
| C6 | **DONE** |
| C7 | DONE |

## Verification

```bash
cd server && .venv/bin/python -m pytest \
  tests/test_canonical_course_model.py tests/test_production_packages.py -q
# 18 passed
```
