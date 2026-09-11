# PC7 — Chain-bound controls and recovery

**Phase:** PC7  
**Depends:** PC1 + PC6  
**Laws:** PC-CHAIN-1…8 · PC-EXP-1…8 · PC-FOUND-1…7  
**ATs:** AT-PC-09–12 · 17 · 18 · 38 · **AT-PC-05 named**

## Exact files

- `web/lib/options-lab/chainControls.ts`
- `web/lib/options-lab/chainControls.test.ts`
- `web/components/options-lab/PositionBuilder.tsx`
- `web/components/options-lab/AnalyzerPositionsList.tsx`

## Intent

Constraint at the control. No `type=date`. Selects never bind `options[0]` on render. Empty ladder = loading. One expiration → no calendar/diagonal. DTE from TM clock when supplied. Roll is proposed, applied only on click. Residual stays editable.
