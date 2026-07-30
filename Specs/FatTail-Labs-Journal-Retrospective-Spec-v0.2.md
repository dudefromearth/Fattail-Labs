# FatTail Labs — Journal Retrospective Spec v0.2

**Status:** **Approved as R1–R3 as-built baseline** · Product shape review continues in **v0.4**  
→ [`FatTail-Labs-Journal-Retrospective-Spec-v0.4.md`](./FatTail-Labs-Journal-Retrospective-Spec-v0.4.md)  
**Implementation:** R1–R3 shipped (create, gather dual report, integrity, comparison, Journal type, workspace UI). Agent / habit plans / v0.4 UI order not built.  
**Supersedes (product shape):** v0.1 week-end ritual narrative where it conflicts — see §0  

**Routes:**
- Journal: `/app/journal` — **start** a retrospective by selecting journal type  
- Retrospective: `/app/retrospective` — list, open, and continue retrospective workspaces  
- Journey: `/app/journey` — process integrity meter; retros feed persistence / future meter  
- Reports: may surface dual P&amp;L + process report artifacts (read models)

**Family:** B (member-private) · **Entitlement:** activator+ (administrators always)  

**Parents:**
- Application Framework v1.0 (Journal Calendar variant T-D3; process-first T-D5; Family B)  
- Member-Data-Privacy v0.1 (isolation; agent access only under consented/member-owned paths)  
- Trade Log Spec v1.1 (fills, adherence, day book)  
- Journey Experience Spec v1.0 (process integrity grades; dual goals G1/G2)  
- Human Interface Spec v1.0  

**Doctrine:** Capacity over dependency. Process outcomes primary. P&amp;L appears as **neutral performance report** in the retrospective corpus — never marketing profit claims, never “guaranteed edge.” Agent **assists reflection**; member owns the habit plan.

---

## 0. What changed from v0.1

| Topic | v0.1 | **v0.2 (this Spec)** |
|-------|------|----------------------|
| How you start | Soft week-end (Fri–Sun) + tag | **In Journal:** choose **journal type = Retrospective** |
| Scope of gather | Trading **week** roll-up of journal entries | **All work since last retrospective** (or **maiden journey** if none) |
| Maiden case | Implied first week | Explicit **maiden journey** — first retrospective for the member |
| Reports produced | Process-first week analysis | **Dual report:** actual **P&amp;L performance** + **process performance** |
| Process integrity | Mentioned loosely | Explicit **Process Integrity** review (same scale language as Journey meter) |
| Prior retros | Reports long-horizon surface | **Compare current vs previous retrospectives** for progress |
| Agent job | Co-author week analysis | Flag **concerns**, help uncover **root cause(s)**, draft **habit-altering plan(s)** |

v0.1 P0 shell honesty still stands until implementation packets ship.

---

## 1. Intent

### 1.1 Product thesis

A **Retrospective** is not a random day note. It is a deliberate journal **type** that tells the system:

> Gather everything I have done in practice **since my last retrospective** (or, if this is my first, my **maiden journey**), produce a report of **how I actually performed** (P&amp;L) and **how I practiced** (process), review **Process Integrity**, compare to prior retrospectives when they exist, and — with agent assist — surface concerns, root causes, and habit-altering plans.

### 1.2 Success criteria

| ID | Criterion |
|----|-----------|
| S1 | Member starts a retrospective **from Journal** by selecting type **Retrospective**. |
| S2 | System determines scope: **since last completed retrospective** → now, or **maiden journey** if none. |
| S3 | System **gathers** in-scope work into a **corpus** (Trade Log, journal entries, live check-ins, process scores, learning progress, prior retro summaries as allowed). |
| S4 | System produces (or stages) a **dual report:** (a) **P&amp;L performance**, (b) **process performance**. |
| S5 | System includes **Process Integrity** review (aligned with Journey integrity grades language). |
| S6 | If prior retrospectives exist, system **compares** current period to prior periods for progress (process first; P&amp;L comparison neutral, never “you should be richer”). |
| S7 | Agent analysis **points out areas of concern** and helps the member **uncover root cause(s)** toward **habit-altering plan(s)** — optional path; product usable without agent for raw report + member writing. |
| S8 | Family B isolation absolute; member owns content; no public board leakage of retro bodies or P&amp;L. |
| S9 | Capacity over dependency: plans are **the member’s**; agent proposes, member accepts/edits. |

