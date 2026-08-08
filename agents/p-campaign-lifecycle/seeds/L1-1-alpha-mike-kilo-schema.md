# L1-1 — Schema + backfill + Kilo

**Agents:** Alpha · Mike · Kilo  
**Phase:** L1  
**Blocked by:** L1-0 (or inline with W0-G if DTO in seed)  

## Intent

Migrations: `signed_at`, `signed_terms`, `signed_terms_backfilled`, `predecessor_campaign_id`; table `member_practice_campaign_amendments`; backfill §4.5.7.

## Files

- `migrations/10x_*.sql`  
- `server/practice_spine_domain.py` (serialize)  
- `server/tests/test_practice_spine.py`  

## Kilo

Migrate dry-run; column presence; backfill flags honest; Family B indexes.

## Done when

L1-G evidence pack ready.
