# ORCHESTRATOR — First-class Resources (p-resources)

**Project:** Versioned Resources v1.0  
**Spec:** `Specs/FatTail-Labs-Resource-Spec-v1.0.md` (**approved as built**)  
**Design:** `Architecture/10-resources-design.md`  
**Plan:** `IMPLEMENTATION-PLAN.md`  
**Charter:** `CHARTER.md`  
**Decisions:** DL-062 … DL-062f  
**Close gate:** `gate-reports/R7-project-close.md` → **PASS** (2026-07-26)

---

## Vision (Coach)

First-class, versioned materials (logs, infographics, worksheets). Slug serves one
published cut for the member hub. Courses pin a version and always show linked
resources. Create from course or library; update = new version.

---

## Status board

| Phase | Status |
|-------|--------|
| R0 Spec + design + plan | **DONE** |
| R1 Schema + domain | **DONE** |
| R2 APIs | **DONE** |
| R3a Resources hub UI | **DONE** |
| R3b Course builder UI | **DONE** |
| R4 Migrate attachments | **DONE** |
| R5 Canonical package | **DONE** |
| R6 Cutover | **DONE** |
| **R7 Close** | **DONE / PASS** |

## Project status: **CLOSED (v1.0)**

Optional follow-ons: lesson-level attach UI, attachment table cleanup, bulk repin.

### Operator reminders

```bash
# Per environment after deploy
cd server && .venv/bin/python migrate.py
.venv/bin/python migrate_attachments_to_resources.py --dry-run
.venv/bin/python migrate_attachments_to_resources.py
```
