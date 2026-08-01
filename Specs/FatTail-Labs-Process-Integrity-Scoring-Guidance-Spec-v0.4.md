# FatTail Labs — Process Integrity Scoring & Guidance

**Spec version:** v0.4  
**Date:** 2026-07-31  
**Status:** **Track A P0 AS-BUILT** (2026-07-31) — weighted overall + dual-empty + model version shipped in `journey_scores.py`; Journey Experience Spec §4.1 amended same day. Formal India/Tango retrospective gate still welcome; not a block on running code.  
**Supersedes:** v0.3 · v0.2 · v0.1  
**Coach decision (2026-07-31):** §3.0 **Option 1 — rebalance** (not rename). Process Integrity keeps its name; adherence + retrospective carry real weight from day one.  
**Implementation SOT for weights/formulas:** Journey Experience Spec v1.0 §4.1 (amended) + `server/journey_scores.py` (`SCORING_MODEL_VERSION`, `PROCESS_METER_WEIGHTS`). §3.4–3.6 below remain design mirror until next EOL pass; **prefer Journey + code on conflict**.  

**Reviews (input only — not India/Tango standing):**

- v0.1 blocks: `agents/bench/reviews/2026-07-31-pi-scoring-v01-external-review.md`  
- v0.3 design: `agents/bench/reviews/2026-07-31-pi-scoring-v03-design-review.md`  
- Flag register: [`Architecture/flagged-ideas.md`](../Architecture/flagged-ideas.md) (FI-001…)

**Authority hierarchy (no self-SSOT):**

1. Coach + `Architecture/00-decision-log.md`  
2. **As-built meters:** Journey Experience Spec v1.0 §4 + Gamification §3.2–3.3 **until P0 lands**  
3. **This document:** Track A design intent for evolution only  
4. **EOL:** When P0 ships, §3.2–3.11 **migrate into Journey Experience Spec v1.1** (or next minor). Those sections are then **struck here** and replaced by a pointer. Weights and formulas must not live in two places.

**Parents:** Journey Experience v1.0 · Gamification v1.0 · Journal Retro v0.7.1 · Journal Session v0.6 · Member Data Privacy v0.1 · Identity/Access · Agent Model Interface v1.0  

**Product thesis:** stop the bleeding — **habits that support process consistency**; never P&L, win rate, or profit claims.

---

## 0. What changed v0.3 → v0.4

| Change |
|--------|
| **Coach decision required:** engagement-heavy vs true process integrity (§3.0, Q6) |
| Fix **weighted mean** (drop erroneous `100 ·` when raw is already 0–100) |
| **Weight tables for all seven** `meter_profile` ids |
| **Dual empty** for adherence: no trades vs untagged trades |
| No Coach-**waiver** instrument for prototypes — **defined synthetic scope** only |
| Self-assessment **not collected** until Track B GO |
| Floor-support + graduation: **checkable** entry criteria (proposed) |
| Track A **never reads journal content** |
| Model migration: **mandatory** version stamp + shadow period |
| Contribution board: shared check-in **source**, no PI values on board |
| Language: “weight recent behavior more heavily” — not “punish” |
| FI register path explicit |

---

## 1. Three tracks (phasing — not permission to delete Coach scope)

| Track | Name | Coach intent | Build sequencing |
|-------|------|--------------|------------------|
| **A** | Deterministic **scoring** (six core meters + weights) | **Shipped** P0 Option 1 | Live |
| **B** | Analyst + chat | **In scope** (Coach v0.1) | After phase routing + scoped agent credentials |
| **C** | **FatTail Hard / True 75 / Mental Toughness** | **In scope (Coach)** — explicitly added in v0.1; **never Coach-removed** | Separate engineering plan; privacy/counsel are **build constraints**, not authority to drop the product |

**Process failure (2026-07-31, corrected):** An external review + agent rewrite marked Track C “PARKED / never feeds composite” **without Coach decision or notification**. That was unauthorized de-scope. **Restored by Coach 2026-07-31 (this correction).** See DL-173.

