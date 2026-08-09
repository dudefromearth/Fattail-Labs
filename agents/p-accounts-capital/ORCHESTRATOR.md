# ORCHESTRATOR — p-accounts-capital

**Plan:** [`docs/Accounts-Capital-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Accounts-Capital-Full-Agent-Bench-Plan-v1.0.md)  
**Charter:** [`CHARTER.md`](./CHARTER.md)

## Status

| Phase | Status |
|-------|--------|
| **W0** | **PASS** (W0-G 2026-08-09) |
| L / A / F | pending — next |
| C · S · T · X · Z | pending |

## Sequence (critical path)

```
W0-G
  ├─► L* (ledger abolish + undirected) ──► L-G
  ├─► A* (Accounts & Capital + move CRUD) ──► A-G
  └─► F* (movements + curves + master DD $) ──► F-G
        │
        └─► C* (composition) ──► C-G ──► S* (staleness) ──► S-G
              │
              ├─► T* after L-G (Trade Log / Campaign fold)
              ├─► X* after F-G+L-G (pack)
              └─► Z* (solved size if Hotel ready) ──► Z-G
```

## Gate protocol

1. Seeds complete with evidence in `gate-reports/`.  
2. Delta records **PASS / FAIL / BLOCKED** — never waive.  
3. No phase skip without Coach written BLOCKED disposition.

## Residual ODs (W0)

See plan §3.1: OD-T · OD-5 · OD-F5 · OD-lat · OD-size · Hotel §3.4 sign.
