# FatTail Labs — Strategy Lab Backtest & Forward-Walk Method v0.2 (DESIGN)

**Status:** DESIGN — Coach's method as stated 2026-08-15. Design stage only; the
backtester is built after this and **iterations are expected once results are seen.**
Supersedes v0.1 (`Options-Backtest-Forward-Walk-Method.md`) where they differ.
**Provenance:** every principle is Coach's. Advisor arranged; nothing added without
being marked as such. Nothing may be removed without a Coach ruling.
**Sequence:** this method → backtester build + iteration → **FatTail Brokerage**
(modeled after the MSC Brokerage) → **Broker Adapter** (broker-agnostic, initially
optimized for **Tradier**). Design here binds those downstream builds' interfaces.
**Review (2026-08-15):** [`docs/Advisor-Review-Strategy-Lab-Backtest-Forward-Walk-Method-v0_2_2.md`](../docs/Advisor-Review-Strategy-Lab-Backtest-Forward-Walk-Method-v0_2_2.md) — India RETURNED (lock); Hotel APPROVED (method teaching). Coach Content Law: review sits beside this text.

---

## 1. Data — two tiers, one honest label

| Tier | Source | Role |
|---|---|---|
| **GOLD** | Real OPF chain snapshots at **3–5 second** intervals via the OPF interface — actual quotes, actual greeks, package quotes both sides. Aug 14 full day already captured; a full week to follow. Standing archive accumulates every market day. | The gold standard. Backtests that count. |
| **SILVER** | Reconstructed from Massive **minute bars** + VIX / VIX1D — a cruder synthesized surface built from as much historical download info as possible. | Placeholder for long-running multi-month backtests **until enough gold accumulates.** Explicitly not the standard. |

Rules: every result carries its **tier tag**; gold and silver never render as the same
kind of evidence. Silver gets no validation ceremony (Coach) — it exists to get us
running. Substrate for building the test = the Aug 14 gold day.

**Coach (2026-08-15) — gold archive sequence:**
1. **This coming week** — collect an **entire week** of live chain / marks (standing tap, every market day).
2. **Then continue that way continuously** — the archive accumulates; it does not stop after the first week.
3. **Then** turn that archive into a **proper lab for testing** (this method’s backtester / forward-walk). The lab is after the week is on disk, not instead of collecting.

As-built tap: `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture/day=YYYY-MM-DD/` · writer `ssr_live_capture` · **host StudioOne** · launchd `ai.fattail.labs.ssr-live-capture` Mon–Fri 04:00 ET. Friday 2026-08-14 is day one. Friday’s chain files are **5-minute** snaps (marks **5s**); GOLD’s 3–5s **chain** cadence is the target as the standing archive tightens — not a rewrite of Friday.

## 1a. First strategy to test — Batman (next expiration)

**Coach (2026-08-15):** Start with the **Batman**. Entry semantics are much
easier than the single OTM butterfly. The **0DTE OTM Butterfly** remains a
strategy to make rock-solid — it is **not first**. It is not dropped.

Until Coach names another first test, backtest / forward-walk is **only** this
Batman.

### Coach lock (verbatim sense — do not thin)

- Entered **Monday through Friday** at **about 3:45 PM Eastern**.
- Expiration is the **next expiration**. Mon–Thu that is the following day.
  **Friday** entry is **Monday expiration** — Coach: **3 DTE**.
- **No entry event** other than the **time** to enter.
- **Find** a **20-wide put fly** and a **20-wide call fly**.
- Each fly’s debit is **no more than $1**.
- **Total cost no more than $2**, so there is flexibility on the price of each
  fly so long as the **total debit does not exceed $2**.
- **Slippage fudge:** total cost **may go to $210**.
- **The target is $2.**

**The real requirement is the next expiration** (Coach). “1 DTE” is not the
law. Friday→Monday is next expiration and is **3 DTE**.

**Reading (India — labeled, Coach may correct):** $2 is the **package debit in
option dollars** (call fly + put fly). Standard multiplier 100 → **$200 cash**
at the $2 target. The **$210** fudge is **cash** ($2.10 package / $10 slip).
Search/accept at **≤ $2.00**; live fill may print up to **$210** cash. If $210
was meant as something else, say so — this sentence is not Coach’s.

