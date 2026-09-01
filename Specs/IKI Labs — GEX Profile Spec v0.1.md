# IKI Labs — GEX Profile Spec v0.1

**Status:** **DRAFT** — not build authority. Gates at **GX0**.
**Date:** 2026-09-01
**Canonical filename:** `Specs/IKI-Labs-GEX-Profile-Spec-v0_1.md`
**Component id:** `gex-profile` · **Layout:** `profile` · **Plane:** none (live chain model)
**Parent:** [`IKI-Labs-GEX-Toolset-Foundation-Spec-v0_1.md`](./IKI-Labs-GEX-Toolset-Foundation-Spec-v0_1.md)
— **GXF law is not restated here.** Where this document and the Foundation disagree, the Foundation
wins and this file is a bug.

**Duplicates:** GEXBoard histogram · QuantWheel GEX-by-strike · TRACE strike plot (GEX lens).

---

## 1. Purpose

**The question it answers:** *where is standing gamma concentrated across strikes right now, and
where does the cumulative profile change sign?*

**The question it does not answer:** what price will do about it (**GXF36**).

This is the base computation of the family. **Node Card derives from it** and **Session GEX Path
consumes its summaries** — so a defect here is a defect in three tools (GXF23).

Relative to the existing Runner `gex` template (Heatmap v0.2 §5.5), this is that template's
quantity with a cumulative curve, sign-change marks, a lens toggle and the coverage strip. **It is
not a new quantity.**

---

## 2. Component declaration

```ts
{
  id: "gex-profile",
  runner_template_id: "gex-profile",
  layout: "profile",
  dataPlane: undefined,              // live chain model only — HM1
  analyzer_handoff: false,           // GP12
  valueModes: ["net", "call", "put", "cumulative"],
  defaultValueMode: "net",
  lenses: ["oi", "flow"],            // default per OD-GXF5
}
```

---

## 3. Inputs

Current frame from the shared chain model, or the last good frame when held (HM4 hydrate-if-empty,
HM5 session hold). Derived row fields per Foundation §6. No fetch of its own (HM21b).

---

## 4. Transforms

Ordered. Steps 1–3 are Foundation law applied; 4 onward are this tool's.

1. **Hygiene and scope.** Apply `GexPolicy.hygiene`; filter to symbol and `dte_mode`. Volume
   accounting has already bypassed quote hygiene upstream (**GXF14**) — this step never recomputes
   `delta_volume`.
2. **Lens.** `gex_oi` (signed) or `gex_vol` (unsigned — **GXF11**).
3. **Tradability filter.** Drop contracts that are not tradable today even though `dte = 0`
   (**GXF21** — AM-settled on settlement morning).
4. **Aggregate by strike.**
   ```text
   net[K]  = Σ gex over both rights at K
   call[K] = Σ gex where right = C
   put[K]  = Σ gex where right = P
   ```
   A strike with a null Γ on either side yields an **invalid** contribution for that side, never
   zero (**GXF33**). `net[K]` is invalid unless both sides are present or absent-by-listing.
5. **Sort strikes ascending.**
6. **Cumulate.** `cum[i] = Σ net[0..i]`, **low strike upward** — the direction is frozen in
   `algo_version` and **stated on the axis** (**GP4**).
7. **Sign changes.** Find **every** index where `cum` changes sign (**GP1**). For each, report the
   bracketing listed strikes and the linear-interpolated crossing price.
8. **Peaks.**
   ```text
   peak_positive = strike with max net           (largest positive)
   peak_negative = strike with min net           (most negative)
   peak_abs      = strike with max |net|
   ```
9. **Regime.** `pos` / `neg` / `near_zero` by `GexPolicy.near_zero_threshold[symbol]`
   (**GXF17** — config, boot abort when unset). `near_zero` is a defined state, not a rounding
   artefact.
10. **Clip to display window.** `spot ± strike_window`, or `n_strikes` around ATM. **Clipping is a
    view operation and never changes step 6** — a cumulative curve computed on a clipped range is a
    different curve (**GP5**).

---

## 5. Tool law

