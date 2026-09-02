# FatTail Labs — Heatmap LIM Template — Specification v0.4.7

**Status:** **BUILD AUTHORITY** with LIM9 (Coach diagram, 2026-09-02).
**Date:** 2026-09-02
**Repo:** Fattail-Labs · **Scope:** one Options Lab Heatmap template, client-side only.
**Sibling:** `FatTail-Labs-Heatmap-Strike-Turnover-Spec-v1_0.md` — independent, never fused.
**Supersedes:** v0.4.6.

**v0.4.7 (LIM9)** — Build the diagram as drawn. Plane holds disc, ghosts, crosshairs, cell
outlines — nothing else. Four large coloured edge labels. Disc has depth. Ghosts are flat,
newest at 50% opacity. Companion GEX bars above spot green / below spot red, **only** in the
LIM4 companion link. Frozen `gex` SHA1 stays empty. Env scale map may list both `SPX` and
`I:SPX` as exact keys. No prefix normaliser.

**v0.4.6 (E27)** — A `valid: false` result is a **named refusal**, not a live centre reading.
LIM26 still parks an *empty* book at `(0, 50)`. It does not authorise painting a **scale miss**
as that same mark. Header must not print Lean / Mix / magF as live. Chrome names the hole:
`No centre scale configured for <symbol>.` **(AT-LIM33.)**

**v0.4.5 (E25 · E26 withdrawn)** — Coach, live surface after LIM7.

- **E25** Disc is the one-second read (LIM32). Scales with the plane: **~18–22 CSS px radius at 1440**. Floor on narrow widths. E19's 9pt is not enough.
- **E26 withdrawn.** A size taper was drafted; Coach: ghosts are the **same size** as the live disc; only opacity fades. LIM21 stands. The defect was 6px squares, not the sizing rule.

**v0.4.4 surface law (E18–E24)** — Coach, live surface 2026-09-02. Spec first, then build.

- **E18** Ring deleted (LIM24). `limRingRadius` gone. Proximity lives in the numeric chip.
- **E19** Disc radius raised (`LIM_DISC_R_PT`) so the mark is legible on a dark cell.
- **E20** Responsive fit (§7.6). No `minHeight: min(w,h)`. Quadrant and companion GEX share the panel, both fully visible.
- **E21** No member-facing density control (LIM31). Density is breakpoint behaviour. Compact-as-mode is a spec fault, not Charlie's.
- **E22** Four cells outlined; crosshairs and ticks raised in contrast; tick labels in gutters outside the plot (LIM23).
- **E23** Cell labels in the **book's** terms (LIM36 reversed). MSC outcome names stay off. **OD-LIM7 CLOSED**.
- **E24** Appendix B strings stay verbatim. Line 3 visible without interaction; lines 1, 2, 4 behind an info affordance beside the title (LIM27).

**v0.4.3 errata (E15–E17)** — three formula defects surfaced by Hotel's eight hand-computed
goldens (LIM0-2) before any code existed. **All three are authoring errors in this document.**

- **E15** `crossingProximity` was **dead as written** — `d` was a fraction compared against percent
  keys, pegging the channel at `0` for every book. `d` is now in percent (LIM16).
- **E16** `steepness` denominator is `(hi − lo)`, not `ctx.strikeStep` — they differ whenever a
  zero-net strike is skipped between the two sides (LIM13).
- **E17** `spotBelowNearestCrossing` is defined for the inside-the-interval case (LIM18).

Plus **OD-LIM10**: Y gives the same value to an *absent* near-spot book and a *negative* one.
No formula change; `magF` is the discriminator and it must reach the reader (§15, caveat 7).

**v0.4.2 errata (E8–E14)** — from Grok's review of the bench plan, plus two findings of my own.
Full index of E1–E17 in **Appendix C**.

- **E8** `yUnclamped` **removed**. It is dead by construction, not by parameterisation — see below.
- **E9** Y floors ship at `0`/`100`, so the labelled axis is the achievable axis (**OD-LIM8**).
- **E10** Canonical config key set fixed in **Appendix A**. `LIM_CONF_*` is not a name in this system.
- **E11** Compact surface **keeps the proximity ring** (LIM31). **SUPERSEDED by E18 / E21** — there is no ring, and no Compact mode.
- **E12** §2 corrected — `AGENTS.md:26` **does** gate this. (Grok JR8; I was wrong.)
- **E13** Trail resets on session open **and on expiration or symbol change** (LIM21).
- **E14** Registry ships `lim` **only** — no switcher entry for an unbuilt mode.

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

No server module, no endpoint, no Redis, no `server/config.py`, no DL-539 §8 allowlist file.

> **E12 — correction.** v0.4.1 §2 said *"DL-539 does not gate this."* That is true of the §8
> five-module allowlist and **false** of the other face of the same decision. `AGENTS.md:26` and
> `:227` read: **IKI Lab is the only active program** — *"raise to Coach three times, three
> successive OKs, recorded on the GO token, before any edit outside IKI."* LIM is outside IKI.
> The gate is procedural, not architectural: it costs three recorded OKs on the GO token, it is
> not a rebuild. It belongs on the token as a checkbox, not in the critical path of the board.
> **Grok's JR8 was right and my §2 was wrong.**

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

**LIM37 — the registry ships `lim` and nothing else. (E14)** No `session-volume` entry, no
placeholder mode, no disabled item. A switcher entry that renders nothing is a bug report from a
member, and a reserved name in code outlives the reason it was reserved. The relationship to a
future session-volume mode is described **in prose in this spec and in the plan** — never as a
shipped enum member. `ValueModeId` gains exactly one string.

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