### 1.3 Non-goals (v0.2)

- Mandatory weekly cadence (may nudge; never punish or grade-shame for missing a retro).  
- Auto-publishing retros to community board or coaches (needs separate consent).  
- Replacing Trade Log Reports as the primary blotter equity UI.  
- Shipping agent stack before corpus + dual report read models exist.  
- Full Journal CRUD Spec (prompts, voice) — referenced, not redefined.  

---

## 2. Definitions

| Term | Meaning |
|------|---------|
| **Journal type** | The kind of entry the member is writing. Closed set includes daily kinds (`pre_market`, `trade_reflection`, `end_of_day`, …) and **`retrospective`**. |
| **Retrospective** | A journal entry (and durable artifact) of type `retrospective` that opens a **gather → report → reflect → plan** workspace for a defined **scope window**. |
| **Scope window** | Half-open interval `(last_retrospective_completed_at, now]` or, if none, **maiden journey** from **practice start** (identity practice epoch — see §4.2). |
| **Maiden journey** | The member’s **first** retrospective: scope from practice start → now; no prior retro comparison section (or “no baseline” honest empty state). |
| **Corpus** | All Family B + progress signals in the scope window used for analysis (see §5). |
| **P&amp;L performance report** | Neutral summary of trading results from Trade Log in scope (equity path, distribution, drawdown as available) — **process context**, not marketing. |
| **Process performance report** | Adherence, routine, learning, live, journal cadence, integrity trends in scope. |
| **Process Integrity review** | Explicit read of integrity grade/trend language (Poor→Excellent, tenure rules) for the scope vs baseline. |
| **Progress comparison** | Diff vs previous retrospective(s): process metrics primary; P&amp;L secondary and neutral. |
| **Habit-altering plan** | Member-owned (optionally agent-drafted) small set of **process changes** with checkable habits — not a profit target. |
| **Analysis agent** | Configured Labs/Vexy-path agent that only sees **this member’s** corpus under session auth; never cross-member. |

---

## 3. Start flow (Journal)

### 3.1 Entry point

1. Member is in **Journal** (`/app/journal`).  
2. Member starts a **new journal entry** and selects **type = Retrospective** (alongside other types).  
3. System creates a `retrospective` record in **draft** state and opens the **Retrospective workspace** (may deep-link to `/app/retrospective/{id}` while Journal remains the type chooser).

**Invariant:** You do **not** start a retrospective only from an empty `/app/retrospective` page without a type selection path — that page is the **library / continue** surface; **create** is Journal-first.

### 3.2 Confirmation (soft)

Before gather runs:

- Show scope: **“Since {date of last retro}”** or **“Maiden journey — since you started practice”**.  
- Member confirms **Start retrospective** (fail loud if gather fails).  

Optional later: rename scope end (custom range) — not required for v0.2 MVP.

### 3.3 States

| State | Meaning |
|-------|---------|
| `draft` | Created; gather may be in progress or pending |
| `gathering` | Corpus assembly running |
| `ready` | Dual report + integrity + comparison staged; member may write / run agent |
| `complete` | Member marks complete; becomes **last retrospective** boundary for next scope |
| `abandoned` | Soft-delete / cancel draft (does not move the “last complete” pointer) |

Only **`complete`** retrospectives define the next scope’s start.

---

## 4. Scope resolution

### 4.1 With prior complete retrospective

```
scope_start = last_complete_retrospective.completed_at
scope_end   = now (or member-confirmed “as of” timestamp)
```

Gather everything **after** `scope_start` through `scope_end`.

### 4.2 Maiden journey (no prior complete)

```
scope_start = practice_epoch
scope_end   = now
```

**practice_epoch** (first available):

1. Earliest of: first Trade Log fill, first journal entry, first live check-in, first lesson progress — else  
2. `identities.created_at`

UI copy: **“Maiden journey”** — first full look back; no prior-retro comparison (honest empty: “This becomes your baseline”).

### 4.3 Overlap / concurrent drafts

At most **one** `draft|gathering|ready` retrospective per member (fail loud on second create).  
Completed retros are immutable for scope boundaries (edits to body allowed; `completed_at` does not move).

---

## 5. Gather — corpus contents

When gather runs, the system assembles **read models** (not a second Trade Log store):

