# FatTail Labs — Structure Surface Replay Spec v0.1

**Status:** **DRAFT / THESIS** — not BUILD AUTHORITY. Coach has not given GO.  
**Date:** 2026-08-13  
**Current revision:** **v0.1**  
**Type:** Product + method Spec — **options backtest / forward-walk** via a precomputed 3D package surface  
**Short name:** **SSR** (Structure Surface Replay)  
**Canonical filename:** `Specs/FatTail-Labs-Structure-Surface-Replay-Spec-v0_1.md`  
**Architecture:** [`Architecture/31-structure-surface-replay.md`](../Architecture/31-structure-surface-replay.md)  
**Human explainer:** [`docs/Options-Backtest-Forward-Walk-Method.md`](../docs/Options-Backtest-Forward-Walk-Method.md)  
**Board (when seated):** not yet — thesis land only  

**Coach sequencing lock:** build a **single day first**, examine the Monte Carlo **distribution**, then try **several different days**, **learn and refine**, discover **reasonable ranges for dial adjustments**. Forward walk uses the **same engine** on holdout days after that sequence.

**Parents (normative where noted):**

| Doc | Role |
|-----|------|
| [OPF Spec v0.2.1](./FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md) | Engines · τ · PackagePricer · OPF11 · OPF16 · per-leg IV |
| [OPF Truth / Elegant Failure](./FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.0.md) · **DL-309** | Representable or named state · do not invent strikes |
| [Arch 30](../Architecture/30-options-pricing-foundation.md) | `backtest.chain_replay` vs `backtest.surface_reconstruct` |
| [Arch 31](../Architecture/31-structure-surface-replay.md) | Execution design for this Spec |
| [VP Histogram Spec v0.4](./FatTail-Labs-Volume-Profile-Histogram-Spec-v0_4.md) | Separate purpose (tick bins). P2-3 still OPEN. |
| [Strategy Lab Development Phase Spec v1.0](./Strategy-Lab-Development-Phase-Spec-v1.0.md) | `validation@1` · `backtest_distribution` |
| Claude.md · AGENTS.md | No MSC · fail loud · process outcomes only |

**Coach Content Law (doctrine §11 · DL-176):** Nothing of Coach’s is removed. Formal laws project the Coach lock; they do not replace it.

---

# Overview

Strategy Lab Development today stamps **stub** back-test metrics (`server/strategy_lab_domain.py` `_stub_backtest_metrics`) — deterministic theater from `max_capital_at_risk` × constants. OPF already names two real backtest packs: `backtest.chain_replay` (cold generation archive; default when archive exists) and `backtest.surface_reconstruct` (weaker VIX-flat reconstruct). Neither implements Coach’s locked **day-surface** method.

**SSR** is that method: freeze a listed multi-leg structure at placement, **precompute** the package value surface \(V(S,\tau;\sigma_i)\) that the 3D ISO/RISK views already describe, walk the session underlier path **on that sheet**, treat contour crossings as candidate events, convert **touch ≠ fill** into a **seeded Monte Carlo**, and persist a **distribution** (shape included) as the only honest SoR output. Volume-profile bins are a **separate** purpose and artifact. Full OPRA minute-by-minute vicinity pricing is **not** the v1 default.

**Coach sequencing lock (binding):** we build a **single day first** and test the method and examine the Monte Carlo **distribution**, then we try **several different days**. We **learn and refine** the method, discover **reasonable ranges for dial adjustments**. A year job, multi-day automation, and Strategy Lab stub replacement are **later** — they are not the first proof.

This document is the **product / method law**. Execution (modules, CLI, PR plan) is [`Architecture/31-structure-surface-replay.md`](../Architecture/31-structure-surface-replay.md). **No GO.**

---

# Background & Motivation

## Current state (as-built)

| Surface | As-built | Honesty |
|---------|----------|---------|
| Development Back test | `_stub_backtest_metrics` — trades 18/24, DD = 0.22×capital, PnL = 0.15×capital | Labeled `data_provenance.source=stub` in API + `DevelopmentValidation.tsx` amber banner |
| Forward walk | `_stub_forward_walk_metrics` — 3 synthetic folds | Same stub provenance |
| OPF `backtest.chain_replay` | `server/opf/packs/backtest.py` `run_chain_replay` — requires cold archive generations | OPF16 fail-loud on miss; **no day path, no MC, no distribution** |
| OPF `backtest.surface_reconstruct` | Same file `run_surface_reconstruct` — one VIX IV, BSM sum at a single spot; **`iv = (vix or 20.0) / 100.0` silent 20% if VIX missing** (`server/opf/packs/backtest.py`) | Labeled `quality: weak_reconstruct`; **not** Coach’s sheet. SSR **must not** inherit the silent 20% (SSR11) |
| Underlier tape | Raw SPY trades (full history) on `/Volumes/sabrant2tb/fattail-market-data` (DL-317) | VP19: Strategy Lab **raw** consumer |
| VP bins | Geometry code in `server/market_data/vp_bins.py`; **no production write** | P2-3 OPEN (+9.30% all-prints vs Massive daily, SPY 2024-06-03) |
| Pack construct | `server/strategy_packs/packs/butterfly/construct.py` | Batman = two flies; **as-built centers both bodies on spot** |
| Live marks / chains | Market Bus + OPF generations | OPF-held chain is live instrument truth; do not invent strikes |

## Pain

1. Stub numbers can **look** like a backtest. Development Spec already forbids presenting stub as live market, but the numbers are still what a member sees after “Run back test.” Coach locked: **do not use stub to judge a design.**
2. Options P&L is the **tent**, not the index. Watching SPY print and an indicator converge is a different (simpler) problem. The member’s capital lives on the package curve.
3. A single unseeded equity line is not a backtest: fills are unobservable; identical tape + model still produce a **distribution**.
4. Full minute-by-minute OPRA for every nearby strike is the harder movie. Coach locked an **easier equivalent** that he already runs in real time.

## Why now

Design + Curate is the member-track lock (Arch 26). Development validation is the gate into Curation (`validation@1`). The stub is allowed only as a **pipeline proof**. SSR is the intended **measurement** engine for that gate — **one RTH day + distribution first** (Coach sequencing), then several days and dial learning, then Development, never a silent swap of stub-looking numbers.

---

# Goals & Non-Goals

## Goals (this thesis)

1. Write **normative method law** for Coach’s locked SSR so a later Spec v0.1 can land without dropping ideas.
2. Map that law onto **this repo**: OPF engines, raw parquet clock, batch job, Strategy Lab provenance — no second stack.
3. Separate **VP bins** (dead-simple histogram artifact) from **options surface replay** so they cannot be collapsed.
4. Define SoR output as a **distribution + shape descriptors**, not an equity line.
5. Name every residual and every open Coach decision (OD-SSR*).
6. Bind Coach’s **single-day-first** research sequence: one session, inspect the MC distribution, then several days, then discover dial ranges — not a year backtest as first proof.

## Non-goals (explicit)

| Not in this thesis / not v1 | Where it lives |
|-----------------------------|----------------|
| Coach GO / BUILD AUTHORITY | Coach only |
| Production VP bin writes | VP Spec §5 · P2-3 + C-0 |
| Full OPRA / vicinity-minute surface for every nearby strike | **DEFERRED** — later, when strike *selection* under a live grid or archived chains exist |
| Stub metrics as a measurement of a design | **Forbidden** (SSR14) |
| Inventing option *prints* from SPY tape and calling them the market | **Forbidden** (SSR13) |
| A single unseeded equity line as “the” backtest | **Forbidden** (SSR8) |
| Request-path Massive from Next.js or N handlers | Market Bus / OPF1 |
| MSC code, MSC Redis schemas | OPF19 · VP12 |
| Live Tradier / real-money Deploy | Arch 26 · DL-252 |
| Member-facing profit-claim copy | North-star / Tango |
| Replacing `backtest.chain_replay` as OPF **default** when archive exists | Arch 30 · OPF16 — chain_replay stays default |
| Shipping 3D ISO/RISK WebGL in this program | Analyzer / PB viewport — SSR **computes** the same surface; UI chrome is out of SSR v1 |
| Silent stub removal | UI must keep a **named state** until SSR ships and is labeled |
| Year / multi-day automation as the **first** deliverable | **Forbidden by SSR17.** Slice 0 is one RTH session. Several days = Slice 1 after Coach examines Slice 0’s distribution. |

---

# Part A — Product / method Specification (DRAFT / THESIS)

## A0. Mission

Provide a **Labs-owned, honest options-strategy day replay** so Development can test pack settings against a **changing package curve** through a session:

- Freeze listed legs (or fail named).
- Precompute the 3D model the ISO/RISK views already show (pink T+0 hill, cyan/green expiration tent, yellow strikes, BEs).
- Keep the session path \((S(t),\tau(t))\) **on that sheet** all day; height \(V\) exists at every sample.
- Treat events as **contour crossings** (not “did we find the sheet?”).
- Rebuild the sheet when per-leg vol changes — milliseconds, faster near exit contours.
- Convert surface/contour **touches** into fills only through a **friction / probability-of-fill** model.
- Report a **Monte Carlo distribution** (shape matters) per placement / per day.
- **First:** one RTH day, examine that distribution; **then** several days; **then** learn dials (SSR17).

