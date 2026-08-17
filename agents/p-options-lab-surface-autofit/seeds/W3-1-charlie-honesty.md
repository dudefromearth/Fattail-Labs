# W3-1 — Trigger freeze and union honesty

**Project:** Options Lab Surface Autofit  
**Agent:** Charlie · Kilo  
**Depends:** W0-G · W1-G · W2-G  
**Feeds:** W3-G

## In scope (files — nothing else)

| File | Touch |
|------|--------|
| `web/lib/risk-graph/surfaceAutofit.ts` | window · union · `autofitShouldRun` |
| `web/lib/risk-graph/surfaceAutofit.test.ts` | AT-AF-1…7 |
| `web/components/options-lab/surface/SurfaceApp.tsx` | Autofit **call site only** (`surfaceAutofitWindow` / freeze / `autofitGen`) |
| `web/components/options-lab/surface/CameraHud.tsx` | Autofit **button copy only** |

## Out of scope

Any other file. AF-n profiles. Analyzer `autofitView.ts`. Camera Fit
rewrite. MiniTwo. Scene, TimeHud, persist, Arch/Specs.

## W3-G

**PASS** only with command evidence (`npx tsx lib/risk-graph/surfaceAutofit.test.ts`)
and a named walk: add a shown position → window changes; drag What-if /
playhead → window does not; Autofit button → window + Fit.
Diff must not include files outside the table.
