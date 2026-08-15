# FatTail Labs — Retrospective Reporting Standards Spec v0.1 (DRAFT)

**Status:** DRAFT — Coach's vision from the 2026-08-14 evening session, captured by
the advisor layer. Feeds §4 of `FatTail-Labs-Retrospective-Reimagined-Spec-v0_1.md`
and binds every surface that reports trader performance back to a member (Retro,
Reports, Journey score, Strategy Lab validation displays).
**Provenance:** every standard here is Coach's, stated 2026-08-14. Advisor
contribution is arrangement only. Nothing may be removed without a Coach ruling.
**Reference images (binding):**
1. Coach's outcome-distribution histogram (739 trades, right-skewed, capped left) —
   the SHAPE of true north.
2. Coach's four-year dashboard (48.58% return, 3.077%* max drawdown, Sharpe 4.89,
   52.7% win rate, 1,438 days) — the EXPERIENCE of true north.
   *Subject to the drawdown recalculation defect (§7).

---

## 0. What a retrospective is for (Coach, verbatim)

> "It is to help the trader keep the compass pointed toward their true north. To do
> that they must have a balance of routine, journaling, persistence, presence and
> cadence. Their performance must lead to a distribution shape that will allow for
> managed/low drawdown, compounding, and growing sharpe, or similar."

The compass has two sides, and the retro reads both:

- **Practice side:** balance across the pillars — routine, journaling, persistence,
  presence, cadence. Drift in any one is the compass wandering.
- **Outcome side:** the distribution SHAPE — not P&L as story. Managed/low drawdown,
  compounding, growing Sharpe (or similar). Shape-of-outcomes as evidence the
  practice is working.

**True north = balanced practice producing a healthy distribution.** The retro's
job: read the compass, name the drift, point the correction.

---

## 1. The target distribution (the shape of true north)

Right-skewed. Small capped losses; wins in three bands. Returns are on debit.

| Bucket | Share of outcomes | Return on debit |
|---|---|---|
| Losses | ~50% | small, capped |
| Small wins | ~37% | 25–250% |
| Medium wins | ~10% | 250–450% |
| Large wins | ~2% | >450%, typically landing 450–1000% |

Rules of the shape:

- **~50% losers is ON TARGET.** A member at true north loses roughly half the time
  by design. The shape says healthy while the win-rate scoreboard says mediocre —
  the shape is right, the scoreboard is wrong.
- **Win rate is not a compass reading at any value.** Tolerant down to ~35%: "many
  traders with a 35% winrate and a nice distribution curve and very positive P&L"
  (Coach). The retro never celebrates or mourns a win-rate move. If a member frets
  about win rate, the Coach answers with the shape.
- Optimizing win rate is how traders ruin the shape (cutting winners to feel right
  more often — trading the 2% bucket away for comfort). The reporting must never
  create that incentive.
- Boundary questions parked for Hotel's table (proposals, Coach rules): sub-25%
  scratch exits' bucket home; whether bucket edges are per-playbook; member-relative
  bucket definitions (R-multiples / fraction of max risk) for cross-account
  comparability.

**Display law:** the member's actual histogram rendered against the target
silhouette — "here's true north, here's you." Reference image 1 is the drawable
target.

---

## 2. Drawdown standards (three dimensions, never one)

| Dimension | Standard |
|---|---|
| **Depth** | ~2–2.5% is normal life. **2.5% is the long-term average anchor.** 3–4% acceptable as short plunges. 5–6% rare — tolerable only with strong risk-mitigation behavior visible. |
| **Duration** | "Short plunges" — depth is forgiven when it doesn't linger. Time-under-water is a reading. Recovery-time trend is reported (faster recovery over periods = capacity growing). |
| **Response (conduct in drawdown)** | Judged by conduct inside the drawdown, not depth alone — see §3. |

