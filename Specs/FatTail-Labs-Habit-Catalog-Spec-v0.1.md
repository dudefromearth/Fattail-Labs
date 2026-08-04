# FatTail Labs — Habit Catalog Spec v0.1

**Status:** **SPEC FOR W0 REVIEW** — design locked (`Architecture/13-habit-catalog-design.md`). **BUILD AUTHORITY** requires Coach GO after India · Tango · Echo · Mike (and Hotel if seed craft copy).  
**Date:** 2026-08-03  
**Product:** FatTail Labs (`labs.fattail.ai`)  
**Board:** `agents/p-habit-catalog/`  
**Full plan:** `docs/Habit-Catalog-Full-Agent-Bench-Plan.md`  
**Decision log:** (pending GO)  

**Parents:** North Star & Member Ethos Spec **v1.2** · Journal Session · Journal Retrospective · Tag Manager · Journey · Hard/Toughness · Member Data Privacy · Access Control (Family B floor) · Practice Context · Practice Export  

**Does not reverse:** max 2 active habit plans; Family B isolation; process-over-P&L; distress gate (journal); Journey process meters as separate SoR.

**Naming:** Product name **Habit Catalog** (working). Alternatives (Routines / Methodology) only by Coach amend.

---

## 0. Coach intent

1. Give members a **named methodology** of first-class habits (not folklore).  
2. Keep them **present, aware, integrated** — opposite of oblivious.  
3. Close continuous improvement: **do → record → review → install → verify**.  
4. Express health on **Journey** without a second scorecard war.  
5. Ship **value-first** UX (active stack), not an 80-checkbox encyclopedia.

---

## 1. Definitions

| Term | Meaning |
|------|---------|
| **Habit definition** | Catalog node: what to practice, why, cadence, how evidenced |
| **Activation** | Member has this habit on their **active stack** (or paused/retired) |
| **Habit event** | Evidence that a habit was done / skipped / partial on a NY date |
| **Habit plan** | Existing short-horizon **replacement** commitment (max 2 active) — may link to a definition |
| **Coverage** | For a window: per activation, `not_due` \| `evidenced` \| `missing` \| `skipped` |
| **Consistency** | Multi-period pattern of coverage (floor before asserting) |
| **Habit machine** | discover → design → install → evidence → verify → strengthen |

**Tags vs Habits:** Tags = lexicon (what happened). Habits = methodology (what you do).

---

## 2. Product laws

### 2.1 Coverage law (normative — implement exactly)

For window W and each activation A of definition D with status `active`:

| Condition | Status |
|-----------|--------|
| D’s cadence has **no due occurrence** in W | **`not_due`** — **not a gap** |
| ≥1 event `status ∈ {done, partial}` for D in W matching evidence rules | **`evidenced`** |
| Due occurrence(s) and no done/partial | **`missing`** — “should be in the record” |
| Explicit skip event for due day | **`skipped`** — honest, not missing |

**Forbidden:** Inventing `missing` for habits never activated; inventing struggle so the form feels complete; treating `not_due` as failure.

**Consistency:** Call a multi-period “pattern” of missing only when the same activation is `missing` in ≥ **3** completed retrospective periods (or window-equivalent). One miss is weather.

### 2.2 Install law

- Soft max **7** active activations; product recommend **3–5**.  
- Hard max **2** active habit **plans** (existing).  
- Retro install may create plan **and** activation with `habit_definition_id`.  
- Observable signal on plans remains specificity-pressed (existing retro rules).

### 2.3 Family B floor

Activations, events, plans (member-owned) are **Family B**:

- `identity_id` isolation; session required  
- No admin raw read of events/activations  
- Export + purge with Practice pack  
- Life/toughness habits are highly personal — same floor as journal text  

### 2.4 Capacity / distress

Journal distress stop-interview **overrides** habit soft prompts (Ethos v1.2).  
Never shame streaks; process language only.

### 2.5 Journey non-fusion

Methodology strip **must not** alter process integrity grade bands unless a **separate** Coach GO amends Journey Spec.

---

## 3. Domain model

### 3.1 Tables

