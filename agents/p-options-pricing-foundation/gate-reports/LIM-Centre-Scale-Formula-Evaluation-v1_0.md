# LIM centre scale — formula evaluation v1.0

**Hotel. Evidence only. Not applied.**

Coach wants one shared rule, so a given ball position means the same thing on every symbol, instead of a hand-kept per-symbol list. Plan law MS-4 is the same demand: no symbol-keyed numbers.

The apply prompt (`docs/Grok Build — LIM centre scale- apply per-symbol list v1.0.md`) stays on hold. No env file, no code, no restart, no commit.

## 1. What was measured

`|lean|` here is the unclamped reading, `|centrePts| / scale × 100`. The ball drawn on the quad is that value clamped at ±100. A minute is at the edge when `|lean| ≥ 100`.

Percentiles are type-7, the same index as the proposal: `(p/100) × (n − 1)`, linear between the two surrounding points.

The consistency score is the spread of those readings across the 18 symbols: the largest symbol's median `|lean|` divided by the smallest, and the same for p99. The lowest spread is the formula under which a given ball position means the most nearly the same thing everywhere. A single shared `k` cancels out of that ratio, so calibration (a) and calibration (b) have the same spread. They differ in the level of the reading and in how many minutes sit on the edge.

## 2. The sample

Same evidence set as `gate-reports/LIM-Centre-Scale-Per-Symbol-Proposal-v1_0.md`.

**Centre check, re-run this session.** Python `centre_pts` in `/tmp/lim_centre_lib.py` and `computeLim` via `npx --yes tsx /tmp/lim-centre-check.ts` on the same three SPX snaps:

| Snap | `centrePts` |
|---|---|
| `day=2026-09-30/chain/SPX/snap-140000815Z.json` | −6.48999989 |
| `day=2026-10-02/chain/SPX/snap-140000918Z.json` | 10.60718533 |
| `day=2026-10-07/chain/SPX/snap-140004534Z.json` | 3.28882628 |

They agree to 8 decimal places.

**Scan.** StudioOne, read-only: `python3 /tmp/lim_centre_formula_scan.py`, started 2026-10-08T20:52:10. Output `/tmp/lim-centre-minutes.jsonl` (copied to StudioTwo `/tmp`). The rule is the proposal's rule: RTH, topic `:w25:`, nearest expiration on or after the session day, first snap in each America/New_York clock minute, empty mass left out. In this tree that expiration is the session day.

The rth `:w25:` file count is 151,775 and the minute count is 41,063, the same two counts as the proposal. Per symbol, per day, the minute counts match the proposal summary with no mismatch. SPX is 3,268 minutes, max `|centrePts|` 25.377880406120575, median spot 7718.775. The disk now holds more files on 2026-10-08 (the day directory grew after the proposal scan). Those extra files are outside the RTH `:w25:` filter, so the minute sample did not grow.

UNG is 1,043 minutes and USO is 1,167, each on three sessions (2026-09-30, 2026-10-02, 2026-10-07). That is the proposal's calendar, unchanged.

## 3. The formulas and the two values of k

`k` is one number for every symbol.

| ID | Scale | k (a) median SPX scale = 50 | k (b) SPX's furthest centre minute at \|lean\| = 50.8 |
|---|---|---:|---:|
| F1 share of spot | `k × spot` | 0.00647771 | 0.00653909 |
| F2 window width | `k × 25 × strike step` | 0.400000 | 0.399652 |
| F3 expected move | `k × spot × IV × √τ` | 3.41821 | 1.45538 |
| F4 realised range | `k × median daily high–low` | not scored | not scored |
| F5 ATM straddle (Hotel) | `k × (call mid + put mid)` | 2.808988764044944 | 1.36680 |
| F6 spot × IV (Hotel) | `k × spot × IV` | 0.0680881 | 0.0375950 |

(a) sets `k` so the median of the SPX scale equals 50. A typical SPX minute keeps a 50-point scale.

(b) sets `k` so the minute with the largest `|centrePts|` (SPX 2026-10-01 10:09 ET, `|centrePts|` 25.37788) reads `|lean|` = 50.8. Today's fixed scale of 50 makes that same minute read 50.76.

