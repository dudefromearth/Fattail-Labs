# FatTail Labs — Workflow Manager Architecture

**Status:** Design draft for Coach review (2026-07-23)  
**Trigger questions:**  
1. What **must** happen when a course card leaves Draft?  
2. How does the **card** show whether the workflow can finish — and who gets notified when it cannot?  
3. How do the **four content types** each advance with their own requirements?  
**Parents:** Content Board · Production Package · Quebec Poller · Campaign Workflow · Admin Notifications · P2 charter  
**Type freeze:** [`docs/Content-Types-Taxonomy.md`](./Content-Types-Taxonomy.md) — **FROZEN**  
**Course skills:** [`skills/course/`](../skills/course/) — component skills + `course-create`  

---

## 0. Recommendation (up front)

**Step back one level: define a generic Workflow Manager (WFM).**  
Then register **one workflow definition per card type** (`product_line`) — each with its  
**own steps, package stages, entry gates, and Green/Red rules** — **bound 1:1 to board cards**.  
Not ad-hoc if/else inside the poller.

| Today | Target |
|---|---|
| Card status is the only “process” | Card status **mirrors** a workflow **run** |
| Package stages differ by product_line; orchestration does not | **Definition = type contract** (steps + requirements + readiness) |
| Poller opportunistically advances + stubs stages | Poller **executes runnable steps** of the card’s definition |
| “Queued” means little | **Submit draft → start workflow run** for that type (hard contract) |
| No single place to see “what’s running” | Run record + step history = evidence |
| Operators guess if work can finish | Card shows binary **Green / Red** readiness **for that type’s rules** |
| Blocks are silent until someone opens the board | **Red → in-app + email** to owner + resolvers |

**Human still owns:** final board **Approve / Reject**, and **course publish** for members.  
WFM never silent-publishes member-facing courses.

### 0.0 One engine, four type contracts

Canonical types: **Course · Tutorial · YouTube Long · Campaign**  
(full shape contracts in [`Content-Types-Taxonomy.md`](./Content-Types-Taxonomy.md)).

```text
product_line  →  WorkflowDefinition  →  steps + required package stages + hold rules
     │
     └─ card.product_line selects which definition starts on draft → queued
```

| product_line | Shape (what “done” looks like) | Definition key |
|---|---|---|
| `course` | **Header** · **Outline** (modules w/ description → lessons = video+md) · **Knowledge Check** · **Resources** | `course_create` |
| `tutorial` | **Header** + **exactly one lesson** | `tutorial_create` |
| `youtube_long` | **Header** + **one primary video** | `youtube_long_create` |
| `campaign` | **Funnel** + **Landing page** + **Mail list** | `campaign_create` |

All revolve around **video and markdown** content (campaign adds funnel/list wiring).  
**Shared board columns.** **Different plans.** Shorts / `other` are **out of v1 factory**  
(see taxonomy migration).

### 0.1 Card readiness (non-negotiable UX)

```text
Workflow is tied to the card.
The card shows GREEN or RED — nothing else for readiness.

GREEN  = the run has everything it needs to finish the task
         (or has already finished to awaiting_approval / succeeded).
RED    = something is missing, failed, blocked, or stalled —
         the system cannot complete without human (or config) intervention.
```

**Red is an action signal**, not a decoration:

1. In-app admin notification (`admin_notifications`)  
2. Email (SMTP when configured — same path as today)  
3. Recipients = **card owner** + **anyone who can address that hold**  
4. Notify on **edge** into Red (and on **new hold code** while already Red) — not every poller tick

---

## 1. Problem with the current model

```text
Create draft card → drag to Queued
  → (nothing must happen)
  → human or poller may later move columns / paste artifacts
  → Approve places draft course
```

Issues:

1. **No obligation** — Queued is a parking lot, not a start signal.  
2. **No run identity** — can’t ask “is workflow 42 running?” only “is card 7 in production?”  
3. **Poller ≠ orchestrator** — it shoves state; it doesn’t own a plan of steps with retries.  
4. **Course vs campaign vs short** — each needs different steps; hardcoding all into poller will rot.  
5. **Evidence gap** — operators can’t see “Bravo started / failed / succeeded” as first-class steps.

---

## 2. Three concepts (keep all)

