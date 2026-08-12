# FatTail Labs — Options Lab Heatmap Advanced Fly Spec v0.2

**Status:** **DRAFT** — product law for the fly heatmap surface (replaces Symmetric Fly)  
**Date:** 2026-08-12  
**Current revision:** **v0.2.1** (filename remains `…-v0_2.md`)  
**Supersedes:** [v0.1](./FatTail-Labs-Options-Lab-Heatmap-Advanced-Fly-Spec-v0_1.md)  
**Supersedes (surface law):** Symmetric Fly section of [Heatmap Templates Spec v0.2](./FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md) **§5.2** for member-visible fly matrix behavior (parent HM1–HM20 remain fully in force)  
**Canonical filename:** `Specs/FatTail-Labs-Options-Lab-Heatmap-Advanced-Fly-Spec-v0_2.md`  
**Type:** Product Spec — pure template Value modes + client generation history over **one** OPF-held dual-side chain  

**Short name:** **Advanced Fly** / **AF**

**Content integrity:** Whole-file hash at Coach GO — record **`shasum -a 1` of this file in the decision log**, not in-file (avoids self-reference; suite convention A7).  

```bash
shasum -a 1 Specs/FatTail-Labs-Options-Lab-Heatmap-Advanced-Fly-Spec-v0_2.md
```

**External review folded:** Claude advisor 2026-08-12 (B1–B4, A1–A8).  
**B1–B4 RESOLVED** in v0.2. **A1–A6, A5 AT folded.** A7 process note above. A8: OPF-Truth path verified at parents table.  
**Post-fold residuals (2026-08-12 verify):** **N1** curvature uniform-triple · **N2** Credit magnitude+chip display — folded in **v0.2.1**.

**Process:** Spec review (Coach + Claude) → OD Accept/Override at AF0 → implementation via Full Agent Bench Plan → code/ATs.  
**No implementation seed fire** until Coach **AF0-0 GO**.

**Architecture companion:** [`Architecture/29-options-lab-heatmap-templates.md`](../Architecture/29-options-lab-heatmap-templates.md)  
**Full-agent bench plan v1.1.1:** [`docs/Options-Lab-Heatmap-Advanced-Fly-Full-Agent-Bench-Plan-v1.1.md`](../docs/Options-Lab-Heatmap-Advanced-Fly-Full-Agent-Bench-Plan-v1.1.md) · board `agents/p-options-lab-heatmap/`  
**Parent heatmap plan:** [`docs/Options-Lab-Heatmap-Templates-Full-Agent-Bench-Plan-v1.0.md`](../docs/Options-Lab-Heatmap-Templates-Full-Agent-Bench-Plan-v1.0.md)  
**Proposal input:** Coach research brief `hm-prop.pdf` (Value metrics / regime sensor intent — **not** code authority)

**Coach accept (locked before AF0 GO):**

| Lock | Authority |
|------|-----------|
| Replace Symmetric Fly with Advanced Fly | Coach |
| Advanced **encompasses** sim/sym fly (same geometry + base modes) | Coach |
| **One** fly matrix — no parallel sym + advanced switcher entries | Coach |
| Default Value mode remains **Debit** | Coach |
| Data plane = **same OPF-held dual-side chain** as other heatmap templates | Coach |
| Research modes are **Value modes**, not a new structure recipe | Coach |

---

## 0. Mission

On Options Lab **Heatmap** (`/app/options-lab/heatmap`), the **fly surface** is a pure template over the **same dual-side options chain generation that OPF holds** for instruments. Advanced Fly:

1. **Keeps** the Symmetric Fly geometry and debit formula (course Width = center-to-wing).  
2. **Keeps** base Value modes: Debit · Credit · % Change · R:R — formulas **frozen in this Spec**.  
3. **Adds** Wave‑1 surface-derivative and dual-book modes so the butterfly surface can be studied as a **market-regime / surface sensor** — complementary to GEX, not a profit oracle.  
4. **Uses** a **client generation history** so time derivatives are honest.  
5. **Does not** open a second Massive path, package-quote path, or server matrix SoR.

