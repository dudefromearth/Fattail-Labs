# PC9a-G

**Date:** 2026-09-11  
**Machine:** Coach's MacBook (dev)  
**Verdict:** PASS

## Files (seed `PC9a.md`)

- `web/lib/options-lab/autofitPolicy.ts`
- `web/lib/options-lab/autofitPolicy.test.ts`
- `web/lib/risk-graph/pnlChartViewPolicy.ts`
- `web/lib/risk-graph/pnlChartViewPolicy.test.ts`
- `web/lib/risk-graph/pnlChartTypes.ts`
- `web/lib/risk-graph/surfaceAutofit.ts`
- `web/components/options-lab/OpfRiskAnalyzer.tsx`
- `web/components/options-lab/risk-graph/HostPnLChart.tsx`
- `Specs/FatTail-Labs-Options-Lab-Surface-Autofit-Spec-v0.1.md`

## Evidence

```
$ npx --yes tsx lib/options-lab/autofitPolicy.test.ts
  ok  AT-PC-16 Autofit does not fire when the edited position still fits
  ok  PC-FIT-3 Create-Submit and first show always fit; overlay never
  ok  PC-FIT-1 fingerprint follows structure, not POS or hide
  ok  host subscribes to structureKey, not strike-drop as always-fit
autofitPolicy.test.ts 4 ok

$ npx --yes tsx lib/risk-graph/pnlChartViewPolicy.test.ts
  … 9 tests passed
```

AF-L5 amended: structure-changed signal + Autofit button; fit-if-needed after first show / Create-Submit; overlay never. Autofit Spec content version **v0.1.10**.

## Environment

10-hour API cap is not a gate. Recorded for PCZ.

Next: PC9b reaches Coach before it runs.
