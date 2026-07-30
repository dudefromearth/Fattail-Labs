# Seed J1-1 — Alpha Merge Migration (blocked until GO)

**Project:** p-journal-session-v06  
**Agent:** Alpha (exec) · India (review before apply)  
**Depends on:** **J0-0 Coach GO** · India merge algorithm approved  

---

## Intent

Consolidate multi-session dates; add `UNIQUE (identity_id, journal_date)` without dropping member content.

---

## Invariants

- Never delete member messages  
- Dual `structured_json` → keep under review; do not pick one silently  
- Re-point `tag_assignments` to canonical session; dedupe tag_ids  
- Family B: identity_id ownership preserved  

## Work (declare exact files before edit)

1. Migration SQL under `migrations/`  
2. Domain adjustments if needed  
3. Collision report (stdout or table)  

## Completion

- [ ] Dry-run on dev DB  
- [ ] Apply migration  
- [ ] Collision report  
- [ ] Unique constraint verified  
- [ ] India sign-off  
- [ ] pytest related green  

## Out of scope

UI; week map; media header.

## Gate

Part of **JS6-1-G**.
