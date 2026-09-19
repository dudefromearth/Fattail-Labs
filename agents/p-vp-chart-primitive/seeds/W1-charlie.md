# W1 — Attach and wire VpHistogramPrimitive

**Project:** AZ-VP-9-A23  
**Agent:** Charlie  
**Gate:** W1-G  
**Law:** `Specs/AZ-VP-9-A23.md` (content frozen). Do not invent scope.

## Files in scope
- `web/lib/saVpSeries.ts`
- `web/lib/saVpBand.ts` (read; pane-only y for fetch band only if needed)
- `web/components/sa/SaPriceChart.tsx`
- Tests beside those files if you add them

## Out of scope
- VP service, API, ingest
- MiniTwo
- W2/W3 demolition (overlay stays, **disabled behind a flag**)
- `Specs/VP-Overlay-Spec-v0_1.md` (contract overlay — different law)

## Do
1. `attachPrimitive(VpHistogramPrimitive)` on the candlestick series at series creation.
2. Implement missing `updateAllViews()` on the primitive.
3. `/range` completion: set bins, then `requestUpdate()` — no 2D blit from the fetch path.
4. Coordinate math inside the renderer using the engine coordinate space. Host-box `coordinateToPrice(0)` / `clientHeight` band calc → pane-only extent.
5. zOrder stays `"top"`.
6. Overlay canvas remains in the DOM **disabled** behind a named flag (e.g. `SA_VP_OVERLAY_ENABLED = false`). Default off. Does not paint. Flag exists only until W3.

## Gate W1-G (must be true)
- Profile renders via the primitive.
- Overlay present but disabled (flag false).
- Pan, zoom, resize repaint the profile with **zero** app-side `redrawVp` calls for those gestures (engine paint loop).
- Guest-layer: primitive does not override autoscale or mutate candle data.

## Machine
StudioTwo. Do not kill :3000/:4000. Do not deploy MiniTwo.