A second, **non-collapsed** purpose: maintain **VP bins** — one bin per tick from lowest print to highest — as a small cacheable daily file. That is **not** the options backtest.

**North star:** process evidence a professional would defend given the variables we actually have (underlier tape + named pricing model + unobservable fills). Residual error is **named**, not hidden.

---

## A1. Coach lock (preserved)

The following is Coach’s locked method. Formal laws in §A4 are a **projection** of this lock, not a replacement. **[Reviewer]** notes are opinions or implementation seams; they do not delete Coach text.

### A1.1 Two purposes (do not collapse)

1. **VP bins (dead simple, separate):** one number per tick from lowest print to highest. SPY = 100 bins/point. Example: 348.11 → 34811, 773.90 → 77390, inclusive ~42,580 bins. Small cacheable file. Daily tracker appends (and rolls a window). **This is NOT the options backtest.**
2. **Options strategy simulation:** recreate a changing curve through a session so you can test options strategies and a reasonable live P&L at any second/minute.

### A1.2 Options method — harder statement, then locked easier equivalent

Very different from VP. Must simulate a changing curve throughout a trading day based on **minute-by-minute condition for all strikes in the vicinity of the strategy**.

**Easier way (v1 default):** overlay the full curve of a multi-leg strategy for a day.

1. Determine where the legs would be (levels; **2 with butterfly** — body + two wings; Batman = call fly above + put fly below).
2. Compute the curve / breakevens from entry to end of day, computing **decay relative to the strike levels**.
3. Watch price intersect the curve and determine the **value of the curve at that intersection**.

Existing visual (`bm1.png` / TradingView): a Batman each day above and below price, started at the beginning of each day. Horizontal rails = strike geometry. **Missing from that view:** exact value of the curve when price intercepts it — **but that can be computed**.

This is **more complex** than watching price and an indicator converge. Options P&L is the tent, not the index.

### A1.3 3D ISO + RISK views (`3d1.png`, `3d2.png`)

- Pink = T+0 mark (rounded hill)
- Cyan/green = expiration tent
- Yellow dots = three strikes
- Lower/upper BE labeled

**The surface is precomputed** once entry (strikes + debit/IV) is known. You only identify when price intersects the surface.

**Clarification locked later:** the path \((S(t), \tau(t))\) is **on the surface the whole day**. Height \(V\) exists at every minute. Events are **contour crossings** (V=0 BEs, target, stop, wing, body) plus sampled height — not “whether we found the sheet.”

**[Reviewer · implementable BE law]** Coach’s phrase “V=0 BEs” names the **labeled tent zeros** on the 3D RISK view (lower/upper BE). Those are **expiration-tent** \(\Pi(S,\tau_{\min})=0\), not “package value \(V=0\)” and not T+0 mark-to-entry. Formal split: **§A7**. Coach’s words above are not deleted.

### A1.4 Vol, recompute, budget

**Not perfect:** vol changes over the day, forcing a recompute of the 3D surface. Even that is not difficult — **milliseconds**. Coach does this in **real time** with this model.

Recompute is based on **per-leg volatility**. If those IVs are known, surface calc is not expensive.

**Method summary Coach locked:** a precomputed 3D model that updates periodically and faster if price is approaching an area that converges with the strategy conditions to exit.

Replaying an entire day’s price movement across the surface might take **a few seconds** to open and close a position with the strategy conditions. Fine budget.

### A1.5 Touch ≠ fill · Monte Carlo · distribution

When price touches a contour or surface you must apply some **probability of fill** based on spread, mid, and liquidity. Example: hits the surface 5 times, friction says fill 2 of 5.

Therefore results differ every run even with identical data → the only reasonable thing is a **Monte Carlo** that looks at many instances for each day / each time a strategy is placed.

You could also **vary friction** to simulate different shapes or randomness throughout the day.

This produces a **band** of possible outcomes each day. Coach then corrected: **distribution** is the right word. **The distribution shape will be important** (zero-fill spike, bimodal in/out, skew, fat tails).

### A1.6 Reasonableness + residuals (Coach verdict)

Method is reasonable, not perfect; as good as one can expect given the variables (underlier tape + pricing model + unobservable fills). Residual: IV source, coherent smile vs independent leg vols, open is also a fill, independent coins cluster less than real books, SPX vs SPY proxy.

### A1.7 What Coach said is NOT the v1 default

- Full OPRA / vicinity-minute surface for every nearby strike (harder movie; later, when strike *selection* under a live grid or archived chains exist).
- Stub metrics (fake P&L from capital × constants) — theater; do not use to judge a design.
- Inventing option prices from SPY tape alone and calling it the market.
- A single unseeded equity line as “the” backtest.

### A1.8 Execution / research sequence (Coach lock — binding)

> We will build a **single day first** and test the method and examine the Monte Carlo **distribution**, then we will try **several different days**. We will **learn and refine** the method, discover **reasonable ranges for dial adjustments**.

This is the **execution / research sequence**. It is not optional polish. Formal projection: **SSR17** · **§A4.1** · Arch 31 §B0.1.

### A1.9 Forward walk (same method)

**Forward walk is not a second engine.** After Slice 0 (one day, inspect the distribution) and Slice 1 (several days, learn dials), a forward walk is the **same SSR sheet + path + \(p_{\mathrm{fill}}\) + MC** on **holdout days** that were not used to set dials.

| Step | What |
|------|------|
| In-sample / learn | Slice 0 + Slice 1 days; dials discovered here |
| Forward walk | Later / held-out sessions; **same** `algo_version` / `dial_set_id` |
| Output | Per-day **distributions** (and a pooled holdout distribution). Not stub folds. |

Stub `_stub_forward_walk_metrics` (three synthetic folds) must not be used to judge a design (SSR14). When wired, `validation@1.forward_walk` provenance is `backtest_distribution`.

---

## A2. Ideas inventory (nothing omitted)

Every Coach idea is tagged. **IN-SCOPE** = v1 method law. **FLAGGED** = keep, not erased, not v1-blocking. **DEFERRED** = later program.

