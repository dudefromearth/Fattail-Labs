# FatTail Labs — Options Lab Heatmap Width Fit Spec v0.1

**Status:** **BUILD AUTHORITY** (Coach WF0-0 · **DL-525**)  
**Date:** 2026-08-21  
**Parent:** Heatmap Templates Spec v0.2 (HM1–HM20) · Advanced Fly / `sym-fly`  
**Canonical filename:** `Specs/FatTail-Labs-Options-Lab-Heatmap-Width-Fit-Spec-v0_1.md`  
**Short name:** Width Fit / WF  
**Type:** Heatmap **template** (`width-fit`) — sibling of Advanced flies (**OD-W1 Override** · **DL-529**). Internal compute id `width_fit`.  
**Member guide:** [`docs/Options-Lab-Heatmap-Width-Fit-User-Guide.md`](../docs/Options-Lab-Heatmap-Width-Fit-User-Guide.md) · help concierge `server/help_reference/options-lab-heatmap-width-fit.md` (**DL-530**)  

**Origin:** Rewrite of the SPX 0DTE Butterfly Width Optimizer development specification into a form fully compliant with the Heatmap Templates contract so an implementation plan can be drawn directly from this document.

**Decision-log basis:** **OD-W1 … OD-W6 Accept** (Coach WF0-0). Clarifies relation to OD-AF7 (Surface Regime Score). JR1–7 Accept (equal \(1/7\) criteria weights; `min_valid_n` 5; `per_width`; inspector supporting modes; median; Debit default; OD-W6 (a)).

**Content hash:** whole-file sha1 in **DL-525** (not in this file).

---

## 0. Mission

Provide a pure value mode on the existing Advanced Fly / `sym-fly` matrix that scores every valid (center strike \(K\), width \(w\)) long symmetric butterfly for **fit to the member’s stated multi-factor criteria** on the live dual-side option surface.

**Output**
- \(K \times w\) grid of local fit scores and component metrics  
- UI-layer footer of robust per-width aggregates, valid-center counts (\(n\)), and quality / stability flags  

The mode answers the practical question:

> Given the current option surface and my criteria weights, which individual butterflies (and which widths in aggregate) currently show the strongest combination of cost efficiency, usable convexity, responsiveness, local stability, and call/put characteristics?

**Absolute doctrine constraints**
- Observation-only / structure-descriptor language (Heatmap Templates §0.3).  
- No platform recommendation, no signal, no profit theater.  
- “No reliable fit yet” and “Unstable Surface” are first-class valid states.

**Research hypothesis retained**
The best-fitting butterfly structures are encoded in the shape and economics of the live surface and can be identified by comparing cost, convexity, responsiveness, stability, and call/put asymmetry across centers and widths.

---

## 1. Parent Laws

All of Heatmap Templates Spec v0.2 laws **HM1–HM20** apply in full. Critical reminders:

| ID | Law |
|----|-----|
| **HM6** | Pure template compute (pure functions of context + params + valueMode) |
| **HM7** | Fail-loud cells (missing legs, null mid, null required greek → invalid “—”) |
| **HM8** | Exact listed strikes; no snap. \(K \pm w\) must be listed or cell is invalid |
| **HM14** | HIG chrome (tokens, ≥44 pt, reduced-motion) |
| **HM15–HM17** | Always both sides; side is view filter only; strike window ≤ 250 contracts |
| **§0.3** | Structure descriptors only; no profit claims |

Advanced Fly / `sym-fly` geometry, debit formula, dual-side model, and existing value modes remain the foundation.

---

## 2. Width Fit Specific Laws

