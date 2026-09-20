# Structure endpoint — sessionless ceiling + 422 BINS_LEAKED (2026-09-20)

**Machine:** StudioOne CP-1 (weekend window)  
**Does not close a REQ.**

## CP-1 — CHAIN PRIMACY (verbatim · DL-707)

> **CP-1 — CHAIN PRIMACY.** The chain-snapshot collection on StudioOne (chain_feed and its supporting jobs) is never disrupted by Volume Profile Service work. If any test, install, invocation, backfill, or migration step could disrupt it — including indirectly via shared Massive account connection/rate limits, disk I/O or CPU contention, port conflicts, or launchd changes — the step is either redesigned to remove the risk or HELD until after the RTH close (16:00 ET). "Could disrupt" is judged pessimistically; when uncertain, hold. Every StudioOne packet must (a) carry CP-1 verbatim in its GO, (b) state its expected resource footprint (connections, disk, CPU) against chain_feed's needs, (c) capture chain_feed process status and last-snapshot freshness BEFORE and AFTER execution as evidence, and (d) include a rollback line: the single command or action that removes the change. A packet whose AFTER check shows chain_feed degraded is a FAIL regardless of its own success, and its rollback executes immediately.

### Footprint vs chain_feed

- **Process:** bounce `ai.fattail.labs.vp-api` only (`:4010`). chain_feed / sym_feed / history / symbology untouched.  
- **Massive:** 0.  
- **Redis:** none on chain db0.  
- **Disk:** overlay one file `server/market_data/vp_api/app.py`.  
- **CPU:** brief uvicorn recycle.  
- **Ports:** 4010 only.  
- **launchd:** `kickstart -k gui/$(id -u)/ai.fattail.labs.vp-api`. No chain-feed plist edit.

### BEFORE

```
pid 538  etime 04-17:47:38  RSS 71088  chain_feed --interval 2
last: no interest keys; idle
vp-api pid 43029
```

### AFTER

```
pid 538  etime 04-17:48:13  RSS 71088  unchanged
last: no interest keys; idle
vp-api pid 44322 (recycled)
```

### Rollback (one line)

```
ssh studioone 'cp /Users/ernie/Fattail-Labs/server/market_data/vp_api/app.py.bak-struct-20260920 /Users/ernie/Fattail-Labs/server/market_data/vp_api/app.py && launchctl kickstart -k gui/$(id -u)/ai.fattail.labs.vp-api'
```

Labs leak-guard (`vp_display.py` / `sa_dev.py`) is this checkout; revert those two files if the 422 must be undone on StudioTwo.

## Law applied

1. Sessionless `kind=session` defaults to **store coverage ceiling queried at serve time** (`ceiling_of`). Never a date constant. Payload `session_date` is the session served.  
2. Invalid date → **422 `bad_range`**. Empty coverage → **503 `UNAVAILABLE`**. Leak-guard (bins without `include_bins`) → **422 `BINS_LEAKED`**. No 500 for a nameable condition.

## Files

| File | Change |
|------|--------|
| `server/market_data/vp_api/app.py` | `_session_day`; sessionless → `ceiling_of`; payload names the day |
| `server/routes/vp_display.py` | leak-guard 422 `BINS_LEAKED` |
| `server/routes/sa_dev.py` | same |
| `server/tests/test_vp_api_http.py` | dated, sessionless, no-coverage, bad date, grep AT |
| `server/tests/test_sa_dev_api.py` | sessionless opt-in variants; leak-guard 422 |
| `server/tests/test_vp_display.py` | member dated+sessionless × opt-in; leak-guard 422 |

## ATs (characterization)

```
cd server && .venv/bin/python -m pytest tests/test_vp_api_http.py tests/test_sa_dev_api.py tests/test_vp_display.py tests/test_vp_contract_mock.py -q
47 passed
```

Grep AT: no `20xx-xx-xx` in `app.py` / `vp_display.py` / `sa_dev.py`; `_session_day` calls `ceiling_of`.

## PP-1 (StudioOne `:4010` + StudioTwo member hop)

Queried coverage at serve: ES floor **2026-09-08** ceiling **2026-09-18**.

| Request | Status | session_date | bins |
|---------|-------:|--------------|------|
| sidecar dated `?session_date=2026-09-18` | 200 | 2026-09-18 | 258 (contract always carries bins) |
| sidecar **sessionless** | **200** | **2026-09-18** (= ceiling) | 258 |
| sidecar dated `2026-09-17` | 200 | 2026-09-17 | 168 |
| sidecar `session_date=not-a-day` | **422** `bad_range` | — | — |
| hop sessionless `include_bins` off | 200 | 2026-09-18 | **absent** |
| hop sessionless `include_bins=true` | 200 | 2026-09-18 | 258 |
| hop dated 09-17 off | 200 | 2026-09-17 | **absent** |
| hop dated 09-17 on | 200 | 2026-09-17 | 168 |

Overnight: sessionless was **422 `bad_range`** wrapped as Labs `CONTRACT MISMATCH`. Now 200 naming the queried ceiling.

Overlay sha1 `43b17bccc4abdf9460a2ac0342d1d5304fe79490` (StudioOne = StudioTwo).