| # | Law |
|---|---|
| **GP1** | **Every sign change, never "the" flip.** Real chains cross more than once. The payload carries `sign_changes[]` with a **count**; no crossing is selected as primary, and no field is named `flip` (Foundation **GXF35**). A consumer must be able to distinguish `1 of 1` from `1 of 3` |
| **GP2** | **No signed objects under the flow lens.** `gex_vol` is unsigned (**GXF11**), so `sign_changes`, `peak_positive`, `peak_negative`, `cum` and `regime` are **absent from the payload** and their controls are **disabled with the reason on the strip** (**GXF34**). They are not computed and then hidden — they are not computed |
| **GP3** | **Peaks are extrema, not levels.** `peak_*` names an argmax. No copy, tooltip, legend or field name may frame one as a wall, floor, ceiling, magnet or defence (**GXF35**) |
| **GP4** | **Summation direction is stated on the axis.** A cumulative profile summed from the other end is a different picture of the same chain |
| **GP5** | **Clipping never changes the computation.** Aggregate and cumulate on the full filtered chain; clip for display only. The window in view is recorded in coverage |
| **GP6** | **Both books, always.** Side is a **view filter**, never a re-fetch and never a scope change (HM16). `net` requires both books at that strike |
| **GP7** | **Invalid is not zero.** A strike with no data, a null Γ, or a side outside the listed chain renders the invalid marker (**GXF33**) |
| **GP8** | **Scale is display.** `per_1pct` / `per_1usd` re-render one stored value; the active scale is on the strip (**GXF9**) |
| **GP9** | **Every value carries its terms.** `sign_convention`, `algo_version`, `oi_asof`, scope and `as_of` on every payload and on the surface (**GXF30**, **GXF31**) |
| **GP10** | **Zero fetches on switch.** Lens, side, value mode, `dte_mode` and window changes produce **zero** chain HTTP while the stream is healthy (**GXF24**) |
| **GP11** | **Same numbers as its consumers.** Node Card and Session Path read this computation, not their own. Divergence is a defect (**GXF23**) |
| **GP12** | **No Analyzer handoff in v1.** A strike is not a structure. Handoff belongs to a tool that emits legs |

---

## 6. Output contract

```json
{
  "ts": 0,
  "component": { "id": "gex-profile", "version": "0.1.0" },
  "symbol": "SPX",
  "spot": 0,
  "lens": "oi",
  "dte_mode": "0DTE",
  "scale": "per_1pct",
  "net_gex": 0,
  "regime": "pos|neg|near_zero",
  "sign_changes": [
    { "px": 0, "strike_lo": 0, "strike_hi": 0, "from": "neg", "to": "pos" }
  ],
  "sign_change_count": 0,
  "peak_positive": { "strike": 0, "gex": 0 },
  "peak_negative": { "strike": 0, "gex": 0 },
  "peak_abs":      { "strike": 0, "gex": 0 },
  "bars": [
    { "strike": 0, "net": 0, "call": 0, "put": 0, "cum": 0,
      "oi_c": 0, "oi_p": 0, "vol_c": 0, "vol_p": 0,
      "valid": true, "invalid_reason": null }
  ],
  "coverage": { }
}
```

Under `lens: "flow"`, the fields named in **GP2** are **absent** — not null, absent — and
`algo_version` reads `gxflow_v1`.

---

## 7. Visual

Horizontal bars; strike on Y descending; signed GEX on X with a zero baseline. Diverging scale,
positive one direction and negative the other, on the product's frozen palette — **sign is carried
by position and hue together, never hue alone** (accessibility; Foundation §13 decoration rule).
Spot line at its **true proportional position between strikes**, never snapped to the ATM row; ATM
row emphasised separately (SV29 parity). Sign-change marks drawn as rules **between** the two
bracketing strikes, each labelled with its bracket. Optional cumulative polyline on its own axis
with its own units label — never normalised onto the bar axis.

Coverage strip persistent above the plot (**GXF31** L2).

---

## 8. Controls

