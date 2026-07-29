# Charter — p-trade-log (Trade Log v1.1)

**Spec:** [`Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md`](../../Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md)  
**Board:** [`ORCHESTRATOR.md`](./ORCHESTRATOR.md)  
**Parents:** Application Framework v1.0 (Family B Trade Log) · Member-Data-Privacy v0.1 · HIG v1.0  

## Mission

Replace the process-only MVP Trade Log with an **options-first, ToS-style multi-leg blotter**: table-first shell, right slide-out, multi-account (broker **or** sim, ≤10 active), canonical import/export, and clean contracts for **Journal** and **Records** (multi-account totals & charts; former “Statistics”) — executed exclusively through the Agent Bench.

## Current state (2026-07-28)

| Area | State |
|------|--------|
| Spec v1.1 | DRAFT landed; awaiting Coach build approval after India S0 |
| MVP | `027_trade_log.sql`, `routes/trade_log.py`, form-first `/app/trade-log` |
| Journal / Records apps | Not fully domain-specced; contracts reserved in Spec §10 (Records = totals/charts across accounts) |
| Bench project | This folder — seeds TL0–TL6 |

## Success (Definition of Done)

- Spec §12 acceptance rows have **evidence** in `gate-reports/`.  
- Delta TL6 PASS.  
- Lima decision-log entry + Spec status flipped when Coach ships.  
- No cross-identity leakage; process-first chrome (Tango/Hotel).  

## Out of scope

Live broker APIs · sharing · admin exam UI · Practice Log UI merge · reverse proprietary export  

## Doctrine

[`agents/bench/doctrine.md`](../bench/doctrine.md) · [`first-principles-doctrine.md`](../bench/first-principles-doctrine.md) · Spec §0 bench rules.
