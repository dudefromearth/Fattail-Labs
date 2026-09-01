# IKI Labs — Node Tape Spec v0.1

**Status:** **DRAFT** — not build authority. Gates at **GX0**.
**Date:** 2026-09-01
**Canonical filename:** `Specs/IKI-Labs-Node-Tape-Spec-v0_1.md`
**Component id:** `node-tape` · **Layout:** `scatter` (**new renderer**) · **Plane:** `gex_session_bucket`
**Parent:** [`IKI-Labs-GEX-Toolset-Foundation-Spec-v0_1.md`](./IKI-Labs-GEX-Toolset-Foundation-Spec-v0_1.md)
— GXF law is not restated here.

**Duplicates:** Quant Data Interval Map (GEX mode).

---

## 1. Purpose

**The question it answers:** *which strikes carried concentration, when, and how did that change
through the session?*

Where the Pressure Field paints everything, the Tape paints only what cleared a bar — so it reads as
a sequence of events rather than a texture. That selectivity is the tool's value and its principal
hazard: **a chart that only shows what passed a threshold looks like a chart of things that
mattered.**

**The question it does not answer:** what any of it caused (**GXF36**).

---

## 2. Component declaration

```ts
{
  id: "node-tape",
  runner_template_id: "node-tape",
  layout: "scatter",
  dataPlane: { id: "gex_session_bucket", required: true },
  analyzer_handoff: false,
  lenses: ["oi", "flow"],
  greeks: ["gex"],                    // dex / vex / charm gated — NT10
}
```

---

## 3. Transforms

1. **Bucket** to `bucket_seconds` (30 s / 1 m / 5 m; default 60 s).
2. Per bucket, per strike: value under the active lens, greek and DTE mode.
3. **Selection:** keep a strike where `|value| ≥ min_abs` **or** it ranks in the top `k`
   (default 12) that bucket. Both parameters are config; **`min_abs: "auto"` is not a value**
   (**GXF17**).
4. **Mark:** `x = bucket`, `y = strike`, **area ∝ |value|** (**NT1**), hue by sign.
5. **Price polyline** from the plane's spot track at bucket end.
6. **Trail:** optional connector joining the same strike across consecutive buckets in which it was
   selected. A trail **breaks** where the strike was not selected — it is never bridged (**NT3**).
7. **Events** — §5.

---

## 4. Tool law — rendering

| # | Law |
|---|---|
| **NT1** | **Area-proportional, not radius-proportional.** Coach's spec says `r = scale(\|gex\|)`. Mapping magnitude to **radius** makes perceived size grow as the **square** of the value: a strike with twice the gamma reads as four times the mark. Map to **area** — `r ∝ √\|value\|` — and state the scale in the legend with a size key. This is a measurement defect, not a styling preference (**AT-NT1**) |
| **NT2** | **The tape does not look like the Field.** No grid fill, no background heat. Two tools that render the same plane must not be confusable at a glance |
| **NT3** | **Absence of a mark is absence of selection, not absence of gamma.** A strike below the bar simply was not drawn. The legend says so, and a trail never bridges an unselected bucket |
| **NT4** | **Selection parameters are on the surface.** `k` and `min_abs` are shown, not buried — the reader's interpretation of an empty region depends entirely on them |
| **NT5** | **Sign by hue is paired with a second channel.** Hue alone fails colour-vision accessibility and fails a monochrome display. Sign carries a shape or fill distinction as well |

---

## 5. Events — the risky output, and the rules that bound it

Events are the tool's most consumable output and the closest thing in the family to a signal. They
are **observations about the data**, never claims about price (**GXF36**).

| Event | Definition | Guard |
|---|---|---|
| `sign_change_at_strike` | Per-strike net GEX changes sign between consecutive buckets | **NT6**, **NT7** |
| `peak_change` | The `argmax \|value\|` strike changes **and holds** for `hold_buckets` (default 3) | Debounce; **NT7** |
| `concentration_decay` | `\|value\|` at a strike falls by more than `decay_pct` (default 50 %) from its **session maximum at that strike** | **NT8** |

**NT6 — no event fires on a gap-spanned bucket.** A bucket whose `delta_volume` spanned a
quote-hygiene gap, or whose plane bucket held no frame, is **marked** (**GXF14**, `AN-N3`). Event
detectors decline to fire on a marked bucket. Without this the tool prints its loudest output
exactly when its data was worst — quotes go wide across a swathe of strikes during a fast move,
which is precisely when those strikes are trading heavily (**AT-NT6**).

**NT7 — no event fires before the roll completes.** Pre-roll frames carry the prior session's
volume totals (**GXF15**). Under the flow lens the first buckets of the session are unattributed by
construction; under either lens, event detection begins after roll completion and the coverage
object records when that was.

**NT8 — a running maximum is not a maximum.** `concentration_decay` compares against the session
max **so far**, which early in the session is whatever was seen a minute ago. A decay event at
09:40 measured against a 09:38 peak is noise wearing an event's name. Require a minimum
`observation_buckets` before a strike is eligible, and record the reference peak's timestamp on the
event (**AT-NT8**).

**NT9 — events are observations, and their names say so.** `peak_change` describes an argmax
moving. No event is named or described as a break, a defence, a loss of control, a rotation, or
anything implying consequence. The event payload carries **what changed and when**, never what to
do (**AT-NT9**).