| ID | Idea (Coach) | Tag | Notes |
|----|--------------|-----|-------|
| I-1 | Two purposes: VP bins vs options simulation — do not collapse | **IN-SCOPE** | SSR1 |
| I-2 | VP: one number per tick, lowest→highest print | **IN-SCOPE** (VP plane) | Already VP2; SSR does not implement bins |
| I-3 | SPY = 100 bins/point; 348.11→34811 … 773.90→77390; ~42,580 inclusive bins | **IN-SCOPE** (VP geometry example) | Matches `tick_size=0.01`; cite only; P2-3 still gates production write |
| I-4 | Small cacheable VP file; daily tracker appends + rolls a window | **IN-SCOPE** (VP7 / artifact) | Not SSR runtime |
| I-5 | Recreate changing options curve through a session; P&L at any second/minute | **IN-SCOPE** | SSR3, SSR4 |
| I-6 | Minute-by-minute condition for **all strikes in the vicinity** | **DEFERRED** | Harder movie; not v1 default |
| I-7 | Easier equivalent: overlay full multi-leg curve for a day | **IN-SCOPE** | v1 default |
| I-8 | Place legs: butterfly = body + two wings (2 levels of geometry + body) | **IN-SCOPE** | SSR2 |
| I-9 | Batman = call fly **above** + put fly **below** | **IN-SCOPE** | Placement rule; see A5.2 vs as-built construct |
| I-10 | Curve / BEs from entry to EOD; decay relative to strike levels | **IN-SCOPE** | \(V(S,\tau;\sigma_i)\) |
| I-11 | Watch price intersect the curve; value at intersection | **IN-SCOPE** | Contours + sampled height |
| I-12 | TV Batman rails (`bm1.png`); missing intercept **value** (computable) | **IN-SCOPE** | Rails = geometry; value = sheet |
| I-13 | More complex than price/indicator converge; P&L is the tent | **IN-SCOPE** | Doctrine copy |
| I-14 | 3D ISO+RISK: pink T+0, cyan/green tent, yellow strikes, BEs | **IN-SCOPE** | A6 |
| I-15 | Surface precomputed once entry (strikes + debit/IV) known | **IN-SCOPE** | SSR2, SSR3 |
| I-16 | Path on the surface the whole day; \(V\) every minute | **IN-SCOPE** | SSR4 |
| I-17 | Events = contour crossings + sampled height, not “found the sheet?” | **IN-SCOPE** | SSR4, A7 |
| I-18 | Vol changes force sheet recompute; milliseconds; Coach does this live | **IN-SCOPE** | SSR5, SSR6 |
| I-19 | Recompute from **per-leg** volatility | **IN-SCOPE** | SSR5 |
| I-20 | Precomputed 3D model that updates periodically and **faster near exit convergence** | **IN-SCOPE** | SSR6 |
| I-21 | Full-day replay a few seconds to open and close — fine budget | **IN-SCOPE** | A11 · Part B budget |
| I-22 | Touch ≠ fill; \(p_{\mathrm{fill}}\) from spread, mid, liquidity | **IN-SCOPE** | SSR7 · A8 |
| I-23 | Example: 5 hits, friction fills 2 of 5 | **IN-SCOPE** | Characterization AT |
| I-24 | Results differ every run → Monte Carlo per day / per placement | **IN-SCOPE** | SSR8 |
| I-25 | Vary friction to simulate different shapes / randomness through the day | **IN-SCOPE** | SSR9 |
| I-26 | Band of outcomes → corrected to **distribution**; **shape important** | **IN-SCOPE** | SSR10 |
| I-27 | Shape: zero-fill spike, bimodal in/out, skew, fat tails | **IN-SCOPE** | A9 descriptors |
| I-28 | Reasonable, not perfect | **IN-SCOPE** | Honesty copy |
| I-29 | Residual: IV source | **IN-SCOPE** as named field; **OD-SSR1** for *which* source | SSR11 |
| I-30 | Residual: coherent smile vs independent leg vols | **OD-SSR4** | Default v1 = independent named per-leg (Coach recompute law) |
| I-31 | Residual: **open is also a fill** | **IN-SCOPE** | SSR12 |
| I-32 | Residual: independent coins cluster less than real books | **FLAGGED** | Honesty in meta; no v1 clustered-fill engine |
| I-33 | Residual: SPX vs SPY proxy | **IN-SCOPE** (honesty) | SSR15 · VP5 · OC2 |
| I-34 | Full OPRA vicinity movie later (strike selection / archived chains) | **DEFERRED** | Non-goal v1 |
| I-35 | Stub theater — do not judge a design | **IN-SCOPE** (forbid) | SSR14 |
| I-36 | Do not invent option prices from SPY tape and call it the market | **IN-SCOPE** (forbid) | SSR13 |
| I-37 | No single unseeded equity line as “the” backtest | **IN-SCOPE** (forbid) | SSR8, SSR10 |
| I-38 | Placement may start at beginning of each day | **IN-SCOPE** | Opening print / width rule; **not** VP SoR |
| I-39 | Same method for 1-leg, spread, multi-leg, Batman | **IN-SCOPE** | A5 — same \(V\) sum |
| I-40 | **Single day first**; test method; examine the MC **distribution**; then **several different days**; **learn and refine**; discover **reasonable ranges for dial adjustments** | **IN-SCOPE** (first-class sequence) | SSR17 · §A4.1 · Arch 31 §B0.1 · KD15 |
| I-41 | **Forward walk** is the same SSR engine on **holdout days** after Slice 0/1 dial learning — not stub folds | **IN-SCOPE** (after Slice 1) | §A1.9 · SSR14 · Arch 31 PR 8 |

**[Reviewer]** I-9 vs as-built: `construct.py` currently places **both** Batman flies on the **same** body near spot (`_body_centers(spot)`). Coach’s TV lock is **call fly above + put fly below**. SSR placement law follows **Coach**. Pack construct alignment is a later Juliet seed — do not silently keep same-body Batman as the replay default.

---

## A3. Definitions

| Term | Meaning |
|------|---------|
| **Placement** | Frozen listed structure for one session attempt: product, expiration, legs (side, strike, qty), entry debit/credit \(D^*\), per-leg \(\sigma_i\) snapshot, IV source label, clock of attempt |
| **Sheet / surface** | Precomputed \(V(S,\tau;\{\sigma_i\})\) on a grid in spot × remaining session (τ). Same object as ISO (T+0 hill) + RISK (expiration tent) |
| **Path** | Session underlier samples \(S(t)\) with OPF \(\tau(t)\). The path **is on the sheet**; it does not search for it |
| **Height** | \(V\) or basis-referenced \(\Pi\) at \((S(t),\tau(t))\) |
| **Contour** | Level set of \(V\) or \(\Pi\), or a geometric rail (wing, body). Crossings are **events** |
| **Touch** | Path meets a contour or a fill-relevant sheet region (entry surface, target, stop, …) |
| **Fill** | Stochastic accept of a touch under friction. Open is a fill |
| **Instance** | One seeded Monte Carlo path of fills for one placement on one day |
| **Distribution** | Empirical law of instance outcomes (and shape descriptors). **SoR output** |
| **VP bins** | Separate tick-histogram artifact (VP Spec). Not an SSR input in v1 |
| **Named state** | EXPIRED · NOT TRADED · CHECK LEGS · UPDATING · BUDGET LIMIT · WAITING · HIDDEN · plus SSR-specific **STUB-UNTIL-SSR** (UI) and **NO TAPE** |
| **Slice 0** | First deliverable: **one** RTH session, **one** placement, full seeded MC, **full draw vector + histogram** dumped for Coach inspection |
| **Slice 1** | Several **named** days (trend, chop, gap, …) under the **same** `algo_version` after Slice 0 is examined |
| **Dial / dial-set** | Adjustable method knobs (\(p_{\mathrm{fill}}\), friction shape, \(N\), vol-rebuild threshold, contour proximity, fill lag \(\Delta\)). Starting values are **not frozen**. A learned change ⇒ new `algo_version` or labeled `dial_set_id` |

Money units follow **OPF30**: dollars per package-set, multiplier 100.

\[
\Pi(S,\tau) = \bigl(V(S,\tau;\{\sigma_i\}) - D^*\bigr)\times 100\times \texttt{packages}
\]

Labels follow **OPF11**: SSR heights are `model_t0` (intraday sheet) or `expiration` (tent residual), never unlabeled `mark` unless a live/held mid is actually used. Replay outputs are `historical` at the pack boundary.

---

## A4. Laws (SSR1–SSR17)

| ID | Law |
|----|-----|
| **SSR1 — Two purposes** | VP bins and options surface replay are **distinct** artifacts, jobs, and SoRs. A VP file is not an options backtest. An SSR run is not a volume profile. Placement **must not** require production VP bins (P2-3 is OPEN). |
| **SSR2 — Placement freeze** | Once entry is known — **listed** strikes (named `listed_source`) + qty + \(D^*\) + per-leg IV snapshot — geometry is **frozen** for that placement. Rebuilds change **vol** (and therefore the sheet), not the strikes. Unlisted or unplaceable legs → **NOT TRADED** (or CHECK LEGS); never invent strikes. Slice 0 **must** pass `listed_source ∈ {fixture, archive}` or fail named — **no** silent `strike_step` default, **no** `construct._mid`, **no** `chain_stub`. |
| **SSR3 — Precomputed \(V\)** | After freeze, compute the sheet \(V(S,\tau;\{\sigma_i\})\). T+0 hill and expiration tent are two τ-slices of the **same** \(V\). Do not re-search a closed form at each print as if the sheet did not exist. |
| **SSR4 — Path always on the sheet** | For every sample \(t\) in the session clock, \((S(t),\tau(t))\) has a height. Events are **contour crossings** plus sampled height — never a boolean “did we find the sheet?” Missing tape → **NO TAPE**, not a blank PnL. |
| **SSR5 — Per-leg vol rebuild** | Sheet rebuild uses **per-leg** \(\sigma_i\), not a single unsigned vol unless that is the **named** IV source for every leg. Independent-leg default is lawful in v1; a coherent smile is **OD-SSR4**, not a silent swap. |
| **SSR6 — Adaptive refresh** | Rebuild **periodically** and **faster** when price approaches an exit-relevant contour (target, stop, BE, wing/body rails used by exit_rules). Budget: rebuild in **milliseconds**. |
| **SSR7 — Touch ≠ fill** | A contour/surface touch is a **candidate**. Fill is a Bernoulli (or friction-shaped) trial from spread, mid, and liquidity. Example characterization: 5 touches → expected 2 fills under the locked example friction — **not** a guarantee of those exact counts. |
| **SSR8 — Seeded ensemble MC** | Every run carries `run_id`, `algo_version`, **`seed`**, and **`N`**. One unseeded equity line is **not** a backtest. Identical inputs + seed ⇒ reproducible instance set. |
| **SSR9 — Friction shapes** | Friction is a first-class input (`friction_id` + params). Varying friction is how we simulate different shapes / intra-day randomness. Shape of the **outcome distribution** is the object of study, not a nuisance. |
| **SSR10 — Distribution is SoR** | Persist the per-placement **distribution** (draw vector or sufficient statistics **plus** shape descriptors). A mean, a max, or a pretty line may be derived; they are not the SoR. Coach’s correction stands: **distribution**, not “band,” is the word. |
| **SSR11 — Named IV source** | Every \(\sigma_i\) carries `iv_source` (OPF8 cascade tokens + SSR tokens in A8.3). Missing IV → named state, not a silent 20% or unlabeled VIX. |
| **SSR12 — Open is a fill** | Entry at the open (or first eligible clock) is subject to the **same** fill law. A zero-fill spike is a **valid, important** shape, not a failed job. |
| **SSR13 — Model is not the tape** | Underlier tape supplies \(S(t)\). Option values come from the **named model** (OPF engines) on frozen legs + named IVs. It is **forbidden** to invent option prints from SPY tape alone and label them the market. |
| **SSR14 — No stub as measurement** | `_stub_backtest_metrics` / `_stub_forward_walk_metrics` must not be used to judge a design. Until SSR ships, UI/API keep `data_provenance.source=stub` and a **named** waiting/stub state. After SSR, provenance is `backtest_distribution` (already reserved in Development Spec §4). |
| **SSR15 — SPY / SPX honesty** | Coach’s TV chart is **SPX**; campaign tape is **SPY**. Proxy use must be labeled (`series_ticker`, `proxy_of`, `price_space`) per VP5 / OC2. **Never** center SPX strikes on a raw SPY print without a declared mapping. |
| **SSR16 — Same \(V\) for every structure** | 1-leg, vertical, fly, Batman (two flies), BWB — **one** sum. No special Batman pricing algebra. Batman is two frozen flies on the same sheet. |
| **SSR17 — Slice law (single day first)** | The v1 **first deliverable** is **one RTH session**, **one placement** (Batman **or** a single fly), full Monte Carlo, **inspect the distribution shape** before adding more days. Several different days come **next**, then learn/refine and discover dial ranges. A year job, stub replacement, and Strategy Lab wiring **must not** precede that inspection. Dials listed in this thesis are **starting, not frozen**. Changing a dial after learning ⇒ new `algo_version` or labeled `dial_set_id`. |

