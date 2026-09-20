# REQ-006-G — N-bar lookback (TV model)

**Verdict:** PASS (GO) — AP-1 still Coach  
**Date:** 2026-09-19 23:44–23:46 ET Saturday post-close

## CP-1 (verbatim · DL-707)

chain_feed pid **538** RSS **71088** idle BEFORE and AFTER. Burst: sequential Massive GETs ES/MES × 5m/1h/1d from listing (~Sep 2025) to now. 0 standing extra. Rollback: history agent bootout (does not revert N-bar code on disk).

## Evidence

| Call | served | rule | birth | short | first bar |
|------|--------|------|-------|-------|-----------|
| ES 5m | 5000 | 5000 | false | false | 2026-08-19 (page; more exists) |
| ES 5m before_t | 5000 | 5000 | false | false | 2026-06-29 |
| ES 1h | 2017 | 5000 | **true** | false | **2025-09-10** |
| ES 1d | 143 | 5000 | **true** | false | **2025-09-09** |
| MES 5m | 5000 | 5000 | false | false | 2026-08-21 |
| MES 1h | 2459 | 5000 | **true** | false | **2025-09-23** |
| MES 1d | 177 | 5000 | **true** | false | **2025-09-22** |

Grep-proof: no `requested_window_days` / `min_days: "90"` on provider or SaPriceChart. Tests 12 passed.

Surface: pan left pages `before_t`. Chip: bar count / Max available at birth.

Not AP-1. REQ-001 / TOPO-1 AP-1 remain Coach's.
