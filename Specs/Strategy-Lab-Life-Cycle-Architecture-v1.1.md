# Strategy Lab — Life Cycle Architecture & Specification v1.1

**Status:** Design — **foundation first**, then plugin attributes & processes  
**Date:** 2026-08-04  
**Supersedes:** v1.0 (same product intent; this revision locks the *build order* and *versioned extension path*)  
**Source of truth (process):** `/Users/ernie/LifeCycle.pdf` — *Strategy Life Cycle Big Picture* (1/19/25)  
**Product home:** FatTail Labs Strategy Lab (`strategy-lab-proto` → later first-class Labs surface)  
**Doctrine:** Capital preservation / process over P&L claims · no fantasy fills · fail loud  

---

## 0. F1 product definition (coach lock — 2026-08-04)

**Yes — this is clear.** Version 1 ships a **fully functional life cycle** with **no subprocess plugins** turned on yet.

```
DESIGN                    CURATION                      DEPLOYMENT
create candidates    →    paper self-running mode   →   broker automation
  │ approve to curate       │ gate to deploy              │ run attributes
  │ send to bin             │                             │ retire
  └───────────── bin ◄──────┴─────────────────────────────┤ send back to CURATION
```

| Phase (member UI) | What F1 does | What F1 does **not** do yet |
|-------------------|--------------|-----------------------------|
| **Design** | Create candidate strategies; **approve → Curation** or **send to bin** | Risk graph, backtest, IS/OOS, modeling sub-steps as required plugins |
| **Curation** | Turn strategy into **self-running paper mode** (paper engine may be a stub that records “paper on”); **gate → Deployment** | Portfolio grouping math, advanced sizing plugins, live risk analytics |
| **Deployment** | **Send to broker** for automated execution (broker bridge may be stub/interface); hold **run attributes**; **retire** or **send back to Curation** | Full broker adapter, complex run analytics |
| **Bin** | Off-ramp archive (killed / discarded candidates) | — |

**F1 success:** A member (or coach demo) can walk a card **all the way around the cycle** using only foundation gates and minimal phase actions. Subprocesses (hypothesis editor polish, risk graph, Massive backtest, friction labs, etc.) are **added later as versioned plugins** without rewriting the cycle.

**Naming for F1 UI (coach language):** Design · Curation · Deployment · Bin  
(Internal/PDF map: Design ≈ Development; Deployment ≈ Campaign live; paper self-run ≈ sim/curation deploy-to-paper.)

### Life cycle chrome (header + notifications)

| Requirement | Detail |
|-------------|--------|
| **Cycle nav placement** | **Header**, right of app title, **centered** in the middle column |
| **Content** | Clickable bins: **Design → Curation → Deployment** \| **Bin** |
| **Indicator** | Active phase highlighted (primary style) |
| **Click behavior** | Switches **phase context** (focus that phase; select a card there if any). Assumes work is saved. |
| **Unsaved guard** | If pending edits, **do not switch**; show warning in the **notification panel** |
| **Notification panel** | Band **under** the header (where the large cycle diagram used to sit). Shows phase switch / save / block messages. |

Prototype: `render_header_cycle_nav()`, `render_notification_panel()`, `try_switch_phase()` in `strategy-lab-proto/app.py`.

### Phase bins + product moves (F1)

| Requirement | Detail |
|-------------|--------|
| **Product** | Versionable (`version` + `state` + `phase`); attributes bag starts empty |
| **Phase bins** | Design / Curation / Deployment / Bin — each a scrollable window, 0–100 products |
| **Search / filter** | Quick search + state filter above the board |
| **Select** | Click card → work area below shows product |
| **Drag-and-drop** | Drag product card onto another phase bin → `store.move_phase` / bin |
| **Programmatic** | Work area buttons: → Design / Curation / Deployment, Move to…, Retire, Trash, Restore |
| **Seed** | One precreated **Untitled product** v1.0.0, Design, no attributes |

Implementation: `engine/store.py` (`move_phase`, `promote`, `send_to_bin`, `restore_from_bin`) · `components/phase_board/` (CCv2 DnD) · `apply_product_move()` in `app.py`.

---

## 0.1 How we build (coach direction)

