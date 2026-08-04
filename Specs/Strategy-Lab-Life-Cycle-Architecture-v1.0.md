# Strategy Lab — Life Cycle Architecture & Specification v1.0

**Status:** Superseded for *build order* by **v1.1** — see `Strategy-Lab-Life-Cycle-Architecture-v1.1.md`  
**Date:** 2026-08-04  
**Source of truth (process):** `/Users/ernie/LifeCycle.pdf` — *Strategy Life Cycle Big Picture* (1/19/25)  
**Product home:** FatTail Labs Strategy Lab (`strategy-lab-proto` → later first-class Labs surface)  
**Doctrine:** Capital preservation / process over P&L claims · no fantasy fills · fail loud  

> **v1.1** locks foundation-first construction, versioned **attribute** vs **process** plugins, and the path to future attributes/versions. Keep v1.0 for PDF stage inventory and product narrative.

---

## 0. Executive understanding (yes)

You are not asking for “three Kanban columns with buttons.” You are asking for the **Strategy Life Cycle** to be the **operating system** of Strategy Lab:

| Concept | Meaning in the product |
|---------|------------------------|
| **Backbone** | Phases → stages → **gates** → **on/off-ramps** → **decision trees** |
| **Plugins** | Features that hang on the backbone: risk graph, backtest, friction, sizing, journal, sim, live, etc. |
| **Strategy family** | Options-first (long butterfly, long condor, debit verticals); later futures / pairs / arb without rewriting the cycle |
| **Teaching corpus** | ~5 **finished example strategies** members can inspect, already present in **Development** and **Curation**, so the board is never empty and the cycle is visible |
| **Deployment** | Coach/demo path into Campaign; not “export and hope” |

Individual UI widgets (risk graph, R2R, IV, Massive backtest) are **stage plugins**, not the product spine.

---

## 1. Product thesis

> The Strategy Life Cycle is the backbone of a professional 0-DTE trader’s routine: develop a limited set of core strategies, curate a small portfolio, campaign with discipline, then prune and learn.

Strategy Lab **implements that routine as software**: state machine + decision trees + honest evidence. It does **not** claim edge from the tools alone.

**FatTail alignment**

- Sell the dream, sequence the discipline  
- Process outcomes over profit claims  
- Stop-the-bleeding first (defined risk, max-loss visible, no zero-cost fantasy)  
- Coaching pathway is the long-term elevation of this cycle (PDF § “Building a Pathway to Coaching”)

---

## 2. Backbone model

