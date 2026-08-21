# FatTail Labs — Options Lab Analyzer Algo Alert Spec v1.0

**Status:** DRAFT — Coach 2026-08-21 (Analyzer Algo alert). **v1.0.10** house Reason **base prompt** is in-place admin on Alerts Manager (`/app/alerts`). **v1.0.9** one **Reason** for the whole trail; markdown prompt; T Ortho–similar narrative floater (**ALGO-R1**). Supercedes two-stop hold/fold (**DL-484**). **v1.0.8** Start/End Trail % boxed with Decay. **v1.0.7** HUD only while Live + Armed. **v1.0.6** High / Trail / Stop HUD. **v1.0.5** trail % = **give-up of profit** (`S = (1−g)×H`). **v1.0.4** no narrative on the Algo panel (**ALGO-N1**). **v1.0.3** add fly after Time Machine day (**ALGO-TM1**). **v1.0.2** floor default **25** (DL-482) · knobs are law · Recorded `mode`. **v1.0.1** review fold (ALGO-B1 far-side regime · ALGO-A1 monotone `f` · ALGO-A2 pulse hysteresis). Not BUILD AUTHORITY until Coach Phase 5.  
**Type:** Product Spec — Analyzer **Algo alert** (dynamic trailing narrative on an OTM butterfly).  
**Short name:** AZ-ALGO  
**Route:** `/app/options-lab/analyzer`  
**Parents:** [Alert Builder Spec v1.0](./FatTail-Labs-Options-Lab-Analyzer-Alert-Builder-Spec-v1.0.md) (AZ-ALB) · [Alerts Manager Spec v1.0](./FatTail-Labs-Alerts-Manager-Spec-v1.0.md) (ALM) · Analyzer Spec v0.2 · OPF Truth / Elegant Failure (DL-309) · Keep-Warm Spec v0.1 · Human Interface Spec v1.0 · North Star Member Ethos v1.2  
**Does not:** close, stop-out, or send a broker order. Does not implement the Labs-wide Alerts Manager. Does not copy MSC Trailing / 0DTE placeholder tabs.

---

## 0. Coach intent (do not drop)

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
11. **The algo alert should show the values that are important to track, and display them in the lower left corner just above the $0 line.** Top: **High** (highest unrealized gain). Then **Trail** (% value of the trail). Then **Stop** (**ticker price** `x_S`). Colons line up. **Only while the algo is active** (Live and Armed). Hidden while Waiting, Idle, Touched, or Recorded.
12. **Reason (2026-08-21, verbatim — do not drop · ALGO-R1 · DL-510):**

> I want to change the scope of the reason feature and make the scope now apply to the entire trail time range, while it is in effect. So there will be a single Reason checkbox and I want it placed at the top of the group box to the right of the title "Trail Settings" when checked it will open a field under the Title and above the start Trail %. It will be a small editable box that accepts text and understands markdown. The AI model will be active based on the declarations in this prompt during the period of effectivity. The thing it affects is not the alert itself, but a narrative floater that should appear when the Reason is checked and there is a prompt. The narrative box is similar to the narrative box in the "T Ortho" view in Surface. The assumption with prompts in this field is that the AI knows the current settings of the Algo alert, understands the strategy it is used for "The 0DET OTM Butterfly" and can access the Heatmap raw data, to make inferences in the current market condition that might affect the outcome of this position with regard to potential profit.

    Supercedes the two per-stop Reason boxes (**DL-484**). Product name of the strategy is the **0DTE OTM butterfly** (§3). Tango / Hotel on “potential profit” sit in **§10**.

13. **Prompt scope (2026-08-21, verbatim — do not drop · ALGO-R1):**

> Let's talk about the scope of prompts that coulds be used. The checking of the box is enough to start a basic narration in the floater. The prompt might include special instructions that focus the narration on a specific market condition, or specific trader concern, that modifies the narrative, but does not dibert the narrative from its primary purpose.

    Qualifies §0.12: **Reason checked** mounts basic narration. A prompt is **optional focus**, not a gate. Primary purpose remains §0.7 / §9.2.
14. **House base prompt (2026-08-21, verbatim — do not drop · ALGO-R1 · DL-511):**

> The Alerts Manager is a manager for all users. However like many features, there's in-place editing for features. And this is just such a case.

    Admin-only **base prompt** for Algo Reason. Edited **in place** on the member Alerts Manager (`/app/alerts`) — Dual Surface production URL, not a second `/admin` page. Members never see the editor.

Tango / Hotel notes sit in **§10** beside this text. They do not delete it.

---

## 1. Job of the algo

The algo’s job is **stay-in / don’t-give-back**:

| Stay in | Don’t give back |
|---------|-----------------|
| Hold the fly while it still has room so a runner can remain a runner | Narrate the trail and **stop evaluating** when giving it back would be more than they should lose |

**Distribution (Coach):** most of these **clip small**; a few **bank the run**. The product is not trying to make every fly a homer.

**What “stop” means here:** a **narrative and record** event. The **position stays on the book**. No Tradier, no close, no order. The member still owns Close / Trade Log on the card.

---

## 2. Relationship to other specs

| Spec | This document |
|------|----------------|
| **AZ-ALB** | Apply chrome, holder Idle/Live/Touched, floatable Builder, Manager hook. This spec **fills Type → Algo** (AZ-ALB §4.5 was a placeholder). |
| **ALM** | `alert_class: algo`. Analyzer remains a **client**. Evaluation may run in the Analyzer adapter until Manager GO. |
| **OT-EF / DL-309** | Debit, P&L, greeks, trail invert: **OPF-held chain and package quote only**. Representable or **named state**. Never invent a debit or a trail underlier. |
| **Keep-Warm** | Trail math and narrative follow Working / Away / Idle. Pulse is **paint-only** on last geometry. Idle = no heavy resolve. |
| **Arch 28** | One market WebSocket. No client Massive. GEX / VP / marks from the bus + OPF. |
| **T Ortho egg** | **Visual reference** for the Reason narrative floater (floatable glass, drag, play-by-play). Analyzer uses **dark-pinned HI tokens**, not a copy of T Ortho hex / position-list / tape prefs. Do **not** share T Ortho’s `localStorage` key. |
| **Heatmap** | Reason AI may **read** OPF-held Heatmap / dual-side chain already on the plane (Arch 28). It does **not** draw on the Heatmap page and does **not** open a second Massive path. |

