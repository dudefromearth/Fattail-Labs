# Evaluation — Retrospective Spec v0.7

**Date:** 2026-07-30  
**Spec under review:** [`Specs/FatTail-Labs-Retrospective-Spec-v0.7.md`](../Specs/FatTail-Labs-Retrospective-Spec-v0.7.md)  
**Status on Spec:** **DRAFT** — not build authority  
**As-built head:** [`Journal-Retrospective-Spec-v0.6.md`](../Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.6.md) (RT8-G COMPLETE)  
**Parents to reconcile:** Journal Session **v0.6** · Tag Manager **v0.3** · Journey **v1.0** §4.1a · Export **v1.2**

**Evaluators (this write-up):** India/Juliet stance (architecture + product frame) with Hotel/Tango/Mike flags.  
**Cross-review:** Advisor response to this evaluation incorporated in **§14** (2026-07-30).

---

## 0. Executive verdict

| Question | Answer |
|----------|--------|
| Is v0.7 coherent and product-true? | **Yes — strongly.** The four questions + ceremony frame is clearer than v0.5/v0.6's "report with reflection." |
| Ready for Coach GO as written? | **Not yet.** Open decisions **#1** (where "the way"/rules live) and **#2/#5** (cadence vs Journey meters) are load-bearing; naming/parent hygiene needed. After cross-review: also **routine-day definition** (Journal + Retro) and **keep-rate / specificity** integrity. |
| Relationship to as-built | **Rewrite of product frame**, not a small honesty patch. Mechanics (scope Option C, gather, complete→journal close, habits max 2, agent analyze, process-before-book) largely **survive**; UX and cadence ownership **change**. |
| Implementation size | **Large medium:** ceremony walk UI + cadence setting + interruption notice + correlation surfaces + notification redesign + schema columns. Substrate is rich; do not greenfield. |
| Recommend | **Coach review after India parent-citation pass + lock §20 #1, #3, #5; adopt §14 locks on indicator contexts, routine day, keep-rate presentation, ceremony chrome.** Then full bench J0 → board `p-retrospective-v07`. |

---

## 1. What v0.7 is (product frame)

**Thesis:** The retrospective is a **ceremony that is walked**, not a document that is read.

**North star (five sentences):**

1. What did I say I'd do?  
2. Did I do it?  
3. What got in the way?  
4. What's the one thing for next time?  
5. Gauge: am I keeping commitments to myself more often than three months ago?

**Nine fixed steps** every period (clean or wreck), carry-forward first, book last and collapsed.  
**Cadence** = trader setting (not membership tier).  
**Indicator** = Journey meters only (no second score).  
**Emotion** = mirror trader tags/words only.  
**Agent** = holds sequence + assembles; does not diagnose/prescribe; code guardrails.  
**Correlation** = behavior → avoidable loss / process, **never** P&L.

This is aligned with dual-goal strategy (process integrity + capacity) and with Journal Session v0.6 (pre-open member content for E-vs-A; complete closes journal dates).

---

## 2. Strengths

1. **Clarity.** §1 and §2 are the best short product definition the retro has had. Easy Coach/Tango bar.  
2. **Ceremony > scroll.** Explicitly rejects "report card" and P&L-first reading order — matches what v0.5 tried and what members still experience as a long doc.  
3. **Carry-forward elevated.** Correct: without step 1 first, the loop is decorative. As-built has carry-forward; v0.7 makes it *the* gauge surface.  
4. **Cadence de-tiered.** Weekly default for daily/0DTE; trader-owned longer cycles. Honest for Navigator vs Observer access identity.  
5. **Interruption notice (§9).** Fixes silent multi-week comparison bugs and meter trust.  
6. **Emotional content via Tag Manager Behavior.** Elegant reuse of admin lexicon; second job for tags without a new emotion model.  
7. **Correlation honesty (§13).** Avoidable-loss / within-trader comparisons — Sierra/Hotel safe; no "process makes money" trap.  
8. **Agent job narrowed.** Sequence holder + assembler fits code guardrails better than "coach." Aligns with Journal agent doctrine.  
9. **Schema humility.** Period accounting stays derived (Gamification criterion 4).  
10. **Open decisions list is real** — especially #1 (Playbook as rules SoR).

