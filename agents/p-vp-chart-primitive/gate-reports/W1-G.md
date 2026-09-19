# W1-G — Attach primitive

**Verdict:** PASS (GO)  
**Date:** 2026-09-19  
**Law:** AZ-VP-9-A23 · DL-764

Evidence: `attachPrimitive` at series create; `SA_VP_OVERLAY_ENABLED = false`; overlay DOM remains; `/range` → bins → `requestUpdate()`; pane-only `panePriceWindow`; zOrder `"top"`; no autoscaleInfo. Tests `saVpBand.test.ts` + `saVpSeries.test.ts` ok. Member route SSR 200 with `data-vp-paint="primitive"`.

Not claimed: Playwright pan/zoom of blue bars (W4).
