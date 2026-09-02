# LIM0-3 — Echo IA: quadrant plane

**Agent:** Echo  
**Status:** IA packet (no code)  
**Feeds:** LIM0-G · OD-LIM2 · LIM3-0 · LIM3-1 · LIM4-0  
**Law:** Spec v0.4.2 §3, §7.3–7.5, LIM23–36, E3, E11 · plan v1.1 §6.4 · HI Spec v1.0 §2.1, §4.4, §6, §9  
**Out of scope:** code · cell names · friction-axis skin · red/green · GO token

This packet is Charlie’s drawing instruction for the LIM quadrant. Geometry and channels are Spec law. Craft below is Echo. Opinions are labelled **OPINION**.

---

## 0. One-second read

The plane answers Spec §1 without a metaphor:

> Where is this expiration’s GEX mass relative to spot, and what is the near-spot mix?

| Channel | Carries | Never carries |
|---------|---------|---------------|
| **Dot position** | `x = lean`, `y = nearSpotMix` (LIM17) | proximity, valence, confidence |
| **Dot colour + edge glow** | identity of the mark (LIM25) | sign of lean, good/bad |
| **Ring (+ chip in Comfort)** | `crossingProximity` — shelf life, a distance (LIM24 · E3) | opacity of the dot |
| **Trail (Comfort)** | prior states; opacity-by-age is *this* channel (LIM21) | shelf life |
| **Spot line on companion GEX** | the same identity object as the dot (LIM28–29) | “the bar that caused lean” |

Content is the hero. Chrome recedes. No filled primary CTA on this surface — it is observation.

---

## 1. Plane — crosshairs, mapping, empty centre

### 1.1 Mapping (LIM23 · plan §6.4)

```
dotX = ((x + 100) / 200) × W
dotY = ((100 − y) / 100) × H
```

| Value | Lands |
|-------|--------|
| `x = −100` | left edge |
| `x = 0` | horizontal centre |
| `x = +100` | right edge |
| `y = 100` | top |
| `y = 50` | vertical centre |
| `y = 0` | bottom |

Y is inverted in screen space so high mix is up. Do not flip it.

Unclamped X may plot **past** the left/right edge (trail ghosts, LIM33). The **live** dot is clamped to the plane by `x` (lean), not by a CSS overflow clip of the mark’s identity. Ghosts may leave; the live disc stays on-plane.

### 1.2 Crosshairs (LIM23)

Two hairlines, always on, including empty / never-hydrated / Compact:

- **Vertical** at `x = 0` (lean origin).
- **Horizontal** at `y = 50` (mix origin).

They meet at dead centre. That intersection is the empty-state home, not a target and not a cell.

Stroke: local `--lim-crosshair` (hairline, receding). Not identity blue. Not tint. Not success/destructive. Crosshairs are furniture; the mark is the object.

No third hairline at `spot + centrePts` on the **quadrant** — that annotation belongs on the companion profile, behind `LIM_SHOW_ANNOTATIONS`, default off (LIM30).

### 1.3 Empty / never-hydrated / `Σ|net|==0` / `valid: false` (LIM26)

All four sit **dead centre** (`x = 0, y = 50`), **full opacity**, identity blue, edge glow on.

| State | Plane | Forbidden |
|-------|--------|-----------|
| Never-hydrated (AT-LIM10) | Centre, full opacity | Bottom-centre (MSC). Spinner *as* the mark. Faded placeholder disc. |
| Empty book / `Σ\|net\|==0` | Centre, full opacity; `crossingProximity = 1` so the ring is at its **minimum** (far from any crossing — there is none) | A “no data” hole in the plane. A grey dead mark. |
| `valid: false` (symbol off the scale map) | Same centre, same identity, same full opacity | Recolour to destructive. Hide the plane. Invent a pole. |

Named holes live in **chrome** (Tango · Appendix B / JR3). The plane does not impersonate an error by dimming or reddening the mark.

**LIM26 and E3 agree:** empty is not “low confidence.” Opacity is not a validity channel.

### 1.4 Axes — labelled, not celled (LIM36)

Axes have names and numeric poles. **No quadrant cell names in v1** — see §6.

| Axis | Label (member) | Left / bottom | Origin | Right / top |
|------|----------------|---------------|--------|-------------|
| **X** | Lean | −100 · mass below spot | 0 | +100 · mass above spot |
| **Y** | Near-spot mix | 0 | 50 | 100 |

