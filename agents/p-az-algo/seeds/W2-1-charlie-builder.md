# Seed W2-1 — Charlie Builder · adapter · + pulse

**Project:** p-az-algo  
**Agent:** Charlie  
**Phase:** W2  
**Depends:** W1-G PASS  
**Law:** AZ-ALGO §4 · §5 · AZ-ALB §4.5  
**Gate it feeds:** W2-2 · W2-G

## Intent

Type → Algo is live. Eligible fly → **+** pulses. Save through the hook. **Do not touch `HostPnLChart`.**

## Files in scope

- `web/components/options-lab/AlertBuilderDialog.tsx`  
- `web/lib/alerts/analyzerAlertsAdapter.ts` — `trigger.family: "algo"`  
- `web/components/options-lab/AnalyzerControlsColumn.tsx` — **+** pulse only  
- `web/components/options-lab/OpfRiskAnalyzer.tsx` — wire seed / save / eligibility (no canvas draw)

## Out of scope

Canvas lines · narrative panel · `HostPnLChart.tsx` · demo · delete · severity picker

## Wire

1. `isOtmDebitButterfly` on Shown/focused card → **+** subtle pulse (`data-algo-pulse=1`).  
2. Click **+** while eligible → Builder Type **Algo**, bound, §5.1 description, defaults 75/75/20, overlay off.  
3. Save: `alert_class: algo`, `kind: position`, `trigger.algo` payload §5.3.  
4. No eligible card → existing Price/Spot. Type Algo with empty list → Save **off**.  
5. 44pt knobs. HI tokens. Description updates when knobs change. **No profit claims** in Labs copy.

## Done when

AT-ALGO-1…4, 11, 13, 15 would pass. No `HostPnLChart` diff.

## Invariants

FP1 · FP9 · FP12 · FP13. Coach Content Law on the description (process).
