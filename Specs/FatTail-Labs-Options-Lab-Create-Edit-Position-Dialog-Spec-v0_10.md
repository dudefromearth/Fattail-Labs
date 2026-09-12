# FatTail Labs — Options Lab — Create / Edit Position Dialog — Spec v0.10

**Type:** Product Spec — the Create and Edit Position dialog as a designed dialog surface
**Surface:** Options Lab Analyzer. **One component, two hosts:** `/app/options-lab/analyzer` and
`/app/iki/analyzer` both render `OpfRiskAnalyzer`, which is the only importer of
`PositionBuilder.tsx`. **No IKI fork.** *(Verified at `71a9ab5`.)*
**Component:** `web/components/options-lab/PositionBuilder.tsx`
**Status:** **CANDIDATE — the card's +/− control is the dialog's +/− control.**
**Build state when written:** DLG0 `93b08d8` and DLG1 `8faf9cd` landed. DLG2 not started.
**Date:** 2026-09-12
**Supersedes:** v0.9
**Reference:** `docs/reference/tos/dialog-target-layout.png` — the layout, **as amended by §3**
**Next step after approval:** Grok Build produces a **full agent bench build plan**. No packet, no
seed, no fourth one-off.

| Ver | Change |
|-----|--------|
| 0.1 | First draft. Dialog respecified as a designed dialog rather than a piece of the card. |
| 0.2 | **Coach:** Preview removed. Entry time removed. Submit removed. Payoff icon and Buy/Sell moved directly beneath the strategy selector. Theme follows the member's preference. |
| 0.3 | **Coach:** The symbol selector must offer any symbol. Added the `DLG-SYM` law group at **§5.4**. |
| 0.4 | Review disposition. §8 answered as law. Ten collisions closed: numbering, script-token exception, loading exception, lock-on-symbol-change, contract multiplier, Return-key exception, the appearance mechanism, a checkable AT-DLG-15, the §3 banner, and the IKI route. §1 restated against verified as-built. |
| 0.5 | **Coach, 2026-09-11:** *"padding on the sides and the window a bit wider to accommodate that padding. I want the full Apple HIG treatment."* DLG-HIG-2 given a named spacing scale; new DLG-HIG-10 sets content margins and panel width; AT-DLG-16 makes both measurable. Nothing else changes — every other law, decision and acceptance criterion in v0.4 stands verbatim. |
| 0.6 | **Coach, 2026-09-11:** v0.5 reduced *"the full Apple HIG treatment"* to a spacing grid and a panel width. That is a fraction of it. §5.2 is rewritten as the complete treatment — type ladder, control conformance, alignment axis, button order and default key, semantic colour, separators, focus ring, motion and accessibility. **The layout does not change.** HIG governs how the surface reads and behaves; §5.3 still governs what is on it. |
| 0.7 | **Layout regression, author's error.** v0.1 §4.3 was written from Coach's prototype: Title · Symbol and Strategy · Direction row · Legs · Add Leg · ToS script · Actions. **v0.2 replaced it with the as-built dialog's own sections** — Structure · Shape · Position — taken from the code rather than the prototype, and never checked back against the reference image. v0.3–v0.6 inherited it, and DLG2 built it correctly. §5.3 is rewritten **from the prototype, element by element**, and DLG-LAYOUT-0 is added so this cannot recur.  Also corrected, same class of author error: **DLG-HIG-8** was written as a principle and stripped Coach's green — restated so semantic tokens govern where colour comes from, not whether it exists. **DLG-HIG-9** restated to require component shading and inner padding. **AT-DLG-18/19/20** added for the missing script block, the flat surfaces and the missing colour. |
| 0.8 | **Coach's marked-up prototype, 2026-09-12.** Five things the Spec added and Coach never asked for are **struck**: the Call / Put control, the derived-name text, Centre, Width, and structure-level Expiration. *"You added things I did not ask for… I did not ask for these."* · *"There's no need for the strategy name and type to be placed under the dropdown that already displayed it."* This **reverses §8 decision 5** — recorded, not silently swapped. Panel widened so **the legs editor never wraps**. |
| 0.9 | **Coach's second markup, 2026-09-12.** Every editable value in the legs table is a **field with its own surface**, not bare text. **Column headers are visually distinct from the fields beneath them.** **Analyze and Cancel are bigger**, and **all controls carry the platform's shadow** — *"shadows like all HIG controls."* Expiration reads **`Sep 14 26`**. The payoff icon and Buy / Sell move right, under the STRATEGY column. A **close button in the upper left**, platform-standard. |
| 0.10 | **Coach, 2026-09-12:** *"use the +/− controls used in the position card."* The dialog's stepper is the **card's stepper** — same component, same form — at dialog scale, elevated, and **without grow-on-hover**. New DLG-VOCAB-4. |

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
| **DLG-VOCAB-4** | **The card's +/− control is the dialog's +/− control.** *(Coach, 2026-09-12.)* Not a look-alike and not a second implementation — the same `TosStepper` / `TosQtyControl` the card uses, rendered at `surface="dialog"`. It keeps the card's **form**: stacked + over −, one filled unit with a visible divider between the halves, full contrast, butted to its quick-pick caret where POS has one. What changes with the surface is **scale and elevation** — dialog-sized, comfortably padded, carrying the shadow of DLG-HIG-9. **Grow-on-hover does not come with it**: the dialog's control meets the hit target **at rest** (DLG-HIG-3), because growth-on-hover is a blotter compromise for a dense row. Small floating +/− glyphs detached from their field are a defect. |

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
| **Derived name text** ("Buy Butterfly") | Redundant. The STRATEGY menu already reads *Butterfly* and the Buy / Sell control already reads *Buy*. *(Coach, 2026-09-12.)* | The direction row carries the payoff icon and the Buy / Sell control, and nothing else. |
| **Call / Put control** | Never in the prototype; an addition by the Spec. **Reverses §8 decision 5.** *(Coach, 2026-09-12.)* | Right is chosen **per leg**, in the legs table's TYPE column. No structure-level right control of any kind. |
| **Centre · Width · structure-level Expiration** | "Quick spread controls" the Spec added. Never in the prototype. *(Coach, 2026-09-12.)* | Strikes and expiration are set **per leg** in the legs table. |
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

