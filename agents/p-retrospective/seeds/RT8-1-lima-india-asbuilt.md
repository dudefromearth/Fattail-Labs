# Seed RT8-1 — Lima + India: As-built Spec + decision log

**Project:** p-retrospective  
**Primary:** Lima · India  
**Reviewers:** Coach  
**Phase:** R8  
**Prerequisite:** RT7-G PASS (and R5 resolved)  

## Goal

1. Spec v0.5 (or as-built amendment) matches code  
2. Journey Experience meter § matches code  
3. `Architecture/00-decision-log.md` program close entry  
4. Residuals listed (e.g. agent DEFER, cost-of-deviation)  

## Completion criteria

- [x] Spec as-built honesty (v0.6) — no false “shipped” claims  
- [x] Journey §4.1a points at R7 shipped  
- [x] Architecture parity (02/03/04/12 + README)  
- [x] Decision-log program close (DL-116)  
- [x] Residuals enumerated in Spec v0.6 §6  
- [x] India APPROVED (as-built amendment; locked decisions preserved)  
- [ ] Coach APPROVED (reviewer — board / RT8-G may capture)

## Feeds

→ RT8-G  

---

## Evidence (2026-07-29 — Lima · India RT8-1)

### Shipped docs

| Artifact | Change |
|----------|--------|
| `Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.6.md` | **NEW** — as-built product truth; surface map; residuals; gate inventory |
| `Specs/…-v0.51.md` | Header: **NON-BINDING** (H=7 draft ≠ shipped H=42) |
| `Specs/…-v0.5.md` | Document map → v0.6; Journey row honesty |
| Journey Experience Spec §4.1a | R7 shipped / RT7-G PASS |
| `Architecture/12-retrospective-report-dto.md` | Status as-built; comparison/agent honesty |
| `Architecture/04-domain-data-model.md` | mig 046–047 + Practice §3.5 |
| `Architecture/02-backend-design.md` | Retro/habit/journey routes + modules + env |
| `Architecture/03-frontend-design.md` | journal/retrospective/journey + Practice components |
| `Architecture/README.md` | v0.6 + board pointer |
| `Architecture/00-decision-log.md` | **DL-116** program close |
| `agents/p-retrospective/CHARTER.md` | As-built baseline + DoD checkboxes |

### Code truth checks (no production code change this seed)

| Claim | Evidence |
|-------|----------|
| Cadence H trial=42 | `journey_scores.py` `METER_PROFILE_OBSERVER_TRIAL.retro_horizon_days=42` |
| Free E1 empty | `retro_horizon_days=None` |
| Agent local only | `retrospective_agent.py` + RT5-G |
| Suite | 82 passed (retro + habit + agent + journey_scores) |

### Residuals (Spec v0.6 §6 — not shipped)

- Cost-of-deviation counterfactual  
- External agent LLM HTTP  
- Trial agent default on  
- Nudge N2/N3 rotation (N1 only shipped)  
- Journey milestone feed from retro complete  
- Alumni create TBD  

### India: **APPROVED**

- Locked v0.5 product decisions preserved; honesty lands in **v0.6** (new version, not silent rewrite of GO draft).  
- Conflicting v0.51 draft marked non-binding (weekly H=7 vs shipped 42).  
- Architecture docs describe code paths; no MSC boundary violation.  
- Residuals explicit — no false shipped claims.

### Coach: pending formal APPROVED (RT8-G / board)
