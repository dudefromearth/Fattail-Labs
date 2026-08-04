# Strategy Lab — Architecture & Design Document v1.0

**Status:** Canonical design + as-built snapshot  
**Date:** 2026-08-04  
**Product:** FatTail Strategy Lab  
**Prototype path:** `strategy-lab-proto/` (Streamlit)  
**Intended home:** First-class Labs surface under `labs.fattail.ai` (later)  
**Process source:** `/Users/ernie/LifeCycle.pdf` — *Strategy Life Cycle Big Picture* (1/19/25)  
**Related:** `Strategy-Lab-Life-Cycle-Architecture-v1.0.md`, `v1.1.md` (foundation/plugin path) · **`Strategy-Lab-Portability-Spec-v1.0.md`** (whole-lab import/export pack) · `schemas/strategy-lab-pack-v1.json`  
**Doctrine:** Capital preservation · process over profit claims · no fantasy fills · fail loud · stop-the-bleeding first  

---

## 1. Purpose

Strategy Lab is the **software embodiment of the professional Strategy Life Cycle**. It helps members (and coaches) develop a **limited set of core strategies**, curate them into a disciplined portfolio, deploy them paper/live, and retire or learn from them — with an audit trail.

It is **not** a charting toy first. Risk graph, backtest, sizing math, and broker adapters are **plugins**. The **life cycle is the product spine**.

### 1.1 Goals

| Goal | Meaning |
|------|---------|
| **Lifecycle OS** | Navigate Development → Curation → Deployment with explicit phase states |
| **Versionable strategies** | Each strategy is a product with version, phase, phase state, and log |
| **Teach by structure** | Empty cycle works; demo strategies can walk the full path |
| **Extensible** | Options now; futures / pairs / arb later without rewriting phases |
| **Honest process** | Costs on, no silent defaults, gates leave reasons |

### 1.2 Non-goals (v1 foundation)

- Full production broker OMS  
- Shared code with MarketSwarm-Canonical (HTTP only if needed)  
- Profit claims or fantasy mid fills  
- Replacing FatTail Labs course hosting (`web/` + `server/`)  

---

## 2. Product thesis

> The Strategy Life Cycle is the backbone of a professional trader’s routine: develop, curate, campaign, prune, and learn — with discipline and defined risk.

**FatTail alignment**

- Sell the dream, sequence the discipline  
- Process outcomes over P&L theater  
- Defined risk visible before reward  
- Coaching pathway elevates mastery of this cycle  

**PDF mapping**

| LifeCycle.pdf | Strategy Lab |
|---------------|--------------|
| Development Phase | **Development** bin + in-phase states |
| Curation Phase | **Curation** bin + in-phase states |
| Campaign Phase | **Deployment** bin + in-phase states |
| Kill / archive | **Bin** (retired / trashed) |

---

## 3. Architecture overview

### 3.1 Layer cake

```
┌──────────────────────────────────────────────────────────────────────────┐
│  L3  PRESENTATION                                                        │
│      Header cycle nav · notifications · phase bins · work area           │
│      (Streamlit proto → later Labs web)                                  │
├──────────────────────────────────────────────────────────────────────────┤
│  L2  PLUGIN LAYER (versioned; attach over time)                          │
│      Attribute plugins · Process plugins (risk graph, backtest, …)       │
├──────────────────────────────────────────────────────────────────────────┤
│  L1  FOUNDATION (Life Cycle Kernel)                                      │
│      Strategy card · phase · phase_state · version · gates · ramps · log │
├──────────────────────────────────────────────────────────────────────────┤
│  L0  PERSISTENCE                                                         │
│      lab_state.json (proto) → Labs MySQL later                           │
└──────────────────────────────────────────────────────────────────────────┘
```

| Layer | Owns | Must not own |
|-------|------|----------------|
| **L1 Foundation** | Where a strategy sits; how it moves; audit log | Wing width, IV, Massive fills, broker wire |
| **L2 Plugins** | Spec fields, risk curves, tests, paper/live engines | New top-level phases |
| **L3 UI** | Layout, chrome, density | Silent business state |

