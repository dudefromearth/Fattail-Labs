# Dual-Goal Product Strategy

**Date:** 2026-07-29  
**Status:** Strategy for Coach review — not an approved Spec  

## The two primary goals

| ID | Goal | Audience | Success looks like |
|----|------|----------|-------------------|
| **G1** | **Engage Observer** — solid habits + trust in FatTail coaching | **Observer** members — **6-week membership term**; **full Navigator Practice access** for that term (sole product difference vs Navigator is term length — DL-128) | **Primary (Coach 2026-07-29):** maximize **Observer → Navigator** upgrade + continued practice. Supporting: show up, stop-the-bleeding path, live/coaching touch, habit, trust. Fair alumni/course access if they leave remains doctrine — never bait-and-switch. |
| **G2** | **Continuous improvement path** — measure → act → report | **Activator** and **Navigator** members | They can measure process (not fantasy P&L), get analysis they trust, act on suggestions, and see improvement if they stay — tools make discipline **material**, not theatrical |

These goals are **sequential for a person** (trial → paid continuum) but **parallel as product investments**. **G1 = trust + habit → Navigator upgrade.** **G2 = retention + process outcomes** once paid.

**Tier note (Coach 2026-07-29):** The marketed path is **Observer trial → Navigator**.
**Activator** is a **legacy** self-directed membership — not advertised, few signups.
Keep it working for existing/self-serve members; do not design funnel or marketing
around it. Free accounts without trial are not on the retrospective create path.

### G1 north star (Coach lock)

> **Maximize Observer → Navigator upgrades while they keep practicing** — process-first, no shame, no profit theater. Every trial surface (home, process meter, pathway, live) should make the next practice step obvious and make continuing as Navigator the natural next chapter when trust and habit form.

---

## Access reality (as-built — design against this)

| Capability | Typical Observer (no plan) | Trial if role is Navigator | Activator | Navigator |
|------------|----------------------------|----------------------------|-----------|-----------|
| Free previews / signup | Yes | Yes | Yes | Yes |
| Full courses (paid gates) | Limited / upgrade | Full if trial grants navigator | Full | Full |
| Live **coaching** category | No | Yes (if navigator) | Partial* | Yes |
| Live **members** category | No | If activator+ | Yes | Yes |
| **Practice** (Trade Log / Reports / Journal) | **No** (activator+) | **Yes** if trial = navigator | Yes | Yes |
| Discord / app (per membership FAQ) | Trial: yes when full access | Yes | Yes | Yes |

\*Activator FAQ: courses, Discord, app, Friday coach call — not daily room / Sunday retro.

**Implication for G1:** Observer **has** full Navigator Practice access for 6 weeks (Coach lock). UX may still **sequence** onboarding (habit + trust first) without locking features.

**Implication for G2:** Practice harden (H0–H3) is the **measurement spine**. What’s missing is habit loop completion (Journal spine, Retrospective, Playbook) and “suggestions/analysis you act on” without profit claims.

**Coach action:** Align trial length (4 vs 6 weeks) and role grants in Spec + marketing so product design doesn’t assume the wrong gate.

---

## Goal × grade lens (from Product Value Assessment)

| Goal | Usefulness gap | Practicality gap | Consumer value gap |
|------|----------------|------------------|--------------------|
| **G1 Trial** | Clear first-week path; coaching trust moments | &lt;30 min to “I know what to do next” | Trial feels like the real program, not a locked demo |
| **G2 Paid CI** | Weekly ritual + measurable process path | Logging cost &lt; insight returned | Staying improves capacity; tools prove it |

A+ for the **whole product** requires **both** goals green. Optimizing only Trade Log for veterans fails G1. Optimizing only course teaser fails G2.

---

## North-star outcomes (process-only)

### G1 — Trial (habit + trust → Navigator)

