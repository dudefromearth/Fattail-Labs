# Design Architecture: Habit Catalog (Practice Methodology)

**Document type:** Design architecture (pre-Spec)  
**Status:** **DESIGN LOCKED** (Coach 2026-08-03) — not build authority; Spec next  
**Date:** 2026-08-03  
**Product:** FatTail Labs (`labs.fattail.ai`)  
**Parents:** North Star & Member Ethos Spec v1.1 · Journal Session · Journal Retrospective · Tag Manager · Journey · Hard/Toughness · Member Data Privacy · Practice Context  

**Promotion path:**  
1. ~~Coach approves this architecture~~ **done**  
2. ~~Spec v0.1~~ **written** — `Specs/FatTail-Labs-Habit-Catalog-Spec-v0.1.md` (W0 review)  
3. Multi-agent plan — `docs/Habit-Catalog-Full-Agent-Bench-Plan.md` · `agents/p-habit-catalog/`  
4. Implementation after **HC0-G** (Coach GO)  

**Working name:** Habit Catalog (member-facing). Final label (Routines / Methodology) may change in Spec.

---

## 1. Intent

### 1.1 Problem

Retrospectives and continuous improvement only work if the member has a **named methodology** of first-class habits. Without that:

- Journal is unstructured free text with no “should be there” bar  
- Retro becomes a report card or mood dump, not a repair engine  
- Journey shows process meters without showing whether **building blocks** are present  
- “Be better” cannot become a checkable install  

### 1.2 Purpose

Habit Catalog is the **methodology SoR**: nested first-class habits that compose life and trading practice. Members stay **present, aware, and integrated** with those habits (North Star), and use a **habit-building machine** to replace destructive loops.

| Concept | Role |
|---------|------|
| **Tags** | Lexicon — what happened |
| **Habit Catalog** | Methodology — what you do and maintain |
| **Habit plans** (existing) | Short-horizon **replacement** commitments from retro (max 2 active) |
| **Active stack** | Subset of catalog habits the member runs *now* |

### 1.3 Non-goals (architecture phase)

- Full quant insight plane (EM, expectancy MA, etc.) as a separate product  
- Replacing Tag Manager, Journey meters, or Toughness programs  
- Religious UI or mandatory dharma vocabulary  
- Admin inspection of Family B habit events  

---

## 2. Architectural placement

```text
NORTH STAR (enlightenment-as-practice)
    LIFE PRACTICE OS (4-truth shape · toughness · habit machine)
        HABIT CATALOG  ← methodology layer (this document)
            ├── Active stack + evidence events
            ├── Habit plans (existing, linked)
            └── Cross-app hooks
        LEXICON (Tags)
        INSTRUMENTS
            Journal · Retro · Trade Log · Reports · Toughness · Journey
```

### 2.1 App topology

| Location | Recommendation |
|----------|----------------|
| **Primary UI** | `/app/habits` under **Practice suite** nav (alongside Trade Log, Journal, Retro, Reports, Playbook) |
| **Journey** | Read-only **methodology strip** + deep link to Habits — not a second editor |
| **Apps grid** | Not a top-level card (avoid sprawl); reachable via Practice + Journey |
| **Toughness** | Linked nodes; evidence from Hard; no duplicate Hard UI inside Catalog |

### 2.2 Family B isolation

Activations, events, and plans are **member-private** (identity-scoped). Same rules as Journal/Retro: export/purge, no admin back door, agent access only under existing Journal/privacy terms.

---

## 3. Domain model

### 3.1 Core entities

```text
habit_definitions          System (and later member) catalog nodes
member_habit_activations   Membership in active/paused/retired stack
member_habit_events        Evidence that a habit was practiced (or skipped honestly)
member_habit_plans         EXISTING — replacement commitments (max 2 active)
```

### 3.2 Habit definition (catalog node)

| Field | Type | Notes |
|-------|------|--------|
| `id` | stable int/uuid | |
| `slug` | string | e.g. `daily.execution.size-reason` |
| `parent_slug` | string \| null | Tree |
| `title` | string | Member language |
| `why_md` | short markdown | One-line purpose |
| `cadence` | enum | `session` \| `daily` \| `weekly` \| `monthly` \| `life` |
| `evidence_kind` | enum | See §3.4 |
| `good_enough_md` | string | Minimum bar (capacity) |
| `improve_md` | string \| null | Optional next refinement |
| `link_journal_prompt_key` | string \| null | Soft prompt id |
| `link_href` | string \| null | e.g. `/app/toughness/today` |
| `related_tag_category` | string \| null | Optional bridge to Tags |
| `sort_order` | int | |
| `system` | bool | Seed vs member-authored (v2) |
| `version` | int | Definition versioning |

