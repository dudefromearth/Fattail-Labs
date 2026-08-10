# G1-G — Enforcement grammar

**Status:** PASS  
**Date:** 2026-08-09  

## Evidence

| Seed | Result |
|------|--------|
| G1-0 | Activate without Big Three → **422** on campaign API |
| G1-1 | Complete/abandon without ends_at → **422**; with end → terminal OK |
| G1-2 | Trade path not gated by charter (umpire) — no Big Three on trade create |

## Spec §10

#1 · #2 · #3 covered by `test_campaign_phase_charter.py`.

## Non-waived

Umpire (P3) held.
