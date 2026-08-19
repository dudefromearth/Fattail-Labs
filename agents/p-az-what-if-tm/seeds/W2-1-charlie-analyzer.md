# Seed W2-1 — Charlie Analyzer What-if inspector

**Project:** p-az-what-if-tm  
**Agent:** Charlie  
**Phase:** W2  
**Depends:** W1-1 PASS  
**Spec:** §4 · T1–T8 · V1–V8 · A6/B4  
**Gate it feeds:** W4 · W5

## Intent

Analyzer What-if group: Time remaining last-trade; Implied vol % detent σ_m; wire still `timeOffsetHours` + `volOffsetPts`.

## Files in scope

- `web/components/options-lab/AnalyzerControlsColumn.tsx`  
- `web/components/options-lab/OpfRiskAnalyzer.tsx`  
- `web/lib/options-lab/localBookCurves.ts` — additive formula stays; What-if τ via W1 helper (1-minute floor). Do not retarget settlement to 16:15. Do not use `fractionalT` 1-hour min.

## Out of scope

Surface HUD (W3). Inspector rail redo. VIX field. Create Position default.

## Wire

- `remaining` from soonest shown exp + symbol (W1 clocks).  
- `σ_m` from OPF-held generation (W1 vol).  
- Enable off → offsets 0; still **show** measured if present.  
- Enable on + σ_s ≠ σ_m → existing RECON override.  
- Empty book / IV NO → sliders disabled, Vol shows no number.

## Done when

Inspector shows T7 / V6. `volOffsetPts` into `useOpfRiskGraph` equals `σ_s − σ_m`. Regression: `npx playwright test e2e/analyzer-create-position.spec.ts`.

## Invariants

OT-EF IV NO. Market bus one WS. OD-PF6: do not add a `/resolve` field.
