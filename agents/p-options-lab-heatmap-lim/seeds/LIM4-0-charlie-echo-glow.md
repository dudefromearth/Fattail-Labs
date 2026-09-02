# LIM4-0 — Spot-line glow

**Project:** Options Lab Heatmap LIM  
**Agent:** Charlie · Echo  
**Depends:** LIM3-G  
**Feeds:** LIM4-G

## In scope

`templates/gex.ts` — **hook only** (spot line colour + glow). Companion profile in the LIM quadrant layout. Do not change `gex_v1` math. Do not change the frozen `gex` template’s default look when LIM is **not** selected.

## Out of scope

Highlighting a concentration bar. Second glow on crossing ticks (LIM29).

## Law

LIM28–29. One glow relationship. Anchor is **spot**, not a strike bucket.

## LIM4-G (this seed)

When LIM is selected, spot line matches the dot. When GEX template is selected, no LIM glow unless Echo recorded a shared token — default: GEX-alone is unchanged.
