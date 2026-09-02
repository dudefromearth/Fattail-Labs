# Hotel goldens — Heatmap LIM (LIM0-2) — re-issued against Spec v0.4.3

**Law:** Spec **v0.4.3** (E15–E17). Prior sheet against v0.4.2 is superseded.
**Floors / scale unchanged:** `I:SPX` scale 50; close 1% / medium 2% of spot; W 0.50/0.30/0.20; CONC/MAG floors 0 span 100.

**Agent:** Hotel  
**Date:** 2026-09-02  
**Law:** LIM Spec **v0.4.2** §5–6 · §9 · §10 · §12 · Appendix A  
**Plan:** `docs/Options-Lab-Heatmap-LIM-Full-Agent-Bench-Plan-v1.1.md` §6.7  
**Seed:** `agents/p-options-lab-heatmap-lim/seeds/LIM0-2-hotel-formulas.md`

Hand-recorded **before** `lim.ts`. Input is synthetic `StrikeNet[] = { strike, call, put, net }` plus `spot`. LIM reads `net` (and `|net|`). `call` / `put` are filled to the Labs `gex_v1` sign (call ≥ 0, put ≤ 0, `net = call + put`) so a later profile fixture can bind; they are not a second GEX formula.

A golden computed by the implementation tests nothing (Invariant 4).

**Not in this packet:** `lim.ts`, tape sitting, volume, a relationship between near-spot mix and price.

**GO token:** not stamped.

---

## 1. Constants (this sheet)

| Symbol | Value | Source |
|--------|-------|--------|
| `LIM_CENTRE_SCALE_PTS["I:SPX"]` | **50** | §9 · OD-LIM4 default |
| `LIM_BAND_CLOSE_PCT` | **1.0** | §9 — **percent of spot** |
| `LIM_BAND_MEDIUM_PCT` | **2.0** | §9 — **percent of spot** |
| `LIM_W_NET` | **0.50** | §9 |
| `LIM_W_CONC` | **0.30** | §9 |
| `LIM_W_MAG` | **0.20** | §9 · sum = 1.0 |
| `LIM_CONC_FLOOR` / `LIM_CONC_SPAN` | **0 / 100** | E9 · OD-LIM8 starting points |
| `LIM_MAG_FLOOR` / `LIM_MAG_SPAN` | **0 / 100** | E9 · OD-LIM8 starting points |
| `LIM_XPROX_FLOOR_PCT` / `CEIL` | **0.5 / 1.5** | §9 · used only on F7 (and noted on F6) |

All eight fixtures: **symbol `I:SPX`**, **spot = 5000**.

At this spot:

```
closeRadius   = 1.0 / 100 × 5000 = 50     // |K − 5000| ≤ 50  → K ∈ [4950, 5050]
mediumRadius  = 2.0 / 100 × 5000 = 100    // |K − 5000| ≤ 100 → K ∈ [4900, 5100]
```

**PCT is percent, not a raw fraction.** `|K − spot| ≤ 1.0 × spot` would put the close band on `(0, 2S)` and make fixture 4 impossible on any listed SPX ladder. Inclusive bounds. Close ⊂ medium.

---

## 2. Formula sheet (Spec §5–6, Hotel reading)

### 2.1 X — lean

```
totalAbs = Σ |net|                         // over the window
centre   = Σ |net| × (strike − spot) / totalAbs     // index points, signed
leanRaw  = centre / LIM_CENTRE_SCALE_PTS[symbol] × 100
lean     = clamp(leanRaw, −100, +100)
x        = lean
xUnclamped = leanRaw                       // E1. No y twin (E8).
```

Empty map or `totalAbs == 0` → `x = 0` (LIM7). Do not divide.

X uses **`|net|` only**. Sign of gamma does not move X.

### 2.2 Y — near-spot mix

