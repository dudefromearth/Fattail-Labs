# L1-G — Schema lifecycle

**Status:** PASS  
**Date:** 2026-08-08  
**Phase:** L1  

## Done

- Migration `101_practice_campaign_lifecycle.sql` applied (no pending migrations)
- Columns: `signed_at`, `signed_terms`, `signed_terms_backfilled`, `predecessor_campaign_id`
- Table: `member_practice_campaign_amendments` (append-only, Family B, CASCADE)
- Backfill: prior active/completed/abandoned rows stamped with `signed_terms_backfilled = 1`

## Kilo

Schema matches seed L1-1; DTO fields serialized in domain.
