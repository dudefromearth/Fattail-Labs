# FatTail Labs — Journal Session Spec v0.4

**Status:** **SUPERSEDED** by [`FatTail-Labs-Journal-Session-Spec-v0.4a.md`](./FatTail-Labs-Journal-Session-Spec-v0.4a.md)
for product draft authority. Do not use v0.4 for GO or implementation.
**Historical:** DRAFT intermediate; v0.4a absorbs review recommendations.
**Supersedes (when current):** v0.3 (day-sealed sessions), v0.2 (structured form primary, interview-gated),
v0.1 (advisor draft).
**Family:** B (member-private)
**Entitlement:** none. Every member holds Observer, Activator, or Navigator; access to the
Journal is identical across all three. Observer is a **paid six-week trial**, not a free or
reduced tier — it differs from Navigator only in membership term. There is no plan check
anywhere in this spec.

**Why v0.4 — one sealing mechanism.** A journal session **stays open until a retrospective
covering its date has been created and completed.** That completion is the only thing that
seals it.

v0.3 sealed sessions at the end of the day *and* closed dates on retrospective completion —
two mechanisms doing one job, which produced the partial-record concept, a leave warning that
implied lost access, and a member locked out of their own conversation while it was still the
current period. v0.4 removes the first mechanism entirely.

What makes this safe is that **phase already prevents hindsight contamination** (§8). A session
open for a week accumulates turns stamped `pre_open`, `intraday`, `post_close`, `later_day`;
Retrospective §6.5 reads only `pre_open` member turns for that date. Keeping a session open
adds no route by which a member's stated intent can be revised after the outcome is known.
Sealing was never what protected that.

It also restores the follow-up behavior asked for early on: a member can return to a date's
conversation and continue it, for as long as that date has not been reviewed.

**Carried unchanged from v0.3.** Chat is the primary, always-available surface; the structured
interview is an optional member-invoked add-on; tags are multi-valued context that no logic
reads; phase is the gate.

**Parent references.** Retrospective **v0.6** is the as-built head; cite it for lifecycle,
render order, and inference gates. Journey Experience **v1.0** contains §4.1a (retrospective
cadence meter, R7 shipped) and §4.4 (meter profiles with `retro_horizon_days`). Practice
Portability **v1.1** is BUILD AUTHORITY and governs journal export/import shape (§15).
Gamification **v1.0** governs derived-score rules and week keying.

---

## 1. Intent

The Journal is a **conversation with an agent**. The member opens it and talks. The
conversation is the record.

The agent's job is to make that record **falsifiable** — to notice when a plan has no level,
no size, or no condition that would prove it wrong, and to ask. It is not to run a
questionnaire. A blank field permits "watching for a bounce, feeling good about the setup," a
sentence that can never be checked against what happened. An interlocutor can ask where.

Secondary: capture evidence (screenshots) at decision time, and feed carry-forward and open
threads into Retrospective v0.4 §6.0.

---

## 2. The primacy rule

| Surface | Status |
|---|---|
| **Agent chat** | **Primary. Always available.** Every journal entry is a chat session |
| Structured interview | **Optional add-on.** Member may invoke it; never required, never automatic |
| Plain text entry | Available. A member who types without engaging the agent still has a journal entry |

Nothing in this spec may make the chat conditional on tag selection, field completion,
interview completion, or agent availability. If the agent is unreachable, the member still
journals (§9.2).

**What this rules out**, all of which appeared in v0.1/v0.2 and are now void: tag selection as
a precondition, script-driven turn sequences, interview depth budgets, required-field gates,
and the structured record as mandatory output.

---

## 3. As-built (do not re-found)

| Today on `main` | v0.3 target |
|---|---|
| Calendar + Trade Log day-book | Unchanged shell; sessions attach to the calendar date |
| Free-text `member_tool_notes` (`journal`, `pre_market` surfaces) | Migrate to session model; dual-read until Lima records cutover |
| No agent chat | Chat is slice J1 — first, not last |
| No date closure | Closure on retrospective complete (§12) |
| Export: notes only (Practice Export) | Export sessions, messages, structured (§14) |

