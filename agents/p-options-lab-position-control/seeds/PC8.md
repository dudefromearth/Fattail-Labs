# PC8 — ToS card, shared vocab, HIG

**Phase:** PC8  
**Depends:** PC7  
**Laws:** PC-VOCAB · PC-SYM-1–7 · 10 · PC-HIG · PC-STRAT-8 · 11 · 12 · §5  
**ATs:** AT-PC-15 · 19 · 20 · 33 · 49 · 58 · 32 (card picker) · 61–63 · 64 (card-rebuild) · 65–70

## Exact files

- `web/lib/options-lab/tosCard.ts`
- `web/lib/options-lab/tosCard.test.ts`
- `web/lib/options-lab/chainControls.test.ts`
- `web/components/options-lab/TosControls.tsx`
- `web/components/options-lab/AnalyzerPositionsList.tsx`
- `web/components/options-lab/OpfRiskAnalyzer.tsx`
- `web/components/options-lab/PositionBuilder.tsx`
- `web/components/ui/icons.tsx`

## Intent

Ten columns. Seven editable fields, conditional on strategy. Shared stepper / padlock / QTY pick. Spread on the card rebuilds legs. Padlock pair: shackle carries state. Grow-on-hover stepper. QTY quick-pick through POS. Symbol groups: select ≠ expand. Delete confirmed. Edit dialog displayed price reads CardLockState.
