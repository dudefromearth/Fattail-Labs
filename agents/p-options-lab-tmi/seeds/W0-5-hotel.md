# Seed W0-5 — Hotel inspection honesty

**Project:** p-options-lab-tmi  
**Agent:** Hotel  
**Phase:** W0  
**Depends:** W0-2  
**Law:** TMI-37–40 · TMI-K1–K3 · DL-309 · TMI-12 `long` 10 s  
**Gate it feeds:** W0-G

## Ask

Confirm, BLOCKING vs ADVISORY:

1. Instant Replay of listed marks is **inspection**, not a fill and not a forecast.  
2. A 10 s film is a **sampled record**, not a print history. Clock **must** show step size.  
3. Missing listed leg → named OT-EF state, never a fake debit. Missing IV → **IV NO**, no interpolate.  
4. Do not upsample 10s→2s. Do not invent gens to pad a span.  
5. Green is not a trade signal.  
6. Analyzer GEX/Prob on a scrubbed gen stays **off** unless Coach §11.7 allows.

No product code.

## Done when

`gate-reports/W0-5-hotel.md`
