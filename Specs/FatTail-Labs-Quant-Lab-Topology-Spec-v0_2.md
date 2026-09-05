# FatTail Labs — Quant Lab Topology Spec v0.2

**Status:** **DRAFT — not BUILD AUTHORITY.** Needs Coach, India (host pillar), Foxtrot
(infrastructure), Sheldon (study contract). Decision-log entry required.
**Date:** 2026-09-05 · **Short name:** **QLAB** · **Owner:** Juliet (draft) → Foxtrot / Alpha
**Parents:** [DL-673](../Architecture/00-decision-log.md) ·
[ATRV v0.7](./FatTail-Labs-Archive-Traversal-API-Spec-v0_7.md) ·
[SSR-MEXP v0.8](./FatTail-Labs-Collector-Multi-Expiration-Capture-Spec-v0_8.md) ·
[StudioOne Archive Read API v0.8](./FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8.md) ·
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

## 2. Five workloads, and the tension that settles the layout

| Workload | Character | Must not be starved by |
|---|---|---|
| **Capture** | continuous, latency-critical | **anything, ever** |
| **Build** | nightly batch, parse-bound, bursty | capture |
| **Query** | interactive, sub-second | studies |
| **Studies** | hour-long sweeps, preemptible | — |
| **Serve** `labs.fattail.ai` | member-facing | **all of the above** |

**The tension:** a Monte Carlo sweep across months (ATRV §3.8) will peg a machine for hours.
If that machine also serves members, members feel it. **Studies and serving cannot share
hardware** — and that, not hostnames, dictates everything below.

The Archive Read API already stated the collector half of this rule:

> Collection outranks reads … the concurrency ceiling is **per machine, not per feature** —
> the next function added must not silently halve the tap's headroom.

---

## 3. Allocation

```
StudioOne · M1 Max 32 GB · 2 TB
    CAPTURE + CORPUS + Archive Read API          ← source of truth, untouchable
        │
        │  nightly build pulls ~1.6 GB, once     (~13 s on 1 GbE)
        ▼
DudeOne · M4 24 GB
    THE QUANT LAB                                ← builds · studies · Sheldon
    derived store LOCAL, mmap'd, ~27 GB/yr
        │
        │  publishes RESULT ARTIFACTS — kilobytes
        ▼
Production (MiniTwo today → a Dude)
    SERVES labs.fattail.ai                       ← reads published results only
                                                   never touches the corpus
                                                   never runs a study
```

**Why the M4 is the lab and not the M1 Max.** The traversal benchmark
(`scripts/atrv-bench.py`) reports **parse-dominated** cost, and parse is bound by per-core
throughput rather than memory bandwidth. The M4's faster cores win; the M1 Max's ~400 GB/s
advantage does not apply to this workload. Nightly build ≈3.4 s on DudeOne — and, more to
the point, **zero on StudioOne**.

**Why the derived store is local to the lab.** It is ~108 MB/day, ~27 GB/year. Keeping it on
DudeOne means only the nightly build crosses the LAN and **every query is local**. It also
makes ATRV §2.1's *"a cache, never authoritative"* physically true: it lives on a different
machine from the corpus, and losing DudeOne costs a rebuild, not data.

**MiniTwo, once production migrates.** A second lab node for parallel sweeps, or a warm
standby for the corpus. **Not a third environment** — DL-673 retired staging.

---

## 4. The publish seam

**A study's output is tiny.** Distributions, shape metrics (ATRV §3.10), conditional tables
— kilobytes, not gigabytes. So:

> **The Lab produces. Production serves. Nothing member-facing calls the Lab live.**

| | |
|---|---|
| Lab → production | **result artifacts**, published, immutable, versioned |
| Production → corpus | **never** |
| Member request | a read of an already-computed artifact |

This one seam buys: production latency independent of lab load, studies free to run for
hours, and a corpus only two machines can reach at all.

### 4.1 The product model — a catalog of studied bots, with a queue behind it

**OD-QLAB-3 is resolved: producer, with a queue.** Not a service, and not a static site
either.

```
Quant Lab pre-studies boilerplate LAB BOTS
        │  each bot = a strategy + a configuration GRID, fully studied
        ▼
Strategy Lab shows the catalog          member selects a bot, configures it
        │
        ├── configuration is ON the grid  →  published artifact, served instantly
        └── configuration is OFF the grid →  QUEUED as a new study, delivered in
                                             a timely manner, member is told so
```

**The member never waits on a computation. They either get an answer now, or they get a
commitment.**

### 4.2 The configuration UI *is* the study grid — this is the load-bearing rule

