# VPSB-W0 — Futures collector (ES + MES) · GO token

**MACHINE:** Build, fixtures, harness, token: StudioTwo — STARTS NOW,
highest priority on the board. StudioOne install only in today's
post-16:00 window on the StudioTwo clock, under CP-1 (a)–(d). Never
`git add -A`. Do not stop StudioTwo :3000 / :4000.

**CP-1 — CHAIN PRIMACY.** The chain-snapshot collection on StudioOne
(chain_feed and its supporting jobs) is never disrupted by Volume
Profile Service work. If any test, install, invocation, backfill,
or migration step could disrupt it — including indirectly via
shared Massive account connection/rate limits, disk I/O or CPU
contention, port conflicts, or launchd changes — the step is
either redesigned to remove the risk or HELD until after the RTH
close (16:00 ET). "Could disrupt" is judged pessimistically; when
uncertain, hold. Every StudioOne packet must (a) carry CP-1
verbatim in its GO, (b) state its expected resource footprint
(connections, disk, CPU) against chain_feed's needs, (c) capture
chain_feed process status and last-snapshot freshness BEFORE and
AFTER execution as evidence, and (d) include a rollback line: the
single command or action that removes the change. A packet whose
AFTER check shows chain_feed degraded is a FAIL regardless of its
own success, and its rollback executes immediately.

**Board:** [`agents/p-volume-profile-service/`](../p-volume-profile-service/)  
**Land path:** `agents/go/VPSB-W0.md`  
**Date:** 2026-09-17  
**Status:** **STAMPED GO** · **AMENDED 2026-09-17** (docs-verified + StudioTwo-collect + **capacity guard**). **INFRA instance (DL-720).** Collector only.

## Coach ticks

- [x] Q1 SECURED: Massive Futures Advanced active (**DL-717**)
- [x] Scope: COLLECTOR ONLY. Symbols: ES and MES trades, both multiplexed on **ONE futures WebSocket** — separate entitlement budget from the stocks T.SPY socket; both budgets stated below
- [x] Sibling job: own launchd label, own store `{LABS_MARKET_DATA_ROOT}/vp/ingest/{ES,MES}/`, append-only; session key = vendor **`session_end_date`** (not local-clock math); per print **mandatory:** price, size, exchange timestamp (UTC ns **raw**), contract ticker, `session_end_date`. Condition/flag fields captured **verbatim IF present** — absence is not a defect. CME condition fixture is **observed after tonight's capture**, not guessed.
- [x] CP-1 footprint stated for 24/7 operation (RTH included); kill switch: unloading this job leaves `chain_feed` and `sym_feed` untouched
- [x] Install at today's **16:00** window; no pre-open install (CP-1 pessimistic; backfill covers today's RTH later)

## Budgets (separate clusters)

| Cluster | Job | Use |
|---------|-----|-----|
| **Stocks WS** | `sym_feed` + `LABS_VP_SPY_TRADES=1` | `T.SPY` on `wss://socket.massive.com/stocks` — 1 connection (already live) |
| **Futures WS** | **this job** `ai.fattail.labs.vp-futures` | `T.{front,next}` for ES and MES on `wss://socket.massive.com/futures` — **1** connection, multiplexed. **Do not** retry on the stocks socket |

Massive: 1 simultaneous WS **per cluster**. Futures Advanced (Q1) entitles the futures cluster. Stocks budget unchanged.

**(b) Footprint vs chain_feed:** +1 futures WS; 0 extra options REST; disk append gzip jsonl under `vp/ingest/ES` and `vp/ingest/MES` (same volume as SSR). 24/7 including RTH — judged pessimistic vs chain_feed; install **after 16:00** first, not at pre-open.  
**(d) Kill switch:** `launchctl bootout gui/$(id -u)/ai.fattail.labs.vp-futures` (or `user/$(id -u)/…`). **Does not** touch `chain-feed` or `sym-feed`.

## Amendments (Coach, 2026-09-17, docs-verified)

1. **ACCESS:** Futures Advanced active with **full access** — Coach fact (**DL-717** / **DL-718**). **No tier or entitlement check in this packet.** WS refused → report line, not a verification errand.
2. **API FAMILY:** `/futures/v1/*` + futures WebSocket. Timestamps are **UTC nanoseconds**; store **raw**; convert only at display.
3. **SESSION TAGGING:** vendor **`session_end_date`** is the session key (a session ending 5:00 p.m. CT carries that date). Do **not** derive session identity from local clock math.
4. **ACTIVE CONTRACTS:** `GET /futures/v1/contracts` (product ES / MES, active filter), refreshed daily (VP-L3). Roll weeks capture both because **both are active**.
5. **GAP LAW:** consult `GET /futures/v1/schedules` per product; a **scheduled maintenance halt is NEVER a gap**. Gaps only for silence during a **scheduled-open** session (disconnect or `vp.gap_min_seconds`). ACT 3 verify: `GET /futures/v1/market-status` — do not assume the halt hour.
6. **MANDATORY FIELDS:** price, size, exchange timestamp, contract ticker, `session_end_date`. Conditions optional.

## StudioTwo-collect (Coach)

Collect **TODAY** on StudioTwo; migrate to StudioOne **tonight** after 16:00 (prefer 17:00–18:00 CT halt). Never two writers on one store.

## Capacity (Coach, before launch)

1. `df` on the volume holding the store; `du` of `vp/ingest`. Estimate ~low single-digit GB/day ES+MES compressed. Require headroom **≥ 20× that estimate AND ≥ 10% of the volume free** — else STOP, do not launch.
2. Store must not starve StudioTwo `:3000`/`:4000` app data. If same volume, use the larger volume if one exists; record the path.
3. **RUNNING GUARD:** every 15 min, if free < **5 GB**, stop writing cleanly with gap marker **`DISK_GUARD`**.
4. Tonight's ACT B rsync repeats the numbers check on StudioOne before copy.

## Clock (ACT 3)

StudioTwo `TZ=America/New_York date` **after 16:00 ET**. Else HOLD.

## Out of this packet

Backfill · VPB-Q1 historical basis · Stage B Engine/mapping · spec/draft document work