| Concept | Job |
|---|---|
| **Board card** (`content_items`) | Human-visible Kanban, intent, package, flags, approval, **readiness badge** |
| **Workflow run** (`workflow_runs`) | Machine-visible execution of a **definition** against a card |
| **Readiness signal** (`green` \| `red`) | Binary projection: can this run finish, or is it on hold? |

```text
Card = what humans manage
Run  = how the system works the card
Signal = can the engine finish without a hold intervention?  GREEN / RED
```

**Rule:** At most **one active run** per card (v1). Revision may start a **new run**  
or resume the same run from a step (policy below).

**Rule:** The card always exposes the **active run’s** readiness signal (or `none` if no run).  
Kanban columns stay process stages; **Green/Red is orthogonal** — a card can be  
`in_production` and Red (blocked) or `in_production` and Green (healthy).

---

## 3. Generic Workflow Manager

### 3.1 What it is

A small, durable orchestrator:

1. **Definitions** — named plans (code or data): ordered/conditional **steps**  
2. **Runs** — instance of a definition for a card  
3. **Steps** — units of work with status, attempts, output refs  
4. **Worker** — poller/executor that claims due steps and runs handlers  
5. **Projections** — update board status/sub_stage from run state (never invent board meaning)

It is **not**: Temporal/Airflow clone, not a second CMS, not a place for member UX.

### 3.2 Definition (immutable versioned plan) — **per card type**

A definition is the **type contract**: what it takes for *this* product_line to advance  
and to reach Green completion. **Package required stages** (already in  
`packages.REQUIRED_STAGES` / Production Package Spec) are **owned by the definition**  
and must stay in lockstep with that table.

```text
WorkflowDefinition
  key                 e.g. "course_create" | "youtube_long_create"
  version             int
  product_line        single primary type  (v1: one definition ↔ one product_line)
  trigger             on_board_transition | manual | schedule
  trigger_filter      e.g. to_status == "queued"

  # --- type-specific requirements (the differentiator) ---
  entry_requirements  gates before/at run start (card fields, cast policy, …)
  package_stages      ordered required stage keys (must match REQUIRED_STAGES)
  steps[]             ordered StepSpec (produces those stages + orchestration)
  advance_rules       when a step becomes ready / what blocks advance
  readiness_rules     what makes this type Green vs Red (hold_codes)
  placement_kind      course | campaign | none | external_only

  on_complete         board → awaiting_approval (if package ok for THIS type)
  on_fail             board stays in_production; flag; readiness Red
```

**Resolution at submit:**

```text
definition = REGISTRY[card.product_line]
if no definition: fail loud or treat as "park only" (Coach policy)
run = start(definition, card)
steps = materialize(definition.steps)
readiness = evaluate(definition.readiness_rules, card, run, package)
```

Changing a card’s `product_line` after a run has started is **forbidden** while the run  
is active (or forces cancel + new definition — fail loud, never silent remap).

**StepSpec**

| Field | Meaning |
|---|---|
| `id` | Stable step key e.g. `research` |
| `kind` | `agent_task` \| `heygen_produce` \| `board_transition` \| `package_validate` \| `wait_human` \| `noop` |
| `handler` | callsign/task or function name (**type may differ**, e.g. Romeo lesson vs long-form vs short) |
| `produces_stage` | package stage artifact key (optional) |
| `requires_stages` | prior artifacts must exist (subset of this type’s package_stages) |
| `requires_fields` | card fields that must be set before this step is ready (type-specific) |
| `on_error` | `retry` \| `flag_block` \| `fail_run` |
| `max_attempts` | default 3 |
| `timeout_seconds` | optional |
| `human_gate` | if true, step only completes when admin signals |
| `orientation` | optional `landscape` \| `portrait` (shorts vs long/course video) |

### 3.3 Run state machine

```text
pending → running → succeeded
                  → failed
                  → cancelled
                  → waiting_human   (paused for approve/input)
```

**Step state machine**

```text
pending → ready → running → succeeded
                          → failed
                          → skipped
```

Only **ready** steps are executable. Ready = all previous required steps succeeded  
(and requires_stages present).

### 3.4 Data model (sketch)

