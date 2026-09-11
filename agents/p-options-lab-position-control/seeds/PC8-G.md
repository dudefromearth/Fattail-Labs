# PC8-G — Create / Edit dialog: build PC-VOCAB-1

**Status:** OPEN · **Machine:** Coach's MacBook (dev) · **Nothing deploys.**
**Board:** `agents/p-options-lab-position-control/`
**Gate:** `gate-reports/PC8-G-G.md` — Delta returns **per-item PASS / FAIL / BLOCKED**.
**File in scope:** `web/components/options-lab/PositionBuilder.tsx` (plus `TosControls.tsx` only to
*share* an existing control, never to fork one).
**Reference:** `docs/reference/tos/dialog-target-layout.png`
**Amendments become PC8-H. Never edit this file.**

## Why this exists

This is **not a new requirement.** Spec v1.2 §4.3 already governs it:

> **PC-VOCAB-1** — Card and dialog share one control vocabulary and one leg-row grammar,
> **from one component.**
> **PC-VOCAB-2** — The subset rule is per category. Structure: **card ⊂ dialog.**
> **PC-VOCAB-8** — Seven fields editable on the card. The dialog's only remaining exclusive is
> **add and remove leg.**

PC8 built the card's control vocabulary and never applied it to the dialog. Today
`PositionBuilder.tsx` imports exactly one thing from `TosControls` — `TosPadlock` — and edits leg
quantity through a bare `type="number"`. The card is not a subset of the dialog; the two surfaces
use different controls for the same job. PC8's gate passed the card without testing the dialog
against PC-VOCAB-1. That is the gate escape this packet closes.

Coach, 2026-09-11: "The create/edit dialog was never touched in the refresh/refactor project. The
layout was not changed, and the QTY controls still don't work."

## Ledger

| # | Item | Status |
|---|------|--------|
| 1 | One control vocabulary — dialog uses the card's components | DONE |
| 2 | Layout matches the reference | DONE |
| 3 | Dark theme, matching the card | DONE |
| 4 | QTY steppers work in the dialog | DONE |
| 5 | Package-level DEBIT and POS on leg row 1 only | DONE |
| 6 | ToS script block — dark, monospace, click to copy | DONE |
| 7 | Entry time lives here (arrives from PC8-E item 6) | DONE |

A row is DONE only when Delta says PASS.

## What Coach looks for — the five-second check

| # | Open the dialog and… | Expected |
|---|----------------------|----------|
| 1 | Compare a QTY stepper in the dialog to one on the card | Identical control, same size, same behaviour |
| 2 | Look at the whole dialog | Matches `dialog-target-layout.png` section for section |
| 3 | Look at the dialog next to the card | Same dark palette; neither looks like a different app |
| 4 | Click + and − on a leg QTY | The number changes and the preview updates |
| 5 | Look at the LEGS table | DEBIT and POS appear once, on leg row 1 — not on every leg |
| 6 | Click the ToS script | It copies; the block is dark with monospace green text |
| 7 | Look for entry time | Present in the dialog, editable |

---

## 1. One control vocabulary — the governing item

**PC-VOCAB-1 is the law. Build it, do not re-interpret it.**

Every control the card and dialog share comes from **one component in `TosControls.tsx`**:

- QTY stepper → `TosQtyControl` / `TosStepper`, the same units the card uses
- Strike stepper → the same `TosStepper`
- Price / DEBIT stepper → the same `TosStepper`
- Padlock → `TosPadlock` (already shared — keep it)
- Menu fields → the same corner-nested triangle affordance the card uses

**Do not fork a control.** If the dialog needs a variant, the variant is a prop on the shared
component, not a second implementation. Two components doing the same job is the defect.

The dialog's only structural exclusive is **add and remove leg** (PC-VOCAB-8). Everything else the
card can do, the dialog can do, in the same grammar.

## 2. Layout — match the reference

