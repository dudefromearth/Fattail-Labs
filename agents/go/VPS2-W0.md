# VPS2-W0 — Profile Engine (session + developing) · GO token

**MACHINE:** Build, goldens, token: StudioTwo — STARTS NOW. StudioOne
steps only inside tonight's **post-16:00** window under CP-1 (a)–(d).
Never `git add -A`. Do not stop StudioTwo :3000 / :4000.

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
**Land path:** `agents/go/VPS2-W0.md`  
**Date:** 2026-09-17  
**Status:** **STAMPED GO** (Coach ticks below). VPS3 not this packet.

## Sequencing correction (Coach, verbatim)

the prior packet over-serialized — the VPS1-G full-RTH report gates only
StudioOne install and live runs (ACT 3), never StudioTwo build (ACT 2).
Build proceeds today in parallel with capture. Only physics waits:
today's tape completes at the close.

## Coach ticks

- [x] Q5 = EXCLUDE (DL-715) · Q6 = (c) (DL-706) — sessions + developing ship first
- [x] **Composite fenced** (Coach 2026-09-17 · singular drive / contract v1.0): Engine publishes `session` and `developing` only. `kind=composite` is rejected. Fence lifts only with a later GO.
- [x] **F3 golden = v0.6.1:** bins are source-space and **byte-identical across offset republish**. Consumers apply `ratio` / `offset_published`. Must be green BEFORE tonight's install byte-match.
- [x] ACT 2 build authorized immediately on StudioTwo
- [x] ACT 3 (StudioOne) gated on: tonight's clock window AND the VPS1-G full-RTH report reading GO — produced in the SAME evening activation
- [x] Q4: still-ambiguous ids EXCLUDED-and-flagged; tonight's proposal refines, build does not block on it
- [x] Engine on StudioOne reads Ingest archive read-only, writes only its own store; CP-1 footprint stated; kill switch (unload Engine job) leaves Ingest and chain_feed untouched
- [x] First live-RTH developing run = MONITORED event, next session (**2026-09-18**), chain_feed checks before/during/after

## CP-1 footprint (Engine)

**(b)** After-hours session rebuild: one-shot CPU over the day's gzip jsonl; disk write under `{LABS_MARKET_DATA_ROOT}/vp/engine/` only; **0** new Massive connections. Developing (next session): recompute at most every **15 s**, volume-driven (no new eligible volume ⇒ no write). Must not contend with `chain_feed` REST; if uncertain, hold.  
**(d) Kill switch:** `launchctl bootout` the Engine label only (`ai.fattail.labs.vp-engine`). Does **not** touch `sym-feed` or `chain-feed`.

## Clock (ACT 3)

StudioTwo clock **after 16:00 ET** (tonight). Else HOLD with observed time. Not the before-09:30 window.

## What this does not

API install (VPS4 build may proceed on StudioTwo against Contract v1.0; install is gated) · mapping (VPS3) as a separate token · consumers · analysis vocabulary (VP-L1) · MiniTwo/DudeTwo · **composite publish**
