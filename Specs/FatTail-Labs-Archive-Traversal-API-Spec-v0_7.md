# FatTail Labs — Archive Traversal API Spec v0.7

**Status:** **DRAFT — not BUILD AUTHORITY.** Needs Coach, India (architecture boundary),
Sheldon (estimator and study fit), Foxtrot (StudioOne host). Decision-log entry required.
**Date:** 2026-09-05 · **Short name:** **ATRV** · **Owner:** Juliet (draft) → Alpha / Foxtrot
**Parents:** [SSR-MEXP v0.8](./FatTail-Labs-Collector-Multi-Expiration-Capture-Spec-v0_8.md)
· [StudioOne Archive Read API v0.8](./FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8.md)
· Time Machine v0.7.4 · `agents/bench/sheldon.md`

---

## 0. Coach intent (do not drop)

> I want to develop an API that will allow **super efficient traversal of the sets**, so we
> can track any arbitrary strategy or **100 arbitrary strategies with ease**. If Tensors
> will allow us to do that then fine, if they present a bottleneck, we should explore more
> efficient means.

> **All fills must have a friction / probability tax.**

> This means the only sane way to traverse a set is **Monte Carlo style**.

> Running it this way makes the strategies **all about the shape of the distribution, not
> about the P&L**. Therefore we need to focus on analysis of the distribution shape.

> We can serialize or parallelize the traversals. With modern day M-class CPUs that should
> be relatively easy.

> I want the simulation to be **as close to real as possible**. And with 2 sec intervals, it
> should be pretty good, considering that's what we use to trade from.

> And when I say traverse, I want to be able to construct the **full real-time P&L curve
> with the full vol-per-leg shape**. This is necessary, because most of our strategies fold
> well before expiration, such as scalping strategies.

The technology is not the requirement. The requirement is *arbitrary*, *with ease*, and
**the T+0 curve, not the expiry diagram** — §3.5 is therefore the section that defines what
"traverse" means here.

---

## 1. The finding: write layout and read layout are transposed

A strategy is a **fixed set of legs** — `(expiration, strike, right, quantity)`. Its mark at
time `t` is `Σ qty_i × price_i(t)`. The legs are known before the query runs. So the access
pattern is **contract-major and time-contiguous**: a few contracts, their whole series.

The archive is written **snapshot-major** — one file per moment, every contract inside it.
That is *correct for capture*: append-only, write-once, and it never rewrites history
(SSR-MEXP §7). It is the exact transpose of what analysis reads.

**The cost of the transpose, measured:**

| To obtain one contract's session series | Today |
|---|---|
| Files opened and parsed | **11,700** |
| Bytes touched | **1.05 GB** |
| Bytes wanted | **0.09 MB** |
| Discarded per file | 119 of 120 rows |

Nothing is wrong with the archive. The missing piece is a **derived read layout**.

---

## 2. Design

### 2.1 A derived store, not a second source of truth

```
verbatim snapshots (SSR-MEXP §3.1)   ← the only source of truth
        │  built once per day, after the session settles
        ▼
contract-major columnar store        ← a CACHE. Rebuildable. Deletable.
```

- The derived store is **never** authoritative. If it disagrees with the archive, it is
  wrong and is rebuilt. This keeps SSR-MEXP §3.1 the single truth and means a layout
  mistake costs a rebuild, not a corpus.
- It is **not** captured, **not** backed up, and its loss is a CPU cost only.
- Rebuild is idempotent and per-day, so a bad build is repaired one day at a time.

### 2.2 Shape

For each `(day, symbol, expiration)` book:

```
time[T]                        int64   reconstructed t per SSR §1, one axis per book
contract_ids[C]                int32   interned (strike, right)
values[field][C][T]            float32 contract-major, time-contiguous
present[C][T]                  uint8   presence mask
```

- **Contract-major** (`[C][T]`, not `[T][C]`) — one contract's series is contiguous, which
  is the whole point.
- **Field-separated** — a query for `mid` never reads `theta`.
- **float32** — ~7 significant digits, ample for prices and greeks, half the bytes of f64.
  Sizes and counts stay integer.
- **Memory-mappable**, so a gather is a page fault, not a parse.

### 2.3 The presence mask is not a NaN

`present[c][t] = 0` means **that contract was not in the band at that moment** (SSR-MEXP
§4.1 — the band ratchets and follows). That is **informative**: a strike is absent early
precisely because price had not gone there.

Filling absence with NaN or zero and letting a study drop those rows biases every result
toward quiet days, which are the days that matter least. **The mask is a first-class output
of every query** and callers must handle it explicitly. **AT-ATRV-5.**

### 2.4 Tensors — the honest answer

| Job | Shape | Verdict |
|---|---|---|
| **Structure search** (Sheldon) | dense whole-array decomposition | **Tensors fit.** Built for it |
| **Strategy traversal** (this API) | sparse gather — 4 rows of 120 | **Tensors are the bottleneck.** Dense ops optimise for touching everything; ragged data makes rectangularisation both wasteful and misleading |

