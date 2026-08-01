**FatTail Labs — Trader Process Integrity Scoring & Guidance System**  
**Document version:** v0.1 (historical)  
**Date:** 31 July 2026  
**Author:** Coach Ernie / FatTail Labs  
**Status:** **SUPERSEDED** by [`FatTail-Labs-Process-Integrity-Scoring-Guidance-Spec-v0.2.md`](./FatTail-Labs-Process-Integrity-Scoring-Guidance-Spec-v0.2.md)  
**Note:** This file remains for history. Do not implement from v0.1.

---

### 1. Purpose & Philosophy

The Process Integrity system measures and develops the long-term behavioral habits that produce durable trading results. It deliberately excludes profit & loss, win rate, and any form of performance ranking.

Core philosophy (aligned with Mark Douglas, Van Tharp, Alexander Elder, Brett Steenbarger, and Jared Tendler):

- Process over outcome.
- Habits compound; outcomes fluctuate.
- Mental toughness is a trainable skill, not a personality trait.
- Different trader stages require different targets, weightings, and interventions.
- Authority comes from real-world results and deliberate practice, not credentials alone.

The system exists to:

- Score process integrity accurately and fairly across trader stages.
- Diagnose gaps with full context (scores + self-assessment).
- Recommend precise interventions, including the FatTail Hard mental-toughness program.
- Give the trader a conversational agent that can explain scores and guide improvement.
- Enable cohort-level insight so the Labs team can improve the system itself.

---

### 2. Core Principles

1. Never score P&L or win rate.
2. Compare process participation only with peers who opt in.
3. Weightings, floors, and highlighted metrics change by trader profile.
4. Self-assessment data is first-class input to the agent.
5. Mental toughness is scored as its own dimension and can be gated into the overall Process Integrity score.
6. Recommendations must be actionable, time-horizon aware, and proportionate.
7. The system must remain usable by both six-week Observer trial members and multi-year Navigators.

---

### 3. Trader Archetypes / Profiles

Four primary profiles. Each profile has its own scoring configuration.

| Profile | Typical Horizon | Primary Goal | Key Characteristics |
|---------|-----------------|--------------|---------------------|
| Observer Trial | 6 weeks | Habit installation & survival | High weight on Daily Routine + Learning Rhythm. Lower floors on Process Adherence. |
| Activator | 3–12 months | Consistency & process ownership | Balanced weights. Rising emphasis on Retrospective Cadence. |
| Navigator | 1–3+ years | Refinement & antifragility | Highest weight on Process Adherence + Retrospective Cadence + Mental Toughness. |
| Ops / Admin | Internal | System calibration | Uses member defaults for metering; full visibility into underlying calculations. |

Profile is set at onboarding and can be updated by staff or by the agent after significant score changes or self-assessment updates.

---

### 4. Scoring Model

#### 4.1 Primary Dimensions (from original Journey UI)

- **Practice Persistence** — weeks active with Trade Log / Journal / lessons / live check-in (target & streak based).
- **Daily Routine** — days with Trade Log or Journal entries in last 7 days.
- **Learning Rhythm** — days with completed lessons in last 14 days.
- **Live Presence** — EWMA of live check-ins (half-life ≈ 4 weeks).
- **Process Adherence** — percentage of trades tagged as followed / partial (not P&L).
- **Retrospective Cadence** — days since last completed retrospective vs planned horizon.

#### 4.2 Overall Process Integrity Score

Weighted composite of the six dimensions above.  
Weights and minimum floors are profile-specific.

Example (simplified):

- Observer Trial: Daily Routine 25%, Learning Rhythm 25%, Practice Persistence 20%, Live Presence 15%, Process Adherence 10%, Retrospective 5%.
- Navigator: Process Adherence 25%, Retrospective Cadence 20%, Practice Persistence 15%, Daily Routine 15%, Live Presence 10%, Mental Toughness 15%.

Color scale remains: Poor → Fair → Good → Great → Excellent.

#### 4.3 Mental Toughness Dimension (new)

Scored from FatTail Hard compliance data:

- Current streak length
- Completion rate of chosen program variant
- Consistency of daily tasks
- Optional: recovery speed after a missed day (for progressive versions)

Gating rule:  
If the trader’s other Process Integrity scores are already high (e.g., ≥ 85% overall and no dimension below “Good”), Mental Toughness is displayed but does **not** enter the composite score.  
If any core dimension is weak or the trader is in a trial / early Activator stage, Mental Toughness is gated into the composite.

---

### 5. Self-Assessment Protocol

Mandatory lightweight interview / questionnaire at onboarding and available for re-run at any time.

Sections:

1. Trading horizon & goals (short-term survival vs long-term compounding).
2. Current daily / weekly routines (trading + non-trading).
3. Physical conditioning practices (workouts, walks, breathwork, etc.).
4. Self-perception of strengths and recurring breakdowns.
5. Preferred learning style and tolerance for structured challenge.
6. Any physical limitations that affect exercise choices.

