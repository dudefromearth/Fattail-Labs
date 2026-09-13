# Characterization list — XSP / SPY Scale AT-XS*

**XS4-G analog:** this file is the lock for **XS4**. Kilo owns tests. Delta does not PASS XS4 without command evidence for every in-scope row.

Source: plan v1.3 §9.

| Id | Assert | Owner |
|----|--------|-------|
| **AT-XS1** | `labCreateOpenDefault("XSP").wingWidth === 1` and `"SPY" === 1`; `"SPX" === 20` | Kilo |
| **AT-XS2** | `labDefaultForStrategy("butterfly", "XSP").wingWidth === 1`; **NDX / RUT / QQQ / IWM / AAPL butterfly still 20** (JR2). Keep the non-XSP/SPY 20 loop | Kilo |
| **AT-XS2b** | **If OD-XS9 (a):** XSP vertical / straddle / iron_fly / iron_condor **unchanged** from today (hint 20; iron_condor 40). **If OD-XS9 (b):** XSP `wingWidth === 1` for vertical, bwb, condor, iron_fly, calendar, diagonal, straddle, strangle, single; XSP **iron_condor === 2**. SPY **vertical** stays **5**. NDX vertical stays **50** | Kilo · Hotel |
| **AT-XS3** | `productWingHint("SPY")` still 5. **If OD-XS9 (a):** `s === "SPX" \|\| s === "XSP"` wing 20 **still present**. **If OD-XS9 (b):** grep: no `s === "SPX" \|\| s === "XSP"` wing 20 | Kilo |
| **AT-XS4** | Create open XSP (dense listed $1 fixture) places a 1-wide listed butterfly (Playwright; RTH or fixture) | Kilo |
| **AT-XS5** | Create open SPX still 20-wide (regression shot). RUT Create recipe 20. QQQ/IWM Create butterfly 20 | Kilo |
| **AT-XS5b** | WIDTH-1 Keep: **grep** `PositionBuilder.tsx` still contains `NDX` / `NQ*` → 50 inside `defaultWidth`, and the XS1 diff **does not touch** `defaultWidth`. Live NDX Create uses `profile.fly_widths[0]` (msc_spx **20**), not the offline 50 fallback — do not assert Create-open NDX is 50 | Kilo |
| **AT-XS6** | `handleTemplate("butterfly")` with Lab defaults on XSP does **not** re-seed 20 | Kilo |
| **AT-XS7** | `heatmapColumnWidths({ symbol: "XSP", profile: { source: "market_symbol_universe", fly_width_mode: "fixed_points", fly_widths: [1..7] } })` → `[1..7]`. **Not sufficient alone** (byte-identical to fallback — B2) | Kilo |
| **AT-XS7b** | Coerced kind-default: `heatmapColumnWidths({ symbol: "XSP", profile: coerceSymbolProfile(null, "XSP", "index") })` → `[1..7]`, **not** `[20…50]`. SPY coerced etf → `[1..7]`, **not** `[1..8]`. Assert `source === "client_kind_default"` | Kilo |
| **AT-XS7c** | **LIM E15 / B2.** `{ symbol: "XSP", profile: { source: "market_symbol_universe", fly_width_mode: "fixed_points", fly_widths: [1, 2, 3] } }` → **`[1, 2, 3]`**. Kilo cannot certify XS2 if this is skipped. A suite that ignores `profile` fails here | Kilo |
| **AT-XS7d** | `{ source: "market_symbol_universe", fly_width_mode: "fixed_points", fly_widths: [1,2,3,4,5,6,7,8] }` → **`[1..8]`**, not clamped to 7 (B1) | Kilo |
| **AT-XS7e** | Coerce of a universe-shaped XSP payload **preserves** `source === "market_symbol_universe"`. Fixture or live SELECT. Delta FAIL if the member API strips `source` | Kilo |
| **AT-XS7f** | After XS2, runner `cols[].widthPts` for XSP **equals** panel `flyWidths` (same list, OD-XS10). Fail if runner painted `HEATMAP_FLY_WIDTHS` while the panel painted overlay | Kilo |
| **AT-XS8** | `heatmapColumnWidths({ symbol: "SPX" })` → `[10,15,…,50]`; `heatmapFlyWidths()` still `[10…50]` | Kilo |
| **AT-XS8b** | `heatmapColumnWidths({ symbol })` for **NDX, RUT, VIX** → `[10…50]` (DL-435 remainder, known-good this packet). For **QQQ, IWM, AAPL** → `[10…50]` as **deferred-defect freeze** (B3): this packet must not change them and must not call that known-good. Lima flags XS-ETF | Kilo · Lima |
| **AT-XS9** | HeatmapChainPanel XSP columns labeled 1…7; SPX 10…50 (Playwright). **Descoped if OD-XS1 (b)** | Kilo · Echo |
| **AT-XS10** | Width Fit on XSP uses the same 7 columns; `assignColors` footer length 7; SPX footer 9. **No** `widthFit.ts` formula change. **Descoped if OD-XS1 (b)** | Kilo · Echo |
| **AT-XS11** | SPY sparse fixture: `snapWidthToListed(1, …)` returns first listed ≥ 1 (e.g. 20); never returns unlisted 1. Dense $1 fixture returns 1 | Kilo · Hotel |
| **AT-XS12** | Inline `resolve_symbol_profile` XSP/SPY overlay 1–7; `fetch_step_floor` unchanged; SPX/VIX unchanged | Kilo |
| **AT-XS12b** | Live migrate-152 evidence on this MacBook: XSP/SPY rows are `fixed_points` `[1..7]` and `fetch_step_floor` unchanged (SELECT or migrate dry-run + SELECT in `gate-reports/xs4/`) | Kilo |
| **AT-XS13** | `FLY_MAX_WIDTHS >= 9`; SPX ingest still has a 50-wide column | Kilo |
| **AT-XS14** | Diff excludes `AnalyzerPositionsList.tsx`, LIM sources, QFRIC sources, `migrations/152_*` (already landed), `defaultWidth` (WIDTH-1 Keep) | Delta · Kilo |
| **AT-XS15** | Mode/value switch still zero extra Massive (HM6). IngestKey is `hash\|symbol\|side\|mode\|widths`. `lastIngestRef { hash, symbol }` written **only** when ingest runs. **Skip** when `panel.symbol` changed and `bus.hash` has not; do not render `flyPaint` for the other symbol. After XSP↔SPX switch: **no** 10-wide column label on XSP, **no** 1-wide label on SPX. **No** `useOptionChainBus.ts` in the diff | Kilo |
| **AT-XS16** | AT-DLG-22 still holds: no Width control in Create dialog | Kilo · Echo |
| **AT-XS17** | XSP with `source: "market_symbol_universe"` → `profileLine` contains `· universe`. Same XSP with `source: "client_kind_default"` → contains `· kind default`. The two strings differ even though both render `widths 1–7` | Kilo · Echo · Tango |
| **AT-XS18** | `flyWidths = []` → chrome contains **no** `undefined`; renders the no-column-list phrase | Kilo · Echo · Tango |
| **AT-XS19** | SPX chrome unchanged apart from the appended source token | Kilo · Echo |
| **AT-XS7g** | Live SELECT `fly_width_mode = 'fixed_points'` returns **exactly** `XSP` and `SPY` on this MacBook’s `labs` DB. Filed in `gate-reports/xs2/fixed-points-rows.txt`. Any third row → **stop** | Kilo |
| **AT-XS20** | `heatmapColumnWidths({ symbol: "TESTSYM", profile: { source: "market_symbol_universe", fly_width_mode: "fixed_points", fly_widths: [2,4,6] } })` → `[2,4,6]`. Fails if the `XSP \|\| SPY` overlay branch survives | Kilo |
| **AT-XS21** | `heatmapColumnWidths({ symbol: "TESTSYM", profile: coerceSymbolProfile(null, "TESTSYM", "equity") })` → `[10…50]` | Kilo |

Hotel / India: no second pricer; no snap on heatmap cells; no silent zero.

**OD-XS1 (b) descope:** if heatmap stays DL-435 10…50, AT-XS7/7c/9/10 (heatmap 1–7 shots) do not block XS4-G. Create ATs still ship. Recorded on DL, not a waive.