Heritage (binding, not restated as new SSR numbers): OPF1–33, DL-309 representable-or-named, no MSC, config fail-loud, process outcomes only.

### A4.1 Single-day first / learn then dials (Coach I-40 · SSR17)

Coach (verbatim, binding sequence — not polish):

> We will build a **single day first** and test the method and examine the Monte Carlo **distribution**, then we will try **several different days**. We will **learn and refine** the method, discover **reasonable ranges for dial adjustments**.

| Slice | What ships | Exit |
|-------|------------|------|
| **Slice 0** | One RTH session · one structure (Batman **or** a single fly) · \(N\) worlds · dump the **full draw vector** + **histogram** + required shape descriptors (zero-fill mass, bimodality flag, skew, tails) | **Human/Coach** examines the shape. Method is tested on that day. **No** multi-day rollup required. |
| **Slice 1** | **Several named days** (at least: trend, chop, gap — names recorded) with the **same** `algo_version` / `dial_set_id` | Compare shapes **across** days. Still no year job. |
| **Learn / refine** | Adjust dials only after Slice 0 (and usually Slice 1) evidence | New `algo_version` or `dial_set_id`. Do not silently mutate Slice 0’s frozen dials. |

**Dials** (starting discussion values — **not frozen**; discovered from those runs):

| Dial | Starting (discussion only) | Frozen when |
|------|----------------------------|-------------|
| \(p_{\mathrm{fill}}\) / `SSR_PFILL_P0` | `0.4` (`coach_2_of_5` AT) | After Slice 0/1 shape review |
| Friction shape | `coach_2_of_5` or `const` | Same |
| \(N\) | **200** (OD-SSR2 starting) | Same |
| Vol-rebuild threshold / period | `sticky_entry` (no rebuild) for Slice 0 | OD-SSR1 + learning |
| Contour proximity \(\delta\) (adaptive refresh) | Off for Slice 0; **implement in PR 4** (e.g. start 0.25× wing) | After Slice 1; **not** gated on year/SL |
| Fill lag \(\Delta\) (touch must persist or re-touch after \(\Delta\)) | **0** (every clock touch is a trial) | After seeing clustering vs independent coins (I-32) |

**[Reviewer]** Fill lag \(\Delta\) is a named dial so Slice 0 can start honest (independent coins) and later absorb Coach’s residual that real books cluster — without pretending the spec already knows \(\Delta\).

Which **calendar day** for Slice 0 inspect is **OD-SSR8**. Slice 0 **default triad is (2)** (SPY+SPY+BSM `research_euro_approx`). Triad (1) SPX+SPY is allowed only with a named `--s-map` (§A4.2). CLI still requires explicit `--day --series --product --engine`.

### A4.2 Slice 0 implementability lock (starting, not method-frozen)

PR 1 **must** implement this box. Values are **starting-for-run**, not frozen method law (SSR17). Changing them after learning ⇒ `algo_version` / `dial_set_id`.

#### Listed strikes (SSR2 / DL-309)

Required flag `--listed-source`:

| `listed_source` | Meaning |
|-----------------|---------|
| `fixture` | Checked-in JSON (§A4.2 fixture schema). Meta **`listed_source=fixture_grid`** — **not** the market. `strike_step` allowed **only** as a named field **inside that file** (never a silent 1.00/5.00 default). |
| `archive` | OPF `archive_get` generation for `--product` / `--expiration`; legs must exist on that dual-side map. |
| *(omitted / other)* | **NOT TRADED** — do not place. |

**Forbidden in `ssr/placement.py`:** `strategy_packs.packs.butterfly.construct._mid`, `strategy_packs.chain_stub.build_stub_chain`, `symbol_profile.kind_defaults` as listed SoR, silent `strike_step or 5.0`.

AT-SSR-2 **runs on the CLI path** (missing listed file / missing strike on archive → named state, exit ≠ 0).

#### Engine × product × series triad (required flags)

| Flag | Required | Slice 0 |
|------|----------|---------|
| `--series` | yes | Tape ticker |
| `--product` | yes | Structure product |
| `--engine` | yes | **`bsm_european` only.** `--engine crr_american` → usage error / named state. CRR is a later named path (do not claim AT-SSR-5/15). |

**Slice 0 default = triad (2)** (worked CLI; AT-SSR-19 fixture):

`--product SPY --series SPY --engine bsm_european` + **`quality=research_euro_approx`**. Honest research euro on equity tape. **Not** a production-grade American label (OPF-L0-R3: no SPY discrete dividend schedule in `default_static_facts()`).

**Triad (1) allowed only with a named \(S\)-map** (Coach TV product + campaign tape):

`--product SPX --series SPY --engine bsm_european` + SSR15 labels **and required** `--s-map` + `--proxy-of SPX` + `--price-space product`.

`--s-map` ∈ {`identity` | `ratio_10` | `fixture_ratio`}:

| `s_map` | \(S_{\mathrm{product}} = f(S_{\mathrm{series}})\) |
|---------|-----------------------------------------------------|
| `identity` | \(S_{\mathrm{product}} = S_{\mathrm{series}}\) — **fail loud** if `--product` ≠ `--series` (incoherent SPY \(S\) vs SPX \(K\)) |
| `ratio_10` | \(S_{\mathrm{product}} = 10 \times S_{\mathrm{series}}\) (labeled heuristic, not market) |
| `fixture_ratio` | \(S_{\mathrm{product}} = \rho \times S_{\mathrm{series}}\); \(\rho\) from the listed fixture field `s_ratio` (required in that file) |

Apply \(f\) to the **opening print and every path sample** before snap and before sheet eval. Labels without \(f\) do **not** make \(V(S,\tau)\) well-defined.

**When `--product` = `--series`:** `--s-map` defaults to `identity` (or omit). `--proxy-of` / `--price-space` not required.

**Forbidden Slice 0:** CRR; silent BSM via `ProductDiv()` as production-grade American; triad (1) without `--s-map`; `s_map=identity` with product≠series; any hidden default triad.

OD-SSR8 is the **calendar day** (and Coach may still pick triad 1 after seeing triad 2). CLI never invents the triad.

#### Fixture JSON schema + Batman snap (Slice 0)

Minimal `listed_source=fixture` file (PR 1 must validate; extra fields ignored):

```json
{
  "product": "SPY",
  "expiration": "YYYY-MM-DD",
  "listed_source": "fixture_grid",
  "strikes": [540.0, 541.0, 542.0],
  "strike_step": 1.0,
  "s_ratio": null
}
```

| Field | Law |
|-------|-----|
| `product` | Must equal `--product` |
| `expiration` | Must equal `--expiration` |
| `listed_source` | Must be `fixture_grid` |
| `strikes` | Sorted unique listed strikes in **product** points (required, ≥ 3 for a fly) |
| `strike_step` | Optional; **only** inside the file; never a CLI silent default |
| `s_ratio` | Required if `--s-map fixture_ratio`; else ignored |

`--width` is in **`--product` points** (SPY points for triad 2; SPX points for triad 1).

**Slice 0 Batman snap** (locks OD-SSR5 for PR 1 only; later offsets remain OD-SSR5):

Let \(S_0 = f(\text{opening print of } \texttt{--series})\). `listed_snap(x)` = nearest strike in `strikes` (ties: lower).

- `body_put = listed_snap(S0 − width)`
- `body_call = listed_snap(S0 + width)`
- put wings: `body_put ± width/2` each snapped
- call wings: `body_call ± width/2` each snapped

