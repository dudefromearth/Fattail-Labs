# FatTail Labs — Options Lab — Create / Edit Position Dialog — Spec v0.4

**Type:** Product Spec — the Create and Edit Position dialog as a designed dialog surface
**Surface:** Options Lab Analyzer. **One component, two hosts:** `/app/options-lab/analyzer` and
`/app/iki/analyzer` both render `OpfRiskAnalyzer`, which is the only importer of
`PositionBuilder.tsx`. **No IKI fork.** *(Verified at `71a9ab5`.)*
**Component:** `web/components/options-lab/PositionBuilder.tsx`
**Status:** **APPROVED — BUILD AUTHORITY.** Landed `Specs/` 2026-09-11 on Coach's stamp.
Program of record: `docs/Options-Lab-Create-Edit-Position-Dialog-Full-Agent-Bench-Plan-v1.0.md`.
**Date:** 2026-09-11
**Supersedes:** v0.3 (same date). v0.3 remains on disk as the prior baseline.
**Reference:** `docs/reference/tos/dialog-target-layout.png` — the layout, **as amended by §3**

| Ver | Change |
|-----|--------|
| 0.1 | First draft. Dialog respecified as a designed dialog rather than a piece of the card. |
| 0.2 | **Coach:** Preview removed. Entry time removed. Submit removed. Payoff icon and Buy/Sell moved directly beneath the strategy selector. Theme follows the member's preference. |
| 0.3 | **Coach:** The symbol selector must offer any symbol. Added the `DLG-SYM` law group at **§5.4**. |
| 0.4 | Review disposition. §8 answered as law. Ten collisions closed: numbering, script-token exception, loading exception, lock-on-symbol-change, contract multiplier, Return-key exception, the appearance mechanism, a checkable AT-DLG-15, the §3 banner, and the IKI route. §1 restated against verified as-built. |

---

## 1. Why this Spec exists

The dialog was rebuilt at `71a9ab5` and did not become what was asked for, because the instruction it
was built from was wrong:

> "Dark theme on the card's tokens. The dialog must not read as a different application."

**The instruction was the defect, not the execution.**

The earlier sentence *"no change since the refresh"* is retired. The dialog has moved: it is a
free-floating 770-pixel panel, grouped into Structure and Shape, with a payoff thumbnail, a Buy/Sell
toggle, no Preview block, no entry-time picker and no Submit. Escape is wired to cancel.

**Verified as-built at `71a9ab5` — what still fails this Spec:**

| Law | As-built |
|---|---|
| **DLG-SYM-1** | The symbol control is a `<select>` with **one** `<option>` and an `onChange` that does nothing, commented *"session symbol is host-owned"* (lines 1682–1692). A picker that cannot pick. |
| **DLG-THEME-4** | `OL_DATA` ×15 and `OL_CHROME` ×5 — the **card's** tokens. Plus raw palette on the chrome a member looks at first: `bg-emerald-600` / `bg-red-600` on Buy/Sell, `#22c55e` / `#ef4444` on the payoff stroke. Tokenized with the blotter's tokens is not the same as themed. |
| **DLG-HIG-4** | **Done** in the header and **Cancel** in the footer both dismiss. Three actions, two of which leave. |
| **DLG-THEME-1/2** | No light theme. The component assumes dark. |

That is the real remaining defect list: **symbol, Done, raw palette, card tokens, and no light mode.**

**The correction, in Coach's words:**

- *"There is no ToS equivalent."* — ThinkorSwim has a blotter, which is why the card copies it. It
  has nothing corresponding to this dialog. There is no reference to imitate, so the dialog is
  **designed**, not copied.
- *"The create/edit dialogs should be themed the exact same way any well designed dialog [is], with
  light/dark aware controls and surfaces, and following Apple HIG."*
- *"The light/dark setting should follow the user preferences."*
- *"The Symbol selector must allow me to select any symbol."*

## 2. Supersession — the law that caused this

**Position Control Spec v1.2 PC-VOCAB-1** reads: *"Card and dialog share one control vocabulary and
one leg-row grammar, from one component."* It was written for **behaviour** and built as
**appearance**. Restated:

