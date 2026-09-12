# DLG2-G (v0.13 consolidated)

**Date:** 2026-09-12
**Machine:** Coach's MacBook (dev)
**Spec:** v0.13 BUILD AUTHORITY (DL-696)
**Depends:** DLG1 `8faf9cd` · DLG0 `93b08d8` not reopened
**Verdict:** named chrome ATs **PASS**. Symbol re-resolve **BLOCKED** on DLG3.
Nothing deploys.

## Screenshots

| | |
|--|--|
| Prototype | `gate-reports/dlg2/reference.png` |
| Light, default type | `gate-reports/dlg2/dialog.png` |
| Dark, default type | `gate-reports/dlg2/dialog-dark.png` |
| Light, larger type | `gate-reports/dlg2/dialog-light-large.png` |
| Dark, larger type | `gate-reports/dlg2/dialog-dark-large.png` |

## AT-DLG-6 — element by element, image order

| # | Image | As built | Delta |
|---|-------|----------|-------|
| 1 | Title centred; close upper left | yes (`builder-window-close`) | **PASS** |
| 2 | SYMBOL \| STRATEGY, one two-column row | yes | **PASS** |
| 3 | Payoff · Buy/Sell **under STRATEGY** | yes | **PASS** |
| 4 | LEGS on filled bordered pad | yes | **PASS** |
| 5 | Header band QTY · STRIKE · TYPE · EXPIRATION · DEBIT · POS | yes, distinct | **PASS** |
| 6 | Fields with surfaces; DEBIT+POS on leg 1 only | yes | **PASS** |
| 7 | + Add Leg | yes | **PASS** |
| 8 | TOS SCRIPT, code-surface, click to copy | yes | **PASS** |
| 9 | Analyze over Cancel beside script | yes, large | **PASS** |
| 10 | No STRUCTURE / SHAPE / POSITION | grep empty | **PASS** |
| 11 | No Preview, entry, Submit, Done | AT-DLG-11 | **PASS** |

## Spec laws on files touched

| File | Laws |
|------|------|
| `PositionBuilder.tsx` | DLG-LAYOUT-0…14 · DLG-HIG-1…14 · DLG-VOCAB-3…5 · DLG-THEME-4 · DLG-FN-8…10 · §3 |
| `TosControls.tsx` | DLG-VOCAB-4 · DLG-VOCAB-5 · DLG-HIG-9 |
| `listedStrikes.ts` · `tosGenerator.ts` | DLG-FN-10 · DLG-LAYOUT-6 date |

## AT pack 1–32

| ID | Delta | Evidence |
|----|-------|----------|
| AT-DLG-1 | **BLOCKED** | DLG3 — symbol lists universe; changing it does not load the other chain |
| AT-DLG-2 | **PASS** | short-leg qty stepper preserves sign (`updateLeg` + `signedActualQty`) |
| AT-DLG-3 | **PASS** | tokens; screenshots both themes |
| AT-DLG-4 | **PASS** | `dlgTheme.test.ts` grep |
| AT-DLG-5 | **PASS** | larger-type screenshots |
| AT-DLG-6 | **PASS** | table above |
| AT-DLG-7 | **PASS** | Escape → cancel; Return → save except `[data-value-field]` |
| AT-DLG-8 | **PASS** | `--hit-min` at rest; no grow on dialog |
| AT-DLG-9 | **PASS** | AT-PC-04 |
| AT-DLG-10 | **PASS** | no unsolicited motion added |
| AT-DLG-11 | **PASS** | grep; close is `builder-window-close`, not Done |
| AT-DLG-12 | **BLOCKED** | DLG3 — options from universe; full "no chain held" + OPF truth not gated live |
| AT-DLG-13 | **BLOCKED** | DLG3 — no other-symbol chain load |
| AT-DLG-14 | **BLOCKED** | DLG3 — unlock-on-symbol-change not walked |
| AT-DLG-15 | **PASS** | `dlgSurface.test.ts` 9 ok |
| AT-DLG-16 | **PASS** | 1100 / 20 / 1060; off-grid grep empty |
| AT-DLG-17 | **PASS** | Echo + Tango |
| AT-DLG-18 | **PASS** | script on screen |
| AT-DLG-19 | **PASS** | legs pad |
| AT-DLG-20 | **PASS at gate** | `--color-success` only. **§12 (DL-698):** this criterion accepted the flattened payoff stroke. Restored buy success / sell destructive at `18467e0`. |
| AT-DLG-21 | **PASS** | Playwright wrap, both themes, larger type |
| AT-DLG-22 | **PASS** | five additions absent |
| AT-DLG-23 | **PASS** | fields; `Sep 14 26` |
| AT-DLG-24 | **PASS** | header band |
| AT-DLG-25 | **PASS** | `--elevation-1` on fields, steppers, buttons |
| AT-DLG-26 | **PASS** | `dlgAction` px-6 py-3 |
| AT-DLG-27 | **PASS** | close upper left |
| AT-DLG-28 | **PASS** | same `TosStepper`, stacked, elevated, no grow |
| AT-DLG-29 | **PASS** | Playwright both themes |
| AT-DLG-30 | **PASS** | content `ch` widths; Playwright no truncate |
| AT-DLG-31 | **PASS** | `strikeGridDecimals` from listed chain; SPX whole strikes show no decimals |
| AT-DLG-32 | **PASS** | Playwright: EXP width > STRIKE > DEBIT/QTY |

## Tests

```
dlgHig.test.ts 21 ok
dlgTheme.test.ts 7 ok
dlgSurface.test.ts 9 ok
positionBuilder.pc5.test.ts 9 ok
tosCard.test.ts 26 ok
lock.pc6.test.ts 9 ok
e2e/dlg2-layout.spec.ts 2 passed
```

## Next

DLG3 (symbol re-resolve). Not until this commit is HEAD. No deploy.
