# Options Lab Heatmap — Width Fit Full Agent Bench Plan v1.1

**Date:** 2026-08-21  
**Plan revision:** **v1.1** (India review fold B1–B3 · C1–C2 · A1–A6)  
**Canonical filename:** `docs/Options-Lab-Heatmap-Width-Fit-Full-Agent-Bench-Plan-v1.1.md`  
**v1.0 path** is a stub pointer — do not hash it. Specs use underscores (`…-v0_1.md`); this plan uses a **dot** (`…-v1.1.md`).  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**W0 artifact:** [`agents/go/OLHWF-W0.md`](../agents/go/OLHWF-W0.md) — Delta reads **this file**, not chat (**DL-328**, landed).  
**Board:** [`agents/p-options-lab-heatmap-width-fit/`](../agents/p-options-lab-heatmap-width-fit/)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · [`AGENTS.md`](../AGENTS.md)

**Primary law:**

| Doc | Path | Status |
|-----|------|--------|
| **Width Fit Spec v0.1.1** | [`Specs/FatTail-Labs-Options-Lab-Heatmap-Width-Fit-Spec-v0_1.md`](../Specs/FatTail-Labs-Options-Lab-Heatmap-Width-Fit-Spec-v0_1.md) | **BUILD AUTHORITY** · **OD-W1…W6 Accept** · **DL-525** · sha1 `739cb93a0e50800ce1c08b19269e4148963bf05c` |
| Heatmap Templates Spec v0.2 | [`Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md) | HM1–HM20 apply in full · **§5.2.1** R2R when maxLoss \(> 0\) |
| Advanced Fly Spec v0.2.1 | [`Specs/FatTail-Labs-Options-Lab-Heatmap-Advanced-Fly-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Lab-Heatmap-Advanced-Fly-Spec-v0_2.md) | Geometry · debit · dual-side · existing Value modes |
| Arch **29** | [`Architecture/29-options-lab-heatmap-templates.md`](../Architecture/29-options-lab-heatmap-templates.md) | As-built heatmap |
| OPF Truth · **DL-309** | [`Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md`](../Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md) | Landed 2026-08-12 |
| Human Interface Spec v1.0 | [`Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md`](../Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md) | HIG · ≥44 pt |
| Parent heatmap boards | [`docs/Options-Lab-Heatmap-Advanced-Fly-Full-Agent-Bench-Plan-v1.1.md`](./Options-Lab-Heatmap-Advanced-Fly-Full-Agent-Bench-Plan-v1.1.md) · [`docs/Options-Lab-Heatmap-Templates-Full-Agent-Bench-Plan-v1.0.md`](./Options-Lab-Heatmap-Templates-Full-Agent-Bench-Plan-v1.0.md) | **Closed Wave‑1** — do not reopen |
| **FI-040** | [`Architecture/flagged-ideas.md`](../Architecture/flagged-ideas.md) | Landed 2026-08-21 · FTI / StudioOne persistence |

**Spec status:** v0.1.1 **BUILD AUTHORITY**. **WF0-0 GO** stamped (`OLHWF-W0.md` · **DL-525**). Fire **WF1**.

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates: **PASS / FAIL / BLOCKED** with evidence — **never waived**.  
**Coach may overrule** a specialist finding via **DL entry with reasoning** — that is **not** a gate waive.

---

## 0. Product decisions (this program)

**L1–L6 LOCKED at WF0-0 · DL-525.** OD-W1…W6 Accept. JR1–7 Accept.

