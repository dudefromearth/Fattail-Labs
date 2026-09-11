# PC1 — Tick source · DTE horizon

**Phase:** PC1  
**Depends:** W0-0 GO  
**Laws:** PC-CHAIN-7 · PC-EXP-4  
**ATs:** AT-PC-59

## Exact files

- `agents/p-options-lab-position-control/fixtures/cboe-option-premium-tick-bands.md`
- `web/lib/options-lab/tickSize.ts`
- `web/lib/options-lab/tickSize.test.ts`
- `web/lib/options-lab/dteHorizon.ts`
- `web/lib/options-lab/dteHorizon.test.ts`
- `web/lib/chainLadderApi.ts`
- `server/routes/chain_ladder.py`
- `web/lib/options-lab/templates/advancedFly.opf.live.proof.ts`

Delta **FAIL**s any extra file.

## Intent

1. Transcribe Cboe published premium-band ticks into the fixture, then `tickSize.ts`. Unknown product fails loud. No `0.05` placeholder.
2. One `OPF_ACTIVE_DTE_HORIZON` declaration in `dteHorizon.ts`. TS and Python import it. Proof `max_dte=14` becomes 10.

**Out:** wiring ticks into BASIS controls (PC7).
