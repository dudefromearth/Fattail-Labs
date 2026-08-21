# WF3-1 — Inspector + weight editor

**Project:** Options Lab Heatmap Width Fit  
**Agent:** Charlie · Echo  
**Depends:** WF3-0  
**Feeds:** WF3-G

## In scope

| File | Touch |
|------|--------|
| `web/components/options-lab/HeatmapChainPanel.tsx` | Hover tooltip; click inspector (components, neighborhood, vs-median, call/put) |
| `web/components/options-lab/HeatmapControlsColumn.tsx` | Member weight editor; default preset visible; live re-score |

## Out of scope

New API. Persistence beyond existing client prefs if any. FTI calibration.

## Law

Weight change does not fetch. Inspector uses actual component deltas. High-cell / moderate-width note (Spec §8.4).

## WF3-G (this seed’s share)

AT-WF5 · AT-WF12 smoke: change a weight → footer/grid change, no network to Massive.