**Apply kind:** `kind: position` (bound card) + `alert_class: algo`. Not a third canvas right-click menu. Canvas Price / Position **threshold** grammar is unchanged.

---

## 3. Who it binds to

**In v1:** one **long OTM butterfly** (debit) on the Analyzer book.

| Must | Law |
|------|-----|
| Structure | Listed **butterfly**: three strikes, same right, quantities **+1 / −2 / +1** (body is the short). Placement is OPF-listed only (`listedStructure`). |
| OTM | **Call fly:** body strike **>** spot. **Put fly:** body strike **<** spot. ATM body (nearest listed to spot) is **not** this algo. |
| Debit | Package is a **debit** (entry debit > 0 from OPF package / card entry). Credit / short flies are **out**. |
| Bound | `position_id` resolves to a book card (Shown or Hidden). Hidden stays bound. Unbound → holder **Unbound**, never Live-evaluable, no canvas geometry (AZ-ALB §2.5). |

**Out of this algo (v1):** BWB, Batman-as-a-whole, condor, iron fly, vertical, ATM fly, credit fly, multi-card books as one algo. Member may still author **threshold** alerts on those cards.

**Eligibility helper (normative name):** `isOtmDebitButterfly(card, spot)` — listed shape + OTM vs **raw** underlier mark (not smoothed display) + debit > 0. If OPF cannot price the debit → **not eligible** (named, not invented).

---

## 4. Create path

### 4.1 Subtle flash on **+**

When **at least one** book card is eligible (§3):

- The inspector Alerts **+** (`analyzer-alert-create`) **pulses subtly** (tint, not a seizure, not a banner essay).  
- Pulse **stops** when no eligible card remains, or when an Algo alert is already Live on that card.

**AT-ALGO-1.**

### 4.2 Click **+** while eligible

Opens the **floatable Alert Builder** (AZ-ALB §4 / DL-470) with:

| Seed | Value |
|------|--------|
| Type | **Algo** |
| Position | Focused card if eligible; else the only eligible Shown card; else first eligible book card |
| Copy | **Describes what it will do** (read-only, §5.1) |
| Knobs | Defaults in §5.2 |

If **+** is clicked with **no** eligible card: existing AZ-ALB law (Type = Price, value = Spot). Member may still switch Type → Algo; Save stays off until a valid bind.

**ALGO-TM1.** Time Machine does **not** require the fly before the day. Member may pick the day (clock + scale at session open), **add the position afterwards**, then Create Alert. Builder ATM, OTM eligibility, and Demo ticks use the **playhead** (open when parked). Demo defaults **on**; Save does **not** turn What-if on when Time Machine already owns the clock. Same sequence as a live session ([AZ-ATM **ATM-A1**](./FatTail-Labs-Options-Lab-Analyzer-Time-Machine-Spec-v0.1.md)).

Canvas right-click does **not** author Algo (stays Canvas / Position threshold).

---

## 5. Alert Builder — Algo

Title: `{SYMBOL} — Algo Alert` (AZ-ALB §4).

State control: **Live / Idle** only. Touched is evaluation (AZ-ALB §4.0). After a **Recorded** exit, Builder shows the stamp + **Reset to Live** (starts a **new wait-for-entry**, does not resume a dead trail).

### 5.1 Description

**ALGO-N1.** Coach: **remove the narrative from the Algo Alert panel.** Type → Algo shows **knobs only** (and the empty-state bind copy when no eligible fly). No description paragraph **on the Builder**. Trail **lines**, holder Waiting / Armed / Recorded, and Demo stay. The T Ortho–similar play-by-play window is **not** a standing viewport chrome. It mounts under **ALGO-R1** (**Reason checked** — a prompt is not required) — §9. Original §0.7 window remains Coach intent; **ALGO-R1** is when it is shown.

A short, calm paragraph **the algo already knows** (specified, not shown on the panel). Sentence case. **No profit claims** in this Labs copy (Tango §10). It must say, in member language:

- This is a **narrative trail** on this **OTM butterfly**. It will **not** close the position.  
- It **waits** until unrealized gain reaches **{entryPct}% of the debit**, then **arms**.  
- The trail sits at **{trailStartPct}% of the high-water** unrealized gain, **ratchets** with new highs, and **tightens toward {trailFloorPct}% by last-trade**, paced by **premium decay**.  
- Two **dashed** verticals (high-water and trail); optional band between them **pulses** if spot **threatens** the trail.  
- If spot **exits the trail**, the alert **stops and records**.

Defaults fill the blanks (75 / 75 / 25). Updating a knob updates the paragraph.

### 5.2 Minimal controls

