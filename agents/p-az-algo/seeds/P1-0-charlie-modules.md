# Seed P1-0 — Charlie pure modules

**Project:** p-az-algo  
**Agent:** Charlie  
**Phase:** P1  
**Depends:** P0-G PASS. DL-539 three-OK or reassignment if IKI still listed.  
**Law:** AZ-ALGO v2.2.2 sha1 `b757ba3f4b3816fcaebae857aeda70dff488ecdc` · Appendix A · Appendix B goldens · E1 E2 E5 E10 E11 E21 E23 E24  
**Gate it feeds:** P1-G

## Intent

`algoConfig.ts` + `algoMoveUnit.ts` + `algoGexNorm.ts` + `algoProfitAtRisk.ts` against handwritten fixtures 1–18. **No UI. No React. No HostPnLChart.**

## Files in scope

- **New** `web/lib/options-lab/algoConfig.ts`  
- **New** `web/lib/options-lab/algoMoveUnit.ts`  
- **New** `web/lib/options-lab/algoGexNorm.ts`  
- **New** `web/lib/options-lab/algoProfitAtRisk.ts`  
- matching tests (not authored by the goldens file)

## Out of scope

`algoEval.ts` (**NX13** — P5 owns it). `HostPnLChart.tsx`. `algoTrailMath.ts` (P2). MiniTwo. §14. Promoting “proposed”.

## Invariants

Fail-loud Appendix A (AT-ALGO-26). Goldens are the oracle — do not rewrite them. Floor formula **(c)** only. At-body take larger PaR. Time remaining never enters `k` (E21). Units: Δ $/pt, Γ $/pt², move pt, PaR $.

## Done when

P1-1 / P1-2 can run. Modules load or abort naming the missing key.
