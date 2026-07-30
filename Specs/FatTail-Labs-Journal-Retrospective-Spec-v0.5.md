# FatTail Labs — Journal Retrospective Spec v0.5

**Status:** **BUILD AUTHORITY (historical)** — Coach **GO** 2026-07-29 · Delta RT0-G PASS · program implemented R1b–R7  
**As-built product truth:** [`FatTail-Labs-Journal-Retrospective-Spec-v0.6.md`](./FatTail-Labs-Journal-Retrospective-Spec-v0.6.md) (RT8-1)

**Type:** Build-authority draft for `agents/p-retrospective/`  
**Supersedes for product shape (build era):** v0.2, v0.3, v0.4, and `Retrospective-Cadence-Meter-Delta-for-v0.5.md` (folded in)  

**Implementation honesty (as of 2026-07-29 on `main`):**

| Slice | Status |
|-------|--------|
| Create from Journal type / library / workspace shell | **Shipped** (R1) |
| Plan-aware create (observer-trial) + habit schema + pnl expand pref | **Shipped** (R1b) |
| Gather dual report (P&amp;L + process) + integrity + crude comparison | **Shipped** (R2–R3 baseline); **v0.5 gather** (R2b RT2-2) |
| Process-first report payload · deviations · sample gate | **Shipped** (RT2-2) |
| Process-first **UI** · book collapsed + expand pref | **Shipped** (RT2-3) |
| Normalized comparison API + UI | **Shipped** (RT3-1 · RT3-2) |
| What worked + expected vs actual gather + UI | **Shipped** (RT6-1 · RT6-2) |
| Habit plan API + cap + gather carry_forward + UI assessment | **Shipped** (RT4-1 · RT4-2) |
| Agent analyze with anchoring + panel | **Shipped** (R5 — RT5-0 GO · local mode) |
| Journey cadence meter + nudge UI | **Shipped** (RT7-1 · RT7-2) |

**As-built vs target:** Implementation is **delta on R1–R3**, not a rewrite. See `agents/p-retrospective/IMPLEMENTATION-PLAN.md`.

**Routes:**
- Journal: `/app/journal` — **start** by selecting type **Retrospective**  
- Retrospective: `/app/retrospective` (library) · `/app/retrospective/{id}` (workspace)  
- Journey: `/app/journey` — continuous integrity meter; retros filter up as milestones (later)  

**Family:** B (member-private) · **Entitlement (create/gather):** **admin OR role activator+
OR active plan slug `observer-trial`** (live memberships — **not** role-only). Free no-plan:
**403**. Activator = legacy, not advertised. See **§10.1** (Mike RT0-4).  
*(Coach 2026-07-29 E.2 · Mike RT0-4 security lock.)*  

**Parents:** Application Framework v1.0 · Member-Data-Privacy v0.1 · Trade Log Spec v1.1 · Journey Experience Spec v1.0 · Human Interface Spec v1.0 · Dual-Goal Product Strategy (G1/G2)  

**Doctrine:** Capital preservation first. Process outcomes only — no profit claims, including to logged-in members. Capacity over dependency: the agent facilitates; the member owns the habit. P&amp;L appears as a **neutral sample**, never as a verdict. Family B isolation absolute.

---

## 0. Why v0.5

Folds **v0.4** (advisor draft) + **cadence meter delta** (Coach decisions on option C,
cadence-as-signal, Observer trial entitlement). Ready for remaining W0 reviews then build.

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

### 0.2 From v0.4 (review reconciliation)

| Item | Spec |
|------|------|
| As-built honesty | Status table above; implementation is **delta on R1–R3**, not greenfield |
| `MIN_INFERENCE_N` | **20** trades — **Hotel RT0-2 locked** (not “default”; change only via Spec bump) |
| Concurrent open retros | **Max 1** open (`draft`/`gathering`/`ready`) — fail loud 409 (as-built) |
| Journal-gap deviation threshold | **N = 3 calendar days** without journal or trade-log activity (§6.3) |
| Adverse “what worked” copy | Process fact only; result is a **condition**, never a figure in that row (§6.4) |
| P&amp;L expand preference | `retrospective_pnl_expanded` on profile (default false) (§6.6) |
| Practice epoch | Explicit priority list (§4.2) |

### 0.3 New in v0.5 (cadence meter delta — Coach locked)

