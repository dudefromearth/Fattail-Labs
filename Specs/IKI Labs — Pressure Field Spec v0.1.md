# IKI Labs — Pressure Field Spec v0.1

**Status:** **DRAFT** — not build authority. Gates at **GX0**.
**Date:** 2026-09-01
**Canonical filename:** `Specs/IKI-Labs-Pressure-Field-Spec-v0_1.md`
**Component id:** `pressure-field` · **Layout:** `matrix` (time columns) · **Plane:** `gex_session_bucket`
**Parent:** [`IKI-Labs-GEX-Toolset-Foundation-Spec-v0_1.md`](./IKI-Labs-GEX-Toolset-Foundation-Spec-v0_1.md)
— GXF law is not restated here.

**Duplicates:** SpotGamma TRACE gamma heatmap with candles.

---

## 1. Purpose

**The question it answers:** *was the structure the Profile showed this morning still there when
price arrived at it?*

This is the family's **falsification** tool. The Profile makes a claim about a strike; the Field
shows whether that claim survived the session. Coach's framing states the point better than a
requirements sentence can: *"0DTE books rot. A morning wall that is gone by lunch is not a wall."*

**The question it does not answer:** whether the structure caused anything that happened
(**GXF36**, and see **PF9** — this tool is the family's largest exposure to that failure).

---

## 2. Component declaration

```ts
{
  id: "pressure-field",
  runner_template_id: "pressure-field",
  layout: "matrix",                                   // time on X, strike on Y
  dataPlane: { id: "gex_session_bucket", required: true },
  analyzer_handoff: false,
  lenses: ["oi", "flow"],
  models: ["gamma"],                                  // delta / charm gated — PF7, PF8
}
```

---

## 3. Inputs and resolution honesty

Plane: `gex_session_bucket` — Γ per bucket, OI per session, per-bucket spot track (**GXF25**,
`svp_v1`). Underlying stream for candles.

**PF1 — render at the resolution the data has, not the resolution the frame rate suggests.**

| | Live tail | Back-select |
|---|---|---|
| Cadence | median **~2.4 s** | artifact clock **1 minute** |
| Worst observed gap | **54.7 s** — inside a 60 s bucket, a bucket can hold one frame or none | same |
| Scope | live band | **band(15 or 25 wings)**, varying *within* a morning |
| Expiries | as configured | **0DTE only** — the archive has no other |
| Sessions | — | **12 trading days**; **08-21 is not `complete`** (7,862 s of gaps) |

Painting a 2-second field over history paints resolution the disk does not have. The **stored**
grain is the bucket; the live tail may render finer, and when it does, the surface says which
region is which (**AT-PF1**).

---

## 4. Transforms

1. **Bucket time** to `GexPolicy.bucket_seconds` (default 60 s).
2. **Per bucket, per strike:** take the **last** frame's value in the bucket. Median is an option
   for noisy books and is a **declared** choice, because the two answer different questions —
   `bucket_agg` is in the payload and on the strip (**PF2**).
3. **Strike grid:** session low − pad … session high + pad, using **listed strikes only** — never a
   synthetic mesh (**PF3**).
4. **Cell** `(t, strike)` = net GEX at that strike under the active lens and DTE mode.
5. **Candles** from the underlying stream on the same clock as the grid (**GXF12** join).
6. **Live level overlay:** sign changes and peaks from the **latest** bucket's Profile — not
   frozen from the open unless the member explicitly locks them (**PF5**).
7. **Append-only commit.** Past columns are never rewritten (**PF4**).

---

## 5. Tool law

| # | Law |
|---|---|
| **PF1** | **Resolution honesty.** The rendered grain never exceeds the stored grain. Live-tail and archive regions are visually distinguishable and named on the strip |
| **PF2** | **`bucket_agg` is declared.** `last` and `median` produce different pictures of the same session; whichever is active is in the payload and on the surface |
| **PF3** | **Listed strikes only.** A synthetic mesh manufactures structure at prices that do not trade |
| **PF4** | **Append-only history.** A past column is never rewritten when a model, config or lens changes. A re-computation writes a new series under a new `algo_version`; it does not silently restate yesterday. This is the tool's core honesty property and the reason it can falsify anything |
| **PF5** | **Levels are live unless locked, and a locked level is labelled with its as-of time.** A morning level drawn over the afternoon without its timestamp is the exact misreading the tool exists to expose |
| **PF6** | **A strike that entered the band mid-session is blank before `first_seen_at`, not zero.** The band varies within a morning (`AN-V7`, **SV66**). On a field this is highly visible: rows appear part-way across. They render as **absent data**, never as a region of no gamma (**GXF33**) |
| **PF7** | **Delta and charm lenses ship only if computed, never approximated silently.** If the frame does not carry the greek, the lens is **absent from the control set** rather than present and empty |
| **PF8** | **A finite-difference charm carries a `dt` bound.** `charm ≈ (Δ_t − Δ_{t−dt}) / dt` over a 54.7 s gap is a different estimate than over 2 s. Beyond `max_charm_dt` the cell is **invalid**, not stretched |
| **PF9** | **No regime names on the field.** The colour legend states **sign and units** — *"positive: $X notional per 1 % move"*. It does **not** say damping, amplifying, suppression, expansion, or any variant. A two-colour field behind candles, captioned with a behavioural claim, **is** the mechanism → outcome step regardless of what the tooltip adds (**GXF36**). This is the single most likely way this tool teaches something untrue |
| **PF10** | **Gaps are gaps.** A bucket with no frames renders as absent — never interpolated from its neighbours, never carried forward silently. A session with `complete: false` renders marked, with the reason on the strip (**GXF32**, **OD-GXF8**) |
| **PF11** | **Candles and cells share one clock.** The candle interval is the bucket interval, or a stated multiple of it. Two clocks on one chart is a lie with an axis |
| **PF12** | **The forward view, if built, is a residual book — not a forecast.** Recomputing the current frame with the expiring book excluded shows *what remains after today's expiry*. It is labelled as that. It is not "tomorrow" and carries no time projection (**OD-PF3**) |

---

## 6. Output contract

```json
{
  "component": { "id": "pressure-field", "version": "0.1.0" },
  "symbol": "SPX", "session_date": "2026-09-01",
  "lens": "oi", "model": "gamma",
  "bucket_seconds": 60, "bucket_agg": "last",
  "t_buckets": [0],
  "strikes": [0],
  "grid": [[0.0]],
  "valid": [[true]],
  "region": [["archive"]],
  "candles": [ { "t": 0, "o": 0, "h": 0, "l": 0, "c": 0 } ],
  "live_levels": {
    "as_of": 0, "locked": false,
    "sign_changes": [ { "px": 0, "strike_lo": 0, "strike_hi": 0 } ],
    "peak_abs": { "strike": 0, "gex": 0 }
  },
  "coverage": { }
}
```

`grid` and `valid` are parallel. A cell is **never** zero to mean absent — `valid[i][j] = false`
carries that (**GXF33**).

---

## 7. Visual

Full-width heatmap; X session clock, Y price/strike; candles drawn over. Diverging palette for
signed GEX with a neutral zero; **sequential** under the flow lens (unsigned — **GXF11**). Legend
in **$ notional per 1 % move**, with the sign and the convention stated (**PF9**, **GXF10**).

Absent cells render as ground, visually distinct from a near-zero cell — the reader must be able to
tell *no data* from *no gamma* at a glance, which is the whole of **GXF33** applied to a surface
where absence is common.

Live-tail region marked where it differs in grain from the archive region. Coverage strip
persistent, carrying `bucket_agg`, scope, `wings_seen`, gap count, session completeness and
`oi_asof`.

---

## 8. Controls

| Control | Default | Notes |
|---|---|---|
| Lens | `oi` | `flow` → sequential palette, no signed marks |
| Model | `gamma` | delta / charm **absent** unless computed (**PF7**) |
| DTE mode | `0DTE` | archive back-select is 0DTE-only (**PF1**) |
| Bucket | 60 s | display grain; never below stored grain |
| `bucket_agg` | `last` | declared on the strip (**PF2**) |
| Candle interval | = bucket | or a stated multiple (**PF11**) |
| Lock history | on | append-only is not optional; this control locks *level overlays*, not the grid (**PF4**, **PF5**) |
| Level overlay | on, live | locking stamps an as-of time |
| Session back-select | today | horizon from the catalog — **never a hardcoded "two weeks"** |
| Residual book view | off | **PF12**, staged (**OD-PF3**) |

---

## 9. Acceptance tests

| ID | Test |
|---|---|
| **AT-PF1** | Rendered grain never exceeds stored grain; a back-selected session renders at the artifact clock and the surface names the region |
| **AT-PF2** | Changing lens, model or bucket **re-renders from the resolved plane with zero additional reads** (cached — HM21f) |
| **AT-PF3** | A config or model change does **not** rewrite past columns; a recomputation lands under a new `algo_version` alongside, not over (**PF4**) |
| **AT-PF4** | A strike entering the band at 11:00 renders **absent** for every bucket before `first_seen_at` — no zero-valued cells, and no burst at first sighting |
| **AT-PF5** | An injected gap renders absent cells; **no interpolation and no carry-forward** occurs across it |
| **AT-PF6** | 08-21 fixture (459 gaps / 7,862 s) → session marked **not complete**, reason on the strip, and the field still renders |
| **AT-PF7** | Charm lens with `dt > max_charm_dt` → invalid cells, not stretched estimates |
| **AT-PF8** | A frame set lacking vanna/charm → those lenses are **absent from the control set**, not present-and-empty |
| **AT-PF9** | Legend, chrome, tooltips and payload labels contain no damping, amplifying, suppression, expansion, pin, magnet, wall, support, resistance or gravitate; the legend states sign and units |
| **AT-PF10** | Unlocked overlay tracks the latest bucket; locked overlay carries a visible as-of timestamp |
| **AT-PF11** | Candle timestamps align to bucket boundaries; a fixture with mismatched clocks fails validation |
| **AT-PF12** | Absent cells are visually distinguishable from near-zero cells at default contrast, verified at AA |
| **AT-PF13** | Plane failure → local error state; no fallback render from the live chain under the same label |

---

## 10. Open decisions

| # | Question | Recommendation |
|---|---|---|
| **OD-PF1** | **The component's own name.** "Pressure Field" asserts force on price — the claim **PF9** removes from the legend, reintroduced in the title | **Rename before any member surface.** Echo + Tango. The field shows *where signed gamma sat, through time*. Internally `gex_session_field` is honest and boring, which is the right register for a title that appears above a two-colour heatmap |
| **OD-PF2** | `bucket_agg` default | **`last`** — it matches the Profile's current-frame semantics, so the two agree at the bucket edge. `median` is the deliberate choice for a noisy book |
| **OD-PF3** | Residual-book view in v1 | **No.** It is the tool's most misreadable feature and belongs after the misread metrics come back clean |
| **OD-PF4** | Does the flow lens render on this surface at all? | **Later than the OI lens.** An unsigned magnitude field behind candles reads as intensity, and intensity behind price is the same suggestion in a different palette |
| **OD-PF5** | Colour ramp for absent vs near-zero | Live-tape sitting. It is the difference between two claims about the world (**GXF33**) and cannot be settled from a desk |

---

## 11. Document control

| Version | Date | Notes |
|---|---|---|
| **v0.1** | 2026-09-01 | Initial. Resolution honesty (PF1); declared bucket aggregation (PF2); append-only as the core property (PF4); mid-session band entry renders absent (PF6); charm `dt` bound (PF8); **no regime names on the field** (PF9); gaps never interpolated (PF10); residual book is not a forecast (PF12). AT-PF1–13 · OD-PF1–5, including the component's own name |

**One-line law:**
**Signed gamma as a function of strike and time, at the grain the data actually has, appended and
never rewritten, with absence rendered as absence — and a legend that states sign and units and
says nothing whatsoever about what price will do.**