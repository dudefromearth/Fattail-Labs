# S1-G — Schema + domain substrate

**Status:** PASS  
**Date:** 2026-08-09  

## Evidence

| Seed | Result |
|------|--------|
| S1-0 | Migration 116 already applied; **117** `same_bet_json` applied |
| S1-1 | serialize/patch/create: charter_version, max_drawdown_pct, allocation mode/note, strategy_codes, retrospective_id, same_bet |
| S1-2 | post-sign adopt/un-adopt → amendments + charter_version++ (`test_post_sign_adopt_unadopt_bumps_version`) |
| Export | Family B keys on practice_campaign document |

## Tests

```
pytest tests/test_campaign_phase_charter.py tests/test_practice_spine.py \
  tests/test_campaign_panel.py tests/test_campaign_window.py \
  tests/test_member_export.py tests/test_practice_entitlement_gate.py
→ 46 passed
```

## Files

- `migrations/117_campaign_same_bet.sql`
- `server/practice_spine_domain.py`
- `server/routes/practice_spine.py`
- `server/export_domain.py`
- `server/tests/test_campaign_phase_charter.py` + activated-campaign fixtures updated
