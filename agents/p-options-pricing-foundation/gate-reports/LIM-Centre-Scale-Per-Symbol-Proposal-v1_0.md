# LIM centre scale — per-symbol proposal v1.0

**Hotel. Evidence only. Not applied.**

Coach, 2026-10-08: create a per-symbol list. Each value must be justified by evidence, not chosen by hand.

Open item 4 of LIM spec v0.4.7 (`LIM_CENTRE_SCALE_PTS` per symbol, owner Hotel) is still open. The live map is `{"SPX":50,"I:SPX":50}`.

This file proposes values. It does not edit config, code, or the map.

## 1. The math

Spec: `Specs/FatTail Labs — Heatmap LIM Template — Specification v0.4.7.md`.

**LIM7** (X axis, section 5.1):

> Empty map or `Σ|net| == 0` → `0`.
>
> ```
> centre     = Σ |net| × (strike − spot) / Σ |net|          // signed, index points
> leanRaw    = centre / LIM_CENTRE_SCALE_PTS[symbol] × 100  // E1 — unclamped
> lean       = clamp(leanRaw, −100, +100)
> xUnclamped = leanRaw
> ```

The clamp is part of the axis. The spec says `leanRaw` exceeds ±100 whenever the centre of gravity sits further from spot than the scale, and calls that an ordinary session.

**LIM34:**

> `LIM_CENTRE_SCALE_PTS` is a symbol map. A symbol absent from it makes LIM `valid: false` for that symbol. It never falls back to another symbol's scale — 50 points is a different fraction of SPX, NDX and SPY, and a silent fallback saturates the first non-SPX session.

Code, `web/lib/options-lab/templates/lim.ts` `computeLimFromNets`:

```
centrePts = weighted / totalAbs
xUnclamped = (centrePts / scale) * 100
lean = clamp(xUnclamped, -100, 100)
```

`weighted` is `Σ |net| × (strike − spot)`. Strikes are visited high to low, the order `buildGexProfile` uses. A strike whose call or put is missing a finite gamma or open interest is left out (`gexNet` in `web/lib/options-lab/templates/pricing.ts`).

`net` at a strike is `Γ_call · OI_call · S · S − Γ_put · OI_put · S · S`. Both sides are required. `S` is that snap's spot.

The scale is a distance in the underlier's own points. When `|centrePts|` equals the scale, `|lean|` is 100 and the blue ball sits on the left or right edge of the quad. When `|centrePts|` is larger, the ball stays on that edge. The number in the map is that distance: how far the GEX centre of gravity must sit from spot for the ball to reach the edge.

The Runner's default wing count is 25 for every symbol (`DEFAULT_STRIKE_WINGS` in `web/lib/chainLadderApi.ts`, used by `web/lib/runner/sinks/render.ts`). The point width of that window is the symbol's own strike step times 25. This proposal uses snaps whose topic is `:w25:`.

### Check against `lim.ts`

Three SPX RTH wings-25 snaps, copied only to `/tmp` on StudioTwo. Python `centre_pts` in `/tmp/lim_centre_lib.py` and `computeLim` via `npx --yes tsx /tmp/lim-centre-check.ts` agree to 8 decimal places.

| Snap | `centrePts` |
|---|---|
| `day=2026-09-30/chain/SPX/snap-140000815Z.json` | −6.48999989 |
| `day=2026-10-02/chain/SPX/snap-140000918Z.json` | 10.60718533 |
| `day=2026-10-07/chain/SPX/snap-140004534Z.json` | 3.28882628 |

## 2. Per-symbol distributions

**Command.** StudioOne, read-only: `python3 /tmp/lim_centre_scan.py`. Summary: `/tmp/lim-centre-summary.json`. Started 2026-10-08T15:00:23, finished 2026-10-08T15:14:33.

**Data.** `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture/day=*/chain/{symbol}/*.json`, days on disk from 2026-09-28 through 2026-10-08. 1,227,999 files. 843,249 were not RTH. 232,975 were RTH at a wing other than 25. 151,775 were RTH and `:w25:`.

