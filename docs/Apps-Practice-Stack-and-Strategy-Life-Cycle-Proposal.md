# Apps practice stack + Strategy Life Cycle — product proposal

**Date:** 2026-07-28  
**Audience:** Coach / product / engineering  
**Status:** Proposal (not yet a locked Spec)  
**Depends on:** Application Framework v1.0, Member Data Privacy v0.1, prior Strategy Life Cycle proposal (Build → Prove → Paper → Run)

---

## 1. Goals

1. Put the **Strategy Life Cycle** on the **Apps** surface (`/app`) as a first-class member tool.  
2. **Reorganize Apps** so practice tools are grouped for advanced traders—not a flat six-card soup.  
3. **Combine Trade Log + Journal** into one **Practice Log** section (two modes, one mental model).  
4. Support **courseware** (teach the life cycle) and **validation of current strategies** (use the tool on live book).  
5. Keep **simplicity of presentation**; under the covers: complete gates, Family B privacy, process-first doctrine.

**Non-goals (v1):** MSC imports; public sharing of private strategy data; profit-claim dashboards; freeform “page builder.”

---

## 2. Information architecture — Apps hub

### 2.1 Today (flat catalog)

`GET /api/apps` → flat cards ordered by `sort_order`:

| Order | Slug | Status (seed) |
|------:|------|---------------|
| 0 | journey | live |
| 1 | trade-log | live |
| 2 | journal | soon |
| 3 | playbook | soon |
| 4 | statistics | soon |
| 5 | wiki | soon |

### 2.2 Proposed hub: **sections**, not one undifferentiated grid

```text
/app  — Apps hub (sectioned)

┌─ Journey ─────────────────────────────────────────┐
│  Journey                                          │
└───────────────────────────────────────────────────┘

┌─ Practice Log ────────────────────────────────────┐  ← Trade Log + Journal combined
│  Practice Log  (modes: Trades | Days)             │
└───────────────────────────────────────────────────┘

┌─ Strategy Life Cycle ─────────────────────────────┐  ← NEW
│  Strategy Lab  (Build → Prove → Paper → Run)      │
└───────────────────────────────────────────────────┘

┌─ Playbook ────────────────────────────────────────┐
│  Playbook                                         │
└───────────────────────────────────────────────────┘

┌─ Insights ────────────────────────────────────────┐
│  Statistics · Wiki                                │
└───────────────────────────────────────────────────┘
```

**Client-facing names (recommended)**

| Section title | App / surface | Role for advanced trader |
|---------------|---------------|---------------------------|
| **Journey** | `/app/journey` | Where am I in the **curriculum**? |
| **Practice Log** | `/app/practice` | What did I **do** today? (trades + daily routine) |
| **Strategy Lab** | `/app/strategy-lab` | Which **strategies** survive Build→Run? |
| **Playbook** | `/app/playbook` | What is the **rule book** I trade from? |
| **Insights** | Statistics + Wiki | How am I doing on **process**? What does the library say? |

One sentence under the Apps hub title:

> Practice tools for the advanced FatTail trader — log the day, prove the strategy, run the campaign.

### 2.3 Data model for sections (under the covers)

Extend `apps` (migration later):

| Column | Purpose |
|--------|---------|
| `section_key` | `journey` \| `practice` \| `strategy` \| `playbook` \| `insights` |
| `section_title` | Display heading for hub grouping |
| `section_sort` | Order of sections on `/app` |
| `sort_order` | Order within section |
| `slug`, `title`, `blurb`, `status` | Unchanged |

**Hub UI rule:** render by `section_sort`, then cards within section. Empty/soon cards stay visible with badge (no layout jump).

**Redirects / aliases**

| Old URL | New |
|---------|-----|
| `/app/trade-log` | → `/app/practice?mode=trades` (301 or client redirect) |
| `/app/journal` | → `/app/practice?mode=days` |
| New | `/app/strategy-lab` (+ nested routes below) |

Keep API resources separate (`/api/me/trade-log`, `/api/me/journal`) for privacy isolation; **UI merges**, storage does not have to merge on day one.

---

## 3. Practice Log — combine Trade Log + Journal

### 3.1 Why combine

| Problem with two apps | Unified Practice Log |
|-----------------------|----------------------|
| Advanced traders split “fill” vs “day” | One place: **what happened in the practice** |
| Double navigation, double “start here” | One checklist mental model |
| Courseware (“journal the session”) unclear which app | Curriculum points to **Practice Log** |

**Doctrine (T-D5 preserved):** process-first; P&L optional/neutral, never headline.

### 3.2 Surface UX

**`/app/practice`**

```text
[ Trades ]  [ Days ]     ← segmented control (not two product names)

Trades mode  = today’s Trade Log (fills, structure, adherence, lesson)
Days mode    = calendar / daily journal (prep, selection, review, mood/process notes)
```

