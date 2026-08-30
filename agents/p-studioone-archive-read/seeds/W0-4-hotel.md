# Seed W0-4 — Hotel trading-domain

**Project:** p-studioone-archive-read  
**Agent:** Hotel  
**Phase:** W0  
**Depends:** W0-2  
**Law:** OT-EF v1.1 · SO-AR v0.8 + A1 · 0DTE · `OUT OF WINDOW` vs `AMBIGUOUS INSTANT`  
**Gate it feeds:** W0-G

## Ask

**APPROVED** or **RETURNED**. BLOCKING vs ADVISORY.

1. Fetch payload is OPF truth. Missing strikes stay missing. No filled GAP.  
2. Archive is **0DTE only**. Do not serve a 7DTE structure from this corpus. Named hole, not a reconstructed later expiry.  
3. Capture band (~2.5σ, ratchet) is **OPF**, not this API inventing strikes.  
4. TAP RESTART: keeping both clocks is honest; silent dedup is not.  
4b. `OUT OF WINDOW`: no candidate inside. Two candidates that cannot be separated → **`AMBIGUOUS INSTANT`**, never OUT OF WINDOW.  
5. Cadence stats (§4.7) measure writes; they do not imply fills or edge.

## Done when

Written verdict. No product code.
