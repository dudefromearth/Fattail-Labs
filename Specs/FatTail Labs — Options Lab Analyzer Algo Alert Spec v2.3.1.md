# FatTail Labs — Options Lab Analyzer Algo Alert Spec v2.3.1

**Status:** **PRODUCT-LAW DRAFT** — Coach 2026-09-02. Arming and trade management is product law for
Analyzer **Algo**. **BUILD AUTHORITY on v2.2.2 is SUSPENDED by this revision.** v2.3 changed the model, so the
AZALGO-W0 GO of 2026-09-03 no longer covers what is being built. Not BUILD AUTHORITY until Appendix B
fixtures **19–26** exist as hand-written numbers, fixtures 1–18 have their `guide_level` re-recorded,
and Coach re-stamps.
**Current revision:** **v2.3.1** — **E32–E36, correcting v2.3's own statement of the model.** The
model does not change again. What changes is that v2.3 asserted a **derivation that does not exist**
(E32), softened the E8 posture it inherited, under-specified the E28 narration it made law, and wrote
*available* where Coach said *achieved*. v2.3.1 states the guide as **two clauses**, restores the E8
posture in the header, hardens E28, and scopes the three volatility quantities this program now
contains (E36). **No geometry change. E1–E24 not reopened. E25–E31 stand, corrected in statement.**

**E8 posture — read this before the model.** `p` is a **starting constant**, not a finding. Both lines
paint. The proposed line is labelled *proposed*. Nothing in v2.3 or v2.3.1 promotes it: §14 is still
the only thing that can, and what §14 now fits is **`p`**, not `k` (§14.5). A spec that changes the
formula does not thereby validate the formula.
**Supersedes:** [v2.2.1](./FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v2.2.1.md) as product law.
v2.2.1 remains on disk (sha1 `6f491ee8f240aa06418b8e813fdb3152ed60deb5`) as the frozen model ALGO-B
fixtures 1–16 were written against.
**Supersedes:** v2.0 (2026-09-02) as product law — v2.0 is on disk and is marked SUPERSEDED.
**Review iterations v2.1 and v2.2 were never landed in `Specs/`** and do not exist on disk; they are
review artifacts only. Do not look for v2.1 or v2.2 in the tree. This file carries E1–E24.
**Supersedes:** [AZ-ALGO v1.0.16](./FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v1.0.md) as product
law. v1.0.16 remains the **as-built characterization** of W1–W4 (Demo-only trail).
**Seats:** Coach memo [`Arming and Trade Management Specification.md`](./Arming%20and%20Trade%20Management%20Specification.md)
(verbatim in §0.2). Strategy parent [`FatTail 0DTE Strategy Specification.md`](./FatTail%200DTE%20Strategy%20Specification.md).
**Type:** Product Spec — Analyzer **Algo alert** (arm → mechanical entry → GEX-guided profit-retention **guide**).
**Short name:** **AZ-ALGO** · **Route:** `/app/options-lab/analyzer`
**Parents:** Alert Builder v1.0 (AZ-ALB) · Alerts Manager v1.0 (ALM) · Analyzer v0.2 · OPF Truth /
Elegant Failure (DL-309) · Keep-Warm v0.1 · Human Interface v1.0 · Trader Feed v0.1 (TF · DL-514 ·
DL-517) · North Star Member Ethos v1.2 · Time Machine v0.7.4
**Does not:** close, stop out, or send a broker order. Does not implement the Labs-wide Alerts
Manager. Does not copy MSC Trailing / 0DTE placeholder tabs. Does not use **expected move** as a
trail input.

**Time Machine (v0.7.4):** Demo ticks on the replay clock; **creation under a playhead is a rehearsal
object** — badged, never stored, never notifying, disposed on Reset with an announcement.

---

## v2.3.1 errata (E32–E36) — the model is stated correctly

v2.3 got the model right and its own description of the model wrong. These five close that gap. **No
formula changes.** E32 removes a claimed derivation, E33 restores posture, E34 hardens a law that was
written as an aspiration, E35 corrects one word that carries a real claim, E36 stops a collision
between three volatility quantities that now coexist across two programs.

| # | Change | Why |
|---|---|---|
| **E32** | **Hold-or-fold is two clauses, not one derivation.** Clause **A** (regime) `p × headroom ≤ at_risk`; clause **B** (level) `giveback ≥ p × headroom`. Fold = **A or B**. The payload records which fired. The "indifference point" derivation is **deleted** (§9.4.3) | `p × headroom > at_risk` contains no `U`. A boolean with no `U` in it has no P&L indifference point to invert, so v2.3's derivation of `guide_level` from it was false reasoning that happened to land on a defensible level. `p × headroom` is a **giveback budget**, not an indifference point |
| **E33** | **E8 posture restored to the header.** `p` is a starting constant; both lines paint; §14 promotes or it stays *proposed*; §14.5 fits **`p`**, not `k` | v2.3 changed the formula and read, in places, as though that settled something. Changing a model does not validate it |
| **E34** | **E28 hardened.** Narration threshold is on **accumulated** movement, not per-tick · the named cause is **on the canvas**, not hover-only, and does not depend on the Feed model being reachable · hysteresis is **asymmetric** — tightening narrates immediately, widening waits `LABS_ALGO_LOOSEN_CONFIRM_BARS` | A per-tick threshold is a check that cannot fire against slow drift, which is the shape the failure actually takes. A hover-only cause is invisible to the member who is watching price, and unreachable on touch. Narrating a widening that reverts next tick is a lie in the honest direction |
| **E35** | **E26's "why" says *achieved*, not *available*.** A peak proves what the position **achieved**; it does not prove the remainder is reachable. Wick case is fixture **25** (AT-ALGO-45) | Coach's sentence is about achievement. v2.3 restated it as availability, which is a forecast claim the spec does not make (§13). A peak set by one wick through the body is an achievement of one print |
| **E36** | **Three volatility quantities are named and scoped**: `move_unit` **realized**, risk side only · `extrinsic_factor` **implied**, reward side only · Archive Lab `σ_T` **implied**, neither. **AT-ALGO-19 is scoped to the risk side**; **AT-ALGO-19b** asserts the reward side does not import `σ_T` | AT-ALGO-19 greps the trail module for expected-move identifiers. E30 deliberately puts an implied quantity on the reward side. Program-wide, that grep would either fail on correct code or be weakened until it tests nothing — and a shared `σ_T` import would make the guide answer to a vol estimate maintained by another program |

**Consequence for build:** no packet already gated on E25–E31 is invalidated. E32 adds two acceptance
tests and a payload field, E34 adds one config key and three tests, E35 and E36 add one fixture and
one test each. Appendix B grows by **two** rows (**25**, **26**) and **one** variant (**21b**) beyond
v2.3's 19–24.

---

## v2.3 — the model changes (E25–E31)

**This is not an errata pass.** v2.1 through v2.2.2 corrected a model that measured the wrong thing.
Coach, 2026-09-03:

> The decreasing trail is in actuality, using whatever means we can devise, that represents the risk
> of staying in the trade for potential future value growth, vs exiting with current value.

> …we know the max unrealized value the trade has achieved vs what could be, and we have to measure
> the risk of giving up the value we have for waiting on the potential we could achieve vs the risk
> of losing too much of that unrealized gain.

> Hold or fold is evaluated every tick while in the trail.

`trail_level = H − k × PaR` computes **only the risk half**. It answers *what can this cost me* and
never asks *what is still on the table*. v2.3 makes the guide the projection of a hold-or-fold
inequality that has both.

| # | Change | Why |
|---|---|---|
| **E25** | The model is `hold while p × headroom > at_risk`, **evaluated every tick** (§9.4) | The trail was a risk number with no reward term. Coach's comparison needs both sides |
| **E26** | `headroom = max(0, ceiling − H)`, where `ceiling = width − debit` and **H is the peak, not U** | "max unrealized value the trade has **achieved** vs what could be." A trade whose peak touched 80% of ceiling has **achieved** that much of the move; one that never passed 30% has not. The old formula cannot tell them apart. *Achieved* is the claim — **not** that the remainder is therefore available (E35) |
| **E27** | **The guide breathes. The ratchet is removed from it.** `ALGO-A1`'s running minimum stays on the **legacy** line only | A monotone-tightening line cannot express "GEX says the risk of staying is okay." §0.2.12 already said breathe; the built ratchet contradicted it |
| **E28** | **When the guide moves, the surface names why.** Law, not nicety (§9.6, §10). Hardened at v2.3.1 — accumulated, on-canvas, model-independent, asymmetric (E34) | A stop that retreats silently reads as running away from you and destroys trust faster than a wrong number |
| **E29** | `k` moves from the **risk** side to the **reward** side and becomes `p`'s modifier. GEX percentile, strike proximity and remaining extrinsic condition the **probability of capturing headroom**, not the cost of a move | They were bolted onto `PaR`, where they do not belong. That is why the spec kept accumulating unrelated machinery |
| **E30** | `E(t)` is reframed: remaining package extrinsic is **the market's own price of how much movement is still expected** — the closest thing to a quoted `p` — not a decay-schedule pacer | Explains why `E(t)` being null has quietly mattered since W1, and why it is worth building rather than clock-ramping around |
| **E31** | `giveback = H − U` is a **first-class field and a HUD row** | It is the quantity the strategy is actually about, and the member has been made to subtract it |

**Consequences, stated plainly:**

- **Appendix B goldens 1–18 are invalidated for the guide value.** `PaR`, `move_unit`, factor and
  Batman rows survive as inputs. Every guide value changes. Hotel re-computes (§Appendix B).
- **P1–P4 partially rebuild.** `algoProfitAtRisk.ts` keeps `PaR` and loses the combination step;
  a new `algoHoldFold.ts` owns the inequality. `algoTrailMath.ts` keeps the legacy ratchet.
- **P5's transcript waits.** Proving a ratcheted line ticks live proves the wrong line.

## v2.2.2 errata (E23–E24) — floor formula and at-body tie-break

Hotel's ALGO-B set (fixtures 1–16) exposed two **authoring** gaps. Neither is a golden defect. Neither
reopens E1–E22. Geometry unchanged.

| # | Change | Why |
|---|---|---|
| **E23** | Floor is a **formula**, not prose. Binds only as the close approaches (`remainingToDecayEnd ≤ LABS_ALGO_FLOOR_REMAINING_H`). `floor = (1 − gMin)×H`. `guide_level = max(guide_raw, floor)` **only while active**. Readings (a) and (b) rejected | v2.2.1 said "hard floor" and never wrote it. Three readings were all defensible. Fixture **17** puts both lines and the floor in one calculation |
| **E24** | At-body larger-PaR tie-break gets fixture **18**: Δ small but non-zero so up ≠ down | Fixture 2 has Δ = 0, so both directions are equal and the rule never fires |

## v2.2 errata (E10–E21) — dimensional law, estimators, and chrome

E10–E18 come from review of v2.1. E19–E21 are additional findings. **No Coach text was deleted.**

| # | Change | Why |
|---|---|---|
| **E10** | **Dimensional law.** `move_unit` in underlier points; Δ, Γ, `H`, `PaR`, `guide_level` in **package dollars**; adverse sign defined | v2.1 mixed index points and mark dollars. AT-ALGO-6b could pass on a dimensionally meaningless fixture |
| **E11** | `move_unit` **estimator named**; GEX normalization gets a window, an estimator and an empty-history state | Both were "rolling"/"normalized" with no definition — the primary input to a quadratic term was undefined |
| **E12** | Coach Part II vocabulary is **intent, not chrome**. Member surfaces, HUD, tape and the house prompt use §13 process words. New **AT-ALGO-27** | *wall*, *flip*, *pin* sit verbatim in §0.2.8 next to Hotel's ban on inventing structure. The Feed will quote it |
| **E13** | HUD fourth row **Stop → Guide** (**OD-ALGO-1**, Coach disposes) | The product has no stops; a row labelled Stop invites a flatten |
| **E14** | Explicit non-goal: the bounce trigger is **never** encoded as a Heatmap cell, LIM quadrant, or Strike Turnover reading | Analyzer VP overlay is FI-031, so the arming story has no home in-app yet. That absence must not get filled by a sibling surface |
| **E15** | `prefers-reduced-motion` kills the pulse entirely; legacy line renders in a **muted** token, proposed labelled | Three verticals plus overlay plus HUD plus Feed on a 0DTE P&L chart |
| **E16** | Reason/Feed model gets a **read-only measurement allowlist** and is forbidden to recommend hold or fold | §0.1.12 grants Heatmap raw data; without a schema that is unconstrained structure invention (FI-032) |
| **E17** | Live eval is a **phase with its own gate**, not a line in the file table | As-built is Demo-only; AT-ALGO-18 fails today and will keep failing unless someone owns it |
| **E18** | Editorial note at §0.1.6: recording is a **tape post, not an exit** | §0.1.6 says the alert stops and records; §11 says it keeps running. Both would get implemented |
| **E19** | High-water `H` **resets** on a Batman working-side switch | Nothing said whether `H` carries across sides. Carrying it produces a guide computed from a different fly's profit |
| **E20** | Override **suppresses re-fire** until the guide is re-entered | Overriding while spot is still beyond the guide would immediately re-fire Fold suggested — a loop at the worst moment |
| **E21** | Time remaining enters **only** through the legacy floor, never through `k` | Listed as an input, used nowhere; an unused input in a spec is an invitation |

## v2.1 errata (E1–E9) — what changed and why

All nine came out of review of v2.0. **No Coach text was deleted.** Full index in **Appendix C**.

| # | Change | Why |
|---|---|---|
| **E1** | `profit_at_risk` is redefined as an **adverse-move loss**, always `≥ 0`, with `trail_level < H` enforced | As written it went **negative at the apex** (long fly is short gamma at the body), putting the guide **above** high-water and folding instantly at the most dangerous moment |
| **E2** | `k` clamp declared **defensive**, achievable range documented, factor ranges moved to config | `1.5 × [0.7,1.3] × [0.8,1.2]` maxes at **2.34**; the stated upper clamp of 2.5 could never fire |
| **E3** | HUD **freezes** on Fold suggested; it does not hide | v2.0 hid High/Profit/Trail/Stop at the exact moment the member is asked to override |
| **E4** | `risk_taken` defined explicitly, including Batman (per working side) | The gate was undefined for the structure Part IV introduced |
| **E5** | GEX unavailable → **one** named behaviour, not "or" | v2.0 offered two, so two implementers would both be "correct" |
| **E6** | The legacy floor is marked **never-exercised**, and the floor path is named when `E(t)` is null | `E(t)` has always been null; the decay-paced behaviour has never run, and v2.0 made it a hard floor |
| **E7** | AT-ALGO-19 becomes a **source grep**; AT-ALGO-T1 split into a testable half and a note | You cannot assert the absence of a concept behaviourally |
| **E8** | The computed line is **"proposed"** everywhere until §14 clears it | v2.0 called the same line "primary" and "proposed, unvalidated" |
| **E9** | The manual-confirm stand-in gets a **retirement condition** | Nothing said what removes it once the trigger is named |

Plus: `move_unit` added to the fold payload · AT-ALGO-23 greps for the retired `S = f × H` form ·
**Appendix A** makes every constant a fail-loud config key (Invariant 2) · **Appendix B** requires
hand-computed goldens before code.

---

## 0. Coach intent (do not drop)

### 0.1 From AZ-ALGO v1 (still in force except where §0.3 names a reshape)

1. The Algo alert is a **dynamic trailing stop**, except that it **does not stop the position out**. It
   provides **chatty narratives**.
2. The alert is tied to an **OTM butterfly**.
3. When it is turned on there is **little for the user to do**, because the algo knows how to set up.
   You **specify an OTM butterfly** and the Alert **create button starts flashing** subtly. Click it →
   Create Alert dialog opens to the **Algo** type and **describes what it will do**. **Minimal
   controls** that affect entry and management.
4. **Default entry:** waiting for the position to achieve a **minimum amount of unrealized gain**.
   Default is **75% of the debit** of the trade. This **activates** the trade and the trailing stop:
   the "stop" is set to **75% of the top unrealized gain**. Then it **acts like a trail**. If the
   unrealized top gain increases, the trail **adjusts to the new top gain**.
