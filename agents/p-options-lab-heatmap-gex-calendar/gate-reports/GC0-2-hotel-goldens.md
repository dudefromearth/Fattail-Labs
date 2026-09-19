# GC0-2 Hotel — six hand goldens (before `gexCal.ts`)

**Seat:** Hotel  
**Date:** 2026-09-18  
**Law:** `gex_v1` = call \(+\Gamma·OI·S^2\), put \(-\Gamma·OI·S^2\), net = sum. Both sides required for `gex_net`.  
**Spot \(S = 100\)** throughout. \(S^2 = 10\,000\). Arithmetic is hand-worked. These numbers are **not** from an implementation.

Dealer-sign caveat: this is chain GEX **(estimate)**, not true dealer GEX (HM12). **Term Mass** is a picker name, not a mass claim. No magnet / pin / air labels.

---

## Golden 1 — one expiry, both sides present (AT-GC1)

Expiry `E1`. Three listed strikes.

| K | \(\Gamma_c\) | \(OI_c\) | \(\Gamma_p\) | \(OI_p\) | call \(= +\Gamma_c OI_c S^2\) | put \(= -\Gamma_p OI_p S^2\) | **net** |
|---|-------------:|---------:|-------------:|---------:|------------------------------:|-----------------------------:|--------:|
| 105 | 0.40 | 20 | 0.10 | 5 | \(0.40×20×10000 = 80\,000\) | \(-0.10×5×10000 = -5\,000\) | **75 000** |
| 100 | 0.50 | 10 | 0.50 | 10 | \(0.50×10×10000 = 50\,000\) | \(-0.50×10×10000 = -50\,000\) | **0** |
| 95 | 0.10 | 5 | 0.40 | 20 | \(0.10×5×10000 = 5\,000\) | \(-0.40×20×10000 = -80\,000\) | **−75 000** |

Must match frozen `gexNet(ctx, K)` on this one-expiry book. Display of net 0 at K=100 is **`$0`** (Golden 5), not blank.

---

## Golden 2 — two expiries (AT-GC2)

`E1` = Golden 1. `E2` same \(S=100\):

| K | \(\Gamma_c\) | \(OI_c\) | \(\Gamma_p\) | \(OI_p\) | call | put | **net** |
|---|-------------:|---------:|-------------:|---------:|-----:|----:|--------:|
| 105 | 0.15 | 10 | 0.05 | 4 | 15 000 | −2 000 | **13 000** |
| 100 | 0.20 | 10 | 0.20 | 10 | 20 000 | −20 000 | **0** |
| 95 | 0.05 | 4 | 0.15 | 10 | 2 000 | −15 000 | **−13 000** |

NET(\(E1\)) = \(75\,000 + 0 + (-75\,000) = 0\)  
NET(\(E2\)) = \(13\,000 + 0 + (-13\,000) = 0\)  
bar(105) = \(75\,000 + 13\,000 = 88\,000\)  
bar(100) = \(0 + 0 = 0\)  
bar(95) = \(-75\,000 + (-13\,000) = -88\,000\)  
\(\lvert bar\rvert\) tie 105 vs 95 at 88 000 → **peak = lowest strike = 95** (GC7 ties).

---

## Golden 3 — missing put at (105, \(E1\)) (AT-GC5 / AT-GC10)

Same as Golden 1 except put at K=105 is **absent** (`gexSide` put = null).  
`gexNet` → **invalid**. Cell blank. Omitted from NET.

NET(\(E1\)) = \(0 + 0 + (-75\,000) = -75\,000\) (the 75 000 cell is gone).  
bar(105) from \(E1\) contributes **nothing**.

---

## Golden 4 — all-negative 0DTE, mixed later

\(E1\) (near-dated):

| K | call | put | net |
|---|-----:|----:|----:|
| 105 | \(0.10×8×10000 = 8\,000\) | \(-0.30×10×10000 = -30\,000\) | **−22 000** |
| 100 | \(0.10×10×10000 = 10\,000\) | \(-0.40×10×10000 = -40\,000\) | **−30 000** |
| 95 | \(0.05×4×10000 = 2\,000\) | \(-0.50×10×10000 = -50\,000\) | **−48 000** |

NET(\(E1\)) = **−100 000** (cyan column).

\(E2\): Golden 2’s \(E2\) (mixed). Profile bar at each K = \(E1+E2\):  
105: \(-22\,000 + 13\,000 = -9\,000\)  
100: \(-30\,000 + 0 = -30\,000\)  
95: \(-48\,000 + (-13\,000) = -61\,000\)  
Peak = **95** (\(\lvert-61\,000\rvert\) largest). Profile is **not** all cyan — later column mixes it. Chrome must not print “air.”

---

## Golden 5 — actual zero net (AT-GC13)

Golden 1 K=100 net = **0**. Display **`$0`** (or `$0K`). **Not** blank. Blank is reserved for invalid.

---

## Golden 6 — empty pack (AT-GC8)

`books` empty / pack not available. Zero columns. Zero cells. Named empty state. No painted zeros. Relabeling Golden 1 as `E1…E5` with the same book is **refused** (AT-GC9) — not this golden.

---

**OD-GC3:** gold only on the peak strike. Green/red not in these goldens.
