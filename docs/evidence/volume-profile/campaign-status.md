# RAW campaign status

**Target volume:** `/Volumes/sabrant2tb/fattail-market-data`  
**Config:** `LABS_MARKET_DATA_ROOT` + `LABS_MARKET_DATA_MOUNTS=raw-primary:/Volumes/sabrant2tb`  
**Local staging kept:** `/Users/ernie/data/fattail-market-data`

## Live processes (2026-08-13T01:31Z)

| PID | Job | Progress |
|-----|-----|----------|
| **1883** | SPY trades | ~2014-07 (2,745 days, ~6.2 GB) |
| **1884** | SPY quotes + 1s | quotes ~2006-07 |
| **1885** | QQQ…MSFT all kinds | QQQ trades ~2009-05 |

## Monitor

```bash
tail -f /Volumes/sabrant2tb/fattail-market-data/jobs/logs/raw_campaign_spy_trades.log
tail -f /Volumes/sabrant2tb/fattail-market-data/jobs/logs/raw_campaign_spy_quotes.log
tail -f /Volumes/sabrant2tb/fattail-market-data/jobs/logs/raw_campaign_other.log
```