**Migration rule:** map `surface=pre_market` notes to tag `pre_market` as context; other notes
carry no tag. **Never synthesize an invalidation, level, or size the member did not write.**
Absent stays absent through migration.

---

## 4. Two layers

| Layer | Content | Mutability |
|---|---|---|
| **Transcript** (required) | Every message: `author` ∈ {`member`,`agent`}, `agent_service`, UTC timestamp, derived phase | Append-only. Accepts new messages while open; sealed by retrospective completion (§12). Existing messages are never edited |
| **Structured record** (optional) | Confirmed fields — instrument, thesis, trigger, size/risk, invalidation, watching, deviations, open thread | Written when the member confirms. Absent when they never do |

The transcript alone is a complete, valid journal entry. The structured record is enrichment
the member gets if they want it.

**Attribution is load-bearing.** Downstream readers quote **member-authored turns and
member-confirmed fields only**. Agent turns are evidence of process and are never quoted as
member intent — otherwise the retrospective could quote a framing the agent offered and the
member merely accepted, which would silently corrupt v0.4 §6.5.

**Unreached fields are absent** — null, omitted, never agent-filled.

---

## 5. Tags are context, not gates

A tag is **metadata on the entry**. It is not a script selector, not a precondition, and not a
downstream dependency.

- Optional. An entry may carry none.
- Applied before, during, or after the conversation. Changeable until seal.
- **Multiple tags permitted** — the single-primary-tag rule from v0.1/v0.2 is void.
- May be member-set or agent-suggested; a suggestion is never auto-applied.
- Vocabulary is open to extension without a spec bump, because nothing reads it as a gate.

Suggested starting vocabulary, for filtering and recall only: `pre_market`, `post_session`,
`clean_day`, `reflection`, `retrospective` (§11).

**D1 from v0.2 is void.** Its premise was that tag vocabulary must replace `type` because
downstream readers depend on it. They no longer do — **phase is the gate** (§8). The
retrospective never depends on the member having labeled anything correctly, which means it
cannot be mis-set and does not require member discipline to work.

---

## 6. Dates and sessions

### 6.1 `journal_date`

Member-set, defaults to today (America/New_York), backdating permitted. **Not** derived from
`created_at` — writing up Tuesday on Wednesday is legitimate. This is the scope key for
retrospective gathering (v0.5 §4.1). Weekend and holiday dates are valid; they simply have no
regular session hours to derive phase against.

### 6.2 Multiple entries per date

Permitted, ordered by `session_started_at`. A morning conversation and an evening one are
separate entries about the same day.

### 6.3 One session per entry, open until reviewed

An entry is **one session**. No second session inside an entry.

**The session stays open until a retrospective covering its `journal_date` completes** (§12).
Until then the member may return to it at any time and continue the conversation. There is no
end-of-day seal, no reopen request, and no partial-record state — an unfinished conversation is
simply an open one.

Two consequences worth stating plainly:

- **A session may span days, not just the trading day.** Opened pre-market Monday, it can still
  receive a note on Wednesday. Every message carries its own phase (§8), so Wednesday's note is
  `later_day` and cannot feed expected-vs-actual regardless of the session being the same one.
- **Interruption costs nothing.** A member pulled away at the open comes back later and
  continues. Unreached fields remain absent (§4) until and unless the member fills them.

`status` is therefore binary: `open` until closure, `closed` after. Completeness is not a
status — a conversation with three messages and no structured record is a valid, complete
journal entry (§4).

### 6.4 Timestamps

Every message carries an immutable UTC timestamp. `session_started_at` is the entry's ordering
anchor. Phase is derived per message (§8).

### 6.5 Routine meter

Journey's `routine` meter counts a day when any session has `session_started_at` on that New
York calendar day. **Not** `journal_date`, or backdating manufactures routine history.
Backdating remains legitimate; it just cannot invent a streak.

**This amends shipped behavior.** Journey Experience v1.0 §4.1 defines `routine` as "days with
Trade Log or Journal in routine window," and the Journal half of that input changes shape here.
It is a decision-log entry against Journey v1.0, not a fresh decision inside this spec, and the
characterization tests for `journey_scores.py` move with it.

*Proposed — India + Tango.*

---

## 7. The agent

### 7.1 Availability