```sql
-- System catalog (platform data; not Family B content)
habit_definitions (
  id BIGINT PK AI,
  slug VARCHAR(128) NOT NULL UNIQUE,  -- e.g. daily.execution.size-reason
  parent_slug VARCHAR(128) NULL,
  title VARCHAR(255) NOT NULL,
  why_md TEXT NOT NULL,
  cadence ENUM('session','daily','weekly','monthly','life') NOT NULL,
  evidence_kind VARCHAR(64) NOT NULL,
  good_enough_md TEXT NOT NULL,
  improve_md TEXT NULL,
  link_journal_prompt_key VARCHAR(64) NULL,
  link_href VARCHAR(255) NULL,
  related_tag_category VARCHAR(64) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_system TINYINT(1) NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 1,
  status ENUM('active','retired') NOT NULL DEFAULT 'active',
  created_at, updated_at
)

member_habit_activations (
  id BIGINT PK AI,
  identity_id BIGINT NOT NULL,
  habit_definition_id BIGINT NOT NULL,
  status ENUM('active','paused','retired') NOT NULL DEFAULT 'active',
  source ENUM('manual','retro_install','system_seed','recommendation') NOT NULL,
  activated_at TIMESTAMP NOT NULL,
  retired_at TIMESTAMP NULL,
  created_at, updated_at,
  UNIQUE (identity_id, habit_definition_id),
  KEY (identity_id, status),
  FK identity, FK habit_definition
)

member_habit_events (
  id BIGINT PK AI,
  identity_id BIGINT NOT NULL,
  habit_definition_id BIGINT NOT NULL,
  occurred_on DATE NOT NULL,  -- America/New_York calendar day
  source ENUM('journal','trade_log','retro','toughness','manual','system') NOT NULL,
  source_ref VARCHAR(64) NULL,
  status ENUM('done','skipped','partial') NOT NULL DEFAULT 'done',
  meta_json JSON NULL,
  created_at,
  UNIQUE (identity_id, habit_definition_id, occurred_on, source, status)
    -- adjust if multi-status same day needed; v1: one done per source/day
  KEY (identity_id, occurred_on),
  FK identity, FK habit_definition
)

-- Amend existing
ALTER member_habit_plans
  ADD habit_definition_id BIGINT NULL FK → habit_definitions;
```

### 3.2 Evidence kinds (v1)

| Kind | Due when | Done when (v1) |
|------|----------|----------------|
| `journal_phase_analysis` | Trading weekday (or any day with journal open intent — Spec: **each NY day with active activation**) | Member message in pre_open / analysis phase that day |
| `journal_phase_execution` | Same | Member message intraday or size/process note that day |
| `journal_phase_reflection` | Same | Member message post_close / reflection that day |
| `journal_manual` | Same | Explicit event `source=manual` |
| `trade_adherence` | Day with ≥1 trade | Trade has adherence ≠ unknown (proxy; document) |
| `retro_complete` | Cadence weekly in retro scope | Completed retro overlapping window |
| `habit_plan_keep` | Plan active | Self-assessment kept or partial this period |
| `toughness_day` | Hard enrolled day | Hard daily completed |
| `system_proxy` | Documented only | Prefer under-count; label as proxy in API |

**v1 due rule (simple, fail loud):** For `daily`/`session` cadence, every America/New_York calendar day in window while activation is `active` is a due day, **except** when product later adds market-calendar filter (optional Coach lock). Under-count over false “done.”

### 3.3 Seed catalog (system, v1)

Stable slugs — titles/why_md Tango-reviewed in HC1:

| slug | parent | cadence | evidence_kind |
|------|--------|---------|---------------|
| `life` | null | life | — container |
| `life.capacity-gate` | life | life | journal_manual |
| `life.recovery` | life | life | toughness_day |
| `daily` | null | daily | — container |
| `daily.analysis` | daily | daily | — container |
| `daily.analysis.playbook-zone` | daily.analysis | daily | journal_phase_analysis |
| `daily.analysis.structure-map` | daily.analysis | daily | journal_phase_analysis |
| `daily.analysis.session-scenarios` | daily.analysis | daily | journal_phase_analysis |
| `daily.execution` | daily | daily | — container |
| `daily.execution.pullback-into-level` | daily.execution | daily | journal_phase_execution |
| `daily.execution.wait-for-interaction` | daily.execution | daily | journal_phase_execution |
| `daily.execution.with-trend-continuation` | daily.execution | daily | journal_phase_execution |
| `daily.execution.size-reason` | daily.execution | daily | journal_phase_execution |
| `daily.execution.take-vs-plan` | daily.execution | daily | journal_phase_execution |
| `daily.reflection` | daily | daily | — container |
| `daily.reflection.path-vs-plan` | daily.reflection | daily | journal_phase_reflection |
| `daily.reflection.open-thread` | daily.reflection | daily | journal_phase_reflection |
| `daily.reflection.tag-when-useful` | daily.reflection | daily | journal_phase_reflection |
| `weekly` | null | weekly | — container |
| `weekly.complete-retrospective` | weekly | weekly | retro_complete |
| `weekly.review-keep-rate` | weekly | weekly | habit_plan_keep |
| `monthly` | null | monthly | — container |
| `monthly.wrap-light` | monthly | monthly | journal_manual |
| `risk` | null | daily | — container |
| `risk.smart-size-policy` | risk | daily | journal_phase_execution |
| `risk.no-revenge-size` | risk | daily | journal_phase_execution |
| `risk.dd-band-awareness` | risk | weekly | journal_manual |
| `toughness` | null | life | — container |
| `toughness.hard-today` | toughness | daily | toughness_day |
| `toughness.life-envelope` | toughness | life | journal_manual |
| `learning` | null | weekly | — container |
| `learning.pathway-touch` | learning | weekly | journal_manual |

Containers (`evidence_kind` empty / not activatable): `is_container` flag or no activation allowed if `evidence_kind` is null — **only leaves with evidence_kind may activate**.

### 3.4 Starter stack (opt-in adopt)