| Control | Default | Notes |
|---|---|---|
| Symbol | universe-gated | `market_symbol_universe` only |
| DTE mode | `0DTE` | `0DTE · 1DTE · 0-3 · Week · Month · All` |
| Lens | `oi` | `flow` disables the GP2 set, with the reason stated |
| Value mode | `net` | `net · call · put · cumulative` |
| Scale | `per_1pct` | display only |
| Strike window | auto ATM ± N | display only (**GP5**) |
| Show cumulative | on | own axis, own units |
| Show sign changes | on | all of them (**GP1**) |
| Show spot / ATM | on | two marks, never merged |
| Near-zero band | from config | **GXF17** |
| Participant split | **absent** | Declined by name in Foundation §18. The control does not exist rather than existing disabled |
| Refresh | every frame | render throttle 1 s; **no polling timer** (HM3) |

---

## 9. Acceptance tests

| ID | Test |
|---|---|
| **AT-GP1** | Fixture chain with **three** cumulative sign changes renders three marks and `sign_change_count: 3`; no crossing is tagged primary; no field named `flip` exists in the payload |
| **AT-GP2** | Fixture with **zero** crossings → `sign_changes: []`, `sign_change_count: 0`, regime from `net_gex` alone; no interpolated value is emitted |
| **AT-GP3** | `lens: "flow"` → `sign_changes`, `peak_positive`, `peak_negative`, `cum` and `regime` are **absent** from the payload; their controls are disabled **with the reason rendered on the strip** |
| **AT-GP4** | Null Γ or null OI on one side at a strike → that side invalid and `net` invalid; **no zero-valued bar** at that strike |
| **AT-GP5** | Changing the strike window produces **identical** `cum` values for the strikes still in view — clipping did not re-cumulate |
| **AT-GP6** | Lens, side, value-mode, DTE-mode and window switches produce **zero** chain HTTP and zero plane reads on a healthy stream |
| **AT-GP7** | Payload and rendered surface both carry `sign_convention`, `algo_version`, `scale`, `oi_asof` and scope; a response without a coverage object **fails validation** |
| **AT-GP8** | On a same-day expiration the surface states that today's flow is not yet in OI, **without a hover** |
| **AT-GP9** | Cumulative direction is asserted in the payload and rendered on the axis; reversing it in a fixture changes the crossing set (proves the direction is real, not cosmetic) |
| **AT-GP10** | AM-settled contracts on settlement morning are **excluded** from the `0DTE` book; a fixture containing them yields a profile identical to one without them |
| **AT-GP11** | The strings pin, magnet, wall, support, resistance, gravitate appear nowhere in copy, tooltips, legends **or payload field names** |
| **AT-GP12** | Node Card and Session Path, given the same frame, report byte-identical `net_gex`, `peak_abs` and `sign_changes` to this tool (**GP11**) |
| **AT-GP13** | `per_1pct` ↔ `per_1usd` changes rendered figures and the units label only; the stored value is unchanged |

---

## 10. Open decisions

| # | Question | Recommendation |
|---|---|---|
| **OD-GP1** | Member-facing names for `peak_*` and `sign_changes` | **Echo + Tango.** Internal names are deliberately neutral; the member label must not reintroduce what **GP3** removed |
| **OD-GP2** | Does `cumulative` ship as a value mode or only as the overlay polyline? | **Overlay first.** A cumulative *bar* invites reading it against the per-strike bars on one scale |
| **OD-GP3** | Default `dte_mode` | **`0DTE`** — it is the product's subject. Persist the member's last used thereafter |
| **OD-GP4** | Does the flow lens ship in v1 at all? | Foundation **OD-GXF6** — staged behind **GXF15** correct and **GXF11** accepted |

---

## 11. Document control

| Version | Date | Notes |
|---|---|---|
| **v0.1** | 2026-09-01 | Initial. Every-crossing rule (GP1); flow lens emits no signed objects (GP2); peaks are extrema not levels (GP3); summation direction stated (GP4); clipping is display-only (GP5). AT-GP1–13 · OD-GP1–4 |

**One-line law:**
**Sum signed gamma by strike, cumulate in a stated direction, mark every place the curve changes
sign, and never name an extremum as though it held price.**