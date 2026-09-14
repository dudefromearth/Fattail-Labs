# ECHO — Phase 3 Design Review (Human Interface)

**Agent:** Echo  
**Date:** 2026-09-13  
**Subject:** `Specs/FatTail-Labs-Practice-Position-Lifecycle-Spec-v0.1.md` (**DRAFT**, Juliet Phase 1)  
**Workflow:** spec-create-review-workflow Phase 3 (Echo half). Tango is a separate pass. Spec not edited. Parents not edited. No board, no seeds, no code.

**Read (this pass):**

- Charter `agents/bench/echo.md` · doctrine §11 / §15 · spec-create-review-workflow
- Human Interface Spec v1.0 §2, §4, §5, **§6.3** (AlertDialog / destructive pattern), §9
- Draft spec v0.1 — especially §0.2 isolation, §3.6 confirm as-built, **§4.4** states, **§5.4** confirm UI, **§8** member experience, §9.1 item 4, §13 W2
- B0 focused audit v1.1 **§1.3 / §2.3 / OD-19** (transcribed, not answered)
- India Phase 2 `agents/p-practice-position-lifecycle/reviews/INDIA-PPL-v0.1-Phase2.md` (**RETURNED** on architecture — Echo does not re-litigate B1–B3)
- As-built kit: `web/components/ui/AlertDialog.tsx`, `ConfirmProvider.tsx` / `useConfirm`
- As-built Practice chrome: `TradeSheet.tsx` `trashConfirm` (~406, ~1278–1413), blotter bulk `window.confirm` in `web/app/app/trade-log/page.tsx` (~641–661), Import Manager `useConfirm` (prior art, not this blotter delete), `positionBadge` / `badgeMeta` / `TL_STATUS`

**Not this pass:** OD-19 (soft-trash vs hard; wizard vs two) — **OPEN**, not answered. OD-21 English word — **Hotel**, not picked. No new Autofilter token as law. No Options Lab restyle.

---

## Up front

This pass **did not change or drop** anything Coach wrote. The spec file was not edited. Objections sit here, labeled Echo.

Both Coach phrases **partial-residual** (C1) and **unfinished cycle** (C2) remain. B0 member sentence *"opened before your imported history."* is **kept** (locked below as calm named-state copy, not replaced). OD-19 / OD-21 stay OPEN. Matcher freeze, PPL-11 isolation, and “no OPF chrome on the blotter” stand.

India Phase 2 is **RETURNED** (write-path table, Privacy parent, GET `/opens`). Echo still reviews UX. Juliet must land India B1–B3 **and** Echo B1–B2 before the file is packetable.

---

## Bench delta

What the next invocation can do that this one could not:

1. **PPL-5 has two confirm surfaces, not one.** TradeSheet `trashConfirm` is the named C1-4 lie. Blotter bulk trash is still `window.confirm` on `web/app/app/trade-log/page.tsx`, and that file is missing from §0.2. W2 that only kills the drawer leaves a banned confirm on the log.
2. **Kit already has the primitive.** Import Manager is the prior art: `useConfirm({ title, message, confirmLabel, destructive: true })` → `AlertDialog` with Cancel default-focused. Do not invent a third confirm. Do not restyle Import Manager. Do not port unused `trash_reason` chips into the dialog.
3. **Named-state chrome is a badge + caption grammar, not a new farm.** Status stays the existing Status-column badge (one per row). Partial-residual must not wear Orphan amber. Coverage-window explanation is Coach’s sentence as calm copy, not error chrome. Autofilter **English** waits on Hotel (OD-21); W1 may use a machine key. Do not lock a new filter token as law.
4. **Close is the one filled primary; delete is destructive secondary.** Confirm is only for a delete that will proceed. A 409-blocked open (including partial-residual) is a named “close first” state — not a confirm that then fails.
5. **Isolation is a design invariant too.** No Options Lab restyle, no OPF named-state catalog, no `AnalyzerPositionsList.tsx`. Practice names its own states with kit primitives.

---

## Coach content intact?