### 3.3 Activation (active stack)

| Field | Notes |
|-------|--------|
| `identity_id` | Owner |
| `habit_definition_id` | FK |
| `status` | `active` \| `paused` \| `retired` |
| `activated_at` / `source` | `manual` \| `retro_install` \| `system_seed` \| `recommendation` |
| `retired_at` | |

**Cap (design default):** soft max **7** active; recommend **3–5**. Hard cap for **replacement habit plans** remains **2** (existing Spec).

### 3.4 Evidence kinds

| `evidence_kind` | How evidenced (v1) |
|-----------------|---------------------|
| `journal_phase_analysis` | Member journal content in analysis/pre-open window |
| `journal_phase_execution` | Intraday / trade-adjacent notes or size language |
| `journal_phase_reflection` | Post-session / reflection notes |
| `journal_manual` | Explicit check-in event |
| `trade_adherence` | Trade Log adherence present that day |
| `retro_complete` | Completed retrospective in window |
| `habit_plan_keep` | Self-assessment kept/partial on linked plan |
| `toughness_day` | Hard daily / program day recorded |
| `system_proxy` | Conservative proxy (document honesty; prefer real signals over time) |

### 3.5 Habit event

| Field | Notes |
|-------|--------|
| `identity_id` | |
| `habit_definition_id` | |
| `occurred_on` | America/New_York calendar date |
| `source` | `journal` \| `trade_log` \| `retro` \| `toughness` \| `manual` \| `system` |
| `source_ref` | e.g. session id, trade id, retro id |
| `status` | `done` \| `skipped` \| `partial` (optional) |
| `meta_json` | Small, no P&L theater fields required |

**Idempotency:** one primary `done` event per (identity, habit, day, source) unless multi-session cadence requires otherwise.

### 3.6 Link to existing habit plans

```text
member_habit_plans
  + habit_definition_id NULL  -- optional link to catalog node
  -- keeps title, habit, why_process, observable_signal, status, retro_id
```

Retro “one thing” → creates/activates plan **and** may activate catalog node.

### 3.7 Relationship to Tags

| | Tags | Habits |
|---|------|--------|
| SoR | `tags` / assignments | `habit_definitions` / activations / events |
| Unit | Label on an object | Practice over time |
| Retro use | Emotion mirror, clusters | Coverage, consistency, install |
| Merge? | **No** | Optional `related_tag_category` only |

---

## 4. Tree structure (seed architecture)

```text
life/
  capacity-gate
  recovery
daily/
  analysis/
    playbook-zone-frame
    structure-map
    session-scenarios
  execution/
    pullback-into-level
    wait-for-interaction
    with-trend-continuation
    size-reason              ← recommended vertical slice
    take-vs-plan
  reflection/
    path-vs-plan-process
    open-thread
    tag-when-useful
weekly/
  complete-retrospective
  review-keep-rate
monthly/
  wrap-distributions-light
risk/
  smart-size-policy
  no-revenge-size
  dd-band-awareness
toughness/
  hard-today
  life-envelope
learning/
  pathway-touch              ← light; not school theater
```

Exact seed list and copy locked in Spec (Coach + Tango). Architecture only requires **stable slugs** and **parent nesting**.

---

## 5. Interaction architecture

### 5.1 Value-first UX principle

```text
LANDING = My practice this week
  - Active stack (few)
  - Coverage / consistency proof
  - One recommended install
  - Browse full catalog (secondary)
```

Never lead with full ontology.

### 5.2 Habit machine (continuous improvement loop)