F1's two k values differ by about 0.9%. F2's differ by about 0.09%. F3's second k is 0.43 times the first, because √τ on that morning minute is not the median √τ. F5 moves the same way: the straddle on that morning minute is $36.55 against a median straddle of $17.80, so k (b) is about half of k (a).

**F1** uses the snap's `generation.spot`.

**F2** uses wings 25, the Runner default on every one of these snaps, times that snap's `generation.strike_step`. SPX's step is 5 on all 3,268 minutes, so the window is 125 points and k (a) = 50 / 125 = 0.4. The scale is 10 × the strike step.

**F3** uses the ATM implied volatility on the chain row and τ from OPF29. τ is the PM branch of `server/opf/tau.py`: 16:00 America/New_York on the expiration date, Actual/365.25, floored at one minute. These books are the session-day expiration, so they are 0DTE and the PM instant is the one that applies. An AM-settled monthly is not in this sample. ATM is `generation.spot_strike` when that strike is listed, otherwise the closest listed strike. IV is that strike's call `iv`, or the put `iv` on the same strike when the call `iv` is absent. No neighbouring strike is used. 118 of 41,063 minutes took the put. None lacked both. The stored `iv` is a decimal (SPX median 0.0948), not a percent.

**F4** is not scored. The live-capture tree has chain snaps and underlier mark prints (`marks/*.jsonl`). It does not have daily high–low bars. Those bars live in MySQL `market_ohlc_bars`, which this archive read does not open and which the Runner's chain context does not hold.

**F5** is Hotel's addition. The scale is a constant multiple of the listed ATM straddle, call mid plus put mid, on the same ATM strike as F3. Both mids have to be finite and positive. All 41,063 minutes had that pair. The straddle is the market's priced move in points for that expiration. It uses the quotes already on the row, and it does not run a second τ.

**F6** is Hotel's other addition: F3 with the clock taken out, so the scale does not shrink as √τ falls. It is scored below. It does not win, and a handful of near-zero IV prints throw its maximum into the tens of thousands.

## 4. Consistency

Spread = largest symbol ÷ smallest symbol. Lower is closer to "the same reading everywhere."

| Formula | k | Median \|lean\| spread | p99 \|lean\| spread |
|---|---|---:|---:|
| F5 straddle | either | **6.46** (SPY 10.13 … TLT 65.45) | **9.69** (XSP 45.66 … UNG 442) |
| F6 spot × IV | either | 7.38 (SPY 10.07 … UNG 74.36) | 13.46 (SPX 36.64 … XLF 493) |
| F3 expected move | either | 8.14 (SPY 10.30 … UNG 83.78) | 13.47 (SPX 159 … UNG 2,141) |
| Option 1 list | per symbol | 9.52 (XLF 1.59 … USO 15.12) | **2.81** (NVDA 16.36 … USO 45.93) |
| F2 window | either | 16.30 (NVDA 2.04 … USO 33.26) | 12.35 (NVDA 8.18 … USO 101) |
| F1 share of spot | either | 34.22 (SPY 10.63 … UNG 364) | 36.21 (XSP 31.10 … UNG 1,126) |

F5 is the lowest spread on both columns among the formulas that use one shared k. Option 1's p99 spread is tighter because each symbol's scale was set from that symbol's own maximum. Its typical minute is less consistent than F5 (XLF's median `|lean|` is 1.59 and USO's is 15.12).

### F1 (a) — k = 0.00647771

