# H1-0 — Alpha · Kilo: OC2 proxy-safe spot

**Agents:** Alpha · Kilo  
**Gate:** H1-G

## Task

1. Spot from Massive chain `underlying_asset.value` first.  
2. Non-proxy `market_live_marks` only as fallback.  
3. Proxy product mark (e.g. SPY mid for SPX) → **not** used for band/highlight; 503 if no usable spot.  
4. Payload includes `spot_source`.  
5. Kilo: Spec §7.12.

## Invariants

OC2 · OC14 · no silent scale.

## Completion

pytest + curl evidence in gate-reports.
