# SYM1-DEPLOY — Registry sidecar on StudioOne D1 (CP-1 FULL DRESS)

**Depends:** SYM1-G PASS (dev-contract green only)  
**Agents:** Foxtrot + Alpha + Kilo + Delta  
**Machine:** StudioOne. Overlay only — do **not** git-pull the stale Labs tree.

## CP-1 — CHAIN PRIMACY (verbatim · DL-707)

> **CP-1 — CHAIN PRIMACY.** The chain-snapshot collection on StudioOne (chain_feed and its supporting jobs) is never disrupted by Volume Profile Service work. If any test, install, invocation, backfill, or migration step could disrupt it — including indirectly via shared Massive account connection/rate limits, disk I/O or CPU contention, port conflicts, or launchd changes — the step is either redesigned to remove the risk or HELD until after the RTH close (16:00 ET). "Could disrupt" is judged pessimistically; when uncertain, hold. Every StudioOne packet must (a) carry CP-1 verbatim in its GO, (b) state its expected resource footprint (connections, disk, CPU) against chain_feed's needs, (c) capture chain_feed process status and last-snapshot freshness BEFORE and AFTER execution as evidence, and (d) include a rollback line: the single command or action that removes the change. A packet whose AFTER check shows chain_feed degraded is a FAIL regardless of its own success, and its rollback executes immediately.

## Footprint vs chain_feed

- **Process:** +1 idle FastAPI/uvicorn on **:4011** (computing-class).  
- **Massive connections:** 0 (SYM-13 cached catalog; no scrape).  
- **Redis:** none.  
- **Disk:** log files only under `~/Library/Logs/fattail-labs/symbology.*.log`.  
- **CPU:** idle catalog in memory; no shared interval with chain_feed `--interval 2`.  
- **Ports:** 4011 (free). Does not bind 4010 / 6379 / chain_feed.  
- **launchd:** new agent `ai.fattail.labs.symbology` only. Does not edit chain-feed / vp-api / sym-feed plists.  
- **Repo:** rsync `server/symbology/` + `server/symbology_app.py` onto the existing checkout. **No git pull.**

## Rollback (one line)

```
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/ai.fattail.labs.symbology.plist
```

## Gate SYM1-DEPLOY-G

Contract tests green against the StudioOne instance (`LABS_SYMBOLOGY_API_BASE=http://192.168.1.111:4011`). AFTER check shows chain_feed undegraded (same pid, log still writing, idle line unchanged in character).
