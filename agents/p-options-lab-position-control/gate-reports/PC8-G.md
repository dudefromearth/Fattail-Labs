# PC8-G

**Date:** 2026-09-11  
**Machine:** Coach's MacBook (dev)  
**Verdict:** PASS

## Files (seed `PC8.md`)

- `web/lib/options-lab/tosCard.ts`
- `web/lib/options-lab/tosCard.test.ts`
- `web/lib/options-lab/chainControls.test.ts`
- `web/components/options-lab/TosControls.tsx`
- `web/components/options-lab/AnalyzerPositionsList.tsx`
- `web/components/options-lab/OpfRiskAnalyzer.tsx`
- `web/components/options-lab/PositionBuilder.tsx`
- `web/components/ui/icons.tsx`

## Evidence

```
$ npx --yes tsx lib/options-lab/tosCard.test.ts
  ok  AT-PC-61 card columns are exactly the ten of PC-VOCAB-7
  ok  AT-PC-62 DELTA is row 1 only; legs render em dash
  ok  AT-PC-63 seven fields: exposure by strategy
  ok  AT-PC-32 / AT-PC-64 card Spread rebuilds legs and CHECK PRICE
  ok  AT-PC-65 Calendar per-leg exp/strike re-derives the name
  ok  AT-PC-66 padlock pair: shackle carries state, unlocked is outlined
  ok  AT-PC-67 / AT-PC-68 stepper grows on hover/focus; exclusive z-index
  ok  AT-PC-69 QTY quick-pick is POS and leaves lock standing
  ok  AT-PC-70 no chevron-style nudge remains on the card
  ok  AT-PC-15 / AT-PC-58 symbol groups: select ≠ expand; order is chrome
  ok  AT-PC-20 no profit-claim or ranking language on the card
  ok  AT-PC-33 delete is confirmed and names the position
  ok  AT-PC-49 STRATEGY cell is the density exemption
  ok  D-PC-7 Edit dialog displayed price reads CardLockState, not override
tosCard.test.ts 17 ok

$ npx --yes tsx lib/options-lab/chainControls.test.ts
  ok  AT-PC-05 lock gesture writes CardLockState; canvas debit is that lock
  …
  ok  D-PC-7 Edit dialog price path reads CardLockState (PC8)
chainControls.test.ts 11 ok
```

### AT-PC-05 (named at PC7, still PASS)

Lock gesture writes `CardLockState`. `definedDebitSigned` equals that lock on the same tick.

### D-PC-7 (closed)

Edit-mode dialog displayed price reads `CardLockState` (`cardLock.mode === "locked"` / `packageDebitPerShare`). Create still uses `net_debit_override` (no record until Submit). Limit in Edit calls `lockLimit`.

## Echo remaining (task, not gate)

Resting vs grown stepper dimensions, the growth transition, whether non-interactive chrome takes the compact profile. Grown state uses `--hit-min`; exclusive `z-20` on hover/focus so adjacent grown steppers do not compete as hit targets (AT-PC-68).

## Environment

Local API 10-hour cap (restarted pid 74249 at PC6 `a59291b`) is not a gate. Recorded for PCZ.

Next: PC9a Autofit (off PC3) · PC9b Promotion (off PC6; the remaining Coach-facing change).
