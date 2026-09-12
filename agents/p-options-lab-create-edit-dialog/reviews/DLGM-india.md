# DLGM — India · architecture sign of the common-model proposal

**Date:** 2026-09-12
**Document:** `docs/Analyzer-Dialog-Common-Model-Architecture-Proposal-v0_1.md`
**Status of document:** PROPOSAL — not build authority. Nothing is built on this sign
until Coach stamps a GO for a model packet.
**Surface:** `PositionBuilder.tsx` · `OpfRiskAnalyzer.tsx`

## Evidence, re-read on disk (not the proposal's word)

| Claim | Live count |
|-------|------------|
| `AnalyzerPosition` in `PositionBuilder.tsx` | **0** |
| `PositionInput` in `PositionBuilder.tsx` | **7** |
| `resolvePackageSide` / `blotterKindFromPackageSide` / `packageDelta` / `fmtIv` in the dialog | **0** (card: 2 / 2 / 2 / 2) |
| `net_debit_override` | **19** |
| `CardLockState` / `lockActive` / `cardLock` | **8** (proposal said 6; later D-PC-7 wiring added two — residual still holds) |
| `OpfRiskAnalyzer` `AnalyzerPosition` / `PositionInput` | **7 / 7** |
| `direction` hook | `:405`; mirrors `:825` `:847` `:927` `:1299` `:1353`; race comment `:1030` |

§2.1 is correct: `PositionInput` is `AnalyzerPosition.position`. Nine modules,
`analyzerBook` among them. **It stays.** An instruction to delete it would be
returned.

## Asks

### M1 — **SIGNED**

The dialog's working model is a draft `AnalyzerPosition` — envelope and
structure together. Create seeds a draft record (off-book). Edit takes a copy
of the live one (PC5: opening Edit writes nothing). A surface holding a bare
`PositionInput` for the position is a fail.

`PositionInput` remains the inner structure. Not a parallel model.

**M2 is entailed and signed with M1:** delete the `direction` hook. Single
source is `draft.position.direction`. The mirrors and the race comment go.

**M4 and M5 follow M1 and are signed as consequences, not a separate product
decision:** the dialog reads `draft.lock` / `CardLockState`; derivations call
the shared helpers on the draft. `net_debit_override` is not a display source
in this component. D-PC-7 closes by construction.

### M3 — **RULED**

The line is: **does this hook duplicate a field of the draft, or a value the
draft already determines?** If yes, delete it. If it is chrome of the dialog
itself, keep it and name it.

| Hook | Ruling |
|------|--------|
| `direction` | **Delete.** It is `draft.position.direction`. |
| `optionSide` | **Delete.** For one-right structures it is `legs[].type`; the TYPE column is the write. Not on the envelope; it is a regenerate input that duplicates the structure. |
| `template` | **Derive from legs** (`detectFamily` / PC-STRAT-7: family is computed, never stored). The STRATEGY menu is a **command that writes legs**, not a second holder of family. If a pick does not round-trip through `detectFamily`, that is a `detectFamily` defect — do not keep a shadow hook to hide it. |
| `centerStrike` / `wingWidth` / `userSpot` / `backExpiration` | Same class as `optionSide`: regenerate inputs. **Derive from `draft.position.legs` after seed.** Not asked as a named M3 item; they fall under the same line. |
| `copied`, `defaultsMenuOpen`, `defaultsFlash`, `defaultsStore`, `structureNotice`, `unplaceableDetail`, `atomicResolving`, drag/`panelPos`, seed refs | **Keep.** Dialog-local UI state. Name them as such. |

Do not add `template` or `optionSide` to `AnalyzerPosition`. That would expand
the record other surfaces rely on.

### M6 — **CONFIRMED**

`OpfRiskAnalyzer` handing and receiving a draft `AnalyzerPosition` does **not**
disturb the contract other surfaces rely on, provided:

1. The book remains `AnalyzerPosition[]`. Other surfaces keep reading the book.
2. The Create draft is **off-book until commit** (PC5). A draft id is not a
   book row.
3. Edit still writes nothing on open. Live-bind (`onLivePatch`) stays the Edit
   write path it is today.
4. **Undo is unchanged in shape:** `undoStack.draft` stays `PositionInput`
   (the structure slice, AT-PC-50). The seam does not store an envelope on the
   undo stack.
5. `applyEditPatch` / `positionFromInput` keep existing. The seam stops
   stripping `.position` on the way in and wrapping on the way out; it does not
   grow `AnalyzerPosition`.
6. No new fields on `AnalyzerPosition`.

The translation layer in `handleBuilderSave` / `editInitial` / `createReopen`
is the defect M6 removes. Removing it is not a contract change.

## Not authorised

Appearance, layout, spacing, colour, legs-panel styling. Visual iteration
stays off this proposal. No dialog Spec version. No GO restamp. No build
from this file.

Deleting `PositionInput`. Two models. A modal. An IKI fork. Editing frozen
Position Control v1.2.

## Verdict

**APPROVED** as architecture for a later model packet. Not BUILD AUTHORITY.
Not a seed. Juliet sequences. Coach GO stamps before any code.