# PC9b-G

**Date:** 2026-09-11  
**Machine:** Coach's MacBook (dev)  
**Verdict:** PASS (mapper only)

Coach: no schema. Snapshot deferred to Trade Log refactor (D-PC-8).

## Files (seed `PC9b.md`)

- `web/lib/options-lab/analyzerToTradeLog.ts`
- `web/lib/options-lab/analyzerToTradeLog.test.ts`
- `web/lib/options-lab/analyzerBook.pc0.test.ts`
- `web/components/options-lab/OpfRiskAnalyzer.tsx`
- `web/components/options-lab/AnalyzerPositionsList.tsx`

## Evidence

```
$ npx --yes tsx lib/options-lab/analyzerToTradeLog.test.ts
  ok  AT-PC-46 order_type from lockSource; natural mid is not a limit
  ok  AT-PC-46 no fill from stored entry_price
  ok  AT-PC-07 lockSource survives promotion
  ok  AT-PC-54 unlocked Log price equals the script copy at that instant
  ok  AT-PC-14 rehearsal never promotes, including after TM ends
  ok  AT-PC-13 tmActive disables Log on the card
  ok  PC-LIFE-9 residual does not block Log
  ok  no schema / no snapshot column in this packet
analyzerToTradeLog.test.ts 11 ok
```

No `migrations/`. No `ALTER TABLE`.

## PCZ

Close report updated. Snapshot row deferred with named home: `agents/p-trade-log/PC-LIFE-7-carry-forward.md`.
