# FatTail Labs — Process Integrity Scoring & Guidance

**Spec version:** v0.3  
**Date:** 2026-07-31  
**Status:** **SUPERSEDED** by [`FatTail-Labs-Process-Integrity-Scoring-Guidance-Spec-v0.4.md`](./FatTail-Labs-Process-Integrity-Scoring-Guidance-Spec-v0.4.md)  
**Supersedes:** v0.2 · v0.1 (historical)  
**Do not implement from v0.3** — design review (formula, dual-empty, engagement fork) landed in v0.4.

**Authority hierarchy (no self-SSOT):**

1. Coach decisions + `Architecture/00-decision-log.md`  
2. **As-built meters:** Journey Experience Spec v1.0 §4 + Gamification §3.2–3.3 (until amended)  
3. **This document:** design intent for evolution; track A may amend Journey when P0 ships  
4. Never: a draft declaring itself the sole multi-agent source of truth  

**Parents:** Journey Experience v1.0 · Gamification v1.0 · Journal Retro v0.7.1 · Journal Session v0.6 · Member Data Privacy v0.1 · Identity/Access · Agent Model Interface v1.0  

**Product thesis:** stop the bleeding — **habits that support process consistency**; never P&L, win rate, or profit claims in scores, grades, guidance, or cohort marketing.

---

## 0. What changed v0.2 → v0.3 (Claude + bench)

| Change |
|--------|
| **Three tracks** with independent GO (scoring / analyst / Hard) |
| **No agent mutation** of entitlement or `meter_profile` without scoped agent identity (Mike) |
| **FatTail Hard removed from scoring SOT** — separate track; counsel + DPIA before any data class; **default: never feeds PI composite** |
| **Floor-support rule** when scores drop sharply (reduce demand; human path — not Hard escalation) |
| **Graduation / capacity** explicit |
| **Conversion firewall** on weight tuning |
| **Peer PI ranking forbidden**; contribution board remains separate opt-in surface |
| **`meter_profile` naming** — derived only; not a parallel “trader archetype” field agents write |
| Research: **paraphrase-and-attribute only**; FatTail lineage (Victor/Whiskey/Yankee) optional frame |
| **No “floors” without values** — removed undefined floors; use empty/tenure/Establishing |
| Gradeable formulas + **P0 characterization tests** required |
| Spec owner + review path; **no Monday full-system launch** |
| MT inverted gate remains **rejected** (v0.2) |

---

## 1. Three tracks (phase routing)

| Track | Name | What | Phase routing | Build GO |
|-------|------|------|---------------|----------|
| **A** | Process Integrity **scoring** | Deterministic meters, weights, tenure, private overall | **P1 maintenance / Journey amend** — no new conversational agent | Coach GO on this track alone |
| **B** | Process Integrity **Analyst + chat** | Explain scores; recommend Labs practice actions | **P2 or P3 (Golf / Ask Vexy)** — Juliet routes; **do not guess** | Blocked until routing + **scoped agent credentials** + Family B tools |
| **C** | **FatTail Hard / True 75 / body-compliance** | Optional hardship program | **Separate product track** | Counsel + DPIA first; **out of PI scoring by default** |

v0.1’s single document assumed one system. **v0.3 forbids implementing B or C from Track A GO.**

If phase routing is unclear for Track B: **ask Juliet — do not build.**

---

## 2. Sacred invariants

| ID | Invariant |
|----|-----------|
| I1 | Never score P&L, win rate, expectancy, or dollar outcomes. |
| I2 | Never profit-claim in meter labels, grades, agent copy, or cohort narratives. |
| I3 | Process Integrity is **private**. No member-visible **PI** leaderboard or peer rank. |
| I4 | Empty ≠ zero (Journey empty/soon). |
| I5 | No day-one Poor; tenure + Establishing (Journey §4.2–4.3). |
| I6 | Grades describe **the work**, not the person. |
| I7 | **Capacity over dependency** — suggestions teach; graduation path required (§11). |
| I8 | Config/formulas fail loud. |
| I9 | Family B isolation; export/purge-aware. |
| I10 | No MSC code import. |
| I11 | **No conversion-tuned weights** — commercial conversion must not enter weight optimization (§10). |
| I12 | **Floor-support over escalation** when integrity drops sharply (§9). |
| I13 | **Agents do not write** membership role, `role_override`, or `meter_profile` without scoped agent identity + audit (§12). |
| I14 | Track C health/body data **never** silently joins Track A composite. |

