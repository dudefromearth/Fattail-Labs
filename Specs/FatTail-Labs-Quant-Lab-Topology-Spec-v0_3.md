# FatTail Labs — Quant Lab Topology Spec v0.3

**Status:** **DRAFT — not BUILD AUTHORITY.** Needs Coach, India (host pillar · Lab Bot
object), Foxtrot (infrastructure · transport), Sheldon (study contract · grade law).
Decision-log entry required.
**Date:** 2026-09-05 · **Short name:** **QLAB** · **Owner:** Juliet (draft) → Foxtrot / Alpha
**Supersedes:** v0.2 (2026-09-05) — closes the advisor review's ten recommendations, adds
the **backfill** workload, reconciles **Lab Bot** with DL-247, names the **publish
transport**, and makes reproducibility rest on **order-free operators** rather than on a
thread pin.
**Parents:** [DL-673](../Architecture/00-decision-log.md) ·
[DL-247](../Architecture/00-decision-log.md) ·
[ATRV v0.7](./FatTail-Labs-Archive-Traversal-API-Spec-v0_7.md) ·
[SSR-MEXP v0.8](./FatTail-Labs-Collector-Multi-Expiration-Capture-Spec-v0_8.md) ·
[StudioOne Archive Read API v0.8](./FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8.md) ·
[Bot Marketplace Framework v0.1](./FatTail-Labs-Bot-Marketplace-Framework-Spec-v0.1.md) ·
[Strategy Lab Navigation Continuity v1.0](./Strategy-Lab-Navigation-Continuity-Spec-v1.0.md) ·
`agents/bench/sheldon.md`

---

## 0. Coach intent (do not drop)

> Let's figure out the best way to use these available resources to create a **first class
> Quant Lab that will serve labs.fattail.ai**.

> We have StudioOne as our main collector (Mac Studio M1 Max, 32 GB), but we also have an M4
> Mac Mini with 24 GB that we can commandeer and use for anything we want.

> Forget staging, and flyonthewall.io — both are available.

> The member interface to the quant lab is **indirect, or not real-time**. The quant lab will
> have already created most of the boilerplate **Lab Bots**; the user simply selects the one
> they want, with **minor configuration** to meet their requirements. We will offer an
> interface in the **Strategy Lab** that lets the user select the strategy and configure it.
> The Quant Lab **may already have created the study**, including the Monte Carlo analysis;
> if not, it will become another that will get **delivered in a timely manner**.

> The **admin interface** will be more **scientific** oriented. We will conduct **experiments**
> with the data.

> DudeOne and DudeTwo are **identical configurations**, however they have only 500 GB SSDs
> attached. I have big 2–4 TB drives I can attach to them, but not until I return.

> The capability is important as we will create **derived models later** at some point.

---

## 1. What "first class" means here

Not "fast." Three properties, in order:

1. **Every published number is regenerable.** Any figure that reaches `labs.fattail.ai` can
   be traced to the study that produced it and re-run to the byte. A result nobody can
   reproduce is not a result — Sheldon's charter, made infrastructural rather than
   aspirational.
2. **The member never waits on the lab, and the lab never waits on the member.** A study can
   run for six hours without a member noticing; a member's page never queues behind a sweep.
3. **Capture is never the thing that gives way.** The corpus is unrepeatable (SSR-MEXP §2).
   Every other workload yields to it.

Speed follows from the layout. It is not the goal.

---

## 2. Six workloads, and the tension that settles the layout

| Workload | Character | Runs on | Must not be starved by |
|---|---|---|---|
| **Capture** | continuous, latency-critical | collector | **anything, ever** |
| **Nightly build** | one day, parse-bound, bursty | lab | capture |
| **Backfill** | *all history*, rare, hours | lab | capture — **and must never read the collector** (§2.1) |
| **Notebook query** | interactive, sub-second, **admin** | lab | studies (§2.2) |
| **Studies** | hour-long sweeps, preemptible | lab | — |
| **Serve** `labs.fattail.ai` | member-facing, reads published artifacts | production | **all of the above** |

**The tension:** a Monte Carlo sweep across months (ATRV §3.8) will peg a machine for hours.
If that machine also serves members, members feel it. **Studies and serving cannot share
hardware** — and that, not hostnames, dictates everything below.

The Archive Read API already stated the collector half of this rule:

> Collection outranks reads … the concurrency ceiling is **per machine, not per feature** —
> the next function added must not silently halve the tap's headroom.

### 2.1 Backfill is a workload, and it is the one that would break that rule

v0.2 listed only the *steady-state* build: one day, ~1.6 GB, one pull. **A new derived model
re-reads every day ever captured.** A different columnar layout, an added field set, a tensor
view for structure search, a surface reconstruction — each is a full-history rebuild, and
Coach has named this as a capability the Lab must have, not an edge case.

At era-2 rates that is ~400 GB raw per year of corpus. Served from the collector it is an
hour of sustained read **every time a layout changes** — precisely "the next function added
silently halving the tap's headroom."

> **Law: backfill never reads the collector. The Lab holds its own copy of the corpus, and
> every rebuild — steady-state or full-history — is served from it.**  **AT-QLAB-8.**