| Control | Default | Law |
|---------|---------|-----|
| Position | Eligible card (§4.2) | Dropdown: eligible OTM debit flies only. Empty → Save off + named “Specify an OTM butterfly.” |
| Start profit management (% unrealized gain) | **75** | 1–100. **Always shown** on Type → Algo. Starts when unrealized gain reaches this percent of the **debit**. |
| **Trail Settings** group | — | Tinted box (**DL-504**). Title **Trail Settings**. One **Reason** checkbox **to the right of that title**. Start Trail %, End Trail %, Decay EoD (and datetime if off) stay **inside** the box. |
| **Reason** | **Off** | **ALGO-R1 · DL-510.** Single checkbox. Scope = the **entire trail time range while it is in effect** (Armed). **Checked** → basic narration in the floater (prompt not required). On also opens a small markdown field **under the title, above Start Trail %**. Prompt = optional **focus** instructions (§5.4). Does **not** change the trail engine, arm, Recorded, or the position. Supercedes two Reason boxes on Start/End (**DL-484**). |
| **Start Trail %** | **75** | Chrome for give-up at arm. 1–100. Must be **> end**. How much of high-water **profit** you can give back at arm (`S = (1−g)×H`). No Reason checkbox on this row. |
| **End Trail %** | **25** | Chrome for give-up when decay ends. 1–99. Give-up fraction when **decay ends** (tighter). No Reason checkbox on this row. **DL-484** two-stop Reasons **out**. |
| Decay ends | **End of day** | Optional. Blank / “End of day” = this session’s last trade (index **16:15 ET**, equity **16:00 ET**). A datetime **stops the dynamic decay** there (`f = fMin`). Alert expiration (AZ-ALB) is a separate control. **DL-483**. |
| High-water line color | Tag **target** | Assignable. Canvas vertical. |
| Trail line color | Tag **warning** | Assignable. Canvas vertical + overlay tint. |
| Overlay between lines | **Off** | Optional. Transparent band; densifies + pulses on threaten. |
| **Demo** | **Off** | Outside RTH / future expiry: two Demo clocks. **What-if:** Save may turn What-if on; move **Spot**, **Time**, and **Vol** to arm and trail (**FI-033** · **DL-485**). **Time Machine:** pick a calendar day, download the minute path, play it; eval uses that day’s **price and time** ([AZ-ATM](./FatTail-Labs-Options-Lab-Analyzer-Time-Machine-Spec-v0.1.md) · **DL-486**). Time Machine playhead wins when engaged. Trail eval is always the **built-in** engine. Reason, if on, still only drives the **floater**. |
| Trigger / tags / expiration | AZ-ALB shared | `behavior` stamps **once_only** for this class (one recorded exit per arming). Alert expiration optional. Trail **decay** uses Decay ends (default EoD), not the option’s last-trade days later. |

No condition dropdown, no ± underlier target, no MSC Trailing / 0DTE / Break-Even tabs. **Save on** when bind is eligible and OPF can name a debit.

### 5.3 Hook draft

`upsertAlert` with:

| Field | Value |
|-------|--------|
| `alert_class` | `algo` |
| `kind` / `surface_type` | `position` |
| `position_id` | Card id |
| `trigger.family` | `algo` |
| `trigger.algo` | `{ variant: "otm_fly_trail", entry_pct, trail_start_pct, trail_floor_pct, decay_end, reason_on?, reason?, overlay, high_water_color, trail_color }` (`decay_end`: `"eod"` or ISO datetime). `reason_on: true` when the checkbox is on (floater + basic narration). `reason` is optional markdown **focus** when non-blank; **omit** when blank. Does **not** select the trail engine. `trail_stop_reason` / `trail_end_reason` are **superseded** (do not write; ignore if still on an old record). |
| `title` | Process line, e.g. `{SYMBOL} OTM fly trail` — **no profit claim** |
| `behavior` | `once_only` |
| `severity` | `medium` (stamped) |

Adapter grows `trigger.family: "algo"` (today’s `"placeholder"` is **superseded** for this variant).

### 5.4 Reason chrome (**ALGO-R1**)

Inside the **Trail Settings** group (testid `algo-trail-range`):

| Law | |
|-----|--|
| Count | **One** Reason checkbox. **Not** on Start Trail % or End Trail %. |
| Seat | Top of the group, **to the right of the title** “Trail Settings”. |
| Field | Checked → a **small** editable box opens **under the title and above Start Trail %**. Unchecked → field hidden. The field may stay **empty**. |
| Text | Accepts member text. **Understands markdown** (CommonMark). testid `algo-trail-reason`. Checkbox testid `algo-trail-reason-on`. |
| Save | Checkbox → `reason_on: true`. Trimmed non-empty string → `trigger.algo.reason`. Whitespace-only → omit `reason` (basic narration still on). Off → omit both. |
| Engine | **No effect.** Built-in trail math always. Reason does not hold, fold, arm, or Record. |

**Period of effectivity:** the **entire trail time range while the trail is in effect** — **Armed** until Recorded or Idle. Waiting is not yet the trail. The model is active in that window.

**What it affects:** **not the alert.** A **narrative floater** on the Analyzer canvas, similar to Surface **T Ortho** (`TimeOrthoEggPanel`). Mount law is §9.

**Prompt scope (ALGO-R1):**

| Kind | Law |
|------|-----|
| **Checkbox only** | **Enough** to start **basic narration** in the floater. Standing context below. No extra instructions. |
| **Optional prompt** | Special instructions that **focus** the narration on a **specific market condition** or **specific trader concern**. They **modify** the narrative. They **do not divert** it from its **primary purpose**. |
| **Primary purpose** | §0.7 / §9.2: play-by-play of **underlying market structure** for this **0DTE OTM butterfly** on this trail (GEX if on, VP if engaged else omit, greeks / debit / gamma risk / probabilities, Heatmap raw on the plane, decay, stay-in / don’t-give-back). Not a second product, not a chat, not a close. |
| **Divert (forbidden)** | Prompt that replaces the trail story with unrelated Q&A, a different structure, a broker action, or a profit claim as Labs copy. Named ignore + keep basic narration. |

**Model assumptions** (standing context — always, whether the prompt is blank or not):

- Current Algo **settings** (entry %, start/end trail %, decay end, Demo / clock).  
- The strategy is **the 0DTE OTM butterfly** (Coach: “The 0DET OTM Butterfly”).  
- It **can access Heatmap raw data** already on the plane (OPF-held dual-side chain / heatmap cells — Arch 28, no extra Massive).  
- It may **infer current market condition** that might affect the **outcome of this position with regard to potential profit**. Labs **chrome** still speaks process (§10). The model must not invent a debit, strike, or package mark (DL-309).

