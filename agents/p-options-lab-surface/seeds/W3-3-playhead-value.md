# W3-3 — Time playhead SAMPLE + Value @$0

**Project:** Options Lab 3D Surface  
**Agent:** Charlie  
**Depends:** W3-2-G  
**Feeds:** W3-3-G  
**Order:** third W3 packet

## In scope

Time-range HUD + playhead \(\tau^*\) as **sample only** (does not
rebuild IV). Value plane default **$0**. Live/What-if: bind IVs stay;
walking τ does not re-cascade. Last-minute **law** still holds (no
last-hour fill; residual after settlement).

`web/lib/risk-graph/surfaceInspect.ts` (if new) · scene plane meshes ·
HUD time + value readout.

## Out of scope

Time-machine **snap rebind** (T-TM-1/4 later). Strike-plane HUD (W3-4).
Saved views. Migration. Mini graphic. Backtest. MiniTwo. MSC.

## Evidence (W3-3-G)

- Desktop + phone browser walk: scrub playhead; mesh IVs unchanged;
  Value plane parks at $0.  
- Curl: no new market endpoint.  
- Tests: T-SMP-1 · T-LM-5 (Friday must not wear last-minute gold if a
  cadence chip is shown) · T-LM-6 (spot cell ≠ `evaluatePnlAtSpot`).
