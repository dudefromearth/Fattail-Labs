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
| **R2** APIs | **DONE** | Alpha · Mike | resources + resources_admin routes · 10 tests |
| **R3a** Resources hub UI | **DONE** | Charlie | ResourceLibrary create/version/publish |
| **R3b** Course builder UI | **DONE** | Charlie | CourseResourcesEditor attach/create/pin |
| **R4** Migrate attachments | **DONE** | Alpha | migrate_attachments_to_resources.py · 13 tests |
| **R5** Canonical package | PENDING | Alpha | |
| **R6** Cutover | PENDING | Alpha · Delta | |
| **R7** Close | PENDING | Delta · Lima | |

## Next action

Open **R5** Canonical package slug/pin (`seeds/R5-alpha-ccm-integration.md`).

---

## Seeds

| Seed | Status |
|------|--------|
| R1–R4 | **DONE** |
| R5–R7 | PENDING |

## R4 operator command

```bash
cd server && set -a && source ../.env && set +a
.venv/bin/python migrate_attachments_to_resources.py --dry-run
.venv/bin/python migrate_attachments_to_resources.py
```

## R1–R2 deliverables

- `migrations/029_resources.sql`
- `server/resources_domain.py`
- `server/routes/resources.py` — list/slug/download (+ legacy attachment download)
- `server/routes/resources_admin.py` — CRUD, versions, publish, course attach/pin/unlink
- Course public payload includes `resources[]` (pins)
- Tests: domain 6 + API 4 = **10 passed**
