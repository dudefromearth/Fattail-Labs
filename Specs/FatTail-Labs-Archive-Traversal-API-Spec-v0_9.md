# FatTail Labs — Archive Traversal API Spec v0.9

**Status:** **DRAFT — describes the system AS BUILT on 2026-09-06 (DL-677).** Not yet stamped:
needs Coach, India (boundary), Sheldon (greek quantum, fill estimator), Foxtrot (host, tier).
**Date:** 2026-09-06 · **Short name:** **ATRV** · **Owner:** Juliet (draft) → Alpha / Foxtrot
**Supersedes:** v0.8 (2026-09-05). v0.9 is the first revision written **from measurement
rather than ahead of it**: every figure cites `docs/evidence/atrv-bench-2026-09-05.md` (Track
A) or `docs/evidence/quant-e2e-2026-09-06.md` (the built slice). It retires `float32`, makes
the store's type law the one the data stamped, records the API as shipped (`server/quant/`,
`routes/quant.py`), and names the fill model a placeholder with the next job attached.
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
        │  ONE read of the closed day, on the collector (quant.build)
        ├──▶ packs: original bytes, length-prefixed, zstd   ← the recording, byte-identical
        ▼
contract-major columnar store        ← a CACHE. Rebuildable. Deletable.
```

**Measured, real day (XSP 2026-09-04, 20,472 snapshots, 110 contracts):** the whole build —
packs + columns + verification — is **44 s** on the collector; the transpose alone projects to
~6 s/day from packs (`atrv-bench-2026-09-05.md` §3.1). **The nightly build is not a problem**
and the in-session `[C][T]` argument is closed (§5 of that note records the withdrawal).
`C` is discovered as the band ratchets; a strike admitted at 11:00 is `present = 0` before
it and nothing is filled.

**The build is not done until it proves itself.** Packs must decode to the original bytes
(all of them) and sampled store cells must equal the snapshot value at the declared scale.
Either failing **voids the build** (`quant.build.verify_build`; AT-ATRV-1, 2). Real day: 20,472
packs verified, 739 cells checked, 0 mismatched.

- The derived store is **never** authoritative. If it disagrees with the archive, it is
  wrong and is rebuilt. This keeps SSR-MEXP §3.1 the single truth and means a layout
  mistake costs a rebuild, not a corpus.
- It is **not** captured, **not** backed up, and its loss is a CPU cost only.
- Rebuild is idempotent and per-day, so a bad build is repaired one day at a time.

### 2.2 Shape

For each `(day, symbol, expiration)` book:

```
meta.json                              header: T, C, contracts, per-field scale + quantised +
                                       max_error, greeks_quantum_decimals, source_sha1
time.i64[T]                            epoch ms, one axis per book
spot.i32[T]                            spot × 100
present.u8[C][T]                       1 = contract in the band at t
<field>.i32[C][T]                      SCALED INTEGER, contract-major, time-contiguous
                                       NULL_I32 = present but this field was null
