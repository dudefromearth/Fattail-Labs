# Strategy Lab — Process Runtime Spec v1.0  
### Deployment instances · scan/manage runners · decision log · envelope · dry/paper/live ladder

**Status:** **SUPERSEDED** by [`Strategy-Lab-Process-Runtime-Spec-v1.1.md`](./Strategy-Lab-Process-Runtime-Spec-v1.1.md) (2026-08-05 · DL-214/215)  
**Historical:** SPEC AUTHORITY 2026-08-05 — hosting/scale narrative re-scoped in v1.1  

> **Do not implement from this file.** Use **v1.1** (user + broker first, Tradier, M0–M2 primary).  

**Parents / siblings (must not reverse)**

| Document | Role / lock this Spec inherits |
|----------|--------------------------------|
| [`Strategy-Lab-Architecture-Design-v1.0.md`](./Strategy-Lab-Architecture-Design-v1.0.md) | Life-cycle spine; plugins over kernel |
| [`Strategy-Lab-Development-Phase-Spec-v1.0.md`](./Strategy-Lab-Development-Phase-Spec-v1.0.md) | Design BT → FW → Deployed **before** Curate; no live as first proof |
| [`Strategy-Lab-Navigation-Continuity-Spec-v1.0.md`](./Strategy-Lab-Navigation-Continuity-Spec-v1.0.md) | Place memory ≠ product truth; action trail / version / restore layers |
| [`Strategy-Lab-Versioning-and-Process-Control-Recommendations-v1.0.md`](./Strategy-Lab-Versioning-and-Process-Control-Recommendations-v1.0.md) | P1–P8; explore ≠ restore; SoR metrics; paper-before-live; freeze on live; expected_head |
| [`Strategy-Lab-Strategy-Pack-Architecture-v1.0.md`](./Strategy-Lab-Strategy-Pack-Architecture-v1.0.md) | Packs, exit rules, risk-adjusted metrics, validate |
| [`Architecture/09-strategy-lab-tradier.md`](../Architecture/09-strategy-lab-tradier.md) | Massive data in · Tradier execution out; dual Test |
| North Star Ethos v1.2 | Process over P&L theater; capacity; fail loud |
| Habit Catalog Spec v0.1 (draft) | Operator methodology around deploy (later wire) |

**Source analysis:** OptionAlpha “bots as processes” (shell + automations + decisions + log) — **ideas adapted, not product clone**. Superiority = life cycle + versioning + defined risk + honest ladder + operator practice loop.

**Doctrine:** Capital preservation · process before profit claims · defined risk · fail loud · Family B isolation · no fantasy fills · stop-the-bleeding first  

---

## 0. Intent

### 0.1 What this Spec owns

The **runtime process layer** that runs **after** a strategy product is validated and promoted far enough to execute under control:

1. **Deployment instance** (execution envelope bound to a strategy version)  
2. **Process runners** (scheduled/manual procedures: **scan** vs **manage**)  
3. **Decision log** (deterministic trail of every evaluation and action)  
4. **Execution ladder** (dry-run → paper → live)  
5. Binding to **continuity** (place) and **versioning** (working HEAD, explore, restore)

### 0.2 What this Spec does **not** own

| Not here | Owner |
|----------|--------|
| Place memory / focus restore | Continuity Spec |
| Semver bump policy, explore UI, restore confirm | Continuity §12 + Versioning recommendations |
| Back test / forward walk definitions | Development Phase Spec |
| Pack schema / rank / construct | Pack Architecture |
| Broker streaming market data | Architecture/09 (Massive) |
| Habit definitions | Habit Catalog Spec |

### 0.3 Product thesis

> **Automations are process plugins under a versioned strategy life cycle — not free-floating bots.**  
> The member’s trading plan becomes executable only after Design gates, under a hard risk envelope, with an audit trail that can feed learning (Journal / Retro) without P&L theater.

OptionAlpha-shaped primitives (shell, automations, decision recipes, loops, log) are **re-homed**:

| Industry / OA idea | FatTail name (this Spec) |
|--------------------|---------------------------|
| Bot | **Deployment instance** |
| Safeguards | **Risk envelope** |
| Automation | **Process runner** |
| Scanner / monitor | Runner types **`scan`** / **`manage`** |
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

### 2.2 Deployment instance (new)

Execution **envelope** for one strategy product under one account mode.

```text
DeploymentInstance
  id
  identity_id
  strategy_id
  bound_version          # semver at bind
  pack_config_hash       # fail-loud drift detection
  account_mode           # paper | live
  tradier_account_ref    # opaque; never stream keys in UI
  envelope               # RiskEnvelope
  status                 # draft | armed | running | paused | halted | archived
  runners[]              # ProcessRunner
  created_at, updated_at
```

**UI language:** prefer **Deployment** / **Runner** over “Bot.” “Bot” may appear in help copy as synonym only if Coach allows; default product chrome = Deployment.

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

**v1 law:** A healthy deployment has **at least** one manage runner before live-run if any position can exist; scan-only live is blocked unless member explicitly acknowledges “entries only, no manage” (warn severity; Coach may force manage required).

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

### 2.7 Exit policy (per position)

At open (or manual attach):

```text
ExitPolicy
  take_profit_frac_of_credit   # e.g. 0.50
  stop_frac_of_credit          # e.g. 2.0 (optional)
  exit_dte                     # days before expiry
  manage_decisions[]           # optional extra manage graph refs
  source                       # scan_default | manual | pack_default
```

Manage runner honors ExitPolicy **and** graph decisions (OR of exit conditions unless pack says AND).

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
| **E-4** | Architecture/09: Massive (or Coach feed archive) for signals/marks; Tradier for orders only. |

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