| Metric (propose) | Target idea |
|------------------|-------------|
| **Observer → Navigator conversion** | Primary commercial + mission metric |
| Practice continuation into paid (process meter / Practice activity after upgrade) | Secondary — upgrade *and* keep practicing |
| Day-0 → first lesson of flagship started | ≤ 24 h for engaged trial |
| Week-1 live or coach-touch rate | Majority of active trials |
| Week-2 pathway progress (lessons or modules) | Non-zero for retained trials |
| Soft process touch (journal or trade log) before convert | Habit sample, not power-user dump |
| Trust proxy: “would continue coaching” / no “bait” complaints | Trend up; honest conversion UX |
| Support load: “what do I do?” tickets | Down after onboarding ship |

### G2 — Activator / Navigator (continuous improvement)

| Metric (propose) | Target idea |
|------------------|-------------|
| Weekly active Practice users (log or journal or retro) | Rising among retained paid |
| Retrospectives created / member / month | ≥ 2 after Retro ships (soft) |
| Adherence / process fields filled on trades | Rising quality, not volume spam |
| Drawdown / path reviews opened after loss weeks | Usage of Reports for process |
| Self-reported capacity outcomes (streak, rule adherence) | In-product or survey — **never profit claims** |
| Churn after 90 days among Practice-active | Lower than Practice-inactive |

---

## Product principles (both goals)

1. **Stop the bleeding first** — pathway always routes through flagship.  
2. **Process outcomes only** — no profit theater in suggestions or reports.  
3. **Capacity over dependency** — tools amplify judgment; agent never required for G2.  
4. **Trust is a feature** — isolation, honest estimated PnL, transparent trial access.  
5. **Progressive disclosure** — trial sees a **guided path**; paid sees the **full loop**.  
6. **Measure what you can coach** — adherence, open book hygiene, review cadence, rule fidelity — not “alpha.”

---

## Capability model by tier

### G1 path — “6-week trust ladder” (conceptual weeks)

| Week | Member job | Product must make easy | Trust mechanism |
|------|------------|------------------------|-----------------|
| **0–1** | Orient + stop bleeding curriculum | Pathway CTA, flagship first lesson, membership clarity | Clear “what you get / what happens after trial” |
| **1–2** | Show up to coaching/live | Live schedule, join path, post-session “what to do next” | Face time with coaching program |
| **2–3** | First process habit | Micro-habit: 1 journal note **or** 1 trade log process field — not full blotter mastery | Small win, low shame |
| **3–4** | Connect method to practice | Lesson → “try this in Journal/Trade Log” deep links | Coaching language matches product |
| **4–6** | Choose to **continue as Navigator** | Honest conversion: what changes after trial; continuous improvement path clear; process meter already showing their trial habits | Practice value already sampled; fair alumni if they leave — but design for **upgrade + continued practice** |

**What we do *not* push in week 1:** full multi-account blotter power-user mode, Playbook completeness, agent analysis.

### G2 path — “continuous improvement loop”

```text
Capture  →  Measure  →  Review  →  Decide  →  Act  →  Report
(Trade    (Reports     (Journal/   (Playbook  (next    (Journey /
 Log)      analytics)   Retro)      rules)     week)    optional share with coach later)
```

| Stage | Tool | G2 requirement |
|-------|------|----------------|
| Capture | Trade Log | Easy import + process fields; activator+ |
| Measure | Reports | Trusted path/DD/process stats (domain harden done) |
| Review | Journal + Retrospective | Daily notes + weekly roll-up (mostly **missing**) |
| Decide | Playbook | Rules you can follow (shell today) |
| Act | Pathway + live + next week’s log | Suggestions = process, not tips to print money |
| Report | Journey + future coach pack | Milestones; optional export for coach conversation |

---

## Work packages — dual-goal priority (impact × effort)

**Impact scores 1–5 on the *stated* goal** (G1 or G2). Effort 1–5 engineering/product weeks (approx).

### Packages that serve **G1 (trial engagement & trust)**