### 2.1 Three phases (from the PDF)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         STRATEGY LIFE CYCLE                             │
│                                                                         │
│   DEVELOPMENT ──gate──► CURATION ──gate──► CAMPAIGN ──retro──► (loop)  │
│        │                    │                    │                      │
│        │ off-ramp           │ off-ramp           │ off-ramp             │
│        ▼                    ▼                    ▼                      │
│      KILLED /              BENCH /             PRUNE /                  │
│      ARCHIVE               HOLD                RETIRE                   │
│                                                                         │
│   on-ramps: idea import · template · clone · coach seed · re-entry     │
└─────────────────────────────────────────────────────────────────────────┘
```

| Phase (PDF) | Lab name (UI) | Intent |
|-------------|----------------|--------|
| **Development** | **Develop** | Idea → model → IS → OOS → sim |
| **Curation** | **Curate** | Team assembly: categorize, group, size, monitor, promote |
| **Campaign** | **Campaign** | Live (or paper-as-campaign) execution, log, prune, retrospective |

> **Rename note:** Today’s prototype uses `design | curation | deployment`. Spec renames **design → develop** and **deployment → campaign** to match the PDF. “Deployment” inside Development means **Deploy to Sim** (PDF Dev §5), not live capital.

### 2.2 Stages inside each phase

#### A. Development (PDF: Development Phase)

| # | Stage key | PDF step | Member-facing | Required evidence (gate inputs) |
|---|-----------|----------|---------------|----------------------------------|
| D1 | `hypothesis` | Idea/Hypothesis Generation | Write a simple, explainable idea | Non-empty hypothesis; style fit tag |
| D2 | `model` | Modeling | Structure, market, DTE, session, entry/exit, risk shell | Valid Spec; honesty_errors empty |
| D3 | `is_test` | In-Sample Testing | Train-window backtest | IS metrics + sample size floor |
| D4 | `oos_test` | Out-of-Sample Testing | Holdout / stress | OOS metrics; holdout not “broken” without kill reason |
| D5 | `sim` | Simulation Deployment | Paper / sim with live data path | Sim session log (may be thin in v1) |

**Development sub-plugins (examples):** risk graph, structure templates, friction model, Massive fills, R2R OTM scan, IV theo pin, session clocks.

#### B. Curation (PDF: Curation Phase)

| # | Stage key | PDF step | Member-facing | Required evidence |
|---|-----------|----------|---------------|-------------------|
| C1 | `categorize` | Categorization | Health: new / in-process / mature / sick | Explicit health label |
| C2 | `group` | Grouping | Portfolio / sleeve; correlation intent | At least one group or “solo” |
| C3 | `size` | Position Sizing | Fixed $ / fixed risk / vol-based | Size method + numbers |
| C4 | `monitor` | Monitoring | Watch criteria (drawdown, win-rate floor) | Monitor rules saved |
| C5 | `ready` | Deployment (to campaign) | Final review checklist | Checklist complete; peer/self-ack |

#### C. Campaign (PDF: Campaign Phase)

| # | Stage key | PDF step | Member-facing | Required evidence |
|---|-----------|----------|---------------|-------------------|
| K1 | `execute` | Strategy Execution | Running the plan | Campaign start committed |
| K2 | `allocate` | Capital Allocation | Capital slice | Allocation record |
| K3 | `timeline` | Execution Timeline | Start / planned end | Dates set |
| K4 | `log` | Logging & Documentation | Trade / process log | Log entries (or export) |
| K5 | `prune` | Pruning & Refinement | Scale / hold / cut | Decision recorded |
| K6 | `retro` | Retrospective Analysis | Post-campaign lessons | Retro note |
| K7 | `conclude` | Campaign Conclusion | Hard stop date / end | Concluded; optional re-entry |

### 2.3 Strategy card state (backbone entity)

A **Strategy Card** is the first-class object that moves through the cycle.

```text
StrategyCard
  id
  phase            : develop | curate | campaign | archive
  stage            : (D1–D5 | C1–C5 | K1–K7)
  health           : new | in_process | mature | sick | killed
  instrument_family: options | futures | pairs | arb | other
  strategy_kind    : long_butterfly | long_condor | put_debit | call_debit | …
  spec             : StrategySpec (plugin schema by family)
  evidence[]       : { kind, stage, payload, at }
  gates[]          : { from, to, decision, reason, at, actor }
  portfolio_group  : optional sleeve id
  sizing           : optional
  campaign_id      : optional active campaign
  flags            : { demo, read_only, coach_seed, … }
```

**Health** maps PDF Curation §1 (new / in-process / mature / sick).  
**Killed / archive** is an off-ramp terminal (or soft archive with reason).

### 2.4 Decision trees (gates)

Gates are **explicit decisions**, not silent auto-advance. Every transition records reason + timestamp.

#### Development decision tree

```
                    [D1 Hypothesis]
                          │
                          ▼
                    [D2 Model Spec] ──honesty fail──► stay / fix
                          │ ok
                          ▼
                    [D3 IS Test]
                     /    |    \
              kill   keep  promote_OOS
               │      │         │
               ▼      ▼         ▼
            ARCHIVE  D2/D3    [D4 OOS]
                               /  |  \
                          kill keep  promote_sim
                                   │
                                   ▼
                              [D5 Sim]
                               /  |  \
                          kill keep  promote_CURATE
                                         │
                                         ▼
                                      CURATE (C1)
```

**Promote rules (default, Basic mode — fail loud, no fantasy)**

| From → To | Minimum evidence |
|-----------|------------------|
| D3 → D4 | IS trades ≥ N_min (e.g. 8); friction on; verdict not empty |
| D4 → D5 | OOS holdout ≠ `broken` **or** written override + kill alternative declined |
| D5 → Curate | Sim ack **or** “sim deferred” with written reason (Pro/coach only) |
| Any → Kill | Non-empty kill reason |

#### Curation decision tree

```
[C1 Categorize] → [C2 Group] → [C3 Size] → [C4 Monitor] → [C5 Ready]
                                                              │
                                              promote_CAMPAIGN / bench / back_to_DEV
