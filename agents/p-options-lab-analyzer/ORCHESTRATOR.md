# ORCHESTRATOR — Options Lab Analyzer Residual

**Juliet** owns this board. Specialists fire only from seeds. No peer-to-peer tasking.

**Plan:** [`docs/Options-Lab-Analyzer-Residual-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Options-Lab-Analyzer-Residual-Full-Agent-Bench-Plan-v1.0.md) (v1.0.1)

**Top residual packet (not Keep-Warm):** **L** — layout vertical stack (OD-AZ1/2: top strip · viewport · divider · positions under · alerts under). Keep-Warm is its own spec (**v0.1.1 BUILD AUTHORITY** · DL-418) and is **not** folded into L.

## DAG

```text
W0 ──► L ──► A ──► R ──► K ──► Z
 │      │
 │      └──► (U needs L hard)
 │
 ├──► B ──────────────────────────┐
 ├──► T ──────────────────────────┤
 ├──► D (after PB v0.3 in W0) ────┼──► K
 ├──► S (+ posture fixtures) ─────┤
 └──► V ──────────────────────────┘
           S+L ──► U ─────────────┘
```

## Phase order (do not skip gates)

| Phase | Fire when | Gate |
|-------|-----------|------|
| W0 | Coach ready · path/hash + PB v0.3 landed | W0-G then W0-0 GO |
| L | W0-0 GO | L-G |
| B | W0-0 GO | B-G |
| T | **W0-0 GO only** (P-A1 — not blocked on L) | T-G |
| A | L-G | A-G |
| D | W0-0 GO + **PB Spec v0.3** | D-G |
| S | W0-0 GO | S-G |
| V | W0-0 GO | V-G |
| U | **S-G + L-G hard** (P-A4) | U-G |
| R | L-G | R-G |
| K | all prior G | K-G |
| Z | K-G | Z-G |

**Parallel after W0:** **B · T · D · S · V**. **L** unblocks **A · R · U**.

## Seed protocol

1. Copy seed → agent with Spec + plan paths.  
2. Agent reports PASS/FAIL/BLOCKED with evidence.  
3. Delta phase gate before next dependent phase.  
4. Lima DL on material law or as-built change.

## Coordination

- Primary law paths: Analyzer **v0_2.md** · PB **v0_3.md** · OPF **v0_2.md**.  
- OPF denser samples for Surface: Alpha + India before Charlie mesh land; **OPF Spec delta + DL if new sample API** (P-B3).  
- Heatmap GEX: do not promote to suite (OD-AZ7).  
- PB program closed — implement residual B5 against **PB v0.3**; do not re-open OD-PB without Coach.
