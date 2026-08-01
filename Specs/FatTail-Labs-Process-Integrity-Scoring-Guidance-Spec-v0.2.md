# FatTail Labs — Trader Process Integrity Scoring & Guidance System

**Spec version:** v0.2  
**Date:** 2026-07-31  
**Author:** Coach Ernie (intent) · bench review & rewrite  
**Status:** **SUPERSEDED** by [`FatTail-Labs-Process-Integrity-Scoring-Guidance-Spec-v0.3.md`](./FatTail-Labs-Process-Integrity-Scoring-Guidance-Spec-v0.3.md)  
**Supersedes:** `FatTail Labs — Trader Process Integrity Scoring & Guidance System v0.1.md`  
**Do not implement from v0.2** — external review (Claude) + bench synthesis landed in v0.3.  
**Parents / peers:**
- Journey Experience Spec v1.0 §4 (process meters, grades, tenure) — **as-built authority for meters today**
- Journey Gamification Spec v1.0 §3.2–3.3 (contribution vs private process; Live EWMA)
- Journal Retrospective Spec v0.7.1 (cadence H, nudge language, ceremony)
- Journal Session Spec v0.6 (practice signal dual-read)
- Member Data Privacy Spec v0.1 (Family B; opt-in; no surveillance)
- Identity / Membership Specs (role + plan → meter profile)
- Agent Model Interface Spec v1.0 (analyst agent plumbing)

**Product thesis:** stop the bleeding — process outcomes only; never P&L or profit claims in scores, grades, recommendations, or cohort marketing.

---

## 0. Review of v0.1 (evaluation)

### 0.1 What v0.1 got right

| Strength | Keep in v0.2 |
|----------|----------------|
| Process over outcome; ban P&L / win rate from scores | Sacred invariant |
| Profile-shaped targets (trial vs multi-year) | Align to **as-built** meter profiles |
| Six Journey dimensions as the core | Already shipping |
| Live as **EWMA** (near-term consistency heavier) | **As-built** (DL-166); document formula |
| Self-assessment as first-class agent context | Keep, soften “mandatory” |
| Analyst agent + explain-scores chat | Keep as phased capability |
| Mental toughness as deliberate practice, not personality | Keep framing; redesign scoring gate |
| Cohort analytics for system improvement | Keep, privacy-first |
| Research grounding (Steenbarger, Tharp, Elder, Tendler, …) | Keep for agent explainers / courseware |

### 0.2 Critical gaps and risks (v0.1)

| # | Issue | Risk | v0.2 disposition |
|---|--------|------|------------------|
| R1 | Header claimed “Formal Spec **v1.0** / Ready for multi-agent implementation / Monday launch” while file was v0.1 and scope is multi-quarter | False build authority; thrash | Status = **DRAFT**; phased delivery §16 |
| R2 | **As-built ignored:** equal average of non-empty meters, tenure pull, Establishing, empty adherence, retro cadence decay, membership-resolved profiles | Spec vs product drift | §3 as-built map; target deltas explicit |
| R3 | Navigator weights invent **Mental Toughness 15%** while MT is unbuilt; Observer example omits tenure | Unimplementable composite | Weights only over **live dimensions**; MT opt-in empty |
| R4 | MT gating rule: *force MT into composite when other scores are weak* | Punishes members who never enrolled in Hard; shame / dependency | **Empty until enrolled**; never zeros overall for non-participants |
| R5 | “Mandatory” self-assessment at onboarding | Capacity-over-dependency (Tango); trial friction | Soft invite; skip allowed; re-run anytime |
| R6 | Profiles: Observer / Activator / Navigator / Ops only | Misses **navigator_monthly vs annual**, alumni, free observer | Align to `resolve_meter_profile` set |
| R7 | Monday MVP: scoring weights + questionnaire + agent + chat + True 75 + FatTail Hard + cohort dashboard | Unshippable in one weekend without quality collapse | Phased P0–P3 |
| R8 | Peer comparison muddled with process integrity | Journey **contribution** leaderboard ≠ private process meters | Hard separation §5 |
| R9 | No empty/soon/tenure rules | Day-one Poor, “can’t use feature = 0” | Inherit Journey §4.2–4.3 |
| R10 | Cadence described as “vs planned horizon” only | As-built is last-complete decay; user intent is consistency / EWMA | Target: material-week + near-term weight §7.6 |
| R11 | FatTail Hard physical / alcohol / photo rules as scored defaults | Privacy, health liability, dark patterns if bundled | Opt-in product surface; separate consent; never membership gate |
| R12 | No privacy surface for Hard / self-assessment / agent logs | Family B leakage | §14 |
| R13 | Filename with spaces / em-dash breaks tooling norms | Repo hygiene | Canonical name: this file |