```
close   = { K : |K − spot| ≤ (LIM_BAND_CLOSE_PCT  / 100) × spot }
medium  = { K : |K − spot| ≤ (LIM_BAND_MEDIUM_PCT / 100) × spot }

gexClose      = Σ net      for K in close
absGexClose   = Σ |net|    for K in close
absGexMedium  = Σ |net|    for K in medium

netRatio = gexClose / absGexClose          // 0 if absGexClose == 0
netF     = (netRatio + 1) / 2 × 100        // [0, 100]
concF    = 0 + (absGexMedium / totalAbs) × 100
magF     = 0 + (absGexClose  / totalAbs) × 100
nearSpotMix = netF × 0.50 + concF × 0.30 + magF × 0.20
y = nearSpotMix
```

Empty map or `totalAbs == 0` → **`y = 50` (LIM8)**. That constant **overrides** the blend. Recombining `netF=concF=magF=0` yields `0` and is the MSC empty-state bug. **AT-LIM16 does not apply to fixture 5.**

No Y clamp. **No `yUnclamped`.** Bound is the test AT-LIM26, not a runtime operation.

### 2.3 Crossings — intervals, no midpoint

Walk strikes **ascending**. Skip `net == 0`. A sign change between visited `prev` and `cur`:

```
{ lo: prev.strike, hi: cur.strike,
  netBefore: prev.net, netAfter: cur.net,
  steepness: |netAfter − netBefore| / strikeStep }

strikeStep := hi − lo     // the span actually walked
crossingCount = crossings.length
```

**No `(lo + hi) / 2` in any field or chrome.** A skipped zero between `lo` and `hi` does not mint a flip price.

Proximity (LIM16) does **not** move `x` or `y` (LIM17). Recorded on F7 so the haircut cannot sneak back in.

```
dist(c) = (c.lo ≤ spot ≤ c.hi) ? 0 : min(|spot − c.lo|, |spot − c.hi|)
d       = dist(nearest) / spot
crossingProximity = clamp((d − 0.5/100) / (1.5/100 − 0.5/100), 0, 1)
```

No `nearestCrossing` → `crossingProximity = 1`.

---

## 3. Scale-map proposal (OD-LIM4)

```json
{ "I:SPX": 50 }
```

**Only this key.** Every other symbol → `valid: false`. **No fallback to 50.**

50 points on SPX is one close-band radius at spot 5000 (1 %). `leanRaw` saturates when the window's centre of gravity sits at or beyond that radius. That is a readable “mass is not next to spot” on this underlier.

50 points does **not** transfer:

| Symbol | Why 50 is the wrong unit |
|--------|--------------------------|
| SPY (~500) | 50 pts ≈ 10 % of spot — X pegs ±100 on an ordinary session |
| NDX (~20 000) | 50 pts ≈ 0.25 % — X never leaves the middle |
| others | unmeasured |

Hotel does **not** invent `I:NDX`, `I:SPY`, or ETF keys on this sheet. Listing them as valid without a sitting would be a silent scale. Spec §12.4: the map is instrument-specific. LIM34: absent key is `valid: false`, not a borrowed 50.

A later sitting may add keys (and must version per Spec §16). Until then the map is one entry.

---

## 4. Dealer-sign caveat — assumed, not observed

Labs `gex_v1` signs call GEX positive and put GEX negative (`pricing.ts` `gexSide`: call `+Γ·OI·S²`, put `−Γ·OI·S²`). Positive `net` is therefore call-heavy, negative `net` put-heavy.

**That is an assumption about who holds the gamma, not an observation.** Open interest on a listed chain does not identify dealer inventory. A book that is long the puts retail is short would flip the put contribution. LIM cannot verify the sign from the chain, and this packet does not try.

Chrome (Appendix B line 1) already says it: `Dealer sign is assumed, not observed.` Every golden below rests on that convention. They are not evidence of dealer positioning.

---

## 5. Unmeasured sentence

**Whether the near-spot mix resists price movement is unmeasured.**

`nearSpotMix` is a convex blend of three **book** statistics (signed close mix, concentration inside 2 %, closeness inside 1 %). It is not a tape statistic. Nothing in these goldens, and nothing `lim.ts` is allowed to add, asserts that a high mix damps price or that a low mix releases it. *Friction / muddy / slippery / support / resistance* stay off the axis (E4 · AT-LIM23). Payload field is `nearSpotMix`. Tape sitting is §15.3, not this DAG.

---

## 6. X and Y stay independent (AT-LIM6)

