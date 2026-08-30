# W0-3 Echo — Time Machine chrome grammar

**Verdict:** **APPROVED**

**Agent:** Echo  
**Date:** 2026-08-27  
**Law:** HI Spec v1.0 · TM v0.7.4 §6 · TMI-25 · TMI-81 · TMI-27 · TMI-40 · plan v1.2

No `web/` files touched.

---

1. **First Analyzer packet is a layout move, not a new widget.** As-built: Strikes/in is already left of Autofit (`OpfRiskAnalyzer.tsx` L2025 then L2051). PiP (`L2061`) currently sits between Autofit and `AnalyzerTimeMachineStrip` (right column L2084–2085). W1 seats the existing strip **immediately right of Autofit**. Mini window is **not** W1. Hits stay ≥44pt (`min-h-11` already on the strip and Autofit). No new control family.

2. **Time Machine has no glow.** As-built still draws a **blue** inset while `tmActive` (`data-glow="timemachine"`, `rgba(59,130,246,0.55)`, L2142–2144). That paint is retired law (TMI-25 / §0.57). W3 removes it. **What-if red stays** (`data-glow="whatif"`, L2146–2151). Both tells may show at once once the watermark exists: red = What-if, REPLAY watermark = replay. They do not compete for one signal.

3. **Tells (W3 grammar, not W1):**
   - **REPLAY watermark** on Analyzer, Heatmap, Surface. Behind the plot. Low contrast. **Not green, not any P&L colour.** `pointer-events: none`. Reduced-motion = **static**, never a pulse. Test ids `analyzer-replay-watermark` / `heatmap-replay-watermark` / `surface-replay-watermark` with `data-replay`.
   - **Badge:** half recycle, counter-clockwise curved arrow, rehearsal cards only. Same language at two scales.
   - Copy names **Time Machine**. Not Instant Replay. Not Day. Not a derivation.

4. **Reset** matches What-if Reset: same word, plain chrome, already on the strip (`data-testid="analyzer-tm-reset"`). Do not invent Leave / Clear.

5. No emoji. Dark-pinned tokens. Compact 44pt.

**ADVISORY (not blocking W0):** the as-built blue glow must not ship past W3. Speed chips currently use `bg-sky-500/30` when selected (`AnalyzerTimeMachineStrip.tsx`) — Echo W3 should keep speed selection out of P&L green; sky is not profit-green, but it must not become a second “TM colour.”

## § Bench delta

W1 has an exact seat (Autofit then strip, PiP after). W3 has an exact kill (`data-glow="timemachine"`) and an exact keep (`data-glow="whatif"`).
