# ORCHESTRATOR — First-class Resources (p-resources)

**Project:** Versioned Resources v1.0  
**Spec:** `Specs/FatTail-Labs-Resource-Spec-v1.0.md`  
**Design:** `Architecture/10-resources-design.md`  
**Plan:** `IMPLEMENTATION-PLAN.md`  
**Charter:** `CHARTER.md`  
**Decisions:** DL-062 · build approved 2026-07-26 (Coach)

---

## Status board

| Phase | Status | Owner | Evidence |
|-------|--------|-------|----------|
| **R0** Spec + design + plan | **DONE** | Juliet · Lima | Spec + Arch 10 + plan |
| **R1** Schema + domain | **DONE** | Alpha · Kilo | migration 029 · resources_domain · 6 tests |
| **R2** APIs | PENDING | Alpha · Mike | |
| **R3a** Resources hub UI | PENDING | Charlie · Echo · Tango | |
| **R3b** Course builder UI | PENDING | Charlie · Echo | |
| **R4** Migrate attachments | PENDING | Alpha · Foxtrot | |
| **R5** Canonical package | PENDING | Alpha | |
| **R6** Cutover | PENDING | Alpha · Delta | |
| **R7** Close | PENDING | Delta · Lima | |

## Next action

Open **R2** (`seeds/R2-alpha-api.md`) — member + admin HTTP APIs.

---

## Seeds

| Seed | Status |
|------|--------|
| R1 schema domain | **DONE** |
| R2–R7 | PENDING |

## R1 deliverables

- `migrations/029_resources.sql`
- `server/resources_domain.py`
- `server/tests/test_resources_domain.py` (6 passed)
