# VPS1-W0 — Volume Ingest Stage A (extend sym_feed) · GO token

**MACHINE:** Design, code, fixtures, and token work: StudioTwo. The
install/verify steps run on StudioOne ONLY behind the CLOCK GATE
below, under CP-1 (a)–(d). Never `git add -A`. Do not stop StudioTwo
:3000 / :4000. MiniTwo / DudeTwo: not this tree.

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
**Land path:** `agents/go/VPS1-W0.md`  
**Date:** 2026-09-16  
**Status:** **STAMPED GO** — 2026-09-16. Chat is not the stamp; this file is (**DL-328**). **DL-709.** Coach follow-on ticks: **Q10=(b)** **DL-714** · **Q5=EXCLUDE** **DL-715**. VPS2-W0 is **not** created this packet. After these ticks the VPS2 blocker list is **`VPS2-W0` stamp only**.

**Plan:** v1.2 · spec v0.5 · Q2 report `gate-reports/VPS-Q2.md`

## Coach ticks (required before ACT 3)

- [x] Q2 = quotes-only (`gate-reports/VPS-Q2.md`)
- [x] Ingest design = EXTEND `sym_feed` (`LABS_VP_SPY_TRADES=1`, T.SPY WS thread; quote tick()/`mb:sym:SPY` unchanged)
- [x] Connection budget — **ACCEPTED WITH CONDITION:** before first connect, determine the key's tier from the Massive account dashboard (not guessed from the box). Business → proceed, headroom 2. Individual → proceed at 0 spare headroom, accepted: Massive websockets multiplex subscriptions per connection, so future stocks symbols join **this** socket; a second stocks WS is a tier-upgrade decision, not a reason to block SPY capture. **Record the observed tier on this token.**
- [x] Q4 fixture committed (`server/fixtures/vp_q4_stock_trade_conditions.json`) — **WITH KNOWN AMBIGUITY, accepted for CAPTURE:** ambiguous ids and missing id 0 are stored like everything else; for **ENGINE** eligibility they default to **EXCLUDED-and-flagged** until a resolution pass lands before first VPS2 publish (rides with the Q5 tick). Unknown-by-default never silently inflates member-facing volume.
- [x] Odd lots stored always; auction=true on auction prints
- [x] Install window: outside RTH per the clock gate, CP-1 evidence + rehearsed rollback (restore prior plist/`sym_feed.py`, `launchctl kickstart` that job only)
- [x] **Q10 = (b)** member-facing SA objects only; bins internal (**DL-714**). AZ-VP-9 amendment + SA-Q5 in next authoring rounds — no spec edits this packet.
- [x] **Q5 = EXCLUDE** odd lots from member-facing Engine eligibility; capture still stores them (**DL-715**). `vp.include_oddlots` remains one config from include.

## Connection budget (evidence for the tick — Coach confirms plan tier)

| Job | Massive use today (Q2) |
|-----|------------------------|
| `chain_feed` PID 538 | REST `GET /v3/snapshot/options/…` — **not** a stocks WS |
| `sym_feed` PID 535 | REST `GET /v2/snapshot/…/stocks/tickers/{sym}` — **not** a stocks WS |
| **Stocks WS cluster in use** | **0** |

Massive: **one simultaneous WebSocket per cluster** (Individual); **three** (Business). Additional connections $75/mo. Source: https://massive.com/knowledge-base/article/how-many-massive-websocket-connections-can-i-use-at-one-time

New `T.SPY` is the **first** stocks-cluster WS. It **fits** as 1 of 1 (Individual) or 1 of 3 (Business). **Spare headroom is 0 on Individual.** If the live key is Individual, STOP before connect unless Coach accepts 0 spare. Business: headroom 2.

**(b) Footprint vs chain_feed:** +1 stocks WS; **0** extra options REST vs today; disk append gzip jsonl on `LABS_MARKET_DATA_ROOT/vp/ingest/` (same volume as SSR/chain archive, **not** the 2026-08-18 parquet tree); CPU: one daemon thread in `sym_feed`.  
**(d) Rollback:** restore previous `ai.fattail.labs.sym-feed.plist` + `sym_feed.py` (no VP thread) and `launchctl kickstart -k gui/$(id -u)/ai.fattail.labs.sym-feed`. **Does not touch chain_feed.**

## Clock gate (ACT 3)

`TZ=America/New_York date` on StudioTwo. Proceed only after 16:00 or before 09:30 ET.

## What this token authorizes after stamp

StudioOne install of `LABS_VP_SPY_TRADES=1` on the existing `sym_feed` job. Ingest only.

## What it does not

Engine / histogram / API / `VPS2-W0`. Live Massive from StudioTwo. Parquet campaign reuse. MiniTwo / DudeTwo.

## Stamp

**STAMPED 2026-09-16** by Coach (ticks above). Observed Massive stocks-WS tier: **BOOKKEEPING (Coach overrule DL-710)** — not blocking. Both tiers already accepted on the stamp. CP-1: `chain_feed` REST-only; `T.SPY` first/only stocks WS. Second stocks WS later = real tier read.

| Tick | Coach |
|------|-------|
| Q2 quotes-only | ☑ |
| EXTEND sym_feed + quote path unchanged | ☑ |
| Connection budget (tier from dashboard, not guessed) | ☑ condition |
| Q4 fixture (ambiguity accepted for capture; Engine exclude-until-resolved) | ☑ |
| Odd lots stored; auction=true | ☑ |
| Install window / CP-1 / rollback | ☑ |
