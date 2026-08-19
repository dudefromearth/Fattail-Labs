# Seed W1-1 — Charlie What-if clock + vol helpers

**Project:** p-az-what-if-tm  
**Agent:** Charlie  
**Phase:** W1  
**Depends:** Coach fire of implementation plan (or W0-BA)  
**Spec:** AZ-TM T2/T3/T6/T7 · V2/V4/V5 (OD-1 B)  
**Gate it feeds:** W2 · W3 · W1 tests

## Intent

Pure helpers. No UI. Last-trade remaining ≠ OPF τ. Vol wire = OPF31 additive pts from measured ATM %.

## Files in scope

- **New:** `web/lib/options-lab/whatIfClocks.ts` + `whatIfClocks.test.ts`  
  — last-trade remaining **and** `tauYearsWhatIf(exp, nowMs)` = OPF PM 16:00 with **1-minute** floor. This helper is the only What-if τ function (Analyzer **and** Surface).  
- **New:** `web/lib/options-lab/whatIfVol.ts` + `whatIfVol.test.ts`

## Out of scope

`OpfRiskAnalyzer.tsx` · `TimeHud.tsx` · changing `fractionalT` 16:00 instant · ratio apply · Massive

## Invariants

OPF29 16:00 PM for τ (do not implement τ here). OPF31 `vol_offset_pts = scenarioPct − measuredPct`. IV NO if no listed ATM IV. No invented ±30.

## Done when

```bash
cd web && npx --yes tsx lib/options-lab/whatIfClocks.test.ts
cd web && npx --yes tsx lib/options-lab/whatIfVol.test.ts
```

PASS. Fixtures use fixed `nowMs` (AT-TM-1 SPX 10:00 → remaining ∈ (6, 6.5]; equity 16:00). AT-TM-13/14: 15:30 τ still decreases vs 15:00 (1-minute floor, not 1-hour `fractionalT`). Vol: detent identity; +5 pts mapping; missing IV → null.

## NX

Plan NX1–NX9, NX11.
