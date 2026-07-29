# Seed TL5 — Records summary/series + Journal link field

**Project:** p-trade-log · **Agents:** Alpha + Charlie  
**Depends on:** TL1  
**Gate:** Spec §10.2–10.3  

## Objective

Ship Trade Log → **Records** read APIs (process-first; P&amp;L default null):

- `GET /api/me/trade-log/records/summary` — multi-account **totals** (`account_ids` omit = all active)
- `GET /api/me/trade-log/records/series` — **chart** series (`metric`, `bucket`, optional per-account breakdown)

Persist/clear `journal_entry_id` on trades. Minimal UI affordance for Journal deep link when Journal exists (if Journal absent, API only).

**Product name:** Records (not Statistics). Records is where accounts are **totaled and charted**; Trade Log remains the blotter.

## Out of scope

- Full Records app UI/charts page (separate project when Records Spec exists; may stub `/app/records` later)
- Full Journal app  
- Renaming `apps.slug` statistics→records (optional tiny migration if shipping hub card)

## Completion criteria

- [ ] `records/summary` supports all-active + subset account_ids  
- [ ] `records/series` returns bucketed points (at least `trade_count`, `adherence_rate`)  
- [ ] Cross-member isolation on both endpoints  
- [ ] `pnl_*` omitted unless opt-in flag documented  
- [ ] `journal_entry_id` PATCH works  
- [ ] Tests green  
