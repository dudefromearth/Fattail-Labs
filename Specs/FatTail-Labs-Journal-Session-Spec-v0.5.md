# FatTail Labs — Journal Session Spec v0.5

**Status:** DRAFT — for bench review and Coach GO. Not build authority.
**Supersedes:** v0.1–v0.4 entirely, and the v0.2 program's product frame.
**Family:** B (member-private)
**Entitlement:** none. Observer, Activator, and Navigator have identical Journal access; Observer is
a paid six-week trial differing only in term. No role means no access to the product, which
Identity & Access enforces upstream.

**Why this is a rewrite, not a revision.** v0.1–v0.4 accreted machinery nobody asked for — tag-driven
scripts, question budgets, required-field gates, partial records, day-sealing, a second writing
surface. Each was defensible alone; together they produced an interface that had to apologize for
itself in three paragraphs of on-screen copy. v0.5 is written from the original request and contains
only what was asked for, plus what existing doctrine already requires.

**Why it matters.** The Journal is where a trader's process integrity is actually recorded. It is
central to the service, not a feature beside it.

---

## 1. What this is

**The Journal is an AI chatbot** — the same interface pattern as Claude or Grok: a conversation
thread and a composer, nothing else. The conversation *is* the journal record.

### 1.1 The screen

Top to bottom:

1. Calendar controls — Year / Month / Week / Day, previous / next, Today
2. The date
3. Tag chips (§5)
4. **The composer** — one box, voice input, send
5. The conversation thread, once one exists, above the composer
6. Trades on this day

The composer is the entry point. No start button, no intermediate step.

### 1.2 The interview

The structured interview **appears only when requested**. When the trader is done with it, they
collapse it to a **bar**, which can be expanded again at will. Default state is just the chatbot.

It never opens on load, never opens because of a tag, and never appears in the layout uninvited.

### 1.3 Not on the screen

No manual-write path, no plain-text mode, no alternative to the conversation — there is no
alternative, because the conversation is the Journal.

No question or turn counters. No member-facing seal control. No internal vocabulary shown to the
member: no phase names, status enums, tag ids, field keys, or spec section references. No copy
explaining how surfaces relate — if a screen needs that paragraph, a surface should be deleted
instead.

*Gate: **Echo** (layout), **Tango** (copy and framing).*

---

## 2. The record

| Layer | Content | Mutability |
|---|---|---|
| **Transcript** | Every message — member and agent — with author, timestamp, and derived market phase | Append-only while the session is open; sealed by retrospective completion (§7) |
| **Structured record** | Fields confirmed through the interview (§1.2) | Written on confirmation; absent when the interview is never used |

A transcript with no structured record is a complete journal entry.

**Attribution is load-bearing.** Downstream readers quote **member-authored content only**. Agent
turns are evidence of process and are never quoted as the member's own words — otherwise the
Retrospective could attribute to a member a framing the agent supplied.

Fields the member never filled are **absent**. Never inferred, never agent-filled.

*Gate: **India** (model), **Mike** (Family B).*

---

## 3. Dates and sessions

**Every entry is attached to a specific date.** `journal_date` is member-set, defaults to today
(America/New_York), and backdating is allowed — writing up Tuesday on Wednesday is legitimate. It is
not derived from creation time. It is the key the Retrospective scopes on.

Multiple entries may exist on one date, ordered by session start.

**One session per entry.** A trader cannot start a second session inside an entry.

**A session stays open until a retrospective covering its date has been created and completed**
(§7). Until then the trader may return and continue it. There is no end-of-day seal and no partial
state — an unfinished conversation is simply an open one. A session may therefore span the trading
day, or several days.

`status` is binary: `open`, then `closed`.

*Gate: **India**.*

---

## 4. Timestamps and market phase

**Every message carries its own immutable UTC timestamp**, so the record is stamped in the context of
market time.

Each message derives a **phase** from its timestamp against the market calendar for the entry's
`journal_date`:

| Phase | Meaning |
|---|---|
| `pre_open` | Before the open on that date |
| `intraday` | Between open and close |
| `post_close` | After the close, same date |
| `off_session` | Weekend or holiday |
| `later_day` | Written on a later calendar date than `journal_date` |

**This is what carries context to the Retrospective.** Content written after the fact is recollection
with the outcome already known, and the Retrospective reads it as such: expected-vs-actual draws only
on `pre_open` member content for that date, and later-written material flows to the reflection
sections where it belongs. Nothing is discarded; it is read honestly.

Market hours, holidays, and half-days come from **config**, not hard-coded values. Missing calendar
fails loud.