- Shared **date** context: picking a day filters both modes.  
- Optional link chip: “3 trades this day” on a Day entry; “Open day journal” on a trade.  
- Empty states teach the loop: *Prep (Days) → Execute (Trades) → Review (Days)*.

### 3.3 Under the covers

| Concern | Decision |
|---------|----------|
| Tables | Keep `member_trade_log_entries` + future `member_journal_entries` (Family B, per privacy) |
| API | Separate CRUD; optional `GET /api/me/practice/day?date=` aggregator for the day view |
| Entitlement | Same plan gate as Trade Log today (activator+); Journal inherits |
| Schema | Process fields first; cross-link `journal_entry_id` ↔ trade rows optional v1.1 |
| Admin | No raw read without consent (§4.2); aggregates only via privacy endpoints |

### 3.4 Courseware hooks (Practice Log)

| Course / pathway beat | In-app deep link |
|-----------------------|------------------|
| “Log three trades with adherence” | `/app/practice?mode=trades&lesson=…` |
| “Complete the daily routine log” | `/app/practice?mode=days` |
| Flagship / routine courses | Method Exemplar (read-only teaching clone) already in AF spec |

---

## 4. Strategy Lab — Strategy Life Cycle as an App

### 4.1 Positioning

| Audience | Use |
|----------|-----|
| **Advanced FatTail trader** (Navigator / coaching track) | Sub-process: develop, validate, and run a **limited book** of strategies |
| **All members (later)** | Read-only “tour” + light Build; full Lab for entitled tier |
| **Coach** | Review gates, kill decisions, campaign health (consented / aggregate) |

**Product name (recommended):** **Strategy Lab**  
**Tagline:** *Build → Prove → Paper → Run. Most ideas die. Survivors get capital.*

**Not:** “AI bot factory.” Fits capacity-over-dependency and stop-the-bleeding.

### 4.2 Routes (member)

```text
/app/strategy-lab                    Board: all strategies by stage + health
/app/strategy-lab/new                Create Spec card (Build)
/app/strategy-lab/{id}               Strategy workspace (tabs by stage)
/app/strategy-lab/{id}/prove         Prove report / metrics attach
/app/strategy-lab/{id}/paper         Paper journal + adherence
/app/strategy-lab/{id}/run           Campaign (dates, size, prune, retro)
/app/strategy-lab/validate           “Validate a current strategy” wizard (shortcut)
```

Stable **id** + renameable slug if public-ish names needed later; v1 private = id only in URL is fine (`/app/strategy-lab/42`).

### 4.3 Board UI (simple presentation)

**Default view: Kanban by stage**

```text
BUILD        PROVE         PAPER         RUN
[ cards ]    [ cards ]     [ cards ]     [ cards ]
```

Each card shows: name · version · market · **health** (New / Active / Sick / Retired) · days in stage · last gate result.

**Secondary views:** list table; filter by health; “Campaigns live now.”

**Always-visible chrome**

- Max live strategies reminder (e.g. “Book limit: 3”)  
- Kill is normal: archive with reason  

### 4.4 Strategy workspace (under the covers = full life cycle)

One strategy = one record with **versions**. Changing rules after freeze ⇒ **new version** (not silent edit).

| Tab | Client sees | Completeness underneath |
|-----|-------------|-------------------------|
| **Spec** | Plain-language idea + Spec card fields | Model: market, session, structure, entry/exit, invalidation |
| **Risk Shell** | Max loss / day, size policy | Boilerplate mandatory (David); doctrine-aligned |
| **Prove** | Checklist + attach metrics / notes | Costs on, freeze, OOS/WF note, DD/PF/trade count, baseline |
| **Paper** | Session log, adherence %, pass/fail | Duration + min signals + no param tweak rule |
| **Run** | Campaign: capital, dates, daily log, prune, retro | Curation+Campaign without over-UI |
| **History** | Version timeline + kill log | Audit for coaching |

**Validate current strategy** (`/app/strategy-lab/validate`)

Wizard for clients who already trade something:

1. Import-from-scratch Spec (or “describe what you trade today”)  
2. Jump to **Prove** with honest “do you have a costed backtest?”  
3. Force at least **Paper** window before **Run** capital increase  
4. Optionally link **Practice Log** trades to this strategy_id  

This is the “tool to validate current strategies” path—not only greenfield R&D.

### 4.5 Domain model (sketch)

Family B (member-owned, private):