Yes — all Coach / B0 v1.1 text retained in the draft; Echo objections are in this file, not inlined as deletions.

Kept on purpose (doctrine §11):

- Close ≠ delete as distinct transitions (PPL-5)
- Kit `AlertDialog` / `useConfirm`; no `window.confirm`; no in-drawer forever
- Both phrases **partial-residual** and **unfinished cycle**; no third English word as law
- OD-19 transcribed, not answered (wizard vs two · soft-trash vs hard)
- OD-21 left to Hotel
- Coverage sentence *"opened before your imported history."*
- Orphan close remains for a true unpaired close **inside** the window
- OPF Law B as honesty **analogy** only
- Isolation: do not restyle Options Lab / LIM / QFRIC / XS

---

## Blocks (invariant | law | system only)

HIG kit violations can block. Do not answer OD-19. Do not pick OD-21. Do not invent an Autofilter token as law.

### B1 — HIG §6.3 / PPL-5 · destructive confirm surfaces incomplete

**Cites:** HI Spec §6.3 (AlertDialog replaces `window.confirm` / `alert`; destructive = item **name**, consequence sentence, **Cancel** + **Delete**, confirm never default-focused); Echo invariant 7; Spec §3.6, §5.4, §8.2, §9.1 item 4, §0.2 in-scope trees; as-built `TradeSheet.tsx` `trashConfirm`; as-built `web/app/app/trade-log/page.tsx` ~652 `window.confirm(\`Trash ${n} open position(s)?…\`)`; Trade Log §16.4 bulk delete unmatched opens; Spec §5.1 bulk select.

The spec’s HIG law is **correct** for the sheet: replace bespoke in-drawer `trashConfirm` with kit `AlertDialog` / `useConfirm`; not `window.confirm`; not forever-in-drawer.

It is **incomplete** as packet law:

| Surface | As-built | Named in PPL-5? |
|---------|----------|-----------------|
| Sheet delete (`TradeSheet` `trashConfirm`) | In-drawer red box + reason chips (chips never write) | Yes |
| Blotter **bulk trash** (`page.tsx`) | **`window.confirm`** | No. File **not** in §0.2 |
| Import Manager batch delete | Kit `useConfirm` already | Out of Circumstance 1 chrome except as prior art (already stated) |

Bulk unmatched-open delete is Circumstance 1 (PPL-4 / §5.1 / Trade Log §16.4). Leaving it on `window.confirm` is the same class of kit violation C1-4 already named for the sheet. A W2 seed that only lists `TradeSheet.tsx` would ship banned confirm on the blotter.

**Required change (do not dispose OD-19):**

1. Enumerate **every** blotter-row destructive delete in this program as kit `AlertDialog` / `useConfirm`:
   - Sheet: replace `trashConfirm` (open and close fills).
   - Blotter bulk: replace `window.confirm` on `web/app/app/trade-log/page.tsx`.
2. Add that page to §0.2 in-scope **or** name it as the bulk-confirm consumer Charlie must touch. Do not restyle the rest of the page.
3. Grammar (HI Spec §6.3 — already in §5.4; apply to **both** surfaces): item name or count, consequence sentence, **Cancel** + named **Delete** (sentence case), `destructive: true`, Cancel default-focused / Esc cancels, confirm is the only path that calls `DELETE`. Busy state on the kit dialog (`AlertDialog` already has `busy`).
4. **Do not** port the unused `trash_reason` chip farm into `AlertDialog`. Spec already leaves `trash_reason` unwritten until OD-19. Kit dialog is title + message + two actions — not a picker.
5. Import Manager stays the prior art and is **not** redesigned. Do not apply PPL-4 blotter 409 to import recycle.

Soft-trash vs hard only changes the **consequence sentence** (cannot-be-undone vs restore-from-recent). It does not change the primitive. Echo does **not** pick OD-19.

### B2 — Named-state chrome law missing (this review was deferred to Echo)

