# Seed C4 — Alpha: Board place uses shared importer

**Project:** p-canonical-course  
**Agent:** Alpha  
**Phase:** C4  

## Files in scope

- `server/packages.py`  
- `server/course_model.py` (adapters)  
- `server/tests/test_production_packages.py` (extend, not break)

## Work

1. `apply_placement` builds placement plan → `placement_plan_to_document` → shared materialize.  
2. Preserve replace_draft / refuse published behavior.  
3. Keep existing characterization tests green.

## Gate

Delta after C4.