# Analyzer Create / Edit Dialog — Common Model — Architecture Proposal v0.1

**Type:** Architecture proposal — **model only. No appearance in this document.**
**For:** India (architecture sign), then Juliet for sequencing
**Surface:** `web/components/options-lab/PositionBuilder.tsx` · `OpfRiskAnalyzer.tsx`
**Status:** PROPOSAL — not build authority
**Date:** 2026-09-12
**Raised by:** Coach, 2026-09-12 — *"I want absolute synch with a common model."*
*"If anything is using side objects that is a fail."*

---

## 1. The rule

Coach: **a surface holding its own object for the position is a fail.** PC-REC-1 already says one
`AnalyzerPosition` per id is the only mutable record and every surface renders a view of it. This
proposal makes the dialog a view instead of a second holder.

## 2. What is actually wrong — evidence, not assertion

### 2.1 Correction to an earlier reading

`PositionInput` is **not** a parallel model. It is the record's inner structure:

    export type AnalyzerPosition = {
      id, label, notation,
      position: PositionInput,        ← the editable structure
      lock: CardLockState,
      priceSide: "debit" | "credit" | null,
      lastNatSigned, livePackagePerShare, definedDebitPerShare,
      visible, liveState, bind, …     ← the envelope
    }

Nine modules use `PositionInput` legitimately, `analyzerBook` among them. **It stays.**

### 2.2 The defect: the dialog carries the structure and never the envelope

`PositionBuilder.tsx` references `AnalyzerPosition` **zero** times and `PositionInput` **seven**.
Every derived value that depends on an envelope field therefore cannot use the shared helper and is
recomputed locally, differently:

| Shared helper | Card | Dialog |
|---|---|---|
| `resolvePackageSide` | 2 | **0** |
| `blotterKindFromPackageSide` | 2 | **0** |
| `packageDelta` | 2 | **0** |
| `fmtIv` | 2 | **0** |

Two surfaces answering *"is this a debit or a credit?"* by different routes is the drift, not a risk
of it.

### 2.3 Side object 1 — `direction` held twice

`direction` exists on the draft (`PositionBuilder.tsx:381`) **and** as
`useState<TradeDirection>` (`:405`), hand-synced at `:825`, `:847`, `:927`. The file documents the
hazard at `:1029`:

> *"Create seed owns first materialization (correct Lab direction e.g. sell iron). **Do not race
> with state direction still stuck on default `"buy"`.**"*

A race between two copies of one field, known, commented, and worked around rather than removed.

### 2.4 Side object 2 — two routes to the price

`net_debit_override` (structure) appears **19** times in the dialog; `CardLockState` / `lockActive`
(envelope) **6**. The card reads the lock. This is the **D-PC-7** residual Position Control left
open, and it survived because the dialog has no envelope to read.

### 2.5 The laundering layer

`OpfRiskAnalyzer.tsx` holds **7** `AnalyzerPosition` and **7** `PositionInput`. It is the
translation seam between the two shapes, which is where divergence stops looking like a bug.

## 3. Proposal

| # | Change |
|---|--------|
| **M1** | **The dialog's working model is a draft `AnalyzerPosition`** — envelope and structure together — not a bare `PositionInput`. Create seeds a draft record; Edit takes a copy of the live one. |
| **M2** | **Delete the `direction` hook.** Single source is `draft.position.direction`. The three `setDirection` mirrors and the race comment at `:1029` go with it. |
| **M3** | **Audit `template` and `optionSide` the same way.** Any hook shadowing a field derivable from the draft is deleted; any that is genuinely dialog-local UI state (open menus, flashes, notices) stays and is named as such. |
| **M4** | **One route to the price.** The dialog reads the envelope's `lock` / `CardLockState`, as the card does. `net_debit_override` stops being a display source in this component. Closes D-PC-7 by construction. |
| **M5** | **Derivations come from the shared helpers** — `resolvePackageSide`, `blotterKindFromPackageSide`, `packageDelta`, `fmtIv`, `signedActualQty`, `posAndRatio` — called on the draft. The dialog computes nothing the card already derives. |
| **M6** | **`OpfRiskAnalyzer` stops translating.** It hands the dialog a draft record and receives one back. No shape conversion at the seam. |

## 4. What does not change

- **PC5 holds.** Opening Edit writes nothing; Create is off-book until Submit. A draft instance is
  still a draft — it is simply the same *type* as the thing it becomes.
- **`PositionInput` stays**, as the record's inner structure. Nine modules depend on it.
- `AnalyzerPosition` remains the only mutable record (PC-REC-1). Lock semantics, pricing, the ToS
  script's content, the undo stack and Trade Log promotion are untouched. **This changes which code
  answers a question, not what the answer is.**
- **No appearance change.** Not in scope, not in this document.

## 5. Why it is worth doing

Two implementations of a view can drift and must be reviewed; one cannot drift and needs no review.
Every symptom in §2 disappears because the thing that produced them is gone, not because a test
guards it. It also closes a residual the previous program deferred.

## 6. Risks

| Risk | Note |
|---|---|
| Blast radius | `PositionBuilder` (~2175 lines) and the `OpfRiskAnalyzer` seam. Not a small change. |
| Seeding | Create must seed a full envelope, including `lock`, `priceSide` and `liveState` defaults. Getting a default wrong shows as a wrong colour or a wrong price. |
| PC5 | Easy to break while moving the submit path. Its characterization test is the guard and must stay green throughout. |
| Undo | `undoStack.ts` references `PositionInput` (3). Confirm the draft change does not alter what lands on the stack. |

## 7. Asks of India

1. Sign or return **M1** — draft record as the dialog's model.
2. Rule on **M3** — the boundary between "shadow of the model" (delete) and "dialog-local UI state"
   (keep).
3. Confirm **M6** does not disturb the `AnalyzerPosition` contract other surfaces rely on.

## 8. Not in this proposal

Appearance, layout, spacing, colour and the legs panel's styling. Those belong to Coach's prototype
and Echo's constitution, and are proceeding separately as visual iteration with no spec version.
