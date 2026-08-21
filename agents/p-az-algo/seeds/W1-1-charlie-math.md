# Seed W1-1 — Charlie trail math

**Project:** p-az-algo  
**Agent:** Charlie  
**Phase:** W1  
**Depends:** W0-BA GO  
**Law:** AZ-ALGO §3 · §7 · plan §8  
**Gate it feeds:** W1-G (Kilo tests in this packet)

## Intent

Pure TypeScript for the trail. **No React. No HostPnLChart.**

## Files in scope

- **New** `web/lib/options-lab/algoTrailMath.ts`  
- **New** `web/lib/options-lab/algoTrailMath.test.ts` (`npx --yes tsx …`)

## Out of scope

UI · adapter · narrative panel · MiniTwo · demo session clock

## Wire

Export (names may vary; law may not):

- `isOtmDebitButterfly(card, spot)` — listed +1/−2/+1, OTM vs **raw** spot, debit > 0  
- Arm: `U >= entryPct * D`  
- `H` ratchet; `S = f * H`  
- `f` **running min** of `min(f_decay, f_clock)` (ALGO-A1)  
- Invert T+0 for `S`; `side: near | far`; body-cross flips; recross flips back  
- Exit in give-back direction for current side; `exit_side`  
- Invert missing → named + P&L backstop **only then**  
- Threaten: pulse on at 20% of `G`, off at 25%

## Done when

Plan §8 fixtures 1–10 PASS. Especially **B1:** through-body collapse records `exit_side: far` without ever crossing near `x_S`.

## Invariants

DL-309. FP4 · FP5 · FP6. No invented strikes.
