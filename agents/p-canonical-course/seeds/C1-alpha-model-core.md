# Seed C1 — Alpha: Canonical model core

**Project:** p-canonical-course  
**Agent:** Alpha  
**Phase:** C1  

## Files in scope

- `migrations/028_canonical_course_model.sql`
- `Specs/schemas/canonical-course-v1.json`
- `server/schemas/canonical-course-v1.json`
- `server/course_model.py`

## Out of scope

- Frontend UI  
- Board place rewiring (C4)  
- ZIP media  

## Work

1. Migration for course/module/lesson fidelity columns.  
2. JSON Schema for envelope + course body.  
3. Pure functions: validate, inspect, placement_plan_to_document, legacy package adapter, project helpers.

## Completion

- [ ] migrate applies clean  
- [ ] unit-level tests can import course_model without app boot issues  
- [ ] validate returns structured report  

## Gate

Feeds C2.