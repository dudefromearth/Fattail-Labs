# FatTail Labs — Options Lab Analyzer Algo Alert Spec v2.0

**Status:** **SUPERSEDED** as product law by [AZ-ALGO v2.2.1](./FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v2.2.1.md) (**DL-661**, sha1 `6f491ee8f240aa06418b8e813fdb3152ed60deb5`). Kept as the **v2.0 seating** of the Arming memo. Review iterations v2.1 and v2.2 never landed as tracked files.

**Status (historical):** **DRAFT** — Coach 2026-09-02. Arming and trade management is now the product law for Analyzer **Algo**. **Not BUILD AUTHORITY** until Coach Phase 5.  
**Current revision:** **v2.0**  
**Supersedes:** [AZ-ALGO v1.0.16](./FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v1.0.md) as **product law**. v1.0.16 remains the **as-built characterization** of W1–W4 (Demo-only trail).  
**Seats:** Coach memo [`Arming and Trade Management Specification.md`](./Arming%20and%20Trade%20Management%20Specification.md) (verbatim in §0.2). Strategy parent [`FatTail 0DTE Strategy Specification.md`](./FatTail%200DTE%20Strategy%20Specification.md).  
**Type:** Product Spec — Analyzer **Algo alert** (arm → mechanical entry → GEX-guided profit-retention **guide**).  
**Short name:** **AZ-ALGO**  
**Route:** `/app/options-lab/analyzer`  
**Parents:** [Alert Builder Spec v1.0](./FatTail-Labs-Options-Lab-Analyzer-Alert-Builder-Spec-v1.0.md) (AZ-ALB) · [Alerts Manager Spec v1.0](./FatTail-Labs-Alerts-Manager-Spec-v1.0.md) (ALM) · Analyzer Spec v0.2 · OPF Truth / Elegant Failure (DL-309) · Keep-Warm Spec v0.1 · Human Interface Spec v1.0 · [Trader Feed v0.1](./FatTail-Labs-Trader-Feed-Spec-v0.1.md) (TF · **DL-514** · **DL-517**) · North Star Member Ethos v1.2 · unified Time Machine v0.7.4  
**Does not:** close, stop-out, or send a broker order. Does not implement the Labs-wide Alerts Manager. Does not copy MSC Trailing / 0DTE placeholder tabs. Does not use **expected move** as a trail input.

**Time Machine (v0.7.4):** Demo ticks on the replay clock; **creation under a playhead is a rehearsal object** — badged, never stored, never notifying, disposed on Reset with an announcement. Law: `Specs/FatTail-Labs-Options-Lab-Time-Machine-Spec-v0_7_4.md`.

---

## 0. Coach intent (do not drop)

### 0.1 From AZ-ALGO v1 (still in force except where §0.3 names a reshape)

1. The Algo alert is a **dynamic trailing stop**, except that it **does not stop the position out**. It provides **chatty narratives**.  
2. The alert is tied to an **OTM butterfly**.  
3. When it is turned on there is **little for the user to do**, because the algo knows how to set up. You **specify an OTM butterfly** and the Alert **create button starts flashing** subtly. Click it → Create Alert dialog opens to the **Algo** type and **describes what it will do**. **Minimal controls** that affect entry and management.  
4. **Default entry:** waiting for the position to achieve a **minimum amount of unrealized gain**. Default is **75% of the debit** of the trade. This **activates** the trade and the trailing stop: the “stop” is set to **75% of the top unrealized gain**. Then it **acts like a trail**. If the unrealized top gain increases, the trail **adjusts to the new top gain**.  
5. The **dynamic** part of the trail is the **trail amount**, which starts at **75%** and **slowly decreases to a minimum of 25% at the end of the trading session**. The **rate** of the decreasing trail is determined by the **rate of premium decay**. Member knobs (**always selectable**): **start profit management** = % unrealized gain of debit (default **75%**); **stop the trail at** % of high-water (default **75%**); **end the trail at** % of high-water (default **25%**). Start occurs when unrealized gain reaches the first knob. **DL-482**.  
6. A **vertical line** is drawn at the **highest profit achieved** and **another at the trail**. These colors are **assignable**. Lines are **thin dashed**. An **optional transparent overlay** sits **between** the two verticals. The overlay gets **more opaque and pulses** if price **threatens the stop price**. If price **exits the trail** the alert **stops and records the result**.  
7. A **window** appears, similar to the **narration window in the Surface app under the “T Ortho” view**. This narrative is a **play-by-play of the underlying market structure from the POV of the GEX**, and **if Volume Profile is engaged, the position to structural levels**. If VP is **not** engaged, it is **left out of the narrative**. Other narrative types concern the **greeks, debit and gamma risk, probabilities**, etc.  
8. **Goal:** keep the trader in the trade long enough to **maximize profit** so long as the risk does not threaten **losing more than they should**. **Most trades are going to result in small profits, some will bank it.** There will be **adjustments to the narrative based on premium decay rate** as well.
9. **Remove the narrative from the Algo Alert panel.**
10. **The 75% trail means you can give up 75% of the profit.** It is a **% of profit**, not an absolute and not total value. The as-built `S = f × H` was **opposite** (75% was keeping 75%). Law: `S = (1 − g) × H` with `g` the give-up %.
11. **The algo alert should show the values that are important to track, and display them in the lower left corner just above the $0 line.** Top: **High** (highest unrealized gain). Then **Profit** (current gain, same units as High). Then **Trail** (% value of the trail). Then **Stop** (**ticker price** `x_S`). Colons line up. **Only while the algo is active** (Live and Armed). Hidden while Waiting, Idle, Touched, or Recorded.
12. **Reason (2026-08-21, verbatim — do not drop · ALGO-R1 · DL-510):**

