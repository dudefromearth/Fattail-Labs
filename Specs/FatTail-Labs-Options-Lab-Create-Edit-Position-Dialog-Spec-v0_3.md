# FatTail Labs — Options Lab — Create / Edit Position Dialog — Spec v0.3

**Type:** Product Spec — the Create and Edit Position dialog as a designed dialog surface
**Surface:** Options Lab Analyzer (`/app/options-lab/analyzer`, `/app/iki/analyzer`)
**Component:** `web/components/options-lab/PositionBuilder.tsx`
**Status:** **DRAFT — for Coach's approval.** Not build authority until approved and landed in `Specs/`.
**Date:** 2026-09-11
**Supersedes:** v0.2 (same date)
**Reference:** `docs/reference/tos/dialog-target-layout.png` — the layout, as amended by §3 below
**Next step after approval:** Grok Build produces a **full agent bench build plan**. No packet, no seed,
no one-off fix.

| Ver | Change |
|-----|--------|
| 0.1 | First draft. Dialog respecified as a designed dialog rather than a piece of the card. |
| 0.2 | **Coach, 2026-09-11:** Preview removed (redundant against the ToS script). Entry time removed. Submit removed. Payoff icon and Buy/Sell moved directly beneath the strategy selector. Theme follows the member's own preference — confirmed, unchanged. |
| 0.3 | **Coach, 2026-09-11:** The symbol selector must let a member choose any symbol. Today it renders one option and an inert `onChange`. New §5.5. |

---

## 1. Why this Spec exists

Coach, 2026-09-11: *"There has been no change since starting this refresh project to the edit/create
position dialogs."*

Two causes, both real. The running app was serving a build from before the change, so nothing on
screen moved. And the change that was waiting had been built from a wrong instruction:

> "Dark theme on the card's tokens. The dialog must not read as a different application."

That produced a dialog styled as a fragment of a trading blotter — 18-pixel rows, dark-only, card
field fills. It is not a well-designed dialog and never could have been. **The instruction was the
defect, not the execution.**

**The correction, in Coach's words:**

- *"There is no ToS equivalent."* — ThinkorSwim has a position blotter, which is why the card copies
  it. ThinkorSwim has nothing corresponding to this dialog. There is no reference to imitate, so the
  dialog is **designed**, not copied.
- *"The create/edit dialogs should be themed the exact same way any well designed dialog [is], with
  light/dark aware controls and surfaces, and following Apple HIG."*
- *"The light/dark setting should follow the user preferences."*
- *"I supplied a dialog that has a specific layout, and I provided everything you need to modify it
  for this app."*

## 2. Supersession — the law that caused this

**Position Control Spec v1.2 PC-VOCAB-1** reads: *"Card and dialog share one control vocabulary and
one leg-row grammar, from one component."*

That law was written for **behaviour**, and it was built as **appearance**. It is restated here:

| ID | Law |
|----|-----|
| **DLG-VOCAB-1** | Card and dialog share one control **behaviour and semantics** — a stepper steps the same way, a lock locks the same way, a menu opens the same menu, and a fix to that logic fixes both surfaces. |
| **DLG-VOCAB-2** | Card and dialog **do not share appearance.** The card is a dense trading blotter modelled on ThinkorSwim. The dialog is a dialog. Density, type scale, spacing, chrome and surface colour are each surface's own. |
| **DLG-VOCAB-3** | Where a control is shared, the surface is a **property of the control**, not a second implementation. One component, two appearances — never two components, and never one appearance forced onto both. |

PC-VOCAB-2 (card ⊂ dialog for structure) and PC-VOCAB-8 (add and remove leg is the dialog's
exclusive) are unchanged.

**This Spec supersedes PC-VOCAB-1 on approval.** Position Control Spec v1.2 stays frozen; the
supersession is recorded in the decision log and carried into v1.3.

## 3. Removed by Coach — v0.2

Three things in the reference layout are **not built**. They are named here so their absence is a
decision on the record, not an omission.

| Removed | Why | Consequence |
|---------|-----|-------------|
| **Preview** | Redundant. The ToS script already states the position, and the derived name is on screen in the Structure section. | The dialog has no separate preview block. |
| **Entry time** | Not wanted on this screen. | Entry time has **no member-editable control on any surface** — the card's was removed at PC8-E. It falls back to the cash-open default and is stamped at Log. Recorded as a deliberate change, superseding PC8-E's "the dialog is its home." |
| **Submit** | Not wanted. | Create commits on **Analyze**; Edit commits on **Update**. There is no third action. |

## 4. What the dialog is

The member's workbench for shaping a position: choose a symbol and a strategy, set the structure and
shape, see what it costs, read the script, and either commit it or dismiss it. It is opened
deliberately, worked in, and dismissed. It is not a row in a blotter and must not be built like one.

**In scope.** The Create and Edit Position dialog only. Other Options Lab dialogs are out of scope
for this Spec; bringing them to the same standard is a separate decision and a wider plan.

## 5. Laws

### 5.1 Theming — `DLG-THEME`

