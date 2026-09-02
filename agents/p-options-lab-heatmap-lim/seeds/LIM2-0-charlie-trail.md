# LIM2-0 — Trail buffer

**Project:** Options Lab Heatmap LIM  
**Agent:** Charlie  
**Depends:** LIM1-G  
**Feeds:** LIM2-G

## In scope

`web/lib/options-lab/templates/limTrail.ts` · `limTrail.test.ts`

## Out of scope

Quadrant SVG. Transition chrome (flag stays false). Distance-based emission.

## Law

Spec **v0.4.2**. Fixed interval `LIM_TRAIL_INTERVAL_S`. Window `LIM_TRAIL_WINDOW_MIN`. Coordinates `(xUnclamped, y)` — **no yUnclamped**. Uniform size, opacity by age. **Reset immediately** on session open, **expiration change, and symbol change** (E13 · AT-LIM25). Ghosts may leave the plane (AT-LIM13).

## LIM2-G (this seed)

AT-LIM13 trail-past-edge · AT-LIM14 cluster · AT-LIM15 spread · AT-LIM25 exp/symbol reset.