> I want to change the scope of the reason feature and make the scope now apply to the entire trail time range, while it is in effect. So there will be a single Reason checkbox and I want it placed at the top of the group box to the right of the title "Trail Settings" when checked it will open a field under the Title and above the start Trail %. It will be a small editable box that accepts text and understands markdown. The AI model will be active based on the declarations in this prompt during the period of effectivity. The thing it affects is not the alert itself, but a narrative floater that should appear when the Reason is checked and there is a prompt. The narrative box is similar to the narrative box in the "T Ortho" view in Surface. The assumption with prompts in this field is that the AI knows the current settings of the Algo alert, understands the strategy it is used for "The 0DET OTM Butterfly" and can access the Heatmap raw data, to make inferences in the current market condition that might affect the outcome of this position with regard to potential profit.

    Supercedes the two per-stop Reason boxes (**DL-484**). Product name of the strategy is the **0DTE OTM butterfly** (§6). Tango / Hotel on “potential profit” sit in **§13**.

13. **Prompt scope (2026-08-21, verbatim — do not drop · ALGO-R1):**

> Let's talk about the scope of prompts that coulds be used. The checking of the box is enough to start a basic narration in the floater. The prompt might include special instructions that focus the narration on a specific market condition, or specific trader concern, that modifies the narrative, but does not dibert the narrative from its primary purpose.

    Qualifies §0.1.12: **Reason checked** mounts basic narration. A prompt is **optional focus**, not a gate.

14. **House base prompt (2026-08-21, verbatim — do not drop · ALGO-R1 · DL-511):**

> The Alerts Manager is a manager for all users. However like many features, there's in-place editing for features. And this is just such a case.

    Admin-only **base prompt** for Algo Reason. Edited **in place** on the member Alerts Manager (`/app/alerts`). Members never see the editor.

15. **Floating narrative (2026-08-21, verbatim — do not drop):**

> Both of these features are to feed a floating Narrative for trader review

> So, the Narrative is feature-specific and contectually aware including aware of the trader and their current position(s) they are examining

    **These features** = Analyzer **Algo** Reason floater **and** Surface **T Ortho** squawk.

16. **Labs-wide Feature Narrative (2026-08-21, verbatim — do not drop · DL-514):**

> So, this is a new feature I am proposing. It will take the place of the narrative box in T Ortho, and it will supplement the Algo Alert feature, and it may be used in other geatures throughout FatTail Labs.

    Algo **Reason floater is a host** of Trader Feed (`host_id: algo-reason`). TF **supplements** this feature — it does **not** replace trail math, knobs, Reason, house base, HUD, or **ALGO-N1**.

17. **Tape and prompt (2026-08-21, verbatim — do not drop · DL-515):**

> Each place the feature is employed, it will have an instructions prompt to follow. The narrative will be a continuous scroll, so the user can view older posts. The posts will be timestamped. This feature is very similar to the Jounaling feature. But it is generalized

    House base **is** this employment’s **instructions prompt**. Reason markdown remains optional **focus**. **ALGO-N1** still: no narrative on the Builder panel.

18. **Trader Feed (2026-08-21, verbatim — do not drop · DL-516):**

> One of my members referred to this feature as the trader feed. A merket and position and trader aware contrinuous narrative. It is customized per venue. But largely based on the same base market info.

    Algo Reason is one **venue**. Chrome title **Trader Feed**.

Tango / Hotel notes sit in **§13** beside this text. They do not delete it.

### 0.2 Arming and Trade Management (2026-09-02, verbatim — do not drop)

**Scope:** the state machine from armed setup through to exit, and the GEX-guided profit-retention layer that replaces the fixed trail schedule.  
**Output stance:** advisory. A visible line to be judged and overridden, never an automatic exit.

#### Part I — Arming and entry

**1. States**

| State | Who acts | What is happening |
|---|---|---|
| **Armed** | Trader (discretionary) | Setup identified, algo switched on, no position |
| **In trade** | Algo (mechanical) | Trigger fired, position on, below the management gate |
| **Managing** | Trail + GEX | Open profit ≈75% of risk or better |

Arming is discretionary. Entry is mechanical. Management is a third state with its own gate.

**2. Arming.** The trader identifies the structural level from volume profile, watches price pull back into it, and — when it appears to bounce — arms the algo.

**3. Trigger.** The algo enters when the bounce off the structural level confirms and price heads toward the fly.

> **Open item.** The trigger condition is deliberately left as "the bounce confirming" until enough live observations exist to name it precisely. It should be specified from observed entries, not from theory.

**4. There are no stops.** The trader is never in the trade to stop out. Loss is bounded by the debit. This matters for what follows — "rearm" does not mean retry after a stop.

**5. Rearming.** Rearming covers one specific case: **an armed setup never triggers, and price continues past the original entry level toward the next structural level.**

Example, call fly: price pulls back to a structural level, appears to bounce, the trader arms, the trigger never fires, price continues past and keeps going. The trader may rearm against a lower structural level.

**6. Repositioning on rearm.** The fly is **repositioned, not reused.** Distance does not improve the position — past a point the far out-of-the-money longs become worthless and the butterfly stops making sense.

**Rearm check:** price the fly at the new level. If the debit is not within 5 to 10 percent of the width, re-strike it to a level where real convexity exists.

**Width does not change on rearm** — the volatility regime has not changed.

> **Tool requirement.** Flag when an armed fly has gone stale and needs re-striking. This is a hard, checkable constraint.

