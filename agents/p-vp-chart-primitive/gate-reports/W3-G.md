# W3-G — Demolition

**Verdict:** PASS (GO)  
**Date:** 2026-09-19  
**Law:** AZ-VP-9-A23 · DL-764

Grep on `web/**/*.{ts,tsx}`: no `redrawVp`, `sa-vp-overlay`, `SA_VP_OVERLAY_ENABLED`, `overlayRef`, `setInterval(ensure`. Hit-test: LWC `ISeriesPrimitive.hitTest` on `VpHistogramPrimitive` + `hostToPane`. Overlay flag demolished; does not ship.