### 5.5 House base prompt (in-place on Alerts Manager)

**Seat:** `/app/alerts` — the Alerts Manager **all members use**. Administrator in **edit mode** (HI Spec §7.3 · Dual Surface v1.0: **production URL is the editor**). Not `/admin/*`. Not Analyzer Builder.

| Law | |
|-----|--|
| Who sees the editor | **Administrator** in edit mode only. Members see the ordinary Manager (stats, index, settings link). No locked “admin” strip for non-admins. |
| What they edit | One **base prompt** (markdown) for Algo Reason **basic narration**. House copy. Same primary purpose as §5.4. |
| Chrome | In-place affordance (edit toolbar / field), Member dialect page. Does **not** restyle `/app/alerts` as Operator `/admin` density (**AT-ALM-12** still holds for the member view). |
| Persist | Admin-authorized API; field allowlist server-side. Active base is what the model loads. |
| Member focus | Analyzer Trail Settings `reason` still **optional focus** on top of this base. Focus may modify; it must not divert. |
| Empty base | Named fail-open: local §9.2 sentences. Do not invent house copy. |

**Stack the model sees (Armed, Reason on):**

1. **House base** (this field, if set)  
2. **Member focus** (`reason`, if set)  
3. **Standing context** (Algo knobs, 0DTE OTM butterfly, Heatmap on the plane)

---

## 6. Phases

Map onto holder Idle / Live / Touched. Subtitle carries the phase.

| Phase | Run state | Meaning |
|-------|-----------|---------|
| **Idle** | Idle | Member paused. No eval, no pulse, last paint may keep last lines. |
| **Waiting** | Live | Eligible, Live, **not yet armed**. Watching unrealized vs entry threshold. **No trail geometry** yet (no lying lines). Narrative may speak. **+** not flashing for this card. |
| **Armed** | Live | Unrealized reached entry threshold. High-water + trail live. Overlay if on. Field `side: near \| far` (§7.4). |
| **Recorded** | Touched | Spot **exited the trail** (near or far). Eval **stops**. Result **recorded**. Pulse off. Lines **freeze** at last pair. Reset → Live starts **Waiting** again (clears high-water and `side`). |

Waiting and Armed are both **Live** (member-settable). Recorded is **Touched** (evaluation-only, AZ-ALB §4.0 / DL-468) **plus** a result payload. Holder subtitle: `Waiting · {unrealized} vs {threshold}` · `Armed · trail {f}%` · `Armed · far wing` when `side=far` · `Recorded {time ET} at {print}` · **`Recorded · demo`** when payload `mode` is `demo_whatif` or `demo_timemachine`. Demo exits must never be indistinguishable from live exits in history.

---

## 7. Math (normative)

Use **raw** underlier mark and **OPF package P&L** (same honesty as alerts eval — not the smoothed display spot). τ / last-trade = Labs clocks (`remainingLastTradeHours`: index **16:15**, equity **16:00**). Not a ToS 1-calendar-day floor.

### 7.1 Debit and unrealized

| Symbol | Meaning |
|--------|---------|
| `D` | Entry **debit** of the fly (dollars, positive). Card entry if set; else OPF package debit at create. If unpriceable → named WAITING, do not arm. |
| `U(t)` | Unrealized P&L of the **bound card** at `t` (package mark − entry). |
| `entryPct` | Member entry fraction (default 0.75). |
| Arm when | `U(t) ≥ entryPct × D` |

### 7.2 High-water

Once Armed:

`H(t) = max U(s)` for `s` in `[armedAt, t]`.

`H` **never decreases** while Armed. New high → trail **ratchets**.

**High-water underlier `x_H`:** the **raw spot print at the moment `H` last increased**. The high-water **vertical** is at `x_H` (not the theoretical tent peak, not the body strike).

### 7.3 Trail fraction `f(t)`

Defaults: `f0 = trail_start_pct` (0.75), `fMin = trail_floor_pct` (0.25).

`f` starts at `f0` at **arm**. At **decay end** (default **EoD** this session), `f = fMin`. Specifying nothing uses EoD. A member datetime stops the dynamic decay at that instant.

**Path (premium decay, not a flat clock):**

Let `E(t)` = remaining **package extrinsic / time value** of the fly from OPF T+0 (named WAITING if unmeasured — **hold last `f`**, do not invent).  
Let `E_arm = E(armedAt)`.  
Let `decay = 1 − clamp(E(t) / E_arm, 0, 1)` when `E_arm > 0`; else treat decay as **clock-only**.

Let `clock = 1 − clamp(remainingToDecayEnd / remainingToDecayEnd_at_arm, 0, 1)`.
Default decay end = session last-trade today (EoD). Optional `decay_end` ISO replaces that wall.

```
f_decay = f0 + (fMin − f0) × decay
f_clock = f0 + (fMin − f0) × clock
f_raw   = clamp( min(f_decay, f_clock), fMin, f0 )
f(t)    = min( f(t⁻), f_raw )     // ALGO-A1: running minimum while Armed
```

At arm, `f(t⁻)` is `f0`. **Law:** decay may **tighten earlier** than the clock. The clock **guarantees** `fMin` at last-trade. While Armed, `f` is **monotone non-increasing** — an IV pop that raises `E(t)` must **not** loosen `f` or retreat `S`. Nothing loosens until **Reset**. `f` never goes below `fMin` or above `f0` while Armed.

After last-trade (Held / closed session): `f` stays at `fMin`; Armed may continue on last print (Keep-Warm Held honesty — do not claim a live fire that did not happen).

### 7.4 Trail dollar and underlier

**Coach ruling (v1.0.1 — ALGO-B1):** option **(a)** with the refinement — *the geometry mirrors, the narration doesn’t.* One trail vertical that **re-inverts** when spot crosses the body. Not two simultaneous lines. Not silence on the far wing.

