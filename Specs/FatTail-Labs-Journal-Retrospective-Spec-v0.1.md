# FatTail Labs — Journal Retrospective & Progress Analysis Spec v0.1

**Status:** DRAFT — idea capture for Coach review; **not approved for build**  
**Date:** 2026-07-29  
**Authoring stance:** Work-through document — prefer incremental slices over a big-bang ship  
**Routes (proposed / partial ship):**
- Journal (Practice suite): `/app/journal` — calendar + day/session surface  
- **Retrospective (Practice suite, first-class nav):** `/app/retrospective` — between Journal and Playbook  
- Retrospectives remain a **kind** of Journal event, but **surface** as their own Practice player  
- Reports journal progress (proposed): `/app/reports/journal` and/or feed into **Journey** tracker  
- Journey: `/app/journey` — process progress; retrospectives **filter up** as milestones

**Family:** B (member-private) · **Entitlement:** activator+ (administrators always)  

**Parents:**
- [`FatTail-Labs-Application-Framework-Spec-v1.0.md`](./FatTail-Labs-Application-Framework-Spec-v1.0.md) — Journal as Calendar variant (T-D3), process-first (T-D5), Family B  
- [`FatTail-Labs-Member-Data-Privacy-Spec-v0.1.md`](./FatTail-Labs-Member-Data-Privacy-Spec-v0.1.md) — isolation, consent, no surveillance  
- [`FatTail-Labs-Human-Interface-Spec-v1.0.md`](./FatTail-Labs-Human-Interface-Spec-v1.0.md) — HIG chrome; domain skins only on work surfaces  
- [`FatTail-Labs-Trade-Log-Spec-v1.1.md`](./FatTail-Labs-Trade-Log-Spec-v1.1.md) — day book / trade links / process vocabulary  

**Related (not yet specified as domain docs):**
- Journal day/session model (calendar shell exists; entry CRUD Spec still open)  
- Reports trade equity surface (live prototype; formal Reports Spec TBD)  
- Vexy / agent assistance — API-only product boundary with MarketSwarm-Canonical  

**Doctrine:** Process-first. Capacity over dependency. Retrospectives analyze **adherence, process, and learning** — never profit theater. Agent assistance **amplifies the member’s reflection**; it does not replace judgment or sell “guaranteed edge.”

---

## 0. Purpose of this document

Coach intent (2026-07-29): define **retrospectives** as a Journal event type, wire the **end-of-week** ritual, and place **long-horizon journal analysis** in Reports as a **separate, agent-assisted** surface — then ship **incrementally**, without implementing until the idea is pressure-tested.

This Spec answers:

1. What is a retrospective (and what is it not)?  
2. How does tagging / creating one work in the Journal calendar?  
3. How does “roll the week’s entries” work for analysis?  
4. How does Reports use retrospectives for progress over time?  
5. Where does the agent assist (and where does it stay out)?  
6. What can we build in small, reversible slices?

**Non-goal of this draft:** implementation packets, migrations, or UI code.

---

## 1. Intent

### 1.1 Problem

Daily Journal entries (pre-market, trade reflection, end-of-day, freeform) accumulate **local** process notes. Traders also need a **periodic step back**: “What did this week teach me about my process?” That look-back is different in kind from a single day’s note.

Separately, **Reports** today is trade-path heavy (equity, drawdown, distributions). Process progress over months lives in the **Journal**, not only in fills. Without a Reports home for journal progress, retrospectives stay buried in the calendar and never compound into visible learning trajectory.

### 1.2 Success criteria (product)

| ID | Criterion |
|----|-----------|
| S1 | Member can mark / create a **Retrospective** as a first-class Journal event. |
| S2 | Creating one **prompts** end-of-trading-week confirmation and optional **week roll-up** of prior entries in the trading week for analysis. |
| S3 | Retrospectives land on **Fri / Sat / Sun** by convention (soft guidance + hard validation options — see §4). |
| S4 | A retrospective is a **period analysis artifact**, not just a tag on a random day note. |
| S5 | **Reports** has a **dedicated journal-progress surface** that consumes retrospectives (and related journal signals) over the long term. |
| S6 | Analysis is **agent-assisted** when configured; the product remains usable without the agent (fail loud when agent is required for a path, or degrade gracefully for read-only history — decide in §8). |
| S7 | Family B isolation absolute; process-first copy; no profit-claim framing of “progress.” |