#### Part II — Management

**7. Activation gate.** Profit management does not begin until the position is at roughly **75 percent profit over risk taken.** Below that: no line, no alerts, nothing displayed.

**8. What GEX is and is not.** GEX is **not** an entry filter. For entry it is largely useless, particularly on a 0DTE trade held more than a few hours. Entry is trend plus structural level from volume profile.

GEX is a **management instrument.** It decides hold-or-fold once already in the trade. Volume profile supplies the static map; GEX supplies the live weather.

GEX cuts both ways:

- Positive dealer gamma around the position means price is being held — reason to widen, and potentially to override the trail stop
- Below the flip, moves feed themselves — reason to tighten
- A heavy positive-gamma strike at the center is a real wall worth patience
- Nothing but air in the drift direction is reason to tighten hard
- Near the center strike, GEX may justify exiting *ahead* of the trail rather than waiting for it

Volume profile can be read the same way for this decision, not only for entry.

**9. Fold signals.** Decaying premium, constricting breakevens, extreme gamma and delta slope. All of these are only *experienced* near the edges of the trail — which is why the awareness layer has to exist before the trader gets there.

**10. The apex is a risk location.** Same risk applies at the apex of the profit curve as at the edges: large open profit, and a small move toward an edge costs a great deal of it. Combined with the pin behavior in the strategy spec, the apex should be treated as a place to be alert, not a place to relax.

**11. Legacy trail — the rule of thumb being replaced.** Trail expressed as a percentage of accumulated unrealized gain, diminishing through the day:

- ~75 percent early morning
- ~40 percent by noon
- ~20 percent by 2pm

Percentages reach the narrower values *earlier* in low volatility.

Current algo implementation is cruder than that: the user sets an entry width and an end-of-session width (e.g. 75 percent at a 10am entry down to 25 percent at 4pm) and the algo tapers linearly between them.

This schedule is a rule of thumb. It remains as fallback and as beginner scaffolding, not as the primary read.

#### Part III — Dynamic trail computation

> **Status: proposed, unvalidated.** The structure below reflects the design decisions made; the constants are starting points to be fitted, not results.

**12. Purpose.** An in-trade profit-retention guide that derives the trail from live position risk rather than from a time schedule, modulated by dealer gamma. It should breathe through the day rather than only shrink — but eventually shrink.

**13. Inputs**

- Live delta and gamma of the position
- **Rolling realized movement** over a short window, 15 to 30 minutes
- Running high-water mark of open profit
- Net dealer GEX, **normalized against its own recent distribution** — not absolute dollars, since scale drifts
- Distance from spot to the nearest heavy gamma strike
- Time remaining in the session

**Expected move is explicitly rejected as an input.** The entire premise of the strategy is targeting moves that *exceed* expected move, which happens about 20 percent of the time. Realized movement is used instead.

Useful property of that choice: realized movement makes the trail naturally wider in the volatile early session and naturally compress into the afternoon. The breathing behavior comes from the tape rather than from a schedule.

**14. Core computation**

```
move_unit       = rolling realized movement over the 15–30 min window

profit_at_risk  = delta × move_unit + ½ × gamma × move_unit²

trail_level     = high_water_profit − k × profit_at_risk
```

The gamma term is what makes profit-at-risk explode near the apex. That is the intended behavior, not a side effect.

**Worked example.** Open gain $1,000, profit_at_risk $300, k = 1.5 → trail level at $550.

**15. k modulation**

- Base **k = 1.5**
- **Gamma factor:** 0.7 (strongly negative dealer gamma) to 1.3 (strongly positive)
- **Proximity factor:** 0.8 (thin path ahead) to 1.2 (heavy strike near the center)
- **Clamp** the product to [1.0, 2.5]

> **Open item.** Whether k is a constant or a function of regime is unresolved. Test both.

**16. Floors.** Retain the end-of-session anchor from the legacy schedule as a hard floor, so the computed trail cannot stay wide into the close.

**17. Display.** Show the computed line **and** the legacy linear-taper line together. Newer traders watch them diverge and learn from the gap. This is the teaching mechanism, not just a debugging view.

#### Part IV — Batman-specific handling

**18. Both sides, same logic.** Hold-or-fold applies to each side independently. You do not always get to visit both sides; the logic is unchanged either way. The trail is live on whichever side price is actually working.

**19. Free-wing conversion.** When price is working one side, the other side is virtually worthless. It often makes sense to **buy back the center (short) strikes of the further-out fly** — typically when they are under about ten cents, sometimes five.

The result is free wings in case price swings all the way back.

> **Tool requirement.** Alert when the far-side shorts drop under the 5–10 cent threshold. It is a small side-condition that only fires on Batman days, which makes it easy to miss in the heat of the session.

#### Part V — Validation

**20. Backtest criteria**

1. Across volatility regimes — low, mid, high — separately, not pooled
2. Across the full outcome distribution
3. **Primary criterion:** whether the computed line would have folded trades bound for the top return band. Those are 2.5 to 5 percent of trades and carry a disproportionate share of the return. A line that improves average retention while cutting off the tail is a worse line.
4. Compare against the legacy linear taper on the same trades
5. Fit k — constant versus regime-dependent

**21. Open items**

- Name the entry trigger precisely from observed entries
- Determine whether k is constant or regime-dependent
- Incorporate findings from the six-vendor GEX tool comparison

### 0.3 Seating of §0.1 vs §0.2 (this spec’s job — not Coach deletion)

§0.2 is **v2 product law** for states, arming, entry, rearm, GEX-as-management, and the trail. §0.1 stays. Where they name the same thing differently, **§0.2 wins** and the v1 name is mapped — not erased.

