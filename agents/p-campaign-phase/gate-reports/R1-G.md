# R1-G — Phase report strip

**Status:** PASS  
**Date:** 2026-08-09  

## Evidence

| Seed | Result |
|------|--------|
| R1-0 | free_cash = balance − open cost basis |
| R1-1 | free_margin = BP − structure_risk_open; null if no BP; no `margin_at_risk` |
| R1-2 | realized DD% = peak-to-trough $ on campaign trading curve / **allocation** (P13) |
| R1-3 | Report strip UI under definition, above radar |

## Tests

`test_phase_report_strip_and_p13` + P13 unit checks.

## Endpoint

`GET /api/me/practice/campaigns/{id}/phase-report`