5. The **dynamic** part of the trail is the **trail amount**, which starts at **75%** and **slowly
   decreases to a minimum of 25% at the end of the trading session**. The **rate** of the decreasing
   trail is determined by the **rate of premium decay**. Member knobs (**always selectable**):
   **start profit management** = % unrealized gain of debit (default **75%**); **stop the trail at** %
   of high-water (default **75%**); **end the trail at** % of high-water (default **25%**). Start
   occurs when unrealized gain reaches the first knob. **DL-482**.

   *(Editorial, **E18** — item 6 below says the alert "stops and records" when price exits the trail.
   That clause is **reshaped by §11**: recording is a **tape post, not an exit**. Evaluation continues
   and the member may override. Noted here because both readings would otherwise be implemented.)*
6. A **vertical line** is drawn at the **highest profit achieved** and **another at the trail**. These
   colors are **assignable**. Lines are **thin dashed**. An **optional transparent overlay** sits
   **between** the two verticals. The overlay gets **more opaque and pulses** if price **threatens the
   stop price**. If price **exits the trail** the alert **stops and records the result**.
7. A **window** appears, similar to the **narration window in the Surface app under the "T Ortho"
   view**. This narrative is a **play-by-play of the underlying market structure from the POV of the
   GEX**, and **if Volume Profile is engaged, the position to structural levels**. If VP is **not**
   engaged, it is **left out of the narrative**. Other narrative types concern the **greeks, debit and
   gamma risk, probabilities**, etc.
8. **Goal:** keep the trader in the trade long enough to **maximize profit** so long as the risk does
   not threaten **losing more than they should**. **Most trades are going to result in small profits,
   some will bank it.** There will be **adjustments to the narrative based on premium decay rate** as
   well.
9. **Remove the narrative from the Algo Alert panel.**
10. **The 75% trail means you can give up 75% of the profit.** It is a **% of profit**, not an absolute
    and not total value. The as-built `S = f × H` was **opposite** (75% was keeping 75%). Law:
    `S = (1 − g) × H` with `g` the give-up %.
11. **The algo alert should show the values that are important to track, and display them in the lower
    left corner just above the $0 line.** Top: **High** (highest unrealized gain). Then **Profit**
    (current gain, same units as High). Then **Trail** (% value of the trail). Then **Stop** (**ticker
    price** `x_S`). Colons line up. **Only while the algo is active** (Live and Armed). Hidden while
    Waiting, Idle, Touched, or Recorded.

    *(v2.1 E3 reshapes the last sentence for the Fold-suggested case only — see §9.6. Live/Armed
    behaviour is unchanged.)*

12. **Reason (2026-08-21, verbatim — do not drop · ALGO-R1 · DL-510):**

> I want to change the scope of the reason feature and make the scope now apply to the entire trail time range, while it is in effect. So there will be a single Reason checkbox and I want it placed at the top of the group box to the right of the title "Trail Settings" when checked it will open a field under the Title and above the start Trail %. It will be a small editable box that accepts text and understands markdown. The AI model will be active based on the declarations in this prompt during the period of effectivity. The thing it affects is not the alert itself, but a narrative floater that should appear when the Reason is checked and there is a prompt. The narrative box is similar to the narrative box in the "T Ortho" view in Surface. The assumption with prompts in this field is that the AI knows the current settings of the Algo alert, understands the strategy it is used for "The 0DET OTM Butterfly" and can access the Heatmap raw data, to make inferences in the current market condition that might affect the outcome of this position with regard to potential profit.

    Supercedes the two per-stop Reason boxes (**DL-484**). Product name of the strategy is the **0DTE
    OTM butterfly** (§6). Tango / Hotel on "potential profit" sit in **§13**.

13. **Prompt scope (2026-08-21, verbatim — do not drop · ALGO-R1):**

> Let's talk about the scope of prompts that coulds be used. The checking of the box is enough to start a basic narration in the floater. The prompt might include special instructions that focus the narration on a specific market condition, or specific trader concern, that modifies the narrative, but does not dibert the narrative from its primary purpose.

    Qualifies §0.1.12: **Reason checked** mounts basic narration. A prompt is **optional focus**, not a
    gate.

14. **House base prompt (2026-08-21, verbatim — do not drop · ALGO-R1 · DL-511):**

> The Alerts Manager is a manager for all users. However like many features, there's in-place editing for features. And this is just such a case.

    Admin-only **base prompt** for Algo Reason. Edited **in place** on the member Alerts Manager
    (`/app/alerts`). Members never see the editor.

15. **Floating narrative (2026-08-21, verbatim — do not drop):**

> Both of these features are to feed a floating Narrative for trader review

> So, the Narrative is feature-specific and contectually aware including aware of the trader and their current position(s) they are examining

    **These features** = Analyzer **Algo** Reason floater **and** Surface **T Ortho** squawk.

16. **Labs-wide Feature Narrative (2026-08-21, verbatim — do not drop · DL-514):**

> So, this is a new feature I am proposing. It will take the place of the narrative box in T Ortho, and it will supplement the Algo Alert feature, and it may be used in other geatures throughout FatTail Labs.

    Algo **Reason floater is a host** of Trader Feed (`host_id: algo-reason`). TF **supplements** this
    feature — it does **not** replace trail math, knobs, Reason, house base, HUD, or **ALGO-N1**.

17. **Tape and prompt (2026-08-21, verbatim — do not drop · DL-515):**

> Each place the feature is employed, it will have an instructions prompt to follow. The narrative will be a continuous scroll, so the user can view older posts. The posts will be timestamped. This feature is very similar to the Jounaling feature. But it is generalized

    House base **is** this employment's **instructions prompt**. Reason markdown remains optional
    **focus**. **ALGO-N1** still: no narrative on the Builder panel.

18. **Trader Feed (2026-08-21, verbatim — do not drop · DL-516):**

> One of my members referred to this feature as the trader feed. A merket and position and trader aware contrinuous narrative. It is customized per venue. But largely based on the same base market info.

    Algo Reason is one **venue**. Chrome title **Trader Feed**.

Tango / Hotel notes sit in **§13** beside this text. They do not delete it.

### 0.2 Arming and Trade Management (2026-09-02, verbatim — do not drop)

**Scope:** the state machine from armed setup through to exit, and the GEX-guided profit-retention
layer that replaces the fixed trail schedule.
**Output stance:** advisory. A visible line to be judged and overridden, never an automatic exit.

#### Part I — Arming and entry

**1. States**

| State | Who acts | What is happening |
|---|---|---|
| **Armed** | Trader (discretionary) | Setup identified, algo switched on, no position |
| **In trade** | Algo (mechanical) | Trigger fired, position on, below the management gate |
| **Managing** | Trail + GEX | Open profit ≈75% of risk or better |

Arming is discretionary. Entry is mechanical. Management is a third state with its own gate.

**2. Arming.** The trader identifies the structural level from volume profile, watches price pull back
into it, and — when it appears to bounce — arms the algo.

**3. Trigger.** The algo enters when the bounce off the structural level confirms and price heads
toward the fly.

> **Open item.** The trigger condition is deliberately left as "the bounce confirming" until enough
> live observations exist to name it precisely. It should be specified from observed entries, not from
> theory.

**4. There are no stops.** The trader is never in the trade to stop out. Loss is bounded by the debit.
This matters for what follows — "rearm" does not mean retry after a stop.

**5. Rearming.** Rearming covers one specific case: **an armed setup never triggers, and price
continues past the original entry level toward the next structural level.**

Example, call fly: price pulls back to a structural level, appears to bounce, the trader arms, the
trigger never fires, price continues past and keeps going. The trader may rearm against a lower
structural level.

**6. Repositioning on rearm.** The fly is **repositioned, not reused.** Distance does not improve the
position — past a point the far out-of-the-money longs become worthless and the butterfly stops making
sense.

**Rearm check:** price the fly at the new level. If the debit is not within 5 to 10 percent of the
width, re-strike it to a level where real convexity exists.

**Width does not change on rearm** — the volatility regime has not changed.

> **Tool requirement.** Flag when an armed fly has gone stale and needs re-striking. This is a hard,
> checkable constraint.

#### Part II — Management

**7. Activation gate.** Profit management does not begin until the position is at roughly **75 percent
profit over risk taken.** Below that: no line, no alerts, nothing displayed.

**8. What GEX is and is not.** GEX is **not** an entry filter. For entry it is largely useless,
particularly on a 0DTE trade held more than a few hours. Entry is trend plus structural level from
volume profile.

GEX is a **management instrument.** It decides hold-or-fold once already in the trade. Volume profile
supplies the static map; GEX supplies the live weather.

GEX cuts both ways:

- Positive dealer gamma around the position means price is being held — reason to widen, and
  potentially to override the trail stop
- Below the flip, moves feed themselves — reason to tighten
- A heavy positive-gamma strike at the center is a real wall worth patience
- Nothing but air in the drift direction is reason to tighten hard
- Near the center strike, GEX may justify exiting *ahead* of the trail rather than waiting for it

Volume profile can be read the same way for this decision, not only for entry.

**9. Fold signals.** Decaying premium, constricting breakevens, extreme gamma and delta slope. All of
these are only *experienced* near the edges of the trail — which is why the awareness layer has to
exist before the trader gets there.

**10. The apex is a risk location.** Same risk applies at the apex of the profit curve as at the
edges: large open profit, and a small move toward an edge costs a great deal of it. Combined with the
pin behavior in the strategy spec, the apex should be treated as a place to be alert, not a place to
relax.

**11. Legacy trail — the rule of thumb being replaced.** Trail expressed as a percentage of accumulated
unrealized gain, diminishing through the day:

- ~75 percent early morning
- ~40 percent by noon
- ~20 percent by 2pm

Percentages reach the narrower values *earlier* in low volatility.

Current algo implementation is cruder than that: the user sets an entry width and an end-of-session
width (e.g. 75 percent at a 10am entry down to 25 percent at 4pm) and the algo tapers linearly between
them.

This schedule is a rule of thumb. It remains as fallback and as beginner scaffolding, not as the
primary read.

#### Part III — Dynamic trail computation

> **Status: proposed, unvalidated.** The structure below reflects the design decisions made; the
> constants are starting points to be fitted, not results.

**12. Purpose.** An in-trade profit-retention guide that derives the trail from live position risk
rather than from a time schedule, modulated by dealer gamma. It should breathe through the day rather
than only shrink — but eventually shrink.

**13. Inputs**

- Live delta and gamma of the position
- **Rolling realized movement** over a short window, 15 to 30 minutes
- Running high-water mark of open profit
- Net dealer GEX, **normalized against its own recent distribution** — not absolute dollars, since
  scale drifts
- Distance from spot to the nearest heavy gamma strike
- Time remaining in the session

**Expected move is explicitly rejected as an input.** The entire premise of the strategy is targeting
moves that *exceed* expected move, which happens about 20 percent of the time. Realized movement is
used instead.

Useful property of that choice: realized movement makes the trail naturally wider in the volatile
early session and naturally compress into the afternoon. The breathing behavior comes from the tape
rather than from a schedule.

**14. Core computation**

```
move_unit       = rolling realized movement over the 15–30 min window

profit_at_risk  = delta × move_unit + ½ × gamma × move_unit²

trail_level     = high_water_profit − k × profit_at_risk
```

The gamma term is what makes profit-at-risk explode near the apex. That is the intended behavior, not
a side effect.

**Worked example.** Open gain $1,000, profit_at_risk $300, k = 1.5 → trail level at $550.

**15. k modulation**

- Base **k = 1.5**
- **Gamma factor:** 0.7 (strongly negative dealer gamma) to 1.3 (strongly positive)
- **Proximity factor:** 0.8 (thin path ahead) to 1.2 (heavy strike near the center)
- **Clamp** the product to [1.0, 2.5]

> **Open item.** Whether k is a constant or a function of regime is unresolved. Test both.

**16. Floors.** Retain the end-of-session anchor from the legacy schedule as a hard floor, so the
computed trail cannot stay wide into the close.

**17. Display.** Show the computed line **and** the legacy linear-taper line together. Newer traders
watch them diverge and learn from the gap. This is the teaching mechanism, not just a debugging view.

#### Part IV — Batman-specific handling

**18. Both sides, same logic.** Hold-or-fold applies to each side independently. You do not always get
to visit both sides; the logic is unchanged either way. The trail is live on whichever side price is
actually working.

**19. Free-wing conversion.** When price is working one side, the other side is virtually worthless. It
often makes sense to **buy back the center (short) strikes of the further-out fly** — typically when
they are under about ten cents, sometimes five.

The result is free wings in case price swings all the way back.

> **Tool requirement.** Alert when the far-side shorts drop under the 5–10 cent threshold. It is a
> small side-condition that only fires on Batman days, which makes it easy to miss in the heat of the
> session.

#### Part V — Validation

**20. Backtest criteria**

1. Across volatility regimes — low, mid, high — separately, not pooled
2. Across the full outcome distribution
3. **Primary criterion:** whether the computed line would have folded trades bound for the top return
   band. Those are 2.5 to 5 percent of trades and carry a disproportionate share of the return. A line
   that improves average retention while cutting off the tail is a worse line.
4. Compare against the legacy linear taper on the same trades
5. Fit k — constant versus regime-dependent

**21. Open items**

- Name the entry trigger precisely from observed entries
- Determine whether k is constant or regime-dependent
- Incorporate findings from the six-vendor GEX tool comparison

### 0.3 Seating of §0.1 vs §0.2 (this spec's job — not Coach deletion)

§0.2 is **v2 product law** for states, arming, entry, rearm, GEX-as-management, and the trail. §0.1
stays. Where they name the same thing differently, **§0.2 wins** and the v1 name is mapped — not
erased.

| Topic | v2 law (§0.2) | v1 text (§0.1) | Seat |
|-------|----------------|----------------|------|
| States | **Armed** (no position) → **In trade** → **Managing** | Waiting → Armed → Recorded | **§0.2 names.** v1 Waiting = In trade. v1 Armed = Managing. v1 Recorded → fold **suggestion** (§11). |
| When the algo turns on | Discretionary **arm** at a VP bounce; **no fill yet** | Specify an existing OTM fly on the book | **Both.** Arm may precede the card. Once a fill exists, v1 bind-to-fly still applies. |
| 75% gate | **≈75% profit over risk taken**; below that **no line** | 75% of **debit** then trail | **Same gate.** `risk_taken` is defined in §9.1 (E4), including Batman. Knobs remain member law (DL-482). |
| Trail proposed | Live **profit-at-risk** on the risk side, GEX-modulated **`p`** on the reward side (proposed, unvalidated) | Give-up % of high-water, 75% → 25% by EoD, paced by premium decay | **Proposed line = §0.2 Part III**, corrected per E1 and reseated as a hold-or-fold pair of clauses per E25/E32. v1 schedule = **legacy fallback / beginner scaffolding** (§9.5). **Show both lines** (§0.2.17). Neither is called "primary" until §14 (E8). |
| "Stop" | **There are no stops.** Loss bounded by debit. Line is **advisory**, judged and overridden, **never an automatic exit** | HUD row **Stop** = ticker `x_S`; exit **records** and eval stops | HUD **Stop** is the **guide print**, not a broker stop. Crossing it **records a fold suggestion**. It does **not** flatten. Member may **override** and stay **Managing**. |
| GEX | **Management instrument**, not an entry filter | Narrative play-by-play from GEX | **Both.** GEX modulates **`p`** while Managing (E29 — it was on `k`, on the risk side, until v2.3); Reason/Trader Feed still speaks GEX when the overlay is on. |
| VP | Structural map for **arming / entry** | Narrative only if engaged | **Both.** Analyzer VP overlay remains **FI-031** until that overlay exists; arming still **names** VP as the map. |
| Batman | Both sides independent; free-wing conversion alert | v1 "Batman-as-a-whole **out**" | **§0.2 Part IV is in.** v1 exclusion is **reshaped**, not silently dropped. Gate per side (E4). |
| Reason / TF / ALGO-N1 / HUD High·Profit·Trail | — | §0.1.9–18 | **Unchanged**, except HUD freezes rather than hides on Fold suggested (E3). Reason still does not drive the engine. |

