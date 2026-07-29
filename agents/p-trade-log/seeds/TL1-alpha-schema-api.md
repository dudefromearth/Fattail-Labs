# Seed TL1 — Alpha + Kilo: schema + API spine

**Project:** p-trade-log · **Agents:** Alpha (implement), Kilo (tests)  
**Depends on:** TL0 PASS + Coach build approval  
**Gate:** Isolation + multi-leg CRUD  

## Objective

Implement accounts (broker/sim, ≤10 active), trades, legs, and member APIs per Spec §§4, 9. Migrate or dual-read legacy `member_trade_log_entries`. Characterization tests for isolation and multi-leg create.

## Read first

- Spec v1.1 §§4, 9, 11, 12  
- `server/routes/trade_log.py` (MVP)  
- `server/tests/test_trade_log.py`  

## In scope (declare exact paths before edit)

- `migrations/NNN_trade_log_v11.sql` (next free number)  
- `server/routes/trade_log.py` (or split modules under `server/` if seed amendment)  
- `server/tests/test_trade_log*.py`  
- Optional: `server/trade_log_*.py` domain helpers  

## Out of scope

- Frontend  
- Broker file adapters (TL3/TL4)  
- Records UI (totals/charts app)  

## Invariants

- identity_id isolation; activator+ gate  
- Venue required on accounts  
- ≤10 active accounts  
- Process fields retained; P&amp;L optional  

## Completion criteria

- [ ] `migrate.py` applies cleanly  
- [ ] pytest green for isolation + butterfly create + account cap  
- [ ] curl evidence for list/create trade with legs  
- [ ] Legacy entries still readable or migrated with evidence  

## Gate

Feeds TL2 / TL3; Kilo co-signs tests.