**Which snaps entered the distribution.** RTH is the capture's own phase: weekday 09:30 inclusive to 16:00 exclusive, America/New_York (`phase_at` in `server/market_data/ssr_live_capture.py`). One snap per clock minute: the first file in that minute. Nearest expiration is the earliest expiration on that symbol-day that is on or after the session day. In this tree every kept snap's expiration is the session day. The tap writes that day on purpose (`front_expiration`). A later listed expiration is not in these files. Days with no that-day book contribute no minutes.

Empty books (`Σ|net| = 0`) would have entered as centre 0 under LIM7. There were none.

`|centrePts|` on the minute grid:

| Symbol | Minutes | Days | Step | Median spot | Median | p75 | p90 | p95 | p99 | Max |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SPX | 3268 | 9 | 5 | 7718.78 | 5.57 | 9.13 | 14.19 | 16.55 | 19.11 | 25.38 |
| XSP | 3062 | 9 | 1 | 771.55 | 0.55 | 0.81 | 1.04 | 1.24 | 1.55 | 1.74 |
| SPY | 3135 | 9 | 1 | 769.27 | 0.53 | 0.87 | 1.29 | 1.56 | 2.04 | 4.95 |
| QQQ | 3045 | 9 | 1 | 749.85 | 0.80 | 1.32 | 1.78 | 2.02 | 2.58 | 4.46 |
| IWM | 3316 | 9 | 1 | 279.51 | 0.76 | 1.25 | 1.92 | 2.38 | 3.41 | 5.07 |
| GLD | 3114 | 9 | 1 | 380.24 | 0.80 | 1.45 | 2.05 | 2.74 | 3.93 | 5.69 |
| TLT | 1930 | 5 | 0.5 | 77.54 | 0.53 | 0.85 | 1.10 | 1.25 | 1.70 | 2.43 |
| SLV | 1928 | 5 | 0.5 | 54.69 | 0.49 | 0.80 | 1.15 | 1.43 | 1.80 | 2.36 |
| USO | 1167 | 3 | 0.5 | 145.82 | 1.66 | 2.50 | 4.23 | 4.58 | 5.05 | 5.36 |
| XLF | 3214 | 9 | 0.5 | 53.76 | 0.16 | 0.35 | 1.02 | 1.67 | 2.54 | 5.00 |
| UNG | 1043 | 3 | 0.5 | 10.43 | 0.25 | 0.46 | 0.59 | 0.66 | 0.76 | 0.91 |
| AAPL | 1924 | 5 | 2.5 | 335.38 | 0.93 | 1.53 | 1.98 | 2.23 | 2.95 | 4.89 |
| AMZN | 1910 | 5 | 2.5 | 251.37 | 0.99 | 1.83 | 2.43 | 3.18 | 4.93 | 10.62 |
| NVDA | 1806 | 5 | 2.5 | 235.81 | 0.51 | 0.88 | 1.13 | 1.31 | 2.05 | 5.95 |
| TSLA | 1720 | 5 | 2.5 | 371.32 | 1.05 | 1.71 | 2.64 | 3.44 | 5.07 | 8.20 |
| GOOGL | 1926 | 5 | 2.5 | 345.17 | 1.52 | 2.47 | 3.38 | 4.11 | 5.25 | 11.04 |
| META | 1629 | 5 | 2.5 | 730.80 | 1.81 | 3.59 | 5.39 | 6.64 | 8.92 | 10.36 |
| MSFT | 1926 | 5 | 2.5 | 518.01 | 1.25 | 2.22 | 3.13 | 3.55 | 4.67 | 6.61 |

Days for the nine-day names: 2026-09-28, 09-29, 09-30, 10-01, 10-02, 10-05, 10-06, 10-07, 10-08. 2026-10-04 is on disk and empty (Sunday). 2026-10-08 is a partial session; the scan finished at 15:14 ET. SPX that day has 260 minutes. 2026-10-05 SPX has 283.

