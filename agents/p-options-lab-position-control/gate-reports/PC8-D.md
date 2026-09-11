# PC8-D — Analyzer position card density and control fidelity

**Date:** 2026-09-11  
**Machine:** Coach's MacBook (dev)  
**Defect remediation of** PC8 `f1d536a`. **Supersedes** the first PC8-D pass (`76e45d5`). Not a packet reopen.

Coach rejected the card twice: it got larger when the requirement was to compress, and the QTY control did not resemble `docs/reference/tos/tos-qty-stepper.png`. Acceptance is a visual match at the stated measurements, 100% zoom. Functionally correct is not a pass.

## Finding 0 — stepper lopsided at rest — FIXED

`GROWN.split(" ")[0]` applied `min-h-[var(--hit-min)]` to the **up segment only, unconditionally**. `--hit-min` is `2.75rem` (`styles/tokens.css:64`) → 44px up / 14px down.

Deleted. Resting is explicit `h-[18px]`, segments `flex-1` with a dedicated 1px rule (a `border-b` on one segment recreated a 1px tilt). `--hit-min` is grown-only via `group-hover/step:` / `group-focus-within/step:`.

Measured at 100% zoom:

| State | Height | Width | + half | − half | caret |
|-------|--------|-------|--------|--------|-------|
| Rest  | **18px** | 34px | **8.5px** | **8.5px** | 18×18 |
| Grown | **44px** | 44px | **21.5px** | **21.5px** | — |

Grown = `--hit-min` (2.75rem = 44px at 16px root). Symmetric at rest and grown.

## Finding 1 — QTY is one group — FIXED

`TosQtyControl`: stepper + filled caret square, butted, equal height, no gap, `bg-black/80` (not `bg-black/30` at `opacity-40`). Glyphs are short thick SVG bars, not typographic `+` / `−`. Caret is a filled square with a solid ▼. Unit height = row (18px), baseline-aligned to the QTY number.

Side-by-side: `docs/reference/tos/tos-qty-stepper.png` vs `gate-reports/pc8-d/qty-rest.png` and `qty-unit-rest.png`. Grown: `qty-grown.png`.

## Findings 2–3 — house scale, weight, tracking — held

Data 11px, chrome 10px. Uppercase only on the column header row and named states (CHECK PRICE / DEBIT / EXPIRED / NOT TRADED). No 1.5× family.

## Finding 4 — rail is not a column — held; height now follows legs

Native `<select>` was still flooring each row. `appearance-none` + `h-[18px]` so the control honors the row. Three-leg card is **60px**.

## Findings 5–6 — card law, flag Spec v1.3 (D-PC-9)

- ✕ → `onAskDelete()` at the **right edge**, low-contrast delete. Confirmation kept.
- Close → `onClosePosition(id)` labeled gutter control. Not merged, not removed.
- Entry-time `<input type="time">` off the card; editor is `builder-entry-at` in Edit. `onSetEntryAt` stays on the props contract. Rehearsal badge clock stays.

## Measured card height (same SPX 20-wide fly seed)

| | Height |
|--|--------|
| Before (PC8 shipped) | **290px** |
| First PC8-D (rejected) | **162px** |
| This pass | **60px** |

Screenshots: `gate-reports/pc8-d/before.png` · `pc8-d/after.png`

## Grep

| Pattern | File | After |
|---------|------|-------|
| `font-semibold` | AnalyzerPositionsList.tsx | 1 (delete-confirm title only) |
| `uppercase` | AnalyzerPositionsList.tsx | 7 (comment + column headers + named states) |
| `text-[16.5px]` | AnalyzerPositionsList.tsx | 0 |
| `text-[20.25px]` | AnalyzerPositionsList.tsx | 0 |
| `min-h-8` | AnalyzerPositionsList.tsx | 0 |
| `gap-4` | AnalyzerPositionsList.tsx | 0 |
| `.split(" ")` | TosControls.tsx | 0 |
| `GROWN` | TosControls.tsx | 0 |
| `TosQtyQuickPick` | TosControls.tsx + list | 0 |

## Tests

- tosCard 18 ok (AT-PC-67: `--hit-min` grown-only, no `.split`; AT-PC-69: `TosQtyControl`; PC8-D: ✕ deletes, Close closes, no `type="time"` on the card)
- chainControls 11 ok
- lock.pc6 9 ok
- positionBuilder.pc5 9 ok
- analyzerToTradeLog (PC9b mapper) 11 ok

Ten PC-VOCAB-7 columns, seven editable fields, padlock / stepper / quick-pick behaviour, `CardLockState` — unchanged. No pricing path change. No backend, no migration, no deploy.
