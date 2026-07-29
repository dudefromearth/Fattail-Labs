# PH1-1 — Domain module evidence + reviews

**Project:** p-practice-harden  
**Seed:** PH1-1 Alpha domain module  
**Date:** 2026-07-29  
**Primary:** Alpha  

## Deliverable

Package `server/trade_log_domain/`:

| Module | Responsibility |
|--------|----------------|
| `structure.py` | unit_qty, structure_key, close detect, cash points, multiplier, ymd |
| `matching.py` | FIFO match_open_close |
| `pnl.py` | enrich_trades_with_synthetic_pnl, realized_pnl |
| `day_book.py` | opens/fills/union/build_day_book, days_with_book_interest |
| `reports.py` | build_reports_book (series, DD, stats) |

Pure — no FastAPI/DB. Behavior freeze vs TS client.

## Tests (useful only)

| Test | Invariant |
|------|-----------|
| `test_structure_key_normalizes_unit_scale` | 1-2-1 ≡ 3-6-3 |
| `test_fifo_match_and_synthetic_pnl_vertical` | open/close match + $150 synth |
| `test_synthetic_pnl_scales_butterfly_units` | (-1.57+2.78)×100×3 = 363 |
| `test_open_on_day_and_same_day_close` | mid-day open; close day not still-open |
| `test_equity_series_and_drawdown` | capital path + max DD |
| `test_account_filter_scopes_reports` | account scope |

## Evidence

```text
cd server && .venv/bin/python -m pytest tests/test_trade_log_domain.py tests/test_trade_log.py tests/test_trade_log_import.py -q
# domain: 6 passed; trade_log + import: 13 passed
```

## India review

**Verdict: APPROVED**

- Layout matches `Architecture/11-practice-domain-single-source.md`.  
- No product-boundary leak; pure package.  
- TS is source of truth for structure key (includes asset_class).  

## Kilo review

**Verdict: APPROVED**

- Goldens lock scale, match, PnL, open-on-day, series — unique regressions.  
- No HTTP theater; no duplicate isolation tests.  
- Multi-account filter covered.  

## Seed completion

- [x] Domain package importable  
- [x] Characterization green  
- [x] India · Kilo APPROVED  
