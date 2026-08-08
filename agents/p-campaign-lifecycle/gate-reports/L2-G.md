# L2-G — Sign / amend / renew / DELETE

**Status:** PASS  
**Date:** 2026-08-08  
**Phase:** L2  

## Done

- Domain: `_apply_signature`, amendments on charter PATCH after sign, terminal read-only, `renew_campaign`, DELETE rejects when `signed_at` set
- Routes:
  - `GET /api/me/practice/campaigns/{id}` — lineage attached
  - `GET /api/me/practice/campaigns/{id}/amendments`
  - `POST /api/me/practice/campaigns/{id}/renew`
- List includes derived `cycle_number`

## Kilo

```
cd server && .venv/bin/python -m pytest tests/test_practice_spine.py -q
# 11 passed
```

Coverage: sign on activate/create-active; multi-field N amendments; terminal 422; DELETE signed 409; 3-chain renew; multi-successor; GET amendments 404 Family B; GET list never auto-creates.

## Seeds

- L2-1, L2-2, L2-3
