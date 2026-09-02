# FatTail Labs — Heatmap LIM Template — Specification v0.4.1

**Status:** DRAFT for build planning. Errata pass on v0.4; geometry unchanged.
**Date:** 2026-09-01
**Repo:** Fattail-Labs · **Scope:** one Options Lab Heatmap template, client-side only.
**Sibling:** `FatTail-Labs-Heatmap-Strike-Turnover-Spec-v1_0.md` — independent, never fused.

**v0.4.1 errata** (E1–E7, all from review; no geometry changed)

- **E1** `leanRaw` defined before the clamp; `xUnclamped = leanRaw` (LIM7). Without it AT-LIM13
  passes while testing nothing.
- **E2** `confidence` → **`crossingProximity`**. What is computed is distance to a crossing
  interval, not a judgement about the model.
- **E3** Opacity is **not** the shelf-life channel. Full-opacity dot, ring plus numeric chip
  (LIM24).
- **E4** Y payload field renamed `friction` → **`nearSpotMix`**. *Friction / muddy / slippery* stay
  off the axis until tape-tested (§15.3).
- **E5** §1 restated: the question is asked in the book's terms, and the differentiator is
  **publishing the factors** rather than substituting a second metaphor for the vendors' first one.
- **E6** OI as-of and the same-day-expiry sentence added to chrome (LIM27).
- **E7** Registry display label carries neither *intent* nor *friction* (LIM35).
- Consequence: **the quadrant ships with labelled axes and no cell names** (LIM36).

**Source contract (retired, reference only):** `Liquidity-Intent-Map-Spec-v1.0.md`, MSC as-built.
**Labs law:** `Options-Lab-Heatmap-Templates-Spec-v0_3` · `Architecture/29-options-lab-heatmap-templates.md`
**Invariants:** 2 · 4 · 5 · 6 · 10.

---

## 0. Why Dealer Gravity is not in this spec

MSC's DG was an **underlier volume-by-price** profile from SPY bars (`spx = spy × 10`); its own §17
lists *"use SPX options OI or the chain"* as a non-goal. It cannot come to a strike axis: the chain
holds no underlier prints, SPX has no volume because an index cannot be traded, and a proxy's
prices are not the chain's prices.

The redesigned option-volume reading lives in its own spec (Strike Turnover v1.0).

**LIM uses `gamma`, `open_interest` and `spot`. It reads no volume at all**, so the P-SV10–17
investigation does not touch it.

---

## 1. Purpose

> **Where is this expiration's GEX mass relative to spot, and what is the near-spot mix of sign,
> concentration and closeness?**

A GEX profile tells you **where** a concentration sits and nothing about what it is like. Vendors
fill that gap by assertion — *wall*, *magnet*, *pin*. **LIM's answer is to publish the factors, not
to substitute a second metaphor.** `netRatio`, `concF` and `magF` are measurements; their blend is
a model, and it is labelled as one.

**LIM1 — LIM forecasts nothing, and asserts no relationship between the book and the tape.**
Whether a positive, concentrated, near-spot book resists price movement is **unmeasured**. Nothing
in this spec claims it, and the chrome says so (LIM27).

---

## 2. What already exists — do not rebuild

| Requirement | Already in Labs |
|---|---|
| Per-strike GEX | `templates/gex.ts` → `buildGexProfile(ctx, mode)` |
| GEX math, frozen | `pricing.ts` → `gexSide` / `gexNet` / `gexAbs`, `Γ·OI·S²` (Heatmap Spec v0_2 §5.5) |
| Spot, strike step, wings, contracts | `ChainContext` in `templates/types.ts` |
| Spot marker on the profile | `GexProfilePoint.isSpot`; `flySpotCenter` in `pricing.ts` |
| Template registry | `templates/registry.ts` |
| Non-grid layout precedent | the `ladder` entry stubs the grid functions |

No server module, no endpoint, no Redis, no `server/config.py`, no §8 allowlist file. **DL-539 does
not gate this.**

---

## 3. Registration