### 3.2 Build order (locked)

```
1. FOUNDATION  → fully navigable cycle (phases, states, bins, rename, log)
2. ATTRIBUTES  → versioned data bags on the strategy (options_spec@1, …)
3. PROCESSES   → tools that read/write attrs + emit evidence
4. FUTURE      → new attrs/procs/instrument families without kernel rewrite
```

**Rule:** The foundation may run with **empty attributes** (blank strategy).  
**Rule:** Plugins never invent new phases; they fill slots and evidence on stages.

### 3.3 System context

```
                    ┌─────────────────┐
   Member / Coach ──►│  Strategy Lab   │
                    │  (lifecycle UI) │
                    └────────┬────────┘
                             │ L1 store + L2 plugins
           ┌─────────────────┼─────────────────┐
           ▼                 ▼                 ▼
    ┌────────────┐   ┌─────────────┐   ┌──────────────┐
    │ Risk engine│   │ Backtest /  │   │ Paper /      │
    │ (options)  │   │ Massive     │   │ Broker stubs │
    └────────────┘   └─────────────┘   └──────────────┘
           (plugins — optional until attached)
```

Standalone from MarketSwarm-Canonical: no shared imports; any MSC capability is via HTTP later.

---

## 4. Life cycle model

### 4.1 Phases (bins)

```
ON-RAMPS (create · clone · coach seed)
        │
        ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ DEVELOPMENT  │───►│  CURATION    │───►│ DEPLOYMENT   │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        └───────────────────┴───────────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │     BIN      │  retired | trashed
                     └──────────────┘
                            │
                   restore → DEVELOPMENT (optional)
```

| Phase key | UI label | Intent |
|-----------|----------|--------|
| `development` | **Development** | Idea → model → prove → handoff-ready |
| `curation` | **Curation** | Portfolio readiness (category, group, size, monitor) |
| `deployment` | **Deployment** | Schedule, capital, run, prune, retrospective |
| `bin` | **Bin** | Off-ramp: retired or trashed |

Capacity: **0–100 strategies per phase** (enforced in store).

### 4.2 Phase-local states

Each strategy has **`phase`** + **`phase_state`**. States are ordered within a phase. Cards show the **current phase state’s label**.

#### Development

| # | Key | Label | Notes |
|---|-----|-------|-------|
| 1 | `hypothesis` | Hypothesis | Starting point for blank strategies |
| 2 | `model` | Model | Structure / rules modeled |
| 3 | `is_test` | In-sample test | IS evidence (plugin later) |
| 4 | `oos_test` | OOS test | Holdout evidence (plugin later) |
| 5 | `deployed` | **Deployed** | **Ready for Curation**; sim or live capable |

**Deployed (Development)** ≠ Deployment phase. It means “finished development path; eligible to curate.”

#### Curation

| # | Key | Label |
|---|-----|-------|
| 1 | `categorized` | Categorized |
| 2 | `grouped` | Grouped |
| 3 | `position_sized` | Position sized |
| 4 | `monitored` | Monitored |

#### Deployment

| # | Key | Label | Notes |
|---|-----|-------|-------|
| 1 | `strategy` | **Strategy** | Handoff from Curation; ready to schedule |
| 2 | `capital_allocation` | Capital allocation | |
| 3 | `scheduled` | Scheduled | |
| 4a–d | `started` / `paused` / `stopped` / `ended` | Started / Paused / Stopped / Ended | Run control |
| 5 | `pruned` | Pruned | |
| 6 | `retrospective` | Retrospective | |

#### Bin

| Key | Label |
|-----|-------|
| `retired` | Retired |
| `trashed` | Trashed |

### 4.3 State transitions

| Action | Behavior |
|--------|----------|
| **Set state** | Jump to any legal state in the **current** phase (logged) |
| **Advance →** | Next ordered state in phase (logged) |
| **Move phase** | Change bin; enter default state of target phase (logged) |
| **Promote** | Development→Curation only if Development is **Deployed** (enforced on promote path) |
| **Retire / Trash** | → Bin with reason |
| **Restore** | Bin → Development (default) |