| Item | Spec |
|------|------|
| **Option C** | Activity between `scope_end` (gather) and `completed_at` falls into **no** retrospective window — deliberate. **No** coverage indicator. (§4.1) |
| **Cadence as process signal** | Days since last **completed** retro vs `retro_horizon_days`; contributes to process integrity meter (Journey §4.1a). Only `completed_at` moves the clock. |
| **Nudge vs meter** | Nudge invitational only; meter is process signal. Never “you were marked down for a late retro.” (§7.5) |
| **`retro_horizon_days`** | Own profile field — **not** `grade_ramp_days`. **Amended by v0.51:** Observer trial **7** (weekly teach; `grade_ramp_days` still **42**), Navigator monthly **30**, annual **90**, Activator legacy **30**, alumni **90**. |
| **Empty rules** | E1 cannot-create → exclude; E2 no complete + d≤H → exclude; E3 unresolvable epoch → exclude |
| **Entitlement (E.2 closed)** | **Observer trial** may create; free no-plan may not; Activator legacy keeps access; marketed path trial → Navigator |

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

### 1.3 Non-goals (v0.4 / v0.5)

- Mandatory weekly cadence (**soft nudge** only — §7.5). Cadence **meter** is process signal after grace, not a punitive badge.  
- Auto-publish retros to community/coaches.  
- Coverage indicator for the gather→complete gap (Option C — intentionally unreviewed).  
- Cost-of-deviation counterfactual (deferred — §21).  
- Replacing Trade Log Reports as primary blotter equity UI.  
- Grading entry/exit quality vs day’s range (needs more Trade Log context).  
- Judging reflection *quality* of a retrospective body (cadence ≠ quality).  
- Agent before dual report exists (ordering in §13).  
- **Any public marketing, SEO/AEO page, testimonial, catalog claim, or “member results” surface fed by retrospective book performance or dual-report P&amp;L** (**Sierra RT0-5** — §20).  

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
| **`MIN_INFERENCE_N`** | **20** trades (**Hotel RT0-2 locked**). Named domain constant — never magic number only in UI. Below this: sample banner; no outcome trend language; no outcome-corroborated agent hypotheses. |

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

### 4.1 With prior complete (Option C — Coach 2026-07-29)

```
scope_start = last_complete.completed_at    # half-open: strictly after
scope_end   = now (at gather)
```

**Option C:** Activity between a retrospective’s `scope_end` (set at gather) and its
`completed_at` falls into **no** retrospective window. Deliberate: members may trade while
writing up the prior period. Forcing that activity into either window imposes machine
precision on a fluid human process.

**No coverage indicator.** No “unreviewed activity” badge, no completeness score for the
gap. Lag surfaces only via the **cadence meter** (Journey §4.1a) — keyed on `completed_at`,
not gather.

`draft` / `gathering` / `ready` / `abandoned` do **not** move the cadence clock.

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

**Copy (Tango RT0-3 locked):**

| Context | Approved |
|---------|----------|
| Evidence pattern | *"You committed to X. Journal days went from 3.1/wk to 4.4/wk."* |
| Self-assessment labels | **Kept** · **Partial** · **Lapsed** — status of the plan only; never moralized as success/failure |
| Empty (no prior plans) | *"No plans carried in — this is where they'll appear next time."* |

**Never:** *"You succeeded"* / *"You failed"* / *"You broke your commitment"* / *"You let this slip"* / grade-colored shame on `lapsed`.

**Maiden:** section **absent**.

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
**Mike RT0-4:** Quotes and agent prompt logs must not leave Family B isolation — see **§10.1**.

### 6.6 Book performance (results) — last, collapsed

**Default: collapsed.** Expand preference: `identities.retrospective_pnl_expanded` (TINYINT, default **0**). Preference persists per member.

| Include | Exclude |
|---------|---------|
| Net result, by account if multi | “You crushed it / failed” |
| Equity path / drawdown from Trade Log read models | Marketing-reusable copy |
| Outcome **counts** | Rankings vs others |

**Collapsed chrome (Tango RT0-3):**

| Surface | Approved | Banned |
|---------|----------|--------|
| Section title | **Book performance (results)** | “Success”, bare “Performance”, “How you did” |
| Collapsed summary | *"Book performance (results) — neutral sample from this window. Expand when you want the numbers."* | “See your results”, “Check if you made money”, “Your scorecard” |
| Expand control | **Show book sample** / **Hide book sample** | “Reveal performance”, “Unhide wins” |

**Sample-size gate (hard):** Always show trade count **n**. If trades in window **&lt; `MIN_INFERENCE_N`**:

> *"This is a small sample. It describes what happened; it does not measure process quality."*