Five-day names (the session day was a listed expiration on those days only): TLT, SLV, AAPL, AMZN, NVDA, TSLA, GOOGL, META, MSFT — 09-28, 09-30, 10-02, 10-05, 10-07, with the short counts noted in the summary for TSLA on 10-05 (187) and META on 10-07 (98).

Three-day names: USO and UNG — 09-30, 10-02, 10-07. UNG on 09-30 has 265 minutes.

Strike step is the modal `generation.strike_step` on the same minutes.

## 3. SPX calibration

On the 3,268 SPX minutes, `|centrePts|` max is 25.377880406120575. Median spot is 7718.775.

At the current scale of 50:

- Every minute has `|centrePts| ≤ 25.38`, so every minute is at or below 50. The inclusive rank is 100% (3,268 of 3,268). The 100th percentile of the sample is the maximum, 25.38, not 50. Fifty sits above the sample.
- Minutes with X saturated at ±100: **0 of 3,268**. Share **0**.
- The most extreme minute reaches `|lean| = 25.38 / 50 × 100 = 50.8`. The median minute reaches `|lean| = 5.57 / 50 × 100 = 11.1`.

`50 / 25.377880406120575 = 1.97`. The live SPX scale is about twice the furthest centre in this sample.

## 4. The candidates

Type-7 quantile (the percentile method used below): index `(p/100) × (n − 1)` on the sorted sample, linear between the two surrounding points. Rounding is to the symbol's strike step, half away from zero, then the saturation share is recomputed on that rounded value. Saturation means `|centrePts| ≥ scale`.

Because 50 sits above the SPX sample, the same-percentile value of another symbol is that symbol's maximum. The same-saturation target is a share of 0. Every scale strictly above a symbol's maximum has that share. On the strike-step grid the smallest such scale is the least step above the maximum. Rounding the maximum itself often lands on or below it, so those rounded percentile values do not keep the share at 0.

Same share of spot is `50 / 7718.775 ×` the symbol's median spot.

| Symbol | Same percentile | Saturation | Same share of spot | Saturation | Same saturation (least step above the max) | Saturation |
|---|---:|---:|---:|---:|---:|---:|
| SPX | 25 | 2 / 3268 | 50 | 0 / 3268 | 30 | 0 / 3268 |
| XSP | 2 | 0 / 3062 | 5 | 0 / 3062 | 2 | 0 / 3062 |
| SPY | 5 | 0 / 3135 | 5 | 0 / 3135 | 5 | 0 / 3135 |
| QQQ | 4 | 1 / 3045 | 5 | 0 / 3045 | 5 | 0 / 3045 |
| IWM | 5 | 1 / 3316 | 2 | 294 / 3316 | 6 | 0 / 3316 |
| GLD | 6 | 0 / 3114 | 2 | 328 / 3114 | 6 | 0 / 3114 |
| TLT | 2.5 | 0 / 1930 | 0.5 | 1026 / 1930 | 2.5 | 0 / 1930 |
| SLV | 2.5 | 0 / 1928 | 0.5 | 935 / 1928 | 2.5 | 0 / 1928 |
| USO | 5.5 | 0 / 1167 | 1 | 858 / 1167 | 5.5 | 0 / 1167 |
| XLF | 5 | 1 / 3214 | 0.5 | 543 / 3214 | 5.5 | 0 / 3214 |
| UNG | 1 | 0 / 1043 | 0 | not a scale | 1 | 0 / 1043 |
| AAPL | 5 | 0 / 1924 | 2.5 | 54 / 1924 | 5 | 0 / 1924 |
| AMZN | 10 | 2 / 1910 | 2.5 | 177 / 1910 | 12.5 | 0 / 1910 |
| NVDA | 5 | 1 / 1806 | 2.5 | 12 / 1806 | 7.5 | 0 / 1806 |
| TSLA | 7.5 | 1 / 1720 | 2.5 | 190 / 1720 | 10 | 0 / 1720 |
| GOOGL | 10 | 2 / 1926 | 2.5 | 474 / 1926 | 12.5 | 0 / 1926 |
| META | 10 | 4 / 1629 | 5 | 199 / 1629 | 12.5 | 0 / 1629 |
| MSFT | 7.5 | 0 / 1926 | 2.5 | 369 / 1926 | 7.5 | 0 / 1926 |