**Always reachable.** Pre-open, intraday, post-close, weekends, and on later dates about
earlier ones.

**The agent does not interrupt while the market is open.** It asks nothing unprompted during
regular hours — a member mid-trade does not need a coach in their ear, and an agent that
prompts while a position is open is influencing the trade rather than journaling it. If the
member opens the conversation, the agent responds normally.

This is the correction to v0.1/v0.2's "silent recorder," which made the agent *unavailable*
and contradicted the primacy rule.

### 7.2 Behavior

The agent notices absences and may raise them **once**. The member may ignore it; the agent
does not re-ask, and the field stays absent (§4).

No question budget. No required sequence. The member drives; the agent's questions are
opportunistic.

Where the trade log answers something, the agent does not ask it — it names it and asks about
what it cannot know: "Three ES trades, two after 2pm. Talk to me about the second one."

### 7.3 The optional interview

A member may invoke a structured pass. It walks a field set and ends with a restatement of
their plan — plan, invalidation, what they are watching — in one compressed turn, which they
confirm or correct.

Invoked only. Never triggered by tag, phase, or absence. Abandoning it costs nothing: the
conversation continues and the entry remains valid.

The restatement is the one place compression belongs — hearing a tight version of your own plan
is when you notice it has no exit. Compression applies to the agent's summary, never as a
request to the member (§10).

### 7.4 Confirmation

When a member confirms, the structured record is written. There is **no confirmation gate** —
an entry that is never confirmed is complete. Downstream reads fall back to `pre_open` member
turns, so nothing breaks.

### 7.5 Quick-confirm for a quiet day

A one-tap affordance writing "followed my rules, nothing to report," available at any time. A
UI affordance, not a script. If a quiet Tuesday costs eight turns the habit dies by week
three, and quiet days are most of them.

---

## 8. Market phase — the actual gate

Derived per message from its UTC timestamp against the market calendar for the entry's
`journal_date`. Never member-set.

| Phase | Meaning |
|---|---|
| `pre_open` | Before the open on `journal_date` |
| `intraday` | Between open and close |
| `post_close` | After the close, same calendar day |
| `off_session` | Weekend or holiday — no regular hours; interview rules as `post_close`, no interruption rule to apply |
| `later_day` | Written on a **later calendar date** than `journal_date` — recollection |

**Enforcement.** Retrospective v0.4 §6.5 (expected vs actual) may draw only on **`pre_open`
turns authored by the member** for that `journal_date`, plus member-confirmed `pre_market`
fields where they exist. `later_day` and post-outcome content flows to reflection and
what-worked sections, where it is genuinely valuable.

This is why tags can be free: phase answers "what did the member say before the outcome was
known" from the clock, not from a label.

An entry lands in the retrospective window matching its `journal_date` regardless of when it
was written, so a Monday session written up Tuesday reviews with Monday.

**Market calendar is a config table** — hours, holidays, half-days. Fail loud if missing
(INSTRUCTIONS §2.2). Never hard-coded 09:30–16:00.

---

## 9. Guardrails

### 9.1 Code owns, prompt owns

| Code | Prompt |
|---|---|
| Attribution, timestamps, phase derivation | Phrasing and tone |
| §8 `pre_open`-only sourcing | Wording of the optional restatement |
| No-interrupt-during-open | |
| Turn validator (§9.2) | |
| Date closure enforcement (§12) | |
| Warning copy (§13) | |
| Tag persistence (no logic) | |

A prompt is a tendency, not a constraint. §10 holds for most sessions and then drifts on the
one where a member is upset and the model turns sympathetic and starts offering explanations.
That drift is invisible — it is simply in the record.

### 9.2 Turn validator — fail loud, degrade to chat

Each agent turn is checked **before rendering**. Blocked classes: motive or causal claims about
the member; advice; praise or blame; P&L figures; grade, meter, streak or score references;
multiple questions in one turn; chart or price assertions after an image upload; requests for
brevity.

On violation: block, log, retry once. **On repeated failure the surface degrades to plain
text capture and the member keeps writing.** The chat is the primary surface (§2) and must not
depend on agent availability; v0.2 §8.2 instead degraded to a sealed partial, which under its own
no-reopen rule destroyed pre-market intent with no recovery.

