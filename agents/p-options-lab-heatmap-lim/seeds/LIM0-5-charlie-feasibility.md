# LIM0-5 — Feasibility

**Project:** Options Lab Heatmap LIM  
**Agent:** Charlie  
**Depends:** —  
**Feeds:** LIM0-G · JR1

## In scope

`agents/p-options-lab-heatmap-lim/charlie-feasibility.md` — **write**. Plan §6.

## Out of scope

Implementation. Rewriting `gex.ts` math. Panel code.

## Work

1. Confirm `buildGexProfile(ctx, "gex_net")` is sufficient input.  
2. File split: `limConfig.ts` / `lim.ts` / `limTrail.ts` / `HeatmapLimQuadrant.tsx` / panel branch.  
3. Next env: if the bundler requires `NEXT_PUBLIC_`, record the prefix as a seam — logical names stay Spec **Appendix A**; never a second constant set.  
4. `HeatmapChainPanel` today branches `table | matrix | profile`. Quadrant is a **new** branch. Frozen GEX profile path stays.  
5. Do not change default Heatmap template (`sym-fly`).  
6. **No `yUnclamped`.** Trail resets: session + expiration + symbol (E13).  
7. **C2 fail-loud blast radius:** `limConfig.ts` must **not** throw at HeatmapChainPanel module load. Parse on **first LIM activation**; panel catches at the template boundary; render LIM unavailable **with the missing key named**; other templates unaffected. No silent default. If this cannot be scoped, it is a finding for the token, not a softening.

## LIM0-5 done

Feasibility note names files, the env seam, and the panel branch. No code.