The agent uses this data as primary context when generating recommendations.

---

### 6. Process Integrity Analyst Agent

**Role:** Diagnose, explain, and recommend.

**Inputs:**
- Current dimension scores + overall Process Integrity
- Profile + time horizon
- Self-assessment answers
- FatTail Hard history (if any)
- Recent activity logs (Trade Log, Journal, lessons, live)

**Outputs:**
- Plain-language diagnosis of why each score is where it is
- Pattern detection (e.g., strong persistence but weak adherence)
- Ranked, concrete recommendations
- When appropriate: specific FatTail Hard entry point (True 75 Hard, progressive sprint, or modified menu)

**Behavioral rules:**
- Tailor language and urgency to horizon (six-week trial members receive higher-frequency, foundational recommendations).
- Never recommend P&L-focused actions.
- Prefer the smallest effective intervention first.
- Always offer the conversational follow-up path.

---

### 7. Conversational Interface (Chatbot)

Every score page and recommendation includes a persistent chat entry point to the Process Integrity Analyst.

Capabilities:
- Explain any metric in plain language
- Walk through the underlying data
- Answer “why this recommendation?”
- Help the trader choose or adjust a FatTail Hard variant
- Log the conversation for later review by the agent or staff (opt-in)

Tone: direct, non-judgmental, process-oriented, Coach Ernie style.

---

### 8. Mental Toughness & FatTail Hard Integration

#### 8.1 True 75 Hard
The original free program by Andy Frisella is offered as-is (full credit given).  
Location: labs.fattail.ai/toughness (or equivalent).

#### 8.2 FatTail Hard (proprietary progressive program)

**Core rules retained:**
- Daily reading (10 pages non-fiction)
- Consistent diet with zero cheating
- Daily progress photo / record
- No alcohol (or social-only in softer variants)

**Adaptable elements (menu-driven):**
- Workout options: full two 45-min sessions, single session, Japanese / Hindu squats, chair work, breathwork, 10k steps, rucking, Vinyasa / Bikram yoga, Tai Chi, Matt Furey-style bodyweight, weight training, etc.
- Water goal scaled by body weight (default ≈ 0.5 oz per lb, with pacing guidance)
- Sprint lengths: 7 / 14 / 30 / 45 / 75 days
- Progressive difficulty: start light, increase load or duration

**Scoring:**
- Daily compliance tracked
- Streak and completion percentage feed the Mental Toughness dimension
- Gating logic as defined in §4.3

**Agent recommendations:**
When Process Integrity or Mental Toughness is low, the agent offers the appropriate entry point (short progressive sprint first for most trial members).

---

### 9. Cohort Analytics

Aggregate (anonymized) views for Labs staff:

- Distribution of Process Integrity scores by profile
- Average days-to-habit formation for each dimension
- FatTail Hard start / completion / retention rates
- Correlation between Process Integrity trajectory and Observer → Activator / Navigator conversion
- Identification of common failure modes

These analytics feed continuous improvement of weightings, recommendations, and course content.

---

### 10. Authority & Research Grounding

The system is explicitly grounded in:

- Brett Steenbarger — Plan-Act-Review-Refine loop, deliberate practice, solution-focused journaling, performance process.
- Van Tharp — Position sizing psychology, beliefs, Peak Performance modeling.
- Alexander Elder — Trading for a Living process discipline.
- Jared Tendler — Mental Game, tilt recognition, emotional control as skill.
- Real-world results from 75 Hard (Andy Frisella) and similar high-compliance programs.
- Mental toughness literature (Goggins, Jocko Willink, MTQ48 research, deliberate hardship protocols).

Citations and short excerpts appear in the agent’s explanations and in the accompanying courseware so traders understand why the system is constructed this way.

---

### 11. Data Model & Technical Notes (high level)

- Canonical member profile + process event stream.
- Scores computed nightly + on-demand.
- Agent context window includes last 90 days of activity + full self-assessment + current scores.
- All recommendations logged with versioned prompt / model for auditability.
- Privacy: community presence remains opt-in; Mental Toughness and detailed process data default private.

---

### 12. MVP Scope for Monday Launch

Must ship:

1. Core six-dimension scoring with profile-aware weightings (at least Observer Trial + Navigator).
2. Self-assessment questionnaire.
3. Process Integrity Analyst agent with basic diagnosis + FatTail Hard recommendation path.
4. Simple chatbot interface.
5. True 75 Hard offering + first version of FatTail Hard progressive menu (even if limited options).
6. Basic cohort dashboard for internal use.

Can follow immediately after launch:
- Full progressive FatTail Hard app polish
- Additional profiles
- Deeper EWMA / streak algorithms
- Courseware generated by the multi-agent course builder

---

**End of Specification**

This document is the single source of truth for the multi-agent bench implementation.