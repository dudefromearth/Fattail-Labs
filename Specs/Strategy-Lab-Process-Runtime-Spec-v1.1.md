# Strategy Lab — Process Runtime Spec v1.1  
### Deployment plans · scan/manage · decision log · Tradier handoff · user + broker run first

**Status:** **SPEC AUTHORITY** (normative; supersedes v1.0 default hosting narrative)  
**Date:** 2026-08-05 (amended same day: ExitPolicy structure-agnostic · order dedupe · pause/archive working-order banner · attestation Privacy consumer)  
**Supersedes:** [`Strategy-Lab-Process-Runtime-Spec-v1.0.md`](./Strategy-Lab-Process-Runtime-Spec-v1.0.md) for **execution responsibility** and **delivery priority**  
**Product:** FatTail Strategy Lab (`/app/strategy-lab`)  
**Decisions:** DL-213 · DL-213b · **DL-214** · review `docs/Strategy-Lab-Execution-Architecture-Review-2026-08-05.md`  
**Implementation scope:** [`docs/Strategy-Lab-Process-Runtime-Implementation-Scope-v1.0.md`](../docs/Strategy-Lab-Process-Runtime-Implementation-Scope-v1.0.md)  
**Agent bench plan:** [`docs/Strategy-Lab-Process-Runtime-Full-Agent-Bench-Plan-v1.0.md`](../docs/Strategy-Lab-Process-Runtime-Full-Agent-Bench-Plan-v1.0.md) · board [`agents/p-strategy-runtime/`](../agents/p-strategy-runtime/)  

**Parents / siblings (must not reverse)**

| Document | Role / lock this Spec inherits |
|----------|--------------------------------|
| [`Architecture/14-strategy-lab-execution-responsibility.md`](../Architecture/14-strategy-lab-execution-responsibility.md) | **User + broker run**; Labs handoff; M0–M3 modes |
| [`Strategy-Lab-Architecture-Design-v1.0.md`](./Strategy-Lab-Architecture-Design-v1.0.md) | Life-cycle spine; plugins over kernel |
| [`Strategy-Lab-Development-Phase-Spec-v1.0.md`](./Strategy-Lab-Development-Phase-Spec-v1.0.md) | Design BT → FW → Deployed **before** Curate; no live as first proof |
| [`Strategy-Lab-Navigation-Continuity-Spec-v1.0.md`](./Strategy-Lab-Navigation-Continuity-Spec-v1.0.md) | Place memory ≠ product truth; action trail / version / restore layers |
| [`Strategy-Lab-Versioning-and-Process-Control-Recommendations-v1.0.md`](./Strategy-Lab-Versioning-and-Process-Control-Recommendations-v1.0.md) | P1–P8; explore ≠ restore; SoR metrics; paper-before-live; freeze on live; expected_head |
| [`Strategy-Lab-Strategy-Pack-Architecture-v1.0.md`](./Strategy-Lab-Strategy-Pack-Architecture-v1.0.md) | Packs, exit rules, risk-adjusted metrics, validate |
| [`Architecture/09-strategy-lab-tradier.md`](../Architecture/09-strategy-lab-tradier.md) | Massive data in · **Tradier first** for orders |
| Admin Dual Surface Spec | `/admin/*` for residual Labs-assisted fleet |
| North Star Ethos v1.2 | Process over P&L theater; capacity; fail loud |
| Habit Catalog Spec v0.1 (draft) | Operator methodology around deploy (later wire) |

**First broker:** **Tradier** (paper → live). Market data: Massive / Coach chain pipe — **not** Tradier streaming.

**Source analysis:** OptionAlpha “bots as processes” — **ideas adapted, not product clone**. Superiority = life cycle + versioning + defined risk + honest ladder + **handoff to user/broker**, not five-nines Labs bot farm.

**Doctrine:** Capital preservation · process before profit claims · defined risk · fail loud · Family B isolation · no fantasy fills · stop-the-bleeding first · **creator owns the strategy**  

**Legal:** Spec is product boundary, not counsel. ToS + arming attestation required before any live path.

---

## 0. Intent

### 0.1 Execution responsibility (normative — DL-214)

> **As much responsibility as possible for *running* automations sits with the user (creator) and the broker — not with FatTail Labs as a 24/7 execution host.**

| Party | Owns |
|-------|------|
| **User (creator)** | Strategy, parameters, arming, monitoring, contingency, optional local runtime |
| **Broker (Tradier first)** | Account, custody, order accept/reject/fills, **broker-held exits** when API allows |
| **Labs** | Design, validate, version, document, export/handoff, optional **assisted** connectivity — not discretionary management |

### 0.2 Execution modes (priority order)

| Mode | Who runs the continuous loop | v1 priority |
|------|------------------------------|-------------|
| **M0** Export / manual at broker UI | User | **P0 — default teach path** |
| **M1** Entry + **Tradier** working exits (OCO/OTO/OTOCO where supported) | Broker for protect | **P0 — prefer for manage** |
| **M2** User-local / VPS worker + Deployment Pack | User infra uptime | **P1 — prefer for scan graphs** |
| **M3** Labs-hosted workers (queue + fleet) | Labs residual | **P3 — optional only**; never brand promise |

**v1 brand promise:** best-in-class **build, prove, version, hand off**.  
**Not v1 brand promise:** “set and forget on Labs servers” or five-nines strategy outcomes.

### 0.3 What this Spec owns

1. **Deployment plan / instance** model (envelope bound to strategy version)  
2. **Process runners** (scan vs manage) as portable procedures  
3. **Decision log** (when Labs is on the path; export always)  
4. **Execution ladder** (dry → paper → live) semantics  
5. **Tradier-first** adapter contracts and broker-exit preference  
6. **Arming ceremony** + attestation  
7. **Deployment Pack export**  
8. Continuity + versioning binds  
9. **M3** multi-tenant workers only as optional tier (§17)  
10. **Admin environment console** for residual Labs-assisted ops  

### 0.4 What this Spec does **not** own

| Not here | Owner |
|----------|--------|
| Place memory / focus restore | Continuity Spec |
| Semver bump policy, explore UI, restore confirm | Continuity + Versioning recommendations |
| Back test / forward walk definitions | Development Phase Spec |
| Pack schema / rank / construct | Pack Architecture |
| Broker streaming market data | Architecture/09 (Massive) |
| Habit definitions | Habit Catalog Spec |
| Final ToS legal text | Counsel |

