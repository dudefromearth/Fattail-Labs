# RAW campaign status

**Target volume:** `/Volumes/sabrant2tb/fattail-market-data`  
**Config:** `LABS_MARKET_DATA_ROOT` + `LABS_MARKET_DATA_MOUNTS=raw-primary:/Volumes/sabrant2tb`  
**Local staging kept:** `/Users/ernie/data/fattail-market-data`

## Resume (2026-08-13T17:35Z)

After workstation restart: old PIDs 1883/1884/1885 dead. Resume-safe (`.ok` markers; 0 orphan parts).

**Scope now:** SPY **volume** (trades/quotes/1s) + SPY **options** + SPX/SPXW **options only**.  
No SPX index tape (no native volume; 403 / VP5).

| Stream | Status at resume |
|--------|------------------|
| SPY trades | **complete** 2004-01-02 → 2026-08-13 (5,900 days, 32 GB) |
| SPY quotes | resume from **2019-12-17** (4,162 days already on disk) |
| SPY 1s | not started (kind-outer after quotes) |
| SPX volume | **skipped** |
| Options SPY/SPX/SPXW | new job: contracts catalog + daily OHLCV per contract |

## Monitor

```bash
tail -f /Volumes/sabrant2tb/fattail-market-data/jobs/logs/raw_campaign_spy.log
tail -f /Volumes/sabrant2tb/fattail-market-data/jobs/logs/options_campaign.log
```