Apple's Human Interface Guidelines govern how this dialog reads and behaves. **They do not change
what is on it** — §5.3 owns the layout, and the layout Coach supplied is already HIG-shaped. These
laws are the full treatment, not a spacing pass.

| ID | Law |
|----|-----|
| **DLG-HIG-1** | **Type ladder.** The system font, in a named ladder with real hierarchy: dialog title · section header · control label · value · caption. Each step differs in size, weight or colour — never one size for everything, never blotter-dense. Values in the legs table are tabular-figure so columns align on the digit. |
| **DLG-HIG-2** | **Spacing on a named 8-point grid — 4 · 8 · 12 · 16 · 20 · 24.** Every gap, margin and inset is a value from that scale; an off-grid number is a defect. **20** separates labelled groups, **12** separates rows within a group, **8** separates a label from its control. |
| **DLG-HIG-3** | **Control conformance.** Each control is the platform-standard control for its job, at standard height: Buy / Sell is a **segmented control**; every menu is a **pop-up button**; quantity, strike and price use a **stepper**; Add Leg and the copy action are ordinary buttons. Hit targets meet the platform minimum **at rest** — no grow-on-hover anywhere in the dialog. |
| **DLG-HIG-4** | **Alignment axis.** The dialog is a form. Labels lead on a common axis; their values align on a second common axis; the legs table aligns on its column grid. Nothing is centred that belongs in a column, and no control floats free of the grid. |
| **DLG-HIG-5** | **One commit, one dismiss, in platform order.** Create shows Analyze and Cancel; Edit shows Update and Cancel. The commit is the **default button** — visually dominant, placed last in reading order, bound to Return. Cancel sits beside it and is bound to Escape. **No Done link, no third action.** The window's **close button (upper left)** is chrome, not one of the two actions; it performs Cancel. |
| **DLG-HIG-6** | **Return commits the default button — except when focus is inside a value field** (strike, width, centre, quantity, price). There, Return commits that field's edit and does not fire Analyze or Update. |
| **DLG-HIG-7** | **Keyboard and focus.** Every control is reachable and operable from the keyboard. Tab order follows reading order. The focus ring is the platform ring — always visible on the focused control, never suppressed, never restyled into invisibility. |
| **DLG-HIG-8** | **Semantic colour, and the prototype's colour is kept.** Every colour resolves from a semantic token in the member's theme — a literal hex or a Tailwind palette class is a defect. **That is a rule about where colour comes from, not permission to remove it.** The green on the selected **Buy** segment and on the **payoff stroke** is intended and required; it is expressed as an accent token rather than `#22c55e`. Colour is never the *sole* carrier of meaning — Buy also carries its label and its selected state — but **a colourless dialog fails this law.** |
| **DLG-HIG-9** | **Component surfaces, inner padding, and the platform's elevation.** The dialog is not a flat sheet. The **legs table sits on its own filled surface**, bordered, radiused, with **its own inner padding**. **Every control carries the platform's shadow** — the subtle elevation that lifts a control off the surface beneath it, on fields, menus, segmented controls, steppers and buttons alike. *(Coach, 2026-09-12: "they should have shadows like all HIG controls.")* Groups are divided by hairline separators or spacing, never boxes inside boxes. **A flat, shadowless dialog fails this law.** |
| **DLG-HIG-10** | **Real margins, and a panel wide enough that nothing wraps.** Content is inset **20** from all four edges. The panel is **1100** wide, content **1060** — sized so the six-column legs table renders on one line per row with room around each control (DLG-LAYOUT-12). 1100 is a **floor, not a target**: if the legs editor still wraps at that width, the panel widens further. Free-floating and draggable per DLG-LAYOUT-10. *(Coach, 2026-09-12.)* |
| **DLG-HIG-11** | **Feedback is immediate and local.** A control that changes something shows the change everywhere the dialog reflects it, on the same tick. Errors and impossible states are stated in plain language where the member is looking, never as silent refusal. |
| **DLG-HIG-12** | **Motion is minimal and respects the member.** Nothing moves that the member did not cause. Any transition honours the reduce-motion preference and has a no-motion path that is still complete and legible. |
| **DLG-HIG-13** | **Accessibility is part of done.** Every control carries an accessibility label that names it and its value. Contrast meets the platform minimum in **both** themes. The dialog is operable and comprehensible with the keyboard alone. |
| **DLG-HIG-14** | **The actions are large.** Analyze / Update and Cancel are **generously sized** — comfortably padded, visibly bigger than an inline control, sized to be the obvious end of the task. Both carry the elevation of DLG-HIG-9. The commit is the dominant of the two and is the default button. **Compact or cramped actions fail this law.** *(Coach, 2026-09-12.)* |

