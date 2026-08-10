# W0-1 — Hotel OC5a SIGNED

**Status:** PASS  
**Date:** 2026-08-10  

## Signed law (OC5a)

1. **Proxy vol marks are never valid σ inputs.**  
   Source containing `proxy` / `massive_proxy_v1` / VIXY path → **ignore**; use domain fallback band.

2. **Tenor:** DTE 0–1 → prefer non-proxy **VIX1D** mid as vol%; else non-proxy **VIX**; else fallback.

3. **Time factor:** √T uses **effective_days = max(1, dte)** so 0DTE never yields zero-width band.

4. **Fallback band:**  
   `band = spot × 0.03 × √effective_days × (sigma / 2)`  
   With usable vol%:  
   `em = spot × (vol_pct/100) × √(effective_days/252)` · `band = max(spot×0.005, sigma×em)`.

## Implementation handoff

H1-1 owns characterization; domain already implements max(1,dte) + proxy source filter.
