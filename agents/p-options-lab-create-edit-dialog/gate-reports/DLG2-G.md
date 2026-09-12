# DLG2-G (v0.7 redo)

**Date:** 2026-09-11
**Machine:** Coach's MacBook (dev)
**Spec:** v0.7 BUILD AUTHORITY (DL-693)
**Depends:** DLG1 `8faf9cd` · DLG0 `93b08d8` not reopened
**Verdict:** **PASS** on named ATs. **§5.3.1 raised for Coach** (not a fail).
Nothing deploys.

The previous DLG2-G passed because it checked §5.3 as then written. That section
was the defect. This gate checks the **prototype image**, element by element.

## Screenshots

| | |
|--|--|
| Prototype | `gate-reports/dlg2/reference.png` |
| As built (top) | `gate-reports/dlg2/dialog.png` |
| As built (scrolled) | `gate-reports/dlg2/dialog-script.png` |
| Page | `gate-reports/dlg2/page.png` |

## AT-DLG-6 — element by element, image order

| # | Image | As built | Delta |
|---|-------|----------|-------|
| 1 | Title centred, "Create Position" | yes | **PASS** |
| 2 | SYMBOL [menu] · STRATEGY [menu], one two-column row | yes | **PASS** |
| 3 | Direction: payoff · Buy/Sell · derived name | yes; Call/Put rides in this band when `TEMPLATE_HAS_SIDE` (§8.5) | **PASS** |
| 4 | LEGS label | yes | **PASS** |
| 5 | Six columns QTY · STRIKE · TYPE · EXPIRATION · DEBIT · POS | yes | **PASS** |
| 6 | Leg 1 carries DEBIT (basis+stepper+padlock) and POS (count+quick-pick); other rows empty in those columns | yes | **PASS** |
| 7 | + Add Leg | yes | **PASS** |
| 8 | TOS SCRIPT, dark code surface, click to copy | present (`builder-tos-script`, `data-code-surface`, order string, “click to copy”). Visible after scroll — `dialog-script.png`. Sits **below the fold** when Centre/Width/Expiration are showing — see §5.3.1 | **PASS** (present; fold noted) |
| 9 | Actions stacked beside the script: commit on top, Cancel under | code: `grid-cols-[1fr_auto]`, Analyze then Cancel | **PASS** |
| 10 | No STRUCTURE / SHAPE / POSITION headings | grep empty | **PASS** |
| 11 | No Preview, entry time, Submit, Done | AT-DLG-11 | **PASS** |

## §5.3.1 — raise for Coach (held, not deleted, no invented section)

These controls exist in code and **are not in the prototype**. Held as field
rows **without** a section heading (`data-testid="builder-held-shape"`).

| Control | Status |
|---------|--------|
| **Centre** | Visible between the direction row and LEGS. Prototype sets strikes per leg. |
| **Width** | Same. |
| **Expiration (structure-level)** | Same; prototype carries expiration per leg. |

They make the panel taller than the prototype. TOS SCRIPT and the action stack
scroll below the fold when they are showing. **Coach to rule:** keep, and where
— or drop.

## Spec laws covering every file touched

| File | Laws checked |
|------|----------------|
| `PositionBuilder.tsx` | DLG-LAYOUT-0…11 · DLG-HIG-1…13 · §3 · DLG-FN-8 · DLG-FN-9 · DLG-THEME-4 · DLG-VOCAB-3 · §5.3.1 |
| tests | AT-DLG-4/6/11/15/16/17/18/19/20 |

Not only the seed bullets. The last four gates missed that; this one does not.

## AT pack

| ID | Delta | Evidence |
|----|-------|----------|
| AT-DLG-1 | **BLOCKED** | DLG3 — symbol still inert |
| AT-DLG-2 | **BLOCKED** | DLG4 |
| AT-DLG-3 | **PASS** | held |
| AT-DLG-4 | **PASS** | `dlgTheme.test.ts` — zero hex/palette/card tokens |
| AT-DLG-5 | **PASS** | held |
| AT-DLG-6 | **PASS** | table above + screenshots |
| AT-DLG-7 | **BLOCKED** | DLG4 walk; Return + focus ring in place |
| AT-DLG-8 | **BLOCKED** | DLG4 |
| AT-DLG-9 | **PASS** | AT-PC-04 |
| AT-DLG-10 | **BLOCKED** | DLG4 |
| AT-DLG-11 | **PASS** | grep |
| AT-DLG-12–14 | **BLOCKED** | DLG3 |
| AT-DLG-15 | **PASS** | `dlgSurface.test.ts` 9 ok |
| AT-DLG-16 | **PASS** | 820 / inset 20 / off-grid grep empty |
| AT-DLG-17 | **PASS** | Echo + Tango line-by-line (`reviews/DLG2-echo.md`, `DLG2-tango.md`) |
| AT-DLG-18 | **PASS** | script label, `data-code-surface`, order string, click to copy |
| AT-DLG-19 | **PASS** | `builder-legs-surface` filled, bordered, `p-4`; screenshot |
| AT-DLG-20 | **PASS** | Buy + payoff `--color-success`; screenshot shows green |

## Tests

```
dlgHig.test.ts 10 ok
dlgTheme.test.ts 6 ok
dlgSurface.test.ts 9 ok
positionBuilder.pc5.test.ts 9 ok
tosCard.test.ts 26 ok
```

## Next

DLG3 (symbol). Not until this commit is HEAD. No deploy.