**The X clamp is live.** `centre` is bounded only by the wings, so `leanRaw` exceeds ±100 whenever
the window's centre of gravity sits further from spot than `LIM_CENTRE_SCALE_PTS`. That is an
ordinary session, not an edge case. Hence `xUnclamped` (LIM33, AT-LIM13).

> **D12.** MSC's bias was `imbalance × 0.6 + centre × 0.4`. Imbalance is symmetric by mechanism —
> positive gamma damps rallies and dips alike — so it describes the near-spot mix, not direction,
> and it was already half the Y axis through `netRatio`. The two axes shared their largest input.
> X is the lean alone. **Do not fold imbalance back into Y; publish the factors instead (LIM10).**

### 5.2 Y — near-spot mix, `[0, 100]`

**LIM8.** Empty map or `Σ|net| == 0` → **`50`**.

**LIM9.** Bands are percent of spot: `close = LIM_BAND_CLOSE_PCT`, `medium = LIM_BAND_MEDIUM_PCT`.

```
netRatio     = gexClose / absGexClose                                  // 0 if absGexClose == 0
netF         = (netRatio + 1) / 2 × 100                                // [0, 100]
concF        = LIM_CONC_FLOOR + (absGexMedium / totalAbs) × LIM_CONC_SPAN
magF         = LIM_MAG_FLOOR  + (absGexClose  / totalAbs) × LIM_MAG_SPAN

nearSpotMix  = netF × LIM_W_NET + concF × LIM_W_CONC + magF × LIM_W_MAG
```

**LIM38 — Y has no unclamped twin, and needs no clamp. (E8)**

`nearSpotMix` is a **convex combination** of three terms that are each bounded to `[0, 100]`, with
weights that sum to `1.0` (enforced: AT-LIM17b). A convex combination of `[0, 100]` values is in
`[0, 100]` by construction. Therefore:

- the clamp on Y can never fire;
- `yUnclamped` can never differ from `y`;
- an implementer given both fields sets them equal, and **AT-LIM13's Y counterpart would pass while
  testing nothing** — the same failure E1 fixed on X.

So `yUnclamped` is **removed from `LimResult`**, the clamp is removed from the formula, and the
bound survives as a **test assertion** (AT-LIM26) rather than a runtime operation that hides an
arithmetic error instead of raising it.

> **Two reviews, one defect.** Grok found it as *"`yUnclamped` is unspecified"*; I found it as
> *"the achievable range is `[17, 87]`, so the dot cannot reach the poles."* Both are symptoms.
> The cause is that Y is structurally incapable of leaving its own range, which makes the
> unclamped field dead and the floors — not the clamp — the thing that actually needed a decision.
> **E8 is the field. E9 is the floors. They are separate fixes.**

**LIM39 — the floors ship at zero. (E9 · OD-LIM8)**

With MSC's as-built floors (`CONC 30/40`, `MAG 40/40`), the achievable range is:

```
netF   [0, 100] × 0.50  →  [ 0, 50]
concF  [30, 70] × 0.30  →  [ 9, 21]
magF   [40, 80] × 0.20  →  [ 8, 16]
                            ─────────
nearSpotMix                [17, 87]
```

The dot would be confined to the middle 70% of a plane labelled 0–100, permanently, with the
compression invisible to the member. `LIM_CONC_FLOOR` and `LIM_MAG_FLOOR` are unmeasured MSC
constants and §9 already declares those *"starting points, not findings"* — Invariant 4 does not
let an unmeasured constant silently narrow a labelled axis.

**v1 ships `LIM_CONC_FLOOR = 0`, `LIM_CONC_SPAN = 100`, `LIM_MAG_FLOOR = 0`, `LIM_MAG_SPAN = 100`,**
so the labelled axis is the achievable axis. **The keys are retained**, so if Hotel's tape sitting
(§15.3) finds that a dispersed window slams to the floor and reads worse than it is, the fix is a
config change with a versioned entry per §16 — not a code change and not a new build packet.

Rejected: rescaling `(raw − 17) / 70 × 100`. It restores the *stated* range while leaving three
factors that never approach their own extremes, so the poles stay unreachable and the axis
acquires a second undocumented transform.

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

```
steepness = |netAfter − netBefore| / (hi − lo)          // E16 — the interval's own width
```

The walk visits both strikes already; a cliff and a smear must not report identically.

> **E16.** v0.4.2 said `/ strikeStep`. `hi − lo` equals `ctx.strikeStep` only when the two sides
> are adjacent listed strikes. LIM12 skips `net == 0`, so a crossing that spans a zero-net strike
> has `hi − lo = 2 × strikeStep` (or more), and dividing by `strikeStep` would report it as twice
> as steep as it is — a fabricated cliff, in the one field whose whole job is to tell a cliff from
> a smear. The denominator is the interval that was actually traversed.

**LIM14.** `crossingCount = crossings.length`. **Chrome never prints a single crossing price when
`crossingCount ≠ 1`** (AT-LIM18).

**LIM15.** `nearestCrossing` minimises distance to spot:

```
dist(c) = (c.lo <= spot && spot <= c.hi) ? 0 : min(|spot − c.lo|, |spot − c.hi|)
```

### 6.2 Crossing proximity — a distance, not a verdict

**LIM16.** Proximity to a crossing produces **`crossingProximity`**, and nothing else:

```
dPct              = dist(nearestCrossing) / spot × 100        // E15 — PERCENT of spot
crossingProximity = clamp((dPct − LIM_XPROX_FLOOR_PCT) / (LIM_XPROX_CEIL_PCT − LIM_XPROX_FLOOR_PCT), 0, 1)
```

