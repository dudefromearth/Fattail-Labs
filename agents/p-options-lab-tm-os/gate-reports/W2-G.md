# TMOS W2-G — Delta

**Agent:** Delta  
**Date:** 2026-08-29  
**Depends:** W2-1  
**Verdict:** **PASS**

## Disposal of `seedTodayFromSession`

**Deleted.** Function, export, mount-time calls in `ensureTmHost`, and the test that filled the today slot. Grep in `web/lib` and `web/components`: only the W2 test asserting absence. Not folded into `loadTmDay` as a second name.

`engageTodayFromCache` **deleted**. Today raise is `loadTmDay` → `fillArchiveSlot` for every date (`tmHost.ts` L106). Raise today parks the **newest print in that snapshot** (`parkNewest`, L139 / L165). Past days park session open.

`captureToday` **remains** in `useOptionChainBus.ts` L417 and `useOpfRiskGraph.ts` L706 — Width Fit Average live ring (OS-9). It is not the TM projector. One hold: playhead projector is **`archive`** while a downloaded day is up, including today.

## Fail-closed (none tripped)

`seedTodayFromSession` leftover · `engageTodayFromCache` as the today walk · tail-append · refresh control · Record · 1-min · second hold as TM replay.
