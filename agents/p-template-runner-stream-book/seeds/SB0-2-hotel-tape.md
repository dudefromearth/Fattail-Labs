# SB0-2 — Generation tape, units, Confidence

**Project:** Template Runner Stream Book  
**Agent:** Hotel  
**Depends:** —  
**Feeds:** SB0-G · SB3-1

## In scope

Stamp [`../hotel-tape.md`](../hotel-tape.md):

1. **Median range (Advisor SB-13).** As-built Width Fit footer median is the median of `assignColors` **scored** cells. Those scores are weighted `minMax01` components times a stability penalty ∈ (0,1], so the median is a **unit-interval fit score [0,1]**. Therefore ranking `round(mean × 100)` is an honest display map, not a clamp that walls at 100. If Hotel finds a path where median can exceed 1, ×100 is forbidden until a named map exists.  
2. **Min-over-window stability (Advisor SB-14).** Using the **minimum** per-gen stability in the Average window for Confidence is the conservative reading: one unstable generation may pull Confidence down. Hotel stamps that as the checked choice (not a quiet Juliet law).  
3. L24 cuts: High / Moderate / Low from valid \(n\) vs `min_valid_n`, #1−#2 median gap, and that min stability. Write the numeric cuts.  
4. Tape: no interpolated strikes/mids/greeks. Average is observation, not pin/magnet/forecast. No GEX language on Width Fit Average.

## Out of scope

Code. Choosing L23 (Coach). New GEX formula.

## Done

`hotel-tape.md` has: [0,1] confirmation (or a named exception), min-stability sentence, Confidence cuts, forbidden claims.
