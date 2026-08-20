# Seed W2-1 — Kilo 2D autofit / click ATs

**Project:** p-az-viewport-2d  
**Agent:** Kilo  
**Phase:** W2  
**Depends:** W1-1 PASS  
**Spec:** Analysis tests table  
**Gate it feeds:** W-G

## Intent

AT-VS-1 fails on pre-packet `main` and PASSes after W1. Pure helpers first.

## Files in scope

- `web/lib/risk-graph/pnlChartViewPolicy.ts`  
- `web/lib/risk-graph/pnlChartViewPolicy.test.ts`  
- Source greps on `PnLChart.tsx` / `OpfRiskAnalyzer.tsx` as needed

## Out of scope

Playwright as the first lock. Packet B wiring. Changing product math.

## Done when

```bash
cd web && npx --yes tsx lib/risk-graph/pnlChartViewPolicy.test.ts
```

PASS: AT-VS-1 / AT-2D-AF-1…3, 7, 9, 10 · AT-CLICK-1/2 · AT-WH-1 · AT-AZ-WIRE-1 (Analyzer still has no `onStrikeDrag`).

## Invariants

Deterministic. No wall clock. Evidence over assertion.