**Every** of the six strikes must be **∈ `strikes` exactly** after snap (or `listed_snap` landed on that value). Else **NOT TRADED**. Single fly: one body = `listed_snap(S0)` (or `S0 ± width` if `--family single` + `--direction call|put` uses the corresponding side of open — **Slice 0 default single:** body = `listed_snap(S0)`, wings `body ± width/2`).

Worked triad-2 width: `--width 4` is four **SPY** points (a few strikes on a penny/dollar grid). Do **not** use `--width 4` with `--product SPX` (that is a one-strike fly). Triad 1 uses a realistic SPX width (e.g. 20–50) **and** `--s-map`.

#### \(D^*\), exits, open-fail, EOD (Slice 0)

| Knob | Slice 0 policy (starting, labeled) |
|------|-------------------------------------|
| \(D^*\) | \(D^* = V(S_{\mathrm{fill}},\tau_{\mathrm{fill}})\) at the accepted open fill. `d_star_source=model_t0`. No `--debit` required. |
| Exits | `exit_policy=hold_to_session_end`. Geometric wing/body/BE **events are recorded**; they do **not** force exit. House `exit_rules` notes/booleans in `house_designs.py` are **not** a numeric SoR. `--target` / `--stop` optional later dials — absent in Slice 0. |
| EOD | **Forced flatten** at last clock / tent \(V\) (`flatten=forced_session_end`). OD-SSR7 stays open for later \(p_{\mathrm{fill}}\)-at-close. |
| Open fail | `zero_fill=true`, `pnl_dollars=null`, **no path walk**. |

**Slice 0 P&L MC is structurally two-point.** The only stochastic input to `pnl_dollars` is the **open** Bernoulli. Every filled instance shares the same \(D^*\) and the same path \(V(t)\) through the close → **identical** EOD \(\Pi\). The draw vector is at most two atoms: unfilled (`pnl_dollars=null`, mass \(\approx 1-p_0\)) and one hold-to-close \(\Pi\) (mass \(\approx p_0\)).

That **is** the first shape to examine (Coach I-27 zero-fill spike). It is **not** evidence the method failed. Intraday touch trials increment `fill_touches` / `fill_accepts` (AT-SSR-7) but **do not alter `pnl_dollars`** until exit dials exist. Shape fields `n_in`, `n_out`, `mass_below_stop`, `mass_above_target` are **`null`** on Slice 0 (not 0).

#### Expiration / τ grid (Slice 0)

`--expiration` **defaults to `--day`** (0DTE, labeled). Grid \(\tau\) is always `tau_meta["tau"]` to **`--expiration`**, never a “session remaining” clock unless that equals OPF τ (0DTE PM). If the caller sets `--expiration` ≠ `--day` and \(\tau\) at the open is longer than one session, the sheet is still built on OPF τ to that expiration (not a session-only axis). Fail loud if `--expiration` is omitted **and** `--day` is missing.

#### Contours (Slice 0)

See §A7 split. Slice 0 emits `be_exp_lo` / `be_exp_hi` (tent). Optional `be_t0` only if `--emit-be-t0`. Never emit `be_*` for \(V=0\).

#### Frozen-for-run numerics (PR 1 implements only these)

| Knob | Slice 0 value |
|------|----------------|
| Clock | `1m` last print |
| Grid | **Uniform** \(N_S=80\), \(N_\tau=80\); pad = 1 wing width. **No densify** on Slice 0 (PR 4 / SSR6). |
| Interpolation | bilinear in \((S,\tau)\); under `sticky_entry`, **eval** as \(\tau\) walks (no σ rebuild) |
| Friction | **`coach_2_of_5`** (default) or **`const`**. Other `friction_id`s are **not** in PR 1 |
| \(N\) | 200 starting |
| packages | 1 (`--packages` default 1) |
| IV | `--iv` required numeric; `iv_source=cli`; policy `sticky_entry`. Tokens allowed on placement: `cli` \| `sticky_entry` \| `missing` only |
| RNG | `random.Random(_ssr_seed_mix(seed, day, placement_id, n))` where `_ssr_seed_mix` = first 8 bytes of **SHA-256** over `f"{seed}|{day}|{placement_id}|{n}"` as big-endian uint64. **Forbidden:** Python `hash()` (process-randomized; AT-SSR-8 flakes) |
| Histogram | Equal-width bins on **filled** `pnl_dollars` only (skip `null`). Edges `hist_lo = min(filled)`, `hist_hi = max(filled)`; if all unfilled, omit histogram and set `hist=null`. If `hist_lo == hist_hi` (Slice 0 two-point: every fill shares one \(\Pi\)), emit **`hist=null`** and rely on `pnl_shape=two_point_open_vs_eod` + `zero_fill_mass` — do **not** invent 21 zero-width bins. **`n_bins=21`** only when `hist_hi > hist_lo`. Zero-fill lives **only** in `zero_fill_mass` — do not substitute 0 for `null`. Persist `edges[]` + `counts[]` when a real range exists |
| Fill lag \(\Delta\) | 0 |
| Vol rebuild | `sticky_entry` (eval only). **Implement** `periodic` / proximity after Slice 1 (**PR 4**), not in the year PR |

#### Qty sign (AT-SSR-14)

Public helper `ssr.value.signed_qty(side, qty) -> float`:

- Pack construct `side=buy` + positive qty → `+qty`
- Pack construct `side=sell` + positive qty → `−qty`
- Already-signed `LegIntent.qty` passes through

Batman body is \(q=-2\). Do not feed construct’s positive `qty=2` into \(V\) without the converter.

#### CLI vs plane env (Slice 0)

`python -m ssr.cli replay-day` **runs without `LABS_SSR=1`**. It uses the A4.2 constants (overridable by flags). `LABS_SSR_GRID_*` / `PAD_WINGS` / `HIST_BINS` are fail-loud **only when `LABS_SSR=1`** (Development plane). Research CLI does not wait on the plane.

---

## A5. Position / placement model

### A5.1 Package value (normative)

Let legs \(i=1\ldots n\) with signed quantity \(q_i\) (OPF: +long / −short; fly body is typically \(q=-2\)), strike \(K_i\), right \(s_i\), expiration (hence \(\tau_i\)), and vol \(\sigma_i\).

\[
V(S,\tau;\{\sigma_i\}) = \sum_i q_i\, u_i\bigl(S,K_i,\tau_i(t),r,q_{\mathrm{div}},\sigma_i,s_i\bigr)
\]

where \(u_i\) is:

| Product class | Engine | Code | Slice 0 |
|---------------|--------|------|---------|
| European index (SPX/SPXW-style) | Black–Scholes–Merton | `opf.engines.bsm.bsm_european_price` | **Allowed** (`--engine bsm_european`) |
| American equity | CRR binomial (default **80** steps, \(O(n^2)\) Python) | `opf.engines.crr.crr_american_price` | **Not** Slice 0 default. Later named path only. **Do not** claim AT-SSR-5/15 on CRR. |

**Slice 0 triad** (§A4.2): required `--product --series --engine`. `default_static_facts()` registers only SPX/SPXW as European; unknown products (including SPY) fall through to `ProductDiv()` (also European, \(q=0\)) — that fallback is **not** a production-grade American label (OPF-L0-R3). SPY + BSM must set `quality=research_euro_approx`.

\(r\), \(q_{\mathrm{div}}\), settlement, τ floor: **MarketStaticFacts** + `opf.tau.tau` **dict** — use **`tau_meta["tau"]`** (floored year-fraction). Do **not** pass the dict as a float; do **not** silently use `wall_tau` for the sheet (AT-SSR-17: 0DTE afternoon is the floored `tau`). 0DTE afternoon is first-class (1-minute τ floor, not a 1-hour clamp).

**Batman:** \(V = V_{\mathrm{call\,fly}} + V_{\mathrm{put\,fly}}\) — same sum, six (typical) legs after `signed_qty` (§A4.2).

Entry debit \(D^*\) on Slice 0 is **model-at-fill** \(V(S_{\mathrm{fill}},\tau_{\mathrm{fill}})\), `d_star_source=model_t0` (§A4.2). Unfilled open → `zero_fill`; no fantasy \(D^*\); **no walk**.

### A5.2 Where the legs sit (Coach)

| Structure | Geometry |
|-----------|----------|
| Single option | One listed strike |
| Vertical | Two listed strikes, one right |
| **Butterfly** | **Body + two wings** (three listed strikes, one right). “2 with butterfly” = the two wing rails plus the body. |
| **Batman** | **Call fly above** price + **put fly below** price. Two independent three-strike geometries. Horizontal rails = strike geometry. Started at the **beginning of each day**. |
| BWB | Asymmetric wings; still listed; still one \(V\) sum |

**v1 placement clock (no VP SoR):**