*Gate: **India**, **Hotel** (market accuracy).*

---

## 5. Tags

Tags **frame the entry. They are context, never a gate.**

- Optional. An entry may carry none.
- Multi-valued, applied or removed at any time while the session is open.
- The composer works without touching one.
- A tag never gates access, never selects a script, never changes what the agent may ask, and never
  opens the interview.

Selected tags may be supplied to the agent **as context** — "the member tagged this Pre-Market" —
and never as instruction. Tags do not modify the agent.

The vocabulary itself is defined platform-wide by the **Tag Manager Spec**, not here.

*Gate: **India**, **Tango**.*

---

## 6. Moving to the Retrospective

The `retrospective` tag transports the trader to their current retrospective, or to a new one.

| Situation | Behavior |
|---|---|
| Nothing written yet | Route. No journal entry is created |
| Mid-conversation | Save, **leave the session open**, link entry and retrospective both ways, then navigate |

An open retrospective is resumed. Otherwise one is created through the existing creation path. If
there is nothing in scope to review, nothing is created — the trader is told what there is to review
and when there will be something.

**Routing does not gather.** Gathering sets the review boundary that later drives permanent closure,
so it stays a deliberate action.

**The trader is warned before anything irreversible**, and told plainly what is about to happen:

**Gathering** — sets the review period, and anything after it belongs to the next retrospective.

**Completing** — the irreversible one:

> **Complete this review?**
> This closes **21–25 July**. Those dates were reviewed here, so the record stays as it is — no new
> entries, notes, or screenshots on those days.
> **2 conversations still open will be closed.**
> Today stays open.

Dates are named, not described as "earlier dates." Open conversations that will be closed are
counted, because completing can end a conversation the trader is still having. When a missed cadence
period makes the span long, it renders as a range plus a trading-day count.

*Gate: **Tango** (warning copy), **India** (routing), **Delta** (evidence).*

---

## 7. Closure

**Once a retrospective that takes a journal into account has been completed, that journal is closed
to further entries.** This is the audit: the record a review examined cannot be revised afterward.

Completion is the **only** sealing mechanism in the system.

- The closed set is the dates the retrospective actually reviewed — from the start of its scope
  through the day before it gathered. The gather date itself stays open, since gathering mid-day must
  not cut off that afternoon's legitimate activity.
- Closing a date sets its open sessions to `closed`. No further messages, attachments, tags, or
  confirmations.
- Closed dates refuse new sessions and attachments server-side, fail loud, with a reason and a link
  to the retrospective that closed them.
- **Permanent.** There is no administrator reopen for member records.

**Demo accounts are the exception**, because they are fixtures rather than member records. `is_demo`
is set at account creation and is **immutable** — without that, the exception is one update away from
applying to a real member. Demo accounts are reset wholesale rather than edited, excluded from every
aggregate and community surface, and never convert to paid.

*Gate: **India**, **Mike**, **Delta**.*

---

## 8. The agent

### 8.1 What it knows

The trader's **trade session information** for the date, and their **Journey situation** — the meter
profile already resolved by Journey, which is how the agent knows whether it is talking to someone in
their first weeks or someone two years in.

It may use these to calibrate. It may never recite them: no grade, no meter, no streak, no score.

### 8.2 How it behaves

Open-ended. Detects absences. Does not interpret.

The trader leads. The agent notices what is missing — a price level, a size, a condition that would
prove the plan wrong — and may raise it **once**. If the trader does not answer, the field stays
absent and the agent does not ask again.

It presses for **precision**, never for brevity. A record that can be checked against what happened
is the point; length is not.

It starts in the middle. It has the trade log, so it does not ask what was traded.

**The trader always writes first.** The agent never opens a session unprompted.

**During market hours the agent does not ask questions.** It receives what the trader writes. If the
trader asks it something, it answers.

### 8.3 The prompt

**The admin edits the agent prompt.** Editable in admin, versioned, and variable by role and by
observed effectiveness.

Each session records the prompt version that produced it, so a transcript can be read against the
instruction that generated it and versions can be compared rather than guessed at.

The prohibitions in §9 are enforced in **code**, not in the prompt. Editing the prompt changes how
the agent talks; it cannot change what the agent is permitted to say. That split is what makes an
editable prompt safe.

### 8.4 Availability

The agent is always available — pre-open, intraday, post-close, weekends, and on later dates about
earlier ones.

If the model is unreachable, the composer is unchanged: messages are captured, nothing replies. That
is the agent failing, not a mode the trader entered, and it is never labeled as one.

*Gate: **Hotel** (trading accuracy), **Tango** (tone), **Mike** (prompt-edit authority).*

