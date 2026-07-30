# p-tag-manager — Orchestrator

**Juliet** maintains the board. **Coach** drives. Specialists execute only via seeds.

| Doc | Path |
|-----|------|
| Charter | [`CHARTER.md`](./CHARTER.md) |
| Plan | [`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md) |
| **Full plan** | [`docs/Tag-Manager-Implementation-Plan.md`](../../docs/Tag-Manager-Implementation-Plan.md) |
| Spec | [`Specs/FatTail-Labs-Tag-Manager-Spec-v0.2.md`](../../Specs/FatTail-Labs-Tag-Manager-Spec-v0.2.md) |
| Locks | [`docs/Tag-Manager-Spec-v0.2-Evaluation.md`](../../docs/Tag-Manager-Spec-v0.2-Evaluation.md) §0 |

**Downstream:** [`p-journal-session-v05`](../p-journal-session-v05/) — **blocked on this program** for J1+.

---

## Sequencing law

> **Implement Tag Manager first. Journal Session consumes it.**  
> Do not open Journal J1 implementation seeds until **TM7-G PASS**  
> (or Coach-written waiver after minimum TM3-G).

---

## Coach locks

| Lock | Decision |
|------|----------|
| CRUD | Admin only |
| Members | Assign existing tags only |
| `/me` tags | No |
| Auto-create | No |
| Resources hub | Library + Lexicon browse |
| Personal tier in Spec v0.2 | Out of scope v1 |

---

## Status board

**Program status:** **PROGRAM COMPLETE** — TM7-G PASS · DL-159 · Journal unblocked  

| Phase | Intent | Status |
|-------|--------|--------|
| **TM0** | Spec amend + GO + seed | **COMPLETE** (Coach locks + implement) |
| **TM1** | Schema | **COMPLETE** — 053 |
| **TM2** | Vocabulary APIs + seed | **COMPLETE** |
| **TM3** | Assign + TagPicker | **COMPLETE** |
| **TM4** | Admin UI `/admin/tags` | **COMPLETE** |
| **TM5** | Resources hub Lexicon | **COMPLETE** |
| **TM6** | Export/purge assignments | **COMPLETE** |
| **TM7** | Program gate → unlock Journal | **COMPLETE** — TM7-G PASS |

### Critical path

`TM0 → TM1 → TM2 → TM3 → TM7` then Journal Session v0.5 J1

---

## Gate checklist

| Gate | Agent | Status |
|------|-------|--------|
| TM0 Spec amend | India · Lima | pending |
| TM0-G | Delta | pending |
| TM0-0 | Coach GO | pending |
| TM1–TM6 | per plan | pending |
| **TM7-G** | Delta | pending — **Journal unblock** |

**No implementation until GO.**