If Strategy Lab offers a width of 17 and the Lab studied `{10, 15, 20, 25}`, that is a miss.
Offer three continuous sliders and nearly every selection misses, the queue becomes the
normal path, and "not real-time" quietly becomes "always slow."

> **Law: the configuration options a member can select are generated from the study grid
> that has been run. They are not authored separately.**

Then the hit rate is a **number you chose** when you sized the grid, not an emergent
property of two teams guessing at each other. **AT-QLAB-8.**

**Interpolation between grid points is forbidden.** These are distributions, not scalars
(ATRV §3.10) — the midpoint of two distributions is not the distribution of the midpoint,
and a butterfly's shape can change character between widths. A configuration is studied or
it is queued. **AT-QLAB-9.**

### 4.3 A miss is a named state, and it is useful information

A member who lands off-grid is told plainly: *this configuration has not been studied yet;
it is queued.* Never a spinner, never a silent fallback to the nearest studied bot, and
never a number produced by interpolation.

That message is also **product signal**: it tells the member their configuration is unusual,
and it tells you the grid is in the wrong place. **Hit rate is instrumented per bot and per
parameter from day one** — a bot whose members mostly miss is a bot whose grid is wrong, and
that should be visible without anyone filing a complaint. **AT-QLAB-10.**

### 4.4 What a Lab Bot may show a member

A Lab Bot presents study results to a member, so every member-surface rule already in force
applies, and they are stricter than the Lab's internal output:

| Rule | Source |
|---|---|
| **Distribution shape, never a headline P&L.** No mean, no Sharpe, no win rate as the answer | ATRV §3.10, AT-ATRV-24 |
| **No profit claims. Process outcomes only** | Invariant 8 |
| **Counterfactuals aggregated, never per-trade** | Exit Trail v0.2 §5 |
| **`p` and probabilities never rendered as a percentage of anything** | AZ-ALGO AT-ALGO-36 |
| Assumptions visible: fill tax, latency, stickiness, day grades | §5, ATRV §3.6/3.7 |

**Tango and Hotel gate every Lab Bot surface before it ships.** The pull on a member-facing
bot is to show a single encouraging number, and that is precisely what this stack has spent
nine spec revisions refusing to do. **AT-QLAB-11.**

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

Four properties, each a direct implementation of an invariant Sheldon already carries:

**1. Hypothesis before query — enforced, not requested (invariant 1).**
A study is registered with its hypothesis and its falsifier **before** it can execute. The
interface will not run an unregistered query against the corpus. Post-hoc narration is the
failure the seat exists to prevent, and asking politely does not prevent it. **AT-QLAB-12.**

**2. The holdout is physically unavailable (workflow step 2).**
"Hold out a fold you will not look at" is a rule a tired researcher breaks at 11pm without
noticing. The interface **cannot serve** the held-out fold until the study is registered and
the in-sample result recorded. Enforced by the tool, not by intention. **AT-QLAB-13.**

**3. The session counts your queries against you (invariant 4).**
Every query is logged, and the surface shows a **running count of hypotheses examined** in
the current session and against the current corpus. A tensor this size yields structure by
chance; the number that decides whether a finding is real is *how many things you looked
at*, and that number should be on screen rather than in memory.

Multiplicity correction uses the **logged** count, never a remembered one. **AT-QLAB-14.**

**4. In-sample and out-of-sample are never shown together as one number (invariant 2).**
They are separate fields, separately labelled, always both present. A surface that can
display an in-sample result alone is a surface that will. **AT-QLAB-15.**

**Every experiment is a publishable artifact (§5) whether or not it worked.** A NOT SUPPORTED
verdict carries the same manifest as a SUPPORTED one — that is invariant 7, and it is also
what makes the query log meaningful: a lab that only records its successes has no
denominator.

**The admin surface is not bound by §4.4's member rules** — Coach and Sheldon see means,
Sharpe, per-trade counterfactuals, raw everything. Those rules protect a member from a
number they would misread. They do not protect a researcher, and applying them here would
hide exactly what an experiment is for. **The boundary is the publish seam (§4):** anything
crossing to a member surface is subject to §4.4, and nothing crosses without Tango and Hotel.

---

## 5. The regenerability contract

Every published artifact carries the manifest below, or it does not publish. **AT-QLAB-1.**

```
artifact_id            stable, content-addressed
study_id               which study, which registered hypothesis (Sheldon)
corpus{days[], sha}    exactly which sessions, and their content hashes
code_sha               the study code that ran
spec_versions{}        ATRV, SSR-MEXP, AZ-ALGO as applicable
seed, paths            Monte Carlo reproducibility (ATRV §3.8)
assumptions{}          fill model, stickiness, action latency, tax (ATRV §3.6/3.7)
day_grades{}           completeness class per day used (§6)
produced_at, host
```