Poles stay in the **book’s** terms (LIM11). Do not write *friction*, *muddy*, *slippery*, *intent*, *wall*, *magnet*, *pin*, *gravity*, *hostile*, *support*, *resistance* on the plane (AT-LIM23).

Tick set: `−100 · 0 · +100` on X, `0 · 50 · 100` on Y. Caption1 / footnote type. Tabular nums. Sentence case. No ALL CAPS axis titles.

**OPINION:** X captions “below spot” / “above spot” beat “put” / “call”. Lean is mass relative to spot, not a side.

---

## 2. Identity colour — one blue + edge glow (LIM25 · D13)

Colour is **who the mark is**, not what lean signed, not whether the book is “good.”

Horizontal position already states lean. A second valence channel (red/green, debit/credit, success/destructive) is redundant, asserts good/bad before anything is read, and is the worst pair for colour-vision deficiency.

### 2.1 Token (domain-local, not brand tint)

Scope to the LIM surface (`[data-lim-plane]` and the companion spot line **only when LIM is selected**). Do **not** bind identity to `--color-tint`: default tint is emerald and appearance can re-tint it. Do **not** use heatmap debit/credit reds/blues as LIM identity.

```css
/* LIM domain skin — identity, not valence. Scoped. Not a second kit. */
[data-lim-plane],
[data-lim-spot-line] {
  --lim-identity: #0a84ff;              /* Apple system blue on the dark heatmap ground */
  --lim-identity-glow: rgba(10, 132, 255, 0.55);
  --lim-identity-ring: var(--lim-identity);
  --lim-crosshair: rgba(255, 255, 255, 0.22);
  --lim-chip-fill: var(--color-surface-inverse);
  --lim-chip-label: var(--color-on-inverse);
}
```

Hex lives **once**, in that scoped block — HI Spec §4.1 domain-skin exception. Feature JSX references the variables, never raw `sky-500` / `emerald-*` / `red-*`.

The live heatmap work-surface is already dark (`#0a0a0e` on matrix/profile). LIM stays on that instrument ground so a template switch is not a theme jump. Identity blue is chosen for **that** ground.

Frozen `gex` template, when LIM is **not** selected: **unchanged**. No LIM glow leaks onto the GEX-alone spot row (LIM4-0).

### 2.2 The mark

- Disc fill: `--lim-identity` at **opacity 1 always** (AT-LIM21).
- Edge glow: a **static** outer glow using `--lim-identity-glow`. Same recipe on the companion spot line (LIM28).
- **No pulse, no breathe, no proximity-driven glow intensity.** A pulse would read as an alert (valence) the moment a crossing nears — the failure E3 exists to prevent, in a different channel.
- `prefers-reduced-motion: reduce`: no motion on the glow; ring radius snaps (data), no spring.

### 2.3 Forbidden palettes

| Forbidden | Why |
|-----------|-----|
| Red / green by sign of `x` | Valence. CVD. D13. |
| `--color-success` / `--color-destructive` | Process-status tokens, not a book reading. |
| Fading the disc as `crossingProximity → 0` | E3. Dims the object when the member should look at it. Reuses the trail’s channel. Contradicts LIM26. |
| Grey / tertiary disc for empty | Empty is centre, not “off.” |
| Brand emerald as the mark | Tint is interactive chrome, and it is not the specified blue. |

---

## 3. Ring + chip for `crossingProximity` — never opacity (LIM24 · E3)

Proximity is a **distance channel**. It never moves the dot (LIM17). It never fades the dot (E3 · AT-LIM21).

`1` = far from any crossing. `0` = at or inside one. No `nearestCrossing` → `1`.

### 3.1 Ring (Comfort **and** Compact)

Radius scales with `1 − crossingProximity` (plan §6.4).

| `crossingProximity` | Optical ring |
|---------------------|--------------|
| `1` (far / none) | **Minimum halo** — disc + 4pt offset. Still in the tree. Still a ring. |
| `0` (at / inside) | **Maximum** — about 28–36% of `min(W, H)`, never the plane edge. |

Linear interpolation between those stops. Stroke: `--lim-identity-ring`. Fill of the ring: none (stroke only). Ring opacity is **not** the shelf-life channel; size is. Do not fade the ring to hide it in Compact.

**Always mounted** whenever the plane is shown, including Compact and including `proximity = 1`. Compact without the ring is a silent D15 violation (E11): shelf life was taken off position on the promise it would get its own channel.