- Full arbitrary flowchart IDE with unbounded complexity  
- Indicator-first bot marketplace  
- POP / win-rate / expectancy as primary open gate  
- Auto-restore of pack version into live instance  
- Using place memory as “last automated successfully”  
- MSC shared code; second market data subscription for SPX if Coach feed exists  
- Replacing Development BT/FW with “live bot worked today”  

---

## 12. Phased delivery

| Phase | Scope | Depends on |
|-------|--------|------------|
| **PR0** | Spec GO + India/Mike/Tango review | This document |
| **PR1** | Instance + envelope + decision_log schema/API; no graph fire | Continuity place for Deploy |
| **PR2** | Dry-run executor + typed decisions (envelope + zero-in-symbol + data quality) | PR1 |
| **PR3** | Scan + manage runners; schedules; manual run | PR2 |
| **PR4** | Paper ladder (Tradier paper) + ExitPolicy | Architecture/09 |
| **PR5** | Live ladder + freeze/drift + status strip fields | Development G-2 |
| **PR6** | Journal/Retro/Habit hooks + export | Habit Catalog / export specs |

**Vertical slice:** One butterfly/defined-risk pack · paper · scan (structure/envelope decisions) · manage (exit policy) · full decision log · place restore on Deploy.

---

## 13. Acceptance criteria (program)

1. Cannot live-run without Design validation evidence (G-2) — fail loud.  
2. Explore historical version does not rebind instance (V-4).  
3. Restore pack does not silently change running instance (V-5).  
4. Envelope block prevents open and logs `envelope_*`.  
5. Dry-run never sends orders; logs suppressed actions.  
6. Manual open under instance appears in decision_log.  
7. Place: Deploy empty-on-unknown; no cross-strategy surprise.  
8. Process metrics from decision_log SoR, not place `updated_at`.  
9. Stale market data → halt/fail loud, no live order.  
10. Family B isolation tests for instances and logs.  

---

## 14. Open Coach locks

| # | Question | Default if silent |
|---|----------|-------------------|
| L1 | Product word “Bot” in chrome? | **No** — Deployment / Runner |
| L2 | Paper allowed in Curate? | **Yes** |
| L3 | Live requires Deploy phase? | **Yes** |
| L4 | Manage runner required before live? | **Yes** (block) |
| L5 | Max graph nodes v1 | **24** |
| L6 | Indicators in v1 decision catalog? | **No** (plugin later) |
| L7 | Max per symbol default | **1** |

---

## 15. Document history

| Ver | Date | Note |
|-----|------|------|
| 1.0 | 2026-08-05 | From OA process analysis + Continuity v1.0 + Versioning recommendations v1.2 + Development Phase + Tradier/Massive architecture |
| 1.0+scale | 2026-08-05 | §17 multi-tenant scale (dozens→hundreds of users); job queue + worker fleet normative for scheduled/live |

---

## 16. Summary for implementers

**Do:**  
Host process under **versioned strategy life cycle**; envelope + scan/manage + decision log + dry/paper/live; bind version explicitly; fail loud on drift; respect place vs SoR.  
**At target scale:** HTTP API never owns the tick loop — **queue + workers** (§17).

**Don’t:**  
Ship a free-floating bot product that skips Design gates, confuses explore with runtime bind, or leads with P&L/indicator theater.  
**Don’t** run hundreds of member schedules inside the request path or a single blocking loop without fairness and backpressure.

---

## 17. Multi-tenant scale architecture (dozens → hundreds of users)

### 17.1 Scale assumptions (planning envelope)

| Dimension | Planning target | Notes |
|-----------|-----------------|--------|
| Concurrent **members** with ≥1 armed instance | **50 → 300+** | Full service |
| Armed **instances** per member | 1–5 typical; soft product cap recommended | Prevent accidental fan-out |
| **Runners** per instance | 2 typical (scan + manage); max ~6 | Spec capacity |
| Schedule cadence | 1–15 min common; session anchors denser at open | Avoid sub-minute default |
| Peak **ticks/min** | ~ members × runners × (60/interval) | e.g. 200 users × 2 runners × 4/hr ≈ manageable; 200 × 2 × 1/min ≈ 400 ticks/min |
| Decision log write rate | High; append-only | Must not block ticks on huge inserts without batching |
| Broker (Tradier) | Shared rate limits per account **and** platform | Per-member credentials; global throttle |
| Market data | Shared feed(s), not N full vendor sockets per user | Architecture/09 Coach pipe + fan-out |

**Design law:** Scale is a **first-class requirement**, not a later rewrite. v1 may ship a **single worker process**, but the **control plane / data plane split and job model** must already match the multi-worker future.

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
| **Q-2** | **Lease/claim** with TTL so dead workers release jobs (at-least-once). Handlers **idempotent** (same `idempotency_key` does not double-open risk). |
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
| **B-2** | Queue order intents; workers do not stampede REST on the hour open. |
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

| Question | At hundreds of users |
|----------|----------------------|
| Separate **worker role**? | **Yes — required** for scheduled/live |
| Separate **git repo / microservice mesh**? | **No — not required** for v1; same Labs deploy unit |
| Scale path | More **workers** + stronger **queue/broker/data** layers, not more HTTP APIs |

---

## 18. Coach locks (scale)

| # | Question | Default if silent |
|---|----------|-------------------|
| S1 | Soft max armed instances per identity | **5** |
| S2 | Hard max armed instances per identity | **10** |
| S3 | Min scan interval | **60s** (product may recommend ≥5m) |
| S4 | Min manage interval | **30s** |
| S5 | Default worker count production | **2** when live users > 50 |
| S6 | Queue backend v1 | **MySQL jobs table** (Redis optional later) |