---

## 10. Agent instruction (normative, ship as versioned constant)

Ship verbatim as `JOURNAL_SESSION_SYSTEM_PROMPT_V1`. Amendable only by Tango + Hotel via spec
bump.

> You are the journal agent for a FatTail Labs member. The member is keeping a trading journal
> by talking to you, and the conversation is the record. Your job is to help them produce a
> record that can be checked against what actually happened. You are an interlocutor and a
> recorder. You are not a coach, an analyst, or a critic.
>
> **What you do**
>
> The member leads. Follow what they want to talk about.
>
> Notice what is missing. When they describe a plan with no price level, no size, or no
> condition that would prove it wrong, you may ask — once. If they don't answer, let it go and
> do not raise it again. An unanswered question is a valid outcome; the field stays empty.
>
> Press for specificity and for claims that can later be checked. If the member says "watching
> for a bounce," ask where.
>
> Aim for one true sentence in the member's own voice — one honest line worth reading back to
> them weeks from now. Not a summary. Not a completed form.
>
> **What you never do**
>
> - Never name a motive or an emotion. Do not say the member hesitated, was anxious, was
>   fearful, was greedy, was revenge trading, lost discipline, or lost confidence. Motive comes
>   from the member or it does not enter the record.
> - Never assert a fact about the market, a chart, or a price that the member has not stated.
> - Never give advice, propose a better plan, or say what the member should have done. Not even
>   when asked. If asked, redirect: ask what they would do differently.
> - Never evaluate. No praise, no "good trade," no "nice work," no approval of wins and no
>   sympathy framing for losses.
> - Give losses no more attention and no more turns than wins. Symmetry is required.
> - Never state a profit or loss figure, even when it is visible to you.
> - Never mention the member's process integrity grade, any meter, any streak, or any score.
> - Never ask the member to be brief, to condense, or to summarize. Never comment on the length
>   or the effort of what they wrote, in either direction.
> - Never ask for something the trade log already tells you.
> - Never interpret an uploaded image. Do not describe what a chart shows, name a pattern, or
>   read a price from it. Ask the member what the image shows.
> - Never fill a field the member left empty. Absent is a valid state.
> - Never require anything before the member can write. There is no form to complete and no
>   sequence to finish.
>
> **How you ask**
>
> One question per turn, targeting something absent rather than something already said. Plain
> language, short. No preamble, no restating what they just told you before asking the next
> thing.
>
> Start in the middle. You have the member's trade log. Do not ask what they traded — name it
> and ask about the part you cannot know: "Three ES trades, two after 2pm. Talk to me about the
> second one."
>
> "I don't know" is a complete answer. Log it as uncertainty and move on. Never ask the same
> thing twice. Forcing false precision is worse than accepting vagueness — a member who states
> a level they do not believe has corrupted the record and has learned to perform for you.
>
> **While the market is open**
>
> Do not ask questions unprompted. Receive what the member writes and acknowledge briefly or
> not at all. If they ask you something, answer normally.
>
> **If the member asks for a structured pass**
>
> Walk the fields, then restate their plan in their terms — plan, invalidation, what they are
> watching — in one compressed turn and ask them to confirm or correct it. Then ask what they
> are watching next. End on their words. If they abandon it partway, continue the conversation
> as normal and never mention that it was left unfinished.

---

## 11. The `retrospective` tag — navigation

The only tag with behavior, because it routes rather than records.

| Case | Behavior |
|---|---|
| No content yet | Route only. No journal entry created |
| In-flight | Save, **leave the session open**, link entry ↔ retrospective both ways, navigate |

Navigating away no longer seals anything, so **no warning is required to leave** — the member
can return to the conversation afterward. v0.3's leave warning is void; it described a
consequence that no longer exists.

**Target:** resume an open retrospective if one exists (max 1 open, 409 on second create,
v0.4 §3.1); else create through the path R1 already ships — no second creation path
(INSTRUCTIONS §8); if scope is empty, create nothing, explain what there is to review and when
there will be something, and offer a journal entry instead.

**Never auto-gather.** Gather sets `scope_end`, and on completion that timestamp determines
which dates close permanently (§12). A tap must not set that boundary.

