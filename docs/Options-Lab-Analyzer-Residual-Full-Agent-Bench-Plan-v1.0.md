# Options Lab Analyzer Residual — Full Agent Bench Plan v1.0

**Date:** 2026-08-11  
**Plan revision:** **v1.0**  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**Board:** [`agents/p-options-lab-analyzer/`](../agents/p-options-lab-analyzer/)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md)  

**Primary law:**

| Doc | Path |
|-----|------|
| **Analyzer Spec content v0.2.1** | [`Specs/FatTail-Labs-Options-Lab-Analyzer-Spec-v0_1.md`](../Specs/FatTail-Labs-Options-Lab-Analyzer-Spec-v0_1.md) |
| **Position Builder Spec v0.2** (+ PB-VIEW-7 fold) | [`Specs/FatTail-Labs-Options-Lab-Position-Builder-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Lab-Position-Builder-Spec-v0_2.md) |
| **OPF Spec v0.2.1** | [`Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md) |
| **DL-301…304** | [`Architecture/00-decision-log.md`](../Architecture/00-decision-log.md) |

**Parents (do not re-litigate):**

| Doc | Role |
|-----|------|
| Market Bus Spec (content **v1.0.1**) | Dual-side generations · session posture plane |
| Chain Picker Spec **v1.0.2** | Universe · OC2 · OC5a · OC6a |
| Heatmap Templates Spec **v0_2** | GEX template · dual-side · posture heritage |
| Human Interface Spec v1.0 | Dialog · panels · fail-loud |
| PB full-agent bench (closed) | [`docs/Options-Lab-Position-Builder-Full-Agent-Bench-Plan-v1.0.md`](./Options-Lab-Position-Builder-Full-Agent-Bench-Plan-v1.0.md) — definition/package path already largely landed |

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates: **PASS / FAIL / BLOCKED** with evidence — **never waived**.  
**Coach may overrule** a specialist finding on the record via **DL entry with reasoning** — that is **not** a gate waive.

**Coach accept (locked before this plan):**

| Lock | Authority |
|------|-----------|
| Analyzer Spec product map | Coach + advisor fold (DL-303) |
| **OD-AZ1–8 Accept** | **DL-304** |
| Advisor B1–B5 / A1–A8 fold | DL-302/303 + Spec §15 |
| PB-VIEW-7 / OD-PB16 | Ratified Accept |

**This plan does not re-open ODs.** It executes residual **as-built → law** gaps.

**Scope honesty:** Close Spec gap map so Analyzer layout, defaults, VP bins-only, Surface OPF mesh, Probability suite panel, and remaining advisor residual code match v0.2.1 law.  
It does **not** ship broker OMS, multi-card aggregate curves, multi-device book (OD-AZ4 out), or MSC theo SoR.  
**MSC is not the standard** (DL-293 · DL-302 presentation-only).

---

## 0. Product / architecture law (in scope)

| Cluster | Ship meaning |
|---------|----------------|
| **Six buckets** | Alerts · Positions · Viewport(s) · Time machine · Models · Controls |
| **Analyzer viewports** | **Risk graph (2D)** \| **Surface (3D)** — same session (AZ-VP-S1…S6) |
| **Attached / suite** | VP bins-only · GEX template · Probability suite panel (OD-AZ6/7/8) |
| **Layout (OD-AZ1/2)** | Top compact controls · viewport · divider · **positions under** · **alerts under list** |
| **Builder defaults** | Market ATM · profile min width · butterfly default (OD-AZ3) · listed-only |
| **Posture / override** | Market-plane session · RECON=`override` when what-if (B2/B4) |
| **Alerts** | First-class · raw-mark evaluate · draw smoothed · 20 of N |
| **Package / card** | OPF SoR · six-state liveState · magnitude invariant · ANALYSIS-only |
| **Surface 3D** | OPF-fed mesh · MSC scene only · no second pricing engine |

**Design invariant:**  
*One Analyzer session; Risk and Surface are canvas modes over the same book, alerts, models, and OPF plane; layout places book under the graph; VP is bins-only; MSC never prices.*

---

## 1. Mission

Close residual Analyzer law so the product matches Spec v0.2.1:

```text
Suite symbol + market posture
  → Analyzer session (Positions · Alerts · Models · Time machine · Controls)
  → Viewport mode: Risk (2D OPF) | Surface (3D OPF mesh)
  → Layout: top controls · canvas · divider · positions · alerts
  → Builder defaults + OPF package coherence
  → Attached: VP bins · GEX template · Probability panel (later phase)
```