**Give-up (Coach):** trail % `g(t)` is how much of **high-water profit** you can give back — not a keep-fraction, not total package value. **75% trail → keep 25% of H.** **25% trail → keep 75% of H.**

```
S(t) = (1 − g(t)) × H(t)
```

`g` starts at `trail_start_pct` (0.75) and decays to `trail_floor_pct` (0.25) by decay end, so the **stop rises toward H** (tighter) as the session burns. New highs raise `H`; `S` is recomputed at the current `g`. `H` and `S` **carry across** a side flip; only the underlier mapping changes (ALGO-A1: `g` does not loosen on the flip).

Prior formula `S = f × H` treated 75% as keep-75% (give up 25%) — **opposite**. Superceded.

**Trail underlier `x_S`:** invert the **T+0** curve of the **bound card** for P&L `= S`. A fly tent often has **two** crossings. Field `side: near | far` (default **near** at arm).

**Near-side** (spot has not crossed the **body strike** since arm, or has recrossed back):

1. Prefer the crossing that lies **between current spot and `x_H`**.  
2. Else the crossing **spot would recross to give back** (for a long OTM fly that has been running **toward the body**, that is the crossing **away from the body**, back toward entry).  
3. Exit direction: through `x_S` **away from the body** (leave the band `{x_H, x_S}` through the trail).

**Far-side regime (ALGO-B1):** when **spot crosses the body strike** while Armed, `side → far`. Re-invert to the **far** T+0 crossing — P&L `= S` **beyond the body**. Exit direction **flips**: exit = spot continuing **away from the body** through the far `x_S`. Near the peak both crossings tighten toward the body (little room on either side — the geometry telling the truth). Band, overlay, and threaten use the pair `x_H` and **far** `x_S` unchanged.

A recross **back through the body** returns `side → near` and re-inverts. That is the trail **following the position through the tent**, not churn. Each flip is a **narratable event** (§9.2).

**Invert missing (near or far):** **do not draw** a lying trail line; named state on the narrative; **last paint** of a prior good `x_S` may remain (OT-EF). **P&L backstop** when invert is not representable: exit when `U(t) < S` with a named “trail by P&L; underlier not listed.” Do **not** use the P&L backstop while a representable `x_S` exists and spot is still inside the band.

**Exit:** spot **crosses `x_S` in the give-back direction for the current `side`**. Then phase → **Recorded**. Payload `exit_side` = that `side`.

### 7.5 Threaten

Let `G` = |`x_H` − `x_S`|. If `G` ≈ 0, no overlay.

Let `d` = distance from spot to `x_S`, clamped to the band.

- **Opacity** of the overlay **ramps** as spot approaches `x_S` (0 at `x_H` side, higher near trail).  
- **Pulse on** when spot is in the **last 20% of `G` toward the trail**.  
- **Pulse off** when spot is **outside the last 25% of `G`** (ALGO-A2 hysteresis — no strobe on a print oscillating at the tripwire).  

Overlay **tint = trail line color**. Pulse is canvas alpha on last geometry (Keep-Warm: Idle does not re-resolve).

---

## 8. Canvas draw

**Only while Waiting/Armed/Recorded on a bound eligible card.** Unbound / Idle-with-no-prior-geometry: nothing invented.

| Element | Law |
|---------|-----|
| High-water | **Thin dashed** vertical at `x_H`. Color = member high-water color. |
| Trail | **Thin dashed** vertical at `x_S`. Color = member trail color. |
| Overlay | **Optional.** Fill between the two verticals, trail-color at low alpha. Off by default. On + Armed/Recorded. **More opaque + pulse** when threatening. Off or frozen after Recorded (no pulse). |
| Waiting | **No** high-water / trail / overlay (entry not met). |
| Recorded | Lines **freeze** at last `x_H`, `x_S`. Overlay static if it was on. |
| Threshold alerts | Unchanged (Idle dashed / Live solid+glow). Algo lines are **always thin dashed** — they are not threshold Active solids. |

Pan/zoom moves them with the view. Do not steal left-drag pan or strike handles.

**AT-ALGO-8.**

---

## 9. Narrative window

### 9.1 Chrome

**ALGO-N1 (panel):** no description paragraph on Type → Algo. Knobs only.

**ALGO-R1 (viewport):** the play-by-play **floater mounts** when Reason is **checked**. Checking the box is **enough** to start **basic narration**. A prompt is optional focus (§5.4). Unchecked → **not mounted**. Trail geometry still paints either way.

**Similar to** Surface T Ortho narration (`TimeOrthoEggPanel`): glass panel, **drag**, play-by-play body, on-screen clamp. **Not** a copy of that component’s position list, candle prefs, or T Ortho `localStorage` key. Body may **render markdown** from the model (and the member prompt is markdown).

| Law | |
|-----|--|
| Dialect | Dark-pinned work-surface **tokens** (same as Builder). |
| Drag | Header grab; remember position (`localStorage`, own key — do not share `ft_options_lab_narrative_pos_v1` with T Ortho). |
| Default seat | **Left of the canvas** (same family as Alert Builder default — next to **+**, not the far right). |
| No scrim | Graph stays live. |
| Appear | Reason **checked**, while the Algo is Live (Waiting or Armed) or Recorded (last tape). Hide on Idle. Prompt may be empty. |
| AI active | **Armed only** — the trail is in effect. Waiting may show the box with standing / waiting copy; the model does not run trail-life narration until Armed. Recorded: last tape, no new inference. |
| Prompt | Blank → basic narration. Non-blank → same narration **focused** on the named condition or concern. Must not divert from primary purpose. |
| Dismiss | Follows alert Idle (hide) / Recorded may **remain** with the last tape until Reset or navigating away. Esc does not kill the alert. Uncheck Reason → unmount. Clearing the prompt does **not** unmount. |
| Does not | Change alert state, `f`, `H`, `S`, Recorded, or the position. Fail-open: named “AI quiet” / local sentences, never a silent empty box while Reason is on. |
| testid | `analyzer-algo-narrative` |

