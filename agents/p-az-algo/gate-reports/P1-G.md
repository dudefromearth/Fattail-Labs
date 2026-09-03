# P1-G — Delta P1 gate

**Verdict:** **PASS**  
**Date:** 2026-09-03  
**Spec:** AZ-ALGO v2.2.2 sha1 `b757ba3f4b3816fcaebae857aeda70dff488ecdc`  
**Token:** AZALGO-W0 GO · P0-G PASS

No UI. No `algoEval.ts` (NX13). Four modules only.

## Command

```
cd web && npx --yes tsx lib/options-lab/algoP1.fixtures.test.ts
```

## Output

```
algoP1 fixtures 1-18
  ok  1 dimensional proof PaR 80 trail 630 (AT-ALGO-6d)
  ok  2 apex PaR 128 trail 808
  ok  3 wing PaR 72 trail 892 — E1 F2 > F3
  ok  4 put fly mirrored PaR 80 trail 630
  ok  5 k 2.34 trail 562.8
  ok  6 k 1.0 trail 670 clamped up from 0.84
  ok  7 k 1.8 trail 606 interior
  ok  8 GEX unavailable gamma_factor 1.0 trail 630 paints
  ok  9 Δ/Γ unmeasured WAITING not painted
  ok  10 Batman gate 375 from Appendix A entry × working debit (P1 config)
  ok  11 Batman distances equal — P1 does not pick a side
  ok  12 remaining 2h floor inactive (E23 (c)); Hotel S 550 is legacy P2
  ok  13 move_unit 6 bars WAITING (AT-ALGO-6e)
  ok  14 GEX history 12 samples warming factor 1.0 paints
  ok  15 H reset is a recorded golden — P1 does not carry H across sides
  ok  16 override trail 630 is F1 proposed — P1 does not re-fire
  ok  17 floor binds 700.48 → 750; morning 700.48; legacy 700
  ok  18 at-body PaR_up 112 PaR_down 144 max 144 trail 784
  ok  AT-ALGO-6d per-share greeks are a named WAITING state
  ok  AT-ALGO-26 missing key aborts naming the key
  ok  AT-ALGO-19 grep expected-move identifiers (zero)
  ok  AT-ALGO-28 grep algoProfitAtRisk.ts session-clock identifiers (zero)
  ok  AT-ALGO-26 PUBLIC_ALGO_ENV uses literal NEXT_PUBLIC members
23 tests passed
```

Hotel handwritten numbers matched exactly. No golden was edited.

**Next:** P2 (gate, Batman, legacy trail). Not P5.
