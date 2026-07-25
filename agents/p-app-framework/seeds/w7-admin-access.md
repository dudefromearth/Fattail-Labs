# Seed W7 — Admin Aggregates + Consented Individual Examination

**Project:** p-app-framework · **Agents:** Alpha, Mike, Charlie · **Gate:** feeds Gate 7  
**Depends on:** Gate 2 PASS; prefer Gate 4+ so real content exists  
**Read first:** Member-Data-Privacy §4–§5

## Objective

Implement the two admin modes:

### Aggregates (§4.1)
- Derived metrics only (D-1 allowlist)  
- Minimum cohort floor (D-2)  
- No raw entry text  
- Analytics consent / opt-out (D-3)  

### Individual examination (§4.2)
- Member grants scoped, time-boxed consent  
- Admin UI/API only works with valid grant  
- Every access audited  
- Revocation immediate  

## Task sequence

1. Mike: finalize metric allowlist + cohort threshold in decision log if not done.  
2. Alpha: aggregate endpoints + consent grant/revoke APIs + audit writer.  
3. Charlie: member “grant access” UX (non-coercive); admin “request/view under grant” UX.  
4. Kilo: tests AF10, AF11.  
5. Sierra/Hotel: confirm no external profit metric surface.

## Out of scope

Marketing dashboards on public site · silent admin tools on course page

## Completion criteria

- [ ] Tiny cohort suppressed (test)  
- [ ] Deny without consent; allow with; audit line  
- [ ] Revoke ends access  
- [ ] Aggregate payload sample shows no raw content  
- [ ] pytest green  

## Report

PASS / FAIL / BLOCKED.