---

## 3. Spec quality / hygiene issues (fix before GO)

| Issue | Severity | Fix |
|-------|----------|-----|
| Filename `Retrospective-Spec` vs lineage `Journal-Retrospective-Spec` | Medium | India: one canonical name; 301/redirect note in v0.6 history |
| "v0.6 is not in this advisor context" | Medium | India verifies § citations against as-built v0.6 before GO |
| Entitlement line: "none. Every member holds Observer…" | High if literal | **Accepted (cross-review):** "none" misreads as *no gate*. Correct: **no differential gate among paid roles** (Observer / Activator / Navigator identical Practice access); **no free tier**. As-built create = admin **OR** activator+ **OR** active `observer-trial`. Spec must rephrase before GO. |
| Parents incomplete | Medium | Cite Journal Session **v0.6**, Tag Manager **v0.3**, Journey **v1.0**, Export **v1.2**, Habit plans as-built |
| DL draft strong; status still DRAFT | Low | Fine until GO |
| No build order / board reference | Medium | Add § build order or Juliet board after GO |
| Notification + open positions "where knowable" | Medium | Mike: Trade Log open-position query is incomplete for some books — fail soft, never block |

---

## 4. Delta vs as-built (v0.6 program)

| Area | v0.6 as-built | v0.7 target | Gap size |
|------|---------------|-------------|----------|
| Surface metaphor | Gathered **report** sections + agent panel | **Walked ceremony** 9 steps | **Large UI** (Echo/Charlie) |
| Section order | Process-first; book collapsible | Fixed 9-step; carry-forward forced first; "nothing here" explicit | Medium |
| Cadence ownership | Journey profile `retro_horizon_days` / meter | `retro_cadence_days` trader setting + history table | **Medium–large** (India + Journey touch) |
| Missed period | Scope lengthens (Option C) | **Required interruption notice** with named span | Small–medium |
| Indicator | Integrity review + Journey meters elsewhere | Journey meters **only**, pattern language, "steady", threshold decline | Medium copy + wiring |
| Emotion | Tags partially; limited mirror | Behavior tags + journal words **mirrored**; no system diagnosis | Medium (Tag Manager + journal) |
| Clustering | Deviations list | Co-occurrence statements | Medium derivation |
| Correlation | Limited / careful | Explicit behavior↔deviation and rule-break damage | Medium–large (Hotel) |
| Notification | Invitational nudge (cadence meter) | Material-based once/period; no market hours; no open positions | Medium (notify stack) |
| Agent | Local analyze + validation | Sequence agent + versioned prompt per retro | Medium (prompt store like Journal J3) |
| Habit plans | Max 2 active, carry-forward | Same + specificity press | Small |
| Journal close | On complete, scope-true | Same (cites Journal Session §7) | **Aligned** |
| E-vs-A | pre-open member content | Same (Journal Session §4) | **Aligned** |
| P&L | Collapsed / last | Same, stronger language | Small |

**Keep as substrate:** create/list/gather/complete, Option C scope, dual report DTO, habit plans, analyzer guardrails, journey scores, closure-preview, Journal Session close hook.

**Kill / replace:** "scroll a report and expand P&L" as primary mental model; tier-derived cadence if any remains; chore-style "due" nudges as primary notification.

---

## 5. Alignment with sibling Specs

### Journal Session v0.6

| v0.7 claim | Compatibility |
|------------|---------------|
| Complete closes reviewed journal dates | **Yes** — Session §7 · as-built apply_closures |
| E-vs-A from pre-open **member** content only | **Yes** — Session §4 · phase `pre_open` |
| One conversation per date | **Helps** retro dual-read / carry; fewer orphan sessions — **but breaks naive routine-day counts** (see §14.3) |
| Tags assign-only | **Required** for §8.1 Behavior mirror |

