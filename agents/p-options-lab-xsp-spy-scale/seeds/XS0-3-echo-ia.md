# XS0-3 — Heatmap / Create IA

**Project:** Options Lab XSP / SPY Scale  
**Agent:** Echo  
**Depends:** —  
**Feeds:** XS0-G · XS2-3

## Intent

| Item | Pin |
|------|-----|
| 7-col vs 9-col | XSP/SPY heatmap columns 1…7; SPX-class stays 9 cols 10…50. Footer Width Fit \(n\) follows column count |
| No Width picker (L3) | AT-DLG-22 / Dialog Spec v0.13. This board never draws XS-W |
| Create walk | Per-leg strike steppers on the listed grid is the HIG path (≥44 pt) |
| **A1 `profileLine`** | Default wording (confirm at XS2-3): `· universe` / `· kind default` / `· unknown`; empty list → `widths — (no column list)`. No new element, no layout change |
| Sibling not A1 | L1353–1354 width-range caption: record whether it needs the empty guard; do not expand A1 |

## Out of scope

Code. Restoring Width / Centre / Expiration. Traffic-light. MiniTwo.

## XS0-3 done

7-col vs 9-col named. L3 Width picker absent. `profileLine` default strings named for XS2 confirm.