Same source, **two derived views**. Neither representation is "the" representation, and a
tensor view is built when a study wants one — from this store, not instead of it.

---

## 3. The API

```
GET /api/series
    day, symbol, expiration
    contracts   = [(strike, right), …]      or  strikes=lo:hi
    fields      = [mid, bid, ask, bid_size, delta, …]
    t_range     = [from, to]                optional
→  time[], values{field: [C][T]}, present[C][T], provenance
```

That is the whole primitive. Everything else composes from it.

**No strategy is ever registered, named, precomputed or cached.** A caller supplies legs and
quantities and does the dot product itself, or asks the convenience endpoint:

```
POST /api/mark
    day, legs = [(expiration, strike, right, qty), …], fields
→  mark[T], leg_present[T], provenance
```

`mark[t]` is `Σ qty_i × price_i(t)`, and `leg_present[t]` is false at any `t` where **any**
leg was outside the band. A mark computed over a missing leg is a fabrication; it is
withheld and named, never interpolated (**AT-ATRV-6**).

**This is what makes *arbitrary* real.** There is no strategy catalogue to be in, no
registration step, and no precompute list to fall off. 100 strategies is 100 dot products
over the same gathered arrays.

### 3.5 Traverse means the T+0 curve, per leg, at its own vol

Coach: *"construct the full real-time P&L curve with the full vol-per-leg shape… most of our
strategies fold well before expiration, such as scalping strategies."*

**The expiry payoff diagram is close to irrelevant to how these trades actually perform.** A
structure that folds at 11:40 never reaches its payoff; its whole economics live in the T+0
region — the mark-to-market curve *as it stands right now*. So the API's job is not the
realized path alone. It is:

> At any instant `t`, the position's P&L across a **range of hypothetical spot**, with each
> leg carried at **its own** implied vol.

**Two different computations, and only one is a lookup:**

| | What it is | Source |
|---|---|---|
| **Realized path** `mark[t]` | P&L along the spot that actually happened | **Archived marks.** No model (§3) |
| **T+0 curve at `t`** | P&L across spot values that did **not** happen | **Repriced.** Model output |

The second requires repricing every leg at spot it never saw — which needs a pricer, the
leg's own IV, and its time to expiry.

**Why per-leg vol is the requirement and not a refinement.** A butterfly's T+0 shape is
driven by the *relative* vol of body against wings. Collapse the legs to one ATM vol and the
skew disappears, the wings are mispriced, and the curve loses exactly the convexity the
structure exists to express. Per-leg IV is in the archive (`iv`, per contract, per
snapshot), so this is a matter of using it, not of acquiring it.

#### The stickiness convention is a decision, and the archive can settle it

When the curve shifts spot to `S + Δ`, what happens to each leg's IV?

| Convention | Assumption | Effect on a fly's wings |
|---|---|---|
| **Sticky strike** | a strike keeps its IV as spot moves | wings hold their vol; curve is flatter |
| **Sticky moneyness / delta** | the smile travels with spot | wings reprice; curve is materially different |

Holding IV fixed while moving spot is *itself* a choice — the sticky-strike one — and
choosing it silently is the failure this program keeps finding. **The convention is
explicit, returned with every curve, and never defaulted invisibly.**

**And it does not have to be assumed.** Per-strike IV captured every 2 seconds across real
spot moves is precisely the data that measures which convention this underlier actually
obeys, per regime and per DTE. **The stickiness model is an estimator, so it is Sheldon's**
(`agents/bench/sheldon.md`): one implementation, fitted, out-of-sample reported. Until it is
fitted the API returns curves under a **named** convention and says which. **AT-ATRV-9.**

#### A curve is a model output and is labelled as one

SSR-MEXP **AT-MEXP-18** requires greeks be stored as quoted and never recomputed. That holds
here, with the boundary drawn precisely:

- **Archived greeks and marks** are truth at the observed state. Never recomputed.
- **A T+0 curve** is a model output at hypothetical states. It carries its pricer, its IV
  source, its stickiness convention and its as-of, and it is **never** returned in a shape
  that could be mistaken for an archived mark.

Conflating the two would let a fitted curve be quoted back later as if it were observed —
the same class of defect as a recomputed greek wearing the original's name. **AT-ATRV-10.**

#### What the curve endpoint returns

```
POST /api/curve
     day, t, legs = [(expiration, strike, right, qty), …]
     spot_range   = [lo, hi, step]        hypothetical spot grid
     stickiness   = sticky_strike | sticky_moneyness | fitted
→    spot[]           the grid
     pnl[]            P&L at each hypothetical spot
     greeks{}         position delta, gamma, theta, vega at each point
     leg_iv[]         the IV used per leg, as archived
     model{}          pricer, IV source, stickiness, as-of  ← always present
     present          false if any leg was outside the band at t (§3)
```