### 0.3 Verdict

v0.1 is a **strong product thesis draft**, not an implementation-ready specification.  
v0.2 keeps the thesis, **anchors scoring in as-built Journey meters**, corrects MT and composite rules, and sequences delivery so Monday (or next ship) can land **weighting + Live EWMA honesty + guidance copy** without pretending FatTail Hard and a full analyst ship in the same slice.

---

## 1. Purpose & philosophy

The Process Integrity system measures and develops the long-term **behavioral habits** that support durable trading practice. It deliberately excludes profit & loss, win rate, and any form of performance ranking by money.

**Philosophy (aligned with Steenbarger, Tharp, Elder, Tendler, Douglas; FatTail “stop the bleeding”):**

1. Process over outcome.  
2. Habits compound; outcomes fluctuate.  
3. Mental toughness is a **trainable skill**, not a fixed trait — and never a membership requirement.  
4. Trader stage (profile) changes **horizons, targets, and weights**, not moral worth.  
5. Authority comes from deliberate practice and process evidence, not credentials or P&L screenshots.

**The system exists to:**

- Score process integrity fairly across stages (trial → multi-year).  
- Diagnose gaps with context (scores + optional self-assessment).  
- Recommend **smallest effective** interventions (practice tools first; Hard only when appropriate and opted-in).  
- Give a conversational analyst that explains scores without shame.  
- Enable **privacy-safe** cohort insight so Labs can improve weights and product.

---

## 2. Sacred invariants

| ID | Invariant |
|----|-----------|
| I1 | **Never score P&L, win rate, expectancy, or dollar outcomes.** |
| I2 | **Never profit-claim** in meter labels, grades, agent copy, Hard marketing, or cohort narratives. Process outcomes only (adherence, streaks of practice, drawdown *process* language only if already in curriculum — never $ made). |
| I3 | Process meters are **private by default**. Community / contribution board is opt-in and uses a **different** formula (reputation + growth + attendance streak). |
| I4 | **Empty ≠ zero.** Features the member cannot use or has not yet touched do not drag overall via a fake 0 (Journey empty / soon rules). |
| I5 | **No day-one Poor.** Tenure + Establishing; extremes are earned (Journey §4.2–4.3). |
| I6 | Grades describe **the work**, not the person (Tango). No shame framing in nudges. |
| I7 | **Capacity over dependency.** Agent recommends; member chooses. No dark-pattern bundling of Hard, photos, or alcohol rules into membership. |
| I8 | Config / formulas **fail loud** in code; no silent weight defaults that hide misconfiguration. |
| I9 | Family B practice data (journal, trades, retros, Hard, self-assessment, agent chats about process) stays identity-scoped; export/purge-aware. |
| I10 | Standalone Labs repo; no MSC code import. |

---

## 3. Relationship to as-built (honesty map)

| Concern | As-built (2026-07-31) | v0.2 target |
|---------|----------------------|-------------|
| Dimensions | 6 meters: persistence, routine, learning, live, adherence, retrospective | Same six core; optional 7th **mental_toughness** when Hard ships |
| Overall raw | Equal average of non-empty, non-soon `raw_percent` | **Profile-weighted** average of non-empty, non-soon meters (§8) |
| Live | Weekly check-in **EWMA**, half-life 4w, profile `live_horizon_weeks` | Keep; document; optional profile half-life later |
| Adherence | Empty until ≥1 tagged trade | Keep |
| Retrospective | Days since last **completed** vs `retro_horizon_days` (linear decay) | Evolve toward **material-week consistency + near-term weight** (§7.6) |
| Profile source | Membership + role via `resolve_meter_profile` | Keep; staff override optional later |
| Tenure / grades | Square ease-in tenure; Poor…Excellent; Establishing | Keep |
| Contribution board | Separate; streak-weighted attendance in contribution | Keep separation |
| Analyst / self-assessment / Hard | Not productized as PI system | Phased P1–P3 |

**Implementation home today:** `server/journey_scores.py` · `GET /api/me/journey/scores` → `process` · UI Journey / ProcessMeter.

---

## 4. Trader profiles (scoring configuration)

