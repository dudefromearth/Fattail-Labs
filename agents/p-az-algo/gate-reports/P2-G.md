# P2-G — Delta P2 gate

**Verdict:** **PASS**  
**Date:** 2026-09-03  
**Spec:** AZ-ALGO v2.2.2 sha1 `b757ba3f4b3816fcaebae857aeda70dff488ecdc`  
**Depends:** P1-G PASS `31b5b11`

No canvas / HUD / Feed. No `algoEval.ts` (NX13).

## Command

```
cd web && npx --yes tsx lib/options-lab/algoP2.fixtures.test.ts
```

## Output

```
algoP2 fixtures
  ok  F10 Batman gate 375 = 0.75 × 500 working-side debit → Managing on call
  ok  F11 distances equal, U equal → ambiguous, gate does not evaluate, paints nothing
  ok  F11 trap: equal U must not quietly pick a side via >=
  ok  F12 E(t) null → clock-only g=0.45 S=550 chrome
  ok  ALGO-A1 g is a running minimum across a sequence, not two samples
  ok  F15 side switch H resets 800 → 220, h_prior_side recorded
  ok  F16 override beyond the guide → no re-fire, HUD guide: overridden
  ok  F17 legacy 700 at the same instant proposed is floored to 750
  ok  AT-ALGO-23 grep trail module for retired give-up-as-keep product
9 tests passed
```

W1 `algoTrailMath.test.ts` still 16 passed (not recut).

**Next:** P3 (canvas + HUD Guide). Not P5.