| ID | Package | G1 impact | Effort | I/E | Notes |
|----|---------|-----------|--------|-----|-------|
| **T1** | **Trial home / “This week’s job”** — single dashboard strip: next lesson, next live, one habit | 5 | 3 | 1.67 | Highest trial leverage |
| **T2** | **Flagship + pathway enforcement** — always land on stop-the-bleeding first | 5 | 2 | 2.50 | Mostly product rules + content |
| **T3** | **Live/coach join reliability + post-session CTA** | 5 | 2–3 | ~2 | Trust in *coaching*, not app chrome |
| **T4** | **Trial day-0 onboarding checklist** (5 steps, completable) | 4 | 2 | 2.00 | Practicality |
| **T5** | **Micro-habit: “process note” without full Journal Spec** — optional thin note on Journey or lesson complete | 4 | 3 | 1.33 | Or wait for J0 |
| **T6** | **Honest trial marketing / access Spec alignment** (4 vs 6 weeks; what stays after) | 4 | 1 | 4.00 | Trust; legal/copy |
| **T7** | **Gentle Practice intro** — after week 2, optional “log one process trade” CTA | 3 | 2 | 1.50 | Don’t block trial on blotter |
| **T8** | **Course discussion / community touchpoints** if already gated for trial | 3 | 2 | 1.50 | Belonging |

### Packages that serve **G2 (continuous improvement)**

| ID | Package | G2 impact | Effort | I/E | Notes |
|----|---------|-----------|--------|-----|-------|
| **P1** | **Journal entry spine (J0)** | 5 | 4 | 1.25 | Capture reviews |
| **P2** | **Retrospective J1–J3** (manual week ritual) | 5 | 5 | 1.00 | Measure weekly improvement |
| **P3** | **Playbook v0** (rules you act on) | 5 | 4 | 1.25 | “Suggestions” you own |
| **P4** | **Journey process milestones** (retros, streaks of review) | 4 | 2 | 2.00 | Visible CI path |
| **P5** | **Reports “act on this” panel** — process findings from domain (e.g. open book age, missing adherence, review lag) — **no profit claims** | 5 | 3 | 1.67 | Analysis → action |
| **P6** | **Trade Log process quality prompts** — adherence/setup empty-state nudges | 3 | 2 | 1.50 | Better data for analysis |
| **P7** | **First-win Practice path** for new Activators | 4 | 2 | 2.00 | On-ramp to G2 |
| **P8** | **Coach-ready export / week pack** (optional) — process summary for Friday call | 4 | 3 | 1.33 | Trust + coaching bridge |
| **P9** | **H4 scale** (virtualize/filters) | 3 | 3 | 1.00 | Only if books hurt |
| **P10** | **Agent suggestions (later)** | 3 | 5 | 0.60 | After manual path solid |

### Dual-use (both goals)

| ID | Package | G1 | G2 | Effort | Priority |
|----|---------|----|----|--------|----------|
| **D1** | Process-first empty states + estimated PnL honesty | 2 | 3 | 1 | Now |
| **D2** | Spec-as-built honesty (already started) | 2 | 2 | 1 | Maintain |
| **D3** | Isolation / harden (done H0–H3) | 3 | 5 | — | Done — protect |
| **D4** | Content cadence flagship | 5 | 4 | ops | Continuous |

---

## Recommended sequencing (goal-aware)

```text
NOW (trust + gates)
  T6 trial Spec/copy alignment
  D1 honesty polish
  T2 pathway first
  T3 live/coach reliability

WAVE A — G1 conversion engine (parallel with content)
  T1 trial home “this week’s job”
  T4 day-0 checklist
  T7 delayed Practice intro
  D4 content

WAVE B — G2 measurement loop (Spec-first)
  Spec lock Journal-Retro + Playbook
  P7 Activator first-win
  P1 Journal J0
  P2 Retro J1–J3
  P4 Journey milestones
  P5 Reports “act on this” (process)
  P3 Playbook v0
  P6 process field quality
  P8 coach week pack (optional)

WAVE C — scale / agent
  P9 H4 if needed
  P10 agent only after Wave B
```

