# FatTail Labs — Quant Lab Topology Spec v0.1

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

**Consequence to decide now, not discover later (OD-QLAB-3):** this makes the Quant Lab a
**producer, not a service**. If a member should ever press *"analyse my trade"* and get a
fresh answer, that is a different architecture — a queue, a worker, a latency budget, and an
abuse surface. It is cheap to add deliberately and expensive to retrofit.

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
| **OD-QLAB-3** | **Producer or service?** Does a member ever trigger a live study? | **Coach** | **Producer.** Published artifacts only |
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
| **AT-QLAB-7** | Losing the Lab's derived store costs a rebuild and nothing else: delete it, rebuild, and every published artifact still reproduces (§3, ATRV §2.1). |

---

## 10. Changelog

| Ver | Date | Notes |
|---|---|---|
| **v0.1** | 2026-09-05 | First draft. Places the Quant Lab against DL-673's freed hardware. **Five workloads, one tension** — a months-long Monte Carlo sweep will peg a machine, so studies and serving cannot share hardware; that dictates the layout, not hostnames. **StudioOne captures, DudeOne is the Lab, production serves published results.** The M4 is the Lab because the benchmark reports **parse-dominated** cost and parse is per-core bound, where the M1 Max's bandwidth advantage does not apply. **The publish seam** — the Lab produces, production serves, nothing member-facing calls the Lab live — makes production latency independent of lab load and leaves the corpus reachable by two machines. **Regenerability is the definition of first class:** every published number carries a manifest and reproduces byte-for-byte, or it does not publish. **Day grades** handle concentrated capture loss at the right level — studies declare a minimum and exclude explicitly rather than averaging silently. OD-QLAB-1 (Dude inventory) is blocking; OD-QLAB-3 (producer vs service) is cheap now and expensive to retrofit. |