Default entry states: Development `hypothesis`, Curation `categorized`, Deployment `strategy`, Bin `retired`.

### 4.4 On-ramps and off-ramps

| Ramp | Type | Effect |
|------|------|--------|
| Create blank / template | on | New strategy in Development / Hypothesis |
| Clone | on | Copy attrs; clear evidence (must re-prove) — future |
| Coach seed | on | Pre-built teaching strategies |
| Kill / retire / trash | off | Bin + reason |
| Restore | on | Leave Bin into a working phase |
| Conclude campaign | off | Log end; optional clone to Development |

### 4.5 Decision trees (gates)

Gates are **explicit decisions**, not silent auto-advance. Every gate records reason + timestamp in `lifecycle_log`.

```
Development states ──[Deployed]──► Curation ──[Monitored]──► Deployment
       │                                  │                        │
       └────────────── Bin (reason) ◄─────┴────────────────────────┘
```

Future plugins add **evidence slots** (IS result, OOS result, size plan) that hard-block promote when missing. F1 may soft-allow phase moves for demo.

---

## 5. Strategy as versionable product

### 5.1 Identity

| Field | Role |
|-------|------|
| `id` | Instance id (UI / store key) |
| `product_key` | Stable identity across versions (future multi-version lineage) |
| `name` | Human title (renameable) |
| `version` | Semver-like `major.minor.patch` string |
| `description` | Short blurb for bin cards |
| `phase` / `phase_state` | Location in cycle |
| `attributes` | Plugin data bag (empty in F1 blank) |
| `spec` | Legacy/options shape (maps toward `options_spec@1`) |
| `lifecycle_log` | Append-only events |

### 5.2 Rename

- User edits title in Work area  
- Always logs `rename` (`from_name` → `to_name`)  
- Optionally **advance version** (patch / minor / major) → logs `version_bump`  

### 5.3 Versioning path (attributes & plugins)

| Artifact | Version field | Bump when |
|----------|---------------|-----------|
| Foundation / card envelope | `lab_schema_version`, `foundation_version` | Kernel shape changes |
| Attribute bags | `name@version` (e.g. `options_spec@1`) | Field semantics change |
| Plugin packages | semver | Code releases |

Unknown keys preserved (forward compatible).

---

## 6. Information architecture (UI)

### 6.1 Page skeleton