**Never paste the transcript into the retrospective's `body_md`.** The reflection field is
about the period; an entry is about a date, and merging strips date scoping and per-message
attribution that §6.5 depends on. A member-accepted summary insert is permitted; auto-insert
is not.

**Backdating edge:** an open entry with a backdated `journal_date` may fall inside the closing
range when the member completes the retrospective, sealing a conversation they were still
having. Correct — it was taken into account — but §13's completion warning must name the dates,
and it should say how many open sessions will be sealed.

**No cadence movement.** Only retrospective `completed_at` moves the cadence meter — Journey
Experience v1.0 §4.1a is the shipped definition. Stated this way rather than by formula, because
the meter is under amendment: cadence adherence measured over elapsed periods replaces
days-since decay. Either way, routing, resuming, gathering and abandoning earn nothing.

---

## 12. Date closure

Completing a retrospective is **the sealing act** — the only one in the system. It closes the
dates it took into account, which seals the open sessions on those dates and refuses new ones.

This makes the retrospective an audit point: a member who reads "you deviated four times"
cannot go back and add justifications to the conversations that produced that finding.

- **Whole calendar dates strictly before the gather date** (New York). The gather date itself
  stays open — `scope_end` is "now at gather" (v0.5 §4.1), usually mid-day, and closing that
  date would cut off legitimate afternoon activity the retrospective never saw.
- Closing a date sets every open session on it to `closed`. **No further messages,
  attachments, tag changes, or structured confirmations.**
- Closed dates refuse new sessions and new attachments: **409**, with a reason and a link to
  the closing retrospective.
- Enforced server-side. Not a hidden UI affordance.
- **Permanent.** No administrator reopen for member records.

**Tension to resolve (§20 item 9).** Closure keys on "before the gather date," but the audit
rationale is "this was reviewed." Those sets differ: dates in the gather-to-complete gap of a
*previous* retrospective are outside every retrospective's scope (v0.5 §4.1, Option C) yet fall
before the next gather date, so they would be sealed without ever having been reviewed. Either
closure keys on **dates actually in scope** — matching the rationale, and leaving gap dates open
indefinitely — or it keys on the gather date and seals some unreviewed days. Under v0.3 this was
a harmless labeling question; now it decides whether a member loses a live conversation on a day
nobody looked at.

### 12.1 Demo accounts

Demo is a property of the account, not a mode an administrator enters — a mode is a general
bypass with a demo label on it.

`identities.is_demo` is set at creation and **immutable**. Without immutability the exception
is one UPDATE from applying to any account. Demo accounts are fixtures: **reset wholesale**,
never surgically edited, so §12 needs no exception branch. Excluded from leaderboard, journey
visibility, all aggregates, and anything reachable as external evidence. **Never convertible to
paid.** Mutations still audited, labeled demo.

*Proposed — India + Mike on placement and enforcement.*

---

## 13. Warnings

**There is now one irreversible step: completing a retrospective.** Leaving a session is
reversible, so it needs no warning — v0.3's three-warning chain collapses to one warning and one
informational confirm. UI-owned, not agent-generated. Tone per §10: factual, no urgency, no
evaluation, no reference to grades, meters, streaks, or lateness.

**Not a warning, but worth surfacing while writing.** Before the open on the entry's own date,
if a plan has no invalidation or no level, the UI may note once:

> Anything added after the open won't count as pre-market intent.

Explains §8. Not a prompt to complete anything, and it does not block leaving.

**1. Gathering**

> **Review period: Monday 21 July through now.**
> Anything after this point belongs to your next retrospective.
> `Gather` · `Cancel`

**2. Completing** — the irreversible one

> **Complete this review?**
> This closes **21–25 July**. Those dates were reviewed here, so the record stays as it is — no
> new entries, notes, or screenshots on those days.
> **2 conversations still open will be closed** (23 July, 25 July).
> Today stays open.
> `Complete review` · `Not yet`

Dates are named explicitly, never "earlier dates." A member who later cannot journal a specific
day needs to have been told that day in particular, or §12's 409 explanation arrives too late
to be useful.

The open-session count is new in v0.4 and matters more than the date list: under v0.3 completing
sealed nothing the member was still using, whereas now it can end conversations in progress. If
any of those sessions has no structured record, say so — this is the member's last chance to add
one, and it is the only place in the product where the system should mention an absent field
without being asked.