| ID | Decision | Source | State |
|----|----------|--------|--------|
| **L1** | Width Fit is a **value mode** on Advanced Fly / `sym-fly`. **No second switcher entry.** | OD-W1 Accept | **LOCKED** |
| **L2** | Member-set **criteria weights** + a shipped, documented **default preset**. Platform-fixed ranking weights forbidden. Does **not** include the stability penalty (OD-W6). | OD-W2 Accept | **LOCKED** |
| **L3** | Width Fit **≠ SRS**. Member-defined criteria only. Platform-weighted composites that recommend remain descoped. | OD-W3 Accept | **LOCKED** |
| **L4** | Template is **pure** of the current dual-side generation + params + valueMode (HM6). Multi-snapshot persistence, fit time-series, and weight calibration → **FatTail Intelligence / StudioOne** (**FI-040**). | OD-W4 Accept | **LOCKED** |
| **L5** | Vocabulary is observation-only. Forbidden terms in Spec §8.3. | OD-W5 Accept | **LOCKED** |
| **L6** | Neighborhood **stability is a mandatory penalty outside the member weight vector**, with a config floor. Isolated high scores are suppressed. A member **cannot** disable L6 by zeroing a weight. Stability is **not** also a weighted component (no double count). | OD-W6 Accept (a) | **LOCKED** |
| **L7** | Per-width valid-center count \(n\) is honest. Aggregates use **only** that width’s valid cells. Footer surfaces \(n\). Mean is forbidden for the primary aggregate (median or 20% trimmed mean). | Spec WF2 · §7 | Spec law |
| **L8** | `computeCell` emits **raw components only**. No weighted sum. No cross-cell or cross-width normalize. That work is **only** in `assignColors`. | Spec §4 | Spec law |
| **L9** | Default Advanced Fly `valueMode` stays **`debit`**. Selecting Width Fit does not steal the fly default. | Juliet · existing AF law | Plan lock (not an OD) |
| **L10** | Spec hash at GO = whole-file sha1 **in DL** (not in-file). | AF A7 pattern | Process lock |

**This plan does not re-open:** Market Bus Redis posture · dual-side HM15–20 · GEX · Analyzer residual · Advanced Fly Wave‑1 modes · AF-X optional `width_eff`/`stability` leftovers (those are **not** Width Fit).

**AF-X vs this board:** AF-X (`width_eff` · `stability` as extra Advanced Fly modes) is a leftover optional on `p-options-lab-heatmap`. **Do not implement AF-X as Width Fit.** This program is the member-facing fit surface.

---

## 1. Mission

```text
OPF-held dual-side generation
  → existing Advanced Fly / sym-fly K×w matrix
  → Width Fit value mode (pure computeCell + assignColors)
       + member criteria weights + default preset
       + neighborhood stability penalty (WF1 · OD-W6)
       + honest per-width n (WF2)
  → Footer (median · n · quality · stability)
  → Progressive disclosure → full matrix → inspector
  → Observation-only copy (WF5)
```

| Pillar | Spec | Ship meaning |
|--------|------|----------------|
| Geometry | §3 · HM8 | Same long fly; listed \(K \pm w\) or invalid |
| Components | §4 · §6 | Raw efficiencies only in `computeCell` |
| Composite | §5.1 · WF1 | `width_fit` in `assignColors`: normalize, then member weights, then stability **penalty** |
| Footer | §7 · §8.1 · WF2 | Median · \(n\) · flags; low \(n\) cannot read as high-fit |
| Disclosure | §8.1 | Footer first; expand; hover; inspector |
| Copy | §8.3–8.4 | Width Fit / Fit score / No reliable fit yet / Unstable Surface |
| Zero-fetch | HM6 · AT-WF1 · AT-WF5 | Mode / weight change = no Massive |

**First smoke after WF1 + WF2 + WF3:**  
(1) Value dropdown includes **Width Fit**; switcher still one fly entry.  
(2) Missing wing → `—` / invalid; never a high fit.  
(3) Isolated spike cell is visually quieter than a coherent same-width neighborhood.  
(4) Footer \(n\) matches valid centers; wide columns have smaller \(n\).  
(5) Weight edit re-scores with **zero** Massive.  
(6) No “optimizer / opportunity / recommendation / BOS” strings.

---

## 2. As-built honesty

### 2.1 Keep (do not rebuild)

