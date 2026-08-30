# W1-G — Time Machine layout + §13 parents

**Agent:** Delta  
**Date:** 2026-08-27  
**Verdict:** **PASS**

**Law:** plan v1.2 W1-G · TM v0.7.4 §6.1 · spec §13

## Evidence

| Check | Evidence |
|-------|----------|
| TM immediately right of Autofit | `OpfRiskAnalyzer.tsx` wrap: Autofit L2051 → `<AnalyzerTimeMachineStrip` L2055 → PiP L2112 |
| Strikes/in left of Autofit | L2025 then L2051 |
| PiP not between | PiP after the strip |
| No second strip | one `AnalyzerTimeMachineStrip` mount |
| Characterization | `web/lib/options-lab/analyzerPip.test.ts` order assert |
| Echo | `reviews/W1-3-echo.md` APPROVED |
| §13 one-liners | Analyzer, What-If, Heatmap Templates, Width Fit, Surface §4.6, Trade Log §4.4, AZ-ALGO, Arch 28, **DL-600** |
| Fail-closed this wave | no watermark added; no `server/` film; no Basic chrome; parents not skipped |

## Unblocks

W2 — two-slot browser cache + playhead owner.