```sql
workflow_definitions  -- optional if definitions stay in code v1
  key, version, body_json, created_at

workflow_runs
  id
  definition_key
  definition_version
  content_item_id     -- FK board card (1 active run per card v1)
  status              -- pending|running|succeeded|failed|cancelled|waiting_human
  readiness           -- green|red  (source of truth for card badge)
  hold_code           -- stable machine code when red (null when green)
  hold_message        -- human-readable hold reason (null when green)
  hold_since          -- when current red episode began (null when green)
  last_notified_hold_code  -- last hold_code we already notified (dedupe)
  last_notified_at
  started_at, finished_at
  started_by_kind, started_by_id, started_by_label
  error_summary
  meta_json           -- trigger edge, notes

workflow_steps
  id
  run_id
  step_key
  position
  status              -- pending|ready|running|succeeded|failed|skipped
  attempts
  last_error
  started_at, finished_at
  output_json         -- artifact ids, invocation ids
  actor_label

-- optional
workflow_events       -- append-only log (step started/finished, readiness flips)
```

**Denormalize onto card (API projection, optional columns):**

```text
content_items.workflow_run_id      -- active run FK (nullable)
content_items.workflow_readiness   -- green|red|none  (mirror for list queries)
content_items.workflow_hold_code   -- mirror for filters / Red-only board views
```

Owner for notifications (v1):

```text
content_items.created_by_identity_id  -- card owner today
-- Optional later: owner_identity_id if ownership is reassigned without rewriting history
```

Board already has transitions/artifacts — **don’t duplicate package bodies** in steps;  
reference `content_artifacts.id` / `ai_invocations.id` in `output_json`.

### 3.5 Executor (worker)

Same process family as Quebec poller (or **replace** poller’s “produce” half):

```text
loop every N seconds:
  1. Find runs in running|pending
  2. For each: mark next pending steps → ready if deps met
  3. Claim one ready step (optimistic lock)
  4. Execute handler
  5. Write artifact / transition board projection
  6. Mark step succeeded|failed; maybe complete run
  7. Project board: sub_stage, status (never published)
```

**Idempotency:** re-running a succeeded step is no-op; failed step may retry.

### 3.6 Board projection rules (critical)

| Run / step event | Board effect |
|---|---|
| Run started on draft→queued | status `queued` (already) + run linked; readiness **Green** if start-valid |
| First executable step starts | → `scheduled` then `in_production` if needed |
| Step maps to package stage | `sub_stage` follows STAGE_PROGRESSION |
| All steps done + package valid | → `awaiting_approval`; readiness **Green** |
| Step failed after max attempts | open **block** flag; stay `in_production`; readiness **Red** |
| Open block flag / missing deps | readiness **Red** (may not change column) |
| Human Approve board published | **outside WFM** (placement); run already `succeeded` at awaiting_approval **or** run ends at `waiting_human` for approve |

**v1 policy (recommended):**  
Workflow **succeeds** when package is complete and card is in `awaiting_approval`.  
**Approve → place course** remains a separate human action (as today).  
Awaiting human **approval** is **not** a Red hold — it is the intended finish line of the factory.  
Guardian blocks, missing cast, budget hard-stop, step failure, and stalled worker **are** Red.

Alternative (v1.1): final step `wait_human:approve` keeps run `waiting_human` until Approve  
(still **Green** unless other holds exist).

### 3.7 Triggers

| Trigger | Behavior |
|---|---|
| **Submit draft** | `draft → queued` **must** start (or resume) workflow for that product_line |
| Manual “Start workflow” | Admin force start if stuck |
| Poller | Only advances **existing** runs / ready steps — does not invent cards |
| Revision | `revision_requested → in_production` starts **new run** or reopens failed steps |

**This is the answer to “what MUST happen on draft submit”:**  
transition to `queued` is incomplete without `workflow_runs` row in `running|pending`  
for the **definition that matches `product_line`**.

---

## 4. Type-specific advancement (core product rule)

**Canonical shapes:** [`Content-Types-Taxonomy.md`](./Content-Types-Taxonomy.md).

### 4.0 Principle

> **Each card type has specific requirements to advance through the workflow.**  
> Course ≠ Tutorial ≠ YouTube Long ≠ Campaign.  
> Same Kanban. Different definition. Different Green checklist.  
> All produce **video and/or markdown**; campaign also wires funnel + list.

Three layers; WFM **binds them**:

| Layer | Source of truth | WFM role |
|---|---|---|
| **Shape contract** | Content Types Taxonomy | What “finished” means (header/modules/lesson/video/funnel…) |
| **Package stages** | Production Package Spec / `REQUIRED_STAGES` | Definition’s `package_stages` must match |
| **Steps + placement** | Definition registry | Handlers + `placement_kind` |

