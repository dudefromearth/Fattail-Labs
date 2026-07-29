# Seed PH1-4 — Alpha: Seeds / import helpers use shared domain

**Project:** p-practice-harden  
**Primary:** Alpha  
**Reviewers (required):** Kilo  
**Phase:** H1  
**Prerequisite:** PH1-1 APPROVED (may run ∥ PH1-3 after PH1-2 if seeds only need domain)

## Goal

Ensure `seed_reports_demo_pnl`, 0DTE import helpers, and any server-side PnL/structure
generators **call the shared domain** — no second algorithm for strikes geometry PnL or
position grouping.

## Files in scope

- `server/` seed scripts / import modules (e.g. import_0dte_xlsx, seed helpers)  
- Tests covering import → list → domain consistency  

## Out of scope

- Frontend  
- New product features  
- Changing synthetic-strike policy without Hotel/Coach (label only if needed)  

## Invariants

1. Twin algorithms banned.  
2. Synthetic/illustrative geometry remains labeled as such (Hotel may review in PH1-5).  
3. Isolation: seeds do not write across identities.  

## Collaboration / review protocol

1. Alpha refactors seeds/import to import domain.  
2. **Kilo** APPROVED with consistency tests.  

## Completion criteria

- [x] Seeds/import call domain package  
- [x] Kilo APPROVED  
- [x] Evidence: tests green  

## Evidence (2026-07-29)

- `seed_reports_demo_pnl.py` → `enrich_trades_with_synthetic_pnl`  
- `gate-reports/PH1-4-review.md`  
- `test_seed_row_adapters_feed_domain_enrich`  

## Feeds

→ PH1-G  

