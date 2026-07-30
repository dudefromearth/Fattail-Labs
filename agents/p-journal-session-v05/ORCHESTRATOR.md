# p-journal-session-v05 — Orchestrator

**Juliet** maintains the board. **Coach** drives. Specialists execute only via seeds.

| Doc | Path |
|-----|------|
| Charter | [`CHARTER.md`](./CHARTER.md) |
| Plan | [`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md) |
| Spec | [`Specs/FatTail-Labs-Journal-Session-Spec-v0.5.md`](../../Specs/FatTail-Labs-Journal-Session-Spec-v0.5.md) |
| Tag Manager | [`../p-tag-manager/ORCHESTRATOR.md`](../p-tag-manager/ORCHESTRATOR.md) · Spec **v0.2** |
| Tag eval | [`docs/Tag-Manager-Spec-v0.2-Evaluation.md`](../../docs/Tag-Manager-Spec-v0.2-Evaluation.md) |
| Joint plan | [`docs/Journal-Session-v0.5-and-Tag-Manager-v0.1-Evaluation-and-Plan.md`](../../docs/Journal-Session-v0.5-and-Tag-Manager-v0.1-Evaluation-and-Plan.md) (tags section superseded by v0.2 eval) |

**Superseded boards (do not use for product):**  
`p-journal-session` (v0.2) · `p-journal-session-v04` (v0.4a)

---

## Sequencing law (Coach)

> **Tag Manager ships first.**  
> Do **not** open Journal **J1+ implementation** until `p-tag-manager` **TM7-G PASS**  
> (or Coach waiver after TM3-G minimum).  
> J0 Spec review for Journal may proceed in parallel with Tag Manager build.

## Status board

**Program status:** **Tag Manager READY** (TM7-G PASS) · Spec v0.5 DRAFT · **J0 NEXT**  
**Product frame:** chatbot = journal · interview on request · system tags via Tag Manager · one seal  

| Phase | Intent | Status |
|-------|--------|--------|
| **—** | Tag Manager program | **COMPLETE** — unblocks J1 |
| **J0** | Spec GO + keep/kill + open decisions | **NEXT** |
| **J1** | Composer-first chat surface + schema | pending (unblocked) |
| **J2** | Agent + code guardrails | blocked on J1 |
| **J3** | Admin prompt versions | blocked on J2 |
| **J4** | Tag chips (TagPicker + assign API) | blocked on TM3+ |
| **J5** | Interview collapse bar | blocked on J2 |
| **J6** | Private media paste | blocked on J1 |
| **J7** | Retro routing + warnings | blocked on J1 |
| **J8** | Scope-true closure | blocked on J7 |
| **J9** | Portability + program close | blocked on J1 |

### Critical path

`Tag Manager TM7 → J0 GO → J1 → J2 → J8`

### Review gate checklist

| Gate | Agent | Status |
|------|-------|--------|
| JS5-R1 | India | pending |
| JS5-R2 | Mike | pending |
| JS5-R3 | Hotel | pending |
| JS5-R4 | Tango | pending |
| JS5-R5 | Echo | pending |
| JS5-R6 | Sierra | pending |
| X-R1 | India · Juliet (Tag Manager contract) | pending |
| JS5-R7 | Delta | pending |
| JS5-R0 | Coach GO | pending |

**No implementation until JS5-R0 GO.** Prefer TM-R0 same day or earlier.