```text
        ┌──────────────┐
        │   ACTIVE     │  daily A/E/R + risk + life
        │   STACK      │
        └──────┬───────┘
               │ evidence events
               ▼
        ┌──────────────┐
        │   JOURNAL    │  Trade Log · Toughness
        │   (+ book)   │
        └──────┬───────┘
               │ period gather
               ▼
        ┌──────────────┐
        │ RETROSPECTIVE│  coverage · consistency · cause
        └──────┬───────┘
               │ install (max 2 plans)
               ▼
        ┌──────────────┐
        │  HABIT PLAN  │──► activation in stack
        │  + catalog   │
        └──────┬───────┘
               │ keep-rate next period
               ▼
        ┌──────────────┐
        │   JOURNEY    │  methodology strip + Process Flow
        └──────────────┘
```

**Close the loop:** discover gap → design checkable replacement → install → evidence → verify → strengthen or retire.

### 5.3 Cadence roles

| Cadence | Owner surface |
|---------|----------------|
| Session / daily | Journal (+ Trade Log proxies) |
| Weekly | Retrospective |
| Monthly | Retro wrap section or light Journey prompt (v1 light) |
| Life | Toughness + life nodes; capacity over force |

### 5.4 Quiet week / nothing hard

Valid. Coverage may still report. Retro must **not** invent struggle (Ethos Truth 1 branch). Consistency metrics treat “nothing due” honestly.

### 5.5 Distress / capacity

