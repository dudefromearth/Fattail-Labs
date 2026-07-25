# Seed W1b — Charlie + Alpha: Course Presentation Shell Hardening

**Project:** p-app-framework · **Agents:** Charlie (UI), Alpha (API if needed) · **Gate:** feeds Gate 1  
**Depends on:** W1a findings  
**Read first:** Application Framework C4.1; EditContext; admin routes for modules/lessons

## Objective

Course Presentation fully matches framework: client graph for modules/lessons, tab pin, optimistic create, structure ops stay-put, Save without navigation.

## Task sequence

1. Verify Modules list renders from `edit.modules` in edit mode (not SSR alone).  
2. Verify create module/lesson optimistically + refreshAdmin; re-assert `courseTab`.  
3. Scroll lock around structureOp.  
4. Alpha: only if API lacks fields needed for graph (kind, duration) — minimal allowlist-safe changes.  
5. Draft course editor path uses same EditProvider contract.  
6. Document any remaining GAP in Application Framework B6 status (Juliet/Lima later).

## Out of scope

Hub · Catalog · Family B · refactor of entire Editable primitive set unless required for stay-put

## Completion criteria

- [ ] AF1–AF3 re-verified after changes  
- [ ] No `window.location.reload` in EditContext structureOp/save  
- [ ] Evidence: curl structure API + UI notes or tests  

## Report

PASS / FAIL / BLOCKED.
