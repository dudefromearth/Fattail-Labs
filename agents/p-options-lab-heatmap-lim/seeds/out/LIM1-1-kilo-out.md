# LIM1-1 — Calculation fixtures (out)

**Agent:** Kilo  
**Depends:** LIM1-0  
**Law:** Spec v0.4.3 §10 · Hotel goldens `seeds/out/LIM0-2-hotel-out.md` (nine fixtures)  
**Date:** 2026-09-02

## Command

```
cd web && npx --yes tsx lib/options-lab/templates/lim.test.ts
lim.test.ts ok
```

No rounding of expects. Hotel integers compared with `===`.

## AT share (LIM1)

| Id | Result | Fixture |
|----|--------|---------|
| AT-LIM1 | PASS | F1 x=10 > 0 |
| AT-LIM2 | PASS | F6 x=−60 < 0 |
| AT-LIM3 | PASS | F3 x=0; sign-flip x stays 0 |
| AT-LIM4 | PASS | F1 y=100 > 50 |
| AT-LIM5 | PASS | F2 y=40 < 50 (Hotel geometry; concentrated-negative is y=50, not this AT) |
| AT-LIM6 | PASS | F2 x=62 and y=40 |
| AT-LIM7 | PASS | F7 proximity 0; x=0 y=75 |
| AT-LIM8 | PASS | far crossing dist 80 pts / 1.6% → proximity 1 |
| AT-LIM9 | PASS | F5a empty + F5b zeros → x 0, y 50 |
| AT-LIM11 | PASS | F6 crossingCount 3; three intervals |
| AT-LIM12 | PASS | F6 steepness 1, 2.5, 3 |
| AT-LIM13 | PASS | F8 x=100, xUnclamped=300 |
| AT-LIM16 | PASS | F1–4, F6–9 recombine; **F5 waived** (LIM8) |
| AT-LIM17 | PASS | missing `LABS_LIM_W_NET` throws; names the Appendix A key |
| AT-LIM17b | PASS | W_MAG=0.10 throws |
| AT-LIM19 | PASS | F1 nets on `I:NDX` → valid false, x=0 (not 10) |
| AT-LIM20 | PASS | no `(lo+hi)/2` in `lim.ts`; published fields are intervals |
| AT-LIM26 | PASS | every y in [0,100]; no `yUnclamped` identifier in `lim.ts` |
| AT-LIM28 | PASS | `lim.ts` / `limConfig.ts` have no retired prefix |
| AT-LIM29 | PASS | F9 proximity **0.50** (strictly interior) |
| AT-LIM30 | PASS | F7 steepness 1 on (hi−lo)=20 (ATM zero skipped) |
| AT-LIM31 | PASS | F7 spotBelow false, distance 0 |

**Not this packet:** AT-LIM10, 14, 15, 18, 21–25, 27, 32 (LIM2 / LIM3).

C2: `HEATMAP_TEMPLATES` still contains `gex` and `sym-fly`; no `lim` entry yet (LIM3).
