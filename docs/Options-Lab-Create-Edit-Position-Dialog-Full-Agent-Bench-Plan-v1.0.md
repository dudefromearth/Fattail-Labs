# Options Lab Create / Edit Position Dialog — Full Agent Bench Plan v1.0

**Date:** 2026-09-11
**Plan revision:** **v1.0**
**Canonical filename:** `docs/Options-Lab-Create-Edit-Position-Dialog-Full-Agent-Bench-Plan-v1.0.md`
**Owner (orchestration):** Juliet
**Authority:** Coach (GO / ship)
**W0 artifact:** [`agents/go/DLG-W0.md`](../agents/go/DLG-W0.md) — Delta reads **this file**, not chat (**DL-328**).
**Board:** [`agents/p-options-lab-create-edit-dialog/`](../agents/p-options-lab-create-edit-dialog/)
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · [`AGENTS.md`](../AGENTS.md)

This is a specified program with an orchestrator, phases, agent seeds and gates. It is **not a
fourth one-off.** PC8-G at `71a9ab5` closed the packet it was given. The instruction it was given
was the defect. This plan executes Spec v0.4, which replaces that instruction.

### v1.0 changelog

| # | Change |
|---|---------|
| 1 | First plan. Live contract is Dialog Spec **v0.4**. Identified by version and the content check in §3, not by checksum. Prior Spec v0.3 remains on disk as the baseline; India does **not** flag it as a W0-3 stray |
| 2 | **Theme before chrome.** DLG1 (tokens, light/dark, named code-surface token) gates DLG2 (layout). Restyling on card tokens and then re-theming is the loop just paid for |
| 3 | **India signs the `surface` mechanism at W0-4** before any phase implements against it. DLG-VOCAB-1/2/3 are settled. A phase that re-derives them is **FAIL** |
| 4 | PC-VOCAB-1 is superseded on this dialog. PC-VOCAB-2 and PC-VOCAB-8 stand. Frozen Position Control Spec v1.2 is **not edited**. Lima records the supersession in the decision log and flags it for v1.3 |
| 5 | Scope is this dialog. One component, two hosts. No IKI fork. No modal. No second save path. No Preview, entry time, or Submit |

**Primary law:**

