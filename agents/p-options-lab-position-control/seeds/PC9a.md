# PC9a — Autofit

**Phase:** PC9a  
**Depends:** PC3  
**Laws:** PC-FIT-1…3 · AF-L5 amend  
**ATs:** AT-PC-16

## Exact files

- `web/lib/options-lab/autofitPolicy.ts`
- `web/lib/options-lab/autofitPolicy.test.ts`
- `web/lib/risk-graph/pnlChartViewPolicy.ts`
- `web/lib/risk-graph/pnlChartViewPolicy.test.ts`
- `web/lib/risk-graph/pnlChartTypes.ts`
- `web/lib/risk-graph/surfaceAutofit.ts`
- `web/components/options-lab/OpfRiskAnalyzer.tsx`
- `web/components/options-lab/risk-graph/HostPnLChart.tsx`
- `Specs/FatTail-Labs-Options-Lab-Surface-Autofit-Spec-v0.1.md`

## Intent

Autofit subscribes to the structure signal. Committed book, never overlay. Fit on Create-Submit and first show; afterwards only when geometry escapes. Explicit Fit remains. AF-L5 amended in place.