X is the `|net|`-weighted centre of the window, in scale units. Y is the close-band **sign** mix plus two mass-location ratios. Sign never enters X. Distance-from-spot never enters `netF` except by deciding which strikes fall in the close band.

**Fixture 2 is the independence golden:** mass sits above spot **and** every `net` is negative → `x = 62 > 0` **and** `y = 40 < 50`.

Sign-flip of fixture 1 (all-positive, same `|net|` geometry) would keep `x = 10` and drop Y; that is the same claim. Fixture 2 is the one on the sheet.

---

## 7. Formula notes Kilo must not “fix”

1. **AT-LIM5 is not unconditional.** All-negative **and** all mass inside the close band, with floors 0/100, gives `netF = 0`, `concF = magF = 100`, **`y = 50`**, not `y < 50`. Concentrated close negative gamma is the middle of the plane, not the low pole. Fixture 2 puts leftover mass **outside** medium so `y = 40 < 50`. A test that only negates fixture 1 will fail AT-LIM5 as written.

2. **`y = 0` is not achievable** while close ⊂ medium. `netF = 0` needs a non-empty all-negative close band; `concF = magF = 0` needs an empty close band. Those cannot hold together. Empty book is `y = 50` (LIM8), not `0`. The low pole is an open bound. AT-LIM26 still holds (`0 ≤ y ≤ 100` with no clamp). Do not restore MSC floors to “reach” 0.

3. **`y = 100` is achievable** (fixture 1): all-positive close, all mass in close.

4. **Floors 0/100 are starting points, not findings** (OD-LIM8). Retune is config + §16 after a tape sitting — never a compute packet.

---

## 8. The eight fixtures

Every table: expected **`x`, `y`, `netRatio`, `concF`, `magF`, `crossingCount`**. Arithmetic shown so a reviewer can recompute. **No `yUnclamped`.**

---

### Fixture 1 — positive-gamma window

**Intent:** AT-LIM1 (mass above → `x > 0`), AT-LIM4 (all-positive near spot → `y > 50`). High pole of Y.

`spot = 5000`. All four strikes in close and medium. All `net > 0`.

| strike | call | put | net | \|K−S\| | band | \|net\|×(K−S) |
|-------:|-----:|----:|----:|--------:|------|---------------:|
| 4980 | 20 | 0 | +20 | 20 | close | 20 × (−20) = **−400** |
| 4990 | 10 | 0 | +10 | 10 | close | 10 × (−10) = **−100** |
| 5010 | 10 | 0 | +10 | 10 | close | 10 × (+10) = **+100** |
| 5020 | 40 | 0 | +40 | 20 | close | 40 × (+20) = **+800** |

**X**

```
totalAbs = 20+10+10+40 = 80
Σ |net|(K−S) = −400 − 100 + 100 + 800 = 400
centre       = 400 / 80 = 5
leanRaw      = 5 / 50 × 100 = 10
lean = x     = 10
xUnclamped   = 10
```

**Y**

```
gexClose    = 20+10+10+40 = 80
absGexClose = 80
netRatio    = 80/80 = 1
netF        = (1+1)/2 × 100 = 100
absGexMedium = 80
concF = 0 + (80/80)×100 = 100
magF  = 0 + (80/80)×100 = 100
nearSpotMix = 100×0.50 + 100×0.30 + 100×0.20 = 50+30+20 = 100
```

Walk: all `net > 0` → no sign change.

| field | golden |
|-------|--------|
| **x** | **10** |
| **y** | **100** |
| **netRatio** | **1** |
| **concF** | **100** |
| **magF** | **100** |
| **crossingCount** | **0** |
| xUnclamped | 10 |
| centrePts | 5 |
| crossingProximity | 1 (no nearest) |

Recombine check: `1` mapped through `netF` plus two 100s = 100 = `y`.

---

### Fixture 2 — negative-gamma window (mass still above spot)

**Intent:** AT-LIM5 (negative near spot → `y < 50` **on this geometry**), **AT-LIM6** (x > 0 **and** y < 50).

Same close geometry as a heavy topside book, every `net < 0`, plus mass outside medium so conc/mag are not 100.

