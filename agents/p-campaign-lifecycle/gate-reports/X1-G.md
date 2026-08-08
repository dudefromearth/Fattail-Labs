# X1-G — Pack lifecycle (model 1.2)

**Status:** PASS  
**Date:** 2026-08-08  
**Phase:** X1  

## Done

- `CAMPAIGN_MODEL_VERSION = "1.2"`
- Export: `signed_at`, `signed_terms`, `signed_terms_backfilled`, `predecessor_export_key`, `amendments[]`
- Import: restore signature + amendments; second-pass predecessor bind; missing pred → warning, unbound
- Purge: amendments + clear predecessor before campaign delete
- Schema: `Specs/schemas/practice-campaign-v1.json` 1.2 defs

## Kilo

```
pytest tests/test_practice_spine.py \
  tests/test_member_export.py::test_playbook_campaign_spine_export_round_trip \
  tests/test_member_export.py::test_campaign_lifecycle_pack_round_trip -q
# 13 passed
```

## Seeds

- X1-0, X1-1
