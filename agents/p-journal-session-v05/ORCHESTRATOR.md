# p-journal-session-v05 — Orchestrator

**Juliet** maintains the board. **Coach** drives. Specialists execute only via seeds.

| Doc | Path |
|-----|------|
| Charter | [`CHARTER.md`](./CHARTER.md) |
| Plan | [`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md) |
| Spec | [`Specs/FatTail-Labs-Journal-Session-Spec-v0.5.md`](../../Specs/FatTail-Labs-Journal-Session-Spec-v0.5.md) (**Tag Manager §5**) |
| **Full plan** | [`docs/Journal-Session-v0.5-Implementation-Plan.md`](../../docs/Journal-Session-v0.5-Implementation-Plan.md) |
| Tag Manager | [`../p-tag-manager/`](../p-tag-manager/) · Spec **v0.3** as-built · **COMPLETE** |

**Superseded boards (do not use for product):**  
`p-journal-session` (v0.2) · `p-journal-session-v04` (v0.4a)

---

## Sequencing law (Coach)

> **Tag Manager ships first.**  
> Do **not** open Journal **J1+ implementation** until `p-tag-manager` **TM7-G PASS**  
> (or Coach waiver after TM3-G minimum).  
> J0 Spec review for Journal may proceed in parallel with Tag Manager build.

## Status board

**Program status:** **J0 COMPLETE — GO** · Spec v0.5 **BUILD AUTHORITY** (DL-160) · **J1–J5 UI substrate landed** · continue J2–J9  
**Product frame:** chatbot = journal · interview on request · tags list window · one seal  

| Phase | Intent | Status |
|-------|--------|--------|
| **—** | Tag Manager program | **COMPLETE** |
| **J0** | Spec GO + locks | **COMPLETE** — JS0-G PASS · DL-160 |
| **J1** | Composer-first chat surface + schema | **LANDED (UI)** — empty composer first-send; dual Write path removed · formal J1-G pending |
| **J2** | Agent + code guardrails | **PARTIAL** — member-first UI; TM labels in LLM context · guardrail corpus pending |
| **J3** | Admin prompt versions | pending |
| **J4** | Compact tags + list window | **LANDED** — `JournalTagsControl` list window · closed refuses assign (409) |
| **J5** | Interview collapse bar | **LANDED (UI)** — bar default collapsed · formal gate pending |
| **J6** | Private media paste | pending |
| **J7** | Retro action + warnings | pending (dedicated control present) |
| **J8** | Scope-true closure | pending (substrate exists) |
| **J9** | Portability + program close | pending |

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
