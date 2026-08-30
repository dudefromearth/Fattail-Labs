# W4-G — today pre-selected, Reset exits

**Agent:** Delta  
**Date:** 2026-08-28  
**Verdict:** **PASS**

**Law:** TMI-64 · TMI-65 · TMI-21 · ATM-S3 · TMI-24 · AT-TM-C1 · C9

## Evidence

| Check | Result |
|-------|--------|
| Date shows today on load | `e2e/tm-w4-today.spec.ts` — value `2026-08-28` (shot `w4-reset-exits.png`) |
| Replay is **not** on just because the date is today | watermark count 0 until playhead engaged |
| Speeds 10 / 20 / 50 only | no `analyzer-tm-speed-1` |
| No Record | no Record button |
| Reset exits | watermark gone, HUD gone, date still today (`w4-reset-exits.png`) |
| Capture always on | W2 `captureToday` path unchanged; Reset uses `exitReplay()` which does **not** discard today gens |
| Mini HUD | visible while replay on (`w4-today-replay.png`); hidden on Reset |

`tmSlots.test.ts` **ok** — `exitReplay` → projector `live`, today intact; `enterTodayReplay` parks newest.

## Fail-closed (none tripped)

Record control · 1× · Reset not exiting · date missing today.

## Not closed here

W2 occupancy proofs (switch / capture-while-archive) remain **W5-G**.

**Surface high-IV watermark:** **not demonstrated.** Seeded/builder flies this session resolved CHECK LEGS / UPDATING / WAITING — wireframe, not a coloured vol field. Faint white **does** hold on Analyzer dark canvas and on Heatmap’s yellow/blue grid (`w3-watermark-heatmap.png`). Carry a Surface shot against a listed, painted tent (high-IV / light regions) — do not treat the wireframe as that check.

## Unblocks

W5 — past-day StudioOne into the archive slot.
