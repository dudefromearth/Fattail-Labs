# Seed W5 — Journal (Calendar Variant)

**Project:** p-app-framework · **Agents:** Alpha, Charlie, Echo · **Gate:** feeds Gate 5  
**Depends on:** Gate 4 PASS (recommended); Gate 2 required  
**Read first:** Application Framework T-D3, C3.1; Live sessions calendar patterns; Privacy Journal surface

## Objective

Ship **Journal** as bounded Calendar variant: time-structured process/adherence entries, Family B isolation, stay-put.

## Task sequence

1. Echo: layout — shared time-grid language with Calendar without cloning live_sessions store.  
2. Alpha: journal entries table + API (identity scoped); not live_sessions rows.  
3. Charlie: Journal template UI; ↑↓ or date sort as product requires; no freeform builder.  
4. Tango: copy process-first; no comparison UI.

## Out of scope

Merging journal into live_sessions · Trade Log changes · public exemplar

## Completion criteria

- [ ] CRUD + isolation tests  
- [ ] Distinct from live_sessions schema  
- [ ] UI stay-put  
- [ ] pytest green  

## Report

PASS / FAIL / BLOCKED.
