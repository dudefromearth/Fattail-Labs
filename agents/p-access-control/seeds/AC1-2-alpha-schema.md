# Seed AC1-2 — Alpha: access_policies DDL

**Project:** p-access-control  
**Agent:** Alpha  
**Reviewers:** India (SoR match)  
**Depends on:** AC1-1; BUILD AUTHORITY  
**Spec:** §9 Complete DDL  

---

## Intent

Filename-ordered migration for `access_policies` + `access_policy_audit`. Exact Spec §9.

---

## Read first

1. Spec §9 (self-contained DDL)  
2. `server/migrate.py` conventions  
3. Latest migration number under `migrations/`  

---

## Files in scope

- `migrations/NNN_access_policies.sql` (next free NNN)  
- Apply via `server/migrate.py`  

## Out of scope

Engine logic; free_preview dual-write; admin routes.

---

## Invariants

- Columns match Spec §9 including `selected_plans_json`, `exact_plans_only`  
- **No** expanded-plan cache column  
- DYNAMIC row format; utf8mb4  
- Fail loud on migrate  

---

## Completion

- [ ] `--dry-run` then apply; second dry-run empty  
- [ ] India SoR: columns ↔ Spec §9  
- [ ] Tables exist on dev DB  

## Evidence

Paste dry-run + apply + `DESCRIBE` or SHOW CREATE excerpt in completion note.

## Feeds

→ AC1-3 · AC1-G
