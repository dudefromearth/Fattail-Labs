# Continuous Journaling & Day-Start Routine — Product Direction (Coach)

**Date:** 2026-08-02  
**Status:** Coach product direction — education + product framing now; notification build is sequenced work  
**Decision log:** DL-191  
**Parents:** Journal Session Spec **v0.6** · Trade Log Spec **v1.1** · Practice Context · Process Flow (DL-190) · Member notifications (`member_notify.py`)

---

## 1. Thesis (locked framing)

**Journaling is not something you do at the end of the day.**

Journaling is something you do **with every experience you have throughout the day** — including:

| Moment | Intent |
|--------|--------|
| **Pre-market analysis** | Capture plan, levels, regime, bias, invalidation *before* the open — intent that Retrospective can read honestly |
| **During the session** | Decisions, hesitations, rule follows/breaks, emotional weather, “why this trade now” — as they happen |
| **With each trade experience** | Structure and fills live in **Trade Log**; thinking and process live in **Journal** (linked by date / day strip) |
| **Post-market exhale** | Close the day in process language — what held, what broke, what you release — not P&L theater |

The day is one **conversation** (Journal Session v0.6: one session per date). Messages are **timestamped**. Market **phase** (`pre_open` · `intraday` · `post_close` · …) is derived so the record is honest when you review or run a Retrospective.

**Process Flow** (DL-190) measures whether this living process is **current**. End-of-day-only journaling will never produce durable flow.

---

## 2. What already supports this (as-built)

| Capability | Spec / code | Supports continuous journaling how |
|------------|-------------|-------------------------------------|
| One conversation per date | Journal Session v0.6 §1 | Whole day is one thread — add turns all day |
| Message timestamps | v0.6 §1.4, §4 | When you wrote is visible and load-bearing |
| Market phase on each message | v0.6 §4 | Pre-open vs intraday vs post-close without member naming “phases” in UI chrome |
| Week activity bands (GX / AM / PM / CL) | v0.6 §1.6 | Visual proof that journaling happens **through** the day |
| Trades on this day strip | v0.6 §1.5 · Trade Log | Book of record sits beside the day’s thinking |
| Expected vs actual in Retrospective | Retro + `pre_open` member content | Pre-market intent is first-class process evidence |
| Practice Context date | Practice Context Spec | Day-scoped Journal + Trade Log stay aligned |
| Member in-app notifications | `member_notify` · retro material-ready | Pattern exists for Family B member inbox (not full day-start routine yet) |

**Gap is mostly framing + prompts + triggers** — not “build a second journal.” Do not invent a parallel EOD form that re-teaches end-of-day-only habit.

---

## 3. Product principles

| ID | Principle |
|----|-----------|
| CJ-1 | **Capture in the moment.** Prefer a short turn now over a perfect essay after the close. |
| CJ-2 | **Pre-market is part of the journal**, not a separate notebook. |
| CJ-3 | **Post-market is an exhale**, not a scorecard. Process language only. |
| CJ-4 | **Trade Log holds structure; Journal holds mind.** Both move through the day. Opening a trade is a journal-adjacent moment (at least a glance at the day thread). |
| CJ-5 | **No shame for sparse days.** Empty bands are information, not moral failure. Establishing / empty≠zero still apply for Process Flow. |
| CJ-6 | **Never P&L theater** in prompts, notifications, or “start your day” copy. |
| CJ-7 | **Capacity over dependency.** Notifications invite the routine; they do not nag into dependency or shame. |
| CJ-8 | Member UI does not expose internal phase enums (`pre_open`, …) as jargon — teach “before the open / during the day / after the close” in human language. |

---

## 4. Journal + Trade Log support (product checklist)

### 4.1 Journal (must feel continuous)

| Item | Direction |
|------|-----------|
| Default open | Today’s session, composer ready — no “start journaling” ceremony |
| Composer always on | Already primary; keep friction low for mid-session capture |
| Soft prompts (optional) | Time-of-day **suggestions** in human language (“Before the open: what’s the plan?” / “After the close: what do you release?”) — never blocking gates |
| Week map | Teach GX/AM/PM/CL as “you journaled in that part of the day” in course + guide |
| Tags | Tag experiences as they happen (adherence, setup family) so Process Flow quality dimensions stay honest |
| Closed dates | After Retrospective: read-only — continuous capture applies to **open** days |

### 4.2 Trade Log (must feel living)