Independent **implementation** GO per track remains (don’t ship Hard inside a weights-only PR). That is sequencing — **not** “Hard is out of the product.”

---

## 2. Sacred invariants

| ID | Invariant |
|----|-----------|
| I1 | Never score P&L, win rate, expectancy, or dollar outcomes. |
| I2 | Never profit-claim in labels, grades, guidance, or cohort narratives. |
| I3 | Process Integrity is **private**. No member-visible **PI** peer rank or PI leaderboard. |
| I4 | Empty ≠ zero — but **two empties** for adherence (§3.5); untagged trades are not “empty.” |
| I5 | No day-one Poor; tenure + Establishing. |
| I6 | Grades describe **the work**, not the person. |
| I7 | Capacity over dependency — **checkable graduation** (§11). |
| I8 | Config/formulas fail loud. |
| I9 | Family B isolation; export/purge-aware. |
| I10 | No MSC code import. |
| I11 | No conversion-tuned weights. |
| I12 | Floor-support over escalation when integrity drops sharply (§9) — **checkable**. |
| I13 | Agents do not write role / `role_override` / `meter_profile` without scoped agent identity + audit. |
| I14 | Track C (Hard / MT) is **Coach product scope**. Implementation must satisfy Privacy, consent, and safety design — agents **may not** remove or “park forever” Track C without **explicit Coach disposition and notification**. |
| I14a | Mental Toughness / Hard compliance **empty until enrolled**; never zero overall for non-participants; never membership gate. When enrolled, MT **may** enter the composite per §5 (Coach intent). |
| I15 | Track A **does not read journal message body text** (or agent chat body) for scoring or distress. |
| I16 | Name matches formula under Option 1: quality dimensions (adherence + retrospective) carry real weight from day one — composite is not engagement-majority by design (§3.0, §3.6). |

---

## 3. Track A — Scoring

### 3.0 Conceptual decision — **LOCKED: Option 1 (Coach 2026-07-31)**

**Problem (accepted):** Engagement-majority trial weights made the composite a Labs show-up meter wearing a Process Integrity jacket.

**Decision:** **Option 1 — rebalance.** Keep the name **Process Integrity**. Adherence + retrospective carry **real weight from day one** for every profile, including Observer trial. Establishing/tenure absorb early-tenure noise — **not** engagement-heavy weights.

| Rejected | |
|----------|--|
| **Option 2 — rename** | Not chosen. We do not ship a separate “Practice engagement” overall for trial. |

**Consequences:**

- §3.6 Option 1 tables are **canonical for P0** (not “proposed”).  
- Quality share (adherence + retro) at trial = **45%**.  
- Dual-empty adherence (§3.5) is mandatory so quality weight cannot be renormed away by never tagging.  
- FI-017 → `ADOPTED`.

### 3.1 As-built home

`server/journey_scores.py` · `GET /api/me/journey/scores` → `process`.

### 3.2 Dimensions (six core)

| id | Label | Class | As-built signal |
|----|-------|-------|-----------------|
| `persistence` | Practice persistence | Engagement-of-tools | Weeks with TL / journal / lesson / live vs target |
| `routine` | Daily routine | Engagement-of-tools | Days TL or journal / target |
| `learning` | Learning rhythm | Engagement-of-tools | Lesson days / target |
| `live` | Live presence | Engagement-of-community | EWMA of weekly check-in 1/0 (half-life 4w) |
| `adherence` | Process adherence | **Practice quality** | Among tagged trades: % followed+partial — see dual empty |
| `retrospective` | Retrospective cadence | **Practice quality** | Days since last completed vs H |

**Seventh dimension (Coach scope — not yet as-built):** `mental_toughness` when member is enrolled in FatTail Hard / linked True 75 compliance (§5). Empty until enrolled.

### 3.3 Live EWMA (gradeable)

```
x_t ∈ {0,1} per Eastern ISO week, oldest → newest, length = live_horizon_weeks
Grace: omit current week if empty
α = 1 − 0.5^(1/4)
s_t = α·x_t + (1−α)·s_{t−1}
raw_i = round(100 · s_final)     # integer 0–100
```