### 1.3 Non-goals (this Spec version)

- Full Journal entry CRUD model (prompts, Vexy day session, voice) — **referenced**, not redefined here.  
- Replacing Trade Log Reports equity/drawdown with journal content.  
- Social / coach feed of retrospectives (consent model would be a separate Privacy amendment).  
- Mandatory weekly retrospective (product may **nudge**, never punish).  
- Shipping Vexy core into Labs (HTTP API only).  

---

## 2. Definitions

| Term | Meaning |
|------|---------|
| **Journal entry** | Member-authored process content attached to a calendar day (and optional time band / prompt kind). |
| **Entry kind** | Closed enum of entry types (e.g. `pre_market`, `trade_reflection`, `end_of_day`, `deep_dive`, `lessons`, `manual`, **`retrospective`**). |
| **Retrospective** | A Journal **event**: a periodic analysis of a **trading week** (or declared week boundary). It is both (a) content the member writes / co-writes with an agent, and (b) a **indexable milestone** for Reports progress. |
| **Trading week** | Member-relative interval ending on their **week-end day** (Friday, Saturday, or Sunday). Default proposed: **Friday** close of cash session, with preference override. |
| **Week corpus** | The set of Journal entries (and optional Trade Log day-book summary) included in a retrospective’s analysis scope. |
| **Roll-up** | Explicit member choice to treat the week’s prior entries as **input** to this retrospective’s analysis (not a silent merge that destroys day entries). |
| **Journal progress (Reports)** | Long-horizon view over retrospectives and process signals — streaks of completed weeks, themes, adherence trends, capacity language — **not** a second P&amp;L chart. |

---

## 3. Product placement

### 3.1 Practice suite navigation (locked product intent)

Retrospectives are a **first-class Practice player**, not only a tag buried in Journal.

```
Practice suite nav (order):
  Trade Log · Reports · Journal · Retrospective · Playbook
```

| Item | Route | Role |
|------|-------|------|
| Trade Log | `/app/trade-log` | Fills / blotter |
| Reports | `/app/reports` | Book path (equity, DD, distributions) |
| Journal | `/app/journal` | Day/session calendar notes |
| **Retrospective** | **`/app/retrospective`** | Week-end process events + list/timeline of retros |
| Playbook | `/app/playbook` | Personal rules / setups |

**Why its own nav button:** A retrospective is a type of **reporting and tracking of the trader’s journey** — periodic, intentional, and durable — not a daily note with a checkbox. Giving it chrome between Journal and Playbook makes the ritual discoverable and keeps Journal day-density focused.

### 3.2 Surface ownership

```
Practice suite
├── Reports              ← trade path (equity, DD, distributions)
│   └── Journal progress ← optional long-horizon journal analysis (§7)
├── Trade Log
├── Journal              ← daily/session calendar; may *create* retro events
├── Retrospective        ← FIRST-CLASS home for retro list, week ritual, analysis UX
└── Playbook

Journey (/app/journey)   ← process progress tracker; retros FILTER UP as milestones (§3.3)
```

| Surface | Owns |
|---------|------|
| **Journal** | Day/session authoring; calendar; may launch “create retrospective” for a day |
| **Retrospective** | First-class home: list/timeline of retrospectives, week confirmation, corpus roll-up, retro body, agent-assisted week analysis |
| **Reports → Journal progress** | Optional deep analytics (themes, agent longitudinal) — complementary to Retrospective home |
| **Journey** | **Aggregates** retrospective completion into the member’s learning/process journey (read model) |
| **Trade Log** | Fills only; may supply **read models** into week corpus without storing journal text |

**Invariant:** One Family B store for journal/retrospective **content**. Retrospective app and Reports/Journey **read**; they do not fork narrative storage.

### 3.3 Filter up into Journey

Retrospectives are **milestones on the trader’s journey**, not only Practice-local notes.

| Journey signal (proposed) | Source |
|---------------------------|--------|
| Retrospective completed (count / last date) | `RetrospectiveMeta` + entry |
| Weeks with vs without a retro (cadence) | week_end series |
| Link “Open latest retrospective” | deep-link `/app/retrospective` or Journal day |
| Process narrative blurb (optional) | last retro “week in one sentence” — process copy only |

**Rules:**

1. Journey **never** invents retros; it only surfaces what the member authored.  
2. Journey framing stays **process/capacity** (Tango) — not “score” or P&amp;L.  
3. Implementation is a **read model / presentation** on `/app/journey` (no second store).  
4. Missing retros → calm empty state, not shame chrome.

