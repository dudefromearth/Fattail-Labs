# W3-G — REPLAY watermark, three hosts

**Agent:** Delta  
**Date:** 2026-08-28  
**Verdict:** **PASS**

**Law:** TMI-25 · TMI-27 · TMI-40 · TMI-81 · plan W3-G · Echo strip RETURNED-scroll

## Strip (Echo, before paint)

Horizontal scroll **removed**. Dark strip wraps: row 1 identity + Strikes/in + Autofit + PiP; row 2 full-width transport. Compact speeds collapse to one cycling chip. Pause is visible without scrolling. Walk: `e2e/tm-w1-strip-order.spec.ts` **PASS**. Shot: `evidence/w1-strip-desktop.png`.

## Watermark

| Host | Test id | Walk |
|------|---------|------|
| Analyzer | `analyzer-replay-watermark` | PASS · `w3-watermark-analyzer.png` |
| Heatmap | `heatmap-replay-watermark` | PASS · `w3-watermark-heatmap.png` |
| Surface | `surface-replay-watermark` | PASS · `w3-watermark-surface.png` |

`e2e/tm-w3-watermark.spec.ts` **PASS** (6.4s). `data-replay` present. `pointer-events: none`. No `data-glow="timemachine"` in the tree. Reduced-motion animation name none. Tango **APPROVED**.

What-if red glow remains (`data-glow="whatif"`). Badge grammar filed; cards in W7.

## Fail-closed (none tripped)

TM glow · P&L-coloured watermark · interactive watermark · Tango RETURNED.

## W2 occupancy — not closed

Switch / Reset-keeps-today / capture-while-archive are **W5-G** items. Empty archive slot at W2 does not demonstrate them.

## Unblocks

W4 — date today pre-selected, capture always on, Reset exits.
