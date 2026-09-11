# DLG0-G

**Date:** 2026-09-11
**Machine:** Coach's MacBook (dev)
**Seed:** `agents/p-options-lab-create-edit-dialog/seeds/DLG0.md`
**Depends:** W0-G PASS · W0-4 APPROVED
**Verdict:** **PASS**. Nothing deploys.

DLG-VOCAB-3 closed as mechanism. Appearance is still the blotter on both surfaces
**on purpose** — theme is DLG1. Card PC-HIG-8 grow-on-hover unchanged.

## Files (seed allowlist)

- `web/components/options-lab/TosControls.tsx`
- `web/components/options-lab/AnalyzerPositionsList.tsx` (`surface="card"` only)
- `web/components/options-lab/PositionBuilder.tsx` (`surface="dialog"` only)
- `web/lib/options-lab/dlgSurface.test.ts` (new)

`tosCard.test.ts` not edited (existing share-tests did not need it). No extra files.

## Spec laws covering files touched

| File | Laws checked |
|------|----------------|
| `TosControls.tsx` | DLG-VOCAB-1 · 2 · 3 · PC-HIG-8 (grow-on-hover still present; dialog look is DLG1) |
| `AnalyzerPositionsList.tsx` | `surface="card"` only. No restyle. Card ATs green |
| `PositionBuilder.tsx` | `surface="dialog"` on shared controls. No restyle. Inert symbol / tokens / verbs untouched |

## AT-DLG-1…15

| ID | Delta | Evidence |
|----|-------|----------|
| AT-DLG-1 | **BLOCKED** | DLG4 |
| AT-DLG-2 | **BLOCKED** | DLG4 |
| AT-DLG-3 | **BLOCKED** | DLG1 |
| AT-DLG-4 | **BLOCKED** | DLG1 |
| AT-DLG-5 | **BLOCKED** | DLG1 |
| AT-DLG-6 | **BLOCKED** | DLG2 |
| AT-DLG-7 | **BLOCKED** | DLG4 |
| AT-DLG-8 | **BLOCKED** | DLG4 (dialog hit-min / no-grow is DLG1 appearance + DLG4 assert) |
| AT-DLG-9 | **BLOCKED** | DLG4 · AT-PC-04 still green this packet |
| AT-DLG-10 | **BLOCKED** | DLG4 |
| AT-DLG-11 | **BLOCKED** | DLG2 |
| AT-DLG-12 | **BLOCKED** | DLG3 |
| AT-DLG-13 | **BLOCKED** | DLG3 |
| AT-DLG-14 | **BLOCKED** | DLG3 |
| AT-DLG-15 | **PASS** | grep + `dlgSurface.test.ts` 8 ok |

## AT-DLG-15 grep

Four exports take `surface: TosSurface` and stamp `data-surface={surface}`:

```
59:export function TosStepper({
125:export function TosQtyControl({
303:export function TosPadlock({
351:export function CardMenuField({
```

`data-surface={surface}` at TosControls.tsx:77, 145, 325, 366.

Card: 9 JSX uses, all `surface="card"`. Dialog: 13 JSX uses, all `surface="dialog"`.
Uses without `surface=`: **none**.

## Tests

```
$ npx --yes tsx lib/options-lab/dlgSurface.test.ts
  ok  AT-DLG-15 TosSurface is card | dialog
  ok  AT-DLG-15 each shared export requires surface and stamps data-surface
  ok  AT-DLG-15 card call sites pass surface="card"
  ok  AT-DLG-15 dialog call sites pass surface="dialog"
  ok  AT-DLG-15 no shared-control JSX without surface=
  ok  AT-DLG-15 one component — no forked stepper/padlock/triangle in the dialog
  ok  AT-DLG-15 behaviour still one implementation (step / lock callbacks unchanged)
  ok  DLG0 card appearance unchanged — grow-on-hover still PC-HIG-8
8 ok

$ npx --yes tsx lib/options-lab/tosCard.test.ts
tosCard.test.ts 26 ok

$ npx --yes tsx lib/options-lab/positionBuilder.pc5.test.ts
positionBuilder.pc5.test.ts 9 ok
```

## Next

DLG1 (theme) is unblocked. Echo names the code-surface token. Charlie does not invent it.
Do not start chrome (DLG2) before DLG1-G. No deploy.