| Area | Path |
|------|------|
| Dual-side bus · push/diff | Market Bus · `useOptionChainBus` |
| Template registry · types | `web/lib/options-lab/templates/{registry,types}.ts` |
| Advanced Fly id `sym-fly` | `web/lib/options-lab/templates/symFly.ts` |
| Debit formula \(D = m(K-w)+m(K+w)-2m(K)\) | `pricing.ts` · `symFlyDebit` |
| Existing Value modes (debit, credit, r2r, greeks, slope, curvature, cp_asym) | `symFly.ts` |
| `flySurfaceHistory` | **As-built Advanced Fly history.** **Out of WF1** (A2). Not a Width Fit `ctx` field unless Hotel’s golden list after WF0-2 requires it — then it is an **explicit** context input with an absence fixture. |
| Heatmap panel · Value switcher | `HeatmapChainPanel.tsx` · `HeatmapControlsColumn.tsx` |
| Sticky color hysteresis 25% | Heatmap Templates **§5.2.2** · `color.ts` |
| Default widths `[10,15,…,50]` | Already `sym-fly` columns |
| Parent AF0 GO | `agents/p-options-lab-heatmap/gate-reports/` — closed Wave‑1 |

### 2.2 Build (this program)

| Gap | Spec | Phase |
|-----|------|--------|
| WF0 GO · OD-W1…W6 · Spec sha1 in DL · seeds | Spec §13 | **WF0** |
| `ValueModeId` + params (`weights`, `min_valid_n`, `stability_penalty_strength`, …) | §3.3 · §5 | **WF1** |
| Pure **raw** components + quality gates | §4 · §6 | **WF1** |
| Neighborhood stability **penalty** · per-width normalize · member weights · sticky sequential palette · opacity | §7 · WF1 · OD-W6 | **WF2** |
| Footer · expand · inspector · weight editor · legend / state machine | §8 | **WF3** |
| AT-WF1…12 | Spec §11 | **WF4** |
| DL · Arch 29 · AGENTS · close | Spec §14 | **WF5** |
| Intelligence snapshot / calibration | Spec §10 · §12 Phase 4 | **WF-I — never on this board** |

### 2.3 Explicit non-phases

| ID | Out |
|----|-----|
| **NX1** | Second Massive / per-template poll |
| **NX2** | Server matrix SoR / Redis fit keys |
| **NX3** | Package-quote as heatmap SoR |
| **NX4** | Platform recommendation weights / ranking-as-signal |
| **NX5** | Snap legs to nearest strike (HM8) |
| **NX6** | Silent zeros for missing data (HM7) |
| **NX7** | Profit / performance / “buy” chroma (traffic-light red/green) |
| **NX8** | Second fly switcher entry |
| **NX9** | Change Advanced Fly **default** off Debit |
| **NX10** | Re-open AF Wave‑1, GEX, Analyzer, Market Bus Redis |
| **NX11** | Implement leftover **AF-X** `width_eff`/`stability` as this product |
| **NX12** | Multi-snapshot fit history / weight calibration (FI-040) |
| **NX13** | MiniTwo unless Coach asks a deploy |
| **NX14** | `flySurfaceHistory` as an implicit Width Fit input in WF1 (A2) |

---

## 3. Open decisions (OD-W*) — Coach Accept/Override at WF0

Spec recommendations (Coach disposes). **Not rulings until WF0-0.**

| # | Question | Spec / Juliet recommendation |
|---|---------|------------------------------|
| **OD-W1** | Surface shape | New `width_fit` **value mode** on `sym-fly`. No second switcher. |
| **OD-W2** | Criteria weights | Member-set + shipped documented default preset. |
| **OD-W3** | Relation to SRS | Width Fit ≠ SRS. Member criteria only. |
| **OD-W4** | History / calibration | Relocate to FTI / StudioOne. Template stays pure. |
| **OD-W5** | Name | “Width Fit” throughout. Forbidden list Spec §8.3. |
| **OD-W6** | Stability vs weights (**B3**) | **(a) recommended:** stability is a **penalty outside** the member weight vector, with a **config floor** on `stability_penalty_strength`. Isolated spikes cannot be turned off by a zero weight. Do **not** also score `surface_stability` as a weighted component (double count). Spec §3.3 currently lists `surface_stability` in `weights` — OD-W6 would **amend** that at GO; the Spec sentence stays until Coach stamps. Alternative (b): component with a **minimum weight**. |