```
┌─────────────────────────────────────────────────────────────────┐
│  Strategy Lab          [Dev → Cur → Dep | Bin]     [Massive]    │  header
├─────────────────────────────────────────────────────────────────┤
│  Notification panel (saves, blocks, phase switches)             │
├─────────────────────────────────────────────────────────────────┤
│  Phase bins (4 columns, always visible, scrollable)             │
│  [ Development ] [ Curation ] [ Deployment ] [ Bin ]            │
│     horizontal strategy cards (minimal density)                 │
├─────────────────────────────────────────────────────────────────┤
│  Work area (selected strategy)                                  │
│     metrics · rename · phase state · move / bin / restore · log │
├─────────────────────────────────────────────────────────────────┤
│  Plugin workspace (hidden for blank strategies)                 │
│     risk graph · Spec · backtest · …                            │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Header cycle nav

- Centered right of title  
- Highlights current phase context  
- Click switches context (select strategy in that phase if any)  
- Blocked if unsaved work → notification  

### 6.3 Phase bins

| Requirement | Spec |
|-------------|------|
| Always visible | Empty bins still render as surfaces |
| Capacity | Show `n/100` |
| Search | Name, description, id, phase state |
| Sort (per bin) | Newest · Oldest · Phase state · newest |
| Card content | **Name · version · short description · phase-state badge** |
| Card layout | **Horizontal**, compact (several above the fold) |
| Actions | Open/Selected · one-step hop to next phase |

### 6.4 Work area

- Version, phase, **phase state** metrics  
- Rename + optional version bump  
- Set / advance phase state  
- Move between phases; retire / trash; restore  
- Lifecycle log expander  

### 6.5 Blank strategy behavior

Seed (and F1 demos) may have **empty `attributes`**.  
Plugin tools (risk graph, Spec editor, backtest) stay **off** until attributes exist so the cycle can be demonstrated pure.

---

## 7. Data model

### 7.1 Strategy record (conceptual)

```json
{
  "id": "a62c347c",
  "product_key": "a62c347c",
  "name": "Untitled strategy",
  "description": "",
  "version": "1.0.0",
  "version_major": 1,
  "version_minor": 0,
  "version_patch": 0,
  "phase": "development",
  "phase_state": "hypothesis",
  "state": "active",
  "attributes": {},
  "spec": { "...": "options shape when present" },
  "lifecycle_log": [
    { "at": "ISO-8601", "event": "created|rename|phase_move|phase_state|version_bump", "...": "..." }
  ],
  "created_at": "ISO-8601",
  "updated_at": "ISO-8601",
  "bin_reason": null
}
```

### 7.2 Lab state root (proto)

```json
{
  "lab_schema_version": 3,
  "foundation_version": 1,
  "mode": "basic|pro",
  "strategies": [ /* ... */ ],
  "campaigns": [],
  "demo_pack_version": "f1-blank-strategy"
}
```

### 7.3 Store API (foundation)

| Method | Purpose |
|--------|---------|
| `create` / `ensure_f1_seed` | On-ramp |
| `move_phase` | Programmatic / hop between bins |
| `promote` | Forward with Deployed guard (dev→cur) |
| `set_phase_state` / `advance_phase_state` | In-phase state machine |
| `send_to_bin` / `restore_from_bin` | Off-ramp / return |
| `rename` / `bump_version` | Versionable title |
| `list_strategies` / `by_phase` / `get` | Read model |

Canonical state machine: `engine/lifecycle_states.py`.

---

## 8. Plugin architecture

### 8.1 Attribute plugins (data)

Examples:

| Attribute | Phase affinity | Role |
|-----------|----------------|------|
| `hypothesis@1` | Development | Text + tags |
| `options_spec@1` | Development | Structure, wing, DTE, session, friction |
| `sizing@1` | Curation | Fixed $ / risk / vol |
| `monitor_rules@1` | Curation | DD floors, sample floors |
| `campaign_plan@1` / `run@1` | Deployment | Capital, schedule, run attrs |
| `construction_story@1` | Demo | Teaching narrative |

### 8.2 Process plugins (actions)

| Plugin | Fills / does |
|--------|----------------|
| Spec editor | Validates options_spec |
| Risk graph | Payoff + theo mark (long structures) |
| IS / OOS backtest | Evidence for is_test / oos_test |
| Paper runner | Curation self-run (stub→real) |
| Broker router | Deployment execution (stub→real) |
| Logger / retro | Deployment evidence |

### 8.3 Options v1 strategy kinds (when attributes on)

Long-only defined-risk:

- Long butterfly (+1/−2/+1 all-call or all-put)  
- Long condor  
- Put debit / call debit  

Instrument families later: `futures`, `pairs`, `arb` — same phases, new attribute/process plugins.

### 8.4 Honesty doctrine (binds all plugins)

1. Friction always applied (no free fantasy fills)  
2. Label data proxies (minute vs day bar)  
3. Max risk first in risk UI  
4. Kill/retire requires reason  
5. Campaign retune → clone to Development, not silent edit  
6. No guaranteed-profit marketing language  

---

## 9. As-built prototype (2026-08-04)

### 9.1 Runtime

| Piece | Port / path |
|-------|-------------|
| **Strategy Lab (integrated)** | Next · **`/app/strategy-lab`** · `web/components/strategy-lab/` + `GET/POST /api/me/strategy-lab/*` |
| **Ownership** | Family B: `strategy_lab_strategies.identity_id` → session identity only |
| Strategy Lab Streamlit proto | Optional local · **http://localhost:8501** · `strategy-lab-proto/` (lifecycle prototyping) |
| Risk graph UI | Vite · **http://127.0.0.1:5174** · plugin path later |
| FatTail Labs site | Next · **http://localhost:3000** · `web/` |
| Labs API | FastAPI · **http://localhost:4000** · `server/` |

Start Strategy Lab:

```bash
cd strategy-lab-proto
set -a && source .env && set +a   # Massive key if backtest used
../server/.venv/bin/streamlit run app.py --server.port 8501
```

### 9.2 Code map

| Path | Role |
|------|------|
| `migrations/078_strategy_lab.sql` | `strategy_lab_strategies` table (identity_id FK) |
| `server/strategy_lab_domain.py` | Phases, states, ownership CRUD |
| `server/routes/strategy_lab.py` | `/api/me/strategy-lab/*` session-scoped API |
| `web/app/app/strategy-lab/page.tsx` | Member route shell |
| `web/components/strategy-lab/StrategyLabApp.tsx` | Bins + work area UI |
| `web/lib/strategyLabApi.ts` | Client |
| `strategy-lab-proto/engine/lifecycle_states.py` | Proto phases/states (local JSON) |
| `strategy-lab-proto/engine/store.py` | Proto JSON store |
| `engine/spec.py` | Options StrategySpec (plugin-bound) |
| `engine/risk_engine/*` | Legs, payoff, curves, handles |
| `engine/backtest.py` | Massive-backed sim (process plugin) |
| `app.py` | L3 UI: chrome, bins, work area, plugin host |
| `components/phase_board/` | Optional CCv2 DnD board |
| `components/risk_handles/` | MSC risk graph iframe bridge |
| `data/lab_state.json` | Local persistence |

### 9.3 F1 demo seed

One blank strategy:

- Name: **Untitled strategy** (or member-renamed)  
- Version: **1.0.0**  
- Phase: **development**  
- Phase state: **hypothesis**  
- Attributes: `{}`  

Member can advance states, move bins, rename, retire — without plugins.

### 9.4 Known prototype limits

- Drag-and-drop: CCv2 component exists; primary UX is column bins + hop/work-area moves  
- Paper / broker: interfaces reserved; not production-wired  
- Evidence slots for IS/OOS not hard-blocking all promotes yet  
- Persistence is local JSON, not multi-user Labs DB  

---

## 10. Roadmap

| Phase | Deliverable |
|-------|-------------|
| **F1** (current focus) | Lifecycle foundation: bins, states, rename, log, blank strategy walkthrough |
| **A1** | Attribute schemas (`options_spec@1`, sizing, …) |
| **P1** | Development plugins: Spec + risk graph + IS/OOS |
| **P2** | Curation plugins: category, group, size, monitor, paper-on |
| **P3** | Deployment plugins: capital, schedule, broker stub, retro |
| **X** | Second instrument family spike without new phases |
| **Labs integration** | Auth, multi-tenant store, course pathway deep-links |

---

## 11. Success criteria

| Criterion | Pass |
|-----------|------|
| Member sees four phase bins at a glance | Always-visible columns |
| Strategy card is scannable | Name, version, description, phase state |
| Full cycle without plugins | Blank strategy walkthrough |
| Rename audited | Log + optional version bump |
| Development Deployed | Meaningfully gates readiness for curation |
| Deployment Strategy | Clear handoff from curation |
| Future markets | New plugins only; phases stable |

---

## 12. Open questions

1. Soft vs hard block: must Development be Deployed before any Curation hop, or only on formal **Promote**?  
2. Paper self-run: hosted in Curation vs Deployment?  
3. Multi-version lineage UI: one card per version vs version stack under `product_key`?  
4. When Strategy Lab becomes a Labs route: Streamlit embed vs native Next rewrite of L3 only?  

---

## 13. Document control

| Version | Date | Notes |
|---------|------|-------|
| **1.0** | 2026-08-04 | Canonical architecture & design: lifecycle, foundation/plugins, bins, states, as-built proto |

**Supersedes for planning:** narrative in `Strategy-Lab-Life-Cycle-Architecture-v1.0.md` and build path in `v1.1.md` (keep those files for history; **this document is the current map**).

---

## 14. One-line charter

> **Strategy Lab is a versioned life-cycle kernel for strategies — foundation first, plugins second — so members can develop, curate, deploy, and learn with process integrity.**