| Topic | v2 law (§0.2) | v1 text (§0.1) | Seat |
|-------|----------------|----------------|------|
| States | **Armed** (no position) → **In trade** → **Managing** | Waiting → Armed → Recorded | **§0.2 names.** v1 Waiting = In trade. v1 Armed = Managing. v1 Recorded → fold **suggestion** (§11). |
| When the algo turns on | Discretionary **arm** at a VP bounce; **no fill yet** | Specify an existing OTM fly on the book | **Both.** Arm may precede the card. Once a fill exists, v1 bind-to-fly still applies. |
| 75% gate | **≈75% profit over risk taken**; below that **no line** | 75% of **debit** then trail | **Same gate** when risk taken = debit of the long fly (`U ≥ 0.75 × D`). Knobs remain member law (DL-482). |
| Trail primary | Live **profit-at-risk** + GEX-modulated `k` (proposed, unvalidated) | Give-up % of high-water, 75% → 25% by EoD, paced by premium decay | **Primary = §0.2 Part III.** v1 schedule = **legacy fallback / beginner scaffolding** (§8.2). **Show both lines** (§0.2.17). |
| “Stop” | **There are no stops.** Loss bounded by debit. Line is **advisory**, judged and overridden, **never an automatic exit** | HUD row **Stop** = ticker `x_S`; exit **records** and eval stops | HUD **Stop** is the **guide print**, not a broker stop. Crossing it **records a fold suggestion**. It does **not** flatten. Member may **override** and stay **Managing**. |
| GEX | **Management instrument**, not an entry filter | Narrative play-by-play from GEX | **Both.** GEX modulates `k` while Managing; Reason/Trader Feed still speaks GEX when the overlay is on. |
| VP | Structural map for **arming / entry** | Narrative only if engaged | **Both.** Analyzer VP overlay remains **FI-031** until that overlay exists; arming still **names** VP as the map. |
| Batman | Both sides independent; free-wing conversion alert | v1 “Batman-as-a-whole **out**” | **§0.2 Part IV is in.** v1 exclusion is **reshaped**, not silently dropped. |
| Reason / TF / ALGO-N1 / HUD High·Profit·Trail | — | §0.1.9–18 | **Unchanged.** Reason still does not drive the engine. |

---

## 1. Job of the algo

| Stay in | Don’t give back |
|---------|-----------------|
| Hold the fly while it still has room so a runner can remain a runner | Narrate a **guide** so they do not give back more than they should |

**Distribution (strategy parent):** most clip small; a few bank the run. The **primary validation error** is folding a trade bound for the top return band (2.5–5% of trades). Labs chrome does not quote Sharpe or return bands as a promise (§13).

**What “stop” means here:** a **visible advisory line** plus a **narrative / record** event. The **position stays on the book**. No Tradier, no close, no order. The member still owns Close / Trade Log on the card. They may **override** the line and remain Managing.

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

**Apply kind:** `kind: position` (bound card **or** planned fly) + `alert_class: algo`. Canvas right-click does **not** author Algo.

---

## 3. As-built honesty (audit 2026-09-02 — not law)

This is what the Analyzer **does today**. It is **not** a waiver of §0.2.

| Claim | As-built |
|-------|----------|
| Live eval | **`tickAlgoAlert` no-ops unless `algo.demo`.** Test: `"non-demo does not tick"`. Live RTH Algo stays Waiting. |
| Trail | Legacy give-up `S = (1−g)×H` only. Clock taper; **`E(t)` always `null`**. No profit-at-risk, no `k`, no GEX modulation. |
| Bind | Existing book card that `isOtmDebitButterfly`. **No Armed-before-fill.** |
| Reason | **Two** checkboxes on Start/End Trail % (`trail_stop_reason` / `trail_end_reason`). ALGO-R1 (one Reason) **not landed**. W3-R READY, never fired. |
| Trader Feed | `AlgoNarrativePanel` exists; Analyzer **must not** import it (ALGO-N1). **No** `data-trader-feed="algo-reason"`. No house base on `/app/alerts`. |
| HUD | High / Profit / Trail / Stop — **Live + old-Armed**, Demo path only. |
| Canvas | Dashed `x_H` / `x_S`; overlay two alphas, not a ramp. |
| Recorded | Touched + `triggeredAt` / `triggeredSpot`. Spec §12 payload **not written**. Holder says “Waiting / Armed / Recorded”. |
| Persistence | `sessionStorage`. `upsertAlert` is a typed hook, unused. |
| Board | W1–W4 PASS against **v1.0.2**. W5 / W-G **not run**. Spec had already drifted to v1.0.16. |

**Dogfood today:** eligible OTM debit fly → **+** pulses → Type Algo → check **Demo** → move What-if Spot/Time until `U ≥ 0.75 D`. Without Demo, nothing after Save moves.

---

## 4. States (normative)

| State | Who acts | Meaning | v1 name (as-built) | Holder |
|-------|----------|---------|--------------------|--------|
| **Idle** | Trader | Paused. No eval. | Idle | Idle |
| **Armed** | Trader | Setup identified. Algo on. **No position.** Watching the VP bounce. | *(none)* | Live · Armed |
| **In trade** | Algo | Trigger fired. Position on. **Below** the 75% gate. **No trail geometry.** | Waiting | Live · In trade |
| **Managing** | Trail + GEX | `U ≥` management gate. High-water + **both** trail lines. HUD on. | Armed | Live · Managing |
| **Fold suggested** | Guide | Spot / P&L crossed the **guide**. Tape records. Position **stays**. Member may override → Managing. | Recorded | Touched · Fold suggested · **`· demo`** when the clock was Demo |

