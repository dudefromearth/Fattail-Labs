# W3-G — Trigger freeze and union honesty

**Verdict:** **PASS**  
**Date:** 2026-08-17  
**Agent:** Charlie · Kilo · Delta  
**Files touched this wave:** `web/lib/risk-graph/surfaceAutofit.test.ts` only (AT-AF-5 button read). No other paths.

---

## Evidence

| Check | Evidence | Result |
|-------|----------|--------|
| AT-AF-1…7 | `cd web && npx tsx lib/risk-graph/surfaceAutofit.test.ts` → `surfaceAutofit.test.ts ok` exit 0 | **PASS** |
| Union | `unionListedStrikes` + AT-AF-6 two-structure window | **PASS** |
| Triggers | `autofitShouldRun`: book-change + button true; what-if / live-spot / playhead / camera-fit false | **PASS** |
| Call site freeze | `SurfaceApp.tsx` 241–256: reuse when `bookFitKey` + `autofitGen` unchanged | **PASS** |
| What-if / live mid | `volOffsetPts` / `spotPct` / `liveSpot` rebuild sheet; reuse hold unless key/gen change | **PASS** |
| Playhead | `tauStar` not in fit hold key; playhead only `setInspect` | **PASS** |
| Fit vs Autofit | `onFit` → `scene.fit()` only. `onAutofit` → `setAutofitGen` + `fit()` | **PASS** |
| Button copy | CameraHud **Autofit** / **Fit** · testids present | **PASS** |
| Diff scope | W3 edit = `surfaceAutofit.test.ts` only | **PASS** |

**Defects:** none.

W4 unblocked.
