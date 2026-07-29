# Seed PH1-1 — Alpha: Server domain module (positions / PnL / open book)

**Project:** p-practice-harden  
**Primary:** Alpha  
**Reviewers (required):** India · Kilo  
**Phase:** H1  
**Prerequisite:** PH1-0 APPROVED (design file + Coach ACK on any metric surface)

## Goal

Implement the **single authoritative** Python domain module for:

- multi-leg structure key / position grouping  
- open-on-day / still-open book semantics  
- realized PnL + equity series construction  

per PH1-0 design. **Default:** formulas match current intended client behavior unless
PH1-0 + Coach labeled a formula fix.

## Files in scope (align to PH1-0 file map; declare final list in evidence)

- New package under `server/` (e.g. `server/trade_log_domain/`)  
- Unit / characterization tests under `server/tests/`  
- **Not yet** route wiring (that is PH1-2) unless design requires thin re-export  

## Out of scope

- Frontend rewiring (PH1-3)  
- Route package split (PH2-1)  
- Behavior/UX changes not labeled in PH1-0  

## Invariants

1. One implementation of structure/open/series — no twin copy inside this package.  
2. Family B isolation unchanged.  
3. Config fail-loud; no silent defaults for env identity.  
4. Tests prove golden fixtures from PH1-0 / current product intent.  

## Collaboration / review protocol

1. Alpha implements module + tests; evidence = pytest output.  
2. **India** reviews: model boundaries match design; no product-boundary leak.  
3. **Kilo** reviews: coverage of edge cases (multi-leg, same-day open/close, multi-account).  
4. Both **APPROVED** before seed done.  

## Completion criteria

- [x] Domain package exists and is importable  
- [x] Characterization/unit tests green  
- [x] India APPROVED · Kilo APPROVED  
- [x] Evidence pack attached (commands + output)  

## Evidence (2026-07-29)

- Package: `server/trade_log_domain/`  
- Tests: `server/tests/test_trade_log_domain.py` (6 goldens)  
- Review: `gate-reports/PH1-1-review.md`  

## Feeds

→ PH1-2, PH1-4  