**Cites:** Spec §4.4, §4.5, §6.1, §8.1, §8.5, §13 W1 (“until Echo/Tango”; “do not lock a new Autofilter word”); B0 §2.3; HI Spec §2.1 Clarity / Feedback, §6.3 Banner vs AlertDialog; OPF Law B analogy (named calm state — **do not import** OPF catalog); `badgeMeta` orphan = amber “broken”; Echo invariants 1, 4, 8, 9.

§4.5 / §8.1 leave the coverage sentence “until Echo/Tango review.” This is that review. Without chrome law in the spec, Charlie can (a) keep **Orphan** amber on a truncated-import close, (b) paint Coach’s sentence as error Banner / `color.destructive`, (c) invent a second badge farm or OPF chips, or (d) lock a new Autofilter **word** to satisfy §8.5 “do not ship a state the filter cannot name.”

**Required change (do not pick OD-21; do not invent Autofilter law):**

Land a short **§8 chrome grammar** (or equivalent Juliet transcription of the following — do not drop Coach phrases):

1. **Status column stays the existing blotter badge** — one badge per row, existing density. No second badge farm. No toolbar pills for the fourth state. No OPF named-state catalog (EXPIRED / HELD/RESIDUAL / NOT TRADED / CHECK LEGS / …). **Do not restyle Options Lab.**
2. **Open / Complete / Orphan close** keep their as-built badge slots. This program does **not** restyle those three (existing work). Orphan amber remains for a true unpaired close **inside** the coverage window (Spec §4.4).
3. **partial-residual (C1)** is **not** Orphan chrome and **not** Open-at-original-size. It is an honest remainder. Qty **4** (1-of-5) lives in the **qty / Positions** column, not stuffed into the badge string. Visual family: Open-remainder (calm, process), never amber “broken,” never destructive.
4. **Coverage-window explained boundary (C2-1)** is a **calm named state**, not error chrome. Coach’s sentence is kept: *"opened before your imported history."* Not `color.destructive`, not issue-chip “broken,” not Orphan badge, not a blocking Banner. Caption / secondary label on the existing issues or status slot is enough. Fail-loud and calm are compatible.
5. **unfinished cycle (C2)** remains a Coach phrase for the genuinely incomplete cycle. Member-facing **English token** is **OD-21 OPEN** (Hotel). Echo does not pick the word and does not invent a third (“dangling,” “pending,” “incomplete” as law).
6. **Autofilter:** do **not** lock a new `TL_STATUS` string as law. W1 may emit a **machine key** so C1 remainder rows are queryable (acceptance §9.1 / §8.5 “filter can name the state” = selectability, not copy-as-law). Visible filter label waits on OD-21. Until Hotel, C1 acceptance copy may use Coach’s **partial-residual** as a temporary label **without** becoming Autofilter law.
7. **Do not ship explained-boundary or partial-residual in the Orphan filter bucket.** That would keep the C1-1 / C2-1 lie in the chrome.

W1 (no OD-21): derivation + C1 remainder chrome + delete guard. W3 (OD-9 / OD-21 / OD-22): coverage caption + fourth-state member token. Charlie does not invent a token to “finish” W1.

---

## Opinions / recommendations (not blocks — Coach may discard)

### O1 — Close vs delete: HIG constraints that survive OD-19 (not a pick)

Echo does **not** choose “one wizard with a hard fork, or two,” and does **not** choose soft-trash vs hard.

Either OD-19 fork must keep:

| Rule | Why |
|------|-----|
| Close is a **fill** (primary / tint in that region) | One primary per region (HI Spec §2.1 · Echo invariant 4). As-built “Enter closing order” is already that primary. Keep. |
| Delete is **destructive** visual intent, never a second filled primary | HI Spec §6.1 `destructive` · §6.3 |
| They never share **one unmarked control** | Spec §8.2 already. Keep. |
| Confirm **only** when delete will proceed | 409-blocked open (full **or** partial) shows the existing “delete the close first” named panel — not an AlertDialog that then 409s |
| Soft vs hard changes the consequence sentence only | Primitive stays `AlertDialog` |