```
1. FOUNDATION     → cycle OS fully navigable (phases, cards, gates, ramps)  ← F1 SHIPS THIS
2. PLUGIN ATTRS   → typed attributes (including run attributes in Deployment)
3. PLUGIN PROCS   → subprocesses: risk graph, backtest, broker fill fidelity, …
4. FUTURE         → new attrs/procs/families without rewriting the foundation
```

**Rule:** Nothing that can be an attribute or process may be hardcoded into the foundation.  
**Rule:** The foundation may advance a card through the cycle with **empty plugins** (stubs).  
**Rule:** Plugins never invent new phases; they only attach to stages and gates.  
**Rule:** F1 phase actions (paper on, broker send, retire, return to curation) are **thin foundation ramps**, not full subprocess products.

---

## 1. Layer cake (system architecture)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  L3  PRESENTATION                                                        │
│      Cycle Board · Stage Workspace · Gate dialogs · Plugin panels        │
│      (reads foundation state + plugin UI contributions)                  │
├──────────────────────────────────────────────────────────────────────────┤
│  L2  PLUGIN LAYER                              ← versioned independently │
│      ├── Attribute plugins  (what is stored / shown on a card)           │
│      └── Process plugins    (what runs: test, size, log, graph, …)       │
│      Manifest registry · schema versions · capability negotiation        │
├──────────────────────────────────────────────────────────────────────────┤
│  L1  FOUNDATION (Life Cycle Kernel)            ← versioned rarely        │
│      Card · Phase · Stage · Gate · Ramp · Evidence bag · Decision log    │
│      State machine · gate rules (structure only) · honesty hooks         │
├──────────────────────────────────────────────────────────────────────────┤
│  L0  PERSISTENCE                                                             │
│      lab_state / DB · append-only gate log · demo pack version           │
└──────────────────────────────────────────────────────────────────────────┘
```

| Layer | Changes when… | Must not… |
|-------|----------------|-----------|
| **L1 Foundation** | Phases/stages of the *life cycle itself* change | Know butterfly wings, Massive, IV, R2R math |
| **L2 Plugins** | New strategy tools, attrs, families, analytics | Define new phases or skip gates silently |
| **L3 UI** | Layout, chrome, HI Spec | Own business state without foundation |

---

## 2. Foundation (L1) — what we build first

The foundation is a **small, stable kernel**. If plugins are missing, the product still works as a **life-cycle board with gates**.

### 2.1 Foundation responsibilities (closed set)

1. **Identity** — Strategy Card id, timestamps, flags (`demo`, `read_only`, `coach_seed`)  
2. **Location** — `phase` + `stage` (where the card sits in the cycle)  
3. **Health** — `new | in_process | mature | sick | killed` (label only; rules can be plugins later)  
4. **Instrument family tag** — opaque string (`options`, `futures`, …) for plugin filtering  
5. **Strategy kind tag** — opaque string (`long_butterfly`, …) for plugin filtering  
6. **Attribute bag** — versioned key/value store owned by attribute plugins (foundation only stores/validates envelope)  
7. **Evidence bag** — append-only records referencing `kind` + `schema_version` + payload  
8. **Gate engine** — allowed transitions, required *slots*, decision recording  
9. **Ramp engine** — on-ramps (create, clone, seed) and off-ramps (kill, bench, prune, conclude)  
10. **Decision log** — audit of every gate/ramp  

### 2.2 Foundation deliberately does *not* include

- Risk graph, IV, debit, wing width  
- Backtest engines, Massive clients  
- Position sizing formulas  
- Campaign capital math  
- Futures/pairs/arb domain models  

Those are **plugins**. The foundation only knows **slots** they fill (see §2.5).

### 2.3 Phases & stages (foundation constants)

**Phases (PDF):** `develop` | `curate` | `campaign` | `archive`

**Stages (ordered within phase):**

| Phase | Stages |
|-------|--------|
| develop | `hypothesis` → `model` → `is_test` → `oos_test` → `sim` |
| curate | `categorize` → `group` → `size` → `monitor` → `ready` |
| campaign | `execute` → `allocate` → `timeline` → `log` → `prune` → `retro` → `conclude` |
| archive | `killed` \| `concluded` \| `benched` (terminal labels) |

UI names: **Develop · Curate · Campaign · Archive**.

### 2.4 Strategy Card (foundation schema)

Envelope versioned as `card_schema_version`.

```json
{
  "card_schema_version": 1,
  "id": "string",
  "phase": "develop|curate|campaign|archive",
  "stage": "string",
  "health": "new|in_process|mature|sick|killed",
  "instrument_family": "options",
  "strategy_kind": "long_butterfly",
  "flags": { "demo": false, "read_only": false, "coach_seed": false },
  "created_at": "ISO-8601",
  "updated_at": "ISO-8601",
  "campaign_id": null,
  "portfolio_group_id": null,

  "attributes": {
    "hypothesis@1": { "text": "…" },
    "options_spec@1": { "…": "…" },
    "sizing@1": { "method": "fixed_risk", "…": "…" }
  },

  "evidence": [
    {
      "id": "ev_…",
      "kind": "is_backtest",
      "schema_version": 1,
      "stage": "is_test",
      "at": "ISO-8601",
      "plugin_id": "options.backtest",
      "payload": { }
    }
  ],

  "gates": [
    {
      "id": "g_…",
      "at": "ISO-8601",
      "from": { "phase": "develop", "stage": "is_test" },
      "to": { "phase": "develop", "stage": "oos_test" },
      "decision": "promote|keep|kill|bench|conclude|override",
      "reason": "string|null",
      "evidence_refs": ["ev_…"]
    }
  ]
}
```

**Versioning rule:**  
- Bump `card_schema_version` only when the **envelope** changes.  
- Attribute keys are `name@version` so new attribute versions coexist without envelope bumps.  
- Evidence uses `kind` + `schema_version` independently.

### 2.5 Gate slots (foundation) vs gate evidence (plugins)

The foundation defines **slots** — named requirements for a transition.  
Plugins **fill** slots with evidence. Empty slots block promote (fail loud).

Example (Develop):

| Transition | Required slots (foundation) | Typically filled by |
|------------|----------------------------|---------------------|
| → `model` | `slot.hypothesis` | attr `hypothesis@1` |
| → `is_test` | `slot.spec_valid` | process `options.spec.validate` |
| → `oos_test` | `slot.is_result` | process `options.backtest.is` |
| → `sim` | `slot.oos_result` | process `options.backtest.oos` |
| → curate | `slot.sim_ack` **or** `slot.sim_deferred` | process `sim.ack` |

Foundation code:

```text
can_promote(card, to_stage) =
  for each slot in GATE_TABLE[card.stage → to_stage]:
    if not evidence_or_attr_satisfies(card, slot): return false
  return true