| strike | call | put | net | \|K−S\| | band | \|net\|×(K−S) |
|-------:|-----:|----:|----:|--------:|------|---------------:|
| 4980 | 0 | −10 | −10 | 20 | close | 10 × (−20) = **−200** |
| 4990 | 0 | −10 | −10 | 10 | close | 10 × (−10) = **−100** |
| 5010 | 0 | −20 | −20 | 10 | close | 20 × (+10) = **+200** |
| 5020 | 0 | −40 | −40 | 20 | close | 40 × (+20) = **+800** |
| 5120 | 0 | −20 | −20 | 120 | outside medium | 20 × (+120) = **+2400** |

**X** (uses `|net|` — identical shape to an all-positive book with these magnitudes)

```
totalAbs = 10+10+20+40+20 = 100
Σ |net|(K−S) = −200 − 100 + 200 + 800 + 2400 = 3100
centre       = 3100 / 100 = 31
leanRaw      = 31 / 50 × 100 = 62
lean = x     = 62
xUnclamped   = 62
```

**Y**

```
gexClose    = −10 −10 −20 −40 = −80
absGexClose = 80
netRatio    = −80/80 = −1
netF        = (−1+1)/2 × 100 = 0
absGexMedium = 80          // 5120 is 120 > 100, out
concF = 0 + (80/100)×100 = 80
magF  = 0 + (80/100)×100 = 80
nearSpotMix = 0×0.50 + 80×0.30 + 80×0.20 = 24+16 = 40
```

| field | golden |
|-------|--------|
| **x** | **62** |
| **y** | **40** |
| **netRatio** | **−1** |
| **concF** | **80** |
| **magF** | **80** |
| **crossingCount** | **0** |
| xUnclamped | 62 |
| centrePts | 31 |

`x > 0` and `y < 50` together. Axes independent.

---

### Fixture 3 — symmetric about spot

**Intent:** AT-LIM3 (`x ≈ 0` regardless of gamma sign). All-positive so Y is not confused with empty.

| strike | call | put | net | \|K−S\| | band | \|net\|×(K−S) |
|-------:|-----:|----:|----:|--------:|------|---------------:|
| 4970 | 30 | 0 | +30 | 30 | close | 30 × (−30) = **−900** |
| 4980 | 20 | 0 | +20 | 20 | close | 20 × (−20) = **−400** |
| 5020 | 20 | 0 | +20 | 20 | close | 20 × (+20) = **+400** |
| 5030 | 30 | 0 | +30 | 30 | close | 30 × (+30) = **+900** |

```
totalAbs = 30+20+20+30 = 100
Σ |net|(K−S) = −900 − 400 + 400 + 900 = 0
centre = 0 / 100 = 0
leanRaw = 0 / 50 × 100 = 0
x = 0
```

```
gexClose = 100,  absGexClose = 100
netRatio = 1
netF = 100
concF = 100,  magF = 100
nearSpotMix = 100
```

| field | golden |
|-------|--------|
| **x** | **0** |
| **y** | **100** |
| **netRatio** | **1** |
| **concF** | **100** |
| **magF** | **100** |
| **crossingCount** | **0** |

**Sign-flip (not a ninth fixture):** negate every `net`. `centre` uses `|net|`, so **`x` stays 0**. Y becomes `netF=0`, `concF=magF=100` → **`y = 50`**. That is AT-LIM3: X does not care about gamma sign. It is also the concentrated-negative midpoint in §7.1.

---

### Fixture 4 — mass entirely outside the close band

**Intent:** empty close band (`absGexClose == 0` → `netRatio = 0`, `magF = 0`). Mass split across medium and far, **both sides**, so this does not collapse into fixture 8 (`|centre|` would exceed 50 if all far mass sat on one side).

| strike | call | put | net | \|K−S\| | band | \|net\|×(K−S) |
|-------:|-----:|----:|----:|--------:|------|---------------:|
| 4800 | 25 | 0 | +25 | 200 | outside medium | 25 × (−200) = **−5000** |
| 4920 | 25 | 0 | +25 | 80 | medium only | 25 × (−80) = **−2000** |
| 5080 | 25 | 0 | +25 | 80 | medium only | 25 × (+80) = **+2000** |
| 5200 | 25 | 0 | +25 | 200 | outside medium | 25 × (+200) = **+5000** |