```

**Contract identity is `(strike, side, expiration)`.** Era-1 rows carry `side`, not
`right`; expiration sits on the snapshot. Keying on the wrong name collapses calls and puts
into one id — the Track A experiments did exactly that (their C=51 was this defect; the
store has 110). Written against the real shape, asserted by test.

- **Contract-major** (`[C][T]`, not `[T][C]`) — one contract's series is contiguous, which
  is the whole point. Real: one contract's day is a 46 KB read; `/series` for two contracts
  × three fields answers in **23 ms**, `/mark` for a fly in **17 ms**, no snapshot opened.
- **Field-separated** — a query for `mid` never reads `theta`.
- **Memory-mappable**, so a gather is a page fault, not a parse.

#### 2.2.1 The type law — stamped by the data, `float32` retired

| Field class | Type | Why |
|---|---|---|
| **Quotes** `mid bid ask` | scaled int, scale **1000** (half-cent grid) | on a tick grid, "exact" is well-defined and free. **0 scale violations** on the real day |
| **Greeks** `delta gamma theta vega iv` | scaled int at a **declared** decimal count (`LABS_QUANT_GREEKS_QUANTUM`, starting value 6) — **QUANTISED, not lossless**; **max error introduced recorded per field** in the header (real: 5.0e-07) | the vendor's greeks are float64 with noise to **1e-30**; "lossless" preserved it and made greeks 98% of the output. Exact-at-a-declared-quantum is the honest standard; the raw bytes stay in the pack |
| **Counts** `volume open_interest` | int | already exact |
| **Stamps** `last_updated` | int32 **offset from `time[t]`** in ms | the vendor stamps in **nanoseconds** (19 digits); the offset fits, loses nothing given `time[t]`, and *is* the quote-age quantity §3.6 gap 2 asks for |

**`float32` is retired.** Measured on the real archive: **76.6% of values** are not exactly
representable in float32 (`atrv-bench-2026-09-05.md` §4). Byte-identical replay (AT-ATRV-20,
QLAB AT-QLAB-2) cannot pass on a lossy type. v0.7's *"~7 significant digits, ample"* was
wrong and is struck.

**Two absences, never conflated.** `present = 0` means the contract was not in the band —
informative (§2.3). `NULL_I32` means the contract *was* present and this field was null
(era-1 `bid` and the greeks are null on some rows). Neither is filled, forward-filled, or
interpolated.

**Vendor artefacts are nulled and counted, not repaired.** Real day: 103 `theta` values with
|θ| > 2,147 — all at 23:59 UTC, four hours after the contract expired, the vendor's model
diverging as time-to-expiry → 0. Recorded in `meta.json` as `scale_violations`.

#### 2.2.2 Two tiers — OD-ATRV-9

The hot store above is **plain** int32 — 12 fields × 9 MB per book-day, **141 MB** with packs
for the real XSP day — because mmap needs fixed width. The **cold** form is
delta-in-time + per-field predictor + zstd: **198× smaller than the JSON** at a 1e-6 greek
quantum, **~1.3 MB per book-day, ~9 GB/year for all books** (`atrv-bench-2026-09-05.md` §4.1).
You cannot mmap a varint stream. Default until measured: **plain for any day a study will
open; encoded for days nobody has mapped.** Predictor per field is one header byte: *time*
for quotes and counters (they compress to ~6 KB under any predictor), *strike* for greeks
and IV (~2× — a smile is smooth across strikes). Smoothness is a **codec on `present = 1`
cells only**; predicting an absent cell from its neighbours is interpolation.

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
GET  /api/me/quant/days                        what is built (day, book, T, C, quantum)
GET  /api/me/quant/spot     ?day&book          time axis, spot series, listed strikes
GET  /api/me/quant/series   ?day&book&contracts=771P,767P&fields=mid,iv&t0&t1
→    time_ms[], values{field: [C][T]}, present[C][T], scales{}, quantised{}, provenance
GET  /api/me/quant/mark     ?day&book&legs=762P:+1,767P:-2,772P:+1&t0&t1
→    mark[T] (price units), leg_present[T], withheld, spot[T]
GET  /api/me/quant/chain    ?day&book&t_ms     the whole chain at the snapshot AT OR BEFORE t
POST /api/me/quant/simulate                    §3.8 — a DISTRIBUTION
POST /api/me/quant/sweep                       §3.8 — every entry in a window, pooled
```

As shipped (`server/routes/quant.py`, DL-677). `require_session` on all; **501 QUANT STORE
NOT CONFIGURED** when `LABS_QUANT_*` is unset; a *partial* set aborts boot; every refusal is
a **named** 404/409, never a number (`CONTRACT_NOT_IN_BOOK`, `BAD_WINDOW`,
`LEG_ABSENT_AT_INSTANT`, `NO_PATH_TRADED`, `BEFORE_FIRST_SNAPSHOT`). `/series` is the
primitive; everything else composes from it. `/chain` exists for the Time Machine: one local
read per playhead move instead of up to nine dyadic fetches to the collector, and it returns
the snapshot that *was* the surface at `t` — `lag_ms` says how far back — never a blend of
two.

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

##### 3.5.1 `fitted` is a named empty state, not a callable value

v0.7 listed `fitted` in the stickiness enum four lines after saying the model is not yet
fitted. A value a caller can pass, backed by a map nobody has built, is the same defect
family as AZ-ALGO's OD-ALGO-9: an option that looks available and silently resolves to
something else.

> **Law: `fitted` is not accepted as an argument until Sheldon stamps a fitted map. A request
> naming it is refused with `STICKINESS_MODEL_UNFITTED` — a named refusal, never a fallback
> to `sticky_strike`.**

**AT-ATRV-27.**

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
     stickiness   = sticky_strike | sticky_moneyness       ← `fitted` is not callable (§3.5.1)
→    spot[]           the grid
     pnl[]            P&L at each hypothetical spot
     greeks{}         position delta, gamma, theta, vega at each point
     leg_iv[]         the IV used per leg, as archived
     model{}          pricer, IV source, stickiness, as-of  ← always present
     present          false if any leg was outside the band at t (§3)
