# FatTail Labs — Journal Session Spec v0.4a

**Status:** **BUILD AUTHORITY** — Coach **GO** 2026-07-30 · board
`agents/p-journal-session-v04/` · DL-157. Named residuals §20 (non-blocking unless noted).
**Supersedes for product authority:** **v0.2**, whose program is **built and complete on
`main`** under a product frame that is now superseded (§3). v0.3 existed as an interim advisor
draft only and never landed in the repo; its day-seal model is withdrawn here. v0.1 was the
original advisor draft.
**Family:** B (member-private)
**Entitlement:** no Journal-specific gate. Journal access is identical for **Observer,
Activator, and Navigator** — Observer is a **paid six-week trial**, differing from Navigator in
membership term only, not in features. Membership itself is enforced upstream by Identity &
Access; a lapsed or planless authenticated identity is an access question for that spec, not a
tier check inside the Journal. See §20 item 10.

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

**Parent references — cite this version for that topic.**

| Doc | Cite for |
|---|---|
| Retrospective **v0.6** | As-built lifecycle, render order, inference gates, report honesty |
| Retrospective **v0.5** | Gather boundary (Option C), `scope_end`, complete hook |
| Journey Experience **v1.0** | §4.1a cadence meter (R7 shipped), §4.4 meter profiles and `retro_horizon_days`, §4.1 routine meter |
| Practice Portability **v1.1** | BUILD AUTHORITY on journal export/import shape (§15) |
| Gamification **v1.0** | Derived-score rules, no second progress store, ISO week keying (NY) |
| Trade Log **v1.1** | Day-book context the agent reads |
| Member Data Privacy **v0.1** | Family B, export and purge obligations |
| Identity & Access **v1.0** | Who may reach the product at all |

Retrospective v0.6 is not in this advisor context; the topics above are assigned from its
declared role. **India to verify section-level cites against the file before approval.**

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

**The v0.2 program shipped.** `agents/p-journal-session/` is complete, and its output is live on
`main`. This spec is not a greenfield build — it is a **product-frame correction on top of
working infrastructure**. Reuse the substrate; rewrite the product shape. Do not ship v0.4 as a
small patch on v0.2's UX.

| Today on `main` (post-v0.2 program) | v0.4 target |
|---|---|
| Calendar + Trade Log day-book | Unchanged shell; sessions attach to the calendar date |
| `member_journal_sessions` + messages + phase derivation | Same substrate |
| Phase from **hard-coded RTH 09:30–16:00** | Market calendar **config**, fail loud (§8) |
| Single primary **tag required**; tag drives scripts and UI chips | Tags multi-valued, optional, context-only; **no logic reads tags** (§5) |
| Status `open \| partial \| sealed`, with a member-facing seal path | Status `open \| closed`; seal **only** on retrospective complete (§6.3, §12) |
| Structured form is the default, always-on surface | Structured pass is **member-invoked only** (§7.3) |
| Local checklist agent, depth caps, form as the fallback story | Dialogue agent; no depth budget; once-only absences; degrade to **plain text** (§7.0, §9.2) |
| Intraday "silent" implemented as agent unavailable | Always reachable; **no unprompted** questions during regular hours (§7.1) |
| Private media, `journal_session` export, date closures on retro complete | Retained; closure set re-keyed per §12 |
| Dual-read `member_tool_notes` | Continues until Lima records cutover |

**Migration rule:** map `surface=pre_market` notes to tag `pre_market` as context; other notes
carry no tag. **Never synthesize an invalidation, level, or size the member did not write.**
Absent stays absent through migration.

### 3.1 Migrations that change existing member records

Three of the changes above touch Family B rows that members have already created. None of them
may be done silently.

1. **`partial` → `open`.** Sessions previously sealed as partial become writable again. That is
   correct under §6.3 — the conversation was never finished — but it is a visible behavior change
   on records a member may consider closed. **Tango** on whether it is announced and how.
2. **Closure rows written under v0.2 keying** may not match the §12 set. Decide explicitly
   whether existing `member_journal_date_closures` rows are recomputed, left as-is, or
   grandfathered. Recomputation that *opens* a previously closed date is the only direction that
   risks the audit invariant, and it should not happen. **India.**
3. **Existing transcripts contain local-checklist agent turns** that the §10 constant would not
   produce. The transcript is append-only (§4) — those turns are history and **must not be
   rewritten or deleted** to make the record look conformant. Retrospective reads are unaffected,
   since they quote member-authored content only.

### 3.2 Keep versus rewrite

