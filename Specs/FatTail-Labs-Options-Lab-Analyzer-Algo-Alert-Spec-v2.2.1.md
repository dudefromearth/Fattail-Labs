# FatTail Labs — Options Lab Analyzer Algo Alert Spec v2.2.1

**Status:** **PRODUCT-LAW DRAFT** — Coach 2026-09-02. Arming and trade management is product law for
Analyzer **Algo**. **Not BUILD AUTHORITY** until Appendix B goldens exist as hand-written numbers and
Coach stamps it.
**Current revision:** **v2.2.1** — editorial errata only (**E22**). **The model is frozen.** No
geometry, formula, state, gate, threshold or acceptance criterion changed from v2.2.
**Supersedes:** v2.0 (2026-09-02) as product law — v2.0 is on disk and is marked SUPERSEDED.
**Review iterations v2.1 and v2.2 were never landed in `Specs/`** and do not exist on disk; they are
review artifacts only. This file is the first revision after v2.0 to become repo law, and it carries
every erratum E1–E22 from both of them. Do not look for v2.1 or v2.2 in the tree.
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

## v2.2 errata (E10–E21) — dimensional law, estimators, and chrome

E10–E18 come from review of v2.1. E19–E21 are additional findings. **No Coach text was deleted.**

| # | Change | Why |
|---|---|---|
| **E10** | **Dimensional law.** `move_unit` in underlier points; Δ, Γ, `H`, `PaR`, `trail_level` in **package dollars**; adverse sign defined | v2.1 mixed index points and mark dollars. AT-ALGO-6b could pass on a dimensionally meaningless fixture |
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
| Trail proposed | Live **profit-at-risk** + GEX-modulated `k` (proposed, unvalidated) | Give-up % of high-water, 75% → 25% by EoD, paced by premium decay | **Proposed line = §0.2 Part III**, corrected per E1. v1 schedule = **legacy fallback / beginner scaffolding** (§9.5). **Show both lines** (§0.2.17). Neither is called "primary" until §14 (E8). |
| "Stop" | **There are no stops.** Loss bounded by debit. Line is **advisory**, judged and overridden, **never an automatic exit** | HUD row **Stop** = ticker `x_S`; exit **records** and eval stops | HUD **Stop** is the **guide print**, not a broker stop. Crossing it **records a fold suggestion**. It does **not** flatten. Member may **override** and stay **Managing**. |
| GEX | **Management instrument**, not an entry filter | Narrative play-by-play from GEX | **Both.** GEX modulates `k` while Managing; Reason/Trader Feed still speaks GEX when the overlay is on. |
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
| `H`, `U`, `PaR`, `trail_level`, `risk_taken` | **package dollars** | OPF |
| `k` | dimensionless | §9.4.2 |

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

trail_level     = H − k × profit_at_risk                                   [$, enforced < H]
```

**Adverse direction** is resolved from the position, not from the tape's recent sign: for a call fly
above spot, adverse is **down** while spot is below the body and **up** while spot is above it; for a
put fly, mirrored. At the body both directions are adverse and the **larger** resulting `PaR` is taken.

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

**Expected move is rejected.** Realized movement is the unit — that is what lets the trail breathe
early and compress into the afternoon without a clock story. **AT-ALGO-19** greps for it.

### 9.4.2 `k` modulation

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
> **AT-ALGO-6b** asserts `profit_at_risk ≥ 0` and `trail_level < H` on every fixture, including an
> apex fixture. v2.0 asserted neither, so this would have shipped green.

```
k = clamp(k_base × gamma_factor × proximity_factor,
          LABS_ALGO_K_CLAMP_MIN, LABS_ALGO_K_CLAMP_MAX)