| Symbol | n | Median | p90 | p99 | Max | At ±100 |
|---|---:|---:|---:|---:|---:|---:|
| AAPL | 1924 | 43.11 | 90.96 | 136.72 | 224.46 | 115 |
| AMZN | 1910 | 60.95 | 150.39 | 308.98 | 666.38 | 591 |
| GLD | 3114 | 32.31 | 83.39 | 160.31 | 232.72 | 193 |
| GOOGL | 1926 | 68.20 | 152.02 | 235.90 | 496.06 | 595 |
| IWM | 3316 | 41.78 | 105.63 | 188.11 | 278.80 | 385 |
| META | 1629 | 37.86 | 114.20 | 188.39 | 221.84 | 234 |
| MSFT | 1926 | 36.99 | 92.36 | 139.21 | 202.45 | 134 |
| NVDA | 1806 | 33.79 | 74.57 | 134.46 | 384.78 | 47 |
| QQQ | 3045 | 16.50 | 37.07 | 53.74 | 91.83 | 0 |
| SLV | 1928 | 137.86 | 326.54 | 504.00 | 675.62 | 1188 |
| SPX | 3268 | 11.08 | 28.67 | 38.65 | 51.28 | 0 |
| SPY | 3135 | 10.63 | 25.74 | 41.29 | 98.64 | 0 |
| TLT | 1930 | 105.09 | 217.75 | 339.64 | 483.36 | 1022 |
| TSLA | 1720 | 44.61 | 108.56 | 209.20 | 358.94 | 210 |
| UNG | 1043 | 363.79 | 885.05 | 1126.15 | 1341.77 | 810 |
| USO | 1167 | 175.70 | 445.98 | 533.92 | 567.17 | 875 |
| XLF | 3214 | 45.63 | 294.18 | 733.11 | 1439.36 | 820 |
| XSP | 3062 | 10.98 | 20.68 | 31.10 | 34.98 | 0 |

F1 (b), k = 0.00653909, multiplies every `|lean|` by 0.00647771 / 0.00653909. The spread does not change. UNG's median falls from 364 to 360. SPX's max becomes 50.80. Edge counts stay in the same hundreds.

### F2 (a) — k = 0.4

Scale = 10 × strike step. SPX's scale is 50 on every minute.

| Symbol | n | Median | p90 | p99 | Max | At ±100 |
|---|---:|---:|---:|---:|---:|---:|
| AAPL | 1924 | 3.74 | 7.92 | 11.82 | 19.55 | 0 |
| AMZN | 1910 | 3.96 | 9.72 | 19.73 | 42.47 | 0 |
| GLD | 3114 | 7.95 | 20.50 | 39.26 | 56.95 | 0 |
| GOOGL | 1926 | 6.10 | 13.54 | 20.98 | 44.14 | 0 |
| IWM | 3316 | 8.66 | 21.09 | 37.16 | 75.93 | 0 |
| META | 1629 | 7.23 | 21.56 | 35.67 | 41.44 | 0 |
| MSFT | 1926 | 4.99 | 12.52 | 18.69 | 26.44 | 0 |
| NVDA | 1806 | 2.04 | 4.53 | 8.18 | 23.81 | 0 |
| QQQ | 3045 | 7.99 | 17.84 | 25.84 | 44.59 | 0 |
| SLV | 1928 | 9.76 | 23.04 | 35.97 | 47.12 | 0 |
| SPX | 3268 | 11.13 | 28.37 | 38.23 | 50.76 | 0 |
| SPY | 3135 | 5.32 | 12.91 | 20.44 | 49.49 | 0 |
| TLT | 1930 | 9.39 | 20.11 | 34.09 | 48.52 | 0 |
| TSLA | 1720 | 4.20 | 10.56 | 20.28 | 32.78 | 0 |
| UNG | 1043 | 4.92 | 11.90 | 15.14 | 18.11 | 0 |
| USO | 1167 | 33.26 | 84.52 | 101.05 | 107.16 | 15 |
| XLF | 3214 | 3.10 | 14.75 | 37.86 | 82.13 | 0 |
| XSP | 3062 | 5.50 | 10.36 | 15.48 | 17.41 | 0 |

F2 (b), k = 0.399652, lifts SPX's max from 50.76 to 50.80 and USO's edge count from 15 to 16. Every other symbol stays off the edge.

### F3 (a) — k = 3.41821