**Central research question (product intent, not marketing claim):**  
*What can the butterfly surface tell us about the actual intraday market regime that VIX, spot, or a static gamma estimate cannot?*

**What this is not:** a new structure (BWB, iron, vertical); MSC heatmap code; broker OMS; promised P&L; Surface Regime Score as a trading “signal” product (Wave‑3 / Coach-gated only).

---

## 0.1 Surface naming

| Name | Meaning |
|------|---------|
| **Heatmap app** | Route `/app/options-lab/heatmap` |
| **Template** | Named pure view over dual-side chain model (HM6) |
| **Advanced Fly** | The fly matrix template (replaces member-facing Symmetric Fly) |
| **Width** | Center-to-wing distance (H4 / parent §0.1) — **not** wing-to-wing |
| **Chain model / OPF-held chain** | Dual books `calls` + `puts` + spot + meta for `(symbol, expiration, wings)` — generation plane OPF and Heatmap both consume ([OPF Truth Doctrine v1.0](./FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.0.md) · **DL-309**) |
| **Generation** | One applied dual-side snapshot (`contentHash` / `asOf`) |
| **History** | Client ring buffer of debit grids across generations — **not** a price SoR |

---

## 0.2 Relation to parent Heatmap Templates Spec v0.2

| Parent law | Advanced Fly |
|------------|--------------|
| **HM1–HM20** | Fully in force |
| **§5.2 sym-fly** geometry · debit formula · Width · no-snap · RoC color · sticky scale | **Incorporated by reference** and restated in **§3** (geometry) and **§4** (color); AF is the ship vehicle |
| **§5.2 value modes** Debit · pct_change · r2r | Superseded/extended by **§5** of this Spec (Credit also frozen here) |
| **GEX · ladder · vertical · bw-fly** | Unchanged; separate templates |
| **MSC look lawful / code forbidden** | Parent §0.2 applies |
| **Payoff math lawful / profit claims forbidden** | Parent §0.3 applies; extended for research modes in **AF12** |

**Registry identity (OD-AF1):** Prefer **keep template id `sym-fly`** and expand modes + member **label** so `heatmap_default_template` and profiles do not break. Alternate: id `adv-fly` with alias `sym-fly` → same implementation. **One switcher entry only after ship.**

---

## 0.3 Data plane (normative)

```text
Massive dual-side snapshot
  → Labs generation (standard contracts, modal step, HM15–HM20)
  → Market Bus push/diff (or hydrate-if-empty)
  → Client dual-side model (useOptionChainBus → ChainContext)
  → Advanced Fly HeatmapTemplate (pure recompute)
  → Optional: push debit grid into flySurfaceHistory
```

| Rule | Law |
|------|-----|
| **AF-DP1** | Advanced Fly reads **only** the shared dual-side chain model (OPF-held generation plane). |
| **AF-DP2** | Template / side / value-mode switches → **zero** new Massive and **zero** package-quote HTTP. |
| **AF-DP3** | Live cell **Debit** always recomputed from the **current** generation mids — never from history alone. |
| **AF-DP4** | History is client memory for derivatives only; it is **not** a second mark SoR. |
| **AF-DP5** | Does **not** call OPF package-quote or Analyzer resolve APIs. |
| **AF-DP6** | Same generation key as parent: `(symbol, expiration, wings)` — not side. |

**As-built paths (implement against):**

| Module | Role |
|--------|------|
| `web/lib/market/useOptionChainBus.ts` | Dual-side chain apply |
| `web/lib/options-lab/templates/*` | Registry + pure templates |
| `web/lib/options-lab/templates/symFly.ts` | Geometry / expand target |
| `web/lib/options-lab/templates/pricing.ts` | `symFlyDebit` |
| `web/components/options-lab/HeatmapChainPanel.tsx` | Host · Value switcher · history push |
| Session posture plane | Market-plane session SoR (same facts as Analyzer B2 — holidays, half-days, index close); **not** a second wall-clock rule for AF10 |

---

## 1. Parents / companions