1. Session **opening print** of the **declared `--series`** (campaign tape parquet).
2. `--width` in **`--product` points** (Slice 0). Pack `width_points_*` may feed later slices.
3. **Snap only onto a named listed set** (`listed_source=fixture` schema **or** `listed_source=archive`). Else **NOT TRADED**. **Forbidden:** silent `strike_step or 5.0`, `kind_defaults`, `chain_stub`, `construct._mid`.
4. **Slice 0 Batman:** `body_put = snap(S0 − width)`, `body_call = snap(S0 + width)`, wings `body ± width/2`, all ∈ fixture or **NOT TRADED** (§A4.2). OD-SSR5 stays open for later offsets.

**[Reviewer]** Unlabeled 10× is forbidden. **Slice 0 default is triad (2)** (same space). Triad (1) requires `--s-map` applied to open and every path sample. `s_map=identity` with product≠series **fails loud**.

### A5.3 Decay relative to strike levels

With strikes frozen, time enters only through \(\tau(t)\) (and through \(\sigma_i(t)\) on rebuild). The T+0 hill **decays toward** the expiration tent. That is the “decay relative to the strike levels.” There is no separate ad-hoc theta number required for v1; \(\partial V/\partial\tau\) is implied by the sheet.

---

## A6. \(V(S,\tau;\sigma_i)\) and the ISO / RISK views

Coach’s 3D views **are** the sheet:

```text
        V
        │          pink = T+0  (τ = τ_now)     rounded hill
        │         cyan/green = expiration (τ → 0+)   tent
        │
        │              ● body     ● wing     ● wing     yellow
        │         ─────┴──────────┴──────────┴─────     rails
        │            BE_lo              BE_hi
        └── S ────────────────────────────────────
```

| View | Slice | OPF11 label |
|------|-------|-------------|
| ISO / T+0 (pink) | \(V(S,\tau_{\mathrm{now}};\{\sigma_i\})\) or \(\Pi\) | `model_t0` |
| RISK / expiration (cyan/green) | \(V(S,\tau_{\min};\{\sigma_i\})\) → intrinsic package | `expiration` |
| Path overlay | \(\bigl(S(t),\tau(t),V(t)\bigr)\) | `historical` at pack edge |

**Grid (Slice 0 frozen-for-run — §A4.2):** **uniform** \(N_S=80\), \(N_\tau=80\) (no densify). Pad = **1 wing width** (fail-loud if width missing). Env fail-loud only when `LABS_SSR=1`. CLI uses these constants without the plane. Later slices may densify (SSR6 / PR 4).

- **S axis:** [min wing − pad, max wing + pad] in **product** \(S\) (after `--s-map` if any).
- **τ axis:** always `tau_meta["tau"]` to **`--expiration`**. Slice 0 default `--expiration = --day` (0DTE). Session remaining equals OPF τ **only** for 0DTE PM.

Interpolation: bilinear in \((S,\tau)\). Extrapolation off the S pad is **not** silent — clamp + `off_grid=true` in the sample record, or expand pad and rebuild.

---

## A7. Contours and events

Contours are computed on the current sheet (and recomputed on vol rebuild).

**Do not name \(V=0\) as a breakeven.** Package value \(V\) for a debit fly is typically **positive** inside the wings. Coach’s “V=0 BEs” in §A1.3 are the **labeled expiration-tent P&L zeros** (RISK view). If Slice 0 sets \(D^*=V(S_{\mathrm{fill}},\tau_{\mathrm{fill}})\), then \(\Pi=0\) at fill **by construction** — that is **not** a tent BE event.

| Contour | Definition | Typical use |
|---------|------------|-------------|
| **`be_exp_lo` / `be_exp_hi`** | Level set of **expiration tent** \(\Pi(S,\tau_{\min})=0\) (intrinsic package \(= D^*\)). Mostly geometric in \(S\). | Coach lower/upper BE labels on `3d1` / `3d2`. **Slice 0 emits these.** |
| **`be_t0`** | Optional T+0 mark-to-entry \(\Pi(S,\tau_{\mathrm{now}})=0\). **Not** the tent BE. | Opt-in `--emit-be-t0`. Includes \(S_{\mathrm{fill}}\) at fill time — do not treat as tent BE. |
| **target** | \(\Pi \ge \Pi_{\mathrm{target}}\) when a **numeric** target is supplied (`--target`) | **Not Slice 0.** House `exit_rules` notes are not numeric. |
| **stop** | \(\Pi \le \Pi_{\mathrm{stop}}\) when `--stop` supplied | **Not Slice 0.** |
| **wing** | \(S = K_{\mathrm{wing}}\) (each wing rail) | Geometric touch; TV horizontal rails. Recorded; does **not** exit Slice 0. |
| **body** | \(S = K_{\mathrm{body}}\) (each body) | Geometric touch. Recorded; does **not** exit Slice 0. |
| **session_end** | τ hit floor / last clock | Slice 0: **forced flatten** at last \(V\) (`flatten=forced_session_end`). OD-SSR7 later. |

**Event record (normative fields):**

```text
{
  "t": ISO-8601 ET,
  "kind": "be_exp_lo"|"be_exp_hi"|"be_t0"|"target"|"stop"|"wing"|"body"|"session_end"|"open_attempt",
  "S": number,
  "tau": number,
  "V": number,
  "Pi": number,
  "touch": true,
  "fill": false,
  "p_fill": number,
  "u": number,          // draw ~ U(0,1) from seeded RNG
  "leg_or_rail": string
}
```

Sampled height (Coach: every minute) is a **time series**, not only events:

```text
{ "t", "S", "tau", "V", "Pi", "sheet_gen": int }
```

---

## A8. Fill probability, open-as-fill, Monte Carlo, friction

### A8.1 Touch window

A **touch** occurs when the path hits or crosses a fill-eligible contour, or remains inside a fill-eligible band for a discrete clock step (v1: 1 second or 1 minute — config `ssr_clock`). Multiple touches in one instance are **independent trials under v1** (Coach residual I-32: real books cluster more; **FLAGGED**, disclose in `meta.residuals`).

### A8.2 \(p_{\mathrm{fill}}\) (functional form is **OD-SSR3**)

v1 **placeholder law** (must stay labeled `p_fill_model=thesis_v0` until Coach accepts a form):

\[
p_{\mathrm{fill}} = p_0 \cdot \phi_{\mathrm{spread}} \cdot \phi_{\mathrm{mid}} \cdot \phi_{\mathrm{liq}} \cdot \phi_{\mathrm{friction}}(t)
\]

| Factor | Intent (Coach: spread, mid, liquidity) | Thesis default until OD-SSR3 |
|--------|------------------------------------------|------------------------------|
| \(p_0\) | Base (example 2/5 = 0.4) | Config `SSR_PFILL_P0`, fail-loud when plane enabled. **Starting, not frozen** (SSR17) |
| \(\phi_{\mathrm{spread}}\) | Wider bid/ask → harder fill | \(1 / (1 + \kappa_s \cdot \mathrm{spread}/\mathrm{mid})\) when quotes exist; **1** and `spread_source=missing` otherwise |
| \(\phi_{\mathrm{mid}}\) | Touch through mid vs through wing of quote | 1 if last ≤ mid for buys (etc.); haircut if only last print, no NBBO |
| \(\phi_{\mathrm{liq}}\) | Size / typical size | 1 if unknown; never invent OPRA size |
| \(\phi_{\mathrm{friction}}(t)\) | SSR9 shape through the day | See A8.5 |

**Quotes** from raw `quotes/` parquet may inform spread when present (VP21 collects them). Absence is a **label**, not a reason to skip the day.

### A8.3 IV sources (named)

**Slice 0 tokens only:** `cli` | `sticky_entry` | `missing`. `--iv` is required; `iv_source=cli`. Do **not** call `LegPricer._cascade_iv` (private underscore API; needs a generation). Do **not** invent a smile from SPY.

As-built honesty (do not pretend otherwise):

- `opf.tau.tau` returns a **dict**; sheet uses `tau_meta["tau"]`.
- `_cascade_iv` maps both VIX and VIX1D to `iv_source="vix"` — there is **no** returned token `vix1d`.
- Token `stored` is on the `IvSource` Literal and in OPF v0.1 text; **`_cascade_iv` never returns it**.
- Later (post–Slice 0, when a generation exists) allowed cascade tokens are those **actually returned**: `exact` | `nearest` | `closest_dte` | `atm_exp` | `vix` | `locked` | `missing`.

**OD-SSR1** chooses the **default policy** after Slice 0 (sticky vs updating). Slice 0 is `sticky_entry` + `cli`. Periodic rebuild is **implemented in PR 4** (after several days), not invented from SPY.

### A8.4 Ensemble

```text
for n in 1..N:
    rng = random.Random(_ssr_seed_mix(seed, day, placement_id, n))  # SHA-256; §A4.2
    attempt open (SSR12)
    if not filled:
        record zero_fill=true, pnl_dollars=null
        continue                    # no walk
    walk path; record wing/body/be_exp events (Slice 0: not exits)
    at session_end: forced flatten at last V
    record instance outcome
reduce → two-point P&L distribution + histogram(filled only) + shape
              # n_in/n_out/stop masses = null on Slice 0
```