| ID | Law |
|----|-----|
| **DLG-VOCAB-1** | Card and dialog share one control **behaviour and semantics** — a stepper steps the same way, a lock locks the same way, and a fix to that logic fixes both surfaces. |
| **DLG-VOCAB-2** | Card and dialog **do not share appearance.** Density, type scale, spacing, chrome and surface colour are each surface's own. |
| **DLG-VOCAB-3** | **Mechanism, not aspiration.** A shared control takes a required `surface` prop — `"card"` or `"dialog"` — and stamps `data-surface` on its root. All appearance is selected from that attribute; behaviour is identical across both. **One component, two appearances.** Never two components. Never one appearance forced onto both. A shared control without a `surface` prop is a defect. |

PC-VOCAB-2 (card ⊂ dialog for structure) and PC-VOCAB-8 (add and remove leg is the dialog's
exclusive) are unchanged. **This Spec supersedes PC-VOCAB-1 on approval.** v1.2 stays frozen; the
supersession is recorded in the decision log and carried into v1.3.

## 3. Removed by Coach

> **Do not build Preview, Entry time, or Submit — even though all three are drawn in
> `dialog-target-layout.png`.** The PNG is the layout reference; this section overrides it.

| Removed | Why | Consequence |
|---------|-----|-------------|
| **Preview** | Redundant. The ToS script already states the position, and the derived name is on screen in Structure. | No preview block. |
| **Entry time** | Not wanted on this screen. | Entry time has **no member-editable control on any surface** — the card's went at PC8-E. It resolves to the cash-open default and is stamped at Log. Supersedes PC8-E's "the dialog is its home." |
| **Submit** | Not wanted. | Create commits on **Analyze**; Edit commits on **Update**. Both map onto the component's single existing `onSave` callback — **no second save path** (DLG-FN-9). |

## 4. What the dialog is

The member's workbench for shaping a position: choose a symbol and a strategy, set the structure and
shape, see what it costs, read the script, and either commit it or dismiss it. Opened deliberately,
worked in, dismissed. It is not a row in a blotter and must not be built like one.

## 5. Laws

### 5.1 Theming — `DLG-THEME`

| ID | Law |
|----|-----|
| **DLG-THEME-1** | Renders from the application's theme tokens. Light and dark are both first-class. Neither is hardcoded. |
| **DLG-THEME-2** | The active theme **follows the member's own preference**, set on their Settings page and expressed as `data-theme="light"` / `data-theme="dark"` on the document root. `styles/tokens.css` already defines both. |
| **DLG-THEME-3** | Honours the member's other appearance preferences as the rest of the product does: tint, font size, density, corner style. |
| **DLG-THEME-4** | **No hardcoded colour, and no card token.** `FIELD_FILL`, `OL_DATA`, `OL_CHROME`, `cardSelect` and the 18-pixel row floor are blotter values and do not appear in this component. A literal hex, or a Tailwind palette class such as `bg-emerald-600` or `#22c55e`, is a defect. **Exception:** the ToS script block (DLG-LAYOUT-6) renders from a named **code-surface token** which is defined to stay dark in both themes. The exception is the token, never a hex. |
| **DLG-THEME-5** | Contrast meets accessibility minimums in **both** themes. A design that works in only one is not done. |

### 5.2 Conduct — `DLG-HIG`

| ID | Law |
|----|-----|
| **DLG-HIG-1** | Type follows a scale with clear hierarchy — title, section label, field label, value. Not one size for everything, and not blotter-dense. |
| **DLG-HIG-2** | Spacing is generous and consistent: one spacing unit, consistent margins, related things grouped and unrelated things separated. |
| **DLG-HIG-3** | Controls are comfortably sized and hit targets meet the platform minimum **at rest**. No grow-on-hover anywhere in the dialog. |
| **DLG-HIG-4** | **One commit, one dismiss.** Create shows Analyze and Cancel; Edit shows Update and Cancel. **The Done link is removed.** The committing action is visually dominant. Escape dismisses. |
| **DLG-HIG-5** | Return commits the primary action — **except when focus is inside a value field** (strike, width, centre, quantity, price). There, Return commits the field's own edit and does not fire Analyze or Update. |
| **DLG-HIG-6** | Focus is visible, tab order follows reading order, every control is reachable from the keyboard. |
| **DLG-HIG-7** | Feedback is immediate. A control that changes something shows the change everywhere the dialog reflects it. |
| **DLG-HIG-8** | Errors and impossible states are stated in plain language where the member is looking, never as silent refusal. |
| **DLG-HIG-9** | Motion is minimal. Nothing moves that the member did not cause. |

