# SODP2-G — F3 born on StudioOne :4012

**Verdict:** PASS (GO)  
**Date:** 2026-09-19 ~23:08–23:13 ET (Saturday, post-close)  
**Token:** SODP2-W0 **STAMPED**

## CP-1 — CHAIN PRIMACY (verbatim · DL-707)

> **CP-1 — CHAIN PRIMACY.** The chain-snapshot collection on StudioOne (chain_feed and its supporting jobs) is never disrupted by Volume Profile Service work. If any test, install, invocation, backfill, or migration step could disrupt it — including indirectly via shared Massive account connection/rate limits, disk I/O or CPU contention, port conflicts, or launchd changes — the step is either redesigned to remove the risk or HELD until after the RTH close (16:00 ET). "Could disrupt" is judged pessimistically; when uncertain, hold. Every StudioOne packet must (a) carry CP-1 verbatim in its GO, (b) state its expected resource footprint (connections, disk, CPU) against chain_feed's needs, (c) capture chain_feed process status and last-snapshot freshness BEFORE and AFTER execution as evidence, and (d) include a rollback line: the single command or action that removes the change. A packet whose AFTER check shows chain_feed degraded is a FAIL regardless of its own success, and its rollback executes immediately.

**Footprint:** +1 FastAPI `:4012`. 0 standing Massive. Burst 2 REST GETs (ES+MES cache miss), post-close. Disk `/Users/ernie/fattail-market-data/vp/futures_history`. No chain-feed plist.

**BEFORE:** chain_feed pid **538**, RSS **71088**, last line `no interest keys; idle`. `:4012` empty.

**AFTER:** pid **538**, RSS **71088**, still idle, log still writing. `:4012` pid 38865/38976. vp-api 74792 and symbology 26514 unchanged.

**Rollback:** `launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/ai.fattail.labs.history.plist`

**Evidence:** computing `GET :4012/history/v1/ohlc/ES?contract=ESZ2026` → bound ESZ2026 vendor ESZ6, 11601 bars, span 108.85d, **lo 2026-06-02**. MES same, 16201 bars, lo 2026-06-02. Unauth 401. Fill never copied.

TS-1 strikes remain DL-777. Not AP-1.
