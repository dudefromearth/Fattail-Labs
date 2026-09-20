# VPS-Q2-W0 — Q2 verification · GO token

**MACHINE:** Orchestration, board, and token writes: StudioTwo. The Q2
verification commands in this packet run on StudioOne, READ-ONLY —
no restarts, no config changes, no writes outside the board's report
files, no package installs. Execute the StudioOne steps OUTSIDE RTH
(after 16:00 ET or before 09:30 ET). Never `git add -A`. Do not stop
StudioTwo :3000 / :4000. MiniTwo / DudeTwo: not this tree.

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
**Land path:** `agents/go/VPS-Q2-W0.md`  
**Date:** 2026-09-16  
**Status:** **EXECUTED 2026-09-16 ~20:00 ET** — StudioOne READ-ONLY. chain_feed PID 538 **not degraded**. Report: `gate-reports/VPS-Q2.md`. Parent `VPS0-W0` **STAMPED** (**DL-706**). **CP-1** **DL-707**. Plan **v1.2**.

## Authority

- Spec §12 Q2: what `sym_feed` as running **today on StudioOne** captures for SPY  
- Plan v1.2 · spec v0.5 sha1 `a487a702dff7de45f3a0d4ba0ca09199bd2586dd` · **DL-707**  
- Does **not** authorize Ingest design, Engine, API, `VPS1-W0`, restarts, or RTH work

## CP-1 packet duties (this GO)

**(b) Expected footprint vs chain_feed:** READ-ONLY locate/sample. **0** new Massive connections. **0** launchd changes. Disk: sequential reads of existing SPY store (pessimistic: could contend — therefore **outside RTH only**). CPU: `head`/`grep`/`ps`/`launchctl print` — negligible vs chain_feed.  
**(c)** BEFORE and AFTER: `launchctl print` / `ps` for `chain_feed` and `sym_feed`; last chain-snapshot freshness (mtime or last line timestamp).  
**(d) Rollback:** no writes on StudioOne. Single action: **end the SSH session**. If AFTER shows chain_feed degraded: FAIL this packet (no change to reverse; escalate — this packet must not have written).

## Pre-flight (StudioTwo, before StudioOne)

```
head -1 Specs/Volume-Profile-Service-Spec-v0_5.md   # must say v0.5
sha1sum Specs/Volume-Profile-Service-Spec-v0_5.md
  # must equal a487a702dff7de45f3a0d4ba0ca09199bd2586dd
grep -c "Q2" Specs/Volume-Profile-Service-Spec-v0_5.md   # nonzero
```

## Question

What does `sym_feed`, as running today on StudioOne, actually capture for
SPY — trade prints, quotes only, or aggregate bars? At what granularity,
with what fields (price, size, timestamp, exchange, sale-condition codes),
and what retention depth?

## Evidence required (commands + output, not conclusions)

1. Locate the `sym_feed` job and its config (launchd plist, repo config in FatTail-Intelligence). State the paths.
2. Identify the Massive endpoint(s)/streams it subscribes for SPY (trades vs quotes vs aggregates) from config or code — cite the lines.
3. Sample TODAY'S stored SPY data (read-only): show 5 records verbatim. State which fields are present and which of {price, size, exchange timestamp, condition codes} are ABSENT.
4. State the earliest SPY record on disk (retention depth) and the storage format/rotation.
5. Confirm `chain_feed` and `sym_feed` remain untouched: list their process status before and after (read-only `ps`/`launchctl print`).

## Stop

- Inside RTH (09:30–16:00 ET weekdays) → do **not** touch StudioOne; report BLOCKED  
- Any write/restart/install on StudioOne → FAIL  
- Isolation FAIL list → FAIL  

## Report

Board: `agents/p-volume-profile-service/gate-reports/VPS-Q2.md`  
Coach: one screen, explicit **GO / NO-GO** on **VPS1**.
