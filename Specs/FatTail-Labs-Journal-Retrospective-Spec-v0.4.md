# FatTail Labs — Journal Retrospective Spec v0.4

**Status:** SUPERSEDED for build board by **v0.5**  
→ [`FatTail-Labs-Journal-Retrospective-Spec-v0.5.md`](./FatTail-Labs-Journal-Retrospective-Spec-v0.5.md)  
**Type:** Unified product Spec (v0.2 shape + v0.3 quality fixes + as-built reconciliation)  
**Supersedes for product shape:** v0.2 and v0.3 where they conflict  

**Implementation honesty (as of 2026-07-29 on `main`):**

| Slice | Status |
|-------|--------|
| Create from Journal type / library / workspace shell | **Shipped** (R1) |
| Gather dual report (P&amp;L + process) + integrity + crude comparison | **Shipped** (R2–R3, **v0.2 shape**) |
| Process-first order · P&amp;L collapsed · normalized comparison · deviations · what worked · expected vs actual | **Not shipped** — this Spec defines the target |
| Carry-forward + habit plan cap | **Not shipped** |
| Agent analyze with anchoring | **Not shipped** |
| Journey meter un-`soon` for retros | **Not shipped** |

**Routes:**
- Journal: `/app/journal` — **start** by selecting type **Retrospective**  
- Retrospective: `/app/retrospective` (library) · `/app/retrospective/{id}` (workspace)  
- Journey: `/app/journey` — continuous integrity meter; retros filter up as milestones (later)  

**Family:** B (member-private) · **Entitlement (create/gather):** **Observer trial** plan
(`observer-trial`) **or** activator+ (Navigator; **Activator = legacy** self-directed,
not advertised) **or** administrator. Free observer with no trial plan: **no**.  
*(Coach 2026-07-29 — see also `Retrospective-Cadence-Meter-Delta-for-v0.5.md` §E.2.)*  

**Parents:** Application Framework v1.0 · Member-Data-Privacy v0.1 · Trade Log Spec v1.1 · Journey Experience Spec v1.0 · Human Interface Spec v1.0 · Dual-Goal Product Strategy (G1/G2)  

**Doctrine:** Capital preservation first. Process outcomes only — no profit claims, including to logged-in members. Capacity over dependency: the agent facilitates; the member owns the habit. P&amp;L appears as a **neutral sample**, never as a verdict. Family B isolation absolute.

---

## 0. Why v0.4

### 0.1 Inherited from v0.3 (quality fixes to v0.2)

| # | Defect in v0.2 / early build | Fix |
|---|------------------------------|-----|
| D1 | P&amp;L and process side-by-side / outcome-first risk | **Process first.** Book performance **last and collapsed by default** (§6.6) |
| D2 | Comparison across variable-length windows using raw counts | **Rates + denominators + `comparable` flag** (§7) |
| D3 | Agent may invent root causes from P&amp;L noise | **Hypothesis anchoring** — process/adherence/journal only as origin (§8.2) |
| D4 | Habit plans uncapped; carry-forward buried | **Carry-forward opens the workspace**; **max 2 active plans** (§6.0, §18) |

Additions retained from v0.3:

- **What worked** (§6.4) — solution-focused, mandatory in agent output when data exists  
- **Expected vs actual** (§6.5) — pre-market intent vs executed behaviour  
- **Provenance** (§17) — Scrum / AAR / resulting / solution-focused sources  

### 0.2 New in v0.4 (review reconciliation)

| Item | Spec |
|------|------|
| As-built honesty | Status table above; implementation is **delta on R1–R3**, not greenfield |
| `MIN_INFERENCE_N` | Default **20** (Hotel may revise via Spec bump) |
| Concurrent open retros | **Max 1** open (`draft`/`gathering`/`ready`) — fail loud 409 (as-built) |
| Journal-gap deviation threshold | **N = 3 calendar days** without journal or trade-log activity (§6.3) |
| Adverse “what worked” copy | Process fact only; result is a **condition**, never a figure in that row (§6.4) |
| P&amp;L expand preference | `retrospective_pnl_expanded` on profile (default false) (§6.6) |
| Practice epoch | Explicit priority list (§4.2) |
| Advisor gates | Named open items for Hotel / Tango / Mike / India (§21) |

