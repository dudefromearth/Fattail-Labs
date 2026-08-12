# FatTail Labs — Options Lab Heatmap Advanced Fly Spec v0.1

**Status:** **SUPERSEDED** by [v0.2](./FatTail-Labs-Options-Lab-Heatmap-Advanced-Fly-Spec-v0_2.md)  
**Date:** 2026-08-12  
**Current revision:** **v0.1** (historical — do not implement)  
**Superseded by:** [FatTail-Labs-Options-Lab-Heatmap-Advanced-Fly-Spec-v0_2.md](./FatTail-Labs-Options-Lab-Heatmap-Advanced-Fly-Spec-v0_2.md) (advisor fold B1–B4 · A1–A8)  
**Supersedes (surface law):** Symmetric Fly section of [Heatmap Templates Spec v0.2](./FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md) **§5.2** for member-visible fly matrix behavior (parent HM1–HM20 remain fully in force)  
**Canonical filename (historical):** `Specs/FatTail-Labs-Options-Lab-Heatmap-Advanced-Fly-Spec-v0_1.md`  
**Type:** Product Spec — pure template Value modes + client generation history over **one** OPF-held dual-side chain  

**Short name:** **Advanced Fly** / **AF**

**Content hash (v0.1):** recompute at Coach GO:  
`shasum -a 1 Specs/FatTail-Labs-Options-Lab-Heatmap-Advanced-Fly-Spec-v0_1.md` → record in DL.

**Process:** Spec review (Coach + Claude) → OD Accept/Override at AF0 → implementation via Full Agent Bench Plan → code/ATs.  
**No implementation seed fire** until Coach **AF0-0 GO**.

**Architecture companion:** [`Architecture/29-options-lab-heatmap-templates.md`](../Architecture/29-options-lab-heatmap-templates.md)  
**Full-agent bench plan:** [`docs/Options-Lab-Heatmap-Advanced-Fly-Full-Agent-Bench-Plan-v1.1.md`](../docs/Options-Lab-Heatmap-Advanced-Fly-Full-Agent-Bench-Plan-v1.1.md) · board `agents/p-options-lab-heatmap/`  
**Parent heatmap plan:** [`docs/Options-Lab-Heatmap-Templates-Full-Agent-Bench-Plan-v1.0.md`](../docs/Options-Lab-Heatmap-Templates-Full-Agent-Bench-Plan-v1.0.md)  
**Proposal input:** Coach research brief `hm-prop.pdf` (Value metrics / regime sensor intent — not code authority)

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
2. **Keeps** base Value modes: Debit · Credit · % Change · R:R (as frozen).  
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
| **Chain model / OPF-held chain** | Dual books `calls` + `puts` + spot + meta for `(symbol, expiration, wings)` — generation plane OPF and Heatmap both consume |
| **Generation** | One applied dual-side snapshot (`contentHash` / `asOf`) |
| **History** | Client ring buffer of debit grids across generations — **not** a price SoR |

---

## 0.2 Relation to parent Heatmap Templates Spec v0.2

| Parent law | Advanced Fly |
|------------|--------------|
| **HM1–HM20** | Fully in force |
| **§5.2 sym-fly** geometry · debit formula · Width · no-snap · RoC color · sticky scale | **Incorporated by reference** and restated in §4; AF is the ship vehicle |
| **§5.2 value modes** Debit · pct_change · r2r | Superseded/extended by **§5** of this Spec |
| **GEX · ladder · vertical · bw-fly** | Unchanged; separate templates |
| **MSC look lawful / code forbidden** | Parent §0.2 applies |
| **Payoff math lawful / profit claims forbidden** | Parent §0.3 applies; extended for research modes in **AF12** |

**Registry identity (OD-AF1):** Prefer **keep template id `sym-fly`** and expand modes + member **label** (e.g. “Advanced flies” / “Fly surface”) so `heatmap_default_template` and profiles do not break. Alternate: id `adv-fly` with alias `sym-fly` → same implementation. **One switcher entry only after ship.**

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

---

## 1. Parents / companions