| Symbol | n | Median | p90 | p99 | Max | At ±100 |
|---|---:|---:|---:|---:|---:|---:|
| AAPL | 1924 | 24.44 | 80.27 | 563 | 291994 | 144 |
| AMZN | 1910 | 32.36 | 96.26 | 775 | 479959 | 183 |
| GLD | 3114 | 25.74 | 74.37 | 288 | 750 | 215 |
| GOOGL | 1926 | 33.63 | 103.26 | 421 | 628393 | 199 |
| IWM | 3316 | 31.39 | 151.51 | 936 | 411879 | 498 |
| META | 1629 | 13.45 | 47.73 | 302 | 1482 | 82 |
| MSFT | 1926 | 18.59 | 61.29 | 236 | 1555 | 77 |
| NVDA | 1806 | 16.01 | 57.91 | 304 | 1991 | 79 |
| QQQ | 3045 | 13.20 | 40.61 | 235 | 1673 | 121 |
| SLV | 1928 | 55.48 | 253.44 | 1821 | 1648397 | 540 |
| SPX | 3268 | 13.41 | 38.60 | 159 | 2240 | 72 |
| SPY | 3135 | 10.30 | 47.51 | 252 | 940 | 138 |
| TLT | 1930 | 71.28 | 277.02 | 988 | 4668 | 712 |
| TSLA | 1720 | 14.82 | 80.61 | 659 | 881368 | 143 |
| UNG | 1043 | 83.78 | 220.53 | 2141 | 558269 | 450 |
| USO | 1167 | 53.52 | 200.71 | 728 | 2087 | 314 |
| XLF | 3214 | 36.11 | 216.08 | 1159 | 757577 | 601 |
| XSP | 3062 | 11.76 | 36.71 | 193 | 9944 | 71 |

The maxima are the one-minute τ floor. At 15:59, √τ is √(1/365.25/24/60) and the scale collapses, so a centre of a few points reads as thousands. F3 (b) multiplies every `|lean|` by 3.41821 / 1.45538 ≈ 2.35. SPX's median goes from 13.41 to 31.50 and its edge count from 72 to 282.

### F5 (a) — k = 2.808988764044944

This k is 50 / 17.80. 17.80 is SPX's median ATM straddle in points on this sample, so the median SPX scale is 50.

| Symbol | n | Median | p90 | p99 | Max | At ±100 |
|---|---:|---:|---:|---:|---:|---:|
| AAPL | 1924 | 21.88 | 45.45 | 91.85 | 184.58 | 13 |
| AMZN | 1910 | 25.69 | 63.57 | 160.10 | 399.94 | 72 |
| GLD | 3114 | 23.21 | 56.32 | 104.85 | 191.86 | 47 |
| GOOGL | 1926 | 28.50 | 73.08 | 137.94 | 401.17 | 74 |
| IWM | 3316 | 30.40 | 90.17 | 251.24 | 490.01 | 271 |
| META | 1629 | 12.22 | 36.02 | 90.24 | 223.25 | 12 |
| MSFT | 1926 | 17.19 | 45.42 | 67.67 | 292.89 | 7 |
| NVDA | 1806 | 13.75 | 33.16 | 82.49 | 202.69 | 12 |
| QQQ | 3045 | 12.59 | 30.49 | 65.22 | 149.92 | 4 |
| SLV | 1928 | 50.02 | 148.81 | 345.22 | 594.24 | 388 |
| SPX | 3268 | 13.02 | 26.70 | 47.47 | 115.52 | 1 |
| SPY | 3135 | 10.13 | 29.72 | 65.34 | 112.67 | 5 |
| TLT | 1930 | 65.45 | 164.51 | 361.72 | 578.41 | 517 |
| TSLA | 1720 | 14.50 | 50.42 | 136.47 | 280.90 | 49 |
| UNG | 1043 | 58.61 | 143.44 | 442.24 | 624.21 | 251 |
| USO | 1167 | 48.50 | 135.14 | 221.09 | 253.62 | 201 |
| XLF | 3214 | 26.41 | 136.12 | 362.57 | 749.74 | 402 |
| XSP | 3062 | 11.11 | 25.45 | 45.66 | 123.05 | 2 |

F5 (b), k = 1.36680, multiplies every `|lean|` by about 2.055. SPX's median becomes 26.75, its max 237, and 31 of 3,268 minutes sit on the edge.

### F6 (a) — k = 0.0680881