`1` = far from any crossing. `0` = at or inside one. No `nearestCrossing` → `1`.

> **E15 — the channel was dead as written, and this is the defect the goldens were for.**
> v0.4.1 and v0.4.2 wrote `d = dist / spot`, a **fraction**, then compared it to
> `LIM_XPROX_FLOOR_PCT = 0.5` and `LIM_XPROX_CEIL_PCT = 1.5`, which are **percent**. A crossing
> 20 points from a spot of 5000 gives `d = 0.004`, and 0.004 is below 0.5 for every book that will
> ever be read — so `crossingProximity` returns **0 always**: the ring pegged at maximum, the chip
> pegged at zero, and the one channel that carries shelf life (D15) silently constant.
> The unit was the whole defect. Both key names already said `_PCT`; the formula did not.
>
> Hotel's F6 golden reads *"20/5000 = 0.004 < 0.5 % floor"* — the right answer reached by reading
> the intent past the text. An implementer working from the text alone gets the constant.
> **AT-LIM29 exists so this cannot come back**: a fixture must produce a value strictly between
> 0 and 1. `AT-LIM7` (=0) and `AT-LIM8` (=1) both pass against a pegged channel if the peg is 0
> and the far case is clamped — only a mid-range value proves the map is live.

> **E2.** Named for what is measured. `confidence` implied a judgement about the whole model, and
> `0.2` would read as *the math is junk* rather than *spot is inside a crossing interval*.
> **E10:** the config keys are `LABS_LIM_XPROX_*`. `LIM_CONF_*` appears nowhere in this system.

**LIM17 — the dot is never moved by proximity.** `x = lean`, `y = nearSpotMix`, always.

> **D15.** MSC subtracted up to 50 from bias and 30 from friction near a crossing, with an extra
> one-sided penalty below the flip. The **asymmetry** and the **magnitudes** are unmeasured claims
> about flips being dangerous. What survives is a claim about the model's shelf life, not the
> market: **as spot approaches a sign change, Γ re-weights and the reading is about to be stale.**
> That belongs in a separate channel, not spent as position. Twin marks are removed with it.

**LIM18.** Publish `spotBelowNearestCrossing: boolean` as a fact. It adjusts nothing.

```
spotBelowNearestCrossing = spot < nearestCrossing.lo      // E17 — inside is NOT below
```

No `nearestCrossing` → `false`.

> **E17.** The interval has three positions, not two: below `lo`, inside `[lo, hi]`, above `hi`.
> A boolean cannot carry three, and v0.4.2 left the inside case undefined — so two implementers
> would resolve it two ways and neither would be wrong. `distanceToCrossing = 0` is what marks
> *inside*; this flag answers only *below*.

---

## 7. Trail, transition, render

### 7.1 Ghost trail

**LIM19.** The plane renders a decaying trail of prior states. It replaces a velocity arrow.

**LIM20 — fixed-interval emission** every `LIM_TRAIL_INTERVAL_S`, never on distance. **Spacing is
therefore speed** — clustered means the state held, spread means it moved — so no smoothing window,
cap or threshold has to be chosen.

**LIM21 — uniform size, opacity by age.** Bounded by `LIM_TRAIL_WINDOW_MIN`.
Ghosts are **circles**, the same colour and the **same radius** as the live disc — a ghost is an
afterimage of the same object. They are **flat** (no sphere treatment). Opacity: newest starts at
**50%** and fades linearly to near-zero at the window edge. Newest sits **behind** the live disc
(z-order). **No size taper. (E26 withdrawn.)**

LIM20 is unchanged: fixed-interval emission; spacing is speed. `LABS_LIM_TRAIL_INTERVAL_S` stays
**30**. A denser tail is a §16 config change, not this packet.

**The buffer is cleared on session open, on expiration change, and on symbol change. (E13)**
The trail's whole claim is *this state came from that state*. Ghosts emitted against SPX 0DTE are
not prior states of next Friday's plane, and ghosts from SPX are not prior states of NDX — the
scale map (LIM34) makes the X units literally different. A stale trail after a switcher change is
worse than no trail: it renders a movement that never happened, in the channel a member is being
taught to read as momentum. Clearing is unconditional and immediate; no fade-out, no carry-over.

Ghosts are plotted from unclamped X and from `y`, and may extend past the plane's left or right
edge.

*A trail carries curvature, reversals and dwell. A single arrow carries none of them.*

### 7.2 Transition — diagnostic, off

**LIM22.** A regime-transition label (nearest boundary crossed by current drift, with time at the
current rate) is computed but available only behind `LIM_SHOW_TRANSITION`, default `false`. An ETA
is a linear model on a short sample and will be sized off regardless of conditional wording. The
trail already shows drift honestly.

### 7.3 The plane

**LIM23.** Crosshairs at `x = 0`, `y = 50`. Four cells are **outlined** (1px borders; optional
subtle alternating fills). The plane interior holds **only** the disc, the ghosts, the
crosshairs and the cell outlines — **no in-plane copy**. Generous padding above, below and left
so the edge labels have room.

Four large coloured labels, outside the plane, as drawn:

| Place | Label | Colour |
|-------|--------|--------|
| left, upper half, vertical | `EXPANSION` | green |
| left, lower half, vertical | `COMPRESSION` | red |
| below, left | `< WEIGHT BELOW` | red |
| below, right | `WEIGHT ABOVE >` | green |

**DL polarity note (not a gate):** Y-high is positive GEX, concentrated and close to spot — the
damping end — so "expansion" on top is the inverse of the usual mechanism reading. Coach disposed
the drawing. Recorded so a future reader knows it was a choice, not a slip.

