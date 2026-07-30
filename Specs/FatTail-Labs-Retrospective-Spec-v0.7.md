# FatTail Labs — Retrospective Spec v0.7

**Status:** DRAFT — for bench review and Coach GO. Not build authority.
**Supersedes for product frame:** v0.6 as-built (report with a reflection field). The mechanics of
v0.6 largely survive; what changes is that the retrospective is a **ceremony that is walked**, not a
document that is read.
**Family:** B (member-private)
**Entitlement:** none. Every member holds Observer, Activator, or Navigator, and access is identical.

> **Version note:** v0.6 is not in this advisor context. Section-level citations to it must be
> verified by India before approval.

---

## 1. The retrospective in four questions

Everything below is implementation. This is the thing itself:

> 1. **What did I say I'd do?**
> 2. **Did I do it?**
> 3. **What got in the way?**
> 4. **What's the one thing for next time?**

Same four questions every period, whether the period was clean or a wreck. The procedure is what is
being taught — a trader who has run it fifteen times can run it without us, which is the point.

**The gauge is equally simple:**

> **Am I keeping the commitments I make to myself — more often now than three months ago?**

Everything else in this document supports those five sentences.

---

## 2. What it is, and what it is not

**It is** a standardized periodic procedure for encountering obstacles and working with them. A
ceremony with a beginning, a sequence, and an end. The culmination of everything since the last one.

| It is not | Because |
|---|---|
| A performance report | Performance is an output of practice, not the subject of the review |
| A P&L review with reflection attached | Process first; the book is last and collapsed |
| A diagnosis of the trader's state | The system holds up their words; the trader names what it was |
| Advice | Inventory, never prescription. A trader who only corrects when told has not learned to correct |
| A document | A process that is walked |
| Skippable | Cadence adherence is itself a process signal |
| A report card | It measures divergence from a practice, never the quality of a person |

---

## 3. The practice this measures

Stated once, because the ceremony has no referent without it.

1. **Trading involves fear.** Not the losses — the fear surrounding them.
2. **Fear has a cause: needing the outcome to go your way.** Chasing, revenge, oversizing, holding
   through pain, hesitation. Every one is fear wearing a different face.
3. **Fear can end. Risk cannot.** Avoidable loss can stop; loss cannot. This distinction is the
   product and it is the only promise made anywhere in this document.
4. **It ends through practice, not courage.** Structure removes the sources of fear. Nobody reads
   their way out.

Obstacles are therefore **expected**. A period with none is unexamined or quiet, not virtuous. Copy
throughout treats divergence as encountered and worked with, never as failed and corrected.

*Gate: **Hotel**, **Tango**, **Victor** (via negativa framing).*

---

## 4. Cadence

**Trader-configured, not tier-derived.** How often a trader should review depends on strategy,
process, and lifestyle. It has nothing to do with what they pay.

| Trading pattern | Cadence |
|---|---|
| Daily trading, 0DTE and similar | **Weekly** (default), two weeks at the outside |
| Longer-dated positions | Longer cycles, set by the trader |

`retro_cadence_days` moves from the meter profile to a trader setting. Membership tier drops out of
cadence entirely. *This changes shipped behavior — Journey §4.4 currently carries
`retro_horizon_days` on the profile. Decision-log entry required.*

**The system may show what their trade frequency suggests; it never sets it.** Suggestion is
capacity-side; silent adjustment is not.

**Cadence changes apply forward only.** Widening weekly to monthly must not retroactively convert
three missed weeks into one satisfied month.

**Missed periods.** When a period elapses with no completed retrospective, the next one covers
everything back to the last completion, and **says so plainly**: the cadence was interrupted, and
here is what this review now spans. That statement is required, not optional (§9).

*Gate: **Coach**, **India**, **Hotel**.*

---

## 5. Scope

```
scope_start = last completed retrospective's completed_at
scope_end   = now, at gather
```

Activity between a retrospective's `scope_end` and its `completed_at` falls into no review window.
Deliberate — a trader may legitimately trade while writing up the prior period, and forcing that
activity into either window imposes machine precision on a fluid human process. No coverage
indicator, no completeness score.

