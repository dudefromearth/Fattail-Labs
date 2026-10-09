# LIM straddle scale — k calibration v1.0

**Hotel. Evidence only. Not a build stamp. Not applied.**

Amendment §4 of `agents/p-options-pricing-foundation/LIM-Straddle-Scale-Amendment-v0_1.md`. The per-symbol list is not used. No env file was edited.

## 1. The fit

```text
S = mid(ATM call) + mid(ATM put)
r = centrePts / (k · S)
x = 100 · tanh(r)
```

`k` is the unique positive constant that makes SPX's type-7 median `|x|` equal **11.13**.

**k = 3.2712422351724415**

Achieved SPX median `|x|` = 11.130000000000003. The difference from 11.13 is 2 × 10⁻¹⁵, which is the binary-search residual. No scored minute has `|x| = 100` or `|x| > 100`.

## 2. Sample and the centre check

Same 41,063 RTH wings-25 minutes as `gate-reports/LIM-Centre-Scale-Formula-Evaluation-v1_0.md`. StudioOne file `/tmp/lim-centre-minutes.jsonl` is 41,063 lines. The fit ran there: `python3 /tmp/lim_straddle_k.py` (scratch only).

`centrePts` was re-checked this session against `lim.ts` `computeLim` on the same three SPX snaps as the evaluation. Both sides:

| Snap | `centrePts` |
|---|---|
| 2026-09-30 14:00:00.815Z | −6.48999989 |
| 2026-10-02 14:00:00.918Z | 10.60718533 |
| 2026-10-07 14:00:04.534Z | 3.28882628 |

They agree to 8 decimal places.

ATM is the listed strike nearest spot on that snap's expiration. The stored straddle is call mid + put mid at `generation.spot_strike`. `server/market_data/chain_ladder.py` sets `spot_strike` to the minimum of `|strike − spot|` over the listed strikes in that expiration's rows (lines 512–515). That is the amendment's ATM. The scan does not borrow a neighbouring strike when the ATM mid is absent.

## 3. Missing straddles

None. The count is 0 on every one of the 18 symbols. Every minute in the 41,063 had a positive finite straddle.

## 4. Per symbol

`|x|` is the tanh reading. "\> 95" is the count of minutes with `|x| > 95`, and the share of scored minutes.

| Symbol | n | Median | p90 | p99 | Max | \|x\| > 95 | Share |
|---|---:|---:|---:|---:|---:|---:|---:|
| AAPL | 1924 | 18.569 | 37.157 | 65.762 | 91.938 | 0 | 0.000% |
| AMZN | 1910 | 21.708 | 49.745 | 87.970 | 99.792 | 5 | 0.262% |
| GLD | 3114 | 19.670 | 44.911 | 71.648 | 92.851 | 0 | 0.000% |
| GOOGL | 1926 | 23.995 | 55.634 | 82.886 | 99.797 | 6 | 0.312% |
| IWM | 3316 | 25.529 | 64.943 | 97.361 | 99.956 | 51 | 1.538% |
| META | 1629 | 10.452 | 29.976 | 64.977 | 95.767 | 1 | 0.061% |
| MSFT | 1926 | 14.657 | 37.136 | 52.346 | 98.701 | 1 | 0.052% |
| NVDA | 1806 | 11.749 | 27.729 | 60.958 | 94.029 | 0 | 0.000% |
| QQQ | 3045 | 10.771 | 25.603 | 50.803 | 85.844 | 0 | 0.000% |
| SLV | 1928 | 40.492 | 85.591 | 99.467 | 99.993 | 77 | 3.994% |
| SPX | 3268 | 11.130 | 22.537 | 38.649 | 75.819 | 0 | 0.000% |
| SPY | 3135 | 8.676 | 24.979 | 50.875 | 74.758 | 0 | 0.000% |
| TLT | 1930 | 50.945 | 88.805 | 99.598 | 99.990 | 122 | 6.321% |
| TSLA | 1720 | 12.390 | 40.779 | 82.486 | 98.406 | 5 | 0.291% |
| UNG | 1043 | 46.467 | 84.308 | 99.899 | 99.996 | 41 | 3.931% |
| USO | 1167 | 39.395 | 82.119 | 95.610 | 97.466 | 17 | 1.457% |
| XLF | 3214 | 22.295 | 82.390 | 99.606 | 99.999 | 165 | 5.134% |
| XSP | 3062 | 9.510 | 21.510 | 37.313 | 78.436 | 0 | 0.000% |

**Flag, share above 1%:** IWM 1.538%, SLV 3.994%, TLT 6.321%, UNG 3.931%, USO 1.457%, XLF 5.134%. The other twelve symbols are under 1%. SPX is 0 of 3,268.

## 5. Consistency

Spread = largest symbol ÷ smallest symbol.

| | Smallest | Largest | Spread |
|---|---|---|---:|
| Median \|x\| | SPY 8.676 | TLT 50.945 | 5.872 |
| p99 \|x\| | XSP 37.313 | UNG 99.899 | 2.677 |

`tanh` compresses the tail relative to the linear straddle scale in the evaluation (F5 p99 spread 9.69). The median spread moves from 6.46 to 5.87.

## 6. SPX against today

Today is the fixed scale of 50. Type-7 median `|lean|` on these 3,268 minutes is 11.131488677723693. The max is 50.75576081224115. The amendment's target, 11.13, is that median stated to two decimals.

| | Median \|x\| | Max \|x\| |
|---|---:|---:|
| Today, scale 50 | 11.13149 | 50.75576 |
| tanh, this k | 11.13000 | 75.81950 |
| Change | −0.00149 | +25.06374 |

The change from the named target 11.13 to the achieved median is 0 at two decimal places. The extreme minute moves from 50.76 toward the edge and stops at 75.82. It does not reach 100.
