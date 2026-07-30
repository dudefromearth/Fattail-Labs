# Seed RT0-1 — India: Spec fold to v0.5 + Journey meter §

**Project:** p-retrospective  
**Primary:** India  
**Reviewers (required):** Coach (ack)  
**Phase:** W0  
**Prerequisite:** none  

## Goal

Produce **authoritative build Specs** for the board:

1. `Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.5.md` — fold v0.4 +  
   `Specs/Retrospective-Cadence-Meter-Delta-for-v0.5.md` (incl. closed E.2).  
2. Journey Experience Spec patch (or v1.1 section) for **§4.1a retrospective cadence meter**  
   + `retro_horizon_days` on profiles.  
3. As-built honesty table: R1–R3 shipped (v0.2 shape); R1b–R7 remaining.  

## Files in scope

- `Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.5.md` (create)  
- `Specs/FatTail-Labs-Journey-Experience-Spec-v1.0.md` (or versioned addendum)  
- Pointers from v0.4 / cadence delta headers  
- Optionally `Architecture/00-decision-log.md` stub only if Coach requests  

## Out of scope

- Implementation code  
- Changing Activator marketing  

## Invariants

1. Create entitlement: **observer-trial OR activator+ OR admin**; free no-plan no.  
2. Activator = legacy, not funnel.  
3. Option C: gap between scope_end and completed_at unreviewed.  
4. Cadence uses `completed_at` only; E1–E3 empty rules.  
5. Process-first workspace order; book collapsed.  

## Collaboration

1. India drafts v0.5 + Journey meter §.  
2. Coach acks structure (full GO after RT0-G).  

## Completion criteria

- [x] v0.5 Spec exists and is internally consistent  
- [x] Journey meter §4.1a + profile column specified  
- [x] As-built vs target clearly separated  
- [x] Coach ack on structure — **GO 2026-07-29** (after RT0-G PASS)  

## Evidence (2026-07-29 — India RT0-1)

| Deliverable | Path |
|-------------|------|
| Retrospective Spec v0.5 | `Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.5.md` |
| Journey §4.1a cadence meter + `retro_horizon_days` on §4.4 | `Specs/FatTail-Labs-Journey-Experience-Spec-v1.0.md` |
| v0.4 pointer | SUPERSEDED → v0.5 |
| Cadence delta pointer | FOLDED → v0.5 + Journey §4.1a |
| Entitlement | observer-trial OR activator+ OR admin; free no-plan no; Activator legacy |
| Option C + cadence | §4.1 Option C; §7.5 nudge/meter; Journey §4.1a formula E1–E3 |

**Consistency checks:** Option C · completed_at-only clock · process-first order · MIN_INFERENCE_N=20 default · habit cap 2 · R1–R3 as-built honesty · R7 cadence defined not shipped.

## Feeds

→ RT0-2, RT0-3, RT0-4, RT0-5, RT0-G  
