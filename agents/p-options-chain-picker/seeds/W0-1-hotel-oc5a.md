# W0-1 — Hotel: OC5a sign

**Agent:** Hotel  
**Gate:** W0-G

## Task

Sign in writing (gate report):

1. **Proxy vol marks never valid σ inputs** (VIXY dollars / `massive_proxy_v1` → ignore).  
2. **Tenor:** DTE 0–1 prefer non-proxy **VIX1D**; else non-proxy **VIX**; else domain fallback band.  
3. **Time factor:** √T uses **max(1, dte)** so 0DTE band is non-empty.  
4. Fallback band formula (3% of spot × √days × σ/2 or Spec domain text).

## Out of scope

UI chrome. MSC.

## Completion

`gate-reports/W0-1-hotel-oc5a.md` — SIGNED.