```
dotX = ((x + 100) / 200) × W
dotY = ((100 − y) / 100) × H
```

`W` and `H` are the **plot** box, not the gutters.

**LIM24 — shelf life is a chip, never opacity, never a ring. (E18 · E19)**

The dot renders at **full opacity always**. `crossingProximity` is shown as a **numeric chip**.
The ring is **deleted**. `limRingRadius` does not exist. Proximity does **not** move `x` or `y`
(LIM17 · D15); the chip is why D15 can keep that law.

Disc radius **scales with the plot** (`min(W, H)`). Target **18–22 CSS px** at a 1440-wide
panel (Echo: **20** at a 480 px plot min). Floor so it stays legible on a narrow plane.
The disc is the most prominent object on the plane — ahead of crosshairs, cell outlines, and
the tail. **(E25 · LIM32.)** It is **spherical**: a radial gradient of the **same** identity blue
(lighter highlight upper-left, deeper lower-right) plus the existing soft glow. A gradient of one
colour is not a second colour **(LIM25)**. Ghosts stay flat.

> **E3** still holds: do not fade the mark. **E18** retires the ring. An uncapped
> `minR + (1 − p) × (0.32 × minWH)` circle detached from the disc and read as a random arc
> (~670px on a 1050px plane at proximity 0). Coach: remove it.

**LIM25 — colour is identity, not valence.** One blue with an edge glow. Horizontal position
already states lean, so colour was redundant; red/green asserts good/bad before anything is read
and is the worst pair for colour-vision deficiency. **(D13.)**

**LIM26 — empty and never-hydrated render dead centre** (`x = 0, y = 50`), at full opacity.
*(MSC's UI defaulted Y to 0 and drew a confident marker at bottom-centre — a wrong state shown as a
real one.)*

**LIM26 does not cover `valid: false`. (E27)** A missing centre-scale (LIM34) or a missing spot is
a **refusal**. The surface must not present it as a live reading:

- No identity disc at `(0, 50)` indistinguishable from a real centre book.
- Header does **not** print Lean / Mix / magF as live numbers.
- Chrome names the hole: `No centre scale configured for <symbol>.` — same discipline as the C2
  missing-key message.

Compute may still return `x = 0` (AT-LIM19). The **render** must say so.

**LIM27 — chrome** states the expiration, wing count, `crossingCount`, and **four** standing lines.
Verbatim strings in **Appendix B**; they are contractual and Tango's packet quotes them from there.
**Placement (E24):** line **3** (OI as-of) is **visible without interaction** — it is the one that
actively misleads on a 0DTE session. Lines **1, 2, 4** sit behind an **info affordance beside the
title**, reachable in one interaction. The four lines are not deleted. The heatmap header pattern
is not redesigned (S8).

**LIM36 — no cell names inside the plane. (LIM9 S1)** Coach's four edge labels (LIM23) replace
in-plane copy. MSC outcome names stay banned. `expansion` and `compression` are **allowed** axis
terms (AT-LIM23 allow-list), with the LIM23 polarity note cited in the DL.

AT-LIM23 keeps every previously banned word **and** greps the MSC outcome names. Do not drop
words from the grep.

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

**LIM31 — density is breakpoint behaviour, never a control. (E21)**

Default annotations: spot glow only. Never spot glow **and** centre-of-gravity **and** crossing
ticks at once by default.

**No member-facing density control.** There is no Comfort / Compact toggle and no `userSet` override.
A member has no basis for that choice; the panel already knows its size. ResizeObserver width is
the only input.

At **narrow** width: the proximity **chip** survives; trail and in-plane readout drop. At
comfortable width: trail may show. The chip is the shelf-life channel (LIM24). AT-LIM24 is
asserted by **rendering at a width**, not by calling a mode function.

> **E11 SUPERSEDED.** v0.4.2 kept a ring on Compact. E18 deleted the ring. E21 deleted Compact as
> a mode. The chip is what remains of the channel at any size.

**LIM32 — layering.** The disc carries the one-second read and is the most prominent object on
the plane. Trail and readout are the study layer.

### 7.6 Responsive fit (E20)

The quadrant plane and the companion GEX profile **share the panel**. Both are fully visible.
No clipping. No scrolling of the LIM panel to find the other.

Do **not** set `minHeight` to `min(w, h)` — that inflates the box on a wide panel and pushes the
profile out.

Verify at **1280**, **1440**, and **1920** CSS pixels. One screenshot each, attached to LIM7-G.

---

## 8. Result