Completing a retrospective **closes the journal dates it reviewed** (Journal Session §7). That is
the audit: the record a review examined cannot be revised afterward.

---

## 6. The ceremony — fixed sequence

Same order, every period, regardless of what happened. Each step gets an answer or an explicit
"nothing here."

| # | Step | Source |
|---|---|---|
| 1 | **Commitments** — what I committed to last time, and what happened | Carry-forward (§11) |
| 2 | **Practice** — how the period went against my own routine | Indicator (§7) |
| 3 | **Obstacles** — what I encountered | Deviations and tags (§8) |
| 4 | **Where it clustered** | Co-occurrence (§8.2) |
| 5 | **What I name as the cause** | Trader-authored |
| 6 | **What worked** | Derived (§8.3) |
| 7 | **Expected versus actual** | Pre-open journal content (§8.4) |
| 8 | **The one thing** — my corrective action and habit plan | Trader-authored (§10) |
| 9 | **The book** — objective performance, collapsed by default | Last, always |

**Step 1 is first for a reason.** It is the only place the trader sees whether they changed
something, which is the entire payoff of doing this every week.

**Step 9 is last for a reason.** A trader who reads P&L first reads everything after it through that
lens. Process before outcome is not a preference; it is what makes the rest legible.

*Gate: **Tango**, **Echo**.*

---

## 7. The indicator

> Like blood pressure. It makes you look. It does not tell you why, and it does not tell you what to
> do.

**It uses the meters that already exist.** No second score, no retro-specific grade — Journey's
meters and grade, scoped to the period. A separate instrument would become a second progress store
and the two would eventually disagree.

**It reports the pattern, not the readings.** Journalling slipping, then routine, then adherence, is
not four numbers drifting — it is one practice loosening, visible in four places. Naming that is
observation and stays within the guardrails.

**It must be able to say steady.** An indicator that only ever speaks to report a drop trains the
trader to hear it as criticism and then to ignore it. "Nothing moved this period" is a valid and
frequent output.

**It says "not enough yet" below the inference threshold.** A weekly period for a longer-dated
trader may hold three trades. Three trades do not produce a grade.

**It measures conduct, never character.** "Three of your six meters are down from last month" is a
reading. "Your integrity is slipping" is a verdict about a person, and does not ship.

*Gate: **Tango** (copy), **India** (single instrument), **Hotel** (thresholds).*

---

## 8. What the period surfaces

### 8.1 Emotional content

**The trader's own language, mirrored back.** Never the system's inference.

> "You named impatience four times this period — three of them Tuesday and Wednesday."

That is a mirror. *"You were impatient this week"* is a diagnosis and is prohibited (§16).

Two honest sources: the tags they applied (the lexicon's **Behavior** category is emotional-
behavioral vocabulary by construction) and their own words in the journal. Nothing else.

This gives the lexicon a second job: it is now the emotional instrument, so its Behavior terms must
be words a trader actually reaches for in the moment. *Gate: **Hotel**, **Tango**.*

### 8.2 Obstacles and clustering

Bounded inventory of deviations, ranked by frequency then recency. Plus **co-occurrence**, stated as
observation and stopped there:

> "The deviations clustered on the two days following a skipped morning routine."

**The trader names the cause.** This is the highest-risk step in the ceremony — a wrong "why"
produces a corrective action aimed at the wrong thing, which becomes a habit plan, which gets
audited next period. The error compounds through the entire chain.

### 8.3 What worked

Derived deterministically, not agent-generated. Solution-focused review is not decoration: studying
what worked is how a practice consolidates.

### 8.4 Expected versus actual

Draws only on **pre-open, member-authored** journal content for each date (Journal Session §4).
Content written after the outcome was known is recollection and flows to reflection instead. This is
the structural defense against resulting.

---

## 9. The interruption notice

When the period was missed, the retrospective states it before anything else:

> Your cadence was interrupted — no review completed for the week of 14 July. This one covers
> **8–25 July**, three weeks instead of one.

Required because comparison across unequal windows is otherwise silently wrong (§12), and because
cadence adherence carries weight in the indicator. A trader marked down for a lapse they were never
told about will read the meter as arbitrary.

