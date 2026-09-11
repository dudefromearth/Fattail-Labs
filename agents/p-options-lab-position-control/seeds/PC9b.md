# PC9b — Promotion (mapper only)

**Phase:** PC9b  
**Depends:** PC6  
**Laws:** PC-LIFE-1…6 · 8…10 · PC-TM-1…3  
**ATs:** AT-PC-07 · 13 · 14 · 46 · 54

Coach 2026-09-11: **no schema.** Snapshot (PC-LIFE-7) deferred to the Trade Log refactor.

## Exact files

- `web/lib/options-lab/analyzerToTradeLog.ts`
- `web/lib/options-lab/analyzerToTradeLog.test.ts`
- `web/lib/options-lab/analyzerBook.pc0.test.ts`
- `web/components/options-lab/OpfRiskAnalyzer.tsx`
- `web/components/options-lab/AnalyzerPositionsList.tsx`

Delta **FAIL**s any extra file. **No `migrations/`.**

## Intent

Mapper rewritten: `order_type` from `lockSource`; no fill from stored `entry_price`; no `contracts` as multiplier. Entry time at Log. Residual does not block. TM gates AND-ed. Snapshot is not this packet.
