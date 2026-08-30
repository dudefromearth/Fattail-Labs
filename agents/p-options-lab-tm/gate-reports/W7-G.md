# W7-G — rehearsal objects

**Agent:** Delta  
**Date:** 2026-08-28  
**Verdict:** **PASS**

**Law:** TMI-80 · TMI-81 · AT-TM-C7 · AT-TM-C10 · Trade Log §4.4

## Four conditions (all required)

| # | Condition | Evidence |
|---|-----------|----------|
| a | Badge on **both** alert and position cards (CCW half-recycle) | Position: `ReplayBadge` + “Rehearsal” (`data-rehearsal="1"`). Alert: same. |
| b | Ticks on **replay** clock and replay spot | Rehearsal alerts evaluate on `sessionSpot` / playhead `t_ms`. Live algos do **not** tick while a playhead is up. |
| c | Never alert store, never notify, never Trade Log | `durablePositions` / `durableAlerts` on save. Send-to-log hidden and refused. No `Notification`. |
| d | Disposal **announced** | Reset: `analyzer-rehearsal-ended` — *“Rehearsal ended. Those cards were practice — not working orders, and they never entered Trade Log.”* Cards gone. Watermark gone. `w7-rehearsal-ended.png` |

## Together on one screen

`e2e/tm-w7-rehearsal.spec.ts` **PASS**. Watermark (REPLAY) and badge (CCW + Rehearsal) walked together: `w7-watermark-and-badge.png`. Same language at two scales, not two unrelated marks.

## Hotel

`reviews/W7-1-hotel.md` **APPROVED**. Nothing reads as a live working order.

## Fail-closed (none tripped)

Rehearsal in Trade Log or alert store · silent vanish on Reset · no badge · together-shot skipped.

## Not closed here

Surface high-IV watermark (listed tent still required). W8 ATs. W9 Lima help.

## Unblocks

W8 · W9.