**Advance** = step ready only when **that type’s** deps are met.  
**Finish** = package + **shape validation** for that type (e.g. tutorial rejects multi-lesson trees).

### 4.1 Shape → package stages (v1 proposal)

| product_line | Shape | Required stages (summary) |
|---|---|---|
| **course** | Header + modules + lessons | research → **multi** lesson_plan → script → video → placement → vision |
| **tutorial** | Header + **one** lesson | research → **single-lesson** lesson_plan → script → video → placement → vision |
| **youtube_long** | Header + primary video | research → script → video → (placement?) → vision |
| **campaign** | Funnel + lander + mail list | campaign_brief → landing_spec → … → growth_hooks → vision |

All types: open **block** flags → cannot reach `awaiting_approval` → **Red**.

### 4.2 How the four types differ

| Concern | Course | Tutorial | YouTube Long | Campaign |
|---|---|---|---|---|
| Header | Yes | Yes | Yes | Via lander/funnel copy |
| Modules / lessons | **Many** | **Exactly one lesson** | None (not a curriculum) | None |
| Primary video | Per lessons + trailer | One lesson video | **One long-form** | Optional creative variants |
| Markdown | Lesson bodies, descriptions | Lesson body + header | Show notes / framing | Lander + brief |
| Funnel / mail list | No | No | No | **Required** |
| Placement | Multi-module draft course | Single-lesson draft course | Video / library place | Campaign + lander + hooks |
| Invalid shape | Empty modules | **>1 lesson** | Missing primary video | Missing lander or list hooks |

Operators never see a Course blocked for “missing growth_hooks,”  
or a YouTube Long blocked for “missing second module.”  
**Hold messages are type- and shape-scoped.**

### 4.3 Entry requirements by type

Common: `title` + `intent_md`; definition registered.

| product_line | Overlay |
|---|---|
| `course` | Intent should allow multi-step curriculum; cast hard at video if live |
| `tutorial` | Intent is one skill / one sitting; plan validator enforces single lesson |
| `youtube_long` | No lesson_plan step; cast at video if live |
| `campaign` | Funnel objective in intent or early brief; no course modules |

### 4.4 Green/Red is type- and shape-aware

```text
GREEN  = path clear for THIS type’s remaining steps + shape still valid
RED    = hold for THIS type (missing stage, invalid shape, cast, stall, …)
```

Examples:

- Course Red: “Course needs lesson_plan (multi-module) before script.”  
- Tutorial Red: “Tutorial package has 3 lessons; must be exactly one.”  
- YT Long Red: “YouTube Long needs primary video_package.”  
- Campaign Red: “Campaign needs growth_hooks (mail list).”  

### 4.5 UI

- Card: **type badge** (Course / Tutorial / YouTube Long / Campaign) + **Green/Red**  
- Drawer: shape reminder + **this** type’s checklist only  

---

## 5. Workflow definitions catalog (four only)

### 5.1 Course — `course_create`

```text
product_line: course
shape: HEADER · OUTLINE · KNOWLEDGE CHECK · RESOURCES
package_stages: research_pack, lesson_plan, script, video_package,
                placement_proposal, vision_alignment
placement_kind: course
skills: skills/course/  (course-blueprint first)
```

```text
seed → course-blueprint (co-pilot chat/form → structured Header + Outline)
         min bar: descriptions
         wait_human: Approve Blueprint          ← FIRST validation; freezes SoR
     → research (if needed) → knowledge checks → resources
     → script → video → placement → vision
     → submit_for_approval                      ← FINAL package gate
```

**Blueprint gate:** machine requires course description + each module description;  
human validates structure. **Approved blueprint is system of record** — chat is  
co-pilot + provenance only; factory stages do not advance by “continue chat.”  
See `skills/course/course-blueprint/SKILL.md`.

### 5.2 Tutorial — `tutorial_create`

```text
product_line: tutorial
shape: HEADER + exactly ONE lesson
package_stages: research_pack, lesson_plan (single), script, video_package,
                placement_proposal, vision_alignment
placement_kind: course   # single-lesson draft course on Labs
```

```text
seed → research → lesson_design (single-lesson plan) → script → video
     → placement_plan (one lesson graph) → vision → submit_for_approval
```

Shape validate: **exactly one** lesson (reject multi-module / multi-lesson packages).  
Shares a lot of handlers with course; **different** plan template + validators.

### 5.3 YouTube Long — `youtube_long_create`

