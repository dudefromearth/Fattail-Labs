# LIM1-2 — Formula match (out)

**Agent:** Hotel  
**Depends:** LIM1-0  
**Law:** Spec v0.4.3 §5–6 · §8 · Appendix A  
**Read:** `web/lib/options-lab/templates/lim.ts` against the spec. No new product law.  
**Date:** 2026-09-02

## Match (each formula)

| Spec | `lim.ts` | Verdict |
|------|----------|---------|
| `centre = Σ \|net\| × (K − spot) / Σ \|net\|` | `weighted / totalAbs` | **Match** |
| `leanRaw = centre / LIM_CENTRE_SCALE_PTS[symbol] × 100` | `(centrePts / scale) * 100` only when the symbol is in the map | **Match** |
| `lean = clamp(leanRaw, −100, +100)` | `clamp(xUnclamped, -100, 100)` | **Match** |
| `xUnclamped = leanRaw` (E1) | `xUnclamped` | **Match** |
| Empty / `Σ\|net\|==0` → x 0, y **50** | `emptyState` | **Match.** Blend is not used. |
| `netRatio = gexClose / absGexClose` else 0 | same | **Match** |
| `netF = (netRatio + 1) / 2 × 100` | same | **Match** |
| `concF / magF` floors + span × ratio | `LIM_CONC_*` / `LIM_MAG_*` | **Match.** Floors 0 / spans 100. |
| `nearSpotMix = netF×W_NET + concF×W_CONC + magF×W_MAG` | same; **no clamp** | **Match** (E8) |
| Walk ascending, skip `net==0` | `filter net !== 0` then sort | **Match** |
| Crossing `{ lo, hi, netBefore, netAfter, steepness }` | `LimCrossing` | **Match.** No midpoint field. |
| `steepness = \|Δnet\| / (hi − lo)` (E16) | `/ width` where `width = hi - lo` | **Match.** `ctx.strikeStep` is not read. |
| `dist` inside → 0 else min to lo/hi | `crossingDist` | **Match** |
| `dPct = dist / spot × 100` (E15) | `(bestD / spot) * 100` | **Match** |
| `crossingProximity = clamp((dPct − floor) / (ceil − floor), 0, 1)` | same | **Match** |
| No nearest → proximity 1 | initial `1` | **Match** |
| `spotBelowNearestCrossing = spot < lo` (E17) | `spot < best.lo` | **Match.** Inside is false. |
| No nearest → below false | initial `false` | **Match** |
| Proximity does not move x, y | x, y assigned from lean / mix only | **Match** |
| Missing scale → `valid: false`; no fallback | `hasScale`; lean left at 0 | **Match.** F1 on `I:NDX` is not x=10. |
| GEX numbers from existing profile | `buildGexProfile(ctx, "gex_net")`; `net ← value` | **Match.** `gex.ts` not rewritten. |

## Defects

None enumerated. Goldens F1–F9 land on Hotel’s expected-value index without rounding.

## Not in this packet

Retuning weights. Tape claims. Chrome. Trail.
