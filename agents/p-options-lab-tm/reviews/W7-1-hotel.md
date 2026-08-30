# W7-1 Hotel — rehearsal objects

**Verdict:** **APPROVED**

**Agent:** Hotel  
**Date:** 2026-08-28  
**Law:** TMI-80 · TMI-81 · AT-TM-C7 · AT-TM-C10 · Trade Log §4.4

Checked on product chrome, not a slide.

1. **Badge on the face of both cards.** Position cards (`data-rehearsal="1"`) and alert cards mount `ReplayBadge` (CCW half-recycle) plus the word **Rehearsal**. Nature is on the card, not only in where it sits. Not a control.

2. **Replay clock / replay spot, never wall time.** Rehearsal alerts evaluate on `sessionSpot` and stamp `triggeredAt` from playhead `t_ms`. Rehearsal algo ticks require `tmCursor.spot` / `tmCursor.t_ms`. Durable live algos **do not** tick while a playhead is up. Position rehearsal `entryAt` is the playhead.

3. **Never the store, never a notify, never Trade Log.** `savePositions` / `saveAlerts` write `durable*` only (`!rehearsal`). Send-to-Trade-Log is hidden and refused. No `Notification` path. `entry_source` stays three channels.

4. **Disposal announced.** Leaving replay strips rehearsal cards and shows `analyzer-rehearsal-ended`: *“Rehearsal ended. Those cards were practice — not working orders, and they never entered Trade Log.”* Silent vanish is the fail; this is the statement.

5. **Watermark + badge together.** Same language at two scales: REPLAY on the canvas, CCW badge on the object. Walk `e2e/tm-w7-rehearsal.spec.ts`. Watermark is faint white, not P&L green (W3).

Nothing here reads as a live working order. Hotel **APPROVED**.

## Fail if

Badge missing · “Live”/working-order copy on a rehearsal card · persist to session/local store · Trade Log write · notify · Reset with no announcement · watermark profit-green.