```

`greeks` matters as much as `pnl` for a scalping structure: the fold decision is about
**exposure**, not only about the number. Position gamma across the spot grid *is* the
"how fast does this go wrong" question that AZ-ALGO's `PaR = Δ·m + ½Γ·m²` asks.

##### The lookup is at the observed state. The grid is a model.

v0.7's AT-ATRV-11 said position greeks across the spot grid are *"computed from archived
per-leg greeks"* — which contradicts AT-ATRV-10 three paragraphs above it. Archived Δ and Γ
were quoted **at the observed spot**. Carrying them unchanged to a hypothetical spot is
sticky-strike applied to the greek surface: a modelling choice, made silently, wearing an
archived name. That is exactly the defect AT-ATRV-10 exists to prevent, committed by its
neighbour.

The boundary that actually holds:

| Quantity | Status |
|---|---|
| Package greeks at the **observed** `t`, `Δ_pkg = Σ qty_i × Δ_i` | **Lookup.** Truth, from archived per-leg greeks |
| `PaR = Δ·m + ½Γ·m²` at the **observed** `t` | **Lookup.** A Taylor term in archived quantities |
| Greeks at any **hypothetical** spot on the curve grid | **Model output.** Lives inside `model{}` with the rest of the curve |

**The package sum is signed.** `qty` carries its sign — a long fly is `+1/−2/+1`, and an
unsigned body-plus-wings sum is a defect (AZ-ALGO **E39**, which found exactly this arithmetic
already landed in a fixture). **AT-ATRV-11, AT-ATRV-28.**

So AZ-ALGO §14 gets its `PaR` as a lookup **at observed moments** — which is what it asks
for — and nothing in this API lets a hypothetical-spot greek be quoted back as archived.

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

#### Gaps 1–3 cannot be closed on era-1, and the simulation must say so

All three fields that close gaps 1, 2 and 3 — `day.high`/`day.low`, `last_quote.sip_timestamp`,
and `bid_size`/`ask_size` — are discarded by the era-1 write path, and SSR-MEXP §3.1 makes
verbatim capture **forward-only**. Era-1 days will never have them. A simulation run on era-1
is therefore not a lower-quality version of an era-2 simulation; it is a **different claim**,
and AT-ATRV-12…18 read as runnable against a corpus that cannot support them.

> **Law: every simulate response carries `fidelity`. On era-1 days it is
> `era1_no_depth` — no queue position, no intraperiod bound, no quote age. An endpoint whose
> answer depends on a field the day does not carry **refuses** rather than substituting a
> default.**

This is the same rule as the presence mask (§2.3): an absence is named, never filled. It also
draws the line SSR-MEXP §1.10 needs — **package `PaR` on era-1 is a lookup and available
today; an after-tax answer is not, because the tax's probability component is fitted from
depth era-1 does not have.** Pre-tax era-1 work is labelled `idealised` (below) and is not
promotion evidence. **AT-ATRV-29.**

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

#### 3.7.0 As built on 2026-09-06 — a placeholder, and every response says so

| Component | As built | Status |
|---|---|---|
| Fill probability | **flat `p_fill` per leg per side** (`LABS_QUANT_FILL_P_UNFITTED`, 0.85) | **a constant, not a measurement** |
| Fill placement | `mid ± f × half-spread`, `f ~ U[0.5, 1.0]`; spread read from the store at that instant | spread is real; the placement law is assumed |
| Entry no-fill on any leg | **no trade, no partial credit**, excluded from the distribution, counted | law |
| Exit no-fill | cross the full spread, counted | assumed treatment |
| Fees | `LABS_QUANT_FEE_PER_CONTRACT` per contract per side | config, fail loud |
| Legs | fill **independently** | **wrong structure** — a real fly is a complex order at a net price; pessimistic, and flagged |
| Time-to-fill | one snapshot (`latency_snapshots`) | Coach: real fills take **10–30 s** and can be missed or re-seated |

Labelled on every response: `fidelity: era1_no_depth · fill_model: unfitted_pessimistic`.
The number on the page that a real model would move most is the ~38% entry no-fill, and it
would move in whichever direction the depth says.

**The next job (Coach, DL-677): a realistic fill-friction algorithm.** Direction, in order:
(1) **spread-based fill probability first** — the store has the spread at every leg at every
instant, so `P(fill | spread, …)` can be **fitted now from Coach's fill history joined to the
market state at each fill**; (2) VIX as a regime dial on top, not a substitute; (3)
**time-to-fill** — a working order exposed to the path for 5–15 snapshots, filled when the
market comes to it, else chased, cancelled, or re-seated one strike over, each with its own
tax; (4) complex-order semantics. **The shape may be designed now; the parameters are fitted,
not chosen** (Sheldon, OD-ATRV-6). No made-up curve replaces the made-up constant.

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
→    ecdf{x[], F[]}                    THE OBJECT — the distribution itself
     modality{n_modes, modes[], valleys[]}      AT-ATRV-24, never assumed unimodal
     bands{p01,p05,p10,p25,p50,p75,p90,p95,p99}   an ordered SET (see below)
     no_fill_rate{entry, exit}                  how often it never happened
     tax{friction, probability, per_leg, per_side}
     tail_cvar{worst_1pct, best_1pct}           RESEARCHER-ONLY (see below)
     stability{n_half_vs_n}                     was N enough? (see below)
     fidelity                                   era1_no_depth | full   (§3.6)
     assumptions{latency, stickiness, fill_model, seed, paths}
     display_legal[]                            which fields may cross the publish seam
```

##### v0.7's payload violated v0.7's own §3.10

The paragraph directly above this block said *"Not a mean."* The block then returned
`worst_1pct_mean`, `best_1pct_mean`, and `p50` — two means and a median, in the default
shape, of a distribution the same document argues is **bimodal as the normal case**. For a
fly, the median sits in the valley between the modes; featuring it is §3.10's error with a
percentile's name on it. Three corrections:

**1. The ECDF is the object; quantiles are a view of it.** The band set stays — stochastic
dominance (§3.10) needs it — but it is a **set**, and no single member may be extracted and
rendered alone. `p50` exists inside `bands`; there is no `p50` field.

