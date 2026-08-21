# WF2-0 — Neighborhood + per-width aggregates

**Project:** Options Lab Heatmap Width Fit  
**Agent:** Charlie · Hotel  
**Depends:** WF1-G  
**Feeds:** WF2-G

## In scope

| File | Touch |
|------|--------|
| `web/lib/options-lab/templates/widthFit.ts` | Neighborhood ±1/±2; penalty; per-width normalize; `{ median, n, lowConfidence }` |
| `web/lib/options-lab/templates/symFly.ts` | `assignColors` branch for `width_fit` |

## Out of scope

Palette hex (WF2-1). Panel footer chrome (WF3). Mean as primary aggregate. Grid normalize unless Coach overrode JR3.

## Law

Stability is a **penalty outside** the member weight vector (OD-W6 a), scaled by `stability_penalty_strength` with a **config floor**. Do not multiply by `weights.surface_stability`. Do not also score stability as a weighted component. Normalize **then** apply criteria weights. Isolated spike suppressed. \(n < min_valid_n\) cannot present as high-fit aggregate.

## WF2-G (this seed’s share)

AT-WF4 · AT-WF10 fixtures green with WF2-2.
