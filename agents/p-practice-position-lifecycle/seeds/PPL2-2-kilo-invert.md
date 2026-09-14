# PPL2-2 — Invert AT-PPL-2…5

**Project:** Practice Position Lifecycle  
**Agent:** Kilo  
**Depends:** PPL2-0 · PPL2-1  
**Feeds:** PPL2-G

## Intent

Characterization that **used to lock the lie** now asserts the honest book. AT-PPL-1 stays green. Add **AT-PPL-10** (`findPairedOpen`).

## Files in scope

Tests only (`server/tests/test_trade_log*.py`, client tests if the repo already has them for `tradeLog.ts`).

## Out of scope

Product files except test updates.

## Done when

Pytest (and any existing client unit tests) show AT-PPL-2…5 inverted, AT-PPL-1 Keep, AT-PPL-10 present.