| Pillar | Spec / OD | Ship meaning |
|--------|-----------|----------------|
| Layout | AZ-LAYOUT · OD-AZ1/2 | List under viewport; alerts under list; top controls |
| Defaults | AZ-DEF · OD-AZ3 | Butterfly + ATM + profile min wing |
| Posture / override | B2/B4 | Plane session; RECON override |
| Alerts polish | A1/A6/A7 · OD-AZ5 | Raw eval; Enable gates all; 20 of N |
| VP bins-only | AZ-VP-9 · OD-AZ6 | No candles on VP surface |
| Surface mesh | AZ-VP-S* · DL-302 | 3D OPF samples · MSC scene port |
| Probability | OD-AZ8 · A8 | Suite panel · IV/VIX as_of |
| Book hygiene | B5 · A5 | ANALYSIS-only · multi-symbol badge |
| Evidence | AT-AZ + residual | K-G green |

**First smoke after L+P phases:**  
(1) Analyzer opens with list **under** graph and alerts **under** list.  
(2) Empty Builder → butterfly on ATM listed strikes.  
(3) Risk ↔ Surface switch keeps focus + cards.  
(4) VP shows bins only (no candles).

---

## 2. As-built honesty

### 2.1 Keep (already landed)

| Area | Status |
|------|--------|
| OPF 2D Analyzer · packs · outlook pin/re-anchor | Landed |
| Positions book · package quotes · lock · blotter colors | Landed partial |
| Alerts create/list/evaluate/draw | Landed partial |
| Builder listed strikes · live DEBIT/CREDIT | Landed partial |
| Surface viewport **mode shell** (Risk \| Surface switcher) | Landed scaffold |
| Advisor fold B1–B5 · A1–A8 (Spec + partial code) | Landed Spec; partial code |
| `risk-graph/` rename · session-status posture · RECON override chip | Landed |
| OD-AZ1–8 Coach Accept | **DL-304** |

### 2.2 Build (this program — residual matrix)

| Gap | Law | Phase |
|-----|-----|--------|
| W0 GO · hash · board · seeds | Spec · DL | **W0** |
| Layout: top strip · viewport · divider · positions under · alerts under | OD-AZ1/2 | **L** |
| Builder defaults matrix · butterfly default · profile wings | OD-AZ3 · AZ-DEF · A2/A3 | **B** |
| What-if Enable gates all knobs · override banner | A6 · B4 | **T** |
| Alerts: 20 of N · touch profile tick · book multi-symbol badge | A5/A7 · A1 | **A** |
| Card status ANALYSIS-only · package invariant assert | B5 | **D** |
| Generation-driven re-resolve polish · cache stale label | PB-VIEW-5 · A4 | **S** |
| VP bins-only (remove candles) | AZ-VP-9 · OD-AZ6 | **V** |
| Surface 3D mesh OPF-fed (MSC scene port) | AZ-VP-S* · DL-302 | **U** |
| Probability suite panel scaffold | OD-AZ8 · A8 | **R** |
| Full AT matrix · litmus | Spec §10 | **K** |
| As-built · DL close | Spec §11 | **Z** |

### 2.3 Explicit non-phases (out of program)

| ID | Out |
|----|-----|
| **NX1** | Broker OMS |
| **NX2** | Multi-card aggregate risk curves |
| **NX3** | Multi-device / multi-tab book sync (OD-AZ4 deferred) |
| **NX4** | MSC theo / dual pricing SoR |
| **NX5** | GEX suite promotion (OD-AZ7 deferred) |
| **NX6** | VP embed beside Analyzer (OD-AZ6 embed deferred) |
| **NX7** | Full Alert Center SSE / multi-device alerts |

---

## 3. Locked decisions (program)

| ID | Decision |
|----|----------|
| **FP1** | Analyzer Spec content **v0.2.1** is product law for this residual program. |
| **FP2** | **OD-AZ1–8 Accept** (DL-304) — no re-litigation. |
| **FP3** | Surface = **Analyzer viewport mode**, not suite app. |
| **FP4** | Same Positions + Alerts + Models + Time machine + OPF for Risk and Surface. |
| **FP5** | MSC presentation port only (DL-302); OPF prices. |
| **FP6** | VP member canvas = **bins only**. |
| **FP7** | Posture from market plane; clock fallback secondary. |
| **FP8** | RECON=`override` when what-if/spot/VIX active. |
| **FP9** | Alerts evaluate raw mark; draw smoothed. |
| **FP10** | Empty Builder default template = butterfly. |
| **FP11** | Session book only (OD-AZ4). |
| **FP12** | Delta ternary only; Coach overrule needs DL. |
| **FP13** | Documentation parity at Z. |

### 3.1 Seating