> **Law: no single quantile is rendered as a summary of the distribution. A caller that
> displays one band without its neighbours has produced a central tendency.** **AT-ATRV-30.**

**2. Tail means are conditional expectations and are named as such.** `worst_1pct_mean` is a
CVaR, and CVaR *is* legitimate — it is a tail statistic, not a middle one. But it is still a
mean, so it is named `tail_cvar`, and it is **researcher-only**: it never crosses the publish
seam onto a member surface (QLAB §4.4).

**3. `display_legal[]` is returned, not inferred.** QLAB drew the member/researcher split at
the publish seam; a response that does not say which of its own fields are on which side
leaves a Lab Bot builder to guess, and the guess will be `p50`. The API states it.

##### Exit rules and the entry sweep — the series answer, taxed

Hold-to-a-time is the wrong exit for a FatTail fly; the method takes 100–200% just outside the
tent and lets runners be the discipline. As built:

```
exit_kind = time    | target      target_pct = 150
```

`target` resolves on the **mid-mark series** — the archive — so the exit instant is a fact of
the path; fills are then drawn at it (latency applies to the exit too). Never reached → the
time exit, and the response says which (`exit{kind, hit, mark_at_hit, debit_mid}`).

`POST /sweep`: the same structure, **every entry** in a window at a step, one exit rule, a
fill Monte Carlo on each, pooled. The mark series already answered every `(entry, exit)` by
subtraction (SSR-MEXP §1.8); this is that, taxed. Reports how many entries hit the target and
the minutes-in-trade bands. Real day, 167 entries × 100 paths: **623 ms**. Not a study —
QLAB §4.5 registers those — one grid cell's worth of one.

**What one day said (recorded, not concluded — `quant-e2e-2026-09-06.md` §5):** against
Coach's rule *debit ≤ 10% of width*, the rule-compliant put flies hit +150% before 10:50 and
netted +122–134% after tax; held to the close instead they were flat. **The exit rule changed
the reading of the entry rule.** Swept across every entry minute, the same fly hit on 38 of
167: the 10:00 entry was the trade. A tax floor appears below ~$15 of debit. One day; a
registered hypothesis with its falsifier attached, for N ≥ 20.

##### The standard error was an estimator of a banned statistic

v0.7 required the response carry a **standard error** so a caller could see whether `N` was
enough. The intent is right and the instrument is wrong: a standard error is the square root
of a variance over `N` — it estimates the precision of the **mean**, which §3.10 bans, and on
a bimodal, fat-tailed distribution its finite-variance assumption is the same one that
disqualified Sharpe.

The question — *"was N enough to separate these two strategies?"* — is answered on the object
we actually have:

> **`stability{n_half_vs_n}`: the band set and the ECDF are recomputed on a random half of
> the paths and compared to the full set. If the bands move materially, `N` was not enough
> and the response says so. Order-free (sorted arrays), assumes no moment, and answers the
> question directly.**

**AT-ATRV-21** is rewritten to this. Raising `N` until a strategy looks good remains the
multiplicity failure Sheldon's invariant 4 covers, on a new axis.

`no_fill_rate` is a first-class output. A strategy that only works when you always get
filled is not a strategy, and that fact must be visible without reading the code.

#### Reproducibility is not optional

Every run is **seeded and the seed returned**. An unseeded Monte Carlo cannot be checked,
cannot be re-run by Delta, and cannot be compared against itself after a change. Same run,
same seed, same corpus → byte-identical result. **AT-ATRV-20.**

**Path count is stated and defended.** N is a parameter, reported with the result, and the
response carries `stability{n_half_vs_n}` so a caller can see whether N was enough to
separate two strategies — **not** a standard error, for the reason given above. Comparing
distributions from different N without saying so is a defect (**AT-ATRV-21**) — and *raising N until a strategy looks good* is the multiplicity failure
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

