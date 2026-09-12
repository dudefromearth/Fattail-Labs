# DLG2-G (v0.11 — DLG-VOCAB-5)

**Date:** 2026-09-12
**Machine:** Coach's MacBook (dev)
**Spec:** v0.11 BUILD AUTHORITY (DL-695)
**Depends:** DLG1 `8faf9cd` · DLG0 `93b08d8` not reopened
**Verdict:** **PASS** on **AT-DLG-29**. Prior named ATs still PASS. Nothing deploys.

One addition: the card's corner-nested menu marker is the dialog's. The
platform chevron is a recorded HIG-3 deviation — not restored.

## Screenshots

| | |
|--|--|
| Prototype | `gate-reports/dlg2/reference.png` |
| Marker, light | `gate-reports/dlg2/dialog-marker-light.png` |
| Marker, dark | `gate-reports/dlg2/dialog-marker-dark.png` |
| As built | `gate-reports/dlg2/dialog.png` |

## AT-DLG-29

| Check | Evidence | Delta |
|-------|----------|-------|
| Same `CardMenuField`, `surface="dialog"` | TosControls · PositionBuilder wraps | **PASS** |
| On symbol, strategy, strike, type, expiration | Playwright count ≥ 5; each wrapped | **PASS** |
| Not on QTY, DEBIT, POS | Playwright `qtyHas/debitHas/posHas` false | **PASS** |
| Bottom-right, flush | `absolute bottom-0 right-0`; Playwright flush | **PASS** |
| Not a hit target | `pointer-events: none` | **PASS** |
| Always visible | not a hover reveal | **PASS** |
| Legs ~⅓ field **height**, square | `aspect-square h-1/3` | **PASS** |
| Contrasts in both themes | `--color-menu-marker` aliases `--color-label`; light fillLum < 0.5; dark > 0.5 | **PASS** |
| Not white on a light field | light screenshot: dark triangle | **PASS** |
| No platform chevron | `--builder-chevron` removed from `globals.css` | **PASS** |

## Spec laws covering files touched

| File | Laws |
|------|------|
| `TosControls.tsx` | DLG-VOCAB-3 · DLG-VOCAB-5 · DLG-HIG-3 deviation |
| `tokens.css` | DLG-THEME-4 · `--color-menu-marker` |
| `globals.css` | DLG-HIG-3 recorded deviation — chevron gone |
| `PositionBuilder.tsx` | DLG-VOCAB-5 placement · appearance-none |

## AT pack (this gate)

| ID | Delta |
|----|-------|
| AT-DLG-15 | **PASS** — still one `CardMenuField` |
| AT-DLG-29 | **PASS** — table above |
| AT-DLG-6 · 11 · 16 · 17 · 18 · 19 · 20 · 21 · 22 | **PASS** — held |

## Tests

```
dlgHig.test.ts 13 ok
dlgTheme.test.ts 7 ok
dlgSurface.test.ts 9 ok
tosCard.test.ts 26 ok
positionBuilder.pc5.test.ts 9 ok
e2e/dlg2-layout.spec.ts 2 passed
```

## Next

DLG3 (symbol). Not until this commit is HEAD. No deploy.