| ID | Law |
|----|-----|
| **WF1** | Neighborhood stability term is mandatory. A cell’s final fit score must incorporate a penalty (or down-weight) derived from dispersion of its principal metrics versus adjacent centers of the same width. Isolated high scores are suppressed; coherent regions are not. |
| **WF2** | Per-width valid-center count (\(n\)) must be computable from the matrix of valid flags. All robust aggregates and stability statistics for a width are calculated **only** on that width’s valid cells. Footer must surface \(n\). |
| **WF3** | Component weights are member-editable template params. A shipped, documented default preset is required. Platform-fixed weights that produce a ranking are forbidden. |
| **WF4** | The template is a pure function of the current dual-side chain context + params + valueMode. Multi-snapshot history, fit time-series stores, and weight calibration loops are out of scope for this template and belong on the FatTail Intelligence / StudioOne plane. Short-term temporal signals may use only the existing client `flySurfaceHistory` ring-buffer pattern. **Average and Replay of Width Fit colors / per-width aggregates are Template Runner views (TR14 stream book), not template state and not a second ranking formula.** |
| **WF5** | Vocabulary is observation-only. See mandatory mapping table in §8. |

---

## 3. Geometry and Params

### 3.1 Widths

- `widthMode = fixed_points`  
- Default list: `[10, 15, 20, 25, 30, 35, 40, 45, 50]` (center-to-wing points, matching H4 / course Width)  
- Any \(K \pm w\) that is not a listed strike → cell invalid (HM8)

### 3.2 Strike region / wings

Inherited from chain context. Default recommendation for this mode: wings = 50 (±50 points). Must satisfy HM17 (≤ 125 strikes per side).

### 3.3 Params (member-editable)

```ts
{
  widths: number[];                    // default [10,15,20,25,30,35,40,45,50]
  weights: {
    debit_efficiency: number;
    payoff_efficiency: number;
    gamma_efficiency: number;
    curvature_efficiency: number;
    theta_efficiency: number;
    surface_responsiveness: number;
    surface_stability: number;         // originating field — see OD-W6
    call_put_asymmetry: number;
  };
  min_valid_n: number;                 // GO: 5; below this the width aggregate is low-confidence
  stability_penalty_strength: number;  // GO: config floor; not member-zeroable
  quality_thresholds: object;          // spread, greek presence, debit sign, etc.
  normalization: "per_width" | "grid"; // default "per_width" recommended
}
```

**OD-W6 Accept (Coach 2026-08-21, beside originating text):** `surface_stability` is **not** in the member weight vector. Neighborhood suppression uses `stability_penalty_strength` with a **config floor**. Implementers must not expose a slider that zeros L6. The seven **criteria** weights default equal \(1/7\) (JR1). Originating `surface_stability` line above is kept; it is not a criterion weight.

**Default weight preset**  
**JR1 Accept:** equal \(1/7\) on the seven criteria components (debit, payoff, gamma, curvature, theta, responsiveness, call/put asymmetry). Exact values live in code + UI and are documented at ship. The preset must be visible and editable by the member. Modest convexity tilt remains a later member edit, not a second platform preset.

Side filter (`viewSide`) remains a pure view filter (HM16).

---

## 4. Component Definitions (pure)

All components are pure functions of the dual-side chain model + existing greeks / surface quantities already available to `sym-fly`.

| Component | Candidate formulation (higher generally better) |
|-----------|-------------------------------------------------|
| Debit Efficiency | \(1 - (D / w)\) (more width purchased per unit of debit) |
| Payoff Efficiency | \((w - D) / D\) when \(D > 0\) (identical to existing R2R) |
| Gamma Efficiency | \(\lvert\Gamma\rvert / D\) |
| Curvature Efficiency | \(\lvert\mathrm{Curvature}\rvert / D\) |
| Theta Efficiency | ConvexityMeasure / \(\lvert\Theta\rvert\) |
| Surface Responsiveness | Composite of \(\lvert\Delta\rvert\), \(\lvert\Gamma\rvert\), slope, curvature |
| Local Stability | Inverse of dispersion (median absolute deviation or first-difference variance) of principal metrics versus same-width neighbors |
| Call/Put Asymmetry | Existing dual-side difference; magnitude + coherence across neighboring strikes |

**Normalization timing**  
`computeCell` emits **raw** component values. Any cross-cell or cross-width normalization required for the composite score or for color occurs only in `assignColors`. This keeps pure recompute cheap, deterministic, and free of order dependence.

---

## 5. Value Modes

### 5.1 Primary mode