### 9.2 Voices (honest layers only)

Play-by-play. **Omit** a layer when its overlay is **not engaged** — no “unavailable” filler.

| Voice | When | Content |
|-------|------|---------|
| **GEX structure** | Analyzer **GEX is on** | Underlier vs GEX map: call/put mass, zero-gamma / flip if the profile has it, where spot sits. OPF/GEX profile only. If GEX is **off**, this voice is **left out**. |
| **Volume Profile structure** | Analyzer **VP is engaged** | Position vs VP structural levels (POC, HVN/LVN, session profile) **only if** that overlay is on **this** Analyzer session. If VP is **not** engaged, **leave it out of the narrative entirely**. |
| **Algo / position** | Always while the window is shown | Greeks, **debit**, **gamma risk**, **probabilities**, trail phase (waiting / armed / threaten / recorded). Named **`side`**: near vs far. On flip: “spot is through the body; the trail now sits on the far wing at {x_S}.” OPF package greeks + remaining-session probability machinery already on Analyzer. Unmeasured → named state, not a number. |
| **Heatmap condition** | Reason on, **Armed** | Inferences from **Heatmap raw data** on the held plane (listed cells, GEX/heatmap values the suite already shows). Current market condition vs this **0DTE OTM butterfly**. Omit if Heatmap data is not held — named, not invented. |
| **Decay** | Armed | Copy **tightens with `f(t)`**. **Near:** fast burn → “session is spending the premium, trail is coming in.” Slow burn → “time is still cheap, trail hasn’t pinched.” **Far:** do **not** reuse near-side decay copy — “the move has outrun the structure; both sides of the tent are now give-back.” |

**Copy SoR:**

| Reason | Copy |
|--------|------|
| **Off** | No floater. Local sentences in `algoNarrative.ts` remain law for any later non-Reason use. |
| **On, prompt blank, not yet Armed** | Floater mounts; **basic** waiting copy; no trail-life model tick. |
| **On, prompt blank, Armed** | **Basic narration** from the **house base** (§5.5) plus standing context (Algo knobs, 0DTE OTM butterfly, Heatmap raw, §9.2 voices). Empty house base → local sentences + named “AI quiet”. |
| **On, prompt present, Armed** | Same basic narration, **focused** by the member prompt (market condition or trader concern). Must not divert from primary purpose (or from the house base). T Ortho `/api/me/options-lab/session-note` family is a **shape** reference, not a shared store. |

Cadence: Keep-Warm Working / Away. Not 1s. Threaten/pulse is visual; the window may say “spot is threatening the trail” on the next allowed tick. The model does **not** have to fire every Keep-Warm tick — bounded, not a chat.

**Near-side vs far-side are different market stories (ALGO-B1 narration):** near-side is decay-and-retreat (run stalling, premium bleeding, spot drifting back toward entry). Far-side is momentum overshoot (market paid maximum P&L at the body and **continued** — the regime that made the fly work is often ending). GEX, when on, should sound different: on the far side spot has typically **crossed structure** (flip / call wall) rather than merely faded from it. Deterministic sentences; VP/GEX still omit-when-off.

### 9.3 Recorded tape

On exit the window **records the result** in the same voice (process facts): high-water, trail at exit, `f`, spot, time ET, debit, **`exit_side` (near \| far)**, whether entry had armed. **No** “you booked a winner.” Near vs far are different lessons (“faded off the high” vs “blew through the tent”) — name the side, do not verdict the P&L. Then the alert **stops** (§6 Recorded).

---

## 10. Language (Tango + Hotel sit beside Coach)

**Coach (§0.8) is the job:** keep them in to **maximize profit** so long as they do not **lose more than they should**; **most clip small, some bank it.**

**Tango (member-facing copy — labeled):** Labs chrome, titles, notifications, and the narrative window speak **process** (waiting, armed, high-water, trail %, threaten, recorded, decay). They **do not** promise P&L, “maximize profit,” or “bank it.” Coach’s Reason assumption includes **“potential profit”** as the *subject of inference* — that is the job of the model, not a Labs headline or notification. A member-authored entry % is their telemetry (AZ-ALB §7). Invariant #8 / ALM #5 still govern what **Labs** says.

**Hotel:** gamma / debit / probability / GEX / VP / **Heatmap** lines are **measurements on the OPF-held plane** (and engaged overlays). Do not invent a greek, a wall, a VP node, or a heatmap cell. Wrong structure in this window is **severity: high** (capital-adjacent judgment). Reason AI **reads** the held Heatmap; it does not mint a second chain.

**Victor / Whiskey (opinion, not a block):** the trail is a **via negativa** on give-back, not a forecast of the right tail. The right tail is allowed by **staying in**; it is not predicted.

---

## 11. Evaluation until Manager

Client adapter evaluates this class (same era as AZ-ALB §6). Once Manager GO’s, Analyzer **subscribes**; it does not keep a second bus (AT-ALB-9 family).

| Must | |
|------|--|
| Raw mark | Underlier for `x_H`, exit, threaten. |
| OPF package | `U`, `D`, `E`, greeks. |
| Idle | No heavy resolve (Keep-Warm). |
| Held | Last print; do not claim a live cross that occurred only on a smoothed display. |
| One WS | Arch 28. |

---

## 12. Recorded result (payload)

Stored on the alert (session stub today; Manager `trigger` later). Minimum:

| Field | |
|-------|--|
| `armed_at` | ISO |
| `recorded_at` | ISO |
| `high_water_pnl` | `H` |
| `high_water_spot` | `x_H` |
| `trail_pnl` | `S` at exit |
| `trail_fraction` | `f` at exit |
| `trail_spot` | `x_S` at exit |
| `exit_spot` | raw print |
| `exit_side` | `near` \| `far` (ALGO-B1) |
| `debit` | `D` |
| `entry_pct` | as armed |
| `mode` | `live` \| `demo_whatif` \| `demo_timemachine` — provenance of the clock that recorded. Demo exits **must not** look like live exits in history. Holder subtitle **`Recorded · demo`** for the two demo modes. |