`greeks` matters as much as `pnl` for a scalping structure: the fold decision is about
**exposure**, not only about the number. Position gamma across the spot grid *is* the
"how fast does this go wrong" question that AZ-ALGO's `PaR = Δ·m + ½Γ·m²` asks — and
computing it from archived per-leg greeks makes §14 a lookup rather than a re-derivation.

### 3.6 Fidelity — what makes the simulation honest

Coach: *"as close to real as possible… with 2 sec intervals it should be pretty good,
considering that's what we use to trade from."*

**The cadence argument is stronger than "fast enough."** 2 seconds is the **decision
surface** — the grid the trader actually sees and acts on. A simulation on that grid
reproduces the environment where the decision is made, which is the fidelity that matters.
Matching the market's true tick rate would simulate a trader who does not exist.

What separates a 2-second grid from reality is four gaps. **Three are closed by verbatim
capture (§3.1) — they are further cost of the field allowlist**, and one is a modelling
choice that must be explicit or the simulation flatters.

| Gap | What it costs | Closed by |
|---|---|---|
| **1. Between-snapshot movement** | Price can travel and return inside 2 s. A touch, a stop, a trigger that fired intraperiod never fires in simulation — so the sim **systematically under-counts touches**, and scalping strategies are exactly where that bites | `day.high` / `day.low` and `last_trade` **bound the intraperiod range**. Both currently **discarded** |
| **2. Quote staleness** | A snapshot shows the quote as of that instant; the quote may be seconds old. Filling against a stale quote is fiction dressed as a fill | `last_quote.sip_timestamp` — **currently discarded**. Quote age becomes a field, and a stale quote is a **named state**, not a price |
| **3. Queue position** | Whether a limit order fills depends on what is ahead of it | `bid_size` / `ask_size` — **currently discarded**. Monte Carlo over queue position (SSR-MEXP §1.9) is the honest treatment |
| **4. Action latency** | A simulation that acts instantly on every snapshot is **superhuman** | A modelling choice. See below |

**Action latency is the one that flatters, so it is explicit.** A human sees the 2 s
refresh, decides, and clicks. A simulation that transacts at the same instant it observes
has an advantage no trader has, and it will overstate every strategy — most of all the fast
ones, which is most of them here.

```
observe at t  →  act no earlier than t + LABS_ATRV_ACTION_LATENCY_S
```

Default **one full snapshot interval** — you act on what you saw, at the next print, not the
one you are looking at. Fail loud if unset. Zero latency is **permitted only when explicitly
requested** and is labelled `idealised` in the response, so a result produced that way can
never be quoted as achievable. **AT-ATRV-12.**

**Fidelity is reported, never assumed.** Every simulated result carries what it assumed:
action latency, fill model, stickiness (§3.5), quote age at each decision, and whether any
leg was stale or absent. A backtest whose assumptions are not attached to it is a number
without a claim. **AT-ATRV-13.**

**Where the 2 s grid is genuinely not enough**, the honest answer is to say so rather than
interpolate. A strategy whose result depends on sub-2-second sequencing is **outside what
this corpus can settle**, and the API says that instead of producing a confident number
(**AT-ATRV-14**). Interpolating between snapshots to manufacture a touch is the same defect
as a recomputed greek: a model output wearing observation's clothes.

### 3.7 The fill tax — law, not a parameter

Coach: *"All fills must have a friction / probability tax."*

**No code path in this API produces an untaxed fill.** Not a default that can be set to
zero, not a flag an eager caller clears — a structural property. An untaxed fill is a
fabrication, and the only reason anyone reaches for one is that it makes a strategy look
better.

**Two components, both mandatory:**

| | What it is | Source |
|---|---|---|
| **Friction** | Deterministic cost of transacting — spread crossed, commission, exchange and regulatory fees | Spread is **measured** per strike per snapshot (SSR-MEXP §3.1). Fees are config, fail loud |
| **Probability** | Whether the fill happened at all, and where in the spread | Fitted from `bid_size` / `ask_size` and queue position (SSR-MEXP §1.9). **Sheldon owns it** |

#### Why this cannot be a haircut applied at the end

Friction scales with **leg count** and is paid **twice**. A three-strike butterfly is four
contracts, so a round trip crosses **eight contract-spreads**. On a cheap 0DTE structure
that is not a rounding adjustment — it is a first-order term:

| Half-spread per leg | Entry | Exit | Round trip | Share of a $300 debit |
|---|---|---|---|---|
| $0.05 | $20 | $20 | $40 | **13%** |
| $0.10 | $40 | $40 | $80 | **27%** |
| $0.15 | $60 | $60 | $120 | **40%** |
| $0.25 | $100 | $100 | $200 | **67%** |

*Illustrative — real values come from archived quotes.* **This is why butterflies backtest
better than they trade**, and why a tax applied as a flat percentage at the end of a study
cannot represent it: the cost is per leg, per side, and it is largest exactly where the
structure is cheapest.