`N` default is **OD-SSR2**. Thesis **starting** value for research: **N=200** (stable shape sketch) — **not frozen**. Slice 0 dumps the full draw vector so Coach can see whether 200 is enough to read the shape. Development UI later may use a learned \(N\) under a new `dial_set_id`.

### A8.5 Friction shapes (SSR9)

| `friction_id` | Behavior | When |
|---------------|----------|------|
| `const` | \(\phi=1\); only \(p_0\) | **PR 1** |
| `coach_2_of_5` | \(p_0=0.4\) const — characterization of Coach’s example | **PR 1 default** |
| `open_wide` | Lower \(p\) first 15 minutes | After Slice 0 |
| `lunch_thin` | Lower \(p\) 11:30–13:30 ET | After Slice 0 |
| `close_rushed` | Higher **or** lower \(p\) last 30 minutes — **OD**, do not pretend we know | After Slice 0; pick a signed behavior before implementing |
| `random_day` | \(\phi(t)\) redrawn each clock step from a seeded Beta | After Slice 0 |

Runs **must** record `friction_id`. Comparing shapes **across** friction ids is a first-class research move. **PR 1 implements only `const` and `coach_2_of_5`.**

---

## A9. Output: per-placement distribution + shape

### A9.1 Instance outcome

```text
{
  "instance": int,
  "zero_fill": bool,
  "entry_fill_t": ISO-8601 | null,
  "exit_t": ISO-8601 | null,
  "exit_reason": "session_end"|"unfilled"|"check_legs"|"target"|"stop",
  // Slice 0: session_end (forced flatten) or unfilled only
  "pnl_dollars": number | null,     // null iff zero_fill
  "mae_dollars": number | null,
  "mfe_dollars": number | null,
  "fill_touches": int,
  "fill_accepts": int,
  "minutes_in": number | null
}
```

### A9.2 Distribution SoR (SSR10)

Persist **either**:

- **Slice 0 required:** full draw vector `pnl_dollars[n]` + histogram dump (not sufficient stats alone), **or** later
- sufficient stats **plus** the shape block (if N is later huge).

**Shape descriptors (required, Coach I-27):**

| Descriptor | Intent |
|------------|--------|
| `n`, `n_zero_fill`, `zero_fill_mass` | Zero-fill **spike** |
| `n_in` / `n_out` (filled) | In vs out of the target rule. **Slice 0: `null`** (no numeric target) |
| `mean`, `median`, `p05`, `p25`, `p75`, `p95` | Location / spread on **filled** PnLs — **not** the SoR alone. Slice 0: mean = the single EOD \(\Pi\) when any fill |
| `skew`, `excess_kurtosis` | Skew + fat tails. Slice 0: may be undefined / `null` on a one-point filled set |
| `bimodal_flag` | Simple dip test; labeled `heuristic`. Slice 0: zero-fill vs one \(\Pi\) is the **named two-point shape**, not a failed MC |
| `mass_below_stop`, `mass_above_target` | Process vs pack rules. **Slice 0: `null`** (not 0) |
| `max_dd_proxy_dollars` | Worst instance path MAE — process, not a promise |

**Forbidden as the only published object:** a single `net_pnl_dollars` with no provenance and no shape.

**Slice 0 disclosure (required in dump meta):** `pnl_shape="two_point_open_vs_eod"`. Do not treat that shape as a bug.

### A9.3 Strategy Lab `validation@1` mapping (when wired)

Development Spec already reserved `data_provenance.source = backtest_distribution`.

```text
validation@1.backtest = {
  status, kind: "is_backtest",
  metrics: {
    mode: "ssr_is",
    label: "In-sample Structure Surface Replay (model sheet + tape + MC)",
    trades: <filled instance-days>,
    max_drawdown_dollars: <from distribution process metric>,
    net_pnl_dollars: <MUST be accompanied by shape; UI shows distribution>,
    shape: { ... },
    primary_metric: <pack primary_metric, computed on instance PnLs if defined>
  },
  data_provenance: {
    source: "backtest_distribution",
    label: "SSR v0 — model surface, not live option prints",
    pack_id: "backtest.structure_surface_replay@0.1.0",
    iv_policy, friction_id, seed, N,
    series_ticker, proxy_of, price_space,
    algo_version
  }
}
```

**[Reviewer]** Do not put `mean` PnL in the same visual weight as stub’s single `net_pnl_dollars` without the shape. Echo/Tango review before any member UI.

---

## A10. Acceptance tests (thesis — become AT-SSR* at GO)

| AT | Criterion |
|----|-----------|
| **AT-SSR-1** | VP job and SSR job do not share SoR tables or output filenames; running SSR does not write `vp_bins_v3`. |
| **AT-SSR-2** | **CLI path:** missing `--listed-source`, missing fixture file, or strike absent from fixture/archive → `NOT TRADED`, no \(D^*\), no invented mid. Does **not** pass if only a unit helper fails. |
| **AT-SSR-3** | After freeze, sheet evaluate at entry \((S_0,\tau_0)\) is defined; path samples at every minute of a fixture session have \(V\). |
| **AT-SSR-4** | Fixture path that never “hunts” still has height (SSR4). |
| **AT-SSR-5** | Changing one leg \(\sigma\) rebuilds sheet; \(V\) at a fixed \((S,\tau)\) moves; `sheet_gen` increments. Rebuild wall time on a 6-leg Batman, 80×80 grid, **BSM**, **< 50 ms** on MiniTwo-class CPU (Coach: milliseconds). **Not claimed for CRR.** Implemented with PR 4 rebuild (may be unit-tested in PR 1 eval-only). |
| **AT-SSR-6** | Adaptive policy: when \(|S-S_{\mathrm{contour}}|\) below config threshold, rebuild/eval cadence increases (measurable tick count). |
| **AT-SSR-7** | `coach_2_of_5` + 5 forced touches + fixed seed → `fill_accepts` distribution has mean near 2; **not** 5/5. |
| **AT-SSR-8** | Same inputs + same seed ⇒ byte-identical instance PnL vector. Different seed ⇒ not identical (with overwhelming probability). |
| **AT-SSR-9** | Open-fail instances appear as `zero_fill=true`; `zero_fill_mass > 0` when \(p_0<1\). |
| **AT-SSR-10** | Output contains shape block; a consumer that reads only `mean` is not the SoR test. |
| **AT-SSR-11** | Every persisted σ has `iv_source ≠ null`. Missing IV fixture → named state, job not “green.” |
| **AT-SSR-12** | SPX product + SPY series without `--s-map` **and** `proxy_of` / `price_space` → fail loud. `s_map=identity` with product≠series → fail loud. |
| **AT-SSR-13** | Stub function still labeled; SSR path never writes `source: stub`. SSR numbers never appear without `backtest_distribution`. |
| **AT-SSR-14** | 1-leg, 2-leg vertical, 3-leg fly, 6-leg Batman share the same `package_value()`; Batman = sum of two flies to machine epsilon. |
| **AT-SSR-15** | Day replay fixture (one SPY RTH parquet + one frozen Batman) completes in **a few seconds** on MiniTwo-class (Coach budget). |
| **AT-SSR-16** | Debit-fly fixture whose **tent** BEs (`be_exp_*`) are **away from \(S_0\)**. Path crossing a tent BE emits `be_exp_lo` or `be_exp_hi`. Opening print **must not** be the only `be_*` (would mean T+0 \(\Pi=0\) mislabeled). No event kind `be_*` for \(V=0\). |
| **AT-SSR-17** | τ at 15:30 0DTE **<** τ at 15:00 using `tau_meta["tau"]` (not `wall_tau` unless equal). |
| **AT-SSR-18** | No Massive client import from `server/ssr/` or `web/` SSR callers. Tape is parquet; IVs are named snapshots or VIX files already on disk. |
| **AT-SSR-19** | **Mergeable fixture:** CLI on **one** fixture RTH day + one placement writes the **full** instance draw vector and a histogram. Job **succeeds** without a second day. Multi-day entry points refuse until Slice 1. **Does not close I-40.** |
| **AT-SSR-20** | CLI without `--listed-source` / `--product` / `--engine` / `--series` / `--day` / `--iv` fail-loud. `--engine crr_american` → usage error. `--strike-step` as a CLI flag without a fixture field fails. Product≠series without `--s-map` / `--proxy-of` / `--price-space` fails. |
| **AT-SSR-21** | **Slice 0 Coach inspect (research, blocks PR 3 / I-40):** one complete raw `.ok` RTH day (default triad 2 unless Coach picks triad 1 + `--s-map`); artifact retained. Meta includes `pnl_shape=two_point_open_vs_eod`. Fixture-only merge of PR 1 does **not** satisfy this AT. |
| **AT-SSR-22** | Fixture JSON missing `strikes` / product mismatch / Batman snap producing a strike ∉ `strikes` → `NOT TRADED`. `--width` interpreted in product points. |

---

## A11. Runtime budgets (Coach → measurable)