```text
product_line: youtube_long
shape: HEADER + primary VIDEO
package_stages: research_pack, script, video_package, [placement_proposal], vision_alignment
placement_kind: video | library | external
```

```text
seed → research → long-form script → video → placement? → vision → validate
```

**No** multi-module lesson_plan. Not a Tutorial (not a Labs “lesson unit” by default).

### 5.4 Campaign — `campaign_create`

```text
product_line: campaign
shape: FUNNEL + LANDING PAGE + MAIL LIST
package_stages: campaign_brief, landing_spec, [script], [video_package],
                [distribution_plan], vision_alignment, growth_hooks
placement_kind: campaign
```

```text
seed → funnel brief → lander spec → (creative optional) → mail list hooks
     → vision → submit_for_approval
```

Human approve → place lander + campaign row + list hooks (Campaign Workflow Spec).  
**Do not** reuse `course_create` steps.

### 5.5 “MUST” on draft submit (any of the four)

| # | Must happen | Failure mode |
|---|---|---|
| 1 | `definition = REGISTRY[product_line]` for one of four types | 422 |
| 2 | Type entry_requirements + title/intent | 422 type-specific |
| 3 | Create run with correct `definition_key` | rollback transition |
| 4 | Materialize **that** type’s steps | same |
| 5 | Readiness under type rules (notify if Red) | — |
| 6 | API returns workflow + shape summary | UI |

### 5.6 What operators see

| Signal | Meaning |
|---|---|
| Type badge | Course / Tutorial / YT Long / Campaign |
| **● Green / Red** | Path clear or hold **for that shape** |
| Step list | Only this definition |
| Awaiting approval | Type package + shape OK; human Approve |

### 5.7 Relation to Quebec poller

| Today | Under WFM |
|---|---|
| `required_stages(product_line)` | Owned by definition; add **`tutorial`** |
| Produce next stage | Execute definition steps |
| No run record | Run + steps + shape validation |

**Build order:**  
1. Taxonomy freeze (this + Content-Types doc)  
2. `course` + `tutorial` (prove two Labs shapes)  
3. `youtube_long`  
4. `campaign`  

### 5.8 Adding a fifth type later

Only with Coach + taxonomy amendment: new shape, stages, definition, placement, tests.  
Do not revive shorts as silent aliases of Tutorial.

---

## 6. API sketch

| Method | Path | Behavior |
|---|---|---|
| (existing) | `POST .../transition` to `queued` | **Also** starts workflow if definition matches |
| GET | `/api/admin/board/items/{id}/workflow` | Active/latest run + steps |
| POST | `/api/admin/workflows/runs/{id}/retry` | Retry failed step |
| POST | `/api/admin/workflows/runs/{id}/cancel` | Cancel run; card policy TBD |
| GET | `/api/admin/workflows/runs` | Filter running/failed |
| Worker | `workflow_worker.py` or extend `quebec_poller.py` | Claim ready steps |

---

## 7. Failure, retry, revision

| Case | Behavior |
|---|---|
| LLM/provider error | step failed; retry up to max_attempts; then fail run + open block flag → **Red** + notify |
| Missing cast for HeyGen | video step cannot proceed → **Red** `hold_code=missing_cast`; don’t burn budget |
| Guardian block flag | do not submit_for_approval; run may `waiting_human` → **Red** |
| Stalled worker | no ready-step progress > N min → **Red** `hold_code=stalled` |
| Admin revision | cancel active run or mark superseded; new run on re-enter production |
| Admin reject | cancel run |
| Hold cleared | recompute readiness; if path clear → **Green** (no celebration spam) |

---

## 7A. Card readiness signal (Green / Red) — full design

This section is the contract for the user-facing requirement:

> A workflow is tied to a card. The card shows status of the workflow: **Green or Red**.  
> Either it has everything it needs to finish the task, or it doesn’t.  
> A **Red** signal triggers a notification and email to the **owner of the card**  
> and **anyone that can address the hold**.

### 7A.1 Binding

| Rule | Detail |
|---|---|
| One active run per card | `workflow_runs.content_item_id` unique among non-terminal runs |
| Card displays run readiness | List + drawer read `workflow_readiness` from active run (or denorm columns) |
| No run | Badge `none` / no Green-Red (draft never submitted) — not Red |
| Terminal success | **Green** (finished what the factory owes) |
| Terminal failed / cancelled | **Red** until human restarts or archives |

