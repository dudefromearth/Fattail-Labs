# SYM3-F1-G — REQ-003 F1 clauses 2–3 (full search + strip order)

**Verdict:** PASS (GO)  
**Date:** 2026-09-19  
**Machines:** StudioTwo (dialog) + StudioOne overlay `:4011` (CP-1)  
**Law:** `artifacts/reqs/REQ-003-F1.md` · **DL-776**

REQ-003 stays OPEN. Not AP-1. Clauses 1, 4–6 were not rewritten.

## Did

Alpha — universe groups carry `front` / `forward` dated long form as-of `sg-20260919-001`; every row carries `display_name`. Resolve matches ticker **and** `display_name` (substring). `"e-mini"` / `"s&p"` / `"500"` reach ES. `"es"` is a ticker-prefix (ES above MES).

Charlie + Echo — rest and search children are front, then forward, then remaining strip. `{root}1!` / `{root}2!` shown **against** those rows (`data-testid=symbol-search-alias-against`). Matched substrings highlighted (`data-testid=symbol-search-highlight`, TV yellow mark on white/black dialog). `/ES` `@ES` remain search dialects.

## Tests

| Suite | Result |
|-------|--------|
| `LABS_SYMBOLOGY_API_BASE=inprocess pytest tests/test_symbology_registry.py tests/test_symbology_fixture_hygiene.py` | **61 passed** |
| `pytest tests/test_symbology_studioone_live.py` (overlay) | **20 passed** |
| `npx tsx lib/symbology/picker.test.ts` | **15 passed** |
| `npx tsx lib/symbology/dialog.source.test.ts` | **7 passed** |
| `LABS_WEB_BASE_URL=http://studiotwo:3000 playwright e2e/sym3-symbol-search.spec.ts --headed` | **2 passed** (6.0s) |

Client grep: no `FGHJKMNQUVXZ`, no `FIXTURE`, no hardcoded `ESZ2026` / `ESH2027` in picker/dialog/types.

## Headed artifact

`artifacts/symbology/sym3/f-es-search.png` — type **"es"**: ES family on top, first child live front (`ESZ2026`) with `ES1!` against it, second live forward (`ESH2027`) with `ES2!`, highlights visible. MES (name-only via "Futures") ranks below.

Also refreshed: `a-at-rest.png` `b-es-family.png` `c-slash-es.png` `d-gray-nq.png` `e-chips.png`.

Live overlay curl (computing-class `:4011`):

- universe ES `front=ESZ2026` `forward=ESH2027` `display_name=E-mini S&P 500 Futures Dec 2026`
- `q=es` roots `['ES', 'MES']`
- `q=e-mini` / `s&p` / `500` all include ES

## StudioOne overlay — CP-1

> **CP-1 — CHAIN PRIMACY.** The chain-snapshot collection on StudioOne (chain_feed and its supporting jobs) is never disrupted by Volume Profile Service work. If any test, install, invocation, backfill, or migration step could disrupt it — including indirectly via shared Massive account connection/rate limits, disk I/O or CPU contention, port conflicts, or launchd changes — the step is either redesigned to remove the risk or HELD until after the RTH close (16:00 ET). "Could disrupt" is judged pessimistically; when uncertain, hold. Every StudioOne packet must (a) carry CP-1 verbatim in its GO, (b) state its expected resource footprint (connections, disk, CPU) against chain_feed's needs, (c) capture chain_feed process status and last-snapshot freshness BEFORE and AFTER execution as evidence, and (d) include a rollback line: the single command or action that removes the change. A packet whose AFTER check shows chain_feed degraded is a FAIL regardless of its own success, and its rollback executes immediately.

### Footprint vs chain_feed

- **Process:** kickstart existing idle FastAPI (`python -m symbology_app`) on **:4011**, computing-class.  
- **Massive:** 0 connections.  
- **Redis:** none.  
- **Disk:** rsync `server/symbology/{catalog.py,service.py}` only (~12 KB). No git pull.  
- **CPU:** catalog in memory; no shared interval with chain_feed `--interval 2`.  
- **Ports:** 4011 only. 4010 / 6379 untouched.  
- **launchd:** `kickstart -k ai.fattail.labs.symbology` only. chain-feed / vp-api / sym-feed plists not edited.  
- **Repo:** StudioOne git remains `36699be9`.

### BEFORE (17:27:00 EDT)

- chain_feed **pid 538**, elapsed 04-09:57:21, CPU 0.0%, RSS 71088, `Python -m market_data.chain_feed --interval 2`  
- log last line `no interest keys; idle`, 37 810 577 bytes  
- vp-api pid 74792 *:4010  
- symbology pid 24910 *:4011  
- load 1.90 2.12 1.98  
- Saturday post-close  
- Evidence: `agents/p-symbology-registry/gate-reports/SYM3-F1-DEPLOY-before.txt`

### AFTER (17:27:11 EDT)

- chain_feed **pid 538 unchanged**, elapsed 04-09:57:32, RSS **71088 unchanged**, last line `no interest keys; idle`  
- log 37 810 692 bytes (still writing)  
- vp-api pid **74792 unchanged**  
- symbology pid **26514** *:4011 (kickstart)  
- git **36699be9** unchanged  
- load 1.84 2.10 1.97 — not degraded vs BEFORE  
- Evidence: `agents/p-symbology-registry/gate-reports/SYM3-F1-DEPLOY-after.txt`

### Rollback (one line)

```
launchctl kickstart -k gui/$(id -u)/ai.fattail.labs.symbology
```

(or `launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/ai.fattail.labs.symbology.plist` to remove the sidecar only)

## Not AP-1

REQ-003 stays OPEN. Coach's browser, his clicks, StudioTwo, tile → dialog → selection → chart.