Holder + Builder + narrative read this. **Reset to Live** clears it.

---

## 13. Ideas inventory (Phase 0 — nothing dropped)

| Idea | Seat |
|------|------|
| Narrative trail, not a broker stop | **IN-SCOPE** |
| OTM butterfly only; + flash; Builder opens on Algo; describes itself | **IN-SCOPE** |
| Entry 75% of debit; trail 75% of high-water; ratchet | **IN-SCOPE** |
| `f` 75% → 25% by last-trade (defaults; member-configurable, DL-482) | **IN-SCOPE** |
| Two thin dashed verticals, assignable colors | **IN-SCOPE** |
| Optional overlay between lines; densify + pulse on threaten; exit records | **IN-SCOPE** |
| T Ortho–similar narrative window | **IN-SCOPE** (chrome reference; HI tokens). **Mounts under ALGO-R1** (Reason **checked**; prompt optional). |
| Single Reason on Trail Settings; checkbox starts basic narration; optional markdown focus | **IN-SCOPE** · **ALGO-R1** · **DL-510** |
| Two Reason checkboxes on Start/End trail stops; AI hold/fold of alert state | **SUPERSEDED** · **DL-484** by **DL-510** |
| GEX play-by-play; VP only if engaged else omit | **IN-SCOPE** |
| Heatmap raw data as Reason-AI context | **IN-SCOPE** (read held plane only) |
| Greeks, debit, gamma risk, probabilities | **IN-SCOPE** (OPF / Analyzer probability) |
| Narrative adjusts with decay rate | **IN-SCOPE** |
| Keep them in to maximize profit / most small, some bank | **IN-SCOPE as job (§0.8, §1)**; **Tango** on chrome copy (§10) |
| Verticals = underlier at high-water print + T+0 invert of `S` | **IN-SCOPE** (mapping from Coach’s “vertical”) |
| Threaten pulse = last 20% of the band | **IN-SCOPE** as default tripwire; **ALGO-A2** hysteresis off at 25% |
| Far-side regime: one trail that re-inverts through the body (not two lines; not silence) | **IN-SCOPE** · Coach ruling v1.0.1 ALGO-B1 |
| `f` running minimum while Armed | **IN-SCOPE** · ALGO-A1 |
| Overlay tint = trail color; default overlay **off** | **IN-SCOPE** |
| Analyzer VP **overlay** (suite VP page exists; Analyzer engagement as-built is **not** a VP overlay today) | **FLAGGED** — narrative **rule** is in; VP sentences stay silent until Analyzer VP is engaged |
| LLM session-note like T Ortho | **IN-SCOPE for ALGO-R1** (Reason checked, Armed). Fail-open named. Unconstrained session-note chat (**FI-032**) stays **FLAGGED**. |
| BWB / Batman / credit flies | **DEFERRED** |
| Horizontal P&L rails instead of (or plus) verticals | **FLAGGED** — Coach asked verticals |
| Actual close / Tradier stop | **OUT** |
| MSC Trailing / 0DTE / Break-Even tabs | **OUT** (stay placeholders) |
| Delete chrome | **OUT** (AZ-ALB v1) |

---

## 14. Out of scope

- Broker / Tradier / paper flatten.  
- Heatmap / Surface / VP **page** drawing these lines (Analyzer 2D only). Heatmap **data** for Reason AI is in (§5.4 / §9.2).  
- Labs-wide Manager HTTP schema freeze (adapter family `algo` is named; Manager GO still ALM).  
- Teaching the member a second empty-holder essay.  
- Profit-claim notifications.

---

## 15. Acceptance

| AT | Criterion |
|----|-----------|
| **AT-ALGO-1** | Eligible OTM debit fly on the book → Alerts **+** pulses. No eligible card → no pulse. |
| **AT-ALGO-2** | Click **+** while eligible → Builder Type **Algo**, bound to that card, knobs only (no description paragraph), Save **on** when debit is named. |
| **AT-ALGO-3** | **+** with no eligible card → Price / Spot (AZ-ALB). Type → Algo with empty eligible list → Save **off**. |
| **AT-ALGO-4** | Defaults: entry 75, trail start 75, floor 25, overlay off (placeholders; **member knobs are the law**, DL-482). |
| **AT-ALGO-5** | Waiting: no high-water / trail / overlay. Unrealized ≥ entry% × debit → Armed. |
| **AT-ALGO-6** | Armed: `H` ratchets; `S = (1−g)×H` (75% trail keeps 25% of profit); `g` follows §7.3 (decay may tighten early; `gMin` at last-trade). **ALGO-A1:** `g` is a running minimum — an `E(t)` rise must not loosen give-up or retreat `S`. |
| **AT-ALGO-7** | Two **thin dashed** verticals, member colors. Overlay optional between them. Pulse **on** at last 20% of `G` toward trail; pulse **off** at 25% (ALGO-A2). |
| **AT-ALGO-8** | Spot exits trail → Recorded (Touched + payload). Eval stops. Lines freeze. Position **not** closed. |
| **AT-ALGO-9** | **ALGO-N1:** no narrative paragraph on Type → Algo. Trail lines and holder phase stay. Viewport floater is **ALGO-R1**, not a standing mount. |
| **AT-ALGO-R1** | One **Reason** checkbox to the right of the Trail Settings title. No Reason on Start Trail % or End Trail %. |
| **AT-ALGO-R2** | Reason checked → small markdown field under the title, above Start Trail %. Unchecked → field hidden. Empty field still saves `reason_on: true`. |
| **AT-ALGO-R3** | Reason **checked** (prompt empty or not) → `analyzer-algo-narrative` mounts with **basic narration**. Unchecked → not mounted. Clearing the prompt does not unmount. |
| **AT-ALGO-R4** | Reason on does **not** change arm, `S`, Recorded, or the position. Built-in trail always. |
| **AT-ALGO-R5** | Model active only while the trail is in effect (**Armed**). Fail-open named, never a silent empty floater while Reason is on. |
| **AT-ALGO-R6** | A prompt **focuses** (named market condition or trader concern) and does **not divert** from primary purpose (§0.7 / §9.2). |
| **AT-ALGO-R7** | House base prompt is **in-place** on `/app/alerts` for administrators in edit mode. Members do not see the editor. Not `/admin`. Armed Reason uses house base then member focus. |
| **AT-ALGO-17** | **Live + Armed** Algo paints lower-left of the plot, just above $0: **High** (H) · **Trail** (g %) · **Stop** (ticker `x_S`). Colons aligned. Hidden unless Live and Armed. Host `data-algo-highest` / `data-algo-trail` / `data-algo-stop`. |
| **AT-ALGO-10** | Unpriceable debit / greeks / invert → named state, no invented mark (DL-309). Last paint may remain. |
| **AT-ALGO-11** | `upsertAlert` `alert_class: algo`, `kind: position`, `trigger.family: algo`. Hook only — no third store. |
| **AT-ALGO-12** | Idle / Keep-Warm: no 1s heavy resolve. Pulse is paint. Left-drag pan and strike handles unaffected. |
| **AT-ALGO-13** | ATM / credit / non-fly: not eligible. Unbound card: Unbound, no geometry. |
| **AT-ALGO-14** | Reset Recorded → Live starts Waiting, clears high-water. |
| **AT-ALGO-15** | Builder + narrative chrome: HI tokens, 44pt controls, no close-dot. Floatable Builder unchanged (AT-ALB-17). |
| **AT-ALGO-16** | Armed, spot crosses **body** → `side=far`, trail re-inverts to the far T+0 crossing, exit direction flips, narrative **names the side**. Recross body → `side=near`, re-invert. Far invert missing → same as near (no lying line, named state, P&L backstop). Recorded payload includes `exit_side`. |

