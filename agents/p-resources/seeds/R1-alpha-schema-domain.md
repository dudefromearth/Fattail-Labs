# Seed R1 — Alpha: Schema + resource domain

**Project:** p-resources  
**Agent:** Alpha (+ Kilo tests)  
**Phase:** R1  
**Prerequisite:** Coach build approval  

## Files in scope

- `migrations/0NN_resources.sql` (next free number)  
- `server/resources_domain.py` (new)  
- `server/tests/test_resources_domain.py` (new)  
- `Architecture/04-domain-data-model.md` (migration row)  

## Out of scope

- HTTP routes, UI, attachment backfill  

## Work

1. Tables: `resources`, `resource_versions`, `course_resource_links` (+ optional `resource_migration_map`).  
2. Domain functions: create_resource, add_version, publish, unpublish, attach_to_course, set_pin.  
3. Invariants: monotonic version; single published; pin must belong to resource.  
4. Tests for U3/U4 logic at domain layer.  

## Completion

- [ ] migrate applies  
- [ ] pytest domain suite green  
- [ ] No HTTP yet  

## Gate

Feeds R2.