# PC4-G

**Date:** 2026-09-11  
**Machine:** Coach's MacBook (dev)  
**Verdict:** PASS

## Files (seed `PC4.md`)

- `web/lib/options-lab/undoStack.ts`
- `web/lib/options-lab/undoStack.test.ts`
- `web/components/options-lab/OpfRiskAnalyzer.tsx`

## Evidence

```
$ npx --yes tsx lib/options-lab/undoStack.test.ts
  ok  AT-PC-37 Undo reverses a card write, dialog patch, lock, delete, strategy rebuild
  ok  AT-PC-37 a quote tick is never an undo step
  ok  AT-PC-45 Undo does not un-Log; promotion is absent from the history stack
  ok  AT-PC-50 stack half: undo of Create-Submit removes the record
  ok  bounded ring default 50 drops the oldest
  ok  PC4 host: quote and Log writers do not call push; member writers do
undoStack.test.ts 6 ok
```

Cmd/Ctrl-Z restores the last snapshot. Quote merges, hydrate, Trade Log sync, and promotion do not push. Create-reopen is PC5.

## Divergences

D-PC-2, D-PC-3 in `DIVERGENCES.md`.
