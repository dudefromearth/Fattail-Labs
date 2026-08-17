# W1-G — Echo Autofit labels

**Verdict:** **PASS**  
**Date:** 2026-08-17  
**Agent:** Delta (evidence) · Echo (labels gated)

---

## Evidence

| Check | Evidence | Result |
|-------|----------|--------|
| Labels file gated | `echo-labels.md` Status **GATED** · signed Echo 2026-08-17 | **PASS** |
| Autofit word | CameraHud line 50: `Autofit` · `data-testid="surface-autofit"` | **PASS** |
| Fit word | CameraHud line 42: `Fit` · `data-testid="surface-fit"` | **PASS** |
| Two jobs | Autofit ≠ Fit; no “Fit all” / “Time machine” on Autofit | **PASS** |
| ≥44pt | `min-h-11` on both buttons | **PASS** |
| No extra HUD | No new drawer or third Autofit control | **PASS** |

**Defects:** none.

W3 still waits on W2-G.
