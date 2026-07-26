# Seed R5 — Alpha: Canonical Course Model integration

**Project:** p-resources  
**Agent:** Alpha · Kilo  
**Phase:** R5  
**Prerequisite:** R2 + course links working  

## Files in scope

- `server/course_model.py`  
- `server/tests/test_canonical_course_model.py`  
- Specs cross-links if Lima pairs  

## Work

1. Export course resources as slug + pinned_version.  
2. Import resolves slug, creates link with pin.  
3. Bundle metadata optional (no binary).  
4. Tests for round-trip pins.  

## Completion

- [ ] U9  
- [ ] Existing canonical tests still green  

## Gate

Feeds R6.