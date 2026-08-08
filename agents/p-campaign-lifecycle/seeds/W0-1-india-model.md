# W0-1 — India: lifecycle model keep/kill

**Agents:** India  
**Phase:** W0  
**Blocked by:** W0-0  

## Keep / add (this program)

| Surface | Decision |
|---------|----------|
| Campaign columns | `signed_at`, `signed_terms` (JSON), `signed_terms_backfilled`, `predecessor_campaign_id` |
| Amendments | **New table** `member_practice_campaign_amendments` (append-only, Family B) |
| Cycle number | **Derived** from predecessor chain — never stored |
| Charter fields | title, goals_md, starting_capital, account_id, starts_at, ends_at |
| Status machine | planned ↔ active; active → completed/abandoned; planned → abandoned |

## Kill

- Stored cycle counter  
- Dual-write of signed_terms on amend  
- Journey metric tables  
- Second "archived" flag (status is sole authority)

## Done when

Gate note PASS in `gate-reports/W0-1-india-model.md`