---

## 9. Guardrails

Explicit, and enforced in code before any agent turn renders. A violating turn does not display and
the violation logs.

The agent never:

- Names a motive or emotion — hesitated, anxious, greedy, revenge trading, lost discipline
- Asserts a market, chart, or price fact the trader did not state
- Gives advice, proposes a better plan, or says what should have been done — even if asked
- Evaluates: no praise, no "good trade," no approval of wins, no sympathy framing for losses
- Gives losses more attention or more turns than wins
- States a profit or loss figure, even when it can see one
- Mentions a grade, meter, streak, or score
- Asks the trader to be brief, or comments on length or effort in either direction
- Asks for something the trade log already answers
- Interprets an uploaded image — it asks the trader what the image shows
- Fills a field the trader left empty
- Asks more than one question in a turn

"I don't know" is a complete answer, logged as uncertainty and never asked again. Forcing false
precision corrupts the record and teaches the trader to perform.

*Gate: **Hotel**, **Tango**, **Delta**.*

---

## 10. Uploads

Screenshots and images upload into the chat. Paste is the primary path.

They are **Family B private media** — a broker screenshot carries balance, sizing, sometimes account
number and name — stored separately from the public media library, readable only by their owner, with
no public URL, and present in both export and deletion from day one.

**The agent does not interpret images.** Vision models misread timeframes and invent price levels
confidently, and a false reading recorded as history is a lesson the trader carries. The trader's
caption is what the system reads; the image is what the trader reads.

*Gate: **Mike**, **Hotel**.*

---

## 11. Retrospective cadence

Owned by the Retrospective and Journey specs, not this one. Recorded here because §6 and §7 depend
on it:

Cadence defaults to **weekly** and is trader-configurable. A retrospective covers the current cadence
period, or everything since the last completed one. **When a period is missed, the trader is alerted
that the cadence was interrupted and told what the current retrospective now covers.** Adherence to
the chosen cadence carries weight in the process integrity score.

*Gate: **Coach**, **Hotel**, **Tango**, **India**.*

---

## 12. Portability

Journal sessions, messages with author and phase, structured records, and attachment captions with
binaries export and import under the existing Practice Portability contract. Import is additive and
never rewrites a sealed transcript. Purging practice data removes sessions, messages, and media
binaries.

The existing journal export shape predates the session model, so a document version bump is required
and legacy packs must still import.

*Gate: **India**, **Alpha**.*

---

## 13. Schema sketch

```
member_journal_sessions
  id, identity_id, journal_date, session_started_at,
  status (open|closed), closed_by_retrospective_id NULL, closed_at NULL,
  structured_json NULL,
  prompt_version_id,
  spawned_retrospective_id NULL,
  export_key, created_at, updated_at

member_journal_messages
  id, session_id, identity_id, author, agent_service NULL,
  body_md, phase, created_at            -- append-only

member_journal_attachments
  id, session_id, identity_id, trade_id NULL,
  storage_key, caption_md, created_at

member_journal_date_closures
  identity_id, journal_date, closed_by_retrospective_id, closed_at
  PK (identity_id, journal_date)
```

Tag assignments live in the Tag Manager's tables, not here.

*Gate: **India**, **Alpha**.*

---

## 14. Build order

| Slice | Deliverable |
|---|---|
| **J0** | Coach GO, open decisions locked, decision-log entry, new board |
| **J1** | Schema and status migration, chat surface, market calendar config |
| **J2** | Agent: context assembly, code-enforced guardrails, no-unprompted-during-hours, once-only absences |
| **J3** | Admin prompt editing, versioning, session stamping |
| **J4** | Tag chips against the Tag Manager vocabulary |
| **J5** | Interview on request, collapse to bar, structured record |
| **J6** | Uploads: paste, private media, captions |
| **J7** | Retrospective routing and warnings |
| **J8** | Closure on completion, 409 paths, completion warning |
| **J9** | Portability and export version bump |

The agent lands in J2, immediately after the surface. The interview lands in J5, after it.

*Gate: **Juliet** (board), **Delta** (phase gates).*

---

## 15. Verification

**Surface** — Empty day renders the composer with no start button. No entry exists until the trader
sends a message. Thread renders above the composer. Composer works with no chip tapped. Interview is
absent from the DOM until requested, collapses to a bar, never opens on load, loses no confirmed
fields on collapse. No counters, no seal control, no manual-write path. With the agent unreachable the
composer still captures messages and the UI is visually unchanged. Grep rendered copy in CI for phase
names, status enums, tag ids, field keys, and `§` references — none may appear.