---

## 3. Track A — Scoring (only track eligible for near-term build)

### 3.1 As-built home

`server/journey_scores.py` · `GET /api/me/journey/scores` → `process` · UI ProcessMeter.

### 3.2 Dimensions (six core)

| id | Label | As-built raw signal |
|----|-------|---------------------|
| `persistence` | Practice persistence | Weeks with TL / journal / lesson / live vs target over horizon |
| `routine` | Daily routine | Days with TL or journal in window / target |
| `learning` | Learning rhythm | Lesson-complete days / target |
| `live` | Live presence | **EWMA** of weekly check-in 1/0 (half-life 4w) — DL-166 |
| `adherence` | Process adherence | % followed+partial among tagged trades; **empty** if none tagged |
| `retrospective` | Retrospective cadence | Days since last **completed** vs `H`; linear decay (Journey §4.1a) |

**No seventh dimension in Track A** until Track C is separately approved to feed a score (default: never).

### 3.3 Live EWMA (gradeable)

```
x_t ∈ {0,1} per Eastern ISO week, oldest → newest, length = live_horizon_weeks
Grace: omit current week if empty (mid-week)
α = 1 − 0.5^(1/4)    # LIVE_HALF_LIFE_WEEKS = 4
s_t = α·x_t + (1−α)·s_{t−1}
raw% = round(100 · s_final)
```

### 3.4 Overall composite

**As-built (until P0 ships):**

```
overall_raw = mean(raw_i) for meters not empty and not soon
overall_graded = tenure_adjust(overall_raw)
```

**P0 target (Coach GO required):**

```
overall_raw = 100 · Σ(w_i · raw_i) / Σ w_i
  for non-empty, non-soon meters; renormalize if some empty
```

Weights: integers per `meter_profile` (see §3.6). Fail loud if sum of applicable weights is 0.

**No undefined “minimum floors.”** Use empty, Establishing, and tenure caps instead. If a future floor is needed, it must ship with numeric threshold + behavior in the same amend.

### 3.5 `meter_profile` (not “trader archetype” field)

| Rule | |
|------|--|
| **Name** | `meter_profile` (as-built `resolve_meter_profile`) |
| **Source** | Membership plan + role derivation only (`role_override` → best plan → observer) |
| **Not** | A parallel staff/agent-writable “Observer/Navigator scoring persona” that shadows entitlement |
| **Vocabulary** | Profile **ids** may match plan language for UX, but they are **config keys**, not a second identity |

| id | Emphasis |
|----|----------|
| `observer_trial` | Routine + learning + persistence |
| `activator` | Balanced; cadence rising |
| `navigator_monthly` | Adherence + cadence + steady weeks |
| `navigator_annual` | Long persistence arc |
| `alumni` / `free_observer` / `administrator` | As-built |

### 3.6 Weight tables (P0 target — six dimensions only)

Sum = 100. MT weight = 0 (Track C out).

**Observer trial:** routine 25 · learning 25 · persistence 20 · live 15 · adherence 10 · retrospective 5  

**Activator:** persistence 18 · routine 18 · adherence 18 · retrospective 16 · live 15 · learning 15  

**Navigator monthly:** adherence 22 · retrospective 20 · persistence 16 · routine 14 · live 14 · learning 14  

**Navigator annual:** persistence 20 · adherence 20 · retrospective 18 · live 14 · routine 14 · learning 14  

Alumni / free: implementation may use lighter targets via existing profile windows; prefer empty over fake zeros.

### 3.7 Grades

Unchanged bands: Poor 0–24 · Fair 25–49 · Good 50–69 · Great 70–84 · Excellent 85–100 · Establishing.  
Journey Experience §4.2–4.3.

### 3.8 Separation from contribution board

| | Process Integrity | Contribution board |
|--|-------------------|-------------------|
| Visibility | Private | Opt-in `journey_visible` |
| Formula | Meters + weights + tenure | Reputation + growth + **attendance streak** |
| Peer rank | **Forbidden for PI** | Allowed only as existing contribution board |