```ts
{
  id: "lim",                                   // code identifier, not member-facing
  label: "GEX lean (window)",                  // E7 — placeholder, Echo owns (§15.2)
  layout: "quadrant",
  valueModes: [{ id: "lim", label: "Lean / near-spot mix" }],
  defaultValueMode: "lim",
  resolveColumns: () => [],
  resolveRows: () => [],
  computeCell: () => ({ display: null, value: null, valid: false }),
  assignColors: () => ({ stickyScale: 1 }),
}
```

`TemplateLayout` gains `"quadrant"`. `ValueModeId` gains `"lim"`.

**LIM35 — the picker label carries neither *intent* nor *friction*.** Both are contested (§15.2–3)
and the template strip will show whatever ships before Echo finishes.

---

## 4. Input

**LIM2.** `StrikeNet[] = { strike, call, put, net }` from `buildGexProfile(ctx, "gex_net")`, plus
`ctx.spot`.

**LIM3.** GEX is `Γ·OI·S²` via `pricing.ts`. MSC's `gamma × OI × 100` is not ported.

**LIM4.** One expiration. LIM never aggregates across expirations.

**LIM5.** The ladder is a wings window. LIM is a **window** read; no output is labelled chain GEX
(GP7).

**LIM6.** LIM reads no volume. Inputs are gamma, open interest and spot.

---

## 5. Axes

### 5.1 X — lean, `[−100, +100]`

**LIM7.** Empty map or `Σ|net| == 0` → `0`.

```
centre     = Σ |net| × (strike − spot) / Σ |net|          // signed, index points
leanRaw    = centre / LIM_CENTRE_SCALE_PTS[symbol] × 100  // E1 — unclamped
lean       = clamp(leanRaw, −100, +100)
xUnclamped = leanRaw                                      // E1
```

Positive = the weight of the book sits above spot. **No strike is named** — a lean is a direction
without a level, which is why it does not stale the way a level does.

> **D12.** MSC's bias was `imbalance × 0.6 + centre × 0.4`. Imbalance is symmetric by mechanism —
> positive gamma damps rallies and dips alike — so it describes the near-spot mix, not direction,
> and it was already half the Y axis through `netRatio`. The two axes shared their largest input.
> X is the lean alone. **Do not fold imbalance back into Y; publish the factors instead (LIM10).**

### 5.2 Y — near-spot mix, `[0, 100]`

**LIM8.** Empty map or `Σ|net| == 0` → **`50`**.

**LIM9.** Bands are percent of spot: `close = LIM_BAND_CLOSE_PCT`, `medium = LIM_BAND_MEDIUM_PCT`.

```
netRatio     = gexClose / absGexClose                                  // 0 if absGexClose == 0
netF         = (netRatio + 1) / 2 × 100
concF        = LIM_CONC_FLOOR + (absGexMedium / totalAbs) × LIM_CONC_SPAN
magF         = LIM_MAG_FLOOR  + (absGexClose  / totalAbs) × LIM_MAG_SPAN

nearSpotMix  = clamp(netF × LIM_W_NET + concF × LIM_W_CONC + magF × LIM_W_MAG, 0, 100)
yUnclamped   = netF × LIM_W_NET + concF × LIM_W_CONC + magF × LIM_W_MAG
```

**LIM10 — publish `netRatio`, `concF` and `magF` as first-class fields, not only the blend.** The
factors are measurements; the blend is a model, and `netF` carries half of it. A reader must be
able to see that and recombine differently.

**LIM11 — the axis poles are stated in the book's terms, not the tape's.**

| Pole | Means |
|---|---|
| High (100) | net GEX positive near spot, mass concentrated, mass close |
| Low (0) | net GEX negative or thin near spot, mass dispersed, mass far |

**No physical claim is printed on this axis.** *Friction*, *muddy* and *slippery* describe an
interaction with price that Labs has not measured; they are held as candidate display skins pending
a tape sitting (§15.3), and the payload field is `nearSpotMix` regardless (E4).

---

## 6. Crossings and crossing proximity

### 6.1 Crossings are intervals

**LIM12.** Walk strikes ascending, skipping `net == 0`. A sign change between `prev` and `cur` is
recorded as the **interval** `{ lo: prev, hi: cur }`.

> **D16.** MSC reported `(prev + cur) / 2` — a fabricated price at which no contract exists, marked
> on a strike axis and emphasised as *the* flip, while the same model published a crossing count.
> Intervals only.