### 0.5 Product thesis

> **Automations are process plugins under a versioned strategy life cycle — not free-floating bots.**  
> The member’s plan becomes **hand-offable** after Design gates, under a hard risk envelope, with an audit trail.  
> **Running** the plan is primarily the **user** and **Tradier**, not Labs workers.

OptionAlpha-shaped primitives re-homed:

| Industry / OA idea | FatTail name (this Spec) |
|--------------------|---------------------------|
| Bot | **Deployment instance / plan** |
| Safeguards | **Risk envelope** |
| Automation | **Process runner** |
| Scanner / monitor | **`scan`** / **`manage`** |
| Decision recipe | **Typed decision node** |
| Activity log | **Decision log** (SoR) + lifecycle log |
| Run now | **Dry-run · paper-run · live-run** ladder |

---

## 1. Continuity & versioning alignment (normative)

These rules are **non-negotiable** cross-links. Runtime must not invent a parallel identity system.

### 1.1 Continuity layers (from Continuity Spec §0.3)

```text
L1 PLACE     Where I am (phase + strategy_id) — localStorage; not product truth
L2 TRAIL     What I did — lifecycle_log + decision_log (this Spec expands L2 for runtime)
L3 VERSION   What the product was — semver + pack snapshots
L4 REPLAY    Re-walk trails (trajectory; decision_log is primary runtime fuel)
L5 RESTORE   Return pack/product to prior version — Continuity §12 + Versioning Wave A
```

| Rule | |
|------|--|
| **C-1** | Selecting a deployment instance, runner, or log row **writes place** for `deployment` phase when on the Deploy board (same place model as Continuity). |
| **C-2** | Place **never** substitutes for SoR: runner enablement, envelope, graph, and open risk live on server (identity-scoped). |
| **C-3** | Place `updated_at` is **not** a process metric (Continuity §5.4). Aging of “stale runner” uses **decision_log / lifecycle_log** timestamps. |
| **C-4** | Empty-on-unknown: no last deployment place → empty Deploy work area; **never** auto-pick another strategy’s runner. |
| **C-5** | Logout clears place; product SoR (instances, logs) remains. |

### 1.2 Versioning principles (P1–P8 applied to runtime)

| ID | Runtime implication |
|----|---------------------|
| **P1 Clarity of state** | Status strip (or Deploy panel) shows: working version, runner states, ladder mode (dry/paper/live), envelope summary, blocked reason |
| **P2 Full control** | Enable runner, promote ladder step, open/close risk: **explicit** member acts; no silent enable on promote |
| **P3 Deterministic trails** | Decision log is append-only event SoR — not AI narrative |
| **P4 Explore ≠ apply** | Exploring an **old strategy version** does **not** re-bind a live deployment instance to that config. Rebind requires explicit **attach version** / recreate instance rules (§4.3) |
| **P5 Process before P&L** | Runner health metrics: runs, stops, envelope blocks, dry-run outcomes — not win rate as hero |
| **P6 Fail loud** | Missing data, blocked gate, envelope breach, head mismatch: explicit errors; no silent skip of risk controls |
| **P7 Family B** | Instances, graphs, decision logs, positions: identity-scoped |
| **P8 Clone over branch** | Experiment with different process graphs = **clone strategy card** (or clone instance from card), not in-card git branches |

### 1.3 Version bind rules for deployment instances

| Rule | |
|------|--|
| **V-1** | A deployment instance is bound to a **specific strategy_id** and a **pinned product version** `bound_version` (semver) + optional `pack_snapshot_id` / config hash. |
| **V-2** | Default bind = **working HEAD** at instance create time. |
| **V-3** | If working HEAD moves (pack save / bump), instance enters **`config_drift`** when `runtime_config_hash ≠ head_hash` (Versioning drift recommendation). **Fail loud** in UI; Scan **must not** open new risk until member **explicitly rebinds** or freezes revise path (§7). |
| **V-4** | **Explore** of historical version is read-only for pack designer; it does **not** change `bound_version` of an instance. |
| **V-5** | **Restore** pack to prior version (Continuity restore = **minor** bump + `expected_head`) does not auto-mutate running instances. Member must rebind or spin a new instance after restore. |
| **V-6** | Material process-graph change on an instance requires intentional save + log event; if live capital attached, **change freeze** applies (§7). |

### 1.4 Life-cycle gates before runtime power

| Rule | |
|------|--|
| **G-1** | **No live-run** unless strategy is in phase `deployment` **or** product explicitly allows paper under Curate (Coach lock default: **paper allowed in Curate; live only in Deploy**). |
| **G-2** | **No live-run** unless Development path evidence exists: pack valid + back test + forward walk + Design `deployed` (Development Phase Spec) — same spirit as promote-to-Curate. |
| **G-3** | Historical Test and Live Test (Architecture/09) remain **Design/Test** capabilities; they are **not** substitutes for Deployment instance live-run. |
| **G-4** | Promote into Deploy with runners: blocked-next reasons must be legible (Versioning §3.2). |

---

## 2. Core concepts

### 2.1 Strategy card (existing)

Versionable **product**: pack config, phase, phase_state, lifecycle_log, validation evidence.

### 2.2 Deployment instance / plan (new)

**Portable execution envelope** for one strategy product under one account mode.  
May be: exported only (M0/M2), user-worker driven (M2), Tradier-assisted (M1), or Labs-hosted (M3).

```text
DeploymentInstance
  id
  identity_id
  strategy_id
  bound_version          # semver at bind
  pack_config_hash       # fail-loud drift detection
  account_mode           # paper | live
  execution_home         # export_only | user_worker | tradier_assisted | labs_hosted
  tradier_account_ref    # opaque; member-owned credentials; never stream keys in UI
  envelope               # RiskEnvelope
  status                 # draft | armed | running | paused | halted | archived
  runners[]              # ProcessRunner
  attestation_id         # required before live ladder (§18)
  created_at, updated_at
```

**UI language:** prefer **Deployment** / **Runner** over “Bot.” Default product chrome = Deployment.

### 2.3 Risk envelope (safeguards, FatTail-shaped)