**Measurement law (binding, money-path):** the retro heading shows the
**current drawdown in the period under review** (period-end print on that
window's path). The capital **base** is the trader's **total trading capital**
as entered on **Accounts & Capital** (sum of set `starting_balance`s). If a
**campaign is in place** (non-ledger), the base is that campaign's
**allocated capital** (`starting_capital`) and the path is the campaign's
stamps. On that base: drawdown % = peak-to-trough decline ÷ **the running peak
equity at the time of the decline** — never the final or current balance, never
a silent $50k placeholder. Unset capital is a named state, not a fake %.
(Defect §7: the current Reports chart divides by final balance, understating
early drawdowns. FIX NOW class.)

---

## 3. Conduct laws (scored behaviors)

The compass scores conduct, never outcomes. Two behaviors are scored negatively,
one positively — all objectively measurable from the Trade Log:

### 3.1 Doubling down in drawdown — scores badly

Increasing position size while drawing down. Martingale/revenge posture. Scores
badly **regardless of how it resolves.** Signal: size escalation relative to the
member's own baseline sizing while under water (not merely "traded during a
drawdown" — Hotel's table distinguishes normal-size fresh setups from escalation).

### 3.2 Reducing and tightening in drawdown — scores positively

Reducing position size and becoming more attentive to process while drawing down.
Scores well **even if the drawdown deepens anyway.** The system grades the
response, never the water level.

### 3.3 Round-trips — scores very badly

> "If they allow too many positions going into full loss when they touched >150%
> unrealized gain, this is very bad. They are holding hoping for something bigger.
> These losses destroy an account." (Coach, verbatim)

A position that touched >150% of debit unrealized and was ridden to full loss.
The account-killer. It corrupts the shape twice: fattens the loss bucket and
starves the win buckets — refusing to accept the win, the greed-twin of §3.1's
refusing to accept the loss. Objectively measurable: MFE vs final outcome from
Trade Log marks. Nuance for Hotel's table: flies legitimately ride the tent toward
expiry — the line is plan (stated target / trailing) vs hope (no plan, past
target, gave it all back).

**Delivery law (Tango):** conduct scores are delivered as the mirror, not the
verdict: "your average size grew 40% while you were 3% under water — what was
happening there?" The data indicts; the member names it; the score records it.
Conduct, never character.

---

## 4. Sideways doctrine

> "If they are going sideways, this is almost always good, even if it is extended,
> especially when they are new. They are learning how not to lose." (Coach)

- Flat equity + healthy conduct readings = **positive report, even extended.** The
  Coach never apologizes for sideways, never implies the member should be "making
  progress." Surviving IS the progress — capital preservation as visible stage-one
  success ("stop the bleeding," the founding thesis).
- **The arc:** sideways + *tightening process* → staying there → the breakout
  winner. Usually the medium bucket firing (250–450%), not the rare monster.
- **The clock:** the breakout "usually does not happen for the first two months."
  Week-6 discouragement gets an honest answer: "you're on schedule; this is what
  month two looks like."
- Sideways-as-failure is the felt pressure that produces the account-killing
  conduct (§3). This doctrine is protective, not consoling.

---

## 5. Earned praise law

The breakout winner deserves praise **only if it was the result of process and not
some anomaly.** Before celebrating, the Coach checks the logs: in the playbook?
planned? sized at baseline? invalidation stated? harvested per plan? 

- Process-produced → the moment is marked and celebrated: the system proving
  itself, and the member should feel it.
- Anomaly (oversized, off-plan, held on hope that happened to pay) → **no
  celebration.** Praising an anomaly trains the anomaly — a lucky win reinforced is
  the most expensive lesson on the platform.
- "Earned" is a query, not a feeling: plan-match, size-vs-baseline, playbook
  membership, stated invalidation, exit-vs-target — all from the logs.

(The journal-side Coach still never evaluates. The retro-side Coach evaluates
conduct — including withholding applause from luck.)

---

## 6. The retro opening (the reckoning)

The retro **opens** with:

1. **The new Journey score** — the compass reading, up front, no withheld reveal.
   The score is compass-fed: pillar balance + shape health + drawdown conduct +
   round-trip discipline.
2. **Behavioral commentary** — perceived poor, mid, and good behaviors named from
   the current logs and historical logs. Presented as observations to confirm
   ("I see three round-trips this period — do you see it the same way?"), never
   verdicts to accept. Mirror law intact.
3. **Trajectory as the headline dimension:** which patterns are **repeating**
   (seen before, still here — the heavy word) vs **resolving** (seen before,
   fading — the earned word). A bad period full of resolving behaviors is a good
   report. A flat period with repeating ones is the real warning.

Score → what fed it → repeating vs resolving → conversation begins from the
reading. The period brief and shape displays are the evidence shown as each
behavior is discussed.

**Room law:** the daily Journal never mentions scores, meters, or grades — that
ban stands. The retro is where the reading is delivered. Capture daily; reckon at
the retro.

---

## 7. Defects and open items

| # | Item | Status |
|---|---|---|
| D1 | **Drawdown denominator bug**: Reports chart divides by final balance, not running peak. Understates early drawdowns; Max figure suspect. Money-path, FIX NOW. Same law binds retro displays and Strategy Lab metrics. | Filed with Grok |
| O1 | Hotel's boundary table: bucket edges, per-playbook variance, member-relative definitions, scratch-exit home, §3.1 escalation threshold, §3.3 plan-vs-hope line | Open — proposals to Coach |
| O3 | Exit of the retro — what the member leaves holding (one-thing's successor or survivor) | Coach has not ruled |

---

## 7a. The display system (O2 — RESOLVED, Coach approved 2026-08-14)

Two component classes, shown by the Coach in-thread. Concept mockup approved by
Coach ("yes that is it").

### The Heading Card (the opening reckoning, one glance)

One card, shown as the Coach's opening move. Contains:

- **Verdict line:** heading state (e.g. "On course") + the Journey score, with
  **trajectory chips** — "N resolving" (success tint) / "N repeating" (warning
  tint) — the headline dimension of §6.
- **Panel 1 — Shape vs true north:** the member's outcome histogram (losses left,
  wins right) with the target silhouette (§1) overlaid as a dashed curve. One-line
  caption states the shape reading ("right tail intact · left tail capped").
- **Panel 2 — Drawdown ribbon:** the period's drawdown line over the three bands
  (≤2.5% normal / 3–4% plunge / 5%+ deep), annotated with the §2 readings: average,
  deepest touch, recovery time, and the **conduct note** ("sized down at the
  low ✓" / escalation flag). Running-peak math per §2.
- **Panel 3 — Practice balance:** the five pillars (routine, journaling,
  persistence, presence, cadence) as horizontal bars; drifting pillar tinted
  warning; one-line caption names the drift.

### Evaluation Cards (the deck, dealt one at a time in conversation)

One card per behavioral finding. Fixed anatomy, three parts:

1. **Evidence** — the finding from the logs, stated as fact with numbers
   ("Two positions touched +150% and rode to full loss. Third period running."),
   headed by the behavior name + trajectory word (repeating / resolving / on
   schedule).
2. **The mirror line** — a question or observation, never a verdict ("Do you see
   it the same way?" / "That's the system working." / "You're learning how not
   to lose."). Tango gates every line against §3's delivery law.
3. **Practice** — the prescription: what to practice and where, wired into
   existing product surfaces — sim reps in Practice, a playbook rule pinned,
   journaling cadence, presence sessions. **The retro's output is practice
   assignments** — practice, not insight, is the mechanism of improvement
   (founding doctrine, closed loop).

Conduct: the Coach shows the Heading Card first (§6 opening), then deals
Evaluation Cards one at a time as the conversation walks the findings — each card
is a thing to look at together, not a report to scroll.

Build path: Charlie builds both components against the member context pack + report
DTO; Echo runs the real design pass against the interface floor (Apple HIG
sophistication, Claude-grade intelligence — the two-reference standard); Tango owns
every mirror line; Hotel verifies every number's derivation. The approved concept
mockup is the structural reference; Echo elevates, never simplifies.

**As-built preview (2026-08-15, spec still DRAFT):** the Heading Card is the
header of `/app/retrospective` (library, next-scope window) and
`/app/retrospective/{id}` (this period). Journey score + compass state are live.
**Shape** is the member's full outcome distribution; **this period's trades
sit on that curve in contrast**. **Drawdown** is the **current period
print** against **trading capital**, or **allocated capital** when a campaign
is in place. **Practice** is the Journey radar — full compass muted, **this
period's contribution in tint** — not a pillar list. Trajectory chips count
comparable **process** readings vs the prior review. Conduct-in-drawdown is
named as not scored. Evaluation Cards are not built. Period brief remains
evidence below the heading, not the opening.

---

## 7b. Remaining open items

---

## 8. Coach's own book as the standard's proof

Four years, 1,438 days: 48.58% return, max drawdown 3.077% (pre-recalc), Sharpe
4.89, win rate 52.7%, right-skewed histogram matching §1's silhouette — **"pretty
much ideal, even though there were many mistakes"** (Coach, verbatim).

That sentence is doctrine: **true north does not require perfection; the structure
absorbs mistakes.** Capped losses mean errors cost bruises, not limbs. The retro
teaches exactly this: you don't have to stop making mistakes — you have to stop
making the uncapped ones. The compass forgives everything except the
account-killers, which is why the account-killers are the only behaviors it scores
harshly.

---

*Advisor artifact of Coach's vision — verbatim where quoted, arranged not authored.
Binds on Coach approval + Lima DL. Feeds Retrospective-Reimagined §4 and every
member-facing performance report.*