**LIM13.** Publish `crossings[]`, each `{ lo, hi, netBefore, netAfter, steepness }` where
`steepness = |netAfter − netBefore| / strikeStep`. The walk visits both strikes already; a cliff
and a smear must not report identically.

**LIM14.** `crossingCount = crossings.length`. **Chrome never prints a single crossing price when
`crossingCount ≠ 1`** (AT-LIM18).

**LIM15.** `nearestCrossing` minimises distance to spot:

```
dist(c) = (c.lo <= spot && spot <= c.hi) ? 0 : min(|spot − c.lo|, |spot − c.hi|)
```

### 6.2 Crossing proximity — a distance, not a verdict

**LIM16.** Proximity to a crossing produces **`crossingProximity`**, and nothing else:

```
d                 = dist(nearestCrossing) / spot
crossingProximity = clamp((d − LIM_XPROX_FLOOR_PCT) / (LIM_XPROX_CEIL_PCT − LIM_XPROX_FLOOR_PCT), 0, 1)
```

`1` = far from any crossing. `0` = at or inside one. No `nearestCrossing` → `1`.

> **E2.** Named for what is measured. `confidence` implied a judgement about the whole model, and
> `0.2` would read as *the math is junk* rather than *spot is inside a crossing interval*.

**LIM17 — the dot is never moved by proximity.** `x = lean`, `y = nearSpotMix`, always.

> **D15.** MSC subtracted up to 50 from bias and 30 from friction near a crossing, with an extra
> one-sided penalty below the flip. The **asymmetry** and the **magnitudes** are unmeasured claims
> about flips being dangerous. What survives is a claim about the model's shelf life, not the
> market: **as spot approaches a sign change, Γ re-weights and the reading is about to be stale.**
> That belongs in a separate channel, not spent as position. Twin marks are removed with it.

**LIM18.** Publish `spotBelowNearestCrossing: boolean` as a fact. It adjusts nothing.

---

## 7. Trail, transition, render

### 7.1 Ghost trail

**LIM19.** The plane renders a decaying trail of prior states. It replaces a velocity arrow.

**LIM20 — fixed-interval emission** every `LIM_TRAIL_INTERVAL_S`, never on distance. **Spacing is
therefore speed** — clustered means the state held, spread means it moved — so no smoothing window,
cap or threshold has to be chosen.

**LIM21 — uniform size, opacity by age.** Bounded by `LIM_TRAIL_WINDOW_MIN`; resets at the session
open. Ghosts are plotted from unclamped values and may extend past the plane edge.

*A trail carries curvature, reversals and dwell. A single arrow carries none of them.*

### 7.2 Transition — diagnostic, off

**LIM22.** A regime-transition label (nearest boundary crossed by current drift, with time at the
current rate) is computed but available only behind `LIM_SHOW_TRANSITION`, default `false`. An ETA
is a linear model on a short sample and will be sized off regardless of conditional wording. The
trail already shows drift honestly.

### 7.3 The plane

**LIM23.** Crosshairs at `x = 0`, `y = 50`.

```
dotX = ((x + 100) / 200) × W
dotY = ((100 − y) / 100) × H
```

**LIM24 — shelf life is a ring and a chip, never opacity.**

The dot renders at **full opacity always**. `crossingProximity` is shown as a ring whose radius
scales with `1 − crossingProximity`, plus a numeric chip.

> **E3.** Fading the mark as a crossing nears dims the object exactly when a member should look at
> it, and it fails in bright rooms, on low-contrast themes and for low-vision readers. Opacity is
> the trail's channel (LIM21) and is not reused. It also contradicted LIM26, where an empty state
> sits at full confidence in the centre.

**LIM25 — colour is identity, not valence.** One blue with an edge glow. Horizontal position
already states lean, so colour was redundant; red/green asserts good/bad before anything is read
and is the worst pair for colour-vision deficiency. **(D13.)**

**LIM26 — empty and never-hydrated render dead centre** (`x = 0, y = 50`), at full opacity.
*(MSC's UI defaulted Y to 0 and drew a confident marker at bottom-centre — a wrong state shown as a
real one.)*

**LIM27 — chrome** states the expiration, wing count, `crossingCount`, and **four** standing lines:

1. *Chain GEX (estimate). Dealer sign is assumed, not observed.*
2. *Window read — mass outside the wings is not counted.*
3. *Open interest as of {date}. Today's trading is not in it.* **(E6)**
4. *The near-spot mix is a blend of measured factors. Whether it resists price movement is
   unmeasured.*

> **E6.** Line 3 is the same-day-expiry landmine. GEX is `Γ·OI·S²` and OI settles T+1, so on a 0DTE
> session the structure shown is last night's book. Without that sentence LIM inherits the retail
> GEX misreading on a better surface.

**LIM36 — the quadrant ships with labelled axes and no cell names.** *Pin*, *Air-Pocket*,
*Downside Acceleration* are outcome claims; *muddy / slippery* are held pending §15.3. The axes are
labelled and the position is the reading. Names are added after the tape sitting, or not at all.

### 7.4 The spot-line link

**LIM28.** The **spot line on the GEX profile takes the dot's colour and glow.** Same blue, same
edge glow, so the two marks read as one object.

The anchor is **spot**, not a bar: every LIM term is computed relative to spot, while the reading
comes from the whole distribution — so highlighting one concentration would imply a causation the
model does not claim. Spot is also a continuous price rather than a `strikeStep` bucket, and it
glides rather than jumping between strikes.

**LIM29 — one glow relationship.** Only the dot and the spot line glow. A signature works only
while it is rare.

### 7.5 Optional profile annotations — default off

**LIM30.** Behind `LIM_SHOW_ANNOTATIONS`: a hairline at `spot + centrePts` (the centre of gravity —
the honest link to the X position) and interval ticks at each crossing's `lo` and `hi`.

**LIM31 — density budget.** Default: spot glow only. Never spot glow **and** centre-of-gravity
**and** crossing ticks at once by default. Compact surface: dot, expiration, wing count, chrome
lines 1 and 3 — no trail, no annotations, no ring chip.

**LIM32 — layering.** The dot carries the one-second read; trail and readout are the study layer.

---

## 8. Result

```ts
type LimResult = {
  x: number;  y: number;                       // = lean, nearSpotMix. Never adjusted.
  xUnclamped: number;  yUnclamped: number;     // E1 — drive trail and transition
  lean: number;  nearSpotMix: number;          // E4
  netRatio: number;  concF: number;  magF: number;     // LIM10
  centrePts: number;                           // signed, index points
  crossings: { lo: number; hi: number; netBefore: number; netAfter: number; steepness: number }[];
  crossingCount: number;
  nearestCrossing: { lo: number; hi: number } | null;
  distanceToCrossing: number | null;           // points; 0 when spot is inside
  spotBelowNearestCrossing: boolean;
  crossingProximity: number;                   // 0…1, E2
  oiAsOf: string | null;                       // E6 — surfaced on chrome
  expiration: string;  wings: number;  symbol: string;
  valid: boolean;
};
```

**LIM33.** Trail and transition are computed on the **unclamped** values, so they retain resolution
at `x = ±100` where the displayed position saturates.

**LIM34 — per-symbol scale.** `LIM_CENTRE_SCALE_PTS` is a symbol map. A symbol absent from it makes
LIM `valid: false` for that symbol. It never falls back to another symbol's scale — 50 points is a
different fraction of SPX, NDX and SPY, and a silent fallback saturates the first non-SPX session.

---

## 9. Configuration — Invariant 2

Every key required; missing or invalid **aborts boot**.

| Key | Value | Governs |
|---|---|---|
| `LABS_LIM_CENTRE_SCALE_PTS` | map, e.g. `{"I:SPX": 50}` | LIM7 |
| `LABS_LIM_BAND_CLOSE_PCT` / `_MEDIUM_PCT` | 1.0 / 2.0 | LIM9 |
| `LABS_LIM_W_NET` / `_W_CONC` / `_W_MAG` | 0.50 / 0.30 / 0.20 | LIM9 |
| `LABS_LIM_CONC_FLOOR` / `_CONC_SPAN` | 30 / 40 | LIM9 |
| `LABS_LIM_MAG_FLOOR` / `_MAG_SPAN` | 40 / 40 | LIM9 |
| `LABS_LIM_XPROX_FLOOR_PCT` / `_CEIL_PCT` | 0.5 / 1.5 | LIM16 (E2) |
| `LABS_LIM_TRAIL_INTERVAL_S` | 30 | LIM20 |
| `LABS_LIM_TRAIL_WINDOW_MIN` | 45 | LIM21 |
| `LABS_LIM_DRIFT_MIN_RATE` | 1.0 (units/min) | LIM22 |
| `LABS_LIM_SHOW_TRANSITION` | `false` | LIM22 |
| `LABS_LIM_SHOW_ANNOTATIONS` | `false` | LIM30 |

