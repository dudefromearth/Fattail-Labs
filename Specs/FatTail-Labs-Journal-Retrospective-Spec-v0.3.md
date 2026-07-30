# FatTail Labs — Journal Retrospective Spec v0.3

**Status:** SUPERSEDED for product review by **v0.4**  
→ [`FatTail-Labs-Journal-Retrospective-Spec-v0.4.md`](./FatTail-Labs-Journal-Retrospective-Spec-v0.4.md)  
**Type:** Versioned amendment to v0.2. Replaces §6, §7, §8 and adds §6.0, §17, §18.
All other v0.2 sections stand unchanged and remain authoritative.  
**(v0.4 folds this content + as-built honesty + advisor gates into one review draft.)**
**Supersedes (where in conflict):** v0.2 §6 (dual report), §7 (comparison), §8 (agent analysis)
**Implementation:** not built. v0.2 §13 slices R0–R5 amended in §19 below.

**Parents (unchanged):** Application Framework v1.0 · Member-Data-Privacy v0.1 ·
Trade Log Spec v1.1 · Journey Experience Spec v1.0 · Human Interface Spec v1.0

**Doctrine:** Capital preservation first. Process outcomes only — no profit claims,
including to logged-in members. Capacity over dependency: the agent facilitates;
the member owns the habit. P&L appears as a neutral sample, never as a verdict.

---

## 0. Why v0.3

v0.2 approved the right shape — gather since last retro, dual report, integrity review,
comparison, agent assist. Four defects surfaced on review of that shape against
established review practice (Scrum retrospective, military After Action Review, and the
published trading-coach literature — see §17).

| # | Defect in v0.2 | Fix in v0.3 |
|---|---|---|
| D1 | P&L renders first (§6.1), process second (§6.2). Outcome dominates the reflection; good window → self-congratulation, bad window → self-blame. Neither changes a habit. | §6 render order inverted. Process first. **Book performance** last and collapsed by default. Resolves v0.2 open decision §15.2. |
| D2 | Comparison (§7) compares rates and aggregates across **variable-length** scope windows. A 12-day window and a 60-day window are not comparable on counts, and rates move with sample size. Arithmetically misleading as specified. | §7 normalization: every comparable metric carried as a rate with an explicit denominator; window length and event count stored on every comparison row; `comparable` flag; UI states both windows. |
| D3 | Agent (§8) may generate root causes from any corpus signal, including P&L patterns alone. This manufactures superstition from noise (n=8 trades infers nothing). | §8.2 hypothesis anchoring rule: every hypothesis must cite ≥1 process event, adherence tag, or journal passage. P&L may corroborate; it may never originate. |
| D4 | Carry-forward of prior habit plans is a row in a comparison table; habit plans are uncapped. Uncapped improvement lists produce zero improvements, and a retro that does not open by checking its own last commitment is theatre. | §6.0 carry-forward is the **first** section of the workspace. §18 caps active habit plans at 2. |

Two additions, not defect fixes:

- **§6.4 What worked.** v0.2 is an error-hunt. Solution-focused review practice holds that
  studying the days that went right is at least as generative as studying the days that
  did not, and it is the difference between a review a member returns to and one they
  avoid. The agent must produce at least one working-pattern observation, not only concerns.
- **§6.5 Expected vs actual.** The member already writes `pre_market` journal entries —
  decisions recorded *before* outcomes are known. Pairing stated intent against executed
  behaviour is the strongest available defence against hindsight bias and costs no new
  data collection.

---

## 6. The retrospective workspace (replaces v0.2 §6)

### 6.0 Carry-forward — the opening section (NEW)

**Invariant:** when ≥1 prior complete retrospective exists, the workspace opens on
carry-forward. Nothing else renders above it.

For each habit plan that was `active` during any part of the scope window:

| Field | Source |
|-------|--------|
| Plan title + habit statement | `member_habit_plans` |
| Committed on | prior retro `completed_at` |
| Observable signal | The process metric the plan named (adherence rate, journal days, live check-ins, lesson days) |
| Signal in this window | Same metric computed over this scope, normalized per §7 |
| Signal in prior window | Same metric, prior scope |
| Member self-assessment | `kept` / `partial` / `lapsed` — **member-set, never inferred** |