**Record** — Every message carries author, timestamp, and phase. Agent-authored content cannot be
quoted as member intent. Unfilled fields are absent, with no inferred values. A transcript-only entry
is valid and gathers normally.

**Dates** — Multiple entries per date. No second session inside an entry. An entry created Wednesday
for Tuesday scopes to Tuesday. A session left mid-conversation accepts new messages days later while
its date is unreviewed.

**Phase** — Correct across a half-day and a holiday from calendar config; missing calendar fails
loud. Expected-vs-actual draws only on `pre_open` member content for that date.

**Agent** — Guardrail violations are blocked before render and logged: motive language, advice,
praise, a P&L figure, a meter reference, two questions in a turn, a chart claim after an upload. The
agent produces no turn before the trader's first message. During market hours no agent turn exists
without a preceding trader message. An absence raised once cannot be raised again. Prompt edits
create versions; sessions record the version that produced them.

**Retrospective and closure** — Routing creates nothing when scope is empty and never gathers.
In-flight routing leaves the session open and links both ways. After completion, the reviewed dates
refuse sessions and attachments with a reason and a link; the gather date stays open; not reversible
by an administrator on a non-demo account. `is_demo` cannot be set after creation. Warnings fire
before gathering and before completing, naming dates and counting open sessions.

**Uploads** — No public URL resolves. Export includes captions and binaries; purge removes both.

**Copy** — No surface tells a trader they are late, behind, overdue, or marked down.

*Gate: **Kilo** (tests), **Delta** (evidence).*

---

## 16. Review gates

| Agent | Reviews |
|---|---|
| **India** | Model, dates and sessions, closure semantics, schema, taxonomy boundary with Tag Manager |
| **Mike** | Family B isolation, private media, prompt-edit authority, demo immutability |
| **Hotel** | Market phase accuracy, guardrails, image non-interpretation, cadence |
| **Tango** | Every member-facing string, warning copy, agent tone, the trial experience |
| **Echo** | The surface — one place to write, interview collapse behavior |
| **Charlie** | Chat implementation, thread and composer, collapse bar |
| **Alpha** | Agent context assembly, portability, schema |
| **Sierra** | Confirms no Journal content reaches external or marketing surfaces |
| **Kilo** | Characterization coverage |
| **Delta** | Phase gates and evidence |
| **Lima** | Decision log and documentation parity |
| **Juliet** | Board, seeds, sequencing |

---

## 17. Open decisions

| # | Decision | Owner |
|---|---|---|
| 1 | Cadence configuration: where the trader sets it, and whether changes apply forward only | Coach + India |
| 2 | How adherence replaces days-since decay in the shipped cadence meter | India + Tango |
| 3 | Journey routine meter keying, given entries can be backdated | India + Tango |
| 4 | Voice transcription: in-product or via provider, and what that means for Family B | Mike |
| 5 | Agent persona name — both charters currently reserve "Vexy" for a later phase | Coach + India |
| 6 | Scope of admin prompt editing, and whether guardrail-adjacent edits are blocked or reviewed | Coach + Mike + Tango |
| 7 | Agent identity: agent turns currently ride the member session; scoped agent credentials are an unratified P2 pillar. Ratify first, or ship with a recorded exception | Coach + Mike |
| 8 | Migration of existing sessions: previously sealed conversations become open again, and existing transcripts contain turns from the superseded agent | India + Tango |

---

## 18. Decision-log entry (draft, on approval)

> **The Journal is an AI chatbot; the conversation is the record.** A thread and a composer, with the
> structured interview appearing only on request and collapsing to an expandable bar. No manual-write
> path and no alternative to the conversation. Entries attach to a trader-set date; one session per
> entry, and that session stays open until a retrospective covering its date completes — completion is
> the single sealing mechanism, and the closed set is the dates that retrospective actually reviewed.
> Every message carries an immutable timestamp and a derived market phase, so after-the-fact content
> reaches the Retrospective as recollection rather than as stated intent. Tags frame entries as context
> only: they gate nothing, select nothing, and reach the agent as context rather than instruction, with
> the vocabulary owned platform-wide by the Tag Manager. The agent knows the trade log and the Journey
> profile, leads with nothing, detects absences once, presses for precision rather than brevity, and
> stays silent unprompted during market hours; its prompt is admin-editable and versioned per session
> while its prohibitions are enforced in code. Uploads are Family B private media the agent never
> interprets. Closure is permanent except for demo fixtures identified by an immutable `is_demo`.
> Supersedes Journal Session v0.1–v0.4 and the v0.2 program's product frame. No profit claims. Family B
> isolation unchanged.
