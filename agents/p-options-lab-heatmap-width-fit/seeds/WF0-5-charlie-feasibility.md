# WF0-5 — Feasibility (no code)

**Project:** Options Lab Heatmap Width Fit  
**Agent:** Charlie  
**Depends:** —  
**Feeds:** WF0-G

## In scope

Write `agents/p-options-lab-heatmap-width-fit/charlie-feasibility.md`:

- `widthFit.ts` as the pure module; `symFly.ts` only delegates  
- `types.ts` extensions (`width_fit`, weights, `GridCell.components` / `qualityFlag`)  
- Panel: footer + expand + inspector when `valueMode === "width_fit"`  
- Controls: weight editor only in that mode  
- Confirm **defaultValueMode stays debit**  
- Confirm existing debit / r2r / slope paths untouched (**WF1-G byte-identical**)  
- Confirm no new fetch, no package-quote  
- **A2:** `flySurfaceHistory` is **not** a WF1 Width Fit input  
- **B2:** `computeCell` raw only; composite in `assignColors`

## Out of scope

Implementation. MiniTwo. AF-X.

## WF0-5 done

Feasibility note on disk. File list matches plan §6.1. No code in the diff.