**Shared source:** check-ins also feed contribution **attendance streak** (different formula). No PI-derived percent or grade may appear on the contribution board. Detail may still show streak weeks on the private live meter.

### 3.4 Overall composite (gradeable — arithmetic fixed)

All dimension `raw_i` are on **0–100** (percent integers), same as as-built.

**As-built (until P0 ships):**

```
overall_raw = mean(raw_i)   # over meters not empty and not soon; result 0–100
overall_graded = tenure_adjust(overall_raw)
```

**P0 target:**

```
# raw_i ∈ [0, 100], w_i > 0 integers
overall_raw = round( Σ(w_i · raw_i) / Σ w_i )
# NOT 100 · Σ(w_i · raw_i) / Σ w_i   ← that would be 0–10000 if raw is already percent
```

If only a subset of meters is non-empty, sum only those `w_i` (renormalize).  
Fail loud if Σ w_i == 0 after filter.

### 3.5 Adherence — dual empty (P0 required)

Let in adherence window:

- `n_trades` = count of fills/structures in window (implementation: same grain as today for tagging — **trades rows** in log)  
- `n_tagged` = trades with adherence set and not unknown  
- `n_good` = tagged as followed or partial  

| Condition | Meter state | raw | Rationale |
|-----------|-------------|-----|-----------|
| `n_trades == 0` | **empty** | excluded | Genuinely no trading signal here |
| `n_trades > 0` and `n_tagged == 0` | **live, not empty** | **0** | Avoidance of measurement — must not renorm away |
| `n_tagged > 0` | live | `round(100 · n_good / n_tagged)` | Honest tagging |

**As-built bug to fix:** today `tagged == 0` → empty even when trades exist → weight reallocates to engagement meters (honest taggers lose). P0 characterization tests must cover this.

### 3.6 Weight tables (all seven profiles) — **canonical (Option 1)**

Weights are integers; sum to 100 for the **six core** meters while MT is empty/unenrolled.  
When MT is enrolled and non-empty, add MT weight and **renormalize** or use a published seven-weight map (Coach/Alpha; fail loud).  
Quality (adherence + retrospective) is never a token share among the six.

| Profile | persist | routine | learning | live | adherence | retro | Quality % |
|---------|---------|---------|----------|------|-----------|-------|-----------|
| `observer_trial` | 15 | 15 | 15 | 10 | **25** | **20** | **45** |
| `activator` | 14 | 14 | 12 | 12 | **24** | **24** | **48** |
| `navigator_monthly` | 12 | 12 | 10 | 12 | **28** | **26** | **54** |
| `navigator_annual` | 14 | 12 | 10 | 12 | **26** | **26** | **52** |
| `alumni` | 15 | 10 | **25** | 10 | 20 | 20 | **40** |
| `free_observer` | 15 | 15 | **30** | 10 | 15 | 15 | **30** |
| `administrator` | *identical to `navigator_monthly`* | | | | | | **54** |

**Notes:**

- Free observer still has higher **learning** (pathway) but adherence+retro are **not** residual afterthoughts (30% quality).  
- Alumni: learning library weight up; quality still 40%.  
- Establishing/tenure still softens day-one Poor/Excellent — do not re-inflate engagement weights to “protect” new members.

Every id from `resolve_meter_profile` **must** map to a row above. Fail loud if missing.

### 3.7 Grades

Poor 0–24 · Fair 25–49 · Good 50–69 · Great 70–84 · Excellent 85–100 · Establishing.  
Journey §4.2–4.3.

### 3.8 Separation from contribution board

| | Process Integrity | Contribution board |
|--|-------------------|-------------------|
| Visibility | Private | Opt-in |
| Inputs | Six meters + weights + tenure | Reputation, growth, attendance **streak** |
| Check-ins | Live **EWMA** (private) | Streak weeks (opt-in board) |
| Rule | **No PI % / grade / EWMA on the board** | |

Same underlying check-in events; different computations; no cross-leak of PI values.

### 3.9 Consistency language (Coach intent)

**Reward consistency; weight recent behavior more heavily than older behavior** (EWMA-like).  
Do **not** use “punish” in product copy or invariants.