```ts
type LimResult = {
  x: number;  y: number;                       // = lean, nearSpotMix. Never adjusted.
  xUnclamped: number;                          // E1 — drives trail and transition. E8: no y twin.
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

**LIM33.** Trail and transition are computed on **`xUnclamped`** for X — retaining resolution at
`x = ±100` where the displayed position saturates — and on **`y`** for Y, which does not saturate
(LIM38).

**LIM34 — per-symbol scale.** `LIM_CENTRE_SCALE_PTS` is a symbol map. A symbol absent from it makes
LIM `valid: false` for that symbol. It never falls back to another symbol's scale — 50 points is a
different fraction of SPX, NDX and SPY, and a silent fallback saturates the first non-SPX session.

---

## 9. Configuration — Invariant 2

Every key required; missing or invalid **aborts boot**. **Appendix A is the canonical list** and the
only place key names are defined. No packet, seed, plan or test may introduce a key not in it.

| Key | v1 value | Governs |
|---|---|---|
| `LABS_LIM_CENTRE_SCALE_PTS` | map, e.g. `{"I:SPX": 50}` | LIM7 · LIM34 |
| `LABS_LIM_BAND_CLOSE_PCT` / `_MEDIUM_PCT` | 1.0 / 2.0 | LIM9 |
| `LABS_LIM_W_NET` / `_W_CONC` / `_W_MAG` | 0.50 / 0.30 / 0.20 | LIM9 · must sum to 1.0 |
| `LABS_LIM_CONC_FLOOR` / `_CONC_SPAN` | **0 / 100** | LIM39 (E9) |
| `LABS_LIM_MAG_FLOOR` / `_MAG_SPAN` | **0 / 100** | LIM39 (E9) |
| `LABS_LIM_XPROX_FLOOR_PCT` / `_CEIL_PCT` | 0.5 / 1.5 — **percent of spot, not a fraction** | LIM16 (E2 · E10 · **E15**) |
| `LABS_LIM_TRAIL_INTERVAL_S` | 30 | LIM20 |
| `LABS_LIM_TRAIL_WINDOW_MIN` | 45 | LIM21 |
| `LABS_LIM_DRIFT_MIN_RATE` | 1.0 (units/min) | LIM22 |
| `LABS_LIM_SHOW_TRANSITION` | `false` | LIM22 |
| `LABS_LIM_SHOW_ANNOTATIONS` | `false` | LIM30 |

Values are MSC's as-built settings where they existed and are defensible, carried for continuity.
**They are starting points, not findings.** The two floors are the exception: E9 changes them.

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
| **AT-LIM16** | `netRatio`, `concF`, `magF` | published, and recombine to `nearSpotMix` exactly |
| **AT-LIM17** | Any config key absent | boot aborts |
| **AT-LIM17b** | `W_NET + W_CONC + W_MAG ≠ 1.0` | boot aborts **(E8 — the convexity Y depends on)** |
| **AT-LIM18** | `crossingCount ≠ 1` | chrome prints **no** single crossing price |
| **AT-LIM19** | Symbol absent from the scale map | `valid: false`; no fallback scale |
| **AT-LIM20** | No midpoint anywhere | no `(lo+hi)/2` in any published field or chrome string |
| **AT-LIM21** | `crossingProximity` at any value | **dot opacity is unchanged (E3)** |
| **AT-LIM22** | Chrome | all four Appendix B lines **reachable verbatim**; **line 3 visible without interaction**; lines 1, 2, 4 behind the title info affordance **(E6 · E24)** |
| **AT-LIM23** | Grep of every output string, field name and label | contains none of the v0.4.3 list (*wall, magnet, pin, gravity, intent, hostile, support, resistance, friction, muddy, slippery*) **and** none of the MSC outcome names (*false breakout, downside acceleration, air-pocket, air pocket, mean reversion*). `expansion` / `compression` are **allowed** axis terms (LIM9 S2). Do not drop words from the grep **(E4, E7, E23)** |
| **AT-LIM24** | Narrow-width render | proximity **chip** present; trail and in-plane readout absent. Asserted by **rendering at a width**, not by calling a mode function. No ring. No density control **(E18 · E21)** |
| **AT-LIM25** | Expiration changed, then symbol changed | trail buffer empty on the first frame after each **(E13)** |
| **AT-LIM26** | Y across the full fixture set, incl. extremes | `0 ≤ nearSpotMix ≤ 100` holds with **no clamp in the code path**; `yUnclamped` absent from the payload **(E8)** |
| **AT-LIM27** | Registry enumeration | exactly one `ValueModeId` added; no `session-volume` entry **(E14)** |
| **AT-LIM28** | Grep of the repo for `LIM_CONF_` | zero hits **(E10)** |
| **AT-LIM29** | Nearest crossing at a distance **between** the floor and ceiling (e.g. 50 pts on a spot of 5000 = 1.0 %) | `0 < crossingProximity < 1` — a **strictly interior** value. Proves the channel is live and not pegged **(E15)** |
| **AT-LIM30** | Crossing that spans a skipped `net == 0` strike | `steepness` uses `(hi − lo)`, not `ctx.strikeStep`; a two-step interval is not reported as twice as steep **(E16)** |
| **AT-LIM31** | Spot inside a crossing interval | `spotBelowNearestCrossing === false`, `distanceToCrossing === 0` — inside is distinguishable from below **(E17)** |
| **AT-LIM32** | Two fixtures with equal `nearSpotMix` but `magF = 0` and `magF > 50` | both `magF` values reach the rendered readout; the surface does not present them as the same reading **(OD-LIM10)** |
| **AT-LIM33** | `valid: false` (symbol off the scale map) | no live disc, no live header Lean/Mix/magF, plane names `No centre scale configured for <symbol>.` A live `valid: true` still paints a disc. **(E27)** |

Characterization suite green before each commit; tests land in the same change.

**AT-LIM29 is not optional and is not covered by AT-LIM7 or AT-LIM8.** Those assert the two clamp
endpoints, and a channel stuck at `0` satisfies AT-LIM7 while AT-LIM8's far case is indistinguishable
from a clamp. Only an interior value tests the map.

Hotel's goldens are **not** three fixtures. The minimum set is: one positive-gamma window, one
negative, one symmetric, one with mass entirely outside the close band, one with `Σ|net| == 0`,
one with three crossings, one with spot inside a crossing, and one with `leanRaw > 100` — eight,
each with its expected `x`, `y`, `netRatio`, `concF`, `magF` and `crossingCount` recorded by hand
before any code runs (Invariant 4: a golden computed by the implementation tests nothing).

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
| **D17** | Floors compress Y to `[17, 87]` on a `[0, 100]` plane | Floors at 0, span 100 | An unmeasured constant may not silently narrow a labelled axis **(E9)** |

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
7. **A Y value alone cannot tell an absent near-spot book from a negative one.** When
   `absGexClose == 0`, `netRatio` takes its `0` default and `netF` reads `50` — *neutral* — when
   the honest reading is *nothing is there*. Hotel's F2 (negative, concentrated, close) and F4
   (no mass inside the close band at all) both land on `y = 40` from opposite books. `magF`
   separates them — `80` versus `0` — and it is published first-class (LIM10), but the dot sits in
   the same place. **`magF` must reach the reader** (OD-LIM10).

---

## 13. Non-goals

LIM does not: forecast direction · gate orders · convert GEX to dollars · weight by delta or vega ·
read volume, order book, tape or quote depth · read positions or the trade log · replace the frozen
`gex` template · publish a composite score · reserve names for modes it does not build (LIM37).

---

## 14. Files in scope

```
web/lib/options-lab/templates/lim.ts            (new)
web/lib/options-lab/templates/lim.test.ts       (new)
web/lib/options-lab/templates/limTrail.ts       (new — ring buffer, drift, reset triggers E13)
web/lib/options-lab/templates/types.ts          (layout + one ValueModeId)
web/lib/options-lab/templates/registry.ts       (one entry)
web/lib/options-lab/templates/gex.ts            (spot-line glow; optional COG + interval ticks)
web/components/…                                 (quadrant renderer)
Architecture/29-options-lab-heatmap-templates.md
Architecture/00-decision-log.md                  (same day)
```

**Out:** any MSC import · server/ · a second GEX store of truth · dock widgets · volume of any kind.

**Parent amendment.** `layout: "quadrant"` and `ValueModeId: "lim"` amend the live Heatmap Templates
spec. SVP has a separate pending amendment to the same parent. **These land as one merged amendment
draft, one parent bump** — two packets editing the same parent in parallel is how invariants fork.
The merged draft is a deliverable (§15.6), not a sentence in this file.

**Which parent is live is not settled in this document (OD-LIM9).** Two files exist in `Specs/`:
`FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md`, whose header reads *"Current revision:
**v0.2.3** (filename remains `…-v0_2.md`)"*, and `…-Spec-v0_3.md`, a DRAFT amendment that
supersedes v0.2 **only in the clauses named in its own §2**. India names one **by filename** before
the merged amendment draft is opened. An amendment written against a superseded parent — or against
a version string that is not a file — is a silent fork of the registry contract.

---

## 15. Open decisions

| # | Item | Owner |
|---|---|---|
| 1 | Approve into `Specs/` — conditional on §15.6 existing as a draft | **Coach** |
| 2 | Display name. *Liquidity-Intent* does not survive — nothing in the input is intent. Placeholder is `GEX lean (window)` | **Echo** |
| 3 | **Axis vocabulary.** *Friction / muddy / slippery* describe an interaction with price that is unmeasured. Held off the axis pending a tape sitting where members are asked what they think the axis predicts | **Coach · Hotel** |
| 4 | `LIM_CENTRE_SCALE_PTS` per symbol | **Hotel** |
| 5 | Does LIM supersede parts of the IKI GEX toolset, or run beside it | **Juliet** |
| 6 | **Merged Heatmap Templates amendment draft** — SVP auxiliary plane + `layout: "quadrant"` + one `ValueModeId` + registry entry. One PR | **India · Juliet** |
| 7 | **CLOSED (OD-LIM7 · E23).** Cell names ship in v0.4.4 as book-terms (LIM36). MSC outcome names stay off until a tape sitting earns them. | **Coach disposed 2026-09-02** |
| **OD-LIM8** | **Y floors.** v1 ships 0/100 (E9). Does the tape sitting justify reinstating a floor, and at what value? Config change, versioned per §16 — never a code change | **Hotel · Coach** |
| **OD-LIM9** | **Live parent.** Named by canonical filename, not revision string: `…-Templates-Spec-v0_2.md` (whose header carries rev v0.2.3) or `…-Templates-Spec-v0_3.md`. **There is no `v0_2_1` file** — v0.4.2 §14 said otherwise and was wrong. Blocks §15.6 | **India** |
| **OD-LIM10** | **`magF` must reach the reader** (caveat 7). Y gives `40` to both a negative close book and an empty one. In v0.4.4 `magF` is in the compact numeric header (Lean · Mix · magF · crossings · proximity) with the proximity chip. No density mode. | **Echo · Tango** |

---

## 16. Change control

Any change to the blend weights, band widths, the Y floors or spans, `LIM_CENTRE_SCALE_PTS`, the
put/call sign convention, the crossing-proximity bounds, or the trail interval or window is a
**breaking change** to every reading a member has seen. Do not retune silently. Version and record
old versus new.

---

## Appendix A — canonical configuration keys (E10)

The environment key, the in-code constant, and nothing else. Any other spelling is a defect.

| Environment key | In-code constant |
|---|---|
| `LABS_LIM_CENTRE_SCALE_PTS` | `LIM_CENTRE_SCALE_PTS` |
| `LABS_LIM_BAND_CLOSE_PCT` | `LIM_BAND_CLOSE_PCT` |
| `LABS_LIM_BAND_MEDIUM_PCT` | `LIM_BAND_MEDIUM_PCT` |
| `LABS_LIM_W_NET` | `LIM_W_NET` |
| `LABS_LIM_W_CONC` | `LIM_W_CONC` |
| `LABS_LIM_W_MAG` | `LIM_W_MAG` |
| `LABS_LIM_CONC_FLOOR` | `LIM_CONC_FLOOR` |
| `LABS_LIM_CONC_SPAN` | `LIM_CONC_SPAN` |
| `LABS_LIM_MAG_FLOOR` | `LIM_MAG_FLOOR` |
| `LABS_LIM_MAG_SPAN` | `LIM_MAG_SPAN` |
| `LABS_LIM_XPROX_FLOOR_PCT` | `LIM_XPROX_FLOOR_PCT` |
| `LABS_LIM_XPROX_CEIL_PCT` | `LIM_XPROX_CEIL_PCT` |
| `LABS_LIM_TRAIL_INTERVAL_S` | `LIM_TRAIL_INTERVAL_S` |
| `LABS_LIM_TRAIL_WINDOW_MIN` | `LIM_TRAIL_WINDOW_MIN` |
| `LABS_LIM_DRIFT_MIN_RATE` | `LIM_DRIFT_MIN_RATE` |
| `LABS_LIM_SHOW_TRANSITION` | `LIM_SHOW_TRANSITION` |
| `LABS_LIM_SHOW_ANNOTATIONS` | `LIM_SHOW_ANNOTATIONS` |

**Retired / never valid:** `LIM_CONF_*` (any suffix) — the concept was renamed at E2 and the key
prefix went with it. AT-LIM28 greps for it.

---

## Appendix B — chrome, verbatim (LIM27)

Four standing lines. Tango's packet quotes these; it does not rewrite them.

1. `Chain GEX (estimate). Dealer sign is assumed, not observed.`
2. `Window read — mass outside the wings is not counted.`
3. `Open interest as of {oiAsOf}. Today's trading is not in it.`
4. `The near-spot mix is a blend of measured factors. Whether it resists price movement is unmeasured.`