### 3.2 Chip (Comfort only)

- Numeric, tabular, caption/footnote.
- Shows `crossingProximity` as a **0–1** figure (two decimals). Not a percent. Not a word.
- Must not say *confidence* (E2). Accessible name: “crossing proximity” (Tango may refine the spoken name; Echo forbids *confidence* / *intent* / *friction*).
- Placement: adjacent to the disc, opposite the densest trail cluster when possible; never a button; never a 44pt target (it is not interactive).
- **Compact drops the chip.** The ring remains the channel.

### 3.3 Not opacity

| Channel | Opacity allowed? |
|---------|------------------|
| Live disc | **Never.** Full opacity always. |
| Ring stroke | Static; size carries proximity. |
| Trail ghosts | **Yes** — opacity by age is LIM21. Do not reuse it for proximity. |
| Chip | Opaque Comfort chrome. Absent in Compact. |

---

## 4. Compact vs Comfort density (LIM31 · E11 · L16)

Default density: **Comfort**. Compact is a named dialect of the same plane, not a second template and not a second `ValueModeId`.

### 4.1 Budget

| Element | Comfort | Compact | Law |
|---------|---------|---------|-----|
| Crosshairs at 0 / 50 | yes | yes | LIM23 |
| Identity-blue disc, full opacity, edge glow | yes | yes | LIM25–26 |
| **Proximity ring** | yes | **MUST yes** | E11 · AT-LIM24 |
| Numeric proximity chip | yes | **no** | E11 |
| Ghost trail | yes | **no** | LIM31 |
| Profile annotations (COG hairline, interval ticks) | default off; flag may show | **never** | LIM30–31 |
| Study readout / factor inspector | Comfort study layer (LIM32) | **no** | LIM31 “no readout” |
| State line: expiration, wing count | yes | yes | LIM31 |
| State line: `crossingCount` | yes | **no** | Compact list is exp + wings only |
| Chrome lines 1–4 (Appendix B) | all four | **1 and 3 only** | LIM31 · Appendix B |
| Companion GEX profile (same generation) | yes | yes | JR2 — composition, not a Compact drop |
| Spot-line identity glow | yes | yes | LIM28–29 — identity, not annotation |

The ring is the one element Compact cannot drop. The **chip** is the text; text is what Compact drops. Trail and annotations are the study layer (LIM32); Compact is the one-second read: disc + ring.

### 4.2 Why this is comfortable

Comfort is the desk: position, shelf-life number, recent path, four honesty lines, companion “where.” Compact is the glance: **where the mark sits, and whether the reading is about to stale.** Removing the ring in Compact would show a position whose staleness had been silently deleted — the state D15 refused.

Compact is allowed to feel dense. It is not allowed to feel incomplete.

### 4.3 Control (HIG)

- Primitive: kit `SegmentedControl`, two segments, sentence case: **Comfort** · **Compact**.
- Hit target: **≥ 44×44 pt per segment** (`--hit-min`, HI Spec §4.4 · §6.1 · §9.6).
- Region: LIM panel header **trailing**, secondary. No filled primary on this strip.
- Accessible name: “LIM density.”
- Default: Comfort.
- Narrow viewport: **auto Compact** below the panel’s usable width for a labelled plane (Echo floor: when the quadrant cannot keep axis captions without collision). The control remains visible so the member can force Comfort.

Do not invent a mystery-icon density toggle. Do not emoji. Do not a third density.

---

## 5. Picker label (LIM35 · OD-LIM2 · §3)

**Law.** Registry `label` ships the placeholder until Coach stamps a final name:

```text
GEX lean (window)
```

- Code id remains `"lim"` — not member-facing.
- Inner `valueModes[0].label` stays `"Lean / near-spot mix"` (Spec §3). LIM has one mode; the panel already hides the mode subtitle when `valueModes.length === 1`. Do not add a second mode to surface a nicer name (E14).
- The picker carries **neither** *intent* nor *friction* (LIM35 · E7).
- *Liquidity-Intent* does not survive.

AT-LIM23 applies to this string: no *wall, magnet, pin, gravity, intent, hostile, support, resistance, friction, muddy, slippery*.

**Echo recommendation (ship):** keep **`GEX lean (window)`** as the v1 member name. It is already the honest sentence: GEX (input), lean (X), window (LIM5 / GP7). The plane teaches Y. The strip does not need both axes.