### 3.10 Model migration (P0 mandatory if weights change)

1. `scoring_model_version` **required** on `process` API (not optional).  
2. **Shadow-compute** new overall alongside old for a Coach-chosen period (recommend ≥ 7 days in staging; production: either shadow API field `overall_raw_next` or internal-only until cutover).  
3. On cutover: one-time in-product note: “How we calculate your process score was updated — same activity, clearer emphasis on plan-following and review” (Tango-safe; no shame).  
4. Prefer cutover when median member delta is small, or accept a known one-time jump with the explainer.

### 3.11 Characterization tests (P0)

- Weighted mean arithmetic (vector of raws → overall; no 100× blow-up)  
- All seven profiles resolve weights without fail-loud  
- Adherence: trades present + zero tags → raw 0, **included**  
- Adherence: zero trades → empty, excluded  
- Live EWMA cases (existing)  
- Option 1 quality-share on trial profile (adherence+retro weights present; dual-empty included)  

### 3.12 Spec owner (Track A)

Coach · Juliet · India (Journey amend) · Alpha · Kilo · Lima · Tango (copy).  
Formal gates: India → Tango (copy/capacity) → Coach → Lima. External reviews are **evidence**, not standing.

---

## 4. Track B — Analyst (blocked)

Unchanged intent. Prerequisites: phase routing, scoped agent credentials, Family B tools, floor-support policy, paraphrase-only research, no profile writes.

**Prototype scope (no waiver):** offline or staging agents against **synthetic** identities and fixtures only; **no production member records**; **no member-facing exposure**. That is a defined scope, not a doctrine waiver.

---

## 5. Track C — FatTail Hard / True 75 / Mental Toughness (**Coach scope — restored**)

### 5.0 Status

| | |
|--|--|
| **Product** | **In scope.** Coach added this in v0.1 and **never removed it.** |
| **As-built (code)** | Not implemented yet (Track A P0 was six meters only). |
| **Unauthorized de-scope** | v0.3/DL-169 “PARKED / never feeds composite” — **void** as product decision (DL-173). |

### 5.1 Intent (from Coach v0.1 — preserved)

- **True 75 Hard** (Andy Frisella) offered with credit.  
- **FatTail Hard** — proprietary progressive / menu-driven variant (reading, diet integrity, workouts, water, sprint lengths, etc. as product design evolves).  
- **Mental Toughness** dimension fed by compliance (streak, completion rate, consistency).  
- Agent may recommend Hard as a voluntary path — **not** as punishment for low PI (floor-support still applies: do not escalate hardship *because* scores crashed).  
- Never a membership / Navigator gate.  

### 5.1a Why Hard exists (Coach thesis — aMCC / willpower)

**Coach product thesis (2026-07-31):** FatTail Hard and related deliberate-challenge protocols are designed to train **persistence and willpower** via repeated voluntary difficulty — associated with the **anterior mid-cingulate cortex (aMCC)**, sometimes called the “willpower muscle.”

### 5.1b Physiological underpinnings — **must be cited** (Coach requirement)

The program **shall cite its physiological underpinnings**. Hard is not “just discipline slogans.” Member-facing surfaces (intro, Toughness hub, enroll flow, MT meter hint, agent explainers, related courseware) **must** include:

1. **What** is being trained (**mental toughness** / persistence under cost–effort tradeoffs).  
2. **Where** in the brain the literature situates that capacity (**aMCC**).  
3. **Why** voluntary hard practice is the intervention logic (repeated challenge / effort under load).  
4. **Named sources** (paraphrase-and-attribute; full cite list on a Sources / Further reading block — **no bulk copyrighted excerpts** in LLM output).  
5. **Product term:** **mental toughness** (not “tenacity” in member UI). Paper titles may still say tenacity.

**Canonical science pack (minimum — expand with Hotel/Bravo before curriculum ship):**