This also repairs an unstated dependency in v0.2. ATRV §2.1's *"the derived store is a cache,
rebuildable"* is only true if there is something local to rebuild **from**; v0.2 quietly made
that the collector.

**Raw or compressed is OD-QLAB-10.** The default is **compressed**: ~40 GB/yr against
~400 GB/yr raw, which fits the stock 500 GB SSD alongside the derived store for roughly six
years and needs no new hardware. The read cost is expected to hide under parse — but that is
a *prediction*, and §3's figures are modelled rather than measured, so it is written as an
open decision with a measurement attached, not as a finding.

### 2.2 "Query" was two workloads wearing one name

v0.2's table starved Query only by studies, then put it on the same box as hour-long sweeps.
Splitting it:

- **Serve** — a member reading a published artifact. Production. Protected by AT-QLAB-9.
- **Notebook query** — Sheldon and Coach querying the corpus interactively. The Lab. Sits
  next to the sweeps, and v0.2 gave it no protection at all.

A six-hour sweep starves the notebook unless studies yield. **Law: a study declares the day
window it will touch and runs against a reserved slice of the Lab, leaving a reserved slice
for the notebook.** Without this, "the member never waits" is purchased by making the
researcher wait, and the surface built in §4.5 to enforce discipline becomes the surface
nobody uses. **AT-QLAB-10.**

---

## 3. Allocation

```
COLLECTOR · StudioOne · M1 Max 32 GB · 2 TB
    CAPTURE + CORPUS + Archive Read API          <- source of truth, untouchable
        |
        |  nightly: one day, ~1.6 GB
        |  backfill: NEVER (2.1)
        v
LAB NODE · M4 / 24 GB / 500 GB  (hostname TBD - OD-QLAB-1)
    THE QUANT LAB                                <- build - backfill - studies - notebook
    local corpus mirror   (2.1, OD-QLAB-10)
    derived store         ~108 MB/day, ~27 GB/yr ON DISK
        |
        |  publishes RESULT ARTIFACTS - kilobytes (5.1)
        v
PRODUCTION
    SERVES labs.fattail.ai                       <- reads published artifacts only
                                                    never touches the corpus
                                                    never runs a study
```

**Hostnames are deliberately absent.** OD-QLAB-1 is blocking, and a layout that stamps a
hostname before Coach and Foxtrot name the box is making a product decision this spec does
not own. The **roles** are settled; which physical Dude carries the Lab role is not, and —
now that Coach has confirmed **DudeOne and DudeTwo are identical configurations** — the
choice is arbitrary rather than load-bearing. That materially reduces OD-QLAB-1: it can no
longer swap the design, only the label.

**Why the M4 and not the M1 Max.** The traversal benchmark reports parse-dominated cost, and
parse is bound by per-core throughput rather than memory bandwidth, so the M4's faster cores
win and the M1 Max's ~400 GB/s advantage does not apply. **Status of that claim: modelled,
not measured.** `scripts/atrv-bench.py` has not yet been run against the era-1 corpus on the
collector, and no output is committed. Every derived figure below inherits that status.

| Figure | Value | Status |
|---|---|---|
| Nightly pull | ~1.6 GB, ~13 s on 1 GbE | modelled from SSR-MEXP §5.1 |
| Nightly build | ~3.4 s on the Lab | **modelled** — order of magnitude only |
| Parse share of scan cost | ~82% | **smoke fixture, not the corpus** |
| Derived store | ~108 MB/day, ~27 GB/yr | modelled from ATRV §4 |

**None of these is capacity law until track A runs.** Running it is unblocked, read-only, and
needs no stamp. **AT-QLAB-9** and **AT-QLAB-7** name where the real numbers get scraped Losing the derived store
costs a rebuild and nothing else — it is a cache on a different machine from the corpus
(ATRV §2.1). **AT-QLAB-6.**