### 7A.2 Definition of Green vs Red

**Green** — the system can complete the remaining automated path (or has already done so):

- Active run `status ∈ {pending, running, waiting_human, succeeded}` **and**
- No open **block** severity flags on the card **and**
- No failed step past max_attempts **and**
- Current / next step’s **hard prerequisites** are present (e.g. cast when video is live-required) **and**
- Not stalled (worker progress within SLA) **and**
- Budget / provider hard-stops not engaged

`waiting_human` for **intended** gates (approval at end of package) stays **Green**.  
Optional: label chip “Needs approval” without flipping Red.

**Red** — the system **cannot** finish without intervention. Any of:

| `hold_code` (examples) | Meaning | Who can clear (resolvers) |
|---|---|---|
| `step_failed` | Step exhausted retries | Owner + all admins (retry / fix inputs) |
| `guardian_block` | Open block flag (hotel/tango/quebec/…) | Owner + admins; flag guardian informs copy |
| `missing_cast` | Video step needs cast; none assigned | Owner + admins who can set `cast_id` |
| `missing_inputs` | Required intent/inputs/vision for step | Owner (primary) + admins |
| `missing_stage` | Next **type-required** package stage absent (e.g. course `lesson_plan`) | Owner + admins |
| `wrong_type_expectation` | (should never ship) handler checked another type’s stages | Engineering — fail loud |
| `budget_exhausted` | HeyGen/AI hard budget stop | Owner + admins with budget/config access |
| `provider_error` | Upstream API hard-fail after retries | Owner + admins (ops) |
| `stalled` | No step progress > N minutes | Owner + admins (restart worker / investigate) |
| `package_incomplete` | Validate failed for **this product_line’s** required stages | Owner + admins |
| `run_failed` | Run terminal failed | Owner + admins |

**Binary only on the card face.** Hold detail lives in tooltip + drawer + notification body.  
Do **not** invent Yellow/Amber for v1 — that dilutes the action signal.

### 7A.3 Evaluation (when readiness is recomputed)

Recompute after every:

1. Step status change  
2. Board flag open/clear  
3. Card field change that steps depend on (`cast_id`, `intent_md`, …)  
4. Worker tick (stalled detection)  
5. Budget ledger hard-stop  
6. Manual admin “recheck readiness”

Algorithm sketch:

```text
function recompute_readiness(run, card, package):
  defn = REGISTRY[run.definition_key]   # type contract — never hardcode course
  holds = []
  if run.status == failed or cancelled: holds += run_failed
  if any step failed past max_attempts: holds += step_failed
  if open block flags: holds += guardian_block (+ guardian name in message)
  if next_step.requires_fields missing on card: holds += missing_inputs
  if next_step requires cast and card.cast_id is null: holds += missing_cast
  if next_step.requires_stages missing: holds += missing_stage  # type-specific stage names
  if defn.readiness_rules extra checks fail: holds += …
  if budget hard-stop for this product: holds += budget_exhausted
  if no progress and due: holds += stalled

  if holds empty:
    set readiness=green, hold_code=null, hold_message=null
  else:
    pick primary hold (severity: step_failed > guardian_block > missing_* > stalled > …)
    set readiness=red, hold_code, hold_message  # message mentions product_line + stage
    maybe_notify_red(...)
```

Primary hold is one code so notifications stay actionable (not a laundry list).  
Drawer may still list secondary holds.  
**Never** evaluate a Course run against `youtube_long` stages or vice versa.

### 7A.4 UI on the card

**Kanban card face**

```text
┌─────────────────────────────┐
│ ● Green   Course · In prod  │   ← 8–10px status dot + optional “Ready”
│ Stop the Bleeding 101       │
│ sub: script · pkg 4/7       │
└─────────────────────────────┘

┌─────────────────────────────┐
│ ● Red  missing cast         │   ← dot + short hold label
│ Stop the Bleeding 101       │
│ sub: video · blocked        │
└─────────────────────────────┘
```

- **Green:** `#16a34a` (or Echo token)  
- **Red:** `#dc2626`  
- Accessible: never color-only — include `aria-label` / text “Ready” / “Hold: {label}”  
- Filter: “Show Red only” on board (ops triage)

**Drawer**

- Readiness banner (full message)  
- Step list  
- “Who was notified” (last notify at + recipient summary)  
- Actions: Retry step · Assign cast · Clear flag · Restart run  

### 7A.5 Red → notification + email