| Item | Direction |
|------|-----------|
| Log when the experience happens | Create/edit on fill or decision — not only “tonight’s bookkeeping” |
| Sheet notes | Short process notes on the trade welcome; long narrative still belongs in Journal |
| Day strip bridge | From Trade Log row → same Practice date → Journal day in one hop (reduce friction) |
| Import | Imports may land after the fact; still encourage a **same-day** Journal turn when reviewing imported fills |
| No profit framing | List/detail stay process/structure-first (Trade Log Spec invariants) |

### 4.3 Practice Context

Account + Date remain the shared spine. Day-start routine always opens **today** in the member’s market timezone (config), with Account last-used or profile default.

---

## 5. Day-start routine notification (proposed product)

### 5.1 Intent

When the trader **starts their day**, the system **invites the routine** — open Journal (pre-market), set Practice Context, optionally glance Trade Log / Reports — so continuous journaling is the default path, not a forgotten evening task.

### 5.2 Trigger options (Coach pick for build)

| Trigger | Pros | Cons |
|---------|------|------|
| **A. Scheduled local time** (member-set “my market prep time”) | Predictable; works if they are not yet in Labs | Needs preference + timezone |
| **B. First Labs open of the day** | High intent; no extra clock UI | Misses if they only open broker first |
| **C. RTH proximity** (e.g. N minutes before open, from market calendar) | Aligns with pre-market analysis | Timezone/holiday config must be correct |
| **D. A+C** (recommended default design) | Prep alarm + open-of-app reinforcement | Slightly more product surface |

**Recommendation:** **D** — member-configured prep time (default e.g. 30–60 min before regular open for their primary session) **plus** a gentle in-app banner on first Labs visit of the calendar day if no `pre_open` member message exists yet.

### 5.3 Channels (phase)

| Phase | Channel | Notes |
|-------|---------|--------|
| **P0** | In-app member notification + optional banner on Journal/Practice/Home | Reuse `member_notifications` pattern; Family B |
| **P1** | Browser notification (permissioned) | Same as admin browser pattern; no spam |
| **P2** | Email digest optional | Off by default; process language only |
| **Out** | SMS / guilt streaks / “you failed to journal” | Banned |

### 5.4 Copy rules

- Invite: “Start the day in process — open Journal for pre-market.”
- Never: “Your score dropped,” “You missed journaling,” profit language.
- One notification per calendar day max for day-start (idempotent `period_key`).
- Suppress if member already has a **pre_open** (or human-equivalent “before open”) member message today.
- Respect Hard / life-event quiet if product later adds focus modes (coordinate Toughness).

### 5.5 Deep link

Notification opens:

`/app/journal` with Practice Context date = **today** (and optional query `?focus=prep` for soft prompt only).

Secondary actions: Trade Log (same date), Journey (Process Flow — optional, not the primary CTA).

### 5.6 Preferences

| Setting | Default |
|---------|---------|
| Day-start routine on/off | On for new members after first Practice visit (or soft-on with one-time explainer) |
| Prep time | Derived from market open − 45m until member sets |
| Browser push | Off until granted |
| Email day-start | Off |

Fail loud if market calendar / timezone config missing when computing RTH-relative triggers.

---

## 6. Education (Labs OS course + Guide)

- Course Module 3: Journal lessons teach **continuous capture**, pre-market, post-market exhale, Trade Log partnership, and day-start routine when it ships.
- Guide Journal section: same thesis in one paragraph + link to week bands meaning.
- Never teach “write your journal after the close only.”

---

## 7. Implementation sequence (suggested)

1. **Framing** — this note · DL-191 · course + Guide (this body of work).  
2. **UX soft prompts** — time-of-day composer hints (Charlie + Echo + Tango).  
3. **Trade Log ↔ Journal hop** — one-click same-date bridge if friction remains (Alpha/Charlie).  
4. **Day-start notification P0** — India thin spec amend or Member Notifications v0.1 · Alpha `member_notify` kind · preferences.  
5. **Process Flow** — optional: routine/persistence meters already reward multi-touch days; do not score “notification opened.”  
6. **Characterization tests** — idempotent day-start notify; suppress when pre-open exists; no P&L in copy.

---

## 8. Open Coach choices

| # | Choice | Default if no edit |
|---|--------|-------------------|
| 1 | Trigger set A/B/C/D | **D** |
| 2 | Default prep offset before open | **45 minutes** |
| 3 | Soft prompts always visible vs only empty band | Soft prompt if no member message in current band yet |
| 4 | Require Trade Log note on every fill | **No** — encourage Journal turn; never block fills |

---

**Cross-ref:** Journal Session v0.6 §1.6 week bands · §4 phase · Retrospective expected-vs-actual · Process Flow DL-190 · Toughness life routines (trading = life routines).