Values are MSC's as-built settings where they existed, carried for continuity. **They are starting
points, not findings.**

---

## 10. Acceptance

| ID | Case | Expect |
|---|---|---|
| **AT-LIM1** | Mass above spot | x > 0 |
| **AT-LIM2** | Mass below spot | x < 0 |
| **AT-LIM3** | Mass symmetric about spot | x ≈ 0 regardless of gamma sign |
| **AT-LIM4** | All-positive net near spot | y > 50 |
| **AT-LIM5** | All-negative net near spot | y < 50 |
| **AT-LIM6** | Mass above spot **and** negative gamma near spot | x > 0 **and** y < 50 — axes independent (D12) |
| **AT-LIM7** | Spot inside a crossing interval | `crossingProximity = 0`; **x and y unchanged** |
| **AT-LIM8** | Spot beyond `LIM_XPROX_CEIL_PCT` from the nearest crossing | `crossingProximity = 1` |
| **AT-LIM9** | Empty strike map | x 0, y **50** |
| **AT-LIM10** | Never-hydrated render | centre, full opacity, not bottom-centre |
| **AT-LIM11** | Book with three crossings | `crossingCount = 3`; all published as intervals |
| **AT-LIM12** | Cliff vs smear at the same location | `steepness` differs |
| **AT-LIM13** | `lean` beyond ±100 | `xUnclamped ≠ x`; trail continues past the plane edge **(E1)** |
| **AT-LIM14** | State held still across the trail window | ghosts cluster |
| **AT-LIM15** | State moved fast across the window | ghosts spread |
| **AT-LIM16** | `netRatio`, `concF`, `magF` | published, and recombine to `nearSpotMix` |
| **AT-LIM17** | Any config key absent | boot aborts |
| **AT-LIM18** | `crossingCount ≠ 1` | chrome prints **no** single crossing price |
| **AT-LIM19** | Symbol absent from the scale map | `valid: false`; no fallback scale |
| **AT-LIM20** | No midpoint anywhere | no `(lo+hi)/2` in any published field or chrome string |
| **AT-LIM21** | `crossingProximity` at any value | **dot opacity is unchanged (E3)** |
| **AT-LIM22** | Chrome | contains the OI as-of date and the same-day sentence **(E6)** |
| **AT-LIM23** | Grep of every output string, field name and label | contains none of: *wall, magnet, pin, gravity, intent, hostile, support, resistance, friction, muddy, slippery* **(E4, E7)** |

Characterization suite green before each commit; tests land in the same change.

---

## 11. Declared divergences from MSC

| # | MSC | Labs | Reason |
|---|---|---|---|
| D1 | `gamma × OI × 100` | `Γ·OI·S²` | Labs' convention is frozen |
| D2 | All expirations on one strike | Per-expiration | MSC §16.2 |
| D3 | Full chain | Wings window, declared | GP7 |
| D4 | ~15 hardcoded constants | Config, fail loud, per-symbol scale | Invariant 2 |
| D5 | Builder empty ≠ UI empty | One empty state, centre | MSC §12.3 |
| D12 | Bias blends imbalance and centre | X = lean only | Axes shared their largest input |
| D13 | Colour = sign of bias | Colour = identity | Position states lean; retires a verdict palette |
| D14 | Point-in-time dot | Ghost trail | Momentum, curvature, reversal, dwell |
| D15 | Proximity subtracts from both scores | Separate channel; position untouched | Asymmetry and magnitudes unmeasured; shelf life is not |
| D16 | Flip = `(prev+cur)/2` | Crossing intervals | A midpoint is a fabricated price on a strike axis |

---