| ID | Law |
|----|-----|
| **DLG-THEME-1** | The dialog renders from the application's theme tokens. Light and dark are both first-class. Neither is hardcoded. |
| **DLG-THEME-2** | **The active theme follows the member's own preference**, set on their Settings page and expressed as `data-theme="light"` / `data-theme="dark"` on the document root. `styles/tokens.css` already defines both; the dialog consumes them. |
| **DLG-THEME-3** | The dialog honours the member's other appearance preferences the same way the rest of the product does: tint, font size, density, corner style. A member who sets larger type sees larger type here. |
| **DLG-THEME-4** | **No hardcoded colour, and no card token.** `FIELD_FILL`, `OL_DATA`, `OL_CHROME`, `cardSelect` and the card's 18-pixel row floor are blotter values and do not appear in this component. A literal hex or `text-white/NN` in the dialog is a defect. |
| **DLG-THEME-5** | Contrast meets accessibility minimums in **both** themes. A design that works in only one is not done. |

### 5.2 Conduct — `DLG-HIG`

Apple's Human Interface Guidelines govern how the dialog behaves and feels.

| ID | Law |
|----|-----|
| **DLG-HIG-1** | Type follows a scale with clear hierarchy — title, section label, field label, value. Not one size for everything, and not blotter-dense. |
| **DLG-HIG-2** | Spacing is generous and consistent: one spacing unit, consistent margins, related things grouped and unrelated things separated. Dialogs breathe; blotters do not. |
| **DLG-HIG-3** | Controls are comfortably sized and hit targets meet the platform minimum **at rest**. Grow-on-hover is a blotter compromise for a dense row and has no place here. |
| **DLG-HIG-4** | The primary action is visually dominant and unambiguous. Dismissive actions are clearly not it. Escape dismisses; Return commits the primary action. |
| **DLG-HIG-5** | Focus is visible, tab order follows reading order, and every control is reachable from the keyboard. |
| **DLG-HIG-6** | Feedback is immediate. A control that changes something shows the change on the same tick, everywhere in the dialog that reflects it. |
| **DLG-HIG-7** | Errors and impossible states are stated in plain language where the member is looking, not as silent refusal. |
| **DLG-HIG-8** | Motion is minimal and purposeful. Nothing moves that the member did not cause. |

### 5.3 Layout — `DLG-LAYOUT`

`docs/reference/tos/dialog-target-layout.png` is the layout, as amended by §3.

| ID | Law |
|----|-----|
| **DLG-LAYOUT-1** | **Title** — "Create Position" or "Edit Position", identifying which mode is active, with the symbol and spot context beneath it. |
| **DLG-LAYOUT-2** | **Structure** — a labelled group. The **strategy selector comes first**. **Directly beneath it** sits one row carrying the payoff icon, the Buy / Sell toggle, and the derived name. *(Coach, 2026-09-11.)* The derived name follows from the choices above it and is never edited directly. |
| **DLG-LAYOUT-3** | **Shape** — a labelled group holding the parameters that place the structure: centre, width, expiration, and the legs they produce. |
| **DLG-LAYOUT-4** | **Legs** — one row per leg with quantity, strike, type and expiration. Add Leg is present on every strategy; removing a leg is available per row. |
| **DLG-LAYOUT-5** | **Position** — package-level basis and package count, stated once, never per leg. |
| **DLG-LAYOUT-6** | **ToS script** — its own labelled block with a copy action. The block is a code surface and may stay dark in both themes, deliberately, the way a code block does. Its **content** is governed by Position Control §4.7 and is not changed here. |
| **DLG-LAYOUT-7** | **Actions** — Create shows **Analyze** and **Cancel**; Edit shows **Update** and **Cancel**. The committing action is primary and dominant. **There is no Submit button and no Preview block.** |
| **DLG-LAYOUT-8** | Section labels are small, quiet and consistent. They organise; they do not compete. |

### 5.4 Symbol — `DLG-SYM`

Coach, 2026-09-11: *"The Symbol selector must allow me to select any symbol, currently only SPX is
available."*

As built, `PositionBuilder.tsx` renders a select with a **single** `<option>` and an `onChange` that
does nothing, commented *"session symbol is host-owned."* It is a control shaped like a picker that
cannot pick — the case DLG-FN-1 forbids.

| ID | Law |
|----|-----|
| **DLG-SYM-1** | The symbol control is a **real control**. It offers the member a choice and acts on it. A one-option select with an inert handler is a defect, not a design. |
| **DLG-SYM-2** | Choices come from the **existing symbol universe** — the same source `OpfRiskAnalyzer` already uses for its own selector (`{ symbol, setSymbol, universe }`). No new list, no parallel fetch, no hardcoded symbols anywhere in the dialog. |
| **DLG-SYM-3** | **OPF truth holds.** Only symbols with an OPF-held chain are selectable. A symbol without one is shown as unavailable, with the reason — never selectable and then silently broken. *(DL-309.)* |
| **DLG-SYM-4** | Changing the symbol **re-resolves the structure onto the new symbol's OPF-listed strikes and grid.** Centre, width, legs and basis re-derive. No strike, width or price is carried across from the old symbol. |
| **DLG-SYM-5** | A universe that has not loaded is a **named loading state**, never an empty list and never a single-entry list that looks like a finished choice. *(Same law as PC-CHAIN-6.)* |