```
totalAbs = 100
Σ |net|(K−S) = 0
centre = 0
x = 0
```

```
gexClose = 0,  absGexClose = 0
netRatio = 0          // the absGexClose==0 rule, not 0/0
netF     = (0+1)/2 × 100 = 50
absGexMedium = 25+25 = 50     // 4920 and 5080 only
concF = 0 + (50/100)×100 = 50
magF  = 0 + (0/100)×100  = 0
nearSpotMix = 50×0.50 + 50×0.30 + 0×0.20 = 25+15 = 40
```

| field | golden |
|-------|--------|
| **x** | **0** |
| **y** | **40** |
| **netRatio** | **0** |
| **concF** | **50** |
| **magF** | **0** |
| **crossingCount** | **0** |

`x = 0` here is symmetry. `y = 40` is the blend (empty close, half the mass in medium). **Not** the LIM8 empty-book `y = 50`. Distinguish fixture 4 from fixture 5.

---

### Fixture 5 — `Σ|net| == 0` → `x = 0`, `y = 50`

**Intent:** LIM7 · LIM8 · AT-LIM9. Both an empty window and a listed all-zero book.

**5a — empty `StrikeNet[]`**

(no rows)

**5b — listed zeros**

| strike | call | put | net |
|-------:|-----:|----:|----:|
| 4980 | 0 | 0 | 0 |
| 5000 | 0 | 0 | 0 |
| 5020 | 0 | 0 | 0 |

```
totalAbs = 0
→ do not evaluate centre, concF, or magF as a ratio
LIM7: x = 0
LIM8: y = 50
netRatio = 0          // absGexClose == 0
concF    = 0          // no mass; not 0/0
magF     = 0
crossingCount = 0     // walk visits nothing
crossingProximity = 1 // no nearestCrossing
```

| field | golden |
|-------|--------|
| **x** | **0** |
| **y** | **50** |
| **netRatio** | **0** |
| **concF** | **0** |
| **magF** | **0** |
| **crossingCount** | **0** |

**`y` is the LIM8 constant, not the blend.** `0×0.50 + 0×0.30 + 0×0.20 = 0` is **wrong**. MSC drew a confident marker at bottom-centre; LIM26 sits dead centre. AT-LIM16 recombination is **waived on this fixture only**.

`valid` remains **true** on `I:SPX` (the scale exists). Missing-symbol `valid: false` is AT-LIM19, not this golden.

---

### Fixture 6 — three crossings

**Intent:** AT-LIM11 · AT-LIM12 (steepness differs) · AT-LIM2 (`x < 0`, mass below). Spot is **not** inside any interval (that is fixture 7). Same sign through spot (`4980` and `5020` both negative).

| strike | call | put | net | \|K−S\| | band | \|net\|×(K−S) |
|-------:|-----:|----:|----:|--------:|------|---------------:|
| 4920 | 10 | 0 | **+10** | 80 | medium | 10 × (−80) = **−800** |
| 4940 | 0 | −10 | **−10** | 60 | medium | 10 × (−60) = **−600** |
| 4960 | 40 | 0 | **+40** | 40 | close | 40 × (−40) = **−1600** |
| 4980 | 0 | −20 | **−20** | 20 | close | 20 × (−20) = **−400** |
| 5020 | 0 | −20 | **−20** | 20 | close | 20 × (+20) = **+400** |

Walk ascending, no zeros to skip: `+10, −10, +40, −20, −20`.

**Crossings (intervals only):**

| # | lo | hi | netBefore | netAfter | strikeStep = hi−lo | steepness = \|Δnet\| / step |
|---|---:|---:|----------:|---------:|-------------------:|----------------------------:|
| 1 | 4920 | 4940 | +10 | −10 | 20 | \|−10 − 10\| / 20 = **1** |
| 2 | 4940 | 4960 | −10 | +40 | 20 | \|40 − (−10)\| / 20 = **2.5** |
| 3 | 4960 | 4980 | +40 | −20 | 20 | \|−20 − 40\| / 20 = **3** |

`4980 → 5020` both negative → **not** a crossing.