Default offer (not forced):  
`daily.analysis.playbook-zone`, `daily.execution.size-reason`, `daily.reflection.path-vs-plan`, `weekly.complete-retrospective`, `risk.no-revenge-size`.

---

## 4. API (member)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/me/habits/catalog` | Tree of active definitions |
| GET | `/api/me/habits/active` | Activations + **this week** coverage summary |
| POST | `/api/me/habits/active` | body: `habit_definition_id` or `slug`, `source` |
| PATCH | `/api/me/habits/active/{id}` | pause \| retire |
| GET | `/api/me/habits/coverage?from=&to=` | Matrix per activation |
| POST | `/api/me/habits/events` | **v1: optional** manual; default prefer server-derived |
| GET/POST/PATCH | `/api/me/habit-plans` | existing + optional `habit_definition_id` |
| GET | `/api/me/journey` | add `methodology` object (see §6) |

**Errors:** 403 practice deny; 404 foreign id; 409 over soft max activations (if hard-enforced) or plan cap; 422 invalid slug.

**Entitlement:** Same as Practice create (observer-trial / activator+ / admin) — align with retro create rules.

---

## 5. UI

### 5.1 Routes

| Route | |
|-------|--|
| `/app/habits` | Landing: My practice this week |
| Practice suite nav | Add **Habits** between Journal and Retrospective (or after Retro — Coach: **after Journal**) |

### 5.2 Landing (required)

1. Active stack list with mini coverage  
2. Week proof line (e.g. 4/5 due evidenced)  
3. Recommended install (from last retro gap or system)  
4. Browse catalog (secondary accordion)  
5. Starter stack CTA if empty  

**Forbidden lead:** full tree only.

### 5.3 Copy

Tango: capacity, no shame streaks, no “failed habit” moralizing. Process outcomes only.

---

## 6. Cross-app

### 6.1 Journal

- Optional soft prompt: one due+missing active habit (respect RTH quiet, distress, ethos).  
- Server may write `journal_phase_*` events when member messages in phase (characterization tests).  
- Closed journal dates: no new events.

### 6.2 Retrospective

- On gather or GET workspace: include `habit_coverage` for period.  
- UI panel: evidenced / missing / not_due / skipped.  
- Install CTA → plan + activation.  
- Carry-forward keeps existing plan behavior.

### 6.3 Journey

```json
"methodology": {
  "active_count": 0,
  "coverage_week_ratio": null,
  "pending_install_slug": null,
  "habit_plan_keep_rate_fact": null,
  "href": "/app/habits"
}
```

Nulls when no activations. **Not** input to grade.

### 6.4 Toughness

- `toughness.hard-today` evidenced by Hard daily complete.  
- `link_href` to `/app/toughness/today`.

---

## 7. Export / purge

Bump Practice Export Spec: include activations + events + plans’ `habit_definition_id`.  
Purge: delete member activations/events; plans already purged with practice data.  
Definitions are platform seed — not purged.

---

## 8. Non-goals (v0.1 ship)

- Member-authored custom definitions (v2)  
- Insight plane quant (EM, expectancy)  
- Fusing methodology into integrity grade  
- Admin CRUD UI for definitions (seed via migration; admin later)  
- LLM Habit coach (ethos-ready later)  
- Manual events required (optional only)

---

## 9. Phases & gates

| Phase | Intent | Gate |
|-------|--------|------|
| **HC0** | Spec review + Coach GO | HC0-G |
| **HC1** | Schema + seed + domain + APIs | HC1-G |
| **HC2** | `/app/habits` + suite nav | HC2-G |
| **HC3** | Retro coverage + install | HC3-G |
| **HC4** | Journal evidence hooks (+ soft prompt optional) | HC4-G |
| **HC5** | Journey methodology strip | HC5-G |
| **HC6** | Export/purge + Guide + tests + CLOSE | HC6-G |

**Vertical slice (must work before polish):**  
`daily.execution.size-reason` activate → journal evidence → retro coverage shows → install/keep → Journey line.

---

## 10. Acceptance criteria (program)

1. Coverage law characterization: not_due ≠ missing; unactivated never missing.  
2. Family B isolation: identity A cannot read B’s activations/events.  
3. Max 2 active plans still enforced with catalog install.  
4. Landing is value-first (no encyclopedia-only home).  
5. Journey grade unchanged without methodology fields.  
6. Export/purge green.  
7. Distress/habit prompt: distress wins (no interview).  
8. Suite + Guide updated.

---

## 11. Open Coach locks (answer at GO)

| # | Question | Default if silent |
|---|----------|-------------------|
| L1 | Soft max activations 7 vs hard 5 | Soft 7, warn at 5 |
| L2 | Manual events in v1 | Optional API, no UI push |
| L3 | Starter stack | Opt-in one-click, not auto |
| L4 | Product name | Habit Catalog |
| L5 | First vertical | size-reason |
| L6 | Daily due = every NY day vs trading days only | Every NY day v1 (simple) |

---

## 12. Document history

| Ver | Date | Note |
|-----|------|------|
| 0.1 | 2026-08-03 | From Architecture/13 + design session + coverage/Family B precision |