```

#### Campaign decision tree

```
[K1 Execute] → … → [K5 Prune] ──cut──► ARCHIVE / back to DEVELOP (new card preferred)
                    │
                    ▼
              [K6 Retro] → [K7 Conclude] → re-enter DEVELOP (clone) or CURATE
```

### 2.5 On-ramps and off-ramps

| Ramp | Direction | Meaning |
|------|-----------|---------|
| **Template create** | On → D1/D2 | New idea from structure template |
| **Clone** | On → D2 | Copy Spec; evidence not cloned (honest re-prove) |
| **Coach seed / demo pack** | On → Develop **and** Curate | Pre-built examples (see §5) |
| **Import idea** | On → D1 | Hypothesis only (future) |
| **Kill** | Off → archive | Written reason; never silent |
| **Bench** | Off (curate) | Stay owned, not campaign-ready |
| **Prune** | Off (campaign) | Remove from live set; optional re-develop |
| **Conclude → clone** | Off then on | Campaign end seeds new Development card |

**Doctrine:** Re-tuning mid-campaign is an off-ramp to Develop (new card), not silent Spec edit on a live campaign card.

---

## 3. Plugin architecture

### 3.1 Principle

```
LifeCycleEngine (phases, stages, gates, ramps, decision trees)
        │
        ├── Plugin: SpecEditor (by instrument_family)
        ├── Plugin: RiskGraph
        ├── Plugin: BacktestIS / BacktestOOS
        ├── Plugin: FrictionModel
        ├── Plugin: SimRunner
        ├── Plugin: PortfolioGroup
        ├── Plugin: PositionSizer
        ├── Plugin: CampaignLogger
        ├── Plugin: Retrospective
        └── Plugin: (future) PairsArbSpec, FuturesSpec, …
```

Plugins **register** against stages:

```text
PluginManifest
  id, version
  instrument_families[]   # options | futures | …
  stages[]                # where UI/actions appear
  actions[]               # e.g. run_is_test, apply_shape, save_size
  attributes[]            # fields contributed to Spec or Card
  gates_touch[]           # which gate evidence they produce
