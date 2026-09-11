# PC7-G

**Date:** 2026-09-11  
**Machine:** Coach's MacBook (dev)  
**Verdict:** PASS

## Files (seed `PC7.md`)

- `web/lib/options-lab/chainControls.ts`
- `web/lib/options-lab/chainControls.test.ts`
- `web/components/options-lab/PositionBuilder.tsx`
- `web/components/options-lab/AnalyzerPositionsList.tsx`

## Evidence

```
$ npx --yes tsx lib/options-lab/chainControls.test.ts
  ok  AT-PC-05 lock gesture writes CardLockState; canvas debit is that lock
  ok  AT-PC-09 / PC-CHAIN-3 strike stepper edge is a no-op
  ok  AT-PC-10 one listed expiration hides calendar and diagonal
  ok  AT-PC-11 empty ladder is loading, never unavailable
  ok  AT-PC-12 DTE uses the supplied clock, not Date.now()
  ok  AT-PC-17 missing value does not bind to options[0]
  ok  AT-PC-18 roll is proposed, not applied
  ok  AT-PC-38 residual before midnight ET stays editable
  ok  builder: no type=date; selects use boundSelectValue
  ok  D-PC-7 Edit dialog price path: override, not CardLockState
chainControls.test.ts 11 ok
```

### AT-PC-05 (named here, not a PC6 reopen)

Lock gesture (`lockNatural` / `lockLimit`) writes `CardLockState`. `definedDebitSigned` — the canvas debit path — equals that lock on the same tick. **PASS** for card/canvas.

### D-PC-7 (extended)

Edit-mode dialog displayed price reads `position.net_debit_override`, not `CardLockState`. Card reads the lock. PC8 shared-row fix, not a stop. Litmus 1 still has a dialog/card split until then.

## Environment

Local API `127.0.0.1:4000` hit the 10-hour process cap and was restarted (pid 74249, git `a59291b`). Not a gate. Recorded so PCZ can explain any timeline gap.

Next: PC8 ToS card.
