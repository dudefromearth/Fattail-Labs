# Batman — simple strategy configuration interface

**Status:** DESIGN NOTE (2026-08-15). Not BUILD AUTHORITY.  
**Purpose:** one small surface to **specify** the first test strategy (Method Spec §1a).  
**Not:** the 7-step Strategy Designer pack wizard. That stepper is for a whole butterfly pack. This Batman lock is a **handful of laws**.  
**HIG:** Human Interface Spec — grouped inset list, tokens, no ad-hoc chrome. Echo owns the look; Charlie does not invent controls.

---

## Principle

**Law is displayed. Only opens are edited.**  
**The card is the hold/fold policy.** We **replay the day**. At **each
instance** the configuration decides **hold or fold** (Coach 2026-08-15 ·
Method Spec §1a.2).

An instance = one gold snapshot (clock + chain + marks). After the 15:45
entry, every later instance runs the same policy. MC varies **fills**; the
policy does not change mid-tape.

Coach already locked entry time, next expiration, 20-wide both sides, $1 / $2 / $210, PM trigger, % thumb-rules, tent walls, attached side. Those are **facts on the card**, not empty fields a member can wander.

The existing Design stepper (`StrategyDesigner` · pack `ui.py` 7 sections) would bury this under Identity / Structure / Risk / Edge / Timing / Exits / Review. **Do not use that stepper for this test config.**

---

## One card, three bands

```
┌─ Batman · next expiration ─────────────────────────────┐
│  Law (read-only)                                       │
│  Open (the only controls)                              │
│  Profit management (read-only + pointer to Trade Feed) │
│  At each instance → Hold or Fold                       │
└────────────────────────────────────────────────────────┘
```

### Band 1 — Law (inset grouped list, not inputs)

| Row | Value |
|-----|--------|
| When | Mon–Fri **~3:45 PM Eastern** |
| Expiration | **Next expiration** (Fri → Monday = **3 DTE**) |
| Structure | **20-wide call fly** + **20-wide put fly** · listed strikes · each fly **atomic** |
| Debit / side | **≤ $1** |
| Package | **≤ $2** · slip fudge **$210** cash · target **$2** |
| Subject of PM | The fly **price attaches to** (call or put). Not the Batman as one blob. |

No steppers. No “width style: variable.” Typography + disclosure if they want the Friday 3 DTE sentence.

### Band 2 — Open (the only editors)

These are the three things §1a still left open. HIG: segmented control or a short list picker each. Defaults **named**, not silent.

| Control | Choices | Default to ship the test (Coach can override) |
|---------|---------|-----------------------------------------------|
| **Underlier** | SPX · SPY | **Unchosen until Coach picks** — fail loud, no silent SPY because gold is SPY |
| **Bodies** | Near spot (ATM pair) · Search any listed 20-wide pair that meets debit | Unchosen until Coach picks |
| **Orders** | One Batman complex · Two atomic flies | Unchosen until Coach picks |

When Coach picks, the choice **becomes law** and the control freezes to a Law row (same as Band 1). The interface shrinks.

Do **not** put morning IV, volume profile, structure bias, Sortino, or $500 house leftovers on this card. Those belong to the parked OTM fly.

### Band 3 — Profit management (read-only + one link)

| Row | Value |
|-----|--------|
| On | Unrealized **> 75% of risk / side** ($1 debit → **> $75**) |
| Set-window | **> $75 but < $100** (trail on by the time price has run) |
| Trail | **75%** = keep **25%** → **$19 / $25** min generated if PM fired in-band |
| Clock (exp day ET) | 9:30–11:00 stay 75% · **11:00 → 60%** · **12:30 → 50%** |
| Tent | Inside the attached fly’s tent → **walls are the trail** |
| %’s | **Rule of thumb** — curve shape is the risk (DL-375) |
| Nuance | **Trade Feed** — does not exit for you |

One trailing control: **Open Trade Feed proposal** (docs / later surface). Not a form for gamma walls.

Overnight 15:45 → next 9:30 stays a **named hole** on the card (“not locked”) until Coach speaks.

### Band 4 — At each instance (the decision)

Not a chart. A **four-step list** the replay will run. Same type as Law.

1. No attach on this side → **Hold** (that fly is not the subject).  
2. PM off → **Hold**, unless unrealized **> 75% of risk** → **turn PM on**.  
3. PM on, **outside** the tent → **Fold** if the trail in force at this clock is hit (75% / 60% / 50%).  
4. PM on, **inside** the tent → **Fold** if price violates the **tent walls**; else **Hold**.

This band is how a reader sees that the config is a **machine for the tape**, not a paragraph.

**What we look at (Coach):** the **primary surface** — a **3D real-time P&amp;L**
model whose **shape is created through per-leg volatility** — and **our
position on it**. Picture: [`Specs/references/3d-pnl-surface-primary.png`](../Specs/references/3d-pnl-surface-primary.png). Hold/fold asks whether staying on that sheet risks
**losing more than we want** (trail / tent walls / min profit once PM is
on). Same Options Lab per-leg sheet as §2. Not a flat-vol tent.

First replay builds that sheet from the gold snap (listed strikes +
per-leg IV). Trade Feed events are not required on the first instance
set. A 1-D mark-only trail is a **thumb-rule view** of the same
decision, not a second surface.

---

## Interaction

- Lives on Strategy Lab **Design** as a **template card** (“Batman · next expiration”), not a blank pack.
- Apply → a bot/version whose `attributes` store this config (house key **or** a new test key `batman_next_exp` — India: do not silently overwrite `0dte_high_vol_batman` / Timewarp).
- Preview: one line — “20-wide call + 20-wide put · next exp · 15:45 ET · ≤ $2.”
- Member cannot delete the law rows. Admin version bump if Coach changes a number.

**Tango:** the card teaches the strategy by showing the law. Empty fields for locked facts would look like the product does not know.

**Echo:** one card, one primary action (**Use this configuration**). Opens are three pickers max. No seven-step chrome.

---

## What we do **not** put on the glass

- Trade Feed’s event taxonomy (INFO / WATCH / RED ALERT) — later product  
- Constructor ATM grid, debit-to-width 4–10%, Sortino  
- Silver / gold tier (that’s the **test run**, not the strategy)  
- Operator-friction dial (method §4.2 — test harness, not this card)

---

## First three Coach picks (then the card is almost all Law)

1. **Underlier** — SPX or SPY for this Batman.  
2. **Bodies** — near spot, or any 20-wide pair that fits $1 / $2.  
3. **One order or two atomics.**

After those three, the interface is a **readable charter**, not a form.
