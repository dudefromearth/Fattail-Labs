# Seed W3-1 — Charlie narrative window

**Project:** p-az-algo  
**Agent:** Charlie  
**Phase:** W3  
**Depends:** W2-G PASS  
**Law:** AZ-ALGO §6 · §9 · §10  
**Gate it feeds:** W3-2 · W3-G

## Intent

Floatable play-by-play while Waiting / Armed / Recorded. Local sentences. **No HostPnLChart.**

## Files in scope

- **New** `web/components/options-lab/AlgoNarrativePanel.tsx`  
- **New** `web/lib/options-lab/algoNarrative.ts` + tests  
- `OpfRiskAnalyzer.tsx` — mount only

## Out of scope

Canvas geometry · TimeOrthoEggPanel import · LLM fetch · VP overlay build

## Wire

1. Show when algo is Waiting/Armed/Recorded. testid `analyzer-algo-narrative`.  
2. Drag; own localStorage key (not T Ortho’s). Default **left of canvas**.  
3. Voices: GEX iff GEX on; VP iff engaged else **absent**; algo/position always; decay with `f`; **side** named on flip.  
4. Far copy ≠ near decay copy. Recorded includes `exit_side`. No profit claims.  
5. HI tokens. Keep-Warm cadence (not 1s).

## Done when

AT-ALGO-9 characterization (omit GEX/VP; far sentence present). Tests on `algoNarrative.ts`.

## Invariants

FP10 · Tango W0-4 allowed/forbidden lines.
