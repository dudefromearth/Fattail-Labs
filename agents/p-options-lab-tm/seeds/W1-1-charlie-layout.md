# Seed W1-1 — Charlie layout

**Project:** Options Lab Time Machine  
**Agent:** Charlie  
**Depends:** W0-G PASS  
**Law:** TM **v0.7.4** §6.1 · ATM-H1 placement · plan FP8 · plan as-built honesty  
**Files:** `web/components/options-lab/OpfRiskAnalyzer.tsx` (`analyzer-viewport-toolbar`) · `web/components/options-lab/AnalyzerTimeMachineStrip.tsx` (mount, do not invent a second strip)  
**Out:** watermark · badge · cache · past-day fetch · Heatmap/Surface chrome · mini window · Basic · TPO · 1× · Record · glow · `server/` film

## Ask

Seat Time Machine **immediately right of Autofit** in the same dark strip.

As-built (2026-08-27, re-quote before editing): toolbar is `grid-cols-[auto_minmax(min-content,1fr)_auto]`. Center wrap is Strikes/in → Autofit → PiP. Right column is the TM strip. Spec §11 "`ml-auto`" is stale. **Strikes/in is already left of Autofit.** Do not "move it left" as if it were still on the far right.

PiP must not sit between Autofit and the transport. Hit ≥44pt. No new widget. Date control already lives in the strip — do not add calendar fill or a mini window here.

## Done when

Layout matches §6.1 on Analyzer: Strikes/in | Autofit | Time Machine transport, in that order, in the dark strip. Echo W1-3 before Delta.