---

## 4. Retrospective as a Journal event

### 4.1 Mental model

A retrospective is **not** “any entry with a checkbox.” It is an **event** on the calendar:

- Distinct visual treatment (calendar chip / badge: e.g. “Retro”).  
- Default placement: member’s **week-end day** (Fri / Sat / Sun).  
- Body: structured analysis + free prose (exact template open — §9).  
- Links: `week_start`, `week_end`, `entry_ids[]` in corpus, optional trade-week summary snapshot.  

### 4.2 Timing convention

| Rule | Strength | Notes |
|------|----------|-------|
| Retrospectives **should** sit on Fri, Sat, or Sun | **Soft default** in v0.1 proposal | Matches “end of trading week” for most retail equity/index traders |
| Creating a retro on Mon–Thu | **Allowed with friction** | Confirm: “This isn’t a typical week-end day. Continue?” |
| Member **week-end preference** | Stored preference | `friday` \| `saturday` \| `sunday` — used for prompts and Reports week alignment |
| Multiple retros in one calendar week | **Discouraged** | Warn if a completed retro already exists for that week boundary |

**Open decision D1:** Hard-block Mon–Thu vs warn-only. Recommendation: **warn-only** in first ship; hard-block is hostile to crypto / non-US calendars.

### 4.3 Tagging vs creating

Two entry paths (both valid):

1. **Create as retrospective** — Day view / prompt chip / “Retrospective” action.  
2. **Promote existing entry** — Member tags an in-progress or finished day note as retrospective.

Both must run the **same confirmation flow** (§5).

### 4.4 Relationship to daily entries

Day entries remain first-class. A retrospective **references** them; it does **not** delete or absorb them by default.

| Mode | Behavior |
|------|----------|
| **Reference roll-up** (recommended default) | Retro stores `corpus_entry_ids`; analysis agent/UI reads those entries. Days stay independent. |
| **Summary snapshot** (optional) | At retro creation, store a **frozen** process summary JSON (counts, adherence tags) so later edits to day notes don’t rewrite history. |
| **Destructive merge** | **Out of scope / banned** for v0.1 |

---

## 5. Creation flow (member experience)

### 5.1 Trigger

Member chooses **Retrospective** (new or tag).

### 5.2 Confirmation dialog (mandatory)

HIG `AlertDialog` or sheet step — not browser `confirm()`.

**Questions (in order):**

1. **Is this the end of your trading week?**  
   - Yes / Not yet (still review) / Cancel  

2. If Yes (or if they continue):  
   **Use your journal entries from this trading week as the basis for this retrospective’s analysis?**  
   - Yes, include this week’s entries  
   - No, write a stand-alone retrospective  
   - (Optional advanced) Choose custom date range  

3. Show **preview corpus**: list of entry titles/kinds/dates in scope (read-only checklist; allow uncheck individual days).  

4. Confirm week boundary:  
   - `week_end` = selected calendar day (must be Fri/Sat/Sun or accepted exception)  
   - `week_start` = computed from preference (e.g. previous week-end + 1 day through week-end)

### 5.3 After confirm

- Create/update entry with `kind = retrospective`.  
- Persist `week_start`, `week_end`, `corpus_entry_ids`, `stand_alone` flag.  
- Open retrospective **analysis surface** (in Journal sheet or full day view mode “Retro”) — empty scaffold first; agent assist later (§8).  
- Calendar shows retro badge on that day.

### 5.4 Copy principles (Tango)

- Language: “process,” “adherence,” “what you practiced,” “what to carry forward.”  
- Avoid: “prove you made money this week,” leaderboard energy, shame for skipped retros.  
- Soft empty state: “No daily notes this week — you can still write a stand-alone retrospective.”

---

## 6. Analysis content of a retrospective (v0.1 shape)

Exact field schema is **open**, but the product intent is:

| Section | Intent |
|---------|--------|
| **Week in one sentence** | Capacity-oriented summary |
| **What I followed** | Process / plan adherence (qualitative + optional links to Trade Log adherence) |
| **What I broke** | Deviations without moralizing |
| **Lessons to keep** | Portable rules → may later seed Playbook (out of scope to auto-write Playbook) |
| **Carry into next week** | 1–3 concrete process intents |
| **Corpus evidence** | Read-only list of rolled entries + optional trade-week stats |