### 5.3 Layout — `DLG-LAYOUT`

`docs/reference/tos/dialog-target-layout.png`, as amended by §3.

| ID | Law |
|----|-----|
| **DLG-LAYOUT-1** | **Title** — "Create Position" or "Edit Position", with symbol and spot context beneath. **No Done link.** |
| **DLG-LAYOUT-2** | **Structure** — the **strategy selector comes first**. **Directly beneath it**, one row carrying the payoff icon, the Buy / Sell toggle, and the derived name. *(Coach.)* The derived name follows from the choices above it and is never edited directly. |
| **DLG-LAYOUT-3** | **Right (Call / Put)** stays a Structure-level control, shown only for strategies that expose a single right — the existing `TEMPLATE_HAS_SIDE` set. Hidden for straddle, strangle, iron fly and iron condor, where right is per leg. Per-leg right remains available through Add Leg. |
| **DLG-LAYOUT-4** | **Shape** — centre, width, expiration, and the legs they produce. |
| **DLG-LAYOUT-5** | **Position** — package basis and package count, stated once, never per leg. |
| **DLG-LAYOUT-6** | **ToS script** — its own labelled block with a copy action, rendered from the code-surface token of DLG-THEME-4. Its **content** is governed by Position Control §4.7 and is not changed here. |
| **DLG-LAYOUT-7** | **Actions** — Create: Analyze · Cancel. Edit: Update · Cancel. **No Submit, no Preview, no Done.** |
| **DLG-LAYOUT-8** | **Presentation stays free-floating** — the draggable panel the component already implements (`panelPos`, `aria-modal="false"`). This Spec does not authorise a modal rewrite. |
| **DLG-LAYOUT-9** | Section labels are small, quiet and consistent. They organise; they do not compete. |

### 5.4 Symbol — `DLG-SYM`

As built, the control is a select with a single `<option>` and an inert `onChange` commented
*"session symbol is host-owned"* — a control shaped like a picker that cannot pick.

| ID | Law |
|----|-----|
| **DLG-SYM-1** | The symbol control is a **real control**. It offers a choice and acts on it. A one-option select with an inert handler is a defect, not a design. |
| **DLG-SYM-2** | Choices come from the **existing symbol universe** — the same `{ symbol, setSymbol, universe }` source `OpfRiskAnalyzer` already uses. No new list, no parallel fetch, no hardcoded symbols. |
| **DLG-SYM-3** | **OPF truth holds.** Only symbols with an OPF-held chain are selectable. One without is listed and disabled, reading **"no chain held"** — never selectable and then silently broken. *(DL-309.)* |
| **DLG-SYM-4** | Changing the symbol **re-resolves the structure onto the new symbol's OPF-listed strikes and grid.** Centre, width, legs and basis re-derive. No strike, width or price carries across. |
| **DLG-SYM-5** | An unloaded universe is a **named loading state** reading **"Loading symbols…"**, never an empty list and never a single entry that looks like a finished choice. A chain still loading after a symbol change reads **"Loading chain…"** on the affected fields. *(Same law as PC-CHAIN-6.)* |
| **DLG-SYM-6** | **The contract multiplier follows the new symbol.** Basis, package value and the script are recomputed on the new symbol's multiplier — never carried from the old one. A silent SPX (×100) → MES (×5) carry is a twentyfold error and is a blocking defect. |
| **DLG-SYM-7** | **Symbol changes the position's underlying only.** The analyzer's own selector continues to drive the session symbol. The book already holds several symbols at once; editing one position never hijacks the session. |
| **DLG-SYM-8** | **A locked basis does not survive a symbol change.** Changing symbol **unlocks and re-derives**, and says so. The old debit is never carried onto a new instrument. The symbol control is not disabled while locked. |
| **DLG-SYM-9** | **Package count carries; presets do not.** The package count is a member quantity and survives. Strategy presets and saved widths are symbol-specific and re-resolve to the new symbol's grid, announced through DLG-SYM-5, never silently reused. |

### 5.5 Behaviour — `DLG-FN`

