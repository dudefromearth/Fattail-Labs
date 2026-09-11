# PC8-E-G

**Date:** 2026-09-11  
**Machine:** Coach's MacBook (dev)  
**Seed:** `agents/p-options-lab-position-control/seeds/PC8-E.md`  
**Nothing deploys.** Delta returns **per-item PASS / FAIL / BLOCKED**.

Built from the seed. Chat addenda of 2026-09-11 are not authority.

## Ledger

| # | Item | Delta | Commit |
|---|------|-------|--------|
| 1 | Empty-book autofit regression | **PASS** | `5821256` |
| 2 | VOL / DELTA dead | **PASS** | `0d5b2fa` |
| 3 | Stepper hover reflow | **PASS** | `03663e3` |
| 4 | POS tooltip | **PASS** | `03663e3` |
| 5 | Fonts +30% | **PASS** | `03663e3` |
| 6 | Padlock form | **PASS** | `51de4dd` (retained) |
| 7 | Corner-nested menu triangle | **PASS** | `03663e3` |

No item BLOCKED. No item skipped.

## Per item

### 1 PASS — empty-book autofit

`prev` nonempty → `next` empty was `"structure"`. `geometryEscapesWindow([], view)` is false, so no fit. Added `AutofitKind` / `PnlAutofitTrigger` `"book-empty"`; `shouldAutofit("book-empty", _)` is true unconditionally. Host fires it on that transition. `shouldClearUserViewLock("book-to-empty")` is true so a member pan does not survive. Empty fit target is `emptyGexCenteredXRange` (spot-centered, GEX / listed extent, `AUTOFIT_MIN_HALF_PTS`).

GEX already painted on the empty book (`HostPnLChart` draws when `gexEnabled && gexPoints.length`, default on). It was off-frame. No second GEX fix.

Adding a position back is still `!prev && next` → `"first-show"`.

Flagged as a law for Spec **v1.3** (D-PC-10). Frozen Spec v1.2 not edited.

### 2 PASS — VOL / DELTA

**Why Coach's screenshot was backwards.** VOL is a create-time Builder stamp (`priceLegs` writes `c?.iv`). Quote merge forced `position: cur.position` and `getContractFromLadders` omitted `iv`. Off-symbol SPX kept the dialog stamp. Active-symbol TSLA was book-hydrated / created without a successful IV stamp, and merge never filled it. The live chain sits on the active symbol — the one that should have been writing IV, and wasn't.

Fix: `applyLegVolatilityFromChain` in the quote-merge leaf. Structure identity unchanged (AT-PC-31 still holds). A miss on one leg is "—" for that leg; `packageDelta` still sums the others.

### 3 PASS — stepper hover does not move siblings

Growth is `position: absolute; left/top 50%; translate -50%` on the visual unit. The in-flow slot stays `h-[18px] w-[16px]` (QTY unit `w-[34px]`). Sibling cells do not reflow.

**Open question for Echo and Tango — not decided in this packet:** `--hit-min` is 44px (`2.75rem`), a touch floor, on a dense desktop trading card. ToS does not grow to that. `[data-density="compact"]` already drops it to 36px. Decide the grown-target standard for dense desktop chrome, record it, build to it. Grown still uses `--hit-min` until they say otherwise.

### 4 PASS — POS tooltip

`title={isTop ? \`POS ${pkgQty}\`}` removed. `aria-label="POS"` stays on the QTY input. Non-interactive `title=` on the card removed. Log-under-TM disabled title kept.

### 5 PASS — fonts +30%

`--ol-card-data: 14px` and `--ol-card-chrome: 13px` in `styles/tokens.css`. Card classes read the tokens. Not a 1.5× literal family. Chrome gutter widened 13% → 15% so Edit/Log/Close still fit at 13px.

### 6 PASS — padlock (retained)

`51de4dd`. Dedicated SVG, 22×18 both states, own column, vertical rule. Paint is **white** (Coach, same day, landed in that commit). Seed form text still says light grey; the landed glyph is white. Echo/Tango sign against `tos-padlock-locked.png` / `tos-padlock-unlocked.png`.

### 7 PASS — corner-nested menu triangle

Right triangle, right angle at bottom-right, flush to the field inner edge, 6px legs (~⅓ of the 18px row). `pointer-events: none`. On Spread, Side, Exp, Strike, Type. Not on QTY (the ▼ button is a separate control). Editable fields use `bg-white/12` (lighter than the row, no border); read-only cells carry the row fill.

Evidence: `gate-reports/pc8-e/card-chrome.png` against `docs/reference/tos/tos-row-full.png`.

## Tests

```
autofitPolicy.test.ts 5 ok
pnlChartViewPolicy 9 tests passed
tosCard.test.ts 24 ok
structureSignal.test.ts 7 ok
chainControls.test.ts 11 ok
lock.pc6.test.ts 9 ok
```

## Echo / Tango

- **Item 3:** grown-target standard for dense desktop chrome (`--hit-min` 44 vs compact 36 vs ToS rest). Do not decide in PC8-E.
- **Items 5, 6, 7:** sign `card-chrome.png` / padlock shots against the ToS references at 100% zoom.

## Do-nots held

Sessions and `package-lock.json` unstaged. No migration. No frozen Spec edit. No deploy. Seed file not rewritten except the status ledger.