**NT10 — greeks ship only if computed.** DEX, VEX and charm appear in the control set only when the
frame carries them and their units are derived (Surface **GS8** parity). Charm by finite difference
carries a `dt` bound (Pressure Field **PF8**).

**NT11 — flow lens: magnitude only.** `gex_vol` is unsigned (**GXF11**), so hue-by-sign and
`sign_change_at_strike` are **absent** under `flow`. Marks render on a sequential scale.

---

## 6. Output contract

```json
{
  "component": { "id": "node-tape", "version": "0.1.0" },
  "symbol": "SPX", "session_date": "2026-09-01",
  "lens": "oi", "greek": "gex",
  "bucket_seconds": 60,
  "selection": { "k": 12, "min_abs": 0, "size_scale": "area" },
  "marks": [
    { "t": 0, "strike": 0, "value": 0, "rank": 1, "sign": 1,
      "selected_by": "top_k|min_abs", "bucket_marked": false }
  ],
  "price": [ { "t": 0, "px": 0 } ],
  "events": [
    { "t": 0, "type": "peak_change", "from": 0, "to": 0,
      "held_buckets": 3, "reference_t": 0 }
  ],
  "roll_complete_at": 0,
  "coverage": { }
}
```

Under `lens: "flow"`, `sign` is absent and no `sign_change_at_strike` events are emitted
(**NT11**).

---

## 7. Controls

| Control | Default | Notes |
|---|---|---|
| Lens | `oi` | `flow` → sequential, no sign events |
| Greek | `gex` | others absent unless computed (**NT10**) |
| DTE mode | `0DTE` | archive back-select is 0DTE-only |
| Bucket | 60 s | 30 s / 1 m / 5 m |
| Top-k | 12 | **shown on the surface** (**NT4**) |
| Min abs | config | never `"auto"` (**GXF17**) |
| Show price | on | from the plane's spot track |
| Trail | on | breaks on unselected buckets (**NT3**) |
| Events | on | `hold_buckets`, `decay_pct`, `observation_buckets` from config |
| Size scale | area | legend carries a size key (**NT1**) |

---

## 8. Acceptance tests

| ID | Test |
|---|---|
| **AT-NT1** | A strike with 4× the `\|value\|` of another renders with **4× the mark area**, not 4× the radius; the legend carries a size key |
| **AT-NT2** | No event fires on a bucket marked as gap-spanned; a fixture with a hygiene gap across a bucket boundary produces **zero** events in that bucket |
| **AT-NT3** | No event fires before `roll_complete_at`; the roll fixture (08-28 09:31:07 → 09:31:18) produces no pre-roll events under either lens |
| **AT-NT4** | `concentration_decay` does not fire before `observation_buckets` have elapsed for that strike; every emitted decay event carries `reference_t` |
| **AT-NT5** | `peak_change` fires only after `hold_buckets`; a one-bucket flicker produces no event |
| **AT-NT6** | A strike falling below the selection bar produces **no mark and no event** — its trail breaks and is never bridged across the unselected buckets |
| **AT-NT7** | `k` and `min_abs` are rendered on the surface; changing them changes the mark set and **not** the underlying values |
| **AT-NT8** | Sign is distinguishable without colour (second channel present); verified in greyscale |
| **AT-NT9** | No event type, label, tooltip or payload field implies consequence — no break, defence, control, rotation, or price-direction language |
| **AT-NT10** | `lens: "flow"` → no `sign` field, no sign-change events, sequential palette |
| **AT-NT11** | Rendering does not produce a filled grid; Tape and Pressure Field are visually distinguishable on the same plane and session |
| **AT-NT12** | Lens, greek, bucket and selection changes produce **zero** additional plane reads (cached — HM21f) |
| **AT-NT13** | A strike entering the band mid-session produces no mark before `first_seen_at` and no event at first sighting |

---

## 9. Open decisions

| # | Question | Recommendation |
|---|---|---|
| **OD-NT1** | Member-facing name for `peak_change` | **Echo + Tango.** The category's word for this is "king change", which is exactly the agency **NT9** removes |
| **OD-NT2** | Are events published beyond the surface (SSE, alerts, journal)? | **Not in the first ship.** An event stream is a signal product, and it should not arrive as a side effect of a chart. If it ships later it goes through its own Hotel gate |
| **OD-NT3** | `decay_pct` and `observation_buckets` | Live-tape sitting, not a desk number. **NT8** means the defaults interact |
| **OD-NT4** | Default `k` | 12 is Coach's figure and is a readability choice; confirm against an SPX 0DTE band at Compact density |
| **OD-NT5** | Does the trail ship in v1? | **Yes, with NT3.** Migration is the tool's actual subject, and a broken trail is more honest than a continuous line through unobserved buckets |

---

## 10. Document control

| Version | Date | Notes |
|---|---|---|
| **v0.1** | 2026-09-01 | Initial. **Area-proportional marks** (NT1) — corrects `r = scale(\|gex\|)`, which overstates magnitude quadratically. Selection is not significance (NT3, NT4). Event guards: no fire on gap-spanned buckets (NT6), none before roll completion (NT7), running-max guard on decay (NT8), and no consequence language (NT9). AT-NT1–13 · OD-NT1–5 |

**One-line law:**
**Draw only what cleared a stated bar, size it by area so the eye reads the number it was given,
break the trail where nothing was observed, and fire no event on a bucket the data cannot
support.**