| | Measured | Where |
|---|---|---|
| Raw JSON archive | **4.25–7.25 GB/day**, 74k–330k files | bench §1 (SSR-MEXP §5.1's 1.6 GB was modelled; retracted) |
| Hot store, one book-day, plain int32 | **141 MB** incl. 41.6 MB packs (XSP, 110 contracts) | `meta.json` |
| Cold store, one book-day, encoded | **~1.3 MB** at 1e-6 greek quantum (198×) | bench §4.1 |
| Cold store, all ~28 books, one year | **~9 GB** | bench §4.1 |
| Full build, one book-day, incl. verify | **44 s** on the collector | `meta.json` |
| `/series` 2 contracts × 3 fields | **23 ms** | e2e transcript |
| `/mark` 3-leg fly, 20,472 instants | **17 ms** | e2e transcript |
| 4-leg gather, pure Python | **1.6 ms** (0.2 ms with numpy) | bench §3.1 |
| `/simulate` 2,000 paths | **55 ms** | e2e transcript |
| `/sweep` 167 entries × 100 paths | **623 ms** | e2e transcript |

v0.8's *108 MB/day for six books* was modelled from ~3 fields and is retired; the real field
list is 12 wide and the real book count is ~28.

The union of 100 four-leg strategies is at most 400 contracts and in practice far fewer,
because strategies on one underlier share strikes. **The gather does not grow with the
number of strategies — it grows with the number of distinct contracts, which is bounded by
the book.**

---

## 5. What this is not

- **Not a replacement for the Archive Read API.** That serves days, coverage and replay to
  Labs and to members. This serves *series* to analysis **on the lab node** — QLAB §3 places
  that role, and this spec names no hostname. Different callers, different shape, same corpus.
- **Not a source of truth** (§2.1).
- **Not a strategy engine.** It returns marks and presence. What a strategy *means* — entry
  rules, risk, fills — is Sheldon's and Strategy Lab's, not this API's.
- **Not member-facing.** No auth path to a member surface; Exit Trail v0.2 §5's
  aggregated-not-per-trade rule governs anything that ever reaches one.
- **Not a fill model.** It returns quotes and sizes as archived. Turning those into a fill
  probability is SSR-MEXP §1.9 and belongs to Sheldon. Until that map is stamped, every
  simulate response names `fill_model: unfitted_pessimistic` — and an `idealised` run still
  reports the tax it *would* have paid (§3.7, AT-ATRV-15).
- **Not the study registrar.** This API is the primitive; it registers nothing and remembers
  nothing. **QLAB §4.5 registers studies that call it** — and its controls bind the study
  runner, so a raw `/api/simulate` from a notebook with no `study_id` is the 11pm holdout
  leak QLAB AT-QLAB-23 exists to fail. The layering is: ATRV serves, QLAB governs.
  **AT-ATRV-31.**

---

## 6. Open decisions

| # | Question | Owner | Default if silent |
|---|---|---|---|
| **OD-ATRV-1** | Format: raw mmap arrays, Arrow IPC, or Parquet? | **Foxtrot · Alpha** | **Arrow IPC** — zero-copy mmap, portable, already columnar. Parquet if compression matters more than latency |
| **OD-ATRV-2** | Build trigger: nightly batch, or incremental during the session? | **Foxtrot** | **Nightly**, after the day settles. Incremental only if a live use case appears |
| **OD-ATRV-3** | Retention of the derived store — all days, or a rolling window rebuilt on demand? | **Coach** | **Rolling**, since rebuild is cheap and the archive is permanent |
| **OD-ATRV-4** | Does the era-1 corpus get a derived build too? | **Coach** | **Yes** — it is what §13's track A benchmark should be compared against |
| **OD-ATRV-5** | **Stickiness map** — the fitted convention, per regime and per DTE (§3.5.1) | **Sheldon** | **Blocking `fitted`.** Until stamped, `sticky_strike` and `sticky_moneyness` only |
| **OD-ATRV-6** | **Fill model** — Coach's direction: spread-based first, fitted from his fill history joined to the store's state at each fill; VIX as regime; then time-to-fill and complex-order semantics (§3.7.0) | **Sheldon** | **The next job.** Until stamped, `unfitted_pessimistic` on every response; no made-up curve |
| **OD-ATRV-9** | **Hot-book tier** — plain scaled-int mmap vs delta+varint+zstd; cannot have both in one file (§2.2.2) | **Foxtrot** | **Plain for any day a study will open; encoded for days nobody has mapped.** Benchmark before choosing otherwise |
| **OD-ATRV-10** | **Greek quantum** — `LABS_QUANT_GREEKS_QUANTUM`, starting value 6, max error 5e-7 measured; greeks are still 88% of the encoded bytes | **Sheldon** | 6 until stamped; it touches every estimator |
| **OD-ATRV-11** | `last_updated` semantics — vendor quote time or collector write time? Stored either way as an offset | **Foxtrot** (vendor docs) | Treat as quote age **only after** confirmation |
| **OD-ATRV-7** | Does `tail_cvar` ever become display-legal on a member surface? | **Coach · Tango · Hotel** | **No.** Researcher-only. It is still a mean |
| **OD-ATRV-8** | Alignment of OD-ATRV-3 (rolling store) with QLAB §3's ~27 GB/yr local retention | **Foxtrot** | One store, retention set by QLAB; the archive remains the authority either way |

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
| **AT-ATRV-27** | `stickiness = fitted` is **refused** with `STICKINESS_MODEL_UNFITTED` until Sheldon stamps a map. A silent fallback to `sticky_strike` **fails** (§3.5.1). |
| **AT-ATRV-28** | Package greeks are the **signed** sum `Σ qty_i × Δ_i`. A build summing an unsigned body and wings **fails**, as AZ-ALGO **E39** already found in a landed fixture (§3.5). |
| **AT-ATRV-29** | Every simulate response carries `fidelity`. On an era-1 day it is `era1_no_depth`, and any endpoint whose answer requires depth, quote age, or an intraperiod bound **refuses** rather than defaulting. An after-tax answer on era-1 **fails** (§3.6). |
| **AT-ATRV-30** | No single quantile is returned as its own field or rendered alone. `p50` exists only inside the `bands` set. `tail_cvar` is absent from `display_legal[]`, and a response omitting `display_legal[]` **fails** (§3.8, QLAB §4.4). |
| **AT-ATRV-32** | The build **refuses to write inside the archive**, and is **void** unless every pack decodes to the original bytes and sampled cells equal the snapshot at the declared scale (§2.1). Real day: 20,472 packs, 739 cells, 0 mismatched. |
| **AT-ATRV-33** | Quotes are exact scaled integers with 0 scale violations; greeks are quantised at the declared decimals with the **max error recorded per field** in the header; `float32` appears nowhere in the store (§2.2.1). |
| **AT-ATRV-34** | Calls and puts at one strike are **distinct contracts**; a strike admitted mid-session is `present = 0` before admission and no cell is filled (§2.2). |
| **AT-ATRV-35** | `/chain` returns the snapshot **at or before** `t_ms` with `lag_ms`, never a blend; before the first snapshot is a named 404 (§3). |
| **AT-ATRV-36** | `exit_kind = target` leaves at the **first** mid-mark touch of `(1 + pct/100) × debit` and the response names the hit instant and mark; never reached falls back to the time exit and says so (§3.8). |
| **AT-ATRV-37** | `/sweep` pools every entry at the step with its own fill Monte Carlo; two runs with the same seed are byte-identical; reports entries hit and minutes-in-trade bands (§3.8). |
| **AT-ATRV-38** | A partial `LABS_QUANT_*` configuration **aborts boot**; an absent one answers **501 QUANT STORE NOT CONFIGURED**; zero traded paths is **`NO_PATH_TRADED`**, never `NaN` (§3, §3.8). |
| **AT-ATRV-31** | A `/api/simulate` call carrying no `study_id` is servable by this API and **refused by the study runner** (QLAB AT-QLAB-23). Asserted from the runner: the same call from a bare `python` session fails identically (§5). |
| **AT-ATRV-23** | **Schedule-independent reproducibility.** The same simulation run serially, on 8 cores and on 16 cores, in any completion order, yields **byte-identical** output. The random stream is a pure function of `(seed, strategy_id, path_index)`; a shared mutable RNG or a thread-derived seed is a **defect** (§3.9). |
| **AT-ATRV-19** | **No endpoint returns a scalar P&L for a strategy.** The simulate path returns a distribution or it returns an error. A single-draw result cannot be obtained, accidentally or deliberately (§3.8). |
| **AT-ATRV-20** | Every simulation is seeded and returns its seed. Same inputs, same seed, same corpus → **byte-identical** output (§3.8). |
| **AT-ATRV-21** | Results carry `paths` and `stability{n_half_vs_n}` — **not** a standard error, which estimates the precision of a banned statistic and assumes a finite variance this data does not offer. Two distributions produced at different `N` cannot be compared without both being reported (§3.8). |
| **AT-ATRV-22** | `no_fill_rate` is returned on every simulation, for entry and exit separately (§3.8). |
| **AT-ATRV-15** | **No untaxed fill exists.** Source grep plus behavioural test: there is no parameter, flag or code path that yields a fill at mid with zero friction and certain execution. An `idealised` run still reports the tax it would have paid (§3.7). |
| **AT-ATRV-16** | Tax is applied at **entry and exit**, **per leg**. A four-contract structure round trip is charged eight crossings, not two, and not one net figure (§3.7). |
| **AT-ATRV-17** | When the probability model returns no fill, the position is **unchanged** and the result says so. No partial credit, no fill at an unquoted price (§3.7). |
| **AT-ATRV-18** | Every result reports total tax **split friction vs probability, per leg, per side** — never a single net number (§3.7). |
| **AT-ATRV-12** | Simulated actions occur no earlier than `t + LABS_ATRV_ACTION_LATENCY_S`, default one snapshot interval; the key is fail-loud. A zero-latency run is permitted only on explicit request and is labelled `idealised` in the response (§3.6). |
| **AT-ATRV-13** | Every simulated result carries its assumptions — action latency, fill model, stickiness, quote age at each decision, and any stale or absent leg. A result without attached assumptions is a **defect** (§3.6). |
| **AT-ATRV-14** | A query whose outcome depends on sub-snapshot sequencing returns **`SUB_INTERVAL_UNRESOLVABLE`**, never an interpolated touch or a manufactured fill (§3.6). |
| **AT-ATRV-11** | Package greeks and `PaR = Δ·m + ½Γ·m²` **at the observed `t`** are a lookup from archived per-leg greeks, obtainable without a vol surface. Greeks at any **hypothetical** spot are model output and are returned **inside `model{}`** — a response placing a hypothetical-spot greek outside it **fails**, per AT-ATRV-10 (§3.5). |

---

## 8. Changelog

| Ver | Date | Notes |
|---|---|---|
| **v0.4** | *(folded into v0.5, never landed separately)* | Adds **§3.7, the fill tax as law**. Coach: *all fills must have a friction/probability tax.* No code path yields an untaxed fill — structural, not a default someone can zero. Two mandatory components: **friction** (spread crossed, measured per strike per snapshot; fees fail-loud config) and **probability** (fitted from `bid_size`/`ask_size` and queue, Sheldon's estimator). Shows why it cannot be an end-of-study haircut: friction scales with **leg count** and is paid **twice**, so a three-strike fly round-trip crosses **eight contract-spreads** — 13–67% of a $300 debit at plausible spreads, which is why butterflies backtest better than they trade. **Default is deliberately pessimistic** — the errors are not symmetric for a capital-preservation firm, and erring toward mid is how a backtest becomes a sales document. Taxed at entry *and* exit, per leg; rolls and adjustments are fills; a no-fill is a no-fill with no partial credit. Reported split friction-vs-probability per leg per side, never one net number. AZ-ALGO §14 criterion 3 must be answered **after tax**. **AT-ATRV-15…18**. |
| **v0.9** | 2026-09-06 | **As built (DL-677), written from evidence.** **§2.2.1 type law stamped by the data:** quotes are scaled integers exact on the half-cent grid; greeks are **quantised at a declared decimal count with the max error recorded** — "lossless" preserved vendor noise to 1e-30 and made greeks 98% of the output; **`float32` retired** (76.6% of real values not exactly representable). Contract identity is `(strike, side, expiration)` — the Track A experiments keyed on `right` and collapsed sides (C=51); the store has 110. `last_updated` is nanoseconds, stored as an offset from `time[t]` — the quote-age quantity. Two absences never conflated (`present=0` vs `NULL_I32`); vendor artefacts nulled and counted (103 post-expiry thetas). **§2.1 the build proves itself or is void** — real day 44 s, 20,472 packs byte-identical, 739 cells 0 mismatched; the nightly transpose is ~6 s and the in-session `[C][T]` argument is closed. **§2.2.2 two tiers, OD-ATRV-9:** plain mmap hot (141 MB/book-day incl. packs) vs encoded cold (~1.3 MB, 198×, ~9 GB/yr all books). **§3 the API as shipped** — `days spot series mark chain simulate sweep`, 501 when off, partial config aborts boot, every refusal named. **§3.7.0 the fill model is a placeholder and every response says so** — flat `p_fill`, assumed placement, independent legs (a fly is a complex order), one-snapshot fills (Coach: 10–30 s, missed or re-seated); **the next job is spread-based fill probability fitted from Coach's fill history, then VIX regime, then time-to-fill; shape now, parameters fitted, no made-up curve.** **§3.8 exit rules** (`time`, `target +N%` resolved on the mid-mark) and the **entry sweep** — the series answer, taxed; one day's numbers against Coach's placement rule recorded with a falsifier, not concluded. **§4 every cost figure measured** (v0.8's 108 MB/day retired). AT-ATRV-32…38. OD-ATRV-9…11. |
| **v0.8** | 2026-09-05 | Advisor review pass. **§3.8's payload contradicted §3.10 in the same document** — the paragraph reading *"Not a mean"* was followed by `worst_1pct_mean`, `best_1pct_mean` and a featured `p50`, a median that on a bimodal fly sits in the valley between the modes. The ECDF becomes the object, the quantile set stays for dominance math but **no single band may be rendered alone**, tail means are honestly named `tail_cvar` and marked **researcher-only**, and `display_legal[]` is returned rather than inferred so a Lab Bot builder is not left to guess where QLAB's publish seam falls. **The required standard error was an estimator of a banned statistic** — precision of the mean, on a distribution whose finite variance already disqualified Sharpe; replaced by `stability{n_half_vs_n}`, which is order-free, assumes no moment, and answers the actual question. **AT-ATRV-11 contradicted AT-ATRV-10 three paragraphs above it**: archived greeks carried to a hypothetical spot are sticky-strike on the greek surface, a silent model wearing an archived name — scoped so the lookup is at the observed `t` and grid greeks live inside `model{}`; the package sum is **signed** (AZ-ALGO E39). **§3.6 gains the era-1 fidelity state:** all three fields closing gaps 1–3 are discarded by the era-1 write path and SSR-MEXP §3.1 makes verbatim forward-only, so era-1 days carry `era1_no_depth` and refuse rather than default — which is also the split SSR-MEXP §1.10 needs, since package `PaR` is a lookup today but an **after-tax** answer is not. `fitted` leaves the callable stickiness enum (§3.5.1). §5 stops pinning analysis to StudioOne and names the lab node QLAB §3 places, and adds the layering sentence: **ATRV serves, QLAB governs** — an unregistered simulate call is the holdout leak. OD-ATRV-5…8 opened. AT-ATRV-27…31. |
| **v0.7** | 2026-09-05 | Adds **§3.10 — a strategy is its distribution shape.** Coach's conclusion from §3.8, and the FatTail thesis stated operationally: once a traversal returns a distribution, the distribution *is* the object and P&L is a summary that discards the structure. **Bans mean-as-headline, Sharpe, win-rate and single-path drawdown**, each with the reason it lies on this data. Names **bimodality as the normal case** — a 0DTE fly either lands near the body or does not, so the mean sits in the valley between two modes and describes an outcome the trade rarely occupies. Reports instead: left-tail shape (is bounded loss honoured **after tax**), right-tail shape (did friction eat the convexity), **asymmetry as the convexity claim measured**, tail decay, modality, and all of it conditional on regime/GEX/entry/DTE. Comparison is by **stochastic dominance**; where neither dominates that is a finding for a human, not a tie broken by means. **Reframes AZ-ALGO §14: the guide is a shape operator, not a P&L improvement** — criterion 3 asks what the transform did to *each tail separately*, and OD-ALGO-10's clause split should be reported as two shape transforms rather than two fold counts. **AT-ATRV-24…26**. |
| **v0.6** | 2026-09-05 | Adds **§3.9, execution**. The workload is near-ideal for parallelism — the price path is fixed and read-only, so cores share memory-mapped arrays with no copy and no contention. Independent across paths, strategies and days. **Names the trap:** the naive parallel implementation (shared RNG, or per-thread clock seeds) silently breaks AT-ATRV-20's byte-reproducibility, and breaks it invisibly — results look fine, they just stop being the same twice, and nobody notices until Delta cannot reproduce a study. **Law: the random stream is a pure function of `(seed, strategy_id, path_index)`**, so thread count is a performance knob with no semantic effect. Measured: **traversal is 80 ms serial, 5 ms on 16 cores** — already free — while the **daily build is 48 s serial, 3 s on 16**. So parallelism belongs on the once-per-day build, not on a query that finishes in milliseconds, and **serial is an acceptable default for traversal**. **AT-ATRV-23**. |
| **v0.5** | 2026-09-05 | Adds **§3.8 — traversal is Monte Carlo by construction**, which follows from §3.7: if every fill is probabilistic, a single traversal is **one sample, not an answer**. So the primitive is a **distribution**, and no endpoint returns a scalar P&L because that object does not exist. Draws the line that makes it affordable: **the price path is archived and not random — only execution is**, so Monte Carlo runs over **fill events** (100 strategies × 1,000 paths × 4 legs × 2 sides = 0.8 M draws) rather than timesteps (1.2 B), ~1,460× less, with the gather still done once. Returns **quantiles and tail bands, never a mean** — a mean would re-commit the §14.3 error of optimising the middle. `no_fill_rate` is first-class: a strategy that only works when you always get filled is not a strategy. Seeded and byte-reproducible; `paths` and standard error reported, because raising N until a strategy looks good is Sheldon's invariant 4 on a new axis. **AT-ATRV-19…22**. |
| **v0.3** | 2026-09-05 | Adds **§3.6, fidelity**. The cadence argument is that **2 s is the decision surface** — the grid the trader sees and acts on — so simulating there reproduces the decision environment rather than chasing the market's tick rate. Names the four gaps between a 2 s grid and reality: **three are closed by verbatim capture and are further cost of the field allowlist** — `day.high/low` and `last_trade` bound intraperiod movement (without them the sim systematically under-counts touches, which is exactly where scalping lives), `last_quote.sip_timestamp` gives quote age so a stale quote is a named state rather than a price, and `bid_size`/`ask_size` give queue position. The fourth is **action latency**: a simulation transacting at the instant it observes is **superhuman** and overstates every fast strategy, so acting is deferred one snapshot by default, fail loud, and a zero-latency run is labelled `idealised`. Every simulated result carries its assumptions. A query needing sub-2-second sequencing returns `SUB_INTERVAL_UNRESOLVABLE` rather than an interpolated touch. **AT-ATRV-12…14**. |
| **v0.2** | 2026-09-05 | Adds **§3.5** — Coach: *traverse* means the **T+0 curve with full vol-per-leg shape**, because these strategies fold long before expiration, so the expiry diagram is near-irrelevant. Separates the two computations: the realized path is a **lookup** of archived marks; the T+0 curve is a **model output** repricing legs at spot that never happened. Per-leg IV is the requirement, not a refinement — a fly's shape is driven by body-versus-wing vol, and one ATM vol erases the convexity the structure exists to express. Names the **stickiness convention** as an explicit, always-returned decision (holding IV fixed while moving spot is itself the sticky-strike choice, and choosing it silently is this program's recurring defect) — and notes the archive can *measure* which convention the underlier obeys, making it Sheldon's estimator rather than an assumption. Curves carry `model{pricer, iv_source, stickiness, as_of}` and can never be mistaken for observed marks. Position greeks across the spot grid make AZ-ALGO's `PaR` a lookup. **AT-ATRV-9…11**. |
| **v0.1** | 2026-09-05 | First draft. Finds that the archive's write layout (snapshot-major, correct for capture) is the **transpose** of the analysis read pattern (contract-major) — today one contract's series costs 11,700 file opens and 1.05 GB touched to extract 0.09 MB. Proposes a **derived, rebuildable, non-authoritative** contract-major columnar store: ~108 MB/day, and 100 arbitrary four-leg strategies resolve in a 5.6 MB gather plus one dot product, sub-millisecond, no parse (~188× fewer bytes). Answers Coach's tensor question in both directions: tensors fit **structure search**, and are the bottleneck for **strategy traversal** (sparse gather over ragged data) — same source, two derived views. **No strategy is ever registered or precomputed**, which is what makes *arbitrary* real. Presence mask is first-class because band absence is informative, not missing-at-random. |
