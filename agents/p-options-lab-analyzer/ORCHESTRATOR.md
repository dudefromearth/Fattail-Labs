# ORCHESTRATOR — Options Lab Analyzer Residual

**Juliet** owns this board. Specialists fire only from seeds. No peer-to-peer tasking.

## DAG

```text
W0 → L → B → T → A → D → S → V → U → R → K → Z
```

Parallel after W0: **B · D · S · V** (with care). **L** unblocks **T · A · R**. **U** after **S** (+ **L** preferred).

## Phase order (do not skip gates)

| Phase | Fire when | Gate |
|-------|-----------|------|
| W0 | Coach ready | W0-G then W0-0 GO |
| L | W0-0 GO | L-G |
| B | W0-0 GO | B-G |
| T | L-G | T-G |
| A | L-G | A-G |
| D | W0-0 GO | D-G |
| S | W0-0 GO | S-G |
| V | W0-0 GO | V-G |
| U | S-G (+ L-G preferred) | U-G |
| R | L-G | R-G |
| K | all prior G | K-G |
| Z | K-G | Z-G |

## Seed protocol

1. Copy seed → agent with Spec + plan paths.  
2. Agent reports PASS/FAIL/BLOCKED with evidence.  
3. Delta phase gate before next dependent phase.  
4. Lima DL on material law or as-built change.

## Coordination

- OPF denser samples for Surface: Alpha + India before Charlie mesh land.  
- Heatmap GEX: do not promote to suite (OD-AZ7).  
- PB program closed — do not re-open OD-PB without Coach.
