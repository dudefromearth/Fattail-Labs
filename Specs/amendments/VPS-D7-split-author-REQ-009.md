# VPS errata — D7 split-author (REQ-009)

**Date:** 2026-09-20  
**Parent:** Volume-Profile-Service-Spec-v0_6_1.md §0 named dependencies, §5.1 Row assignment  
**Companion:** `Specs/FatTail-Labs-Contract-Specifications-Registry-Spec-v0.2.md` (sha1 `33675b0b6e76e86ef9d4ce8a09e9e4c73e5725e7`)

## Seating sentence

The Contract Specifications Registry is SoT for SPEC-1 fields on **futures**: `tick_size`, BPV, display shape, months-cycle, settlement, `calendar_id`. VPS futures `vp_row` **READS** `tick_size`. `VP_ROW` ES/MES entries **die after AT-SPEC-6**. Strike pattern, **SPY 0.10 grain**, half-day / ex-div keys **stay on the VPS metadata object** until a named later packet.

Silence-as-third-SoT is refused. This sentence is law in both specs.

## §5.1 amendment

Was: grid from symbol-metadata `vp_row` (SPY 0.10, ES 0.25, MES 0.25).

Now: SPY grid remains VPS metadata `vp_row` 0.10. ES and MES grid = registry `tick_size`. Diverge → named engine reason `SPEC_GRAIN_MISMATCH` (not a SYM state).
