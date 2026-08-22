# TR-P2 evidence

| File | What |
|------|------|
| `heatmap-flag-1.png` | Flag 1 heatmap with Runner template selector |
| `sym-fly-live-bus.png` | Flag 1 default `sym-fly@0.2` — **423 tiles** on the real bus |
| `spread-tax.png` / `spread-tax-live-fail-loud.png` | Spread Tax Map — named `STALENESS_MISSING` |
| `chain-ws-message-keys.json` | Captured live `chain` frame keys (no `stale`, no `epoch_quality`) |
| `ws-flag-1.json` / `.png` | Market WS count **1** |

Live as-built `chain` WS documents lack `stale` / `epoch_quality`. Subscribe fail-louds `STALENESS_MISSING` (named, not zeros). Tile/null behavior is in `web/lib/runner/__tests__/p2.test.ts`. Finding: `gate-reports/FINDING-chain-doc-staleness.md`.