### Why this order

1. **G1 fails fast if coaching path is broken** — live/pathway before fancy Practice.  
2. **G2 without Journal/Retro/Playbook** is “log trades and stare at equity” — insufficient for continuous improvement.  
3. **Analysis (P5)** is high G2 impact only after **capture quality (P1/P6)** exists.  
4. **Agent last** — capacity over dependency; G2 must work offline of AI.

---

## Grade trajectory under dual goals

| Milestone | G1 health | G2 health | Product grades (U / P / V) |
|-----------|-----------|-----------|----------------------------|
| Now | Partial (courses + live if trial full; Practice locked for pure observer) | Partial (log + reports) | B+ / A− / B |
| After Wave A | Strong trial path | Unchanged | A− / A / B+ |
| After Wave B | Trial can sample ritual lightly | Strong CI loop | A / A / A |
| After Playbook + act-on-this | Trial sees paid future | Material improvement tools | **A+ / A / A+** |
| After H4 if needed | — | Scale | A+ / **A+** / A+ |

---

## Mapping prior A+ roadmap → goals

| Prior package | Primary goal | Keep? |
|---------------|--------------|-------|
| Journal J0 / Retro / Playbook / Journey | **G2** | Yes — core |
| First-win Practice CTAs | **G2** (+ late G1) | Yes |
| H4 virtualize | G2 scale | Evidence-gated |
| Agent | G2 optional | Later |
| **New:** Trial home, pathway week jobs, live CTA, trial Spec alignment | **G1** | **Must add** — was underweighted |
| **New:** Reports act-on-this (process) | **G2** | **Must add** |
| **New:** Coach week pack | G1 trust + G2 | Optional high value |

---

## Risks specific to dual goals

| Risk | Mitigation |
|------|------------|
| Trial overwhelmed by Practice suite | Progressive disclosure; T7 late intro |
| Trial has full nav but activator-gated Practice if role wrong | Fix role map + T6 |
| G2 becomes P&L scoreboard | Tango/Hotel; process metrics only |
| Suggestions create dependency | Playbook = *their* rules; agent optional |
| Shame cadence (“you missed a week”) | Soft nudges; capacity language |
| Building G2 while trial conversion collapses | Wave A before or parallel to Wave B |

---

## Coach decisions needed

1. **Observer term + access:** **LOCKED** — 6-week term; full Navigator Practice access (DL-128).  
2. **G1 success definition:** convert-only vs “complete trial + keep courses” also success.  
3. **G2 “materially improve”:** which process metrics are in-bounds (adherence, review cadence, open-book hygiene, max DD awareness — pick 3).  
4. **Coach visibility:** does paid coaching see member Practice data only with consent? (Privacy Spec).  
5. **Approve Wave A + Wave B** as the dual-track program; defer agent.

---

## One-page summary

| Goal | Audience | Job | Top 3 builds |
|------|----------|-----|--------------|
| **G1** | Observer trial | Engage, habit, **trust coaching** | Trial home (T1), pathway-first (T2), live/coach reliability (T3) |
| **G2** | Activator / Navigator | Measure → act → improve | Journal+Retro (P1–P2), Playbook (P3), process “act on this” (P5) |

**Done when:**  
- A trial member always knows **this week’s job** and has touched coaching.  
- A paid member has a **closed weekly loop** they can measure and act on without asking “what should I do in the app?”  

---

**Related:**  
[Product-Value-Assessment](./Product-Value-Assessment-2026-07-29.md) ·  
[Roadmap-to-A-Plus](./Roadmap-to-A-Plus-Product-Value-2026-07-29.md) ·  
Identity Access Spec · Journal-Retrospective Spec · Trade Log Spec §15  