UNG's spot-proportion is 0.0675. Rounded to a 0.5 step it is 0. A scale of 0 is not a usable divisor.

SPX's row is the anchor worked back through each rule. The live value 50 is the share-of-spot result. It also has saturation 0. The least step above the SPX maximum is 30, which also has saturation 0, with less spare room than 50.

## 5. Recommended method and the proposed list

**Hotel's recommendation: same saturation, the least strike step strictly above the sample maximum.**

SPX at 50 never puts the ball on the edge in this sample. That is the behavior worth matching. Share of spot ignores the measured centres and would pin the lower-priced names to the edge for a large share of minutes. Same percentile is each name's sample maximum, and rounding that maximum does not keep the saturated share at 0.

A share of 0 is an inequality: any scale above the maximum qualifies. The least step above the maximum is the smallest evidence-backed value on that symbol's grid. It has no spare room. A later minute past this sample's maximum will pin the ball. SPX at 50 has spare room of about 1.97 times its sample maximum. Copying that spare room onto the other names would be a different rule. It is not one of the three, and this proposal does not apply it.

Keep SPX at 50. Fifty already has saturation 0, and it is the anchor the other values were matched to. Keep `I:SPX` at 50 as well. LIM34 looks up the exact symbol string. The live map has both keys, and there is no prefix normaliser.

Proposed map, product symbol to points:

| Symbol | Points |
|---|---:|
| SPX | 50 |
| I:SPX | 50 |
| XSP | 2 |
| SPY | 5 |
| QQQ | 5 |
| IWM | 6 |
| GLD | 6 |
| TLT | 2.5 |
| SLV | 2.5 |
| USO | 5.5 |
| XLF | 5.5 |
| UNG | 1 |
| AAPL | 5 |
| AMZN | 12.5 |
| NVDA | 7.5 |
| TSLA | 10 |
| GOOGL | 12.5 |
| META | 12.5 |
| MSFT | 7.5 |

## 6. Insufficient-evidence symbols

None. The bar in the assignment is 200 snapshots. The thinnest name is UNG at 1,043 minutes. USO is 1,167. Both of those rest on three sessions (2026-09-30, 2026-10-02, 2026-10-07), because the archive holds the session-day book and those names did not have one on the other days. That is enough to clear 200, and it is a short calendar. A value for them is in the list above. More sessions of the same wings-25 RTH read would be what would move it.

## 7. The missing-scale message today

When the symbol is absent from the map, `computeLimFromNets` sets `valid: false` and `invalidReason: "no-scale"`. The quad still draws the cells, the crosshairs, and the axis labels. The blue ball is not drawn (`live` is false in `HeatmapLimQuadrant.tsx`). The plane carries this sentence, centered:

> No centre scale configured for {symbol}.

The header prints the same sentence (`data-testid="lim-header-refusal"` in `HeatmapChainPanel.tsx`) and does not print Lean, Mix, or magF. The string is `limNoScaleMessage` in `web/lib/options-lab/templates/limChrome.ts`. Spec LIM26 / E27 and AT-LIM33 require that refusal. The surface is not a blank quad and not a ball sitting at the centre.

DL-815 ruling 8, quoted:

> If data is missing, then the system should say data is missing. I would hope the message would be a bit more specific than that, so we can determine why.

The shipped sentence already names the missing piece and the symbol. The example in the assignment, "Quad window unavailable for {symbol}: no centre scale configured.", is a different sentence. Putting that sentence on the quad would edit `limChrome.ts`, `HeatmapLimQuadrant.tsx`, and `HeatmapChainPanel.tsx`. Those files are in the Heatmap / Runner tree. That tree is frozen. A change there needs Coach's three OKs before the first edit.

Putting the proposed numbers into `NEXT_PUBLIC_LABS_LIM_CENTRE_SCALE_PTS` is config in `web/.env` and `web/.env.local`. That is a separate step. This proposal does not do it.
