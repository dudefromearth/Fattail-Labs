# LIM1-2 — Formula match

**Project:** Options Lab Heatmap LIM  
**Agent:** Hotel  
**Depends:** LIM1-0  
**Feeds:** LIM1-G

## In scope

Read `lim.ts` against Spec §5–6. No new product law.

## Out of scope

Retuning weights. Tape claims.

## Work

1. Lean uses `centre / LIM_CENTRE_SCALE_PTS[symbol] × 100`.  
2. Y blend uses Spec floors/spans/weights. Factors recombine (AT-LIM16).  
3. GEX numbers come only from existing `gexNet` / profile.  
4. No `(lo+hi)/2`.

## LIM1-2 done

Written match or enumerated defect. No silent “looks right.”