**Family:** Batman = one call fly + one put fly, each **20 points** wide,
**listed** strikes only (DL-309). Each fly is **atomic** (§5). Do not fill a
fly one leg at a time.

**Gold tape:** the standing tap today holds **SPY 0DTE**. This Batman needs the
**next expiration** chain at ~15:45 ET (Friday → Monday, 3 DTE). The Aug 14
folder is a 0DTE day — **not** this entry’s chain. The coming week on
StudioOne must capture **next expiration** at that clock or this test has no
gold.

**House catalog (pointer only):** Batman family exists (`0dte_high_vol_batman`,
`1_2dte_timewarp_batman`, DL-235). This test lock is **Coach’s 3:45 / 20-wide /
$2** rule. It does not silently become Timewarp or High-Vol house rows.

**0DTE OTM Butterfly:** parked for the later design pass (`docs/0DTE-OTM-Butterfly-Design-Teardown.md`). Harder entry. Not this week’s first test.

### 1a.1 Profit management (Coach 2026-08-15)

There is always a possibility the position **derives an active close on both
the put and the call on the day of expiration**. It usually works out there is
**no opportunity for profit**, or **one side** comes into profit.

**Which side (Coach):** It really depends **which side price decides to
attach** — whether it is the **call fly** or the **put fly** that is the
**subject of the profit management**. PM is not “the Batman as one blob.”
It is the fly **price attached to**. The other side may stay dead. Both
sides attaching on expiration day is possible; it is not the usual case.

Profit management is **per side** (each fly), and the **subject** is the
attached side.

**Trigger.** Profit management is **turned on** and you **set a trail when
price goes over $75** (on the $1-debit / $100-risk example: 75% of risk
taken per side). By the time you can set the trail, price will probably
touch **$100**. That delay is **why** the window is written **> $75 but
< $100**. (Coach: if he said $199 he meant $100.)

**Trail (first half of the morning).** A trailing stop is set at **75% of
the top gain achieved**. **75% trail = keep 25%:** 25% of $75 = **$19**;
25% of $100 = **$25**. This **75% trail stays in effect in the first half
of the morning session (9:30–11:00)**.

**Minimum generated profit (Coach):** **$19–$25** is the **minimal amount
of profit you should generate** if profit management was triggered and the
high stayed in that $75–$100 set-window.

**Trail steps down (expiration day, Eastern).**

- **11:00 AM** — trail drops to **60%** of the top unrealized gain.
- **12:30 PM** — trail drops to **50%**.

**Tent.** If price **enters the profit tent**, use the **profit tent walls as
the trail**.

**Why the trail tightens (Coach — do not thin).** You are hoping price
continues higher, and you are giving it **plenty of room to surge and pull
back**. As the day wears on, **premium continues to decay**, changing the
**shape of the profit curve**: real-time breakevens are **converging** and
the profit curve is getting **steeper**. That **increases risk** if price
does a **healthy pullback**. This can **jump you out of the trade**. There
is **nuance** to this **other than the %’s**, which are a **rule of thumb**.

**Nuance proposal (Coach paper):** [`docs/Trade-Feed-Nuanced-Management-Proposal.md`](../docs/Trade-Feed-Nuanced-Management-Proposal.md) · source [`Specs/references/TradeFeed.pdf`](./references/TradeFeed.pdf). Position-aware structure coach (Observe · Prioritize · Relate · Explain · Confirm). Does **not** exit for the trader. Example scenario in the paper is a **20-wide SPX 0DTE call fly**, not a silent rewrite of this Batman entry lock.

**Reading (India — labeled, Coach may correct):**

- Turn PM **on** at **> $75**. The **> $75 and < $100** band is the
  practical set-window (price has usually run by the time the trail is on),
  not a second trigger.
- **75% trail** = keep **25%** of the top gain in that window: $19 on $75,
  $25 on $100. That is also the **minimum profit you should generate**
  (DL-372) if PM fired and the high stayed in-band.
- **$199 = $100** (Coach correction).
- The **75 / 60 / 50 %** steps are a **rule of thumb**. The deeper law is
  **curve shape**: theta steepens the tent, breakevens converge, a normal
  pullback can stop you out. Tent-wall trail when inside the tent is part
  of that nuance — geometry, not only percent. Do not implement the %’s as
  if they were the whole PM.