```text
member_strategies
  id, identity_id, title, slug?, stage, health, book_slot?, created_at, updated_at

member_strategy_versions
  id, strategy_id, version_n, spec_json, risk_shell_json, frozen_at, created_at

member_strategy_gates
  id, strategy_id, version_id, stage, status (pass|fail|pending),
  checklist_json, metrics_json, decided_at, notes_md

member_strategy_campaigns
  id, strategy_id, version_id, start_on, end_on, size_policy_json,
  status (active|ended|pruned), capital_notes_md

member_strategy_paper_sessions  (or link practice log)
  id, strategy_id, version_id, session_on, signals_n, adherence_pct, notes_md

member_strategy_links  (optional)
  strategy_id → trade_log_entry_id | journal_entry_id | playbook_item_id
```

**Privacy:** same as Trade Log (identity-scoped CRUD; admin via privacy §4.1/§4.2 only).

**Entitlement (proposal):**

| Surface | Role |
|---------|------|
| Journey | any authenticated member (existing) |
| Practice Log | activator+ (existing Trade Log bar) |
| Strategy Lab | **navigator+** (advanced trader) *or* activator+ with coaching flag — Coach locks |
| Playbook | activator+ |
| Statistics / Wiki | per existing plans |

### 4.6 Gates as product (efficacy under the hood)

Reuse the gate card from the life-cycle proposal; each gate is a **record**, not only UI checkboxes:

```text
BUILD  → Spec + Risk Shell complete
PROVE  → Costs · Baseline · Frozen · OOS · DD OK
PAPER  → N sessions · M signals · Adherence ≥ threshold · Path OK
RUN    → Size policy · Campaign dates · Brakes · Log habit
```

**Promotion** requires pass; **kill** requires reason enum (overfit, OOS fail, non-adherence, sick, doctrine, other).

---

## 5. Full courseware support

Strategy Lab is not only software—it is the **lab for a course track**.

### 5.1 Course product shape

| Asset | Purpose |
|-------|---------|
| **Course:** “Strategy Life Cycle for the Advanced FatTail Trader” | Flagship process course (post stop-the-bleeding pathway) |
| **Category:** e.g. under Fat-Tail Doctrine or new `strategy-process` | Hub + SEO |
| **Lessons** map 1:1 to stages | Build, Prove, Paper, Run, Curation/Book, Retrospective |
| **Resources** | Spec card PDF/MD, Risk Shell, Prove report, Paper journal, Campaign brief, Gate card |
| **In-app Method Exemplars** | Read-only teaching instances (AF pattern)—not other members’ private data |
| **Pathway step** | After capital-preservation core; optional Navigator-only unlock for Lab |

### 5.2 Lesson ↔ app deep links (bidirectional)

| Lesson beat | Opens |
|-------------|--------|
| “Create your Spec card” | `/app/strategy-lab/new?from=course&lesson=…` |
| “Run a costed baseline” | `/app/strategy-lab/{id}/prove` |
| “Start paper week 1” | `/app/strategy-lab/{id}/paper` |
| “Log today’s adherence” | `/app/practice?mode=days` + optional strategy link |
| “Attach three trades to this strategy” | `/app/practice?mode=trades&strategy={id}` |
| “Open your campaign retrospective” | `/app/strategy-lab/{id}/run?tab=retro` |

**Progress integration:** lesson completion can require **gate pass** (soft: “mark complete when Spec exists”; hard later: API check `gates.BUILD=pass`).

### 5.3 Assessment without profit claims

| Evidence of learning | Metric |
|----------------------|--------|
| Specs created | count, quality rubric (coach) |
| Kills logged with reason | process maturity |
| Paper adherence % | capacity / discipline |
| Campaigns completed with retro | professional habit |
| Live book ≤ limit | risk governance |

**Never** grade on P&L. Certificate language stays process: e.g. *Strategy Process Operator* (parallel to Capital Preservation Operator).

### 5.4 Coaching workflow (Navigator)

1. Member shares **consented** strategy workspace view (or coach exam mode §4.2).  
2. Coach reviews gate packets, not raw every trade (unless consented).  
3. Kill/keep decisions coached against doctrine.  
4. Campaign retros feed next Build cycle (one high-leverage lesson).  

### 5.5 Wiki / Insights link

- Wiki pages: “Walk-forward”, “Incubation / Paper”, “Risk Shell”, “Sick strategies”.  
- **In your practice** rail (Wiki spec): member’s Strategy Lab items + Practice Log entries on that topic.  
- Statistics later: adherence streaks, paper completion rate, kills vs survivors (process dashboard).

---

## 6. How the three “advanced” tools relate

```text
                    ┌──────────────┐
                    │   Journey    │  curriculum progress
                    └──────┬───────┘
                           │ teaches process
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
   ┌───────────────┐ ┌─────────────┐ ┌──────────────┐
   │ Practice Log  │ │ Strategy Lab│ │   Playbook   │
   │ (day + trades)│ │ (life cycle)│ │ (rule book)  │
   └───────┬───────┘ └──────┬──────┘ └──────┬───────┘
           │                │               │
           └──────── link ──┴──── rules ────┘
                           │
                    ┌──────▼───────┐
                    │  Statistics  │  process metrics
                    │  + Wiki      │  doctrine map
                    └──────────────┘
```