| Domain | In corpus |
|--------|-----------|
| **Trade Log** | Trades/fills in window; adherence tags; optional day-book summaries; **P&amp;L aggregates** for performance report |
| **Journal** | Non-retrospective entries in window (day notes, reflections) |
| **Live** | Check-ins in window (attendance / presence) |
| **Learning** | Lesson completions / quiz attempts in window |
| **Process integrity** | Snapshot of meter raw + graded integrity for window (or end-of-window grade + trend if history available) |
| **Prior retrospectives** | Metadata + summaries of previous **complete** retros for comparison (not full re-ingest of all history unless needed) |

**Privacy:** Corpus is private to `identity_id`. Never sent to another member. Agent path uses same isolation key.

**Honesty:** If a domain has no data, section shows empty state — do not invent P&amp;L or process scores.

---

## 6. Dual report

### 6.1 P&amp;L performance (actual results)

Purpose: ground the retrospective in **what happened in the book** — neutral, optional depth by account.

| Include (as available) | Exclude |
|------------------------|---------|
| Net P&amp;L in window, by account if multi-account | “You crushed it / failed as a trader” copy |
| Equity path / drawdown **from Trade Log Reports read models** | Profit claims suitable for marketing |
| Distribution of outcomes (win/loss **counts** only if process-framed carefully) | Ranking vs other members |

**Framing (Tango/Hotel):** P&amp;L is **context for process review**, never the headline of personal worth. UI section title: **“Book performance (results)”** not “Success score.”

### 6.2 Process performance

| Include | Source |
|---------|--------|
| Adherence mix (`followed` / `partial` / `broke` / unknown) | Trade Log |
| Routine / journal cadence | Journal + Trade Log activity days |
| Live presence | Check-ins |
| Learning rhythm | lesson_progress / quizzes |
| Process integrity grade + trend | Journey scores / meter history |
| Qualitative themes from journal text | Journal entries (member + optional agent) |

### 6.3 Process Integrity review

Dedicated section that:

1. States **current integrity grade** (Poor→Excellent / Establishing rules from Journey Experience Spec).  
2. Explains **what drove it** in this scope (meters, not moral judgment).  
3. If prior retro exists, states **direction of travel** (improved / stable / slipped) with process language.

---

## 7. Comparison to previous retrospectives

When ≥1 prior **complete** retrospective exists:

| Compare | How |
|---------|-----|
| Process integrity grade | Previous complete → current |
| Process meters / adherence rates | Side-by-side or delta |
| Habit plans from last retro | Which plans were adopted / ignored (if tracked) |
| P&amp;L aggregates | Neutral delta only; never “you should have made more” |

**Maiden journey:** skip comparison; label this retro as **baseline**.

---

## 8. Agent analysis

### 8.1 Role

The analysis agent (when enabled):

1. Reads **this member’s** staged dual report + corpus summaries (minimized raw text where possible).  
2. **Points out areas of concern** (process risks, integrity slips, broken plans, avoidance patterns).  
3. Helps the member **uncover root cause(s)** (hypotheses, not diagnoses as fact).  
4. Proposes **habit-altering plan(s)** — small, checkable, process-only.  

### 8.2 Constraints

| Rule | Spec |
|------|------|
| Capacity over dependency | Agent optional for writing; dual report remains without agent |
| No guaranteed edge | Never promises profits or “this fix will make money” |
| Root causes are hypotheses | Labeled as suggestions for member judgment |
| Isolation | Single `identity_id`; no cross-member retrieval |
| Fail loud | Missing agent config → clear error on “Run analysis,” not silent skip with fake content |
| Human gate | Member must **accept / edit / reject** plans before they become “active habits” |

### 8.3 Outputs (structured)

```json
{
  "concerns": [{ "area": "…", "evidence": "…", "severity": "low|med|high" }],
  "root_cause_hypotheses": [{ "hypothesis": "…", "supports": ["…"], "conflicts": ["…"] }],
  "habit_plans": [{
    "title": "…",
    "habit": "…",
    "why_process": "…",
    "check_in": "daily|weekly",
    "status": "proposed"
  }]
}
```

---

## 9. Data model (proposed — implement in later migrations)

> Not applied in v0.2 approval alone. Implementation packets add migrations.

### 9.1 `member_retrospectives`

