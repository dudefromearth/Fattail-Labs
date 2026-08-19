# Seed W0-3 — Echo What-if chrome and HUD label

**Project:** p-az-what-if-tm  
**Agent:** Echo  
**Phase:** W0  
**Depends:** W0-2 APPROVED  
**Law:** HI Spec v1.0 · Analyzer inspector (already shipped) · Surface v0.1.8 §4.6  
**Gate it feeds:** W0-G

## Intent

What-if rows stay HIG (44pt, inspector group). Time/Vol **readouts** (T7 / V6) are specified. Surface HUD must say **What-if**, not Time machine, if OD-2 A.

## Asks

1. Now / Last-trade ends + `11:45 ET · 4h 30m left` — load OK on the 360 inspector?  
2. Implied vol % (measured · scenario) vs banned member “pts”?  
3. Confirm `TimeHud` is the What-if τ walk to bind, not the W3-3 camera/playhead.  
4. Do not reopen inspector width.

## Files in scope

Spec §4 · Surface §4.6 / §5.3c · `AnalyzerControlsColumn.tsx` / `TimeHud.tsx` **read only**.

## Out of scope

Chrome implementation. New primitives. Analyzer rail remediaiton.

## Done when

`gate-reports/W0-3-echo.md` — workflow verdict shape. Block only HI invariant breaks.

## Invariants

Echo owns HIG. Charlie does not invent chrome later. Coach remaining-last-trade stays.
