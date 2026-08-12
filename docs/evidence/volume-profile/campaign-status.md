# RAW campaign status

**Started:** 2026-08-12T21:20:49Z  
**Command:** `python -m market_data.raw_campaign --all --kinds trades,quotes,aggs_1s --start 2004-01-02`  
**Root:** `/Users/ernie/data/fattail-market-data`  
**Why not Pod 1:** agent shell TCC → Operation not permitted on `/Volumes/Pod 1` (mounted, not writable). Rsync later.

## Progress (update by ops)

| Time (UTC) | ok_days | size | note |
|------------|---------|------|------|
| 21:21 | 64 | 35M | SPY trades 2004 |
| 21:32 | 541 | 541M | SPY trades ~2006-01 |
| 21:43 | 836 | 796M | SPY trades ~2007-03 |

Monitor: `tail -f …/jobs/logs/raw_campaign.log`

## Resume

Safe to re-run same command; days with `.ok` skip.
