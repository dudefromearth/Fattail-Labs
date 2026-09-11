# DLG4 — Behaviour

**Status:** OPEN · **Machine:** Coach's MacBook (dev) · **Nothing deploys.**
**Phase:** DLG4
**Depends:** DLG3-G PASS
**Laws:** DLG-FN-1…9 · DLG-HIG-3 · 5 · 6 · 7 · 9
**ATs named:** AT-DLG-1 · 2 · 7 · 8 · 9 · 10
**Gate:** `gate-reports/DLG4-G.md` — fifteen-row table.

Amendments become DLG4b. Never edit this file.

## Exact files

- `web/components/options-lab/PositionBuilder.tsx`
- `web/lib/options-lab/dlgBehavior.test.ts` (new)
- `web/lib/options-lab/positionBuilder.pc5.test.ts` (`onSave` / Analyze / Update assertions; **keep AT-PC-04**)

Delta **FAIL**s any extra file.

## Intent

1. **Every control works.** Analyze (`builder-analyze`) and Update call the existing `onSave`. No second save path. No `onAnalyze` / `onUpdate` prop. Create stays off-book until that call. Edit live-bind unchanged (PC5). Opening Edit writes zero.
2. Return commits Analyze/Update **except** when focus is in a value field (strike, width, centre, quantity, price).
3. Escape still dismisses (already wired — keep).
4. Tab order follows reading order; focus visible.
5. Hit targets `--hit-min` at rest on dialog controls. **No grow-on-hover** on `data-surface="dialog"`.
6. QTY sign preserved: −2 → −3; basis and script move. In-chain edits re-derive on the same tick (DLG-FN-3).
7. Nothing moves except in response to something the member did.

## Out

Layout redo · token redo · pricing path · second save callback · grow-on-hover on dialog · modal.

## Gate notes

CI: AT-PC-04 opening Edit writes nothing. Playwright: Analyze clicks `onSave` once; Update
clicks the same `onSave` once. AT-DLG-3/4/5/6/11/12/13/14/15 remain PASS.