**OPINION (not law):** if Coach wants both axes in the switcher, the only acceptable lengthening is `GEX lean / mix (window)`. Still neither *intent* nor *friction*. Do not shorten to `GEX lean` (drops the window caveat the chrome then has to carry alone on Compact, where line 2 is already dropped). Do not ship `Friction map`, `Intent`, `Liquidity`, or any cell-name.

Tango owns chrome lines verbatim; Echo owns this picker string. Final stamp is Coach at OD-LIM2 / LIM0-0.

---

## 6. No quadrant cell names in v1 (LIM36 · OD-LIM7)

The quadrant ships with **labelled axes** and **no cell names**.

Do not draw, hint, or aria-label:

- *Pin*
- *Air-Pocket*
- *Downside Acceleration*
- *muddy / slippery* as a region
- Q1–Q4 titles
- “upper-right means …” as on-plane copy

Those are outcome claims, or they are the held friction skin pending §15.3. Names are added after the tape sitting, **or not at all** (OD-LIM7). Echo does not propose v1 cell names.

The reading is the **position**. Axes are enough.

---

## 7. Companion GEX profile — spot line is the glow target (LIM28–29 · JR2)

LIM **composes** the quadrant with a companion GEX profile of the **same** `buildGexProfile(ctx, "gex_net")` generation so LIM28 has a spot line to colour. It does not steal the frozen `gex` switcher entry.

### 7.1 What glows

**The spot line** — continuous **price**, not a `strikeStep` bucket.

Same `--lim-identity`, same `--lim-identity-glow`, so dot and spot line read as **one object**.

Spot is the anchor because every LIM term is computed relative to spot, while the reading comes from the **whole** distribution. Highlighting one concentration bar would imply a causation the model does not claim (LIM28). Spot also glides; a strike row jumps.

### 7.2 What does not glow

| Not the glow target | Why |
|---------------------|-----|
| Peak / concentration bar | Implies “this bar caused lean.” LIM29 forbids a second glow. Plan §6.5. |
| `GexProfilePoint.isSpot` strike row | That is a **listed strike** nearest spot, not spot. Today’s GEX-alone amber row is a bucket highlight. LIM must not reuse it as the identity object. |
| Crossing interval ticks | Annotations, default off (LIM30). Not a glow. |
| COG hairline at `spot + centrePts` | Annotation, default off. Honest link to X, not the identity signature. |

**LIM29 — one glow relationship.** Only the disc and the spot line glow. A signature works only while it is rare.

### 7.3 Composition

```
Comfort / Compact (wide)
┌─────────────────────────┬──────────────────────┐
│  Quadrant (hero)        │  Companion GEX       │
│  crosshairs 0 / 50      │  same generation     │
│  disc + ring (+ chip)   │  SPOT LINE = glow    │
│  trail if Comfort       │  bars: ordinary      │
└─────────────────────────┴──────────────────────┘
chrome under both
```

Narrow: stack quadrant above companion. Companion may shrink; it does not disappear in Compact.

Default annotations: **off**. Never spot-glow **and** COG **and** crossing ticks at once by default (LIM31). Compact: none of the annotations, glow remains.

When the member switches back to the frozen `gex` template: LIM identity glow **off**. GEX-alone look is byte-stable (LIM4-0).

---

## 8. HIG — interactive targets ≥ 44 pt

HI Spec: hit target **44×44 pt** (`--hit-min: 2.75rem`) for every interactive control. Padding may expand a smaller glyph; the hit area may not shrink.

| Control | Primitive | Target |
|---------|-----------|--------|
| Heatmap template picker (gains `GEX lean (window)`) | existing `Select` in `HeatmapControlsColumn` | keep / restore **min 44×44** (`data-testid="heatmap-template"`) |
| Comfort / Compact | kit `SegmentedControl` | **≥ 44×44 per segment** |
| LIM value-mode | none in v1 (one mode) | — |
| Disc, ring, chip, trail, axes | not interactive in v1 | not hit targets |
| Profile annotations | not member-toggled in v1 (`LIM_SHOW_TRANSITION` / `LIM_SHOW_ANNOTATIONS` stay config, no chrome — JR5) | no extra control |

No mystery icon. No emoji chrome. Visible `:focus-visible` on the density control. Keyboard: segmented control is the kit’s. WCAG AA on identity blue vs the dark ground for the **chip text** and axis labels; the disc is a position mark, not text — do not rely on colour alone for proximity (ring **size** is the non-colour channel).