Not remedial in tone. Stated, not scolded.

---

## 10. Corrective actions and habit plans

**The system supplies inventory. The trader supplies the correction.**

Permitted: here are the rules you diverged from, ranked; here is where they clustered; here is what
you named as the cause.

Prohibited: what to do about it.

**The agent's job is to make the trader's own commitment checkable.** "Be more patient" is not a
corrective action. "No entries in the first fifteen minutes" is. Pressing for specificity is not
prescription — it changes the form of their commitment, never its content.

**Maximum two active habit plans.** Existing cap, and it is a feature rather than a limit: one
target behavior at a time is why behavior change works. The funnel narrows deliberately — many
observations, a few corrective actions, at most two commitments.

*Gate: **Tango**, **Hotel**.*

---

## 11. Carry-forward — the loop closing

The first section of every retrospective, and the most important one in the document.

| Prior commitment | Outcome |
|---|---|
| "No entries in the first fifteen minutes" | Held 8 of 9 trading days |

**This is the gauge (§1) made visible.** Of the commitments taken on, what fraction held — this
period, and across all periods.

It is also how the product is evaluated: commitments made and quietly abandoned every period mean
the ceremony is producing intentions rather than change. That is a signal about the retrospective,
not about the trader.

Absent for a maiden retrospective. A placeholder otherwise, never omitted.

---

## 12. Baseline, normalization, trends

**Baseline first.** The opening cycles establish it. Nothing is compared until there is something to
compare to, and the honest output during that stretch is "building your baseline" — not a grade on
three trades.

**Normalize before comparing.** A week with three trades and a week with forty are not comparable on
counts. Rates only: deviations per trade, journal days per trading day, commitments held per
commitment made. A three-week period compared against a one-week period on raw counts is measuring
activity, not practice.

**Trends need a floor.** Two periods is a difference, not a trend. Direction becomes readable at
roughly **four to six cycles**; below that the retrospective does not assert one.

**Compare to a comparable prior period**, not strictly the previous one, and name which in the
heading.

### 12.1 Trends that carry weight

| Trend | Why it matters |
|---|---|
| **Commitment keep rate** | The gauge. Everything else supports it |
| **Avoidable-loss rate** — deviations per trade | The part the trader controls |
| **Routine consistency** — journal days, cadence adherence | Moves first. Practice loosens before performance does |
| **Recovery time** — cycles to return to baseline after a bad period | What actually separates traders who last, and only a longitudinal record can show it |

Recovery time is worth building for: "you used to take four weeks to return to baseline, now you
take one" is the clearest evidence a practice is working that can be put in front of a trader — and
it is not a performance claim.

---

## 13. Correlation

**Correlate behavior to avoidable loss. Never to P&L.**

Weekly periods give roughly fifty observations a year against a signal that is mostly noise. A
trader told to expect "process produces money" and shown nothing within months concludes process
does not matter — the abandonment this product exists to prevent, manufactured by its own reporting.

Two layers, both detectable within a handful of cycles because both sides are things the trader did:

**Behavior to process.** Did skipping the morning routine coincide with more rule breaks? Did the
late-journal days carry more deviations?

**Behavior to damage.** Do trades tagged *chased* or *revenge* lose more than trades that followed
the plan? A within-their-own-data comparison of rule-following against rule-breaking trades. This
makes the case for process better than any aggregate ever will.

Long-run performance answers itself once the bleeding stops. It is the byproduct, never the metric.

*Gate: **Hotel**, **Sierra** (nothing here reaches marketing), **Tango**.*

---

## 14. Notification

**Material-based, not chore-based.**

> Your week is ready — 14 trades, 3 deviations, you named impatience twice.

Not "your retrospective is due." A chore reminder gets tuned out after three, and a tuned-out
reminder is worse than none because the ignore has been trained. A preview of what they would find
recruits curiosity and makes the ceremony feel like something already waiting rather than work to be
started from nothing.

**Once per period.** A second reminder is pressure, and pressure produces a retrospective completed
carelessly to stop the pinging — which corrupts the record being built.

