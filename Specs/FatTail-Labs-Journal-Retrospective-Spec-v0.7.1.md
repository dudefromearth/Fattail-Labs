# FatTail Labs — Journal Retrospective Spec v0.7.1

**Status:** **BUILD AUTHORITY** — Coach **GO** 2026-07-30 · board
`agents/p-retrospective-v07/` · **DL-163**.  
**Revision:** v0.7.1 incorporates evaluation + cross-review locks (entitlement wording, ceremony anti-wizard, indicator contexts, routine day, keep-rate integrity, notification channel, lexicon mapping).

**2026-08-14 interface amendment — ACCEPTED (Coach GO 2026-08-14 · DL-335).** §6.3 is
Coach text, binding on every seat. Side-by-side vs the two reference images is the
acceptance test; Coach is the judge.

**2026-08-14 Coach — period brief at start.** Gather compiles the window since the last
review into a **standard infographic** (`period_brief`) — same tiles for every member
(journal days, trades, plan-followed, live, lessons, last fix, journal clips). Process
counts, not a P&L scoreboard. The ceremony map below still walks the nine steps.
Normative home: [`FatTail-Labs-Member-AI-Memory-and-Period-Brief-Spec-v1.0.md`](./FatTail-Labs-Member-AI-Memory-and-Period-Brief-Spec-v1.0.md) (IN REVIEW).

**2026-08-14 Phase 0 — Retrospective reimagined (DL-343).** The nine-step ceremony is
**dead** as chrome and as Coach conduct. Data law and the four questions survive.
Experience is open. Capture: [`FatTail-Labs-Retrospective-Reimagined-Spec-v0.1.md`](./FatTail-Labs-Retrospective-Reimagined-Spec-v0.1.md).

**Supersession, precisely.** v0.7 supersedes the **product frame** of v0.6 — a report that is read
becomes a ceremony that is walked. **v0.6 remains as-built and authoritative for shipped APIs and
behavior until the R-phases land** (§18). Its mechanics largely survive: create/list/gather/complete,
Option C scope, the dual report DTO, habit plans, analyzer guardrails, journey scores, closure
preview, and the Journal Session close hook are substrate, not targets.

**Family:** B (member-private)

**Entitlement:** **no differential gate among paid roles.** Observer, Activator, and Navigator have
identical Practice access — Observer is a paid six-week trial differing in term, not in features.
This is not free access: as-built, create requires admin, activator+, or an active `observer-trial`
plan. There is no free tier.

**Parents.**

| Doc | Cite for |
|---|---|
| Journal Retrospective **v0.6** | As-built lifecycle, gather/complete, report DTO, habit plans |
| Journal Session **v0.6** | Pre-open sourcing, one conversation per date, closure hook, routine signal (§12.2) |
| Tag Manager **v0.3** | Lexicon, Behavior category, assign-only model |
| Journey Experience **v1.0** | Meters, grades, tenure, §4.1a cadence meter, §4.4 profiles |
| Practice Portability **v1.2** | Export and purge obligations for new columns |
| Gamification **v1.0** | Derived scores, no second progress store |

> **Version note:** v0.6 is not in this advisor context. Section-level citations must be verified by
> India before GO.

> **Filename lineage:** this document continues `FatTail-Labs-Journal-Retrospective-Spec`. Do not
> fork a second `Retrospective-Spec` lineage.

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

### 5.1 Start readiness — minimum days or trades (Coach 2026-08-13)

A retrospective is **recommended** when the prospective window (same bounds as §5) has:

- at least **7 calendar days** since `scope_start`, **or**
- at least **5 trades** (`exec_at` in that window; same half-open rule as gather).

These are **minimums**. Anything over either floor is enough — start the review. Under both floors,
the library and the start confirm show a **gentle notice** naming the days and trades in hand and
the recommended floors. The member may **override** and start anyway. Create and gather **must not**
403 or 409 on a thin window.

This is not cadence (§4) and it does not change Option C. Cadence still says how often to review;
this only says when there is enough material to make the ceremony worth walking. Trader-selected
floors (cadence as the day minimum; a chosen trade floor) may replace the 7 / 5 constants later —
until then the constants are product law.

Copy is invitational, never shame. “This period is still thin” / “Start anyway” — not “too early”
or “not enough to deserve a review.”

### 5.2 Historical cadence — facts from completed reviews (Coach 2026-08-13)

The start surface also shows the trader’s **own completed-review averages**: mean calendar days
and mean trade count across **non-maiden** completed retrospectives.