- Same grammar for later clocks: 11:00 give back **60%** (keep 40% of peak);
  12:30 give back **50%** (keep 50% of peak). “Drops” = the give-back fraction
  drops, the stop **rises**, more of the peak is locked as expiration day
  wears on.
- Clocks are **expiration-day** RTH (the next expiration after the 3:45
  entry). Tent walls = that side’s listed wing strikes. Do not invent a
  second geometry.

If any of that reading is wrong, it sits beside the lock — it does not replace
Coach’s sentences.

**Still open (not invented):** underlier (SPX house default vs SPY gold week);
whether the two flies are one complex or two atomics; where the **bodies**
sit. Overnight from 15:45 entry until expiration 9:30 is not in this lock.

### 1a.2 Replay — hold or fold at each instance (Coach 2026-08-15)

We **replay the day**. The **configuration** makes the decision to **hold or
fold at each instance** of the day.

An **instance** is one gold snapshot (chain + marks + clock). Same tape,
many MC fill worlds (§3–§4). The **strategy config** is not a static
charter only — it is the **hold/fold policy** evaluated at every instance
after entry.

**Coach (2026-08-15):** We have the **primary surface** and **our position
on it** to assess the **risk of losing more than we want**. The surface is
a **3D model of the real-time P&amp;L surface**. The **shape** is created
**through per-leg volatility**.

**This surface:** [`references/3d-pnl-surface-primary.png`](./references/3d-pnl-surface-primary.png)
(Coach, 2026-08-15). Green/cyan mesh = live T+0 P&amp;L sheet. Pink edge =
expiration tent. Yellow dots = the three listed strikes. Green slice =
now. Lower / upper BE labeled on the sheet. That is the **primary
surface**. The fly sits on it. Hold/fold reads **this shape**, not a
flat-vol cartoon.

That is the same Options Lab per-leg-vol sheet (§2 · DL-364) — strike ×
time × P&amp;L — updated at this instance. Each leg keeps its own
\(\sigma_i\), so the tent **skews correctly**. Not flat vol. Hold/fold is
not a cash ticker alone. It is the **position sitting on that
per-leg-shaped sheet**: tent, walls, breakevens, steepness. “Losing more
than we want” is giving back past the trail / tent walls / $19–$25 floor
once PM is on. The %’s remain a rule of thumb; the **sheet** is how you
see the pullback risk as the curve steepens (DL-375).

At instance *t* (expiration-day clock, per **attached** side):

1. If that side is not on — **hold** (flat / no PM).
2. If PM is not yet on — **hold** unless this instance’s unrealized gain
   goes **over 75% of risk** → turn PM on, set the trail.
3. If PM is on — fold if mark **violates the trail** in force at this
   clock (75% give-back until 11:00 · 60% from 11:00 · 50% from 12:30),
   **unless** price is **in the profit tent**, in which case fold if
   price **violates the tent walls**.
4. Otherwise **hold**.

The **%’s remain a rule of thumb** (DL-375). Trade Feed is nuance for a
human (or a later instance that has those metrics). The **first replay**
must be able to hold/fold from **clock + debit + mark + peak + listed
wings** on the gold snap. Do not block the first replay on Heatmap/GEX
if that instance does not carry them.

Interface: [`docs/Batman-Strategy-Config-Interface.md`](../docs/Batman-Strategy-Config-Interface.md).

---

## 2. The engine — 3D surface, updated by real ticks

A **3D model determines the entire options surface for the trading day** (strike ×
time × price/IV), then is **updated with actual data**: every 3–5s with real collected
greeks on gold; with the synthesized data on silver. Positions mark against the surface.
Fast and accurate — the model gives continuity and speed, the ticks keep it honest.

**The surface modeler is the existing per-leg vol options surface modeler from the
Options Lab Analyzer** (Coach). Not a new engine: the same OPF-backed modeler that
prices the Analyzer's risk graph in live and forward-analysis modes now runs in
backtest / forward-walk mode against the captured tape — the historical as-of path
that was deliberately deferred to Strategy Lab (2026-08-11) lands here, built against
its real consumer. Per PB-MODE-0: backtest and forward-walk are modes of the same
surface, mode selects the pack family, no side-door engine.