**Timing may be suggested on the basis of material availability, never trader state.** "Your week is
complete and the material is ready" is checkable. "Now would be a good time for you" claims
knowledge of the trader that the system does not have, and gets uncomfortable the first time it is
wrong.

**Never during market hours, and never with open positions** where that is knowable. Pulling a
trader into reflection while exposed is the same error as an agent interrupting intraday.

**If an optimal window is offered, the window and the cadence meter must share one definition of
on-time.** Encouraging a trader into a three-day window and then marking them for using it is the
kind of contradiction that destroys trust in the meter. *Open decision (§20).*

*Gate: **Tango**, **Hotel**.*

---

## 15. Three relationships to the practice

Relationships, not tiers. A Navigator can be a beginner on a new strategy. The system knows tenure
and cadence adherence, which is most of what distinguishes them — it should describe the
relationship rather than infer it from what someone paid.

**Beginning.** No baseline yet, so nothing to diverge from. Early ceremonies build the reference
point: here is what you did, here is the vocabulary for it, here is the shape of your week. The
compass framing arrives around cycle three or four.

The failure mode: a trial member with three trades receives an empty retrospective and concludes the
product is hollow — in the week they are deciding. **The journal and emotional content carry the
early ceremonies**, because a trader always has decisions and states to review even when they barely
have trades. Thin statistics must not mean an empty ceremony.

**Returning.** Has history and has drifted. The record is the asset — this is what your practice
looked like in March. Framing is return, not failure. Someone who knows what good looks like and is
not doing it supplies their own shame; the system's job is to add none.

**Consolidating.** The risk is rote — running the form perfectly while attention left years ago. The
answer is finer discrimination: what was invisible at month one is a deviation at year two. That is
the **vocabulary** deepening, not the ceremony changing, and it argues for the lexicon growing over
time rather than staying at the seed set.

*Gate: **Tango**.*

---

## 16. The agent

**It holds the sequence.** It does not interpret, diagnose, or prescribe. It ensures the steps happen
in order and that each gets an answer or an explicit "nothing here." That is a job a model does
reliably and where the guardrails do not fight the purpose.

**It does the assembly. The trader does the judgment.** Trades, tags, deviations, carry-forward, and
comparisons are pulled and waiting so nothing has to be gathered. Easy to complete because the
material is ready — never because the thinking is done.

> If a trader can complete a retrospective without thinking, the ceremony is decorative.

**Guardrails, enforced in code before any turn renders** — the same set as the Journal agent:

Never names a motive or emotion · never asserts a market fact the trader did not state · never gives
advice or says what should have been done · never evaluates, praises, or blames · gives losses no
more attention than wins · never states a P&L figure in the process sections · never mentions grade,
meter, or streak while the trader is answering · never fills a field left empty · one question per
turn.

**Prompt is admin-editable and versioned**, with each retrospective recording the version that
produced it. Prohibitions live in code and are not editable from admin.

*Gate: **Hotel**, **Tango**, **Mike**.*

---

## 17. Schema additions

```
identities
  retro_cadence_days              -- trader setting; NULL = default by trading pattern

member_retro_cadence_history      -- forward-only enforcement (§4)
  identity_id, cadence_days, effective_from, created_at

member_retrospectives
  + prompt_version_id
  + cadence_days_at_period         -- the cadence in force, for honest historical adherence
  + period_index                   -- ordinal, for baseline and trend floors
  + interrupted (bool)             -- drove the §9 notice
```

Period accounting is **derived**, not materialized — Gamification §1 criterion 4 bans a second
progress store, and `journey_scores.py` derives on read.

*Gate: **India**, **Alpha**.*

---

## 18. Verification

**Ceremony** — All nine steps render in order for every retrospective. A clean period renders the
same steps and states "nothing here" rather than omitting sections. Carry-forward is first;
book performance is last and collapsed by default.

**Cadence** — Cadence is read from the trader setting, not the meter profile. A cadence change does
not alter adherence for periods already elapsed. A missed period produces the §9 notice naming the
actual span.

**Indicator** — Uses Journey meters; no second score exists. Below the inference threshold it
declines to grade. "Steady" is reachable and renders on an unchanged period. Grep copy: no string
attributes a state or a trait to the person.

