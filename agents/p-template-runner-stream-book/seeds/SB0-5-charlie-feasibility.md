# SB0-5 — Feasibility (no code)

**Project:** Template Runner Stream Book  
**Agent:** Charlie  
**Depends:** —  
**Feeds:** SB0-G · SB1-0

## In scope

Written note:

- `streamBook.ts` under `web/lib/runner/`
- **Measure** serialized bytes of one SPX weekly dual-side gen (full greeks). Report gens that fit in 8 MiB and 32 MiB at windows 10/20/50/100.
- Confirm `web/components/ui/SegmentedControl.tsx` is landed (`role="radiogroup"`).
- `DetentSlider` must be `web/components/ui/DetentSlider.tsx` (HI kit), not invented inside HeatmapControlsColumn.
- Heatmap files only after DL-539 tick on `TRSB-W0.md`.
- `widthFit.ts` compute untouched; `FLY_HISTORY_DEPTH` untouched. `widthFitFill` importable.

## Out of scope

Implementation. New tokens.

## Done

Feasibility note on the board. File list matches plan §3.4.
