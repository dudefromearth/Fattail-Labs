# ALGO-B — Appendix B goldens (hand)

**Agent:** Hotel  
**Packet:** ALGO-B re-fire  
**Spec:** AZ-ALGO **v2.2.1**  
**sha1:** `6f491ee8f240aa06418b8e813fdb3152ed60deb5` (frozen; recomputed after `git pull` of `396571a`)  
**Date:** 2026-09-02  
**Verdict:** **APPROVED** — sixteen rows constructed; E1 holds (fixture 2 PaR > fixture 3 PaR).  
**Constraint:** handwritten before `algoProfitAtRisk.ts` / `algoMoveUnit.ts` / `algoGexNorm.ts`. No module output.

**Sign convention (Hotel input, from §9.4 “taken in the ADVERSE direction”):**  
`m_adv` is the **signed** adverse displacement. Magnitude = `move_unit`. Sign = the direction in which open profit on the working fly **decreases**. `m_adv²` is therefore always `move_unit²`.

**Shared fly for fixtures 2 and 3 (E1 pair):** listed long call butterfly **5950 / 6000 / 6050**, +1/−2/+1, package dollars.

Defaults used unless a row names otherwise: `k_base = 1.5`, `gamma_factor = 1.0`, `proximity_factor = 1.0`, `k = 1.5`, `entryPct = 0.75`.

---

## Fixture 1 — dimensional proof (AT-ALGO-6d)

Call fly 5950/6000/6050. Spot **5970 pt** (below body). Ordinary Δ/Γ.

| Quantity | Value | Unit |
|----------|------:|------|
| Δ | 12 | $/pt |
| Γ | 0.80 | $/pt² |
| move_unit | 10 | pt |
| m_adv | −10 | pt |
| H | 750 | $ |
| k_base | 1.5 | — |
| gamma_factor | 1.0 | — |
| proximity_factor | 1.0 | — |
| k | 1.5 | — |

Arithmetic:

```
m_adv²                         = (−10 pt)×(−10 pt) = 100 pt²

Δ · m_adv                      = (12 $/pt) × (−10 pt) = −120 $

½ · Γ · m_adv²                 = ½ × (0.80 $/pt²) × (100 pt²)
                               = 0.40 × 100
                               = 40 $

pnl_change_adv                 = −120 $ + 40 $ = −80 $

profit_at_risk                 = max(0, −(−80 $)) = 80 $

k × PaR                        = 1.5 × 80 $ = 120 $

trail_level                    = 750 $ − 120 $ = 630 $
```

Checks: PaR = 80 $ ≥ 0. trail_level 630 $ < H 750 $. Units: Δ $/pt, Γ $/pt², move_unit pt, PaR $, trail_level $.

---

## Fixture 2 — apex (E1, AT-ALGO-6b)

**Same fly as 3.** Spot **6000 pt** = body. Δ ≈ 0, Γ strongly negative. Both directions adverse; |m_adv| = move_unit.

| Quantity | Value | Unit |
|----------|------:|------|
| Δ | 0 | $/pt |
| Γ | −4 | $/pt² |
| move_unit | 8 | pt |
| m_adv | ±8 | pt |
| H | 1000 | $ |
| k | 1.5 | — |

```
m_adv²                         = 64 pt²
Δ · m_adv                      = 0
½ · Γ · m_adv²                 = ½ × (−4 $/pt²) × 64 pt² = −128 $
pnl_change_adv                 = −128 $
PaR                            = max(0, 128 $) = 128 $
k × PaR                        = 1.5 × 128 $ = 192 $
trail_level                    = 1000 $ − 192 $ = 808 $
```

Checks: PaR 128 $ > 0. trail_level 808 $ < H 1000 $.

---

## Fixture 3 — wing (E1 partner)

**Same fly as 2.** Spot **5960 pt** (below body). Γ positive. Adverse = down.