**27 GB/year is disk, not working set.** v0.2's diagram read `derived store LOCAL, mmap'd,
~27 GB/yr` on a 24 GB box, which invites exactly the wrong conclusion. A year of files sits on
disk; a study's resident set is **the day window it declared (§2.2) plus indexes**. mmap makes
that a page-fault question, not a capacity one.

**The second Dude.** Once recommissioned it is an exact peer of the first — a second lab node
for parallel sweeps, or a warm standby for the corpus mirror. It is **not** a third
environment; DL-673 retired staging. Production's migration off MiniTwo stays out of scope
(§7), and MiniTwo has been removed from this allocation entirely to stop implying otherwise.

**One consequence of identical Dudes.** AT-QLAB-2 asks for reproduction on a **different host
and a different core count**. Two identical Dudes cannot test that. The reproduction check
runs against the collector or MiniTwo — a genuinely different part — or it asserts nothing.

---

## 4. The publish seam

**A study's output is tiny.** Distributions, shape metrics (ATRV §3.10), conditional tables
— kilobytes, not gigabytes. So:

> **The Lab produces. Production serves. Nothing member-facing calls the Lab live.**

| | |
|---|---|
| Lab → production | **result artifacts**, published, immutable, versioned (§5.1) |
| Production → corpus | **never** |
| Member request | a read of an already-computed artifact |

This one seam buys: production latency independent of lab load, studies free to run for
hours, and a corpus only two machines can reach at all.

### 4.0 A Lab Bot is not a new object — it already exists

**v0.2 introduced "Lab Bots" as though the Quant Lab were creating the concept. It is not.**

| Already decided | Where |
|---|---|
| The Marketplace exists to **monetize FatTail Lab Bots** | **DL-247** (2026-08-07) |
| Admins **define and version** official Lab Bots; the house catalog is system of record | Bot Marketplace Framework v0.1 §0.1 |
| Delivery is **into Strategy Lab Curate**, never one-click live Deploy | Bot Marketplace Framework v0.1 |
| Members work in **Design · Curate · Deploy · Archive** | Strategy Lab Navigation Continuity v1.0 §6.1, DL-232 |

Naming a second catalog object "Lab Bot" with its own lifecycle would be a parallel store of
truth — the failure mode §7 of INSTRUCTIONS.md exists to prevent, committed in the spec that
invokes it. **This is a defect in v0.2 and is corrected here:**

> **Law: a Lab Bot is the Marketplace catalog object. The Quant Lab does not create a type;
> it attaches a *study* to an existing one. Catalog identity, versioning and system of record
> stay with the Marketplace (DL-247). This spec owns the study and its grid, nothing else.**

Whether "studied" is a property of the existing catalog object or a distinct linked record is
**OD-QLAB-11 · India**, marked **STAMPED-PENDING**. The default written here is the first:
one object, a study attached.

**The fork rule.** A member may take a Lab Bot into **Design** and change a leg. The moment
they do, the structure is no longer the one that was studied:

> **Law: on fork, study artifacts do not travel. The study pane clears and names the state
> `unstudied · your design`. A forked structure never displays a number produced for its
> parent.**

Without this, the member surface shows a regenerable, manifest-backed number for a structure
that was never studied — which is worse than showing nothing, because it is *credible*.
**AT-QLAB-14.**

**Naming is locked.** *FatTail Lab Bots* is Coach language under DL-247 and is not renamed
here. Tango still gates the chrome so that "bot" does not read as an alert or a signal.

### 4.1 The product model — a catalog of studied bots, with a queue behind it

**OD-QLAB-3 is resolved: producer, with a queue.** Not a service, and not a static site
either.

```
Quant Lab pre-studies boilerplate LAB BOTS
        |  each bot = a Marketplace catalog object (4.0) + a configuration GRID, fully studied
        v
Strategy Lab shows the catalog          member selects a bot, configures it
        |
        +-- configuration is ON the grid  ->  published artifact, served instantly
        +-- configuration is OFF the grid ->  QUEUED as a new study, delivered in
                                              a timely manner, member is told so