`docs/reference/tos/dialog-target-layout.png`, top to bottom:

- **Title** — "Create Position" / "Edit Position"
- **SYMBOL** and **STRATEGY** — two fields on one row, section-labelled
- **Direction row** — payoff thumbnail · Buy / Sell segmented toggle · derived name ("Buy Butterfly")
- **LEGS** — a table with headers `QTY · STRIKE · TYPE · EXPIRATION · DEBIT · POS`, one row per leg,
  rows labelled Leg 1 / Leg 2 / Leg 3
- **`+ Add Leg`** — below the table (PC-STRAT-11: present on every strategy)
- **ENTRY TIME** — date and time, right-aligned with the legs block
- **TOS SCRIPT** — bordered dark block, monospace, with a copy affordance beneath it
- **Preview** — derived name, DTE, signed basis, then the signed leg line
- **Actions** — Analyze · Submit · Cancel, stacked at the right

Section labels (`SYMBOL`, `LEGS`, `TOS SCRIPT`) are small, uppercase, muted — as in the reference.

## 3. Dark theme

The reference is dark and the card is dark. The dialog must not read as a different application.
Use the same tokens the card uses — `--ol-card-data`, `--ol-card-chrome`, `FIELD_FILL` and the
card's palette. No bespoke dialog colours.

## 4. QTY steppers must work

Coach: "the QTY controls still don't work."

Today leg quantity is a `type="number"` input (~line 2253). Replace it with the shared stepper.
+ and − change the leg quantity, the derived name re-resolves, the preview and ToS script update on
the same tick. Sign is preserved — leg 2 reading `-2` steps to `-3`, not `-1`.

## 5. DEBIT and POS are package-level

In the reference, DEBIT and POS appear **only on leg row 1**. That is PC-VOCAB-6 (no per-leg price)
and POS as a package count — the same law the card follows. Per-leg marks (MID / IV) remain a
dialog exclusive and stay live per PC-LEG-1, but they are not the DEBIT column.

## 6. ToS script block

Dark block, monospace, copy affordance, per §4.7. **PC-LOCK-7 is unchanged: the script mirrors
BASIS and always carries `@LMT <price>`.** Do not alter script content in this packet — this is the
block's presentation only.

## 7. Entry time

PC8-E item 6 removed the entry-time control from the card and named the dialog as its home. This
packet is where it lands. `onSetEntryAt` is already on the props contract. No `type="date"`
(existing law); no native time widget — the card rejected that chrome and so does the dialog.

---

## Scope

`PositionBuilder.tsx`, and `TosControls.tsx` only to share an existing control. Record semantics
untouched: `AnalyzerPosition` is still the only mutable record (PC-REC-1), opening Edit still writes
nothing (PC5), Create is still off-book until Submit, `CardLockState` is still the only lock, and no
pricing path changes.

## Definition of done

All seven rows PASS in `gate-reports/PC8-G-G.md`. Partial delivery is not done. An item that cannot
be completed is **BLOCKED** with a reason — never silently skipped, never reported complete
alongside items that did land.

**Report to Coach once**, when the gate is written, with the ledger and final statuses.

## Evidence for Delta

- `dialog-target-layout.png` beside a screenshot of the rebuilt dialog at 100% zoom
- Card and dialog QTY steppers side by side — a test asserting both render the same component
- A grep proving no forked stepper, padlock or menu-triangle implementation exists in
  `PositionBuilder.tsx`
- Stepper click changes quantity, preview and script on the same tick, sign preserved
- Characterization suite green; PC5's "opening Edit writes zero fields" still asserted

## Do not

Touch Sessions, `web/package-lock.json`, any migration, or any frozen Spec. Re-open a gated packet.
Deploy. Fork a shared control. Change ToS script content or any pricing path.

## Stop conditions

If matching the reference requires changing `AnalyzerPosition`, a pricing path, or PC-VOCAB-8's
seven card-editable fields — stop and say so.
