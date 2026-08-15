# Seed IF2-1 — Alpha compile residual

**Project:** p-journal-retro-floor  
**Agent:** Alpha  
**Depends on:** IF0-G PASS (may run parallel with IF1)

---

## Intent

Retro compiles Journal structured fields; PATCH `one_thing_md`. Spec §5.3 · DL-333.

## Files (declare before touch)

- `migrations/126_retrospective_one_thing.sql`  
- `server/retrospective_domain.py`  
- `server/routes/retrospectives.py`  
- `web/lib/retrospectiveApi.ts`  

StudioTwo may already have this uncommitted — verify, do not double-drop, do not invent a third schema.

## Out of scope

Journal UI. journalBeats. MiniTwo. Ceremony rewrite.

## Completion

- [ ] `one_thing_md` column + gather `journal_compile`  
- [ ] PATCH accepts `one_thing_md`  
- [ ] Isolation unchanged  

## Gate

IF2-G (with IF2-2)