```

**The member never waits on a computation. They either get an answer now, or they get a
commitment.**

#### The queue is a product surface, and it needs a holder

v0.2 named the queue and gave it nowhere to live. A commitment with no home is a spinner with
better copy. The queue's contract:

| Property | Rule |
|---|---|
| **Where it lives** | On the bot's card in **Curate**, and in one list the member can reach without remembering what they asked for |
| **Ticket binds** | `(membership, bot version, exact configuration)`. A study answers *that* tuple or it answers nothing |
| **States** | `queued` · `studying` · `ready` · `slipped` · `cancelled`. Every one is named text the member reads |
| **No progress bar, no live ETA** | The Lab's schedule is not a member-facing quantity, and a countdown that is wrong once is worse than a commitment kept plainly |
| **Slip is named** | If the commitment (OD-QLAB-7, default *next session*) is missed, the member is told it slipped. Silence is the failure |
| **Cancel** | Always available while `queued` or `studying` |
| **Changing the configuration while queued** | Creates a **new** ticket and cancels the old one. A ticket is never mutated — the artifact it produces is bound to the tuple that was requested |
| **The last on-grid configuration stays usable** | Queueing an off-grid variant never takes away the answer the member already had |

**AT-QLAB-19.**

#### The queue must not become a denial-of-service on the researcher

Member-originated studies land on the same Lab that runs Sheldon's sweeps (§2.2). A miss storm
— a badly placed grid, or one popular bot — buys "the member never waits" by making the
researcher wait.

- **Identical off-grid requests coalesce.** N members asking for the same tuple is **one**
  study, and all N tickets bind to its artifact.
- **Member-originated studies are capped** per interval, ahead of Sheldon's reserved slice
  (OD-QLAB-13). The cap is a named state (`queued`), not a rejection.

**AT-QLAB-20.**

### 4.2 The configuration UI *is* the study grid — this is the load-bearing rule

If Strategy Lab offers a width of 17 and the Lab studied `{10, 15, 20, 25}`, that is a miss.
Offer three continuous sliders and nearly every selection misses, the queue becomes the
normal path, and "not real-time" quietly becomes "always slow."

> **Law: the configuration options a member can select are generated from the study grid
> that has been run. They are not authored separately.**

Then the hit rate is a **number you chose** when you sized the grid, not an emergent
property of two teams guessing at each other. **AT-QLAB-15.**

#### Generated-from-the-grid is not enough — the control must not be able to rest off-grid

A builder can honour §4.2 and still ship a continuous slider with tick marks drawn at the
studied values. A slider rests between ticks, so the law is satisfied and the member is
off-grid anyway.

> **Law: no member-facing configuration control has a resting state that is not a studied
> grid point.**

| Studied values on an axis | Control |
|---|---|
| 2–8 | chips or a segmented control whose only values are grid points |
| 9+ | a snap control with **no in-between detent** — labels are the studied values |
| continuous slider | **fails**, with or without tick marks |

**AT-QLAB-16.**

#### The grid needs a ceiling, or the queue becomes the product

"Start narrow" (OD-QLAB-6) is the right default and it is not a bound. Four axes at five
values each is **625 studies for one bot**, and the cost is per-bot, not per-catalog. Without
a cap the Lab spends its life pre-studying combinations nobody selects, and the sweeps that
justify the Lab never run.

> **A per-bot ceiling on pre-studied grid cells is OD-QLAB-8 · Coach — STAMPED-PENDING.**
> Drafted default: **64 cells per bot**, chosen so that a three-axis bot at 4x4x4 fits whole
> and a fourth axis forces a deliberate trade rather than an accident. Widen where
> instrumented misses cluster (§4.3), never speculatively.

**Interpolation between grid points is forbidden.** These are distributions, not scalars
(ATRV §3.10) — the midpoint of two distributions is not the distribution of the midpoint,
and a butterfly's shape can change character between widths. A configuration is studied or
it is queued. **AT-QLAB-17.**

### 4.3 A miss is a named state, and it is useful information

A member who lands off-grid is told plainly: *this configuration has not been studied yet;
it is queued.* Never a spinner, never a silent fallback to the nearest studied bot, and
never a number produced by interpolation.

That message is also **product signal**: it tells the member their configuration is unusual,
and it tells you the grid is in the wrong place. **Hit rate is instrumented per bot and per
parameter from day one** — a bot whose members mostly miss is a bot whose grid is wrong, and
that should be visible without anyone filing a complaint. **AT-QLAB-18.**

### 4.4 What a Lab Bot may show a member

A Lab Bot presents study results to a member, so every member-surface rule already in force
applies, and they are stricter than the Lab's internal output:

| Rule | Source |
|---|---|
| **Distribution shape, never a headline P&L.** No mean, no Sharpe, no win rate as the answer | ATRV §3.10, AT-ATRV-24 |
| **No profit claims. Process outcomes only** | Invariant 8 |
| **Counterfactuals aggregated, never per-trade** | Exit Trail v0.2 §5 |
| Assumptions visible: fill tax, latency, stickiness, day grades | §5, ATRV §3.6/3.7 |

**The banned set is written out here rather than cited.** v0.2 leaned on AZ-ALGO
**AT-ALGO-36** for "probabilities never rendered as a percentage." That AT was deliberately
**narrowed** by E43 and E47 into a scoped chrome grep with two explicit carve-outs; citing a
purpose-narrowed test as general product law would either fail on legal strings elsewhere or
be weakened until it tests nothing. The member-surface rule stands on its own:

> **A Lab Bot surface contains no headline mean, no Sharpe, no win rate, no profit claim, no
> per-trade counterfactual, and no probability rendered as a percentage.**

**And no summary that reconstitutes one.** The prohibited forms are not only the named
metrics:

| Also fails | Because |
|---|---|
| A violin or density with a **marked mean or waist** | It is read as "the answer" — §3.10's bimodality argument, defeated by a glyph |
| An annotated percentile called **"typical"** | A central tendency with a different label |
| **Path-count-as-rate** — *"40 of 100 paths reached the body"* | That is a win rate |

Permitted: ATRV §3.10 shape output — bands, ECDF, modality — and the assumptions that
produced them. **Tango and Hotel gate every Lab Bot surface before it ships.** The pull on a
member-facing bot is to show a single encouraging number, and that is precisely what this
stack has spent nine spec revisions refusing to do. **AT-QLAB-21.**

**What is still out of scope:** a member triggering an *arbitrary* live study. The queue
covers off-grid configurations of **existing** bots. A member composing a novel strategy and
demanding fresh analysis is a different architecture and a later decision.

### 4.5 The admin surface is a lab notebook, not a dashboard

Two surfaces, and their constraints run in **opposite** directions:

| | Member — Strategy Lab | Admin — Quant Lab |
|---|---|---|
| Purpose | select and configure a studied bot | **conduct experiments** |
| Access | catalog only, on-grid | the whole corpus, any query |
| Protects | **the member**, from bad conclusions | **the researcher, from themselves** |
| Shape | curated, constrained, few choices | open, exploratory, scientific |

**Wider access is not looser discipline — it is different discipline.** Sheldon's charter
closes on *"the first person you have to stop fooling is yourself,"* and an admin surface is
exactly where that happens. A **dashboard** invites browsing until something looks good,
which is the multiplicity failure with a nice UI on it. A **notebook** enforces the order:
hypothesis → declared search space → run → record → verdict.

#### The binding is on the runner, not on the notebook

v0.2's controls were written against the admin **UI**. Sheldon sits on the Lab with `python`
and a memory-mapped store, and can query the holdout at 11pm without opening the notebook. A
control that only the UI enforces is a costume.

> **Law: the controls below bind the study runner — the code path that opens the derived
> store or the corpus mirror. The notebook is one client of that runner, not the boundary.**

**AT-QLAB-23.**

#### Registration is an object, not a sentiment

A markdown cell beginning "I think…" is not a registration. The runner accepts a study only
with:

```
hypothesis        what is claimed, in falsifiable form
falsifier         what observation would kill it
search_space      the axes and their extents, stated BEFORE the run
min_day_grade     the lowest completeness class this study accepts (6)
holdout_rule      which fold is sealed, and what releases it
```

Submitted and complete **before** the run is enabled. Post-hoc narration is the failure the
seat exists to prevent, and asking politely does not prevent it. **AT-QLAB-23.**

#### The holdout is physically unavailable, and says so

"Hold out a fold you will not look at" is a rule a tired researcher breaks at 11pm without
noticing. The runner **cannot serve** the held-out fold until the study is registered and the
in-sample result recorded.

The surface shows the named state **`holdout · sealed until in-sample recorded`** — not a
404, not a disabled tab that still previews a count. A sealed fold whose size is visible has
already leaked something. **AT-QLAB-24.**

#### The session counts your queries against you

Every query is logged, and the surface shows a **running count of hypotheses examined** in
the current session and against the current corpus. A tensor this size yields structure by
chance; the number that decides whether a finding is real is *how many things you looked at*,
and that number should be on screen rather than in memory. Multiplicity correction uses the
**logged** count, never a remembered one. **AT-QLAB-25.**

#### In-sample and out-of-sample never collapse

They are separate fields, separately labelled, always both present. A surface that can
display an in-sample result alone is a surface that will. On a narrow viewport they **stack**;
they never merge into one sparkline, and neither is ever the one that survives a responsive
breakpoint. **AT-QLAB-26.**

**Every experiment is a publishable artifact (§5) whether or not it worked.** A NOT SUPPORTED
verdict carries the same manifest as a SUPPORTED one — that is invariant 7, and it is also
what makes the query log meaningful: a lab that only records its successes has no
denominator.

**The admin surface is not bound by §4.4's member rules** — Coach and Sheldon see means,
Sharpe, per-trade counterfactuals, raw everything. Those rules protect a member from a number
they would misread. They do not protect a researcher, and applying them here would hide
exactly what an experiment is for.

**But the exemption ends at the seam, and the seam is not only a firewall.** AT-QLAB-4 blocks
production from reaching the corpus; it does nothing about a Sharpe screenshot walking from
the notebook into Slack and then onto a member card.

> **Law: export or share from the admin surface is a publish event. It is subject to §4.4, or
> it carries the watermark `RESEARCH — not a member surface` in the exported bytes
> themselves.**

**AT-QLAB-22.**

---

## 5. The regenerability contract

Every published artifact carries the manifest below, or it does not publish. **AT-QLAB-1.**

```
artifact_id            stable, content-addressed
study_id               which study, which registered hypothesis (4.5)
corpus{days[], sha}    exactly which sessions, and their content hashes
day_grades{}           completeness class per day used, WITH grade provenance (6)
build_id               derived-store build id + schema version -- the object read
query                  the ATRV parameter vector: the grid point, verbatim
code_sha               the study code that ran
spec_versions{}        ATRV, SSR-MEXP, AZ-ALGO as applicable
seed, n_paths          Monte Carlo reproducibility (ATRV 3.8)
runtime{rng_impl, reduction_order}   see 5.1 below
assumptions{}          fill model, stickiness, action latency, tax (ATRV 3.6/3.7)
produced_at, host
```

v0.2 named a field list and called it a replay recipe. It was not one: it did not name the
**derived-store build** the study read, the **query vector** that selected the grid point, the
**path count**, or the **RNG implementation** behind the seed. A manifest that cannot be
replayed is documentation, not a contract.

**`n_paths` is part of the study's identity.** Changing it is a **new study**, not a re-run —
a different path count is a different estimator, and quietly raising it until a result firms
up is the multiplicity failure with better arithmetic.

### 5.1 Reproducibility rests on order-free operators, not on a thread pin

The advisor review is right that a threaded reduction is not associative, and right to ask
what supports AT-QLAB-2's *"different core count."* The parent supports it, and more cleanly
than a pin would:

> ATRV §3.9 — the random stream is a pure function of `(seed, strategy_id, path_index)` … the
> result is identical at **any** core count, in any completion order, serial or parallel.
> **AT-ATRV-23.**

So **per-path** results are schedule-independent by construction. The residual is the
**reduction across** paths — and ATRV §3.10 already banned the one operator that would have
made it order-dependent. What replaces the mean is order-free:

| Operator | Order-free? |
|---|---|
| Quantiles / ECDF from a sorted path array | **yes** — sorting is order-independent |
| Histogram bin counts, modality | **yes** — integer |
| Per-path result | **yes** — ATRV §3.9 |
| Mean, variance, any float accumulator across paths | **no** — and §3.10 bans the first two |

AT-QLAB-2 therefore survives *because* §3.10 removed the operator that would have broken it.
That is currently an accident of two specs agreeing, so it is written down:

> **Law: every number in a published artifact is produced by an order-free operator, or the
> manifest pins `runtime.reduction_order` and the study is reproducible only under that pin.
> An unpinned non-order-free reduction does not publish.**

`OMP_NUM_THREADS=1` is **not** adopted. Pinning threads would buy determinism by discarding
the parallelism ATRV §3.9 exists to license, and it would not be checkable from the artifact.

**AT-QLAB-2, AT-QLAB-3.**

### 5.2 Publish transport — what "published" means

v0.2 named the artifact and not the path. Without a transport, AT-QLAB-4 and AT-QLAB-9 are
prose.

| | |
|---|---|
| **Direction** | **Production pulls.** The Lab never pushes into production, and production never dials the corpus — the pull reaches a publish directory on the Lab, not the derived store and not the mirror |
| **Initiator** | Production, on a schedule and on demand from `/admin` |
| **Object** | Content-addressed file: `artifact_id` = hash of the bytes, manifest included (OD-QLAB-4) |
| **Immutability** | An `artifact_id` never changes meaning. A corrected study is a **new** artifact; retention keeps both (OD-QLAB-5) |
| **"Published" means** | Production **has the bytes** and can serve them with the Lab powered off. A manifest without its object is **not** published |

> **Law: a study is not published until production can serve its artifact without opening the
> corpus and without reaching the Lab. Tested by serving it with the Lab powered off.**

**AT-QLAB-5.**

---

## 6. Day grades — concentrated loss, handled at day level

Capture is expected at **~99.5%, concentrated** (Coach): most days whole, occasionally a day
with a multi-hour hole. That is the *better* failure mode — random dropout would subtly
corrupt every day, while a concentrated hole leaves every other day pristine and one day
clearly marked.

So completeness is graded **per day**, not repaired per snapshot:

| Grade | Meaning |
|---|---|
| **A** | no hole exceeding `cadence_threshold` for the day's tier |
| **B** | holes present, none crossing a named decision window |
| **C** | a hole crosses a named decision window |
| **X** | unusable for time-series work; may still serve as an inputs-only fixture |

### 6.1 A grade is a written object, not a script's opinion

v0.2 pointed at `scripts/atrv-bench.py` and called that a derivation. A pointer is not a law,
and AT-QLAB-11 cannot fail a study that consumed a **C** it believed was a **B** unless the
grade is recorded with the inputs that produced it.

```
grade                 A | B | C | X
graded_by             tool + version
graded_at             timestamp
cadence_threshold     the hole length, per tier, that separates A from B
windows[]             the named decision windows evaluated for C
```

Written into `PROVENANCE.json` where studies can see it.

- **Who writes it:** the **collector, at session close**, from its own cadence record. The Lab
  grades nothing — it consumes a grade it did not compute, which is what makes the grade
  evidence rather than a self-assessment.
- **What the build consumes:** **closed, graded sessions only.** An open session is not in the
  day's object and is not visible to a build. **AT-QLAB-13.**
- **`cadence_threshold` and the window table are OD-QLAB-12 · Sheldon + Hotel.** ~15:45 ET is
  an *example* in v0.2, not a table, and a C-grade that rests on an example is not a grade.

**Studies declare the minimum grade they accept, and the grades used appear in the manifest
(§5).** A compromised day is excluded **explicitly**, never silently averaged in.
**AT-QLAB-11.**

### 6.2 A regrade invalidates replay, and fails closed

A day's grade can change: a gap is discovered, a window is added to the table, the threshold
is tightened. An artifact produced when that day was **B**, replayed after it becomes **C**,
must not quietly reproduce.

> **Law: replay compares the manifest's `day_grades{}` against the current grade for each day.
> A day that has been regraded below the study's declared minimum makes the replay **fail**,
> naming the day and both grades. It never silently succeeds and never silently downgrades the
> artifact.**

**AT-QLAB-12.**

---

## 7. Out of scope

- The migration of `labs.fattail.ai` off MiniTwo. Own change, own DL entry, own Delta gate.
- Any member-facing live query into the Lab (§4, OD-QLAB-3).
- What `flyonthewall.io` is for (DL-673 open item 4).
- Study *content* — that is Sheldon's, per his charter. This spec places the work; it does
  not choose it.
- Changing capture. Settled at SSR-MEXP v0.8.
- **Lab Bot catalog identity, versioning and monetization** — DL-247 and Bot Marketplace
  Framework v0.1 own these (§4.0). This spec owns the study and its grid.
- **Member-facing Lab Bot chrome.** Tango's, gated per bot.

---

## 8. Open decisions

| # | Question | Owner | Default if silent |
|---|---|---|---|
| **OD-QLAB-1** | **Dude inventory** — which physical box carries the Lab role. Reduced by Coach's confirmation that both Dudes are identical: this can now change only the label, not the design | **Coach · Foxtrot** | Either. Stamp a name in `infra/deploy.md` |
| **OD-QLAB-2** | Does the analysis host belong **in** the hosts pillar, or outside it as the collector effectively sits? | **India** | Outside, named in `infra/deploy.md` |
| **OD-QLAB-3** | ~~Producer or service?~~ **RESOLVED 2026-09-05 (Coach).** Producer, with a queue (§4.1) | — | **CLOSED** |
| **OD-QLAB-4** | Artifact store: files on production, rows in `labs`, or object storage? | **Foxtrot · Alpha** | **Files**, content-addressed — immutable and trivially diffable |
| **OD-QLAB-5** | Retention: keep every artifact, or the current one per study? | **Coach** | **Every one.** They are kilobytes and they are the audit trail |
| **OD-QLAB-6** | **Grid sizing per bot** — which parameters are offered at all | **Coach · Sheldon** | Start narrow; widen where instrumented misses cluster |
| **OD-QLAB-7** | What "timely" means as a commitment the member is shown | **Coach · Tango** | Next session |
| **OD-QLAB-8** | **Per-bot ceiling on pre-studied grid cells** (§4.2) | **Coach** | **STAMPED-PENDING** — drafted at **64 cells/bot** |
| **OD-QLAB-9** | ~~*(retired — was a duplicate of OD-QLAB-5 in v0.2 numbering)*~~ | — | — |
| **OD-QLAB-10** | Lab corpus mirror: **raw or compressed** (§2.1) | **Foxtrot** | **Compressed** — ~40 GB/yr, fits the stock 500 GB SSD. Confirm the decompress hides under parse before committing |
| **OD-QLAB-11** | **Is a studied Lab Bot the Marketplace catalog object, or a linked record?** (§4.0) | **India** | **STAMPED-PENDING** — drafted as **one object, a study attached** |
| **OD-QLAB-12** | `cadence_threshold` per tier, and the **named decision window table** for grade C (§6.1) | **Sheldon · Hotel** | Blocking for AT-QLAB-11 |
| **OD-QLAB-13** | Cap on member-originated studies per interval (§4.1) | **Coach · Tango** | A cap exists; number to be stamped |

---

## 9. Acceptance

Numbered in document order. v0.2's numbering ran 8–15 before 1–7 and would have been cited
wrong.

| AT | Criterion | § |
|---|---|---|
| **AT-QLAB-1** | No artifact publishes without a complete manifest. A missing field blocks publication rather than producing a partial record. | 5 |
| **AT-QLAB-2** | Re-running an artifact's manifest on the same corpus reproduces it **byte-for-byte**, on a **different part** and a different core count. Two identical Dudes do not satisfy this. | 5.1 |
| **AT-QLAB-3** | Every published number is produced by an order-free operator, or `runtime.reduction_order` is pinned in the manifest. An unpinned non-order-free reduction **fails to publish**. | 5.1 |
| **AT-QLAB-4** | Production never opens the corpus. **Source grep plus network assertion:** no path from the serving host to the collector's archive, and no study code deployed there. | 4 |
| **AT-QLAB-5** | An artifact is not `published` until production serves it **with the Lab powered off**. Tested by powering the Lab off. | 5.2 |
| **AT-QLAB-6** | Losing the Lab's derived store costs a rebuild and nothing else: delete it, rebuild, and every published artifact still reproduces. | 3 |
| **AT-QLAB-7** | The nightly build consumes **no** collector CPU beyond serving the read — the tap's snapshot count for that session is unchanged (SSR-MEXP AT-MEXP-5). Named harness, named session. | 2 |
| **AT-QLAB-8** | A **full-history rebuild** completes without reading the collector. Asserted by network counter on the collector during the rebuild: zero bytes served. | 2.1 |
| **AT-QLAB-9** | A six-hour sweep on the Lab leaves `labs.fattail.ai` p99 latency unchanged. **Harness named:** where p99 is scraped, which session, who asserts. | 2 |
| **AT-QLAB-10** | Notebook query latency is bounded while a sweep runs — a study declares its day window and leaves a reserved slice. A study that does not declare a window **fails to start**. | 2.2 |
| **AT-QLAB-11** | Every study result names the day grades it used and the minimum it required. A study consuming a grade below its own minimum **fails**. | 6 |
| **AT-QLAB-12** | Replay of an artifact whose day has since been **regraded below** the study's declared minimum **fails**, naming the day and both grades. It never silently succeeds. | 6.2 |
| **AT-QLAB-13** | A build consumes **closed, graded** sessions only. An open or ungraded session is invisible to a build. | 6.1 |
| **AT-QLAB-14** | Forking a Lab Bot into Design clears its study artifacts and names the state `unstudied · your design`. A forked structure rendering a parent's number **fails**. | 4.0 |
| **AT-QLAB-15** | Strategy Lab configuration options are **generated from the study grid**, not authored separately. Adding a grid point makes it selectable with no UI change; removing one makes it unselectable. A hardcoded option list **fails**. | 4.2 |
| **AT-QLAB-16** | No member-facing configuration control has a resting state off the grid. A continuous slider **fails**, tick marks or not. | 4.2 |
| **AT-QLAB-17** | No interpolation between grid points. An off-grid request is **queued**, never answered from neighbours. | 4.2 |
| **AT-QLAB-18** | Catalog hit rate is instrumented **per bot and per parameter**, and an off-grid selection produces a named state the member sees — never a spinner, never a silent substitution of the nearest bot. | 4.3 |
| **AT-QLAB-19** | A queued study has a home the member can reach, named states including `slipped`, a working cancel, and no live ETA. Changing the configuration creates a new ticket; the last on-grid answer stays available. | 4.1 |
| **AT-QLAB-20** | Identical off-grid requests **coalesce** to one study, and member-originated studies are capped ahead of the researcher's reserved slice. | 4.1 |
| **AT-QLAB-21** | A Lab Bot member surface shows distribution shape and assumptions only. It contains no headline mean, Sharpe, win rate, profit claim, per-trade counterfactual, rendered probability, **marked mean or waist on a density, percentile labelled "typical", or path-count-as-rate**. Self-contained — no dependence on AZ-ALGO AT-ALGO-36. **Tango and Hotel sign off before ship.** | 4.4 |
| **AT-QLAB-22** | Export or share from the admin surface is a publish event subject to §4.4, or the exported bytes carry the `RESEARCH — not a member surface` watermark. | 4.5 |
| **AT-QLAB-23** | The **study runner** refuses a corpus query not attached to a complete registration object. Asserted against the runner, not only the notebook: a direct `python` call with the same credentials **fails** identically. | 4.5 |
| **AT-QLAB-24** | The held-out fold cannot be served until the study is registered and its in-sample result recorded, and the surface shows `holdout · sealed until in-sample recorded` — not a 404, and not a disabled control that previews a count. | 4.5 |
| **AT-QLAB-25** | Every query is logged, the running hypothesis count is displayed, and multiplicity correction consumes the **logged** count. A study reporting a count lower than the log **fails**. | 4.5 |
| **AT-QLAB-26** | In-sample and out-of-sample are separate, labelled, always both present, and **stack** on a narrow viewport. No view renders one alone. | 4.5 |

---

## 10. Changelog

| Ver | Date | Notes |
|---|---|---|
| **v0.3** | 2026-09-05 | Advisor review pass. **Adds backfill as a sixth workload (§2.1)** — a new derived model re-reads all history, ~400 GB/yr at era-2 rates, and served from the collector it is exactly the function that halves the tap's headroom; the Lab holds its own corpus mirror and ATRV §2.1's "rebuildable cache" stops secretly depending on the collector. **Splits Query** into member Serve and admin Notebook (§2.2) — v0.2 put the notebook beside six-hour sweeps with no protection, buying "the member never waits" by making the researcher wait. **§4.0 corrects a parallel-store-of-truth defect:** v0.2 introduced "Lab Bot" as a new object when **DL-247** and Bot Marketplace Framework v0.1 already define it — catalog identity and versioning return to the Marketplace, this spec owns only the study and its grid, and **forking into Design clears study artifacts** so a member never sees a manifest-backed number for a structure that was never studied. **§5.1 settles reproducibility on order-free operators** rather than a thread pin: ATRV §3.9 makes per-path results schedule-independent and §3.10's ban on the mean removes the one order-dependent reduction, so AT-QLAB-2 survives *because* the two specs agree — now written as law instead of left as an accident, and `OMP_NUM_THREADS=1` explicitly rejected. **§5.2 names the publish transport** — production pulls, "published" means production serves with the Lab powered off. **§6.1 turns day grades into a written object** with `cadence_threshold`, a named window table, and the **collector** as grader so a grade is evidence rather than self-assessment; **§6.2 makes a regrade fail replay closed**. Manifest gains `build_id`, `query`, `n_paths`, `rng_impl`, grade provenance; changing `n_paths` is a new study. Queue gains a holder, named states, cancel, coalescing and a cap (§4.1); grid controls **cannot rest off-grid** and take a per-bot cell ceiling (§4.2); AT-QLAB-21 is self-contained and bans path-count-as-rate (§4.4); §4.5's controls bind the **runner**, not the notebook, registration becomes an object, and **admin export is a publish event** (§4.5). Hostnames removed pending OD-QLAB-1 — reduced to a label by Coach's confirmation that both Dudes are identical; MiniTwo cut from the allocation; **every bench figure marked modelled**, since track A has not run against the corpus and no output is committed. ATs renumbered 1–26 in document order. OD-QLAB-8 (grid ceiling, Coach) and OD-QLAB-11 (Lab Bot object, India) are **STAMPED-PENDING** with drafted defaults. |
| **v0.2** | 2026-09-05 | Resolves OD-QLAB-3 with Coach's product model (§4.1–4.4): producer **with a queue**. The Lab pre-studies boilerplate Lab Bots; Strategy Lab shows the catalog; an on-grid configuration is served instantly and an off-grid one is queued, never computed live. Load-bearing rule: **the configuration UI *is* the study grid**. Interpolation between grid points forbidden — the midpoint of two distributions is not the distribution of the midpoint. A miss is a **named state** and a product signal. §4.4 carries every member-surface rule onto Lab Bots, with Tango and Hotel gating each bot. Adds **§4.5, the admin surface as a lab notebook rather than a dashboard** — the two surfaces have opposite constraints, one protecting the member from bad conclusions and the other protecting **the researcher from themselves**. Four of Sheldon's invariants become interface behaviour: hypothesis before query, holdout physically unserved, a running hypothesis count multiplicity must consume, and in-sample/out-of-sample never collapsed. |
| **v0.1** | 2026-09-05 | First draft. Places the Quant Lab against DL-673's freed hardware. **Five workloads, one tension** — a months-long Monte Carlo sweep will peg a machine, so studies and serving cannot share hardware; that dictates the layout, not hostnames. **The publish seam** — the Lab produces, production serves, nothing member-facing calls the Lab live. **Regenerability is the definition of first class:** every published number carries a manifest and reproduces byte-for-byte, or it does not publish. **Day grades** handle concentrated capture loss at the right level. |
