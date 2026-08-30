# Seed W2-1 — Charlie one load path

**Project:** Time Machine One Source  
**Agent:** Charlie  
**Depends:** W1-G PASS  
**Law:** TMI-82 · TMI-83 · TMI-84 · TMI-85 · TMI-86 · TMI-87 · TMI-88 · TMI-90 · TMI-64 · TMI-70 · TMI-71 · AT-TM-OS-9  
**Files (declare before touch):** `web/lib/options-lab/tmHost.ts` · `web/lib/options-lab/archiveLoad.ts` (`seedTodayFromSession` **must be named in the diff**) · `web/lib/options-lab/tmSlots.ts` · `web/lib/market/useOptionChainBus.ts` · `web/lib/options-lab/useOpfRiskGraph.ts` · Width Fit / `getStreamBook` **only if** a hold change would touch it — Average must still run · tests beside those  
**Out:** tail-append · refresh control · decay ladder · Record · 1-min · second hold · Instant Replay name · Basic chrome · deleting the live-generation ring Average uses · leaving `seedTodayFromSession` as a mount-time fill

## Ask

1. **One path.** `loadTmDay` uses `fillArchiveSlot` for every date, including today. Coarse then infill to **full**. Fidelity reports progress toward full.
2. **TMI-64.** Date on today without a playhead does **not** download. Live paint stays the socket.
3. **Raise today.** Download StudioOne’s today **as it stands**. Park on the newest print **in that snapshot**.
4. **Snapshot (TMI-88).** The hold does not grow while scrubbing. No StudioOne tail-append. No live-socket append into the hold. Completed hold does **not** re-check `day_hash` (`day_changed` is in-flight only).
5. **Newer range.** **Reset, then raise.** Do not invent a refresh control.
6. **One hold (TMI-84).** Switch date discards first. Reset drops the hold. Occupancy is one day or none.
7. **`captureToday` is not a replay derivation.** Remove or no-op writes **into the TM hold**.
8. **Dispose `seedTodayFromSession` by name.** W1 lifts `TODAY_LIVE`, so this path starts working unless this packet removes it or folds it into `loadTmDay`. It must not sit, must not run on host init, and must not fill the hold without a playhead (TMI-64). Grep-clean or identical to `loadTmDay` — not a third path. A leftover that succeeds silently is worse than `engageTodayFromCache`, which fails loudly.
9. **Width Fit Average stays (OS-9).** The live-generation ring that feeds Average is a different thing. Do not retire it with the TM-hold writes.

## Done when

`seedTodayFromSession` is gone or is `loadTmDay`. Unit + e2e characterize the load path. OS-7 snapshot; Reset+raise lengthens; switch discards; OS-9 Average still a window mean. **OS-1 is not closed here on a fixture** — W5 live late-tab walk. Delta W2-G.
