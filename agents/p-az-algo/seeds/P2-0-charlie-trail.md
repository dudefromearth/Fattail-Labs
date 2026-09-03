# Seed P2-0 — Charlie gate / Batman / legacy / floor wiring

**Project:** p-az-algo  
**Agent:** Charlie  
**Phase:** P2  
**Depends:** P1-G  
**Law:** E4 · E6 · E19 · E20 · E23 · AT-ALGO-5/5b/5c/6/8/10/16/23/25/29/30  
**Gate it feeds:** P2-G

## Intent

Extend `algoTrailMath.ts`: `risk_taken`, Batman `working_side` / ambiguous, gate, legacy `S=(1−g)×H`, apply E23 floor to **proposed** only, `H` reset on side switch, override `REENTRY_BARS`.

## Out of scope

`algoEval.ts` (**NX13**). HUD / canvas (P3). Live tick (P5). Flatten.

## Done when

Fixtures 10–12, 15–16 have a home. Ambiguous paints nothing. Legacy clock-only named when `E(t)` null.
