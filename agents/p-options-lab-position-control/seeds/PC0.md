# PC0 — Preserve rehearsal / visible · persist · characterization

**Phase:** PC0  
**Depends:** W0-0 GO (OD-PC-P1 b — this packet runs first)  
**Laws:** PC-REC-3 · PC-PERSIST-1 · PC-PERSIST-4 · PC-TM-2  
**ATs:** AT-PC-02 · AT-PC-47 · AT-PC-60

## Exact files

- `web/lib/options-lab/analyzerBook.ts`
- `web/components/options-lab/OpfRiskAnalyzer.tsx`
- `web/lib/options-lab/analyzerBook.pc0.test.ts`

Delta **FAIL**s any extra file.

## Intent

1. Edit-save preserves `visible`, `rehearsal`, clocks, `tradeLogTradeId`, bind.
2. Persist round-trips both flags; simulated restart (wipe session, read local) keeps them.
3. Characterization net for current quote merge, lock/mapper, strike shift — expected to be rewritten later.

**Out:** refactors, layout, lock rewrite, quotes, changing storage to session-only.
