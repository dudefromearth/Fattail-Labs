# Options Lab Position Builder & Book — Full Agent Bench Plan v1.0

**Date:** 2026-08-11  
**Plan revision:** **v1.0**  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**Board:** [`agents/p-options-lab-position-builder/`](../agents/p-options-lab-position-builder/)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md)  

**Primary law:**

| Doc | Path |
|-----|------|
| **Position Builder Spec v0.2** | [`Specs/FatTail-Labs-Options-Lab-Position-Builder-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Lab-Position-Builder-Spec-v0_2.md) |
| **OPF Spec v0.2.1** | [`Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md) |
| **DL-296** (+ residual N1–N5) | [`Architecture/00-decision-log.md`](../Architecture/00-decision-log.md) |

**Parents (do not re-litigate):**

| Doc | Path | Role |
|-----|------|------|
| Market Bus Spec (content **v1.0.1**) | [`Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md`](../Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md) | Dual-side generations · interest · stream |
| OPF full-agent bench | [`docs/Options-Pricing-Foundation-Full-Agent-Bench-Plan-v1.0.md`](./Options-Pricing-Foundation-Full-Agent-Bench-Plan-v1.0.md) | Foundation L0–L4 as-built / residual |
| Chain Picker Spec **v1.0.2** | [`Specs/FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md`](../Specs/FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md) | Universe · OC2 · OC5a · OC6a · **OC13** |
| Heatmap Templates Spec **v0_2** | [`Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md) | Dual-side · Live/Held posture heritage |
| Human Interface Spec v1.0 | [`Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md`](../Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md) | Dialog · cards · fail-loud |

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates: **PASS / FAIL / BLOCKED** with evidence — **never waived**.  
**Coach may overrule** a specialist finding on the record via **DL entry with reasoning** — that is **not** a gate waive.

**Coach accept:** Spec **v0.2** accepted as product law (2026-08-11). This plan executes that law.  
**OD-PB1–17:** Locked to Spec **recommendations** as **Accept** at W0 unless Coach records Override on DL (see §3.1).

**Scope honesty:** This program closes Spec §11 gaps so the **Coach litmus** is **evidenced** under the use-case matrix (§6.5 Spec): card = definition, viewport = OPF visualization, single package SoR, live re-resolve, lock, interest, Held labels, AT-PB-R1a–d.  
It does **not** ship broker OMS, multi-card aggregate curves, or full replay chrome (OD-PB17 deferred).  
**MSC is not the standard.**

**Human interface:** Builder dialog, cards, mode banner, stream posture, alerts — all HIG-compliant.

---

## 0. Product / architecture law (in scope)

| Spec cluster | Ship meaning |
|--------------|----------------|
| **§0.1 Cardinal** | Card = definition · viewport = OPF viz · chain/archive = market |
| **PB-MODE-0…3** | One surface · three modes · mode banner · card market-plane · Held off-session |
| **PB17 / 17a / 17b** | OPF-served package SoR · parity if client sum · interest ownership |
| **PB-VIEW-5 / 6 / 7** | Generation-driven re-resolve · incomplete loud · outlook re-anchor (OD-PB16) |
| **PB18a** | Multi-exp skew loud/labeled |
| **PB-LOCK-*** | Card lock → OPF · signed D\* |
| **§4.4 algorithm** | Full package display branches (incl. hidden not-live · locked mkt Held) |
| **§6.5 matrix** | day_trade live HARD · closed provenance · outlook · backtest |
| **AT-PB-R1a–d · C8 · S1 · L\* · I\*** | Litmus + lock + interest gates |

**Design invariant:** *One OPF package quote path for card and viewport; focused unlocked live definition re-resolves when generations apply; lock freezes basis not the market plane; modes never steal another mode’s guarantee.*

---

## 1. Mission

Close the Analyzer Position Builder & Book so the litmus holds:

```text
Dual-side generations (Bus / ladder)
  → OPF PackageQuote / resolve (single SoR)
  → Card package display (definition book)
  → Focused definition + lock + mode
  → Viewport OPF curves (visualization)
  → AT-PB-R1a green on live day_trade
```

| Pillar | Spec | Ship meaning |
|--------|------|----------------|
| Definition SoR | PB9 | Card holds structure + lock |
| Visualization SoR | PB10 · OPF | Viewport only via resolve |
| Package SoR | PB17 · OD-PB12 | OPF-served D_nat on cards |
| Live coherence | PB-VIEW-5 · R1a | Card == resolve == curve@spot |
| Lock | PB-LOCK · OPF §5.7 | Natural / limit · signed D\* |
| Interest | PB17b | Focused + visible; hide drops; cap loud |
| Modes | PB-MODE · §6.5 | Banner · Held · outlook stale · backtest defer UX |
| No MSC | PB8 · AT-PB-P1 | Grep / static |

**First smoke after P+S:**  
(1) Build butterfly → card shows OPF package.  
(2) Focus unlocked · generation diff → card **and** curve update same `content_hash`.  
(3) R1a transcript: card number, resolve payload, curve sample at spot within RECON tol.

---

## 2. As-built honesty

### 2.1 Keep (landed — DL-294 / OPF program)

| Area | Status |
|------|--------|
| OPF L0–L4 headless resolve · packs · lock API | Landed (foundation program) |
| OpfRiskAnalyzer shell · pack select | Landed |
| PositionBuilder (templates · chain mids) | Landed partial |
| AnalyzerPositionsList cards | Landed partial |
| AnalyzerAlertsSection + chart alerts | Landed partial |
| useBuilderChain · analyzerBook session store | Landed partial |
| Spec v0.2 review-folded | Landed DRAFT (Coach accepted) |

### 2.2 Build (this program — Spec §11 gaps)

| Gap | Spec | Phase |
|-----|------|--------|
| Spec GO · OD-PB1–17 Accept · board · seeds · hash | §12 · §15 | **W0** |
| Book domain: signed D\* · LockState · liveState · priceSide null | §3 · B4 | **D** (Definition domain) |
| OPF-served package for cards (lightweight quote or shared resolve path) | PB17 · OD-PB12 | **P** (Package SoR) |
| Interest registration focused+visible · hide drop · budget UI | PB17b | **I** (Interest) |
| Card Lock/Unlock → OPF lock API · freeze defaults | PB-LOCK · OD-PB9/11 | **L** (Lock) |
| Generation-driven re-resolve · no poll-as-SoR · stale label | PB-VIEW-5 · OD-PB13 | **S** (Stream viewport) |
| §4.4 algorithm + stream posture chrome · Held | §4.4 · PB-STREAM · MODE-3 | **C** (Cards chrome) |
| Builder: listed-only back exp · SoR package · naming | PB22 · PB21 · §3.1 | **U** (Builder UX) |
| Mode banner · outlook epoch stale + re-anchor · R1b Held | PB-MODE · VIEW-7 · OD-PB16 | **M** (Modes) |
| Alerts Held · AT-PB-A1 polish | PB-AL | **A** (Alerts) — may merge C |
| Litmus R1a–d · C8 · S1 · L\* · I\* · full AT matrix | §10 | **K** |
| As-built notes · DL close · no false green claims | §11 · §14 | **Z** |

### 2.3 Gap map (AT → phase)

| AT cluster | Phase |
|------------|--------|
| Spec GO · OD-PB1–17 · seeds · hash | **W0** |
| Domain / signed D\* · book schema | **D** |
| Package SoR · AT-PB-C4 path | **P** |
| Interest I1 I2 | **I** |
| Lock L1–L6 | **L** |
| VIEW-5 · C8 · stale | **S** |
| §4.4 · STREAM · hide not-live | **C** |
| Builder PB22 · incomplete viewport PB-VIEW-6 | **U** |
| Mode banner · R1b · R1c · OD-PB16 UI | **M** |
| Alerts Held | **A** |
| R1a–d full · K matrix | **K** |
| Close | **Z** |

**Explicit non-phases (out of program):**

| ID | Out |
|----|-----|
| **NX1** | Broker place/close OMS |
| **NX2** | Multi-card aggregate risk curves (OD-PB4) |
| **NX3** | Full replay step/play chrome (OD-PB17 **defer**) |
| **NX4** | Server multi-device book (unless OD-PB1 Override) |
| **NX5** | MSC imports / client Heston/MC SoR |
| **NX6** | Heatmap dual-side redesign (parent programs) |

---

## 3. Locked decisions (program)

| ID | Decision |
|----|----------|
| **FP1** | Spec **v0.2** is product law (Coach accepted 2026-08-11). |
| **FP2** | **MSC is not the standard.** |
| **FP3** | Card = definition · viewport = OPF visualization · chain/archive = market. |
| **FP4** | **OD-PB12 Accept:** card live package is **OPF-served PackageQuote** (option a). |
| **FP5** | **OD-PB13 Accept:** re-resolve on applied generation update; no independent poll loop as SoR. |
| **FP6** | **OD-PB9 Accept:** freeze_iv/freeze_marks default **false** (basis-only lock). |
| **FP7** | **OD-PB11 Accept:** no freeze snapshot retain after unlock (session book). |
| **FP8** | **D\*** signed per-share (PB3 convention). |
| **FP9** | day_trade default mode; outlook/backtest same surface (PB-MODE-0). |
| **FP10** | **OD-PB16 Accept:** outlook member-controlled re-anchor + epoch stale. |
| **FP11** | **OD-PB17 Accept:** replay UX deferred — no side-door chrome this program. |
| **FP12** | **OD-PB14 Accept:** forward-walk = chain_replay workflow name. |
| **FP13** | **OD-PB15 Accept:** replay mode card package stays live/held market (a). |
| **FP14** | Session book (OD-PB1 Accept); optional localStorage warn for lock — implement if cheap. |
| **FP15** | Delta ternary only; Coach overrule needs DL. |
| **FP16** | OPF foundation is dependency — do not re-litigate OPF L0–L4 law. |
| **FP17** | Documentation parity at Z; as-built gap map updated. |

### 3.1 OD-PB1–17 — program Accept table (Coach Spec accept)

Unless Coach files Override DL rows, **W0 locks Accept = Spec recommendation**:

| OD | Accept (program) |
|----|------------------|
| OD-PB1 | Session book (+ optional lock persist warn/localStorage) |
| OD-PB2 | Widths 20 / 50 SPX/NDX-class |
| OD-PB3 | Regenerate clears limit override |
| OD-PB4 | No multi-card aggregate |
| OD-PB5 | Alerts session |
| OD-PB6 | ANALYSIS only |
| OD-PB7 | Diagonal 2 strikes between when ladder |
| OD-PB8 | Paste does not auto-create card |
| OD-PB9 | freeze defaults false |
| OD-PB10 | mkt when locked, labeled |
| OD-PB11 | No snapshot retain on unlock |
| OD-PB12 | OPF-served PackageQuote |
| OD-PB13 | Generation-driven re-resolve |
| OD-PB14 | Forward-walk = chain_replay workflow |
| OD-PB15 | Card stays market-plane in replay |
| OD-PB16 | Member re-anchor + epoch stale |
| OD-PB17 | Replay UX deferred |

### 3.2 Seating

| ID | Rule |
|----|------|
| **S1** | **Kilo** owns AT-PB matrix evidence at K-G (esp. **R1a–d**). |
| **S2** | **India** · dual-truth · no MSC · card/viewport package parity. |
| **S3** | **Alpha** · OPF resolve/quote client · interest · generation apply hooks. |
| **S4** | **Hotel** · package natural · lock · RECON · signed D\* · skew display. |
| **S5** | **Charlie** · Builder/cards/mode banner UI · HIG kit. |
| **S6** | **Echo** · labels: live · held · mkt · scenario · not live · budget. |
| **S7** | **Tango** · no profit claims · incomplete/stale copy. |
| **S8** | **Mike** · auth on pricing routes · no client Massive. |
| **S9** | **Foxtrot** · stream/generation cadence notes if deploy-relevant. |
| **S10** | **Juliet** · board · seeds · OPF/Heatmap coordination · no NX creep. |
| **S11** | **Lima** · DL GO · content hash · as-built. |
| **S12** | **Delta** · all phase gates ternary. |
| **S13** | Seeds on disk before phase gate. |

---

## 4. Phase DAG

```text
W0 ──► D ──► P ──► I ──► L ──► S ──► C ──► U ──► M ──► A ──► K ──► Z
              │              │
              └──────────────┴── (I may start after P; L needs D+P;
                                 S needs P; C needs I+L+S for full §4.4)
```

| Phase | Name | Depends | Exit summary |
|-------|------|---------|--------------|
| **W0** | GO · OD Accept · board · hash · seeds skeleton | — | Spec v0.2 BUILD authority; OD-PB1–17 on DL |
| **D** | Definition domain (book schema · signed D\* · LockState) | W0 | Types + store match Spec §3 |
| **P** | Package SoR (OPF-served card package) | D | Cards display PackageQuote path; PB17 |
| **I** | Interest ownership (focused + visible) | P | PB17b · AT-PB-I1/I2 |
| **L** | Lock/Unlock card → OPF | D + P | AT-PB-L1…6 |
| **S** | Stream viewport (VIEW-5 re-resolve) | P | AT-PB-C8 · no poll-as-SoR |
| **C** | Cards chrome §4.4 full algorithm | I + L + S | Hidden not-live · locked mkt Held · STREAM chips |
| **U** | Builder UX law (PB22 · SoR · naming) | P | AT-PB-1…5 · listed-only back exp |
| **M** | Modes banner · Held · outlook epoch stale | S + C | AT-PB-M1 · R1b path · OD-PB16 UI |
| **A** | Alerts Held polish | C | AT-PB-A1 + PB-AL-5 |
| **K** | Full AT matrix · **R1a** litmus evidence | all prior | K-G PASS |
| **Z** | As-built · DL close · no false claims | K | Program close |

**Parallelism:** After **P**, **I** and **L** and **S** can proceed with care; **C** integrates. **U** can parallel **C** after **P**.

---

## 5. Phase detail

### W0 — Board GO

- Juliet: CHARTER · ORCHESTRATOR · seeds README · gate-reports.  
- Lima: Spec v0.2 content hash recorded; OD-PB1–17 Accept table on DL (program FP §3.1).  
- India: parent Spec paths intact; no MSC.  
- Delta: W0-G PASS → Coach W0-0 GO fire.

### D — Definition domain

- Align `analyzerBook` / position types with Spec §3: LockState signed D\*, `liveState`, `priceSide` null when incomplete, `displayAsOf`.  
- Persist session book; optional localStorage lock warn (OD-PB1).  
- Hotel: sign convention unit tests.

### P — Package SoR

- **Server:** ensure resolve/`PackageQuote` exposes natural debit, content_hashes, max_skew_ms, epoch_quality, as_of (extend if needed).  
- **Client:** card live package **only** from OPF package quote path (batch for visible cards or focused + lightweight endpoint — Alpha designs, India reviews dual-truth).  
- Remove client \(\sum q_i m_i\) as SoR (may remain debug-only behind parity assert in tests).  
- AT path for C4.

### I — Interest

- Register interest for focused + visible cards’ generation keys; drop on hide.  
- Cap priority: focused → visible recency.  
- UI: not live (budget) · not live (hidden).  
- AT-PB-I1 · I2.

### L — Lock

- Card Lock natural / Lock limit / Unlock → `POST …/pricing/lock` (or existing OPF lock API).  
- Wire focused resolve with lock state (PB-LOCK-8).  
- freeze defaults false; unlock clears snapshots.  
- Secondary mkt when locked (OD-PB10).  
- AT-PB-L1…6.

### S — Stream viewport

- Hook chain generation apply (diff/full) → re-resolve focused definition (PB-VIEW-5).  
- Ban independent HTTP poll as sole live mechanism for focused resolve.  
- Stale curve label if resolve behind generation.  
- AT-PB-C8.

### C — Cards chrome

- Implement §4.4 algorithm branches literally (incl. N1/N2).  
- Stream posture Live/Held/Closed/Error on Analyzer chrome.  
- Per-card liveState chips.  
- Focus/hide/remove behaviors.

### U — Builder UX

- Back exp: listed-only; loud if none (PB22).  
- Package display from package SoR.  
- Rename/guard live mid field (not “entry fill”).  
- Incomplete → no fabricated viewport curve (PB-VIEW-6).

### M — Modes

- Mode banner (use case + time reference).  
- day_trade default.  
- Held labeling closed session (R1b readiness).  
- Outlook: epoch stale indicator + member re-anchor control (OD-PB16); no silent auto-re-anchor.  
- Backtest: no live claim; **no** full replay chrome (NX3 / OD-PB17) — only labels/guards if pack selected.  
- AT-PB-M1 · support R1b/R1c evidence.

### A — Alerts

- Held on alert readouts when closed.  
- Existing chart create + list cards green AT-PB-A1.

### K — Acceptance

- Full Spec §10 AT matrix with evidence in `gate-reports/`.  
- **Must** include AT-PB-R1a transcript (card · resolve · curve@spot).  
- R1b/c/d as far as fixtures allow (fixtures OK for closed/outlook/backtest).

### Z — Close

- Update Spec §11 as-built gap map → closed or residual.  
- DL program close.  
- Explicit non-claims: NX1–6.

---

## 6. Seeds (naming)

Juliet materializes from this plan §5:

```text
agents/p-options-lab-position-builder/seeds/
  W0-0-coach-go.md
  W0-1-lima-hash-od.md
  D1-0-hotel-definition-domain.md
  P1-0-alpha-package-sor.md
  I1-0-alpha-interest-budget.md
  L1-0-hotel-card-lock.md
  S1-0-alpha-viewport-reresolve.md
  C1-0-charlie-cards-algorithm.md
  U1-0-charlie-builder-ux.md
  M1-0-echo-modes-held.md
  A1-0-charlie-alerts-held.md
  K1-0-kilo-at-matrix.md
  Z1-0-lima-as-built.md
```

Naming: `{PHASE}{n}-{agent}-{slug}.md`.  
Do not start implementation seeds before **W0-G** + **Coach W0-0**.

---

## 7. Definition of Done (program)

| # | Criterion |
|---|-----------|
| D1 | Spec v0.2 GO + OD-PB1–17 Accept/Override on DL |
| D2 | Phases D…A Delta PASS (or Coach overrule DL) |
| D3 | **AT-PB-R1a** green with evidence transcript |
| D4 | AT-PB-C8 · S1 · L1–L6 · I1–I2 green (or fixture-blocked with Delta BLOCKED truth) |
| D5 | Card package == resolve D_nat same content_hash (live unlocked) |
| D6 | Lock freezes D\*; unlock restores live natural |
| D7 | Hidden card not-live styling; no stale-as-live |
| D8 | Mode banner + Held when closed; no RECON-as-live after close |
| D9 | No MSC imports; no second package SoR |
| D10 | As-built notes; **no claim** of OMS / multi-aggregate / full replay UX |
| D11 | OPF only pricing path for viewport |

---

## 8. Risks

| Risk | Mitigation |
|------|------------|
| Resolve cost for every visible card | Batch quote or focused-only live + visible throttled; measure |
| Poll leftover fights VIEW-5 | Juliet ban poll-as-SoR; Alpha generation hook |
| OPF API gaps for package-only | Extend L4 minimal fields; don’t invent client SoR |
| Outlook re-anchor scope creep | OD-PB16 UI only; no new pack |
| Replay chrome sneak-in | NX3 · OD-PB17 · Juliet blocks |
| False RECON after close | R1b · MODE-3 · Echo labels |

---

## 9. Coordination with sibling boards

| Board | Rule |
|-------|------|
| `p-options-pricing-foundation` | Consume L4; file residual OPF bugs to that board; no re-litigate OPF law |
| `p-options-lab-heatmap` | ToS Option-click handoff only; dual-side parent |
| `p-market-bus` | Stream/generation apply residual only |

---

## 10. Coach GO checklist (W0-0)

- [ ] Spec v0.2 content hash recorded  
- [ ] OD-PB1–17 Accept (or Override on DL) — program defaults §3.1  
- [ ] Board + seeds skeleton present  
- [ ] Scope: litmus close only; NX1–6 explicit  
- [ ] Parent Specs cited (OPF, Bus, Picker, Heatmap)  
- [ ] Delta W0-G PASS  
- [ ] Fire D → P → I/L/S per DAG  

---

## 11. Document map

| Doc | Role |
|-----|------|
| **This plan** | Execution DAG · seating · DoD |
| PB Spec v0_2 | Normative product law |
| OPF Spec v0_2 | PackageQuote · lock · RECON · interest |
| Board `p-options-lab-position-builder` | Seeds · gates · charter |

---

## 12. File touch map (expected — refine in seeds)

| Area | Likely paths |
|------|----------------|
| Book / types | `web/lib/options-lab/analyzerBook.ts` · `positionTypes.ts` |
| Package client | `web/lib/options-lab/opfPricingApi.ts` · new `packageQuote` helper |
| Chain/interest | `web/lib/options-lab/useBuilderChain.ts` · Analyzer interest layer |
| Analyzer shell | `web/components/options-lab/OpfRiskAnalyzer.tsx` |
| Builder | `web/components/options-lab/PositionBuilder.tsx` |
| Cards | `web/components/options-lab/AnalyzerPositionsList.tsx` |
| Alerts | `web/components/options-lab/AnalyzerAlertsSection.tsx` |
| OPF server | `server/opf/*` · `server/routes/pricing.py` (quote fields / batch if needed) |
| Tests | `server/tests/test_opf_*.py` · web tests / fixture ATs for R1a |

---

**End of plan v1.0.** Implement only after Coach W0-0 GO.