| Symbol | n | Median | p90 | p99 | Max | At ±100 |
|---|---:|---:|---:|---:|---:|---:|
| AAPL | 1924 | 22.85 | 50.00 | 105.03 | 55535 | 24 |
| AMZN | 1910 | 28.51 | 71.13 | 204.89 | 118043 | 98 |
| GLD | 3114 | 23.02 | 55.78 | 93.99 | 180.50 | 22 |
| GOOGL | 1926 | 28.75 | 71.52 | 130.27 | 71496 | 48 |
| IWM | 3316 | 30.60 | 85.81 | 226.37 | 94011 | 213 |
| META | 1629 | 11.62 | 35.94 | 69.50 | 177.50 | 5 |
| MSFT | 1926 | 17.19 | 43.59 | 59.96 | 164.66 | 5 |
| NVDA | 1806 | 14.91 | 34.45 | 76.63 | 255.98 | 13 |
| QQQ | 3045 | 12.19 | 28.46 | 50.13 | 118.17 | 3 |
| SLV | 1928 | 52.86 | 147.86 | 339.60 | 147087 | 377 |
| SPX | 3268 | 12.82 | 25.45 | 36.64 | 155.06 | 1 |
| SPY | 3135 | 10.07 | 26.87 | 55.20 | 135.69 | 4 |
| TLT | 1930 | 71.39 | 161.02 | 310.48 | 470.87 | 591 |
| TSLA | 1720 | 14.42 | 46.62 | 123.15 | 73891 | 34 |
| UNG | 1043 | 74.36 | 162.34 | 337.42 | 193619 | 397 |
| USO | 1167 | 47.42 | 121.20 | 185.32 | 296.81 | 180 |
| XLF | 3214 | 29.74 | 168.41 | 493.26 | 161606 | 498 |
| XSP | 3062 | 11.10 | 24.50 | 36.76 | 892.67 | 3 |

The medians are orderly. The maxima are single IV prints near zero. F6 (b) multiplies the column by 0.0680881 / 0.0375950 ≈ 1.81 and raises SPX's edge count from 1 to 13.

### Option 1, the per-symbol list

This is the list in the apply prompt: each scale is the smallest multiple of the strike step that is at least 1.970 × the proposal report's published two-decimal max `|centrePts|`. SPX stays 50. The list was not written into any env file.

| Symbol | Scale | n | Median | p90 | p99 | Max | At ±100 |
|---|---:|---:|---:|---:|---:|---:|---:|
| AAPL | 10 | 1924 | 9.35 | 19.81 | 29.55 | 48.87 | 0 |
| AMZN | 22.5 | 1910 | 4.40 | 10.80 | 21.92 | 47.18 | 0 |
| GLD | 12 | 3114 | 6.63 | 17.09 | 32.72 | 47.45 | 0 |
| GOOGL | 22.5 | 1926 | 6.77 | 15.04 | 23.32 | 49.05 | 0 |
| IWM | 10 | 3316 | 7.56 | 19.21 | 34.07 | 50.71 | 0 |
| META | 22.5 | 1629 | 8.03 | 23.96 | 39.63 | 46.05 | 0 |
| MSFT | 15 | 1926 | 8.31 | 20.87 | 31.15 | 44.07 | 0 |
| NVDA | 12.5 | 1806 | 4.08 | 9.06 | 16.36 | 47.61 | 0 |
| QQQ | 9 | 3045 | 8.88 | 19.82 | 28.72 | 49.54 | 0 |
| SLV | 5 | 1928 | 9.76 | 23.04 | 35.97 | 47.12 | 0 |
| SPX | 50 | 3268 | 11.13 | 28.37 | 38.23 | 50.76 | 0 |
| SPY | 10 | 3135 | 5.32 | 12.91 | 20.44 | 49.49 | 0 |
| TLT | 5 | 1930 | 10.52 | 21.91 | 34.09 | 48.52 | 0 |
| TSLA | 17.5 | 1720 | 6.00 | 15.09 | 28.97 | 46.83 | 0 |
| UNG | 2 | 1043 | 12.30 | 29.74 | 37.84 | 45.27 | 0 |
| USO | 11 | 1167 | 15.12 | 38.42 | 45.93 | 48.71 | 0 |
| XLF | 10 | 3214 | 1.59 | 10.22 | 25.39 | 50.05 | 0 |
| XSP | 4 | 3062 | 13.76 | 25.91 | 38.69 | 43.53 | 0 |

Every symbol's maximum sits between 43.5 and 50.8, which is what fitting the scale to each symbol's own maximum does. The typical minute does not. XLF's median is 1.59 and USO's is 15.12.

## 5. SPX impact against today's fixed 50

Today's SPX median `|lean|` is 11.131 and the max is 50.756. "Median change" is the median of the minute-by-minute difference. "Max change" is the largest one-minute increase. Spec §16 treats any of this as a breaking change to readings members have already seen.