| Spec / doc | Role |
|------------|------|
| [Heatmap Templates Spec v0.2](./FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md) | HM1–HM20 · framework · parent catalog |
| [OPF Truth & Elegant Failure Doctrine v1.0](./FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.0.md) · **DL-309** | OPF-held chain sole instrument truth (Heatmap consumes that plane) |
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
| **AF3 — Debit formula freeze** | \(D(K,w) = m(K−w) + m(K+w) − 2\,m(K)\) using mid (or parent-frozen fill model). Same as parent §5.2. |
| **AF4 — No snap** | If \(K\), \(K−w\), or \(K+w\) not listed standard strikes → cell **invalid** (HM8). |
| **AF5 — Fail loud cells** | Null mid / missing leg → invalid “—”; never invent Debit, Δ, or velocity (HM7). |
| **AF6 — Pure compute** | `computeCell` / grid build are pure w.r.t. `(ChainContext, params, valueMode, history snapshot)`. No fetch inside templates. |
| **AF7 — Diff once** | Mode / side switch must not multiply chain traffic (HM2). |
| **AF8 — History optional for base modes** | Debit · Credit · R:R · spatial Slope · Curvature · C/P asym **must** work with empty history. Time derivatives **require** history. |
| **AF9 — Incomplete history → null** | Time-derivative modes with insufficient samples → `valid=false`, calm tooltip — not 0, not NaN, not ∞. |
| **AF10 — Open seam** | On session Held/Closed → Live, or when mark basis shifts from pre-open held/theo to live NBBO in a way that discontinuities the surface, history **must** seam (clear or mark discontinuity) so pre-open Δ does not continuous-drive RTH velocity. |
| **AF11 — History keys** | Seam also on symbol · expiration · wings change. Depth capped (default **32** generations — OD-AF2). |
| **AF12 — No profit theater** | Research modes are **structure/surface descriptors**. Forbidden: “edge,” “signal,” “will move,” promised P&L. SRS (if ever) = **research classification** label only. |
| **AF13 — GEX stays separate** | Do not merge Advanced Fly metrics into the GEX template. |
| **AF14 — Default Debit** | `defaultValueMode = debit`. |
| **AF15 — C/P asymmetry dual-book** | Uses call and put books from the **same** generation; does **not** re-fetch. Side filter does not remove the other book from the model. |
| **AF16 — Velocity clock** | Velocity uses **wall time** between samples (generation `asOf` preferred; else receive time). Tick count alone is forbidden as Δt. |

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

**Credit mode (presentation):** use existing as-built credit presentation of the same structure (do not invent a second formula at AF0 without Hotel freeze).

### 3.4 R2R (long fly, mid) — structure descriptor only

Parent §5.2.1:

- max structural loss ≈ \(D\) when \(D > 0\)  
- max structural profit ≈ \(w - D\)  
- \(\mathrm{R2R} = \mathrm{maxProfit}/\mathrm{maxLoss}\) when maxLoss > 0  

Invalid when maxLoss ≤ 0 or structure incomplete.

---

## 4. Color

### 4.1 Debit / RoC (default heritage)

Parent §5.2 RoC color + **§5.2.2 sticky scale** (25% hysteresis) remain the default color path for Debit (and modes that reuse neighbor-column RoC if retained).

### 4.2 Signed research modes

Modes with signed values (Δ Debit, velocity, slope, curvature, C/P asym, …):

1. Let \(x\) be the mode value for valid cells.  
2. \(S\) = p95 of \(\{|x|\}\) over valid cells (or 1).  
3. Sticky \(S_{\mathrm{sticky}}\) with same 25% hysteresis (or OD-AF8).  
4. \(t = \mathrm{clamp}(x / S_{\mathrm{sticky}}, -1, 1)\).  
5. Diverging map: light blue → dark blue → dark red → light red (parent spirit).

Optional EWMA on second derivatives: **OD-AF4** (default raw).

---

## 5. Value modes

### 5.1 Wave 1 — MVP (must ship)

