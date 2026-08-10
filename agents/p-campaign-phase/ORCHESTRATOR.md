# ORCHESTRATOR — p-campaign-phase

**Plan:** [`docs/Campaign-Phase-Charter-Tiering-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Campaign-Phase-Charter-Tiering-Full-Agent-Bench-Plan-v1.0.md)  
**Charter:** [`CHARTER.md`](./CHARTER.md)

## Status

| Phase | Status |
|-------|--------|
| **W0** | **PASS** (W0-G 2026-08-09) — Spec v1.0.1 RATIFIED · DL-276…278 |
| **S** | **next** — S1-0 schema / same_bet / domain |
| G · U · R · C · L · Z | pending |

## Sequence (critical path)

```
W0-G ✓
  └─► S* (schema + domain) ──► S1-G
        └─► G* (charter gates) ──► G1-G
              ├─► U* (tiered definition UI) ──► U1-G  ─┐
              └─► R* (phase report strip)   ──► R1-G  ─┤ parallel
                    └─► C* (Same-bet + CR-12 placement) ──► C1-G
                          └─► L* (log · prune · retro) ──► L1-G
                                └─► Z* (Kilo pack + as-built + deploy) ──► Z-G
```

## Gate protocol

1. Seeds complete with evidence in `gate-reports/`.  
2. Delta records **PASS / FAIL / BLOCKED** — never waive.  
3. No phase skip without Coach written BLOCKED disposition.  
4. **Never waive** G1 (umpire) or R1 (denominator / `structure_risk_open`).

## Residual ODs (W0 — locked defaults)

OD-SB · OD-alloc-modes · OD-free-cash-scope · OD-CR12-copy · OD-title — see `gate-reports/W0-0-coach-go.md`.

## Decision log

DL-276 · DL-277 · DL-278
