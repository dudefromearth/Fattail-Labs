# Seed W1-1 — Charlie Packet A (`PnLChart`)

**Project:** p-az-viewport-2d  
**Agent:** Charlie  
**Phase:** W1  
**Depends:** W0-BA **or** impl stamp + DL naming bypassed W0  
**Law:** Analysis Packet A · impl plan §2 · Echo W0-3 VP-A1  
**Gate it feeds:** W2 · W3 · W3-E

## Intent

Sticky 2D view. Left-drag pans on the tent. Native wheel. Live BE / What-if must not Autofit.

## Files in scope

- `web/components/options-lab/risk-graph/PnLChart.tsx`  
- **New:** `web/lib/risk-graph/pnlChartViewPolicy.ts` (+ tests may land in W2)

## Out of scope

`OpfRiskAnalyzer.tsx`. `onStrikeDrag` wiring. Wheel step ≠ 3%. Surface 3D. Heatmap.

## Wire

1. Delete hovered-curve left-click → menu. Right-click unchanged.  
2. `userAdjustedView` on wheel / pan / axis-drag.  
3. Clear lock: Auto-fit button + **structure** change (Echo VP-A1). Show/Hide = draw only unless Echo overrode.  
4. T6 / T7 / T8 after lock → `scheduleDraw` only. First-paint + first-curves fit stay.  
5. Native `addEventListener('wheel', …, { passive: false })`.  
6. Pointer capture. Axis-zoom min half-range.

## Done when

Left-click on tent does not open a menu. AT-VS-1 **would** pass once W2 lands. No `OpfRiskAnalyzer` diff.

## Invariants

VP-B1 lock. DL-309. AT-AF-7 on 2D. VP-A2 (keep 3%).