**Gap (upgraded — cross-review §14.3):** Routine / journal-day signals must **not** key solely on `session_started_at` or "session exists for journal_date." One session per date means later notes land as `later_day` *messages* inside Monday's session; counting only session start **undercounts** writing on Wed/Thu. **Honest definition:** a calendar day the trader **authored a member message** (by message timestamp local day), regardless of which `journal_date` session received it. That is a **Journal Session Spec correction** as much as a Retro one. India + Hotel + Alpha.

### Tag Manager v0.3

§8.1 depends on **Behavior** category quality. Seed lexicon exists; Hotel+Tango must audit whether Behavior labels are moment-reachable. No member tag CRUD — correct.

### Journey / cadence

v0.7 moves cadence off profile meter into identity setting and forward-only history. **Conflicts with Journey §4.4 / §4.1a** until §20 #5 is locked. This is the highest integration risk after ceremony UI.

### Export v1.2

New columns (`prompt_version_id`, `interrupted`, `period_index`, `cadence_days_at_period`) need export honesty when implemented.

---

## 6. Doctrine / member experience (Tango · Victor)

**Aligned:** capacity over dependency; process outcomes not profit claims; no character verdicts; return-without-shame; once-only notification pressure avoided.

**Watch:**

- Indicator "pattern" language can drift into diagnosis ("your practice is loosening") — keep conduct-only.  
- Commitment keep rate as product eval metric is powerful; do not surface as member "scorecard."  
- Trial thin-trade ceremony (§15 Beginning) is critical conversion moment — empty ceremony = hollow product.

**Victor:** §3 via negativa / fear framing is product thesis, not marketing. Keep Family B; Sierra must block any public reuse of member emotional content.

---

## 7. Security / Family B (Mike)

- Prompt admin-editable + version stamp per retro: same pattern as Journal J3 — admin only, prohibitions in code.  
- Notification with trade/deviation counts is still Family B content in transit — **channel choice is load-bearing** (cross-review accept: email carrying counts is Family B *leaving the app boundary*; Spec must name allowed channels and retention).  
- "Never with open positions" must not leak position detail in error paths.

---

## 8. Implementation sketch (if GO)

| Phase | Intent | Primary |
|-------|--------|---------|
| **R0** | Spec hygiene + parent citations + §20 locks 1,3,5 | India · Coach · Juliet |
| **R1** | Schema: cadence setting + history + retro columns | Alpha · India |
| **R2** | Ceremony UI: 9-step walk, nothing-here, book last | Charlie · Echo · Tango |
| **R3** | Indicator from Journey meters; steady / threshold | Alpha · India · Tango |
| **R4** | Emotion mirror (Behavior tags + journal words) | Alpha · Hotel · Charlie |
| **R5** | Clustering + rate-normalized trends + correlation | Alpha · Hotel |
| **R6** | Interruption notice + forward-only cadence | Alpha · Tango |
| **R7** | Notification material-based once | Alpha · Mike · Tango |
| **R8** | Sequence agent + prompt versions | Alpha · Hotel · Mike |
| **R9** | Export/purge + suite + Delta program gate | Kilo · Delta · Lima |

**Critical path:** R0 → R1 → R2 → R6 → R9 (ceremony + cadence honesty).  
**Parallel after R1:** R3–R5, R7, R8.

Rough effort: **several full bench cycles**, not a weekend patch — but **not** greenfield (v0.6 substrate holds).

---

## 9. Open decisions — recommended interim locks

