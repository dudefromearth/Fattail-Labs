# Seed W3a — Charlie + Alpha: Journey Template (Progress Reuse)

**Project:** p-app-framework · **Agents:** Charlie, Alpha, India consult · **Gate:** feeds Gate 3  
**Depends on:** Gate 2 PASS  
**Read first:** Member-Data-Privacy DS-2; Progress Tracking spec; Application Framework Journey template

## Objective

Ship **Journey** as a Family B presentation of **existing** enrollment/progress data — no new progress tables.

## Task sequence

1. India confirms data sources: enrollments, lesson progress, pathway if present.  
2. Alpha: read API `GET /api/me/journey` (or equivalent) aggregating existing tables only.  
3. Charlie: Journey page template under member area; HIG surfaces; stay-put N/A for pure read or minimal.  
4. Tango light: no gamification dark patterns unless D-6 allows streaks (default conservative).  
5. Entitlement: gated by membership (coordinate W3b).

## Out of scope

Trade Log · new progress write model · leaderboards

## Completion criteria

- [ ] API uses only existing stores (schema evidence)  
- [ ] Page renders for entitled member; 401/403 otherwise  
- [ ] No second progress table  

## Report

PASS / FAIL / BLOCKED.