#### The default is pessimistic, deliberately

When the fill model has not been fitted, or the inputs for a moment are missing, the tax
defaults to the **conservative** end: cross the full spread, assume the worse queue outcome.

An optimistic default manufactures edge that does not exist. A pessimistic one understates
a real one. **Those errors are not symmetric for this firm** — "stop the bleeding" is
capital preservation, and a strategy that survives a punitive tax is worth trusting, while
one that only works at mid was never a strategy. Erring toward mid is how a backtest
becomes a sales document.

#### Applied at both ends, per leg, always

- **Entry and exit both taxed.** Taxing entry and forgetting exit halves the friction and
  roughly doubles the apparent edge. **AT-ATRV-16.**
- **Per leg, never per structure.** A four-contract fly pays four crossings a side.
- **Rolls and adjustments are fills.** Every leg change is taxed the same way; a "management"
  action is not free because it is called management.
- **A fill that the probability model says did not happen did not happen.** The position is
  unchanged and the study says so — never a partial credit, never a fill at a price nobody
  showed. **AT-ATRV-17.**

#### It is reported, and it is auditable

Every simulated result carries its **total tax, split friction versus probability, per leg,
per side** — not a single net figure. A study that cannot show where its friction went
cannot be checked, and Delta's evidence bar applies here as anywhere. **AT-ATRV-18.**

**AZ-ALGO consequence.** §14's criterion 3 — *did the guide fold trades bound for the top
return band* — must be answered **after tax**. A top-band trade that is only top-band at mid
is not one, and the clause-A/clause-B split (OD-ALGO-10) should be reported on taxed
outcomes or it measures a market nobody trades in.

### 3.8 Traversal is Monte Carlo by construction

Coach: *"This means the only sane way to traverse a set is Monte Carlo style."*

That follows directly from §3.7 and it is the architecture, not an option. If every fill is
probabilistic, **a single traversal is one sample, not an answer.** Returning it as though
it were the outcome would be the worst version of this program's recurring defect: a draw
presented as a measurement.

**So the API's primitive is a distribution.** There is no endpoint that returns "the" P&L of
a strategy, because that object does not exist. **AT-ATRV-19.**

#### What is random, and what is emphatically not

| | Random? | Why |
|---|---|---|
| **The price path** | **No.** It happened, it is archived | Simulating a price path would be inventing a market. The corpus is the market |
| **Execution** | **Yes** | Fill or no fill, and where in the spread (§3.7) |

**This is what makes it affordable.** Monte Carlo runs over **fill events**, not over
timesteps — the handful of moments where money changes hands, not 11,700 steps of a path
that is already known:

| | Work |
|---|---|
| Naive — 100 strategies × 1,000 paths × 11,700 steps | 1.2 B evaluations |
| **Actual — 100 × 1,000 × 4 legs × 2 sides** | **0.8 M draws** |
| | **~1,460× less** |

The gather (§4) still happens **once** and the mark series stays deterministic. Monte Carlo
redraws only the execution.

#### What comes back

Not a mean. A mean is the least informative summary available to a firm whose thesis is the
shape of the tail — and reporting one would quietly re-commit the §14.3 error of optimising
the middle.

```
POST /api/simulate
     day, legs, entry, exit, paths = N, seed
→    quantiles{p01,p05,p10,p25,p50,p75,p90,p95,p99}
     tail{worst_1pct_mean, best_1pct_mean}      the bands that matter here
     no_fill_rate{entry, exit}                  how often it never happened
     tax{friction, probability, per_leg, per_side}
     assumptions{latency, stickiness, fill_model, seed, paths}
```

`no_fill_rate` is a first-class output. A strategy that only works when you always get
filled is not a strategy, and that fact must be visible without reading the code.

#### Reproducibility is not optional

Every run is **seeded and the seed returned**. An unseeded Monte Carlo cannot be checked,
cannot be re-run by Delta, and cannot be compared against itself after a change. Same run,
same seed, same corpus → byte-identical result. **AT-ATRV-20.**

**Path count is stated and defended.** N is a parameter, reported with the result, and the
response carries a **standard error** so a caller can see whether N was enough to separate
two strategies. Comparing distributions from different N without saying so is a defect
(**AT-ATRV-21**) — and *raising N until a strategy looks good* is the multiplicity failure
Sheldon's invariant 4 exists to prevent, on a new axis.

### 3.9 Execution — parallel, and reproducible *regardless of the schedule*

Coach: *"we can serialize or parallelize the traversals. With modern day M-class CPUs that
should be relatively easy."*

Correct, and the workload is close to ideal: **the price path is fixed and read-only, so
nothing shares mutable state.** Cores read the same memory-mapped arrays (§2.2) — no copy,
no contention, and unified memory means no NUMA question on an M-class part.