**Code ids:** `armed` · `in_trade` · `managing` · `fold_suggested` · `idle`.  
Do not reuse v1 `armed` for Managing without a mapping layer — that collision is how the two documents disagree.

Arming is discretionary. Entry is mechanical. Management is a third state with its own gate.

---

## 5. Arming, trigger, rearm

### 5.1 Arming

The trader identifies the **structural level from volume profile**, watches price pull back into it, and — when it appears to bounce — **arms** the algo.

GEX is **not** consulted to arm.

### 5.2 Trigger

The algo **enters** when the bounce off the structural level confirms and price heads toward the fly.

> **Open item (Coach).** The trigger is "the bounce confirming" until enough live observations exist to name it. Specify from observed entries, not from theory. **AT-ALGO-T1** is a characterization hook, not a formula.

Until that formula exists: a **manual confirm** (member accepts the fill / the card appears on the book) may move Armed → In trade. That is a **named stand-in**, not the trigger.

### 5.3 There are no stops

The trader is never in the trade to stop out. Loss is bounded by the debit. **Rearm does not mean retry after a stop.**

### 5.4 Rearming

One case only: **an armed setup never triggers, and price continues past the original entry level toward the next structural level.**

Example, call fly: pullback to a structural level, apparent bounce, arm, trigger never fires, price continues. The trader may rearm against a **lower** structural level.

### 5.5 Repositioning on rearm

The fly is **repositioned, not reused.** Width **does not change** (regime has not changed).

**Rearm check:** price the fly at the new level (OPF package). If the debit is **not within 5 to 10 percent of the width**, re-strike to a level where real convexity exists (strategy convexity band).

> **Tool requirement (Coach).** Flag when an armed fly has gone stale and needs re-striking. Hard, checkable. **AT-ALGO-20.**

---

## 6. Who it binds to

### 6.1 Classic (workhorse)

One **long OTM debit butterfly** on the Analyzer book (or a **planned** listed fly while Armed).

| Must | Law |
|------|-----|
| Structure | Listed butterfly: three strikes, same right, **+1 / −2 / +1**. OPF-listed only. |
| OTM | Call fly: body **>** spot. Put fly: body **<** spot. ATM body is **not** this algo. |
| Debit | Package is a **debit**. Credit / short flies **out**. |
| Convexity band | Debit **5–10% of width** after a rearm (strategy parent §3). Flag if outside. |
| Bound | In trade / Managing: `position_id` resolves to a book card. Armed: may be planned (no card yet). Unbound after a fill → holder **Unbound**, no geometry. |

Eligibility helper (normative name): `isOtmDebitButterfly(card, spot)` — listed shape + OTM vs **raw** underlier + debit > 0. Unpriceable debit → **not eligible** (named, not invented).

### 6.2 Batman (in, from §0.2 Part IV)

Hold-or-fold applies to **each side independently**. The trail is live on whichever side price is actually working.

**Free-wing conversion:** when one side is working, the further-out fly’s **short body** often becomes noise. Alert when those shorts print **under ~10 cents, sometimes 5.** Member still owns the buy-back. The algo does not send the order.

> **Tool requirement (Coach).** Far-side shorts under the 5–10¢ threshold. Batman days only. **AT-ALGO-21.**

v1 “Batman-as-a-whole out” is **reshaped** by this section. BWB, condor, iron fly, vertical remain **out** of this algo.

---

## 7. Create path

### 7.1 Subtle flash on **+**

When **at least one** book card is eligible (§6.1), **or** the member is in an **Armed** planned setup: inspector Alerts **+** (`analyzer-alert-create`) **pulses** (tint, not a seizure). Pulse **stops** when nothing eligible remains, or an Algo is already Live on that card. **AT-ALGO-1.**

### 7.2 Click **+**

Opens the floatable Alert Builder (AZ-ALB) with Type **Algo** when an eligible fly exists; else Price / Spot (AZ-ALB). Knobs only on the panel (**ALGO-N1**). **ALGO-TM1** unchanged: Time Machine day may load empty; add the fly afterwards.

Canvas right-click does **not** author Algo.

### 7.3 Demo

**Demo** is a **clock**, not an eval switch. What-if and Time Machine remain the Demo clocks (DL-485 · TM v0.7.4). **Live algos tick on the live raw mark.** As-built Demo-only eval is a **defect against this spec**, not a feature.

Rehearsal under a playhead: badged, never stored, never notifying, disposed on Reset.

---

## 8. Alert Builder — Algo

Title: `{SYMBOL} — Algo Alert`. State control: **Live / Idle**. After **Fold suggested**, Builder shows the stamp + **Reset to Live** (new wait — Armed if no fill, In trade if the card remains).

### 8.1 ALGO-N1

Type → Algo shows **knobs only** (and the empty-state bind copy). No description paragraph on the Builder. Trail lines, holder states, Demo stay. Trader Feed mounts under **ALGO-R1**.

### 8.2 Minimal controls