**Do not publish 4930, 4950, or 4970.** Those are midpoints. Chrome prints **no** single crossing price when `crossingCount ≠ 1` (AT-LIM18).

**X**

```
totalAbs = 10+10+40+20+20 = 100
Σ |net|(K−S) = −800 − 600 − 1600 − 400 + 400 = −3000
centre       = −3000 / 100 = −30
leanRaw      = −30 / 50 × 100 = −60
x = −60
```

**Y**

```
gexClose    = 40 + (−20) + (−20) = 0     // 4960, 4980, 5020
absGexClose = 40+20+20 = 80
netRatio    = 0/80 = 0
netF        = 50
absGexMedium = 100                        // all five |K−S| ≤ 100
concF = 100
magF  = 80
nearSpotMix = 50×0.50 + 100×0.30 + 80×0.20 = 25+30+16 = 71
```

| field | golden |
|-------|--------|
| **x** | **−60** |
| **y** | **71** |
| **netRatio** | **0** |
| **concF** | **100** |
| **magF** | **80** |
| **crossingCount** | **3** |
| crossings | the three rows above |
| nearestCrossing | `{ lo: 4960, hi: 4980 }` (dist 20 pts) |
| distanceToCrossing | 20 |
| spotBelowNearestCrossing | **false** (`spot < lo` → `5000 < 4960` is false; also above `hi`) **(E17)** |
| crossingProximity | **0** under **E15** |

**E15 proximity (record both forms):**

```
dist = 20
d_v042    = 20/5000 = 0.004          // fraction — DEAD channel, always < 0.5 floor
dPct      = 20/5000 × 100 = 0.40 %   // E15
crossingProximity = clamp((0.40 − 0.5) / (1.5 − 0.5), 0, 1) = clamp(−0.10, 0, 1) = 0
```

Still **0**, but because **0.40 % is below the 0.5 % floor**, not because a fraction was compared to a percent. Hotel's v0.4.2 worksheet already said "0.004 < 0.5 % floor" — the right comparison in words, the wrong formula in the spec. AT-LIM29 needs a **ninth** fixture whose `dPct` sits **between** 0.5 and 1.5 (fixture 9).

**E16 steepness:** denominator is `(hi − lo)`. Here each interval is 20 pts and listed-step is also 20 (no skipped zero). Same number; the skipped-zero case is fixture 7 / AT-LIM30.

Steepness 1 vs 2.5 vs 3 at different locations: a cliff and a smear must not report identically (AT-LIM12). Same `lo,hi` with a doubled `|Δnet|` would also differ; this sheet uses three different `|Δnet|` on a common 20-pt step.

---

### Fixture 7 — spot inside a crossing

**Intent:** AT-LIM7. `crossingProximity = 0`. **`x` and `y` unchanged** by that 0. Zero-net ATM is skipped (no fabricated flip at 5000).

| strike | call | put | net | \|K−S\| | band | \|net\|×(K−S) |
|-------:|-----:|----:|----:|--------:|------|---------------:|
| 4970 | 30 | 0 | **+30** | 30 | close | 30 × (−30) = **−900** |
| 4990 | 10 | 0 | **+10** | 10 | close | 10 × (−10) = **−100** |
| 5000 | 0 | 0 | **0** | 0 | close | skip |
| 5010 | 0 | −10 | **−10** | 10 | close | 10 × (+10) = **+100** |
| 5030 | 0 | −30 | **−30** | 30 | close | 30 × (+30) = **+900** |

Walk (skip 5000): `+30, +10, −10, −30`. One sign change: `4990 → 5010`.

```
crossing = { lo: 4990, hi: 5010, netBefore: +10, netAfter: −10,
             steepness: |−10 − 10| / (5010 − 4990) = 20/20 = 1 }   // E16: (hi−lo), not ctx.strikeStep
```

ATM `net==0` at 5000 was **skipped**. If `ctx.strikeStep` were 10, using it would report steepness 2 and **fail AT-LIM30**. The interval width is 20.

**Not** `{ lo: 4990, hi: 5000 }` or `{ lo: 5000, hi: 5010 }`. **Not** price `5000`. Spot sitting inside `[4990, 5010]` does not mint a contract at 5000.

