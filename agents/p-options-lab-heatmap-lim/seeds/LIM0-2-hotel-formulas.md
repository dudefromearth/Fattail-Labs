# LIM0-2 — Golden math + scale map

**Project:** Options Lab Heatmap LIM  
**Agent:** Hotel  
**Depends:** —  
**Feeds:** LIM0-G · OD-LIM4 · LIM1-0

## In scope

`agents/p-options-lab-heatmap-lim/hotel-golden.md` — **write**. LIM Spec §5–6 · §9 · §12.

## Out of scope

Code. Tape sitting (§15.3). Inventing a relationship between near-spot mix and price resistance. Volume.

## Work

1. Golden numeric fixtures for AT-LIM1–13 and AT-LIM16 (synthetic `StrikeNet[]` + spot).  
2. Confirm X and Y stay independent (AT-LIM6).  
3. Crossing walk: intervals only; `steepness`; no midpoint.  
4. `LIM_CENTRE_SCALE_PTS` proposal (OD-LIM4). If silent: `{"I:SPX": 50}` only.  
5. Dealer-sign caveat stays on chrome (Spec §12.1). Do not verify inventory from the chain.  
6. State plainly: whether the mix resists price is **unmeasured**.

## LIM0-2 done

`hotel-golden.md` lists fixtures, scale map rec, and the unmeasured sentence.
