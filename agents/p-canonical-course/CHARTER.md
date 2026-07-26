# Charter — p-canonical-course

**Project:** Canonical Course Model v1.0  
**Product:** FatTail Labs (`labs.fattail.ai`)  
**Coach intent:** One portable, inspectable, validatable definition of a Course —
shared by manual create/edit and automated production.

## Authority

| Role | Agent |
|------|--------|
| Final approval | **Coach** |
| Orchestration | **Juliet** |
| Architecture / domain | **India** |
| Backend | **Alpha** |
| Frontend admin | **Charlie** |
| Design polish | **Echo** |
| Security | **Mike** |
| Doctrine lint | **Sierra · Hotel · Tango** |
| Tests | **Kilo** |
| Gates | **Delta** |
| Decision log / docs | **Lima** |
| Production factory | **Quebec** (consumes model; does not redefine graph) |

## Specs & docs of record

| Doc | Path |
|-----|------|
| Spec | `Specs/FatTail-Labs-Canonical-Course-Model-Spec-v1.0.md` |
| JSON Schema | `Specs/schemas/canonical-course-v1.json` |
| Architecture | `Architecture/08-canonical-course-model.md` |
| Design | `Architecture/09-canonical-course-design.md` |
| Decisions | DL-061 + DL-061a in `Architecture/00-decision-log.md` |
| Plan | `agents/p-canonical-course/IMPLEMENTATION-PLAN.md` |
| Board | `agents/p-canonical-course/ORCHESTRATOR.md` |

## Invariants (non-negotiable)

1. MySQL remains **runtime** system of record for members.  
2. Packages are **references** (YouTube ids + Resource pointers + instructor URL refs) — **no media ZIP in v1.0**.  
3. YouTube is the **only** video provider in v1.0 product path.  
4. Lesson `kind` is preserved exactly.  
5. `free_preview` is an **authorization flag** only — same content shape as any lesson.  
6. Import never silently overwrites a **published** course.  
7. Fail loud on invalid schema / missing required refs.  
8. No member PII in packages.  
9. Standalone repo — no MarketSwarm code import.  
10. Evidence over assertion at every Delta gate.

## Success

- Export → validate → import new draft → structure and mapped fields match.  
- Admins export/import without SQL.  
- Automation (placement) validates against the same model.  
- Spec + architecture + design + decision log stay truthful with the code.