- `width_fit` — weighted sum of the (stability-adjusted, normalized) component scores under `params.weights`.  
  This is the default mode for the Width Fit surface.

### 5.2 Supporting modes

The individual efficiency components may be exposed as selectable valueModes or computed only as intermediate fields for the inspector:

- `debit_efficiency`
- `payoff_efficiency` (re-uses or aliases existing R2R)
- `gamma_efficiency`
- `curvature_efficiency`
- `theta_efficiency`
- `responsiveness`
- `local_stability` (primarily produced in `assignColors`)
- `cp_asymmetry` (extends or re-uses existing dual-side mode)

Existing `debit`, `r2r`, slope, curvature, and other Advanced Fly modes remain unchanged and available.

---

## 6. computeCell

Pure function of `(context, params, valueMode, center K, width w, side)`.

For each candidate long butterfly:

1. Construct the three legs on the requested side (or both sides independently).  
2. Compute debit \(D\) from mids using the existing formula:  
   \(D(K,w) = m(K-w) + m(K+w) - 2\,m(K)\).  
3. Compute max structural profit = \(w - D\) (structure descriptor only).  
4. Retrieve or compute butterfly \(\Delta\), \(\Gamma\), \(\Theta\) (leg-sum).  
5. Retrieve slope / curvature if the surface modes already supply them.  
6. Compute the efficiency components listed in §4.  
7. Apply data-quality gates (see below).  
8. Return `{ display, value, valid, components, qualityFlag, tooltip? }` appropriate to the active valueMode.  
9. Call and put are computed independently from the dual-side model; asymmetry is derived.

**Data-quality gates that force `valid = false` or a “poor” quality flag**
- Missing leg or non-listed \(K \pm w\) (HM8)  
- Null mid on any leg  
- Null critical greek required by the active components  
- Negative long-butterfly debit (quote artifact)  
- Crossed market on any leg  
- Extremely wide bid/ask relative to mid (threshold in `params.quality_thresholds`)

A cell that fails these gates never receives a high fit score.

---

## 7. assignColors

Runs after the full grid of `computeCell` results (neighbor access guaranteed by the parent contract).

Responsibilities:

1. For every valid cell, compute local neighborhood dispersion of the principal metrics (or of the raw fit) against ±1 / ±2 centers of the same width (WF1).  
2. Apply stability penalty scaled by `params.stability_penalty_strength` and the `surface_stability` weight.

   **OD-W6 Accept (beside originating step):** scale by `stability_penalty_strength` **only**, clamped to a config floor. Do **not** multiply by a member `surface_stability` weight. Do **not** also score stability as a weighted component.  
3. Normalize the stability-adjusted fit scores. Preferred method: **per-width** (each column self-relative). Controlled by `params.normalization`.  
4. Map to a muted sequential professional palette (deep muted teal → soft amber) using the sticky-scale / hysteresis pattern of Heatmap Templates §5.2.2 so ordinary quote noise does not rewrite the color scale.  
5. Drive opacity or secondary encoding from combined local data-quality + neighborhood stability.  
6. Expose final fit value, stability metric, validity, and component map so the UI can build the footer and coherent-region markers.

**Robust aggregation for footer**  
Default robust statistic for each width’s central fit = **median** (or 20 % trimmed mean). Arithmetic mean is forbidden for the primary aggregate. A width whose \(n < params.min_valid_n\) must be markable as insufficient-data / low-confidence and cannot be presented as a high-fit aggregate.

Isolated high cells must not dominate the visual field.

---

## 8. UI Contract (non-normative but required for HIG and instructional integrity)

The pure matrix + validity flags + component maps are sufficient for the following UI behavior. Implementation plans must schedule these items.

### 8.1 Progressive disclosure (mandatory interaction path)

1. **Default view**  
   Footer Width Fit summary row (one cell per width) showing:
   - robust aggregate fit score (median),  
   - valid-center count (\(n\)),  
   - data-quality flag,  
   - compact stability indicator  
   plus a low-density overview of coherent high-fit regions (or best-width-per-neighborhood).

2. **Explicit expand** → full center × width matrix.

