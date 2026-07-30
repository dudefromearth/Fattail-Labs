# Charter — p-journal-session-v04

**Mission:** Correct the Journal Session **product frame** on top of the shipped v0.2  
substrate: **chat is the record**; structured pass is optional; **phase** (not tag) is the  
gate; **one seal** = retrospective complete (scope-true). Align with dual goals **G1  
(Observer → Navigator)** and **G2 (Navigator CI)** without a second progress surface.

**Board:** [`ORCHESTRATOR.md`](./ORCHESTRATOR.md)  
**Plan:** [`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md)  
**Seeds:** [`seeds/`](./seeds/)  
**Gates:** [`gate-reports/`](./gate-reports/)

**Parent Specs (load before any seed):**

| Doc | Role |
|-----|------|
| [`Specs/FatTail-Labs-Journal-Session-Spec-v0.4a.md`](../../Specs/FatTail-Labs-Journal-Session-Spec-v0.4a.md) | **Program design SoR** (DRAFT until J0 GO) |
| [`Specs/FatTail-Labs-Journal-Session-Spec-v0.2.md`](../../Specs/FatTail-Labs-Journal-Session-Spec-v0.2.md) | Historical as-built of first program — **superseded for product** |
| [`Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.6.md`](../../Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.6.md) | As-built retro; report honesty |
| [`Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.5.md`](../../Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.5.md) | Gather Option C, `scope_end`, complete hook |
| [`Specs/FatTail-Labs-Journey-Experience-Spec-v1.0.md`](../../Specs/FatTail-Labs-Journey-Experience-Spec-v1.0.md) | §4.1a cadence; §4.4 profiles; routine meter (amend §6.5) |
| [`Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md`](../../Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md) | Day-book context for agent |
| [`Specs/FatTail-Labs-Member-Practice-Export-Spec-v1.1.md`](../../Specs/FatTail-Labs-Member-Practice-Export-Spec-v1.1.md) | Portability parent (version bump required) |
| [`docs/Dual-Goal-Product-Strategy-2026-07-29.md`](../../docs/Dual-Goal-Product-Strategy-2026-07-29.md) | G1/G2 · Observer 6-week term |
| [`docs/Journal-Session-Spec-v0.4-Recommended-Changes.md`](../../docs/Journal-Session-Spec-v0.4-Recommended-Changes.md) | Pre-v0.4a review (largely absorbed) |

**Doctrine:** `agents/bench/doctrine.md` · `first-principles-doctrine.md` · capacity over  
dependency · process outcomes only · Family B isolation · no waived Delta gates.

**Supersession:** `agents/p-journal-session/` is **PROGRAM COMPLETE under Spec v0.2**. That  
board is **not reopened**. This board owns v0.4a product authority after Coach GO.

---

## Product north stars

| Goal | Population | Journal Session role |
|------|------------|----------------------|
| **G1** | **Observer** (6-week paid trial; **not free**) | Same Journal features as Navigator for the term |
| **G2** | **Navigator** / Activator | Same features; ongoing membership |
| Planless / lapsed | Identity & Access (§20 item 10) | Not a Journal-tier check — resolve at J0 |

**Primacy:** Agent chat always available. Plain text always available. Structured pass  
member-invoked only. Transcript-only entry is complete.

**Falsifiable journal:** interlocutor presses for levels / size / invalidation — not a  
questionnaire; unreached fields stay absent.

---

## As-built baseline (do not re-found)

Substrate from v0.2 program on `main` (Spec §3):

- Sessions, messages, attribution, phase derivation (hard-coded RTH interim)  
- Local checklist agent + form-primary UI (to be **rewritten**, not patched cosmetically)  
- Private media ACL, export hooks, date closures on retro complete  
- Dual-read `member_tool_notes`  

**Keep vs rewrite:** Spec §3.2. Reuse infrastructure; rewrite product shape.

---

## Goals (non-negotiable)

1. **Spec truth** — Session Spec **v0.4a**; no BUILD until J0 GO + named locks; no waived gates.  
2. **Chat primary** — never conditional on tag, form, agent mode, or depth.  
3. **Two-layer record** — append-only transcript + optional member-confirmed structured.  
4. **Phase is the gate** — §6.5 expected-vs-actual from `pre_open` member content only.  
5. **One seal** — retrospective complete, **scope-true** (§12.1); no member seal product.  
6. **Agent contract first (J2a)** — mode enum, validator, plain-text degrade, RTH no-unprompted,  
   once-only code-enforced; **J2b** LLM after contract is testable.  
7. **Observer = Navigator** Journal access among paid plans; no Journal-specific tier.  
8. **Isolation** — single `identity_id`; Mike on auth/media/agent interim.  
9. **Portability** — export/import/purge; never rewrite closed transcript.  
10. **Multi-agent completion** — reviewers + Delta evidence.

---

## Collaboration law

> No seed is done until required **reviewers APPROVED** and phase **Delta** has evidence.

| Rule | Practice |
|------|----------|
| No solo ship | Implementer + guardian(s) |
| Juliet sequences | Parallel only on non-overlapping files |
| Coach owns trade-offs | GO, §20 locks, agent runtime default |
| Lima same day | DL + Spec/Arch honesty |

**Coordination** flows through **Coach** or **Juliet**. Direct agent-to-agent is prohibited.

---

## Definition of Done (program)

- Spec v0.4a **BUILD AUTHORITY** (or successor after GO edits)  
- J0–J9 phase gates **PASS** with evidence in `gate-reports/`  
- Member can journal by chat without tags or structured fields  
- Agent (llm) available under fail-loud config; off/local do not kill text capture  
- Scope-true closure + complete warning with named dates + open-session count  
- Characterization suite green; decision log + as-built honesty  
- v0.2 board remains archived complete; this board closed at J9-G  