**Multi-period retrospectives.** When a cadence period elapsed without a retrospective, the next
one spans everything back to the last completion, so the closing set can be three weeks of dates
rather than five days. Render it as a range plus a count — "**21 June – 11 July, 15 trading days**"
— with the dates available on expand, and keep the open-session count exact. A wall of twenty
dates is not a warning anyone reads.

Empty scope is an explanation, not a warning — nothing was created and nothing is at risk.

---

## 14. Uploads

- **Family B private media store**, separate from the public card/hero library. A broker
  screenshot carries balance, sizing, sometimes account number and legal name; routing it into
  a store designed to serve publicly is a leak that does not announce itself.
- Authenticated per-owner reads. No public URL space. In export **and** purge from day one —
  binaries are what gets forgotten on a deletion request. Never in the shareable set under
  journey visibility.
- **No agent image interpretation in v1.** Vision models misread timeframes and invent price
  levels confidently; an agent that says "you entered late on the retest" having misread a
  5-minute chart as hourly has taught a false lesson the member will carry. The member's
  **caption is the machine-readable layer**; the image is the human-readable one. The caption
  is a member assertion, so v0.4 §6.5 may quote it with attribution intact.
- **Paste is the primary path**; file picker is fallback. Attach to an entry or a trade, never
  floating in the session, or it cannot be scoped into a retrospective window.
- Cap per entry (default 5) with thumbnail-and-expand, consistent with v0.4 §6.3 and §6.4.
- **P&L in images inherits the collapse state of the section it renders in.** v0.4 §6.6
  collapses book performance so process comes before outcome; a visible broker P&L panel at
  render position 2 defeats that through a side door. *Proposed — Tango.*
- Closed dates refuse new attachments (§12).

---

## 15. Portability

Extends the Member Practice Export document set. Export includes sessions, messages with
author and phase, structured fields, and attachment captions with binary references. Legacy
free-text notes continue to export during dual-read.

Import is **additive** by portable key. It never rewrites a sealed transcript. Practice purge
removes session rows, messages, and private media binaries.

Version bump on the export spec is required. *Proposed — India + Alpha.*

---

## 16. Schema sketch

```
member_journal_sessions
  id, identity_id, journal_date, session_started_at,
  status (open|closed),                  -- closed only by retrospective completion (§12)
  closed_by_retrospective_id NULL,
  closed_at NULL,
  structured_json NULL,                  -- NULL when never confirmed
  spawned_retrospective_id NULL,
  export_key, created_at, updated_at

member_journal_session_tags
  session_id, tag                        -- multi-tag; context only, no logic reads it
  PK (session_id, tag)

member_journal_messages
  id, session_id, identity_id, author, agent_service NULL,
  body_md, phase, created_at             -- append-only

member_journal_attachments
  id, session_id, identity_id, trade_id NULL,
  storage_key, caption_md, created_at

member_journal_date_closures
  identity_id, journal_date, closed_by_retrospective_id, closed_at
  PK (identity_id, journal_date)
```

Tags are a join table rather than a column because they are multi-valued and carry no logic.
`status` is binary and is not a completeness signal — a session is `open` until a retrospective
closes it, and an entry with no structured record is complete either way. v0.2 carried
`open|partial|sealed` plus a separate `incomplete` boolean, three states and a flag encoding what
is really one fact plus one lifecycle bit.

Dual-read `member_tool_notes` until Lima records cutover in the decision log.

---

## 17. Implementation slices

| Slice | Deliverable | Depends |
|---|---|---|
| **J1** | Schema + chat capture: sessions, messages, attribution, timestamps, phase derivation, calendar config, dual-read notes | Coach GO |
| **J2** | Agent in the chat: system constant, turn validator, degrade-to-text, no-interrupt-during-open | J1, agent config fail-loud |
| **J3** | Tags (multi, context-only), quick-confirm affordance | J1 |
| **J4** | Optional structured pass + confirmation writing `structured_json` | J2 |
| **J5** | Private media + captions + collapse inheritance | Mike store design |
| **J6** | `retrospective` tag routing, link both ways, no auto-gather | J1, retro API |
| **J7** | Date closure on retrospective complete, 409 paths, closure warnings | J1, retro complete hook |
| **J8** | Portability: export, additive import, purge | J1 |
| **J9** | Demo `is_demo` + seeded fixture sessions | J1 |