Existing heatmap chrome (e.g. Center spot at `min-h-9`) is **out of this packet**. DL-539: do not restyle sibling templates to “fix” 44pt while landing LIM.

---

## 9. States (plane)

| State | Disc | Ring | Chip | Trail | Glow |
|-------|------|------|------|-------|------|
| Live, far from crossing | centre-mapped, opacity 1 | min halo | Comfort: `~1.00` | Comfort: ghosts | on |
| Live, inside crossing | **same opacity**, **unmoved** | max | Comfort: `0.00` | Comfort | on |
| Empty / `Σ\|net\|==0` | dead centre, opacity 1 | min halo | Comfort: `1.00` | empty | on |
| Never-hydrated | dead centre, opacity 1 | min halo | Comfort: `1.00` or chip omitted until first result — **OPINION:** keep chip at `1.00` so Comfort layout does not jump | empty | on |
| `valid: false` | dead centre, opacity 1 | min halo | Comfort: still 0–1, not an error colour | empty | on |
| Compact, any of the above | as above | **present** | absent | absent | on |
| Reduced motion | snap | snap radius | static | plot, no fade animation | static, no pulse |

Hover on the plane: no extra essential fact that Compact would then hide. Study numbers (factors) are Comfort readout / help, not a hover-only tooltip that is the only carrier of shelf life.

---

## 10. ASCII — Comfort vs Compact

**Comfort**

```
┌─ GEX lean (window) ──────────────── [ Comfort | Compact ] ─┐
│  100  near-spot mix                                        │
│   │                         ◯  ← ring (size = 1−proximity) │
│   │                        (●) ← identity blue, opacity 1  │
│   50 ───────────+──────────  · chip 0.00–1.00              │
│   │             │            · ghosts (opacity by age)     │
│   0                                                        │
│     −100        0        +100   lean                       │
│     below               above                              │
│                            │ companion GEX: spot LINE glows│
│                            │ bars do not                   │
├────────────────────────────────────────────────────────────┤
│ exp · wings · crossings                                    │
│ 1 Chain GEX (estimate). Dealer sign is assumed, not observed.│
│ 2 Window read — mass outside the wings is not counted.     │
│ 3 Open interest as of {oiAsOf}. Today's trading is not in it.│
│ 4 The near-spot mix is a blend of measured factors. …      │
└────────────────────────────────────────────────────────────┘
```

**Compact** (ring kept)

```
┌─ GEX lean (window) ──────────────── [ Comfort | Compact ] ─┐
│  100                                                       │
│   │                         ◯  ← RING STAYS                │
│   50 ───────────+──────────(●)  no chip, no trail          │
│   0                                                        │
│     −100        0        +100                              │
│                            │ companion GEX, spot LINE glow │
├────────────────────────────────────────────────────────────┤
│ exp · wings                                                │
│ 1 Chain GEX (estimate). Dealer sign is assumed, not observed.│
│ 3 Open interest as of {oiAsOf}. Today's trading is not in it.│
└────────────────────────────────────────────────────────────┘
```

No cell names in either.

---

## 11. Charlie handoff (LIM3 / LIM4)

| Seed | Draw this |
|------|-----------|
| **LIM3-0** | Plane, mapping, crosshairs 0/50, empty/never-hydrated = centre full opacity, identity blue + static edge glow. No cell names. |
| **LIM3-1** | Registry label placeholder `GEX lean (window)`. `layout === "quadrant"` branch. Ring on Comfort **and** Compact. Chip Comfort-only. Compact budget §4.1. Density `SegmentedControl` ≥44pt. |
| **LIM4-0** | Companion profile, same generation. Glow the **spot line** (price), not a concentration bar, not `isSpot` strike row. One glow relationship. Frozen GEX unchanged when LIM is not selected. |

Do not start `lim.ts` from this packet. Do not stamp the GO token.

---

## 12. Bench delta

The next LIM UI pass (LIM3-0) can draw the plane without inventing a valence palette, a Compact-without-ring, a cell-named quadrant, or a concentration-bar glow. Identity tokens, density budget, picker placeholder, and 44pt control grammar are on disk.

---

**LIM0-3 done.** Colour is identity. No cell names. Compact keeps the ring; chip, trail, and annotations drop. Picker placeholder `GEX lean (window)` until Coach stamps OD-LIM2.