```

**Future path:** New gate rules add rows to `GATE_TABLE` (foundation minor version) *or* optional slots declared by plugins (foundation supports optional plugin-declared slots from v1).

### 2.6 Decision tree (foundation)

Decisions are a closed enum at L1:

`promote | keep | kill | bench | conclude | override`

- `override` requires `reason` and is logged (coach/Pro).  
- `kill` / `bench` always require `reason`.  
- Plugins may **recommend** a decision; they may not apply it without the gate engine.

### 2.7 On-ramps / off-ramps (foundation)

| Ramp | Type | Foundation action |
|------|------|-------------------|
| `create_blank` | on | New card at `develop/hypothesis` |
| `create_from_template` | on | New card; template plugin fills default attrs |
| `clone` | on | New card; copy attrs; **clear evidence** (must re-prove) |
| `seed_demo` | on | Load demo pack cards (read-only optional) |
| `kill` | off | → archive/killed + reason |
| `bench` | off | → archive/benched or curate hold flag |
| `prune` | off | Campaign remove + reason; optional clone-to-develop |
| `conclude` | off | Campaign end + optional clone-to-develop |

### 2.8 Foundation API (minimal surface)

Stable interface for UI and plugins:

```text
Foundation v1
  list_cards(phase?) → Card[]
  get_card(id) → Card
  create_card(ramp, opts) → Card
  apply_gate(card_id, decision, to?, reason?, evidence_refs?) → Card | Error
  set_attribute(card_id, key@version, value) → Card | Error   # schema-validated by plugin registry
  append_evidence(card_id, evidence) → Card | Error
  list_plugins(stage?, family?) → Manifest[]
  get_demo_pack() → Card[]