## 12. Known caveats (contractual, and on the chrome)

1. **The dealer sign convention is an assumption.** Calls supportive, puts hostile. Labs cannot
   verify inventory from a chain. Every reading rests on it.
2. **Whether the near-spot mix resists price movement is unmeasured.** Nothing here asserts it.
3. **LIM is a window, not the chain.** Mass outside the wings is invisible to lean and to the band
   ratios.
4. **`LIM_CENTRE_SCALE_PTS` is instrument-specific** and does not transfer between symbols.
5. **`nearSpotMix` is a blend, and `netF` carries half of it.** The factors are published so the
   blend can be inspected rather than trusted.
6. **Open interest settles T+1.** Intraday the profile changes because Γ and spot change — not
   because anyone's position did. On a same-day expiry the structure shown is last night's book.

---

## 13. Non-goals

LIM does not: forecast direction · gate orders · convert GEX to dollars · weight by delta or vega ·
read volume, order book, tape or quote depth · read positions or the trade log · replace the frozen
`gex` template · publish a composite score.

---

## 14. Files in scope

```
web/lib/options-lab/templates/lim.ts            (new)
web/lib/options-lab/templates/lim.test.ts       (new)
web/lib/options-lab/templates/limTrail.ts       (new — ring buffer, drift)
web/lib/options-lab/templates/types.ts          (layout + ValueModeId)
web/lib/options-lab/templates/registry.ts       (one entry)
web/lib/options-lab/templates/gex.ts            (spot-line glow; optional COG + interval ticks)
web/components/…                                 (quadrant renderer)
Architecture/29-options-lab-heatmap-templates.md
Architecture/00-decision-log.md                  (same day)
```

**Out:** any MSC import · server/ · a second GEX store of truth · dock widgets · volume of any kind.

**Parent amendment.** `layout: "quadrant"` and `ValueModeId: "lim"` amend Heatmap Templates v0.3.
SVP has a separate pending amendment to the same parent. **These land as one merged amendment
draft, one parent bump** — two packets editing the same parent in parallel is how invariants fork.
The merged draft is a deliverable (§15.6), not a sentence in this file.

---

## 15. Open decisions

| # | Item | Owner |
|---|---|---|
| 1 | Approve into `Specs/` — conditional on §15.6 existing as a draft | **Coach** |
| 2 | Display name. *Liquidity-Intent* does not survive — nothing in the input is intent. Placeholder is `GEX lean (window)` | **Echo** |
| 3 | **Axis vocabulary.** *Friction / muddy / slippery* describe an interaction with price that is unmeasured. Held off the axis pending a tape sitting where members are asked what they think the axis predicts | **Coach · Hotel** |
| 4 | `LIM_CENTRE_SCALE_PTS` per symbol | **Hotel** |
| 5 | Does LIM supersede parts of the IKI GEX toolset, or run beside it | **Juliet** |
| 6 | **Merged Heatmap Templates v0.3 amendment draft** — SVP auxiliary plane + `layout: "quadrant"` + `ValueModeId: "lim"` + registry entry. One PR | **India · Juliet** |
| 7 | Whether quadrant cell names are ever added, after §15.3 | **Echo · Hotel** |

---

## 16. Change control

Any change to the blend weights, band widths, `LIM_CENTRE_SCALE_PTS`, the put/call sign convention,
the crossing-proximity bounds, or the trail interval or window is a **breaking change** to every
reading a member has seen. Do not retune silently. Version and record old versus new.

---

## 17. Document control

| Version | Date | Notes |
|---|---|---|
| v0.1–0.3 | 2026-09-01 | Draft evolution; X = lean (D12), ghost trail (D14), colour as identity (D13) |
| v0.4 | 2026-09-01 | DG removed · confidence channel replaces the haircut (D15) · crossings as intervals (D16) · factors published · transition off · config boot-safe |
| **v0.4.1** | 2026-09-01 | **Errata pass, geometry unchanged.** E1 `leanRaw` · E2 `crossingProximity` · E3 ring and chip, never opacity · E4 `nearSpotMix`, friction words off the axis · E5 purpose restated in the book's terms · E6 OI as-of on chrome · E7 non-intent picker label · LIM36 no cell names in v1. **No law created.** |