# PH1-0 — Domain design review

**Project:** p-practice-harden  
**Seed:** PH1-0 India domain single-source design  
**Date:** 2026-07-29  
**Primary:** India  

## Deliverable

`Architecture/11-practice-domain-single-source.md`

Defines:

1. Server package `server/trade_log_domain/` (structure / matching / pnl / day_book / reports)  
2. API: `GET .../analytics/day-book` + `GET .../analytics/reports-book` (+ Spec `records/*` alias note)  
3. Deprecation: PH1-1→PH1-3 cutover; no default enrich on list  
4. Client-only: presentation, capital preference, HIG, templates  
5. **Behavior freeze:** port current TS formulas; no intentional metric change  

## Collaboration

| Reviewer | Verdict | Notes |
|----------|---------|-------|
| Alpha | **APPROVED** | Feasible; no migration; composes with H0 batch legs |
| Charlie | **APPROVED** | Clear consumer cutover; deep links preserved |
| Coach | **APPROVED** | Behavior freeze accepted |

## Completion

- [x] Written design with DTOs + file map  
- [x] Alpha · Charlie · Coach APPROVED  
- [x] Juliet board update  

**Seed PH1-0: DONE** → PH1-1  