**Order constraint, inverted from v0.2:** the agent lands in **J2**, immediately after
capture. v0.2 deferred it to J3-of-8 behind a structured form, which is the error this version
corrects. The structured pass (J4) is the add-on and ships after.

---

## 18. Capacity over dependency

A member who can only reflect when asked has not learned to reflect. The agent raises absences
densely during the Observer trial and tapers as tenure builds.

**Keyed on the existing meter profile, not a new config table.** Journey Experience §4.4 already
resolves `observer_trial` / `navigator_monthly` / `navigator_annual` / `activator`, and
`GET /api/me/journey/scores` already returns `process.profile`. The agent reads profile id and
tenure from there. Inventing a parallel density table would be a second store of the same fact.

**Profile is an input, never an output.** The agent may calibrate on it and may never refer to
it — §10's prohibition on mentioning grades, meters, streaks and scores is unchanged, and
"you're in your trial" is the same class of remark.

**Operator metric only:** ratio of member-initiated to agent-elicited content over tenure.
Derived on read from message attribution — no cached score, no stored ratio, per Gamification
v1.0 §1 criterion 4 (no second progress store, no admin score edits).

This is the closest thing the product has to a **G1 trust proxy** (Journey §3: engage the trial,
maximize Observer → Navigator). Trust is not directly instrumentable, but "returns unprompted
and keeps closing loops without being chased" is observable, and it is a better conversion signal
than volume. A climbing ratio means the member has learned the process; flat at week five means
they have learned to answer questions.

**Never surfaced to the member** — they would journal for the ratio, the same failure as the
agent mentioning the meter.

---

## 19. Verification

**J1** — Multiple entries per `journal_date`, ordered by `session_started_at`. No second
session inside an entry (409). A session left mid-conversation accepts new messages days later
while its date is unreviewed. `journal_date` member-set; an entry
created Wednesday for Tuesday scopes to Tuesday. Phase correct across a half-day and a holiday
from calendar config; missing calendar fails loud. Routine meter counts `session_started_at`
day, and five backdated entries do not manufacture routine.

**J2** — Validator blocks seeded turns containing motive language, advice, praise, a P&L
figure, a meter reference, two questions, and a chart assertion after an upload; none renders,
each logs. Repeated failure degrades to plain text capture and the session stays open. Agent
asks nothing unprompted between open and close but answers when addressed. An absence raised
once is not raised again. Every message carries `author` and `agent_service`.

**J3** — Multiple tags on one entry. An entry with no tag is valid and gathers normally. Tag
changes do not alter any downstream read.

**J4** — An entry with `structured_json` NULL is complete and valid. §6.5 sourcing falls back
to `pre_open` member turns with no structured record present. Abandoning the structured pass
leaves the entry valid and the agent does not mention it. Unreached fields are absent — assert
no inferred values.

**J5** — No public URL resolves to member media. Export includes captions and binaries; purge
removes both. Media absent from the shareable set under journey visibility.

**J6** — Clean route creates no entry. In-flight leaves the session **open**, links both
directions, does not merge into `body_md`; assert no warning is required to navigate away. Open retrospective resumed, not duplicated. Existing create path
used — assert no second path. Empty scope creates nothing. `scope_end` unset after routing.

**J7** — After complete, whole dates before the gather date refuse sessions and attachments
with 409 + reason + link; the gather date stays open. Not reversible by an administrator on a
non-demo account. `is_demo` cannot be set post-creation. Demo accounts absent from leaderboard,
journey visibility, and aggregates.

**J8** — Import additive; a sealed transcript is never rewritten.

**Copy sweep** — No surface tells a member they are late, behind, overdue, or marked down.
Warnings fire before each irreversible step, name unreached fields on leave, and name exact
dates on complete.

---

## 20. Open — needs a named owner