| Axis | Independent? | Notes |
|---|---|---|
| **Monte Carlo paths** | fully | The natural unit. No shared state |
| **Strategies** | fully | Given one gather, shared read-only |
| **Days** | fully | The unit for a multi-day study |
| Within a path | — | Too fine-grained; not worth the coordination |

#### The trap: parallelism must not cost reproducibility

AT-ATRV-20 requires byte-identical results for the same seed. The naive parallel
implementation — one shared RNG, or per-thread seeds taken from the clock — **silently
breaks that**, and breaks it in the worst way: results still look fine, they just stop being
the same twice, and nobody notices until Delta cannot reproduce a study.

**Law:** the random stream is a pure function of `(seed, strategy_id, path_index)` — a
counter-based or splittable generator, never a shared mutable RNG and never a thread-derived
seed.

Then the result is identical at **any** core count, in any completion order, serial or
parallel. Thread count becomes a performance knob with **no** semantic effect, which is the
only way a parallel simulation stays auditable. **AT-ATRV-23.**

#### Where parallelism actually earns its keep

| Workload | 1 core | 8 | 12 | 16 |
|---|---|---|---|---|
| **Traversal** — 100 strategies × 1,000 paths | 80 ms | 10 ms | 6.7 ms | 5.0 ms |
| **Daily build** — parse 15,990 snapshots | 48 s | 6.0 s | 4.0 s | 3.0 s |

**Traversal is already effectively free; the build is the expensive part.** So the
engineering effort belongs on the once-per-day build (parallel across files, trivially
independent), not on micro-optimising a query that finishes in milliseconds.

That is also the answer to *"serialize or parallelize"*: **serial is a perfectly acceptable
default for traversal.** Reach for cores when a study sweeps thousands of structures across
months — and when you do, §3.9's seeding law means the answer does not change, only the
wait.

### 3.10 A strategy is its distribution shape

Coach: *"Running it this way makes the strategies all about the shape of the distribution,
not about the P&L. Therefore we need to focus on analysis of the distribution shape."*

This is the FatTail thesis stated operationally, and it is the correct conclusion of §3.8.
Once a traversal returns a distribution, **the distribution is the object**. A P&L number is
a summary that discards precisely the structure the strategy exists to create.

#### Metrics that are banned here, and why

| Banned | Why it lies on this data |
|---|---|
| **Mean / expected value** | See bimodality below — for these structures the mean can be the *least likely* outcome |
| **Sharpe ratio** | Assumes symmetry and finite, meaningful variance. A defined-risk convex structure is bounded on one side and long-tailed on the other; Sharpe is undefined in spirit and misleading in practice |
| **Win rate** | A butterfly can win 80% of the time and lose money. It says nothing about shape |
| **Single-path max drawdown** | Path-dependent, and we have the whole distribution. Reporting one path's drawdown is §3.8's error again |

**Bimodality is not an edge case here — it is the normal case.** A 0DTE butterfly either
lands near the body or it does not. The distribution has **two modes**, and the mean sits in
the valley between them, describing an outcome the trade rarely occupies. Any summary that
collapses to a central tendency is describing a state that does not happen. **AT-ATRV-24**
requires modality be reported, never assumed unimodal.

#### What is reported instead

| | What it answers |
|---|---|
| **Left-tail shape** — CVaR at 1% / 5%, and worst-case versus the structure's theoretical max loss | *Stop the bleeding.* Is the bounded loss the structure promises actually honoured **after tax**? |
| **Right-tail shape** — mass and mean beyond p90 / p95 / p99 | Is the convexity **still there** once friction is paid, or did the tax eat the payoff (§3.7)? |
| **Asymmetry** — right-tail mass ÷ left-tail mass | **The convexity claim, measured.** A structure sold as convex whose distribution is symmetric is not doing its job |
| **Tail decay** — how fast each tail falls off | Yankee's frame. A truncated tail and a power-law tail are different products |
| **Modality** — modes, and mass at each | Whether any central summary is meaningful at all |
| **Conditional shape** — the above, given regime · GEX · entry time · DTE | The reason the archive exists |

#### Comparing strategies means comparing distributions

Ranking by a scalar reintroduces the problem the scalar caused. The tool is **stochastic
dominance**:

- **A dominates B** → every risk-averse trader prefers A. No preference parameter needed,
  no scalar, no argument.
- **Neither dominates** → that is a **finding**, not a tie to be broken by taking means. It
  says the choice genuinely depends on what the trader values, and that belongs in front of
  a human rather than resolved by a formula. **AT-ATRV-25.**

#### The consequence for AZ-ALGO: the guide is a shape operator

This reframes §14 more usefully than the spec currently states it. **The hold-or-fold guide
does not improve P&L — it transforms the distribution.** It truncates the left tail, which
is the whole point, at the cost of some right tail.

§14.3 is already a statement about shape, in Coach's own words: *a line that improves
average retention while cutting off that tail is a **worse** line.*

