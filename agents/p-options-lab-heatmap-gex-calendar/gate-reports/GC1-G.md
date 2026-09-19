# GC1-G — Pack

**Delta** · 2026-09-18 · **PASS**

| AT | Evidence |
|----|----------|
| AT-GC1 | `npx tsx lib/options-lab/templates/gexCal.test.ts` — one expiry, values = `gexNet` / frozen profile |
| AT-GC8 | empty pack → `emptyReason: "empty"` |
| AT-GC9 | shared ctx / expiration mismatch → `fake`, compute refuses |

Attach: `useGexCalPack` registers N `setChainInterest` ids on existing `MarketSocket`. Hydrate via `pollChainLadder` (same path as heatmap). No second Massive client.

Frozen `gex` snapshot: `diff vs e1c1ef1 BEFORE: empty`