Plus the state line: expiration, wing count, `crossingCount`.

Line **3** is visible without interaction. Lines **1, 2, 4** sit behind an info affordance
beside the title (LIM27 · E24). There is no Compact-mode subset.

`{oiAsOf}` is `LimResult.oiAsOf`. When it is `null`, line 3 renders as
`Open interest as-of date unavailable. Today's trading is not in it.` — it is never omitted and
never silently dated to today.

> **E6.** Line 3 is the same-day-expiry landmine. GEX is `Γ·OI·S²` and OI settles T+1, so on a 0DTE
> session the structure shown is last night's book. Without that sentence LIM inherits the retail
> GEX misreading on a better surface.

---

## Appendix C — errata index (E1–E24)

A hash of this document without this list is not an errata record.

| # | Introduced | Change |
|---|---|---|
| E1 | v0.4.1 | `leanRaw` defined before the clamp; `xUnclamped = leanRaw` (LIM7). Without it AT-LIM13 passes while testing nothing |
| E2 | v0.4.1 | `confidence` → `crossingProximity`. What is computed is a distance to an interval, not a judgement about the model |
| E3 | v0.4.1 | Opacity is not the shelf-life channel. Full-opacity dot, ring plus numeric chip (LIM24) |
| E4 | v0.4.1 | Y payload field `friction` → `nearSpotMix`. *Friction / muddy / slippery* stay off the axis until tape-tested (§15.3) |
| E5 | v0.4.1 | §1 restated: the question is asked in the book's terms; the differentiator is publishing the factors, not substituting a second metaphor |
| E6 | v0.4.1 | OI as-of and the same-day-expiry sentence added to chrome (LIM27, Appendix B) |
| E7 | v0.4.1 | Registry display label carries neither *intent* nor *friction* (LIM35) |
| **E8** | **v0.4.2** | `yUnclamped` removed and the Y clamp removed. Y is a convex combination of `[0,100]` terms, so it cannot leave `[0,100]`; the bound becomes AT-LIM26 and the weight sum becomes AT-LIM17b (LIM38) |
| **E9** | **v0.4.2** | Y floors ship at `0`/`100` so the labelled axis is the achievable axis. Keys retained; retune is config, not code (LIM39, D17, OD-LIM8) |
| **E10** | **v0.4.2** | Canonical key set fixed in Appendix A. `LIM_CONF_*` retired; AT-LIM28 enforces |
| **E11** | **v0.4.2** | Compact surface keeps the proximity ring; it drops the chip, not the channel (LIM31). **SUPERSEDED E18 / E21** |
| **E18** | **v0.4.4** | Ring deleted. `limRingRadius` gone. Proximity is the numeric chip only (LIM24) |
| **E19** | **v0.4.4** | `LIM_DISC_R_PT` raised so the disc reads on a dark cell without dominating it (LIM24) |
| **E20** | **v0.4.4** | Responsive fit: no `minHeight: min(w,h)`; quadrant and companion GEX both fully visible (§7.6) |
| **E21** | **v0.4.4** | No density toggle. Density is ResizeObserver breakpoint behaviour (LIM31). AT-LIM24 is a width render |
| **E22** | **v0.4.4** | Four cells outlined; crosshairs and ticks high-contrast; tick labels in gutters outside the plot (LIM23) |
| **E23** | **v0.4.4** | Cell labels in the book's terms. LIM36 reversed. OD-LIM7 closed. MSC outcome names stay banned in AT-LIM23 |
| **E24** | **v0.4.4** | Appendix B verbatim. Line 3 visible; lines 1, 2, 4 behind title info (LIM27) |
| **E25** | **v0.4.5** | Disc scales with the plane: ~18–22 px radius at 1440, floor on narrow. E19's 9pt superseded (LIM24 · LIM32) |
| **E26** | **v0.4.5** | **Withdrawn.** Size taper drafted then refused. LIM21: uniform size, opacity by age. Ghosts are circles matching the disc; 6px squares were the defect |
| **E27** | **v0.4.6** | `valid: false` must not render as a live centre reading. Named refusal. AT-LIM33. LIM26 inverted |
| **E12** | **v0.4.2** | §2 corrected — `AGENTS.md:26` IKI-only gate applies. Three successive OKs recorded on the GO token before the first edit |
| **E13** | **v0.4.2** | Trail buffer clears on session open, expiration change and symbol change (LIM21, AT-LIM25) |
| **E14** | **v0.4.2** | Registry ships `lim` only; no reserved switcher entry for an unbuilt mode (LIM37, AT-LIM27) |
| **E15** | **v0.4.3** | `crossingProximity` was dead as written — `d` a fraction against percent keys, pegging the channel at 0 for every book. `dPct = dist / spot × 100` (LIM16). Guarded by **AT-LIM29**, which requires a strictly interior value; the two clamp endpoints do not test the map |
| **E16** | **v0.4.3** | `steepness = |netAfter − netBefore| / (hi − lo)`, not `/ ctx.strikeStep`. They differ whenever LIM12 skips a zero-net strike, and the wrong denominator fabricates a cliff (LIM13, AT-LIM30) |
| **E17** | **v0.4.3** | `spotBelowNearestCrossing = spot < lo`; inside the interval is `false`, and `distanceToCrossing = 0` is what marks inside. A boolean cannot carry three positions (LIM18, AT-LIM31) |