The system presents evidence; it does not grade the member's adherence to their own
plan. Copy pattern: *"You committed to X. Journal days went from 3.1/wk to 4.4/wk in
this window."* — not *"You succeeded"* or *"You failed."*

**Maiden journey:** section absent (not empty-stated).

**No prior plans:** section shows *"No plans carried in — this is where they'll appear
next time."*

### 6.1 Process performance (was §6.2 — now first)

Unchanged in content from v0.2 §6.2. Position changed to first substantive report section.

| Include | Source |
|---------|--------|
| Adherence mix (`followed` / `partial` / `broke` / unknown) | Trade Log |
| Routine / journal cadence | Journal + Trade Log activity days |
| Live presence | Check-ins |
| Learning rhythm | `lesson_progress` / quizzes |
| Process integrity grade + trend | Journey scores / meter history |
| Qualitative themes from journal text | Journal entries (member + optional agent) |

All rates normalized per §7.1.

### 6.2 Process Integrity review (was §6.3 — content unchanged)

1. States current integrity grade using Journey Experience Spec §4.2 vocabulary
   (Establishing · Poor · Fair · Good · Great · Excellent).
2. Explains what drove it in this scope — meters, not moral judgment.
3. If a prior retro exists, states direction of travel (improved / stable / slipped).

**Invariant carried from Journey §4.2:** grades describe the work, not the person.
Tenure rules apply — a maiden journey may not render Poor.

### 6.3 Bounded deviation list (NEW — replaces unbounded gather output)

The report surfaces **at most 5** process deviations for the window, ranked by
frequency then recency. A retrospective that cannot be completed in one sitting will not
be completed at all.

| Field | Notes |
|-------|-------|
| Deviation | e.g. trades tagged `broke`, journal gaps ≥ N days, sessions missed against profile cap |
| Count in window | Absolute, with rate |
| Most recent instance | Date + link to the Trade Log entry or journal entry |

Deviations are **facts at n=1** and are stated as such. This is the section where small
samples are legitimate: "you broke your rule on Tuesday" is an observation, not an inference.

### 6.4 What worked (NEW)

Symmetric to §6.3 and rendered adjacent to it. **At most 3** items.

| Source | Example |
|--------|---------|
| Longest `followed` run in window | "9 consecutive trades tagged followed" |
| Best routine stretch | "11 straight days with a journal entry" |
| Adherence under adverse conditions | Trades tagged `followed` on days with negative book result |

The last row is the most valuable and the most specific to trading: process held while
outcome did not. Requires the P&L join, but reports **only the process fact** — the
result is a condition, never a figure in this section.

**Agent constraint (see §8.2):** an analysis run that returns zero `what_worked` items
when qualifying data exists is a defect, not a neutral result.

### 6.5 Expected vs actual (NEW)

Where `pre_market` journal entries exist in the window, pair stated intent against
executed behaviour.

