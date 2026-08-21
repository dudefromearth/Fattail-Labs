# WF3-0 — Footer + progressive disclosure

**Project:** Options Lab Heatmap Width Fit  
**Agent:** Echo · Charlie  
**Depends:** WF2-G  
**Feeds:** WF3-G

## In scope

| File | Touch |
|------|--------|
| `web/components/options-lab/HeatmapChainPanel.tsx` | Footer row when `valueMode === "width_fit"`; default overview; explicit expand to full matrix |
| `web/components/options-lab/HeatmapControlsColumn.tsx` | Only if expand/legend control lives here |

## Out of scope

Weight editor internals (WF3-1). Copy (WF3-2). Other templates.

## Law

Cell interiors: no numbers by default. Footer: median, \(n\), quality, stability. Low \(n\) is not high-fit chrome. HIG ≥44 pt. Overview copy: **coherent high-fit regions** — do not ship “best” until Tango WF0-4 rules the word (A3).

## WF3-G (this seed’s share)

Named walk in gate-report: Width Fit mode → footer visible; expand → full grid; Debit mode → no Width Fit footer.
