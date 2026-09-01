# Seed P3-1 — Alpha visibility route

**Project:** OPF Generation Plane  
**Agent:** Alpha  
**Depends:** P2-G  
**Law:** GP22a · GP22b · GP8 · AT-GP16 · AT-GP18  
**Files:** `server/routes/market_generation.py` (new) · `server/main.py` (router)  
**Out:** `_require_tool_member` · guessing `book` · returning `supplied` · chrome

## Ask

`GET /api/me/market/generation?product=&expiration=&book=`

Envelope exactly spec §7. `book` is a required parameter (GP2c). Owned only. Feed clock and store clock are separate objects. `bus` ∈ `up | down | not_configured`. States `present | stale | cold | broken`.

Auth: wire Mike’s W0-3 design, or fail closed waiting on P6 — **never** Trade Log write.

## Done when

Kilo P3-3. Mike P3-2.