**(Hotel RT0-2 + Tango RT0-3):** Banner is trading-accurate **and** dignity-safe: the book is a **neutral sample**, not a verdict on process or on the person. P&amp;L never claims the process “works” or “fails.” Deviations remain legitimate at n=1 (§6.3). Tango accepts Hotel wording without softening that blunts the process/outcome split.

No trend language, no directional adjectives on outcomes, no outcome-corroborated agent hypotheses (§8.2).

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

### 7.5 Cadence — nudge and meter

Two mechanisms. They share **`retro_horizon_days`** on the Journey meter profile (Journey
Experience Spec §4.1a / §4.4) and **must never diverge**.

**The nudge (never punitive).** When days-since-last-**complete** exceeds the profile
horizon `H = retro_horizon_days`, the system may suggest starting a retrospective.
Invitational copy only. No badge decay, no streak loss, no interstitial spam, no remedial
or shame framing. Persistent dismissible surface only.

**Approved nudge strings (Tango RT0-3) — pick one; no rotation guilt:**

| # | Copy |
|---|------|
| N1 | *"It's been a while since your last completed retrospective. When you're ready, start one from Journal."* |
| N2 | *"Ready to close the loop on this stretch of practice? Start a retrospective when it suits you."* |
| N3 (maiden-eligible after grace) | *"A retrospective gathers how you practiced — process first. Start from Journal when you're ready."* |

Dismiss control: **Not now** (not “Dismiss warning”, not “Ignore reminder”).

**The meter (process signal).** Retrospective cadence is one process integrity meter among
six — whether the member **closes** a review loop, not only opens activity. Definition and
formula: Journey Experience Spec **§4.1a**.

**Meter-facing copy (Tango RT0-3):**

| Surface | Approved | Banned |
|---------|----------|--------|
| Meter label | **Retrospective cadence** | “Overdue”, “Late”, “Behind”, “Penalty” |
| Tooltip / blurb | *"Days since last completed retrospective vs your plan horizon. Closing the review loop is part of process."* | “You were marked down for a late retro”, “Complete a retro to fix your grade”, “Your score dropped because you skipped” |
| Empty (E1–E3) | Omit meter or show unavailable — never **0** with shame | “0% — no retros” for members who cannot create |

**Invariants:**

1. Cadence is one of six meters; it can move the grade; it cannot alone determine a band (~1/6 of average).  
2. Grade describes the **work**, not the person; tenure rules still block day-one Poor.  
3. Members who cannot create retros are **excluded** from the meter (empty), never scored zero.  
4. Copy **never** tells a member they were “marked down” for a late/missed retrospective.  
5. A missed retro is not a moral failure; after grace it **is** a legitimate process-cadence input (unlike v0.4’s blanket “not a process integrity failure,” which would forbid this signal).  
6. **Nudge and meter never cross-link in copy** — the invite does not mention the grade; the meter does not say “start now or lose points.”

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
| **Sample-size gate** | Window trades &lt; `MIN_INFERENCE_N` → suppress outcome-corroborated hypotheses; process-anchored still allowed |
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
| POST | `…/analyze` | Agent (R5) | **Yes (RT5-1)** — mode `local`; trial off default |
| CRUD | `/api/me/habit-plans` | Cap-enforced (R4) | **Yes (RT4-1)** |

### 10.1 Security & entitlement (**Mike RT0-4 locked**)

Parent authority: Member-Data-Privacy Spec (PD-3 / PD-3b / PD-8) · Identity-Access Spec.

#### Create / gather entitlement (server-side every request)

```
can_create_or_gather =
    role is administrator
    OR role_at_least(role, "activator")          # Navigator + legacy Activator
    OR has_active_membership(slug = "observer-trial")
```

| Case | Result |
|------|--------|
| Active plan `observer-trial` | **Allow** (G1) — even if implementers later change `grants_role` |
| Navigator / Activator (role ladder) | **Allow** (paid + legacy) |
| Administrator | **Allow** |
| Free observer, no trial plan, no activator+ | **403** |
| Alumni-only | **403** (not activator+) |

**Implementer note (R1b):** As-built R1–R3 use `_require_tool_member` → **role activator+ only**. That *accidentally* admits trial because `observer-trial` currently grants **navigator** role — **do not rely on that**. Target gate is the formula above: **plan slug OR role**, checked via `memberships` + `plans.slug` (active/grace, unexpired) **and** `claims.role` from server-derived session — never client-asserted role, never body `identity_id`.