| ID | Rule |
|----|------|
| **S1** | **Juliet** owns DAG · seeds · phase order · NX discipline. |
| **S2** | **India** dual-truth · card/viewport/Surface OPF parity · no MSC theo. |
| **S3** | **Alpha** OPF sample/surface API if mesh needs denser samples; session-status; wings from profile. |
| **S4** | **Charlie** layout residual · Builder defaults · VP bins UI · Surface UI shell · Probability page. |
| **S5** | **Echo** control strip · viewport mode control · blotter cards · HIG. |
| **S6** | **Hotel** package natural · RECON override · 1σ honesty · no profit theater. |
| **S7** | **Tango** incomplete/stale/override/Held copy. |
| **S8** | **Mike** auth on market/pricing routes · no client Massive. |
| **S9** | **Foxtrot** deploy notes if feeds/profile config needed. |
| **S10** | **Kilo** AT-AZ residual matrix · R1a if package path touched. |
| **S11** | **Lima** DL · content hash · as-built notes. |
| **S12** | **Delta** all phase gates. |
| **S13** | Seeds on disk before phase gate. |

---

## 4. Phase DAG

```text
W0 ──► L ──► B ──► T ──► A ──► D ──► S ──► V ──► U ──► R ──► K ──► Z
              │         │              │
              └─────────┴── T/A may parallel after L;
                           V may parallel U after S (shared OPF care);
                           R after L (suite page) can start mid-DAG after W0+L
```

| Phase | Name | Depends | Exit summary |
|-------|------|---------|--------------|
| **W0** | GO · board · hash · seeds skeleton | — | Coach W0-0 GO fire; Spec v0.2.1 BUILD authority for residual |
| **L** | Layout residual (OD-AZ1/2) | W0 | Top strip · viewport · divider · positions under · alerts under |
| **B** | Builder defaults matrix (OD-AZ3 · AZ-DEF) | W0 | Butterfly default · ATM · profile min wing · all templates |
| **T** | Time machine / override UX (A6 · B4) | L | Enable gates all knobs · banner · RECON override intact |
| **A** | Alerts polish (A1/A5/A7) | L | Raw eval · 20 of N · multi-symbol badge |
| **D** | Domain hygiene (B5) | W0 | ANALYSIS-only · magnitude invariant tests |
| **S** | Stream / cache stale (VIEW-5 · A4) | W0 | Generation-driven resolve polish · stale cache label |
| **V** | VP bins-only (AZ-VP-9) | W0 | No candles on VP surface |
| **U** | Surface 3D OPF mesh (AZ-VP-S*) | S + L | Mesh from OPF samples · MSC scene only |
| **R** | Probability suite panel (OD-AZ8) | L | Route + panel · IV/VIX as_of label |
| **K** | Full residual AT matrix | all prior | K-G PASS |
| **Z** | As-built · DL close | K | Program close |

**Parallelism:** After **W0**, **B**, **D**, **S**, **V** can start in parallel. **L** unblocks **T**, **A**, **R**. **U** needs **S** (and preferably **L** for full-bleed canvas).

---

## 5. Phase detail

### W0 — Board GO

- Juliet: CHARTER · ORCHESTRATOR · IMPLEMENTATION-PLAN · seeds · gate-reports skeleton.  
- Lima: Spec v0.2.1 hash verify; DL-304 already Accept; DL residual program open.  
- India: parents intact; NX list; DL-302 port boundary.  
- Delta: W0-G PASS → Coach **W0-0 residual BUILD GO**.

### L — Layout residual (OD-AZ1/2)

- Charlie + Echo: restructure `OpfRiskAnalyzer` from left-rail to:
  1. Top compact **Controls** strip  
  2. Viewport (Risk | Surface)  
  3. Divider  
  4. Positions list (blotter cards)  
  5. Alerts under list  
- Preserve session state across layout.  
- AT: visual + testids for layout regions.

### B — Builder defaults (OD-AZ3 · AZ-DEF)

- Charlie: empty create → **butterfly** on ATM listed strikes; min wing from profile.  
- Canonical geometry table Spec §4.3 for all templates.  
- Profile wings / fly_widths[0] (A2/A3).  
- Hotel: listed-only integrity.

### T — Time machine / override (A6 · B4)

- Enable gates **time · vol · spot%** uniformly.  
- Active what-if / override banner.  
- RECON remains `override` when active (already partial).  
- Tango: copy for override/Held.

### A — Alerts polish

- List “showing 20 of N”.  
- Multi-symbol: show all cards; badge off-symbol; focus syncs symbol (A5).  
- Touch tolerance profile field residual if cheap.  
- Raw eval already landed — characterize.

### D — Domain hygiene (B5)

- Enforce status ANALYSIS in create path; document reserved OMS tokens.  
- Assert package magnitude invariant in applyPackageQuote / tests.  
- Kilo unit tests.