**Emotional content** — Every emotional statement traces to a trader-applied tag or trader-authored
text. Assert no system-generated emotional attribution reaches render.

**Corrective actions** — No agent turn proposes a corrective action. Third active habit plan is
refused. A vague commitment triggers a specificity prompt, and the trader's own wording is preserved.

**Baseline and trends** — No trend is asserted below the cycle floor. All comparisons are rate-based;
a three-week period against a one-week period is normalized or flagged incomparable.

**Correlation** — No surface correlates behavior with P&L, win rate, or expectancy. Behavior-to-
deviation and rule-following-versus-rule-breaking comparisons are present.

**Notification** — Fires once per period. Contains material, not a due date. Never during market
hours. Never a second time.

**Agent** — Guardrail violations blocked before render and logged. Retrospective records its prompt
version.

*Gate: **Kilo**, **Delta**.*

---

## 19. Review gates

| Agent | Reviews |
|---|---|
| **Hotel** | Cadence by strategy, inference thresholds, correlation honesty, lexicon Behavior terms |
| **Tango** | Every member-facing string, the indicator's tone, return-without-shame, notification copy |
| **India** | Single instrument, cadence storage and forward-only history, derived period accounting |
| **Mike** | Family B, prompt-edit authority |
| **Echo** | Ceremony as a walked sequence rather than a scrolled document |
| **Charlie** | Step-by-step surface |
| **Alpha** | Derivation, comparisons, normalization |
| **Sierra** | Nothing here reaches marketing surfaces |
| **Victor** | Via negativa framing of the practice (§3) |
| **Kilo** / **Delta** / **Lima** / **Juliet** | Tests, gates, decision log, board |

---

## 20. Open decisions

| # | Decision | Owner |
|---|---|---|
| 1 | Where "the way" is written down — a trader's own rules need to exist explicitly before divergence has a referent. Probably the Playbook. **This is load-bearing for the whole document** | Coach + India |
| 2 | Indicator window: rolling (as Journey's meters are) or period-scoped (as a ceremony wants) | India + Tango |
| 3 | One retrospective covering all strategies, or per-strategy retrospectives for a trader running two rhythms. Recommend one — process integrity is a property of the trader | Coach |
| 4 | Optimal-window mechanism, and whether window and cadence meter share one on-time definition (§14) | Coach + Tango |
| 5 | Replacing days-since decay with period adherence in Journey §4.1a — shipped behavior | India + Tango |
| 6 | Exact inference threshold per trading pattern (currently one global value) | Hotel |
| 7 | Whether the trial's final retrospective gets distinct treatment as the conversion moment | Coach + Tango |
| 8 | Cost-of-deviation counterfactual — deferred from v0.4, still deferred | Hotel + Tango |

---

## 21. Decision-log entry (draft, on approval)

> **The retrospective is a ceremony, not a report.** Four questions — what did I say I'd do, did I do
> it, what got in the way, what is the one thing for next time — walked in a fixed nine-step sequence
> every period regardless of what happened, with carry-forward first and book performance last and
> collapsed. Cadence is a trader setting keyed on strategy and process rather than membership tier,
> defaulting to weekly for daily traders, applying forward only, and producing a stated interruption
> notice when a period is missed. The indicator uses Journey's existing meters scoped to the period —
> no second score — reports the pattern rather than the readings, can report steady, declines to grade
> below the inference threshold, and measures conduct never character. Emotional content is the
> trader's own tags and words mirrored back, never system inference. The system supplies inventory and
> co-occurrence; the trader names the cause and authors the corrective action, capped at two active
> habit plans, audited by name in the next carry-forward. Comparisons are rate-normalized against a
> comparable prior period, no trend is asserted below four to six cycles, and behavior is correlated
> to avoidable loss and never to P&L. Notification is material-based, fires once, and never during
> market hours. The agent holds the sequence and assembles the material; it does not interpret,
> diagnose, or prescribe, and its prohibitions are enforced in code while its prompt is admin-editable
> and versioned per retrospective. Supersedes the v0.6 product frame. No profit claims. Family B
> isolation unchanged.