| Control | Default | Law |
|---------|---------|-----|
| Position / planned fly | Eligible card, else planned | Dropdown: eligible OTM debit flies. Empty → named “Specify an OTM butterfly.” Save off until bind or planned fly is representable. |
| Start profit management | **75** | 1–100. Gate = % of **risk taken** (debit). Below gate: **In trade**, no lines. |
| **Trail Settings** group | — | Tinted box. Title **Trail Settings**. One **Reason** checkbox **to the right of that title** (ALGO-R1). |
| **Reason** | **Off** | Whole Managing window. Checked → Trader Feed + basic narration. Prompt optional focus. **Does not** change the engine. Supercedes two Reason boxes (**DL-484**). |
| **Start Trail %** / **End Trail %** / Decay | 75 / 25 / EoD | **Legacy scaffolding.** Inputs to the linear-taper **fallback** line and to the **floor** of the computed line. Always shown. Start > End. |
| High-water / trail / legacy colors | Tag target / warning / (third) | Assignable. Computed guide and legacy taper **both** paint (§9.3). |
| Overlay between **guide** and high-water | **Off** | Optional. Densifies + pulses if spot threatens the **guide**. |
| **Demo** | **Off** | Clock only. |

Trigger / tags / expiration: AZ-ALB shared. `behavior` stamps **once_only** for a fold-suggestion cycle. Save on when bind is eligible and OPF can name a debit **or** the planned fly is listed and priceable.

### 8.3 Hook draft

`upsertAlert`: `alert_class: algo`, `kind: position`, `trigger.family: algo`, `trigger.algo.variant: otm_fly_trail`. Write `reason_on` / `reason`. **Do not write** `trail_stop_reason` / `trail_end_reason`. Ignore those keys if still on an old record.

---

## 9. Management and trail

### 9.1 Activation gate

Profit management does **not** begin until open profit is roughly **75% of risk taken** (`U ≥ entryPct × D` when risk = debit). Below that: **In trade** — no line, no HUD, nothing displayed.

### 9.2 GEX as management

GEX is **not** an entry filter. It is the **hold-or-fold weather** once In trade / Managing:

- Positive dealer gamma around the position → reason to **widen**, and to **override** the guide
- Below the flip → reason to **tighten**
- Heavy positive-gamma strike at the center → a wall worth patience
- Air in the drift direction → tighten hard
- Near the center strike → GEX may justify folding **ahead** of the trail

Volume profile can be read the same way for this decision, not only for entry. If VP is not engaged on this Analyzer, omit VP from the **narrative**; the arming map is still the strategy’s VP.

**Fold signals (awareness, not a flatten):** decaying premium, constricting breakevens, extreme gamma and delta slope — experienced near the **edges** of the trail, which is why the awareness layer exists **before** they get there.

**Apex:** same risk as the edges. Pin behavior (strategy spec §6): a pin is not a pin until the end of the day. The apex is a place to be **alert**, not to relax.

### 9.3 Two lines (teaching)

While **Managing**, paint:

1. **Computed guide** — §9.4 (primary).  
2. **Legacy taper** — §9.5 (fallback / beginner scaffolding).

Newer traders watch them diverge and learn from the gap. This is the teaching mechanism, not a debug view. **AT-ALGO-22.**

### 9.4 Primary trail (proposed, unvalidated)

Constants are **starting points to be fitted**, not results.

```
move_unit      = rolling realized movement over a 15–30 min window
profit_at_risk = Δ × move_unit + ½ × Γ × move_unit²
trail_level    = H − k × profit_at_risk
```

**Inputs (OPF / Arch 28 only):** live **position** delta and gamma; rolling realized movement 15–30 min; high-water `H`; net dealer GEX **normalized to its own recent distribution** (not raw dollars); distance from spot to the nearest heavy gamma strike; time remaining in the session.

**Expected move is rejected.** Realized movement is the unit. That is what lets the trail **breathe** early and compress into the afternoon without a clock story.

**k**

- Base **1.5**
- Gamma factor **0.7** (strongly negative dealer gamma) … **1.3** (strongly positive)
- Proximity factor **0.8** (thin path ahead) … **1.2** (heavy strike near the center)
- Clamp the product to **[1.0, 2.5]**

Open item: `k` constant vs regime function — **test both**. Do not pick in code until Coach closes it.

**Worked example (Coach):** open gain $1,000, profit_at_risk $300, k = 1.5 → trail level **$550**.

**Floor:** the legacy end-of-session anchor is a **hard floor**. The computed trail cannot stay wide into the close.

**Invert to underlier `x_S`:** same T+0 invert of the bound card at P&L = `trail_level` as v1 §7.4 (near / far through the body — ALGO-B1). Missing invert → named state, last paint, P&L backstop `U < trail_level`. Do not invent `x_S`.

**Δ / Γ unmeasured:** named WAITING on the **computed** line; **legacy line may still paint**. Do not invent greeks.

### 9.5 Legacy trail (fallback)

Give-up of high-water profit. Member knobs are law (DL-482).

```
S(t) = (1 − g(t)) × H(t)
```

`g` starts at Start Trail % (default 0.75) and tightens to End Trail % (default 0.25) by decay end (default EoD). Path: `min(g_decay, g_clock)` then running minimum (ALGO-A1). Clock uses remaining-to-decay-end. Decay uses remaining package extrinsic `E(t)` when OPF can name it; **unmeasured → clock-only, hold last g** — do not invent `E`.

v1 far-side invert (ALGO-B1) and pulse hysteresis 20/25 (ALGO-A2) apply to the **guide that is being threatened** (computed, if representable; else legacy).

Coach’s remembered day-shape (~75% early, ~40% noon, ~20% by 2pm, earlier in low vol) is the **rule of thumb this fallback approximates**. Knobs remain the member-visible law; do not hardcode 10:00 / 12:00 / 14:00.

### 9.6 Canvas and HUD

