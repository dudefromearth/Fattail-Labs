# XS0-5 — Feasibility (no code)

**Project:** Options Lab XSP / SPY Scale  
**Agent:** Charlie  
**Depends:** —  
**Feeds:** XS0-G · XS1-0 · XS2-0

## Intent

| Item | Pin |
|------|-----|
| `butterflyWingWidth` vs `productWingHint` | Butterfly + `labCreateOpenDefault` use `butterflyWingWidth` (XSP\|SPY → 1 else 20) **only**. Do **not** call `productWingHint` (would make NDX butterfly 50 — JR2). Silent OD-XS9 (a): leave `productWingHint("XSP")` at 20 |
| Provenance gate (B1) | Overlay only when `source === "market_symbol_universe"` ∧ `fly_width_mode === "fixed_points"` ∧ non-empty finite `fly_widths`. No `max ≤ 7` clamp. Empty overlay fails loud |
| Overlay path (A2) | **No symbol literal.** Universe `fixed_points` wins for every symbol |
| `columnWidths` on ChainContext (B4) | OD-XS10 (a): panel sets the resolved list; runner consumes it. No `profile` on `ChainContext`. Fail loud if XSP/SPY list missing |
| ingestKey + symbol | `hash\|symbol\|side\|mode\|widths`. `lastIngestRef { hash, symbol }` written only when ingest runs. **No** `useOptionChainBus.ts` |
| `FLY_MAX_WIDTHS` | Cap **≥ 9**. Do not shrink to 7 (would slice SPX) |
| Do not call `flyWidthsFromProfile` globally | Would drop SPX heatmap 10 and 15 (JR1) |
| `OFFLINE_FALLBACK_WIDTHS` | OD-XS11 (a): keep XSP/SPY `[1..7]` when universe has not spoken |
| Allowed product functions (later PRs) | `handleTemplate` Lab branch; `defaultDiagonalWidth` XSP only; `axisSpot` XSP only. **Not** `defaultWidth` |

## Out of scope

Implementation in this phase. MiniTwo. AF-X. WF math.

## XS0-5 done

Feasibility named. Two resolvers, not one. No code in this PR.