**A number on `labs.fattail.ai` with no manifest behind it is a defect**, not a display
choice. Re-running the manifest on the same corpus reproduces the artifact byte-for-byte
(ATRV AT-ATRV-20, AT-ATRV-23) — which is what makes Delta able to gate a study at all.

---

## 6. Day grades — concentrated loss, handled at day level

Capture is expected at **~99.5%, concentrated** (Coach): most days whole, occasionally a day
with a multi-hour hole. That is the *better* failure mode — random dropout would subtly
corrupt every day, while a concentrated hole leaves every other day pristine and one day
clearly marked.

So completeness is graded **per day**, not repaired per snapshot:

| Grade | Meaning |
|---|---|
| **A** | no hole beyond the cadence threshold |
| **B** | holes present, none crossing a named decision window |
| **C** | a hole crosses a named window (e.g. ~15:45 ET, Strategy Lab Method v0.2.2 §1a) |
| **X** | unusable for time-series work; may still serve as an inputs-only fixture |

`scripts/atrv-bench.py` already measures coverage and hole windows per day, so the grade is
derived from what exists — it needs writing into `PROVENANCE.json` where studies can see it.

**Studies declare the minimum grade they accept, and the grades used appear in the manifest
(§5).** A compromised day is excluded **explicitly**, never silently averaged in.
**AT-QLAB-4.**

---

## 7. Out of scope

- The migration of `labs.fattail.ai` off MiniTwo. Own change, own DL entry, own Delta gate.
- Any member-facing live query into the Lab (§4, OD-QLAB-3).
- What `flyonthewall.io` is for (DL-673 open item 4).
- Study *content* — that is Sheldon's, per his charter. This spec places the work; it does
  not choose it.
- Changing capture. Settled at SSR-MEXP v0.8.

---

## 8. Open decisions

| # | Question | Owner | Default if silent |
|---|---|---|---|
| **OD-QLAB-1** | **Dude inventory** — how many, and specs. This spec assumes DudeOne is the M4/24 GB; if that is DudeTwo, the roles swap | **Coach · Foxtrot** | **Blocking.** DL-673 open item 1 |
| **OD-QLAB-2** | Does the analysis host belong **in** the hosts pillar, or outside it as StudioOne effectively sits? | **India** | Outside, named in `infra/deploy.md` |
| **OD-QLAB-3** | ~~Producer or service?~~ **RESOLVED 2026-09-05 (Coach).** Producer, with a queue: pre-studied Lab Bots selected and configured in Strategy Lab; off-grid configurations are queued and delivered, never computed live (§4.1) | — | **CLOSED** |
| **OD-QLAB-6** | **Grid sizing per bot** — how many configuration points, and which parameters are offered at all. Directly sets the hit rate (§4.2) | **Coach · Sheldon** | Start narrow; widen where instrumented misses cluster |
| **OD-QLAB-7** | What "timely" means as a commitment the member is shown — hours, next session, next day? | **Coach · Tango** | Next session |
| **OD-QLAB-4** | Artifact store: files on production, rows in `labs`, or object storage? | **Foxtrot · Alpha** | **Files**, content-addressed — immutable and trivially diffable |
| **OD-QLAB-5** | Retention: keep every artifact, or the current one per study? | **Coach** | **Every one.** They are kilobytes and they are the audit trail |

---

## 9. Acceptance

