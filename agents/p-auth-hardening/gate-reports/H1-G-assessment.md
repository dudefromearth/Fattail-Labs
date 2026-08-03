# H1-G — Live role assessment

**Date:** 2026-08-02  
**Verdict:** **PASS**

## Evidence

| Item | Result |
|------|--------|
| `require_admin` / `require_role(administrator)` | Live `derive_role` |
| Demoted admin JWT | 403 on `/api/admin/access/policies` |
| `identity_id=0` outside dev | 401 |
| Member ladders | Still use `feature_role` for non-admin minimums |
| Tests | `tests/test_live_role_h1.py` green |

## Residual

Other routes that read `claims["role"]` directly (not via require_admin) may still see stale JWT role for **non-admin** display; admin privilege path is closed. Stretch: migrate remaining gates later.

## Reevaluation

| ID | Action |
|----|--------|
| H2 | **NEXT** |
| M1 rate limits | Promote after H4/CLOSE if needed |