| Formula | Median \|lean\| | Max \|lean\| | Median change | Max change | Minutes at ±100 |
|---|---:|---:|---:|---:|---:|
| Today, scale 50 | 11.13 | 50.76 | — | — | 0 / 3268 |
| F1 (a) | 11.08 | 51.28 | +0.00 | +0.53 | 0 |
| F1 (b) | 10.98 | 50.80 | −0.09 | +0.09 | 0 |
| F2 (a) | 11.13 | 50.76 | 0 | 0 | 0 |
| F2 (b) | 11.14 | 50.80 | +0.01 | +0.04 | 0 |
| F3 (a) | 13.41 | 2240 | +0.00 | +2227 | 72 |
| F3 (b) | 31.50 | 5261 | +16.08 | +5248 | 282 |
| F5 (a) | 13.02 | 115.52 | 0.00 | +102.38 | 1 |
| F5 (b) | 26.75 | 237.41 | +12.28 | +224.27 | 31 |
| F6 (a) | 12.82 | 155.06 | 0.00 | +141.92 | 1 |
| F6 (b) | 23.22 | 280.82 | +9.39 | +267.68 | 13 |
| Option 1 | 11.13 | 50.76 | 0 | 0 | 0 |

F2 (a) and option 1 leave every SPX minute where it is, because both scales are 50 on every SPX snap.

F5 (a) leaves the median minute's change at 0.00, and it moves the median `|lean|` from 11.13 to 13.02. Those two facts can sit together: on half the minutes the straddle is richer than $17.80 and the ball moves in, on half it is cheaper and the ball moves out. The minute that moves the most is 2026-09-29 15:59 ET: `|centrePts|` 6.57, straddle $2.025, spot 7670.37, `|lean|` 115.52. Twenty-nine of the 3,268 SPX minutes read `|lean| ≥ 50` under F5 (a). Today, one minute reaches 50.76 and none reach 100.

## 6. Through one session

