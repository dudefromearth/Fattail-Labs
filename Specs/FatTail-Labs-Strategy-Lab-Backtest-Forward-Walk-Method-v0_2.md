# FatTail Labs — Strategy Lab Backtest & Forward-Walk Method v0.2 (DESIGN)

**Status:** DESIGN — Coach's method as stated 2026-08-15. Design stage only; the
backtester is built after this and **iterations are expected once results are seen.**
Supersedes v0.1 (`Options-Backtest-Forward-Walk-Method.md`) where they differ.
**Provenance:** every principle is Coach's. Advisor arranged; nothing added without
being marked as such. Nothing may be removed without a Coach ruling.
**Current revision:** **v0.2.2** — [`FatTail-Labs-Strategy-Lab-Backtest-Forward-Walk-Method-v0_2_2.md`](./FatTail-Labs-Strategy-Lab-Backtest-Forward-Walk-Method-v0_2_2.md) (DL-410 / DL-411 named-consumer fold lives there).

**Sequence:** this method → backtester build + iteration → **FatTail Brokerage**
(modeled after the MSC Brokerage) → **Broker Adapter** (broker-agnostic, initially
optimized for **Tradier**). Design here binds those downstream builds' interfaces.

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

As-built tap: `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture/day=YYYY-MM-DD/` · writer `ssr_live_capture` · **host StudioOne** · launchd `ai.fattail.labs.ssr-live-capture` Mon–Fri 04:00 ET. Friday 2026-08-14 is day one and stays **5-minute** chain (labeled, not rewritten). **OD-6 (Coach 2026-08-16):** from Monday **2026-08-17** open, StudioOne **must** capture OPF chain snaps with full greeks at **3–5s**. Prior StudioOne interval is immaterial. This is the gold data plane Strategy Lab bots are tested against.

## 1a. First strategy to test — Batman (next expiration)

See v0.2.2 §1a. Expiration = **next expiration** (Friday → Monday = **3 DTE**).
The **0DTE OTM Butterfly** is parked, not dropped.

---

## 2. The engine — 3D surface, updated by real ticks

A **3D model determines the entire options surface for the trading day** (strike ×
time × price/IV), then is **updated with actual data**: every 3–5s with real collected
greeks on gold; with the synthesized data on silver. Positions mark against the surface.
Fast and accurate — the model gives continuity and speed, the ticks keep it honest.

**Coach (2026-08-15):** The surface used for **determining fills** is the surface
already available in **Options Lab**. It is **per-leg volatility** driven, so it
**correctly builds skew**. This method does not invent a second surface and does
not flatten vol (no single-IV / VIX-as-all-legs sheet for fills).

**As-built pointer (not a substitute for Coach’s sentence):** Options Lab
Analyzer / OPF `day_trade.mark_hybrid` — live mids + T+0 named engine, **per-leg
chain IV** (OPF14). Each leg keeps its own \(\sigma_i\); the package sheet
\(V(S,\tau;\sigma_i)\) is the ISO/RISK surface members already see. Alternate
pack `day_trade.surface` is a fitted total-variance surface — not this fill
default. OPF `backtest.surface_reconstruct` (flat / silent 20%) is **not** this
surface.

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
   package-level: package NBBO, structure liquidity, IV. Fill price is the debit
   **on the Options Lab per-leg-vol surface** (§2); every return band is
   denominated on it.
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

---

## Document history

| Date | Note |
|------|------|
| 2026-08-15 | **Coach:** fill surface = Options Lab surface; per-leg vol; skew is correct. Filed in §2 + §5.1. DL-364. |
| 2026-08-15 | v0.2 DESIGN — Coach's method as stated. |

---

*Coach's method, arranged not authored. Design stage. Build → results → iterate.*
