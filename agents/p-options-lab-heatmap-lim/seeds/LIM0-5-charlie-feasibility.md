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
3. Next env: if the bundler requires `NEXT_PUBLIC_`, record the prefix as a seam — logical names stay Spec §9.  
4. `HeatmapChainPanel` today branches `table | matrix | profile`. Quadrant is a **new** branch. Frozen GEX profile path stays.  
5. Do not change default Heatmap template (`sym-fly`).

## LIM0-5 done

Feasibility note names files, the env seam, and the panel branch. No code.