Juliet recommendations (Coach disposes at the same stamp):

| Rec | Default if Coach silent at GO |
|-----|-------------------------------|
| **JR1** | Default preset = **equal weight** on the **criteria** components only. If OD-W6 (a): **\(1/7\)** (stability out of the vector). If Coach keeps eight weights: \(1/8\). Hotel may file a modest convexity tilt (gamma + curvature) beside it; Coach picks. |
| **JR2** | `min_valid_n` default **5**. |
| **JR3** | `normalization` default **`per_width`**. |
| **JR4** | Supporting component modes are **inspector fields** in v0.1. Do **not** add seven extra Value-dropdown ids unless Echo WF0-3 asks. `payoff_efficiency` **aliases** existing `r2r` internally. \(D \le 0\) is already invalid under Templates **§5.2.1** (`maxLoss > 0`) — **one** Kilo fixture, not two (A6). |
| **JR5** | Primary aggregate = **median**. |
| **JR6** | Keep `debit` as Advanced Fly defaultValueMode. |
| **JR7** | OD-W6 **(a)** if Coach silent. |

---

## 4. Roster & seating

| Callsign | Role |
|----------|------|
| **Coach** | WF0-0 GO · OD-W* · JR* · ship/no-ship |
| **Juliet** | Board · seeds · DAG · AF-X isolation |
| **India** | Spec integrity · HM1–20 · WF1–5 · hash procedure · OD table · **L1–L5 still provisional** |
| **Hotel** | Component formulas golden · debit sign · neighborhood math · OD-W6 · no invented greeks |
| **Charlie** | `widthFit.ts` + `symFly` mode + panel footer/inspector/weights |
| **Echo** | Palette · footer · progressive disclosure · weight editor HIG |
| **Tango** | Vocabulary · legend · inspector phrases · no profit theater · **best/top/strongest** |
| **Kilo** | AT-WF1…12 · zero-fetch · isolated-spike fixture · AF Wave‑1 byte-identical |
| **Delta** | Phase gates ternary |
| **Lima** | DL GO + sha1 · Arch 29 · AGENTS pointer |
| **Mike** | Client-only; no new trust boundary |
| **Foxtrot** | Deploy only if Coach asks (usually N/A) |

| Seat | Rule |
|------|------|
| **S1** | Juliet owns DAG · NX discipline |
| **S2** | India Spec / HM dual-truth / provisional L* |
| **S3** | Charlie pure module + panel |
| **S4** | Hotel math golden |
| **S5** | Echo HIG (no traffic-light) |
| **S6** | Tango observation-only |
| **S7** | Kilo AT-WF* |
| **S8** | Delta all gates |
| **S9** | Lima DL + hash |
| **S10** | Seeds on disk before phase gate |

---

## 5. Sacred invariants (this program)

1. No MSC heatmap code.  
2. **OPF-held dual-side chain only** (**DL-309**, landed).  
3. Pure templates — no fetch in `computeCell` / `assignColors` (HM6). Inputs are `ctx + params + valueMode` only.  
4. Mode or weight switch = **zero Massive** (AT-WF1 · AT-WF5).  
5. Side = view filter only (HM16). Dual-side model always present (HM15).  
6. No snap (HM8). Unlisted \(K \pm w\) → invalid.  
7. Incomplete / null mid / null required greek → invalid or poor quality — **never a high fit** (HM7 · AT-WF11). \(D \le 0\) is the same invalid law as Templates §5.2.1 / existing `r2r`.  
8. Neighborhood stability is a **penalty in `assignColors`**, not a member-zeroable weight (**OD-W6 rec**).  
9. Footer \(n\) and aggregates use **only** valid cells of that width (WF2 · AT-WF10).  
10. Arithmetic **mean** is forbidden for the primary width aggregate.  
11. No profit claims · no “optimizer / opportunity / recommendation / BOS” (WF5 · AT-WF8).  
12. Color is muted sequential (teal → amber), **not** debit red/green. Sticky hysteresis §5.2.2 (AT-WF7).  
13. Default fly mode remains Debit (L9).  
14. Intelligence persistence is **out** (NX12 · **FI-040**, landed).  
15. Delta ternary; Coach overrule needs DL.  
16. Docs parity at WF5.  
17. L1–L6 locked at WF0-0 · **DL-525**.