**X**

```
totalAbs = 30+10+10+30 = 80     // the zero does not count
Σ |net|(K−S) = −900 − 100 + 100 + 900 = 0
centre = 0
x = 0
xUnclamped = 0
```

**Y**

```
gexClose = 30+10−10−30 = 0
absGexClose = 80
netRatio = 0
netF = 50
concF = 100,  magF = 100
nearSpotMix = 50×0.50 + 100×0.30 + 100×0.20 = 25+30+20 = 75
```

**Proximity** (does not feed X or Y) **(E15)**

```
dist = 0     // 4990 ≤ 5000 ≤ 5010
dPct = 0 / 5000 × 100 = 0
crossingProximity = clamp((0 − 0.5) / (1.5 − 0.5), 0, 1) = 0
```

**AT-LIM31:** `spotBelowNearestCrossing = (5000 < 4990) = false`. Inside is not below. `distanceToCrossing = 0`.

MSC D15 would have subtracted from both scores near a flip. **Do not.** `x` stays 0, `y` stays 75, opacity stays full (render: AT-LIM21).

| field | golden |
|-------|--------|
| **x** | **0** |
| **y** | **75** |
| **netRatio** | **0** |
| **concF** | **100** |
| **magF** | **100** |
| **crossingCount** | **1** |
| crossings[0] | `{ lo: 4990, hi: 5010, netBefore: 10, netAfter: −10, steepness: 1 }` |
| crossingProximity | **0** |
| distanceToCrossing | **0** |
| spotBelowNearestCrossing | **false** (`spot < lo` → `5000 < 4990`) **(E17 · AT-LIM31)** |
| x after proximity | **0** (unchanged) |
| y after proximity | **75** (unchanged) |

---

### Fixture 8 — `leanRaw > 100`

**Intent:** AT-LIM13. Live X clamp. `xUnclamped ≠ x`. Trail (LIM2) plots `xUnclamped`.

All mass above spot, outside the close band. Inclusive: 5100 is **on** the medium edge (`|K−S| = 100`).

| strike | call | put | net | \|K−S\| | band | \|net\|×(K−S) |
|-------:|-----:|----:|----:|--------:|------|---------------:|
| 5100 | 50 | 0 | +50 | 100 | medium (edge) | 50 × 100 = **5000** |
| 5200 | 50 | 0 | +50 | 200 | outside medium | 50 × 200 = **10000** |

```
totalAbs = 100
Σ |net|(K−S) = 15000
centre       = 15000 / 100 = 150
leanRaw      = 150 / 50 × 100 = 300
lean = x     = clamp(300, −100, +100) = 100
xUnclamped   = 300
```

```
gexClose = 0,  absGexClose = 0
netRatio = 0
netF     = 50
absGexMedium = 50
concF = 50
magF  = 0
nearSpotMix = 50×0.50 + 50×0.30 + 0 = 25+15 = 40
```

| field | golden |
|-------|--------|
| **x** | **100** |
| **y** | **40** |
| **netRatio** | **0** |
| **concF** | **50** |
| **magF** | **0** |
| **crossingCount** | **0** |
| **xUnclamped** | **300** |
| centrePts | 150 |

`xUnclamped ≠ x`. Y is 40 by the blend, not because X saturated. No `yUnclamped`.

---

### Fixture 9 — interior proximity (AT-LIM29)

**Intent:** `0 < crossingProximity < 1`. Floor 0.5 %, ceil 1.5 % of spot. 50 pts on spot 5000 = **1.0 %**, midpoint of the map.

Nearest crossing entirely **above** spot so dist = 50, not inside.

| strike | call | put | net | \|K−S\| | band | \|net\|×(K−S) |
|-------:|-----:|----:|----:|--------:|------|---------------:|
| 4900 | 10 | 0 | **+10** | 100 | medium (edge) | 10 × (−100) = **−1000** |
| 5000 | 10 | 0 | **+10** | 0 | close | 0 |
| 5050 | 10 | 0 | **+10** | 50 | close (edge) | 10 × 50 = **+500** |
| 5060 | 0 | −10 | **−10** | 60 | medium | 10 × 60 = **+600** |