So criterion 3 is properly asked as: **compare the untrailed distribution to the trailed
one, and report what the transform did to each tail separately.** A guide that removes 80%
of the left tail and 5% of the right is excellent. One that removes 80% of both is a worse
line that will look better on every scalar. **The clause-A / clause-B split (OD-ALGO-10)
should be reported the same way** — as two shape transforms, not two fold counts.

That comparison is computable today (SSR-MEXP §1.10) and is the strongest single use of this
API. **AT-ATRV-26.**

---

## 4. Cost

| | |
|---|---|
| Derived store, six books | **≈108 MB/day** → **27 GB/year** (rebuildable, not backed up) |
| 1 strategy × 4 legs | gather 0.2 MB, dot over 11,700 steps |
| **100 strategies × 4 legs** (≤120 unique contracts) | **gather 5.6 MB**, one dot product |
| Result | **sub-millisecond, no parse** — ~**188×** fewer bytes touched than the JSON path |

The union of 100 four-leg strategies is at most 400 contracts and in practice far fewer,
because strategies on one underlier share strikes. **The gather does not grow with the
number of strategies — it grows with the number of distinct contracts, which is bounded by
the book.**

---

## 5. What this is not

- **Not a replacement for the Archive Read API.** That serves days, coverage and replay to
  Labs and to members. This serves *series* to analysis on StudioOne. Different callers,
  different shape, same corpus.
- **Not a source of truth** (§2.1).
- **Not a strategy engine.** It returns marks and presence. What a strategy *means* — entry
  rules, risk, fills — is Sheldon's and Strategy Lab's, not this API's.
- **Not member-facing.** No auth path to a member surface; Exit Trail v0.2 §5's
  aggregated-not-per-trade rule governs anything that ever reaches one.
- **Not a fill model.** It returns quotes and sizes as archived. Turning those into a fill
  probability is SSR-MEXP §1.9 and belongs to Sheldon.

---

## 6. Open decisions

| # | Question | Owner | Default if silent |
|---|---|---|---|
| **OD-ATRV-1** | Format: raw mmap arrays, Arrow IPC, or Parquet? | **Foxtrot · Alpha** | **Arrow IPC** — zero-copy mmap, portable, already columnar. Parquet if compression matters more than latency |
| **OD-ATRV-2** | Build trigger: nightly batch, or incremental during the session? | **Foxtrot** | **Nightly**, after the day settles. Incremental only if a live use case appears |
| **OD-ATRV-3** | Retention of the derived store — all days, or a rolling window rebuilt on demand? | **Coach** | **Rolling**, since rebuild is cheap and the archive is permanent |
| **OD-ATRV-4** | Does the era-1 corpus get a derived build too? | **Coach** | **Yes** — it is what §13's track A benchmark should be compared against |

---

## 7. Acceptance