---

## 1. Intent

### 1.1 Product thesis

A **Retrospective** is a deliberate journal **type**. Selecting it tells the system:

> Gather everything I have done in practice **since my last completed retrospective** (or, if this is my first, my **maiden journey**). Produce a **process-first** report of how I practiced, review **Process Integrity**, optionally show **book performance (results)** collapsed by default, compare to prior retrospectives when comparable, and — with agent assist — surface concerns, what worked, root-cause hypotheses, and habit-altering plans I own.

### 1.2 Success criteria

| ID | Criterion |
|----|-----------|
| S1 | Start from **Journal** type **Retrospective** (library Start is the same create path). |
| S2 | Scope = since last **complete** retro, or **maiden journey** if none. |
| S3 | Gather builds a corpus + dual report without inventing missing data. |
| S4 | Workspace order: **carry-forward → process → integrity → deviations → what worked → expected vs actual → book performance (collapsed)**. |
| S5 | Comparisons use **normalized rates** and a **`comparable` flag**; non-comparable pairs show no delta/arrows. |
| S6 | Process Integrity uses Journey Experience Spec grade vocabulary + tenure rules (no day-one Poor). |
| S7 | Agent (optional): concerns + **what worked** + anchored hypotheses + capped habit plans; fail loud if misconfigured. |
| S8 | Family B isolation; no public board leakage of retro bodies or P&amp;L. |
| S9 | Capacity over dependency: member accepts/edits/rejects plans. |
| S10 | At most **one** open retrospective; at most **two** active habit plans. |

### 1.3 Non-goals (v0.4)

- Mandatory weekly cadence (soft nudge only — §7.5).  
- Auto-publish retros to community/coaches.  
- Cost-of-deviation counterfactual (deferred — §21).  
- Replacing Trade Log Reports as primary blotter equity UI.  
- Grading entry/exit quality vs day’s range (needs more Trade Log context).  
- Agent before dual report exists (ordering in §19).  

---

## 2. Definitions