| Quantity | Value | Unit |
|----------|------:|------|
| Δ | 15 | $/pt |
| Γ | 1.50 | $/pt² |
| move_unit | 8 | pt |
| m_adv | −8 | pt |
| H | 1000 | $ |
| k | 1.5 | — |

```
m_adv²                         = 64 pt²
Δ · m_adv                      = (15 $/pt) × (−8 pt) = −120 $
½ · Γ · m_adv²                 = ½ × (1.50 $/pt²) × 64 pt² = 48 $
pnl_change_adv                 = −120 $ + 48 $ = −72 $
PaR                            = 72 $
k × PaR                        = 1.5 × 72 $ = 108 $
trail_level                    = 1000 $ − 108 $ = 892 $
```

**E1:** PaR₂ **128 $** > PaR₃ **72 $**. Same strikes. Stop not required.

---

## Fixture 4 — put fly mirrored

Put fly 5950/6000/6050. Spot **6030 pt** (above body). Adverse = up.

| Quantity | Value | Unit |
|----------|------:|------|
| Δ | −12 | $/pt |
| Γ | 0.80 | $/pt² |
| move_unit | 10 | pt |
| m_adv | +10 | pt |
| H | 750 | $ |
| k | 1.5 | — |

```
Δ · m_adv                      = (−12) × (+10) = −120 $
½ · Γ · m_adv²                 = ½ × 0.80 × 100 = 40 $
pnl_change_adv                 = −80 $
PaR                            = 80 $
trail_level                    = 750 − 1.5×80 = 630 $
```

Mirror of fixture 1: same PaR, same trail_level, adverse sign inverted.

---

## Fixture 5 — strongly positive dealer gamma (k near 2.34)

| Input | Value |
|-------|------:|
| gamma_factor | 1.3 |
| proximity_factor | 1.2 |
| k_base | 1.5 |

```
k_raw = 1.5 × 1.3 × 1.2
      = 1.95 × 1.2
      = 2.34
k     = clamp(2.34, 1.0, 2.5) = 2.34
```

PaR 80 $ (from fixture 1 book). H 750 $.

```
k × PaR     = 2.34 × 80 = 187.2 $
trail_level = 750 − 187.2 = 562.8 $
```

2.34 is the documented achievable max. Upper clamp 2.5 **not exercised** (E2).

---

## Fixture 6 — strongly negative GEX, thin path (k → clamp 1.0)

| Input | Value |
|-------|------:|
| gamma_factor | 0.7 |
| proximity_factor | 0.8 |

```
k_raw = 1.5 × 0.7 × 0.8
      = 1.05 × 0.8
      = 0.84
k     = clamp(0.84, 1.0, 2.5) = 1.0
```

PaR 80 $. H 750 $. trail_level = 750 − 80 = **670 $**.

---

## Fixture 7 — interior k (AT-ALGO-6c)

| Input | Value |
|-------|------:|
| gamma_factor | 1.0 |
| proximity_factor | 1.2 |

```
k = 1.5 × 1.0 × 1.2 = 1.8
```

1.0 < 1.8 < 2.5 and 1.8 ≠ 1.5.

PaR 80 $. H 750 $. trail_level = 750 − 144 = **606 $**.

---

## Fixture 8 — GEX unavailable (E5 / AT-ALGO-24)

GEX not on the pane. `n_gex = 0`.

| Output | Value |
|--------|-------|
| gamma_factor | **1.0** |
| proximity_factor | 1.0 (still applies) |
| k | 1.5 |
| proposed line | **paints** |
| chrome / tape | `gex: unavailable · k unmodulated` |
| silent fallback to legacy | **no** |

PaR 80 $. H 750 $. trail_level **630 $**.

---

## Fixture 9 — Δ/Γ unmeasured (AT-ALGO-10 / 6e family)

| Output | Value |
|--------|-------|
| Δ, Γ | unmeasured |
| proposed line | **WAITING, not painted** |
| legacy line | **paints** |
| invented greeks | **no** |

---

## Fixture 10 — Batman, working side resolved (E4 / AT-ALGO-5b)