| Element | Law |
|---------|-----|
| High-water | Thin dashed vertical at `x_H` (raw print when `H` last increased). |
| Computed guide | Thin dashed vertical at computed `x_S`. |
| Legacy taper | Thin dashed vertical at legacy `x_S` (distinct color). |
| Overlay | Optional, between high-water and the **guide**. Tint = guide color. Ramp toward the guide; pulse on last 20% of `G`, off at 25%. Frozen after Fold suggested (no pulse). |
| In trade / Armed | **No** trail geometry. |
| Fold suggested | Lines freeze. Overlay static if it was on. |
| HUD | Lower-left, just above $0, **only while Live + Managing**: **High** · **Profit** · **Trail** · **Stop** (guide print `x_S`). Colons aligned. Hidden in Armed, In trade, Idle, Fold suggested. **Stop** is telemetry, not a flatten. |

Pan/zoom moves them with the view. Do not steal left-drag pan or strike handles.

---

## 10. Narrative / Reason / Trader Feed

**ALGO-N1:** no description paragraph on Type → Algo.

**ALGO-R1:** one Reason checkbox to the right of “Trail Settings”. Checked → Trader Feed `algo-reason` mounts (prompt not required). Unchecked → unmount. Prompt focuses; it must not divert from primary purpose (stay-in / don’t-give-back, GEX weather, VP if engaged, greeks / debit / gamma / probabilities, Heatmap on the plane).

**AI active** while **Managing** (the trail is in effect). Armed / In trade may show the box with standing / waiting copy; no trail-life model tick until Managing. Fold suggested: last tape, no new inference.

House base on `/app/alerts` (admin in-place). Fail-open: local posts + named “AI quiet”, never a silent empty tape while Reason is on.

testid: `analyzer-algo-narrative` plus `data-trader-feed="algo-reason"`. Do **not** import `TimeOrthoEggPanel`.

---

## 11. Fold suggestion (was Recorded)

When spot / P&L **exits the guide** in the give-back direction (or GEX justifies folding **ahead**, as a named tape event):

- Append a **Fold suggested** post (process facts: `H`, guide, `g` or `k`, spot, time ET, debit, `exit_side`, clock `mode`).
- Holder: **Fold suggested** · **`Recorded · demo`** remains the Demo subtitle when `mode` is `demo_whatif` or `demo_timemachine`.
- **Position is not closed.**
- Member may **override** → back to **Managing** (guide stays live).
- Member may Idle the alert. Reset to Live starts a **new** Armed (no fill) or In trade (fill remains) — clears high-water.

v1 “eval stops on Recorded” is **reshaped** by §0.2 output stance (advisory, never an automatic exit).

Payload minimum: v1.0.16 §12 fields, plus `k` / `profit_at_risk` when the computed line was representable, plus `overridden?: true` if they stayed in.

---

## 12. Evaluation until Manager

Client adapter evaluates this class (AZ-ALB §6 era). **Live ticks.** Demo is a clock. Once Manager GO’s, Analyzer subscribes; it does not keep a second bus.

| Must | |
|------|--|
| Raw mark | Underlier for `x_H`, threaten, fold. |
| OPF package | `U`, `D`, `E`, Δ, Γ. |
| Realized move | Short window on the **same** underlier plane (Arch 28 / TM tape). Not expected move. |
| GEX | Analyzer GEX profile already on the pane, **normalized to its recent distribution**. Off → computed line uses `k` **without** the gamma factor (named), or falls back to legacy. Do not invent a GEX. |
| Idle | No heavy resolve. |
| One WS | Arch 28. |

---

## 13. Language (Tango + Hotel sit beside Coach)

**Coach (§0.1.8 / strategy parent) is the job:** keep them in so long as they do not lose more than they should; most clip small, some bank it; do not cut off the top band.

**Tango (labeled):** Labs chrome, titles, notifications, HUD, and the tape speak **process** (armed, in trade, managing, high-water, guide, threaten, fold suggested, decay). They do **not** promise P&L, Sharpe, “maximize profit,” or “bank it.” HUD **Profit** is current gain telemetry. HUD **Stop** is the guide print. Coach’s “potential profit” is the *subject of Reason inference*, not a Labs headline.

**Hotel:** Δ, Γ, debit, GEX, VP, Heatmap lines are **measurements on the OPF-held plane**. Do not invent a greek, a wall, a VP node, or a heatmap cell. Wrong structure here is **severity: high**.

**Victor / Whiskey (opinion, not a block):** the guide is via negativa on give-back, not a forecast of the right tail. The right tail is allowed by **staying in**.

---

## 14. Validation (Coach Part V)

1. Across volatility regimes — low, mid, high — **separately**, not pooled.  
2. Across the full outcome distribution.  
3. **Primary criterion:** whether the computed line would have folded trades bound for the **top return band**. A line that improves average retention while cutting off that tail is a **worse** line.  
4. Compare against the **legacy linear taper** on the same trades.  
5. Fit `k` — constant versus regime-dependent.

Do not ship the computed line as the only guide until this bar has evidence. Until then: **both lines**, computed marked **proposed**.

---

## 15. Ideas inventory