As-built unmatched-open cluster already has one filled primary. Do not add “Complete this cycle” as a competing tint button. Declarations (OD-22) are a later teaching control, not a second primary in W1/W2.

### O2 — Do not restyle the whole TradeSheet (DL-539)

C1 chrome delta is:

- Kill `trashConfirm`; wire kit confirm.
- Partial-residual open joins the **existing** paired-open “close first” named block (today that open falsely looks unmatched and offers Delete).
- Badge / qty honesty (B2).

Do **not** in this program: restyle Close / Paste ToS / Duplicate, convert every ad-hoc `rounded-full` to kit `Button`, retoken the amber paired-open panel, or redesign Trade Log §16.3 sheet layout. Those are existing work. When the Delete **trigger** is touched, prefer kit `Button variant="destructive"` (or plain destructive) over raw `red-600` — localized to that control, not a sheet rewrite.

Family B: blotter **body** may stay dense / ToS-faithful. Shell, sheet actions, dialogs, and badges stay HIG.

### O3 — AlertDialog copy (sheet + bulk)

Follow Import Manager, not the in-drawer farm.

**Sheet, delete close (hard, until OD-19):**

- Title: `Delete this close?` (sentence case)
- Message: name the fill (`TO CLOSE #id` / structure one-liner already used in the sheet). Consequence: the paired open returns unmatched (or remains partial-residual if other slices remain). Cannot be undone — **unless** OD-19 later says restore; then the sentence changes.
- Confirm label: `Delete close` (named consequence, not “Yes, delete this TO CLOSE”)
- Cancel focused

**Sheet, delete unmatched open:**

- Title: `Delete this open?`
- Message: name `#id` / structure. Consequence: permanent remove (hard today).
- Confirm: `Delete open`

**Bulk:**

- Title: `Delete N opens?` (count = name)
- Message: unmatched opens only (partial-residual **excluded**, Spec §5.1). Consequence matches OD-19 when disposed; today hard.
- Confirm: `Delete opens`
- Do not use the word “Trash” as the primary label if the action is delete (as-built bulk says “Bulk trash” + `window.confirm` “Trash…”) — sentence-case **Delete** matches HI Spec §6.3. “Trash” as Trade Log vernacular may remain in docs; the **confirm button** is named Delete.

Tango owns tone. Echo owns: no ALL CAPS, no emoji, no profit valence, no “broken.”

### O4 — 422 / 409 presentation

Gate 422 and delete-order 409 are fail-loud **API** facts. UI:

- 422: sheet stays open; existing error region or kit Banner naming the failed gate — not a success toast, not a second AlertDialog stacked on Save.
- 409: named “close first” + jump to the blocking close id (as-built paired-open panel already does this for full pairs). Extend that pattern to **partial** slices. Do not confirm-then-fail.

Overrides remain the as-built close-gate checkboxes; they round-trip in the payload. Do not restyle them in this program.

### O5 — Coverage copy (Coach sentence locked)

Echo **accepts** B0’s member sentence verbatim: *"opened before your imported history."*

It is explanatory, not accusatory. Do not replace it with “broken import,” “orphan (explained),” or a longer architecture sentence in the blotter. Tango may still review tone; Echo will not swap Coach’s words for a third phrase.

NULL window ≠ this sentence (India O1). Manual/automated orphans stay Orphan close. Echo agrees: the calm caption only when derivation actually has a window that explains the boundary.

### O6 — Provenance chips (C2-4)

Distinguish imported expire / synthetic expire-worthless / member close with the **existing** `entry_source` + synthetic labelling pattern (Import / Manual / Automated chips already exist). Do not add a new color system. Do not invent `close_kind` chrome. Stricter “Expired (imported)” vs “Closed (imported)” is India’s FI-PPL-2 — Hotel + Coach; Echo reviews chips if that flag is adopted.

### O7 — Hold-boundary (PPL-7)