| Mode id | Member label | Definition | History |
|---------|--------------|------------|---------|
| `debit` | Debit | \(D(K,w)\) | No |
| `credit` | Credit | As-built credit presentation of same structure | No |
| `pct_change` | % change (tick) | \((D_t - D_{t-1}) / |D_{t-1}|\) when \(D_{t-1} ≠ 0\); else **invalid**. **Prior sample = previous generation**, not adjacent column. | Yes (1) |
| `r2r` | R:R | §3.4 when frozen/OD Accept | No |
| `d_debit` | Δ Debit | \(D_t - D_{t-1}\) | Yes (1) |
| `d2_debit` | Δ² Debit | \(\Delta D_t - \Delta D_{t-1}\) | Yes (2) |
| `velocity` | Velocity | \(\Delta D / \Delta t_{\mathrm{min}}\) where \(\Delta t_{\mathrm{min}}\) is minutes between samples (wall clock). If \(\Delta t < 0.5\,\mathrm{s}\), treat sample pair invalid (OD-AF3). | Yes (1) + Δt |
| `acceleration` | Acceleration | \(\Delta v / \Delta t\) with same Δt rules | Yes (2) |
| `slope` | Slope | For fixed \(w\), ordered centers \(K_i > K_{i+1}\) (or Spec freeze row order): \(D(K_i,w) - D(K_{i+1},w)\). Edge policy: last row **invalid** or zero — **freeze at GO** (default: **invalid**). | No |
| `curvature` | Curvature | \(\mathrm{slope}_i - \mathrm{slope}_{i+1}\); edges invalid if slope invalid | No |
| `cp_asym` | Call/Put asym | \(D_{\mathrm{call}}(K,w) - D_{\mathrm{put}}(K,w)\) same generation. Null if either side incomplete. | No |

**Default:** `debit`.

**Naming note:** Parent v0.2 `pct_change` column-neighbor definition is **superseded** for Advanced Fly by **tick %** (prior generation). Implementers must not silently keep column-neighbor under the same label.

### 5.2 Wave 2 — optional (program AF-X)

| Mode id | Member label | Definition |
|---------|--------------|------------|
| `width_eff` | Width efficiency | \(D / w\) with \(w > 0\) (OD-AF6 may redefine denominator) |
| `stability` | Surface stability | Correlation / distance of shape fingerprint over last \(M\) debit grids (needs longer buffer; formula freeze before ship) |

### 5.3 Wave 3 — Coach-gated only (program AF-X2)

| Mode id | Member label | Definition |
|---------|--------------|------------|
| `srs` | Regime class | Composite of velocity · acceleration · curvature · asymmetry · stability → discrete classes (e.g. Stable/Compressed → Expanding → Directional → Unstable). **Research classification only.** Default **descope**. |
| `spot_sens` | Spot sensitivity | Requires model or regression — **not** mid-only MVP |
| `time_decay` | Time decay | Requires θ / hold-spot reprice — later OPF path |

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
| `cells` | Map key → \(D\) or null for each \((viewSide, K, w)\) used by the fly grid (or both sides if precomputing C/P) |

**Live Debit** is never read-only from history for the Debit mode; history stores **derived debit grids** computed from each generation for Δ.

### 6.3 Push rules

1. After each applied chain generation while the Advanced Fly template is active (or always when heatmap is open — implementation choice; **must not** fetch).  
2. Compute full debit grid from current `ChainContext` + width list.  
3. Push onto ring buffer (depth **N**, default 32).  
4. Drop oldest when over capacity.

### 6.4 Seam rules (AF10 · AF11)

**Must seam** (clear buffer or mark discontinuity such that time derivatives become invalid until enough post-seam samples exist) when:

| Event |
|-------|
| Symbol changes |
| Expiration changes |
| Wings / width band definition that invalidates prior \(K,w\) set changes |
| Session posture transitions **into Live** from Held or Closed |
| Explicit member “Reset history” (if offered) |

**Should seam** when mark basis of the generation is known to jump from pre-open held/theo package labeling to live NBBO in a way that makes continuous Δ meaningless (align with market-truth open work). Prefer seam over silent continuous velocity across the open.

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

Member-facing label per OD-AF9 (recommendation: **“Advanced flies”** or **“Fly surface”**).  
Description may state research Value modes without claiming edge.

