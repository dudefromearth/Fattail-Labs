# JS6-3-G — Admin prompt versions (PASS)

**Date:** 2026-07-30  
**Verdict:** **PASS**

## Evidence

- Table `journal_session_prompt_versions` (mig 054)  
- API: `GET/POST /api/admin/journal-prompts`, `GET …/{id}`, `POST …/{id}/activate`  
- Admin UI: `/admin/journal-prompts`  
- Test `test_admin_journal_prompt_versions`: create, activate, new session stamps `prompt_version_id`  

## Residual

Historical sessions created before stamp keep null or prior id (expected).
