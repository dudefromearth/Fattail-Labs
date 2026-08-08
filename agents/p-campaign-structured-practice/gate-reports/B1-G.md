# B1-G — Bounds schema + role + CRUD

**Status:** PASS (core)  
**Date:** 2026-08-08  

## Landed

- Migration `106_campaign_bounds_role.sql` — `role` column, legacy → `boundary`
- Domain CRUD: `list/create/patch/delete` bounds · Family B  
- `is_critical` on goal → **422** (#18)  
- Ledger rejects bounds create (422)  
- Post-sign bound create → amendment row  
- Renew copies bounds to draft successor  
- Routes under `/api/me/practice/campaigns/{id}/bounds`  
- Tests: `tests/test_campaign_bounds.py`  

## Evidence

```
.venv/bin/python migrate.py  # applied 106
.venv/bin/python -m pytest tests/test_campaign_bounds.py tests/test_campaign_alignment.py -q
```

## Deferred

- Full temporal variance store (B1-2 stamp-at-fill table) — process witness notes returned at fill (B2) without durable stamp table yet  
- Pack export of bounds (X1)