| Tool | Answers |
|------|---------|
| Practice Log | Did I **execute the routine** today? |
| Strategy Lab | Does this **edge deserve capital**? |
| Playbook | What **setups am I allowed** to take? |
| Journey | Where am I in **learning**? |

Strategy Lab **links to** Practice Log (evidence) and Playbook (rules source); it does not replace them.

---

## 7. Phased delivery (engineering)

Aligned with p-app-framework privacy rules (Family B after isolation).

| Phase | Deliverable | Gate |
|-------|-------------|------|
| **A0** | Spec: Strategy Lab domain + Apps sections IA | Coach + India + Tango |
| **A1** | Migration: `section_*` on `apps`; hub UI sections; Practice Log shell + redirects | Delta: hub layout, redirects |
| **A2** | Journal MVP inside Practice Log (Days); Trade Log as Trades mode | Delta: dual mode, privacy |
| **A3** | Strategy Lab schema + board + Spec/Risk Shell (Build) | Delta: Family B isolation |
| **A4** | Prove + Paper tabs + gate records | Delta: freeze + no silent retune |
| **A5** | Run/Campaign + validate wizard + Practice Log links | Delta: book limit, prune |
| **A6** | Courseware: course + resources + deep links + optional completion hooks | Delta: no profit claims |
| **A7** | Coach review surfaces + wiki rail hooks | Privacy §4.1/§4.2 |

**Do not** ship Strategy Lab before privacy primitives for new Family B tables (same bar as Trade Log).

---

## 8. Specs to author (when locked)

| Spec | Content |
|------|---------|
| `FatTail-Labs-Apps-Hub-IA-Spec-v1.0` | Sections, cards, redirects, sort |
| `FatTail-Labs-Practice-Log-Spec-v1.0` | Unified UX; dual stores; day aggregator |
| `FatTail-Labs-Strategy-Lab-Spec-v1.0` | Life cycle app, gates, versions, validate path |
| `FatTail-Labs-Strategy-Life-Cycle-Curriculum-Spec-v1.0` | Course map, resources, assessment, deep links |
| Privacy amendments | New Family B resource types for strategies |

Application Framework: new **Tool entry** archetypes — Strategy, Gate, Campaign (finite, named).

---

## 9. Copy / doctrine checklist (Tango + Hotel)

- [ ] No “guaranteed edge” or profit-forward marketing on Strategy Lab  
- [ ] Win rate not the primary scoreboard  
- [ ] Kill/archive celebrated as professional hygiene  
- [ ] Paper before scale capital  
- [ ] Campaign end dates default on  
- [ ] Process outcomes in course testimonials (adherence, survivors after paper)  

---

## 10. Success criteria (product)

1. Advanced member opens **Apps** and immediately sees **Practice** vs **Strategy Lab** as distinct jobs.  
2. Trade Log + Journal feel like **one product** with two modes.  
3. A client can **validate an existing strategy** in under one coaching cycle (Spec → Prove honesty → Paper).  
4. Course lessons deep-link into the right app stage without leaving the life cycle.  
5. Private data never leaks; admin path is consented/aggregate only.  
6. Default book stays **small**; promotion to Run is gated, not emotional.

---

## 11. Recommendation summary

| Decision | Proposal |
|----------|----------|
| Apps organization | **Sectioned hub**: Journey · Practice Log · Strategy Lab · Playbook · Insights |
| Trade Log + Journal | **One app** `/app/practice` with **Trades / Days** modes; keep separate tables |
| Strategy Life Cycle | **Strategy Lab** `/app/strategy-lab` — Build → Prove → Paper → Run |
| Validate existing | First-class **Validate** wizard into the same stages |
| Courseware | Dedicated course + resources + deep links + process assessment |
| Entitlement | Strategy Lab = advanced (navigator+ or Coach-defined); Practice = activator+ |
| Presentation | Kanban board + gate checklists |
| Completeness | Versioned specs, freeze, OOS, paper gates, campaign prune/retro |

This is the “best of both worlds” life cycle **productized** for FatTail Labs clients: simple Apps IA, complete strategy process underneath, full curriculum support.

---

## 12. Suggested next action

1. Coach approve **names** (Practice Log / Strategy Lab) and **entitlement** cut.  
2. Juliet cut **A0 spec pack** + seed DAG (A1–A7).  
3. India review sectioned apps + Family B strategy schema.  
4. Echo/Tango review hub IA + process-first copy.  
5. Hotel review validation language for trading accuracy (no expectancy theater).  

Until then, this document is the working product proposal for implementation planning.