---

## 1. Job of the algo

| Stay in | Don't give back |
|---------|-----------------|
| Hold the fly while it still has room so a runner can remain a runner | Narrate a **guide** so they do not give back more than they should |

**Distribution (strategy parent):** most clip small; a few bank the run. The **primary validation
error** is folding a trade bound for the top return band (2.5–5% of trades). Labs chrome does not quote
Sharpe or return bands as a promise (§13).

**What "stop" means here:** a **visible advisory line** plus a **narrative / record** event. The
**position stays on the book**. No Tradier, no close, no order. The member still owns Close / Trade Log
on the card. They may **override** the line and remain Managing.

---

## 2. Relationship to other specs

| Spec | This document |
|------|----------------|
| **0DTE Strategy** | Premise, regime → structure, convexity band, pin / apex, outcome distribution. This spec is the **arming and management mechanics** that document points at. |
| **AZ-ALB** | Apply chrome, holder Idle/Live/Touched, floatable Builder, Manager hook. Type → Algo. |
| **ALM** | `alert_class: algo`. Analyzer remains a **client**. Evaluation may run in the Analyzer adapter until Manager GO. |
| **OT-EF / DL-309** | Debit, P&L, greeks, trail invert: **OPF-held chain and package quote only**. Representable or **named state**. |
| **Keep-Warm** | Trail math and narrative follow Working / Away / Idle. Pulse is **paint-only**. |
| **Arch 28** | One market WebSocket. No client Massive. GEX / VP / marks from the bus + OPF. |
| **Trader Feed (TF)** | Chrome for the Reason floater (`algo-reason`). This spec owns the host pack. |
| **Heatmap** | Reason AI may **read** OPF-held Heatmap / dual-side chain already on the plane. |

**Apply kind:** `kind: position` (bound card **or** planned fly) + `alert_class: algo`. Canvas
right-click does **not** author Algo.

---

## 3. As-built honesty (audit 2026-09-02 — not law)

What the Analyzer **does today**. **Not** a waiver of §0.2.

| Claim | As-built |
|-------|----------|
| Live eval | **`tickAlgoAlert` no-ops unless `algo.demo`.** Test: `"non-demo does not tick"`. Live RTH Algo stays Waiting. |
| Trail | Legacy give-up `S = (1−g)×H` only. Clock taper; **`E(t)` always `null`**. No profit-at-risk, no `k`, no GEX modulation. |
| Bind | Existing book card that `isOtmDebitButterfly`. **No Armed-before-fill.** |
| Reason | **Two** checkboxes on Start/End Trail % (`trail_stop_reason` / `trail_end_reason`). ALGO-R1 (one Reason) **not landed**. W3-R READY, never fired. |
| Trader Feed | `AlgoNarrativePanel` exists; Analyzer **must not** import it (ALGO-N1). **No** `data-trader-feed="algo-reason"`. No house base on `/app/alerts`. |
| HUD | High / Profit / Trail / Stop — **Live + old-Armed**, Demo path only. |
| Canvas | Dashed `x_H` / `x_S`; overlay two alphas, not a ramp. |
| Recorded | Touched + `triggeredAt` / `triggeredSpot`. Payload **not written**. Holder says "Waiting / Armed / Recorded". |
| Persistence | `sessionStorage`. `upsertAlert` is a typed hook, unused. |
| Board | W1–W4 PASS against **v1.0.2**. W5 / W-G **not run**. Spec had already drifted to v1.0.16. |

**Two consequences this spec must carry, not gloss (E6):**

1. **`E(t)` has never been measured.** The premium-decay pacing in §0.1.5 — Coach's stated law for what
   makes the trail *dynamic* — has never executed. Every legacy trail ever painted was clock-only.
2. Because of (1), the **legacy end-of-session anchor that §9.4 uses as a hard floor is derived from a
   path that has never run in its specified form.** It is still the right floor to have; it is not a
   validated one. §9.4 names it.

**Dogfood today:** eligible OTM debit fly → **+** pulses → Type Algo → check **Demo** → move What-if
Spot/Time until `U ≥ 0.75 D`. Without Demo, nothing after Save moves.

---

## 4. States (normative)

| State | Who acts | Meaning | v1 name (as-built) | Holder |
|-------|----------|---------|--------------------|--------|
| **Idle** | Trader | Paused. No eval. | Idle | Idle |
| **Armed** | Trader | Setup identified. Algo on. **No position.** Watching the VP bounce. | *(none)* | Live · Armed |
| **In trade** | Algo | Trigger fired. Position on. **Below** the gate. **No trail geometry.** | Waiting | Live · In trade |
| **Managing** | Trail + GEX | `U ≥` gate. High-water + **both** trail lines. HUD on. | Armed | Live · Managing |
| **Fold suggested** | Guide | Spot / P&L crossed the **guide**. Tape records. Position **stays**. Member may override → Managing. | Recorded | Touched · Fold suggested · **`· demo`** when the clock was Demo |

**Code ids:** `armed` · `in_trade` · `managing` · `fold_suggested` · `idle`.
Do not reuse v1 `armed` for Managing without a mapping layer — that collision is how the two documents
disagree.

Arming is discretionary. Entry is mechanical. Management is a third state with its own gate.

---

## 5. Arming, trigger, rearm

### 5.1 Arming

The trader identifies the **structural level from volume profile**, watches price pull back into it,
and — when it appears to bounce — **arms** the algo. GEX is **not** consulted to arm.

### 5.2 Trigger

The algo **enters** when the bounce off the structural level confirms and price heads toward the fly.

> **Open item (Coach).** The trigger is "the bounce confirming" until enough live observations exist to
> name it. Specify from observed entries, not from theory.

**Manual-confirm stand-in.** Until the formula exists, a **manual confirm** — the member accepts the
fill, or the card appears on the book — moves Armed → In trade. This is a **named stand-in**, not the
trigger.

**E9 — retirement condition.** The stand-in is retired when **all three** hold, and not before:

1. `LABS_ALGO_TRIGGER_FORMULA_ID` names a formula other than `manual_confirm`;
2. that formula has a characterization fixture set of **at least 20 observed entries** with the
   entry instant hand-marked from tape (Appendix B);
3. Coach records the promotion in the DL.

Until then the stand-in is the **only** Armed → In trade path, and **AT-ALGO-T1a** asserts exactly
that. A second auto-path appearing while the config still says `manual_confirm` is a defect.

### 5.3 There are no stops

The trader is never in the trade to stop out. Loss is bounded by the debit. **Rearm does not mean retry
after a stop.**

### 5.4 Rearming

One case only: **an armed setup never triggers, and price continues past the original entry level
toward the next structural level.** Example, call fly: pullback to a structural level, apparent bounce,
arm, trigger never fires, price continues. The trader may rearm against a **lower** structural level.

### 5.5 Repositioning on rearm

The fly is **repositioned, not reused.** Width **does not change** (regime has not changed).

**Rearm check:** price the fly at the new level (OPF package). If the debit is **not within
`LABS_ALGO_CONVEXITY_MIN_PCT`–`LABS_ALGO_CONVEXITY_MAX_PCT` of the width** (default 5–10%), re-strike
to a level where real convexity exists.

> **Tool requirement (Coach).** Flag when an armed fly has gone stale and needs re-striking. Hard,
> checkable. **AT-ALGO-20.**

The flag is **advisory chrome**. It does not block Save, does not re-strike, and does not send an
order.

---

## 6. Who it binds to

### 6.1 Classic (workhorse)

One **long OTM debit butterfly** on the Analyzer book (or a **planned** listed fly while Armed).

| Must | Law |
|------|-----|
| Structure | Listed butterfly: three strikes, same right, **+1 / −2 / +1**. OPF-listed only. |
| OTM | Call fly: body **>** spot. Put fly: body **<** spot. ATM body is **not** this algo. |
| Debit | Package is a **debit**. Credit / short flies **out**. |
| Convexity band | Debit within the configured band of width after a rearm. Flag if outside. |
| Bound | In trade / Managing: `position_id` resolves to a book card. Armed: may be planned (no card yet). Unbound after a fill → holder **Unbound**, no geometry. |

Eligibility helper (normative name): `isOtmDebitButterfly(card, spot)` — listed shape + OTM vs **raw**
underlier + debit > 0. Unpriceable debit → **not eligible** (named, not invented).

### 6.2 Batman (in, from §0.2 Part IV)

Hold-or-fold applies to **each side independently**. The trail is live on whichever side price is
actually working.

**Working side (normative, E4).** The working side is the fly whose **body is on the same side of spot
as the current drift**, resolved as: the fly with the **smaller absolute distance from spot to body**.
Ties, and any spot strictly between the two bodies, resolve to the side with the **larger open
profit**; if those are equal, the state is **named `working_side: ambiguous`** and **no guide paints on
either side** until it resolves. Do not guess a side.

**E19 — high-water resets on a side switch.** `H` is a high-water of open profit **on one fly**. When
`working_side` changes, `H` **resets to the new side's current open profit** and the guide recomputes
from there; the prior side's `H` is retained in the payload as `h_prior_side` for the tape. Carrying
`H` across a switch computes a guide from a different fly's profit — a number that was never at risk
on the instrument now being managed. The switch is a **named tape event**. **AT-ALGO-30.**

**Free-wing conversion:** when one side is working, the further-out fly's **short body** often becomes
noise. Alert when those shorts print **under `LABS_ALGO_FREEWING_CENTS`** (default 10¢, member may set
5¢). Member still owns the buy-back. The algo does not send the order.

> **Tool requirement (Coach).** Far-side shorts under the threshold. Batman days only. **AT-ALGO-21.**

v1 "Batman-as-a-whole out" is **reshaped** by this section. BWB, condor, iron fly, vertical remain
**out** of this algo.

---

## 7. Create path

### 7.1 Subtle flash on **+**

When **at least one** book card is eligible (§6.1), **or** the member is in an **Armed** planned setup:
inspector Alerts **+** (`analyzer-alert-create`) **pulses** (tint, not a seizure). Pulse **stops** when
nothing eligible remains, or an Algo is already Live on that card. **AT-ALGO-1.**

### 7.2 Click **+**

Opens the floatable Alert Builder (AZ-ALB) with Type **Algo** when an eligible fly exists; else Price /
Spot. Knobs only on the panel (**ALGO-N1**). **ALGO-TM1** unchanged: Time Machine day may load empty;
add the fly afterwards. Canvas right-click does **not** author Algo.

### 7.3 Demo

**Demo is a clock, not an eval switch.** What-if and Time Machine remain the Demo clocks (DL-485 · TM
v0.7.4). **Live algos tick on the live raw mark.** As-built Demo-only eval is a **defect against this
spec**, not a feature (**AT-ALGO-18**).

Rehearsal under a playhead: badged, never stored, never notifying, disposed on Reset.

---

## 8. Alert Builder — Algo

Title: `{SYMBOL} — Algo Alert`. State control: **Live / Idle**. After **Fold suggested**, Builder shows
the stamp + **Reset to Live** (new wait — Armed if no fill, In trade if the card remains).

### 8.1 ALGO-N1

Type → Algo shows **knobs only** (and the empty-state bind copy). No description paragraph on the
Builder. Trail lines, holder states, Demo stay. Trader Feed mounts under **ALGO-R1**.

### 8.2 Minimal controls

| Control | Default | Law |
|---------|---------|-----|
| Position / planned fly | Eligible card, else planned | Dropdown: eligible OTM debit flies. Empty → named "Specify an OTM butterfly." Save off until bind or planned fly is representable. |
| Start profit management | **75** | 1–100. Gate = % of **`risk_taken`** (§9.1). Below gate: **In trade**, no lines. |
| **Trail Settings** group | — | Tinted box. Title **Trail Settings**. One **Reason** checkbox **to the right of that title** (ALGO-R1). |
| **Reason** | **Off** | Whole Managing window. Checked → Trader Feed + basic narration. Prompt optional focus. **Does not** change the engine. Supercedes two Reason boxes (**DL-484**). |
| **Start Trail %** / **End Trail %** / Decay | 75 / 25 / EoD | **Legacy scaffolding.** Inputs to the linear-taper **fallback** line and to the **floor** of the proposed line. Always shown. Start > End. |
| High-water / guide / legacy colors | Tag target / warning / (third) | Assignable. Proposed guide and legacy taper **both** paint (§9.3). |
| Overlay between **guide** and high-water | **Off** | Optional. Densifies + pulses if spot threatens the **guide**. |
| **Demo** | **Off** | Clock only. |

Trigger / tags / expiration: AZ-ALB shared. `behavior` stamps **once_only** for a fold-suggestion cycle.
Save on when bind is eligible and OPF can name a debit **or** the planned fly is listed and priceable.

### 8.3 Hook

`upsertAlert`: `alert_class: algo`, `kind: position`, `trigger.family: algo`,
`trigger.algo.variant: otm_fly_trail`. Write `reason_on` / `reason`. **Do not write**
`trail_stop_reason` / `trail_end_reason`. Ignore those keys if still on an old record.

---

## 9. Management and trail

### 9.1 Activation gate — and what `risk_taken` means (E4)

Profit management does **not** begin until open profit reaches the gate. Below that: **In trade** — no
line, no HUD, nothing displayed.

```
gate:  U ≥ entryPct × risk_taken
```

**`risk_taken` is normative, not idiomatic:**

| Structure | `risk_taken` | `U` |
|---|---|---|
| Classic single fly | Net **debit paid for that fly** | Open profit on that fly |
| **Batman, working side resolved** | Net debit paid **for the working side's fly only** | Open profit **on the working side only** |
| **Batman, `working_side: ambiguous`** | — | **Gate does not evaluate.** No line either side. |

> **E4.** v2.0 said "risk taken = debit" and separately added a two-fly structure with independent
> per-side logic. Those cannot both be loose. A trader holding two $500 flies with $600 open on the
> working side is at **120%** of one leg and **60%** of the pair — Managing under one reading, In trade
> under the other. The gate is measured **per side, against that side's own debit**, so the side that
> is working is managed on its own terms. The pair's total debit remains the loss bound (§5.3); it is
> not the gate denominator.

Knobs remain member law (DL-482).

### 9.2 GEX as management

GEX is **not** an entry filter. It is the **hold-or-fold weather** once In trade / Managing:

- Positive dealer gamma around the position → reason to **widen**, and to **override** the guide
- Below the flip → reason to **tighten**
- Heavy positive-gamma strike at the center → a wall worth patience
- Air in the drift direction → tighten hard
- Near the center strike → GEX may justify folding **ahead** of the trail

Volume profile can be read the same way for this decision, not only for entry. If VP is not engaged on
this Analyzer, omit VP from the **narrative**; the arming map is still the strategy's VP.

**Fold signals (awareness, not a flatten):** decaying premium, constricting breakevens, extreme gamma
and delta slope — experienced near the **edges** of the trail, which is why the awareness layer exists
**before** they get there.

**Apex:** same risk as the edges. Pin behavior (strategy spec §6): a pin is not a pin until the end of
the day. The apex is a place to be **alert**, not to relax.

### 9.3 Two lines (teaching)

While **Managing**, paint both:

1. **Proposed guide** — §9.4. Labelled *proposed* in chrome and in the tape (**E8**).
2. **Legacy taper** — §9.5. Fallback and beginner scaffolding.

Newer traders watch them diverge and learn from the gap. This is the teaching mechanism, not a debug
view. **AT-ALGO-22.**

**The two lines now differ in kind, not only in value (E27).** The legacy taper **ratchets** — it can
only tighten. The guide **breathes** — it is recomputed every tick and may widen. So part of the gap
a member sees is the difference between a schedule and a live risk-versus-reward read, which is the
more useful lesson and should be what the caption teaches.

> **E8.** v2.0 called the same line both "primary" and "proposed, unvalidated." Neither line is called
> primary until §14 has evidence. Passing §14 is what promotes the word — nothing else does.

### 9.4 Proposed trail (unvalidated)

