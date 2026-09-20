# OPS-DASH consolidation — 2026-09-18 07:03 ET

**Verdict:** LIVE on StudioOne Chain Snapshot. Interim `:5056` retired.

**Pane:** `http://studioone.local:5055`

## CP-1

| Process | BEFORE | AFTER |
|---------|--------|-------|
| chain_feed | PID **538** · 2d 23h | PID **538** · untouched |
| ssr_snapshot_dash | PID 16430 · 19d (pre-VP code) | PID **54391** · kickstart `user/503` |
| sym_feed | 82012 | 82012 |
| vp_futures | 53424 | 53424 |
| vp_engine | 53072 | 53072 |
| vp_api | 53142 | 53142 |
| StudioTwo :3000 / :4000 | up | up |
| StudioTwo :5056 | PID 24524 | **not listening** |

## Chain panels BEFORE / AFTER (`/api/day?day=2026-09-18`)

| Field | BEFORE 07:01:26 | AFTER 07:02:51 |
|-------|-----------------|----------------|
| http | 200 | 200 |
| snaps | 102654 | 103020 |
| symbols_with_snaps | 18 | 18 |
| latest_with_iv | 18 | 18 |
| latest_holes | 0 | 0 |
| last_captured_at | 07:01:25.995 ET | 07:02:51.222 ET |
| /api/procs | tap/chain_feed/sym_feed/dash all True | same |
| /api/vp-ops | **404** | **200** · `no_bins` true · no `"bins"` key |

Chain cadence still 2.0 s, phase `pre`, write_root unchanged. Snaps continued to climb after the dash bounce — collector path was not the dash.

## Screenshot-equivalent (`http://studioone.local:5055`)

Dark `#0b0d10` page, title **Chain Snapshot**. Header: “StudioOne live counts · Redis + COUNTS.json · VP data-end · one pane · read-only”. Chips: PRE · NY clock · `2s cadence` · next wake. Top strip: tap/chain_feed/sym_feed/dash **up** dots, then Snaps / On today 18 / Latest IV 18 / Latest holes 0 / Last snap age in seconds. Symbols table (AAPL first, 18 rows, IV/greeks numeric, Status `ok`). Beneath: card **VP data-end (ops · no bins · never commands)** in seven columns:

1. chain_feed **LIVE** · pid 538 · freshness ~0.2s · last snapshot `wrote mb:ladder:…`
2. collectors SPY/ES/MES **LIVE** · pids 82012 / 53424 / 53424 · last-print age 0.0–0.1s · gaps today 2 / 20 / 20
3. engine all three **CURRENT** · binned 2 · floor 2026-09-17 · ceil 2026-09-18
4. API **UP** · v1.1 · ES floor 2026-09-17…2026-09-18
5. backfill **HOLD** · tranche 1 next=2026-09-16 · integrity NOT CHECKED
6. consumers MiniTwo → S1 API **UP** · StudioTwo DEV **NO COVERAGE** (honest: this pane does not poll StudioTwo loopback)
7. last autorun **NO COVERAGE** · no autorun report yet — first fire 16:05 ET

No histogram, no bin arrays, no command buttons.

## Footprint

`launchctl kickstart -k user/503/ai.fattail.labs.ssr-snapshot-dash` only. `gui/503` is not the domain (W5-GO already recorded `user/503`). Collectors untouchable. StudioTwo `ai.fattail.labs.vp-ops-dash` bootout + LaunchAgent files moved to `install/retired/`.
