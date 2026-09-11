# PC0-G

**Date:** 2026-09-11  
**Machine:** Coach's MacBook (dev)  
**Verdict:** PASS

## Files (seed `PC0.md`)

- `web/lib/options-lab/analyzerBook.ts`
- `web/components/options-lab/OpfRiskAnalyzer.tsx`
- `web/lib/options-lab/analyzerBook.pc0.test.ts`

## Evidence

```
$ cd web && npx --yes tsx lib/options-lab/analyzerBook.pc0.test.ts
  ok  AT-PC-02 Edit patch preserves visible, rehearsal, clocks, tradeLogTradeId, bind
  ok  AT-PC-02 wire: handleBuilderSave edit branch calls applyEditPatch
  ok  AT-PC-47 rehearsal and visible survive a persistence round-trip
  ok  AT-PC-60 simulated restart: wipe sessionStorage, book still there with rehearsal
  ok  AT-PC-60 persist is not session-only: dual-write localStorage
  ok  characterization: applyPackageQuote incomplete currently nulls lastNatSigned
  ok  characterization: mapper currently always LMT
  ok  characterization: shiftCardStrikes without listed ladder is a no-op
analyzerBook.pc0.test.ts 8 ok
```

Edit-save uses `applyEditPatch`. Persist writes the full book including `rehearsal`. `durablePositions` remains the live-only subset; it is no longer the persist filter.

## Notes

`rehearsal.test.ts` still fails a pre-existing KEEP grep (`else if (tmActive) { return a; }` is absent in `OpfRiskAnalyzer.tsx`). Not introduced by this packet; not in the allowlist.
