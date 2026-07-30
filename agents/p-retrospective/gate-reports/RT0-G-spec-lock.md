# Gate RT0-G — Spec lock (W0)

**Project:** p-retrospective  
**Primary:** Delta  
**Date:** 2026-07-29  
**Prerequisite:** RT0-1…RT0-5 APPROVED  

---

## Verdict: **PASS**

Specs are locked for build. Next: **Coach GO** → **RT0-0** board freeze → R1b.

Delta did not modify Spec content under review; board/seed status only.

---

## Checklist (evidence)

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Retrospective Spec v0.5 present | **PASS** | `Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.5.md` (40100 bytes, 2026-07-29). Header: W0 draft with RT0-1…5 APPROVED, pending this gate + Coach GO. |
| 2 | Journey cadence § present | **PASS** | `Specs/FatTail-Labs-Journey-Experience-Spec-v1.0.md` **§4.1a** (formula H/d, E1–E3, `completed_at` only) + **§4.4** `retro_horizon_days` column (42/30/90/30). Meter row un-`soon`. |
| 3 | Hotel: MIN_INFERENCE_N recorded | **PASS** | Spec definitions + §0.2 + §6.6 + §21: **`MIN_INFERENCE_N = 20` locked** (Hotel RT0-2). Banner: *does not measure process quality.* Seed `RT0-2-hotel-sample-size.md` APPROVED; India co-signed. DL-082. |
| 4 | Tango: copy APPROVED | **PASS** | Spec §6.0 carry-forward, §6.6 book chrome, §7.5 N1–N3 + meter labels, **§19** glossary. Seed `RT0-3-tango-copy.md` APPROVED; Hotel co-signed banner. DL-083. |
| 5 | Mike: entitlement + isolation APPROVED | **PASS** | Spec **§10.1**: `can_create_or_gather` = admin OR activator+ OR active `observer-trial`; free no-plan 403; isolation A1–A8; Family B classes; Option C no coverage. Seed `RT0-4-…` APPROVED; India co-signed. DL-084. |
| 6 | Sierra: marketing boundary APPROVED | **PASS** | Spec **§20** + §1.3 non-goal: no public member-results / SEO / testimonial from retro book. Seed `RT0-5-…` APPROVED; Tango co-signed. DL-085. |
| 7 | As-built R1–R3 honesty present | **PASS** | Spec status table lines 11–18: R1–R3 shipped (v0.2 shape); R2b–R7 not shipped; “delta on R1–R3, not rewrite.” §10.1 as-built: plan-aware create **not** shipped. |
| 8 | Activator legacy + Observer trial access recorded | **PASS** | Header + §0.3 E.2 + §10.1 + §12 dual goals: trial may create; free no-plan no; Activator legacy not marketed; path trial → Navigator. |

### Supporting consistency (not separate checklist items)

| Check | Result |
|-------|--------|
| v0.4 SUPERSEDED pointer | PASS — header → v0.5 |
| Cadence delta FOLDED pointer | PASS — FOLDED → v0.5 + Journey §4.1a |
| Decision log RT0 chain | PASS — DL-081…085 present |
| Board seed RT0-1…5 | PASS — all **done** on ORCHESTRATOR |
| No waived advisor seeds | PASS — no Coach-waived residuals on RT0-2…5 |

---

## File path list (SoR for build after Coach GO)

| Path | Role |
|------|------|
| `Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.5.md` | Build-authority product Spec |
| `Specs/FatTail-Labs-Journey-Experience-Spec-v1.0.md` | §4.1a cadence meter + profiles |
| `Specs/Retrospective-Cadence-Meter-Delta-for-v0.5.md` | Historical packet (FOLDED) |
| `Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.4.md` | SUPERSEDED |
| `agents/p-retrospective/ORCHESTRATOR.md` | Board |
| `agents/p-retrospective/IMPLEMENTATION-PLAN.md` | Slices R1b–R8 |
| `agents/p-retrospective/seeds/RT0-1-…` through `RT0-5-…` | Advisor evidence |
| `Architecture/00-decision-log.md` | DL-081…085 |

---

## Residuals (do not block PASS)

1. **Coach GO** still required before R1b (board freeze RT0-0 next).  
2. **Implementation debt** (honest, expected): plan-aware create, process-first UI, cadence meter, habits, agent — R1b–R7.  
3. Coach structural ack on RT0-1 was deferred to post-gate GO — now unblocked for Coach decision.

---

## Next action

| Who | Action |
|-----|--------|
| **Coach** | GO / NO-GO on v0.5 + Journey §4.1a for build |
| **Juliet** | On GO → **RT0-0** board freeze |
| **Alpha / Mike** | After freeze → **RT1-1** plan-aware entitlement + schema |

**Do not start R1b until Coach GO** unless Coach documents an explicit override residual.
