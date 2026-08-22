# TR-P2-G — Controls + Live (evidence for Delta)

**Date:** 2026-08-21  
**Token:** [`agents/go/TR-P2.md`](../../go/TR-P2.md) · **DL-534**  
**Delta verdict:** **PASS** (residual TR-P3 / TR8 · upstream FINDING-chain-doc-staleness)

## Tests

```
npx --yes tsx lib/runner/__tests__/shell.test.ts  → TR-P1 16 passed
npx --yes tsx lib/runner/__tests__/p2.test.ts     → TR-P2 13 passed
```

Named: CONTROL_DEFAULT · CONTROL_INVALID unknown id · CONTROL_INVALID out of bounds · STALENESS_MISSING · live render once per distinct hash · stale flips · spread-tax null cells · side filter · min_oi filter · deterministic hash.

Regression hashes: SPX `17c08e08:13320` · TSLA `22045e86:9759` · SPY `-1b8c8c6b:23788` (same as TR-P1).

## Socket

Flag 1 `/app/options-lab/heatmap`: **1** `WS /api/me/market/stream`. See `evidence/tr-p2/ws-flag-1.json`.

## Live path — blocked upstream

Contract and tests **PASS** on recorded fixtures (documents that already carry `stale` and `epoch_quality`).

On the **as-built bus**, selecting a `live: true` template that **runs through Runner subscribe** fail-louds `STALENESS_MISSING` because `chain` documents lack `stale` / `epoch_quality`. Captured frame: [`evidence/tr-p2/chain-ws-message-keys.json`](../evidence/tr-p2/chain-ws-message-keys.json). Finding: [`FINDING-chain-doc-staleness.md`](./FINDING-chain-doc-staleness.md).

This is **not a Runner defect**. Do not invent `stale` from `session_open`. Do not catch-and-static. Do not fill zeros. Owner: Market Bus (Alpha) — Spec v1.0.2 + DL.

### Which path reaches the bus (flag 1)

The two templates do **not** share a live subscribe path.

| Template | What paints tiles on the real bus | Bus client |
|----------|-----------------------------------|------------|
| **`sym-fly@0.2`** | **P1 snapshot path** — `HeatmapRenderHost` mounts `<HeatmapChainPanel />` (`web/lib/runner/sinks/render.ts`). Tiles come from `useOptionChainBus` inside that panel (`setChainInterest` + `MarketSocket.subscribe`, MB7 full/diff/unchanged, `content_hash` → `hash`). **P2 `subscribe()` does not paint these tiles.** Host `onSnap` returns before `run()` when the selector is not `spread-tax@0.1`. Provenance `STALENESS_MISSING` on the parallel Runner listener does not unmount the panel. Evidence: 423 tiles, no spread-tax error (`evidence/tr-p2/sym-fly-live-bus.png`). **Not a TR-P1 regression.** |
| **`spread-tax@0.1`** | **P2 `subscribe()` with updates** — same host calls `subscribe()` then `run(spread-tax@0.1, …)`. That path requires `stale` + `epoch_quality` on the chain document. As-built bus lacks both → named `STALENESS_MISSING`, grid **0**. Expected. Must stay visible. |

Why: TR-P1 proved byte-identical Advanced flies by **registering** `sym-fly` and keeping `HeatmapChainPanel` as the renderer (template source untouched). TR-P2 added a selector and a second template that actually consumes Runner live subscribe. Wiring `sym-fly` tiles through P2 `subscribe()` on the real bus would fail-loud the TR-P1 surface; that was not done.

**TR8 (one runner) is not yet true at flag 1.** Two bus clients remain: `useOptionChainBus` for `sym-fly@0.2`, P2 `subscribe()` for `spread-tax@0.1`. Putting `sym-fly` onto the Runner path is **deferred to TR-P3** and depends on [`FINDING-chain-doc-staleness.md`](./FINDING-chain-doc-staleness.md).

**sym-fly@0.2 on the real bus (flag 1):** still renders via the P1 panel path above.

**spread-tax@0.1 on the real bus (flag 1):** named `chain document lacks boolean stale`, grid count **0**. Expected. Must stay visible.

## Browser walk

Flag 1: template selector present. Advanced flies (sym-fly) paints. Spread Tax Map fail-louds as above. Null-cell law (two missing bids) is the p2 test, not the live bus.

## Build / pytest

`npm run build` clean. Pytest: cite [`FINDING-test-chain-ladder-0dte.md`](./FINDING-test-chain-ladder-0dte.md) — do not re-report.

## Heatmap Spec v0.2

**Unchanged.**

---

## Delta record

Submitted with evidence pack [`agents/p-template-runner/evidence/tr-p2/`](../evidence/tr-p2/) and this report.

**Re-checked:** p2 tests 13 passed · TR-P1 regression hashes unchanged · flag-1 market WS = 1 · `sym-fly@0.2` live bus = HeatmapChainPanel (423 tiles) · `spread-tax@0.1` live bus = named `STALENESS_MISSING` · TR8 not true at flag 1 (stated).

**Recorded:** **PASS**  
**Residual:** TR-P3 — put `sym-fly` on the Runner `subscribe()` path; blocked on Market Bus chain-doc `stale` / `epoch_quality` ([FINDING-chain-doc-staleness.md](./FINDING-chain-doc-staleness.md)).  
**Does not:** MiniTwo. TR-P2 remains uncommitted until Coach opens commit.
