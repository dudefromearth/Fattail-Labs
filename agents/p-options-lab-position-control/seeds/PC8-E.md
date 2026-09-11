# PC8-E — Analyzer card: one regression, six items

**Status:** OPEN · **Machine:** Coach's MacBook (dev) · **Nothing deploys.**
**Board:** `agents/p-options-lab-position-control/`
**Gate:** `gate-reports/PC8-E-G.md` — Delta returns **per-item PASS / FAIL / BLOCKED**.
**Supersedes:** the PC8-D and PC8-E chat prompts of 2026-09-11 and both addenda.
This file is the only authority. Amendments become **PC8-F**, never an edit here.

**Reference images (untracked — commit them):** `docs/reference/tos/`
`tos-row-full.png` · `tos-qty-stepper.png` · `tos-padlock-locked.png` · `tos-padlock-unlocked.png`

## Status ledger — verified against the tree at `51de4dd`

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1 | Empty-book autofit regression | **LANDED** | `book-empty` / `book-to-empty`; awaiting Delta |
| 2 | VOL / DELTA dead | **LANDED** | quote-merge writes chain IV; awaiting Delta |
| 3 | Stepper hover reflow | **DONE** | `c5ac840` — hover `h-`/`w-` removed |
| 4 | POS tooltip | **NOT STARTED** | `AnalyzerPositionsList.tsx:1169` |
| 5 | Fonts +30% | **NOT STARTED** | `td` = `text-[11px]`; 13 × `text-[10px]` |
| 6 | Padlock form | **DONE** | `51de4dd` |
| 7 | Corner-nested menu triangle | **PARTIAL** | `cardSelect` uses `bg-[right_3px_center]`, down-pointing isoceles |

Update this table in the same commit as each fix. A row is DONE only when Delta says PASS.

## What Coach looks for — the five-second check

Delta gates on tests and evidence. This table is separate: it is what **Coach** can verify himself,
in the running app, without opening a file. Every item has one. An item with no observable check
does not belong in a packet Coach raised.

| # | Open the app and… | Expected |
|---|-------------------|----------|
| 1 | Remove every position from the book | Canvas re-centers on spot; GEX bars visible and fitted |
| 2 | Look at VOL and DELTA on a position that was already in the book | A number per leg in VOL; a package number in DELTA on the top row |
| 3 | Hover the +/− stepper | Nothing else on the card moves — rows, columns, the EXP field all stay put |
| 4 | Hover the QTY value | No tooltip appears |
| 5 | Look at the card | Type is noticeably larger than the last build, still compact |
| 6 | Lock and unlock a price | Locked = solid padlock; unlocked = same padlock as an outline, shackle open |
| 7 | Look at Spread, Side, Exp, Strike, Type | A small white triangle tucked into each field's bottom-right corner |


---

## 1. REGRESSION — removing the last position leaves a stale canvas

**Priority. The only functional defect in this packet. Land it first.**

Symptom: remove every position and the canvas does not re-center on spot; GEX appears absent.

Root cause — `components/options-lab/OpfRiskAnalyzer.tsx`, structure-signal effect:

    const kind = !prev && next ? "first-show" : "structure";

Removing the last position gives `prev` non-empty, `next` empty → `kind` is `"structure"`. Then:

    content = displayPositions.filter(visible).flatMap(legs → strike)   // []
    escapes = geometryEscapesWindow([], view)                           // false
    shouldAutofit("structure", false)                                   // false

`geometryEscapesWindow` opens `if (!nums.length) return false;` — nothing escapes when there is
nothing. No fit fires; the view keeps the last position's window.

The sibling effect cannot catch it: `bookAppearedOnCanvas(hadCurves, hasCurves)` is
`!hadCurves && hasCurves` — appear-only. On empty it is true→false.

`AutofitKind` (`lib/options-lab/autofitPolicy.ts`) and `PnlAutofitTrigger`
(`lib/risk-graph/pnlChartViewPolicy.ts`) have **no book-empties case**. `shouldClearUserViewLock`
has the same asymmetry — it handles `"empty-to-book"` but not book-to-empty, so a member view lock
survives into the empty state and would block a fit even if one were requested.

**Fix**

1. Add `"book-empty"` to `AutofitKind` and `PnlAutofitTrigger`.
   `shouldAutofit("book-empty", _) => true` **unconditionally** — the empty case must not be gated
   on escape, because geometry cannot escape when there is no geometry.
2. Fire it on the `prev` non-empty → `next` empty transition.
3. Add `"book-to-empty"` to `shouldClearUserViewLock` returning `true`.
4. Empty fit target is **spot-centered with the GEX backdrop in frame** — not a structure extent,
   because there is no structure. `autoFit()` with no curves falls back to a spot-centered window
   sized from the GEX / listed strike range, honoring `AUTOFIT_MIN_HALF_PTS`.
5. Verify GEX renders on the empty book. `docs/Options-Lab-Analyzer-Risk-Graph-User-Guide.md:223`
   says "GEX backdrop (incl. empty book) — Yes". If it renders and was merely off-frame, the fit
   fix covers it — say so rather than adding a second fix.

**Tests** (`autofitPolicy.test.ts` plus a component test): last position removed → autofit fires,
view centers on spot · empty book → GEX visible inside the fitted window · a member-adjusted view
does not suppress the empty-book fit · adding a position back still fires `first-show` once.

**Spec:** this law exists only as a row in a user-guide audit table. Write it as a law with an
acceptance test — flag for **v1.3**.

---