| # | Recommendation |
|---|----------------|
| **1** Rules SoR | **Playbook** as explicit trader rules; until Playbook Spec GO, use habit-plan + journal pre-open commitments as interim referent — **state in Spec** |
| **2** Indicator window | **One instrument, two contexts, never side by side** (cross-review — supersedes "dual display with labels"). Ceremony shows **period-scoped** readings. Journey shows **rolling** health. Each labeled in its own surface; **never** 82% period + 71% rolling in one frame. |
| **3** Multi-strategy | **One retrospective** (agree with Spec) |
| **4** Optimal window | Defer; keep single on-time definition when built |
| **5** Journey adherence | **Plan change:** migrate cadence meter to period adherence; DL required same GO — without dual *display* of competing integrity numbers on one screen |
| **6** Inference N | Keep global 20 until Hotel proposes pattern table |
| **7** Trial final retro | Distinct copy only; same ceremony |
| **8** Cost-of-deviation | Stay deferred |
| **9** *(new)* Routine day | Define via **member message local calendar day**, not session row / `session_started_at` alone — Journal Spec amendment + Retro indicator inputs |
| **10** *(new)* Keep rate | Member-visible as **fact** ("held 8 of 9 days"), never grade-band %; always **paired with specificity trend** for product eval; agent specificity press alone is insufficient |

---

## 10. Risks

| Risk | Mitigation |
|------|------------|
| Ceremony becomes a **wizard** (nine Next buttons) — worse than scroll for veterans | Echo: **fixed-order sections, all present; current step focused** — walkable for beginners, skimmable for twentieth run. Not a linear modal wizard. |
| Cadence migration breaks Journey meter | India: forward-only history; separate surfaces for period vs rolling (no dual gauge frame) |
| Behavior lexicon weak → empty emotion step | Hotel+Tango lexicon pass before R4 |
| Correlation misread as P&L | Hotel tests + Sierra grep |
| Agent sequence becomes quiz / pressure | Tango: "nothing here" is valid; no pressure |
| Scope vs complete gap (Option C) misunderstood | Keep v0.6 honesty language; don't invent coverage score |
| **Keep rate conflict of interest** (§1 gauge + §11 product metric) | Rising keep rate via *easier* commitments looks like success; require **specificity trend** alongside keep rate; member UI = fact counts only, no grade band |
| Routine undercount under one-session/date | Message-timestamp day definition (§14.4); Journal Spec fix |
| Family B in notifications | Mike: channel policy before R7 |

---

## 11. Gate readiness checklist (pre-GO)

- [ ] India: parent Specs + entitlement wording ("no differential gate among paid roles") + filename lineage  
- [ ] India: routine-day definition + Journal Session Spec amendment cross-link  
- [ ] Hotel: §3 practice framing, Behavior lexicon, correlation, thresholds, keep-rate/specificity integrity  
- [ ] Tango: ceremony copy ban list + interruption + notification; keep-rate as fact not grade  
- [ ] Mike: prompt authority + notification channel / Family B leaving boundary  
- [ ] Echo: ceremony = focused section in fixed-order page, **not** wizard  
- [ ] Sierra: no marketing pipeline from retro emotion/P&L  
- [ ] Victor (opt): via negativa §3  
- [ ] Coach: §20 locks 1, 2 (contexts), 3, 5 + new #9/#10 + GO  
- [ ] Lima: DL on GO  
- [ ] Juliet: board `p-retrospective-v07` only after GO  

---

## 12. Recommendation

**Approve direction. Do not implement until:**

1. Hygiene pass (entitlement rephrase, parents, v0.6 citation verify).  
2. Coach locks **#1, #2 (contexts not dual frame), #3, #5**, plus **routine day (#9)** and **keep-rate presentation (#10)**.  
3. Explicit supersession: v0.7 product frame supersedes v0.6 *frame*; v0.6 remains as-built for shipped APIs until R-phases land.  
4. Journal Session Spec amendment path for message-based routine day (or interim dual-read with honesty).

**Then:** Juliet seeds board `p-retrospective-v07` against §8 + §14, Delta gates R0-G … R9-G.

