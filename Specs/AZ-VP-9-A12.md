# Amendment AZ-VP-9-A12 — The Full-History Profile

**Date:** 2026-09-18
**Authority:** Coach directive (reconciliation session, verbatim
intent): the profile is anchored left or right (user setting), in
sync with the price axis, showing the full time scope — all
historical volume since the beginning of time — constrained only by
the visible price axis and scaled to the current viewport. This is
explicitly NOT TradingView's Visible Range Volume Profile.
**Supersedes:** A4 clause 4's x-axis behavior FOR THE PROFILE — the
profile no longer aggregates over the visible time window. A4's
x-range control now governs the PRICE LAYER's span only. Everything
else in A2–A11 stands.

## The profile law

1. **Anchoring:** left or right axis, user-selectable in the
   profile layer's settings (A2.4 reaffirmed; the A10 dialog hosts
   it).
2. **Full-history attribution, always:** each visible price row's
   bar represents ALL volume ever transacted in that row across the
   entire archive — from the coverage floor to now. The profile is
   **x-invariant**: panning or zooming time changes the price
   layer, never the profile. (SA-L2 full attribution made display
   law; recorded differentiator: unlike VRVP, extending or moving
   the view never rewrites the terrain.)
3. **Price-constrained:** the visible y-window selects WHICH rows
   render; pan/zoom of the price axis re-slices the profile
   accordingly.
4. **In sync with the price axis:** profile rows align exactly to
   the axis's price positions at all times — one scale, no drift.
5. **Viewport-scaled:** bar lengths normalize to the maximum volume
   among the VISIBLE rows, occupying up to a configured fraction of
   canvas width; relative volumes within the view are preserved.
   Re-slicing the y-window re-normalizes.
6. **Coverage honesty:** "beginning of time" means the coverage
   floor, which advances nightly with backfill; the span chip
   (A11.4) reads "Full history · since <floor>" and truncation is
   never silent (Contract v1.1 law).
7. **Engine backing:** the all-history running per-row totals
   (Q6 = (c), spec law) are hereby REQUIRED as the primary
   display's backing store; their build authorization is granted by
   this directive — the composite fence on VPS2-W0 lifts for this
   work under its own recorded work item. Serving is
   contract-compatible today via /range over the full covered
   span; a dedicated composite endpoint is a later optimization,
   proposed not improvised.
8. The Exploration phase's click-drag interrogation of a chosen
   span (SA §8a) remains a separate future tool — bounded slices on
   demand; the PRIMARY profile is always the full history.

## Standing

Citable display law until folded into the SA spec's next authored
version. Surface work binds to A12 from this date.