## 2. VOL and DELTA are dead — one missing writer

    packageDelta():  sigma = leg.volatility
                     if (sigma == null || !isFinite || <= 0) continue
                     return any ? sum : null       → fmtPackageDelta(null) → "—"
    VOL cell:        fmtIv(leg.volatility)         → "—"

The only writer of `leg.volatility` in the tree is `PositionBuilder.tsx:667`
(`volatility: c?.iv ?? leg.volatility`) — the dialog path. The card's quote merge (PC3) never
writes it, so any book-hydrated position has no IV and both columns die from the same input.

**Fix:** the quote-merge leaf writes `volatility` onto legs from the chain, same source the dialog
uses. Merge stays a leaf — PC3's law holds: a late quote must not resurrect a structure that moved.

**Also explain, do not assume:** in Coach's 2026-09-11 screenshot the **off-symbol SPX** position
carries per-leg VOL (12.45 / 11.18 / 10.3) while the **active-symbol TSLA** position shows "—" on
every leg. That is backwards. Determine why before fixing, and say what you found.

**Tests:** book-hydrated position shows VOL per leg and a package DELTA; a leg with no chain hit
shows "—" for that leg alone and does not null the package delta when other legs priced.

---

## 3. Stepper hover must not move anything — **DONE at `c5ac840`**

Retained for the gate. Constraint: the resting layout box never changes size; growth is out of
flow, centered on the resting box, above the card. No row, cell, or sibling moves on hover or
focus. Delta asserts a sibling cell's bounding rect is unchanged between resting and hovered.

**Open question for Echo and Tango — do not decide alone:** `--hit-min` is 44px, a touch floor
applied to a dense desktop trading card. ToS does not do it; `[data-density="compact"]` already
drops it to 36px. Decide the grown-target standard for dense desktop chrome, record it, build to it.

---

## 4. Remove the POS tooltip

`AnalyzerPositionsList.tsx:1169` — `title={isTop ? \`POS ${pkgQty}\` : undefined}`

Native tooltip on the QTY `<td>`. Coach: no tooltip there. Delete the attribute. Keep
`aria-label="POS"` on the stepper — it names the control for screen readers and renders no tooltip.

Audit the card for `title=` on non-interactive cells and remove those too. `title` on a real button
explaining a disabled state (Log under Time Machine) stays.

---

## 5. Fonts +30%

Coach: the card went slightly too far at PC8-D. Current `td = text-[11px]`, thirteen `text-[10px]`.

Target: **data cells 14px, chrome 13px**, other sizes proportional.

If the card sits at a card-level scale, express it as a **token** — not multiplied back into
literals. That is what produced the 1.5× family PC8-D removed.

---

## 6. Padlock form — **DONE at `51de4dd`**

Retained for the gate. Match `tos-padlock-locked.png` / `tos-padlock-unlocked.png`: one flat light
grey in both states; locked = solid filled body, closed shackle; unlocked = same body as outline,
shackle swung clear of the right shoulder; identical footprint both states; its own column right of
the price stepper, separated by a vertical rule. State reads from fill and shackle — never colour,
tint, or opacity.

---

## 7. Corner-nested menu triangle — **PARTIAL**

`cardSelect` currently draws a down-pointing isoceles triangle at `bg-[right_3px_center]` —
vertically centered and inset. That is a chevron in a new shape, not the ToS affordance.

Coach: "The small white triangle is nestled into the bottom-right corner of the editable field. It
is big enough to be noticed, yet small enough not to crowd the field."

**Form** (see `tos-row-full.png`, on Spread · Side · Exp · Strike · Type):

- Right triangle, right angle at the **bottom-right**; hypotenuse upper-right to lower-left.
- **Corner-anchored and flush** to the field's inner edge — nested into the corner, not centered,
  not inset with padding.
- Legs roughly one third of field height. Match the reference by eye at 100% zoom.
- Solid light grey / white, full opacity, always visible. No hover reveal.
- Not a button, not a hit target — the whole field opens the menu. `pointer-events: none`.

**Where:** every card field that opens a menu — Spread, Side, Exp, Strike, Type — and nowhere else.
A field with no menu carries no triangle; the marker means "there is a menu here."

**Do not touch the QTY quick-pick ▼.** It is a separate control — a real button opening a value
list — and `tos-row-full.png` shows ToS carrying both a stepper and a ▼ button in the QTY column.

**Second signal in the same reference:** ToS marks editable fields with a **slightly lighter fill
than the row background**, no border; read-only cells carry the row fill and nothing else. Match
both — fill distinguishes editable from read-only, the triangle distinguishes menu from plain input.

A native `<select>` cannot carry a corner triangle reliably; suppress its arrow
(`appearance: none`) and draw the triangle as a pseudo-element or absolutely positioned SVG on the
field wrapper. Keep the existing 18px row-height floor.

---

## Scope

Ten PC-VOCAB-7 columns, seven editable fields, quick-pick behaviour, lock semantics,
`CardLockState`, pricing paths — all unchanged. No backend, no migration, no deploy.

## Definition of done

**All seven rows PASS in `gate-reports/PC8-E-G.md`.** Partial delivery is not done. If an item
cannot be completed, Delta records **BLOCKED** with the reason — it is never silently skipped, and
it is never reported as complete alongside items that did land.

Report to Coach **once**, when the gate is written, with the ledger table and its final statuses.

## Do not

Touch Sessions, `web/package-lock.json`, any migration, or any frozen Spec. Re-open a gated packet.
Deploy. Answer a visual finding with a functional argument. Amend this file — new work is PC8-F.

## Stop conditions

If the empty-book fit cannot center on spot without changing a pricing path or the ten-column
contract — stop and say so.