3. **Hover** → compact tooltip with key component scores and a short observation phrase.

4. **Click / inspector panel** → full component breakdown (call vs put), local neighborhood context, comparative deltas versus the width median, and auto-generated structure-descriptive explanation.

Cell interiors show no numeric values by default; numbers appear only on demand.

### 8.2 Color and secondary encoding

- Primary fill: muted sequential professional palette (deep muted teal → soft amber) mapped to the normalized `width_fit` score.  
- Opacity / desaturation driven by combined local data-quality + neighborhood-stability.  
- Subtle outline (elevation / border) only for cells that simultaneously clear high-fit, high-stability, and good-quality gates.  
- Inherit or extend the sticky-scale hysteresis pattern of HM §5.2.2.  
- Never traffic-light red/green or high-chroma “buy” treatment.

### 8.3 Vocabulary (mandatory)

| Original term | Required term in this Spec and UI |
|---------------|-----------------------------------|
| Optimizer | Width Fit |
| BOS / Butterfly Opportunity Score | width_fit score / Fit score |
| Preferred Width | Highest-fit width (footer) |
| Recommendation | (forbidden) |
| Opportunity | Fit to criteria / coherent region |
| Strong Preference | Strong Fit |
| No Clear Preference | No Clear Fit / No reliable fit yet |
| Unstable Surface | Unstable Surface |

### 8.4 Instructional framing (must appear in legend and default tooltips)

> Scores reflect relative fit of defined-risk structures to the member’s stated criteria on the current surface. High-fit coherent regions indicate favorable geometry and economics relative to other available structures right now. They are not directional signals or trade recommendations.

Inspector explanations are generated from actual component deltas and must remain comparative and structure-descriptive (example: “gamma efficiency in the top quartile for this width with low neighbor dispersion”). Evaluative adjectives that imply platform endorsement are forbidden.

When a cell is high-fit but the width-level aggregate is only moderate, the inspector should surface a comparative note of the form:

> This cell scores well relative to other centers at the same width; the width as a whole shows only moderate coherence.

---

## 9. Call / Put Handling

- Dual-side model is always present (HM15).  
- `computeCell` emits independent call and put component sets + derived asymmetry for every \((K, w)\).  
- `viewSide` is a pure display filter (or dual-panel / asymmetry differential can be offered).  
- Material, coherent asymmetry across neighboring strikes contributes to the asymmetry component when the member’s weights include it.

---

## 10. Non-Goals / Boundary

| Out of scope for this template | Destination |
|--------------------------------|-------------|
| Multi-snapshot persistence, historical fit time-series, weight calibration | FatTail Intelligence / StudioOne plane |
| Platform-defined recommendation weights or any ranking presented as a trading signal | Forbidden |
| Snapping legs to nearest strike | Forbidden (HM8) |
| Silent zeros for missing data | Forbidden (HM7) |
| Profit or performance claims | Forbidden (§0.3) |
| Continuous HTTP polling or per-template Massive clients | Forbidden (HM1–HM4) |

---

## 11. Acceptance Tests

| ID | Test |
|----|------|
| **AT-WF1** | `width_fit` and component modes recompute purely on each applied chain generation; changing valueMode or member weights causes zero extra Massive traffic. |
| **AT-WF2** | Missing leg or non-listed \(K \pm w\) → cell invalid (HM7 / HM8). |
| **AT-WF3** | Wider columns produce fewer valid centers near band edges; footer \(n\) is accurate. |
| **AT-WF4** | Neighborhood stability term materially down-weights an isolated high cell relative to a coherent region of similar raw scores. |
| **AT-WF5** | Changing member weights re-scores the grid and can change cell / width ordering without chain re-fetch. |
| **AT-WF6** | Default weight preset produces a usable surface on a normal RTH snapshot. |
| **AT-WF7** | Color scale respects sticky hysteresis (HM §5.2.2 pattern); ordinary mid moves do not re-normalize. |
| **AT-WF8** | No forbidden vocabulary appears in any label, tooltip, or state text. |
| **AT-WF9** | “No reliable fit yet” / “Unstable Surface” states are reachable when data quality or coherence is insufficient. |
| **AT-WF10** | All aggregates for a width use only that width’s valid cells; widths with \(n < min_valid_n\) are flagged low-confidence and cannot be presented as high-fit. |
| **AT-WF11** | Corrupted inputs (negative debit artifact, crossed market, extreme spread, null critical greek) never produce a high fit score. |
| **AT-WF12** | Footer aggregates change when weights change (without chain re-fetch). |

