# OPS-DASH — GBI operations pane

**State: CONSOLIDATED · LIVE.** On StudioOne, VP data-end panels live inside the
**Chain Snapshot** dashboard. **One pane of glass. No second dashboard on that box.**
StudioTwo interim `:5056` is **retired**.

| Field | Value |
|-------|--------|
| **State** | **LIVE** (inside `ai.fattail.labs.ssr-snapshot-dash`) |
| **URL** | **`http://studioone.local:5055`** |
| **On box** | `http://127.0.0.1:5055` |
| **Tunnel** | `ssh -L 5055:127.0.0.1:5055 studioone` |
| **JSON** | `GET /api/vp-ops` (named states, counts only) |
| **Chain JSON** | existing `GET /api/status` · `GET /api/day` · `GET /api/procs` |
| **Contract** | Chain Snapshot feed + VP `/v1/health` (v1.1 coverage) + board files |
| **Access** | ops-class · existing dash bind (LAN `studioone.local`) · never member-reachable |
| **Bins** | **never rendered** (VP-L18) — no `"bins"` key on `/api/vp-ops` |
| **Commands** | **none** — READ-ONLY |

## Panels (default layout)

Chain vitals stay the **top strip** (phase, cadence, snaps, symbols table). VP
pipeline columns sit **beneath**, in brief order:

1. **chain_feed** — freshness, PID, last snapshot (CP-1)
2. **collectors** SPY / ES / MES — machine, PID, last-print age, gaps today
3. **Engine** — sessions binned per source, last generation
4. **API** — state, contract version, coverage floor/ceiling per source
5. **backfill** — tranche progress, floor, integrity
6. **consumers** — MiniTwo Labs → StudioOne API last-success; StudioTwo DEV last refresh
7. **last autorun** — window result (NO COVERAGE until first 16:05 fire)

Named honest states: LIVE · CURRENT · UP · STALE · HOLD · HELD · GAPPED · DOWN · NO COVERAGE · MIGRATION · UNAVAILABLE. No green-until-proven-red.

## Retired copy

StudioTwo `http://127.0.0.1:5056` (`python -m market_data.ops_dash`) **died**
2026-09-18 07:03 ET. LaunchAgent `ai.fattail.labs.vp-ops-dash` booted out;
plist moved to `install/retired/`. `python -m market_data.ops_dash` now exits 1
and prints this URL. Shared `ops_dash.snapshot.build_snapshot()` remains — that
is the transplanted component, served by `:5055` `/api/vp-ops`.

## CP-1 footprint (this deploy)

Bounced **only** `user/503/ai.fattail.labs.ssr-snapshot-dash` (old PID 16430 →
new PID 54391). **Did not** touch `chain_feed` (PID **538** throughout),
`sym_feed`, futures collector, Engine, or API. StudioTwo `:3000` / `:4000`
untouched. Rollback = revert the dash module HTML/`/api/vp-ops`; never
`chain_feed`.
