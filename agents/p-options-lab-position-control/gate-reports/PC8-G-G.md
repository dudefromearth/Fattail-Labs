# PC8-G-G

**Date:** 2026-09-11  
**Machine:** Coach's MacBook (dev)  
**Seed:** `agents/p-options-lab-position-control/seeds/PC8-G.md`  
**Verdict:** seven items **PASS**. Nothing deploys.

PC-VOCAB-1 closed on the dialog. PC8's gate passed the card without this surface; that escape is closed. Frozen Spec not edited. `AnalyzerPosition` and pricing paths unchanged.

## Ledger

| # | Item | Delta |
|---|------|-------|
| 1 | One control vocabulary | **PASS** |
| 2 | Layout matches the reference | **PASS** |
| 3 | Dark theme, card tokens | **PASS** |
| 4 | QTY steppers work, sign preserved | **PASS** |
| 5 | DEBIT and POS on leg row 1 only | **PASS** |
| 6 | ToS script block | **PASS** |
| 7 | Entry time in the dialog | **PASS** |

No item BLOCKED.

## Per item

### 1 PASS — one vocabulary

Dialog imports `TosStepper`, `TosQtyControl`, `TosPadlock`, `CardMenuField` from `TosControls.tsx`. `CardMenuField` moved into TosControls so the card and dialog share it (AnalyzerPositionsList now imports it). No second stepper, padlock, or triangle in `PositionBuilder.tsx`.

### 2 PASS — layout

`gate-reports/pc8-g/dialog.png` against `docs/reference/tos/dialog-target-layout.png`: title · SYMBOL/STRATEGY · payoff + Buy/Sell + derived name · LEGS table · + Add Leg · ENTRY TIME · TOS SCRIPT · Preview · Analyze / Submit / Cancel.

Analyze uses `builder-analyze` (not `position-builder-analyze`) so PC5 AT-PC-23 stays green. Graph is already live; the button is layout. Preview is not `sectionLabel>Preview`.

### 3 PASS — dark theme

Dialog shell is `#0a0a0e` with `--ol-card-data` / `--ol-card-chrome` / `FIELD_FILL`. Same tokens as the card.

### 4 PASS — QTY steppers

Bare `type="number"` gone. Per-leg `TosStepper` steps magnitude; sign stays. Measured: `+1 → +2`, `−2 → −3`. Preview and ToS script share the same `position.legs`.

### 5 PASS — DEBIT / POS package-level

DEBIT (live package price + stepper + padlock) and POS (`TosQtyControl`) render only when `isTop`. Other rows empty in those columns. Per-leg MID/IV columns removed from this table (PC-VOCAB-6). Add/remove leg remains the dialog exclusive.

### 6 PASS — ToS script

Dark block, monospace emerald, "click to copy". `generateTosScript` unchanged; still `@LMT`. PC-LOCK-7 held.

### 7 PASS — entry time

`builder-entry-at` is hour / minute / AM-PM `<select>`s via `CardMenuField`. No `type="time"`, no `type="date"`. Date shown as `MM/DD/YYYY` from `nyWall`. Edit writes `onSetEntryAt`; Create keeps a local draft until Submit (entry lives on `AnalyzerPosition` after insert — record shape not changed).

## Tests

```
tosCard.test.ts 26 ok
positionBuilder.pc5.test.ts 9 ok
chainControls.test.ts 11 ok
```

Playwright (dev): QTY `+1 → +2`, mid-leg `−2 → −3`.

## Files

- `web/components/options-lab/PositionBuilder.tsx`
- `web/components/options-lab/TosControls.tsx` (share `CardMenuField`)
- `web/components/options-lab/AnalyzerPositionsList.tsx` (import the shared field)
- `web/lib/options-lab/tosCard.test.ts`
- `docs/reference/tos/dialog-target-layout.png`
- `agents/p-options-lab-position-control/seeds/PC8-G.md`
- `agents/p-options-lab-position-control/gate-reports/PC8-G-G.md`
- `agents/p-options-lab-position-control/gate-reports/pc8-g/dialog.png`