### 5.3 Layout — `DLG-LAYOUT`

**Normative reference:** `docs/reference/tos/dialog-target-layout.png` — Coach's prototype, as amended
by §3. Where this section and the image disagree, **the image wins and this section is a bug.**

| ID | Law |
|----|-----|
| **DLG-LAYOUT-0** | **The prototype is the layout.** These laws are a transcription of the reference image, not an interpretation of it. **A section, grouping or heading that does not appear in the image is a defect** — including any inherited from the previously shipped dialog. A control that exists in code but not in the image is listed in §5.3.1 and placed by Coach's decision; it is never given a new section of its own. |
| **DLG-LAYOUT-1** | **Title bar** — a **close button in the upper left**, platform-standard for a window, then the title "Create Position" or "Edit Position" centred, then a separator beneath. *(Coach, 2026-09-12.)* **This is window chrome, not a third action** — it is the same act as Cancel: discard and dismiss. It is **not** the `Done` link §3 removed, which sat upper right and read as a commit. Do not remove the close button as a "second dismissal" — DLG-HIG-5 governs the action pair in the footer, not the window's own close. |
| **DLG-LAYOUT-2** | **Symbol and Strategy — one two-column row.** Left column labelled `SYMBOL` above a menu field. Right column labelled `STRATEGY` above a menu field. Both labels are small, uppercase and quiet. **These are peer fields on one row — not two sections, and not a symbol tucked into the title bar.** |
| **DLG-LAYOUT-3** | **Direction row** — beneath the Symbol / Strategy row, **aligned under the STRATEGY column**, one unlabelled row carrying the **payoff icon** and the **Buy / Sell segmented control**. It belongs to the strategy, not the symbol, and is placed under it. **That is all it carries** — no derived name, no Call / Put. *(Coach, 2026-09-12.)* |
| **DLG-LAYOUT-4** | **There is no structure-level right control.** Call versus Put is chosen **per leg**, in the legs table's TYPE column. *(Coach, 2026-09-12 — reverses §8 decision 5.)* |
| **DLG-LAYOUT-5** | **LEGS** — a section label, then a bordered table on its own surface. Column headers, left to right: **QTY · STRIKE · TYPE · EXPIRATION · DEBIT · POS**. Rows are labelled `Leg 1:`, `Leg 2:`, `Leg 3:` on one line each. A per-row **×** removes that leg, at the right edge, outside the last column. |
| **DLG-LAYOUT-6** | **Leg row contents — every editable value is a field.** QTY, STRIKE, EXPIRATION, DEBIT and POS each render as a **control with its own surface**, not bare text beside a stepper: the member can see what is editable without hovering. *(Coach, 2026-09-12.)* Steppers and menus sit beside their field, the stepper being the card's own control per DLG-VOCAB-4 — attached to its field, never floating above it. **Expiration reads as a human date — `Sep 14 26` — never `09-14`**, matching the ToS script's own `14 SEP 26`. **DEBIT and POS appear on the leg 1 row only** — DEBIT carries the package basis, its stepper and the **padlock**; POS carries the package count, its stepper and the **quick-pick**. Both are empty on every other row. |
| **DLG-LAYOUT-7** | **`+ Add Leg`** below the table, left-aligned, present on every strategy. |
| **DLG-LAYOUT-8** | **TOS SCRIPT** — a section label, then the script on a dark code surface (the named code-surface token of DLG-HIG-8) with its copy affordance beneath it. |
| **DLG-LAYOUT-9** | **Actions sit beside the script block, stacked at the right** — the commit on top, **Cancel** beneath it. Create commits on **Analyze**, Edit on **Update**. Not a full-width bottom bar. **No Submit, no Preview, no Done.** |
| **DLG-LAYOUT-10** | **Presentation stays free-floating** — the draggable panel already implemented (`panelPos`, `aria-modal="false"`). No modal rewrite. |
| **DLG-LAYOUT-11** | Section labels — `SYMBOL`, `STRATEGY`, `LEGS`, `TOS SCRIPT` — are small, uppercase and quiet. They organise; they do not compete. **There are no other section headings.** |
| **DLG-LAYOUT-12** | **The legs table spans the full content width and nothing in it wraps.** Leg labels (`Leg 1:`), every column header, and every value sit on **one line each**. Columns carry enough room that each control reads as a control rather than a crowded glyph. The table never introduces a horizontal scrollbar. **If anything wraps, the panel is too narrow — widen the panel, never shrink the type.** *(Coach, 2026-09-12: "much wider so that nothing in the legs editor [has] to be wrapped and have plenty of room to understand the controls.")* |
| **DLG-LAYOUT-13** | **The column headers are visually distinct from the fields beneath them.** `QTY · STRIKE · TYPE · EXPIRATION · DEBIT · POS` sit in their own band across the top of the table, set apart by surface, weight and colour — a header reads as a header and never as another row of values. *(Coach, 2026-09-12: "Headers should be distinct from the fields under them.")* |

