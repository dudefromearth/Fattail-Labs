# PH1-4 — Seeds share domain

**Primary:** Alpha · **Reviewer:** Kilo  
**Date:** 2026-07-29  

## Change

`server/seed_reports_demo_pnl.py` rewritten to:

- Map DB rows → domain trade/leg dicts (`option_right` → `right`)  
- Call `enrich_trades_with_synthetic_pnl` from `trade_log_domain`  
- Per-identity batches; no twin structure/match/PnL algorithms  

`import_0dte_xlsx.py` has **no** twin match/PnL geometry (uses file PnL) — no change.

## Evidence

```text
pytest tests/test_trade_log_domain.py … -q
20 passed  # includes test_seed_row_adapters_feed_domain_enrich
```

## Kilo

**APPROVED** — seed adapters feed domain; golden $150 still holds; no second algorithm.

## Seed completion

- [x] Seeds call domain  
- [x] Kilo APPROVED  
