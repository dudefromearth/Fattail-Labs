# Seed R2 — Alpha: Resource APIs

**Project:** p-resources  
**Agent:** Alpha (+ Mike security notes, Kilo characterization)  
**Phase:** R2  
**Prerequisite:** R1  

## Files in scope

- `server/routes/resources.py` (extend/replace)  
- `server/routes/resources_admin.py` or admin extensions  
- `server/main.py`  
- `server/tests/test_resources_domain.py` (API cases)  
- Course payload in `routes/courses.py` / admin course GET if needed  

## Out of scope

- Full UI (R3); migration (R4)  

## Work

1. Member: list published, get by slug, download by version id (gates).  
2. Admin: CRUD head, versions, publish/unpublish, course attach/pin/unlink.  
3. Mike: no SSRF; private files; admin-only mutators.  

## Completion

- [ ] Characterization for publish visibility + pin download  
- [ ] 401/403 evidence  

## Gate

Feeds R3a/R3b.