| AT | Criterion |
|---|---|
| **AT-ATRV-1** | The derived store is reproducible: deleting a day and rebuilding yields byte-identical output. |
| **AT-ATRV-2** | The store is never read as truth — a value disagreeing with the verbatim snapshot is a **build defect**, and the archive wins. Asserted by sampling snapshots against the built arrays. |
| **AT-ATRV-3** | One contract's session series is retrieved **without opening any snapshot file** and without a full-book scan. |
| **AT-ATRV-4** | **100 arbitrary four-leg strategies**, not known at build time, resolve to marks in a single request. Coach's *"with ease"* is this test. |
| **AT-ATRV-5** | `present` is returned on every query and is never silently substituted with NaN, zero, or a forward-fill. A caller cannot obtain values without the mask. |
| **AT-ATRV-6** | A mark at any `t` where a leg is absent is **withheld and named**, never interpolated across the gap. |
| **AT-ATRV-7** | Fields not requested are not read from disk — asserted by bytes-read instrumentation, not by inspection. |
| **AT-ATRV-8** | The API refuses a day whose `layout_era` is `UNKNOWN` (SSR-MEXP §7) rather than guessing the shape. |
| **AT-ATRV-9** | A T+0 curve carries **per-leg** archived IV, not one vol for the structure. A curve built from a single ATM vol is a **fail**. The stickiness convention is returned explicitly on every curve and is never defaulted silently (§3.5). |
| **AT-ATRV-10** | A curve response is distinguishable from an archived mark in shape and carries `model{pricer, iv_source, stickiness, as_of}`. Nothing in the read path can return a repriced value where an observed one is expected (§3.5, SSR-MEXP AT-MEXP-18). |
| **AT-ATRV-24** | Modality is **reported, never assumed**. No response presents a mean, or any single central summary, as the description of a multi-modal distribution. Banned metrics (mean-as-headline, Sharpe, win-rate, single-path drawdown) do not appear in any default response shape (§3.10). |
| **AT-ATRV-25** | Strategy comparison returns a **stochastic-dominance verdict**. Where neither dominates, the response says so; it never breaks the tie with a scalar (§3.10). |
| **AT-ATRV-26** | The guide is evaluable as a **shape transform**: untrailed versus trailed distribution for the same trades, with the effect on each tail reported **separately**. A single net figure fails this AT (§3.10, AZ-ALGO §14.3, OD-ALGO-10). |
| **AT-ATRV-23** | **Schedule-independent reproducibility.** The same simulation run serially, on 8 cores and on 16 cores, in any completion order, yields **byte-identical** output. The random stream is a pure function of `(seed, strategy_id, path_index)`; a shared mutable RNG or a thread-derived seed is a **defect** (§3.9). |
| **AT-ATRV-19** | **No endpoint returns a scalar P&L for a strategy.** The simulate path returns a distribution or it returns an error. A single-draw result cannot be obtained, accidentally or deliberately (§3.8). |
| **AT-ATRV-20** | Every simulation is seeded and returns its seed. Same inputs, same seed, same corpus → **byte-identical** output (§3.8). |
| **AT-ATRV-21** | Results carry `paths` and a standard error. Two distributions produced at different `N` cannot be compared without both being reported (§3.8). |
| **AT-ATRV-22** | `no_fill_rate` is returned on every simulation, for entry and exit separately (§3.8). |
| **AT-ATRV-15** | **No untaxed fill exists.** Source grep plus behavioural test: there is no parameter, flag or code path that yields a fill at mid with zero friction and certain execution. An `idealised` run still reports the tax it would have paid (§3.7). |
| **AT-ATRV-16** | Tax is applied at **entry and exit**, **per leg**. A four-contract structure round trip is charged eight crossings, not two, and not one net figure (§3.7). |
| **AT-ATRV-17** | When the probability model returns no fill, the position is **unchanged** and the result says so. No partial credit, no fill at an unquoted price (§3.7). |
| **AT-ATRV-18** | Every result reports total tax **split friction vs probability, per leg, per side** — never a single net number (§3.7). |
| **AT-ATRV-12** | Simulated actions occur no earlier than `t + LABS_ATRV_ACTION_LATENCY_S`, default one snapshot interval; the key is fail-loud. A zero-latency run is permitted only on explicit request and is labelled `idealised` in the response (§3.6). |
| **AT-ATRV-13** | Every simulated result carries its assumptions — action latency, fill model, stickiness, quote age at each decision, and any stale or absent leg. A result without attached assumptions is a **defect** (§3.6). |
| **AT-ATRV-14** | A query whose outcome depends on sub-snapshot sequencing returns **`SUB_INTERVAL_UNRESOLVABLE`**, never an interpolated touch or a manufactured fill (§3.6). |
| **AT-ATRV-11** | Position greeks are returned across the spot grid, computed from archived per-leg greeks. `PaR = Δ·m + ½Γ·m²` for any structure at any `t` is obtainable without re-deriving greeks from a vol surface. |

---

## 8. Changelog

