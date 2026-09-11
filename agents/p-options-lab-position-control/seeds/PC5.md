# PC5 — Bind split

**Phase:** PC5  
**Depends:** PC3 + PC4  
**Laws:** PC-REC-2 · 7 · 8 · 9 · PC-STRAT-8 · 10 · 13 · §5.1  
**ATs:** AT-PC-01 · 04 · 21 · 22 · 23 · 42 · 56 · 50 (Create-reopen) · 32 (dialog picker)

## Exact files

- `web/components/options-lab/PositionBuilder.tsx`
- `web/components/options-lab/OpfRiskAnalyzer.tsx`
- `web/lib/options-lab/undoStack.ts`
- `web/lib/options-lab/positionBuilder.pc5.test.ts`

Delta **FAIL**s any extra file. Do not split `PositionBuilder.tsx`.

## Intent

Edit binds the live record; opening writes zero fields. Create is an off-book draft until Submit. Verbs: Cancel · Submit / Close · Esc. Undo of Create-Submit reopens Create bound to that draft. Removals per §5.1.