## 3. Monte Carlo — distributions, never a single run

Every backtest / forward-walk runs **hundreds to thousands of times.** A single
deterministic run produces ossified results a trader mistakes for truth. The output of
every test is a **distribution**, not a number. (Same principle as the retro compass:
shape, never scoreboard.)

## 4. Where the randomness comes from — two friction terms

The market path is fixed (the tape); the **fills** are stochastic.

### 4.1 Fill friction (the market's fault)

A fill probability and fill-price distribution per attempted order, driven by the
observed **spread, current liquidity, and IV** — inputs the snapshots carry directly.
Each MC run rolls these per attempt, so identical logic on identical data yields a
range of outcomes.

### 4.2 Operator friction (the human's fault) — first-class parameter, dial 0→1

Coach: a machine follows the method with a regularity no human can dream of, so an
explicit second randomness models **random dumb decisions and timings** — late entries,
missed exits, hesitation, occasional off-plan sizing. Two runs of the same bot:
operator friction **0 = the machine ceiling**; a calibrated human level = what a member
would experience by hand. **The difference is the quantified value of the automation.**
Calibration source: Coach's own book (4,448 fills) — the gap between rule and action is
the measured operator-error distribution. (Coach's 4,448 fills are **not** used to
calibrate market fill friction — that would smear human noise into the market model.
Coach ruled this an unfair comparison.)

## 5. Fill mechanics — laws

1. **Butterflies are atomic units.** One complex order: one fill or no fill. **NEVER**
   filled one leg at a time — no partial-leg simulation exists. Friction is
   package-level: package NBBO, structure liquidity, IV. Fill price is the debit;
   every return band is denominated on it.
2. **Retry until filled.** If the probabilities reject a fill, the system resubmits.
   Each retry advances the tape's clock (next snapshot on gold, next bar on silver)
   and reprices from the surface — persistence has a real cost, and MC variance
   comes from entry timing and price drift across the retry sequence.
3. **Bounded by strategy scope.** Every resubmit re-evaluates the strategy's own
   criteria — strikes vs spot, debit range, time window, setup condition. If a
   rejected fill takes the trade **out of scope, abandon it** — cleanly, as a
   non-trade, recorded as an event ("signal fired, no fill within criteria"). The
   strategy's scope defines both the price walk's bounds and the give-up point; no
   separate patience rule.
4. **Exits obey the same loop.** Harvest / stop orders retry within exit criteria;
   out of scope falls to the strategy's declared stop/expiry path. This is where
   round-trips get simulated honestly.

## 6. Scoring — the bot is a member

Coach: scoring is **as if the machine is subscribed to FatTail Labs** — its trades
recorded in Practice (trade log), its runs in a Campaign, its record through Journal
and Retro. It is judged by the **same compass as every human member** (Retro Reporting
Standards Spec v0.1): Journey score, outcome shape vs the target silhouette, drawdown
bands and conduct, round-trip discipline. One standards spec, human and machine
alike. A bot's Journey is its resume — the marketplace's un-fakeable provenance.

## 7. Provenance & reproducibility (advisor-suggested, Coach did not object)

Every MC run seeded and logged: same seed → same run. Results re-derivable; "why did
run #412 blow up" is answerable.

## 8. Downstream (sequence, not scope of this doc)

- **FatTail Brokerage** — modeled after the MSC Brokerage; the simulated brokerage the
  Lab and (per the Discord announcement) members test bots against first.
- **Broker Adapter** — designed to work with any broker; initially optimized for
  **Tradier**. This method's fill-mechanics laws (atomic complex orders, scope-bounded
  retry, abandon-on-out-of-scope) define the adapter's order contract from day one.

## 9. Open for the build (Coach rules as results arrive)

- Fill-friction functional form and calibration source (not Coach's book).
- Operator-friction distribution shape and default "typical human" level.
- MC run counts per tier; convergence criteria.
- Silver reconstruction recipe (as good as possible, no ceremony).
- Iterations after first results — expected.

---

*Coach's method, arranged not authored. Design stage. Build → results → iterate.*