- **Derived on read** from `member_retrospectives` (scope + stamped `report` trade count). No
  second progress store.
- **Maiden is excluded** from the average. A first look-back is a baseline, often months long —
  folding it in would make “your usual cadence” a lie. Maiden span is stated separately until a
  second review exists.
- **One completed cycle:** “Your last review was N days and M trades.”
- **Two or more:** “Your past reviews averaged N days and M trades (K reviews).”
- Fact only. Never “you are behind your usual,” never a due date, never a new start gate.
  Averages do not change the §5.1 floors.

*Gate: **Tango**, **India**.*

### 5.3 Journal captures; Retrospective compiles (Coach 2026-08-13)

The four questions are asked **in Journal** during the week (pre-market / post-session /
soft beats). Retrospective **does not re-ask the week**. It compiles what the trader already
wrote — said, in the way, worked, open threads — then the only required write is **the fix**
(one checkable thing). Optional note if the journal missed something.

Tiles remain look-up for inventory (patterns, book). They are not a second form.

*Gate: **Tango**.*

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

### 6.1 Walked, but not a wizard

Nine steps behind nine Next buttons is **worse** than the report it replaces, especially for a trader
on their twentieth run.

> Sections in **fixed order**, **all present** — with explicit "nothing here" where a step is empty —
> and the **current step focused**.

Walkable for a beginner who needs the sequence; skimmable for a veteran who knows it. Not a linear
multi-page modal, and never a form that withholds the next section until the previous one is
answered.

*Gate: **Echo**.*

*Gate: **Tango**, **Echo**.*

### 6.3 Interface floor — binding on every seat (Coach 2026-08-14)

**Status:** **ACCEPTED** (Coach GO 2026-08-14 · DL-335). Coach text below is not shortened,
paraphrased, or “improved.”

**Applies to:** Journal and Retrospective member surfaces that this spec (and the Journal
Session parent) own — conversation thread, composer, ceremony chrome. Binding on every
seat. Echo gates. Coach judges.

**Reference images (floor).** Filed 2026-08-14 from Coach’s Pictures. They are the floor,
not mood-board inspiration. Echo may not close a visual gate without both files present.

| File | What it is (as-filed, not a rewrite of Coach law) |
|------|---------------------------------------------------|
| [`Specs/references/journal-retro-v0.7.1/ref1.png`](./references/journal-retro-v0.7.1/ref1.png) | Composer / entry window (Claude-desktop-grade field, send, attach, voice). |
| [`Specs/references/journal-retro-v0.7.1/ref2.jpg`](./references/journal-retro-v0.7.1/ref2.jpg) | Thread / bubbles (iMessage-grade incoming and outgoing, type, timestamps). Supplied as `ref2.jpg`, not `.png`. |

> **Coach (verbatim):**
>
> The two reference images are the FLOOR, not the inspiration. I will
> put the built surface next to those screenshots. If it looks like a
> compromise — thinner bubbles, weaker type, a flatter composer, missing
> polish — it FAILS, regardless of working code behind it.
>
> "Less work" and "more efficient" are never reasons to deviate from the
> reference. If something in the reference is genuinely hard, you STOP
> and tell me it's hard — you do not quietly ship the easy version.
>
> Every part of this surface must feel inviting, warm, and ready to work:
> bold bubbles, an entry window to die for, type that speaks, focus
> states that respond, motion that feels like a message arriving. Echo
> gates against the screenshots pixel-for-pixel intent. The side-by-side
> IS the acceptance test, and I am the judge.
>
> The standard for these interfaces is Apple sophistication with Apple HIG
> throughout — craft, restraint, depth, motion — combined with the
> intelligence of the Claude Desktop UI: surfaces that understand context,
> anticipate the next action, grow with the input, and put controls where
> the work is. Echo gates the first against the HIG and the references;
> the second is judged in use — does the surface feel like it's thinking
> with you. Both are the floor.

**What this does to seats (if Coach accepts):**

| Seat | Binding |
|------|---------|
| **Echo** | Visual gate is a side-by-side vs the two references **and** Apple HIG (craft, restraint, depth, motion). Compromise look = FAIL even if Charlie’s code is correct. Claude Desktop intelligence — context, next action, grow-with-input, controls at the work — is judged **in use**. Both are the floor. |
| **Charlie** | Implements to the floor. May not thin, flatten, or skip polish to save work. |
| **Juliet / any executor** | Hard work → **STOP and tell Coach**. Quiet easy version is a doctrine violation. |
| **Delta** | A visual FAIL from Echo or Coach blocks ship. Working API is not enough. |
| **Tango** | Warmth and invite are member-psychology, not decoration — still no profit claims. |

