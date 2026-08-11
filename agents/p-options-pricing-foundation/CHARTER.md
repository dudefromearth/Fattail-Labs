# Charter — Options Pricing Foundation board

**Program:** Options Pricing Foundation (OPF)  
**Plan:** [`docs/Options-Pricing-Foundation-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Options-Pricing-Foundation-Full-Agent-Bench-Plan-v1.0.md)  
**Law:** [`Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md`](../../Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md) · [`Architecture/30-options-pricing-foundation.md`](../../Architecture/30-options-pricing-foundation.md)

## Mission

Ship **foundation L0–L4 only**: dual-side multi-exp market facts, pricing plane (marks, IV, lock), use-case model packs, headless resolve API.

**Out of scope:** Heatmap / Analyzer / GEX / bot UI wiring (L5).

## Invariants

1. MSC is not the standard.  
2. No app-private Massive or IV paths.  
3. Fail loud: incomplete legs, truncate, surface fit, missing archive.  
4. Headless proof before any L5 program.  
5. Doctrine: seeds only; Delta ternary; Coach overrule via DL.

## Seating

See plan §3.2 (India · Alpha · Hotel · Kilo · Foxtrot · Juliet · Lima · Delta · …).