**Trade Log injection (read-only):** for the week window, show counts already available from day-book logic (opens / closes / fills) — process context, not a mini equity chart inside Journal (that stays in Reports).

---

## 7. Reports & Journey: long-horizon process tracking

### 7.0 Primary home is Practice → Retrospective

With Retrospective as a **first-class Practice nav item**, day-to-day retro authoring and the week list live at **`/app/retrospective`**. Reports and Journey **consume** that history.

### 7.1 Why also surface in Reports / Journey

Trade Reports answer: “What did the **book** do?”  
Retrospective + Journey answer: “What did **I** learn and sustain in process?”

Mixing equity and journal narrative on one scroll confuses metrics and invites P&amp;L to dominate.

### 7.2 Placement options (analytics depth)

| Option | Pros | Cons |
|--------|------|------|
| **A. Sub-route** `/app/reports/journal` | Deep analysis next to Book Reports | Second place for “journal” |
| **B. Segment on Reports** “Book \| Journal” | Fast switch | Mode complexity |
| **C. Journey cards only** | Single progress metaphor | Less room for agent longitudinal UI |
| **D. Retrospective app is enough** + Journey milestones | Simplest nav | Heavy analysis may outgrow the page |

**Recommendation:** **Retrospective app = primary**; **Journey = milestone feed**; optional **Reports Journal** later for agent-heavy longitudinal briefs (A/B) if the Retrospective page would become overloaded.

### 7.3 Views (long-term analysis)

Proposed sections (incremental):

1. **Timeline of retrospectives** — chronological cards; open full retro.  
2. **Cadence** — weeks with vs without a completed retro (habit, not scoreboard).  
3. **Themes** — tags/topics extracted over time (agent or member tags).  
4. **Process signals** — if Trade Log adherence is linked: % weeks with notes, not $ P&amp;L.  
5. **Agent longitudinal brief** — optional: “Patterns across your last N retrospectives” (§8).  

### 7.4 Explicitly not on this page

- Equity curve, drawdown $, profit factor (remain on Book Reports).  
- Profit claims in copy or chart titles.

---

## 8. Agent assistance

### 8.1 Roles

| Moment | Agent role (conceptual) |
|--------|-------------------------|
| **Day session** | Vexy-style conversation for daily process (already product direction; separate slice) |
| **Retrospective composition** | Help synthesize week corpus into draft sections; member edits and owns final text |
| **Reports journal progress** | Longitudinal pattern notes across retros; questions that promote capacity |

### 8.2 Boundaries

1. **API-only** to MarketSwarm / Vexy gateway — no MSC code in Labs.  
2. **Member always owns** the saved retrospective body.  
3. Agent output is **suggestion**, not silent overwrite.  
4. **Fail loud** when agent is unavailable if the member chose “generate with agent”; always allow full manual write.  
5. **Privacy:** week corpus sent to agent only with in-product consent pattern consistent with Family B (detail in Privacy amendment if cross-service).  
6. **No dependency theater:** agent does not become required to “have a valid week.”  

### 8.3 Open decision D2

Ship retrospectives **manual-first** (no agent) in slice 1, agent composition in slice 2, longitudinal agent in slice 3 — see §10.

---

## 9. Domain model (sketch — India to formalize)

> Not a migration. Illustrative entities for review.

```
JournalEntry
  id, identity_id
  day (date)                  -- calendar day
  kind                        -- enum including retrospective
  title, body_md (or blocks)
  prompt_key?                 -- e.g. end_of_day
  created_at, updated_at

RetrospectiveMeta  (1:1 with entry when kind=retrospective)
  entry_id
  week_start, week_end
  week_end_preference_used    -- fri|sat|sun
  stand_alone (bool)
  corpus_entry_ids (JSON)
  trade_week_snapshot (JSON?) -- optional frozen counts
  agent_session_id?           -- if co-authored

MemberJournalPrefs
  identity_id
  week_end_day                -- fri|sat|sun
  retrospective_nudge         -- bool
```

**Reports** reads `RetrospectiveMeta` + entry bodies (member-scoped only).

---

## 10. Incremental delivery (proposed slices)

No coding until Coach approves the idea and India locks model boundaries. Order is **value + risk**, not a commitment.

