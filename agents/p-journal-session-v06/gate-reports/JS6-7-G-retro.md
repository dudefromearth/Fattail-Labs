# JS6-7-G — Retro action + warnings (PASS)

**Date:** 2026-07-30  
**Verdict:** **PASS**

## Evidence

- Dedicated UI control: Open retrospective (not a tag)  
- `GET /api/me/retrospectives/{id}/closure-preview` returns:
  - `dates_to_close`
  - `open_session_count`
  - `open_sessions_to_close`
  - `warning` string
  - `gather_date_stays_open`
- Test `test_retro_complete_writes_closures` asserts warning fields  