---

## 17. Document control

| Version | Date | Notes |
|---|---|---|
| v0.1–0.3 | 2026-09-01 | Draft evolution; X = lean (D12), ghost trail (D14), colour as identity (D13) |
| v0.4 | 2026-09-01 | DG removed · confidence channel replaces the haircut (D15) · crossings as intervals (D16) · factors published · transition off · config boot-safe |
| v0.4.1 | 2026-09-01 | Errata pass E1–E7, geometry unchanged. LIM36 no cell names in v1 |
| v0.4.2 | 2026-09-02 | Second errata pass E8–E14, geometry unchanged. Y clamp and `yUnclamped` removed as dead by construction · floors to 0/100 · canonical key appendix · Compact keeps the ring · IKI gate acknowledged · trail resets on expiration and symbol · registry ships one mode. Appendices A/B/C added |
| **v0.4.3** | **2026-09-02** | **Third errata pass E15–E17, geometry unchanged.** All three are authoring defects in the formulas, found by Hotel's eight hand-computed goldens before any code existed: `crossingProximity` unit mismatch (dead channel) · `steepness` denominator · `spotBelowNearestCrossing` inside case. AT-LIM29–32 added. OD-LIM10 (`magF` must reach the reader) and caveat 7. OD-LIM9 corrected — there is no `v0_2_1` parent file. **No law created.** **SUPERSEDED by v0.4.4.** |
| **v0.4.4** | **2026-09-02** | **LIM7 surface fit and legibility (S1–S8).** Compute unchanged. Chrome/plane law: ring gone (E18) · disc larger (E19) · responsive fit (E20) · no density toggle (E21) · cells outlined + tick gutters (E22) · book-term cell labels, OD-LIM7 closed (E23) · Appendix B placement (E24). AT-LIM22 and AT-LIM24 rewritten; AT-LIM23 grep extended, no words dropped. **SUPERSEDED by v0.4.5.** |
| **v0.4.5** | **2026-09-02** | **D3 / D4.** Disc scales (~18–22 px at 1440, floor on narrow) · **E25**. Ghosts are same-size circles, opacity by age · LIM21 restated · **E26 withdrawn**. Interval 30 s unchanged. **SUPERSEDED by v0.4.6.** |
| **v0.4.6** | **2026-09-02** | **LIM8 D1b / E27.** A scale miss (`valid: false`) is a named refusal, not a live `(0, 50)` reading. AT-LIM33. Header gated on `valid`. Env key for Heatmap is `SPX` (D1a), not `I:SPX`. No prefix normalisation. **SUPERSEDED by v0.4.7.** |
| **v0.4.7** | **2026-09-02** | **LIM9 diagram.** In-plane copy gone (LIM36). Four large coloured edge labels (LIM23) with polarity DL note. Disc sphere (LIM24). Ghosts 50%→0, flat (LIM21). Companion GEX colour only in the LIM4 link; frozen SHA1 empty. Scale map may list `SPX` and `I:SPX`. |