#### 5.3.1 Settled — 2026-09-12

Centre, Width and structure-level Expiration were listed here for Coach's ruling. **He ruled: remove them**, along with the Call / Put control and the derived-name text. All five are recorded in §3. Nothing remains open in this section.

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
| **AT-DLG-6** | Side-by-side against `dialog-target-layout.png` **as amended by §3**, at 100% zoom, in both themes — **element by element, in the image's order**: title · SYMBOL and STRATEGY on one row · direction row · LEGS table with its six columns · Add Leg · TOS SCRIPT · actions stacked beside the script. **A heading that is not in the image fails this test**, `STRUCTURE`, `SHAPE` and `POSITION` included. Preview, entry time and Submit are absent by law, not oversight. |
| **AT-DLG-7** | Escape dismisses. Return commits the default button — and does **not** commit while focus is in a value field. Tab order follows reading order; the platform focus ring is visible on every focused control. The dialog is fully operable with the keyboard alone. |
| **AT-DLG-8** | Hit targets meet the platform minimum at rest. No grow-on-hover. |
| **AT-DLG-9** | Opening Edit writes zero fields to the record. |
| **AT-DLG-10** | Nothing moves except in response to something the member did. |
| **AT-DLG-11** | No Submit button, no Preview block, no entry-time control, **no Done link**. |
| **AT-DLG-12** | The symbol control offers every symbol in the universe; symbols without an OPF chain are listed and disabled reading "no chain held". |
| **AT-DLG-13** | Choosing a different symbol re-resolves strikes onto that symbol's chain — no strike survives from the previous symbol — and the basis reflects the **new symbol's multiplier**. |
| **AT-DLG-14** | Changing symbol while the basis is locked unlocks and re-derives, visibly. The old debit never appears on the new instrument. |
| **AT-DLG-17** | **HIG conformance, itemised.** Type ladder present with distinct steps · Buy/Sell is a segmented control · every menu is a pop-up button · labels and values each hold a common alignment axis · commit is the default button, last in reading order, Return-bound · colour is semantic only, and Buy/Sell is distinguishable with hue removed · hairline separators, one elevation, one radius · reduce-motion honoured · every control has an accessibility label. Echo and Tango sign each line. |
| **AT-DLG-18** | **The TOS SCRIPT block is present and rendered** — section label, dark code surface, the order string, and the copy affordance. Its absence is a blocking defect, not a deferral. |
| **AT-DLG-19** | **The dialog is not flat.** The legs table renders on a filled, bordered surface with inner padding, distinct from the dialog background. Menu fields and segmented controls sit on filled control surfaces. Screenshot evidence in both themes. |
| **AT-DLG-20** | **Colour is present.** The selected Buy segment and the payoff stroke render green from an accent token — not grey, not black, and not a literal hex. A colourless render fails. |
| **AT-DLG-27** | **A close button sits in the upper left**, platform-standard, and performs Cancel — discard and dismiss. It is present in both modes and in both themes. |
| **AT-DLG-23** | **Every editable value in the legs table is a field with its own surface.** A member can tell what is editable without hovering. Expiration reads `Sep 14 26`. |
| **AT-DLG-24** | **The column header band is visually distinct** from the field rows beneath it — by surface, weight and colour. |
| **AT-DLG-28** | **The dialog's stepper is the card's stepper** — a test asserts both surfaces render the same component. Visually: stacked + over −, one filled unit with a divider, attached to its field, dialog-scaled, elevated, and **full size at rest with no growth on hover**. |
| **AT-DLG-25** | **Controls carry the platform's shadow.** Fields, menus, segmented controls, steppers and buttons are elevated off the surface beneath them. A flat render fails. |
| **AT-DLG-26** | **Analyze / Update and Cancel are large** — comfortably padded, visibly bigger than an inline control, both with elevation, commit dominant and default. |
| **AT-DLG-21** | **Nothing in the legs editor wraps.** Leg labels, column headers and values each render on one line, at the default and the larger type settings, in both themes. No horizontal scrollbar. |
| **AT-DLG-22** | **The five additions are absent**: no Call / Put control, no derived-name text, no Centre, no Width, no structure-level Expiration. Right is chosen per leg in the TYPE column. |
| **AT-DLG-16** | Measured, not judged: panel width **1100** or wider, content inset **20** on all four sides, content width **1060** or wider. Every gap, margin and inset in the component is a value from the 8-point scale — a grep for off-grid spacing classes returns nothing. |
| **AT-DLG-15** | Every shared control carries a `surface` prop and stamps `data-surface`. A test asserts the same component renders in both surfaces with different appearance and identical behaviour. |

## 8. Decisions of record — answered 2026-09-11

| # | Question | Coach's answer |
|---|----------|----------------|
| 1 | Scope | **This dialog only.** Other Labs dialogs are a later program. |
| 2 | Presentation | **Free-floating**, as built. No modal rewrite. |
| 3 | The Done link | **Removed.** Cancel plus the primary action carry it. |
| 4 | What the symbol belongs to | **The position's underlying only.** The analyzer's selector stays the session's. |
| 5 | Where Call / Put lives | ~~Structure-level Right~~ — **reversed by Coach 2026-09-12.** There is no structure-level right control. Right is chosen **per leg** in the TYPE column. |

§8 is closed. Nothing in this Spec remains a question.

## 9. Build route

On approval this Spec lands in `Specs/`, the decision is logged, and **Grok Build produces a full
agent bench build plan** — orchestrator, phases, agent seeds and gates, with India on the
architecture, Echo and Tango on the design, and Delta gating each phase.

**No seed. No packet. No fourth one-off.**