**Not a reason to deviate:** “less work,” “more efficient,” “good enough,” “we can polish later.”

---

## 7. The indicator

> Like blood pressure. It makes you look. It does not tell you why, and it does not tell you what to
> do.

**It uses the meters that already exist.** No second score, no retro-specific grade — Journey's
meters and grade, scoped to the period. A separate instrument would become a second progress store
and the two would eventually disagree.

**One instrument, two contexts, never one frame.** The ceremony shows **period-scoped** readings,
because a ceremony reviews a period. Journey keeps its **rolling** windows, because that is an
ongoing health view. Each is labeled in its own surface, and the two are **never rendered side by
side** — 82% period beside 71% rolling produces "which one is real?", and there is no good answer.
Dual display makes the confusion visible instead of resolving it.

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

### 8.1a The lexicon structures the ceremony

The four tag categories map onto the ceremony's own steps. That is not a coincidence worth ignoring
— it means the review can be organized in **the trader's own vocabulary** rather than in
system-derived buckets.

| Category | Ceremony step |
|---|---|
| **Behavior** | Step 3 — what I encountered |
| **Context** | Step 4 — conditions the obstacles clustered against |
| **Process** | Step 2 — adherence, and Step 8 — what I commit to |
| **Insight** | Step 6 — what worked, and forward into carry-forward |

**Context tags are underused and shouldn't be.** A trader who labels *FOMC day*, *high VIX*, or *low
liquidity* has supplied the external conditions themselves — so "your deviations clustered on the
days you marked FOMC" is co-occurrence between two things they wrote, with no market-regime inference
by the system at all. That is strictly better than deriving conditions, and it is honest in a way
derivation cannot be.

**Insight tags feed step 6 and carry-forward.** Entries the trader marked *lesson learned* or *bias
spotted* are the candidates for what worked and what continues.

### 8.1b Tags never feed the score

**Tag frequency informs the ceremony's content. It never feeds the indicator, a meter, or a grade.**

If it did, the cheapest way for a trader to improve their number would be to stop tagging — which
would destroy the emotional instrument (§8.1) and the honest record at the same time. The same rule
blocks a habit plan whose target is *"apply the impatience tag less often"*: the commitment must be
about conduct, not about labeling.

This is the one place where the tag system and the measurement system must stay strictly separate.

*Gate: **India**, **Hotel**.*

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

### 11.1 The keep rate has a conflict of interest

Serving as both the member's gauge and the product's evaluation metric creates a shared incentive
for the number to rise — and the cheapest way to raise it is **easier commitments**. "Be more
mindful" is kept every period; "no entries in the first fifteen minutes" is not. A rising keep rate
can therefore mean the practice is **degrading**, while looking like success on both sides.

The specificity press in §10 is a necessary defense and is not a sufficient one. Three rules:

1. **Member-facing keep rate is fact, never score.** "Held 8 of 9 trading days." Never a percentage
   with a grade band, never "your keep rate is strong."
2. **Keep rate is read alongside a specificity trend, or not at all.** Product evaluation and any
   internal view take the pair or refuse the series — the number is uninterpretable alone.
3. Hotel and Tango define what measurable specificity looks like: commitment language that can be
   checked against a period, versus language that cannot.

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

### 12.2 Routine day — definition (amends Journal Session)

Journal Session v0.6 made a session **one conversation per date**, which breaks the naive routine
count. A trader who opens Monday's conversation and adds notes on Wednesday and Thursday scores
**one** routine day if the count keys on `session_started_at` — because Wednesday's and Thursday's
messages are `later_day` entries inside Monday's session. That undercounts precisely the behavior
the meter is meant to reward.

> A **routine day** is a local calendar day (America/New_York) on which the member **authored at
> least one message**, counted by that message's own timestamp, independent of the session's
> `journal_date`.

Member-authored only; agent turns do not make a routine day.

**This is an amendment to Journal Session v0.6 and to Journey v1.0 §4.1**, not a definition local to
this document. It must land as one decision across all three, or the meter and the ceremony will
disagree. *India, with a Journal Session cross-link.*

### 12.1 Trends that carry weight

