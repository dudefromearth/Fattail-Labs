# Seed W1a — Kilo + Charlie: Family A Stay-Put Characterization

**Project:** p-app-framework · **Agents:** Kilo (tests), Charlie (fix if red) · **Gate:** feeds Gate 1  
**Depends on:** Gate 0 PASS  
**Read first:** Application Framework Part A4, F1 tests AF1–AF7; `web/components/edit/EditContext.tsx`, `CourseTabs.tsx`, hub edit

## Objective

Automate or script characterization of stay-put for Course + Hub + Catalog so regressions cannot return. Fix only what fails AF1–AF6.

## Task sequence

1. Inventory every `location.reload` under `web/components` on edit success paths — must be zero for Family A content (exempt: DangerZone leave, login).  
2. Add tests and/or a documented manual protocol under `server/tests` or `web` test harness the repo already uses:  
   - Prefer API + component-level checks where browser e2e is absent.  
   - At minimum: unit/integration that structureOp does not call reload (mock); tab state lives on EditProvider.  
3. Manually execute AF1–AF6 on dev with evidence notes if no e2e:  
   - Modules + Add lesson → still Modules  
   - Reorder, Save, Hub FAQ, Catalog card  
4. Charlie fixes any FAIL against Application Framework A4 (declare files first).  
5. Kilo records green suite: `cd server && .venv/bin/python -m pytest tests -q` (and web tests if present).

## Out of scope

Family B · privacy tables · Calendar full redesign · Membership FAQ CMS

## Files likely in scope

`web/components/edit/EditContext.tsx`, `CourseTabs.tsx`, `hub/*`, `CatalogGrid.tsx`, `QuizBuilder.tsx`, `server/tests/**` (new)

## Completion criteria

- [ ] No reload on Family A edit success paths (rg evidence)  
- [ ] AF1–AF6 evidence attached (manual or automated)  
- [ ] pytest green for server suite  
- [ ] Change list declared  

## Report

PASS / FAIL / BLOCKED + commands/output.