Profile is **derived from membership plan + role** (as-built), not a free-text quiz alone. Self-assessment may **suggest** a staff or agent-assisted re-label later; it does not silently rewrite billing role.

| Profile id | Typical horizon | Scoring emphasis | As-built meter profile |
|------------|-----------------|------------------|-------------------------|
| `observer_trial` | ~6 weeks | Habit install: routine + learning + persistence; soft adherence; short retro H | `METER_PROFILE_OBSERVER_TRIAL` |
| `activator` | 3–12 months | Balanced consistency; rising cadence | `METER_PROFILE_ACTIVATOR` |
| `navigator_monthly` | Rolling month→quarter | Steady weeks; adherence + cadence rise | `METER_PROFILE_NAVIGATOR_MONTHLY` |
| `navigator_annual` | Season / year | Long persistence arc; cadence H longer | `METER_PROFILE_NAVIGATOR_ANNUAL` |
| `alumni` | Library year | Learning + light practice when present | `METER_PROFILE_ALUMNI` |
| `free_observer` | Getting started | Learning / pathway; many empties OK | `METER_PROFILE_FREE_OBSERVER` |
| `administrator` | Ops | Member-default metering for personal practice | `METER_PROFILE_ADMIN` |

Ops/admin **calibration** views (underlying weights, series) are staff tools — not a different moral grade for the same human practice.

---

## 5. Separation: Process Integrity vs Journey contribution

| Surface | Audience | Inputs | Purpose |
|---------|----------|--------|---------|
| **Process Integrity** (`process`) | Member only (private) | Six meters (+ optional MT) | Personal standing / guidance |
| **Contribution / board** | Opt-in peers | Reputation, personal_growth, **attendance streak** (not EWMA meter) | Community presence |

Never display Process Integrity % or grade on the public board. Never put P&L on either.

---

## 6. Core scoring principles (consistency & time)

Coach intent (2026-07-31): **reward consistency; punish lack of consistency; weight near-term heavier than long-term** (EWMA-like).

| Principle | Application |
|-----------|-------------|
| Consistency | Prefer runs of presence over sparse total counts |
| Near-term heavier | EWMA / half-life decay on time-series dimensions |
| Droughts ding | Empty intervals in the horizon pull score down even after a comeback streak |
| Comebacks recover | Near-term weight lets recovery rise faster than flat multi-month average, still &lt; continuous presence |
| No cliff mid-period | Grace where appropriate (e.g. current ISO week with no live check-in yet) |

**As-built Live already follows this.** Other dimensions migrate deliberately (not all at once).

---

## 7. Dimension catalog

All dimensions output **raw 0–100** (then tenure-adjusted for display grade). Never P&L.

### 7.1 Practice persistence (`persistence`)

| | |
|--|--|
| **Signal** | Eastern ISO weeks with any of: Trade Log fill, journal (session or legacy note), lesson complete, live check-in |
| **As-built** | `active / target` over `persistence_weeks` (+ streak in detail) |
| **v0.2 target** | Keep coverage vs target; **optional later:** EWMA of weekly practice bit with half-life ≈ 3–4 weeks (same philosophy as Live) |
| **Empty** | Never empty if profile allows practice; 0 active → raw 0 with signal rules / Establishing |

### 7.2 Daily routine (`routine`)

| | |
|--|--|
| **Signal** | Distinct days with Trade Log or Journal in `routine_window_days` |
| **Raw** | `100 * days / routine_target_days` (capped 100) |
| **v0.2** | Keep; dual-read sessions (Journal Spec) |

### 7.3 Learning rhythm (`learning`)

| | |
|--|--|
| **Signal** | Distinct days with completed lesson in `learning_window_days` |
| **Raw** | `100 * days / learning_target_days` (capped 100) |

### 7.4 Live presence (`live`) — **as-built authority**

Weekly binary presence \(x_t \in \{0,1\}\) over `live_horizon_weeks` (Eastern ISO weeks), **oldest → newest**.

**Grace:** if the current week has zero check-ins, omit it from the series (mid-week not scored absent yet).

```
α = 1 − 0.5^(1 / half_life)     # half_life = 4 weeks (LIVE_HALF_LIFE_WEEKS)
s_t = α · x_t + (1 − α) · s_{t−1}
raw% = round(100 · s_final)
```

**Detail (UI):** `{raw}% EWMA · {streak}w streak · {active}/{horizon} weeks present`  
**Leaderboard streak:** unchanged (Gamification §3.3–3.4) — not this EWMA.

