# ORCHESTRATOR — Journal Session v0.7 (B-Agent charter)

**Juliet** owns this board. Specialists fire only from seeds.

**Plan:** [`docs/Journal-Session-v0.7-Full-Agent-Bench-Plan.md`](../../docs/Journal-Session-v0.7-Full-Agent-Bench-Plan.md) **v1.1**

## Status (2026-08-13)

| Gate | Verdict |
|------|---------|
| **J7-0** Lima DLs + spec BUILD | **DONE** — DL-325 · DL-326 |
| J7-1 Drafts | pending |
| J7-2 Heat gate | pending (blocks agent change) |
| J7-3 Guide + extract | pending |
| J7-4 Notify + presence | pending |
| **J7-G** Charter | pending |

**Not this board’s GO:** J7-5 voice · J7-6 star · J7-7 Portability v1.5.

## DAG

```
J7-0 ✓/NEXT ──┬──► J7-1 drafts
              └──► J7-2 heat ──► J7-3 guide+extract ──► J7-4 notify ──► J7-G
```

## Sequencing law

1. No agent behavior change until **J7-2** heat is in (fail-closed).  
2. v0.6 “member first / RTH quiet” tests are **rewritten** in J7-2/J7-3 — do not leave them as accidental FAIL.  
3. Lima lands [`docs/DL-Entry-Draft-B-Agent-Coach-Override-2026-08-13_1.md`](../../docs/DL-Entry-Draft-B-Agent-Coach-Override-2026-08-13_1.md) **verbatim** (heat SoR already request-time).  
4. **One surfacing ledger** (identity, date, kind) is shared by in-thread guide and notify (B-P1).  
5. Open rulings stay fenced. Placeholder name only.

## Parents

v0.6 board [`../p-journal-session-v06/`](../p-journal-session-v06/) is shipped substrate.
