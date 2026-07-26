# Seed R4 — Alpha: Migrate attachments → resources

**Project:** p-resources  
**Agent:** Alpha (+ Foxtrot private files check)  
**Phase:** R4  
**Prerequisite:** R2 (prefer R3a dual-read proven)  

## Files in scope

- Migration script or `migrations/0NN_resources_backfill.sql` / Python one-shot  
- `resource_migration_map` table  
- Tests for count parity  

## Work

1. Course-level attachments → Resource + v1 + CourseResourceLink.  
2. Published courses → publish v1 to hub.  
3. Lesson attachments → lesson-scoped links.  
4. Idempotent; unique slugs.  
5. Verify private: URLs still download.  

## Completion

- [ ] Dev/staging backfill evidence  
- [ ] No orphaned private files  

## Gate

Feeds R6.