| Ver | Date | Notes |
|---|---|---|
| **v0.4** | *(folded into v0.5, never landed separately)* | Adds **§3.7, the fill tax as law**. Coach: *all fills must have a friction/probability tax.* No code path yields an untaxed fill — structural, not a default someone can zero. Two mandatory components: **friction** (spread crossed, measured per strike per snapshot; fees fail-loud config) and **probability** (fitted from `bid_size`/`ask_size` and queue, Sheldon's estimator). Shows why it cannot be an end-of-study haircut: friction scales with **leg count** and is paid **twice**, so a three-strike fly round-trip crosses **eight contract-spreads** — 13–67% of a $300 debit at plausible spreads, which is why butterflies backtest better than they trade. **Default is deliberately pessimistic** — the errors are not symmetric for a capital-preservation firm, and erring toward mid is how a backtest becomes a sales document. Taxed at entry *and* exit, per leg; rolls and adjustments are fills; a no-fill is a no-fill with no partial credit. Reported split friction-vs-probability per leg per side, never one net number. AZ-ALGO §14 criterion 3 must be answered **after tax**. **AT-ATRV-15…18**. |
| **v0.7** | 2026-09-05 | Adds **§3.10 — a strategy is its distribution shape.** Coach's conclusion from §3.8, and the FatTail thesis stated operationally: once a traversal returns a distribution, the distribution *is* the object and P&L is a summary that discards the structure. **Bans mean-as-headline, Sharpe, win-rate and single-path drawdown**, each with the reason it lies on this data. Names **bimodality as the normal case** — a 0DTE fly either lands near the body or does not, so the mean sits in the valley between two modes and describes an outcome the trade rarely occupies. Reports instead: left-tail shape (is bounded loss honoured **after tax**), right-tail shape (did friction eat the convexity), **asymmetry as the convexity claim measured**, tail decay, modality, and all of it conditional on regime/GEX/entry/DTE. Comparison is by **stochastic dominance**; where neither dominates that is a finding for a human, not a tie broken by means. **Reframes AZ-ALGO §14: the guide is a shape operator, not a P&L improvement** — criterion 3 asks what the transform did to *each tail separately*, and OD-ALGO-10's clause split should be reported as two shape transforms rather than two fold counts. **AT-ATRV-24…26**. |
| **v0.6** | 2026-09-05 | Adds **§3.9, execution**. The workload is near-ideal for parallelism — the price path is fixed and read-only, so cores share memory-mapped arrays with no copy and no contention. Independent across paths, strategies and days. **Names the trap:** the naive parallel implementation (shared RNG, or per-thread clock seeds) silently breaks AT-ATRV-20's byte-reproducibility, and breaks it invisibly — results look fine, they just stop being the same twice, and nobody notices until Delta cannot reproduce a study. **Law: the random stream is a pure function of `(seed, strategy_id, path_index)`**, so thread count is a performance knob with no semantic effect. Measured: **traversal is 80 ms serial, 5 ms on 16 cores** — already free — while the **daily build is 48 s serial, 3 s on 16**. So parallelism belongs on the once-per-day build, not on a query that finishes in milliseconds, and **serial is an acceptable default for traversal**. **AT-ATRV-23**. |
| **v0.5** | 2026-09-05 | Adds **§3.8 — traversal is Monte Carlo by construction**, which follows from §3.7: if every fill is probabilistic, a single traversal is **one sample, not an answer**. So the primitive is a **distribution**, and no endpoint returns a scalar P&L because that object does not exist. Draws the line that makes it affordable: **the price path is archived and not random — only execution is**, so Monte Carlo runs over **fill events** (100 strategies × 1,000 paths × 4 legs × 2 sides = 0.8 M draws) rather than timesteps (1.2 B), ~1,460× less, with the gather still done once. Returns **quantiles and tail bands, never a mean** — a mean would re-commit the §14.3 error of optimising the middle. `no_fill_rate` is first-class: a strategy that only works when you always get filled is not a strategy. Seeded and byte-reproducible; `paths` and standard error reported, because raising N until a strategy looks good is Sheldon's invariant 4 on a new axis. **AT-ATRV-19…22**. |
| **v0.3** | 2026-09-05 | Adds **§3.6, fidelity**. The cadence argument is that **2 s is the decision surface** — the grid the trader sees and acts on — so simulating there reproduces the decision environment rather than chasing the market's tick rate. Names the four gaps between a 2 s grid and reality: **three are closed by verbatim capture and are further cost of the field allowlist** — `day.high/low` and `last_trade` bound intraperiod movement (without them the sim systematically under-counts touches, which is exactly where scalping lives), `last_quote.sip_timestamp` gives quote age so a stale quote is a named state rather than a price, and `bid_size`/`ask_size` give queue position. The fourth is **action latency**: a simulation transacting at the instant it observes is **superhuman** and overstates every fast strategy, so acting is deferred one snapshot by default, fail loud, and a zero-latency run is labelled `idealised`. Every simulated result carries its assumptions. A query needing sub-2-second sequencing returns `SUB_INTERVAL_UNRESOLVABLE` rather than an interpolated touch. **AT-ATRV-12…14**. |
| **v0.2** | 2026-09-05 | Adds **§3.5** — Coach: *traverse* means the **T+0 curve with full vol-per-leg shape**, because these strategies fold long before expiration, so the expiry diagram is near-irrelevant. Separates the two computations: the realized path is a **lookup** of archived marks; the T+0 curve is a **model output** repricing legs at spot that never happened. Per-leg IV is the requirement, not a refinement — a fly's shape is driven by body-versus-wing vol, and one ATM vol erases the convexity the structure exists to express. Names the **stickiness convention** as an explicit, always-returned decision (holding IV fixed while moving spot is itself the sticky-strike choice, and choosing it silently is this program's recurring defect) — and notes the archive can *measure* which convention the underlier obeys, making it Sheldon's estimator rather than an assumption. Curves carry `model{pricer, iv_source, stickiness, as_of}` and can never be mistaken for observed marks. Position greeks across the spot grid make AZ-ALGO's `PaR` a lookup. **AT-ATRV-9…11**. |
| **v0.1** | 2026-09-05 | First draft. Finds that the archive's write layout (snapshot-major, correct for capture) is the **transpose** of the analysis read pattern (contract-major) — today one contract's series costs 11,700 file opens and 1.05 GB touched to extract 0.09 MB. Proposes a **derived, rebuildable, non-authoritative** contract-major columnar store: ~108 MB/day, and 100 arbitrary four-leg strategies resolve in a 5.6 MB gather plus one dot product, sub-millisecond, no parse (~188× fewer bytes). Answers Coach's tensor question in both directions: tensors fit **structure search**, and are the bottleneck for **strategy traversal** (sparse gather over ragged data) — same source, two derived views. **No strategy is ever registered or precomputed**, which is what makes *arbitrary* real. Presence mask is first-class because band absence is informative, not missing-at-random. |