| Spec / doc | Role |
|------------|------|
| [Heatmap Templates Spec v0.2](./FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md) | HM1–HM20 · framework · parent catalog |
| [OPF Truth & Elegant Failure Doctrine v1.0](./FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.0.md) · **DL-309** | OPF-held chain sole instrument truth (Heatmap consumes that plane) — path verified |
| [Options Pricing Foundation Spec v0.2](./FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md) | Generation / mark heritage; AF does not re-price packages |
| [Massive Market Bus Spec](./FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md) (content v1.0.1) | One WS/tab · push |
| [Options Chain Picker Spec v1.0.2](./FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md) | Universe · OC2 · OC6a · OC13 |
| [Human Interface Spec v1.0](./FatTail-Labs-Human-Interface-Spec-v1.0.md) | Value dropdown · matrix chrome |
| Arch 28 / 29 | Transport · template topology |

---

## 2. Laws (Advanced Fly)

Parent **HM1–HM20** apply. Advanced Fly–specific:

| ID | Law |
|----|-----|
| **AF1 — One fly surface** | After ship, the switcher has **one** fly matrix template. No dual `sym-fly` + `adv-fly` entries. |
| **AF2 — Geometry freeze** | Structure is long symmetric fly on `viewSide`: +1 @ \(K−w\), −2 @ \(K\), +1 @ \(K+w\). Width = center-to-wing. |
| **AF3 — Debit formula freeze** | \(D(K,w) = m(K−w) + m(K+w) − 2\,m(K)\) using mid. Same as parent §5.2. |
| **AF4 — No snap** | If \(K\), \(K−w\), or \(K+w\) not listed standard strikes → cell **invalid** (HM8). |
| **AF5 — Fail loud cells** | Null mid / missing leg → invalid “—”; never invent Debit, Δ, velocity, slope, or zero-as-edge (HM7). |
| **AF6 — Pure compute** | `computeCell` / grid build are pure w.r.t. `(ChainContext, params, valueMode, history snapshot)`. No fetch inside templates. |
| **AF7 — Diff once** | Mode / side switch must not multiply chain traffic (HM2). |
| **AF8 — History optional for base modes** | Debit · Credit · R:R · spatial Slope · Curvature · C/P asym **must** work with empty history. Time derivatives **require** history. |
| **AF9 — Incomplete history → null** | Time-derivative modes with insufficient samples → `valid=false`, calm tooltip — not 0, not NaN, not ∞. |
| **AF10 — Open seam** | On session posture transition **into Live** from Held or Closed (market-plane session SoR — same facts as Analyzer B2: holidays, half-days, index residual close — **not** a local wall-clock RTH guess), or when mark basis shifts from pre-open held/theo to live NBBO in a way that discontinuities the surface, history **must** seam so pre-open Δ does not continuous-drive RTH velocity. |
| **AF11 — History keys** | Seam also on symbol · expiration · wings change. Depth capped (default **32** generations — OD-AF2). |
| **AF12 — No profit theater** | Research modes are **structure/surface descriptors**. Forbidden: “edge,” “signal,” “will move,” promised P&L. SRS (if ever) = **research classification** label only. |
| **AF13 — GEX stays separate** | Do not merge Advanced Fly metrics into the GEX template. |
| **AF14 — Default Debit** | `defaultValueMode = debit`. |
| **AF15 — C/P asymmetry dual-book** | Uses call and put books from the **same** generation; does **not** re-fetch. Side filter does not remove the other book from the model. |
| **AF16 — Velocity clock** | Velocity uses **wall time** between samples. Tick count alone is forbidden as Δt. |
| **AF17 — Time honesty (generation pairing)** | Complements AF10 for reconnect / gap / clock-basis honesty: |
| | **(a) Non-monotonic `asOf`:** if a candidate generation’s `asOf` is at or before the newest history entry’s `asOf` (when both have `asOf`), **reject the push** or **seam** — do not append. \(\Delta t \le 0\) ⇒ pair **invalid** for any time-derived mode. |
| | **(b) Single clock basis per pair:** \(\Delta t\) is computed only when **both** samples use the same basis (`asOf`–`asOf` preferred when both present; else `receivedAt`–`receivedAt`). **Mixed** `asOf`/`receivedAt` pair ⇒ invalid \(\Delta t\) (do not cross bases). |
| | **(c) Max gap for tick modes:** if \(\Delta t > T_{\mathrm{max}}\) (OD-AF10, default **15 s** ≈ few × expected generation cadence), **tick-delta modes** (`d_debit`, `pct_change`, `d2_debit` first difference) render the first post-gap sample **invalid**. **Velocity / acceleration** remain computable when \(\Delta t > 0\) and single-basis (their Δt is honest) — they do **not** seam solely for max-gap unless the open-seam (AF10) fires. |
| | **(d) Signed Δt floor:** \(\Delta t \le 0\) or \(\Delta t < 0.5\,\mathrm{s}\) (OD-AF3) ⇒ velocity/acceleration pair invalid. |