| Profile | Default `live_horizon_weeks` |
|---------|------------------------------|
| observer_trial | 6 |
| navigator_monthly / activator | 16 |
| navigator_annual | 20 |
| alumni | 12 |
| free_observer | 8 |

### 7.5 Process adherence (`adherence`)

| | |
|--|--|
| **Signal** | Among trades with adherence tagged in window: % `followed` or `partial` |
| **Empty** | No tagged trades in window → **empty** (exclude from overall) |
| **Never** | Use P&amp;L, R-multiple, or win/loss |

### 7.6 Retrospective cadence (`retrospective`)

| | |
|--|--|
| **As-built** | \(d\) = days since last **completed** retro (else since practice epoch); compare to \(H = \) `retro_horizon_days`; linear decay after \(H\) (Journey §4.1a) |
| **Empty** | E1 cannot create; E2 grace first horizon with no complete; E3 no epoch |
| **Quality** | Cadence only — not prose quality (accepted tradeoff) |
| **v0.2 target (post-P0)** | **Material-week model:** weeks with material practice (trades and/or journal) expect a complete within H of week-end or of last complete; **near-term EWMA** of “on-cadence” weeks so skipped material weeks ding and recent skips ding harder. Shallow completes still stop the clock until a quality gate is separately approved. |
| **Nudge** | Invitational only when \(d &gt; H\); Tango-approved strings; never “you’re marked down” |

### 7.7 Mental toughness (`mental_toughness`) — **not as-built**

| | |
|--|--|
| **Source** | FatTail Hard / True 75 Hard compliance (§12), only if member **enrolled / opted in** |
| **Signals (when enrolled)** | Current streak; completion rate of chosen variant; daily task consistency; optional recovery after a miss (progressive variants) |
| **Empty** | Not enrolled, paused, or feature off → **empty** (exclude from overall) |
| **Forbidden** | Auto-enroll; score 0 for non-participants; gate membership or Navigator on Hard; public board exposure |

**Gating (replaces v0.1 inverted rule):**

1. Default: MT **out of composite** (empty).  
2. While enrolled and active: MT **in composite** with profile weight.  
3. If core process is already excellent, agent may still **recommend** Hard as optional antifragility work — display MT, do not force weight if member paused.  
4. Never: “your PI is low so we inject MT weight using zeros.”

---

## 8. Overall Process Integrity composite

### 8.1 As-built (interim)

```
overall_raw = mean(raw_percent of meters where not empty and not soon)
overall_graded = tenure_adjust(overall_raw)   # Journey §4.3
```

### 8.2 Target (v0.2 scoring evolution)

```
overall_raw = 100 * Σ (w_i * raw_i) / Σ w_i
  over meters i with defined raw, not empty, not soon
  w_i = profile weight for dimension i (0 if dimension N/A for profile)
```

Missing/empty dimensions **renormalize** weights (same spirit as equal average).  
Fail loud if a profile’s weight map is empty or sums to 0 after filter.

### 8.3 Profile weight tables (target)

Weights are **relative**; implement as integers that sum to 100 for the full set of **possible** dimensions; renormalize when empty.

#### Observer trial (habit install)

| Dimension | Weight |
|-----------|--------|
| routine | 25 |
| learning | 25 |
| persistence | 20 |
| live | 15 |
| adherence | 10 |
| retrospective | 5 |
| mental_toughness | 0 (empty / not offered in trial by default) |

#### Activator

| Dimension | Weight |
|-----------|--------|
| persistence | 18 |
| routine | 18 |
| adherence | 18 |
| retrospective | 16 |
| live | 15 |
| learning | 15 |
| mental_toughness | 0 until enrolled; then 10 and renormalize others proportionally **or** fixed map with MT=10 and others reduced (implement one scheme; document in code constants) |

#### Navigator monthly

| Dimension | Weight |
|-----------|--------|
| adherence | 22 |
| retrospective | 20 |
| persistence | 16 |
| routine | 14 |
| live | 14 |
| learning | 14 |
| mental_toughness | 0 empty; **12** when enrolled (renormalize) |

#### Navigator annual

| Dimension | Weight |
|-----------|--------|
| persistence | 20 |
| adherence | 20 |
| retrospective | 18 |
| live | 14 |
| routine | 14 |
| learning | 14 |
| mental_toughness | 0 empty; **12** when enrolled |

#### Alumni / free observer