2026-10-07, a full RTH day in the sample (390 minutes for SPX, the equity hours below are that day's AAPL book). Hour 09 is 09:30–09:59. Hour 15 is 15:00–15:59.

**F3 (a).** The scale is `k × spot × IV × √τ`. It shrinks as the clock runs out.

| Hour | SPX n | SPX scale median | SPX \|lean\| median | SPX max | SPX at ±100 | AAPL scale median | AAPL \|lean\| median | AAPL max | AAPL at ±100 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 09 | 30 | 92.51 | 2.74 | 12.47 | 0 | 8.92 | 18.74 | 36.01 | 0 |
| 10 | 60 | 72.57 | 6.34 | 11.54 | 0 | 6.48 | 22.52 | 42.06 | 0 |
| 11 | 60 | 57.40 | 8.29 | 13.62 | 0 | 5.20 | 27.44 | 39.02 | 0 |
| 12 | 60 | 47.04 | 5.26 | 18.21 | 0 | 4.37 | 31.85 | 48.49 | 0 |
| 13 | 60 | 33.26 | 12.94 | 25.18 | 0 | 3.28 | 27.66 | 45.71 | 0 |
| 14 | 60 | 19.44 | 23.71 | 44.88 | 0 | 2.23 | 30.25 | 65.66 | 0 |
| 15 | 60 | 8.70 | 51.74 | 847.28 | 16 | 1.03 | 54.90 | 1390.64 | 15 |

The last hour is where the ball gets jumpy. SPX's median scale falls from 92.5 at the open to 8.7 in the last hour, the median `|lean|` rises from 2.7 to 51.7, and 16 of the 60 minutes sit on the edge. AAPL does the same, 15 of 60. F3 (b) is the same shape with a smaller scale: SPX's last hour then has median `|lean|` 121.5, max 1990, and 37 of 60 on the edge.

**F5 (a), the same day, for comparison.** The straddle also cheapens into the close. It cheapens as a price, and it stops at the quote, so it does not follow τ down to the one-minute floor.

| Hour | SPX straddle median | SPX scale median | SPX \|lean\| median | SPX max | SPX at ±100 | AAPL \|lean\| median | AAPL max | AAPL at ±100 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 09 | 27.73 | 77.88 | 3.26 | 19.23 | 0 | 21.61 | 32.81 | 0 |
| 10 | 22.60 | 63.48 | 7.32 | 12.55 | 0 | 25.32 | 40.68 | 0 |
| 11 | 19.28 | 54.14 | 8.80 | 14.29 | 0 | 28.58 | 42.07 | 0 |
| 12 | 16.45 | 46.21 | 5.27 | 16.97 | 0 | 31.22 | 49.77 | 0 |
| 13 | 13.45 | 37.78 | 11.65 | 20.26 | 0 | 22.39 | 33.01 | 0 |
| 14 | 8.97 | 25.21 | 18.31 | 35.82 | 0 | 19.98 | 34.23 | 0 |
| 15 | 6.19 | 17.38 | 26.47 | 95.54 | 0 | 25.67 | 184.10 | 3 |

On this session SPX never reaches the edge. The median ball still drifts from 3.3 at the open to 26.5 in the last hour, because a $6 straddle is a smaller scale than a $28 straddle. AAPL's last hour puts 3 of 60 minutes on the edge, max `|lean|` 184.

## 7. Recommendation

**Hotel's recommendation: F5 (a).**

`scale = 2.808988764044944 × (ATM call mid + ATM put mid).`

The constant is `50 / 17.80`, and 17.80 is the median SPX straddle on this sample. When the SPX straddle is $17.80, the scale is 50 points, which is today's number. The ball reaches the edge when the GEX centre sits 2.81 straddles away from spot.

Consistency, from section 4: median-`|lean|` spread **6.46**, p99 spread **9.69**. That is the lowest pair among the shared-k formulas. Option 1's p99 spread is 2.81 because the list was fit to each symbol's own tail. Its median spread is 9.52, wider than F5.

SPX impact, from section 5: median `|lean|` moves from 11.13 to 13.02. The max moves from 50.76 to 115.52. One of 3,268 minutes reaches ±100. The median minute-by-minute change is 0.00. The large move is a late-day cheap straddle, shown in section 6. Spec §16 makes that a breaking change to SPX readings. This report does not apply it.

**What the Runner already has.** The call mid and the put mid are on the ladder row (`LadderRow.mid`). The chain context already carries the contracts, the spot, and the strike. No second feed. ATM is the listed `spot_strike`, or the closest listed strike when that strike is absent from the rows. Both mids have to be there.

**When the straddle is missing.** The quad still draws the cells, the crosshairs, and the axis labels. The blue ball does not draw. The sentence, specific to the hole, is:

> Quad window unavailable for {symbol}: no ATM straddle price.

No other symbol's straddle, no scale of 50, no previous minute's price. That is ruling 8 (DL-815): a missing input is named, and it is not replaced. The sentence shipped today is `No centre scale configured for {symbol}.` (`limNoScaleMessage` in `web/lib/options-lab/templates/limChrome.ts`). Putting the new sentence on the quad edits `limChrome.ts`, `HeatmapLimQuadrant.tsx`, and `HeatmapChainPanel.tsx`. Those files are in the frozen Heatmap / Runner tree. This evaluation does not edit them.

The same shape of refusal, if one of the other formulas were chosen instead:

| Formula | Missing input | Sentence |
|---|---|---|
| F1 | spot | Quad window unavailable for {symbol}: no spot. |
| F2 | strike step | Quad window unavailable for {symbol}: no strike step. |
| F3 | ATM IV | Quad window unavailable for {symbol}: no ATM implied volatility. |
| F3 | expiration or as-of | Quad window unavailable for {symbol}: no expiry clock. |
| F4 | daily range | Quad window unavailable for {symbol}: no daily range. |
| F6 | ATM IV | Quad window unavailable for {symbol}: no ATM implied volatility. |

F3's τ law is `server/opf/tau.py`. The Runner client does not call it. The expiration and the as-of are already on the chain the panel holds. A second τ in the browser would be a second clock, and this evaluation does not add one.

F4's bars are the input that is not in the archive. Scoring it would have meant opening MySQL or treating the mark tape as a bar. Neither was done.

## 8. What this leaves

The values are not in `web/.env` or `web/.env.local`. Staging and production were not touched. The decision log was not touched. Adopting F5 is a later step: the formula has to land in the LIM spec as a versioned breaking change (§16), the frozen Runner tree needs Coach's three OKs before any edit, and the refusal sentence goes with that edit.
