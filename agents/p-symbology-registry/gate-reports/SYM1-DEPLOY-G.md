# SYM1-DEPLOY-G — Registry sidecar on StudioOne D1

**Verdict:** PASS (GO)  
**Date:** 2026-09-19  
**Machine:** StudioOne (overlay; no git pull)

## CP-1 — CHAIN PRIMACY (verbatim · DL-707)

> **CP-1 — CHAIN PRIMACY.** The chain-snapshot collection on StudioOne (chain_feed and its supporting jobs) is never disrupted by Volume Profile Service work. If any test, install, invocation, backfill, or migration step could disrupt it — including indirectly via shared Massive account connection/rate limits, disk I/O or CPU contention, port conflicts, or launchd changes — the step is either redesigned to remove the risk or HELD until after the RTH close (16:00 ET). "Could disrupt" is judged pessimistically; when uncertain, hold. Every StudioOne packet must (a) carry CP-1 verbatim in its GO, (b) state its expected resource footprint (connections, disk, CPU) against chain_feed's needs, (c) capture chain_feed process status and last-snapshot freshness BEFORE and AFTER execution as evidence, and (d) include a rollback line: the single command or action that removes the change. A packet whose AFTER check shows chain_feed degraded is a FAIL regardless of its own success, and its rollback executes immediately.

## Footprint vs chain_feed

- **Process:** +1 idle FastAPI (`python -m symbology_app`) on **:4011**, computing-class.  
- **Massive:** 0 connections (SYM-13 cached catalog).  
- **Redis:** none.  
- **Disk:** `~/Library/Logs/fattail-labs/symbology.{out,err}.log` only.  
- **CPU:** RSS 57 MB at 10 s; no shared interval with chain_feed `--interval 2`.  
- **Ports:** 4011 (was free). 4010 / 6379 untouched.  
- **launchd:** new `ai.fattail.labs.symbology` only. chain-feed / vp-api / sym-feed plists not edited.  
- **Repo:** rsync `server/symbology/` + `server/symbology_app.py`. StudioOne git remains `36699be9`.

## BEFORE (16:42:16 EDT)

- chain_feed **pid 538**, elapsed 04-09:12:37, CPU 0.0%, RSS 71088, `Python -m market_data.chain_feed --interval 2`  
- log mtime 16:42:14, last line `no interest keys; idle`, 37 781 413 bytes  
- vp-api pid 74792 *:4010  
- load 1.80 1.83 1.93  
- Saturday post-close (ES closed Friday 17:00 ET)

## AFTER (16:42:27 EDT)

- chain_feed **pid 538 unchanged**, elapsed 04-09:12:48, RSS **71088 unchanged**, last line `no interest keys; idle`  
- log 37 781 551 bytes (still writing)  
- vp-api pid **74792 unchanged**  
- symbology pid 24910 *:4011  
- load 2.00 1.87 1.95 — not degraded vs BEFORE

## Contract tests

`LABS_SYMBOLOGY_API_BASE=http://192.168.1.111:4011 pytest tests/test_symbology_studioone_live.py` — **20 passed**. Unauthenticated 401 confirmed by curl.

## Rollback (one line)

```
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/ai.fattail.labs.symbology.plist
```

Not AP-1. Not MiniTwo. REQ-001 OPEN · REQ-002 OPEN · REQ-003 OPEN. D6/D7/D8 open. ES/MES model ACTIVE blocked on VPS Q1.