---

## 3. Structure geometry (Symmetric Fly heritage)

### 3.1 Legs

On **viewSide** book (call or put matrix):

| Leg | Strike | Qty (signed) |
|-----|--------|--------------|
| Wing low | \(K − w\) | +1 |
| Body | \(K\) | −2 |
| Wing high | \(K + w\) | +1 |

### 3.2 Width columns

Unchanged from parent §5.2:

- `widthMode = step_multiples`: \(w = n · \texttt{strikeStep}\), \(n = 1..N\) (default N=7), `strikeStep` = modal (HM20).  
- `fixed_points` / profile widths: legs must land listed or invalid.  
- Course **Width** vocabulary (H4).

### 3.3 Debit (mid) v1

\[
D(K,w) = m(K-w) + m(K+w) - 2\,m(K)
\]

Incomplete structure or null mid → invalid (AF5).

### 3.4 Credit (mid) v1 — frozen (B3 · N2)

**Long fly debit** \(D\) as §3.3.  
**Credit mode** is the short-fly presentation of the **same** mid structure:

\[
C_{\mathrm{signed}}(K,w) = -D(K,w)
\]

| Rule | Law |
|------|-----|
| Valid iff | Debit cell valid |
| **Model value** | \(C_{\mathrm{signed}}\) (signed; negative when long debit is positive) — for color magnitude and any signed math |
| **Cell display** | **Suite convention** (align PB cards / Builder): show **magnitude** \(\lvert C_{\mathrm{signed}}\rvert = \lvert D \rvert\) with a **CREDIT** (or CR) chip/label — e.g. member reads “0.85 CR”, **not** “−0.85”. Signed string alone is forbidden as the primary cell text. |
| Color | Use \(\lvert C_{\mathrm{signed}}\rvert = \lvert D \rvert\) for magnitude coloring (sticky RoC path) |
| Tooltip | Magnitude + “Short fly credit (mid)” — structure descriptor, not promised fill |

No second formula. No “as-built only” pointer.

### 3.5 R2R (long fly, mid) — structure descriptor only

Parent §5.2.1:

- max structural loss ≈ \(D\) when \(D > 0\)  
- max structural profit ≈ \(w - D\)  
- \(\mathrm{R2R} = \mathrm{maxProfit}/\mathrm{maxLoss}\) when maxLoss > 0  

Invalid when maxLoss ≤ 0 or structure incomplete.

---

## 4. Color

### 4.1 Debit / Credit / RoC (default heritage)

Parent §5.2 RoC color + **§5.2.2 sticky scale** (25% hysteresis) remain the default color path for Debit and Credit (magnitude).

### 4.2 Signed research modes

Modes with signed values (Δ Debit, velocity, slope, curvature, C/P asym, …):

1. Let \(x\) be the mode value for valid cells.  
2. \(S\) = p95 of \(\{|x|\}\) over valid cells; if no valid cells or \(S = 0\), use **1**.  
3. Sticky \(S_{\mathrm{sticky}}\) with **25%** hysteresis (OD-AF8 / parent §5.2.2).  
4. \(t = \mathrm{clamp}(x / S_{\mathrm{sticky}}, -1, 1)\).  
5. Diverging map: light blue → dark blue → dark red → light red (parent spirit).

