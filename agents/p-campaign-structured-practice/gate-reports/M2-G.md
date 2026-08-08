# M2-G — Domain Laws 1–6 (core)

**Status:** PASS (core)  
**Date:** 2026-08-08  

## Landed

- Default account genesis via `_ensure_default_account` + ledger  
- `ensure_ledger_campaign` / `on_account_created`  
- Ledger never signed; lifecycle status blocked; delete blocked  
- `resolve_trade_campaign_id` + memory  
- Name uniqueness suffix  
- Create requires account (auto Primary)  
- Tests: `test_practice_spine.py` 12 passed incl. `test_structured_practice_ledger_stamp_memory`

## Deferred to later seeds

- Full restamp API surface (M2-4 UI)  
- Bounds process variance stamp-at-fill (B1–B2)  
- Name uniqueness DB unique index (app-level only)
