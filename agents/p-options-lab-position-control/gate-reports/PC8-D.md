# PC8-D — Analyzer position card density

**Date:** 2026-09-11  
**Machine:** Coach's MacBook (dev)  
**Defect remediation of** PC8 `f1d536a`. Not a packet reopen.

## Measured card height (same SPX 20-wide fly, same seed)

| | Height |
|--|--------|
| Before | **290px** |
| After | **162px** |

Screenshots: `gate-reports/pc8-d/before.png` · `pc8-d/after.png`

Native `<select>` still sets a floor per row. Height is now driven by three data rows, not a five-control rail.

## Grep (`AnalyzerPositionsList.tsx`)

| Pattern | After |
|---------|-------|
| `font-semibold` | 1 (delete-confirm title only) |
| `uppercase` | 7 (column headers + named states CHECK PRICE / DEBIT / EXPIRED / NOT TRADED) |
| `text-[16.5px]` | 0 |
| `text-[20.25px]` | 0 |
| `min-h-8` | 0 |
| `gap-4` | 0 |

## ✕ vs Close

Separate tests in `tosCard.test.ts` (`onAskDelete` / `onClosePosition`). ✕ is the right-edge delete. Close is a labeled gutter control.

## Entry time

Gone from the card (`type="time"` absent). Editor is `builder-entry-at` in the Edit dialog.

## Spec v1.3 flags (D-PC-9)

Findings 4 and 5 (✕ placement; entry-time off the card) change §5.2. Findings 1–3 are density defect remediation.

Characterization: tosCard 18 ok · chainControls 11 · lock.pc6 9 · pc5 9 · PC9b mapper 11.
