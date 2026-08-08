# M1-G — Schema

**Status:** PASS  
**Date:** 2026-08-08  

## Applied

- `migrations/102_campaign_structured_practice.sql`
  - `is_ledger`
  - `stamped_by` on trades
  - `member_practice_campaign_memory`
  - `member_practice_campaign_bounds`
  - backfill is_default → is_ledger; clear ledger signatures
- Data: unstamped trades swept to ledger (`stamped_by=migration`, n≈4431 on this host)