| Leg | body | D (risk_taken) | U |
|-----|-----:|---------------:|--:|
| call fly | 6100 | 500 $ | 600 $ |
| put fly | 5900 | 500 $ | 40 $ |

Spot **6120**. |6120−6100|=20 < |6120−5900|=220 → `working_side = call`.

```
gate = 0.75 × 500 $ = 375 $
U_call = 600 $ ≥ 375 $  →  Managing on the call fly
```

Pair total debit 1000 $ is the **loss bound**, not the gate denominator.

---

## Fixture 11 — Batman, ambiguous (AT-ALGO-5c)

Call body 6100, put body 5900, spot **6000**. Distances equal (100 pt).  
U_call = U_put = **200 $**.

| Output | Value |
|--------|-------|
| working_side | **ambiguous** |
| gate | **does not evaluate** |
| proposed / legacy guide either side | **none** |
| named | `working_side: ambiguous` |

---

## Fixture 12 — E(t) null (E6 / AT-ALGO-25)

| Input | Value |
|-------|------:|
| E(t) | null |
| remaining_at_arm | 5 h |
| remaining_now | 2 h |
| g0 | 0.75 |
| gMin | 0.25 |
| H | 1000 $ |

```
clock = 1 − 2/5 = 0.6
g     = 0.75 + (0.25 − 0.75)×0.6 = 0.75 − 0.30 = 0.45
S     = (1 − 0.45) × 1000 $ = 550 $
```

Chrome: **`floor: legacy (clock-only)`**.

---

## Fixture 13 — move_unit, 6 bars (E11 / AT-ALGO-6e)

| Input | Value |
|-------|------:|
| bars in window | 6 |
| MOVE_MIN_SAMPLES | 10 |

6 < 10 → `move_unit` **unmeasured**.

| Output | Value |
|--------|-------|
| proposed line | **WAITING, not painted** |
| legacy line | **paints** |
| substituted default / prior window / IV | **no** |

---

## Fixture 14 — GEX history 12 samples (E5 / E22)

| Input | Value |
|-------|------:|
| n_gex | 12 |
| GEX_NORM_MIN_SAMPLES | 30 |

12 < 30.

| Output | Value |
|--------|-------|
| gamma_factor | **1.0** |
| k | 1.5 (prox 1.0) |
| proposed line | **paints** |
| chrome | `gex: warming (12/30 samples)` — **persists** while the state holds |

---

## Fixture 15 — Batman side switch (E19 / AT-ALGO-30)

| t | working_side | U | H |
|---|--------------|--:|--:|
| t0 | call | 800 $ | 800 $ |
| t1 | put | 220 $ | **resets to 220 $** |

```
h_prior_side = 800 $
H(t1)        = 220 $
```

Named tape event. Guide recomputes from the put fly only.

---

## Fixture 16 — override while still beyond the guide (E20 / AT-ALGO-29)

| Input | Value |
|-------|------:|
| trail_level | 630 $ |
| U | 500 $  (still beyond the guide) |
| overridden | true |
| reentry_count | 0 |
| REENTRY_BARS | 3 |

| Output | Value |
|--------|-------|
| Fold suggested re-fire | **no** |
| HUD | `guide: overridden` |
| silent mute | **no** |

Suppression holds until U (or spot vs `x_S`) is back on the hold side for 3 consecutive evaluations.

---

## Set checks

| Check | Result |
|-------|--------|
| PaR ≥ 0 on every numeric PaR row | 80, 128, 72, 80, 80, 80, 80 all ≥ 0 |
| trail_level < H on every numeric trail row | 630<750, 808<1000, 892<1000, 630<750, 562.8<750, 670<750, 606<750 |
| E1 fixture 2 > fixture 3 | **128 > 72** |
| k fixture 5 at achievable max | 2.34 |
| k fixture 6 clamped | 0.84 → 1.0 |
| k fixture 7 interior ≠ k_base | 1.8 |
| No FINDING that stopped the set | none |

**OD-ALGO-1** remains open (Coach). Not a fixture defect.
