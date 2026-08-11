# IMPLEMENTATION-PLAN — Analyzer Residual

See full plan: [`docs/Options-Lab-Analyzer-Residual-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Options-Lab-Analyzer-Residual-Full-Agent-Bench-Plan-v1.0.md)

## Quick residual checklist

| Phase | Deliverable |
|-------|-------------|
| **L** | `OpfRiskAnalyzer` layout: top Controls · viewport · divider · Positions · Alerts |
| **B** | Builder empty → butterfly · ATM · profile min wing · §4.3 geometries |
| **T** | What-if Enable gates all · override banner |
| **A** | Alerts 20 of N · multi-symbol badge |
| **D** | ANALYSIS-only · package magnitude invariant tests |
| **S** | Cache paint **stale** label · generation-driven polish |
| **V** | `VolumeProfileChart` bins only (no candles) |
| **U** | Surface 3D mesh OPF-fed under `risk-graph/` |
| **R** | `/app/options-lab/probability` suite panel |
| **K** | AT evidence pack |
| **Z** | As-built + DL close |

## Primary code touchpoints

| Area | Paths |
|------|--------|
| Analyzer shell | `web/components/options-lab/OpfRiskAnalyzer.tsx` |
| Positions / Alerts | `AnalyzerPositionsList.tsx` · `AnalyzerAlertsSection.tsx` · `analyzerBook.ts` |
| Builder | `PositionBuilder.tsx` · `listedStrikes.ts` · symbol profile |
| Risk / Surface | `risk-graph/PnLChart.tsx` · `SurfaceViewport.tsx` · `useOpfRiskGraph.ts` |
| VP | `VolumeProfileChart.tsx` · OHLC store (input only) |
| Probability | new page under `web/app/app/options-lab/probability/` · suite nav |
| OPF samples | `opfPricingApi.ts` · server pricing routes if needed |