### 7.3 Tooltips

| State | Tooltip intent |
|-------|----------------|
| Valid Debit | Legs + formula (heritage) |
| Invalid structure | Missing listed wing / null mid |
| Null time derivative | “Needs prior snapshot(s)” / “History reset after session open” |
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
| **NG7** | Multi-expiry fly matrix in v0.1 |
| **NG8** | MSC heatmap code/schemas |

---

## 9. Open decisions (OD-AF*) — Coach Accept/Override at AF0

| # | Question | Recommendation |
|---|----------|----------------|
| **OD-AF1** | Registry id keep `sym-fly` vs `adv-fly` + alias | Keep **`sym-fly`** id; expand modes + label |
| **OD-AF2** | History depth N | **32** |
| **OD-AF3** | Velocity min Δt | **0.5 s** invalid floor |
| **OD-AF4** | Δ² / accel smoothing | **Raw** default; optional EWMA later |
| **OD-AF5** | C/P formula | \(D_c - D_p\) (points) |
| **OD-AF6** | Width efficiency denominator | \(D/w\) for Wave‑2 |
| **OD-AF7** | SRS in v0.1 | **Descope** |
| **OD-AF8** | Signed color sticky % | **25%** (parent §5.2.2) |
| **OD-AF9** | Member label | **“Advanced flies”** |

---

## 10. Acceptance tests (AT-AF*)

| AT | Intent |
|----|--------|
| **AT-AF1** | Debit cell equals `symFlyDebit` / §3.3 golden for valid \(K,w\) |
| **AT-AF2** | Missing wing → invalid (no invent) |
| **AT-AF3** | `d_debit` null with &lt;2 samples; equals \(D_t - D_{t-1}\) with 2 |
| **AT-AF4** | `velocity` uses wall Δt; null if below floor |
| **AT-AF5** | `slope` / `curvature` spatial; edge policy matches freeze |
| **AT-AF6** | `cp_asym` same generation dual-book; side toggle does not refetch |
| **AT-AF7** | Value mode switch → zero new chain HTTP/WS interest |
| **AT-AF8** | History depth ≤ N; oldest dropped |
| **AT-AF9** | Seam on symbol / exp / wings / session → Live |
| **AT-AF10** | Default mode Debit; single fly switcher entry |
| **AT-AF11** | Tooltips: no profit claim language for research modes |
| **AT-AF12** | `pct_change` uses prior **generation**, not column neighbor |
| **AT-AF13** | Parent non-regression: mode switch still zero-fetch; no-snap still holds |
| **AT-AF14** | Pre-open history does not continuous-velocity into Live without seam |

Evidence: unit fixtures (Hotel/Kilo) + panel smoke; Massive/HTTP counter flat on mode switch.

---

## 11. Documentation parity

Ship with:

| Artifact | Owner |
|----------|-------|
| This Spec (Coach GO hash) | India · Coach |
| DL entry (OD table + GO) | Lima |
| Arch 29 as-built note (Advanced Fly supersedes sym-fly surface) | Juliet · Lima |
| Bench plan v1.0 (already filed) | Juliet |
| AT evidence in gate-reports | Kilo · Delta |

---

## 12. Risks

| Risk | Mitigation |
|------|------------|
| Second-derivative noise | Sticky color · null short Δt · optional EWMA |
| Pre-open theo pollutes velocity | AF10 seam · AT-AF14 |
| Label confusion (% change) | AF §5.1 tick definition · AT-AF12 |
| Profile / id breakage | OD-AF1 keep `sym-fly` id |
| Scope creep (SRS / spot sens) | NG + OD-AF7 descope |

---

## 13. Document control

| Version | Date | Notes |
|---------|------|--------|
| **v0.1** | 2026-08-12 | Initial DRAFT: replace Symmetric Fly; OPF-held dual-side chain only; pure template; Wave‑1 modes; client history + open seam; AT-AF1…14; OD-AF1…9 |

**One-line product law:**  
**One OPF-held dual-side chain; Advanced Fly is the Symmetric Fly surface with honest Value modes and client generation history — pure template, never a second data path, never a profit claim.**
