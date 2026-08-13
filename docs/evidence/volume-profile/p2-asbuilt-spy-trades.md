# P2-E / as-built — SPY raw trades (retired P2-1/2/5)

**Status:** RETIRED-AS-BUILT (campaign still appending remaining years)  
**Spec:** v0.4 §0.1  
**Recorded:** 2026-08-13T01:31Z  

## Claims (Coach)

- Full available SPY trade history collected at production scale (pilot ladder retired)
- Resume via `.ok` markers proven (restarts skip complete days)

## Evidence

| Field | Value |
|-------|-------|
| Live root | `/Volumes/sabrant2tb/fattail-market-data` |
| Local backup (kept) | `/Users/ernie/data/fattail-market-data` |
| Layout | `raw/SPY/trades/year=YYYY/month=MM/day=DD/part-000.parquet` + `.ok` |
| Format | Parquet (zstd); older parts are vendor-column schema |
| Size (SPY trades) | **~6.2 GB** (2,745 complete days at 01:31Z) |
| First session | **2004-01-02** |
| Last complete (contiguous resume) | **~2014-07** and climbing; isolated **2024-06-03** P2-3 sample also present |
| Acquisition method | Massive REST paginated `/v3/trades/{symbol}` (not flat-file) |
| Resume events | Campaign 90553 SIGTERM → copy → resume 1883 skipped `.ok` and continued **2014-03-28** |
| Host | Coach workstation → `/Volumes/sabrant2tb` |

## Close

P2-1, P2-2, P2-5 **RETIRED-AS-BUILT**. Residual years still appending (B in flight).