Journal distress stop-interview (Ethos §5.2 #9) **overrides** habit prompts. Life-capacity habits may pause trading-habit nagging when Toughness pause or life gate is on (v1.1+).

---

## 6. Cross-application integration

### 6.1 Journal

| Integration | Design |
|-------------|--------|
| Soft prompts | If active habit due and no event today → at most one optional absence-style prompt (respect RTH quiet rules, agent ethos, distress) |
| Auto evidence | Server derives events from session phase / structured fields when reliable |
| Manual check-in | Optional v1 flag — default **auto + retro install**; manual if Coach wants |
| Closed dates | No new events for closed journal dates |

### 6.2 Trade Log / Reports

| Integration | Design |
|-------------|--------|
| Adherence | Map to process habits as proxy evidence |
| Size | Vertical slice: “size reason” may start as journal evidence; later Trade Log field |
| Reports | Context for risk habits; not P&L hero metrics |

### 6.3 Retrospective

| Integration | Design |
|-------------|--------|
| Coverage block | Period: active habits × evidence counts (done / missing / partial) |
| Consistency | Multi-period (floor like retro trends — e.g. ≥3–4 periods before “pattern”) |
| Install CTA | “Install habit” → plan + activation |
| Carry-forward | Existing plans + catalog-linked keep-rate |
| Nothing-here | Steady periods OK |

### 6.4 Journey

| Integration | Design |
|-------------|--------|
| Process Flow meters | **Unchanged** SoR (`journey_scores`) |
| Methodology strip | New payload: active count, week coverage %, open install, keep-rate snapshot |
| Grade band | **Must not** absorb habit coverage into integrity grade without separate Coach GO |
| Deep link | Open Habits |

### 6.5 Toughness

| Integration | Design |
|-------------|--------|
| Catalog nodes | Link to Hard today / program |
| Evidence | Hard day complete → `toughness_day` event |
| Copy | Capacity, not machismo |

### 6.6 Member AI

| Integration | Design |
|-------------|--------|
| Ethos | Already: habit machine, capacity, distress |
| Journal agent | May probe absences aligned to **active** habits only when product wires context — never dump catalog |
| Future Habits AI | `compose_member_system_prompt` |

---

## 7. API architecture (member)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/me/habits/catalog` | Definition tree |
| GET | `/api/me/habits/active` | Activations + week summary |
| POST | `/api/me/habits/active` | Install / activate |
| PATCH | `/api/me/habits/active/{id}` | Pause / retire |
| GET | `/api/me/habits/coverage?from=&to=` | Window matrix |
| POST | `/api/me/habits/events` | Manual event (if enabled) |
| GET/POST/PATCH | `/api/me/habit-plans` | Existing (+ `habit_definition_id`) |
| GET | `/api/me/journey` | Extend with `methodology` object |

**Derivation preference:** prefer server-side event creation from Journal/Retro/Toughness writes over client spam.

---

## 8. UI architecture

### 8.1 Routes

| Route | Content |
|-------|---------|
| `/app/habits` | Landing: active stack, proof, install, browse |
| `/app/habits/catalog` | Optional full tree (or in-page drawer) |
| Practice suite nav | Add **Habits** item in `practiceSuite.ts` |

### 8.2 Components (logical)

- `HabitsLanding` — value-first home  
- `ActiveStackList` — habit row + mini coverage  
- `InstallCard` — from retro recommendation  
- `CatalogTree` — nested accordion  
- `RetroCoveragePanel` — period matrix inside ceremony  
- `JourneyMethodologyStrip` — compact health  

Echo owns visual hierarchy; Charlie implements; Tango reviews shame language.

### 8.3 Empty / maiden states

- No activations: offer **starter stack** (system seed of 3–5) with one-click adopt  
- No retro yet: coverage still works on daily evidence; install from Catalog  

---

## 9. Data flow (sequence)

### 9.1 Daily

```text
Member opens Journal
  → GET active habits due today
  → Soft prompt if gap (optional)
  → Member writes
  → Server may write habit_events
```

### 9.2 Weekly retro

```text
Gather report (existing)
  → Coverage service: activations × events in scope
  → UI: coverage panel + ceremony
  → Member installs one habit
  → POST habit-plans + POST active
  → Next retro: keep-rate on plan
```

### 9.3 Journey

```text
GET /api/me/journey
  → process meters (existing)
  → methodology: { active_n, coverage_week, pending_install, keep_rate }
```

---

## 10. Security, privacy, portability

| Concern | Design |
|---------|--------|
| Isolation | All tables `identity_id`; session required |
| Privacy | Family B; no admin raw read |
| Export | New surfaces in Practice export pack (Spec bump) |
| Purge | Cascade with identity / practice purge |
| AI | Journal agent privacy §5.6 Ethos Spec; Habits AI later same rules |

---

## 11. Alignment with existing as-built

| Existing | Reuse |
|----------|--------|
| `member_habit_plans` + `/api/me/habit-plans` | Replacement engine; add optional FK to definition |
| Retro ceremony + carry-forward | Host coverage + install |
| Journal phases / agent | Evidence + soft probes |
| Tag Manager pattern | System seed vocabulary, admin later if needed |
| `journey_scores.process_meters` | Unchanged; parallel methodology strip |
| Practice suite chrome | Nav + context bar |
| North Star ethos | Stance for AI and copy |

---

## 12. Phased delivery (post-Spec GO)

| Phase | Scope | Outcome |
|-------|--------|---------|
| **HC0** | Spec v0.1 + reviews + Coach GO | Build authority |
| **HC1** | Schema, seed, catalog/active/coverage APIs | Backend spine |
| **HC2** | `/app/habits` landing + suite nav | Value-first UX |
| **HC3** | Retro coverage + install → plans | Close weekly loop |
| **HC4** | Journal soft prompts + auto evidence (minimal set) | Daily loop |
| **HC5** | Journey methodology strip | Expression |
| **HC6** | Guide, export/purge, characterization suite, close | Production honesty |

**Recommended vertical slice (first shippable loop):**  
`daily.execution.size-reason` (+ optional `weekly.complete-retrospective`) end-to-end: activate → journal evidence → retro coverage → install/keep → Journey line.

---

## 13. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Checkbox fatigue | Active stack cap; soft prompts; value-first landing |
| Shame / streak theater | No moral grades; process language; Tango gate |
| Coverage false positives | Honest `evidence_kind`; prefer under-count to false done |
| Journey double-scoring | Methodology strip **not** fused into integrity grade without GO |
| Scope explosion | Vertical slice before full seed tree polish |
| Proxy evidence lies | Label proxies; migrate to stronger signals |

---

## 14. Open decisions (Coach)

1. **Active stack hard cap?** Soft 7 vs hard 5  
2. **Manual check-in in v1?** Yes / no  
3. **Starter stack auto-on for new members?** Opt-in vs default 3  
4. **Final product name** Habit Catalog vs Routines  
5. **Vertical slice confirm:** size-reason first?  

---

## 15. Success metrics (product, not P&L)

- % members with ≥1 active habit after 7 days  
- Retro install rate when coverage gap shown  
- Keep-rate on catalog-linked plans (fact, not grade)  
- Journal evidence rate for active daily habits  
- Qualitative: members can name their active stack without opening a wiki  

---

## 16. Document control

| Version | Date | Note |
|---------|------|------|
| 0.1-design | 2026-08-03 | Initial architecture from Coach design session |

**Next:** Coach approval of this architecture → Spec v0.1 → implement per §12.  