Optional EWMA on second derivatives: **OD-AF4** (default raw).

---

## 5. Value modes

### 5.1 Wave 1 — MVP (must ship)

| Mode id | Member label | Definition | History |
|---------|--------------|------------|---------|
| `debit` | Debit | \(D(K,w)\) §3.3 | No |
| `credit` | Credit | \(C = -D\) §3.4 | No |
| `pct_change` | % change (tick) | See §5.1.1 | Yes (1) |
| `r2r` | R:R | §3.5 | No |
| `d_debit` | Δ Debit | \(D_t - D_{t-1}\) when pair honest (§5.1.2) | Yes (1) |
| `d2_debit` | Δ² Debit | \(\Delta D_t - \Delta D_{t-1}\) when both Δ honest | Yes (2) |
| `velocity` | Velocity | \(\Delta D / \Delta t_{\mathrm{min}}\) — **debit points per minute**; Δt rules AF16–AF17 | Yes (1) + Δt |
| `acceleration` | Acceleration | \(\Delta v / \Delta t\) with same Δt rules | Yes (2) |
| `slope` | Slope | §5.1.3 (frozen) | No |
| `curvature` | Curvature | §5.1.3 | No |
| `cp_asym` | Call/Put asym | §5.1.4 | No |

**Default:** `debit`.

**Naming note:** Parent v0.2 `pct_change` **column-neighbor** definition is **superseded** for Advanced Fly by **tick %** (prior generation). Implementers must not silently keep column-neighbor under the same label.

#### 5.1.1 `pct_change` (tick)

\[
\mathrm{pct} = \frac{D_t - D_{t-1}}{|D_{t-1}|}
\]

when the history pair is honest (AF17) **and** \(|D_{t-1}| \ge D_{\min}\) (OD-AF11).  
Else **invalid** (not ∞/NaN).

**OD-AF11 default:** \(D_{\min}\) = one product quote tick if known from chain/meta; else **0.05** (SPX-class points). Below floor → invalid (A1).

#### 5.1.2 Tick-delta honesty

`d_debit`, `pct_change`, and the first difference feeding `d2_debit` require:

- Prior sample exists after last seam  
- AF17 max-gap / monotonic / single-basis rules  

#### 5.1.3 Slope and curvature (frozen — B1 · B2)

**Order (normative, independent of display):**  
Centers ordered by **descending strike**: \(K_i > K_{i+1}\) for successive valid centers that form a complete fly at width \(w\).

**Slope (finite difference per strike-point):**

\[
\mathrm{slope}_i(w) = \frac{D(K_i,w) - D(K_{i+1},w)}{K_i - K_{i+1}}
\]

when both debits valid and \(K_i - K_{i+1} > 0\).  
Units: debit points **per strike point**.

**Edge policy (frozen):** there is **no** slope for the last center in the descending sequence (no \(K_{i+1}\)) → cell **invalid**. **Forbidden:** fabricate **0** at the edge (AF5 / HM7). Display row order must not invent slope where the descending chain has no neighbor.

**Curvature (N1 — fail-loud on non-uniform spacing):**

Let \(s_i = \mathrm{slope}_i(w)\), \(s_{i+1} = \mathrm{slope}_{i+1}(w)\) when both valid under the descending-\(K\) chain above.  
The three centers involved are \(K_i > K_{i+1} > K_{i+2}\) (the pair that produced \(s_i\) and the pair that produced \(s_{i+1}\)).

**Uniform-triple gate (frozen):** curvature is **valid only** when both slopes are valid **and**

\[
K_i - K_{i+1} = K_{i+1} - K_{i+2}
\]

(equal strike spacing on the triple). Else **invalid** — do not invent a second-difference across a 5-wide/25-wide boundary.

When valid:

\[
\mathrm{curvature}_i(w) = s_i - s_{i+1}
\]

Edge slopes missing ⇒ edge curvatures invalid.  
**Rationale:** slope is already per-point; raw \(\Delta s\) still mixes shape with spacing when gaps differ. Uniform-triple is fail-loud and matches AF5 / HM7.

#### 5.1.4 Call/Put asymmetry (A2)