Walk: `+10, +10, +10, −10`. One crossing: `{ lo: 5050, hi: 5060 }`.

```
dist = min(|5000−5050|, |5000−5060|) = 50
dPct = 50/5000 × 100 = 1.0 %
crossingProximity = clamp((1.0 − 0.5) / (1.5 − 0.5), 0, 1) = 0.50
steepness = |−10 − 10| / (5060 − 5050) = 20/10 = 2     // E16
spotBelowNearestCrossing = (5000 < 5050) = true
```

If this were still v0.4.2: `d = 50/5000 = 0.01`, `(0.01 − 0.5)/1.0` clamps to **0**. AT-LIM7 and AT-LIM8 would both pass. **Only 0.50 tests the map.**

**X / Y** (for the sheet; AT-LIM29 cares about proximity)

```
totalAbs = 40
Σ |net|(K−S) = −1000 + 500 + 600 = 100
centre = 2.5
leanRaw = 2.5/50 × 100 = 5
x = 5
gexClose = 10+10 = 20 (5000, 5050; 5060 is 60 pts → not close)
absGexClose = 20
netRatio = 1
netF = 100
concF = 100
magF = 50
nearSpotMix = 50+30+10 = 90
```

| field | golden |
|-------|--------|
| **x** | **5** |
| **y** | **90** |
| **netRatio** | **1** |
| **concF** | **100** |
| **magF** | **50** |
| **crossingCount** | **1** |
| crossings[0] | `{ lo: 5050, hi: 5060, netBefore: +10, netAfter: −10, steepness: 2 }` |
| distanceToCrossing | **50** |
| **crossingProximity** | **0.50** |
| spotBelowNearestCrossing | **true** |

---

## 9. Expected-value index (Kilo / LIM1-1)

| # | Fixture | x | y | netRatio | concF | magF | crossingCount | also |
|---|---------|--:|--:|---------:|------:|-----:|--------------:|------|
| 1 | positive-gamma | 10 | 100 | 1 | 100 | 100 | 0 | AT-LIM1, AT-LIM4 |
| 2 | negative-gamma, mass above | 62 | 40 | −1 | 80 | 80 | 0 | AT-LIM5, **AT-LIM6**; magF=80 |
| 3 | symmetric | 0 | 100 | 1 | 100 | 100 | 0 | AT-LIM3 |
| 4 | mass outside close | 0 | 40 | 0 | 50 | 0 | 0 | magF=0; **AT-LIM32** with F2 (same y=40) |
| 5 | `Σ\|net\|==0` | 0 | **50** | 0 | 0 | 0 | 0 | LIM8 overrides blend |
| 6 | three crossings | −60 | 71 | 0 | 100 | 80 | **3** | E15: dPct=0.40% → proximity **0**; steepness 1, 2.5, 3 |
| 7 | spot inside crossing | 0 | 75 | 0 | 100 | 100 | 1 | proximity 0; AT-LIM31 false+dist 0; E16 steepness 1 on (hi−lo)=20 |
| 8 | `leanRaw > 100` | 100 | 40 | 0 | 50 | 0 | 0 | xUnclamped=300 |
| **9** | **interior proximity** | **5** | **90** | **1** | **100** | **50** | **1** | **AT-LIM29: proximity 0.50** |

AT-LIM16 recombination (fixtures 1–4, 6–8):

```
nearSpotMix ≟ netF×0.50 + concF×0.30 + magF×0.20
```

with `netF = (netRatio+1)/2×100`. Fixture 5 excluded.

Missing scale (`I:NDX` etc.) is **not** one of the eight; it is AT-LIM19 against the map in §3.

---

## 10. What this sheet does not do

- Does not stamp `agents/go/OLLIM-W0.md`.
- Does not write `web/` or `server/` code.
- Does not sit the mix against a price tape.
- Does not name walls, magnets, pins, gravity, intent, hostility, support, resistance, friction, muddy, or slippery as properties of these numbers.
- Does not fuse Strike Turnover.
- Does not port MSC `gamma × OI × 100`. GEX numbers in production come from existing `gex_v1` / `buildGexProfile(..., "gex_net")` (LIM1-2). These goldens are the LIM layer on already-formed `net`.