```

### 3.2 Strategy family shapes the plugins (not the cycle)

| Family | Spec shape (examples) | Plugins activated |
|--------|----------------------|-------------------|
| **options** (v1) | structure, wing, DTE, session, R2R, debit risk graph | RiskGraph, options backtest, Massive chains |
| **futures** (later) | root, session, roll, tick value | Futures bars, different friction |
| **pairs** (later) | legs A/B, hedge ratio, z-entry | Cointegration / spread chart |
| **arb** (later) | venue A/B, latency assumptions | Honesty gates stricter on fills |

**The backbone never changes when a family is added** — only plugin manifests and Spec schemas.

### 3.3 Options v1 strategy kinds (current product constraint)

Long-only defined-risk options (already in engine):

- `long_butterfly` — +1/−2/+1 all-call or all-put  
- `long_condor`  
- `put_debit`  
- `call_debit`  

These kinds **configure** Development plugins (geometry, risk graph, backtest units). They do not add new phases.

---

## 4. Information architecture (UI backbone)

### 4.1 Primary surface: Cycle Board

Three **phase columns** (not “features”):

| Column | Contains |
|--------|----------|
| **Develop** | Cards in D1–D5 |
| **Curate** | Cards in C1–C5 (+ demo seeds) |
| **Campaign** | Cards/campaigns in K1–K7 |

Optional fourth: **Archive** (killed / concluded).

### 4.2 Secondary surface: Stage workspace

Selecting a card opens the **workspace for its current stage**, which loads only registered plugins for that stage:

| Stage | Plugin panels (v1) |
|-------|-------------------|
| D1 | Hypothesis editor |
| D2 | Spec editor + Risk graph |
| D3 | IS backtest + metrics + gate |
| D4 | OOS backtest + holdout gate |
| D5 | Sim checklist / paper ack |
| C1–C5 | Health, group, size, monitor, ready checklist |
| K* | Campaign controls, log, retro (demo-light at first) |

**No infinite scroll of every tool on every stage.** Tools appear when the stage needs them.

### 4.3 Step rail (member chrome)

```
Phase: Develop | Curate | Campaign
Stage: [current] · next gate label
```

Replace the prototype’s “1 Choose · 2 Shape · 3 Details · 4 Gate” with **phase/stage/gate** language from this spec.

---

## 5. Demo corpus — five example strategies

Purpose: members **see finished construction** and **see cards already in Curation**, while coach demonstrates Campaign.

### 5.1 Seed policy

| Property | Value |
|----------|--------|
| Count | **5** demo Strategy Cards |
| Flags | `demo: true`, `coach_seed: true` |
| Placement | **Each** appears in **Develop** (read-only Spec + risk graph walkthrough) **and** a **parallel or same-card promotion** into **Curate** at `ready` or `categorize` mature |
| Mutability | Members **clone** to edit; originals optionally `read_only` |
| Evidence | Pre-filled honest placeholder metrics + narrative “how constructed” (not fantasy zero-cost) |

**Implementation option A (preferred):** One card per strategy with `phase=curate` and full evidence history (looks “done”), plus a **Develop gallery** of the same five as templates (not separate live cards).  

**Implementation option B:** Ten cards (5 develop + 5 curate clones). Clearer board density; more noise.

**Coach preference for teaching:** Option A — **Curate holds the five**; Develop has “Example library” that clones into D2.

### 5.2 The five (options v1 — illustrative names)

| # | Name | Kind | Teaching point |
|---|------|------|----------------|
| 1 | **SPY Afternoon Long Call Butterfly** | `long_butterfly` | +1/−2/+1 pin; debit max risk; tent payoff |
| 2 | **SPY Afternoon Long Condor** | `long_condor` | Expansion / range defined risk |
| 3 | **SPY Put Debit (Below)** | `put_debit` | Directional debit vertical, risk = debit |
| 4 | **SPY Call Debit (Above)** | `call_debit` | Mirror of put debit |
| 5 | **SPY Closing Session Long Butterfly (1 DTE)** | `long_butterfly` | Session + DTE as first-class Spec, not afterthought |

Each seed includes:

- Hypothesis in plain English  
- Spec (structure, wing, session, friction on)  
- Risk graph snapshot notes (max risk, best case, R2R)  
- Written “construction story” (how to rebuild)  
- Curation: health `mature`, group `demo-sleeve`, size fixed-risk example  

Campaign is **empty for members** until coach demo (or a single paper campaign later).

---

## 6. Mapping: current prototype → this backbone

| Today (`strategy-lab-proto`) | Life Cycle v1 |
|------------------------------|---------------|
| Stages `design, curation, deployment, killed` | `develop, curate, campaign, archive` |
| Flat stage (no D1–D5) | Sub-stages + gates |
| Backtest once → “gate” | Split **IS** vs **OOS** evidence |
| Deployment column | **Campaign** phase; sim is D5 inside Develop |
| Single Spec editor always visible | Spec plugin mainly at D2 |
| Risk graph always available | Primary plugin at D2; reference elsewhere |
| 0–1 demo IC seed | **5** coach-seed strategies in Curate + library |
| Features mixed into one page | Stage-scoped plugins |
| Options only (hardwired) | `instrument_family` + plugin manifests |

**Do not throw away:** honesty precepts, Massive path, risk graph engine, long-only structures, friction-always-on, plain-English Spec.

---

## 7. Data contracts (minimal)

### 7.1 Gate event

```json
{
  "id": "g_…",
  "card_id": "…",
  "at": "ISO-8601",
  "from": { "phase": "develop", "stage": "is_test" },
  "to": { "phase": "develop", "stage": "oos_test" },
  "decision": "promote" | "keep" | "kill" | "bench" | "conclude",
  "reason": "string, required if kill/bench/override",
  "evidence_refs": ["ev_…"]
}
```

### 7.2 Evidence event

```json
{
  "id": "ev_…",
  "card_id": "…",
  "kind": "is_backtest" | "oos_backtest" | "sim_ack" | "size_plan" | "retro" | …,
  "stage": "is_test",
  "payload": { },
  "at": "ISO-8601"
}
```

### 7.3 Lab store evolution

```text
lab_state.json
  mode
  strategies[]     # StrategyCard
  campaigns[]      # Campaign entity (capital, timeline, members of group)
  portfolio_groups[]
  gate_log[]       # optional denormalized
  demo_pack_version
