# IMPLEMENTATION-PLAN — Analyzer Residual

See full plan: [`docs/Options-Lab-Analyzer-Residual-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Options-Lab-Analyzer-Residual-Full-Agent-Bench-Plan-v1.0.md) (**v1.0.1**)

## Quick residual checklist

| Phase | Deliverable |
|-------|-------------|
| **W0** | Path/hash reconcile · PB v0.3 · triple hash · W0-0 GO |
| **L** | `OpfRiskAnalyzer` layout: top Controls · viewport · divider · Positions · Alerts |
| **B** | Builder empty → butterfly · ATM · profile min wing · §4.3 geometries |
| **T** | What-if Enable gates all · override banner · Tango copy (deps **W0 only**) |
| **A** | Alerts 20 of N · multi-symbol badge · Kilo raw-eval characterization |
| **D** | ANALYSIS-only · package magnitude invariant · **cites PB v0.3** |
| **S** | Cache paint **stale** label · posture fixture handoff (holiday/half-day/16:15) |
| **V** | `VolumeProfileChart` bins only (no candles) |
| **U** | Surface 3D mesh OPF-fed · OPF delta if new sample API · load posture |
| **R** | Probability Spec section first · `/app/options-lab/probability` · Mike auth |
| **K** | AT evidence pack + **posture ATs** |
| **Z** | As-built + DL close |

## Primary law (implement against)

| Doc | Path |
|-----|------|
| Analyzer Spec v0.2.1 | `Specs/FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md` |
| PB Spec v0.3 | `Specs/FatTail-Labs-Options-Lab-Position-Builder-Spec-v0_3.md` |
| OPF Spec v0.2.1 | `Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md` |

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
