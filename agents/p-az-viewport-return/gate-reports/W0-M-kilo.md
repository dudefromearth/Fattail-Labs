# W0-M — Kilo splitter

**Project:** p-az-viewport-return  
**Agent:** Kilo  
**Date:** 2026-08-19  
**Depends:** W0-0 (path unnamed → A→F listed order)  
**Verdict:** **BLOCKED**

PASS is illegal. The splitter was **not** reproduced in Chromium.

## Command

```bash
cd web && npx playwright test e2e/analyzer-viewport-w0m-splitter.spec.ts --reporter=list
```

**Result:** 1 passed (15.5s). Exit 0.  
Dump: `web/test-results/analyzer-w0m-splitter.json` (not committed).

## Setup

Listed Create 20-wide at spot (viewX ~7630–7785, live SPX). Real `page.mouse` drag and `page.mouse.wheel`. Hit top: `pnl-chart-host`. `inert: false`. `data-wheel-bound: 1`. Host box 902×300.

## Paths (Coach unnamed)

| Path | Drag `viewX` changed | Wheel ticks grew |
|------|----------------------|------------------|
| Hard refresh | yes | 0→8 |
| A Surface tab | yes | 8→16 |
| B Heatmap SPA | yes | 0→8 |
| C Surface **page** SPA | yes | 0→8 |
| D `/app` then Analyzer | yes | 0→8 |
| F `goBack` from Heatmap | yes | 0→8 |
| E browser tab | **not simulated** | visibilitychange ≠ real tab |

## Why BLOCKED

Coach still fails leave/return. This harness is green. That is the W0-M terminal: **not** a third guessed fix. Next: Coach names the path (or sits with Kilo). Path E (real tab/window) remains unmeasured.
