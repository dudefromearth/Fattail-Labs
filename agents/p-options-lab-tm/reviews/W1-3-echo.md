# W1-3 Echo — layout review

**Verdict:** **APPROVED**

**Agent:** Echo  
**Date:** 2026-08-27  
**Law:** HI Spec v1.0 · TM v0.7.4 §6.1

Source order in `OpfRiskAnalyzer.tsx` `analyzer-viewport-toolbar` wrap, after this packet:

1. Strikes/in (`analyzer-autofit-width`) — already left of Autofit  
2. Autofit (`analyzer-autofit`)  
3. `AnalyzerTimeMachineStrip` (existing widget; not a new control)  
4. PiP (`analyzer-pip-toggle`)

PiP is not between Autofit and transport. Hits remain `min-h-11` / 44pt. No glow added. No mini window. Grid dropped the empty far-right column so the strip sits in the same dark strip as Autofit.

Desktop wrap will keep that order; compact wrap still reads Autofit then TM then PiP.

**Not verified in a live browser this packet** — characterization test locks the source order.
