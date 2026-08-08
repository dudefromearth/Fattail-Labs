# W0-1 — India model keep/kill

**Agent:** India (session)  
**Verdict:** **PASS** (2026-08-08)

## Keep / add

- Columns: `signed_at`, `signed_terms` (JSON charter snapshot), `signed_terms_backfilled`, `predecessor_campaign_id`
- Table: `member_practice_campaign_amendments` (append-only, Family B)
- Cycle number: **derived** from predecessor chain
- Charter fields: title, goals_md, starting_capital, account_id, starts_at, ends_at
- Status: planned ↔ active; terminals completed/abandoned

## Kill

- Stored cycle counter · dual-write signed_terms on amend · Journey metric tables · second archive flag

## Evidence

Seed: `seeds/W0-1-india-model.md` · Concept Spec §4.5