---

## 12. Implementation Sequence (ready for plan derivation)

**Phase 1 — Pure calculation**  
- Extend `computeCell` with the efficiency components and `width_fit` under the default weight preset.  
- Enforce HM7 / HM8 invalid rules and the data-quality gates listed in §6.  
- Emit the full component map for later inspector use.

**Phase 2 — assignColors + stability**  
- Implement neighborhood dispersion term (WF1).  
- Per-width (or grid) normalization.  
- Sticky color scale (inherit §5.2.2).  
- Quality / stability → opacity.  
- `min_valid_n` handling.

**Phase 3 — UI surface**  
- Footer with robust aggregates (median) + \(n\) + quality / stability flags.  
- Progressive disclosure path (§8.1).  
- Cell inspector with comparative observation language.  
- Member weight editor (params).  
- Legend and top-level state machine (Strong Fit / Moderate Fit / No Clear Fit / Unstable Surface).

**Phase 4 — Intelligence hand-off (out of template scope)**  
- Full matrix + component snapshot serialization for historical research.  
- Weight calibration against subsequent surface responsiveness.  
- Longer-horizon confidence models.

---

## 13. Recommended Decision Rulings

The following rulings make the Spec implementable without further ambiguity:

| ID | Recommendation |
|----|----------------|
| **OD-W1** | **Accept** (Coach WF0-0) — new `width_fit` value mode on Advanced Fly / `sym-fly`. No second switcher entry. |
| **OD-W2** | **Accept** (Coach WF0-0) — member-set **criteria** weights + shipped, documented default preset. |
| **OD-W3** | **Accept** (Coach WF0-0) — Width Fit ≠ SRS. Member-defined criteria only; update decision log. Platform-weighted composites that rank or recommend remain descoped. |
| **OD-W4** | **Accept** (Coach WF0-0) — multi-snapshot persistence, historical fit series, and weight calibration relocate to FatTail Intelligence / StudioOne. Template remains pure. |
| **OD-W5** | **Accept** (Coach WF0-0) — “Width Fit” vocabulary throughout. Forbidden terms listed in §8.3. |
| **OD-W6** | **Accept (a)** (Coach WF0-0) — stability is a **penalty outside** the member weight vector, with a config floor. Not a member-zeroable component. |

**OD-W1 … OD-W5** were recommended Accept in v0.1; **Coach WF0-0 Accepts all five** plus **OD-W6 (a)**. JR1–7 Accept.

**OD-W1 Override (Coach 2026-08-21, beside originating ruling):** Width Fit is a Heatmap **template** in the Template switcher (sibling of Advanced flies). Internal compute id remains `width_fit`. It is **not** a Value mode on Advanced flies. **DL-529**.

---

## 14. Document Control

| Version | Date | Notes |
|---------|------|--------|
| **v0.1.1** | 2026-08-21 | **BUILD AUTHORITY.** Coach WF0-0 · **DL-525**. OD-W1…W6 Accept. JR1–7. Originating `surface_stability` weight line kept; OD-W6 relocates suppression to `stability_penalty_strength` with a floor. |
| **v0.1** | 2026-08-21 | Initial DRAFT. Rewrite of Width Optimizer into pure Heatmap Templates form. Incorporates OD-W1–W5, neighborhood stability, honest per-width \(n\), observation-only vocabulary, progressive-disclosure UI contract, and clear Intelligence boundary. |

**One-line law**  
A pure, member-weighted fit score over the live dual-side butterfly surface, computed cell-by-cell with mandatory neighborhood stability, honest per-width sample sizes, and observation-only language — never a platform signal.
