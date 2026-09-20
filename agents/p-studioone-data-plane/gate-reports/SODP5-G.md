# SODP5-G — old OHLC server deleted whole

**Verdict:** PASS (GO)  
**Date:** 2026-09-19

| Proof | Result |
|-------|--------|
| `def _aggs_price_fill` | gone (`test_futures_history_hygiene` green) |
| StudioTwo `:4010` | **empty** |
| `ai.fattail.labs.vp-api` / `vp-engine` | bootout; plists moved to `install/retired/` |
| `chain_feed` StudioTwo | **held** pid 99058 (SODP-MB) |
| StudioOne chain_feed | pid 538 RSS 71088 undegraded |

Ghost FAIL would be `:4010` still answering. It does not.

Not AP-1.