```

Foundation is **executable without any process plugins** (attributes can be empty; gates that require slots simply block until plugins exist).

---

## 3. Plugin layer (L2) — attributes then processes

### 3.1 Two plugin kinds

| Kind | Role | Examples |
|------|------|----------|
| **Attribute plugin** | Defines a **versioned schema** for a bag of fields on the card | `hypothesis@1`, `options_spec@1`, `sizing@1`, `monitor_rules@1` |
| **Process plugin** | Defines **actions** that read/write attributes and append evidence | risk graph, IS backtest, position size calculator, campaign logger |

A process plugin **depends on** one or more attribute plugins (declared in the manifest).

### 3.2 Plugin manifest (versioned)

```json
{
  "plugin_id": "options.spec",
  "kind": "attribute" | "process",
  "version": "1.0.0",
  "semver": true,
  "instrument_families": ["options"],
  "strategy_kinds": ["*"] | ["long_butterfly", "long_condor", "…"],
  "stages": ["model", "is_test"],
  "provides_attributes": [
    { "key": "options_spec", "schema_version": 1, "json_schema_ref": "…" }
  ],
  "provides_evidence_kinds": [
    { "kind": "is_backtest", "schema_version": 1 }
  ],
  "fills_slots": ["slot.spec_valid", "slot.is_result"],
  "depends_on": [
    { "plugin_id": "options.spec", "version": ">=1.0.0" }
  ],
  "ui": {
    "panel_id": "options_spec_editor",
    "placement": "stage_workspace"
  },
  "compatibility": {
    "min_foundation": 1,
    "max_foundation": 1
  }
}
```

### 3.3 Attribute plugins (build second)

Attributes are the **data contracts**. Ship schemas before heavy process code.

#### v1 attribute set (options path)

| Attribute key | Schema | Stages | Notes |
|---------------|--------|--------|-------|
| `hypothesis@1` | `{ text, style_tags? }` | D1+ | Foundation slot `slot.hypothesis` |
| `options_spec@1` | structure, wing, DTE, session, exit, friction, body_side, … | D2+ | Current `StrategySpec` mapped in |
| `risk_shell@1` | max loss/day, ack no retune | D2 / C* | May nest in options_spec initially |
| `sizing@1` | method + params | C3 | fixed $, fixed risk, vol |
| `monitor_rules@1` | DD floor, sample floors | C4 | |
| `campaign_plan@1` | start/end, allocation | K* | |
| `construction_story@1` | teaching narrative | demo | For the five seeds |

**Migration path for attributes**

1. Publish `foo@2` schema alongside `foo@1`  
2. Process plugins declare which version they read  
3. Reader prefers highest version it understands  
4. Writer upgrades on next save (optional job)  
5. Never silently drop unknown keys (store passthrough for forward-compat)

### 3.4 Process plugins (build third)

Processes implement **work**. They must not own location in the cycle.

#### v1 process set (ordered by need)

| Plugin id | Depends on attrs | Fills slots | Stage |
|-----------|------------------|-------------|-------|
| `core.hypothesis_editor` | hypothesis@1 | slot.hypothesis | hypothesis |
| `options.spec_editor` | options_spec@1 | slot.spec_valid | model |
| `options.risk_graph` | options_spec@1 | (optional evidence) | model |
| `options.backtest_is` | options_spec@1 | slot.is_result | is_test |
| `options.backtest_oos` | options_spec@1 | slot.oos_result | oos_test |
| `core.sim_ack` | — | slot.sim_ack / deferred | sim |
| `curate.health` | — | health field | categorize |
| `curate.group` | — | portfolio_group_id | group |
| `curate.sizer` | sizing@1 | slot.size_plan | size |
| `curate.monitor` | monitor_rules@1 | slot.monitor | monitor |
| `curate.ready` | — | slot.ready_ack | ready |
| `campaign.runner` | campaign_plan@1 | — | execute… |
| `campaign.logger` | — | evidence trade_log | log |
| `campaign.retro` | — | evidence retro | retro |

**Future process plugins** (no foundation change):

- `futures.spec_editor`, `pairs.spread_model`, `arb.fill_honesty`  
- Advanced Monte Carlo OOS, live broker bridge, Process Flow scoring hooks  

### 3.5 Capability negotiation

At runtime:

```text
for card in board:
  family = card.instrument_family
  stage  = card.stage
  plugins = registry.where(
    family matches,
    stage matches,
    min_foundation ≤ foundation_version ≤ max_foundation
  )
  workspace.render(foundation_chrome + plugins.ui)