| AT | Criterion |
|---|---|
| **AT-QLAB-1** | No artifact publishes without a complete manifest (§5). A missing field blocks publication rather than producing a partial record. |
| **AT-QLAB-2** | **Re-running an artifact's manifest on the same corpus reproduces it byte-for-byte**, on a different host and a different core count. |
| **AT-QLAB-3** | Production never opens the corpus. **Source grep plus network assertion:** no path from the serving host to StudioOne's archive, and no study code deployed there. |
| **AT-QLAB-4** | Every study result names the day grades it used and the minimum it required. A study consuming a grade below its own minimum **fails** (§6). |
| **AT-QLAB-5** | A six-hour sweep on the Lab leaves `labs.fattail.ai` p99 latency unchanged, measured. |
| **AT-QLAB-6** | The nightly build runs on the Lab and consumes **no** StudioOne CPU beyond serving the read (AT asserts the tap's snapshot count for that session is unchanged — SSR-MEXP AT-MEXP-5). |
| **AT-QLAB-12** | The admin surface **refuses to run** a corpus query that is not attached to a registered hypothesis with a stated falsifier. Registration precedes execution; there is no bypass (§4.5). |
| **AT-QLAB-13** | The held-out fold **cannot be served** until the study is registered and its in-sample result recorded. Enforced by the interface, not by convention (§4.5). |
| **AT-QLAB-14** | Every query is logged, the running hypothesis count for the session is displayed, and multiplicity correction consumes the **logged** count. A study reporting a count lower than the log **fails** (§4.5). |
| **AT-QLAB-15** | In-sample and out-of-sample results are separate, labelled fields, both always present. No view renders an in-sample result alone (§4.5). |
| **AT-QLAB-8** | The Strategy Lab configuration options are **generated from the study grid**, not authored separately. Adding a grid point makes it selectable with no UI change; removing one makes it unselectable. A hardcoded option list **fails** (§4.2). |
| **AT-QLAB-9** | No interpolation between grid points. An off-grid request is **queued**, never answered from neighbours (§4.2). |
| **AT-QLAB-10** | Catalog hit rate is instrumented **per bot and per parameter**, and an off-grid selection produces a named state the member sees — never a spinner, never a silent substitution of the nearest bot (§4.3). |
| **AT-QLAB-11** | A Lab Bot member surface shows distribution shape and assumptions; it contains no headline mean, Sharpe, win rate, profit claim, per-trade counterfactual, or rendered probability. **Tango and Hotel sign off before ship** (§4.4). |
| **AT-QLAB-7** | Losing the Lab's derived store costs a rebuild and nothing else: delete it, rebuild, and every published artifact still reproduces (§3, ATRV §2.1). |

---

## 10. Changelog

| Ver | Date | Notes |
|---|---|---|
| **v0.2** | 2026-09-05 | **Resolves OD-QLAB-3 with Coach's product model** (§4.1–4.4): producer **with a queue**. The Lab pre-studies boilerplate **Lab Bots**; Strategy Lab shows the catalog; an on-grid configuration is served instantly from a published artifact and an off-grid one is **queued and delivered**, never computed live. The member never waits on a computation — they get an answer or a commitment. **Load-bearing rule: the configuration UI *is* the study grid**, generated from it rather than authored separately, so hit rate is a number you chose rather than two teams guessing at each other. **Interpolation between grid points is forbidden** — these are distributions, and the midpoint of two distributions is not the distribution of the midpoint. A miss is a **named state** and a product signal; hit rate is instrumented per bot and per parameter from day one. §4.4 carries every member-surface rule onto Lab Bots — shape not P&L, no profit claims, aggregated counterfactuals, no rendered probabilities — with **Tango and Hotel gating each bot**, because the pull on a member-facing bot is to show one encouraging number. **AT-QLAB-8…11**; OD-QLAB-6 (grid sizing) and OD-QLAB-7 (what "timely" promises) opened. Also adds **§4.5, the admin surface as a lab notebook rather than a dashboard** — the two surfaces have **opposite** constraints, the member one protecting the member from bad conclusions and the admin one protecting **the researcher from themselves**. Wider access is not looser discipline: a dashboard invites browsing until something looks good, which is the multiplicity failure with a nice UI on it. Four of Sheldon's invariants become interface behaviour rather than requests — **hypothesis registered before a query can run**, the **holdout physically unserved** until in-sample is recorded, a **running count of hypotheses examined** that multiplicity correction must consume, and in-sample/out-of-sample never collapsible to one number. Every experiment publishes whether or not it worked; a lab that records only successes has no denominator. The admin surface is **exempt** from §4.4's member rules — those protect a reader who would misread a number, not a researcher — and the publish seam is the boundary. **AT-QLAB-12…15**. |
| **v0.1** | 2026-09-05 | First draft. Places the Quant Lab against DL-673's freed hardware. **Five workloads, one tension** — a months-long Monte Carlo sweep will peg a machine, so studies and serving cannot share hardware; that dictates the layout, not hostnames. **StudioOne captures, DudeOne is the Lab, production serves published results.** The M4 is the Lab because the benchmark reports **parse-dominated** cost and parse is per-core bound, where the M1 Max's bandwidth advantage does not apply. **The publish seam** — the Lab produces, production serves, nothing member-facing calls the Lab live — makes production latency independent of lab load and leaves the corpus reachable by two machines. **Regenerability is the definition of first class:** every published number carries a manifest and reproduces byte-for-byte, or it does not publish. **Day grades** handle concentrated capture loss at the right level — studies declare a minimum and exclude explicitly rather than averaging silently. OD-QLAB-1 (Dude inventory) is blocking; OD-QLAB-3 (producer vs service) is cheap now and expensive to retrofit. |
