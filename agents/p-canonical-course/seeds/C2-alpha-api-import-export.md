# Seed C2 — Alpha: Export/import API

**Project:** p-canonical-course  
**Agent:** Alpha  
**Phase:** C2  

## Files in scope

- `server/routes/canonical_courses.py`
- `server/main.py` (router include)
- `server/tests/test_canonical_course_model.py`
- Optional thin hooks in `server/routes/admin.py`

## Work

1. Admin endpoints: validate, inspect, import, GET/POST course canonical.  
2. Export projects live course → document.  
3. Import create_draft + replace_draft; refuse published replace.  
4. Characterization tests: round-trip, validation errors, auth.

## Completion

- [ ] pytest green for new suite  
- [ ] curl/export evidence in gate notes  

## Gate

Delta C2.