| Source | Role in product narrative |
|--------|---------------------------|
| Touroutoglou, A., Andreano, J., Dickerson, B. C., & Barrett, L. F. (2020). *The tenacious brain: How the anterior mid-cingulate contributes to achieving goals.* **Cortex, 123**, 12–29. https://doi.org/10.1016/j.cortex.2019.09.011 | Primary review: aMCC as network hub for effort/persistence capacity (paper term: tenacity); map to product **mental toughness** |
| Supporting lines cited *through* that literature (effort valuation, persistence, grit connectivity — e.g. work discussed in the Cortex review on aMCC–striatum, effort willingness, stimulation/perseverance case literature) | Secondary — only after Hotel verify + paraphrase; never invent paper titles |
| 75 Hard / high-compliance challenge / military selection **as practice analogues** | Cultural / protocol analogy — **not** peer-reviewed proof that Labs grew aMCC |

**Allowed claim shape (examples):**

- “Research on the **anterior mid-cingulate cortex (aMCC)** links this region to **mental toughness** — persisting when effort is costly (see Touroutoglou et al., 2020, *Cortex*).”  
- “FatTail Hard is built as **repeated voluntary challenge** so you train mental toughness under load — the same capacity that literature associates with aMCC function.”  
- Meter: “Mental Toughness scores **your compliance with the challenge you chose** — a process signal, not a brain scan.”

**Forbidden claim shape:**

- “We guarantee your aMCC will grow / thicken.”  
- “This is medical treatment / diagnosis.”  
- Profit or trading-edge claims from brain growth.  
- Uncited “science says” or Huberman-only meme without primary literature.  
- Bulk quotes from papers without rights.

**Ship gates for any aMCC copy:**

| Gate | Owner |
|------|--------|
| Source pack accurate + paraphrase-only | **Hotel** (+ Bravo source pack) |
| No shame / capacity-over-dependency | **Tango** |
| Citation block present on Toughness surfaces | **Sierra / Charlie** (implementation) |
| Agent tools include source IDs when explaining MT/Hard | **Track B** when built |

**Product consequences:**

1. Hard is **not** a gimmick side quest — it is Process Integrity’s **physiological + behavioral capacity** story.  
2. MT meter scores **behavior** (compliance), while **education cites physiology**.  
3. Floor-support still forbids Hard *as punishment* for a PI crash.  

### 5.2 Scoring rules (Coach intent, restored)

1. **Empty until enrolled** — non-participants do not get MT raw 0 in the composite.  
2. **When enrolled and active:** MT **enters** the composite with a published weight; six-meter weights renormalize or use a seven-weight map (fail loud).  
3. **Never** inject MT with zeros because other meters are weak (v0.1 inverted gate stays rejected).  
4. Compliance signals: streak, completion rate, daily consistency; optional recovery after miss for progressive variants.  

### 5.3 Engineering constraints (not removal authority)

These are **build requirements** for Track C implementation — they do **not** authorize dropping the product:

- Privacy Spec expand for any sensitive data (photos, health-adjacent fields)  
- Consent, retention, export/purge  
- Safety / Tango review of diet-photo-streak mechanics before production  
- Trademark / counsel for True 75 and FatTail Hard naming as needed  
- Scoped storage and no board exposure of Hard compliance  

### 5.4 Next

**H0 complete (DL-177):** Build authority →  
`Specs/FatTail-Labs-Hard-Mental-Toughness-Spec-v1.0.md` · program `agents/p-fattail-hard/`.  
**H1 next:** domain + privacy + API. Do not re-“park” without Coach written disposition.

---

## 6. Purpose

Measures **behavioral habits that support process consistency**.  
Not an outcome promise of “durable trading results.”

---

## 7. Self-assessment

**Not collected** until Track B GO (data minimization — Privacy v0.1).  
No questionnaire UI, storage, or prompts in Track A P0.

---

## 8. Cohort analytics firewall

Process metrics only for weight research. **Never** convert conversion/revenue into `w_i`.

---

## 9. Floor-support (checkable — proposed; Coach may retune)

**Trigger (any):**

- `overall_raw` drops by **≥ 15 points** week-over-week, or  
- `overall_graded` enters **Poor** after previously ≥ Good, or  
- Member opens support / human channel (product path when exists)

**Behavior (Track A product + any future Track B prompt):**

