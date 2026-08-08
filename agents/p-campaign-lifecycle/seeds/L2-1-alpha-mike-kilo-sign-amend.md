# L2-1 — Sign + amend + terminal + DELETE

**Agents:** Alpha · Mike · Kilo  
**Phase:** L2  
**Blocked by:** L1-G  

## Intent

- First activate / create-as-active → sign  
- Multi-field charter PATCH on signed campaign → N amendment rows  
- Status amendments for pause/resume/complete/abandon (optional but preferred)  
- Terminal charter PATCH → 4xx  
- DELETE rejects if stamps **or** signed_at set  

## Files

- `server/practice_spine_domain.py`  
- `server/routes/practice_spine.py`  
- tests  

## Kilo

Acceptance #10, #23–#26 characterization tests in-seed.