---

## 6. Technical design (implementers)

### 6.1 Expected files

| Path | Action |
|------|--------|
| `web/lib/options-lab/templates/widthFit.ts` | **New** — raw components, quality gates, neighborhood **penalty**, per-width aggregates |
| `web/lib/options-lab/templates/widthFit.test.ts` | AT-WF2…6 · AT-WF10–11 fixtures · **one** \(D\le 0\) path (alias `r2r` §5.2.1) |
| `web/lib/options-lab/templates/widthFit.stability.test.ts` | AT-WF4 isolated spike vs coherent region |
| `web/lib/options-lab/templates/widthFit.vocab.test.ts` | AT-WF8 forbidden-string scan of UI copy sources |
| `web/lib/options-lab/templates/types.ts` | `ValueModeId` += `width_fit`; params: criteria `widthFitWeights` (no stability slot if OD-W6 a), `minValidN`, `stabilityPenaltyStrength` with floor, `widthFitNormalization`; `GridCell` optional `components`, `qualityFlag` |
| `web/lib/options-lab/templates/symFly.ts` | Register mode; `computeCell` **delegate** only; `assignColors` branch for `width_fit`. Wave‑1 modes **byte-identical** on fixture (A5). |
| `web/lib/options-lab/templates/color.ts` | Sequential muted teal→amber mapper + sticky (do **not** reuse `debitColor` red/blue) |
| `web/lib/options-lab/templates/pricing.ts` | Reuse `symFlyDebit` only — no second debit formula |
| `web/components/options-lab/HeatmapChainPanel.tsx` | Footer row · expand · hover/inspector when mode is Width Fit |
| `web/components/options-lab/HeatmapControlsColumn.tsx` | Weight editor + legend when mode is Width Fit |
| Spec / Arch / DL | India · Lima at WF0 / WF5 |

**Do not** dump Width Fit math into `symFly.ts`. That file already owns Wave‑1. First-principles: a pure module, one call site.

### 6.2 computeCell (WF1)

Pure `(ctx, params, valueMode, K, w, side)`. **No** `flySurfaceHistory`. **No** weighted sum.

1. Three listed legs or invalid (HM8).  
2. \(D = m(K-w)+m(K+w)-2m(K)\) via existing `symFlyDebit`.  
3. Quality gates (Spec §6): missing leg, null mid, null required greek, **negative long debit**, crossed market, extreme spread vs `quality_thresholds`. \(D \le 0\) is the **same** invalid as Templates §5.2.1 / existing `r2r` (`maxLoss > 0`) — one fixture (A6).  
4. Raw components (Spec §4). Division by \(D\le 0\) → invalid, not Inf.  
5. Return `{ display: null, value: null, valid, components, qualityFlag, tooltip? }` for `width_fit`. `value` stays **null** until `assignColors` writes the composite. Cell interiors show **no numbers by default** (Spec §8.1).  
6. Call and put independently; asymmetry derived.

`width_fit` **composite is not computed here.** `computeCell` emits **raw components only**. Normalize, member weights, and the stability **penalty** run in `assignColors` (L8).

### 6.3 assignColors (WF2)

After the full grid:

1. Same-width neighbors ±1 / ±2 centers → dispersion (MAD or first-difference variance).  
2. Apply a **stability penalty** scaled by `stability_penalty_strength` **only**, clamped to a **config floor** (OD-W6 rec a). **Do not** multiply by `weights.surface_stability`. **Do not** also include stability as a weighted component.  
3. Normalize raw components **per width** (default) or **grid**, **then** apply member criteria weights. Weights never hit un-normalized mixed units (B2).  
4. Map to muted teal → amber with §5.2.2 sticky 25% hysteresis.  
5. Opacity from quality + stability.  
6. Outline only if high-fit **and** high-stability **and** good-quality.  
7. Attach per-width `{ median, n, quality, stability, lowConfidence }` for the footer.

### 6.4 UI (WF3)

When `valueMode === "width_fit"`:

| Surface | Behavior |
|---------|----------|
| Footer | One cell per width: median fit, \(n\), quality flag, compact stability. \(n < min_valid_n\) → low-confidence treatment, **not** high-fit chrome. |
| Default matrix | Low-density overview of **coherent high-fit regions** (and the **highest-fit width in a neighborhood**, if Echo shows a marker). **Explicit expand** → full \(K \times w\). Tango WF0-4 **decides** whether “best,” “top,” or “strongest” is allowed; default until then: **do not ship “best”** (A3). |
| Hover | Compact tooltip: key components + observation phrase (Tango). |
| Click / inspector | Full component breakdown (call vs put), neighborhood, delta vs width median, structure-descriptive sentence. High-cell / moderate-width note (Spec §8.4). |
| Weights | Member-editable **criteria** weights; default preset visible; live re-score. ≥44 pt. Stability penalty is **not** a slider-to-zero. |
| Legend | Instructional framing paragraph (Spec §8.4). States: Strong Fit / Moderate Fit / No Clear Fit / Unstable Surface / No reliable fit yet. |

### 6.5 Sequence

```text
generation (bus)
  → ChainContext (existing)
  → computeCell × (K,w)   // raw components, valid flags only
  → assignColors          // normalize → weights → stability penalty → colors, footer stats
  → panel                 // footer / expand / inspector
```

Weight or mode change **does not** subscribe or fetch.

---

## 7. Phase DAG

```text
Critical path:

WF0 ──► WF1 ──► WF2 ──► WF3 ──► WF4 ──► WF5
                 │         │
                 └─────────┴── (WF3 may overlap late WF2 chrome, not math)

Off path (never drawn into WF4):

WF-I  Intelligence / StudioOne persistence   — FI-040 only; do not convene
```

| Phase | Name | Depends | Exit |
|-------|------|---------|------|
| **WF0** | Spec GO · OD-W* · JR* · seeds · hash procedure | — | Coach WF0-0 |
| **WF1** | Pure calculation | WF0-0 | WF1-G |
| **WF2** | assignColors + stability + palette | WF1 | WF2-G |
| **WF3** | Footer · disclosure · inspector · weights · copy | WF2 (chrome overlap OK) | WF3-G |
| **WF4** | AT-WF1…12 | WF1 · WF2 · WF3 | WF4-G |
| **WF5** | DL · Arch 29 · AGENTS · close | WF4 | WF5-G · Coach close |
| **WF-I** | FTI snapshot / calibration | Coach FTI program | **never this board** |

**WF0-G + WF0-0 block all code.** WF1 is the first file-touching implementation phase. There is no gate named `W0-G` on this board (A4).

---

## 8. Phases, seeds, gates

Seeds live under [`agents/p-options-lab-heatmap-width-fit/seeds/`](../agents/p-options-lab-heatmap-width-fit/seeds/).

### Phase WF0 — Spec GO + board lock

