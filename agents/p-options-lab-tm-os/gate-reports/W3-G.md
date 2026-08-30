# TMOS W3-G — Delta

**Agent:** Delta  
**Date:** 2026-08-29  
**Depends:** W3-1 desk  
**Verdict:** **PASS**. Visual walk closed: Playwright Analyzer + Heatmap + Surface. No Instant Replay copy. No Record control. Evidence `agents/p-options-lab-tm-os/evidence/w3-*.png`.

## Desk

- **TMI-91/93:** `useChainAtPlayhead` never returns the live chain under a playhead (`tmChainAtT.ts` L229). Empty contracts + playhead spot, named, not live overlay.
- **TMI-94/95:** `useTmArchiveVix` reads Labs `GET /api/me/options-lab/archive/marks`. Source travels. Analyzer uses tape VIX while `tmActive`; live `chain.vix` is not used. Did **not** add `/api/marks`.
- **TMI-96:** Positions stay on the blotter. `data-tm-dark="1"` until playhead ≥ `entryAt ?? createdAt`. Not hidden. Legs not invented (§13a).
- Rehearsal still refused to Trade Log (`onSendToTradeLog && !pos.rehearsal`).
- `pauseLive` on the risk graph while TM is active — no live poll into the tent.

## Fail-closed (none tripped)

Live VIX on a replayed panel (code path) · rehearsal → Trade Log · TM-built marks route · wait on `generation.vix` · Instant Replay name · Record · glow.