\[
\mathrm{cp\_asym}(K,w) = D_{\mathrm{call}}(K,w) - D_{\mathrm{put}}(K,w)
\]

same generation; null if either side incomplete.

**Hotel framing (normative copy intent):** For European-style index options (e.g. SPX/XSP), put–call parity implies theoretical call-fly and put-fly debits are **identical**. Non-zero `cp_asym` measures **quote-book / parity deviation**, not a structural “calls cost more” story. Expected magnitude is often near zero (cents).  

| UI | Law |
|----|-----|
| Display | Prefer **cents** or two-decimal points with tooltip stating “call fly debit − put fly debit (book asymmetry)” |
| Tooltip | Must not read as directional cost edge or trade recommendation |

### 5.2 Wave 2 — optional (program AF-X)

| Mode id | Member label | Definition |
|---------|--------------|------------|
| `width_eff` | Width efficiency | \(D / w\) with \(w > 0\) (OD-AF6 may redefine denominator) |
| `stability` | Surface stability | Correlation / distance of shape fingerprint over last \(M\) debit grids (formula freeze before ship) |

### 5.3 Wave 3 — Coach-gated only (program AF-X2)

| Mode id | Member label | Definition |
|---------|--------------|------------|
| `srs` | Regime class | Composite classification — **research only**. Default **descope** (OD-AF7). |
| `spot_sens` | Spot sensitivity | Needs model or regression — not mid-only MVP |
| `time_decay` | Time decay | Needs θ / hold-spot reprice — later OPF path |

---

## 6. Generation history

### 6.1 Purpose

Enable time-derivative modes without a server matrix store and without re-fetching Massive.

### 6.2 Snapshot contents

Each history entry **must** store at least:

| Field | Meaning |
|-------|---------|
| `asOf` | Generation as-of if present |
| `contentHash` | Generation content hash if present |
| `receivedAt` | Client wall-clock ms when applied |
| `cells` | Map key → \(D\) or null for each needed \((side, K, w)\) |

**Live Debit** is never read-only from history for the Debit mode.

### 6.3 Push rules

1. After each applied chain generation (when heatmap active — implementation choice; **must not** fetch).  
2. Compute full debit grid from current `ChainContext` + width list.  
3. **AF17(a):** if `asOf` is non-monotonic vs newest entry, **reject push** or **seam** — do not append a reverse-time sample.  
4. Push onto ring buffer (depth **N**, default 32).  
5. Drop oldest when over capacity.

### 6.4 Seam rules (AF10 · AF11 · AF17)

**Must seam** (clear buffer or mark discontinuity such that time derivatives become invalid until enough post-seam samples exist) when:

| Event |
|-------|
| Symbol changes |
| Expiration changes |
| Wings / width band definition that invalidates prior \(K,w\) set changes |
| Session posture transitions **into Live** from Held or Closed (**market-plane session SoR**, A4 — same plane as Analyzer B2) |
| Non-monotonic generation handling chooses seam (AF17(a)) |
| Explicit member “Reset history” (if offered) |

**Should seam** when mark basis jumps from pre-open held/theo to live NBBO such that continuous Δ is meaningless. Prefer seam over silent continuous velocity across the open.

### 6.5 Module site

Client module (illustrative): `web/lib/options-lab/templates/flySurfaceHistory.ts`  
Host push site: `HeatmapChainPanel` after `ChainContext` updates.

---

## 7. UI law

### 7.1 Controls

Left rail Value dropdown lists Wave‑1 modes (and Wave‑2 if enabled).  
Default selection: **Debit**.  
Research modes may be visually grouped (Echo) but must not hide Debit.

### 7.2 Template label

Member-facing label per OD-AF9 (recommendation: **“Advanced flies”** or **“Fly surface”** — Coach disposes).  
Description may state research Value modes without claiming edge.

### 7.3 Tooltips

