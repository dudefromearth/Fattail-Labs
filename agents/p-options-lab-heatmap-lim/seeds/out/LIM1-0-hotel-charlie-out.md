# LIM1-0 — Config + computeLim (out)

**Project:** Options Lab Heatmap LIM  
**Agents:** Hotel (goldens already on disk) · Charlie (this packet)  
**Depends:** LIM0-G PASS · LIM0-0 GO (`agents/go/OLLIM-W0.md` · **DL-651**)  
**Law:** Spec **v0.4.3** (E1–E17). Seed text still says v0.4.2; implementation is v0.4.3.  
**Date:** 2026-09-02

## Files touched

| File | Touch |
|------|--------|
| `web/lib/options-lab/templates/limConfig.ts` | **New** — Appendix A parse; throw if missing/invalid or `W_*` ≠ 1.0; **not** at module load (C2) |
| `web/lib/options-lab/templates/lim.ts` | **New** — `computeLim` / `computeLimFromNets` → `LimResult` (no unclamped Y) |
| `web/lib/options-lab/templates/lim.test.ts` | **New** — Hotel F1–F9 + AT-LIM1–13, 16, 17, 17b, 19, 20, 26, 28–31 |
| `web/lib/options-lab/templates/types.ts` | **Unchanged** — `"lim"` / `"quadrant"` wait LIM3 (compile did not need them) |

**Out of scope (honored):** UI · trail · `gex.ts` glow · registry · panel · `server/`

## Law implemented

- Input = `buildGexProfile(ctx, "gex_net")` mapped `{ strike, call, put, net: value }` + `ctx.spot`
- E1: `xUnclamped = leanRaw`; X clamp live
- E8: no Y clamp; no unclamped-Y field
- E2: field `crossingProximity`
- E4: field `nearSpotMix`; `netRatio`, `concF`, `magF` published
- E9: floors 0/100
- E15: `dPct = dist/spot × 100`
- E16: `steepness = |netAfter − netBefore| / (hi − lo)`
- E17: `spotBelowNearestCrossing = spot < lo`; inside is false
- Intervals only; no midpoint
- Proximity does not adjust x, y
- Missing scale → `valid: false`; no fallback
- Empty / `Σ|net|==0` → x 0, y 50 (LIM8 constant, not the blend)
- JR3: `oiAsOf` defaults `null` (named hole later)
- C2: `loadLimConfig()` on first activation; import of `limConfig.ts` is side-effect free
- Bundler seam: `NEXT_PUBLIC_` + Appendix A key, then Appendix A key; errors name `LABS_LIM_*`

## Evidence

```
cd web && npx --yes tsx lib/options-lab/templates/lim.test.ts
lim.test.ts ok
```

Frozen templates (same command batch): `chainContext GEX 10 tests passed` · `widthFit.test.ts ok`.