| Trend | Why it matters |
|---|---|
| **Commitment keep rate** | The gauge. Everything else supports it |
| **Avoidable-loss rate** — deviations per trade | The part the trader controls |
| **Routine consistency** — journal days, cadence adherence | Moves first. Practice loosens before performance does |
| **Recovery time** — cycles to return to baseline after a bad period | What actually separates traders who last, and only a longitudinal record can show it |
| **Tag frequency over periods** — in the trader's own words | "Impatience: 4 this period, 6 last, 9 before" is the practice tightening, said in their language rather than the system's. Reported, never scored (§8.1b) |

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

**Tags are the join key for both layers**, which is why the lexicon's Behavior terms have to be words
a trader reaches for in the moment. A term nobody applies produces no correlation, and a term applied
loosely produces a misleading one.

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
trader into reflection while exposed is the same error as an agent interrupting intraday. Where the
open-position check is unavailable for a given book, it **fails soft** — the notification is
suppressed or sent without that qualifier, and never blocks on an incomplete query.

**Channel is Family B policy, not a delivery detail.** Trade counts, deviation counts, and tag names
in a notification are Family B content **leaving the application boundary**. The spec must name
allowed channels — in-app only, or email with a defined payload — and what may appear in the copy.
An email reading "3 deviations, you named impatience twice" has placed member practice data in an
inbox and in a mail provider's logs.

Error paths must not leak either: a suppressed notification must not disclose position detail in a
log line or a fallback message.

*Mike owns channel policy before implementation (§18 R7).*

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

## 18. Build order

Substrate is rich. This is not greenfield — v0.6's mechanics hold and are reused.

| Phase | Intent |
|---|---|
| **R0** | Spec hygiene, parent citation verification, Coach locks on §20 items 1, 2, 3, 5, 9, 10 |
| **R1** | Schema: cadence setting, forward-only history, retro columns |
| **R2** | Ceremony surface: fixed-order sections, "nothing here", book last, focused step (§6.1) |
| **R3** | Indicator from Journey meters, period-scoped, steady state, threshold decline |
| **R4** | Emotion mirror — Behavior tags and journal words |
| **R5** | Clustering, rate-normalized trends, correlation surfaces |
| **R6** | Interruption notice and forward-only cadence |
| **R7** | Notification: material-based, once per period, channel policy |
| **R8** | Sequence agent, versioned prompt per retrospective |
| **R9** | Export and purge for new columns, characterization suite, Delta program gate |

**Critical path:** R0 → R1 → R2 → R6 → R9. R3–R5, R7, R8 parallelize after R1.

The routine-day amendment (§12.2) lands with **R1** and requires the Journal Session and Journey
changes in the same body of work — documentation parity, not a follow-up.

---

## 18a. Verification

**Ceremony** — All nine steps render in order for every retrospective. A clean period renders the
same steps and states "nothing here" rather than omitting sections. Carry-forward is first;
book performance is last and collapsed by default.

**Cadence** — Cadence is read from the trader setting, not the meter profile. A cadence change does
not alter adherence for periods already elapsed. A missed period produces the §9 notice naming the
actual span.

**Start readiness** — Preview reports days and trades in the next window. Recommended when days ≥ 7
or trades ≥ 5. Below both, notice is present and overridable; create still succeeds.

**Historical cadence** — Preview `history` averages exclude maiden. One cycle states last review
facts; two or more state the mean and count. No start gate from the average.

**Indicator** — Uses Journey meters; no second score exists. Below the inference threshold it
declines to grade. "Steady" is reachable and renders on an unchanged period. Grep copy: no string
attributes a state or a trait to the person.

**Emotional content** — Every emotional statement traces to a trader-applied tag or trader-authored
text. Assert no system-generated emotional attribution reaches render.

**Tags** — Tag frequency appears in ceremony content and trends. Assert no tag count reaches any
meter, grade, or indicator input, and that a habit plan targeting tag application rather than conduct
is refused. Context tags drive clustering statements; no market-regime inference is derived by the
system.

**Corrective actions** — No agent turn proposes a corrective action. Third active habit plan is
refused. A vague commitment triggers a specificity prompt, and the trader's own wording is preserved.

**Baseline and trends** — No trend is asserted below the cycle floor. All comparisons are rate-based;
a three-week period against a one-week period is normalized or flagged incomparable.

**Correlation** — No surface correlates behavior with P&L, win rate, or expectancy. Behavior-to-
deviation and rule-following-versus-rule-breaking comparisons are present.

**Notification** — Fires once per period. Contains material, not a due date. Never during market
hours. Never a second time. An unavailable open-position check suppresses or degrades the message
rather than blocking it, and no error path emits position detail. Payload contents match the
approved channel policy.

