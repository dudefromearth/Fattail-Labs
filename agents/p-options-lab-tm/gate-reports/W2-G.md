# W2-G — two browser slots, one playhead

**Agent:** Delta  
**Date:** 2026-08-28  
**Verdict:** **PASS**

**Law:** plan v1.2 W2-G · TMI-79 v0.7.4 · TMI-65 · TMI-73 · TMI-42 · TMI-76

## Occupancy

| Slot | Implementation | Dies |
|------|----------------|------|
| **Today** | `state.today` in `web/lib/options-lab/tmSlots.ts` | Trading-date or symbol change (TMI-73 / ATM-C2) |
| **Archive** | `state.archive` (empty gens this wave) | Switch past day discards first; Reset / `loadTmDay("")` / symbol change → `discardArchiveReturnLive()` |

There is **no** `heldDay: Date | null`. One playhead: `{ t_ms, projector: live \| today \| archive }`.

Capture is **always on** from the live chain: `useOptionChainBus` (Heatmap socket) and `useOpfRiskGraph` (Analyzer). Same contentHash replaces in place. Opening an archive day does **not** pause capture and does **not** discard today. Return to live drops archive and parks today's newest.

NO DATE if OPF `as_of` is missing (`tradingDateFromAsOf`).

## Evidence

| Check | Result |
|-------|--------|
| `npx tsx lib/options-lab/tmSlots.test.ts` | **ok** — two slots; capture continues with archive open; one archive day; return-to-live keeps today and parks newest; TMI-73 discards previous today; no `heldDay:` field |
| `rg heldDay` in `web/` | only the test asserting it is absent |
| `server/` film / Redis TM | **none** |
| Wiring | `tmSlots.ts` · `useOptionChainBus.ts` · `useOpfRiskGraph.ts` · `OpfRiskAnalyzer.tsx` Reset/symbol → `discardArchiveReturnLive`; past date → `setArchive` |

## Fail-closed (none tripped)

`server/` film · Record · capture paused · today discarded because a past date was selected · two archive days · `heldDay` singleton · archive days written into Heatmap Redis.

**Not a fail:** today + empty archive.

## Also this wave (required before W3)

W1 live browser walk **PASS** — `reviews/W1-walk.md`. First pass clipped the transport; strip is now one scrolling row. Evidence PNGs under `evidence/w1-strip-*.png`.

## Unblocks

W3 — REPLAY watermark + badge grammar (live walk required on three hosts).