| Column | Notes |
|--------|-------|
| `id` | PK |
| `identity_id` | Isolation key |
| `status` | `draft\|gathering\|ready\|complete\|abandoned` |
| `is_maiden` | True if first complete/draft for member |
| `scope_start` | DATETIME |
| `scope_end` | DATETIME |
| `completed_at` | NULL until complete |
| `title` | Optional member title |
| `body_md` | Member narrative |
| `report_json` | Dual report snapshot (P&amp;L + process + integrity) |
| `comparison_json` | Vs prior retros |
| `agent_json` | Concerns / root causes / habit plans |
| `created_at` / `updated_at` | |

### 9.2 Link from Journal

Journal entry of type `retrospective` holds `retrospective_id` FK (or retrospective **is** the journal entry with extended meta table). Prefer **one content SoR** — avoid dual narrative stores.

### 9.3 Habit plans (optional follow-on)

`member_habit_plans` tied to `retrospective_id` for Journey meter / next gather “plan adherence.”

---

## 10. API (proposed)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/me/journal/entries` | Create entry with `type=retrospective` → creates retro draft |
| POST | `/api/me/retrospectives/{id}/gather` | Run corpus gather + dual report |
| GET | `/api/me/retrospectives/{id}` | Full workspace payload |
| GET | `/api/me/retrospectives` | List (library) |
| POST | `/api/me/retrospectives/{id}/analyze` | Agent pass (optional) |
| PATCH | `/api/me/retrospectives/{id}` | Body, accept/reject plans |
| POST | `/api/me/retrospectives/{id}/complete` | Mark complete; set scope boundary |

All session-auth; activator+; fail loud on isolation miss.

---

## 11. UI surfaces

### 11.1 Journal

- Entry type picker includes **Retrospective**.  
- On select → confirm scope (maiden vs since last) → gather → open workspace.

### 11.2 Retrospective app (`/app/retrospective`)

- List of retrospectives (maiden badge, dates, integrity grade snapshot).  
- Open workspace: dual report, integrity, comparison, agent panel, member narrative, habit plans.  
- Empty: “Start a retrospective from Journal by choosing type Retrospective.”

### 11.3 Journey

- Process integrity meter remains live continuous signal.  
- On complete retro: milestone (“Retrospective completed”), optional habit plans feed future process meter / adherence.  
- Retrospective **meter** on Journey ProcessMeter becomes active when complete retros exist (cadence / count), not `soon`.

---

## 12. Dual goals mapping

| Goal | Retrospective role |
|------|-------------------|
| **G1** Observer trial | Soft: first process ritual may be late-trial; do not force week-1 retro; maiden journey after enough practice |
| **G2** Activator/Navigator | Core **measure → act → report** loop: gather → dual report → integrity → agent concerns → habit plans → next scope |

---

## 13. Implementation slices (suggested)

| Slice | Deliverable | Exit |
|-------|-------------|------|
| **R0** | Spec v0.2 (this doc) + decision log | Coach GO |
| **R1** | Schema + create from Journal type + list | CRUD draft |
| **R2** | Gather + dual report (no agent) | Evidence curl + UI |
| **R3** | Integrity + comparison | Maiden vs subsequent |
| **R4** | Agent analyze + habit plans | Optional path; fail loud |
| **R5** | Journey milestone + process meter un-soon | Delta gate |

---

## 14. Verification (when built)

1. First retro: UI says **Maiden journey**; scope from practice epoch; no false comparison.  
2. Second retro: scope starts at prior `completed_at`; comparison section populated.  
3. Dual report shows P&amp;L section only from member’s Trade Log; process section from process sources.  
4. Integrity section uses same grade vocabulary as Journey Experience Spec.  
5. Agent off: ready state still usable; Analyze fails loud if misconfigured.  
6. Another member’s identity cannot read corpus (isolation test).  
7. Complete moves boundary; abandoned draft does not.  

---

## 15. Open decisions (small)

1. Exact **practice_epoch** priority list if no fills/entries yet.  
2. Whether P&amp;L section is **hidden** until member expands (default collapsed for G1 sensitivity).  
3. Agent provider (Labs agent principal vs Vexy gateway) — product boundary: HTTP only to MSC.  
4. Max concurrent drafts (recommend 1).  

---

## 16. Related docs

| Doc | Role |
|-----|------|
| Journal-Retrospective Spec **v0.1** | Historical; P0 shell; week-end emphasis |
| Journey Experience Spec v1.0 | Process integrity grades; meter; G1/G2 |
| Trade Log Spec v1.1 | P&amp;L + adherence sources |
| Dual-Goal Product Strategy | G2 continuous improvement loop |