---

## 13. Document history

| Date | Note |
|------|------|
| 2026-07-30 | Initial evaluation of Retrospective Spec v0.7 DRAFT |
| 2026-07-30 | §14 — advisor cross-review responses incorporated (entitlement, indicator contexts, routine day, keep rate, ceremony chrome) |

---

## 14. Cross-review responses (advisor → evaluation update)

Source: advisor response to this evaluation (2026-07-30). Bench stance: **accept / revise as below.**

### 14.1 Entitlement wording — **accept**

"Entitlement: none" was wrong in a specific way: it reads as *no gate exists*. The product claim is **no differential gate among paid roles** (Observer = Activator = Navigator for Practice), **not** free access. Evaluation rephrase stands; Spec must use it before GO.

### 14.2 Notification Family B — **accept**

Trade and deviation counts in email (or any outbound channel) are Family B **leaving the app boundary**. Mike owns channel policy in R7; Spec §14 should state allowed channels (in-app only vs email) and what may appear in copy.

### 14.3 Indicator §20 #2 — **revise evaluation; accept advisor**

Eval's "dual display with labels" is **rejected**. Side-by-side 82% period vs 71% rolling creates an unanswerable "which is real?" One instrument, **two contexts, never one frame**:

| Surface | Context |
|---------|---------|
| Ceremony (this Spec) | **Period-scoped** — reviews this period |
| Journey | **Rolling** — ongoing health |

Label each where it lives. Do not co-locate competing readings.

### 14.4 Routine-signal gap — **accept; enlarge scope**

Under Journal Session **one conversation per date**, a day counted only via `session_started_at` (or "session exists for journal_date") **undercounts** real writing: Monday session open + Wednesday/Thursday member messages score **one** routine day if keyed on session start, while Wed/Thu are `later_day` messages. Desired behavior undercounts.

**Normative definition (proposed for Spec + Journal):**

> A **routine / journal-active calendar day** is a local calendar day (America/New_York) on which the member **authored at least one message**, by that message's timestamp — independent of the session's `journal_date`.

Impacts: Journey journal-day meters, retro indicator inputs, cadence adherence if it uses journal days. **Journal Session Spec amendment required** in the same program or as a blocking parent patch.

### 14.5 Keep-rate conflict of interest — **accept; new product law**

§1 member gauge and §11 product evaluation metric both want keep rate **up**. Cheapest path: weaker commitments ("be more mindful" always "kept"; "no entries first fifteen minutes" is not). A rising keep rate can mean **practice degradation** while looking like success on both sides.

Partial defense already in Spec §10 (specificity press) is **necessary but not sufficient**.

**Locks for Spec / implementation:**

1. Member-facing keep rate is **fact only**: e.g. "Held 8 of 9 trading days" — **never** a percentage with grade bands or "your keep rate is strong."  
2. Product eval and any internal dashboards read **keep rate alongside specificity trend** (or refuse the series).  
3. Agent continues to press specificity; Hotel/Tango define measurable specificity signals (testable commitment language).

### 14.6 Ceremony chrome — **accept; sharpen Echo bar**

Ceremony must not become a **wizard** (nine Next buttons). That is worse than the scroll it replaces for a twentieth-run trader.

**Echo law:** sections in **fixed order**, **all present** (or "nothing here" stubs), **current step focused** — walkable for beginners, skimmable for veterans. Not a linear multi-page wizard.

### 14.7 Revised eval dispositions

| Prior eval claim | Disposition |
|------------------|-------------|
| Dual display with labels for period vs rolling | **Withdrawn** → one instrument, two contexts, never side by side |
| Routine gap as small India/Hotel note | **Upgraded** to Journal + Retro normative definition |
| Keep rate scorecard flag only | **Upgraded** to conflict-of-interest + specificity pairing |
| Ceremony "one step at a time" risk | **Sharpened** to anti-wizard / focused section in full order |