| Keep (substrate) | Rewrite (product) |
|---|---|
| Sessions, messages, attribution | Tag-as-script create UI |
| Phase derivation core | Depth caps |
| Private media ACL | Member seal control and `partial` status |
| Closure hook on retrospective complete | Form-default layout |
| Export surface hooks | Form as the degradation story |
| Dual-read notes | Local checklist presented as a §10 interlocutor |
| Validator block classes | Intraday agent-unavailable UX |

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

**`retrospective` is the only tag with side effects, and §11 lists them exhaustively.** No other
tag may acquire behavior without a spec bump — "smart tags" would rebuild the script selector
under a different name.

**Entry point copy is "Start conversation."** Not a row of tag chips, which implies a tag is
required before writing and is how v0.2's create flow read. Tags surface as optional labels and
filters after the fact.

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

**Migration map from the v0.2 vocabulary:**

| v0.2 | v0.4 | Note |
|---|---|---|
| `open` | `open` | Unchanged |
| `partial` | `open` | Becomes writable again. Member-visible change — see §3.1 item 1 |
| `sealed` | `closed` **only if** a completed retrospective covers its date; otherwise `open` | A member-initiated seal is not a closure and must not survive as one |

**No member-facing seal control in v0.4.** If the API retains one for a release it is marked
deprecated and is excluded from definition of done. Two seal mechanisms is the condition this
version exists to remove.

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

### 7.0 Runtime (config, fail loud)

`LABS_JOURNAL_AGENT_MODE = llm | local | off`

| Mode | Behavior |
|---|---|
| **`llm`** | External model driven by the §10 constant. Trade-log and profile context injected by code. Validator (§9.2) runs before render. This is the product mode |
| **`local`** | Deterministic, no external model. May raise absence probes once per absence key and nothing else. It **does not** simulate dialogue or present itself as an interlocutor. Test and offline use only |
| **`off`** | Agent turns fail loud (503). **Member plain-text chat remains fully available** |

Missing or invalid config fails loud at agent-turn time, never as a silent no-op
(INSTRUCTIONS §2.2). Provider binding is operational; this spec owns the mode enum and the
fail-loud contract, not a vendor.

**The primacy rule survives every mode.** An unreachable agent is not an unavailable journal
(§2). No mode may make writing conditional on the agent, and no mode may route the member to the
structured form as the only remaining path — that was v0.2's degradation story and it is void.

`local` mode cannot satisfy "the member leads" (§7.2). Shipping it as the product default would
reproduce the v0.2 frame with different plumbing.

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

**Once-only is code-enforced, not prompt-hoped.** The session carries the set of absence keys
already raised; a key present in that set cannot be raised again regardless of what the model
would say next (§9.1, §16).

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

As-built hard-codes regular hours (§3). Phase drives the §8 enforcement that protects
expected-vs-actual, so a wrong phase on a half-day silently misclassifies member intent. The
calendar lands in **J1**; an interim hard-code at approval requires an explicit Coach acceptance
with a sunset date recorded in the decision log, not a quiet carry-over.

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

### 12.1 Closure set — scope-true

**Recommended lock: close only dates the retrospective actually reviewed.**

```
close = whole NY dates from date(scope_start) through date(gather) − 1 day
```

`scope_start` is the prior retrospective's `completed_at` (v0.5 §4.1), so this set is exactly
"what this review covered," and it is cheap to compute — one range, no scanning.

The alternative — everything before the gather date — is simpler by one comparison and seals
dates in the *previous* retrospective's gather-to-complete gap, which no review ever looked at.
Under a day-seal model that was a labeling question. Now it decides whether a member loses a live
conversation on a day nobody examined, which contradicts the audit rationale that justifies
closure at all.

**Accepted consequence.** Gap dates are reviewed by nothing and therefore closed by nothing: a
session on such a date stays open indefinitely. That is the honest tail of the Option C decision
(v0.5 §4.1), and it is preferable to sealing unexamined days.

**Source of truth.** `member_journal_date_closures` is the SoR for refusal, so a 409 needs no
session scan; `closed_by_retrospective_id` and `closed_at` on the session row are denormalized
for display and must be written in the same transaction. §13's warning renders the **same set**
this section computes — never a separately derived list.

Existing closure rows from the v0.2 program may not match this set. See §3.1 item 2: never
reopen a date that is already closed.