Constants are **starting points to be fitted**, not results. All live in Appendix A.

**E10 — dimensional law. Read this before the formula.**

| Quantity | Unit | Source |
|---|---|---|
| `move_unit`, `m_adv` | **underlier points** | realized-move estimator, §9.4.1 |
| `Δ` | **package dollars per underlier point** | OPF package greek × multiplier × quantity |
| `Γ` | **package dollars per underlier point²** | OPF package greek × multiplier × quantity |
| `H`, `U`, `PaR`, `risk_taken` | **package dollars** | OPF |
| `width`, `debit`, `ceiling` | **package dollars** | strikes × multiplier × quantity; fill |
| `headroom` = `max(0, ceiling − H)` | **package dollars** | §9.4.3 |
| `giveback` = `H − U` | **package dollars** | §9.4.3 · HUD row (E31) |
| `guide_raw`, `floor`, `guide_level` | **package dollars** | §9.4.2 · §9.4.3 |
| `p`, `gamma_factor`, `proximity_factor`, `extrinsic_factor` | dimensionless | §9.4.4 |
| ~~`k`~~ | *retired at v2.3* | E29 — no longer exists |

**Both sides of the hold-or-fold inequality are package dollars.** `p × headroom` and `at_risk` are
directly comparable; `p` is dimensionless by construction, so a `p` that ever acquires a unit is a
defect, not a scaling detail. **AT-ALGO-6d** covers the risk side; **AT-ALGO-6f** asserts the
inequality's two sides carry the same unit on fixture 20.

Δ and Γ **must already carry the contract multiplier and the position quantity** when they reach this
module. A per-share greek entering here is a defect, not a scaling detail — it is off by 100× and
`PaR` will look plausible. `algoProfitAtRisk.ts` accepts package-dollar greeks only and **names the
state** if OPF hands it per-share values it cannot convert.

> v2.1 wrote Δ and Γ with no unit and a worked example in dollars against a `move_unit` in points.
> AT-ALGO-6b would have passed on a dimensionally meaningless fixture. **AT-ALGO-6d** now asserts the
> units end-to-end on Appendix B fixture 1.

```
move_unit       = realized-move estimator over LABS_ALGO_MOVE_WINDOW_MIN   [points]

m_adv           = move_unit taken in the ADVERSE direction — the direction in which
                  open profit on the WORKING fly decreases                 [points]

pnl_change_adv  = Δ · m_adv + ½ · Γ · m_adv²                               [$]

profit_at_risk  = max(0, −pnl_change_adv)                                  [$, never negative]
```

`profit_at_risk` is the **right-hand side of clause A** (§9.4.3). It is no longer combined with `k` to
produce a level directly — that step was the half-model v2.3 replaced (E25), and it does not appear
in clause B at all (E32).

**Adverse direction** is resolved from the position, not from the tape's recent sign: for a call fly
above spot, adverse is **down** while spot is below the body and **up** while spot is above it; for a
put fly, mirrored. At the body both directions are adverse and the **larger** resulting `PaR` is taken.

**E24 — the at-body tie-break must be exercised.** Δ = 0 makes up and down identical, so fixture 2
does not fire the rule. Fixture **18** is spot at the body with Δ small but **non-zero**, so the two
directions yield different `PaR` and the larger is taken (**AT-ALGO-34**).

### 9.4.1 `move_unit` — the estimator is named (E11)

"Rolling realized movement" is not a definition, and this value enters `PaR` **quadratically**, so a
loose estimator is a loose trail.

```
move_unit = LABS_ALGO_MOVE_SIGMA × stdev( 1-minute underlier log returns
                                          over LABS_ALGO_MOVE_WINDOW_MIN )
            × spot                                              [points]
```