```

Unknown attribute keys in the bag are **preserved** (forward compatible).  
Unknown evidence kinds are **displayed as opaque JSON** or hidden, never deleted.

---

## 4. Versioning strategy (path to future)

### 4.1 Three version numbers

| Artifact | Version field | When to bump |
|----------|---------------|--------------|
| Foundation | `foundation_version` (int) | New phase/stage/gate enum, card envelope break |
| Attribute | `name@N` | Field added/removed/semantics change |
| Plugin package | semver `MAJOR.MINOR.PATCH` | Code release of a plugin |

### 4.2 Compatibility matrix (example)

| Foundation | Plugin options.spec | Notes |
|------------|---------------------|-------|
| 1 | 1.x | Current |
| 1 | 2.x | New attrs only; still fills same slots |
| 2 | 1.x | Only if `max_foundation` allows; else disable plugin with message |

### 4.3 Demo pack versioning

```text
demo_pack_version: "2026.08.04"
```

Seeds are **data**, not code. Bumping demo pack can add cards or upgrade attribute payloads without foundation change.

### 4.4 Lab state root

```json
{
  "lab_schema_version": 1,
  "foundation_version": 1,
  "mode": "basic|pro",
  "strategies": [ /* cards */ ],
  "campaigns": [],
  "portfolio_groups": [],
  "plugin_registry_snapshot": [ /* optional pinned manifests */ ],
  "demo_pack_version": "2026.08.04"
}
```

---

## 5. Build path (strict order)

### Phase F0 — Design lock

This document. No feature code until foundation contracts agreed.

### Phase F1 — Foundation only (fully navigable cycle, no subprocess plugins)

**Deliverable:** Strategy Lab where the **life cycle works end-to-end** without risk graph, backtest, or other subprocesses.

| Capability | F1 behavior |
|------------|-------------|
| **Board** | Columns: **Design · Curation · Deployment · Bin** |
| **Design** | Create candidate (name + optional free-text note / kind tag); **Approve → Curation**; **Send to bin** (reason) |
| **Curation** | **Enable paper self-run** (toggle / action; may log stub “paper session active”); **Gate → Deployment** (confirm); optional return-to-bin |
| **Deployment** | **Send to broker** (interface stub OK: records intent + run_attributes shell); while deployed, edit **run attributes** (generic key/value or `run@1` bag); **Retire → Bin**; **Send back → Curation** |
| **Bin** | List discarded/retired; optional restore later (v1.1+) |
| **Not in F1** | Risk graph, IS/OOS backtest, IV, R2R math, Massive, real broker orders, portfolio correlation, subprocess stage D1–D5 enforcement |

**Acceptance (F1):**

1. Create a candidate in Design.  
2. Approve it into Curation **or** send it to the Bin with a reason.  
3. In Curation, turn **paper self-run** on; then gate to Deployment.  
4. In Deployment, attach/edit run attributes; choose **retire** or **return to Curation**.  
5. No subprocess plugin is required for any of the above.

**Stubs allowed:** paper engine and broker adapter as no-op or log-only implementations behind stable interfaces (`PaperRunner`, `BrokerRouter`) so real engines plug in later without cycle changes.

### Phase A1 — Attribute plugins (data contracts)

- `hypothesis@1`  
- `options_spec@1` (map existing `StrategySpec`)  
- `sizing@1`, `monitor_rules@1`, `campaign_plan@1` (can be minimal)  
- Schema validation on `set_attribute`  
- Demo pack fills real options_spec + construction_story  

**Acceptance:** Cards hold real Specs; still no auto evidence from backtests.

### Phase P1 — Process plugins (options Develop)

- Spec editor UI bound to `options_spec@1`  
- Risk graph process  
- IS / OOS backtest processes filling slots  
- Honesty validators as process pre-checks  

**Acceptance:** Full Develop path for options with honest gates.

### Phase P2 — Curate process plugins

- Health, group, sizer, monitor, ready  

### Phase P3 — Campaign process plugins

- Plan, log, retro, conclude (demo-grade)  

### Phase X — Extension examples (proves the path)

- Add `options_spec@2` (e.g. new field) without foundation bump  
- Spike `instrument_family: pairs` with one attribute + one process plugin  
- Foundation unchanged  

---

## 6. UI binding to layers

| UI region | Layer | Content |
|-----------|-------|---------|
| Cycle Board columns | L1 | Cards by phase |
| Card chip (stage, health) | L1 | Foundation fields |
| Gate strip | L1 | Next transition + slot checklist |
| Workspace main | L2 | Plugin panels for current stage only |
| Attribute inspector (Pro) | L2 | Raw `key@version` bag (debug / future-proof) |

**Empty foundation UX:** Workspace shows “No plugins registered for this stage” + list of required slots still open. That is a **feature**, not a failure — it proves extensibility.

---

## 7. Mapping existing prototype into this path

| Current code | Becomes |
|--------------|---------|
| `LabStore` stages design/curation/deployment | L1 foundation phases/stages |
| `StrategySpec` | Attribute `options_spec@1` |
| Risk graph / legs / curves | Process `options.risk_graph` |
| `backtest.py` | Processes `options.backtest_is` / `_oos` |
| Gate buttons Keep/Curation/Kill | L1 `apply_gate` |
| App page with everything at once | L3 stage-scoped plugin host |

**Import rule:** Port domain code *into* plugins; do not grow `app.py` as the architecture.

Suggested package shape (when implemented):

```text
strategy-lab-proto/
  foundation/          # L1 kernel
    card.py
    gates.py
    ramps.py
    store.py
    versions.py
  plugins/
    registry.py
    attributes/
      hypothesis_v1.py
      options_spec_v1.py
      sizing_v1.py
    processes/
      options_risk_graph.py
      options_backtest.py
      …
  ui/                  # L3 Streamlit or later web
    board.py
    workspace.py
    gate_dialog.py
  data/
    lab_state.json
    demo_pack/