| State | Tooltip intent |
|-------|----------------|
| Valid Debit | Legs + formula |
| Valid Credit | Magnitude + CR chip; short fly credit (mid) §3.4 |
| Valid Velocity | Value + units: **debit points / min** (A3) |
| Valid cp_asym | Book asymmetry framing §5.1.4 — not “calls cost more” |
| Invalid structure | Missing listed wing / null mid |
| Null time derivative | “Needs prior snapshot(s)” / “History reset after session open” / “Gap too large for tick change” |
| C/P incomplete | “Call or put fly incomplete” |

### 7.4 ToS / Analyzer handoff

Unchanged structural export: long fly legs via existing `symFlyTosLegs` (or equivalent).  
Handoff must not invent non-listed strikes (HM8 · OT-EF).

### 7.5 HIG

Human Interface Spec v1.0: ≥44pt controls, tokens, reduced-motion for flash.

---

## 8. Non-goals

| ID | Out |
|----|-----|
| **NG1** | Second Massive or per-template poll |
| **NG2** | Server-stored matrix SoR / Redis matrix keys |
| **NG3** | OPF package-quote as heatmap cell SoR |
| **NG4** | New structure matrices (vertical/iron/BWB) under Advanced Fly id |
| **NG5** | Merging GEX into Advanced Fly |
| **NG6** | Profit/edge marketing of SRS or velocity |
| **NG7** | Multi-expiry fly matrix in v0.2 |
| **NG8** | MSC heatmap code/schemas |
| **NG9** | Edge slope fabricated as zero |

---

## 9. Open decisions (OD-AF*) — Coach Accept/Override at AF0

| # | Question | Recommendation |
|---|----------|----------------|
| **OD-AF1** | Registry id keep `sym-fly` vs `adv-fly` + alias | Keep **`sym-fly`** id; expand modes + label |
| **OD-AF2** | History depth N | **32** |
| **OD-AF3** | Velocity min Δt | **0.5 s** invalid floor (with AF17 \(\Delta t \le 0\)) |
| **OD-AF4** | Δ² / accel smoothing | **Raw** default; optional EWMA later |
| **OD-AF5** | C/P formula | \(D_c - D_p\) (points); display cents OK |
| **OD-AF6** | Width efficiency denominator | \(D/w\) for Wave‑2 |
| **OD-AF7** | SRS in this ship | **Descope** |
| **OD-AF8** | Signed color sticky % | **25%** (parent §5.2.2) |
| **OD-AF9** | Member label | **“Advanced flies”** or **“Fly surface”** — Coach |
| **OD-AF10** | Max gap \(T_{\mathrm{max}}\) for tick modes | **15 s** default (AF17(c)) |
| **OD-AF11** | \(\lvert D_{t-1}\rvert\) floor for pct_change | One quote tick if known; else **0.05** |

**AF0 exit (formula completeness):** Credit §3.4, slope §5.1.3, AF17, and OD-AF10/11 recommendations are **in-spec** — no post-GO Hotel formula invention required for Wave‑1. Hotel still golden-tests them.

---

## 10. Acceptance tests (AT-AF*)

| AT | Intent |
|----|--------|
| **AT-AF1** | Debit cell equals `symFlyDebit` / §3.3 golden for valid \(K,w\) |
| **AT-AF2** | Missing wing → invalid (no invent) |
| **AT-AF3** | `d_debit` null with &lt;2 samples or dishonest pair; equals \(D_t - D_{t-1}\) when honest |
| **AT-AF4** | `velocity` uses single-basis wall Δt; null if \(\Delta t \le 0\) or below floor |
| **AT-AF5** | `slope` = per-point finite difference on descending \(K\); edge **invalid** (never 0); non-uniform spacing does not use raw unnormalized ΔD alone; **curvature** invalid unless uniform triple (\(K_i-K_{i+1}=K_{i+1}-K_{i+2}\)) |
| **AT-AF6** | `cp_asym` same generation dual-book; side toggle does not refetch |
| **AT-AF7** | Value mode switch → zero new chain HTTP/WS interest |
| **AT-AF8** | History depth ≤ N; oldest dropped |
| **AT-AF9** | Seam on symbol / exp / wings / session → Live (market-plane) |
| **AT-AF10** | Default mode Debit; single fly switcher entry |
| **AT-AF11** | Tooltips: no profit claim language for research modes |
| **AT-AF12** | `pct_change` uses prior **generation**, not column neighbor; floor on \(\lvert D_{t-1}\rvert\) |
| **AT-AF13** | Parent non-regression: mode switch still zero-fetch; no-snap still holds |
| **AT-AF14** | Pre-open history does not continuous-velocity into Live without seam |
| **AT-AF15** | Signed-mode color: p95 scale, sticky 25% band, fallback \(S=1\) on sparse grids |
| **AT-AF16** | Credit model \(C_{\mathrm{signed}} = -D\); valid iff Debit valid; **display** = magnitude + CR/CREDIT chip (not primary “−0.85”) |
| **AT-AF17** | Non-monotonic `asOf` rejected/seamed; mixed clock basis invalid Δt; tick modes invalid after max-gap |

