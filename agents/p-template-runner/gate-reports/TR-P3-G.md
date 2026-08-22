# TR-P3-G — One runner path (evidence)

**Date:** 2026-08-21  
**Token:** [`agents/go/TR-P3.md`](../../go/TR-P3.md) · **DL-536**  
**Delta verdict:** **PASS**

## Tests

```
npx --yes tsx lib/runner/__tests__/shell.test.ts  → TR-P1 16 passed
npx --yes tsx lib/runner/__tests__/p2.test.ts     → TR-P2 13 passed
npx --yes tsx lib/runner/__tests__/p3.test.ts     → TR-P3 6 passed
```

### Real-bus hash pairs (same `content_hash`, not fixture replay)

Captured `npx tsx lib/runner/__tests__/live-hash.ts` against live HTTP `chain-ladder` (dev-login). Pipeline = flag-0 `paintCurrentHeatmap`; through-run = `run(sym-fly@0.2)` on that generation.

| Symbol | `content_hash` | pipeline | through-`run()` | equal |
|--------|----------------|----------|-----------------|-------|
| SPX | `90d5efeb50962751` | `-105ca387:26141` | `-105ca387:26141` | yes |
| TSLA | `c2b43299aabedbaf` | `5c23f585:17503` | `5c23f585:17503` | yes |
| SPY | `d4b16262d1203e6e` | `-546147c5:11192` | `-546147c5:11192` | yes |

Source: [`evidence/tr-p3/live-hash-pairs.json`](../evidence/tr-p3/live-hash-pairs.json). Fixture hashes in p3.test.ts are regression only; this table is the AT.

## Live bus (flag 1)

| Check | Result |
|-------|--------|
| `HeatmapChainPanel` (`options-lab-heatmap-panel`) | **0** (not mounted) |
| `runner-shell-host` | **1** |
| `sym-fly@0.2` tiles through `run()` | **423** |
| Market WS | **1** |
| `spread-tax@0.1` filled cells | **102**, error empty |

Screenshots: `evidence/tr-p3/sym-fly-runner.png` · `evidence/tr-p3/spread-tax-live.png`

MB-P2 consumer proof **closed** here. TR-P2-G TR8 residual **closed**.

## Build / pytest

`npm run build` clean. Pytest: cite FINDING 0DTE chain-ladder — do not re-report.

## Residual closed

TR8 true at flag 1. `HeatmapChainPanel` is not a draw path on the shell host.

---

## Delta record

**Re-checked:** p3 tests 6 · P1/P2 green · live-hash-pairs.json three symbols equal on live `content_hash` · flag-1 panel count 0 · spread-tax 102 cells · build clean.

**Recorded:** **PASS**  
**Does not:** MiniTwo.
