# XS2-G — Heatmap columns

**Delta** · 2026-09-13 · plan v1.3 · OD-XS1 (a) · OD-XS10 (a) · OD-XS11 (a)

**PASS** — landed `576b17a` (`fix(options-lab): heatmap columns follow universe overlay for XSP/SPY`) + **DL-701**.

| Assert | Result |
|--------|--------|
| Overlay gate = `source === "market_symbol_universe"` ∧ `fixed_points` | PASS AT-XS7 / 7e |
| **No** `XSP \|\| SPY` on overlay path | PASS AT-XS20 TESTSYM |
| Interior overlay `[1,2,3]` not clamped to `[1..7]` | PASS **AT-XS7c** (LIM E15 / B2) |
| Live `[1..8]` not clamped to 7 | PASS AT-XS7d |
| Coerced kind-default XSP/SPY → `[1..7]`, source `client_kind_default` | PASS AT-XS7b |
| AT-XS7g SELECT exactly XSP, SPY `fixed_points` | PASS `profile-live.json` |
| Runner `cols[].widthPts` === panel `columnWidths` | PASS AT-XS7f |
| `profileLine` universe vs kind default; empty never `undefined` | PASS AT-XS17 / AT-XS18 |
| SPX/NDX/RUT/VIX → `[10…50]` known-good this packet | PASS AT-XS8 |
| QQQ/IWM/AAPL → `[10…50]` **deferred-defect freeze** | PASS AT-XS8b · **FI-050** |
| `OFFLINE_FALLBACK_WIDTHS` kept | PASS OD-XS11 (a) |
| `useOptionChainBus.ts` not in diff | PASS |

Evidence: `gate-reports/xs4/helper-unit-tests.txt` · `profile-live.json` · `gate-reports/xs2/fixed-points-rows.txt`.