One hold rule, one answer on every surface — as **named-state grammar**, not a direction pick. India’s FI-PPL-1 (both still Open named / both drop-or-explain / fourth-state) is the product fork. Echo: whichever Coach names, it is calm and **the same** on blotter and day-book; neither surface goes silent while the other says Open. Do not implement W3 agreement chrome until the direction exists.

### O8 — Hit targets / a11y

Kit `AlertDialog` already: scrim, `role="alertdialog"`, focus trap-ish Cancel focus, Esc, 44pt buttons, reduced-motion via tokens. Bulk bar’s as-built `px-3 py-1 text-xs` trash control is below 44pt — **out of scope to restyle the bar** except the confirm swap. Do not introduce a new emoji trash glyph; Import Manager already uses SVG `IconTrash`.

Light/dark: kit dialog uses `--color-surface` / `--color-overlay` / `--color-destructive`. New badges must not use raw `red-50` forever-boxes.

Narrow: kit stacks Cancel above Confirm (`flex-col-reverse`). Sheet already stacks actions. No new mobile layout.

### O9 — Isolation (design)

PPL-11 freeze list is correct for chrome too. No Options Lab heatmap/LIM/Analyzer restyle. No OPF cards. No Market Bus header marks. Journal/Reports consume domain; this Spec does not restyle those apps (already stated). Echo will FAIL a later visual review whose diff includes `web/components/options-lab/**`.

---

## Flagged ideas

| ID | Idea | Why flagged | Discuss with |
|----|------|-------------|--------------|
| FI-PPL-E1 | Declarations **member chrome** (how the member names an incomplete cycle without a fake fill) | OD-22 is store shape. There is no sheet/blotter control yet. Do not invent a wizard in W1/W2. When OD-22 is disposed, Echo reviews before Charlie builds. | Coach + Echo + Tango + India |
| FI-PPL-E2 | Hold-boundary **visual** once Coach names agreement direction (India FI-PPL-1) | PPL-7 is a constraint without a picture. Same named-state grammar as B2 when the direction lands. | Coach + Hotel + Echo |
| FI-PPL-E3 | Sentence-case **Delete** vs Trade Log vernacular **Trash** on bulk / sheet triggers | O3. Confirm button is Delete (HI Spec §6.3). Trigger labels may stay “Delete this TO OPEN” (as-built) or align later. Not OD-19. | Coach + Tango + Echo |

Juliet’s §11 inventory (OD-19/21/23/24, wizard vs two, soft-trash, as_of TZ, non-integer qty, PATCH, import-commit, IB, S-3, matcher rewrite PARKED) is **not** discarded. Echo does not add Autofilter copy as a flag — it is B2 law that the token stays OPEN.

India FI-PPL-1 / FI-PPL-2 remain India’s. Not duplicated as Echo product flags.

**Flagged ideas: inventory intact** plus the three Echo chrome flags above.

---

## Build disposition

**RETURNED** (implementation readiness only — not product deletion)

Juliet transcribes B1–B2 into the draft (confirm-surface list + §8 chrome grammar). Do not answer OD-19. Do not pick OD-21. Do not invent an Autofilter token as law. Do not restyle Options Lab.

**Pass (no block):**

- Close vs delete are distinct transitions; OD-19 left OPEN
- Kit `AlertDialog` / `useConfirm` named; in-drawer forever and `window.confirm` banned **as law** (B1 is the missing **surface list**, not the principle)
- Destructive pattern in §5.4 already matches HI Spec §6.3 (name, consequence, Cancel + Delete, confirm not default-focused)
- Both Coach phrases kept; no third English word; OD-21 left to Hotel
- OPF is analogy only; Practice does not wear OPF chrome
- Isolation PPL-11 / no Options Lab restyle
- Coverage sentence kept (B2 locks it as calm named state, not a rewrite)
- Soft-trash not decided
- Density dialect: member blotter body may stay dense; new dialogs are kit modal elevation.3

India’s architecture RETURNED still stands. Echo + Tango + Hotel may still read the draft; this file is not a GO.

---

*Echo · Phase 3 · 2026-09-13 · spec not edited · parents not edited*