| Column | Source |
|--------|--------|
| Stated intent | `pre_market` entry text (member's own words, quoted verbatim, never paraphrased by the system) |
| What executed | Trades in Trade Log on that date + adherence tags |
| Gap | Member-authored, optionally agent-prompted |

**Honesty:** no `pre_market` entries in window → section absent, not fabricated.
The system never infers what the member intended.

### 6.6 Book performance (results) — was §6.1, now last and collapsed

**Default state: collapsed.** Member expands. Preference persists per member
(`retrospective_pnl_expanded` on identities or profile prefs — implementation choice).

| Include (as available) | Exclude |
|------------------------|---------|
| Net result in window, by account if multi-account | Any "you crushed it / failed" copy |
| Equity path / drawdown from Trade Log Reports read models | Anything reusable as marketing copy |
| Outcome distribution as **counts** | Ranking or comparison vs other members |

**Sample-size gate (NEW, hard):** the section renders a sample banner stating the trade
count for the window. Below `MIN_INFERENCE_N` (recommend 20, constant, not hardcoded at
call site), the section carries the fixed line: *"This is a small sample. It describes
what happened; it does not tell you whether your process is working."* No trend language,
no directional adjectives, and §8 may not run outcome-corroborated hypotheses (§8.2).

**Section title:** "Book performance (results)". Never "Success", "Score", or "Performance"
alone.

---

## 7. Comparison to previous retrospectives (replaces v0.2 §7)

### 7.1 Normalization (NEW — fixes D2)

Scope windows are member-initiated and therefore variable-length. **No raw count may be
compared across windows.** Every comparable metric is carried as a rate with an explicit,
displayed denominator:

| Metric class | Normal form | Denominator |
|---|---|---|
| Journal / routine activity | days per week | window days ÷ 7 |
| Live presence | check-ins per week | window days ÷ 7 |
| Learning | lesson-completion days per week | window days ÷ 7 |
| Adherence | % of trades tagged `followed`/`partial` | trades in window |
| Integrity grade | graded % at window end | n/a (point-in-time) |
| Book result | per-trade and per-week, neutral | trades / weeks |

### 7.2 Comparability flag

Each comparison row carries:

```json
{
  "metric": "routine_days_per_week",
  "current":  { "value": 4.4, "window_days": 21, "n": 13 },
  "previous": { "value": 3.1, "window_days": 63, "n": 27 },
  "comparable": true,
  "comparable_reason": null
}
```

`comparable` is **false** when either window has `n` below the metric's minimum
(adherence: `MIN_INFERENCE_N`; activity rates: window_days ≥ 14) **or** when window
lengths differ by more than 3× — the ratio is arithmetically defined but not
behaviourally meaningful, and presenting it as a delta invites a false conclusion.

When `comparable` is false the UI shows both values side by side with the windows
labelled, and suppresses the delta, arrow, and any trend language.

### 7.3 Display invariant

Every comparison heading states both windows in plain language: **"This window (3 weeks)
vs previous (9 weeks)"**. Never bare "vs last time."

### 7.4 What is compared

| Compare | Rule |
|---------|------|
| Process integrity grade | Previous complete → current. Point-in-time, always comparable |
| Process meters / adherence | Normalized rates per §7.1, gated by §7.2 |
| Habit plans from last retro | Surfaced in §6.0, not repeated here |
| Book aggregates | Neutral delta only, per-trade and per-week, gated by sample-size banner. Never "you should have made more" |

**Maiden journey:** section skipped; retro labelled **baseline**.

### 7.5 Cadence nudge (NEW — soft)

Member-initiated creation stands (v0.2 §3.1 unchanged). The system may **suggest** a
retrospective when days-since-last exceeds the member's Journey meter profile horizon
(Journey Experience Spec §4.4 — Observer trial 42d, Navigator monthly 30d, annual 90d).

**Constraints:** suggestion only. No badge decay, no streak loss, no grade penalty for a
long gap. Copy is invitational, never remedial. A missed retrospective is not a process
failure and must not be scored as one.

---

## 8. Agent analysis (replaces v0.2 §8)

### 8.1 Role

The analysis agent is a **facilitator, not a judge**. A solo trader has no one in the room
to interrupt either self-blame or self-exoneration; supplying that outside voice is the
agent's entire justification for existing here.

1. Reads **this member's** staged report + corpus summaries under session isolation.
2. Surfaces areas of concern (process risks, integrity slips, lapsed plans, avoidance).
3. Surfaces **what worked** (§6.4) — mandatory, not optional output.
4. Helps uncover root-cause **hypotheses**, never diagnoses.
5. Proposes habit-altering plans — small, checkable, process-only, capped per §18.

### 8.2 Constraints

| Rule | Spec |
|------|------|
| **Hypothesis anchoring (NEW, hard)** | Every `root_cause_hypothesis` must cite ≥1 anchor: a process event, an adherence tag, or a journal passage. P&L may appear in `supports` as corroboration; **it may never be the sole basis**. A hypothesis with only outcome anchors is rejected at the boundary and does not render. |
| **Sample-size gate (NEW)** | When window trade count < `MIN_INFERENCE_N`, outcome-corroborated hypotheses are suppressed entirely; process-anchored hypotheses still run |
| **Symmetry (NEW)** | Output containing concerns and zero `what_worked` items, where qualifying data exists, fails validation |
| **No temporal superstition (NEW)** | The agent may not assert patterns keyed to day-of-week, time-of-day, or symbol from outcome data alone. Process-anchored temporal claims (e.g. "you skip the pre-market note on Mondays") are permitted |
| Capacity over dependency | Agent optional. Full report and member writing work without it |
| No guaranteed edge | Never promises profits or that a change will make money. No profit claims, ever |
| Root causes are hypotheses | Labelled as suggestions for member judgment |
| Isolation | Single `identity_id`; no cross-member retrieval; Family B |
| Fail loud | Missing agent config → clear error on Run analysis, never silent skip with fabricated content |
| Human gate | Member accepts / edits / rejects before a plan becomes active |

### 8.3 Outputs (structured — amended)

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

`anchors` is required and non-empty on every hypothesis — validation, not convention.
`observable_signal` is required on every plan so §6.0 carry-forward has something to
measure next time. A plan with no observable signal cannot be carried forward and is
rejected.

---

## 17. Provenance — what these mechanisms are borrowed from (NEW)

Recorded so reviewers can audit the reasoning rather than the assertion.

| Mechanism | Source | Adaptation for a solo trader |
|---|---|---|
| Review / retrospective split (outcome vs process examined separately) | Scrum: Sprint Review vs Sprint Retrospective | Collapsed into one workspace but **ordered** — process first, results collapsed (§6). Scrum separates them by meeting; we separate by prominence |
| Blameless frame ("prime directive") | Scrum retrospective practice | The absent party is not a teammate but an outside observer; the agent supplies it (§8.1) |
| Small capped action set, carried to next cycle | Scrum action items; deliberate-practice literature | Max 2 active plans, carry-forward as opening section (§6.0, §18) |
| Expected vs actual as the opening question | Military After Action Review | Pre-market intent vs executed behaviour (§6.5). AAR is arguably a closer fit than Scrum: event-anchored, blameless by doctrine, no team required |
| Decision quality separated from outcome quality | Decision-science literature on "resulting" / hindsight bias | Sample banner, hypothesis anchoring, collapsed results (§6.6, §8.2) |
| Judge over a series, not a trade | Trading-psychology literature on probabilistic thinking | `MIN_INFERENCE_N` gate; deviations are facts at n=1, outcomes are not (§6.3, §6.6) |
| Mistake = deviation from your own rules, independent of result | Trading-coach literature on rule adherence and mistake counting | Already native to Trade Log adherence tags. §6.3 makes it the primary deviation source |
| Study what worked, not only what failed | Solution-focused coaching practice | §6.4, mandatory agent output |
| Execution graded independently of outcome | Trading-diary practice of grading entry/exit quality against the day's range | **Not adopted in v0.3** — needs a Trade Log data model that captures range context. Candidate for a later slice |

**Deliberately not borrowed:** velocity and estimation (no committed output — the market
supplies the variance, not the trader); group formats (Mad/Sad/Glad, dot voting, safety
checks) — no team; the sprint as a fixed unit of committed work, which is the category
error at the heart of treating P&L as a delivered increment.

---

## 18. Habit plan cap (NEW)

| Rule | Value |
|------|-------|
| Max `active` plans per member | **2** |
| Proposing a third | Requires retiring one — enforced at API, not UI copy |
| Plan states | `proposed` → `active` → `kept` / `lapsed` / `retired` |
| Retirement | Member-initiated only. Never auto-expired, never system-graded |

Rationale: uncapped improvement lists produce zero improvements, and an uncapped
`member_habit_plans` table makes §6.0 carry-forward a wall of ignored commitments —
which teaches the member the loop does not work.

**Data model delta (amends v0.2 §9.3):** `member_habit_plans` gains `observable_signal`
(required), `status` (enum above), `activated_at`, `retired_at`. Cap enforced in the
API layer with a fail-loud 409, not a silent truncation.

---

## 19. Amended implementation slices (amends v0.2 §13)

| Slice | Deliverable | Exit |
|---|---|---|
| **R0** | Spec v0.3 + decision-log entry | Coach GO |
| **R1** | Schema (incl. `member_habit_plans` per §18) + create from Journal type + list | CRUD draft |
| **R2** | Gather + process report + bounded deviations + book performance collapsed with sample banner (§6.1–6.3, §6.6) | Evidence curl + UI |
| **R3** | Integrity + normalized comparison with `comparable` flag (§6.2, §7) | Maiden vs subsequent, incl. a deliberately mismatched-window case |
| **R4** | Carry-forward (§6.0) + habit plan cap (§18) | Requires R1 plans; second-retro walkthrough |
| **R5** | Agent analyze with anchoring + symmetry validation (§8) | Optional path; fail loud; rejection cases proven |
| **R6** | What worked + expected vs actual (§6.4, §6.5) | Honest empty states proven |
| **R7** | Journey milestone + `retrospective` meter un-`soon` | Delta gate |

R6 may merge into R2 if the pre-market join is cheap. §6.4's adverse-conditions row
requires the P&L join and should not block R2 if it is not.

---

## 20. Verification additions (amends v0.2 §14)

Carry v0.2 §14 items 1–7 unchanged, and add:

8. Workspace with prior retro renders **carry-forward above all report sections**.
9. Book performance renders **collapsed** on first open; expansion preference persists.
10. Window with < `MIN_INFERENCE_N` trades: sample banner present, no trend language
    anywhere in the outcome section, no outcome-corroborated hypotheses returned.
11. Comparison across a 21-day and a 63-day window: `comparable=false` on rate metrics,
    delta and arrows suppressed, both windows labelled in the heading.
12. Agent output containing a hypothesis with empty `anchors` is **rejected at the
    boundary** with a reason (fail loud), not rendered with a warning.
13. Agent output with concerns and no `what_worked`, where qualifying data exists, fails
    validation.
14. Third habit plan activation returns 409; cap holds under concurrent requests.
15. No section of the rendered retrospective contains a profit claim or forward-looking
    return statement — copy sweep, Tango + Hotel sign-off.

---

## 21. Open decisions (supersedes v0.2 §15)

Carried from v0.2 and still open:

1. Exact `practice_epoch` priority list when no fills or entries exist.
2. Agent provider (Labs agent principal vs Vexy gateway) — product boundary is HTTP-only to MSC.

**Resolved by v0.3:**

- v0.2 §15.2 (P&L hidden until expanded) → **resolved: collapsed by default**, §6.6.
- v0.2 §15.4 (max concurrent drafts) → **resolved: 1**, unchanged from v0.2 §4.3.

**New, requires a named gate:**

3. **`MIN_INFERENCE_N` value.** Recommend 20 trades. **Hotel** owns this — it is a
   trading-accuracy claim about when a sample says anything, and the number should be
   defensible rather than round.
4. **Cost-of-deviation / adherence counterfactual.** Comparing outcomes on trades tagged
   `broke` against trades tagged `followed` is the single most persuasive artifact
   available to a solo trader and is fully derivable from existing Trade Log data.
   It is also one framing away from an implied profit claim. **Not in v0.3 scope.**
   Requires **Hotel** (is the comparison statistically honest at member sample sizes?)
   and **Tango** (does "cost of deviation" survive contact with a member who is already
   demoralized?) before it is specified at all.
5. **Verbatim `pre_market` quoting in §6.5.** Confirm no path exists by which a quoted
   passage reaches any surface outside Family B — including agent prompt logs. **Mike.**

---

## 22. Decision-log entry (ready to land, `Architecture/00-decision-log.md`)

> **Journal Retrospective v0.3 — process-first ordering, comparison normalization,
> agent hypothesis anchoring, habit plan cap.**
> Amends v0.2 §6, §7, §8. (1) Report renders process first; book performance last and
> collapsed by default, with a sample-size banner below `MIN_INFERENCE_N` — resolves
> v0.2 open decision §15.2. (2) All cross-window comparisons normalized to rates with
> displayed denominators and a `comparable` flag; deltas suppressed on non-comparable
> pairs — v0.2 compared raw aggregates across variable-length windows, which was
> arithmetically misleading. (3) Agent root-cause hypotheses must cite a process,
> adherence, or journal anchor; P&L may corroborate but never originate, and
> outcome-corroborated hypotheses are suppressed below `MIN_INFERENCE_N`. (4) Carry-forward
> of prior habit plans becomes the opening section; active plans capped at 2, enforced at
> the API with a fail-loud 409. (5) Adds "what worked" (mandatory agent output) and
> "expected vs actual" (pre-market intent vs executed behaviour). Cost-of-deviation
> counterfactual explicitly deferred pending Hotel and Tango.
> No profit claims introduced. Family B isolation unchanged. Implementation not begun.