Reuse **Admin Notifications** stack (`notify.py`, `admin_notifications`, SMTP).  
New kinds (extend Spec):

| `kind` | When |
|---|---|
| `workflow.red` | Readiness flips to Red, or primary `hold_code` changes while Red |
| `workflow.green` | Optional v1.1 — quiet; default **do not** spam on recover |

**Channels (same as existing board events):**

1. In-app row per recipient  
2. Browser local notification (existing admin shell poll)  
3. Email via SMTP when configured  

**Body must include:** card title, product_line, hold_code, hold_message, step key if any, absolute link `/admin/board?item={id}`.

### 7A.6 Recipients: owner + people who can address the hold

```text
recipients = unique_by_identity(
  card_owner
  ∪ resolvers_for(hold_code)
  ∪ always_include_admins?   -- policy below
)
```

| Role | Resolution (v1) |
|---|---|
| **Card owner** | `content_items.created_by_identity_id` if that identity still has admin access **or** always notify that email if present. If agent-created card (`created_by` null / agent), owner = **all admins** (no single human owner). |
| **Resolvers** | Function of `hold_code` (table 7A.2). v1: **all `role_override=administrator` identities** can address every hold (cast, flags, retry, budget config). That matches today’s ops model. |
| **v1.1 specialized** | e.g. `missing_cast` → admins tagged “cast”; `budget_exhausted` → ops list — only if we add resolver groups. |

**v1 policy (recommended):**

```text
notify = { card owner if human admin identity } ∪ { all administrators }
dedupe by identity_id
```

Owner is always included even if not in admin set **if** they have an email on `identities`  
(edge: non-admin creator — rare; still tell them their card is Red).  
If owner is already an admin, one notification only.

**Do not** exclude the actor who caused Red when the actor is an **agent** — humans must see it.  
If a **human** admin just opened a block flag intentionally, still notify **other** resolvers + owner;  
optional: exclude that human from email to reduce self-noise (same pattern as `notify_admins(exclude_identity_id=…)`).

### 7A.7 Deduping and rate limits

| Event | Notify? |
|---|---|
| Green → Red | **Yes** |
| Red → Red, **same** `hold_code` | **No** (already told) |
| Red → Red, **new** `hold_code` | **Yes** (new problem) |
| Red → Green | No email v1 (optional quiet log / event) |
| Same hold_code every worker tick | **No** — store `last_notified_hold_code` |
| Forced re-notify | Admin “Notify again” or after `hold_since` + 24h reminder (v1.1) |

Persist on the run:

```text
last_notified_hold_code
last_notified_at
```

### 7A.8 API surface (card-facing)

List/detail board items include:

```json
"workflow": {
  "run_id": 42,
  "definition_key": "course_create",
  "product_line": "course",
  "status": "running",
  "readiness": "red",
  "hold_code": "missing_stage",
  "hold_message": "Course workflow needs lesson_plan before script can run.",
  "hold_since": "2026-07-23 14:02:00",
  "package_stages": ["research_pack", "lesson_plan", "script", "…"],
  "next_requirement": { "kind": "stage", "key": "lesson_plan" },
  "steps_summary": { "done": 2, "total": 9, "current": "lesson_design" }
}
```

Kanban can render the dot from `workflow.readiness` alone.  
Drawer checklist = `package_stages` for **this** definition (Course shows lesson_plan;  
YouTube Long does not).

### 7A.9 Implementation hooks (when building)

| Touchpoint | Action |
|---|---|
| Start run on draft→queued | Evaluate readiness (may be Green immediately, or Red if start-invalid) |
| `workflow_worker` / poller after step | `recompute_readiness` + `maybe_notify_red` |
| `board.open_flag` / clear flag | same |
| `board.update` cast_id / inputs | same |
| `notify.py` | `notify_workflow_red(item, run, hold_*, recipients)` |
| Admin Notifications Spec | add kinds `workflow.red` (+ optional green) |
| Board UI | Green/Red badge on `BoardKanban` card + drawer banner |

### 7A.10 Characterization tests (when building)

1. Queue healthy course → run Green; no `workflow.red` rows.  
2. Fail a step past max_attempts → Red; owner + admin each get in-app (+ email if SMTP).  
3. Second tick still Red same code → **no** second notify.  
4. Clear flag / assign cast → Green; worker proceeds.  
5. Missing cast with live video policy → Red `missing_cast` before burning budget.  
6. Agent-created card with no owner → all admins notified on Red.