Do not revive “compare process participation with peers” as a PI feature. Contribution is a **different** product surface (already shipped).

### 3.9 Characterization tests (P0 mandatory)

Any weight/composite change must extend `server/tests/test_journey_scores.py` (and related) with:

- Equal vs weighted overall for a fixed meter vector  
- Empty adherence excluded + renormalize  
- Live EWMA: perfect series = 100; recent drought &lt; comeback (existing)  
- Tenure Establishing not day-one Poor  

“It should work” is banned (doctrine).

### 3.10 Spec owner (Track A)

| Role | Agent |
|------|--------|
| Product | Coach |
| Orchestration | Juliet |
| Architecture / SOT | India (Journey amend when P0 ships) |
| Implementation | Alpha (+ Charlie UI if labels) |
| Tests | Kilo |
| Docs | Lima (DL same day) |
| Experience copy | Tango on any new member-facing strings |

Review path for **build authority:** India → (Echo if UI) Tango → Coach → Lima.  
No specialists for Hard/agent on Track A GO.

---

## 4. Track B — Analyst agent + chat (blocked)

**Intent (preserved, not discarded):** plain-language diagnosis of meters; smallest effective Labs actions (log, tag, retro, live).

**Blocks before any implementation:**

1. Juliet **phase routing** (P2 content-ops vs P3 Golf / Ask Vexy).  
2. **Scoped agent credentials** — no member-facing agent operating on admin session cookies; per-mutation attribution (Mike).  
3. Tool policy: read process **aggregates** + scores; minimize Family B dumps; no writes to trades/journal without explicit product + auth design.  
4. **No writes** to `role_override`, plan, or `meter_profile`.  
5. Tone: non-judgmental; **floor-support** when scores crash (§9) — never prescribe Track C hardship because PI is low.  
6. Research in replies: **paraphrase and attribute** only — no bulk unreviewed copyrighted excerpts.  
7. FatTail lineage optional (Victor / Whiskey / Yankee) for preservation/antifragility framing — deliberate, not cargo-cult slogans.

**Graduation of agent dependence:** Track B must teach the member to read meters without the chat; chat is training wheels, not permanent oracle (§11).

---

## 5. Track C — FatTail Hard / True 75 (parked; separate SOT)

**Intent (preserved):** deliberate practice / antifragility as optional work — **not** membership law.

**External review (accepted):** this changes data class and business risk:

- Daily **progress photos** → highly sensitive; Privacy Spec expand + DPIA  
- Zero-cheat diet + photo + streaks → disordered-eating risk; screening/exclusions/disclaimers required before product  
- Water g/oz by body weight → health prescription risk  
- Self-assessment of conditioning / limitations → special-category health data (GDPR)  
- **75 Hard / Andy Frisella** trademark and derivative “FatTail Hard” → **counsel**, not “full credit” alone  

**v0.3 rules:**

1. Track C is **not** part of Track A scoring SOT.  
2. Default: compliance **does not** enter Process Integrity composite.  
3. Any future feed requires a **new versioned** decision + Privacy amend + Coach GO.  
4. Never recommend Track C because PI is low (§9).  
5. Never gate membership or Navigator on Hard.

---

## 6. Purpose (Track A language)

Measures **behavioral habits that support process consistency** in trading practice.  
Not: “produce durable trading results” as an outcome promise.  
Not: performance ranking by money.

Philosophy: process over outcome; habits compound; stage changes horizons/weights not worth; stop-the-bleeding thesis.

---

## 7. Consistency & time (Coach)

Reward consistency; punish inconsistency; **near-term heavier** (EWMA-like).  
Live as-built. Cadence/persistence EWMA = later flags (FI-006), not Track A P0 required.

---

## 8. Self-assessment (optional context — Track B dependency)

- Unscored by default  
- Invite / skip allowed (not mandatory onboarding gate)  
- No special-category health fields in v0.3 Track A  
- If later used for Hard eligibility, that is Track C + Privacy  

---

## 9. Floor-support rule (Tango — mandatory design)

