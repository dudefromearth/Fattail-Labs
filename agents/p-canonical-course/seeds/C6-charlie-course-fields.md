# Seed C6 — Charlie: Admin fields for Canonical Course columns

**Project:** p-canonical-course  
**Agent:** Charlie (+ Echo polish, Tango if member-facing copy)  
**Phase:** C6  
**Prerequisite:** C3 MVP landed  

## Files in scope (declare before edit)

- In-place course editors under `web/components/edit/**` as needed  
- Possibly `server/routes/admin.py` COURSE_FIELDS allowlist  
- Specs/docs only if Lima pairs  

## Out of scope

- Multi-block lesson editor  
- Media ZIP  
- Board place rewrite (C4)  

## Coach decisions that apply

- New fields may be package-first; UI is for operator convenience  
- `flagship`, `pathway_position`, `audience_category`, `short_description`, `learning_outcomes`, module `description_md`  

## Work

1. Extend admin GET/PUT course allowlist for new columns if missing.  
2. Minimal in-place controls (or draft editor section) — stay-put.  
3. Export must reflect edited values.  

## Completion

- [ ] Admin can set at least `flagship` + `audience_category` without SQL  
- [ ] Export shows values  
- [ ] No published overwrite via this UI  

## Gate

Feeds C7.