# Charter — p-journal-session

> **SUPERSEDED FOR PRODUCT AUTHORITY.** Program complete under Spec v0.2.  
> Successor: [`agents/p-journal-session-v04/CHARTER.md`](../p-journal-session-v04/CHARTER.md)  
> · Spec **v0.4a**.

**Mission:** Ship Journal **Session** capture — falsifiable entries via tag-selected  
structured form and (later) bounded agent interview — dual-layer transcript + confirmed  
structured record; market phase enforcement for Retrospective expected-vs-actual; date  
closure; private media; portability. Align with dual goals **G1 (Observer → Navigator)**  
and **G2 (Navigator CI)**.

**Board:** [`ORCHESTRATOR.md`](./ORCHESTRATOR.md)  
**Plan:** [`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md)  
**Seeds:** [`seeds/`](./seeds/)  
**Gates:** [`gate-reports/`](./gate-reports/)

**Parent Specs (load before any seed):**

| Doc | Role |
|-----|------|
| [`Specs/FatTail-Labs-Journal-Session-Spec-v0.2.md`](../../Specs/FatTail-Labs-Journal-Session-Spec-v0.2.md) | **Program design SoR** (DRAFT until J0 GO) |
| [`Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.6.md`](../../Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.6.md) | As-built retro; gather §6.5 consumers |
| [`Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.5.md`](../../Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.5.md) | Build-era product locks |
| [`Specs/FatTail-Labs-Journey-Experience-Spec-v1.0.md`](../../Specs/FatTail-Labs-Journey-Experience-Spec-v1.0.md) | §4.1a cadence; routine meter (D2) |
| [`Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md`](../../Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md) | Day-book context |
| [`Specs/FatTail-Labs-Member-Practice-Export-Spec-v1.1.md`](../../Specs/FatTail-Labs-Member-Practice-Export-Spec-v1.1.md) | Portability parent |
| [`docs/Dual-Goal-Product-Strategy-2026-07-29.md`](../../docs/Dual-Goal-Product-Strategy-2026-07-29.md) | G1/G2 · Observer 6-week term |

**Doctrine:** `agents/bench/doctrine.md` · `first-principles-doctrine.md` · capacity over  
dependency · process outcomes only · Family B isolation · no waived Delta gates.

---

## Product north stars

| Goal | Population | Journal Session role |
|------|------------|----------------------|
| **G1** | **Observer** (6-week term; **not free**) | **Same Practice features as Navigator** for the term (DL-128) |
| **G2** | **Navigator** | Same features; ongoing membership |
| Free no-plan | — | No session create |

**Falsifiable journal:** invalidation, levels, size — not unverifiable diary prose.

---

## As-built baseline (do not re-found)

- Calendar + Trade Log day-book (`JournalCalendar`, analytics day-book / days-interest)  
- Free-text `member_tool_notes` (`journal` / `pre_market`)  
- Retrospective gather dual-reads notes for expected-vs-actual / gaps  
- Practice export v1.1 exports notes only  

**v0.2 work is delta**, dual-read until cutover — not a greenfield rewrite of Trade Log.

---

## Goals (non-negotiable)

1. **Spec truth** — Session Spec v0.2; open gates D3–D5 cleared before their slices; no waived gates.  
2. **Two-layer record** — append-only transcript + member-confirmed structured fields.  
3. **Phase enforcement** — §6.5 expected-vs-actual only from `pre_open` member content.  
4. **J1–J2 before LLM** — structured form ships value without agent identity.  
5. **Validator fails to form** — never seal dead partial that destroys pre_market intent.  
6. **Observer = Navigator** access; term = 6 weeks only product difference.  
7. **Isolation** — single `identity_id`; Mike on auth/media.  
8. **Portability** — `fattail.labs.journal_session` additive; purge includes sessions.  
9. **Multi-agent completion** — reviewers + Delta evidence.

---

## Collaboration law

> No seed is done until required **reviewers APPROVED** and phase **Delta** has evidence.

| Rule | Practice |
|------|----------|
| No solo ship | Implementer + guardian(s) |
| Juliet sequences | Parallel only on non-overlapping files |
| Coach owns trade-offs | GO, D6 term/access (locked), agent enablement product-wide |
| Lima same day | DL + Spec/Arch honesty |

**Coordination** flows through **Coach** or **Juliet**. Direct agent-to-agent is prohibited.

---

## Out of scope (this program)

- Cost-of-deviation counterfactual  
- Vision model chart reading  
- Reopening sealed sessions  
- Admin reopen of closed journal dates  
- Member-facing capacity ratio  
- Free no-plan Practice create  
- Rewriting Trade Log blotter  

---

## Definition of Done (program)

- [x] J0: Spec GO + D3–D5 APPROVED — Coach GO 2026-07-30 · JS0-G PASS  
- [x] J1: Sessions/messages schema + API + dual-read notes — JS1-G PASS 2026-07-30
- [x] J2: Structured form (falsifiable fields) without LLM — JS2-G PASS 2026-07-30  
- [x] J3: Agent interview + validator + form fallback — JS3-G PASS 2026-07-30  
- [x] J4: Date closure on retro complete — JS4-G PASS 2026-07-30  
- [x] J5: Private media — JS5-G PASS 2026-07-30  
- [x] J6: Portability journal_session + purge/export — JS6-G PASS 2026-07-30  
- [x] J7: Retrospective tag routing — JS7-G PASS 2026-07-30  
- [x] J8: Demo fixtures / seed pack (optional) — JS8-G PASS 2026-07-30  
- [x] All phase Delta gates PASS with evidence  
- [x] Lima as-built + Spec honesty — JS9-1 / JS9-G  


---

**Process:** `agents/bench/doctrine.md` · `agents/README.md`