| Field | Meaning |
|-------|---------|
| `allocation_usd` | Max capital committed to this instance (or max defined risk $) |
| `max_positions_concurrent` | Hard cap |
| `max_positions_per_day` | Hard cap |
| `max_positions_per_symbol` | Hard cap (default **1** for v1 scanners) |
| `max_new_risk_when_stressed` | Optional: 0 when DD/vol policy breached (link later to size doctrine) |
| `defined_risk_only` | **true** for v1 pack runners — reject naked undefined risk opens |
| `allow_manual_open` | Manual open under same envelope + log |

Envelope checks run **before** any open action from Scan or manual. Breach → **block** + decision_log stop reason `envelope_*`.

### 2.4 Process runner (automation)

```text
ProcessRunner
  id
  instance_id
  type                   # scan | manage
  name                   # member language, e.g. "0DTE structure scan"
  enabled                bool
  schedule               # ScheduleSpec
  graph                  # ProcessGraph
  module_ref             # optional library module id + version
  last_run_at
  last_run_status        # ok | blocked | error
```

| Type | Loop subject | May open risk | May close/adjust |
|------|--------------|---------------|------------------|
| **`scan`** | Symbols / opportunities | Yes (if gates pass) | No (v1) |
| **`manage`** | Open positions of this instance | No | Yes |

**v1 law (live capital):** Before live, either:

1. **Broker-held exits** attached on open (M1 — preferred), **or**  
2. A **manage** path exists (M2 user-local manage runner, or M3 Labs manage), **or**  
3. Member attests **self-manage only** (explicit; fail loud in UI).  

Scan-only live without (1)–(3) is **blocked**.

### 2.5 Process graph

Directed graph of **nodes**:

| Node kind | Role |
|-----------|------|
| `start` | Entry |
| `loop_symbols` | Iterate configured symbol set / universe |
| `loop_positions` | Iterate instance positions |
| `decision` | Typed predicate → yes/no edges |
| `action_open` | Open structure per pack binding |
| `action_close` | Close / reduce |
| `action_notify` | Member notification (process language) |
| `action_attach_exits` | Bind ExitPolicy to new position |
| `stop` | Terminal for this loop item |

**v1 graph constraints (capacity over dependency):**

- Max depth / node count (implementation constant; fail loud if exceeded).  
- Prefer **linear scan with few decisions** over unbounded flowchart sprawl.  
- No arbitrary code execution — **typed decisions only**.

### 2.6 Typed decision nodes (not free-form “do anything”)

Decisions are **catalogued predicates** with explicit inputs:

| Domain (v1 priority) | Examples |
|----------------------|----------|
| **Schedule / session** | RTH only; after 10:00 ET; no first 5 minutes |
| **Envelope / bot state** | Concurrent &lt; max; **exactly 0 positions in current symbol** |
| **Pack / structure** | Width in band; debit/width in band; DTE band; defined risk construct available |
| **Regime (optional v1.1)** | VIX zone; EM exceedance flag — qualitative or ratified priors only |
| **Position state** | DTE remaining; exit not hit; structure still valid |
| **Market data quality** | Chain/underlier not stale (Architecture/09 fail loud) |
| **Indicators (later plugin)** | RSI etc. — **not** default teaching path; optional module |

Each decision evaluation logs: predicate id, inputs, measured values, result, data `as_of`.

**Forbidden as primary teaching path:** indicator-only “oversold → sell premium” without pack/structure gates.

### 2.7 Exit policy (per position) — broker-first

At open (or manual attach):

```text
ExitPolicy
  # Structure-agnostic (locked) — do NOT use credit-only field names.
  # Phase 1 flagship packs are debit butterflies; "fraction of credit" is undefined there.
  take_profit_frac_of_max_profit    # e.g. 0.50 — fraction of theoretical max profit if held to ideal exit
  stop_multiple_of_premium_risked   # e.g. 2.0 — stop when loss ≥ N × premium risked at open (optional)
  exit_dte                          # days before expiry (may require manage loop if broker cannot hold)
  manage_decisions[]                # optional manage graph (M2/M3)
  broker_advanced                   # oto | oco | otoco | none — Tradier advanced order when supported
  source                            # scan_default | manual | pack_default
```

| Field | Definition (normative) |
|-------|------------------------|
| **`take_profit_frac_of_max_profit`** | Target close when **realized / mark P&amp;L** reaches `frac × max_profit`, where `max_profit` is the structure’s theoretical maximum profit at open (debit: typically wing width − net debit; credit: typically net credit received). **Not** “fraction of credit.” |
| **`stop_multiple_of_premium_risked`** | Stop / protect when **loss** reaches `N × premium_risked`. **`premium_risked`** = net **debit paid** (debit structures) or **max capital at risk beyond credit** as pack defines for credit structures — pack matrix must define the number at open. **Not** “fraction of credit.” |

**Forbidden names in schema / API / UI (v1):** `take_profit_frac_of_credit`, `stop_frac_of_credit`, or any field that assumes credit-side vocabulary as the universal language. Industry credit-spread shorthand must not leak into debit-first packs.