Lower practice expectations; heavy empty tolerance. Prefer learning + light persistence; many dimensions empty without shame.

**Note:** v0.1 Navigator put 15% on MT always — **rejected**. MT only when enrolled.

### 8.4 Grades (unchanged bands)

| Band | Graded % | Label |
|------|----------|-------|
| poor | 0–24 | Poor |
| fair | 25–49 | Fair |
| good | 50–69 | Good |
| great | 70–84 | Great |
| excellent | 85–100 | Excellent |
| establishing | n/a | Establishing |

Blurbs and colors: Journey Experience Spec §4.2.

---

## 9. Self-assessment protocol

**Status:** P1 (not required for weighted meters).

**Purpose:** First-class **context** for the Process Integrity Analyst — not a scored dimension (unless Coach later adds a tiny “clarity” meta-signal; default **unscored**).

**Cadence:** Invited at trial start and after major plan changes; **re-run anytime**; **skip allowed** (Tango).

**Sections:**

1. Horizon & goals (survival vs long compounding) — no profit targets as “success.”  
2. Current daily / weekly routines (trading + non-trading).  
3. Physical practices (optional; free text).  
4. Self-perceived strengths and recurring process breakdowns.  
5. Learning style & appetite for structured challenge.  
6. Limitations affecting exercise choices (if Hard may be offered later).

**Storage:** Identity-scoped; private; export/purge; not on leaderboard.

---

## 10. Process Integrity Analyst agent

**Role:** Diagnose, explain, recommend — never shame, never P&L coach-as-guru.

**Inputs:**

- Current dimension raw + graded + overall + profile  
- Optional self-assessment  
- Optional Hard history if enrolled  
- Recent **process** activity summaries (counts/dates — minimize raw journal dump in context; Family B rules)  
- Prompt / model version for audit

**Outputs:**

- Plain-language “why this score”  
- Pattern callouts (e.g. strong persistence, weak adherence)  
- Ranked interventions: smallest effective first (log today → tag adherence → complete retro → optional Hard sprint)  
- Explicit “not financial advice / not profit promise”

**Behavioral rules:**

- Horizon-aware tone (trial = foundational, high frequency; annual = season-scale).  
- Prefer product actions already in Labs (Trade Log, Journal, Live, Retro).  
- Hard only if opted-in path or clear voluntary interest.  
- Log recommendations with versioned prompt (audit).

**Infra:** Agent Model Interface Spec; do not invent a second agent stack.

---

## 11. Conversational interface

Persistent entry from Journey process meter / recommendation cards → analyst chat.

| Can | Cannot |
|-----|--------|
| Explain any meter formula in plain language | Invent P&L coaching |
| Walk through recent process evidence | Access other members’ Family B data |
| Explain why a recommendation fired | Force Hard enrollment |
| Help choose Hard **variant** if member asked | Store chats without privacy policy alignment |

Tone: direct, non-judgmental, process-oriented (Coach style). Opt-in staff review of chats only with consent.

---

## 12. Mental toughness & FatTail Hard

### 12.1 True 75 Hard (third-party)

Offered **as-is** with credit to Andy Frisella. Surface: e.g. `/toughness` or Resources. Completing True 75 may feed MT **if** member links / logs compliance in Labs (explicit).

### 12.2 FatTail Hard (proprietary progressive)

**Optional** progressive program. Core ideas (reading, diet integrity, progress record, alcohol rules in stricter variants) are **program rules for enrollees**, not Labs membership law.

**Menu-driven adaptations:** workout modalities, water scaled by body weight, sprint lengths 7/14/30/45/75, progressive load.

**Scoring:** only while enrolled; feeds `mental_toughness` (§7.7).

**Agent:** Prefer short progressive sprint for trial-stage members who **ask** or whose **voluntary** assessment shows appetite — never as punishment for low PI.

**Safety / Tango:**

- Health disclaimer; not medical advice.  
- Physical limitations honored; modified menu.  
- No public shaming; photos private by default.  
- Exit anytime → MT returns to empty (no lingering zero).

---

## 13. Cohort analytics (staff)

Anonymized / aggregated only:

- PI distribution by profile  
- Days-to-habit proxies per dimension  
- Hard start / completion / retention (enrolled only)  
- Correlation of PI **trajectory** with trial → paid conversion (**not** P&amp;L correlation)  
- Common failure modes (e.g. adherence empty rate)

Feeds weight tuning and curriculum — evidence over gut.

---

## 14. Privacy & data classes