| Do | Do not |
|----|--------|
| Recommend **one** smallest Labs practice action | Stack obligations |
| Prefer calm, factual meter explanation | Shame / streak-or-die |
| Offer human/support path if product has one | Auto-enroll Hard **because** PI crashed; stack obligations |
| | Scan journal **content** for “distress” |

**I15:** Track A does not read journal bodies. Any future distress design is a separate consent surface with human in the loop — not this score.

FI-011 remains until Coach ratifies numbers.

---

## 10. Graduation (checkable — proposed)

**Enter `graduated_soft` display mode** when all hold for **28 days**:

- `overall_graded` ≥ Great (≥ 70) for that window, and  
- Member has not opened PI Analyst chat (if any) more than **2** times in 28 days, and  
- Adherence is non-empty at least once in window **or** no trades (empty adherence OK)

**Behavior:** default score presentation collapses to **weekly digest** (less daily nag); full meters still available on demand.  
**Exit:** any floor-support trigger or grade &lt; Good.

Aspirational copy alone is not enough for I7 — this state is the mechanism. Coach may retune thresholds (FI-021).

---

## 11. Agent identity

Scoped agent principal before any member-data tools.  
No “Coach waived the gate” language in this spec.

---

## 12. Phased delivery

### P0 — Track A only

1. ~~Coach Option 1/2~~ — **done: Option 1**  
2. Dual-empty adherence + §3.6 weight tables + fixed composite arithmetic in `journey_scores.py`  
3. `scoring_model_version` + migration plan (shadow)  
4. Journey Experience Spec amend (**same body of work**); then **EOL** weight sections here → pointer  
5. Characterization tests  
6. India + Tango formal gates → Coach build GO  
7. Lima DL on ship  

**Out of P0 (sequencing only — still in product scope):** Track B, Track C implementation, self-assessment collection, journal scanning, conversion dashboards.

---

## 13. Open questions for Coach

1. ~~Option 1 vs 2~~ — **Option 1 locked**  
2. ~~§3.6 integers~~ — shipped as-is in P0  
3. Track B → P2 or P3/Golf?  
4. ~~Is Track C on the roadmap?~~ — **Yes (Coach). Restored.** Remaining: when to schedule Track C build, MT weight when enrolled  
5. Floor-support drop threshold 15 pts / graduation 28 days — keep or retune?  
6. Shadow period length for model migration?  
7. Track C priority vs other work — order FatTail Hard / True 75 implementation?

---

## 14. Ideas inventory

| Idea | Status |
|------|--------|
| Six dimensions, no P&L | `ADOPTED` |
| Live EWMA | `ADOPTED` as-built |
| Three tracks (phasing) | `ADOPTED` |
| Weighted overall (Option 1) | `ADOPTED` as-built P0 |
| Dual-empty adherence | `ADOPTED` as-built P0 |
| Engagement vs PI honesty | `ADOPTED` Option 1 |
| Analyst + chat | `ADOPTED` product scope · implement deferred Track B |
| **FatTail Hard / True 75 / MT** | **`ADOPTED` product scope (Coach)** · implement deferred Track C · **not removed** |
| MT empty until enrolled; in composite when enrolled | `ADOPTED` design §5.2 |
| Floor-support / graduation checkable | `OPEN` proposed §9–10 |
| FI register | `Architecture/flagged-ideas.md` |

---

## 15. Changelog

| Ver | Note |
|-----|------|
| v0.1 | Thesis; SSOT claim; inverted MT; **Hard in product** |
| v0.2 | As-built; MT empty-until-enrolled |
| v0.3 | Three tracks; **unauthorized** Hard “park forever” from external review fold-in |
| v0.4 | Option 1 + P0 code; design review fixes |
| v0.4+ | **Hard restored** as Coach scope (DL-173); never remove Coach features without Coach + notice |
| v0.4 | Design review: engagement fork; formula/empty/tables; EOL; no waiver; checkable I7/I12; model migration |

---

**End of Spec v0.4** — DRAFT. External reviews inform; India/Tango still own formal gates when Coach requests them.