**Why not role alone for trial:** Trial entitlement is a **plan** product fact (G1 + Journey E1 empty rule). Role is a derived ladder. Plan-slug check keeps create entitlement and cadence empty E1 consistent if `grants_role` mapping changes.

**Read/list/patch/complete/abandon:** Same session + isolation. Prefer same entitlement for mutating gather/create; list of own retros may remain available to any authenticated identity who already has rows (downgrade preserves data — Mike invariant: lose access to *new* create, not existing artifacts). **Mike recommendation:** create + gather require `can_create_or_gather`; GET own rows by `identity_id` remains for members who lose trial mid-open (complete/abandon allowed; new create 403).

#### Isolation (Family B)

| Rule | Spec |
|------|------|
| Isolation key | Labs **`identity_id`** only (PD-3b). Never provider user id, email, or client-supplied id as primary scope. |
| Every SELECT/UPDATE | `WHERE identity_id = session_identity` (after `_storage_identity_id` resolution). |
| Path param `{id}` | Load only if row owned by session identity → else **404** (not 403 — no existence oracle for other members' retros). |
| Body `identity_id` | **Ignored** if present; never used for authorization. |
| Admin `/admin/*` | **No** raw retro / corpus / `pre_market` / agent log read (PD-8). Aggregates only per Privacy Spec. |
| Public board / Journey public | Never include retro bodies, P&amp;L, quotes, or agent JSON. |
| Option C gap | **No** coverage indicator, completeness badge, or “unreviewed activity” surface — Coach locked; not a security leak vector to invent. |

#### Sensitive corpus classes (Family B forever)

| Class | Rules |
|-------|-------|
| `pre_market` / journal quotes in §6.5 | Verbatim only inside this member’s workspace; never paraphrase into shared logs; never export to marketing or other members. |
| `report_json` / `comparison_json` | Identity-scoped storage; no cross-member join. |
| Agent prompts, completions, `agent_json` (R5) | Family B; log redaction: no full corpus dump to shared app logs; provider HTTP must not use another member’s context; single `identity_id` per call. |
| Book performance sample | Neutral numbers still **private**; **never** marketing/SEO reuse (**§20**, Sierra RT0-5). |

#### Attack notes (must fail in tests — RT1-2 / Kilo)

| # | Attack | Expected |
|---|--------|----------|
| A1 | Request body or query spoofs `identity_id` of member B | Ignored; session A only — no B data |
| A2 | `GET /api/me/retrospectives/{B's id}` as member A | **404** |
| A3 | Free no-plan observer `POST` create | **403** |
| A4 | Session JWT with forged role claim (if unsigned/wrong secret) | **401** (session verify) |
| A5 | Trial membership expired; role still cached navigator until re-login | Re-derive role on session refresh; membership query for trial is **live** on create — expired plan → 403 even if stale cookie role (prefer re-issue session on membership change; at minimum create checks live `memberships`) |
| A6 | Concurrent second open retro | **409** (as-built) |
| A7 | Admin board scrape of Family B retros | Not exposed — no route; PD-8 |
| A8 | Agent analyze with missing config | **Fail loud** error; no silent empty “analysis” |

#### As-built honesty

| Concern | Status |
|---------|--------|
| Isolation on retro routes | **Shipped** — queries filter `identity_id` |
| Create = plan-aware trial | **Shipped R1b** — `can_create_or_gather` (admin \| activator+ \| active `observer-trial`) |
| Live membership check on create | **Shipped R1b** — `memberships` + `plans.slug` |
| Schema `member_habit_plans` + `retrospective_pnl_expanded` | **Shipped R1b** (CRUD plans = R4) |
| Agent log isolation | N/A until R5; Spec locked now |

---

## 11. UI

| Surface | Behaviour |
|---------|-----------|
| Journal day chips | **Retrospective** creates and navigates to workspace |
| `/app/retrospective` | Library + Start + next scope label |
| `/app/retrospective/{id}` | §6 order; collapsed book; comparison headings with both windows |
| Journey | Cadence meter **shipped** (R7 / RT7-G); milestone feed still later — see **v0.6** as-built |

---

## 12. Dual goals

| Goal | Role of retrospectives |
|------|------------------------|
| **G1** Observer trial | **Primary trial path.** May create retros; do not force week-1; maiden after enough practice; dual report without agent is enough for the loop |
| **G2** Navigator | **Primary paid path.** Full measure → act → report (+ agent when enabled) |
| **Activator** | **Legacy** self-directed tier — not advertised; few signups. Technical access to Practice/retros remains; product narrative is trial → Navigator |

---

## 13. Implementation slices (v0.5 — delta on as-built)

Board: `agents/p-retrospective/` (seeds RT0–RT8).

| Slice | Deliverable | Notes |
|-------|-------------|--------|
| **W0 / R0** | Spec v0.5 lock + board freeze | This document + Journey §4.1a |
| **R1b** | Habit plans schema + `retrospective_pnl_expanded` + **Observer trial** create entitlement | Plan-slug check, not role-only |
| **R2b** | Gather §6.1–6.6; process-first UI; P&amp;L collapsed + sample banner; deviations | **Refactor** existing gather/UI |
| **R3b** | Normalized comparison + `comparable` + window labels | **Replace** crude delta |
| **R4** | Carry-forward + habit plan cap API | Maiden clean |
| **R5** | Agent analyze + validation | Coach GO/DEFER; trial agent optional off |
| **R6** | What worked + expected vs actual (if not in R2b) | Honest empty states |
| **R7** | `retro_horizon_days` + cadence meter + nudge | Journey §4.1a; empty E1–E3 |
| **R8** | As-built Spec + program close | Lima · Delta |

---

## 14. Verification

Carry as-built tests for create/maiden/complete/409 concurrent. Add:

1. Workspace order: process sections before book; book collapsed on first paint.  
2. Trades &lt; `MIN_INFERENCE_N` (20): sample banner; no outcome trend copy.  
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
| Judge series not single trade | Trading psych | `MIN_INFERENCE_N` = 20 (Hotel RT0-2) |
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

## 19. Member-facing copy glossary (Tango RT0-3)

Canonical for Charlie / Sierra. Violations are Tango blocks at UI review.

### 19.1 Banned phrases (product UI + agent surface)

| Category | Never say |
|----------|-----------|
| Resulting / profit | “You crushed it”, “You failed”, “you should have made more”, P&amp;L as talent or identity |
| Cadence shame | “marked down”, “overdue penalty”, “behind on retros”, “fix your grade with a retro”, “don’t fall behind” |
| Carry-forward moralizing | “You succeeded/failed at this habit”, “you broke your commitment”, “you let this slip” |
| Collapsed book bait | “See how you did”, “your scorecard”, “reveal wins” |
| Person grading | “You’re a Poor trader”, any grade that names the **person** not the **work** |

### 19.2 Preferred patterns

| Intent | Pattern |
|--------|---------|
| Evidence | Quantified process: rates, counts, windows — no moral verbs |
| Invite | When ready / from Journal / close the loop — optional, dismissible |
| Sample honesty | Hotel banner (§6.6) — process quality not measured by book |
| Grades | Work vocabulary only (Process Integrity labels from Journey Spec) |

---

## 20. Marketing & public acquisition boundary (**Sierra RT0-5 locked**)

Retrospectives are a **member-private practice tool** (Family B). They are **not** an
acquisition content source. Sierra owns public catalog/SEO/AEO surfaces; those surfaces
must never ingest retro dual-report data.

### 20.1 Hard bans

| Ban | Rationale |
|-----|-----------|
| No public “member results” pages, widgets, or SEO URLs fed by retro book performance or `report_json` P&amp;L | Profit theater; violates process-outcomes doctrine |
| No testimonials, case studies, landing pages, emails, or ads that quote or paraphrase a member’s retro book sample, equity path, or net result | Even with consent framing: product default is **no pipeline** from retro → marketing |
| No Course JSON-LD, FAQPage, meta description, or OG text derived from retro aggregates | Public AEO must not launder private P&amp;L as social proof |
| No community / Journey **public** board rows from retro bodies, P&amp;L, or agent JSON | Aligns Mike §10.1 + S8 |
| No “average member P&amp;L from Labs retros” marketing stats | Cohort marketing of book outcomes is still a profit claim surface |

### 20.2 What *may* appear in marketing (unchanged doctrine)

| Allowed (existing Sierra rules) | Notes |
|---------------------------------|-------|
| Process-outcome language | Drawdown stopped, adherence streaks, routine installed — **never** profit figures |
| Anonymized **opt-in** product research outside this pipeline | Not a retro export feature; separate consent + legal — **out of scope for p-retrospective** |
| Catalog copy about the *existence* of retrospectives as a practice loop | Feature description only — no sample numbers, no “members make X” |

### 20.3 Product / engineering non-goals (explicit)

1. **No** public “member results” index or SSR page from `member_retrospectives`.  
2. **No** marketing CMS connector, webhook, or admin export labeled for ads/SEO.  
3. **No** automatic share-to-public from the retrospective workspace (auto-publish already non-goal).  
4. Optional future “share process milestone” (if ever) is a **new Spec** — process-only chips, never book performance — not implied by v0.5.

### 20.4 Interaction with other locks

| Lock | Relationship |
|------|----------------|
| Hotel RT0-2 | Sample banner: book does not measure process — also must not measure *for the market* |
| Tango RT0-3 | Member UI bans resulting; Sierra bans the **external** equivalent |
| Mike RT0-4 | Family B isolation is the technical floor; this section is the **positioning** floor |
| G1/G2 | Marketed path is trial → Navigator on **process capacity**, not retro P&amp;L proof |

---

## 21. Open for advisors (named gates) — W0

| # | Question | Owner | Seed |
|---|----------|--------|------|
| 1 | Confirm **`MIN_INFERENCE_N = 20`** or set alternative | **Hotel** | **RT0-2 CLOSED** — locked **20** |
| 2 | Tone of small-sample banner + collapsed P&amp;L + cadence (no shame) | **Tango** | **RT0-3 CLOSED** — §6.0 · §6.6 · §7.5 · §19 |
| 3 | Pre_market quotes + agent logs Family B; plan-based trial entitlement | **Mike** | **RT0-4 CLOSED** — §10.1 |
| 4 | Spec integrity / SoR (this fold) | **India** | RT0-1 (done) · RT0-2/4 India APPROVED |
| 5 | External/marketing: no reuse of book performance | **Sierra** | **RT0-5 CLOSED** — §20 |
| 6 | Spec lock evidence | **Delta** | RT0-G |

**Closed by Coach (do not re-open without Coach):**

- Option C (unreviewed gather→complete gap)  
- Cadence is process meter signal  
- Observer trial may create retros; free no-plan may not  
- Activator is legacy, not marketed funnel  
- `retro_horizon_days` separate from `grade_ramp_days`  

**Closed by Hotel RT0-2 (Spec bump to change):**

- **`MIN_INFERENCE_N = 20`** — see Hotel evidence on seed RT0-2  

**Closed by Tango RT0-3 (Spec bump to change copy tables):**

- Carry-forward, book chrome, sample banner acceptance, nudge N1–N3, meter labels, §19 glossary  

**Closed by Mike RT0-4 (Spec bump to change security model):**

- Create/gather formula: admin OR activator+ OR active `observer-trial` plan  
- Isolation + attack notes A1–A8 · Family B classes · Option C no coverage indicator  

**Closed by Sierra RT0-5 (Spec bump to change marketing boundary):**

- §20 — no public member-results / SEO / testimonial reuse of retro book performance  





**Explicitly deferred:**

- Cost-of-deviation counterfactual  
- Agent provider (Labs principal vs Vexy) — HTTP-only to MSC  
- Agent on Observer trial (default off until Coach opens)  

---

## 22. Decision-log (landed)

> **Journal Retrospective v0.5 — BUILD AUTHORITY (Coach GO 2026-07-29).** Unifies v0.4
> quality shape with cadence meter delta: Option C scope, completed_at-only cadence clock,
> retro_horizon_days, Observer trial create entitlement, Activator legacy. See DL-081…087.
> Program **BUILDING** — `agents/p-retrospective/` RT0-0 frozen.

---

## 23. Document map

| Doc | Role |
|-----|------|
| **This file (v0.5)** | W0 **build authority** (Coach GO) — historical for the build program |
| **v0.6** | **As-built / program close** product truth (`FatTail-Labs-Journal-Retrospective-Spec-v0.6.md`) |
| **v0.51** | **Coach amendment** — weekly trial H=7; signal-not-enforcement; alumni H=90 |
| Advisor Gates v0.51 | `Specs/Advisor-Gates-Retrospective-v0.51.md` — Hotel…Delta CLEARED (DL-119) |
| Cadence delta | Folded; retained as historical decision packet |
| v0.4 | Pre-cadence advisor draft |
| v0.2 | R1–R3 as-built shape baseline |
| Journey Experience Spec | §4.1a cadence meter + profiles |
| This file §20 | Sierra marketing / public acquisition boundary |
| `Architecture/12-retrospective-report-dto.md` | **report_json / workspace DTO** (RT2-1) — Charlie SoR for UI |
| `agents/p-retrospective/` | Multi-agent board |
