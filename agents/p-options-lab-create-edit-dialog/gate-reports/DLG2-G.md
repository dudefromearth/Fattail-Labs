# DLG2-G (v0.8 rebuild)

**Date:** 2026-09-12
**Machine:** Coach's MacBook (dev)
**Spec:** v0.8 BUILD AUTHORITY (DL-694)
**Depends:** DLG1 `8faf9cd` · DLG0 `93b08d8` not reopened
**Verdict:** **PASS** on named ATs. Nothing deploys.

Coach's marked-up prototype struck five Spec additions. This gate checks the
**image**, element by element, and that those five are gone.

## Screenshots

| | |
|--|--|
| Prototype | `gate-reports/dlg2/reference.png` |
| As built (light) | `gate-reports/dlg2/dialog.png` |
| As built (dark) | `gate-reports/dlg2/dialog-dark.png` |
| Larger type, light | `gate-reports/dlg2/dialog-light-large.png` |
| Larger type, dark | `gate-reports/dlg2/dialog-dark-large.png` |
| Page | `gate-reports/dlg2/page.png` |

## AT-DLG-6 — element by element, image order

| # | Image | As built | Delta |
|---|-------|----------|-------|
| 1 | Title centred, "Create Position" | yes | **PASS** |
| 2 | SYMBOL [menu] · STRATEGY [menu], one two-column row | yes | **PASS** |
| 3 | Direction: payoff · Buy/Sell **only** | yes — no Call/Put, no derived name | **PASS** |
| 4 | LEGS label | yes | **PASS** |
| 5 | Six columns QTY · STRIKE · TYPE · EXPIRATION · DEBIT · POS | yes | **PASS** |
| 6 | Leg 1 carries DEBIT (basis+stepper+padlock) and POS (count+quick-pick); other rows empty in those columns | yes | **PASS** |
| 7 | + Add Leg | yes | **PASS** |
| 8 | TOS SCRIPT, dark code surface, click to copy | yes — on screen at default type (`dialog.png`) | **PASS** |
| 9 | Actions stacked beside the script: commit on top, Cancel under | yes | **PASS** |
| 10 | No STRUCTURE / SHAPE / POSITION headings | grep empty | **PASS** |
| 11 | No Preview, entry time, Submit, Done | AT-DLG-11 | **PASS** |

## Spec laws covering every file touched

| File | Laws checked |
|------|----------------|
| `PositionBuilder.tsx` | DLG-LAYOUT-0…12 · DLG-HIG-1…13 · §3 · DLG-FN-8 · DLG-FN-9 · DLG-THEME-4 · DLG-VOCAB-3 |
| `dlgHig.test.ts` | AT-DLG-6/11/16/17/18/19/20/21/22 |
| `e2e/dlg2-layout.spec.ts` | AT-DLG-21 both themes + larger type · AT-DLG-22 in the DOM |

Not only the seed bullets.

## AT pack

| ID | Delta | Evidence |
|----|-------|----------|
| AT-DLG-1 | **BLOCKED** | DLG3 — symbol still inert |
| AT-DLG-2 | **BLOCKED** | DLG4 |
| AT-DLG-3 | **PASS** | held |
| AT-DLG-4 | **PASS** | `dlgTheme.test.ts` — zero hex/palette/card tokens |
| AT-DLG-5 | **PASS** | held · larger-type screenshots |
| AT-DLG-6 | **PASS** | table above + screenshots |
| AT-DLG-7 | **BLOCKED** | DLG4 walk; Return + focus ring in place |
| AT-DLG-8 | **BLOCKED** | DLG4 |
| AT-DLG-9 | **PASS** | AT-PC-04 |
| AT-DLG-10 | **BLOCKED** | DLG4 |
| AT-DLG-11 | **PASS** | grep |
| AT-DLG-12–14 | **BLOCKED** | DLG3 |
| AT-DLG-15 | **PASS** | `dlgSurface.test.ts` 9 ok |
| AT-DLG-16 | **PASS** | 1100 / inset 20 / content 1060 / off-grid grep empty |
| AT-DLG-17 | **PASS** | Echo + Tango line-by-line |
| AT-DLG-18 | **PASS** | script label, `data-code-surface`, order string, click to copy |
| AT-DLG-19 | **PASS** | `builder-legs-surface` filled, bordered, `p-4` |
| AT-DLG-20 | **PASS** | Buy + payoff `--color-success`; screenshot shows green |
| AT-DLG-21 | **PASS** | Playwright: no wrap, no h-scroll, default + `data-font-size=larger`, light and dark |
| AT-DLG-22 | **PASS** | no Call/Put, no "Buy Butterfly", no Centre, no Width, no structure-level Expiration. TYPE is per-leg |

## Tests

```
dlgHig.test.ts 11 ok
dlgTheme.test.ts 6 ok
dlgSurface.test.ts 9 ok
positionBuilder.pc5.test.ts 9 ok
tosCard.test.ts 26 ok
e2e/dlg2-layout.spec.ts 1 passed
```

## Next

DLG3 (symbol). Not until this commit is HEAD. No deploy.