| Operation | Coach | Thesis target |
|-----------|-------|----------------|
| Sheet rebuild (6-leg, ~80 S × 80 τ, **BSM only**) | milliseconds | **≤ 50 ms** p95 local. **Not** CRR. |
| Denser near-contour patch | included | same budget + small patch |
| One day, one placement, walk + N=200 MC (sheet reused) | a few seconds to open and close | **≤ 8 s** p95 local for N=200, 1-minute clock |
| Naive year, one placement/day, ~252 sessions | tens of minutes | **Not Slice 0.** Budget kept as a later target (OD-SSR6). **SSR17:** do not build the year job to “prove” the method. |

**[Reviewer]** 1-second clock × full tape prints will blow the day budget. v1 path clock is **1-minute last print** (or 1s agg close) for height; optional 1-second clock is a config that must still meet AT-SSR-15 or fail loud.

**Slice 0 budget that matters:** one day, one placement, N starting-200, dump distribution — Coach’s “a few seconds” (AT-SSR-15).

---

## A12. Open Coach ODs

| ID | Topic | Thesis recommendation | Blocks |
|----|-------|----------------------|--------|
| **OD-SSR1** | IV source / update policy | Research CLI: `sticky_entry` from OPF cascade or labeled VIX1D. Live-like rebuild only when a **named** vol series exists. | Default Development wiring |
| **OD-SSR2** | \(N\) default | **Starting 200** (not frozen). Discover from Slice 0/1 whether the shape is readable | Persistence size; Slice 0 dump |
| **OD-SSR3** | \(p_{\mathrm{fill}}\) functional form | Keep `thesis_v0` until Coach accepts; `coach_2_of_5` is the AT, not the market. **Starting, not frozen** | Calling it “the” fill model |
| **OD-SSR4** | Coherent smile vs independent \(\sigma_i\) | v1 independent per-leg (Coach recompute law). Smile = later pack, fail-loud fit (OPF24) | Silent smile |
| **OD-SSR5** | SPX \(S\)-map + later Batman offsets | Slice 0: triad 2 default; triad 1 requires `--s-map`. Snap rule in §A4.2 freezes PR 1 geometry. Later offsets remain OD | Unlabeled 10×; product-space SPX without `--s-map` |
| **OD-SSR6** | Year-scale parallelism | Serial first; parallel days only after AT-SSR-8 seed isolation proven | Multi-worker races |
| **OD-SSR7** | Flatten-at-close fill | Session-end is a fill attempt with its own \(p\) or forced? | EOD residual |
| **OD-SSR8** | **Slice 0 calendar day** (triad default locked) | **Default triad (2):** SPY+SPY+BSM `research_euro_approx`. Need a complete SPY `.ok` RTH day. Coach may later pick triad (1) **with `--s-map`**. CLI still requires `--day --series --product --engine`. | AT-SSR-21 / I-40 inspect |

Residuals Coach already named stay in `meta.residuals[]` even after ODs close.

---

## A13. Explicit non-goals (method)

Repeated for Spec readers who skip the header:

- Full OPRA vicinity movie (I-6 / I-34)
- Stub as measurement (I-35)
- Synthetic option prints from underlier tape labeled as market (I-36)
- Single unseeded line (I-37)
- Production VP bins as a dependency
- Profit-claim marketing of distributions (“expected +$X/day”)
- Broker fill guarantee
- Year / multi-day automation **before** Slice 0 distribution inspection (SSR17 / I-40)

---


---

# Key Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| KD1 | **Two purposes stay split.** SSR does not consume or produce VP bins. Placement uses opening print + width, not P2-3. | Coach I-1–I-4; P2-3 still OPEN (DL-317). |
| KD2 | **v1 method is the easier overlay** (frozen legs + precomputed sheet + path on sheet), not the vicinity OPRA movie. | Coach I-7 vs I-6. |
| KD3 | **SSR is the richer named realization of `backtest.surface_reconstruct`.** `chain_replay` remains OPF default when archive exists. New pack id `backtest.structure_surface_replay@0.1.0`. **Do not inherit silent `vix or 20`.** | Arch 30 slot was “spot path + parametric surface (weaker).” Coach’s sheet **is** that idea done honestly. Do not steal chain_replay. SSR11. |
| KD4 | **SoR output is the seeded MC distribution + shape**, never a single unseeded line. | Coach I-24–I-27, I-37. |
| KD5 | **Reuse OPF engines, τ, MarketStaticFacts, raw_store.** New code lives in `server/ssr/`. | First-principles: build on what exists; no second pricer. |
| KD6 | **Batch / CLI first;** no resolve-path year replay; no Next.js Massive. | OPF1, VP6, request-path hygiene. |
| KD7 | **Open is a fill; touch ≠ fill; friction shapes are inputs.** | Coach I-22, I-25, I-31. |
| KD8 | **IV always named; default thesis policy `sticky_entry` until OD-SSR1.** Independent per-leg vols until OD-SSR4. | Fail loud; Coach residuals. |
| KD9 | **Stub stays until SSR is labeled `backtest_distribution`.** Stub must not judge designs. UI chrome must change when SSR lands. | SSR14; Development Spec §8. |
| KD10 | **SPY tape / SPX chart honesty is fail-loud.** Series-space default until OD-SSR5. | VP5, OC2, Coach I-33. |
| KD11 | **Batman placement follows Coach (call above, put below),** not as-built same-body construct. | Coach Content Law; I-9. |
| KD12 | **Status remains DRAFT/THESIS.** No registry edit, no migration, no stub deletion in this pass. | Coach has not given GO. |
| KD13 | **Same \(V\) sum for 1-leg through Batman.** | SSR16; one engine path. |
| KD14 | **Budgets are acceptance tests** (ms rebuild, few seconds/day). | Coach I-18, I-21. |
| KD15 | **First proof is one RTH day + the MC distribution**, not a year backtest. Fixture merge (AT-SSR-19) ≠ I-40 inspect (AT-SSR-21). Then several named days; then **implement SSR6 rebuild (PR 4)**; then learn dials. Stub replacement and year jobs come later. | Coach I-40 · SSR17 · A1.8 |
| KD16 | **Slice 0 default triad is (2):** SPY+SPY+`bsm_european` + `research_euro_approx`. Triad (1) SPX+SPY allowed only with `--s-map` on open and every path sample. CLI rejects CRR. | Issue 15 · OD-SSR5/8 · OPF-L0-R3 |
| KD18 | **Slice 0 P&L MC is two-point** (unfilled vs hold-to-close \(\Pi\)). That is the first shape. Intraday touches do not change `pnl_dollars`. `n_in`/`n_out`/stop masses = `null`. | Issue 17 · I-40 |
| KD17 | **Slice 0 P&L conventions:** \(D^*=V_{\mathrm{fill}}\) `model_t0`; `hold_to_session_end` forced flatten; open-fail = zero_fill + no walk; tent BEs are `be_exp_*` not \(V=0\). | Issues 3–4 · OD-SSR7 later |

---

# Open Questions

See **§A12 OD-SSR1–8**. Additional product questions (not method):


| Q | Question | Default until Coach |
|---|----------|---------------------|
| **OD-SSR8** | **Which calendar day** for Slice 0 inspect? | **Undecided.** Default triad is (2) SPY+SPY+BSM. Need a complete raw `.ok` SPY session. |
| Q-UI | How does the Design panel show a distribution without looking like a P&L promise? | Echo + Tango **after Slice 0/1** — not before |
| Q-async | Sync vs 202-enqueue for `POST .../backtest` | Enqueue (post–Slice 1) |
| Q-disable | If `LABS_SSR` flips off, keep last SSR bag or allow stub overwrite? | Keep last SSR bag |

---

# References

- Coach lock 2026-08-13 (this document §A1 including **§A1.8 single-day-first sequence**) — visuals `bm1.png`, `3d1.png`, `3d2.png` (conversation artifacts; not in repo)
- `Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md` (v0.2.1)
- `Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.0.md` (DL-309)
- `Specs/FatTail-Labs-Volume-Profile-Histogram-Spec-v0_4.md`
- `Specs/Strategy-Lab-Development-Phase-Spec-v1.0.md`
- `Specs/Strategy-Lab-Strategy-Pack-Architecture-v1.0.md`
- `Architecture/30-options-pricing-foundation.md`
- `Architecture/28-massive-market-bus.md`
- `Architecture/26-strategy-lab-member-timeline.md`
- `Architecture/00-decision-log.md` (DL-317 VP campaign; P2-3 OPEN)
- Code: `server/opf/package.py`, `packs/backtest.py`, `engines/bsm.py`, `engines/crr.py`, `archive.py`, `tau.py`, `static_facts.py`, `leg.py`
- Code: `server/strategy_lab_domain.py` `_stub_backtest_metrics`
- Code: `server/market_data/raw_store.py`, `vp_bins.py`, `parquet_schema.py`
- Code: `server/strategy_packs/packs/butterfly/construct.py`
- UI: `web/components/strategy-lab/DevelopmentValidation.tsx`

---


**Execution design:** see [`Architecture/31-structure-surface-replay.md`](../Architecture/31-structure-surface-replay.md) (modules, CLI, PR plan).