```

---

## 8. Honesty & risk doctrine (non-negotiable plugins)

These bind **all** families and stages:

1. Friction always on (slip + commission/fees cannot both be zero)  
2. No absolute fantasy fills (label proxies: minute vs day bar)  
3. Max risk first in UI (before best case)  
4. Kill requires reason  
5. Campaign Spec freeze (clone to re-develop)  
6. Metrics language: process + defined risk; no “guaranteed profit” copy  

---

## 9. Implementation roadmap (backbone first)

### Phase 0 — Spec lock (this doc)

Coach review: phase names, gate rules, demo five, plugin boundary.

### Phase 1 — Backbone only (refactor store + board)

1. Rename stages to develop / curate / campaign / archive  
2. Add `stage` sub-keys D1–D5, C1–C5, K1–K7  
3. Gate API: promote / keep / kill / bench with reasons  
4. Cycle Board UI: three columns + archive  
5. Workspace shows **only current-stage plugins** (stubs OK)  
6. Seed **5 demo strategies** into Curate + Develop library  
7. Campaign column empty except coach path stub  

**Out of scope for Phase 1:** new backtest math, futures, pairs.

### Phase 2 — Development plugins wired

- D2 Spec + Risk graph (current engine)  
- D3 / D4 IS vs OOS split of existing backtest window  
- Honesty blockers as gate preconditions  

### Phase 3 — Curation plugins

- Health, group, sizing, monitor rules, ready checklist  
- Demo five fully labeled mature in Curate  

### Phase 4 — Campaign plugins (demo-ready)

- Start/end campaign, allocation field, log stub, retro form  
- Coach demonstration path  

### Phase 5 — Extensibility

- `instrument_family` + second family spike (e.g. futures stub Spec)  
- Plugin manifest registry  

---

## 10. Success criteria

| Criterion | Pass |
|-----------|------|
| Member can explain where a card is **without** knowing feature names | Phase + stage visible |
| Every advance is a **gate with evidence** | No silent stage jump |
| Demo five visible in **Curate** day one | Board not empty |
| Risk graph / backtest feel like tools **on** Develop, not the product | Stage-scoped |
| Adding pairs later does not rewrite phases | Plugin + family only |
| Kill / prune / bench always leave a **reason** | Audit trail |

---

## 11. Open questions for coach

1. **Sim (D5):** Required before Curate, or optional with written defer?  
2. **Demo pack:** Option A (Curate-owned + library) vs Option B (dual cards)?  
3. **Campaign capital:** Paper-only until broker bridge, or log-only demo?  
4. **Health “sick”:** Auto from monitor rules vs manual only in v1?  
5. **Multi-strategy campaign:** One campaign : many cards (recommended) vs one card : one campaign?  

---

## 12. Summary diagram (backbone vs plugins)

```
                    ON-RAMPS (templates, clone, coach seed)
                              │
                              ▼
┌──────────────┐  gate   ┌──────────────┐  gate   ┌──────────────┐
│  DEVELOP     │ ──────► │   CURATE     │ ──────► │  CAMPAIGN    │
│  D1…D5       │         │   C1…C5      │         │  K1…K7       │
└──────────────┘         └──────────────┘         └──────────────┘
   plugins:                 plugins:                 plugins:
   hypothesis, spec,        health, group,           execute, allocate,
   risk graph, IS/OOS,      size, monitor,           log, prune, retro,
   sim                      ready checklist          conclude
         │                        │                        │
         └──────── off-ramps: kill / bench / prune / archive ──┘
                              │
                              ▼
                    re-enter DEVELOP (clone) with lessons
```

---

## 13. Next build step (when approved)

Implement **Phase 1 only**: store schema + Cycle Board + gates + five seeds + stage-scoped shell. Keep current options engine as the D2/D3 plugin implementation behind the new spine.

**Do not** start with more chart features until the backbone is the visible product.
