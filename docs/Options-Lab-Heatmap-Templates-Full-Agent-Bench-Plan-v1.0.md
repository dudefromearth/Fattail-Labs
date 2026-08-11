# Options Lab Heatmap Templates — Full Agent Bench Plan v1.0

**Date:** 2026-08-10  
**Plan revision:** **v1.0**  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**Board:** [`agents/p-options-lab-heatmap/`](../agents/p-options-lab-heatmap/)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md)  

**Primary law:**

| Doc | Path |
|-----|------|
| **Heatmap Templates Spec v0.2** | [`Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md) |
| **Arch 29** | [`Architecture/29-options-lab-heatmap-templates.md`](../Architecture/29-options-lab-heatmap-templates.md) |

**Parents (do not re-litigate transport product):**

| Doc | Path | Role |
|-----|------|------|
| Market Bus Spec (content **v1.0.1**) | [`Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md`](../Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md) | One WS/tab · generation store · push |
| Options Chain Picker Spec **v1.0.2** | [`Specs/FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md`](../Specs/FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md) | Universe · OC2 · OC6a · OC13 |
| Market Bus bench plan | [`docs/Massive-Market-Bus-Full-Agent-Bench-Plan-v1.0.md`](./Massive-Market-Bus-Full-Agent-Bench-Plan-v1.0.md) | Transport as-built / residual |
| Human Interface Spec v1.0 | [`Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md`](../Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md) | HIG |

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates: **PASS / FAIL / BLOCKED** with evidence — **never waived**.  
**Coach may overrule** a specialist finding on the record via **DL entry with reasoning** — that is **not** a gate waive.

**Scope honesty:** This program ships **dual-side chain generation + template framework + first matrix templates** on Heatmap. It does **not** re-open Market Bus Redis posture, OD-nav catalog naming, or underlier Volume Profile bins (separate Spec).

**Human interface:** All member UI (workspace, matrix, switchers) complies with HIG Spec. Echo owns HIG; Charlie implements kit only.

---

## 0. Product / architecture law (in scope)

| Spec cluster | Ship meaning |
|--------------|----------------|
| **HM1–HM20** | Dual-side model · diff once · push · hydrate · hold · pure compute · no snap · modal step · next_url fail · standard contracts · GEX honesty · no MSC |
| **sym-fly** | Width matrix; debit mid formula; RoC color + sticky scale |
| **gex_v1** | Dual-book estimate; units frozen |
| **vertical / bw-fly** | Phased after sym-fly |
| **AT-HM1…16** | Kilo ownership |

**Design invariant:** *One dual-side snapshot under a complete wing band; push/diff once; any number of pure templates recompute every generation; side is a view filter only.*

---

## 1. Mission

Ship Options Lab **Heatmap Templates**:

```text
Massive dual-side snapshot (no contract_type)
  → Labs generation (standard contracts, modal step, ≤250, no next_url)
  → Redis / stream push (full|diff|unchanged)
  → MarketSocket (1/tab) → dual-side chain model
  → Template registry → matrix/table/profile
  → Workspace UI (1/5 controls · 4/5 view)
```

| Pillar | Spec | Ship meaning |
|--------|------|----------------|
| Dual-side always | HM15–HM17 | Omit `contract_type`; wing band ≤125 strikes |
| Side = view only | HM16 | Calls/Puts do not re-fetch |
| Truncation fail-loud | HM18 | `next_url` → hard error, zero rows |
| Standard contracts | HM19 | Adjusted excluded + meta count |
| Modal step | HM20 | No snap (HM8) |
| Push not poll | HM3–HM4 | Stream + hydrate-if-empty |
| Templates pure | HM6 | Client-derived matrices |
| Near RT | HM11 | Recompute every snapshot |
| No MSC code | HM10 | Look may match Coach ref |

**First smoke after H2:**  
(1) Dual-side generation for SPY ±25 — both books, no `next_url`.  
(2) Stream push → matrix updates.  
(3) Side toggle + template switch → **zero** Massive.

---

## 2. As-built honesty

### 2.1 Keep (landed)

| Area | Status |
|------|--------|
| Heatmap workspace layout (1/5 · 4/5) | Landed |
| OptionsLabChrome `workspace` | Landed |
| MarketSocket + stream push loop | Landed (may still be single-side) |
| useOptionChainBus push + hydrate-if-empty | Landed (single-side model shape) |
| Ladder fields mid/bid/ask/OI/γ/… | Landed |
| Spec v0.2 · Arch 29 | Landed DRAFT |

### 2.2 Build (this program)

| Gap | Spec | Phase |
|-----|------|--------|
| Spec GO · OD Accept/Override · board | §13 · H0 | **W0** |
| Dual-side generation · HM15–20 | HM15–20 | **D** (Dual-side data plane) |
| Template framework + ladder as template | §4 | **F** (Framework) |
| sym-fly matrix + RoC + sticky color | §5.2 | **S** (Symmetric fly) |
| Value modes pct_change (+ r2r if OD) | §5.2 | **V** (Value modes) |
| GEX estimate dual-book | §5.5 | **G** (GEX) |
| vertical + bw-fly | §5.3–5.4 | **X** (eXtension structures) |
| AT pack + e2e | §12 | **K** |
| Deploy · as-built · close | — | **Z** |

### 2.3 Gap map (AT → phase)

| AT cluster | Phase |
|------------|--------|
| Spec GO · OD1–9 · seeds · parent cite integrity | **W0** |
| Dual-side · next_url · standard contracts · modal step | **D** |
| Registry · switcher · pure compute harness | **F** |
| sym-fly · Width · RoC · sticky scale · AT-HM6/7/12/16 | **S** |
| pct_change · r2r · AT-HM11/14 | **V** |
| gex_v1 · AT-HM8/13 | **G** |
| vertical · bw-fly | **X** |
| Full AT-HM1…16 | **K** |
| MiniTwo · DL · as-built | **Z** |

---

## 3. Locked decisions (program)

| ID | Decision |
|----|----------|
| **HP1** | Spec **v0.2** is product law on Coach GO (after W0-G). |
| **HP2** | Dual-side snapshot always; **no** `contract_type` on Heatmap generation (HM15). |
| **HP3** | Generation key = `(symbol, expiration, wings)` — **not** side (HM16). |
| **HP4** | Side UI = view/structure filter only — zero Massive on toggle. |
| **HP5** | Wing band keeps contracts ≤250 one page; wings=100 → OD8 clamp/fail-loud. |
| **HP6** | `next_url` → hard error; no partial model (HM18). |
| **HP7** | Standard contracts only; adjusted excluded + meta (HM19). |
| **HP8** | Modal strike step; **no snap** (HM20 · HM8). |
| **HP9** | Matrices client-derived; no server matrix store v1. |
| **HP10** | Steady state = **push**; hydrate-if-empty only special case. |
| **HP11** | GEX labeled estimate; units per `gex_v1` (H5). |
| **HP12** | Width = course center-to-wing vocabulary (H4). |
| **HP13** | No MSC code/schemas; reference look lawful (H7). |
| **HP14** | Structural payoff math lawful; profit claims banned (H8). |
| **HP15** | OD1–9 require **Accept** or **Override** at GO — no silent defaults. |
| **HP16** | Delta never waives AT-HM*; ternary only; Coach overrule needs DL. |
| **HP17** | Does **not** re-open Market Bus Redis posture or VP overnight backfill. |
| **HP18** | Documentation parity with ship. |

### 3.1 Open points (GO — explicit Accept/Override)

| # | Question | Owner | Recommendation |
|---|----------|-------|----------------|
| **OD1** | Default widthMode | Echo · Alpha | `step_multiples` |
| **OD2** | Default N width columns | Echo | 7 |
| **OD3** | Enable R2R in phase V | Hotel · Coach | Only after §5.2.1 frozen |
| **OD4** | GEX display divisor | Alpha · Hotel | e.g. 1e9 documented |
| **OD5** | Bid/ask fill model | Hotel | Mid until Accept |
| **OD6** | OD-nav “Options Lab” | Coach · Echo | DL one-liner or keep as-built disclaimer |
| **OD7** | GEX profile layout | Echo | After matrix |
| **OD8** | Wings=100 dual-side | Alpha · Hotel | Clamp ≤125 strikes or fail-loud |
| **OD9** | Color hysteresis % | Echo · Charlie | 25% sticky (Spec §5.2.2) |

### 3.2 Seating

| ID | Rule |
|----|------|
| **S1** | Kilo owns AT-HM1…16 evidence at K-G. |
| **S2** | India: dual-side generation identity · content_hash · no dual-truth. |
| **S3** | Alpha: Massive pull · ladder dual-side · stream payload · next_url. |
| **S4** | Charlie: templates · matrix · workspace · HIG kit. |
| **S5** | Echo: matrix chrome · Width labels · color scale · switchers. |
| **S6** | Hotel: fly math · GEX sign · no-snap · R2R · deep-ITM null γ. |
| **S7** | Tango: member copy (estimate label, held, max structural profit). |
| **S8** | Mike: auth unchanged; no Redis to browser; caps. |
| **S9** | Foxtrot: deploy if feed/API change needs MiniTwo. |
| **S10** | Juliet: board · seeds · Market Bus / picker coordination. |
| **S11** | Lima: DL GO · hash · as-built paths. |
| **S12** | Delta: all phase gates ternary. |
| **S13** | Seeds on disk before phase gate. |

---

## 4. Roster

| Callsign | Role |
|----------|------|
| **Coach** | GO, OD1–9 Accept/Override, ship/no-ship |
| **Juliet** | Board, seeds, sequence, cross-program |
| **India** | Generation identity · dual-side schema · hash |
| **Alpha** | Dual-side fetch · standard contracts · stream · next_url |
| **Charlie** | Template framework · matrix UI · workspace |
| **Echo** | HIG · Width IA · color scale · template switcher |
| **Hotel** | Pricing formulas · GEX · no-snap · R2R |
| **Tango** | Copy · estimate labels · payoff vs claims |
| **Mike** | Auth/security non-regression |
| **Kilo** | AT-HM* packs · fixtures |
| **Delta** | Phase gates |
| **Lima** | Decision log · content hash |
| **Foxtrot** | Deploy when needed |

**Not seated for this program:** Marketing · VP backfill · full Analyzer risk graph product · OD-nav full campaign (unless Coach opens OD6).

---

## 5. Sacred invariants (this program)

1. Standalone repo — **no MSC code/schemas**.  
2. Config fail-loud.  
3. **Dual-side always** for Heatmap generation (HM15).  
4. **Side is not a fetch key** (HM16).  
5. **No partial chain** if `next_url` (HM18).  
6. **Standard contracts only** (HM19).  
7. **Modal step · no snap** (HM20 · HM8).  
8. **Push steady state · hydrate special** (HM3 · HM4).  
9. **Pure templates** (HM6).  
10. **Diff once, many views** (HM2).  
11. **GEX labeled estimate** with units (HM12 · gex_v1).  
12. **Width = center-to-wing** (course doctrine).  
13. Structural payoff math lawful; **no profit claims**.  
14. Evidence over assertion; Delta never waives AT-HM*.  
15. Coach overrule of a finding requires **DL entry**.  
16. Documentation parity with ship.  
17. Do not re-open Market Bus Redis posture or VP trade backfill in this board.

---

## 6. Phases, seeds, gates

### Phase W0 — Spec GO + board lock

| Seed | Agent | Intent |
|------|-------|--------|
| **W0-0** | Coach | Final GO after W0-G; OD1–9 Accept/Override; Spec v0.2 content hash |
| **W0-1** | India | Dual-side generation schema; content_hash includes both books; meta excluded_adjusted |
| **W0-2** | Hotel | Sign-off: Width vocab; debit formula; no-snap; gex_v1 units; R2R deferred text |
| **W0-3** | Echo | IA: template/value/width switchers; matrix chrome; sticky color UX |
| **W0-4** | Tango | Copy: held · estimate · structural max profit/R2R wording |
| **W0-5** | Mike | Confirm no new trust boundary; stream auth unchanged |
| **W0-6** | Alpha | Feasibility: dual-side pull; next_url hard fail; wings clamp |
| **W0-7** | Delta | AT-HM matrix ownership; ternary plan |
| **W0-8** | Juliet | Materialize `agents/p-options-lab-heatmap/` seeds; cite Market Bus residual |
| **W0-9** | Lima | DL draft for GO; hash procedure |
| **W0-G** | Delta | All W0-* PASS/FAIL; OD table ready; seeds on disk |
| **W0-0** | Coach | Runs **after** W0-G (stamp) |

### Phase D — Dual-side data plane (HM15–HM20)

| Seed | Agent | Intent |
|------|-------|--------|
| **D1-0** | Alpha | Omit `contract_type`; pull both sides in wing band |
| **D1-1** | Alpha · India | Generation payload: `calls` + `puts`; content_hash dual; generation key without side |
| **D1-2** | Alpha · Kilo | **HM18:** `next_url` present → hard error, zero rows; AT-HM3e fixture |
| **D1-3** | Alpha · Hotel | **HM19:** standard-only; exclude adjusted; meta count; AT-HM15 |
| **D1-4** | Alpha · Hotel | **HM20:** modal step on context; AT-HM12 fixture |
| **D1-5** | Alpha | Stream push dual-side full/diff by `(side, strike)` |
| **D1-6** | Charlie · Alpha | Client model dual maps; hydrate dual-side; side filter UI only |
| **D1-G** | Delta · Kilo · India · Hotel | AT-HM3b–e, AT-HM12, AT-HM15 green; no side-keyed Massive |

### Phase F — Template framework

| Seed | Agent | Intent |
|------|-------|--------|
| **F1-0** | Charlie · India | `web/lib/options-lab/templates/` types + registry |
| **F1-1** | Charlie | `ladder` as first registered template (table) |
| **F1-2** | Charlie · Echo | Switcher UI left rail; matrix shell empty/placeholder |
| **F1-3** | Charlie | `useChainTemplateGrid` (or equiv): hash-stable recompute |
| **F1-4** | Kilo | Unit tests: pure compute harness; no fetch in templates |
| **F1-G** | Delta · Echo · Charlie | Switcher works; ladder still default; AT-HM1/3 smoke |

### Phase S — Symmetric fly matrix (H2 program exit)

| Seed | Agent | Intent |
|------|-------|--------|
| **S1-0** | Hotel · Alpha | `sym-fly` debit pure function + golden fixtures |
| **S1-1** | Charlie | Matrix renderer: sticky strike + width headers; gold on dark |
| **S1-2** | Charlie · Echo | RoC color + sticky scale §5.2.2; AT-HM7 · AT-HM16 |
| **S1-3** | Charlie | Live recompute on stream apply; spot row emphasis |
| **S1-4** | Kilo | AT-HM6, AT-HM7, AT-HM9, AT-HM10, AT-HM12 |
| **S1-5** | Tango | Tooltips: legs + formula; no profit claims |
| **S1-G** | Delta · Hotel · Kilo · Echo | sym-fly live; Width vocabulary; no-snap proven |

### Phase V — Value modes

| Seed | Agent | Intent |
|------|-------|--------|
| **V1-0** | Charlie · Hotel | `pct_change` mode; AT-HM14 zero prior |
| **V1-1** | Hotel · Coach | R2R only if OD3 Accept; §5.2.1 tests |
| **V1-2** | Kilo | AT-HM11 value-mode switch zero HTTP |
| **V1-G** | Delta · Kilo | Modes switch without fetch |

### Phase G — Chain GEX estimate

| Seed | Agent | Intent |
|------|-------|--------|
| **G1-0** | Hotel · Alpha | `gex_v1` pure functions dual-book; units doc in code |
| **G1-1** | Charlie · Echo | GEX matrix and/or profile; “Chain GEX (estimate)” chrome |
| **G1-2** | Kilo | AT-HM8 deep-ITM null γ; AT-HM13 net requires both sides |
| **G1-3** | Tango | Estimate copy; no dealer-GEX claim |
| **G1-G** | Delta · Hotel · Kilo | GEX live on γ/OI diffs |

### Phase X — Vertical + broken wing (optional sequential)

| Seed | Agent | Intent |
|------|-------|--------|
| **X1-0** | Hotel · Charlie | `vertical` orientation table + golden tests |
| **X1-1** | Hotel · Charlie | `bw-fly` params short/long |
| **X1-G** | Delta | Ternary; Coach may descope X on DL so X1-G never convenes |

### Phase K — Full AT pack

| Seed | Agent | Intent |
|------|-------|--------|
| **K1-0** | Kilo | AT-HM1…16 matrix executed; evidence paths |
| **K1-1** | Kilo · Delta | Multi-template + side toggle Massive counter stays flat |
| **K1-G** | Delta · Kilo | Required ATs PASS |

### Phase Z — Deploy + close

| Seed | Agent | Intent |
|------|-------|--------|
| **Z1-0** | Foxtrot | MiniTwo API/stream if needed; no new Redis schema required for matrices |
| **Z1-1** | Lima | DL: GO · dual-side as-built · Spec hash · OD table |
| **Z1-2** | Juliet | Arch 29 as-built note; Market Bus residual board cross-cite |
| **Z1-G** | Delta · Coach | Program close; residual X noted if descoped |

---

## 7. Acceptance matrix (Spec §12 → phase)

| AT | Primary phase | Gate |
|----|---------------|------|
| AT-HM1 | F · D | F1-G · K1-G |
| AT-HM2 | D · S | D1-G · S1-G |
| AT-HM3 | F · S · K | F1-G · K1-G |
| AT-HM3b | D | D1-G |
| AT-HM3c | D | D1-G |
| AT-HM3d | D | D1-G |
| AT-HM3e | D | D1-G |
| AT-HM4 | D | D1-G |
| AT-HM5 | D · S | S1-G |
| AT-HM6 | S | S1-G |
| AT-HM7 | S | S1-G |
| AT-HM8 | G | G1-G |
| AT-HM9 | S | S1-G |
| AT-HM10 | S | S1-G |
| AT-HM11 | V | V1-G |
| AT-HM12 | D · S | D1-G · S1-G |
| AT-HM13 | G | G1-G |
| AT-HM14 | V | V1-G |
| AT-HM15 | D | D1-G |
| AT-HM16 | S | S1-G |

---

## 8. Cross-program coordination (Juliet)

| Program | Touch | Rule |
|---------|-------|------|
| **p-market-bus** | Stream · dual-side payload | Extend generation; do not re-litigate Redis posture |
| **p-options-chain-picker** | Ladder fields · OC6a | Dual-side must preserve cent-exact strikes |
| **VP Histogram** | Out of board | No coupling; separate Spec |
| **Analyzer** | Future consumer | May import structures later — not this Z |

**Forbidden:** Claiming “GEX net” on single-side generations; silent `next_url` truncation; snapping fly legs.

---

## 9. Risk register

| Risk | Mitigation |
|------|------------|
| Wings=100 exceeds 250 dual-side | OD8 clamp/fail-loud; default 25 |
| Deep-ITM null greeks | HM7 · AT-HM8 fixture |
| Color “breathing” | Sticky scale §5.2.2 |
| As-built single-side lag | Phase D first; block S-G until D-G |
| Formula drift vs course Width | H4 vocabulary + Hotel golden tests |
| MSC false-positive on look | Spec §0.2 · Echo gate |

---

## 10. Board layout

```text
agents/p-options-lab-heatmap/
  CHARTER.md
  ORCHESTRATOR.md
  IMPLEMENTATION-PLAN.md          # pointer to this doc
  seeds/
    W0-*.md · D1-*.md · F1-*.md · S1-*.md · V1-*.md · G1-*.md · X1-*.md · K1-*.md · Z1-*.md
  gate-reports/
    W0-G.md · D1-G.md · … · Z1-G.md
```

---

## 11. Suggested sequence (calendar-agnostic)

```text
W0 (spec GO)
  → D (dual-side plane)     # blocks honest GEX + free side toggle
  → F (framework)
  → S (sym-fly)             # first member-visible matrix
  → V (value modes)
  → G (gex)
  → X (vertical / bw)       # optional
  → K (full AT)
  → Z (deploy / close)
```

**Critical path:** W0 → D → F → S.  
**GEX** depends on **D** (both books).  
**V** can overlap late **S**.  
**X** after **S** (or descope).

---

## 12. Document control

| Version | Date | Notes |
|---------|------|--------|
| **v1.0** | 2026-08-10 | Initial full-agent bench plan for Heatmap Templates Spec v0.2 · phases W0/D/F/S/V/G/X/K/Z · AT-HM1…16 |

**One-line program law:**  
**Dual-side chain once, push/diff forever; templates are pure views — prove it with AT-HM*, never with waived gates.**