| Priority | Implementation |
|----------|----------------|
| **1 — M1** | Express protect as **Tradier working orders** (OCO / OTO / OTOCO per [Tradier advanced orders](https://docs.tradier.com/reference/advanced-orders)) when the structure allows — convert structure-agnostic ExitPolicy into broker order prices at open |
| **2 — M2** | User-local manage runner if broker cannot hold the full policy |
| **3 — M3** | Labs-hosted manage only as optional residual |

**Law:** Critical protection for live capital **should not depend solely on Labs uptime**. Prefer broker-held exits at open. Document per-pack matrix after paper spike (which structures support which advanced types).

Manage runner (when used) honors ExitPolicy **and** graph decisions (OR unless pack says AND).

### 2.8 Decision log (SoR)

Append-only events, Family B:

```text
DecisionLogEvent
  id, identity_id, instance_id, runner_id | null
  strategy_id, bound_version, pack_config_hash
  ts_utc
  trigger                # schedule | manual_run | manual_open | manual_close | system
  kind                   # decision | action | stop | error | envelope_block
  summary                # process language, no profit theater
  detail_json            # structured: node_id, predicate, values, order_ids, …
  ladder_mode            # dry | paper | live
```

| Rule | |
|------|--|
| **L-1** | Manual opens/closes under the instance **must** log (same as automated). |
| **L-2** | Dry-run logs decisions with `action_suppressed: true`. |
| **L-3** | Log is exportable (Portability / Practice export extension). |
| **L-4** | Log fuels Continuity **L2 trail** and future **L4 replay** — never auto-apply on replay. |
| **L-5** | Process metrics (run counts, stop reasons) derive from log SoR, **not** place memory. |

---

## 3. Execution ladder

| Mode | Orders | Data | Gate |
|------|--------|------|------|
| **`dry`** | None | Historical replay and/or live marks | Always allowed for armed instance |
| **`paper`** | Tradier paper/virtual only | Live/hist per Test rules | Curate or Deploy; broker paper configured |
| **`live`** | Tradier live | Live marks; stale → fail loud | Deploy phase + G-2 + envelope + unfrozen |

```text
dry  ──arm──►  paper  ──promote──►  live
 ▲                │                   │
 └──── pause / halt ◄─────────────────┘
```

| Rule | |
|------|--|
| **E-1** | Ladder step-up is **explicit** (button + confirm for live). |
| **E-2** | Step-down (live→paper, paper→dry) is explicit; open live risk must be handled (block step-down if open live positions, or force flatten path — fail loud). |
| **E-3** | `manual_run` of a runner uses **current** ladder mode. |
| **E-4** | Architecture/09: Massive (or Coach feed archive) for signals/marks; **Tradier** for orders only (first broker). |
| **E-5** | Prefer placing **Tradier advanced exits** at open when supported; do not rely on Labs uptime for primary protect. |

---

## 4. Instance lifecycle

### 4.1 Status

| Status | Meaning |
|--------|---------|
| `draft` | Envelope/runners editable; no schedule fire |
| `armed` | Ready; schedules may fire in current ladder mode |
| `running` | At least one runner enabled and not paused |
| `paused` | Member pause; no new scheduled runs |
| `halted` | System halt (error, drift, stale data, envelope emergency) — fail loud |
| `archived` | Terminal; no runs |

### 4.1.1 Working orders survive Labs status (normative UI)

**Labs instance status is not the broker.** Pause, halt, archive, or disconnecting Labs credentials **does not** cancel Tradier (or any broker) working orders, including OTO / OCO / OTOCO protects placed at open.

| Transition | UI requirement |
|------------|----------------|
| **`paused`** | Banner (or modal on confirm): “Labs will not start new runs. **Broker working orders and open positions are unchanged.** Cancel or flatten at Tradier if you intend risk off.” |
| **`halted`** | Same class of warning; plus fail-loud halt reason. Do not imply positions are flat. |
| **`archived`** | Strongest confirm: “Archiving stops Labs process for this instance. **It does not cancel working orders or close positions at the broker.**” Require explicit acknowledge if any open positions **or** known working order ids exist on the instance (from last reconcile). |
| **Disconnect Labs ↔ broker** | Same surfacing (§21.3). |

**Forbidden:** status copy that says “off,” “stopped,” or “safe” without distinguishing **Labs process** from **broker residual risk**.

### 4.2 Create instance

Preconditions:

1. Strategy exists and member owns it.  
2. Pack validates.  
3. For paper/live: Development validation evidence present (G-2) when creating **live**-capable instance; paper may be allowed earlier per G-1.  
4. Envelope fields complete (fail loud if missing).

On create: `bound_version = HEAD`, hash snapshot, lifecycle_log `deployment_instance_created`.

### 4.3 Rebind version

Explicit action: “Attach working version to this deployment.”

- Requires `expected_bound_version` or `expected_head` style precondition if concurrent edit risk (mirror Continuity restore safety).  
- Logs `deployment_rebind`.  
- If live + open positions: **block** rebind unless pack change is classified non-material **or** member flattens first (default: **block**).

### 4.4 Clone

- **Clone strategy card** (P8) for different process experiments.  
- Optional **clone instance** from same card with new envelope (paper sandbox).

---

## 5. Runner execution model

### 5.1 Schedule

```text
ScheduleSpec
  kind: interval | session_anchor | manual_only
  interval_minutes?
  session_anchors?   # e.g. rth_open+15m
  days?              # trading calendar
  timezone           # default America/New_York
```

### 5.2 Tick algorithm (normative sketch)

```text
on_tick(runner):
  if instance not armed/running → stop
  if ladder/data/envelope precheck fails → log stop; return
  evaluate graph from start
  for loop items:
    for each decision: evaluate + log
    on no path: continue
    on action: envelope check → execute or suppress (dry) → log
```

### 5.3 Symbol loop (scan)

Universe from pack/instance config (v1: explicit symbol list; later: dynamic).

**Default recommended first decision:** `positions_in_symbol == 0` (or &lt; max_per_symbol) bound to **loop symbol**.

### 5.4 Position loop (manage)

Iterate instance positions; decisions bound to **current position**; actions close/adjust only.

### 5.5 Open action

1. Pack construct for symbol under current chain mark.  
2. Envelope checks.  
3. Ladder: dry suppress / paper order / live order.  
4. Attach ExitPolicy.  
5. Log with order ids / suppress reason.

### 5.6 Manual open under instance

Allowed if `allow_manual_open`. Same envelope + ExitPolicy + log. Reinforces: **shell is process host**, automation is not the only entry path.

---

## 6. UI / continuity surfaces

### 6.1 Deploy work area

When phase focus = Deploy (Continuity place):

| Panel | Content |
|-------|---------|
| Strategy chrome | Status strip: phase · working version · explore lens · dirty (Versioning P0) |
| Deployment list | Instances for selected strategy (or empty) |
| Envelope | Editable when not live-frozen |
| Runners | Scan/manage list, enable, schedule, last status |
| Decision log | Filterable trail |
| Ladder control | dry / paper / live with blocked reasons |

### 6.2 Place writes

| Event | Place update |
|-------|----------------|
| Select strategy in Deploy | `places.deployment.strategy_id` |
| Select instance (optional work snapshot) | `work.surface = deployment_instance`, `work.instance_id` |
| Land Deploy with memory | Restore strategy; if instance id invalid, clear instance sub-focus only |

### 6.3 Explore lens

If member is **exploring** historical version of pack:

- Designer read-only for that version (existing).  
- Deployment panel shows banner: **“Exploring vX — runtime still bound to vY”** when `bound_version ≠ explore version`.  
- No silent rebind.

---

## 7. Change freeze & revise path (live capital)

When `account_mode = live` and instance has open risk **or** ladder = live:

| Edit | Rule |
|------|------|
| Envelope tighten (lower caps) | Allowed; log |
| Envelope loosen | Confirm; log |
| Graph / schedule material change | **Freeze:** require pause + confirm “revise process” → may force paper or flatten first |
| Pack HEAD drift | Halt new opens; member rebinds or parks instance |

Aligns with Versioning recommendations “change freeze on live.”

---

## 8. Process module library (v1.1 trajectory)

Reusable **modules** (scan templates, manage templates, decision packs):

- Versioned; pin by id+version on runner `module_ref`.  
- Editing library does not mutate deployed pins until rebind.  
- Export includes pins + expanded graph snapshot for portability.

v1 may ship **inline graphs only** without full library UI; Spec reserves the model.

---

## 9. Integration with Labs practice (trajectory)

| Surface | Integration |
|---------|-------------|
| **Journal** | Optional: link decision_log day to practice date; never auto-paste P&L theater |
| **Retrospective** | Period: runner stop reasons, envelope blocks, process adherence — not expectancy hero |
| **Habit Catalog** | Operator habits (size reason, stand-down) evidenced when deploy actions occur |
| **Notifications** | Process alarms: error, halt, drift, envelope block |

---

## 10. Privacy & portability

| Rule | |
|------|--|
| Family B | instances, graphs, decision_log, positions |
| Export | Strategy Lab portability pack **or** practice export extension — include decision_log + instance defs |
| Purge | Cascade with strategy delete / practice purge |
| Share | No peer share without Privacy Spec consumer (Versioning share-link rule) |

---

## 11. Non-goals (v1)

- Labs as primary always-on multi-tenant bot host (M3 brand)  
- Five-nines SLA on strategy outcomes or perfect exits  
- Full arbitrary flowchart IDE with unbounded complexity  
- Indicator-first bot marketplace  
- POP / win-rate / expectancy as primary open gate  
- Auto-restore of pack version into live instance  
- Using place memory as “last automated successfully”  
- MSC shared code; second market data subscription for SPX if Coach feed exists  
- Replacing Development BT/FW with “live bot worked today”  
- Claiming Tradier runs full Strategy Lab scan graphs  

---

## 12. Phased delivery (M0–M2 first)

| Phase | Scope | Mode | Depends on |
|-------|--------|------|------------|
| **PR0** | Spec GO; counsel track; India/Mike/Tango | — | This document |
| **PR1** | Deployment plan schema/API; envelope; decision_log; **no Labs tick loop required** | M0 | Continuity Deploy place |
| **PR2** | **Arming ceremony** + attestation storage (§18) | M0 | PR1 |
| **PR3** | **Deployment Pack export** (§19) | M0/M2 | PR1 |
| **PR4** | **Tradier** OAuth + **paper** multi-leg open; on-demand reconcile | M1 | Architecture/09 |
| **PR5** | Tradier **broker-held exits** matrix (OCO/OTO/OTOCO paper spike → product) | M1 | PR4 |
| **PR6** | Dry-run evaluator (optional in-app); typed decisions | M0 assist | PR1 |
| **PR7** | User-local worker docs/CLI consuming Deployment Pack | M2 | PR3 |
| **PR8** | Live Tradier path + freeze/drift + status strip | M1 | G-2 + counsel |
| **PR9** | Journal/Retro/Habit hooks | — | PR8 optional |
| **PR10** | **Optional M3** Labs workers + §17 + **admin console** (§20) | M3 | Explicit Coach GO |

**Vertical slice (v1):** Defined-risk pack · **arming** · Tradier **paper** multi-leg open · **broker exits where possible** · decision_log · **export pack** · Deploy place restore.  
**Not required for v1 slice:** Labs multi-tenant scheduled scan farm.

---

## 13. Acceptance criteria (program)

### 13.1 Core (all modes)

1. Cannot live-path without Design validation evidence (G-2) — fail loud.  
2. Explore historical version does not rebind instance (V-4).  
3. Restore pack does not silently change running instance (V-5).  
4. Envelope block prevents open and logs `envelope_*`.  
5. Dry-run never sends orders; logs suppressed actions.  
6. Manual open under instance appears in decision_log (when Labs path used).  
7. Place: Deploy empty-on-unknown; no cross-strategy surprise.  
8. Process metrics from decision_log SoR (when present), not place `updated_at`.  
9. Stale market data → fail loud, no live order on Labs-assisted path.  
10. Family B isolation tests for instances and logs.  

### 13.2 Offload-first (v1.1)

11. Member can complete **export Deployment Pack** without Labs-hosted runners.  
12. **Arming ceremony** + attestation required before live; stored with version hash.  
13. Product copy states who runs scan vs manage (user / Tradier / Labs assist).  
14. Prefer broker-held exits: paper spike documents supported advanced orders per pack type.  
15. Marketing / UI does **not** claim Labs guarantees strategy uptime or outcomes.  
16. M3 (if any) behind explicit flag; default path works on M0–M2.  

---

## 14. Open Coach locks

| # | Question | Default if silent |
|---|----------|-------------------|
| L1 | Product word “Bot” in chrome? | **No** — Deployment / Runner |
| L2 | Paper allowed in Curate? | **Yes** |
| L3 | Live requires Deploy phase? | **Yes** |
| L4 | Live without broker-held exits? | **Block** unless member attests “self-manage only” |
| L5 | Max graph nodes v1 | **24** |
| L6 | Indicators in v1 decision catalog? | **No** (plugin later) |
| L7 | Max per symbol default | **1** |
| L8 | First broker | **Tradier only** |
| L9 | M3 Labs-hosted in v1? | **No** unless Coach GO |
| L10 | Soft max armed instances (any mode) | **5** |

---

## 15. Document history

| Ver | Date | Note |
|-----|------|------|
| 1.0 | 2026-08-05 | OA process analysis + Continuity + Versioning + Development + Tradier/Massive |
| 1.0+scale | 2026-08-05 | §17 multi-tenant Labs workers |
| **1.1** | **2026-08-05** | **DL-214:** M0–M2 primary; M3 optional; Tradier-first; arming; export pack; broker exits; admin console; §17 scoped to M3/assist |

---

## 16. Summary for implementers

**Do:**  
- Life cycle + version bind + envelope + decision log language.  
- **Tradier paper first**; broker-held exits when possible.  
- **Export + arming** before live.  
- Continuity place vs SoR; explore ≠ rebind.  
- Fail loud; process metrics not P&L theater.  

**Don’t:**  
- Build Labs multi-tenant bot farm as v1 core.  
- Depend solely on Labs tick for live protect.  
- Free-floating bots skipping Design gates.  
- Five-nines claims on strategy outcomes.  

**M3 only:** queue + workers + fairness (§17) + admin fleet (§20).

---

## 17. Multi-tenant Labs-hosted scale (**M3 / assisted only**)

> **Scope:** Applies when `execution_home = labs_hosted` or short-lived Labs-assisted sessions.  
> **Does not** apply to pure M0/M1/M2 — those scale via **users + Tradier**, not Labs tick volume.

### 17.1 Scale assumptions (M3 / Labs-assisted only)

| Dimension | Planning target | Notes |
|-----------|-----------------|--------|
| Concurrent **members** on **Labs-hosted** ticks | Plan for **50 → 300+** only if M3 ships | Primary scale for product is **distributed** (user+Tradier) |
| Armed **instances** per member | Soft **5** / hard **10** | All modes |
| **Runners** per Labs-hosted instance | 2 typical; max ~6 | |
| Schedule cadence | Min scan **60s**; recommend ≥5m | |
| Broker (Tradier) | Per-member credentials; throttle gateway | Never N full data sockets per user |
| Market data | Shared feed fan-out | Architecture/09 |

**Design law (M3):** If Labs hosts ticks, use **queue + workers** from day one of M3 — not `for user in all_users`.  
**Design law (M0–M2):** Scale via users and Tradier; Labs API remains ordinary web scale.

### 17.2 Control plane vs data plane (normative)

```text
┌─────────────────────────────────────────────────────────────┐
│  CONTROL PLANE — Labs API (FastAPI / launchd api)             │
│  CRUD strategies, instances, runners, envelopes               │
│  Arm / pause / ladder promote, manual_run enqueue             │
│  Read decision_log, status strip                              │
│  Auth, Family B isolation, Continuity place (client)          │
│  NEVER runs multi-minute tick loops for all tenants           │
└───────────────────────────┬─────────────────────────────────┘
                            │ enqueue jobs (DB or queue)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  DATA PLANE — Strategy Runtime workers (1…N processes)        │
│  Claim due jobs → evaluate graph → envelope → orders          │
│  Append decision_log · update runner last_run                 │
│  Shared market data cache · broker adapters with throttle     │
└─────────────────────────────────────────────────────────────┘
```

| Plane | Process | Scale action |
|-------|---------|--------------|
| Control | Existing Labs API | Horizontal later if needed; usually 1–2 on MiniTwo/stage |
| Data | **`strategy-runtime` worker** (same repo) | **Scale out N workers** when tick backlog grows |

A separate **networked microservice repo** is still not required. A **separate worker role** in the same deploy unit **is required** before “hundreds of users” are real.

### 17.3 Job model (multi-tenant fair scheduling)

#### Job types

| `job_kind` | Payload | Priority |
|------------|---------|----------|
| `runner_tick` | `runner_id`, `instance_id`, `due_at`, `ladder_mode` | Normal |
| `manual_run` | same + `requested_by` | High |
| `reconcile_positions` | `instance_id` | High (broker sync) |
| `halt_instance` | `instance_id`, reason | Critical |

#### Queue table (logical; implement as MySQL or Redis later)

```text
strategy_runtime_jobs
  id, identity_id, instance_id, runner_id NULL
  job_kind, ladder_mode
  due_at, not_before
  priority           # critical > high > normal
  status             # pending | leased | done | failed | dead
  lease_owner        # worker_id
  lease_until
  attempts, max_attempts
  last_error
  created_at, completed_at
  UNIQUE idempotency_key   # e.g. runner_id + due_slot
```

| Rule | |
|------|--|
| **Q-1** | Schedulers **only enqueue**; workers **only execute**. API may enqueue `manual_run`. |
| **Q-2** | **Lease/claim** with TTL so dead workers release jobs (at-least-once). Handlers **idempotent** (same job `idempotency_key` does not re-enqueue a second tick for the same slot). **Job-level idempotency is not order-level dedupe** — see **O-1…O-5** (§21.4). |
| **Q-3** | **Fairness:** claim algorithm must not starve tenants — e.g. round-robin by `identity_id` or weighted fair queue, not pure global FIFO that lets one power user monopolize. |
| **Q-4** | **Backpressure:** if pending jobs > threshold, degrade **new** schedule density (skip/coalesce interval ticks) **with fail-loud log**, never drop manage ticks before scan ticks. |
| **Q-5** | **Manage before scan** under load: priority manage ≥ scan so open risk is watched first. |
| **Q-6** | Per-identity **max concurrent leases** (e.g. 2–4) so one member cannot occupy all workers. |
| **Q-7** | Per-identity **max armed instances** (product soft/hard cap — Coach lock; default soft 5, hard 10). |

### 17.4 Scheduler (due-tick producer)

A **scheduler** role (can be one worker with leader election, or API cron with single-leader lease):

1. Query `runners` where `enabled` and instance `armed|running` and `next_due_at <= now`.  
2. Insert `runner_tick` jobs with **idempotent due slot** (floor time to interval).  
3. Advance `next_due_at`.  

**Do not** spawn one OS thread/process per member.

Leader election: DB advisory lock or `runtime_leader` row with heartbeat — fail loud if no leader for > N seconds (ops alert).

### 17.5 Workers

```text
worker loop:
  claim batch (fair, limited)
  for job in batch:
    load instance + runner + bound config (cache by hash)
    ensure market snapshot generation_id for this tick
    execute graph
    write decision_log (batched inserts OK)
    ack job
```

| Concern | Design |
|---------|--------|
| **Horizontal scale** | Stateless workers; N replicas on same queue |
| **Vertical** | MiniTwo starts N=1; DudeTwo/stage N=1; production N grows with backlog metrics |
| **Isolation** | Crash of one worker loses only leased jobs (reclaim after TTL) |
| **Secrets** | Broker tokens per identity from secure store; never in job payload |
| **CPU** | Graph eval cheap; bottleneck is I/O (DB, broker, chain cache) |

### 17.6 Shared market data plane (critical at scale)

**Forbidden at hundreds of users:** open one full vendor WebSocket **per identity** for the same underlier.

```text
Ingest (1…few)  →  Shared cache / chain store generation
                         │
                         ├─► worker A (many tenants)
                         ├─► worker B
                         └─► API reads for UI marks
```

| Rule | |
|------|--|
| **D-1** | One **shared** live mark/chain generation (Coach feed pipe / Massive adapter) with `generation_id` + `received_at`. |
| **D-2** | Stale generation → ticks **halt** for live/paper opens (Architecture/09); log `data_stale`. |
| **D-3** | Historical dry-run uses archive; does not fight live ingest for sockets. |
| **D-4** | Per-tick workers **read** cache; they do not each subscribe. |

### 17.7 Broker / execution scale (Tradier)

| Rule | |
|------|--|
| **B-1** | Orders go through a **throttled broker gateway** (module in-process or tiny sidecar): global + per-account rate limits. |
| **B-2** | Queue order intents; workers do not stampede REST on the hour open. Each intent carries **client_order_tag** (O-1); retries reconcile first (O-3). |
| **B-3** | Paper and live use separate limit budgets. |
| **B-4** | Reconcile jobs periodic: positions vs broker; drift → halt instance. |
| **B-5** | Fail loud on 429/5xx with backoff; never silent skip of manage exits. |

### 17.8 Decision log at volume

| Rule | |
|------|--|
| **L-S1** | Append-only; partition or index `(identity_id, ts_utc)`, `(instance_id, ts_utc)`. |
| **L-S2** | Batch inserts per tick (multi-row) to cut DB round-trips. |
| **L-S3** | Retention: hot N days full detail; older compressed or summarized (member export still available for retained window). Policy Coach-set; never silent wipe without export path. |
| **L-S4** | UI pages log with cursor pagination — never full dump. |

### 17.9 Multi-tenant isolation & abuse

| Rule | |
|------|--|
| **T-1** | Every job carries `identity_id`; worker checks row ownership before mutate. |
| **T-2** | No cross-tenant cache of positions/orders (marks OK shared; **positions private**). |
| **T-3** | Product caps: armed instances, runners, min schedule interval (e.g. ≥ 60s for scan default). |
| **T-4** | Kill switch: global `LABS_STRATEGY_RUNTIME_MODE=off|dry_only|paper_only|full` fail loud. |
| **T-5** | Per-tenant pause without affecting others. |

### 17.10 Observability (ops, process not P&L)

Metrics (internal):

- Queue depth, oldest pending age, claim latency  
- Ticks/min, fail rate, envelope_block rate, data_stale halts  
- Per-worker lease count  
- Broker 429 count  
- Fairness: max/min ticks per identity in window  

Alerts: no leader; queue age > threshold; stale market data; worker crash loop.

### 17.11 Capacity math (example planning)

Assume: 200 active automation users, 2 runners each, scan every 5 min, manage every 2 min during RTH.

| Stream | Approx rate |
|--------|-------------|
| Scan ticks | 200 × 12/hour ≈ 40/min |
| Manage ticks | 200 × 30/hour ≈ 100/min |
| Total | ~140 ticks/min ≈ **2.3 ticks/s** average |

At ~100–300 ms/tick (cache hit + light graph), **one worker** can hold early production; **two workers** give headroom.  
Open (9:30–10:00 ET) may 3–5× spike → need queue + coalesce + manage priority, not “one thread per bot.”

If scan interval drops to 1 min for all: ~400+ ticks/min → multiple workers + stricter min interval / caps.

### 17.12 Phased scale delivery (extends §12)

| Phase | Scale requirement |
|-------|-------------------|
| **PR1** | Job table + enqueue from API; even dry path uses jobs (discipline) |
| **PR2** | Single runtime worker + leader lease; fair claim |
| **PR3** | Schedules via producer; manage-before-scan priority |
| **PR4–5** | Broker throttle gateway; shared mark cache; multi-worker ready (config `WORKERS=N`) |
| **PR6** | Log retention + export; ops dashboards |

**Forbidden “temporary” design:** `for user in all_users: run_all_bots()` inside API process on a timer.

### 17.13 Answer to “separate manager service?”

| Question | M0–M2 (primary) | M3 (optional Labs host) |
|----------|-----------------|-------------------------|
| Separate **worker role**? | **No** (user worker optional; no Labs tick farm) | **Yes** for scheduled Labs ticks |
| Separate microservice repo? | No | No — same Labs deploy unit |
| Scale path | Users + Tradier | More **workers** + queue fairness |

---

## 18. Arming ceremony & attestation (normative before live)

Before any path that can send **live** Tradier orders:

### 18.1 UI must show plain-language summary

- Strategy name + **bound_version** + pack_config_hash  
- Envelope caps (allocation, concurrent, per day, per symbol)  
- Runners: scan vs manage; who executes each (**user / Tradier / Labs**)  
- Exit policy: broker-held vs self-manage  
- Contingency: how to flatten at Tradier if Labs/client down  

### 18.2 Required attestations (all true)

1. I am the account owner / authorized trader on this Tradier account.  
2. Labs is software/education, not my investment adviser or discretionary manager.  
3. I understand and accept the risks of this process and version.  
4. I can flatten or cancel at Tradier without Labs.  
5. I understand scan may not run if my machine/runtime is off (if applicable).  

### 18.3 Confirm

Typed confirm (e.g. strategy name or `LIVE`) + store:

```text
AttestationRecord
  identity_id, strategy_id, instance_id
  bound_version, pack_config_hash
  checklist_ids[], confirmed_at
  client_meta (optional; minimal)
```

**Fail loud** if attestation missing on live promote.

### 18.4 Privacy / retention (named consumer)

`AttestationRecord` is a **Family B legal-evidence artifact**, not ordinary member-authored content (Trade Log / Journal).

| Rule | |
|------|--|
| **A-P1** | Named consumer of Family B isolation in [`FatTail-Labs-Member-Data-Privacy-Spec-v0.1.md`](./FatTail-Labs-Member-Data-Privacy-Spec-v0.1.md) §2.1 — **does not** silently inherit generic purge defaults. |
| **A-P2** | Retention is **counsel-set** and may be **longer** than ordinary member content purge (evidence of informed live arming). Product must not auto-wipe attestations on a casual “delete my practice data” without an explicit legal/product path. |
| **A-P3** | Member may **export** their attestations. Admin read only under Privacy individual-examination rules (or counsel/legal hold). |
| **A-P4** | Do not store the first live attestation until counsel answers retention vs purge (see Privacy **D-7**). Schema may land empty; **no production live path** without retention decision logged. |

---

## 19. Deployment Pack export (normative M0/M2)

### 19.1 Purpose

Portable artifact so the **user** (or user-local worker) can run without Labs-hosted ticks.

### 19.2 Contents (minimum)

```text
DeploymentPack v1
  exported_at
  strategy_id, strategy_name
  bound_version, pack_config_hash
  pack_snapshot (or ref)
  envelope
  runners[] (type, schedule, graph expanded)
  exit_policy_defaults
  decision_catalog_ids_used
  integrity_hash
```

### 19.3 Rules

- Export does **not** include broker secrets.  
- User-local worker validates `integrity_hash` before arm.  
- Labs may accept optional **log ship-back** from user worker (opt-in); not required for M2.  

---

## 20. Admin environment console (normative)

Separate from member Strategy Lab UI. Fits **Admin Dual Surface** (`/admin/*`).

### 20.1 When required

| Labs surface | Admin console |
|--------------|---------------|
| M0–M2 only | **Thin:** feature flags, Tradier app error rates, OAuth health |
| Any M3 or Labs-assisted paper/live enqueue | **Full fleet** required before general availability |

### 20.2 Full fleet capabilities (M3 / assist)

| Capability | Notes |
|------------|--------|
| Global mode | `off` \| `dry_only` \| `paper_only` \| `full` |
| Queue depth / oldest job age | Ops |
| Worker heartbeats | Fail loud if none |
| Halt identity or instance | Incident |
| Broker 429 / stale data counters | Process metrics |
| Audit of Labs-submitted orders | Support |

### 20.3 Family B

Default admin view: **ops metadata** only. Full decision_log / pack body only under Privacy / support policy (Mike). No casual browse of member graphs.

### 20.4 Route (suggested)

`/admin/strategy-runtime` — administrator role only.

---

## 21. Tradier adapter (first broker — normative)

### 21.1 Scope

| In v1 | Out |
|-------|-----|
| Member-authorized API access to **their** Tradier account | Labs-owned pooled trading accounts for members |
| Paper then live | Tradier market data streaming (use Massive/Coach pipe) |
| Multi-leg open for pack constructs | Assuming all advanced exit combos work without spike |
| On-demand position/order reconcile | Silent background poll storm |

### 21.2 Order of implementation

1. Paper multi-leg open for primary packs (**with O-1…O-5 order tags / dedupe from day one**)  
2. Paper advanced exits matrix (document per pack; ExitPolicy → broker prices using structure-agnostic fields)  
3. Reconcile API → UI  
4. Live with attestation + G-2  

### 21.3 Credentials

- Stored encrypted; user revocable  
- Member is principal to Tradier; Labs is application  
- Disconnecting Labs does not cancel broker working orders (document clearly — same class of surfacing as §4.1.1 pause/halt/archive)

### 21.4 Order-level dedupe (normative — all modes M0–M3)

**Problem:** Job idempotency (Q-2: `runner_id + due_slot`) prevents double-claim of a *tick*. It does **not** prevent double **broker** submission inside a tick or on UI retry:

- Order submitted → ack lost to timeout → retry → **position doubled**  
- Member double-clicks **Open** or retries after spinner → same hazard **without any queue**

| Rule | |
|------|--|
| **O-1** | Every **order intent** (open, close, replace, cancel-replace, advanced exit legs) carries a **client-side order tag** (`client_order_tag`, UUID or Labs-generated stable id) **before** the first broker call. |
| **O-2** | Persist the tag + intent + `instance_id` + `identity_id` in Labs SoR **before** or **atomically with** the first submit attempt (append-only order-intent log). |
| **O-3** | **Any retry path** (worker redelivery, UI retry, “run again,” network 5xx/timeout) **must reconcile against broker order state by tag** (or broker-native client order id if Tradier supports it) **before** resubmitting. If an open/filled/working order already exists for that tag → **do not** submit a second order; adopt the existing broker order id and log `order_dedupe_hit`. |
| **O-4** | Manual open/close and M0/M1 paths obey the **same** rules as automated runners. Double-click and spinner retry are first-class failure modes. |
| **O-5** | Fail loud if broker cannot be queried and local state is “submit unknown”: status `order_uncertain` — never silent second fire. Member sees: “Order state unknown; reconcile before retry.” |

**Mapping:** Q-2 = job claim safety. **O-1…O-5 = money safety.** Both are required before paper money paths that can submit multi-leg opens.

---

## 22. Coach locks (scale / M3)

| # | Question | Default if silent |
|---|----------|-------------------|
| S1 | Soft max armed instances per identity | **5** |
| S2 | Hard max armed instances per identity | **10** |
| S3 | Min scan interval (any Labs tick) | **60s** |
| S4 | Min manage interval (Labs tick) | **30s** |
| S5 | M3 worker count if enabled | **2** when Labs-hosted users > 50 |
| S6 | Queue backend if M3 | **MySQL jobs table** (Redis optional later) |

---

## 23. Document history

| Date | Note |
|------|------|
| 2026-08-05 | v1.1 — User + broker run first; M0–M3; attestation; export pack; thin/full admin; L4 self-manage |
| 2026-08-05 | v1.1.1 — Claude review: **ExitPolicy** structure-agnostic (`take_profit_frac_of_max_profit`, `stop_multiple_of_premium_risked`); **O-1…O-5** order-level dedupe; §4.1.1 pause/halt/archive working-order banners; §18.4 attestation Privacy consumer |

**Checksum discipline (optional):** when uploading for external review, record `shasum -a 256` of this file in the review thread so v1.0 / v1.1 touch-ups cannot be confused by line count alone.