**Indicator contexts** — Period-scoped readings render in the ceremony; rolling readings render in
Journey; assert the two never appear in one frame or one response payload.

**Routine day** — A session opened Monday with member messages on Wednesday and Thursday counts
**three** routine days, not one. Agent turns produce none.

**Keep rate** — Member-facing rendering is a fact count with no percentage and no grade band. Any
internal series exposing keep rate also exposes the specificity trend.

**Ceremony chrome** — All sections present in fixed order with "nothing here" stubs; no section is
withheld pending an answer to a previous one; no Next-button pagination.

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
| **Echo** | Ceremony as a walked sequence rather than a scrolled document. **§6.3:** side-by-side vs the two reference images **and** Apple HIG; Claude Desktop intelligence judged in use. Both are the floor. Coach is the judge. Compromise look = FAIL. |
| **Charlie** | Step-by-step surface |
| **Alpha** | Derivation, comparisons, normalization |
| **Sierra** | Nothing here reaches marketing surfaces |
| **Victor** | Via negativa framing of the practice (§3) |
| **Kilo** / **Delta** / **Lima** / **Juliet** | Tests, gates, decision log, board |

---

## 20. Open decisions

| # | Decision | Owner | GO 2026-07-30 |
|---|---|---|---|
| 1 | Where "the way" is written down | Coach + India | **LOCK interim:** habit plans + pre-open journal commitments; Playbook when Spec GO |
| 2 | Indicator window | India + Tango | **LOCKED:** one instrument, two contexts, never one frame (§7) |
| 3 | One vs per-strategy retros | Coach | **LOCKED:** one retrospective |
| 4 | Optimal-window mechanism | Coach + Tango | Deferred |
| 5 | Journey §4.1a period adherence | India + Tango | **LOCKED:** migrate forward-only; dual-read during transition |
| 6 | Inference threshold by pattern | Hotel | Keep global 20 until Hotel table |
| 7 | Trial final retro | Coach + Tango | Distinct copy only; same ceremony |
| 8 | Cost-of-deviation | Hotel + Tango | Deferred |
| 9 | Routine-day definition (§12.2) | India | **LOCKED:** member message local day |
| 10 | Keep-rate presentation (§11.1) | Coach + Tango + Hotel | **LOCKED:** fact only + specificity pairing |
| 11 | Notification channel (§14) | Mike | **LOCK interim:** in-app first; email only with Mike-approved payload |

---

## 21. Decision-log entry (approved GO — DL-163)

> **Journal Retrospective v0.7.1 — BUILD AUTHORITY (Coach GO 2026-07-30).** The retrospective is a
> ceremony, not a report: nine fixed-order sections (anti-wizard), carry-forward first, book last.
> Cadence is a trader setting (forward-only) with interruption notices. Indicator uses Journey meters
> only — period-scoped in ceremony, rolling in Journey, never side by side. Routine day counts member
> messages by local timestamp (amends Journal Session / Journey). Keep rate is member-facing fact only,
> paired with specificity for product evaluation. v0.6 remains as-built for shipped APIs until R-phases
> land. No profit claims. Family B isolation unchanged. Board `agents/p-retrospective-v07/`.

---

## 22. Document history

| Date | Note |
|------|------|
| 2026-07-30 | v0.7 DRAFT — ceremony frame |
| 2026-07-30 | **v0.7.1** — evaluation + cross-review locks; build order §18 |
| 2026-07-30 | **BUILD AUTHORITY** Coach GO · DL-163 · board p-retrospective-v07 · §20 locks 1–3,5,9–11 |
| 2026-08-13 | **§5.1 start readiness** — recommend at 7 days or 5 trades; thin window is a gentle overridable notice, never a create gate. DL-322. |
| 2026-08-13 | **§5.2 historical cadence** — derived avg days + avg trades from completed non-maiden retros; fact only. DL-323. |
| 2026-08-13 | **§5.3 Journal captures / Retro compiles** — ceremony surfaces journal_compile; fix is the write. DL-333 (pile filed this as DL-324; that number is VP fold on main). |
| 2026-08-14 | **§6.3 interface floor** — Coach amendment IN REVIEW. References are the floor; side-by-side is the acceptance test; Coach is the judge. Images filed: `ref1.png` (composer), `ref2.jpg` (thread). Added: Apple HIG sophistication + Claude Desktop intelligence; both are the floor. |
