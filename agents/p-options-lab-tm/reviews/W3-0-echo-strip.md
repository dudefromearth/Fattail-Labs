# Echo — dark strip affordance (before W3)

**Verdict:** **RETURNED** the horizontal scroll. **APPROVED** wrap + compact collapse.

**Agent:** Echo  
**Date:** 2026-08-28  
**Law:** HI Spec v1.0 §2 Clarity / Direct manipulation / User control · TM v0.7.4 §6.1 · TMI-20

---

A member who is **in replay** must reach **Pause** without a second gesture. Overflow-x-auto made Pause a scroll target. That is the wrong affordance. The spec seats the transport beside Autofit because that is **where it belongs**, not because the row happens to fit.

**Grammar (Charlie, this packet, before watermark):**

1. **Do not scroll the dark strip** as the way to reach Play / Pause / Stop / Reset.
2. **Wrap.** The dark strip is two rows when needed, both above the canvas:
   - **Row 1:** Symbol · Spot · VIX · Strikes/in · Autofit · PiP
   - **Row 2:** Time Machine transport, full width of the dark strip — date, Play, Pause, Stop, speeds, Reset.
3. **Compact collapse**, not scroll: on a narrow strip, speeds collapse to **one** chip that shows the current speed and cycles 10× → 20× → 50×. Date + Play + Pause + Stop + Reset stay visible. Hits stay ≥44pt.
4. Do not invent a new widget. Do not move transport into the plot.

W3 must not add the watermark into that row.