| ID | Law |
|----|-----|
| **DLG-FN-1** | **Every control works.** A control that renders and does nothing is a defect, not a placeholder. First acceptance criterion, and the one Coach checks. |
| **DLG-FN-2** | Quantity steppers change leg quantity. Sign is preserved: a short leg showing −2 steps to −3. |
| **DLG-FN-3** | Any change to strategy, side, right, quantity, centre, width, strike or expiration re-derives the name, legs, basis and script **on the same tick**. **Exception:** a symbol change passes through DLG-SYM-5's loading state first; FN-3 applies once the chain is in hand. FN-3 is the law for in-chain edits. |
| **DLG-FN-4** | Basis and package count are package-level and stated once. Per-leg marks and implied volatility remain a dialog exclusive and stay live. |
| **DLG-FN-5** | Opening Edit writes nothing to the record. Create stays off the book until committed. Cancel discards. *(Position Control PC5 — re-asserted because it is easy to break in a rewrite.)* |
| **DLG-FN-6** | The lock behaves as it does on the card. `CardLockState` remains the only lock and the only source of a locked basis — subject to DLG-SYM-8 on symbol change. |
| **DLG-FN-7** | No pricing path changes. The dialog displays what the existing pricing produces. |
| **DLG-FN-8** | **Entry time is not editable here.** No date control, no time control, no native picker. |
| **DLG-FN-9** | Analyze and Update both map onto the component's **single existing `onSave` callback**. No second save path is introduced. |

## 6. What does not change

`AnalyzerPosition` is still the only mutable record and every surface is a view of it. Structure
classification, quantity and POS semantics, the lock and CHECK PRICE, the ToS script's content, the
undo stack, and promotion to the Trade Log are untouched.

## 7. Acceptance

| # | Criterion |
|---|-----------|
| **AT-DLG-1** | Every control does what it says. Nothing is inert. |
| **AT-DLG-2** | A stepper on a short leg reads −2 → −3, and basis and script move with it. |
| **AT-DLG-3** | Changing the member's theme preference switches the dialog cleanly, both directions. |
| **AT-DLG-4** | Correct in light **and** dark. Token grep in this component returns zero `FIELD_FILL`, `OL_DATA`, `OL_CHROME`, `cardSelect`, `h-[18px]`, zero literal hex, and zero Tailwind palette classes — **except** the named code-surface token on the script block. |
| **AT-DLG-5** | The larger-type and density preferences visibly affect the dialog. |
| **AT-DLG-6** | Side-by-side against `dialog-target-layout.png` **as amended by §3**, at 100% zoom, in both themes. Preview, entry time and Submit are absent by law, not by oversight. |
| **AT-DLG-7** | Escape dismisses. Return commits — and does **not** commit while focus is in a value field. Tab order follows reading order; focus is always visible. |
| **AT-DLG-8** | Hit targets meet the platform minimum at rest. No grow-on-hover. |
| **AT-DLG-9** | Opening Edit writes zero fields to the record. |
| **AT-DLG-10** | Nothing moves except in response to something the member did. |
| **AT-DLG-11** | No Submit button, no Preview block, no entry-time control, **no Done link**. |
| **AT-DLG-12** | The symbol control offers every symbol in the universe; symbols without an OPF chain are listed and disabled reading "no chain held". |
| **AT-DLG-13** | Choosing a different symbol re-resolves strikes onto that symbol's chain — no strike survives from the previous symbol — and the basis reflects the **new symbol's multiplier**. |
| **AT-DLG-14** | Changing symbol while the basis is locked unlocks and re-derives, visibly. The old debit never appears on the new instrument. |
| **AT-DLG-15** | Every shared control carries a `surface` prop and stamps `data-surface`. A test asserts the same component renders in both surfaces with different appearance and identical behaviour. |

## 8. Decisions of record — answered 2026-09-11

| # | Question | Coach's answer |
|---|----------|----------------|
| 1 | Scope | **This dialog only.** Other Labs dialogs are a later program. |
| 2 | Presentation | **Free-floating**, as built. No modal rewrite. |
| 3 | The Done link | **Removed.** Cancel plus the primary action carry it. |
| 4 | What the symbol belongs to | **The position's underlying only.** The analyzer's selector stays the session's. |
| 5 | Where Call / Put lives | **Structure-level Right**, shown for `TEMPLATE_HAS_SIDE` strategies, hidden for the two-right structures. Per-leg right stays on Add Leg. |

§8 is closed. Nothing in this Spec remains a question.

## 9. Build route

This Spec is **BUILD AUTHORITY**. The program of record is
`docs/Options-Lab-Create-Edit-Position-Dialog-Full-Agent-Bench-Plan-v1.0.md`.

**No fourth one-off. No packet before W0-0 GO.**