### 12.2 Demo accounts

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
  closed_by_retrospective_id NULL,       -- denormalized for display; closures table is SoR
  closed_at NULL,
  structured_json NULL,                  -- NULL when never confirmed
  absence_keys_raised_json,              -- code-enforced once-only (§7.2); never model-controlled
  spawned_retrospective_id NULL,
  export_key, created_at, updated_at
  -- no `tag` column: tags are multi-valued, see join table below

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
| **J0** | Coach GO; §20 locks; decision-log entry (§23); **new board** — the v0.2 board is complete and is not reopened | Coach |
| **J1** | Status and tag migration (§6.3 map), chat-primary shell, market calendar config, dual-read notes | J0 |
| **J2a** | Agent contract: mode enum (§7.0), turn validator, degrade-to-plain-text, no-unprompted-during-hours, code-enforced once-only | J1 |
| **J2b** | LLM path with trade-log and profile context injection | J2a, credentials |
| **J3** | Multi-tag (optional, context-only), quick-confirm affordance, "Start conversation" entry point | J1 |
| **J4** | Optional member-invoked structured pass writing `structured_json` | J2a |
| **J5** | Private media paste-primary polish, collapse inheritance, closed-date refusal | Mike store design |
| **J6** | `retrospective` routing, link both ways, leave session open, no auto-gather | J1, retro API |
| **J7** | Single seal on retrospective complete per §12.1, 409 paths, completion warning | J1, retro complete hook |
| **J8** | Portability: export, additive import, purge, export spec bump | J1 |
| **J9** | Journey routine re-keying (§6.5) + as-built spec honesty + program close | J1 |

**Critical path:** J0 (closure lock) → J1 → J2a → J7.
**Member-visible value:** J1 plus the chat shell, then J2b.

**Order constraint, inverted from v0.2:** the agent contract lands in **J2a**, immediately after
capture. v0.2 built a form first and reached the agent late, which is the error this version
corrects. The structured pass (J4) is the add-on and ships after the agent, not before it.

**J2a/J2b are split** because the guardrails, degradation path, and once-only enforcement are
testable without a model, and they are what make the LLM path safe to turn on.

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

**J2a** — Validator blocks seeded turns containing motive language, advice, praise, a P&L figure,
a meter reference, two questions, and a chart assertion after an upload; none renders, each logs.
Repeated failure degrades to plain text capture and the session **stays open**. Mode `off` → agent
turns 503 and member text capture still works. Mode `local` raises an absence probe once and never
produces free dialogue. No depth budget: assert the agent cannot refuse a turn on grounds of
questions-used. During regular hours, no agent turn exists without a preceding member message in
that exchange. An absence key raised once cannot be raised again even when the model attempts it.
Every message carries `author` and `agent_service`.

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
| 9 | Closure keying — **LOCKED GO: scope-true** (§12.1) | Coach + India — **LOCKED 2026-07-30** |
| 10 | Lapsed/planless identity — **LOCKED GO:** no Journal create (Practice parity); Identity & Access owns whether the state exists | Coach + Mike — **LOCKED 2026-07-30** |
| 11 | Agent runtime — **LOCKED GO:** product `llm` when configured; `local` test/offline only; `off` fail-loud; plain text always | Coach — **LOCKED 2026-07-30** |
| 12 | Cadence-period adherence: missed-period detection, the interruption alert, and replacing days-since decay in Journey §4.1a. **Not this spec's work** — Retrospective + Journey amendment — but §13's multi-period closure copy depends on it existing | Coach + India + Tango |

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

Tag-driven interview scripts · interview depth budgets · a member-facing seal as product
lifecycle · the structured form as a default or required path · agent as coach or strategy
advisor · vision-model chart reading · reopening a session after a retrospective has closed its
date ·
administrator surgical edits to closed dates · member-facing capacity ratio · any required form,
tag, or sequence standing between the member and writing.

---

## 23. Decision-log entry (on Coach GO)

> **Journal Session v0.4a — chat primary, one seal.** The Journal is an always-available agent chat; the
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
> rather than to a sealed partial. Agent runtime is a config enum (`llm | local | off`) that fails
> loud and never makes writing conditional on the agent. Date closure is **scope-true** — whole
> dates from the reviewed scope start through the day before gather — so days no retrospective
> examined are never sealed. Supersedes the v0.2 program for product authority: that program is
> built and complete, its substrate is reused, and its tag-scripted form-primary UX is withdrawn.
> Uploads are Family B private media with no agent image
> interpretation; the member caption is the machine-readable layer. Date closure after a
> retrospective completes covers whole dates before the gather date, is permanent, refuses
> entries and attachments with 409, and is preceded by a warning naming the dates; demo
> fixtures are exempt via an immutable `is_demo` set at creation. Blocking dependency: agent
> identity and per-mutation attribution are unratified P2 pillar 1. No profit claims. Family B
> isolation unchanged.