| Seed | Agent | Intent |
|------|-------|--------|
| **WF0-1** | India | Spec v0.1 **file exists** · HM1–20 apply · WF1–5 · OD-W1…W6 table ready · L1–L5 still **PROVISIONAL** · whole-file sha1 **procedure** (not yet in DL) · no post-GO formula invent |
| **WF0-2** | Hotel | Golden list for §4 components; quality gates; neighborhood **penalty** (OD-W6 a); default-preset rec (equal \(1/7\) vs tilt) |
| **WF0-3** | Echo | Footer + expand IA; sequential palette (not debit RoC); weight editor HIG; JR4 dropdown vs inspector |
| **WF0-4** | Tango | §8.3 vocabulary + §8.4 legend; inspector phrases; AT-WF8 scan list; **rule on “best” / “top” / “strongest”** (A3) |
| **WF0-5** | Charlie | Feasibility: `widthFit.ts` + `symFly` delegate + panel hooks; do not change default Debit; no `flySurfaceHistory` in WF1 |
| **WF0-6** | Mike | Client-only; no new secrets / endpoints / trust boundary |
| **WF0-7** | Delta | AT-WF1…12 ownership matrix; ternary plan; **WF0-G** name only |
| **WF0-8** | Juliet | Seeds on disk (this board); AF-X isolation note on heatmap board |
| **WF0-9** | Lima | DL draft: GO · OD-W1…W6 · sha1 procedure · Arch 29 outline |
| **WF0-G** | Delta | All WF0-* PASS/FAIL; OD + JR table ready; L1–L5 still unlabeled as rulings; seeds on disk |
| **WF0-0** | Coach | Stamp [`agents/go/OLHWF-W0.md`](../agents/go/OLHWF-W0.md) **after** WF0-G. OD-W1…W6 Accept/Override. JR1–7. Spec sha1 → DL. |

### Phase WF1 — Pure calculation

| Seed | Agent | Intent |
|------|-------|--------|
| **WF1-0** | Hotel · Charlie | `widthFit.ts`: **raw** components + gates; `symFly` `computeCell` branch; types/params; **no** weighted sum; **no** history |
| **WF1-1** | Kilo | Invalid paths: missing wing, null mid, **one** \(D\le 0\) / `r2r` §5.2.1 fixture, crossed, wide spread, null greek |
| **WF1-2** | Hotel | Formulas match Spec §4; no invented smile; \(D\) only from `symFlyDebit`; L8: raw only |
| **WF1-G** | Delta · Hotel · Kilo | Raw components green; **existing Advanced Fly modes byte-identical on fixture** (A5); zero fetch on mode switch (smoke) |

### Phase WF2 — assignColors + stability

| Seed | Agent | Intent |
|------|-------|--------|
| **WF2-0** | Charlie · Hotel | Neighborhood ±1/±2; **penalty outside weights** (OD-W6); normalize **then** criteria weights; footer stats (`median`, `n`, lowConfidence) |
| **WF2-1** | Echo · Charlie | Teal→amber sequential; sticky 25%; opacity; high-fit outline gates |
| **WF2-2** | Kilo | AT-WF3 \(n\); AT-WF4 isolated spike; AT-WF7 hysteresis; AT-WF10 low \(n\) |
| **WF2-G** | Delta · Hotel · Echo · Kilo | Penalty in the score; member cannot zero it; mean unused; colors not debit RoC |

### Phase WF3 — UI surface

| Seed | Agent | Intent |
|------|-------|--------|
| **WF3-0** | Echo · Charlie | Footer + progressive disclosure (default collapsed overview → expand) |
| **WF3-1** | Charlie · Echo | Inspector + member **criteria** weight editor; live re-score; no stability-to-zero slider |
| **WF3-2** | Tango · Charlie | Legend, states, tooltips, inspector sentences; instructional framing |
| **WF3-G** | Delta · Echo · Tango | Member-usable; Debit regression still green; no forbidden vocab |

### Phase WF4 — Acceptance pack

| Seed | Agent | Intent |
|------|-------|--------|
| **WF4-0** | Kilo | AT-WF1…12 on disk with command evidence |
| **WF4-1** | Delta · Kilo | Zero-fetch characterization (mode + weights) |
| **WF4-G** | Delta | Full AT pack PASS |

### Phase WF5 — Docs close

| Seed | Agent | Intent |
|------|-------|--------|
| **WF5-0** | Lima | DL GO residual · Arch 29 as-built row · AGENTS pointer honesty |
| **WF5-1** | India | Spec changelog if anything as-built drifted (incl. OD-W6 vs Spec §3.3); hash still matches GO or new DL |
| **WF5-G** | Delta · Lima | Docs parity |

