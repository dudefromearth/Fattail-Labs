# Seed TL0 — India: Spec & architecture review (Trade Log v1.1)

**Project:** p-trade-log · **Agent:** India (pair Echo / Tango / Hotel on request)  
**Gate:** Unblocks TL1 · feeds TL6  

## Objective

Confirm Spec v1.1 domain model, Family B boundary, and Journal/Records contracts (multi-account totals & charts) are implementable without second stores of truth or privacy holes. Recommend Coach build approval or blocking amendments.

## Read first

- `Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md` (entire)
- `Specs/FatTail-Labs-Application-Framework-Spec-v1.0.md` Family B / T-D5
- `Specs/FatTail-Labs-Member-Data-Privacy-Spec-v0.1.md`
- `agents/bench/doctrine.md`
- Current MVP: `migrations/027_trade_log.sql`, `server/routes/trade_log.py`

## In scope

- Written review: schema fit, isolation, adapter boundary, stats as read model
- Optional Spec PR-style amendment list (do not rewrite Spec without Coach)

## Out of scope

- Implementation code  
- Seed rewriting for other agents (Juliet)

## Completion criteria

- [ ] PASS / FAIL / BLOCKED with evidence-backed rationale  
- [ ] Explicit statement on multi-table Family B accounts/trades/legs  
- [ ] Explicit statement on Journal link + records/summary|series contracts  
- [ ] List of blocking amendments (if any) for Coach  

## Report

File notes under `agents/p-trade-log/gate-reports/TL0-india-review.md` if substantial.
