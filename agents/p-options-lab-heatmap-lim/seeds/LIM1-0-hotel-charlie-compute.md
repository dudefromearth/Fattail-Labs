# LIM1-0 — Config + computeLim

**Project:** Options Lab Heatmap LIM  
**Agent:** Hotel · Charlie  
**Depends:** LIM0-G · LIM0-0  
**Feeds:** LIM1-G

## In scope (files — nothing else)

| File | Touch |
|------|--------|
| `web/lib/options-lab/templates/limConfig.ts` | **New** — Spec **Appendix A** keys; throw if missing/invalid or `W_*` ≠ 1.0. **Do not** throw at HeatmapChainPanel module load (C2: first LIM activation; other templates survive). |
| `web/lib/options-lab/templates/lim.ts` | **New** — `computeLim` → `LimResult` |
| `web/lib/options-lab/templates/lim.test.ts` | **New** |
| `web/lib/options-lab/templates/types.ts` | `ValueModeId` += `"lim"` only if needed for compile; layout may wait LIM3 |

## Out of scope

UI. Trail. `gex.ts` glow. Registry. Panel. `server/`.

## Law

- Input = `buildGexProfile(ctx, "gex_net")` + `ctx.spot`  
- Spec **v0.4.2**. **No `yUnclamped`.** E1: `xUnclamped = leanRaw`. E8: Y has no clamp.  
- E2: field is `crossingProximity`  
- E4: field is `nearSpotMix`; publish `netRatio`, `concF`, `magF`  
- Floors 0/100 (E9)  
- Intervals only; no midpoint  
- Proximity does not adjust x,y  
- Missing scale → `valid: false`  
- Empty → x 0, y 50  

## LIM1-G (this seed’s share)

AT-LIM1–13, 16, 17, 17b, 19, 20, 26, 28 green on fixtures. Existing GEX tests still pass. Other templates still render if a LIM key is absent (C2).