| Data | Class | Default |
|------|-------|---------|
| Process meters / overall | Personal process | Private |
| Contribution board | Opt-in public process-adjacent | journey_visible |
| Self-assessment | Family B-adjacent | Private |
| Hard compliance / photos | Sensitive personal | Private; separate consent |
| Analyst chats | Personal | Private; retention policy |
| Trade / journal / retro content | Family B | Existing isolation |

Export/purge: extend Practice Export when Hard / self-assessment / analyst land (new model_version).

---

## 15. Data model & technical notes (high level)

| Concern | Direction |
|---------|-----------|
| Score computation | **On read** preferred (as-built); optional cache if cost demands — never second write-source of truth without invalidation |
| Weights | Code constants or config table **fail loud**; versioned (`scoring_model_version`) |
| Events | Existing tables: trades, sessions, lessons, check-ins, retros, (future) hard_daily |
| Agent context | Last N days process **aggregates** + scores + self-assessment; avoid full corpus dumps |
| Audit | Recommendation rows: identity, timestamp, prompt version, model, inputs hash |

---

## 16. Phased delivery (replaces “Monday everything”)

### P0 — Scoring honesty (near-term ship)

1. Document Live EWMA in product UI hints (done in code; keep parity).  
2. Implement **profile-weighted overall** (§8.2–8.3) with characterization tests.  
3. Expose `scoring_model_version`, weights, and per-meter contribution in API for transparency.  
4. Decision log + Journey Spec cross-link.  
5. **Out of P0:** Hard, self-assessment UI, analyst, cohort dashboard.

### P1 — Guidance foundation

1. Self-assessment (skip-allowed) storage + Journey entry.  
2. Static diagnosis copy cards (rule-based) before full LLM agent.  
3. Chat shell wired to Agent Model Interface with process-only tools.

### P2 — Analyst + Hard v1

1. Process Integrity Analyst with ranked recommendations.  
2. True 75 offering page + FatTail Hard progressive menu **MVP**.  
3. MT dimension empty/enrolled path.

### P3 — Cadence EWMA + cohort

1. Retrospective material-week + near-term weight (§7.6 target).  
2. Optional persistence EWMA.  
3. Staff cohort dashboard.  
4. Courseware hooks for research grounding.

**“Monday launch”** (if still desired): **P0 only** (weights + transparency), not the full v0.1 MVP list.

---

## 17. Open questions for Coach (block build GO on these)

1. Confirm weight tables §8.3 or supply alternate integers.  
2. Half-life 4w for Live: keep, or profile-specific (trial shorter)?  
3. When enrolled in Hard, exact renormalization scheme for weights.  
4. Is True 75 / FatTail Hard in-scope for 2026 Q3 product or curriculum-adjacent only?  
5. Should self-assessment ever become a scored dimension? (v0.2 default: **no**)  
6. Cadence material-week definition: trade close days only vs any journal message day?

---

## 18. Out of scope (v0.2)

- Scoring or ranking by P&L  
- Public Process Integrity leaderboard  
- Mandatory Hard or alcohol/photo rules for membership  
- MSC shared code  
- Replacing contribution formula with EWMA (unless separate decision)  
- Full medical / coaching licensure claims  

---

## 19. Changelog (v0.1 → v0.2)

| Change |
|--------|
| Status corrected: DRAFT design authority, not “v1.0 ready / Monday full system” |
| Anchored to as-built Journey meters, tenure, empty/soon, profiles |
| Live EWMA formula locked as as-built (DL-166) |
| Overall: equal mean → **profile-weighted** target with renormalize-on-empty |
| Mental Toughness: opt-in empty; **reject** v0.1 “inject MT when weak” gate |
| Profiles expanded to monthly/annual Navigator, alumni, free |
| Self-assessment: soft, unscored by default |
| Hard: privacy, consent, non-membership-gate |
| Hard separation process vs contribution board |
| Cadence evolution path (material-week + near-term) |
| Phased P0–P3 delivery |
| Canonical filename without spaces |
| Sacred invariants + privacy + Tango capacity rules |

---

## 20. Authority

This document is the **design source of truth for Process Integrity scoring & guidance evolution**.  
**As-built meter math** remains Journey Experience Spec v1.0 §4 until P0 weight change ships and Journey Spec is version-bumped in the same body of work.

Build GO for each phase requires Coach approval of that phase’s seed packet; P0 does not authorize P2 Hard engineering.

---

**End of Specification v0.2**
