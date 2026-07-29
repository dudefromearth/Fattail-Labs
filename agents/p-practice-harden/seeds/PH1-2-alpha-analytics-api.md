# Seed PH1-2 — Alpha: Analytics / read-model API (stable JSON)

**Project:** p-practice-harden  
**Primary:** Alpha  
**Reviewers (required):** India · Mike · Kilo  
**Phase:** H1  
**Prerequisite:** PH1-1 APPROVED  

## Goal

Expose domain results via **stable JSON contracts** (new routes and/or enriched trade
payload) per PH1-0. Clients must be able to drop dual client enrich once PH1-3 lands.

## Files in scope

- `server/routes/trade_log.py` and/or new route modules under `server/routes/`  
- Domain imports from PH1-1 package  
- Tests: auth scope, isolation, response shape, multi-account  

## Out of scope

- UI wiring (PH1-3)  
- Large package renames (PH2-1 may follow)  
- Pagination/virtualization (H4)  

## Invariants

1. Session-scoped: member only sees own books.  
2. No MSC code import.  
3. Contract documented in seed evidence or PH1-0 appendix (field list).  
4. Batch legs (H0) remain O(trades) queries.  

## Collaboration / review protocol

1. Alpha implements endpoints + tests.  
2. **India** — contract stability, domain correctness.  
3. **Mike** — isolation / identity / export trust surface.  
4. **Kilo** — isolation + golden series/list tests.  
5. All three **APPROVED**.  

## Completion criteria

- [x] API returns series / day-book fields needed by Reports + Journal  
- [x] Isolation tests green  
- [x] India · Mike · Kilo APPROVED  
- [x] curl or pytest evidence of response shape  

## Evidence (2026-07-29)

- Routes: `analytics/day-book`, `analytics/days-interest`, `analytics/reports-book`  
- Tests: `server/tests/test_trade_log_analytics.py`  
- Review: `gate-reports/PH1-2-review.md`  
- `pytest … analytics + trade_log + domain` → **19 passed**  

## Feeds

→ PH1-3, PH1-G  