```

---

## 8. Demo corpus (still five) — foundation-compatible

Five coach-seed cards in **Curate** (mature/ready), plus Develop **template library**.

| # | Kind | Attribute payload |
|---|------|-------------------|
| 1 | long_butterfly | options_spec@1 + construction_story@1 |
| 2 | long_condor | … |
| 3 | put_debit | … |
| 4 | call_debit | … |
| 5 | long_butterfly 1DTE closing | … |

In **F1**, seeds may have only hypothesis text + kind tags.  
In **A1**, full Specs.  
In **P1**, optional pre-recorded evidence snapshots (not live lies).

---

## 9. Success criteria (foundation-first)

| Gate | Pass |
|------|------|
| F1 | Cycle board + gates work with **zero** domain plugins |
| A1 | New attribute version can be added without foundation code change |
| P1 | Options Develop path uses plugins only; foundation API unchanged |
| X | Second instrument family demo without new phases |

---

## 10. Open questions (narrowed)

1. **F1 slots:** Hard-block promotes without evidence, or soft-block with “stub fill” for empty-lab UX?  
   - **Recommendation:** soft-block in F1 (`slot_status: stub`), hard-block once A1/P1 land for that slot.  
2. **Plugin host language:** Stay Python/Streamlit for proto; design manifests JSON so a future web host can load the same registry.  
3. **Campaign entity:** Separate `campaigns[]` in L1 (recommended) vs only card stage in campaign phase.

---

## 11. One-sentence charter

> **Build a versioned life-cycle kernel first; hang versioned attributes and processes on it so Strategy Lab can grow new tools and markets without rewriting the trader’s routine.**

---

## 12. Relationship to v1.0

v1.0 defined *what* the life cycle is (PDF mapping, stages, demo five).  
**v1.1 defines *how* we construct the software:** foundation → attributes → processes → future versions, with explicit versioning and package boundaries.

Use **v1.1** for implementation planning.