---

## 16. Files (when BUILD — after Coach Phase 5)

| Path | Role |
|------|------|
| This spec | Law |
| `AlertBuilderDialog.tsx` | Algo type live; description + knobs; Save |
| `AnalyzerControlsColumn` **+** | Subtle pulse when eligible |
| `HostPnLChart.tsx` | Dashed pair, optional overlay, pulse |
| `web/lib/options-lab/` trail math | `isOtmDebitButterfly`, `f(t)`, invert, threaten |
| Narrative panel | Analyzer-hosted; T Ortho chrome **reference** only — not an import. Mounts under ALGO-R1. |
| `analyzerAlertsAdapter.ts` | `trigger.family: "algo"` |
| Tests | Eligibility, arm, ratchet, `f` decay vs clock, **`f` monotone (ALGO-A1)**, invert pick near+far, body-cross flip, exit `exit_side`, threaten hysteresis, omit-VP |

Do **not** start this packet until Coach marks this spec BUILD AUTHORITY. AZ-ALB canvas-apply lock vs viewport W-G does **not** block Builder/holder/+ pulse; **does** serialize `HostPnLChart` geometry with other viewport boards (India names the handoff, same as AZ-ALB §2.6).

---

## 17. Changelog

| Ver | Date | Notes |
|-----|------|--------|
| **v1.0.10** | 2026-08-21 | House Algo Reason **base prompt**: in-place admin on Alerts Manager `/app/alerts` (all-users Manager + Dual Surface edit). **DL-511**. |
| **v1.0.9** | 2026-08-21 | **ALGO-R1:** one Reason on Trail Settings (right of title); checkbox starts **basic narration**; optional markdown prompt **focuses** (does not divert) from primary purpose. Scope = whole trail while in effect. Affects a T Ortho–similar **floater**, not the alert. Heatmap raw as model context. Supercedes two-stop hold/fold **DL-484**. **DL-510**. |
| **v1.0.8** | 2026-08-21 | Chrome: **Start Trail %** · **End Trail %** · Decay EoD (and datetime if off) in one tinted box. Give-up math unchanged. **DL-504**. |
| **v1.0.7** | 2026-08-21 | HUD only while Live + Armed. **DL-500**. |
| **v1.0.6** | 2026-08-21 | Lower-left tracker above $0: **High** · Trail % · Stop. Colons aligned. **DL-498**. |
| **v1.0.5** | 2026-08-20 | Trail % is **give-up of profit**: `S = (1−g)×H`. 75% was inverted (kept 75%). **DL-497**. |
| **v1.0.4** | 2026-08-20 | **ALGO-N1:** remove the narrative from the Algo Alert panel (Builder copy + viewport window). Knobs, trail lines, holder states stay. **DL-495**. |
| **v1.0.3** | 2026-08-20 | **ALGO-TM1:** Time Machine day may load empty; add the fly afterwards, then Create Alert. Eligibility / Builder ATM / Demo use the playhead. **DL-492**. |
| **v1.0.2** | 2026-08-20 | Floor default **25** propagated (DL-482). Conformance fixtures parameterized on member knobs (defaults are placeholders, not law). Recorded payload `mode: live \| demo_whatif \| demo_timemachine`. **DL-488**. |
| **v1.0.1** | 2026-08-20 | Review fold. **ALGO-B1 Coach:** option (a) refined — *geometry mirrors, narration doesn’t.* Far-side regime: one trail re-inverts through the body; `exit_side`; AT-ALGO-16. **ALGO-A1:** `f` running min while Armed. **ALGO-A2:** pulse hysteresis 20%/25%. |
| **v1.0** | 2026-08-20 | Coach: OTM-fly narrative trail; + flash; Builder Algo; 75/75/20 decay; dashed verticals + optional overlay; T Ortho–similar window; GEX/VP/greeks; stay-in / don’t-give-back. |
