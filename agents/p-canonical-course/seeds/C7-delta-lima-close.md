# Seed C7 — Delta + Lima: Project close

**Project:** p-canonical-course  
**Agents:** Delta (gate), Lima (docs parity), Mike (security spot-check)  
**Phase:** C7  

## Files in scope

- `agents/p-canonical-course/gate-reports/C7-project-close.md` (create)  
- Docs touch only if factual drift found  

## Out of scope

- New features  

## Work

### Delta

1. Run:  
   `cd server && .venv/bin/python -m pytest tests/test_canonical_course_model.py tests/test_production_packages.py -q`  
2. Evidence: export GET + import create_draft on a probe course (or cite characterization).  
3. Confirm: published replace refused; admin-only 401/403.  
4. Verdict PASS / FAIL / BLOCKED with evidence in gate report.  

### Mike

- Confirm import does not server-side fetch arbitrary media URLs.  

### Lima

- Spec, Architecture 08/09, ADMIN-GUIDE, decision log match shipped behavior (YouTube, kinds, free_preview auth, instructors, resource pointers).  

## Completion

- [ ] Gate report filed  
- [ ] ORCHESTRATOR status board closed or residual listed  

## Gate

Project complete when Delta PASS and Coach accepts residuals.