```

**Direction — write this comment in the module header so review cannot invert it:**
larger `k` → `H − k·PaR` is **lower** → **more give-up room** (positive dealer gamma, heavy strike
near the center). Smaller `k` → **tighter** (negative dealer gamma, thin path ahead). This matches
§0.2.8 weather exactly.

**`gamma_factor` — the normalization is named (E11).** Net dealer GEX is mapped to
`[GAMMA_FACTOR_MIN, GAMMA_FACTOR_MAX]` by its **percentile within the trailing
`LABS_ALGO_GEX_NORM_WINDOW_MIN` of same-session GEX samples** (default 90 min), linearly:
0th percentile → MIN, 100th → MAX, 50th → 1.0. Fewer than `LABS_ALGO_GEX_NORM_MIN_SAMPLES` samples
(default 30) → **empty history** → `gamma_factor = 1.0` and the state is named exactly as in §12.
Absolute dollars are never used; scale drifts.

**`time remaining` is not an input to `k` (E21).** It enters **only** through the legacy floor below.
v2.1 listed it among the inputs and used it nowhere, which is how it ends up smuggled into a factor.
**AT-ALGO-28** greps `algoProfitAtRisk.ts` for session-clock identifiers.

| Term | Default range | Meaning |
|---|---|---|
| `k_base` | **1.5** | starting point |
| `gamma_factor` | **0.7 … 1.3** | 0.7 strongly negative dealer gamma (tighten) … 1.3 strongly positive (widen) |
| `proximity_factor` | **0.8 … 1.2** | 0.8 thin path ahead (tighten hard) … 1.2 heavy strike near the center (patience) |
| clamp | **[1.0, 2.5]** | **defensive only — see E2** |

> **E2 — the upper clamp cannot fire at the default ranges.**
>
> ```
> min product = 1.5 × 0.7 × 0.8 = 0.84
> max product = 1.5 × 1.3 × 1.2 = 2.34      ← below the 2.5 upper clamp
> ```
>
> So the lower bound is **live** over [0.84, 1.0) and the upper bound is **unreachable**. A test
> asserting `k ≤ 2.5` passes without exercising anything — the same defect family that produced
> unreachable bounds elsewhere in Labs.
>
> Resolution: the clamp is declared **defensive**, its achievable range is documented here, and the
> factor ranges are config so fitting (§14.5) can widen them into the clamp. **AT-ALGO-6c** asserts
> the achievable range explicitly and requires a fixture producing an **interior** `k` — a value
> strictly between the clamp bounds and not equal to `k_base`. Asserting only the endpoints proves
> nothing.

**Floor.** The legacy end-of-session anchor is a **hard floor**; the proposed trail cannot stay wide
into the close.

> **E6.** That floor derives from the legacy taper, whose premium-decay pacing has **never executed**
> — `E(t)` has always been `null` (§3). The floor is retained because an unbounded-wide trail into the
> close is worse than a crude floor, but it is **not** validated, and the chrome that names the floor
> says `floor: legacy (clock-only)` whenever `E(t)` is null. Do not present it as decay-paced when it
> is not.

**Invert to underlier `x_S`:** T+0 invert of the bound card at P&L = `trail_level` as v1 §7.4 (near /
far through the body — ALGO-B1). Missing invert → named state, last paint, P&L backstop
`U < trail_level`. Do not invent `x_S`.

**Δ / Γ unmeasured:** the proposed line is **named WAITING** and does not paint; the legacy line may
still paint. **A missing input is never rendered as a line.** Do not invent greeks.

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
| HUD | Lower-left, just above $0: **High** · **Profit** · **Trail** · **Guide** (guide print `x_S`). Colons aligned. Shown while **Managing** and — **E3** — **frozen and still visible** in **Fold suggested**. Hidden in Armed, In trade, Idle. Telemetry, not a flatten. |

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
| Trail | `g` (legacy), `k` and its two factors, `PaR`, `move_unit`, both `trail_level`s, which line is threatened |
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

testid: `analyzer-algo-narrative` plus `data-trader-feed="algo-reason"`. Do **not** import
`TimeOrthoEggPanel`.

---

## 11. Fold suggestion (was Recorded)

When spot / P&L **exits the guide** in the give-back direction (or GEX justifies folding **ahead**, as
a named tape event):

- Append a **Fold suggested** post. Process facts: `H`, guide value, `g` or `k`, **`move_unit`**,
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
guide is re-entered** — that is, until open profit returns above `trail_level` (or spot returns to the
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
i.e. **`k` is unmodulated by dealer gamma** — the proximity factor still applies, and the state is
**named in chrome and in the tape** as `gex: unavailable · k unmodulated`. The line still paints. It
does **not** silently fall back to legacy, and legacy does not silently become the guide.

Empty history at the open is the **normal** state for roughly the first 30–40 minutes of RTH, not an
error. It is named, not warned about — **and the naming persists for as long as the state does (E22)**,
not as a one-shot toast. A member who opens the Analyzer at 09:35 every morning and sees a proposed
line with no GEX modulation, with nothing on screen saying so, will conclude the feature is broken or
that GEX is being ignored. The chrome reads `gex: warming (n/30 samples)` until the window fills, then
switches to the live percentile. Same discipline as an unattributed SVP reading.

> **E5.** v2.0 said "uses `k` without the gamma factor (named), **or** falls back to legacy." Two
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
5. Fit `k` — constant versus regime-dependent — and report whether the fitted factor ranges reach the
   clamp (E2).

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
| GEX modulates hold/fold and `k` | **IN-SCOPE** |
| Fold signals / apex as risk location | **IN-SCOPE** |
| Legacy % schedule as fallback + teaching second line | **IN-SCOPE** |
| Dynamic trail `H − k × PaR`, PaR as adverse-move loss | **IN-SCOPE** · **proposed, unvalidated** · **E1** |
| `k` 1.5 × gamma × proximity, clamp defensive | **IN-SCOPE** as **starting constants** · **E2** |
| `k` constant vs regime | **OPEN** |
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
- Fusing LIM, Strike Turnover or SVP into `k`. The GEX input is the Analyzer's own profile, normalized
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
| **AT-ALGO-6** | Managing: `H` ratchets. **Legacy** `S = (1−g)×H`; `g` monotone (ALGO-A1). **Proposed** `H − k×PaR` when Δ/Γ/move are representable. |
| **AT-ALGO-6b** | **Apex fixture** (Δ≈0, Γ strongly negative): `profit_at_risk > 0` and `trail_level < H`. Across the whole fixture set: `PaR ≥ 0` always, `trail_level < H` always **(E1)**. |
| **AT-ALGO-6c** | `k` achievable range is `[0.84, 2.34]` at default factor ranges; at least one fixture produces a **strictly interior** `k` ≠ `k_base`. The upper clamp is asserted **defensive**, not exercised **(E2)**. |
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
| **AT-ALGO-17** | HUD **High · Profit · Trail · &lt;guide row&gt;** while **Managing**, and **frozen and still visible** in **Fold suggested**. Hidden in Armed / In trade / Idle **(E3)**. The fourth row's label is whatever **OD-ALGO-1** disposes — **Guide** by default, **Stop** if Coach overrides. The payload key is `guide_print` either way, so this AT is stable under either disposition **(E13 · E22)**. |
| **AT-ALGO-18** | **Live** Algo ticks without Demo. Demo is a clock. Non-demo no-op is a **fail**. |
| **AT-ALGO-19** | **Source grep** of the trail module: zero occurrences of expected-move identifiers (`expectedMove`, `expected_move`, `EM`) **(E7)**. |
| **AT-ALGO-20** | Rearm: width unchanged; flag if debit outside the configured convexity band. Flag is advisory — Save is not blocked. |
| **AT-ALGO-21** | Batman: far-side shorts under the configured threshold named. No order. |
| **AT-ALGO-22** | Managing paints **proposed and legacy** lines together when both are representable; the proposed line is labelled *proposed*. |
| **AT-ALGO-23** | **Source grep**: zero occurrences of the retired `S = f × H` form in the trail module. |
| **AT-ALGO-24** | GEX unavailable → `gamma_factor = 1.0`, proposed line **still paints**, chrome and tape name `gex: unavailable · k unmodulated`. No silent fallback to legacy **(E5)**. |
| **AT-ALGO-25** | `E(t)` null → legacy `g` is clock-only and chrome reads `floor: legacy (clock-only)` **(E6)**. |
| **AT-ALGO-26** | Any Appendix A key absent → module load aborts, naming the key. No silent default. |
| **AT-ALGO-6d** | **Dimensional check** on Appendix B fixture 1: Δ in $/pt, Γ in $/pt², `move_unit` in pts, `PaR` and `trail_level` in $. A per-share greek reaching `algoProfitAtRisk` is a **named state**, not a silent 100× scaling **(E10)**. |
| **AT-ALGO-6e** | `move_unit` with fewer than `MOVE_MIN_SAMPLES` bars → proposed line **WAITING, not painted**; legacy paints. No default, no prior window, no implied vol **(E11)**. |
| **AT-ALGO-27** | **Grep** of rendered member strings, the house base prompt and Feed post templates: zero occurrences of *wall*, *flip*, *pin*, *magnet*, *support*, *resistance* as level language. §0.2 memo text exempt by path **(E12)**. |
| **AT-ALGO-28** | **Grep** of `algoProfitAtRisk.ts`: zero session-clock identifiers. Time remaining reaches only the legacy floor **(E21)**. |
| **AT-ALGO-29** | Override while spot is still beyond the guide → Fold suggested **does not re-fire** until re-entry holds `REENTRY_BARS` evaluations. HUD reads `guide: overridden`. No silent mute **(E20)**. |
| **AT-ALGO-30** | Batman side switch → `H` **resets** to the new side's open profit; `h_prior_side` in the payload; switch is a named tape event **(E19)**. |
| **AT-ALGO-31** | `prefers-reduced-motion: reduce` → **no pulse at all**. Overlay density still conveys threat **(E15)**. |
| **AT-ALGO-32** | Feed model receives only §10.1 allowlist fields; no recommendation, target or probability in any post **(E16)**. |
| **AT-ALGO-T1a** | While `LABS_ALGO_TRIGGER_FORMULA_ID = manual_confirm`, the manual confirm is the **only** Armed → In trade path. A second path is a defect **(E9)**. |
| **AT-ALGO-T1b** | *(note, not a test)* The trigger formula is unnamed; characterization comes from observed entries per §5.2. |

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
| `web/lib/options-lab/algoProfitAtRisk.ts` | **New** — adverse direction, `PaR`, `k`, clamp |
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

Do **not** start this packet until Coach marks this spec **BUILD AUTHORITY**. **BUILD AUTHORITY
requires Appendix B fixtures 1–16 on disk as numbers a human wrote**, fixture 1 carrying its units.

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
| `LABS_ALGO_K_BASE` | `ALGO_K_BASE` | 1.5 |
| `LABS_ALGO_GAMMA_FACTOR_MIN` / `_MAX` | `ALGO_GAMMA_FACTOR_MIN` / `_MAX` | 0.7 / 1.3 |
| `LABS_ALGO_PROXIMITY_FACTOR_MIN` / `_MAX` | `ALGO_PROXIMITY_FACTOR_MIN` / `_MAX` | 0.8 / 1.2 |
| `LABS_ALGO_K_CLAMP_MIN` / `_MAX` | `ALGO_K_CLAMP_MIN` / `_MAX` | 1.0 / 2.5 (defensive) |
| `LABS_ALGO_CONVEXITY_MIN_PCT` / `_MAX_PCT` | `ALGO_CONVEXITY_MIN_PCT` / `_MAX_PCT` | 5 / 10 |
| `LABS_ALGO_FREEWING_CENTS` | `ALGO_FREEWING_CENTS` | 10 |
| `LABS_ALGO_PULSE_ON_PCT` / `_OFF_PCT` | `ALGO_PULSE_ON_PCT` / `_OFF_PCT` | 20 / 25 |
| `LABS_ALGO_TRIGGER_FORMULA_ID` | `ALGO_TRIGGER_FORMULA_ID` | `manual_confirm` |
| `LABS_ALGO_MOVE_SIGMA` | `ALGO_MOVE_SIGMA` | 1.0 |
| `LABS_ALGO_MOVE_MIN_SAMPLES` | `ALGO_MOVE_MIN_SAMPLES` | 10 |
| `LABS_ALGO_GEX_NORM_WINDOW_MIN` | `ALGO_GEX_NORM_WINDOW_MIN` | 90 |
| `LABS_ALGO_GEX_NORM_MIN_SAMPLES` | `ALGO_GEX_NORM_MIN_SAMPLES` | 30 |
| `LABS_ALGO_REENTRY_BARS` | `ALGO_REENTRY_BARS` | 3 |

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

| # | Fixture | Must record by hand |
|---|---|---|
| 1 | Call fly, spot below body, ordinary Δ/Γ | **Every quantity with its unit written out** — Δ $/pt, Γ $/pt², `move_unit` pts, `m_adv` pts, `pnl_change_adv` $, `PaR` $, `k` dimensionless, `trail_level` $, `H` $. The arithmetic shown line by line. This fixture is the dimensional proof (AT-ALGO-6d) |
| 2 | **Apex** — Δ ≈ 0, Γ strongly negative | `PaR > 0`, `trail_level < H`, and `PaR` **strictly larger than fixture 3** |
| 3 | **Wing** — same fly as fixture 2, spot away from the body, Γ positive | `PaR > 0`; the comparison partner for fixture 2 |
| 4 | Put fly mirrored | same, adverse direction inverted |
| 5 | Strongly positive dealer gamma | `k` at/near 2.34 upper achievable |
| 6 | Strongly negative dealer gamma, thin path | `k` at/near 0.84 → clamped to 1.0 |
| 7 | Interior `k` | `k` strictly between clamp bounds and ≠ `k_base` |
| 8 | GEX unavailable | `gamma_factor = 1.0`, line still paints, state named |
| 9 | Δ/Γ unmeasured | proposed line **WAITING**, not painted; legacy paints |
| 10 | Batman, working side resolved | gate on that side's debit only |
| 11 | Batman, ambiguous | no guide either side, named |
| 12 | `E(t)` null | legacy clock-only; floor chrome says so |
| 13 | `move_unit` with 6 bars in the window | proposed WAITING, legacy paints |
| 14 | GEX history 12 samples | `gamma_factor = 1.0`, named, line still paints |
| 15 | Batman side switch mid-session | `H` resets; `h_prior_side` recorded |
| 16 | Override while still beyond the guide | no re-fire for `REENTRY_BARS`; HUD `guide: overridden` |

---

## Appendix C — errata index (E1–E22)

| # | Change |
|---|---|
| **E1** | `profit_at_risk` = adverse-move **loss magnitude**, `≥ 0`; `trail_level < H` enforced; apex now yields the widest PaR and tightest guide, as Coach intended. AT-ALGO-6b. |
| **E2** | `k` clamp declared defensive; achievable range `[0.84, 2.34]` documented; factor ranges to config; interior-`k` fixture required. AT-ALGO-6c. |
| **E3** | HUD **freezes and stays visible** on Fold suggested rather than hiding, because that is the moment the member is asked to override. AT-ALGO-17. |
| **E4** | `risk_taken` defined, including Batman per-working-side, with an `ambiguous` state that paints nothing. AT-ALGO-5b / 5c. |
| **E5** | GEX unavailable → one named behaviour: `gamma_factor = 1.0`, line still paints, state named. AT-ALGO-24. |
| **E6** | `E(t)` has never been measured; the legacy floor is named as clock-only when it is. AT-ALGO-25. |
| **E7** | AT-ALGO-19 becomes a source grep; AT-ALGO-T1 split into a testable half (T1a) and a note (T1b). |
| **E8** | The computed line is **proposed**, never "primary", until §14 clears it. |
| **E9** | The manual-confirm stand-in has a three-part retirement condition. AT-ALGO-T1a. |
| **E10** | Dimensional law: `move_unit` in points, Δ/Γ in package dollars per point / point², everything else in package dollars. Per-share greeks are a named state. AT-ALGO-6d. |
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

---

## 20. Open decisions

| # | Question | Owner | Default if silent |
|---|---|---|---|
| **OD-ALGO-1** | HUD fourth row: **Guide** (E13) or **Stop** (§0.1.11 verbatim)? The product has no stops and the label is an instruction on a chart | **Coach** | **Guide**. Payload key `guide_print` either way |
| **OD-ALGO-2** | `k` constant vs regime-dependent | **Coach**, after §14.5 | Constant at `k_base` until fitted |
| **OD-ALGO-3** | Entry trigger formula | **Coach · Hotel** | `manual_confirm` stand-in persists under E9 |
| **OD-ALGO-4** | Six-vendor GEX comparison findings into `gamma_factor` | **Coach** | Percentile normalization as specified |
| **OD-ALGO-5** | Does the Analyzer VP overlay (FI-031) get built so arming has a home in-app | **Juliet** | Out of this spec |

---

## 19. Changelog

| Ver | Date | Notes |
|-----|------|--------|
| **v2.2.1** | 2026-09-02 | **Editorial errata (E22). Model frozen.** AT-ALGO-17 no longer hardcodes the fourth HUD row's label — it follows OD-ALGO-1 and asserts the stable payload key, so the AT is correct under either disposition · Appendix C heading E1–E22 · empty-GEX chrome made persistent (`gex: warming n/30`) rather than one-shot. **Nothing else changed.** The next artifact is Appendix B, hand-written. |
| v2.2 | 2026-09-02 | **Product-law draft.** E10 dimensional law (units were unstated; AT-ALGO-6b could pass on garbage) · E11 `move_unit` and GEX-percentile estimators named with windows, min samples and empty-history states · E12 Coach Part II vocabulary is intent not chrome · E13 HUD **Guide** not Stop (OD-ALGO-1) · E14 bounce trigger never encoded on a sibling surface · E15 reduced-motion, muted legacy, overlay/Feed off by default · E16 Feed tool allowlist, closes FI-032 · E17 live eval is its own phase · E18 recording is a tape post not an exit · E19 `H` resets on side switch · E20 override suppresses re-fire · E21 time remaining reaches only the floor. §20 open decisions added. Appendix B grows to 16 fixtures. **BUILD AUTHORITY now requires hand goldens on disk.** |
| v2.1 | 2026-09-02 | **Full spec.** E1 PaR sign correction (v2.0's formula put the guide above high-water at the apex) · E2 unreachable clamp · E3 HUD freezes not hides · E4 `risk_taken` defined incl. Batman · E5 one GEX-unavailable behaviour · E6 `E(t)` never measured, floor named · E7 grep-based ATs · E8 "proposed" not "primary" · E9 stand-in retirement. Appendix A config (fail loud), Appendix B hand goldens, Appendix C errata index. No Coach text deleted. |
| v2.0 | 2026-09-02 | Seats Coach **Arming and Trade Management**. States Armed / In trade / Managing. Advisory guide. GEX as management. Dynamic trail proposed; legacy taper fallback and second teaching line. Rearm + convexity flag. Batman free-wing alert. Live eval is law. **DL-660**. |
| v1.0.16 | 2026-08-21 | See v1.0 spec changelog (HUD Profit through W1–W4). |