### S — Stream / cache stale

- Reduce poll-as-SoR toward generation-driven apply where feasible.  
- Explicit **stale** label on module-cache paint until soft-refresh (A4).  
- India: dual-truth check.

### V — Volume Profile bins-only

- Charlie: strip candlestick series from member canvas; bins (+ optional mid/POC/VA).  
- Keep OHLC store as bin input only.  
- AT: no candle series in DOM/canvas for VP.

### U — Surface 3D OPF mesh

- Port MSC `RiskGraph3DView` scene under `risk-graph/` (DL-302).  
- Feed mesh from OPF samples (Alpha: dense resolve / multi-spot multi-τ or client sample loop **calling OPF only**).  
- Same trade/focus/pack/what-if as Risk mode.  
- Hotel: no MSC theo.  
- AT: mode switch preserves book; mesh updates with pack/focus.

### R — Probability suite panel (OD-AZ8)

- Route `/app/options-lab/probability` (or agreed path) · suite nav entry.  
- Labeled IV/VIX basis + own as_of/session (A8).  
- Structure-relative band when Analyzer-focused card exists (read session book if available).  
- No profit theater (Hotel/Tango).

### K — Evidence

- AT-AZ-1…12 residual + AT-AZ-L1…L6 layout/defaults.  
- Surface mode smoke.  
- VP bins-only.  
- R1a if package path touched (coordinate PB close evidence).

### Z — Close

- Lima: as-built Spec notes · DL program close.  
- Delta: Z-G PASS.  
- No false green on NX items.

---

## 6. Seed index (minimum)

| Seed | Agent | Phase |
|------|-------|--------|
| W0-0-coach-go | Coach | W0 |
| W0-1-lima-hash | Lima | W0 |
| W0-2-india-parents | India | W0 |
| L-1-echo-layout | Echo | L |
| L-2-charlie-layout | Charlie | L |
| B-1-charlie-defaults | Charlie | B |
| B-2-hotel-listed | Hotel | B |
| T-1-charlie-whatif | Charlie | T |
| A-1-charlie-alerts | Charlie | A |
| D-1-alpha-book | Alpha | D |
| S-1-charlie-stale | Charlie | S |
| V-1-charlie-vp-bins | Charlie | V |
| U-1-india-surface-plane | India | U |
| U-2-charlie-surface-mesh | Charlie | U |
| U-3-alpha-opf-sample | Alpha | U |
| R-1-charlie-probability | Charlie | R |
| K-1-kilo-matrix | Kilo | K |
| Z-1-lima-asbuilt | Lima | Z |
| *-G-delta | Delta | each phase |

Seeds under `agents/p-options-lab-analyzer/seeds/`. Expand per phase before fire.

---

## 7. Gate protocol

| Gate | Owner | Evidence |
|------|-------|----------|
| W0-G | Delta | Spec path · DL-304 · board · seeds skeleton |
| L-G | Delta | Layout screenshots · testids · no left-rail book |
| B-G | Delta | Butterfly ATM create · listed wings |
| T-G | Delta | Enable gates all · override banner · RECON override |
| A-G | Delta | 20 of N · multi-symbol badge |
| D-G | Delta | invariant tests green |
| S-G | Delta | stale cache label · resolve behavior note |
| V-G | Delta | VP no candles |
| U-G | Delta | Surface mesh smoke · same book on switch · no MSC theo grep |
| R-G | Delta | Probability route · as_of label |
| K-G | Delta | AT matrix pack |
| Z-G | Delta | as-built · program close |

---

## 8. Definition of Done (program)

1. Layout matches OD-AZ1/2.  
2. Builder empty create = butterfly on ATM + profile min wing; geometry matrix for supported templates.  
3. What-if Enable gates all knobs; RECON override honest.  
4. Alerts raw eval + 20 of N; multi-symbol book badge.  
5. VP bins-only.  
6. Surface 3D OPF-fed mesh; Risk↔Surface preserves session.  
7. Probability suite panel with IV/VIX as_of (minimum viable).  
8. K-G evidence pack; Z as-built notes; NX items not claimed.

---

## 9. Risks

| Risk | Mitigation |
|------|------------|
| OPF lacks dense surface samples for 3D | Alpha designs OPF multi-sample path; India blocks MSC theo shortcut |
| Layout rewrite regresses book state | Session store tests · focus preserve ATs |
| VP candle removal breaks bin input | Keep OHLC store; only strip presentation |
| Scope creep (GEX suite, multi-device book) | NX list · Juliet blocks |

---

## 10. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v1.0** | 2026-08-11 | Residual program after Spec v0.2.1 + OD-AZ1–8 Accept · DL-304 |

**End of plan.**