Evidence: unit fixtures (Hotel/Kilo) + panel smoke; Massive/HTTP counter flat on mode switch.

---

## 11. Documentation parity

Ship with:

| Artifact | Owner |
|----------|-------|
| This Spec (Coach GO hash **in DL**) | India · Coach |
| DL entry (OD table + GO + sha1) | Lima |
| Arch 29 as-built note (Advanced Fly supersedes sym-fly surface) | Juliet · Lima |
| Bench plan (update OD/AT cites to v0.2) | Juliet |
| AT evidence in gate-reports | Kilo · Delta |

---

## 12. Risks

| Risk | Mitigation |
|------|------------|
| Second-derivative noise | Sticky color · null short Δt · optional EWMA |
| Pre-open theo pollutes velocity | AF10 seam · AT-AF14 |
| Reconnect gap dishonest “tick” | AF17(c) · AT-AF17 |
| Label confusion (% change) | §5.1 tick definition · AT-AF12 |
| Profile / id breakage | OD-AF1 keep `sym-fly` id |
| Scope creep (SRS / spot sens) | NG + OD-AF7 descope |
| cp_asym misread as edge | §5.1.4 Hotel framing · AT-AF11 |
| Non-uniform grid slope error | Per-point finite difference §5.1.3 |

---

## 13. Advisor disposition fold (v0.1 → v0.2)

| ID | Class | Disposition in v0.2 |
|----|-------|---------------------|
| **B1** | Blocking | §5.1.3: descending \(K\) + per-point slope; AT-AF5 |
| **B2** | Blocking | Edge = **invalid** only; “or zero” struck |
| **B3** | Blocking | §3.4 Credit \(C=-D\) frozen; AT-AF16 |
| **B4** | Blocking | **AF17** + §6.3/§6.4; AT-AF17; OD-AF10 |
| **A1** | Advisory | OD-AF11 + §5.1.1 floor |
| **A2** | Advisory | §5.1.4 framing + tooltip law |
| **A3** | Advisory | Velocity units in §5.1 + §7.3 |
| **A4** | Advisory | AF10 market-plane session SoR |
| **A5** | Advisory | AT-AF15 |
| **A6** | Advisory | §0.2 points to §3 geometry |
| **A7** | Advisory | Hash-in-DL convention (header) |
| **A8** | Advisory | OPF-Truth path in §1 parents table |
| **N1** | Residual (v0.2.1) | Curvature uniform-triple gate §5.1.3; AT-AF5 |
| **N2** | Residual (v0.2.1) | Credit display = magnitude + CR chip §3.4; AT-AF16 |

---

## 14. Document control

| Version | Date | Notes |
|---------|------|--------|
| **v0.1** | 2026-08-12 | Initial DRAFT |
| **v0.2** | 2026-08-12 | Advisor fold B1–B4 + A1–A6/A5; AF17 time honesty; Credit formula; slope freeze; OD-AF10/11; AT-AF15–17 |
| **v0.2.1** | 2026-08-12 | N1 curvature uniform-triple; N2 Credit magnitude+chip suite display; still AF0-ready |

**One-line product law:**  
**One OPF-held dual-side chain; Advanced Fly is the Symmetric Fly surface with honest Value modes and client generation history — pure template, never a second data path, never a profit claim.**