### 5.5 Behaviour — `DLG-FN`

| ID | Law |
|----|-----|
| **DLG-FN-1** | **Every control works.** A control that renders and does nothing is a defect, not a placeholder. This is the first acceptance criterion and the one Coach checks. |
| **DLG-FN-2** | Quantity steppers change leg quantity. Sign is preserved: a short leg showing −2 steps to −3, never to −1 or +3. |
| **DLG-FN-3** | Any change to symbol, strategy, side, right, quantity, centre, width, strike or expiration re-derives the name, the legs, the basis and the script **on the same tick**. |
| **DLG-FN-4** | Basis and package count are package-level and stated once — not per leg. Per-leg marks and implied volatility remain a dialog exclusive and stay live. |
| **DLG-FN-5** | Opening Edit writes nothing to the record. Create stays off the book until it is committed. Cancel discards. *(Position Control PC5 — unchanged, re-asserted here because it is easy to break in a rewrite.)* |
| **DLG-FN-6** | The lock behaves exactly as it does on the card. `CardLockState` remains the only lock and the only source of a locked basis. |
| **DLG-FN-7** | No pricing path changes. The dialog displays what the existing pricing produces. |
| **DLG-FN-8** | **Entry time is not editable here.** It resolves to the cash-open default and is stamped at Log. No date control, no time control, no native picker. |

## 6. What does not change

`AnalyzerPosition` is still the only mutable record and every surface is a view of it. Structure
classification, quantity and POS semantics, the lock and CHECK PRICE, the ToS script's content, the
undo stack, and promotion to the Trade Log are all untouched by this Spec.

## 7. Acceptance

The build is done when all of these hold. Each is checkable by a person in the running app.

| # | Criterion |
|---|-----------|
| **AT-DLG-1** | Every control in the dialog does what it says. Nothing is inert. |
| **AT-DLG-2** | A quantity stepper on a short leg reads −2 → −3, and the basis and script move with it. |
| **AT-DLG-3** | Changing the member's theme preference switches the dialog, cleanly, in both directions. |
| **AT-DLG-4** | The dialog is legible and correct in light **and** dark, with no hardcoded colour and no card token in the component. |
| **AT-DLG-5** | The larger-type and density preferences visibly affect the dialog. |
| **AT-DLG-6** | The layout matches the reference as amended, section by section, at 100% zoom, in both themes. |
| **AT-DLG-7** | Escape dismisses, Return commits, tab order follows reading order, focus is always visible. |
| **AT-DLG-8** | Hit targets meet the platform minimum at rest, with no grow-on-hover anywhere in the dialog. |
| **AT-DLG-9** | Opening Edit writes zero fields to the record. |
| **AT-DLG-10** | Nothing in the dialog moves except in response to something the member did. |
| **AT-DLG-11** | **No Submit button exists.** Create commits on Analyze, Edit commits on Update. |
| **AT-DLG-12** | **No Preview block exists**, and no entry-time control of any kind. |
| **AT-DLG-13** | The symbol control offers every symbol in the universe, and choosing one changes the position. |
| **AT-DLG-14** | Choosing a different symbol re-resolves strikes onto that symbol's listed chain — no strike survives from the previous symbol. |
| **AT-DLG-15** | Placed beside the card, the two read as one product — and neither is mistaken for the other. |

## 8. Open for Coach

1. **Scope.** This Spec covers the Create / Edit Position dialog. If every Options Lab dialog — or
   every Labs dialog — should be brought to this standard, say so and the plan widens.
2. **Presentation.** Whether the dialog is modal over the analyzer, a side panel, or free-floating.
3. **"Done".** The current dialog carries a **Done** link at the top right as well as Cancel and
   Analyze at the bottom. Two dismissals and a commit is ambiguous under DLG-HIG-4. Recommend
   removing Done and letting Cancel and the primary action carry it — confirm or correct.
4. **What the symbol belongs to.** Changing the symbol in the dialog could set only that
   position's underlying, or could also change the analyzer's session symbol. The book already
   groups positions by symbol and holds several at once, so the recommendation is **the position's
   underlying only**, leaving the analyzer's own selector to drive the session. Confirm or correct.
5. **Where Call / Put lives.** The strategy selector, payoff icon and Buy / Sell toggle are now
   ordered. The current dialog also carries a **Right** control in the Structure group, and the
   reference layout does not show one — it expresses call versus put per leg instead. Say which you
   want rather than have it guessed.

## 9. Build route

On approval this Spec lands in `Specs/`, the decision is logged, and **Grok Build produces a full
agent bench build plan** from it — orchestrator, phases, agent seeds and gates, with India on the
architecture, Echo and Tango on the design, and Delta gating each phase.

**No seed. No packet. No one-off fix.** The dialog has had three of those and has not moved.
