# Charter — p-retrospective

**Mission:** Ship the Journal Retrospective product end-to-end — from Spec lock through
process-first dual report, habit plans, agent assist, and Journey cadence meter —
aligned with dual goals **G1 (Observer trial → Navigator)** and **G2 (Navigator CI)**.

**Board:** [`ORCHESTRATOR.md`](./ORCHESTRATOR.md)  
**Plan:** [`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md)  
**Seeds:** [`seeds/`](./seeds/)  
**Gates:** [`gate-reports/`](./gate-reports/)

**Parent Specs (load before any seed) — Coach GO 2026-07-29:**
- [`Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.6.md`](../../Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.6.md) — **as-built product truth** (RT8-1)  
- [`Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.51.md`](../../Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.51.md) — **Coach amendment** (weekly trial H=7; signal not enforcement)  
- [`Specs/Advisor-Gates-Retrospective-v0.51.md`](../../Specs/Advisor-Gates-Retrospective-v0.51.md) — advisor questions + **CLEARED** matrix (DL-119)  
- [`Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.5.md`](../../Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.5.md) — **build authority** for the program (historical)  
- [`Specs/FatTail-Labs-Journey-Experience-Spec-v1.0.md`](../../Specs/FatTail-Labs-Journey-Experience-Spec-v1.0.md) — §4.1a cadence meter, grades, tenure  
- [`Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md`](../../Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md) — book performance source  
- [`docs/Dual-Goal-Product-Strategy-2026-07-29.md`](../../docs/Dual-Goal-Product-Strategy-2026-07-29.md) — G1/G2  
- Historical: v0.4 SUPERSEDED · cadence delta FOLDED (do not build from these)  

**Doctrine:** `agents/bench/doctrine.md` · `first-principles-doctrine.md` · capacity over dependency · process outcomes only · Family B isolation  

---

## Product north stars

| Goal | Population | Retrospective role |
|------|------------|-------------------|
| **G1** | **Observer** (not free) | **Same Practice features as Navigator**; membership **term = 6 weeks only** (DL-128); then convert or lose create |
| **G2** | **Navigator** | Same Practice features; ongoing membership term |
| **Activator** | **Legacy** self-directed (not advertised) | Keep technical access; do not design funnel around this tier |
| Free no-plan (not Observer) | — | **No** create; never grade on retros |

---

## As-built baseline (program close — Spec v0.6)

On `main` after R1b–R7 (Delta gates PASS):

- Schema: mig **046** + **047** · domain + agent modules · habit-plans routes  
- Entitlement: admin **OR** activator+ **OR** active `observer-trial`  
- Workspace: process-first §6 · comparison · habits · agent (local) · cadence meter + N1 nudge  
- Product truth: **Spec v0.6**; decisions remain those locked in v0.5  

**Do not re-found.** Residuals (cost-of-deviation, external agent, etc.) listed in Spec v0.6 §6.

---

## Goals (non-negotiable)

1. **Spec truth** — v0.5 fold + Journey meter § after Coach GO; **v0.6 as-built** honesty.  
2. **Process-first workspace** — carry-forward → process → integrity → deviations → what worked → expected vs actual → book collapsed.  
3. **Honest comparison** — rates, denominators, `comparable` flag.  
4. **Safe agent** — anchoring, sample gate, symmetry; optional path.  
5. **Habit loop** — max 2 active plans; carry-forward opens workspace.  
6. **Cadence meter** — completion-only clock; nudge invitational; no shame copy.  
7. **Isolation** — single `identity_id`; Mike on every auth/scope change.  
8. **Multi-agent completion** — no solo ship; Delta gates with evidence.

---

## Collaboration law

Same as p-practice-harden:

> No seed is done until required **reviewers APPROVED** and phase **Delta** has evidence.

| Rule | Practice |
|------|----------|
| No solo ship | Implementer + guardian(s) |
| Juliet sequences | Parallel only on non-overlapping files |
| Coach owns trade-offs | Entitlement, MIN_INFERENCE_N final, agent scope on trial |
| Lima same day | API / isolation / Spec status changes |

---

## Out of scope (this program)

- Cost-of-deviation counterfactual (deferred Hotel+Tango)  
- Marketing Activator as a funnel tier  
- Free observer (no trial) retrospective create  
- Playbook content product  
- Rewriting Trade Log Reports as primary equity UI  
- Judging reflection *quality* of a retrospective body  

---

## Definition of Done (program)

- [x] Spec v0.5 + Journey Experience meter § land after Coach GO (W0) — **GO 2026-07-29**  
- [x] Observer trial can create/gather retros; free no-plan cannot  
- [x] Workspace matches §6 render order; book collapsed + sample banner  
- [x] Comparison normalized; mismatched windows suppress deltas  
- [x] Habit plans max 2; carry-forward first when applicable  
- [x] Agent path optional with anchoring validation (local mode; RT5-0 GO)  
- [x] Cadence meter live; nudge + meter share `retro_horizon_days`  
- [x] All phase Delta gates PASS with evidence (RT0-G…RT7-G)  
- [x] Lima decision-log complete for program close (RT8-1 · Spec v0.6 · DL-116)  
- [x] Delta **RT8-G** program gate PASS — `gate-reports/RT8-G-program-close.md` · DL-117