| Doc | Path | Status |
|-----|------|--------|
| **Create / Edit Position Dialog Spec v0.4** | [`Specs/FatTail-Labs-Options-Lab-Create-Edit-Position-Dialog-Spec-v0_4.md`](../Specs/FatTail-Labs-Options-Lab-Create-Edit-Position-Dialog-Spec-v0_4.md) | Live contract. **BUILD AUTHORITY.** Identified by version, not checksum. Prior v0.3 stays on disk unchanged |
| Position Control Spec v1.2 | [`Specs/FatTail-Labs-Options-Lab-Position-Control-Spec-v1_2.md`](../Specs/FatTail-Labs-Options-Lab-Position-Control-Spec-v1_2.md) | Frozen. **PC-VOCAB-1 superseded** by DLG-VOCAB-1/2/3. PC-VOCAB-2 · PC-VOCAB-8 · PC5 · lock · script content · classifier **unchanged** |
| Human Interface Spec v1.0 | [`Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md`](../Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md) | Type ramp · `--hit-min` · tokens · light/dark · dialog conduct. Shell, headers, buttons, sheets, dialogs stay HIG. Never ToS-treat the Labs chrome |
| North star | [`Specs/FatTail-Labs-North-Star-Member-Ethos-Spec-v1.2.md`](../Specs/FatTail-Labs-North-Star-Member-Ethos-Spec-v1.2.md) | Process copy; no profit theater |
| OPF Spec | [`Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md) | Package quote. DL-309 parent. No pricing-path rewrite |

**Baseline commit (as-built gap map):** `71a9ab5` (PC8-G-G PASS — dialog built as a blotter fragment).
**Evidence basis:** Spec v0.4 §1 table · `agents/p-options-lab-position-control/gate-reports/PC8-G-G.md` · `gate-reports/pc8-g/dialog.png`.

**MACHINE — all work against this Spec and this plan runs on COACH'S MACBOOK (dev).** No staging. No Mini Two. No Dude Two. Nothing in this plan deploys. No backend. No migration.

**BUILD AUTHORITY is Spec v0.4 as of W0-0 GO.** Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.
Delta gates: **PASS / FAIL / BLOCKED** with evidence — **never waived**.
**Coach may overrule** a specialist finding via **DL entry with reasoning** — that is **not** a gate waive.

Coach Content Law (doctrine §11): nothing of Coach’s is removed from the Spec. Objections sit **beside** the text.

**Every product decision in Spec v0.4 is already stamped.** §8 is a decisions table, not open questions. This plan does not introduce engineering defaults for product law. Implementation routing that the Spec leaves unnamed is listed in §14 — Charlie takes the thinner existing path; if that path does not exist, **stop and ask**. Do not choose.

---

## 0. Mission (one screen)

Give the member a **designed Create / Edit Position dialog**: themed, HIG, one commit and one
dismiss, a symbol picker that picks, on the free-floating panel already built.

```text
ONE shared control component (TosControls)
  ├── surface="card"    — blotter appearance (PC8). Behaviour unchanged.
  └── surface="dialog"  — HIG appearance (this program). Behaviour identical.

ONE PositionBuilder
  ├── host /app/options-lab/analyzer  → OpfRiskAnalyzer
  └── host /app/iki/analyzer          → OpfRiskAnalyzer
      No IKI fork.
```

| Litmus | Spec | Ship meaning |
|--------|------|----------------|
| **1 It is a dialog, not a blotter fragment** | §1 · §2 | Light and dark. Application tokens. No `OL_DATA` / `OL_CHROME` / hex / palette classes in the dialog |
| **2 Every control works** | DLG-FN-1 | Nothing inert. Symbol picks. Analyze and Update commit through the existing `onSave` |
| **3 One commit, one dismiss** | DLG-HIG-4 | Create: Analyze · Cancel. Edit: Update · Cancel. No Done. Escape already wired — keep it |

**First smoke after DLG4:**
(1) Settings → light: dialog follows; Settings → dark: dialog follows.
(2) Symbol list is the universe; a no-chain row reads "no chain held" and will not select; picking a held symbol does not move the analyzer header selector.
(3) Create Analyze writes once through `onSave`; Edit Update writes once through the same `onSave`; Cancel / Escape writes nothing.

---

## 1. As-built honesty (checkout `71a9ab5`)

Spec §1 is the oracle. Do not soften it.

### 1.1 Keep (do not rebuild)

| Area | Path | Note |
|------|------|------|
| Dialog host | `web/components/options-lab/PositionBuilder.tsx` | One panel, two bind modes (PC-REC-8). **Do not split the file.** Rules of Hooks |
| Shared controls | `web/components/options-lab/TosControls.tsx` | `TosStepper` · `TosQtyControl` · `TosPadlock` · `CardMenuField`. **One component, two appearances.** Never fork |
| Card call sites | `web/components/options-lab/AnalyzerPositionsList.tsx` | Only consumer besides the dialog. Receives `surface="card"`. **No restyle** |
| Analyzer host | `web/components/options-lab/OpfRiskAnalyzer.tsx` | Only importer of `PositionBuilder`. Book owner. `{ symbol, setSymbol, universe }` already here (~249). Session selector `analyzer-symbol-select` (~2273) stays the session's |
| IKI host | `web/app/app/iki/analyzer/page.tsx` | Renders `OpfRiskAnalyzer`. **Do not fork** |
| OL host | `web/app/app/options-lab/analyzer/page.tsx` | Renders `OpfRiskAnalyzer`. **Do not fork** |
| Theme plane | `web/styles/tokens.css` · `web/components/appearance/AppearanceRoot.tsx` | `data-theme` / `data-font-size` / `data-density` / `data-corners` / `data-tint` already on the document root. Dialog consumes them. Echo may **add** the named code-surface token. Do not invent a second appearance plane |
| Universe | `web/lib/optionsLabContext.tsx` · `useOptionsLab()` | Same source Spec names. No new list |
| Chain | `web/lib/options-lab/useBuilderChain.ts` | Existing OPF path. Host currently calls `useBuilderChain(symbol, …)` with the **session** symbol (~861) |
| Book / lock / script | `analyzerBook.ts` · `CardLockState` · `tosGenerator.ts` | Untouched. Script **content** still `@LMT` (PC-LOCK-7) |
| Presentation | `panelPos` · `aria-modal="false"` · `PANEL_W = 770` · Escape ~794–801 | **Keep.** Modal is not authorised |
| Tests | `npx tsx` + `node:assert/strict` · Playwright `web/e2e/` | **No Vitest.** Keep `builder-live-package-price` · `builder-padlock` · `builder-template` · `builder-tos-script`. Analyze testid stays `builder-analyze` (not `position-builder-analyze`) so PC5 AT-PC-23's grep for the old id stays meaningful |

### 1.2 Critical / blocking defects (Spec §1)

| Defect | Law | First packet that closes it |
|--------|-----|-----------------------------|
| Shared controls have one appearance (the blotter's) | DLG-VOCAB-1/2/3 | **DLG0** (mechanism) then **DLG1** (dialog look) |
| `OL_DATA` ×15, `OL_CHROME` ×5, `FIELD_FILL`, `cardSelect`, `h-[18px]` | DLG-THEME-4 | **DLG1** |
| `bg-emerald-600` / `bg-red-600` Buy/Sell; `#22c55e` / `#ef4444` payoff stroke; `#0a0a0e` shell | DLG-THEME-4 | **DLG1** |
| No light theme; `[color-scheme:dark]` hardcoded | DLG-THEME-1/2 | **DLG1** |
| Header Close (edit) + footer Cancel = two dismissals. Create still has Submit. Analyze has **no onClick** | DLG-HIG-4 · DLG-LAYOUT-7 · DLG-FN-1 · DLG-FN-9 | **DLG2** (chrome) · **DLG4** (wire `onSave`) |
| Preview block and entry-time picker still render | §3 · DLG-FN-8 · AT-DLG-11 | **DLG2** |
| Symbol `<select>` with one `<option>` and inert `onChange` (`/* session symbol is host-owned */`, ~1682–1692) | DLG-SYM-1 | **DLG3** |

Verified keep that later packets must not break:

- Escape is already wired (~794–801). **Keep.**
- QTY steppers already preserve sign (`+1→+2`, `−2→−3`). **Keep.** AT-DLG-2 re-asserts.
- DEBIT / POS on leg row 1 only. **Keep.**
- Free-floating, `aria-modal="false"`, ~770px. **Keep.**
- `onSave` is the only save callback. Analyze and Update both map onto it. **No second path.**

### 1.3 Neighbor boards (India artifact-quote required)

This program **does not assert** another board’s PASS/FAIL. It does not reopen PC0–PC9b.

| Neighbor | Isolation |
|----------|-----------|
| `p-options-lab-position-control` | **Closed** (DL-689). Frozen Spec v1.2. This program supersedes **PC-VOCAB-1 only**. Do not reopen PC packets, do not edit v1.2, do not restyle the card beyond `surface="card"` |
| `p-options-lab-position-builder` | Prior PB program. Do not reopen as a second SoR |
| `p-options-pricing-foundation` | OPF L0–L4 frozen. Consume PackageQuote. **No pricing path changes** (DLG-FN-7) |
| Heatmap / Runner / Market Bus / Quant / LIM / Sessions / Trade Log | **DL-539 freeze stands.** Three-OK record is in §2 |

Shared files other boards also touch: `web/styles/tokens.css` (Echo **additive** named code-surface token at DLG1), `web/components/options-lab/TosControls.tsx` (required `surface` prop), `web/components/options-lab/AnalyzerPositionsList.tsx` (`surface="card"` only).

---

## 2. DL-539 — three-OK record (copy onto the GO token)

DL-539 is a **standing no-drift rule**. It names Options Lab. An agent who opens a frozen tree needs **three successive Coach OKs** on the token.

**This program is Coach directing Analyzer dialog work**, not an agent opening the tree on its own. Record on `DLG-W0.md`:

1. Coach commissioned Position Control and closed it on this machine (DL-689 · `71a9ab5`).
2. Coach declared the dialog instruction ("dark theme on the card's tokens") was the defect, and asked for a designed dialog Spec.
3. Coach directed Spec v0.1–v0.4 through review and answered §8 as law.
4. Coach stamped v0.4 **BUILD AUTHORITY** and directed this full agent bench plan. No packet, no seed-as-one-off, no fourth rebuild.

The freeze is **not lifted** for other trees. Packet allowlists stay mandatory.

---

## 3. Product locks (law at W0-0)

These are **Coach’s Spec**. They become L-locks when the GO token is ticked. Until then, seeds call them **provisional**.

W0-0’s first act: confirm the live Spec is **v0.4**.

Content check (a zero, or a header that is not v0.4, means the wrong file: **BLOCKED**):

```text
head -1 Specs/FatTail-Labs-Options-Lab-Create-Edit-Position-Dialog-Spec-v0_4.md
  → must contain "Spec v0.4"
grep -c 'DLG-VOCAB-3'     → non-zero
grep -c 'AT-DLG-15'       → non-zero
grep -c 'Do not build Preview, Entry time, or Submit' → non-zero
grep -c 'The Done link'   → non-zero
```

India greps every L1–L20 citation and every `AT-DLG-*` against that file. Delta confirms the sha1 recorded in `agents/go/DLG-W0.md` against disk — Coach does not compute a hash.

| ID | Lock | Spec |
|----|------|------|
| **L1** | Card and dialog share **behaviour and semantics**, not appearance. Mechanism: required `surface` `"card"` \| `"dialog"` stamping `data-surface`. One component, two appearances. Never two components. Never one look forced onto both. A shared control without `surface` is a defect | DLG-VOCAB-1 · 2 · 3 |
| **L2** | Scope is **this dialog only**. Other Labs dialogs are a later program | §8.1 |
| **L3** | Presentation stays **free-floating** (`panelPos`, `aria-modal="false"`, ~770px). Modal is not authorised | DLG-LAYOUT-8 · §8.2 |
| **L4** | **One commit, one dismiss.** Create: Analyze · Cancel. Edit: Update · Cancel. **Done is removed.** Escape dismisses (already wired — keep) | DLG-HIG-4 · DLG-LAYOUT-1 · 7 · §8.3 |
| **L5** | Symbol belongs to the **position's underlying only**. Analyzer selector stays the session's. Do not call `setSymbol` from this dialog | DLG-SYM-7 · §8.4 |
| **L6** | Call / Put is Structure-level Right for `TEMPLATE_HAS_SIDE`, hidden for two-right structures. Per-leg right stays on Add Leg | DLG-LAYOUT-3 · §8.5 |
| **L7** | Light and dark are both first-class. Theme follows the member's Settings preference (`data-theme` on the document root). `tokens.css` already defines both | DLG-THEME-1 · 2 |
| **L8** | No card token and no hardcoded colour in the dialog. Exception: one named **code-surface token** on the script block, defined to stay dark in both themes. The exception is the token, never a hex | DLG-THEME-4 |
| **L9** | **Do not build Preview, entry time, or Submit** — even though the reference PNG draws them. §3 overrides the PNG | §3 · DLG-FN-8 · DLG-LAYOUT-7 |
| **L10** | Analyze and Update both map onto the **single existing `onSave`**. No second save path | DLG-FN-9 |
| **L11** | No pricing path changes. Dialog displays what existing pricing produces | DLG-FN-7 |
| **L12** | One component, two hosts. **No IKI fork** | Spec header |
| **L13** | Opening Edit writes nothing. Create stays off-book until commit. Cancel discards | DLG-FN-5 · PC5 |
| **L14** | Hit targets meet `--hit-min` **at rest** in the dialog. **No grow-on-hover anywhere in the dialog.** Card keeps PC-HIG-8 (grow-on-hover) — that is appearance, selected by `surface` | DLG-HIG-3 |
| **L15** | Quantity steppers preserve sign. Basis and POS stated once | DLG-FN-2 · 4 |
| **L16** | Locked basis does not survive a symbol change. Unlock and re-derive, visibly. Symbol control stays enabled while locked | DLG-SYM-8 |
| **L17** | Package count carries across a symbol change; presets and widths re-resolve. Multiplier follows the new symbol | DLG-SYM-6 · 9 |
| **L18** | PC-VOCAB-2 (card ⊂ dialog for structure) and PC-VOCAB-8 (add/remove leg is the dialog exclusive) **unchanged** | Spec §2 |
| **L19** | Dev machine only until Coach names a promotion host | Spec header · this plan header |
| **L20** | `AnalyzerPosition` remains the only mutable record. Classifier, lock engine, script **content**, undo, promotion — untouched | Spec §6 |

**Settled. Do not re-derive L1.** India signs it at W0-4. A phase seed that restates PC-VOCAB-1 as "one appearance" is **FAIL**.

---

## 4. Sequencing (dependency facts)

Any plan that violates one produces the loop just paid for, or a visibly broken intermediate:

1. **India signs the `surface` mechanism before any phase implements against it.** (Coach. W0-4 is the artifact.)
2. **Theme comes before chrome.** DLG1 (tokens, light/dark, strip card tokens) gates DLG2 (layout, verbs, removals). Restyling on `OL_DATA` and then re-theming is forbidden.
3. **Chrome comes before symbol.** DLG2 lands Structure / Shape / Position / script / actions. DLG3 replaces the inert symbol control inside that chrome, already themed.
4. **Symbol comes before the remaining behaviour gate.** DLG3 must not ship an inert picker. DLG4 wires Analyze/Update, Return-key, hit-min-at-rest, and re-asserts PC5.
5. **Echo and Tango sign the visual and member read before program PASS.** DLGZ is not a paperwork close.

```text
W0  (India surface sign is an entry gate on DLG0)
 └── DLG0  surface prop + data-surface     [India W0-4 APPROVED]
      └── DLG1  theme (tokens, light/dark, grep)     [Echo sits]
            └── DLG2  chrome / layout / verbs / removals
                  └── DLG3  symbol (universe, OPF-held, no setSymbol)
                        └── DLG4  behaviour (onSave, Return, PC5, hit-min)
                              └── DLGZ  Echo + Tango + Delta AT-DLG-1…15
```

No parallelism on `PositionBuilder.tsx`. TosControls card call sites are DLG0 only.

**DLG0 is not a pre-GO exception.** Spec: no implementation before GO.

---

## 5. Phase DAG (gates)

| Phase | Name | Depends | Exit ATs (named). Gate still checks Spec laws covering **every file touched** |
|-------|------|---------|-------------------------------------------------------------------------------|
| **W0** | Spec GO · hash · DL · board · three-OK · India `surface` sign | — | Spec v0.4 **BUILD AUTHORITY**. W0-4 APPROVED |
| **DLG0** | Required `surface` prop · `data-surface` · card stays blotter · behaviour identical | W0-4 | **AT-DLG-15** |
| **DLG1** | Dialog tokens · light+dark · named code-surface token · strip card tokens/hex/palette | DLG0 | **AT-DLG-3 · 4 · 5** |
| **DLG2** | Structure / Shape / Position / script / actions. Remove Preview, entry time, Submit, Done. Keep free-floating | DLG1 | **AT-DLG-6 · 11** |
| **DLG3** | Real symbol control from universe. No-chain disabled. Re-resolve. Unlock. Multiplier. Do not `setSymbol` | DLG2 | **AT-DLG-12 · 13 · 14** |
| **DLG4** | Analyze/Update → existing `onSave`. Return except in value fields. Hit-min at rest. QTY sign. PC5 | DLG3 | **AT-DLG-1 · 2 · 7 · 8 · 9 · 10** |
| **DLGZ** | Visual + member read · full AT pack per criterion | all | **AT-DLG-1…15** all PASS |

**A gate that checks only what its phase named is how the last three escapes happened.** Delta's report is the fifteen-row table in §7 for **every** phase gate, with later ATs marked **BLOCKED** (not yet in scope) rather than skipped. Named-exit ATs must be PASS. Previously-gated ATs must remain PASS. Untouched later ATs are BLOCKED with the phase that owns them named.

Two ATs are greps, not opinions:

- **AT-DLG-4** — zero card tokens, zero hex, zero palette classes in `PositionBuilder.tsx`; one named code-surface token excepted.
- **AT-DLG-15** — `surface` prop present on every shared control.

---

## 6. Phase detail and seeds

Juliet materializes seeds under `agents/p-options-lab-create-edit-dialog/seeds/`. Names below are normative. **Each seed names an exact file list that is a subset of §8.** Delta **FAIL**s extra files.

### W0 — Board GO

| Seed | Agent | Intent |
|------|-------|--------|
| **W0-0** | **Coach** | Stamp `agents/go/DLG-W0.md`. First act: Spec **v0.4** content check (§3). **BUILD AUTHORITY**. L1–L20 LOCKED. Three-OK recorded. JR1–JR6 accept unless Coach ticks otherwise |
| **W0-1** | **Lima** | DL entry (next id after DL-689): Spec v0.4 accept · **PC-VOCAB-1 superseded** by DLG-VOCAB-1/2/3 · PC-VOCAB-2/8 unchanged · PC-REC-9 dialog verbs superseded on this surface (Create Analyze, Edit Update; Done removed) · PC8-E "entry time lives in the dialog" superseded by §3 · carry into Position Control v1.3 · DL-539 three-OK verbatim · **no v1.2 edit** |
| **W0-2** | **Juliet** | CHARTER · ORCHESTRATOR · seeds README · gate-reports/ · per-packet allowlists (subset of §8). Confirm seed files match this plan |
| **W0-3** | **India** | Parent Spec paths intact · no MSC · live Spec is v0.4 (same content check as W0-0) · grep every L-lock and `AT-DLG-*` · freeze isolation · **confirm `Specs/` holds only versioned feature contracts for this program** — v0.3 is the prior baseline, not a stray; this plan does not live in `Specs/` |
| **W0-4** | **India** | **Architecture sign of the `surface` mechanism.** Verdict APPROVED or RETURNED. Does **not** re-derive DLG-VOCAB-1/2/3. Signs: required prop `"card"` \| `"dialog"`; `data-surface` on the root of `TosStepper`, `TosQtyControl`, `TosPadlock`, `CardMenuField`; appearance selected from that attribute; behaviour identical; card call sites `surface="card"`; dialog `surface="dialog"`; never two components; never one look forced onto both. Names the stop condition in §14 as implementation routing, not product law. **DLG0 may not start without APPROVED** |
| **W0-G** | **Delta** | Token complete · sha1 in `DLG-W0.md` matches disk · DL same day · W0-4 APPROVED · ternary |

### DLG0 — Surface mechanism (first code)

**Laws:** DLG-VOCAB-1 · 2 · 3
**Depends:** W0-0 GO + **W0-4 APPROVED**
**Files (subset):** `web/components/options-lab/TosControls.tsx` · `web/components/options-lab/AnalyzerPositionsList.tsx` (`surface="card"` **only**) · `web/components/options-lab/PositionBuilder.tsx` (`surface="dialog"` on shared controls; **no restyle**) · `web/lib/options-lab/dlgSurface.test.ts` (new) · `web/lib/options-lab/tosCard.test.ts` (only if existing share-tests need `surface=` on the card)
**Out:** restyle, layout, symbol, tokens.css, `OpfRiskAnalyzer.tsx`, any second component

1. Add required `surface: "card" | "dialog"` to `TosStepper`, `TosQtyControl`, `TosPadlock`, `CardMenuField`. Stamp `data-surface={surface}` on each root.
2. Card call sites in `AnalyzerPositionsList` pass `surface="card"`. Appearance **byte-identical** to `71a9ab5` card (PC-HIG-8 grow-on-hover remains on card).
3. Dialog call sites in `PositionBuilder` pass `surface="dialog"`. Appearance may still be the blotter's in this packet — **DLG1** is the theme packet. Behaviour identical (step, lock, pick).
4. TypeScript: a call site without `surface` does not compile. That is the defect DLG-VOCAB-3 names.
5. Test AT-DLG-15: the same component renders in both surfaces with different `data-surface` and identical callbacks / sign-preserving step.

**ATs named:** AT-DLG-15
**Live:** card still looks like the blotter. Dialog still looks like `71a9ab5` (ugly, themed-as-card) **on purpose** — theme is DLG1.
**Gate DLG0-G.** Echo not required. India may artifact-quote W0-4. Delta greps `surface` on all four exports and both call-site files. Card `tosCard.test.ts` ATs that are not entry-time stay green.

### DLG1 — Theme (before chrome)

**Laws:** DLG-THEME-1…5 · DLG-HIG-1 (type scale begins here) · DLG-HIG-3 (dialog hit-min at rest; no grow-on-hover on `surface="dialog"`)
**Depends:** DLG0-G PASS
**Files (subset):** `web/styles/tokens.css` (Echo **additive** named code-surface token only) · `web/components/options-lab/TosControls.tsx` (dialog appearance branch) · `web/components/options-lab/PositionBuilder.tsx` (consume application tokens; strip card tokens / hex / palette) · tests named below
**Out:** layout reorder, symbol picker behaviour, `onSave` wire, Preview/Submit/Done removals (those are DLG2), card appearance changes, new appearance plane, editing `AppearanceRoot.tsx`

1. **Echo names** the code-surface token in `tokens.css`. Defined to stay dark in both `[data-theme="light"]` and `[data-theme="dark"]`. Lima records the token name in the same-day DL. The exception is the token, never a hex in `PositionBuilder.tsx`.
2. Dialog (`data-surface="dialog"` and `PositionBuilder` shell) renders from existing application tokens: `--color-surface`, `--color-label`, `--color-tint`, `--color-success`, `--color-destructive`, `--text-*`, `--space-*`, `--radius-*`, `--hit-min`, `--elevation-*`. Honour `data-theme`, `data-font-size`, `data-density`, `data-corners`, `data-tint` the way the rest of the product does. Charlie does **not** invent a parallel token set.
3. Strip from `PositionBuilder.tsx`: `FIELD_FILL`, `OL_DATA`, `OL_CHROME`, `cardSelect`, `h-[18px]`, literal hex, Tailwind palette classes (`bg-emerald-600`, `bg-red-600`, `bg-blue-600`, `bg-orange-600`, `#22c55e`, `#ef4444`, `#0a0a0e`, `text-emerald-400`, …).
4. `surface="dialog"` controls: `--hit-min` at rest; **no** `group-hover/step` grow. `surface="card"` keeps PC-HIG-8. That is appearance, not a second stepper.
5. Buy/Sell and payoff stroke use `--color-success` / `--color-destructive` (or the Echo-named equivalents already in `tokens.css`). Never palette classes.
6. Script block uses only the named code-surface token. Content unchanged (`generateTosScript`, `@LMT`).

**ATs named:** AT-DLG-3 · AT-DLG-4 · AT-DLG-5
**Echo sits at DLG1-G** on token mapping and contrast in both themes (DLG-THEME-5).
**Gate DLG1-G.** Grep commands are in §7. A single remaining `OL_DATA` in `PositionBuilder.tsx` is FAIL, not a nit.

### DLG2 — Chrome / layout

**Laws:** DLG-LAYOUT-1…9 · DLG-HIG-1 · 2 · 4 · 9 · §3 · DLG-FN-8
**Depends:** DLG1-G PASS
**Files (subset):** `web/components/options-lab/PositionBuilder.tsx` · characterization tests this packet restates (`web/lib/options-lab/positionBuilder.pc5.test.ts` · `web/lib/options-lab/tosCard.test.ts` entry-time / Submit / Close assertions only)
**Out:** symbol behaviour (DLG3), `onSave` wire (DLG4), `TosControls` restyle, host restyle, modal, PNG-faithful Preview / entry time / Submit

1. Title: "Create Position" / "Edit Position" with symbol and spot context beneath. **No Done, no Close in the header.**
2. Structure: **strategy selector first**. Directly beneath it, one row: payoff icon · Buy/Sell · derived name. Right (Call/Put) Structure-level for `TEMPLATE_HAS_SIDE` only; hidden for straddle / strangle / iron fly / iron condor. Per-leg right stays on Add Leg.
3. Shape: centre, width, expiration, legs. Position: basis and package count **once**.
4. ToS script: labelled block, copy action, code-surface token. Content unchanged.
5. Actions: Create **Analyze · Cancel**. Edit **Update · Cancel**. Committing action visually dominant (HIG). Analyze may still lack `onClick` until DLG4 — but it is the primary control, it is not Submit, and it uses `data-testid="builder-analyze"` (never `position-builder-analyze`).
6. **Remove** Preview block, entry-time controls (`builder-entry-at` and the hour/min/AM-PM `CardMenuField`s), Submit (`position-builder-submit`), header Close (`position-builder-close`).
7. Keep free-floating: `panelPos`, `aria-modal="false"`, `PANEL_W = 770`, drag handle, Escape.
8. Restate characterization that this Spec supersedes (do not delete the files):
   - `positionBuilder.pc5.test.ts` AT-PC-23 currently requires header Close, Submit, and **absence of `>Update<`**. Restate to: Escape kept; no `position-builder-analyze`; Create Analyze+Cancel; Edit Update+Cancel; no header Close; no Submit. Keep AT-PC-04 (opening Edit writes zero).
   - `tosCard.test.ts` currently requires `builder-entry-at`. Restate to **absence** of entry-time controls (DLG-FN-8). Keep padlock / QTY-sign / shared-control assertions.

**ATs named:** AT-DLG-6 · AT-DLG-11
**Echo sits** on side-by-side vs `docs/reference/tos/dialog-target-layout.png` **as amended by §3**, both themes, 100% zoom.
**Tango sits** on Analyze / Update / Cancel copy and the one-commit-one-dismiss read.
**Gate DLG2-G.**

### DLG3 — Symbol

**Laws:** DLG-SYM-1…9
**Depends:** DLG2-G PASS
**Files (subset):** `web/components/options-lab/PositionBuilder.tsx` · `web/lib/options-lab/dlgSymbol.test.ts` (new) · `web/components/options-lab/OpfRiskAnalyzer.tsx` **only if** Charlie routes universe/chain as props; **prop-wire only, zero chrome**. Prefer consuming the existing hooks inside `PositionBuilder` so the host is untouched (see §14)
**Out:** session `setSymbol`, new universe API, new OPF endpoint, hardcoded symbols, disabling the symbol control while locked, carrying strikes/widths/prices/multiplier across, restyle

1. Real control. Choices from `useOptionsLab()`'s `universe` — the same source `OpfRiskAnalyzer` already uses (~249). Unloaded universe reads **"Loading symbols…"**, never a one-option finished choice.
2. OPF truth (DL-309): only symbols with an OPF-held chain are selectable. Others are listed and **disabled**, reading **"no chain held"**. Never selectable-then-silently-broken.
3. On change: write **`position.underlying` only**. Do **not** call `setSymbol`. Do not rewrite `?symbol=` or `sessionStorage`. The analyzer header selector must not move.
4. Hydrate the new underlying through the **existing** `useBuilderChain` path (the host already calls it with the session symbol). Affected fields read **"Loading chain…"** until the ladder is in hand (DLG-SYM-5 · PC-CHAIN-6). Then re-resolve centre, width, legs, basis onto the new listed grid. No strike, width or price carries across.
5. Multiplier follows the new symbol's existing `profile.contract_multiplier` (universe row → `coerceSymbolProfile`). Never carry SPX ×100 onto MES. Package value and script recompute.
6. Locked basis: **unlock and re-derive**, and say so in the place the member is looking. Old debit never appears on the new instrument. Symbol control stays enabled while locked.
7. Package count carries. Strategy presets and saved widths re-resolve to the new grid, announced through the loading state, never silently reused.

**Stop and ask** (do not invent) if the existing chain path cannot hydrate a non-session symbol without `setSymbol` or a new endpoint. See §14.

**ATs named:** AT-DLG-12 · AT-DLG-13 · AT-DLG-14
**Tango sits** on "no chain held" / "Loading symbols…" / "Loading chain…" / unlock-on-symbol-change copy (DLG-HIG-8).
**Gate DLG3-G.** Live: pick a held symbol in the dialog; header `analyzer-symbol-select` unchanged; book still multi-symbol.

### DLG4 — Behaviour

**Laws:** DLG-FN-1…9 · DLG-HIG-3 · 5 · 6 · 7 · 9
**Depends:** DLG3-G PASS
**Files (subset):** `web/components/options-lab/PositionBuilder.tsx` · tests for named ATs · `positionBuilder.pc5.test.ts` `onSave` assertions
**Out:** layout redo, token redo, pricing path, second save callback, grow-on-hover on dialog

1. **Every control works.** Analyze (`builder-analyze`) and Update call the existing `onSave`. No second save path. Create stays off-book until that call. Edit live-bind unchanged (PC5); Update is the commit the member sees; opening Edit still writes zero.
2. Return commits Analyze/Update **except** when focus is in a value field (strike, width, centre, quantity, price) — there Return commits the field's own edit.
3. Escape still dismisses.
4. Tab order follows reading order; focus visible.
5. Hit targets `--hit-min` at rest on dialog controls. **No grow-on-hover.**
6. QTY sign preserved (re-assert). Name, legs, basis, script re-derive on the same tick for in-chain edits (DLG-FN-3).
7. Nothing moves except in response to something the member did (DLG-HIG-9 · AT-DLG-10 · PC litmus 2).

**ATs named:** AT-DLG-1 · 2 · 7 · 8 · 9 · 10
**Gate DLG4-G.** CI asserts opening Edit writes nothing (AT-PC-04 kept). Playwright: Analyze clicks `onSave` once; Update clicks the same `onSave` once.

### DLGZ — Close

| Seed | Agent | Intent |
|------|-------|--------|
| **DLGZ-0** | **Echo** | Visual read, both themes, 100% zoom, vs PNG **as amended by §3**. Contrast. Type hierarchy. Hit-min at rest. Card still blotter |
| **DLGZ-1** | **Tango** | Member read: one commit one dismiss; symbol belongs to the position; "no chain held" is honest; no profit copy; bleeding-trader respect |
| **DLGZ-2** | **Lima** | Spec §1 gap map → closed or named residual. DL program close. v1.3 carry-forward for PC-VOCAB-1 noted, not executed |
| **DLGZ-3** | **India** | Diff ⊆ last packet allowlist union. No MSC. No IKI fork. Frozen v1.2 unedited. `surface` still required |
| **DLGZ-G** | **Delta** | Full AT-DLG-1…15 table, **per criterion, PASS / FAIL / BLOCKED**. Greps AT-DLG-4 and AT-DLG-15 re-run. No false greens. **No deploy** |

---

## 7. Acceptance pack (Delta-checkable)

IDs are **Spec §7**. This plan does not drop a Spec row. Oracle = Spec assertion text.

**Evidence classes:** `tsx` = `npx tsx` bare Node · `pw` = Playwright · `grep` = static · `a11y` = hit-rect + keyboard · `live` = Coach MacBook walk · `visual` = screenshot vs PNG+§3.

Every phase gate files this table. Named-exit rows must be PASS. Earlier-gated rows must remain PASS. Later rows are BLOCKED with the owning phase named — **never omitted**.

| ID | First phase | Class | Owner | Check |
|----|-------------|-------|-------|-------|
| AT-DLG-1 | DLG4 | pw + live | Kilo · Charlie | Every control does what it says. Nothing inert. Includes Analyze `onClick` → `onSave`, Update → `onSave`, symbol `onChange` writes underlying. Grep: no `onChange={() => {` empty / `session symbol is host-owned` |
| AT-DLG-2 | DLG4 | pw | Kilo | Short-leg stepper −2 → −3; basis and `builder-tos-script` move on the same tick |
| AT-DLG-3 | DLG1 | pw | Echo · Kilo | Settings light → dialog light; Settings dark → dialog dark. Both directions. No `[color-scheme:dark]` hardcoded on the panel |
| AT-DLG-4 | DLG1 | **grep** | Delta | See commands below. Opinion is not evidence |
| AT-DLG-5 | DLG1 | pw | Echo · Kilo | `data-font-size="larger"` and `data-density="compact"` visibly change the dialog (type / `--hit-min`) |
| AT-DLG-6 | DLG2 | visual | Echo | Side-by-side `docs/reference/tos/dialog-target-layout.png` **as amended by §3**, 100% zoom, light and dark. Preview, entry time, Submit absent by law |
| AT-DLG-7 | DLG4 | a11y · pw | Kilo | Escape dismisses. Return commits primary **except** in strike / width / centre / quantity / price. Tab = reading order. Focus visible |
| AT-DLG-8 | DLG4 | a11y | Echo · Kilo | Dialog controls ≥ `--hit-min` at rest. No `group-hover/step` / growBox under `[data-surface="dialog"]` |
| AT-DLG-9 | DLG4 | tsx | Kilo | Opening Edit writes zero fields. Keep AT-PC-04 assertions (`Live bind: chrome only`; no `snapToListed` / `priceLegs` / `setPosition` in the edit-seed slice) |
| AT-DLG-10 | DLG4 | tsx + live | Kilo | Nothing moves except in response to the member. Quote tick is not a structure write |
| AT-DLG-11 | DLG2 | grep + pw | Delta · Kilo | Zero `position-builder-submit`. Zero `builder-entry-at`. Zero Preview block. Zero header Done/Close (`position-builder-close`). Footer Cancel remains |
| AT-DLG-12 | DLG3 | pw | Kilo | Options = universe. No-chain rows `disabled` and contain `no chain held`. Unloaded: `Loading symbols…` |
| AT-DLG-13 | DLG3 | pw | Kilo | Change symbol → strikes from the new chain; old strike gone; basis uses new `contract_multiplier`. Header `analyzer-symbol-select` unchanged (DLG-SYM-7) |
| AT-DLG-14 | DLG3 | pw | Kilo | Locked → change symbol → unlocks; old debit absent from the new instrument; symbol control was not disabled |
| AT-DLG-15 | DLG0 | **grep** + tsx | Delta · Kilo | See commands below. Same component, two appearances, identical behaviour |

### AT-DLG-4 grep (normative)

Run from `web/` against `components/options-lab/PositionBuilder.tsx`. Any match is FAIL except a reference to the Echo-named code-surface token (token name recorded in the DLG1 DL entry).

```bash
# Card tokens and 18px blotter floor
rg -n 'FIELD_FILL|OL_DATA|OL_CHROME|cardSelect|h-\[18px\]' \
  components/options-lab/PositionBuilder.tsx

# Literal hex (SVG stroke, shell, inline style)
rg -n '#[0-9A-Fa-f]{3,8}' \
  components/options-lab/PositionBuilder.tsx

# Tailwind palette classes (examples in Spec: bg-emerald-600, #22c55e)
rg -n '(bg|text|border|from|to|stroke|fill|ring|outline)-(emerald|red|green|blue|orange|yellow|zinc|slate|neutral|stone|gray|black|white|rose|lime|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|amber)(-[0-9]{2,3})?' \
  components/options-lab/PositionBuilder.tsx
```

All three must be empty, or contain only the named code-surface token. `var(--color-*)` and `data-surface` are allowed.

**TosControls dialog branch** (every phase that touched the file): `[data-surface="dialog"]` (and `surface === "dialog"`) must not use `FIELD_FILL` / `OL_DATA` / `OL_CHROME` / `cardSelect` / `h-[18px]` / hex / palette classes. The `surface === "card"` branch **may** — that is the blotter.

### AT-DLG-15 grep (normative)

```bash
# Each shared export takes surface and stamps data-surface
rg -n 'export function (TosStepper|TosQtyControl|TosPadlock|CardMenuField)' \
  -A 30 components/options-lab/TosControls.tsx
# required: surface: "card" | "dialog"  AND  data-surface

# Call sites
rg -n '<(TosStepper|TosQtyControl|TosPadlock|CardMenuField)[^>]*surface=' \
  components/options-lab/PositionBuilder.tsx \
  components/options-lab/AnalyzerPositionsList.tsx
```

Every JSX use of those four in both files passes `surface=`. A use without it is FAIL.

tsx: render (or source-assert) the same export at `surface="card"` and `surface="dialog"`; `data-surface` differs; `onUp` / `onDown` / lock callbacks are the same function identity pattern; card still has grow-on-hover classes; dialog does not.

### Gate report shape (normative)

`agents/p-options-lab-create-edit-dialog/gate-reports/<PHASE>-G.md` must contain:

1. Verdict line: **PASS** / **FAIL** / **BLOCKED**.
2. The fifteen-row table, one row per AT-DLG-1…15, each **PASS / FAIL / BLOCKED**, with evidence pointer (command output, screenshot path, or "owned by DLGn").
3. **Files touched** vs seed allowlist. Extra file = FAIL.
4. **Spec laws covering every file touched**, not only named ATs. If `TosControls.tsx` was touched, DLG-VOCAB-1/2/3 and card PC-HIG-8 are in the report even at DLG2.
5. Echo / Tango sign when the phase table seats them; absence is BLOCKED, not a skip.

---

## 8. File allowlist (indicative until W0-2)

**Seeds name an exact subset of this section. Delta FAILs any extra file.**

### 8.1 Expected create / heavy edit

| Path | Phase |
|------|--------|
| `web/lib/options-lab/dlgSurface.test.ts` | DLG0 (AT-DLG-15) |
| `web/lib/options-lab/dlgTheme.test.ts` | DLG1 (AT-DLG-4 grep wrapper + AT-DLG-3 notes) |
| `web/lib/options-lab/dlgSymbol.test.ts` | DLG3 |
| `web/lib/options-lab/dlgBehavior.test.ts` | DLG4 |
| `agents/p-options-lab-create-edit-dialog/**` | W0 |
| `agents/go/DLG-W0.md` | W0 |
| `docs/Options-Lab-Create-Edit-Position-Dialog-Full-Agent-Bench-Plan-v1.0.md` | this plan (do not edit Specs/ copies of plans) |

### 8.2 Expected edit (existing)

Named **per seed**, not as a pool:

| Path | Phase | Bound |
|------|-------|-------|
| `web/components/options-lab/TosControls.tsx` | DLG0, DLG1 | surface prop; dialog appearance branch |
| `web/components/options-lab/AnalyzerPositionsList.tsx` | **DLG0 only** | `surface="card"` on existing uses. **No restyle** |
| `web/components/options-lab/PositionBuilder.tsx` | DLG0–DLG4 | the dialog |
| `web/styles/tokens.css` | **DLG1 only** | Echo additive named code-surface token. No other token rewrite |
| `web/components/options-lab/OpfRiskAnalyzer.tsx` | **DLG3 optional** | Prop-wire of universe / chain-held / underlying only. Zero chrome. Prefer unused (hooks inside PositionBuilder) |
| `web/lib/options-lab/positionBuilder.pc5.test.ts` | DLG2, DLG4 | Restate AT-PC-23 verbs; keep AT-PC-04 |
| `web/lib/options-lab/tosCard.test.ts` | DLG0 (if needed), DLG2 | Drop `builder-entry-at` requirement; keep card ATs and shared-control ATs |

### 8.3 Forbidden without a new Coach stamp

`web/app/app/iki/analyzer/page.tsx` as a fork · a second `PositionBuilder` · a second stepper/padlock · `strategy-lab-proto/msc-risk-graph-ui/**` · any MSC import · Heatmap · Sessions · `package-lock.json` · `migrations/**` · Market Bus protocol · Mini Two / Dude Two deploy scripts · a second Zustand/global book · a modal rewrite (`aria-modal="true"`, scrim, focus trap as a page modal) · a second `onSave` / `onAnalyze` / `onUpdate` callback · Preview / entry time / Submit · editing frozen Spec v1.2 · reopening PC0–PC9b · other Labs dialogs.

---

## 9. Seating

| ID | Rule |
|----|------|
| **S1** | **Charlie** — `PositionBuilder.tsx`, `TosControls.tsx` surface/appearance, optional host prop-wire |
| **S2** | **Echo** — W0-4 does **not** wait on Echo. Echo names the code-surface token at **DLG1**. Sits DLG1-G (theme/contrast), DLG2-G (layout vs PNG+§3), DLGZ-0 (visual read both themes). Charlie implements without inventing tokens |
| **S3** | **Kilo** — AT matrix, greps wrapped in tsx where useful, Playwright |
| **S4** | **Tango** — DLG2-G verbs; DLG3-G loading / no-chain / unlock copy; DLGZ-1 member read |
| **S5** | **India** — W0-3 integrity; **W0-4 surface sign (entry gate on DLG0)**; DLGZ-3; veto on spec contradiction; veto on two components or one look forced onto both |
| **S6** | **Lima** — W0-1 DL supersession; token name at DLG1; DLGZ-2 close |
| **S7** | **Juliet** — board, seeds, no NX creep, no Mini Two, no IKI fork, theme-before-chrome order |
| **S8** | **Delta** — every phase gate ternary; extra files = FAIL; fifteen-row table every time; AT-DLG-4 and AT-DLG-15 are greps |
| **S9** | **Hotel** — not seated. Classifier, lock semantics, script content are unchanged. Do not invite a taxonomy pass |
| **S10** | **Foxtrot** — **no deploy** |
| **S11** | Seeds on disk before the phase gate |

---

## 10. Definition of done — every packet

- [ ] Change declared — **exact files, a subset of §8** — approved before implementation
- [ ] Only those files touched
- [ ] Characterization / new tests green **on Coach’s MacBook**
- [ ] Spec laws covering every file touched checked, not only named ATs
- [ ] DL entry same day when a token is named or a PC test is restated
- [ ] No secrets, ports, MSC, deploy, migration
- [ ] Public copy: no profit claims
- [ ] Evidence attached for Delta
- [ ] Card still blotter: `tosCard.test.ts` card ATs green

---

## 11. Risk register

| Risk | Phase | Mitigation |
|------|-------|------------|
| Re-deriving "one appearance" | any | W0-4 India sign. Seed that restates PC-VOCAB-1 as one look = FAIL |
| Theme after chrome (the loop just paid for) | DLG2 | DLG2 depends on DLG1-G PASS. Juliet will not seed DLG2 early |
| Card regresses when `surface` is added | DLG0 / DLG1 | AnalyzerPositionsList is `surface="card"` only. tosCard card ATs stay green. Grow-on-hover remains card-only |
| AT-DLG-4 argued as "close enough" | DLG1 | Grep is the oracle. One `OL_DATA` = FAIL |
| Host hijacks session symbol | DLG3 | Grep `setSymbol` in PositionBuilder = FAIL. Live: header selector unchanged |
| Second save path | DLG4 | Analyze and Update both call existing `onSave`. No `onAnalyze` / `onUpdate` prop |
| PNG rebuilt Preview / Submit / entry time | DLG2 | §3 overrides PNG. AT-DLG-11 grep |
| Modal rewrite | DLG2 | `aria-modal="false"` kept. `panelPos` kept |
| Non-session chain needs a new OPF endpoint | DLG3 | **Stop and ask** (§14). Do not invent a fetch |
| PC5 opening-Edit-writes-zero broken in the rewrite | DLG2 / DLG4 | AT-PC-04 kept. AT-DLG-9 |
| Characterization still requires Submit / Close / entry time | DLG2 | Restate those assertions in the same files; do not delete the files |
| IKI fork | any | IKI page is not in any seed allowlist |
| Silent Mini Two "ship" | any | **FAIL.** Spec machine law |
| Three failed attempts | any | Stop, return to purpose, re-derive (doctrine) |

---

## 12. What this plan does not do

Other Labs dialogs · a modal rewrite · an IKI fork · a second `PositionBuilder` · a second stepper or padlock · Preview · entry time · Submit · Done · a second save path · pricing path changes · `AnalyzerPosition` schema · classifier · lock engine · ToS script **content** · undo stack · Trade Log promotion · Sessions · migrations · `package-lock.json` · editing frozen Position Control Spec v1.2 · reopening PC0–PC9b · **any deploy**.

---

## 13. Juliet recommendations (Coach disposes at W0; **no silence defaults for product law**)

Product law is already stamped in the Spec. These are **process** ticks only:

| Rec | If Coach silent at GO |
|-----|------------------------|
| **JR1** | Board path `agents/p-options-lab-create-edit-dialog/` · token `DLG-W0.md` |
| **JR2** | DLG0 is the **first code packet after GO**, and only after W0-4 APPROVED |
| **JR3** | Tests: `npx tsx` + `node:assert/strict` under bare Node; Playwright for `pw` / `comp` / `a11y` ATs |
| **JR4** | Do not split `PositionBuilder.tsx` |
| **JR5** | `AnalyzerPositionsList.tsx` is allowlisted **only** to pass `surface="card"`. `OpfRiskAnalyzer.tsx` is allowlisted **only** as optional DLG3 prop-wire |
| **JR6** | Analyze testid stays `builder-analyze` so the historical `position-builder-analyze` grep does not go false-green by renaming |

---

## 14. Implementation routing this plan does not invent

§8 of the Spec is closed. The following are **not product questions**. They are existing-path routing. Charlie takes the thinner existing path. **If that path does not exist, stop and ask Coach. Do not choose a new one.**

| Topic | Spec already says | Routing |
|-------|-------------------|---------|
| Universe source | `{ symbol, setSymbol, universe }` that `OpfRiskAnalyzer` already uses. No new list, no parallel fetch, no hardcoded symbols | `useOptionsLab()` inside `PositionBuilder`, **or** the host passes `universe` + `universeLoading` as props. Same hook either way. Delta checks source identity (`useOptionsLab` / `universe`), not the prop name |
| Session symbol | Dialog must not hijack it (DLG-SYM-7) | Do not call `setSymbol`. Header `analyzer-symbol-select` unchanged. `symbol` prop on the builder may remain as session **context** (title/spot); it is not the position's underlying |
| Chain for the new underlying | Re-resolve onto that symbol's OPF-listed strikes. Loading chain reads "Loading chain…". DL-309 | Existing `useBuilderChain` (already takes a `symbol` argument; host uses it for the session). A second hook instance keyed by `position.underlying` is the same OPF path, not a parallel universe fetch. **Stop and ask** if a new endpoint, a new ladder client, or `setSymbol` as a side effect would be required |
| "no chain held" vs "Loading chain…" | SYM-3 vs SYM-5 | Distinguish from existing chain accessors (`loading` / empty ladder / error) and OPF-held truth. Do not invent a held-set API. Do not substitute `supports_options` unless that **is** how OPF already marks a missing chain — verify, don't assume. **Stop and ask** if existing accessors cannot tell "no product" from "still hydrating" |
| Code-surface token **name** | "a named code-surface token", defined dark in both themes | Echo names it at DLG1. Lima records the name in the DL that day. Until named, AT-DLG-4's exception has no identifier — DLG1-G cannot PASS without the name |
| Multiplier | Follows the new symbol. SPX ×100 vs MES ×5 is the blocking example | Existing `profile.contract_multiplier` via `coerceSymbolProfile` on the universe row. Do not hardcode 100 or 5 |

No other gaps were found in Spec v0.4. If a later packet needs an answer the Spec does not give, **stop and ask**.

---

*Create / Edit Position Dialog Full Agent Bench Plan v1.0. No implementation before Coach’s GO. India signs `surface` before DLG0. Theme before chrome.*