When Process Integrity **drops sharply** or sits in Poor/Fair with distress signals (to be defined in implementation: e.g. large week-over-week raw drop, or member language in journal/agent):

| Do | Do not |
|----|--------|
| Reduce recommended load (one small practice action) | Prescribe max hardship / Hard / 75-day challenge |
| Prefer human / community support path if available | Shame, streak-or-die copy |
| Explain which meter moved and why (facts) | Stack new obligations |

**Missing in product today:** crisis path, human escalation, distress detection — **open design** under FI-011; Track B must not ship without a minimal version of this rule in prompt + product policy.

---

## 10. Cohort analytics firewall

Staff aggregates may study PI distributions and habit formation.

**Forbidden:** using Observer→paid **conversion** (or revenue) as an objective to retune dimension weights.  
**Allowed:** process outcomes, retention of practice habits, empty-meter rates, member opt-in research.

If conversion appears in a dashboard, it is **ops**, not an input to `w_i`.

---

## 11. Capacity over dependency & graduation

Sacred: the score teaches independence.

| Question | v0.3 answer |
|----------|-------------|
| At what point does a member need the score less? | When they can state their weak meter and next action without the agent; grade stable Great+ with low agent use |
| What does the system do? | Surface less nags; celebrate process maintenance; agent offers “you already know this loop” exit ramps |
| Forbidden | Dark patterns that maximize daily opens of the score for its own sake |

---

## 12. Agent identity (Mike prerequisite for Track B)

Today risk: agents on admin cookies → unscoped writes.  

**Hard prerequisite:** scoped agent principal, least privilege, audit log per mutation.  
**Until then:** Track B read-only prototypes only under explicit Coach waiver logged — default **no**.

---

## 13. Phased delivery (Track A focused)

### P0 — Scoring honesty (only near-term ship candidate)

1. Optional: profile-weighted overall (§3.4–3.6) + API transparency (`scoring_model_version`, weights)  
2. Journey Experience Spec amend in **same** body of work  
3. Characterization tests §3.9  
4. UI copy: habits / process consistency; Live EWMA honesty  
5. **Out:** agent, chat, Hard, photos, conversion dashboards, MT dimension  

### Later (other tracks)

- Track B after routing + credentials + floor-support policy  
- Track C after counsel + DPIA; still default no composite  
- Cadence material-week EWMA (FI-006)  
- Staff cohort (process metrics only)  

**No “Monday full system” date** on unreviewed multi-track work.

---

## 14. Open questions for Coach

1. Ratify P0 weight tables §3.6?  
2. Track B → P2 or P3/Golf?  
3. Is Track C in 2026 roadmap at all, or curriculum-only link out?  
4. Floor-support thresholds (numeric drop definition)?  
5. Contribution board: keep as-is (opt-in streak/reputation) without any PI peer view? (v0.3 assumes yes)

---

## 15. Ideas inventory (preserved)

| Idea | Status |
|------|--------|
| Six process dimensions, no P&L | `ADOPTED` Track A |
| Live EWMA near-term | `ADOPTED` as-built |
| Profile-weighted overall | `FLAGGED` FI-001 — P0 candidate |
| Analyst + chat | `DEFERRED` Track B FI-003/008 |
| Self-assessment | `RESHAPED` soft/unscored |
| FatTail Hard / MT in composite | `PARKED` Track C FI-002/010 — default no feed |
| Cohort conversion tuning | `RESHAPED` — **forbidden** as weight input FI-013 |
| Floor-support / human path | `FLAGGED` FI-011 |
| Graduation path | `FLAGGED` FI-012 |
| Material-week cadence EWMA | `FLAGGED` FI-006 |
| FatTail lineage in explainers | `FLAGGED` FI-015 |

---

## 16. Changelog

| Ver | Note |
|-----|------|
| v0.1 | Coach thesis; false SSOT/Monday; inverted MT; Hard in composite |
| v0.2 | As-built anchor; MT empty-until-enrolled; phases; EWMA documented |
| v0.3 | Three tracks; Claude blocks folded; Hard out; floor-support; conversion firewall; agent write ban; no self-SSOT; tests; graduation |

---

**End of Spec v0.3** — design draft. Track A P0 requires Coach GO + India on Journey amend. Tracks B/C require separate GO.
