# PC1-G

**Date:** 2026-09-11  
**Machine:** Coach's MacBook (dev)  
**Verdict:** PASS

## Files (seed `PC1.md`)

- `agents/p-options-lab-position-control/fixtures/cboe-option-premium-tick-bands.md`
- `web/lib/options-lab/tickSize.ts`
- `web/lib/options-lab/tickSize.test.ts`
- `web/lib/options-lab/dteHorizon.ts`
- `web/lib/options-lab/dteHorizon.test.ts`
- `web/lib/chainLadderApi.ts`
- `server/routes/chain_ladder.py`
- `web/lib/options-lab/templates/advancedFly.opf.live.proof.ts`

## Evidence

```
$ npx --yes tsx lib/options-lab/tickSize.test.ts
  ok  AT-PC-59 unknown product fails loud; no default returned
  ok  SPX below 3.00 is 0.05; at or above 3.00 is 0.10
  ok  XSP is 0.01 at every premium
  ok  SPY QQQ IWM are 0.01 at every premium
  ok  unusable premium fails loud
tickSize.test.ts 5 ok

$ npx --yes tsx lib/options-lab/dteHorizon.test.ts
dteHorizon.test.ts ok
```

Tick bands transcribed from Cboe SPX spec, XSP spec, and Rule 5.4. Unknown product throws `PC-CHAIN-7`. No invented `0.05` default.

`OPF_ACTIVE_DTE_HORIZON` is declared once in `dteHorizon.ts`. `chainLadderApi.ts` re-exports it. `chain_ladder.py` imports by reading that file. Proof `max_dte=14` is now `max_dte=10`.

**Out:** ticks are not yet wired into BASIS controls (PC7).