| Slice | Name | Delivers | Depends | Agent? |
|-------|------|----------|---------|--------|
| **P0** | Practice nav + Retrospective shell | Suite item **Journal · Retrospective · Playbook**; `/app/retrospective` page chrome | Practice suite | No |
| **J0** | Journal entry spine | Persist day entries (minimal kinds + body); calendar marks days with content | Privacy + AF | No |
| **J1** | Retrospective kind + calendar badge | Create retro event on Fri/Sat/Sun; soft warn other days | J0, P0 | No |
| **J2** | Week confirmation + corpus roll-up | Dialog §5; `corpus_entry_ids`; stand-alone option | J1 | No |
| **J3** | Manual retro template | Structured sections §6; edit/save on Retrospective page | J2 | No |
| **Y0** | Journey milestone feed | Journey shows retro count / last retro / link into Practice | J1 | No |
| **R0** | Reports → Journal progress shell | Optional deep analytics sub-nav | J1 | No |
| **R1** | Cadence + open retro | Habit view; deep-link | R0 or P0 list, J2 | No |
| **A1** | Retro co-author | Agent draft from corpus; member accepts/edits | J3 + agent gateway | Yes |
| **A2** | Longitudinal brief | Agent patterns across N retros | Y0/R1 + A1 | Yes |

**Principle:** Each slice is demosable and useful alone. Agent is **never** on the critical path for “having a retrospective.”

---

## 11. Open questions for Coach

| ID | Question | Options / lean |
|----|----------|----------------|
| **D1** | Hard-block retros mid-week? | Lean: **warn only** |
| **D2** | Agent timing | Lean: **manual slices first** (J0–R1), then A1/A2 |
| **D3** | Default week-end day | Lean: **Friday** |
| **D4** | Deep analytics placement | Lean: **Retrospective app primary**; Journey milestones; Reports Journal optional later |
| **D4b** | Practice nav order | **Locked lean:** Trade Log · Reports · Journal · **Retrospective** · Playbook |
| **D5** | Frozen trade-week snapshot at retro create? | Lean: **yes**, small JSON counts only |
| **D6** | One retro per week hard limit? | Lean: **warn**, allow second with reason |
| **D7** | Crypto / 24-7 week definition later? | Defer; preference model allows custom later |
| **D8** | Name: “Retrospective” vs “Week review” | Product copy — Tango |

---

## 12. Risks

| Risk | Mitigation |
|------|------------|
| Retro becomes empty ritual / shame cadence | Soft nudges; no red “missed week” scores; Tango review of copy |
| Agent dependency | Manual path always complete; agent optional |
| P&amp;L creeps into Journal progress | Spec ban + Delta copy check; no equity on Journal progress page |
| Corpus over-sends private notes to agent | Explicit consent; minimum corpus; Privacy § |
| Scope explosion (full Journal + Vexy + Reports) | Strict slice table; Coach gates between slices |

---

## 13. Review path (when Coach wants formal approval)

Per [`agents/bench/spec-create-review-workflow.md`](../agents/bench/spec-create-review-workflow.md):

1. **Coach** — intent confirmed / adjusted (§11 decisions)  
2. **Juliet** — fold decisions into v0.2 ready for gates  
3. **India** — store shape, Family B, Reports read model  
4. **Echo + Tango** — dialog UX, calendar badge, progress page HIG + psychology  
5. **Mike** — agent payload / privacy if A1+  
6. **Hotel** — process vocabulary honesty  
7. **Coach** — approve for build → Lima decision log → Juliet seeds under e.g. `agents/p-journal-retro/`  

**Until then:** Spec remains **DRAFT**; **no implementation**.

---

## 14. Summary (one paragraph)

A **retrospective** is a first-class **Practice** player (nav between Journal and Playbook) and a Journal **event** at the end of the member’s trading week (Fri/Sat/Sun by convention) that optionally **rolls that week’s entries into a corpus for analysis**, without destroying daily notes. Retrospectives **filter up into Journey** as process milestones and may later feed deeper Reports journal analytics. **Agent assistance** layers only after a solid manual path. Ship **incrementally** from Practice shell → entry spine → retro kind → week dialog → template → Journey feed → agent.

---

## 15. Change log

| Date | Change |
|------|--------|
| 2026-07-29 | v0.1 DRAFT — Coach idea capture; retrospectives + Reports journal progress + incremental slices; no build |
| 2026-07-29 | v0.1.1 — Retrospective **first-class Practice nav** (between Journal and Playbook); **Journey** milestone feed; slice **P0** shell ship |