---

## 8. Explicit non-goals (v1)

- Full DAG UI / BPMN editor  
- Multi-card sagas (“campaign spawns 12 cards”) — v1.1  
- Auto member course publish  
- Auto social post to YT/X/IG  
- Replacing package checklist — package stages remain package truth; steps *produce* them  

---

## 9. Good / Better / Best (implementation)

### Good — “Submit starts a real run”

- `workflow_runs` + `workflow_steps`  
- On `draft→queued` for `course`: start `course_create`  
- Worker = extended poller: execute ready steps (fixtures/live as today)  
- Drawer: workflow panel (step states)  
- Still human Approve → place  

### Better — “Reliable factory”

- Retries, stalled detection, admin retry  
- Live AI mode default when keys present  
- Optional hotel/tango auto-review steps  
- **Green/Red on every card** + **Red notify/email** (owner + admins)  
- Notifications when run → awaiting_approval / failed (existing + workflow.red)

### Best — “Multi-definition factory”

- Campaign + course + short definitions  
- Child runs / linked cards  
- Metrics: time-in-step, fail rates, time-in-Red  
- Resolver groups by hold_code  
- launchd worker always on MiniTwo  

---

## 10. Decision points for Coach

| # | Question | Recommendation |
|---|---|---|
| 1 | Is **Queued** the hard start of workflow? | **Yes** — submit draft = start run |
| 2 | Can you queue without starting? | Only via product_line with no definition, or explicit “park” status later |
| 3 | Does workflow include **Approve/place**? | **No** v1 — stops at awaiting_approval (**Green**, not Red) |
| 4 | Fixtures vs live produce? | Good: fixtures; Better: auto/live |
| 5 | Poller process name? | Evolve `quebec_poller` → `workflow_worker` (same launchd slot) |
| 6 | Card readiness UI? | **Binary Green/Red only** — hold detail in tooltip/drawer |
| 7 | Who gets Red notify? | **Owner** (`created_by_identity_id`) **+ all administrators** (v1 resolvers) |
| 8 | Is “awaiting approval” Red? | **No** — intentional human gate; still Green |
| 9 | Notify on Green recovery? | **No** v1 (avoid noise) |
| 10 | Agent-created cards with no owner? | Notify **all admins** as owner-set |
| 11 | Four types only (Course, Tutorial, YT Long, Campaign)? | **Yes** — see Content-Types-Taxonomy |
| 12 | Tutorial own product_line? | **Yes** — shape validators differ from Course |
| 13 | Source of package stages? | Shared with `REQUIRED_STAGES` (no drift) |
| 14 | Build order? | course + tutorial → youtube_long → campaign |
| 15 | Change product_line mid-run? | **Forbidden** while run active |
| 16 | Deprecate shorts/other on new cards? | **Yes** for factory v1 |

---

## 11. Answer to your testing moment

**Today:** Queued is weak; types include shorts/other that blur the factory.

**Under this design (four shapes):**

| Card type | On Draft → Queued | Done shape |
|---|---|---|
| **Course** | `course_create` → multi lesson_plan → … | Header + modules + lessons draft |
| **Tutorial** | `tutorial_create` → single-lesson plan → … | Header + **one** lesson draft |
| **YouTube Long** | `youtube_long_create` → script → video | Header + primary video |
| **Campaign** | `campaign_create` → funnel → lander → list | Funnel + landing page + mail list |

Green/Red and notify apply to every type. Red copy names **that** shape’s missing piece.

---

## 12. Suggested next build slice (if types approved)

1. **Freeze** `Content-Types-Taxonomy.md` (§9 decisions)  
2. Board + package enum: four types; add `tutorial` stages  
3. Thin WFM spec + registry for all four (implement course+tutorial first)  
4. Migration workflow_runs/steps; start-on-queued  
5. Green/Red + notify  
6. Characterization per type shape  

---

## 13. Closing principle

> The board is the **control surface**.  
> The workflow manager is the **engine**.  
> **Four shapes** (Course, Tutorial, YouTube Long, Campaign) — all video/markdown-centric.  
> Packages are the **shape checklist for approval**.  
> **Green / Red** is whether **this** shape can finish.  
> **Red is a page.** Humans approve and publish reality.

---

*Awaiting Coach decisions on Content-Types-Taxonomy §9 and this doc §10 before implementation.*
