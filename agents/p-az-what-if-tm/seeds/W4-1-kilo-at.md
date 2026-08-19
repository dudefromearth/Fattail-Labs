# Seed W4-1 — Kilo AT-TM-1…14

**Project:** p-az-what-if-tm  
**Agent:** Kilo  
**Phase:** W4  
**Depends:** W2-1 · W3-1  
**Spec:** §7  
**Gate it feeds:** W-G

## Intent

Evidence for every AT-TM. Fixed `nowMs`. No wall-clock flake.

## Files in scope

- W1 unit tests (extend if gaps)  
- `web/lib/options-lab/localBookCurves.test.ts` — AT-TM-7 expiry unchanged; AT-TM-13 15:30 still moves  
- Surface What-if τ path — AT-TM-14 15:30 still moves (same helper as W1)  
- Optional small e2e only if UI contract needs it (not a full live OPF day)

## Out of scope

Changing product math. `/resolve`. Inventing IV.

## Done when

AT-TM-1…14 each named in a test or a proof script with PASS log (14 = Surface What-if 15:30 still moves). Create-position e2e still green.

## Invariants

Evidence over assertion. 1-minute τ floor, not 1-hour.