Defaults: window **20 min** (Coach's band is 15–30), `MOVE_SIGMA` **1.0**. Fewer than
`LABS_ALGO_MOVE_MIN_SAMPLES` bars in the window (default 10) → `move_unit` is **unmeasured**: the
proposed line is **WAITING and does not paint**, and the legacy line carries the session. Do not
substitute a default, a prior window, or implied vol.

**Expected move is rejected *here*.** Realized movement is the unit on the **risk** side — that is what
lets the trail breathe early and compress into the afternoon without a clock story. **AT-ALGO-19**
greps for it, on this side only.

**E36 — three volatility quantities now coexist. They are not interchangeable.**

| Quantity | Kind | Where it may appear | Owner |
|---|---|---|---|
| `move_unit` (§9.4.1) | **realized** — stdev of 1-minute underlier log returns | the **risk** side only: `m_adv` → `PaR` | this spec |
| `extrinsic_factor` (§9.4.4) | **implied** — remaining package extrinsic as a fraction of its session-open value | the **reward** side only: `p` | this spec |
| `σ_T` (Archive Lab WS2) | **implied** — session σ-band | **neither.** An archive and analysis quantity | Archive Lab |

**AT-ALGO-19 is scoped to the modules that compute `at_risk`** — `algoProfitAtRisk.ts` and the
`move_unit` estimator. It does **not** run on the `p` module, where an implied quantity is the whole
point (E30). Run program-wide it would either fail on a correct `extrinsic_factor` or be weakened
until it tests nothing — and a weakened grep is the defect family this spec keeps finding: a check
that cannot fail.

**AT-ALGO-19b** asserts the converse. The `p` module does **not** import Archive Lab's `σ_T`. The
reward side reads the market's own remaining extrinsic on this package (E30), not a session vol
estimate maintained by another program on another cadence. Sharing that import would make the guide
answer to a quantity no one on this spec owns.

### 9.4.2 `k` is retired; the risk side is unmultiplied (E29) · the floor (E23)

> **E1 — this is the correction, and it is the reason v2.1 exists.**
>
> v2.0 wrote `profit_at_risk = Δ × move_unit + ½ × Γ × move_unit²` and asserted that the gamma term
> *"makes profit-at-risk explode near the apex."* For this structure it does the opposite. A long
> butterfly is `+1 / −2 / +1`: at the body you are **net short two options**, so **Γ is at its most
> negative exactly at the apex**, and Δ ≈ 0 there. With `move_unit` an unsigned magnitude:
>
> ```
> at the apex:  PaR ≈ ½ × (Γ < 0) × m²  <  0
>               trail_level = H − k × (negative) = H + something  >  H
> ```
>
> The guide prints **above** the high-water mark, so the position is already outside it and folds
> **immediately, at the apex** — the exact location §0.2.10 names as the one to be most alert at. The
> worked example ($1,000 gain, PaR $300, k = 1.5 → $550) only holds where the gamma contribution is
> positive, which for this structure is the wings, not the body.
>
> Coach's intent — risk explodes at the apex — is **correct and preserved**. It is recovered by taking
> the loss magnitude: at the apex `pnl_change_adv ≈ ½Γm² < 0`, so `PaR ≈ ½|Γ|m² > 0` and grows with
> `|Γ|`. The apex now produces the **widest** profit-at-risk and therefore the **tightest** guide,
> which is what was meant.
>
> **AT-ALGO-6b** asserts `profit_at_risk ≥ 0` and the guide below high-water on every fixture,
> including an apex fixture. v2.0 asserted neither, so this would have shipped green. (At v2.3.1 that
> second assertion is written `guide_level ≤ H`, strict except the `headroom = 0` row — E32.)

**`k` is retired (E29).** v2.2.2 multiplied `k_base × gamma_factor × proximity_factor` and applied
the product to `profit_at_risk`. That put GEX, strike proximity and (later) remaining extrinsic on the
**risk** side, where they do not belong — they say nothing about what a move costs, and everything
about whether the remaining prize gets captured. The same three factors, the same ranges and the same
clamp discipline now modulate **`p`** in §9.4.4.

`profit_at_risk` reaches §9.4.3 **unmultiplied**. There is no combination step in this section.

**`gamma_factor` — the normalization is named (E11), and it now modulates `p`.** Net dealer GEX is
mapped to `[GAMMA_FACTOR_MIN, GAMMA_FACTOR_MAX]` by its **percentile within the trailing
`LABS_ALGO_GEX_NORM_WINDOW_MIN` of same-session GEX samples** (default 90 min), linearly:
0th percentile → MIN, 100th → MAX, 50th → 1.0. Fewer than `LABS_ALGO_GEX_NORM_MIN_SAMPLES` samples
(default 30) → **empty history** → `gamma_factor = 1.0`, named as in §12. Absolute dollars are never
used; scale drifts.

**`time remaining` reaches neither `PaR` nor `p` (E21).** It enters **only** through the E23 floor.
**AT-ALGO-28** greps `algoProfitAtRisk.ts` for session-clock identifiers.


**Floor (E23 — formula, not prose).** The legacy **end-of-session anchor** is a hard floor on the
**proposed** line, and it **binds only as the close approaches**. It does **not** cap the proposed
line against current legacy `S(t)` all day.

**Hotel + Coach disposal of the three readings:**

| Reading | Formula | Verdict |
|---|---|---|
| **(a)** `guide_level = max(guide_raw, S(t))` at all times | the guide can never be wider than legacy | **Rejected.** Destroys breathe-early, the argument for the computed line |
| **(b)** `floor = (1 − gMin)·H` at all times | absurdly tight all morning | **Rejected** |
| **(c)** floor binds only as the close approaches | intended | **Law** |

```
floor            = (1 − gMin) × H                         [$]   end-of-session anchor
floor_active     = remainingToDecayEnd ≤ LABS_ALGO_FLOOR_REMAINING_H   [default 1.0 h]
guide_raw        = H − (p × headroom)                     [$]   §9.4.3 clause B, pre-floor
guide_level      = guide_raw                              if not floor_active
                 = max(guide_raw, floor)                  if floor_active
```

Higher `guide_level` is **tighter**. `max` therefore means: once the floor is active, the guide
**cannot stay wider** (lower) than the end-of-session anchor. Before that window, `guide_raw` stands
even when it is below `floor` — that is breathe-early.

**The floor binds clause B only.** Clause A (§9.4.3) is a regime boolean with no level in it; a floor
cannot apply to it. A fold may therefore fire from A while the floored guide sits below `U`.

The **legacy** line remains `S(t) = (1 − g(t)) × H` independently. The floor is **not** applied to
legacy. Fixture **17** is the first row in which **both** lines and the floor appear in one
calculation (**AT-ALGO-33**).

> **E6 still:** that floor derives from the legacy taper, whose premium-decay pacing has **never
> executed** — `E(t)` has always been `null` (§3). Chrome that names the floor says
> `floor: legacy (clock-only)` whenever `E(t)` is null. Do not present it as decay-paced when it is
> not. E23 supplies the missing formula; it does not validate the floor.

**Invert to underlier `x_S`:** T+0 invert of the bound card at P&L = `guide_level` as v1 §7.4 (near /
far through the body — ALGO-B1). Missing invert → named state, last paint, P&L backstop
`U ≤ guide_level`. Do not invent `x_S`. **Clause A is unaffected** — it has no level and needs no
invert, so a missing invert never suppresses a regime fold.

**Δ / Γ unmeasured:** the proposed line is **named WAITING** and does not paint; the legacy line may
still paint. **A missing input is never rendered as a line.** Do not invent greeks.

### 9.4.3 Hold or fold — the model (E25 · E26 · E27 · E32)

**This is the guide. Everything above is an input to it.**

```
ceiling    = width − debit                              [$]  arithmetic, not a forecast
headroom   = max(0, ceiling − H)                        [$]  what the peak has not yet taken
giveback   = H − U                                      [$]  already surrendered from the peak
at_risk    = profit_at_risk                             [$]  §9.4, cost of one adverse move
```

`p ∈ [0, 1]` is the probability of capturing what remains, §9.4.4. `p × headroom` is the
**probability-weighted prize** — and, read the other way, the **giveback budget**: how much of the
peak it is worth handing back while waiting for that prize.

#### Two clauses. Fold fires on A **or** B (E32)

| Clause | Coach's case | Fires when | Payload |
|---|---|---|---|
| **A · Regime** | *"this is likely the best we're going to get, so let's take it"* | `p × headroom ≤ at_risk` — **regardless of where `U` sits relative to any line** | `fold_clause: "regime"` |
| **B · Level** | the trailing line | `giveback ≥ p × headroom` — equivalently `U ≤ guide_level` — evaluated **after** the E23 floor | `fold_clause: "guide"` |

**Hold while neither fires.** There is no third path to Fold suggested, and no clause outranks the
other on hold: either one firing is a fold.

> **E32 — there is no single derivation, and v2.3 claimed one.** v2.3 wrote `guide_level` as *"the P&L
> at which the inequality flips."* It is not. `p × headroom > at_risk` contains **no `U`**. A boolean
> with no `U` in it has no P&L indifference point to invert, so the derivation was false reasoning
> that happened to land on a defensible number.
>
> The two clauses answer different questions and both are Coach's:
>
> **A** asks *is this trade still worth being in at all.* It is a property of the regime — the prize
> on offer versus the cost of one adverse move — and it can fire **at the high-water mark itself**,
> with nothing given back and no line crossed. That is the case a price-level trail could never
> express, and it is the reason v2.3 exists.
>
> **B** asks *how much of the peak am I willing to hand back while waiting.* `p × headroom` is a
> **budget**, not an indifference point. Spending the budget is the fold.
>
> Reading B as a consequence of A is the error. They coincide only by accident.

**Both clauses are evaluated every tick while Managing (Coach, 2026-09-03).** Not on a schedule, not
on price movement alone. `p`, `headroom` and `at_risk` all move without spot moving — GEX shifts,
extrinsic bleeds, `H` ratchets — so either verdict can flip while price sits still. That is the point.

**The payload names which clause fired.** `fold_clause` is `"regime"` or `"guide"`; when both are true
in the same tick it is `"regime"`, the stronger statement, and `fold_clause_both: true` is stamped. A
Fold suggested with no `fold_clause` is a **defect** — a fold whose reason cannot be reconstructed
from the tape is exactly the autonomy theater this program refuses (**AT-ALGO-42**, **AT-ALGO-43**).

**`headroom` uses `H`, not `U` (E26 · E35).** Coach: *"the max unrealized value the trade has
**achieved** vs what could be."* The claim is about what the position **achieved** — not that the
remainder is therefore available. A fly whose peak reached 80% of ceiling has achieved that much of
the move *for this position, on this day*; one that never passed 30% has not. `U` is where the trade
stands now and cannot tell them apart; `H` is the achievement record and can.

**What `H` does not prove (E35).** A peak set by a single wick through the body is the achievement of
one print, not of a regime. `headroom` off such an `H` is small and the guide correspondingly tight,
which is the conservative direction and therefore safe — but the **narrative must not** say the move
is "reachable" or "available" on that evidence. §13 bans the forecast claim; this is where it would
otherwise enter. Fixture **25** is the wick case (**AT-ALGO-45**).

**`ceiling` is the hard arithmetic value** — `width − debit`, the package's maximum at the body at
expiry. It is a fact about the strikes, not a view about price. A softer, "realistically reachable"
ceiling would be a forecast and is **out of scope** (OD-ALGO-6).

#### Clause B as a level, and it breathes (E27)

```
guide_raw   = H − (p × headroom)        [$]   the peak less the giveback budget
guide_level = guide_raw, floored per §9.4.2 (E23) when the close window is active
```

`guide_level` is inverted to `x_S` for the canvas as before. It is **clause B written as a level and
nothing more.** It does not encode clause A and must not be read as doing so:

- A fold may fire from **A** while `U` sits comfortably **above** `guide_level` — the line looks safe
  and the trade is not (**AT-ALGO-42**).
- `U` may cross `guide_level` while **A** still says hold — the budget is spent even though the
  regime is fine (**AT-ALGO-43**).

**`headroom = 0` is the equality case.** When `H ≥ ceiling` the budget is zero, so `guide_raw = H`
exactly, and clause A reads `0 ≤ at_risk`, true for every `at_risk ≥ 0` (E1 guarantees `at_risk ≥ 0`).
Both clauses fire together: the package is at its arithmetic maximum and there is nothing left to wait
for. **AT-ALGO-6b's `trail_level < H` is therefore stated as `guide_level ≤ H`, strict everywhere
except this case** (**AT-ALGO-44**). A build that asserts strict `<` universally fails on a fly held
to its ceiling — a correct outcome reported as a defect.

**The guide is recomputed every tick and is NOT ratcheted.** It may move away from price. That is
required, not tolerated — it is the only way to express Coach's second case:

| Coach's case | What the model does |
|---|---|
| *"this is likely the best we're going to get, take it"* | `p` collapses or `headroom → 0` → **clause A** fires directly, and `guide_level` **rises toward `H`**, crossing `U` from below. Folds without spot moving. The line comes to you. |
| *"dealer pressure may keep price afloat long enough for extra decay or to move spot closer to the fly centre"* | `p` stays high while `headroom` remains → **A** holds and `guide_level` **stays low**, so a dip crosses neither. |

Neither is an override. They are the same two quantities read from opposite sides, and the old
price-level trail could express neither, because a line in price space can only answer to price.

**`ALGO-A1`'s running minimum does not apply to the guide (E27).** It stays on the legacy line
(§9.5), which is a different animal and keeps its ratchet as beginner scaffolding. §0.2.12 already
required the trail to *"breathe through the day rather than only shrink"*; the built ratchet
contradicted it and this resolves the contradiction in favour of Coach's text.

**Floor (E23) still binds** on clause B, unchanged: inside `LABS_ALGO_FLOOR_REMAINING_H` of decay end,
`guide_level = max(guide_raw, (1 − gMin) × H)`. Breathing is not licence to stay wide into the close.
The floor does not touch clause A — a regime boolean has no level to floor (§9.4.2).

#### When the guide moves, the surface says why (E28 · E34 — law)

A guide that retreats without explanation reads as the stop running away from the member, and that
destroys trust faster than a wrong number.

**Accumulate, then name (E34).** The threshold is on **cumulative** movement since the last
narration, not on movement between two ticks. A guide that retreats by a fifth of the threshold on
each of ten consecutive ticks has moved twice the threshold and, under a per-tick test, has said
nothing — and slow drift is the shape this failure actually takes. A per-tick threshold is therefore
a **check that cannot fire against the real case**, which is the defect family this codebase keeps
shipping.

```
accum        += (guide_level_t − guide_level_{t−1})      signed, in $
narrate when  |accum| ≥ LABS_ALGO_LOOSEN_NARRATE_PCT × H
on narration  accum = 0
on direction reversal   accum = 0        a reversal is a new story, not a continuation
```

**Hysteresis is asymmetric (E34).** The two directions are not symmetric in what they cost the member:

| Direction | Rule | Why |
|---|---|---|
| **Tightening** (guide moves toward `U`) | narrate **immediately** on threshold | The member's room is shrinking. Delay is not defensible |
| **Widening** (guide moves away from `U`) | hold `LABS_ALGO_LOOSEN_CONFIRM_BARS` evaluations at or beyond the wider level, then narrate | A one-tick flicker in `p` that reverts is not "your stop moved away," and posting it would be a false statement in the honest direction |

A widening that reverts inside the confirm window is **never narrated** and `accum` resets. The
confirm window delays the post; it does **not** delay the guide — `guide_level` itself is live every
tick. **AT-ALGO-46**, **AT-ALGO-48**.

**The cause is on the canvas (E34).** The dominant cause — the term whose change contributed most to
`accum` — appears **on the guide line itself**, as a marker whose cause word is legible without
interaction. Hover is not a channel: a member watching price does not hover, and a member on a touch
surface cannot. The Feed (§10) carries the full sentence; the canvas carries the short form; the HUD
carries the direction marker.

```
guide widened · dealer gamma positive near spot        (p rose, gamma factor)
guide widened · extrinsic still bleeding               (p rose, extrinsic factor)
guide widened · high-water advanced                    (H rose, headroom grew)
guide tightened · dealer gamma fell                    (p fell)
```

**Narration does not depend on the Feed model (E34).** The dominant term is determined
**arithmetically** — the largest absolute contribution to `Δguide_level` across `p`'s three factors
and `H` — not by asking a model. When the Feed model is unreachable, the Reason box is disabled, or
the overlay is off, the canvas marker and the short cause still appear:

```
guide widened · gamma
guide widened · extrinsic
guide widened · high-water
```

The model's only job is turning that term into a sentence. **AT-ALGO-47.**

**Clause A gets the same treatment.** When `p × headroom` falls to within
`LABS_ALGO_LOOSEN_NARRATE_PCT × H` of `at_risk` — the regime clause approaching its fold — the
surface names it, on the canvas, before it fires. A regime fold that arrives unannounced is the
worst version of this failure, because there is no line movement to see coming.

**Silent movement of the guide is a defect** (AT-ALGO-35).

### 9.4.4 `p` — the probability of capturing headroom (E29 · E30)

`p` is the only unknown in the model. Everything Coach listed — GEX situation, spot proximity to it,
time to expiration, premium decayed versus remaining — **conditions `p`. None of them belong on the
risk side**, which is where v2.2.2 had them.

```
p = clamp(P_BASE × gamma_factor × proximity_factor × extrinsic_factor, P_MIN, P_MAX)
```

| Term | Range | Meaning |
|---|---|---|
| `P_BASE` | **0.35** | fitted constant, §14.5. A starting point, not a finding |
| `gamma_factor` | 0.7 … 1.3 | GEX **percentile** in its own recent distribution (§9.4.2). Positive dealer gamma near spot → price is being held → more chance the fly is reached |
| `proximity_factor` | 0.8 … 1.2 | distance from spot to the body, and to the nearest heavy gamma strike |
| `extrinsic_factor` | 0.8 … 1.2 | **E30** — remaining package extrinsic `E(t)` as a fraction of its session-open value. This is *the market's own price of how much movement is still expected*, and it is the closest thing to a quoted `p` available. It is **not** a decay schedule |

The factor structure, ranges and clamp are deliberately the same shape as v2.2.2's `k` so the
existing tested machinery carries over — **the factors have simply moved to the side of the
inequality where they belong**.

> **E30 — why `E(t)` finally matters.** §3 records that `E(t)` has always been `null`, so every trail
> ever drawn was a clock ramp. That looked like a missing decay-pacer. It was not: remaining
> extrinsic is the market quoting how much movement it still expects, which is exactly the quantity
> `p` needs. `E(t)` unmeasured → `extrinsic_factor = 1.0`, **named** in chrome as
> `p: extrinsic unavailable`, and the guide still paints. Do not invent `E`.

**`p` is not shown as a percentage to the member.** It is a fitted coefficient inside a model that
§14 has not yet validated; printing "62% chance" would be a forecast claim the spec does not make
(§13, Tango). The Feed may say *"more of the move still looks available"* and name the factor that
moved. **AT-ALGO-36.**

### 9.5 Legacy trail (fallback)

Give-up of high-water profit. Member knobs are law (DL-482).

```
S(t) = (1 − g(t)) × H(t)
```

`g` starts at Start Trail % (default 0.75) and tightens to End Trail % (default 0.25) by decay end
(default EoD). Path: `min(g_decay, g_clock)` then running minimum (ALGO-A1). Clock uses
remaining-to-decay-end. Decay uses remaining package extrinsic `E(t)` when OPF can name it;
**unmeasured → clock-only, hold last `g`** — do not invent `E`. Chrome names which path is live.

v1 far-side invert (ALGO-B1) and pulse hysteresis 20/25 (ALGO-A2) apply to the **guide being
threatened** (proposed, if representable; else legacy).

Coach's remembered day-shape (~75% early, ~40% noon, ~20% by 2pm, earlier in low vol) is the **rule of
thumb this fallback approximates**. Knobs remain the member-visible law; do not hardcode 10:00 / 12:00
/ 14:00.

**AT-ALGO-23** greps the trail module for the retired `S = f × H` form — it shipped once and was
corrected by §0.1.10.

### 9.6 Canvas and HUD

| Element | Law |
|---------|-----|
| High-water | Thin dashed vertical at `x_H` (raw print when `H` last increased). |
| Proposed guide | Thin dashed vertical at proposed `x_S`. Labelled *proposed*. |
| Legacy taper | Thin dashed vertical at legacy `x_S` (distinct color). |
| Overlay | Optional, between high-water and the **guide**. Tint = guide color. Ramp toward the guide; pulse on last 20% of `G`, off at 25%. Frozen after Fold suggested (no pulse). |
| Armed / In trade | **No** trail geometry. |
| Fold suggested | Lines **freeze**. Overlay static if it was on. |
| HUD | Lower-left, just above $0: **High** · **Profit** · **Given back** · **Trail** · **Guide** (guide print `x_S`). Colons aligned. Shown while **Managing** and — **E3** — **frozen and still visible** in **Fold suggested**. Hidden in Armed, In trade, Idle. Telemetry, not a flatten. |
| Guide direction | A small marker beside the Guide row showing whether the guide **tightened**, **widened** or **held** since the last narration, with the named cause **on the canvas** — legible without hover, without the Feed, and without the model (**E28 · E34**). Never a silent move. |
| Regime margin | The clause-A margin `p × headroom − at_risk` as a small on-canvas indicator, **not** a number and **not** a percentage (§13, AT-ALGO-36). It shows only that the margin is comfortable, narrowing, or at the fold. Clause A can fire with no line movement at all, so without this the member's first sight of a regime fold is the fold itself (**E32 · E34**). |

**E31 — `giveback` earns a row.** `H − U` is the quantity this entire strategy is about, and until
v2.3 the member had to subtract two rows to get it. In Coach's fold-early case it is the argument:
*take it, because you have given back little and there is no headroom left.* Label is **Given back**
(Tango owns the final wording; it is not "Drawdown", which means something else to a trader).

**E13 — the fourth row is labelled Guide, not Stop (OD-ALGO-1).** §0.2.4 is explicit that there are no
stops and loss is bounded by the debit. A row labelled **Stop** on a chart with a dashed vertical is
read as an instruction, and a member will flatten on it. The payload key stays `guide_print`.
§0.1.11 is Coach verbatim and says *Stop* — so this is **Coach's to dispose (§20)**; Juliet's default
if he is silent is **Guide**.

**E15 — visual weight and motion.**

- The **legacy** taper renders in a **muted** token; the **proposed** guide renders at full weight and
  carries the word *proposed*. They are not peers on the canvas even though both are law.
- `prefers-reduced-motion: reduce` **disables the pulse entirely** — not slowed, not reduced. The
  overlay still densifies toward the guide, which carries the same information without motion.
- Default surface is: high-water + two dashed guides + HUD. Overlay **off**. Feed **off** until Reason
  is checked. Three verticals is the ceiling, not the floor.

> **E3.** v2.0 hid the HUD in Fold suggested. But §11 lets the member **override** and stay in — so the
> four numbers that decision rests on vanished at the moment the decision was asked for. Fold suggested
> **freezes** the HUD at its crossing values, the same way it freezes the lines, and marks it frozen.
> A decision surface does not remove its data at the decision point.

Pan/zoom moves them with the view. Do not steal left-drag pan or strike handles.

---

## 10. Narrative / Reason / Trader Feed

**ALGO-N1:** no description paragraph on Type → Algo.

**ALGO-R1:** one Reason checkbox to the right of "Trail Settings". Checked → Trader Feed `algo-reason`
mounts (prompt not required). Unchecked → unmount. Prompt focuses; it must not divert from primary
purpose (stay-in / don't-give-back, GEX weather, VP if engaged, greeks / debit / gamma / probabilities,
Heatmap on the plane).

**AI active** while **Managing**. Armed / In trade may show the box with standing / waiting copy; no
trail-life model tick until Managing. Fold suggested: last tape, no new inference.

House base on `/app/alerts` (admin in-place). Fail-open: local posts + named "AI quiet", never a silent
empty tape while Reason is on.

### 10.1 Model tool allowlist (E16 · closes FI-032)

§0.1.12 grants the model Heatmap raw data and asks for inferences about the position. Without a schema
that is unconstrained structure invention. The model reads **measurements only**, all as-of stamped:

| Allowed | |
|---|---|
| Position | Δ, Γ (package dollars per point / point²), `U`, `H`, `D`, `risk_taken`, `exit_side`, `working_side` |
| Trail | `g` (legacy), `p` and its three factors, `PaR`, `headroom`, `giveback`, `ceiling`, `move_unit`, both line levels, which line is threatened |
| Guide motion | direction since last tick (tightened / widened / held) and the dominant cause term (**E28**) |
| Market | GEX profile already on the pane with its **percentile**, not raw dollars; spot; realized-move estimate; VP nodes **only if the overlay is engaged** |
| Clock | session time, `mode` (live / demo) |

**Forbidden, and this is the point of the list:**

- No **hold or fold recommendation**, no target, no probability of profit. Reason does not drive the
  engine and must not drive the member either.
- No value the model computed itself. It reports measurements it was handed; it does not derive a
  greek, a level, a node, or a heatmap cell (Hotel, §13).
- No structure vocabulary — see §10.2.

### 10.2 Vocabulary (E12)

Coach's §0.2.8 memo says *"a real wall worth patience," "below the flip,"* and the strategy parent
speaks of the pin. **That text is intent, and it stays in §0.2 unedited.** It is not chrome.

Member-facing surfaces — HUD, canvas labels, notifications, the tape, and the **house base prompt** —
use §13 process words. The Feed may say *"net GEX in the close band is in the 85th percentile
(estimate, as-of 10:42)"*. It may not say *wall*, *flip*, or *pin* as a level, and it may not say
*apex wall*. The correct apex phrasing is **"short-gamma region — profit-at-risk elevated"**, which is
what is actually measured.

**AT-ALGO-27** greps rendered member strings, the house base prompt, and Feed post templates for the
forbidden set. §0.2 memo text is exempt by path — it is a spec section, not a surface.

### 10.3 The Feed's standing job (E28)

Until v2.3 the Feed narrated context. It now has one **required** duty: whenever accumulated guide
movement passes the configured threshold under the §9.4.3 rules — immediately on tightening, after
`LOOSEN_CONFIRM_BARS` on widening — the Feed posts the named cause. This is the honesty channel for a
line that is allowed to retreat, and it is the difference between "the model re-read the situation"
and "my stop is running away from me."

The post names the term, never a prediction:

> `10:42 · guide widened · dealer gamma positive near spot (85th pct, as-of 10:42)`
> `11:15 · guide tightened · high-water advanced, headroom now smaller`
> `13:04 · prize and risk are close · probability-weighted headroom near cost of one move`

It does **not** say hold, fold, or how likely anything is (§10.1, AT-ALGO-32). It reports which
measurement moved.

**The Feed is the sentence, not the signal (E34).** The canvas marker and the short cause word are
produced arithmetically and do not wait on this channel. If the Feed is off, muted, rate-limited or
the model is unreachable, the member still sees which term moved (AT-ALGO-47). A narration channel
that can silently fail is not a law, and E28 is written as law.

testid: `analyzer-algo-narrative` plus `data-trader-feed="algo-reason"`. Do **not** import
`TimeOrthoEggPanel`.

---

## 11. Fold suggestion (was Recorded)

When spot / P&L **exits the guide** in the give-back direction (or GEX justifies folding **ahead**, as
a named tape event):

- Append a **Fold suggested** post. Process facts: `H`, `U`, `giveback`, `guide_level`, **`fold_clause`**, `p × headroom`, `at_risk`, `g`, **`move_unit`**,
  **`profit_at_risk`**, spot, time ET, debit, `risk_taken`, `exit_side`, `working_side`, clock `mode`,
  and which line was threatened (`proposed` | `legacy`).
- Holder: **Fold suggested** · **`Recorded · demo`** remains the Demo subtitle when `mode` is
  `demo_whatif` or `demo_timemachine`.
- **Position is not closed.**
- HUD **freezes and stays visible** (E3).
- Member may **override** → back to **Managing** (guide stays live), payload stamps `overridden: true`.
- Member may Idle the alert. Reset to Live starts a **new** Armed (no fill) or In trade (fill remains)
  — clears high-water.

**E20 — override suppresses re-fire.** After an override, Fold suggested is **suppressed until the
guide is re-entered** — that is, until open profit returns above `guide_level` (or spot returns to the
hold side of `x_S`) for at least `LABS_ALGO_REENTRY_BARS` consecutive evaluations (default 3). Without
this, overriding while spot is still beyond the guide re-fires the suggestion on the next tick and the
member is in a loop at the exact moment they need to think. The suppression is **named in the HUD**
(`guide: overridden`) so it is never a silent mute. **AT-ALGO-29.**

v1 "eval stops on Recorded" is **reshaped** by §0.2 output stance (advisory, never an automatic exit).

> `move_unit` is in the payload because it is the input a post-mortem most wants and the one that
> cannot be reconstructed after the fact.

---

## 12. Evaluation until Manager

Client adapter evaluates this class. **Live ticks.** Demo is a clock. Once Manager GO's, Analyzer
subscribes; it does not keep a second bus.

| Must | |
|------|--|
| Raw mark | Underlier for `x_H`, threaten, fold. |
| OPF package | `U`, `D`, `E`, Δ, Γ. |
| Realized move | Short window on the **same** underlier plane (Arch 28 / TM tape). Not expected move. |
| GEX | Analyzer GEX profile already on the pane, **normalized to its recent distribution**. |
| Idle | No heavy resolve. |
| One WS | Arch 28. |

**GEX unavailable (E5) — one behaviour, not two:**

When GEX is not on the pane, **or the normalization window holds fewer than
`LABS_ALGO_GEX_NORM_MIN_SAMPLES` samples**, the proposed line computes with `gamma_factor = 1.0` —
i.e. **`p` is unmodulated by dealer gamma** — the proximity and extrinsic factors still apply, and the
state is **named in chrome and in the tape** as `gex: unavailable · p unmodulated`. The line still
paints and **clause A is still evaluated**. It does **not** silently fall back to legacy, and legacy
does not silently become the guide.

Empty history at the open is the **normal** state for roughly the first 30–40 minutes of RTH, not an
error. It is named, not warned about — **and the naming persists for as long as the state does (E22)**,
not as a one-shot toast. A member who opens the Analyzer at 09:35 every morning and sees a proposed
line with no GEX modulation, with nothing on screen saying so, will conclude the feature is broken or
that GEX is being ignored. The chrome reads `gex: warming (n/30 samples)` until the window fills, then
switches to the live percentile. Same discipline as an unattributed SVP reading.

> **E5.** v2.0 said "uses `k` without the gamma factor (named), **or** falls back to legacy" — `k` on
> the risk side, before E29 moved these factors to `p`; the behaviour is unchanged, the term is not. Two
> implementers would each pick one and both would be inside the spec, and a member switching machines
> would see two different guides from the same book. One behaviour, named.

---

## 13. Language (Tango + Hotel sit beside Coach)

**Coach (§0.1.8 / strategy parent) is the job:** keep them in so long as they do not lose more than
they should; most clip small, some bank it; do not cut off the top band.

**Tango (labeled):** Labs chrome, titles, notifications, HUD, and the tape speak **process** (armed, in
trade, managing, high-water, guide, threaten, fold suggested, decay). They do **not** promise P&L,
Sharpe, "maximize profit," or "bank it." HUD **Profit** is current gain telemetry. HUD **Stop** is the
guide print. Coach's "potential profit" is the *subject of Reason inference*, not a Labs headline.

**Hotel:** Δ, Γ, debit, GEX, VP, Heatmap lines are **measurements on the OPF-held plane**. Do not
invent a greek, a wall, a VP node, or a heatmap cell. Wrong structure here is **severity: high**.

**Victor / Whiskey (opinion, not a block):** the guide is via negativa on give-back, not a forecast of
the right tail. The right tail is allowed by **staying in**.

---

## 14. Validation (Coach Part V)

1. Across volatility regimes — low, mid, high — **separately**, not pooled.
2. Across the full outcome distribution.
3. **Primary criterion:** whether the proposed line would have folded trades bound for the **top return
   band**. A line that improves average retention while cutting off that tail is a **worse** line.
4. Compare against the **legacy linear taper** on the same trades.
5. Fit **`p`** — `P_BASE` constant versus regime-dependent — and report whether the fitted factor ranges reach the
   clamp (E2).
6. **Report the two clauses separately (E32).** What fraction of folds came from **A** and what
   fraction from **B**, per volatility regime, and what criterion 3 says about each. They are
   different mechanisms and a pooled number would hide the case where one of them is doing all the
   damage — or nothing at all. A clause that never fires in the sample is a **finding**: either the
   model does not need it, or the fixture set does not reach it.

Do not ship the proposed line as the only guide until this bar has evidence. Until then: **both lines**,
proposed marked *proposed*. Passing this section is the **only** thing that promotes the word (E8).

---

## 15. Ideas inventory

| Idea | Seat |
|------|------|
| Advisory guide, never an automatic exit | **IN-SCOPE** · §0.2 stance |
| Armed (no fill) → In trade → Managing | **IN-SCOPE** · §4 |
| VP bounce arming; GEX not an entry filter | **IN-SCOPE** |
| Mechanical trigger = "bounce confirming" | **OPEN** · §5.2, retirement condition E9 |
| No stops; debit bounds loss | **IN-SCOPE** |
| Rearm + reposition; width unchanged; convexity-band flag | **IN-SCOPE** · **AT-ALGO-20** |
| Gate at 75% of `risk_taken`, defined per side | **IN-SCOPE** · §9.1 · **E4** |
| GEX modulates hold/fold — via **`p`**, on the reward side | **IN-SCOPE** · **E29** |
| Fold signals / apex as risk location | **IN-SCOPE** |
| Legacy % schedule as fallback + teaching second line | **IN-SCOPE** |
| `PaR` as adverse-move loss, the right-hand side of the inequality | **IN-SCOPE** · **E1** |
| Hold-or-fold: clause **A** regime `p × headroom ≤ at_risk`, clause **B** level `giveback ≥ p × headroom`, fold on **A or B** | **IN-SCOPE** · **proposed, unvalidated** · **E25 · E32** |
| `H − k × PaR` as the guide | **RETIRED at v2.3** · E25 · AT-ALGO-38 |
| `k` 1.5 × gamma × proximity, clamp defensive | **RETIRED at v2.3** · E29 · the factor **ranges** survive on `p` · **E2** clamp discipline carries over |
| `p` constant vs regime | **OPEN** · OD-ALGO-7 (OD-ALGO-2 retired with `k`) |
| Six-vendor GEX comparison | **OPEN** |
| Batman both-sides + free-wing alert | **IN-SCOPE** · **AT-ALGO-21** |
| Reason / TF / ALGO-N1 / HUD | **IN-SCOPE** · HUD freezes on fold (**E3**) |
| Two Reason boxes, AI hold/fold of alert state | **SUPERSEDED** · DL-484 / DL-510 |
| Live eval (Demo is a clock) | **IN-SCOPE** · as-built Demo-only is a **gap** |
| Analyzer VP **overlay** | **FLAGGED** · FI-031 |
| Unconstrained LLM session-note | **FLAGGED** · FI-032 |
| BWB / condor / vertical as this algo | **DEFERRED** |
| Broker / Tradier flatten | **OUT** |

---

## 16. Out of scope

- Broker / Tradier / paper flatten.
- Expected move as a trail input.
- Heatmap / Surface / VP **page** drawing these lines.
- Naming the bounce trigger from theory.
- Shipping proposed-only (hiding the legacy line) before §14 evidence.
- Labs-wide Manager HTTP schema freeze.
- Guessing a Batman working side when it is ambiguous.
- **Encoding the bounce trigger as a Heatmap cell, a LIM quadrant position, a Strike Turnover reading,
  or any other sibling surface (E14).** Analyzer VP overlay is FI-031, so the arming story has no home
  in this app yet. That absence is named and waits for §5.2 — it does not get filled by borrowing a
  surface that measures something else.
- Fusing LIM, Strike Turnover or SVP into `p`. The GEX input is the Analyzer's own profile, normalized
  per §9.4.2, and nothing else.
- A model-generated hold or fold recommendation in the Feed (§10.1).

---

## 17. Acceptance

v1 ATs that still hold keep their numbers. State names map through §4.

| AT | Criterion |
|----|-----------|
| **AT-ALGO-1** | Eligible OTM debit fly (or Armed planned setup) → **+** pulses. |
| **AT-ALGO-2** | **+** while eligible → Type **Algo**, knobs only, Save on when debit is named. |
| **AT-ALGO-3** | **+** with no eligible card → Price / Spot. Type → Algo with empty list → Save off. |
| **AT-ALGO-4** | Defaults: entry 75, trail start 75, floor 25, overlay off. Knobs are law. |
| **AT-ALGO-5** | **In trade:** no high-water / trail / HUD. `U ≥` gate → **Managing**. |
| **AT-ALGO-5b** | Batman: gate evaluates **per side against that side's own debit** (E4). Two $500 flies, $600 open on the working side → **Managing** on that side. |
| **AT-ALGO-5c** | Batman with spot between bodies and equal open profit → `working_side: ambiguous`, **no guide on either side**, named. |
| **AT-ALGO-6** | Managing: `H` ratchets. **Legacy** `S = (1−g)×H`; `g` monotone (ALGO-A1). **Guide** `guide_raw = H − (p × headroom)`, floored per E23, when Δ/Γ/move/`p` are representable. **Clause A is evaluated whether or not the level is paintable.** No `k` anywhere in the path **(E25 · E29 · E32)**. |
| **AT-ALGO-6b** | **Apex fixture** (Δ≈0, Γ strongly negative): `profit_at_risk > 0` and `guide_level < H`. Across the whole fixture set: `PaR ≥ 0` always, and `guide_level ≤ H` always — **strict except where `headroom = 0`**, which is fixture 26 **(E1 · E32 · AT-ALGO-44)**. |
| **AT-ALGO-6c** | **`p` achievable range** is `P_BASE × [0.7,1.3] × [0.8,1.2] × [0.8,1.2]` = `[0.35×0.448, 0.35×1.872]` = `[0.157, 0.655]` at defaults, strictly inside `[P_MIN, P_MAX] = [0.05, 0.95]`; at least one fixture produces a **strictly interior** `p` ≠ `P_BASE`. **Both clamps are asserted defensive, not exercised** — a clamp that cannot fire is documented as such, never presented as a working bound **(E2 · E29)**. |
| **AT-ALGO-7** | Thin dashed verticals, member colors. Overlay optional. Pulse 20/25 (ALGO-A2). |
| **AT-ALGO-8** | Guide exited → **Fold suggested**. Position **not** closed. Member may override → Managing, payload stamps `overridden`. |
| **AT-ALGO-9** | ALGO-N1: no narrative paragraph on Type → Algo. |
| **AT-ALGO-R1…R8** | One Reason; TF `algo-reason`; house base on `/app/alerts`; Reason does not drive the engine. |
| **AT-ALGO-10** | Unpriceable debit / greeks / invert → named state, **no line painted**, no invented mark. |
| **AT-ALGO-11** | `upsertAlert` `alert_class: algo`, `trigger.family: algo`. |
| **AT-ALGO-12** | Idle / Keep-Warm: no 1s heavy resolve. Pan/handles unaffected. |
| **AT-ALGO-13** | ATM / credit / non-fly: not eligible. |
| **AT-ALGO-14** | Reset Fold suggested → Live starts Armed (no fill) or In trade (fill remains); clears high-water. |
| **AT-ALGO-15** | HI tokens, 44pt, floatable Builder. |
| **AT-ALGO-16** | Managing, spot crosses **body** → `side=far`, re-invert, tape names the side. |
| **AT-ALGO-17** | HUD **High · Profit · Given back · Trail · &lt;guide row&gt;** while **Managing**, and **frozen and still visible** in **Fold suggested**. Hidden in Armed / In trade / Idle **(E3)**. The fourth row's label is whatever **OD-ALGO-1** disposes — **Guide** by default, **Stop** if Coach overrides. The payload key is `guide_print` either way, so this AT is stable under either disposition **(E13 · E22)**. |
| **AT-ALGO-18** | **Live** Algo ticks without Demo. Demo is a clock. Non-demo no-op is a **fail**. |
| **AT-ALGO-19** | **Source grep** of the modules that compute `at_risk` — `algoProfitAtRisk.ts` and the `move_unit` estimator: zero occurrences of expected-move identifiers (`expectedMove`, `expected_move`, `EM`). **Scoped to the risk side** — the `p` module is exempt by path, where an implied quantity is the point **(E7 · E36)**. |
| **AT-ALGO-20** | Rearm: width unchanged; flag if debit outside the configured convexity band. Flag is advisory — Save is not blocked. |
| **AT-ALGO-21** | Batman: far-side shorts under the configured threshold named. No order. |
| **AT-ALGO-22** | Managing paints **proposed and legacy** lines together when both are representable; the proposed line is labelled *proposed*. |
| **AT-ALGO-23** | **Source grep**: zero occurrences of the retired `S = f × H` form in the trail module. |
| **AT-ALGO-24** | GEX unavailable → `gamma_factor = 1.0`, proposed line **still paints**, chrome and tape name `gex: unavailable · p unmodulated`. No silent fallback to legacy **(E5 · E29)**. |
| **AT-ALGO-25** | `E(t)` null → legacy `g` is clock-only and chrome reads `floor: legacy (clock-only)` **(E6)**. |
| **AT-ALGO-26** | Any Appendix A key absent → module load aborts, naming the key. No silent default. |
| **AT-ALGO-6d** | **Dimensional check** on Appendix B fixture 1: Δ in $/pt, Γ in $/pt², `move_unit` in pts, `PaR` and `guide_level` in $. A per-share greek reaching `algoProfitAtRisk` is a **named state**, not a silent 100× scaling **(E10)**. |
| **AT-ALGO-6e** | `move_unit` with fewer than `MOVE_MIN_SAMPLES` bars → proposed line **WAITING, not painted**; legacy paints. No default, no prior window, no implied vol **(E11)**. |
| **AT-ALGO-27** | **Grep** of rendered member strings, the house base prompt and Feed post templates: zero occurrences of *wall*, *flip*, *pin*, *magnet*, *support*, *resistance* as level language. §0.2 memo text exempt by path **(E12)**. |
| **AT-ALGO-28** | **Grep** of `algoProfitAtRisk.ts`: zero session-clock identifiers. Time remaining reaches only the legacy floor **(E21)**. |
| **AT-ALGO-29** | Override while spot is still beyond the guide → Fold suggested **does not re-fire** until re-entry holds `REENTRY_BARS` evaluations. HUD reads `guide: overridden`. No silent mute **(E20)**. |
| **AT-ALGO-30** | Batman side switch → `H` **resets** to the new side's open profit; `h_prior_side` in the payload; switch is a named tape event **(E19)**. |
| **AT-ALGO-31** | `prefers-reduced-motion: reduce` → **no pulse at all**. Overlay density still conveys threat **(E15)**. |
| **AT-ALGO-32** | Feed model receives only §10.1 allowlist fields; no recommendation, target or probability in any post **(E16)**. |
| **AT-ALGO-35** | **Accumulated** guide movement passes `LOOSEN_NARRATE_PCT × H` → cause is **named** per §9.4.3's asymmetric rule, on the canvas and in the Feed, with the HUD direction marker. A silent guide move is a **defect** **(E28 · E34)**. |
| **AT-ALGO-36** | `p` never rendered as a percentage or a likelihood on any member surface. Grep for "%", "chance", "probability" in guide-adjacent copy **(E29 · §13)**. |
| **AT-ALGO-37** | **Fixtures 20 and 21**: one fly, one `H`, one `U`, one spot, one set of greeks, differing **only in `p`** → **opposite verdicts**. Same verdict is a finding against the model, not a golden to adjust **(E25)**. |
| **AT-ALGO-38** | Grep for `ALGO_K_` → zero. `k` no longer exists as a risk multiplier **(E29)**. |
| **AT-ALGO-39** | The guide is **not** ratcheted: a sequence where `p` rises produces a guide that widens. The legacy line over the same sequence does **not** widen — ALGO-A1 still holds there **(E27)**. |
| **AT-ALGO-40** | `headroom` computed from `H`, not `U`: two fixtures with identical `U` and different `H` produce different guides **(E26)**. |
| **AT-ALGO-41** | HUD shows **Given back** = `H − U`, and it is present in the frozen Fold-suggested HUD **(E31 · E3)**. |
| **AT-ALGO-T1a** | While `LABS_ALGO_TRIGGER_FORMULA_ID = manual_confirm`, the manual confirm is the **only** Armed → In trade path. A second path is a defect **(E9)**. |
| **AT-ALGO-T1b** | *(note, not a test)* The trigger formula is unnamed; characterization comes from observed entries per §5.2. |
| **AT-ALGO-6f** | **Both sides of clause A carry the same unit** on fixture 20: `p × headroom` in package dollars, `at_risk` in package dollars, `p` dimensionless. A `p` that acquires a unit is a defect **(E10 · E32)**. |
| **AT-ALGO-42** | **Clause A fires alone.** Fixture 20: `p × headroom ≤ at_risk` while `U` is **above** `guide_level`. Fold suggested fires, payload `fold_clause: "regime"`. A build in which fold requires `U ≤ guide_level` fails here **(E32)**. |
| **AT-ALGO-43** | **Clause B fires alone.** Fixture 21b: `U ≤ guide_level` while `p × headroom > at_risk`. Fold suggested fires, payload `fold_clause: "guide"`. Every Fold suggested carries a `fold_clause`; absent → defect **(E32)**. |
| **AT-ALGO-44** | **`headroom = 0` equality.** Fixture 26 (`H ≥ ceiling`): `guide_raw = H` exactly and both clauses fire; `fold_clause: "regime"`, `fold_clause_both: true`. The suite asserts `guide_level ≤ H`, **not** strict `<`. A strict assertion fails a correct outcome **(E32)**. |
| **AT-ALGO-45** | **Wick peak.** Fixture 25: `H` set by a single print through the body. The guide is computed off it (tighter, conservative — correct), and a **grep of every rendered string and Feed template for that state** finds no *available*, *reachable*, *should get there* claim. `H` licenses no forecast **(E35 · §13)**. |
| **AT-ALGO-46** | **Accumulate, then name.** Ten consecutive ticks each moving the guide by `LOOSEN_NARRATE_PCT/5 × H` in one direction → **exactly one** narration, fired on the tick where accumulated movement crosses the threshold. Zero narrations is the per-tick bug and is a **fail** **(E34)**. |
| **AT-ALGO-47** | **Cause survives the model.** With the Feed model unreachable, the Reason box disabled and the overlay off, a threshold guide move still produces the **canvas marker** and the arithmetic term name. Hover is not required to read the cause — asserted on a touch viewport with no pointer events **(E34)**. |
| **AT-ALGO-48** | **Asymmetric hysteresis.** A tightening past the threshold narrates on the **same tick**. A widening past the threshold that reverts before `LOOSEN_CONFIRM_BARS` narrates **never**, and `accum` resets. A widening that holds the window narrates on the confirming tick. `guide_level` itself is live every tick in all three cases **(E34)**. |
| **AT-ALGO-19b** | **Source grep** of the `p` module: zero imports of Archive Lab's σ_T module or any session-vol estimator maintained outside this spec. The reward side reads package extrinsic **(E30 · E36)**. |
| **AT-ALGO-33** | Fixture 17: remaining ≤ `FLOOR_REMAINING_H`, `guide_raw < floor`, `guide_level = floor`, legacy `S(t)` also recorded. A morning counterfactual (remaining > window) leaves `guide_raw` unfloored **(E23)**. |
| **AT-ALGO-34** | Fixture 18: spot at body, Δ ≠ 0, `PaR_up ≠ PaR_down`, `PaR = max(PaR_up, PaR_down)` **(E24)**. |

---

## 18. Files (when BUILD)

| Path | Role |
|------|------|
| This spec | Law |
| `AlertBuilderDialog.tsx` | Algo type; one Reason; legacy knobs; no two-stop Reasons |
| `AnalyzerControlsColumn` **+** | Pulse when eligible / Armed |
| `HostPnLChart.tsx` | High-water, proposed guide, legacy taper, overlay, HUD (freeze on fold) |
| `web/lib/options-lab/algoConfig.ts` | **New** — Appendix A keys, fail loud |
| `web/lib/options-lab/algoTrailMath.ts` | Gate, `risk_taken`, legacy `S`, invert, threaten |
| `web/lib/options-lab/algoProfitAtRisk.ts` | **New** — adverse direction, `PaR` only. **No combination step, no `k`** (E29). Risk side; AT-ALGO-19 greps here |
| `web/lib/options-lab/algoProbability.ts` | **New** — `p`, its three factors and clamp. Reward side; AT-ALGO-19 **exempt**, AT-ALGO-19b applies (E36) |
| `web/lib/options-lab/algoHoldFold.ts` | **New** — `ceiling`, `headroom`, `giveback`, clause A, clause B, `guide_raw`, floor, `fold_clause` (E32) |
| `web/lib/options-lab/algoNarrate.ts` | **New** — `accum`, threshold, dominant-term arithmetic, asymmetric confirm window. **No model call** (E34) |
| `web/lib/options-lab/algoEval.ts` | **Live and Demo** tick; Demo is not an eval gate |
| `web/lib/options-lab/algoMoveUnit.ts` | **New** — realized-move estimator, min-samples state |
| `web/lib/options-lab/algoGexNorm.ts` | **New** — percentile normalization, empty-history state |
| Trader Feed host `algo-reason` | ALGO-R1 |
| `analyzerAlertsAdapter.ts` | `trigger.family: "algo"` |

**E17 — live eval is a phase, not a row.** As-built is Demo-only (§3), so **AT-ALGO-18 fails today**
and will keep failing unless a phase owns it. The build plan carries **a dedicated phase whose gate is
AT-ALGO-18 alone**: `tickAlgoAlert` evaluates on the live raw mark with `algo.demo === false`, proven
with a live-session transcript. Any plan that lists `algoEval.ts` as a file touched by another phase
has not owned it.

Do **not** start this packet until Coach marks this spec **BUILD AUTHORITY**. **v2.3.1 BUILD AUTHORITY
waits on exactly four things:**

1. Fixtures **19–26** (including **21b**) exist as hand-written numbers, with **20 / 21 / 21b** built
   on one fly per §Appendix B, and **26** recorded so AT-ALGO-44 has a row.
2. Fixtures **1–8, 17, 18** have their guide value re-recorded under `guide_raw = H − (p × headroom)`,
   and fixtures **5 / 6 / 7** recast onto `p` (they were `k` rows).
3. **OD-ALGO-1** disposed by Coach (HUD fourth-row label).
4. Coach re-stamps. The AZALGO-W0 GO of 2026-09-03 predates the model change and does not carry
   forward.

Fixtures 1–18 are on disk against the **frozen v2.2.1 model** (sha1 `6f491ee8…`) and remain valid as
**inputs**. Their guide values are not v2.3.1 goldens and must not be reused as such.

---

## Appendix A — configuration (Invariant 2, fail loud)

Every key required. Missing or invalid **aborts module load**, naming the key (**AT-ALGO-26**). No
silent defaults, no fallback loading. This appendix is the **only** place key names are defined; no
packet, seed, plan or test may introduce a key that is not here.

| Environment key | In-code constant | v1 value |
|---|---|---|
| `LABS_ALGO_ENTRY_PCT` | `ALGO_ENTRY_PCT` | 75 |
| `LABS_ALGO_TRAIL_START_PCT` | `ALGO_TRAIL_START_PCT` | 75 |
| `LABS_ALGO_TRAIL_END_PCT` | `ALGO_TRAIL_END_PCT` | 25 |
| `LABS_ALGO_MOVE_WINDOW_MIN` | `ALGO_MOVE_WINDOW_MIN` | 20 (band 15–30) |
| `LABS_ALGO_GAMMA_FACTOR_MIN` / `_MAX` | `ALGO_GAMMA_FACTOR_MIN` / `_MAX` | 0.7 / 1.3 |
| `LABS_ALGO_PROXIMITY_FACTOR_MIN` / `_MAX` | `ALGO_PROXIMITY_FACTOR_MIN` / `_MAX` | 0.8 / 1.2 |
| `LABS_ALGO_CONVEXITY_MIN_PCT` / `_MAX_PCT` | `ALGO_CONVEXITY_MIN_PCT` / `_MAX_PCT` | 5 / 10 |
| `LABS_ALGO_FREEWING_CENTS` | `ALGO_FREEWING_CENTS` | 10 |
| `LABS_ALGO_PULSE_ON_PCT` / `_OFF_PCT` | `ALGO_PULSE_ON_PCT` / `_OFF_PCT` | 20 / 25 |
| `LABS_ALGO_TRIGGER_FORMULA_ID` | `ALGO_TRIGGER_FORMULA_ID` | `manual_confirm` |
| `LABS_ALGO_MOVE_SIGMA` | `ALGO_MOVE_SIGMA` | 1.0 |
| `LABS_ALGO_MOVE_MIN_SAMPLES` | `ALGO_MOVE_MIN_SAMPLES` | 10 |
| `LABS_ALGO_GEX_NORM_WINDOW_MIN` | `ALGO_GEX_NORM_WINDOW_MIN` | 90 |
| `LABS_ALGO_GEX_NORM_MIN_SAMPLES` | `ALGO_GEX_NORM_MIN_SAMPLES` | 30 |
| `LABS_ALGO_REENTRY_BARS` | `ALGO_REENTRY_BARS` | 3 |
| `LABS_ALGO_P_BASE` | `ALGO_P_BASE` | **0.35** — fitted at §14.5, not a finding |
| `LABS_ALGO_P_MIN` / `_MAX` | `ALGO_P_MIN` / `_MAX` | 0.05 / 0.95 (defensive — achievable range is `[0.157, 0.655]`, AT-ALGO-6c) |
| `LABS_ALGO_EXTRINSIC_FACTOR_MIN` / `_MAX` | `ALGO_EXTRINSIC_FACTOR_MIN` / `_MAX` | 0.8 / 1.2 |
| `LABS_ALGO_LOOSEN_NARRATE_PCT` | `ALGO_LOOSEN_NARRATE_PCT` | 2.0 (% of `H`, on **accumulated** movement — E34) |
| `LABS_ALGO_LOOSEN_CONFIRM_BARS` | `ALGO_LOOSEN_CONFIRM_BARS` | **3** — evaluations a **widening** must hold before it is narrated. Tightening does not use it (E34) |
| `LABS_ALGO_FLOOR_REMAINING_H` | `ALGO_FLOOR_REMAINING_H` | 1.0 (E23; floor binds at/under this remaining hours) |

**Retired at v2.3:** `LABS_ALGO_K_BASE`, `_K_CLAMP_MIN`, `_K_CLAMP_MAX`. `k` no longer exists as a
risk multiplier (E29); its factors moved to `p`. `GAMMA_FACTOR_*` and `PROXIMITY_FACTOR_*` are
retained and now modify `p`. **AT-ALGO-38** greps for `ALGO_K_` and expects zero. The three retired
rows are **struck from the table above at v2.3.1** — a retired key left in the required list makes
AT-ALGO-26 abort boot on a key nothing reads.

**`LABS_ALGO_LOOSEN_CONFIRM_BARS` is not `LABS_ALGO_REENTRY_BARS`.** They happen to share a default
of 3 and mean different things: re-entry is how long a member's override suppresses a re-fire (E20);
confirm is how long a widening must hold before it is narrated (E34). Collapsing them would couple a
trust affordance to a narration cadence, and the next change to either would silently move the other.

If the bundler requires a public prefix, the values are read through **literal**
`process.env.NEXT_PUBLIC_<key>` member expressions, one per key. A computed lookup
(`env[prefix + key]`) is **not inlined** by Next.js and yields undefined in the browser while passing
in Node — that failure mode has already cost this codebase a shipped-but-dead feature.

**Change control:** any change to the gate, the factor ranges, the clamp, the move window, or the
convexity band is a **breaking change** to every guide a member has seen. Version it and record old
versus new.

---

## Appendix B — goldens (hand-computed, before code)

Recorded by hand **before** `algoProfitAtRisk.ts` exists. A golden computed by the implementation
tests nothing.

**Hotel constructs the inputs; the spec constrains the outputs.** Choosing representative strikes,
spot, greeks and a `move_unit` for each row is fixture design and is Hotel's to do. Inventing an
output to make a row look right is not. Where a row cannot be constructed from this spec as written,
that is a **finding against the spec** — raise it and stop; do not adjust a number to fit.

**Fixtures 2 and 3 are the same butterfly at two different spots** — apex (spot at the body) and wing
(spot away from the body). E1's whole claim is that profit-at-risk is larger at the apex *for the same
position*; comparing two different flies proves nothing. Record both from one set of strikes.

---

### v2.3 — what the model change does to this set

**Fixtures 1–18 stay valid for their inputs and are invalidated for `guide_level`.** `PaR`,
`move_unit`, `m_adv`, the factor arithmetic, the Batman rows and the `E(t)`-null row all survive
unchanged — they were never functions of the combination step. Every guide value was computed
as `H − k × PaR` and that formula is gone (E25).

Hotel re-records the guide on rows 1–8, 17 and 18 under `guide_raw = H − (p × headroom)`, and adds
**eight new rows** that the old model had no way to express:

| # | Fixture | Must record by hand |
|---|---|---|
| **19** | Same fly, `H` at 80% of ceiling vs `H` at 30% of ceiling, everything else equal | `ceiling`, both `H`, both `headroom`, both `guide_raw`. The 30% case holds longer. Proves E26 — `H` not `U` |
| **20** | **Clause A alone — regime fold with the level still safe.** See the construction below | `p·headroom`, `at_risk`, `giveback`, `guide_raw`, and the two comparisons written out. Verdict **FOLD**, `fold_clause: "regime"` (E32 · AT-ALGO-42) |
| **21** | **Same inputs as 20, `p` higher.** Nothing else differs — not spot, not `H`, not `U`, not the greeks | same five quantities. Verdict **HOLD**, both clauses false (E25 · AT-ALGO-37) |
| **21b** | **Clause B alone — level fold with the regime still fine.** See the construction below | same five quantities. Verdict **FOLD**, `fold_clause: "guide"` (E32 · AT-ALGO-43) |
| **22** | **Accumulated drift**, ten ticks each moving the guide by `LOOSEN_NARRATE_PCT/5 × H` in one direction, then a reverting widening inside `LOOSEN_CONFIRM_BARS` | per-tick `guide_level`, running `accum`, the tick on which narration fires (**exactly one**), the dominant term at that tick, and the reverting widening that narrates **never** (E34 · AT-ALGO-46 · AT-ALGO-48) |
| **23** | `H` advances mid-session | `headroom` shrinks, `giveback` resets to 0, guide tightens — all three from one event, each shown |
| **24** | `E(t)` null | `extrinsic_factor = 1.0`, named `p: extrinsic unavailable`, guide still paints (E30) |
| **25** | **Wick peak.** `H` set by a single print through the body; spot returns immediately; `H` does not retreat | `H`, `headroom` off that `H`, `guide_raw`. Guide is **tighter** than the same fly with a `H` set by a sustained move — the conservative direction. **No rendered string claims the move is available or reachable** (E35 · AT-ALGO-45) |
| **26** | **`headroom = 0`.** `H ≥ ceiling` — the package held to its arithmetic maximum | `ceiling`, `H`, `headroom = 0`, `guide_raw = H` **exactly**, clause A `0 ≤ at_risk` **true**. Verdict **FOLD**, `fold_clause: "regime"`, `fold_clause_both: true`. This row is why AT-ALGO-6b asserts `≤`, not `<` (E32 · AT-ALGO-44) |

#### The three verdict fixtures — 20, 21, 21b (E32)

These are the rows that prove the two clauses are independent. **All three share one fly, one set of
strikes, one debit, one `H`, one `U`, one spot and one set of greeks.** The only quantity that varies
across 20 and 21 is `p`; 21b varies `U` (and therefore `giveback`) and the greeks' contribution to
`at_risk`. Hotel constructs the numbers; the spec constrains the relations:

| Row | Required relation | What it proves |
|---|---|---|
| **20** | `giveback < p·headroom ≤ at_risk` | Clause A fires while clause B does not. `U` sits **above** `guide_level` — the line looks safe — and the trade folds anyway. A build that gates fold on `U ≤ guide_level` **fails here**, which is the point |
| **21** | `giveback < p·headroom` **and** `p·headroom > at_risk` | Neither clause fires. Identical to 20 in every input but `p` |
| **21b** | `at_risk < p·headroom ≤ giveback` | Clause B fires while clause A does not. The budget is spent though the regime is fine. A build that gates fold on the boolean **fails here** |

**Construction note for Hotel.** Row 20 wants a **small** `giveback` and a **large** `at_risk` — sit
near the peak, near the apex, where `Γ` is most negative (E1). Row 21b wants the reverse: a **large**
`giveback` and a **small** `at_risk` — well off the peak, out on a wing. Both are ordinary positions,
not contrived edges; if either cannot be constructed from this spec as written, that is a **finding
against the spec** (§Appendix B preamble) — raise it and stop.

**If 20 and 21 produce the same verdict**, the model is not doing what Coach described, and that is a
finding, not a golden to adjust. **If 20 or 21b cannot be made to fire on one clause alone**, the two
clauses are not independent and E32 is wrong — raise that too.

| # | Fixture | Must record by hand |
|---|---|---|
| 1 | Call fly, spot below body, ordinary Δ/Γ | **Every quantity with its unit written out** — Δ $/pt, Γ $/pt², `move_unit` pts, `m_adv` pts, `pnl_change_adv` $, `PaR` $, `p` dimensionless, `headroom` $, `guide_level` $, `H` $. The arithmetic shown line by line. This fixture is the dimensional proof (AT-ALGO-6d · AT-ALGO-6f) |
| 2 | **Apex** — Δ ≈ 0, Γ strongly negative | `PaR > 0`, `guide_level < H`, and `PaR` **strictly larger than fixture 3** |
| 3 | **Wing** — same fly as fixture 2, spot away from the body, Γ positive | `PaR > 0`; the comparison partner for fixture 2 |
| 4 | Put fly mirrored | same, adverse direction inverted |
| 5 | Strongly positive dealer gamma | `p` at/near its **upper achievable** 0.655 — well inside `P_MAX`; clamp not exercised (E29) |
| 6 | Strongly negative dealer gamma, thin path | `p` at/near its **lower achievable** 0.157 — well inside `P_MIN`; clamp not exercised |
| 7 | Interior `p` | `p` strictly between the achievable bounds and ≠ `P_BASE` (AT-ALGO-6c) |
| 8 | GEX unavailable | `gamma_factor = 1.0`, line still paints, state named |
| 9 | Δ/Γ unmeasured | proposed line **WAITING**, not painted; legacy paints |
| 10 | Batman, working side resolved | gate on that side's debit only |
| 11 | Batman, ambiguous | no guide either side, named |
| 12 | `E(t)` null | legacy clock-only; floor chrome says so |
| 13 | `move_unit` with 6 bars in the window | proposed WAITING, legacy paints |
| 14 | GEX history 12 samples | `gamma_factor = 1.0`, named, line still paints |
| 15 | Batman side switch mid-session | `H` resets; `h_prior_side` recorded |
| 16 | Override while still beyond the guide | no re-fire for `REENTRY_BARS`; HUD `guide: overridden` |
| 17 | **Floor binding** — both lines present; remaining ≤ `FLOOR_REMAINING_H`; `guide_raw` below `floor` so the max binds (**E23**) | `guide_raw`, `floor`, `guide_level`, legacy `S(t)`, remaining hours |
| 18 | **At-body tie-break** — same fly family as 2/3; spot at body; Δ small **non-zero** so up and down PaR differ; **larger** taken (**E24**) | PaR_up, PaR_down, PaR, guide_level |

---

## Appendix C — errata index (E1–E36)

| # | Change |
|---|---|
| **E1** | `profit_at_risk` = adverse-move **loss magnitude**, `≥ 0`; guide below high-water enforced; apex now yields the widest PaR and tightest guide, as Coach intended. AT-ALGO-6b — restated at v2.3.1 as `guide_level ≤ H`, strict except `headroom = 0` (E32). |
| **E2** | Clamp declared **defensive**; achievable range documented; factor ranges to config; interior fixture required. AT-ALGO-6c — carried onto `p` at v2.3 when `k` retired (E29); the achievable range is now `[0.157, 0.655]` inside `[0.05, 0.95]`. |
| **E3** | HUD **freezes and stays visible** on Fold suggested rather than hiding, because that is the moment the member is asked to override. AT-ALGO-17. |
| **E4** | `risk_taken` defined, including Batman per-working-side, with an `ambiguous` state that paints nothing. AT-ALGO-5b / 5c. |
| **E5** | GEX unavailable → one named behaviour: `gamma_factor = 1.0`, line still paints, state named. AT-ALGO-24. |
| **E6** | `E(t)` has never been measured; the legacy floor is named as clock-only when it is. AT-ALGO-25. |
| **E7** | AT-ALGO-19 becomes a source grep; AT-ALGO-T1 split into a testable half (T1a) and a note (T1b). |
| **E8** | The computed line is **proposed**, never "primary", until §14 clears it. |
| **E9** | The manual-confirm stand-in has a three-part retirement condition. AT-ALGO-T1a. |
| **E10** | Dimensional law: `move_unit` in points, Δ/Γ in package dollars per point / point², everything else in package dollars. Per-share greeks are a named state. AT-ALGO-6d (extended to `p`, `headroom`, `guide_level` at v2.3.1 · AT-ALGO-6f). |
| **E11** | `move_unit` estimator and GEX percentile normalization both named, with windows, minimum samples, and empty-history behaviour. AT-ALGO-6e. |
| **E12** | Coach Part II vocabulary is intent, not chrome. Member surfaces and the house prompt use process words. AT-ALGO-27. |
| **E13** | HUD fourth row **Guide**, not Stop. OD-ALGO-1 — Coach disposes. |
| **E14** | Non-goal: the bounce trigger is never encoded on a sibling surface. |
| **E15** | Reduced motion kills the pulse; legacy line muted; overlay and Feed default off. AT-ALGO-31. |
| **E16** | Feed model tool allowlist — measurements only, no recommendation. Closes FI-032. AT-ALGO-32. |
| **E17** | Live eval is a phase with its own gate (§18). |
| **E18** | Editorial note at §0.1: recording is a tape post, not an exit. |
| **E19** | `H` resets on a Batman side switch. AT-ALGO-30. |
| **E20** | Override suppresses re-fire until re-entry. AT-ALGO-29. |
| **E21** | Time remaining reaches only the legacy floor, never `k`. AT-ALGO-28. |
| **E22** | AT-ALGO-17 no longer hardcodes the fourth HUD row's label; it follows OD-ALGO-1 and asserts the stable payload key `guide_print`. Appendix C heading corrected. Empty-GEX chrome made persistent, not one-shot. |
| **E23** | Floor formula: binds only as close approaches; `floor = (1−gMin)×H`; `guide_level = max(guide_raw, floor)` iff active, clause B only. (a) and (b) rejected. Fixture 17. AT-ALGO-33. |
| **E24** | At-body larger-PaR tie-break exercised by fixture 18 (Δ ≠ 0). AT-ALGO-34. |
| **E25** | Model is `hold while p × headroom > at_risk`, evaluated every tick. `H − k × PaR` retired — it computed only the risk half. §9.4.3. AT-ALGO-37. |
| **E26** | `headroom = max(0, ceiling − H)` — the **peak**, not current `U`. `ceiling = width − debit`, hard arithmetic (OD-ALGO-6). AT-ALGO-40. |
| **E27** | The guide **breathes** — recomputed every tick, not ratcheted. ALGO-A1's running minimum stays on the legacy line only. AT-ALGO-39. |
| **E28** | When the guide moves, the surface **names why**. Law, not nicety. §9.4.3, §10.3. AT-ALGO-35. |
| **E29** | `k` retired. `gamma_factor`, `proximity_factor`, `extrinsic_factor` move to `p` on the **reward** side. `PaR` reaches the model unmultiplied. AT-ALGO-38. |
| **E30** | `E(t)` reframed: remaining package extrinsic is the market's own price of expected movement, the closest thing to a quoted `p` — not a decay pacer. Null → `extrinsic_factor = 1.0`, named. AT-ALGO-24 / 25. |
| **E31** | `giveback = H − U` is a first-class field and a HUD row. AT-ALGO-41. |
| **E32** | **Two clauses, not one derivation.** A regime `p × headroom ≤ at_risk`; B level `giveback ≥ p × headroom`. Fold = A **or** B. `fold_clause` in the payload. The indifference-point derivation deleted — the boolean contains no `U`. `headroom = 0` equality case stated; AT-ALGO-6b asserts `≤`, not `<`. AT-ALGO-42 / 43 / 44 / 6f. Fixtures 20 / 21 / 21b / 26. |
| **E33** | E8 posture restored to the header: `p` is a starting constant, both lines paint, §14 alone promotes, §14.5 fits `p` not `k`. |
| **E34** | E28 hardened: **accumulated** movement not per-tick · cause **on the canvas**, not hover, not Feed-dependent · **asymmetric** hysteresis, tightening immediate, widening waits `LOOSEN_CONFIRM_BARS`. New key. AT-ALGO-46 / 47 / 48. Fixture 22. |
| **E35** | E26's "why" says ***achieved***, not *available* — a peak licenses no forecast. Wick fixture 25. AT-ALGO-45. |
| **E36** | Three volatility quantities scoped: `move_unit` realized / risk side · `extrinsic_factor` implied / reward side · Archive Lab `σ_T` / neither. AT-ALGO-19 scoped to the risk side; AT-ALGO-19b forbids the σ_T import. |

---

## 20. Open decisions

| # | Question | Owner | Default if silent |
|---|---|---|---|
| **OD-ALGO-1** | HUD fourth row: **Guide** (E13) or **Stop** (§0.1.11 verbatim)? The product has no stops and the label is an instruction on a chart | **Coach** | **Guide**. Payload key `guide_print` either way |
| **OD-ALGO-2** | ~~`k` constant vs regime-dependent~~ **RETIRED at v2.3** — `k` no longer exists (E29). Superseded by **OD-ALGO-7**, which asks the same question of `p` | — | — |
| **OD-ALGO-3** | Entry trigger formula | **Coach · Hotel** | `manual_confirm` stand-in persists under E9 |
| **OD-ALGO-4** | Six-vendor GEX comparison findings into `gamma_factor` | **Coach** | Percentile normalization as specified |
| **OD-ALGO-5** | Does the Analyzer VP overlay (FI-031) get built so arming has a home in-app | **Juliet** | Out of this spec |
| **OD-ALGO-6** | **`ceiling`: hard arithmetic (`width − debit`) or realistically-reachable given time and distance?** v2.3 ships the hard one — a fact about the strikes, not a view about price. The soft one is a modelling program with its own evidence bar | **Coach** | **Hard arithmetic.** Soft ceiling deferred until after §14 |
| **OD-ALGO-7** | `P_BASE = 0.35` and the three factor ranges | **Coach**, after §14.5 | Starting points, not findings. Fit per volatility regime |
| **OD-ALGO-8** | HUD label for `H − U` — **Given back**, or an alternative. Not "Drawdown", which means something else to a trader | **Tango · Echo** | **Given back** |

---

## 19. Changelog

| Ver | Date | Notes |
|-----|------|--------|
| **v2.3.1** | 2026-09-04 | **Statement errata on v2.3's own model. No formula change.** E32 the guide is **two clauses** — A regime `p × headroom ≤ at_risk`, B level `giveback ≥ p × headroom`, fold on **A or B**, `fold_clause` in the payload; v2.3's "indifference point" derivation **deleted** (the boolean contains no `U`); `headroom = 0` equality stated and AT-ALGO-6b relaxed to `≤` · E33 **E8 posture restored to the header** — `p` is a starting constant, §14 alone promotes · E34 **E28 hardened** — accumulated not per-tick, cause **on canvas** and model-independent, **asymmetric** hysteresis with new key `LOOSEN_CONFIRM_BARS` · E35 E26 says ***achieved***, not *available*; wick fixture 25 · E36 three volatility quantities scoped, AT-ALGO-19 bounded to the risk side, AT-ALGO-19b added. New ATs 6f, 19b, 42–48. New fixtures **21b, 25, 26**; 20/21 respecified on one fly. `algoProbability.ts`, `algoHoldFold.ts`, `algoNarrate.ts` named. Full sweep of `k` / `trail_level` / `proposed_raw` out of live law. OD-ALGO-2 retired with `k`. |
| **v2.3** | 2026-09-03 | **Model change, not errata.** Coach: *"the decreasing trail … represents the risk of staying in the trade for potential future value growth, vs exiting with current value"* and *"hold or fold is evaluated every tick."* E25 the inequality `p × headroom > at_risk` · E26 headroom off the **peak** · E27 the guide breathes, ratchet stays on legacy only · E28 loosening must be narrated · E29 `k` retired, factors move to `p` on the reward side · E30 `E(t)` is the market's own `p` · E31 **Given back** HUD row. Appendix B `trail_level` values invalidated, six new fixtures (19–24); 20/21 are the pair that proves the model. AT-ALGO-35…41. P1–P4 partially rebuild; P5 transcript waits. |
| v2.2.2 | 2026-09-02 | **E23** floor formula (binds as close approaches; (a)/(b) rejected) · **E24** at-body tie-break fixture 18 · fixtures **17–18** · AT-ALGO-33/34 · `LABS_ALGO_FLOOR_REMAINING_H`. Geometry unchanged. E1–E22 not reopened. BUILD still waits on OD-ALGO-1. |
| **v2.2.1** | 2026-09-02 | **Editorial errata (E22). Model frozen.** AT-ALGO-17 no longer hardcodes the fourth HUD row's label — it follows OD-ALGO-1 and asserts the stable payload key, so the AT is correct under either disposition · Appendix C heading E1–E22 · empty-GEX chrome made persistent (`gex: warming n/30`) rather than one-shot. **Nothing else changed.** The next artifact is Appendix B, hand-written. |
| v2.2 | 2026-09-02 | **Product-law draft.** E10 dimensional law (units were unstated; AT-ALGO-6b could pass on garbage) · E11 `move_unit` and GEX-percentile estimators named with windows, min samples and empty-history states · E12 Coach Part II vocabulary is intent not chrome · E13 HUD **Guide** not Stop (OD-ALGO-1) · E14 bounce trigger never encoded on a sibling surface · E15 reduced-motion, muted legacy, overlay/Feed off by default · E16 Feed tool allowlist, closes FI-032 · E17 live eval is its own phase · E18 recording is a tape post not an exit · E19 `H` resets on side switch · E20 override suppresses re-fire · E21 time remaining reaches only the floor. §20 open decisions added. Appendix B grows to 16 fixtures. **BUILD AUTHORITY now requires hand goldens on disk.** |
| v2.1 | 2026-09-02 | **Full spec.** E1 PaR sign correction (v2.0's formula put the guide above high-water at the apex) · E2 unreachable clamp · E3 HUD freezes not hides · E4 `risk_taken` defined incl. Batman · E5 one GEX-unavailable behaviour · E6 `E(t)` never measured, floor named · E7 grep-based ATs · E8 "proposed" not "primary" · E9 stand-in retirement. Appendix A config (fail loud), Appendix B hand goldens, Appendix C errata index. No Coach text deleted. |
| v2.0 | 2026-09-02 | Seats Coach **Arming and Trade Management**. States Armed / In trade / Managing. Advisory guide. GEX as management. Dynamic trail proposed; legacy taper fallback and second teaching line. Rearm + convexity flag. Batman free-wing alert. Live eval is law. **DL-660**. |
| v1.0.16 | 2026-08-21 | See v1.0 spec changelog (HUD Profit through W1–W4). |