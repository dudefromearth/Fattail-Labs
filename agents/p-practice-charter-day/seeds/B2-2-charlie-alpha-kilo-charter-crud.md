# B2-2 — Charter create/edit/abandon + Kilo tests

**Agents:** Charlie · Alpha · Kilo  
**Phase:** B  
**Blocked by:** W0-G  

## Intent

Full charter CRUD on existing campaign API: create, edit fields, abandon (status), complete. Multi-active preserved. **No new tables.**

## Kilo criteria (in-seed)

- Multi-active create still works  
- Abandon transitions planned|active → abandoned  
- Edit goals/capital/dates Family B (own identity only)  

## Files

- `web/app/app/practice/campaign/page.tsx`  
- `web/lib/practiceSpineApi.ts`  
- `server/practice_spine_domain.py` / tests as needed  
- `server/tests/test_practice_spine.py`  

## Done when

- [ ] Edit + abandon UI  
- [ ] Kilo tests green  