---

## 18. Prior claims withdrawn

**§2, v0.4.1 — *"DL-539 does not gate this."*** Withdrawn. The §8 five-module allowlist does not
apply — LIM touches no file in it — but `AGENTS.md:26` and `:227` do, and a spec that reads the
convenient half of a decision and stops is the failure Invariant 4 exists to prevent. The gate is
three recorded OKs on the GO token, and it is Coach's to give.

**§14, v0.4.2 — the parent named as `v0.2.1`.** Withdrawn. No such file exists. The candidates are
`Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md` (header: *current revision v0.2.3,
filename remains …-v0_2.md*) and `…-Spec-v0_3.md`. OD-LIM9 names one **by filename**, because a
revision string that appears in no filename is how an amendment gets written against a parent that
does not exist.

**LIM13 and LIM16, v0.4.2 — the two formulas.** Withdrawn and replaced (E15, E16). Both were wrong
in this document from v0.4 onward and survived two review passes, Grok's and mine, because a
formula reads as correct until someone puts numbers through it. Hotel put numbers through it.

> **Why this pass exists.** LIM0-2 required eight goldens computed **by hand, before `lim.ts`
> existed**. A golden computed by the implementation would have agreed with the implementation and
> both would have been wrong together — `crossingProximity` would have shipped as a constant, and
> the first person to notice would have been a member wondering why the ring never changes.
> Invariant 4 is not a formality. It found three defects at a cost of one afternoon.