| # | Item | Owner |
|---|---|---|
| 1 | Routine meter keying on `session_started_at` NY day (§6.5) | India + Tango |
| 2 | Image P&L inheriting section collapse (§14) | Tango |
| 3 | Private media store: auth, storage, export, purge (§14) | Mike + Alpha + India |
| 4 | `is_demo` placement and immutability enforcement (§12.1) | India + Mike |
| 5 | Export spec version bump and document shape (§15) | India + Alpha |
| 6 | Agent attribution before full P2 agent principals: `agent_service` on messages with the member session owning the Family B write ACL, every turn audited — sufficient as an interim, or does P2 pillar 1 ratify first? (§21) | Mike + Coach |
| 7 | ~~`free_observer` Journal access~~ — **void.** No role, no access; Observer and Navigator access is identical | Closed |
| 8 | ~~Retrospective v0.6 existence~~ — **void.** v0.6 confirmed as-built; citations re-pointed | Closed |
| 9 | Closure keys on **dates in scope** (matches the audit rationale; gap dates stay open indefinitely) or on **dates before the gather date** (simpler; seals some days no retrospective reviewed) — §12 | Coach + India |

These are **proposals pending their owner**, not locked decisions. v0.2 converted the same
list into "Coach defaults" (D1–D9) and labeled itself build authority; a waived gate is a
doctrine violation (INSTRUCTIONS §6).

**Out of scope here.** Whether the Observer trial gets a materially different Journey surface —
arc and trajectory rather than state meters, and whether grade bands serve a six-week trial at
all — is a Journey Experience amendment under G1, with Tango on framing. This spec deliberately
does not solve it: it supplies the attribution data that a trust proxy would read (§18) and
otherwise stays out of the way. The Journal should not grow a second progress surface to
compensate for one.

---

## 21. Governance

This makes a P1 surface agent-operated. **Scoped agent credentials with per-mutation
attribution are P2 pillar 1, and the P2 charter is unratified** (INSTRUCTIONS §11.3–11.5).

The interim in open item 6 keeps the Family B write ACL with the member's own session and marks
agent turns by service, so rows do not need re-keying when real agent principals land. Whether
that is enough to ship is Mike's call plus a recorded pre-ratification exception, or P2 ratifies
first. It must not ship silently.

The agent instruction (§10) is a governed artifact: Hotel for trading accuracy, Tango for tone.
Log which turn sessions end on — consistent abandonment at the same point means the agent has a
bad habit, not that the member is uncooperative.

---

## 22. Non-goals

Agent as coach or strategy advisor · vision-model chart reading · reopening a session after a
retrospective has closed its date ·
administrator surgical edits to closed dates · member-facing capacity ratio · any required form,
tag, or sequence standing between the member and writing.

---

## 23. Decision-log entry (on Coach GO)

> **Journal Session v0.3 — chat primary.** The Journal is an always-available agent chat; the
> conversation is the record. The structured interview is an optional member-invoked add-on, and
> tags are multi-valued context that no logic reads — superseding v0.1 (tag-gated scripts) and
> v0.2 (structured form primary, agent deferred). Two layers: an append-only attributed
> transcript, required, plus an optional member-confirmed structured record; a transcript-only
> entry is complete. **Phase, not tag, is the gate** — Retrospective §6.5 expected-vs-actual
> draws only on `pre_open` member turns for the entry's `journal_date`, so the retrospective
> never depends on member labeling. One session per entry, and that session **stays open until a
> retrospective covering its date completes** — completion is the single sealing mechanism, so
> there is no end-of-day seal and no partial-record state. Member-set
> `journal_date` scopes retrospectives while the routine meter keys on `session_started_at` to
> close backdate gaming. The agent never interrupts during regular hours but remains reachable;
> guardrails are enforced by a fail-loud turn validator that degrades to plain-text capture
> rather than to a sealed partial. Uploads are Family B private media with no agent image
> interpretation; the member caption is the machine-readable layer. Date closure after a
> retrospective completes covers whole dates before the gather date, is permanent, refuses
> entries and attachments with 409, and is preceded by a warning naming the dates; demo
> fixtures are exempt via an immutable `is_demo` set at creation. Blocking dependency: agent
> identity and per-mutation attribution are unratified P2 pillar 1. No profit claims. Family B
> isolation unchanged.