| Idea | Seat |
|------|------|
| Advisory guide, never an automatic exit | **IN-SCOPE** · §0.2 stance |
| Armed (no fill) → In trade → Managing | **IN-SCOPE** · §4 |
| VP bounce arming; GEX not an entry filter | **IN-SCOPE** |
| Mechanical trigger = “bounce confirming” | **OPEN** · specify from observed entries |
| No stops; debit bounds loss | **IN-SCOPE** |
| Rearm + reposition; width unchanged; 5–10% debit/width flag | **IN-SCOPE** · **AT-ALGO-20** |
| 75% of risk taken before any line | **IN-SCOPE** |
| GEX modulates hold/fold and `k` | **IN-SCOPE** |
| Fold signals / apex as risk location | **IN-SCOPE** |
| Legacy % schedule as fallback + teaching second line | **IN-SCOPE** |
| Dynamic trail `H − k × profit_at_risk`; realized move; no expected move | **IN-SCOPE** · **proposed, unvalidated** |
| `k` 1.5 × gamma × proximity, clamp [1.0, 2.5] | **IN-SCOPE** as **starting constants** |
| `k` constant vs regime | **OPEN** |
| Six-vendor GEX comparison | **OPEN** |
| Batman both-sides + 5–10¢ free-wing alert | **IN-SCOPE** · **AT-ALGO-21** (reshapes v1 Batman-out) |
| Reason / TF / ALGO-N1 / HUD High·Profit·Trail·Stop | **IN-SCOPE** · unchanged from v1.0.9–16 |
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
- Shipping computed-only (hiding the legacy line) before §14 evidence.  
- Labs-wide Manager HTTP schema freeze.

---

## 17. Acceptance

v1 ATs that still hold keep their numbers. State names in those ATs **map** through §4.

| AT | Criterion |
|----|-----------|
| **AT-ALGO-1** | Eligible OTM debit fly (or Armed planned setup) → **+** pulses. |
| **AT-ALGO-2** | **+** while eligible → Type **Algo**, knobs only, Save on when debit is named. |
| **AT-ALGO-3** | **+** with no eligible card → Price / Spot. Type → Algo with empty list → Save off. |
| **AT-ALGO-4** | Defaults: entry 75, trail start 75, floor 25, overlay off. Knobs are law. |
| **AT-ALGO-5** | **In trade:** no high-water / trail / HUD. `U ≥` gate → **Managing**. |
| **AT-ALGO-6** | Managing: `H` ratchets. **Legacy** `S = (1−g)×H`; `g` monotone (ALGO-A1). **Computed** `H − k×PaR` when Δ/Γ/move are representable. |
| **AT-ALGO-7** | Thin dashed verticals, member colors. Overlay optional. Pulse 20/25 (ALGO-A2). |
| **AT-ALGO-8** | Guide exited → **Fold suggested**. Position **not** closed. Member may override → Managing. |
| **AT-ALGO-9** | ALGO-N1: no narrative paragraph on Type → Algo. |
| **AT-ALGO-R1…R8** | One Reason; TF `algo-reason`; house base on `/app/alerts`; Reason does not drive the engine. |
| **AT-ALGO-17** | HUD High · Profit · Trail · Stop **only Live + Managing**. |
| **AT-ALGO-10** | Unpriceable debit / greeks / invert → named state, no invented mark. |
| **AT-ALGO-11** | `upsertAlert` `alert_class: algo`, `trigger.family: algo`. |
| **AT-ALGO-12** | Idle / Keep-Warm: no 1s heavy resolve. Pan/handles unaffected. |
| **AT-ALGO-13** | ATM / credit / non-fly: not eligible. |
| **AT-ALGO-14** | Reset Fold suggested → Live starts Armed (no fill) or In trade (fill remains); clears high-water. |
| **AT-ALGO-15** | HI tokens, 44pt, floatable Builder. |
| **AT-ALGO-16** | Managing, spot crosses **body** → `side=far`, re-invert, tape names the side. |
| **AT-ALGO-18** | **Live** Algo ticks without Demo. Demo is a clock. Non-demo no-op is a **fail**. |
| **AT-ALGO-19** | Expected move is **not** an input to `trail_level`. |
| **AT-ALGO-20** | Rearm: width unchanged; flag if debit ∉ 5–10% of width. |
| **AT-ALGO-21** | Batman: far-side shorts under 5–10¢ named. No order. |
| **AT-ALGO-22** | Managing paints **computed and legacy** lines together when both are representable. |
| **AT-ALGO-T1** | Trigger formula is **unnamed**; characterization from observed entries. Manual confirm is a named stand-in. |

---

## 18. Files (when BUILD — after Coach Phase 5)

| Path | Role |
|------|------|
| This spec | Law |
| `AlertBuilderDialog.tsx` | Algo type; one Reason; legacy knobs; no two-stop Reasons |
| `AnalyzerControlsColumn` **+** | Pulse when eligible / Armed |
| `HostPnLChart.tsx` | High-water, computed guide, legacy taper, overlay, HUD |
| `web/lib/options-lab/algoTrailMath.ts` | Gate, legacy `S`, invert, threaten |
| `web/lib/options-lab/algoEval.ts` | **Live and Demo** tick; Demo is not an eval gate |
| New: profit-at-risk / `k` | Only after §14 evidence **or** behind “proposed” dual-line |
| Trader Feed host `algo-reason` | ALGO-R1 |
| `analyzerAlertsAdapter.ts` | `trigger.family: "algo"` |

Do **not** start this packet until Coach marks this spec **BUILD AUTHORITY**.

---

## 19. Changelog

| Ver | Date | Notes |
|-----|------|--------|
| **v2.0** | 2026-09-02 | Seats Coach **Arming and Trade Management**. States Armed / In trade / Managing. Advisory guide; no automatic exit. GEX as management. Dynamic trail proposed; legacy taper is fallback and the second teaching line. Rearm + convexity-band flag. Batman free-wing alert in. Live eval is law (as-built Demo-only named as gap). v1.0.16 SUPERSEDED as product law; kept as as-built. **DL-660**. |
| **v1.0.16** | 2026-08-21 | See v1.0 spec changelog (HUD Profit through W1–W4). |
