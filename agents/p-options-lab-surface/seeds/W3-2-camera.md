# W3-2 — Camera: persp, orbit, Slow zoom, Fit, ISO

**Project:** Options Lab 3D Surface  
**Agent:** Charlie  
**Depends:** W3-1-G  
**Feeds:** W3-2-G  
**Order:** second W3 packet

## In scope

`web/lib/risk-graph/surfaceScene/` · Surface HUD camera cluster only.

Ship: **perspective** · **orbit** · zoom default **Slow** (DL-407) ·
**Fit** · factory view **ISO**. Camera / zoom gain must **not** reprice
(T-CAM-1). Echo words from `echo-labels.md`.

## Out of scope

Ortho (may exist in type; HUD not required this packet). Named-view
save/recall (W3-4). Playhead. Planes. Persist. Migration. Time-machine
feed. Backtest. MiniTwo. MSC.

## Evidence (W3-2-G)

- Desktop + phone browser walk: orbit, Slow zoom, Fit, ISO. HUD does
  not steal the mesh. Phone pinch uses Slow gain.  
- Curl: no new market endpoint.  
- Test: T-CAM-1.
