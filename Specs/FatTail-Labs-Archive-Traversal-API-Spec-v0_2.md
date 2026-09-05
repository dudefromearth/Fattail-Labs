# FatTail Labs — Archive Traversal API Spec v0.2

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
| **AT-ATRV-11** | Position greeks are returned across the spot grid, computed from archived per-leg greeks. `PaR = Δ·m + ½Γ·m²` for any structure at any `t` is obtainable without re-deriving greeks from a vol surface. |

---

## 8. Changelog

| Ver | Date | Notes |
|---|---|---|
| **v0.2** | 2026-09-05 | Adds **§3.5** — Coach: *traverse* means the **T+0 curve with full vol-per-leg shape**, because these strategies fold long before expiration, so the expiry diagram is near-irrelevant. Separates the two computations: the realized path is a **lookup** of archived marks; the T+0 curve is a **model output** repricing legs at spot that never happened. Per-leg IV is the requirement, not a refinement — a fly's shape is driven by body-versus-wing vol, and one ATM vol erases the convexity the structure exists to express. Names the **stickiness convention** as an explicit, always-returned decision (holding IV fixed while moving spot is itself the sticky-strike choice, and choosing it silently is this program's recurring defect) — and notes the archive can *measure* which convention the underlier obeys, making it Sheldon's estimator rather than an assumption. Curves carry `model{pricer, iv_source, stickiness, as_of}` and can never be mistaken for observed marks. Position greeks across the spot grid make AZ-ALGO's `PaR` a lookup. **AT-ATRV-9…11**. |
| **v0.1** | 2026-09-05 | First draft. Finds that the archive's write layout (snapshot-major, correct for capture) is the **transpose** of the analysis read pattern (contract-major) — today one contract's series costs 11,700 file opens and 1.05 GB touched to extract 0.09 MB. Proposes a **derived, rebuildable, non-authoritative** contract-major columnar store: ~108 MB/day, and 100 arbitrary four-leg strategies resolve in a 5.6 MB gather plus one dot product, sub-millisecond, no parse (~188× fewer bytes). Answers Coach's tensor question in both directions: tensors fit **structure search**, and are the bottleneck for **strategy traversal** (sparse gather over ragged data) — same source, two derived views. **No strategy is ever registered or precomputed**, which is what makes *arbitrary* real. Presence mask is first-class because band absence is informative, not missing-at-random. |