| Term | Meaning |
|------|---------|
| **Journal type** | Entry kind; includes daily kinds and **`retrospective`**. |
| **Retrospective** | Artifact of type retrospective: gather → report → reflect → plan for a **scope window**. |
| **Scope window** | `(last_complete.completed_at, now]` or maiden `[practice_epoch, now]`. |
| **Maiden journey** | First retrospective; baseline; no prior comparison / no carry-forward of plans. |
| **Corpus** | In-scope Trade Log, journal (non-retro), check-ins, learning, integrity snapshot, prior retro metadata. |
| **Book performance** | Neutral P&amp;L sample from Trade Log — last, collapsed. |
| **Process performance** | Adherence, routine, live, learning, integrity drivers. |
| **Process Integrity** | Establishing · Poor · Fair · Good · Great · Excellent (Journey Experience Spec §4.2). |
| **Habit-altering plan** | Member-owned process change with **observable_signal**; max 2 active. |
| **MIN_INFERENCE_N`** | **20** trades (default). Below this: sample banner; no outcome trend language; no outcome-corroborated agent hypotheses. |

---

## 3. Start flow (Journal)

1. Journal day view (or library **Start retrospective**) selects type **Retrospective**.  
2. System shows scope: **“Since {last complete}”** or **“Maiden journey — since practice start”**.  
3. Create `draft` → optional immediate gather → `ready` workspace at `/app/retrospective/{id}`.  

**Invariant:** Create path is Journal-type-first; `/app/retrospective` is library + continue.

**Concurrent open:** At most one of `draft|gathering|ready` per member → **409** if a second create is attempted (as-built).

### 3.1 States

| State | Meaning |
|-------|---------|
| `draft` | Created; gather pending |
| `gathering` | Corpus assembly running |
| `ready` | Reports staged; member may write / run agent |
| `complete` | Member completes; becomes next scope boundary |
| `abandoned` | Cancelled; does **not** move last-complete pointer |

Only **`complete`** moves the next scope’s start.

---

## 4. Scope resolution

### 4.1 With prior complete

```
scope_start = last_complete.completed_at   # half-open: trades strictly after
scope_end   = now
```

### 4.2 Maiden journey

```
scope_start = practice_epoch   # inclusive
scope_end   = now
```

**practice_epoch** (first available, in order):

1. Earliest Trade Log `exec_at`  
2. Else earliest journal / tool note `created_at`  
3. Else earliest live check-in  
4. Else earliest lesson `completed_at`  
5. Else `identities.created_at`  

UI: **Maiden journey** — “This becomes your baseline.”

---

## 5. Gather — corpus

| Domain | Content |
|--------|---------|
| Trade Log | Fills in window; adherence; P&amp;L aggregates for book section |
| Journal | Non-retrospective entries; `pre_market` for §6.5 |
| Live | Check-ins |
| Learning | Lessons / quizzes completed |
| Integrity | Meter snapshot (graded + raw + tenure rules) |
| Prior retros | Metadata + prior report snapshot for §6.0 / §7 |

Empty domains → honest empty sections. Never invent P&amp;L or process scores.

---

## 6. The retrospective workspace (render order — mandatory)

```
1. Carry-forward (§6.0)     — if prior complete + any plans ever; else omit for maiden
2. Process performance (§6.1)
3. Process Integrity (§6.2)
4. Bounded deviations (§6.3)
5. What worked (§6.4)
6. Expected vs actual (§6.5) — omit if no pre_market
7. Book performance (§6.6)   — last, collapsed by default
8. Member reflection (body)
9. Agent panel (optional path)
```

### 6.0 Carry-forward (opening section)

**Invariant:** When ≥1 prior **complete** retro exists **and** the member has ever had habit plans, this section is **first**. Nothing report-related renders above it.

For each plan that was `active` during any part of the scope window:

| Field | Source |
|-------|--------|
| Plan title + habit | `member_habit_plans` |
| Committed on | prior retro `completed_at` |
| Observable signal | Named metric on the plan |
| Signal this window / prior window | Normalized per §7 |
| Member self-assessment | `kept` / `partial` / `lapsed` — **member-set only** |

Copy pattern: *"You committed to X. Journal days went from 3.1/wk to 4.4/wk."*  
Never: *"You succeeded"* / *"You failed."*

**Maiden:** section **absent**.  
**No prior plans:** *"No plans carried in — this is where they’ll appear next time."*

### 6.1 Process performance

| Include | Source |
|---------|--------|
| Adherence mix | Trade Log |
| Routine / journal cadence | Journal + Trade Log activity days (rates per §7) |
| Live presence | Check-ins / week |
| Learning rhythm | Lessons / week |
| Integrity drivers | Journey meters |
| Qualitative themes | Journal text (member + optional agent) |

### 6.2 Process Integrity review

1. Current grade (Journey Experience Spec §4.2 vocabulary + tenure rules).  
2. What drove it (meters, not moral judgment).  
3. Direction of travel vs prior if comparable (improved / stable / slipped).  

**Invariant:** Grades describe the **work**, not the person. Maiden may not render as **Poor** via tenure rules.

### 6.3 Bounded deviation list

At most **5** process deviations, ranked by frequency then recency.

| Field | Notes |
|-------|-------|
| Deviation | e.g. trades tagged `broke`; **journal/activity gap ≥ 3 calendar days**; live miss vs profile expectation |
| Count + rate | Absolute and normalized |
| Most recent | Date + deep link to Trade Log or journal day |

Deviations are **facts at n=1** (legitimate). Not the same as inferring process quality from P&amp;L.

**Journal-gap threshold:** **N = 3** consecutive calendar days with neither a journal note nor Trade Log activity inside the scope window. (Constants live in domain module; change only with Spec bump.)

### 6.4 What worked

At most **3** items, adjacent to deviations.

| Source | Example |
|--------|---------|
| Longest `followed` run | "9 consecutive trades tagged followed" |
| Best routine stretch | "11 straight days with a journal entry" |
| Adherence under adverse conditions | **Process only:** "Followed on a day when the book finished negative" — **do not** print the P&amp;L figure in this section |

**Agent:** If qualifying “what worked” data exists and agent returns zero items → **validation failure**.

### 6.5 Expected vs actual

Where `pre_market` entries exist in the window:

| Column | Source |
|--------|--------|
| Stated intent | Verbatim quote from `pre_market` (never paraphrased by system) |
| What executed | Trades that day + adherence tags |
| Gap | Member-authored; optionally agent-prompted |

No pre_market → section **absent**.  
**Mike:** Quotes and agent prompt logs must not leave Family B isolation.

### 6.6 Book performance (results) — last, collapsed

**Default: collapsed.** Expand preference: `identities.retrospective_pnl_expanded` (TINYINT, default **0**). Preference persists per member.

| Include | Exclude |
|---------|---------|
| Net result, by account if multi | “You crushed it / failed” |
| Equity path / drawdown from Trade Log read models | Marketing-reusable copy |
| Outcome **counts** | Rankings vs others |

**Sample-size gate (hard):** Always show trade count. If trades in window **&lt; `MIN_INFERENCE_N` (20)**:

> *"This is a small sample. It describes what happened; it does not tell you whether your process is working."*

No trend language, no directional adjectives on outcomes, no outcome-corroborated agent hypotheses (§8.2).

**Title:** "Book performance (results)" — never "Success" or bare "Performance."

---

## 7. Comparison to previous retrospectives

### 7.1 Normalization

No raw count may be compared across windows. Rates with explicit denominators:

| Metric | Normal form | Denominator |
|--------|-------------|-------------|
| Journal / routine | days per week | window_days ÷ 7 |
| Live | check-ins per week | window_days ÷ 7 |
| Learning | lesson days per week | window_days ÷ 7 |
| Adherence | % followed+partial | trades in window |
| Integrity | graded % at end | point-in-time |
| Book result | per-trade and per-week (neutral) | trades / weeks |

### 7.2 Comparability flag

```json
{
  "metric": "routine_days_per_week",
  "current":  { "value": 4.4, "window_days": 21, "n": 13 },
  "previous": { "value": 3.1, "window_days": 63, "n": 27 },
  "comparable": true,
  "comparable_reason": null
}
```

`comparable = false` when:

- either window `n` below metric minimum (adherence: `MIN_INFERENCE_N`; activity rates: `window_days < 14`), **or**  
- window lengths differ by more than **3×**.

UI: both values side by side, windows labelled; **no delta, arrow, or trend language**.

### 7.3 Display invariant

Every comparison heading: **"This window (3 weeks) vs previous (9 weeks)"** — never bare "vs last time."

### 7.4 Maiden

Section skipped; retro labelled **baseline**.

### 7.5 Cadence nudge (soft)

Suggest a retrospective when days-since-last exceeds the member’s Journey meter profile horizon (Observer trial 42d, Navigator monthly 30d, annual 90d — Journey Experience Spec §4.4).

**Never:** badge decay, streak loss, grade penalty, remedial shame copy. A missed retro is **not** a process integrity failure.

---

## 8. Agent analysis

### 8.1 Role

Facilitator, not judge:

1. Read this member’s staged report + corpus under isolation.  
2. Concerns (process risks, integrity slips, lapsed plans).  
3. **What worked** — mandatory when data exists.  
4. Root-cause **hypotheses** (not diagnoses).  
5. Habit plans — small, checkable, process-only, capped (§18).  

### 8.2 Constraints

| Rule | Spec |
|------|------|
| **Hypothesis anchoring** | Every hypothesis cites ≥1 of: process event, adherence tag, journal passage. P&amp;L may appear in `supports` only; **never sole basis** |
| **Sample-size gate** | Window trades &lt; 20 → suppress outcome-corroborated hypotheses; process-anchored still allowed |
| **Symmetry** | Concerns without `what_worked` when data exists → fail validation |
| **No temporal superstition** | No day-of-week/time/symbol patterns from **outcome alone** |
| Capacity over dependency | Agent optional for writing |
| No guaranteed edge | No profit promises, ever |
| Isolation | Single `identity_id` |
| Fail loud | Missing agent config → error on Run analysis |
| Human gate | Accept / edit / reject before `active` |

### 8.3 Output shape

```json
{
  "what_worked": [
    { "observation": "…", "evidence": "…", "window_n": 13 }
  ],
  "concerns": [
    { "area": "…", "evidence": "…", "severity": "low|med|high", "anchors": ["…"] }
  ],
  "root_cause_hypotheses": [
    {
      "hypothesis": "…",
      "anchors": [
        { "type": "process_event|adherence_tag|journal_passage", "ref": "…" }
      ],
      "supports": ["…"],
      "conflicts": ["…"]
    }
  ],
  "habit_plans": [
    {
      "title": "…",
      "habit": "…",
      "why_process": "…",
      "observable_signal": "adherence_rate|routine_days|live_checkins|lesson_days",
      "check_in": "daily|weekly",
      "status": "proposed"
    }
  ]
}
```

Empty `anchors` or missing `observable_signal` → **reject at boundary** (fail loud).

---

## 9. Data model

### 9.1 `member_retrospectives` (as-built + fields)

As shipped in migration `046`, plus any JSON shape evolution inside `report_json` / `comparison_json` for §6–§7.

| Column | Notes |
|--------|-------|
| `id`, `identity_id` | Isolation |
| `status` | draft \| gathering \| ready \| complete \| abandoned |
| `is_maiden` | First retro |
| `scope_start`, `scope_end` | Window |
| `title`, `body_md` | Member narrative |
| `report_json` | Dual report + deviations + what_worked stubs + integrity |
| `comparison_json` | Normalized rows + comparable flags |
| `agent_json` | R5 agent output |
| `completed_at` | Scope boundary when complete |

### 9.2 `member_habit_plans` (new — R4)

| Column | Notes |
|--------|-------|
| `id`, `identity_id` | |
| `retrospective_id` | Origin retro |
| `title`, `habit`, `why_process` | |
| `observable_signal` | **Required** enum |
| `status` | proposed → active → kept \| lapsed \| retired |
| `activated_at`, `retired_at` | |
| Cap | ≤ **2** rows with `status = active` per identity — **409** on third |

### 9.3 Profile preference

| Column | Default | Notes |
|--------|---------|-------|
| `identities.retrospective_pnl_expanded` | **0** | Book section open state |

---

## 10. API

| Method | Path | Purpose | As-built? |
|--------|------|---------|-----------|
| GET | `/api/me/retrospectives/preview-scope` | Maiden vs since-last | Yes |
| GET | `/api/me/retrospectives` | List | Yes |
| POST | `/api/me/retrospectives` | Create (+ gather) | Yes |
| GET/PATCH | `/api/me/retrospectives/{id}` | Workspace | Yes |
| POST | `…/gather` | Re-gather | Yes |
| POST | `…/complete` | Complete boundary | Yes |
| POST | `…/abandon` | Abandon open | Yes |
| POST | `…/analyze` | Agent (R5) | No |
| CRUD | `/api/me/habit-plans` | Cap-enforced (R4) | No |

Activator+; session isolation; fail loud.

---

## 11. UI

| Surface | Behaviour |
|---------|-----------|
| Journal day chips | **Retrospective** creates and navigates to workspace |
| `/app/retrospective` | Library + Start + next scope label |
| `/app/retrospective/{id}` | §6 order; collapsed book; comparison headings with both windows |
| Journey | Milestone on complete; meter cadence later (R7) |

---

## 12. Dual goals

| Goal | Role of retrospectives |
|------|------------------------|
| **G1** Observer trial | **Primary trial path.** May create retros; do not force week-1; maiden after enough practice; dual report without agent is enough for the loop |
| **G2** Navigator | **Primary paid path.** Full measure → act → report (+ agent when enabled) |
| **Activator** | **Legacy** self-directed tier — not advertised; few signups. Technical access to Practice/retros remains; product narrative is trial → Navigator |

---

## 13. Implementation slices (v0.4 — delta on as-built)

| Slice | Deliverable | Notes |
|-------|-------------|--------|
| **R0** | Spec v0.4 + DL after Coach GO | Advisor review first |
| **R1b** | Schema: habit plans + `retrospective_pnl_expanded` | Additive migrations |
| **R2b** | Gather payload: §6.1–6.6 fields; process-first UI; P&amp;L collapsed + sample banner; bounded deviations | **Refactor** existing gather/UI |
| **R3b** | Normalized comparison + `comparable` + window labels | **Replace** crude delta |
| **R4** | Carry-forward UI + habit plan cap API | Maiden clean |
| **R5** | Agent analyze + validation | Optional path |
| **R6** | What worked + expected vs actual (if not in R2b) | Honest empty states |
| **R7** | Journey milestone + retrospective meter | No gap penalty |

---

## 14. Verification

Carry as-built tests for create/maiden/complete/409 concurrent. Add:

1. Workspace order: process sections before book; book collapsed on first paint.  
2. Trades &lt; 20: sample banner; no outcome trend copy.  
3. 21d vs 63d windows: rate metrics `comparable=false`; no arrows.  
4. Maiden: no carry-forward, no comparison deltas.  
5. Agent hypothesis without anchors rejected.  
6. Agent concerns without what_worked (when data exists) rejected.  
7. Third active habit plan → 409.  
8. Isolation: other identity cannot read retro.  
9. Copy sweep: no profit claims (Tango + Hotel).  

---

## 17. Provenance (from v0.3)

| Mechanism | Source | Adaptation |
|-----------|--------|------------|
| Process vs outcome split | Scrum Review vs Retro | One workspace; process first, results collapsed |
| Blameless prime directive | Scrum retro | Agent as outside facilitator |
| Small capped actions | Scrum + deliberate practice | Max 2 plans; carry-forward first |
| Expected vs actual | Military AAR | Pre-market vs executed |
| Separate decision quality from outcome | “Resulting” literature | Sample banner; hypothesis anchoring |
| Judge series not single trade | Trading psych | MIN_INFERENCE_N = 20 |
| Mistake = rule deviation | Trading-coach adherence | Trade Log tags → deviations |
| Study what worked | Solution-focused coaching | §6.4 mandatory agent symmetry |

**Not borrowed:** velocity/estimation; group formats; fixed sprint as committed market output.

---

## 18. Habit plan cap

| Rule | Value |
|------|-------|
| Max `active` | **2** |
| Third activate | **409** fail loud |
| States | proposed → active → kept \| lapsed \| retired |
| Retirement | Member-only; never auto-grade failure |

---

## 21. Open for advisors (named gates)

| # | Question | Owner |
|---|----------|--------|
| 1 | Confirm **`MIN_INFERENCE_N = 20`** or set alternative | **Hotel** |
| 2 | Tone of small-sample banner + collapsed P&amp;L under demoralization | **Tango** |
| 3 | Pre_market verbatim quotes + agent logs stay Family B | **Mike** |
| 4 | Schema placement: habit plans + prefs; no second progress SoR | **India** |
| 5 | External/marketing: no reuse of book performance copy | **Sierra** |
| 6 | Evidence plan for R2b–R7 | **Delta** |

**Explicitly deferred (not in v0.4 scope):**

- Cost-of-deviation counterfactual (`broke` vs `followed` outcomes) — needs Hotel + Tango before any Spec  
- Agent provider choice (Labs principal vs Vexy gateway) — HTTP-only to MSC boundary  

---

## 22. Decision-log stub (land after Coach GO)

> **Journal Retrospective v0.4 — advisor draft.** Unifies v0.2 gather model with v0.3 process-first quality fixes; reconciles as-built R1–R3; sets MIN_INFERENCE_N=20 default; process-first workspace order; collapsed book performance; normalized comparison; agent anchoring; habit plan cap 2; carry-forward first. Implementation continues as deltas R1b–R7, not a rewrite.

---

## 23. Document map

| Doc | Role |
|-----|------|
| **This file (v0.4)** | Advisor review target; product authority when approved |
| v0.3 | Historical quality-amendment draft |
| v0.2 | Historical shape + R1–R3 as-built baseline |
| v0.1 | P0 shell era |
| Journey Experience Spec v1.0 | Integrity grades, meter profiles, G1/G2 |
