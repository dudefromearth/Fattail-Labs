# Seed IF2-2 — Kilo compile tests

**Agent:** Kilo  
**Depends on:** IF2-1  

## Files

- `server/tests/test_retrospectives.py`  

## Intent

Characterization: compile buckets from structured_json; PATCH one_thing; member A never sees B.

## Out of scope

UI tests. Changing product schema.

## Completion

- [ ] `test_journal_compile_and_one_thing_patch` (or successor) green  
- [ ] Isolation retro tests still green  

## Gate

IF2-G
