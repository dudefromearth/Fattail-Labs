# PC4 — Undo stack

**Phase:** PC4  
**Depends:** PC1  
**Laws:** PC-UNDO-1…7  
**ATs:** AT-PC-37 · 45 · 50 (stack half)

## Exact files

- `web/lib/options-lab/undoStack.ts`
- `web/lib/options-lab/undoStack.test.ts`
- `web/components/options-lab/OpfRiskAnalyzer.tsx`

Delta **FAIL**s any extra file.

## Intent

Bounded ring, default 50. Member book writes push; quote merges, hydrate, and Trade Log promotion do not. Cmd/Ctrl-Z restores the last snapshot. Undo of Create-Submit **removes the record**. Reopening Create bound to that draft is **PC5**.

**Out:** persist history · Trade Log reversal · Create-reopen wire.