### Phase WF-I — not this board

Do **not** write implementation seeds. Lima may keep **FI-040** open.

---

## 9. Characterization (WF4-G is this set)

| Id | Assert |
|----|--------|
| **AT-WF1** | `width_fit` / components recompute on each applied generation; valueMode or weight change → **zero** extra Massive |
| **AT-WF2** | Missing leg or non-listed \(K \pm w\) → invalid (HM7 / HM8) |
| **AT-WF3** | Wider columns → fewer valid centers near band edges; footer \(n\) matches |
| **AT-WF4** | Isolated high cell down-weighted vs a coherent same-width region of similar raw scores |
| **AT-WF5** | Member weights re-score and can change cell / width order without chain re-fetch |
| **AT-WF6** | Default preset produces a usable surface on a normal RTH fixture |
| **AT-WF7** | Sticky hysteresis §5.2.2; ordinary mid moves do not re-normalize |
| **AT-WF8** | No forbidden vocabulary in labels, tooltips, or state text (incl. Tango’s ruling on “best”) |
| **AT-WF9** | “No reliable fit yet” / “Unstable Surface” reachable |
| **AT-WF10** | Aggregates use only that width’s valid cells; \(n < min_valid_n\) is low-confidence, not high-fit |
| **AT-WF11** | Negative debit, crossed market, extreme spread, null critical greek never yield a high fit. \(D\le 0\) = Templates §5.2.1 / `r2r` — **one** fixture |
| **AT-WF12** | Footer aggregates change when weights change (no re-fetch) |

Hotel / India: no second pricer; no snap; no silent zero.

Copy of this table: [`agents/p-options-lab-heatmap-width-fit/characterization-list.md`](../agents/p-options-lab-heatmap-width-fit/characterization-list.md).

---

## 10. Out of this program

- MSC source, vendor, copy  
- Reopening `p-options-lab-heatmap` AF0–AF-Z  
- Implementing AF-X as Width Fit  
- GEX / vertical / bw-fly law  
- Analyzer / Surface / T Ortho  
- FTI snapshot grid / StudioOne calibration (FI-040)  
- `flySurfaceHistory` as a silent WF1 input  
- MiniTwo unless Coach asks  
- Editing Width Fit Spec body except changelog + OD rulings at GO  

---

## 11. Status

Plan revision **v1.1**. Spec **v0.1.1 BUILD AUTHORITY**.  
**WF0-0 GO** · **DL-525** · sha1 `739cb93a0e50800ce1c08b19269e4148963bf05c`.

**Delivered:** WF1–WF5 as-built · **DL-526**. Next is Coach walk on `/app/options-lab/heatmap` → Value → Width Fit.

### v1.1 changelog (India review)

| Id | Fold |
|----|------|
| **B1** | L1–L5 marked PROVISIONAL → lock at WF0-0. India WF0-1 owns the check. |
| **B2** | Struck pre-stability weighted sum. `computeCell` = raw components only. Weights after normalize in `assignColors`. |
| **B3** | **OD-W6** rec (a): stability penalty outside the weight vector, config floor. JR7. |
| **C1** | Spec path exists. |
| **C2** | DL-309 · DL-328 · FI-040 confirmed landed. |
| **A1** | Canonical filename `…-v1.1.md` (dot). Spec remains `…-v0_1.md` (underscore). |
| **A2** | `flySurfaceHistory` **out of WF1** (NX14). |
| **A3** | Default matrix does not ship “best”; Tango WF0-4 rules the word. |
| **A4** | Gate name is **WF0-G** only. |
| **A5** | WF1-G includes Advanced Fly modes byte-identical on fixture. |
| **A6** | `payoff_efficiency` aliases `r2r`; one \(D\le 0\) fixture (Templates §5.2.1). |

**End of Heatmap Width Fit Full Agent Bench Plan v1.1**
