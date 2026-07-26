# ORCHESTRATOR — First-class Resources (p-resources)

**Project:** Versioned Resources v1.0  
**Spec:** `Specs/FatTail-Labs-Resource-Spec-v1.0.md`  
**Design:** `Architecture/10-resources-design.md`  
**Plan:** `IMPLEMENTATION-PLAN.md`  
**Charter:** `CHARTER.md`  
**Decisions:** DL-062  

---

## Vision (Coach)

First-class, versioned materials (logs, infographics, worksheets). Slug serves one
published cut for the member hub. Courses pin a version and always show linked
resources. Create from course or library; update = new version.

---

## Status board

| Phase | Status | Owner |
|-------|--------|-------|
| **R0** Spec + design + plan | **DONE (plan)** — awaiting Coach **build** approval | Juliet · Lima |
| **R1** Schema + domain | PENDING | Alpha · Kilo |
| **R2** APIs | PENDING | Alpha · Mike |
| **R3a** Resources hub UI | PENDING | Charlie · Echo · Tango |
| **R3b** Course builder UI | PENDING | Charlie · Echo |
| **R4** Migrate attachments | PENDING | Alpha · Foxtrot |
| **R5** Canonical package | PENDING | Alpha |
| **R6** Cutover | PENDING | Alpha · Delta |
| **R7** Close | PENDING | Delta · Lima |

## Next action

1. **Coach:** approve Resource Spec + this plan for implementation.  
2. **India:** architecture gate (optional before R1).  
3. Open **R1** seed with Alpha.

---

## Seeds

| Seed | Agent | Status |
|------|-------|--------|
| `seeds/R1-alpha-schema-domain.md` | Alpha | PENDING |
| `seeds/R2-alpha-api.md` | Alpha | PENDING |
| `seeds/R3a-charlie-hub-ui.md` | Charlie | PENDING |
| `seeds/R3b-charlie-course-ui.md` | Charlie | PENDING |
| `seeds/R4-alpha-migrate-attachments.md` | Alpha | PENDING |
| `seeds/R5-alpha-ccm-integration.md` | Alpha | PENDING |
| `seeds/R6-alpha-cutover.md` | Alpha | PENDING |
| `seeds/R7-delta-lima-close.md` | Delta · Lima | PENDING |

---

## Invariants (quick)

1. First-class Resource; courses link.  
2. Immutable versions; one published; slug → published.  
3. Course pin always visible on course.  
4. free_preview ≠ publish.  
5. Evidence at Delta gates.  

**Full plan:** [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md)
